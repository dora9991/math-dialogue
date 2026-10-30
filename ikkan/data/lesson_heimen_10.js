/* 平面図形（新しい形） 第10時：円と直線の関係を調べよう（弧・弦・接線）。
   元：授業ナビ標準版 heimen-10（例）。「円の接線は、接点を通る半径に垂直」を、三角定規で調べる問い（今日の問い）に、接線の作図を「例題」に、
   円の中心の作図は演習プリント（4）に、「弦の垂直二等分線が、円の中心を通るのは、なぜか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（接線と半径 OA の関係）。個人3分 → ペア3分 → ことば → 例題（点 A を通る接線の作図。作図の跡は、解答のとき赤）。
   ・演習プリントは表裏：表＝確かめる 2問（名前・出あう点の数）・使ってみる 4問（作図 2・数で答える 2）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（接線の作図＋PA と PB の関係。ヒントカードつき）。
   ・作図の問題は、答え（接線・中心 O）が 1つに決まるように書いた。弦の上の 3点 C、D、E は、問題として図に出す。図は SVG（弧・円は path と circle）。
     問題として出す図は黒、作図の跡（弧・補助線）は、解答のときだけ赤。
   ・数値は新しく作り、答えは checks で別の式から出しなおした（作図の点の座標は、円の交点の式から計算しなおした）。
   検算：node tools/verify.cjs heimen-10　／　見た目：node tools/check.cjs <出力先> heimen-10 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, SVG } = IK.b;
  const INK = '#222', RED = '#d62828', D2R = Math.PI / 180;

  // ---- 作図の図の道具 ----
  const ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]) / D2R;                    // c から見た p の向き（度）
  const pol = (c, r, a) => [c[0] + r * Math.cos(a * D2R), c[1] + r * Math.sin(a * D2R)];   // c から向き a、きょり r の点
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const inter = (c1, r1, c2, r2) => {                                                    // 2つの円の交点（2つ）
    const d = dist(c1, c2), a = (r1 * r1 - r2 * r2 + d * d) / (2 * d), hh = Math.sqrt(r1 * r1 - a * a);
    const mx = c1[0] + a * (c2[0] - c1[0]) / d, my = c1[1] + a * (c2[1] - c1[1]) / d, ox = -hh * (c2[1] - c1[1]) / d, oy = hh * (c2[0] - c1[0]) / d;
    return [[mx + ox, my + oy], [mx - ox, my - oy]];
  };
  // 作図の図（数学の座標。y が上）。box＝図に入れる範囲 [x0, y0, x1, y1]。cap＝図の番号。
  // build(k, r)：k＝黒（問題として出す図）、r＝赤（作図の跡。解答のときだけ出る）に描く。ln・arc・circ・dot・tx・rt が使える
  const CF = (box, cap, build) => SVG((W, H, h) => {
    const [x0, y0, x1, y1] = box, pad = 2.5, f2 = h.f2;
    const s = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0));
    const X = x => (W - (x1 - x0) * s) / 2 + (x - x0) * s, Y = y => (H - (y1 - y0) * s) / 2 + (y1 - y) * s;
    const mk = col => {
      const o = { s: '' };
      o.ln = (p, q, w, dash) => { o.s += h.ln(X(p[0]), Y(p[1]), X(q[0]), Y(q[1]), col, w || 0.32, ' stroke-linecap="round"' + (dash ? ' stroke-dasharray="1.4 1"' : '')); return o; };
      o.arc = (c, r, a0, a1, w) => {   // c を中心とする半径 r の弧（向き a0 → a1。度）
        const p0 = pol(c, r, a0), p1 = pol(c, r, a1), rs = r * s;
        o.s += `<path d="M${f2(X(p0[0]))},${f2(Y(p0[1]))} A${f2(rs)},${f2(rs)} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 0 : 1} ${f2(X(p1[0]))},${f2(Y(p1[1]))}" fill="none" stroke="${col}" stroke-width="${w || 0.3}" stroke-linecap="round"/>`; return o;
      };
      o.circ = (c, r, w) => { o.s += `<circle cx="${f2(X(c[0]))}" cy="${f2(Y(c[1]))}" r="${f2(r * s)}" fill="none" stroke="${col}" stroke-width="${w || 0.32}"/>`; return o; };
      o.dot = (p, r) => { o.s += `<circle cx="${f2(X(p[0]))}" cy="${f2(Y(p[1]))}" r="${r || 0.7}" fill="${col}"/>`; return o; };
      o.tx = (p, t, dx, dy, an, size) => { const sz = size || 3; o.s += h.rich(X(p[0]) + (dx || 0), Y(p[1]) + (dy || 0) + sz * 0.34, t, sz, an || 'middle'); return o; };   // (dx, dy)＝字の中心のずれ（mm。下が +）
      o.lb = (p, t, a, d, size) => o.tx(p, t, d * Math.cos(a * D2R), -d * Math.sin(a * D2R), 'middle', size);   // 点 p から、向き a（度）に d mm はなれたところに字
      o.rt = (p, a, m) => {   // 直角のしるし：p を頂点として、向き a と a+90° のあいだ。m＝1辺の長さ（mm）
        const u = [Math.cos(a * D2R), -Math.sin(a * D2R)], v = [Math.cos((a + 90) * D2R), -Math.sin((a + 90) * D2R)], x = X(p[0]), y = Y(p[1]), q = (i, j) => `${f2(x + (u[0] * i + v[0] * j) * m)},${f2(y + (u[1] * i + v[1] * j) * m)}`;
        o.s += `<polyline points="${q(1, 0)} ${q(1, 1)} ${q(0, 1)}" fill="none" stroke="${col}" stroke-width="0.28"/>`; return o;
      };
      return o;
    };
    const k = mk(INK), r = mk(RED);
    build(k, r);
    if (cap) k.s += h.tx(0.6, 3.5, cap, 3, 'start', ' class="cap"');
    return k.s + (r.s ? h.ans(r.s) : '');
  });

  const O = [0, 0];
  // 接線の作図の跡（赤）：円 O（半径 R）の周上の、向き th の点 A で。OA をのばし、A を中心とする半径 rho1 の弧で OA 上に P、Q をとり、
  // P、Q を中心とする半径 rho2 の弧の交点 R1、R2 を通る直線（A を通る OA の垂線）が接線。ends＝接線の、A から両側の長さ
  const tangentTrace = (r, R, th, rho1, rho2, ends) => {
    const A = pol(O, R, th), P = pol(A, rho1, th + 180), Q = pol(A, rho1, th), hh = Math.sqrt(rho2 * rho2 - rho1 * rho1), R1 = pol(A, hh, th + 90), R2 = pol(A, hh, th - 90);
    r.ln(O, pol(O, R + rho1 + 0.9, th), 0.3);
    r.arc(A, rho1, th + 180 - 28, th + 180 + 28).arc(A, rho1, th - 28, th + 28).dot(P, 0.5).dot(Q, 0.5);
    [R1, R2].forEach(X2 => { r.arc(P, rho2, ang(P, X2) - 16, ang(P, X2) + 16).arc(Q, rho2, ang(Q, X2) - 16, ang(Q, X2) + 16); });
    r.ln(pol(A, ends, th - 90), pol(A, ends, th + 90), 0.5).rt(A, th, 2.6);
  };

  // 今日の問い：円 O の周上の点 A で、円に 1点だけでふれる直線 ℓ（黒）
  const thA = 30, A0 = pol(O, 3, thA);
  const figTan = CF([-3.5, -3.6, 5.0, 4.8], '', (k) => {
    k.circ(O, 3).ln(O, A0).ln(pol(A0, 3.0, thA - 90), pol(A0, 3.0, thA + 90)).dot(O).dot(A0);
    k.lb(O, 'O', 225, 3.2).lb(A0, 'A', thA - 35, 3.4).lb(pol(A0, 3.0, thA + 90), 'ℓ', thA + 90, 3.2);
  });

  // 例題：円 O の周上の点 A（向き 20°）を通る接線を作図する
  const thE = 20, AE = pol(O, 3, thE);
  const figTanEx = CF([-3.5, -3.5, 5.6, 3.7], '', (k, r) => {
    k.circ(O, 3).dot(O).dot(AE).lb(O, 'O', 225, 3.2).lb(AE, 'A', thE - 50, 3.6);
    tangentTrace(r, 3, thE, 1.3, 2.0, 2.3);
  });

  // 演習プリント 図1：弧 AB（太い線）・弦 AB・中心角 ∠AOB に、ア・イ・ウ。thA2〜thB2 は A、B の向き
  const terms = (cap, ta, tb, pad) => CF([-3.8, -3.7, 3.9, 4.1], cap, (k) => {
    const A = pol(O, 3, ta), Bp = pol(O, 3, tb), m = (ta + tb) / 2;
    k.circ(O, 3, 0.25).arc(O, 3, ta, tb, 1.0).ln(A, Bp).ln(O, A).ln(O, Bp).arc(O, 0.5, ta, tb, 0.25).dot(O).dot(A).dot(Bp);
    k.lb(O, 'O', 255, 3.0).lb(A, 'A', ta - 30, 3.2).lb(Bp, 'B', tb + 30, 3.2);
    k.tx(pol(O, 3.65, m), 'ア', 0, 0).tx(pol(O, 1.75, m), 'イ', 0, 0).tx(pol(O, 0.9, m), 'ウ', 0, 0);
  });
  const fig1 = terms('図1', 30, 110), figQ = terms('', 40, 160);

  // 演習プリント 図2：円 O の周上の点 P（向き 130°）を通る接線を作図する
  const thP = 130, Pp = pol(O, 3, thP);
  const fig2 = CF([-4.0, -3.5, 3.6, 4.6], '図2', (k, r) => {
    k.circ(O, 3).dot(O).dot(Pp).lb(O, 'O', 300, 3.2).lb(Pp, 'P', thP + 50, 3.6);
    tangentTrace(r, 3, thP, 1.3, 2.0, 2.3);
  });

  // 演習プリント 図3：円の一部（弧）。弧の上に 3点 C、D、E。弦 CD、DE の垂直二等分線の交点が、円の中心 O
  const tC = 35, tD = 85, tE = 145, Cc = pol(O, 3, tC), Dd = pol(O, 3, tD), Ee = pol(O, 3, tE);
  const bisTrace = (r, p, q, rho) => {   // 弦 pq の垂直二等分線の作図の跡（p、q を中心とする半径 rho の弧の交点 2つと、それを通る直線）
    const [i1, i2] = inter(p, rho, q, rho), far = dist(O, i1) > dist(O, i2) ? i1 : i2, near = far === i1 ? i2 : i1;
    [i1, i2].forEach(X2 => { r.arc(p, rho, ang(p, X2) - 17, ang(p, X2) + 17).arc(q, rho, ang(q, X2) - 17, ang(q, X2) + 17); });
    const a = ang(O, far), L = dist(O, far);
    r.ln(pol(O, L + 0.35, a), pol(O, -0.4, a), 0.45);
  };
  const fig3 = CF([-3.4, -1.0, 3.4, 4.4], '図3', (k, r) => {
    k.arc(O, 3, 20, 160).dot(Cc).dot(Dd).dot(Ee).lb(Cc, 'C', tC - 25, 3.4).lb(Dd, 'D', 90, 3.4).lb(Ee, 'E', tE + 25, 3.4);
    bisTrace(r, Cc, Dd, 1.9); bisTrace(r, Dd, Ee, 1.9);
    r.ln(Cc, Dd, 0.3).ln(Dd, Ee, 0.3).dot(O).lb(O, 'O', 270, 3.2);
  });

  // 演習プリント 図4（考えよう）：円 O と、弦 AB・弦 CD（黒だけ）
  const fig4 = CF([-3.6, -3.7, 3.9, 3.9], '図4', (k) => {
    const A = pol(O, 3, 25), Bp = pol(O, 3, 130), C = pol(O, 3, 205), D = pol(O, 3, 315);
    k.circ(O, 3).ln(A, Bp).ln(C, D).dot(O).dot(A).dot(Bp).dot(C).dot(D);
    k.lb(O, 'O', 80, 3.0).lb(A, 'A', 25, 3.2).lb(Bp, 'B', 130, 3.2).lb(C, 'C', 205, 3.2).lb(D, 'D', 315, 3.2);
  });

  // 演習プリント 図5：円 O の周上の点 A（90°）、B（−30°）を通る接線と、その交点 P
  const tA5 = 90, tB5 = -30, A5 = pol(O, 3, tA5), B5 = pol(O, 3, tB5), P5 = [3 * Math.sqrt(3), 3];
  const fig5 = CF([-3.6, -3.6, 6.3, 4.4], '図5', (k, r) => {
    k.circ(O, 3).dot(O).dot(A5).dot(B5).lb(O, 'O', 225, 3.2).lb(A5, 'A', 150, 3.4).lb(B5, 'B', 280, 3.4);
    tangentTrace(r, 3, tA5, 0.9, 1.4, 1.2); tangentTrace(r, 3, tB5, 0.9, 1.4, 1.2);
    r.ln(pol(A5, 1.2, 0), P5, 0.5).ln(pol(B5, 1.2, tB5 - 90), P5, 0.5).dot(P5).tx(P5, 'P', 2.8, -2.4);
  });

  IK.lesson('heimen-10', {
    unit: 'heimen', unitName: '平面図形', form: 'new', no: '第10時', title: '円と直線の関係を調べよう',
    summary: '円に1点だけでふれる直線（接線）と半径の関係を調べ、弧・弦・中心角・接線・接点のことばをとらえる。接線は、接点を通る半径に垂直であることを使って作図する。',
    head: '平面図形　第10時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：A（向き 30°）での接線の向きは（−sin30°, cos30°）。OA の向き（cos30°, sin30°）との内積が 0 → 垂直
      'near(-Math.sin(PI / 6) * Math.cos(PI / 6) + Math.cos(PI / 6) * Math.sin(PI / 6), 0)',
      // 例題：A（向き 20°）の接線の作図。A を中心とする半径 1.3 の弧で OA 上に P、Q。P、Q を中心とする半径 2.0 の弧の交点 R1 は、A から垂直に √(2.0²−1.3²) はなれる（PR1＝QR1＝2.0、R1A⊥OA）
      '(() => { const t = 20 * PI / 180, A = [3 * Math.cos(t), 3 * Math.sin(t)], P = [A[0] - 1.3 * Math.cos(t), A[1] - 1.3 * Math.sin(t)], Q = [A[0] + 1.3 * Math.cos(t), A[1] + 1.3 * Math.sin(t)], hh = Math.sqrt(2 * 2 - 1.3 * 1.3), R1 = [A[0] - hh * Math.sin(t), A[1] + hh * Math.cos(t)]; return near(Math.hypot(R1[0] - P[0], R1[1] - P[1]), 2) && near(Math.hypot(R1[0] - Q[0], R1[1] - Q[1]), 2) && near((R1[0] - A[0]) * Math.cos(t) + (R1[1] - A[1]) * Math.sin(t), 0); })()',
      // （2）半径 5cm の円と、中心からのきょり d の直線：出あう点の数は sign(25−d²)+1（d＝5 → 1、3 → 2、7 → 0）
      '[5, 3, 7].map(d => Math.sign(5 * 5 - d * d) + 1).join() === "1,2,0"',
      // （3）図2：P（向き 130°）。作図の跡の点が、P を通る OP の垂線の上にある
      '(() => { const t = 130 * PI / 180, A = [3 * Math.cos(t), 3 * Math.sin(t)], hh = Math.sqrt(2 * 2 - 1.3 * 1.3), R1 = [A[0] - hh * Math.sin(t), A[1] + hh * Math.cos(t)]; return near((R1[0] - A[0]) * Math.cos(t) + (R1[1] - A[1]) * Math.sin(t), 0); })()',
      // （4）図3：弧の上の C（35°）、D（85°）、E（145°）。O＝(0,0) から C、D、E まではどれも 3（半径）。弦 CD、DE の垂直二等分線は、どちらも O を通る（O から両はしまでが等しい）
      '[35, 85, 145].every(a => near(Math.hypot(3 * Math.cos(a * PI / 180), 3 * Math.sin(a * PI / 180)), 3)) && near(Math.hypot(3 * Math.cos(35 * PI / 180) - 0, 3 * Math.sin(35 * PI / 180) - 0), Math.hypot(3 * Math.cos(85 * PI / 180), 3 * Math.sin(85 * PI / 180)))',
      // （5）接線 TA（A は接点）、∠AOT＝40°：O＝(0,0)、A＝(1,0)、T＝(1, tan40°)。∠ATO を、ベクトルの内積から求める（50°）
      '(() => { const T = [1, Math.tan(40 * PI / 180)], TA = [0 - 0, 0 - T[1]], TO = [0 - T[0], 0 - T[1]]; return near(Math.acos((TA[0] * TO[0] + TA[1] * TO[1]) / (Math.hypot(TA[0], TA[1]) * Math.hypot(TO[0], TO[1]))) * 180 / PI, 50); })() && near(180 - 90 - 40, 50)',
      // （6）半径 6cm、中心角 60° の弦＝2×6×sin30°＝6
      'near(2 * 6 * Math.sin(30 * PI / 180), 6)',
      // （8）図5：A（90°）、B（−30°）での接線の交点 P＝(3√3, 3)。PA＝PB＝3√3（A を通る接線は y＝3、B を通る接線の上にも P がある）
      '(() => { const P = [3 * Math.sqrt(3), 3], A = [0, 3], B = [3 * Math.cos(-PI / 6), 3 * Math.sin(-PI / 6)]; return near(Math.hypot(P[0] - A[0], P[1] - A[1]), Math.hypot(P[0] - B[0], P[1] - B[1])) && near((P[0] - B[0]) * B[0] + (P[1] - B[1]) * B[1], 0) && near((P[0] - A[0]) * A[0] + (P[1] - A[1]) * A[1], 0); })()',
      // 小テスト（3）半径 4cm、中心からのきょり 4cm → 1個　（4）半径 8cm、中心角 60° の弦＝2×8×sin30°＝8
      'Math.sign(4 * 4 - 4 * 4) + 1 === 1 && near(2 * 8 * Math.sin(30 * PI / 180), 8)',
      // 小テスト（5）チャレンジ：∠APB＝70° → ∠AOB＝110°。r＝1、A（55°）、B（−55°）、P＝(1/cos55°, 0)：∠APB＝2×asin(1/OP)＝70°
      'near(2 * Math.asin(Math.cos(55 * PI / 180)) * 180 / PI, 70) && near(360 - 90 - 90 - 70, 110) && near(2 * 55, 110)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('円と直線の関係を調べよう'),
      K('今日の問い', '円 O の周上の点 A で、円に1点だけでふれる直線 ℓ がある。ℓ と半径 OA は、どんな関係になっているだろう。三角定規などで調べよう。', 2),
      F(5, figTan),
      T('①', '自分の考え（3分）　調べたことと、気づいたことを書こう。', 1),
      B(3, '（例）三角定規の直角を、ℓ と OA にあててみる。\nぴったり合うから、ℓ と OA は垂直に交わっている。'),
      T('②', 'ペアの考え（3分）　ほかの点でも同じか、確かめて書こう。', 1),
      B(2, ''),
      G(1),
      WD('円周の一部分を{{弧}}、2点を結ぶ線分を{{弦}}という。\n弧の両はしと中心を結ぶ角を{{中心角}}という。\n円に接する直線を{{接線}}、接する点を{{接点}}という。\n円の接線は、接点を通る半径に{{垂直}}である。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '円 O の周上の点 A を通る接線を作図しよう。接線は半径 OA と{{90}}° で交わるから、OA の垂線をひく。', 2),
      F(5, figTanEx),
      T('', '【作図のくふう】どんな手順で作図するか、書こう。', 1),
      B(3, '① 半直線 OA を、A の先までのばす。\n② A を通る OA の垂線を作図する。\n　 （A を中心とする弧で OA 上に 2点をとり、垂直二等分線をひく）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 円周の一部分を{{弧}}といい、円周上の2点を結ぶ線分を{{弦}}という。\n② 弧の両はしと中心を結んでできる角を{{中心角}}という。\n③ 円と1点だけで出あう直線を{{接線}}といい、出あう点を{{接点}}という。\n④ 円の接線は、接点を通る半径に{{垂直}}である。', 4, { label: 'ことば' }),
      F(5, fig1, fig2, fig3),
      C2([
        T('（1）', '図1で、ア（太い線）・イ（線分 AB）・ウ（∠AOB）を、それぞれ何というか。', 4),
        B(3, 'ア 弧 AB　　イ 弦 AB\nウ 弧 AB に対する中心角')
      ], [
        T('（2）', '半径 5cm の円と直線 ℓ。中心から ℓ までのきょりが次のとき、出あう点は何個か。\nア 5cm　イ 3cm　ウ 7cm', 4),
        B(3, 'ア 1個（接する）\nイ 2個　ウ 0個')
      ], '1:1'),
      MA('【説明】円の接線と半径は、どんな関係か。隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '円の性質を使って、作図したり、角を求めたりしよう。'),
      C2([
        T('（3）', '図2の円 O で、周上の点 P を通る接線を作図しよう。', 3),
        B(2, '半直線 OP をのばし、P を通る OP の垂線をひく。')
      ], [
        T('（4）', '図3は、円の一部である。弧の上の点 C、D、E から、円の中心 O を作図しよう。', 3),
        B(2, '弦 CD、DE の垂直二等分線の交点が、中心 O。')
      ], '1:1'),
      C2([
        T('（5）', '円 O の接線が、周上の点 A で円にふれている。接線上の点 T について、∠AOT＝40° のとき、∠ATO は何度か。', 6),
        B(3, '∠OAT＝90°（接線⊥半径）\n∠ATO＝180°−90°−40°＝50°')
      ], [
        T('（6）', '半径 6cm の円で、中心角が 60° の弧に対する弦の長さは何 cm か。', 4),
        B(3, '2つの半径と弦で、正三角形になる。\n弦は 6cm')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：弦の垂直二等分線を、しらべよう。'),
      T('（7）', '図4で、弦 AB の垂直二等分線は、円の中心 O を通る。それは、なぜだろう。図に気づいたことを書きこんで、理由を考えよう。', 2),
      F(5, fig4),
      C2([
        T('', '気づいたことと、理由', 1),
        B(7, '')
      ], [
        T('', '弦 CD でも成り立つか、作図して確かめよう', 2),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '図5の円 O の周上の点 A、B を通る接線を、それぞれ作図し、その交点を P とする。PA と PB の長さには、どんな関係があるか。', 7),
        B(5, '点 A を通る OA の垂線と、点 B を通る OB の垂線を作図し、交点を P とする。\nPA＝PB')
      ], [
        F(5, fig5),
        MA('① 直線 OP で折ると、点 A は、どの点に重なるかな。\n② OA と OB の長さは、どんな関係かな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図で、ア（太い線）・イ（線分 AB）・ウ（∠AOB）を、それぞれ何というか。（3点）', 5),
        B(3, 'ア 弧 AB　　イ 弦 AB\nウ 弧 AB に対する中心角')
      ], [F(5, figQ)], '1:1'),
      T('（2）', '円の接線は、接点を通る半径と、どのように交わるか。（2点）', 1),
      B(2, '垂直に交わる。'),
      T('（3）', '半径 4cm の円と直線 ℓ がある。円の中心から ℓ までのきょりが 4cm のとき、円と ℓ は、何個の点で出あうか。（2点）', 2),
      B(2, '1個（ℓ は円の接線）'),
      T('（4）', '半径 8cm の円で、中心角が 60° の弧に対する弦の長さを求めよう。（3点）', 2),
      B(2, '2つの半径と弦で、正三角形になるから　8cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '円 O の外の点 P から、円 O に 2本の接線 PA、PB をひく。∠APB＝70° のとき、∠AOB の大きさを求めよう。', 3),
      B(4, '∠PAO＝∠PBO＝90°（接線⊥半径）\n四角形 PAOB の角の和は 360° だから\n∠AOB＝360°−90°−90°−70°＝110°')
    ]
  });
})();
