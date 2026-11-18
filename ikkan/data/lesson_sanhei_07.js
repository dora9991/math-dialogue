/* 三平方の定理（新しい形） 第7時：円の弦や接線の長さを求めよう。（型：探）
   元：授業ナビ標準版 sanhei-07（探）。「円の弦 AB の長さ。どこに直角三角形をつくるか」（課題）を「今日の問い」に、接線の長さ（問題1）を「例題」に、
   「2つの円に接する直線の、接点の間の長さ」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（半径と、中心から弦までのきょりがわかっている円。弦の長さを求めるために、図に線をかき入れる）。個人3分 → ペア3分 → ことば → 例題（接線。表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（図1・図2は、ことばの下に並べて印刷）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、座標（円と弦・接線の交点を、式から別に求めて Math.hypot で測る）・三角関数から出しなおした。
   検算：node tools/verify.cjs sanhei-07　／　見た目：node tools/check.cjs <出力先> sanhei-07 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828', INK = '#222', R = Math.PI / 180;

  /* ---- 円の図：円・弧・点・線分・直角のしるし。解答のときだけ出す赤いもの（a）も、同じ書き方 ----
     DRAW({ pts: { A: [x, y] }, circ: [{ c: 中心, r }], arc: [{ c, r, a0, a1 }]（度。反時計まわりに a0 → a1）, seg: [[点, 点, { w, dash }]], dot: [点…], rt: [[頂点, 点, 点]], lab: [[点, 字, 向き（度。0＝右）, 距離（mm）]], a: { … }, cap: '図1' })
     座標は数学の向き（y が上）。点は名前でも [x, y] でもよい。縮尺は、枠におさまるように決まる。 */
  const DRAW = o => SVG((W, H, h) => {
    const P = o.pts || {}, pt = k => (Array.isArray(k) ? k : P[k]), f = h.f2;
    const arcPts = c => { const q = pt(c.c); return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => { const t = (c.a0 + (c.a1 - c.a0) * i / 8) * R; return [q[0] + c.r * Math.cos(t), q[1] + c.r * Math.sin(t)]; }); };
    const all = Object.values(P).slice();
    [o, o.a || {}].forEach(g => {
      (g.circ || []).forEach(c => { const q = pt(c.c); all.push([q[0] - c.r, q[1] - c.r], [q[0] + c.r, q[1] + c.r]); });
      (g.arc || []).forEach(c => all.push(...arcPts(c)));
    });
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = o.pad || 6;
    const s = Math.min((W - 2 * pad) / Math.max(x1 - x0, 1e-6), (H - 2 * pad) / Math.max(y1 - y0, 1e-6));
    const ox = W / 2 - (x0 + x1) / 2 * s, oy = H / 2 + (y0 + y1) / 2 * s;
    const X = p => ox + p[0] * s, Y = p => oy - p[1] * s;
    const dir = (p, q) => { const dx = X(q) - X(p), dy = Y(q) - Y(p), L = Math.hypot(dx, dy) || 1; return [dx / L, dy / L]; };
    const draw = (g, c) => {
      let t = '';
      (g.circ || []).forEach(k => { const q = pt(k.c); t += `<circle cx="${f(X(q))}" cy="${f(Y(q))}" r="${f(k.r * s)}" fill="none" stroke="${c}" stroke-width="0.4"/>`; });
      (g.arc || []).forEach(a => {
        const q = pt(a.c), rr = a.r * s, t0 = a.a0 * R, t1 = a.a1 * R;
        t += `<path d="M${f(X(q) + rr * Math.cos(t0))} ${f(Y(q) - rr * Math.sin(t0))}A${f(rr)} ${f(rr)} 0 ${Math.abs(a.a1 - a.a0) > 180 ? 1 : 0} ${a.a1 > a.a0 ? 0 : 1} ${f(X(q) + rr * Math.cos(t1))} ${f(Y(q) - rr * Math.sin(t1))}" fill="none" stroke="${c}" stroke-width="0.4" stroke-linecap="round"/>`;
      });
      (g.seg || []).forEach(sg => { const op = sg[2] || {}, p = pt(sg[0]), q = pt(sg[1]); t += h.ln(X(p), Y(p), X(q), Y(q), c, op.w || 0.4, (op.dash ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"'); });
      (g.rt || []).forEach(([v, a, b]) => {
        const V = pt(v), u = dir(V, pt(a)), w = dir(V, pt(b)), m = 2.4, vx = X(V), vy = Y(V);
        t += `<polyline points="${f(vx + u[0] * m)},${f(vy + u[1] * m)} ${f(vx + (u[0] + w[0]) * m)},${f(vy + (u[1] + w[1]) * m)} ${f(vx + w[0] * m)},${f(vy + w[1] * m)}" fill="none" stroke="${c}" stroke-width="0.28"/>`;
      });
      (g.dot || []).forEach(n => { const p = pt(n); t += `<circle cx="${f(X(p))}" cy="${f(Y(p))}" r="0.75" fill="${c}"/>`; });
      (g.lab || []).forEach(([n, str, d, k]) => { const p = pt(n), kk = k || 3.6; t += h.rich(X(p) + kk * Math.cos(d * R), Y(p) - kk * Math.sin(d * R) + 1.1, str, 3.1, 'middle'); });
      return t;
    };
    let out = o.cap ? h.tx(2.5, 3.6, h.svgMath(o.cap), 3, 'start', ' class="cap"') : '';
    out += draw(o, INK);
    if (o.a) out += h.ans(draw(o.a, RED));
    return out;
  });

  const S = Math.sqrt;
  // 今日の問い：半径 8cm の円 O、中心から 3cm の弦 AB（A(−√55, −3)、B(√55, −3)）。解答＝垂線 OH と半径 OA（赤）
  const figToday = DRAW({
    pts: { O: [0, 0], A: [-S(55), -3], B: [S(55), -3] }, circ: [{ c: 'O', r: 8 }], seg: [['A', 'B']], dot: ['O', 'A', 'B'],
    lab: [['O', 'O', 90, 3.4], ['A', 'A', 200, 3.6], ['B', 'B', -20, 3.6]],
    a: { seg: [['O', [0, -3]], ['O', 'A']], dot: [[0, -3]], rt: [[[0, -3], 'O', 'B']], lab: [[[0, -3], 'H', 270, 3.6], [[0, -1.5], '3cm', 0, 4.6], [[-S(55) / 2, -1.5], '8cm', 112, 4.4]] }
  });

  // 例題：半径 5cm の円 O、OA＝9cm の点 A、接点 P（P(25/9, 5√56/9)）。解答＝直角のしるし
  const Pe = [25 / 9, 5 * S(56) / 9];
  const figEx = DRAW({
    pts: { O: [0, 0], A: [9, 0], P: Pe }, circ: [{ c: 'O', r: 5 }], seg: [['O', 'P'], ['O', 'A'], ['A', 'P', { w: 0.55 }]], dot: ['O', 'A', 'P'],
    lab: [['O', 'O', 200, 3.6], ['A', 'A', 0, 3.6], ['P', 'P', 56, 3.6], [[Pe[0] / 2, Pe[1] / 2], '5cm', 146, 4.4], [[7, 0], '9cm', 270, 4.4]],
    a: { rt: [['P', 'O', 'A']] }
  });

  // 図1：半径（OA）7cm、中心からのきょり（OH）4cm。AB は弦（A(−√33, −4)、B(√33, −4)）
  const figChord = DRAW({
    cap: '図1', pts: { O: [0, 0], A: [-S(33), -4], B: [S(33), -4], H: [0, -4] }, circ: [{ c: 'O', r: 7 }], seg: [['A', 'B'], ['O', 'H'], ['O', 'A']], dot: ['O', 'A', 'B', 'H'], rt: [['H', 'O', 'B']],
    lab: [['O', 'O', 90, 3.4], ['A', 'A', 200, 3.6], ['B', 'B', -20, 3.6], ['H', 'H', 270, 3.6], [[0, -2], '4cm', 0, 4.4], [[-S(33) / 2, -2], '7cm', 112, 4.4]]
  });
  // 図2：半径（OP）3cm、OA＝7cm。AP は接線（接点 P）
  const Pt2 = [9 / 7, 3 * S(40) / 7];
  const figTan = DRAW({
    cap: '図2', pts: { O: [0, 0], A: [7, 0], P: Pt2 }, circ: [{ c: 'O', r: 3 }], seg: [['O', 'P'], ['O', 'A'], ['A', 'P', { w: 0.55 }]], dot: ['O', 'A', 'P'],
    lab: [['O', 'O', 200, 3.6], ['A', 'A', 0, 3.6], ['P', 'P', 60, 3.6], [[Pt2[0] / 2, Pt2[1] / 2], '3cm', 150, 4.2], [[5.2, 0], '7cm', 270, 4.4]]
  });

  // （7）2つの円：円 O（半径 5cm）、円 O′（半径 2cm）、OO′＝10cm。共通の接線の接点 A、B（cosφ＝(5−2)/10＝0.3）
  const phi = Math.acos(0.3), Ac = [5 * Math.cos(phi), 5 * Math.sin(phi)], Bc = [10 + 2 * Math.cos(phi), 2 * Math.sin(phi)];
  const figTwo = DRAW({
    pts: { O: [0, 0], Q: [10, 0], A: Ac, B: Bc }, circ: [{ c: 'O', r: 5 }, { c: 'Q', r: 2 }],
    seg: [['A', 'B', { w: 0.55 }], ['O', 'A'], ['Q', 'B'], ['O', 'Q', { dash: 1 }]], dot: ['O', 'Q', 'A', 'B'],
    lab: [['O', 'O', 225, 3.6], ['Q', 'O′', 270, 3.8], ['A', 'A', 100, 3.6], ['B', 'B', 60, 3.6], [[Ac[0] / 2, Ac[1] / 2], '5cm', 160, 4.2], [[(10 + Bc[0]) / 2, Bc[1] / 2], '2cm', 190, 5.6], [[6.5, 0], '10cm', 270, 4.4]]
  });

  // （8）円の一部：弦 AB＝16cm、AB の中点 M から弧までのきょり MN＝4cm（円の中心 (0, −6)、半径 10cm）
  const a0 = Math.atan2(6, 8) / R;
  const figSeg = DRAW({
    pts: { A: [-8, 0], B: [8, 0], M: [0, 0], N: [0, 4] }, arc: [{ c: [0, -6], r: 10, a0, a1: 180 - a0 }],
    seg: [['A', 'B'], ['M', 'N', { dash: 1 }]], dot: ['A', 'B', 'M', 'N'], rt: [['M', 'N', 'B']],
    lab: [['A', 'A', 200, 3.6], ['B', 'B', -20, 3.6], ['M', 'M', 270, 3.6], ['N', 'N', 90, 3.4], [[0, 2], '4cm', 0, 4.4]]
  });

  // 検算の道具：円 x^2+y^2＝r^2 の外の点 A（x 軸上）からの接点（OP⊥AP）
  const LIB = 'const d = (P, Q) => Math.hypot(Q[0] - P[0], Q[1] - P[1]), dot = (P, Q, S) => (Q[0] - P[0]) * (S[0] - P[0]) + (Q[1] - P[1]) * (S[1] - P[1]), tang = (r, OA) => { const c = r / OA; return [r * c, r * Math.sqrt(1 - c * c)]; };';

  IK.lesson('sanhei-07', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第7時', title: '円の弦や接線の長さを求めよう',
    summary: '半径と、中心から弦までのきょりがわかっている円で、弦の長さを求めるために、中心から垂線をひき、半径をひいて直角三角形をつくる。接線の長さも、接点を通る半径をひいて、直角三角形で求める。',
    head: '三平方の定理　第7時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：半径 8・中心から 3 の弦。弦の端 (±x, −3) は 円 x^2+y^2＝64 の上にある。弦 AB＝2√55（三角関数の別式：2·8·sin(acos(3/8))）、OH＝3、AH^2＝55
      `(() => { ${LIB} const A = [-Math.sqrt(55), -3], B = [Math.sqrt(55), -3], O = [0, 0], H = [0, -3]; return near(d(O, A), 8) && near(d(O, B), 8) && near(dot(H, O, B), 0) && near(d(A, B), 2 * Math.sqrt(55)) && near(2 * 8 * Math.sin(Math.acos(3 / 8)), 2 * Math.sqrt(55)) && near(d(A, H) ** 2, 55); })()`,
      // 例題：半径 5・OA＝9 の接線。接点 P(25/9, 5√56/9)：OP＝5、OP⊥AP（内積 0）、AP^2＝56、AP＝2√14
      `(() => { ${LIB} const O = [0, 0], A = [9, 0], P = tang(5, 9); return near(d(O, P), 5) && near(dot(P, O, A), 0) && near(d(A, P), 2 * Math.sqrt(14)) && near(d(A, P) ** 2, 56) && near(81 - 25, 56); })()`,
      // （1）図1：半径 7・中心から 4 の弦。AB＝2√33（2·7·sin(acos(4/7)) とも一致）、AH^2＝33
      `(() => { ${LIB} const A = [-Math.sqrt(33), -4], B = [Math.sqrt(33), -4]; return near(d([0, 0], A), 7) && near(d(A, B), 2 * Math.sqrt(33)) && near(2 * 7 * Math.sin(Math.acos(4 / 7)), 2 * Math.sqrt(33)) && near(49 - 16, 33); })()`,
      // （2）図2：半径 3・OA＝7 の接線。AP＝2√10（AP^2＝40）
      `(() => { ${LIB} const O = [0, 0], A = [7, 0], P = tang(3, 7); return near(dot(P, O, A), 0) && near(d(A, P), 2 * Math.sqrt(10)) && near(d(A, P) ** 2, 40); })()`,
      // （3）長さ 10 の弦で、中心からのきょりが 3：弦の端 (±5, −3) から中心 O までが半径＝√34
      'near(Math.hypot(5, 3), Math.sqrt(34)) && near(25 + 9, 34)',
      // （4）半径 4・接線の長さ 5：P(0, 4)・A(5, 4)（OP⊥PA）。OA＝√41
      `(() => { ${LIB} const O = [0, 0], P = [0, 4], A = [5, 4]; return near(dot(P, O, A), 0) && near(d(P, A), 5) && near(d(O, A), Math.sqrt(41)); })()`,
      // （5）半径 10・中心から 5 の弦：A(−5√3, −5)・B(5√3, −5)。AB＝10√3、∠AOB＝120°
      `(() => { ${LIB} const O = [0, 0], A = [-5 * Math.sqrt(3), -5], B = [5 * Math.sqrt(3), -5]; return near(d(O, A), 10) && near(d(A, B), 10 * Math.sqrt(3)) && near(Math.acos(dot(O, A, B) / (d(O, A) * d(O, B))) * 180 / PI, 120); })()`,
      // （6）半径 6・A から円までのいちばん短いきょり 3 → OA＝9。接点 P(4, 2√5)：OP⊥AP、AP＝3√5
      `(() => { ${LIB} const O = [0, 0], A = [9, 0], P = tang(6, 9); return near(P[0], 4) && near(P[1], 2 * Math.sqrt(5)) && near(dot(P, O, A), 0) && near(d(A, P), 3 * Math.sqrt(5)); })()`,
      // （7）考えよう（答えは紙面に載せない）：円 O（半径 5）・円 O′（半径 2）・OO′＝10。共通の接線の接点（cosφ＝0.3）の間の長さ AB＝√91。2つの円の半径が等しい（5 と 5）ときは AB＝OO′＝10
      `(() => { ${LIB} const ab = (R, r, D) => { const c = (R - r) / D, s = Math.sqrt(1 - c * c), A = [R * c, R * s], B = [D + r * c, r * s]; return [d(A, B), dot(A, [0, 0], B), dot(B, [D, 0], A)]; }; const x = ab(5, 2, 10), y = ab(5, 5, 10); return near(x[0], Math.sqrt(91)) && near(x[1], 0) && near(x[2], 0) && near(y[0], 10) && near(y[1], 0); })()`,
      // （8）弦 AB＝16、MN＝4：円の中心 (0, −6)・半径 10（OA＝hypot(8, 6)＝10、ON＝10）で、半径は 10
      'near(Math.hypot(8, 6), 10) && near(4 - (-6), 10) && near((10 - 4) ** 2 + 8 ** 2, 10 ** 2)',
      // 小テスト（1）半径 7・中心から 3 の弦：4√10（2·7·sin(acos(3/7))）　（2）半径 4・OA＝9：AP＝√65
      `(() => { ${LIB} const P = tang(4, 9); return near(2 * 7 * Math.sin(Math.acos(3 / 7)), 4 * Math.sqrt(10)) && near(2 * Math.sqrt(49 - 9), 4 * Math.sqrt(10)) && near(dot(P, [0, 0], [9, 0]), 0) && near(d([9, 0], P), Math.sqrt(65)); })()`,
      // 小テスト（3）半径 8・弦 10：中心から弦までのきょり √39（弦の端 (±5, −√39) が円の上）　（4）半径 5・AP＝12：P(0, 5)・A(12, 5)、OA＝13
      'near(Math.hypot(5, Math.sqrt(39)), 8) && near(Math.hypot(12, 5), 13) && near(Math.hypot(12, 5 - 5), 12)',
      // 小テスト（5）チャレンジ：弦 AB＝6、MN＝1：円の中心 (0, −4)・半径 5（OA＝hypot(3, 4)＝5、ON＝1+4＝5）
      'near(Math.hypot(3, 4), 5) && near(1 - (-4), 5)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円の弦や接線の長さを、三平方の定理で求めよう'),
      K('今日の問い', '半径 8cm の円 O に、弦 AB をひいた。中心 O から弦 AB までのきょりは 3cm である。弦 AB の長さを求めたい。この図には、直角三角形がない。どこに、どんな線をひけばよいか、図にかき入れて、考えよう。', 3),
      F(6, figToday),
      T('①', '自分の考え（3分）　線をかき入れて、求め方を書こう。', 1),
      B(4, '（例）O から AB に垂線 OH をひき、半径 OA をひく。△OAH は直角三角形。\nAH^2＝8^2−3^2＝55　　AH＝√{55}cm\nH は AB の中点だから　AB＝2AH＝2√{55}cm'),
      T('②', 'ペアの考え（3分）　自分とちがう考え・気づきを書こう。', 1),
      B(3, ''),
      G(1),
      WD('弦に、円の中心から垂線をひくと、\n弦は{{2等分}}される。\n円の接線は、接点を通る半径に\n{{垂直}}である。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '半径 5cm の円 O の外に、OA＝9cm の点 A がある。A から円に接線 AP をひく（P は接点）。∠OPA＝{{90}}° である。AP の長さを求めよう。', 3),
      C2([
        TB('', null, [
          ['三平方の定理', ['AP^2＝9^2−5^2＝{{56}}']],
          ['AP の長さ', ['AP＝{{2√{14} }}cm']]
        ], { hw: 30 }),
        T('', '【くふう】直角は、どこかな。', 1),
        B(2, '接点 P で、半径 OP と接線 AP が垂直。\n△OAP は、OA を斜辺とする直角三角形。')
      ], [
        F(5, figEx)
      ], '1:1')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 円の中心から弦に垂線をひくと、弦は{{2等分}}される。\n② 円の接線は、接点を通る半径に{{垂直}}である。\n③ 弦や接線の長さは、{{半径}}をひいて、直角三角形で求める。\n④ 円の外の点 A から接点 P までの長さを、{{接線}}の長さという。', 4, { label: 'ことば' }),
      F(5, figChord, figTan),
      C2([
        T('（1）', '図1で、弦 AB の長さを求めよう。', 2),
        B(3, 'AH＝√{49−16}＝√{33}cm\nAB＝2AH＝2√{33}cm')
      ], [
        T('（2）', '図2で、AP は円 O の接線である。AP の長さを求めよう。', 2),
        B(3, '∠OPA＝90°\nAP^2＝7^2−3^2＝40\nAP＝2√{10}cm')
      ], '1:1'),
      MA('【説明】弦の長さを求めるとき、どんな線をひくか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '直角三角形をつくって、求めよう。'),
      C2([
        T('（3）', '長さ 10cm の弦 AB と、中心 O のきょりが 3cm の円の、半径を求めよう。', 3),
        B(2, 'AH＝5cm　　OA^2＝5^2+3^2\nOA＝√{34}cm')
      ], [
        T('（4）', '半径 4cm の円 O の外の点 A から接線をひくと、A から接点までが 5cm だった。OA の長さを求めよう。', 3),
        B(2, 'OA^2＝4^2+5^2＝41\nOA＝√{41}cm')
      ], '1:1'),
      C2([
        T('（5）', '半径 10cm の円 O で、中心 O からのきょりが 5cm の弦 AB の長さと、∠AOB を求めよう。', 3),
        B(4, 'AH＝√{100−25}＝5√{3}\nAB＝10√{3}cm\nOH：OA＝1：2 だから\n∠AOH＝60°　∠AOB＝120°')
      ], [
        T('（6）', '半径 6cm の円 O の外に、点 A がある。A から円までのいちばん短いきょりは 3cm である。A から円への接線の長さを求めよう。', 4),
        B(3, 'OA＝6+3＝9cm\nAP^2＝9^2−6^2＝45\nAP＝3√{5}cm')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：2つの円に接する直線の長さを、求めよう。'),
      T('（7）', '半径 5cm の円 O と、半径 2cm の円 O′ があり、中心の間のきょりは 10cm である。2つの円に、点 A、B で接する直線 AB の長さを求めるには、どこに直角三角形をつくればよいだろう。', 3),
      C2([
        F(7, figTwo)
      ], [
        T('', '図に線をかき入れて、AB の長さを求めよう。', 2),
        B(5, '')
      ], '1:1'),
      C2([
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        T('', '2つの円の半径が、どちらも 5cm のときは、AB の長さはどうなるだろう。', 3),
        B(3, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図は、円の一部である。弦 AB の長さは 16cm、AB の中点 M から弧までのきょり MN は 4cm である。この円の半径を求めよう。', 4),
        B(6, '円の中心を O、半径を r cm とする。\nOM＝(r−4)cm、AM＝8cm\n△OAM で　(r−4)^2+8^2＝r^2\n−8r+80＝0\n半径 10cm')
      ], [
        F(4, figSeg),
        MA('① 円の中心 O をとって、O と A を結ぶと、どんな三角形ができるかな。\n② 半径を r cm とすると、OM は r を使って、どう表せるかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '半径 7cm の円 O で、中心 O から弦 AB までのきょりが 3cm である。弦 AB の長さを求めよう。（3点）', 2),
      B(3, 'O から AB に垂線 OH をひくと　AH＝√{49−9}＝2√{10}cm\nAB＝2AH＝4√{10}cm'),
      T('（2）', '半径 4cm の円 O の外に、OA＝9cm の点 A がある。A から円にひいた接線の長さ AP を求めよう。（3点）', 2),
      B(2, '∠OPA＝90° だから　AP^2＝9^2−4^2＝65\nAP＝√{65}cm'),
      T('（3）', '半径 8cm の円 O で、長さ 10cm の弦 AB をひいた。中心 O と弦 AB のきょりを求めよう。（2点）', 2),
      B(2, 'AH＝5cm　　OH^2＝8^2−5^2＝39\nOH＝√{39}cm'),
      T('（4）', '半径 5cm の円 O の外の点 A から、接線 AP をひくと、AP＝12cm であった。OA の長さを求めよう。（2点）', 2),
      B(2, 'OA^2＝5^2+12^2＝169　　OA＝13cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '円の弦 AB の長さは 6cm で、AB の中点から、弧までのきょり（短いほう）は 1cm である。この円の半径を求めよう。', 2),
      B(4, '半径を r cm とすると、中心から AB までのきょりは (r−1)cm\n(r−1)^2+3^2＝r^2\n−2r+10＝0　　r＝5\n半径 5cm')
    ]
  });
})();
