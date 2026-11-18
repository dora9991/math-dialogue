/* 空間図形（新しい形） 第11時：角錐や円錐の体積は、角柱や円柱の何分のいくつか、実験で確かめよう。 kukan-11 と同じ内容の授業を、新しい形に組みかえた（見本 lesson_kukan_new_01.js）。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（円錐の容器の水を、円柱の容器にうつすと、何はい目でいっぱいになるか）。個人3分（予想）→ ペア3分 → ことば → 例題（正四角錐・円錐。数字は空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（ここまでできたら今日の合格）／裏＝ひろげる 1問（考えよう：頂点がかたむいた角錐。答えは載せない）・チャレンジ★★ 1問（立方体の中の三角錐。ヒントカードつき）。 2:4:1:1 の8問。
   ・小テストは kukan-11 と同じ（罫が 8mm になったので、行数だけつめた）。
   ・図：容器（containers）・紙の山（slantStack）・円錐／正四角錐（solidFig）・立方体／直方体（cuboidFig）は、kukan-11 の関数を引きついだ。
   ・授業では、底面・高さが同じ円柱と円錐の容器（透明）、水（または砂）、トランプや付箋の山（班に1組）を用意する。
   検算：node tools/verify.cjs kukan_new-11　／　見た目：node tools/check.cjs <出力先> kukan_new-11 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, SVG } = IK.b;
  const f2 = n => String(Math.round(n * 100) / 100);
  const arrowHead = (x, y, ang, c) => {   // 矢じり：先が (x, y)、進む向きが ang（画面の座標でのラジアン）
    const s = 1.9, a1 = ang + Math.PI * 0.85, a2 = ang - Math.PI * 0.85;
    return `<polygon points="${f2(x)},${f2(y)} ${f2(x + s * Math.cos(a1))},${f2(y + s * Math.sin(a1))} ${f2(x + s * Math.cos(a2))},${f2(y + s * Math.sin(a2))}" fill="${c}"/>`;
  };

  /* 今日の問いの図：底面の大きさも高さも同じ。水がいっぱいの円錐の容器を、円柱の容器にうつす */
  const containers = () => SVG((W, H, h) => {
    const r = 12, ry = r * 0.3, cx1 = W * 0.27, cx2 = W * 0.73, yT = 19, yB = H - ry - 9;
    const arcFront = cx => `<path d="M${f2(cx - r)},${f2(yB)} A${r},${f2(ry)} 0 0 0 ${f2(cx + r)},${f2(yB)}" fill="none" stroke="#222" stroke-width="0.32"/>`;
    const arcBack = cx => `<path d="M${f2(cx - r)},${f2(yB)} A${r},${f2(ry)} 0 0 1 ${f2(cx + r)},${f2(yB)}" fill="none" stroke="#555" stroke-width="0.22" stroke-dasharray="1.2 0.9"/>`;
    const topEll = (cx, fill) => `<ellipse cx="${f2(cx)}" cy="${yT}" rx="${r}" ry="${f2(ry)}" fill="${fill}" stroke="#222" stroke-width="0.32"/>`;
    const dim = (cx, label) => {   // 高さ h（右がわ）と 半径 r（上の面）
      const x = cx + r + 6;
      return h.ln(cx, yT, cx + r, yT, '#222', 0.22, ' stroke-dasharray="1.2 0.9"') + h.rich(cx + r / 2, yT - 0.9, 'r', 2.9, 'middle')
        + h.ln(x, yT, x, yB, '#222', 0.22) + h.ln(x - 1.2, yT, x + 1.2, yT, '#222', 0.22) + h.ln(x - 1.2, yB, x + 1.2, yB, '#222', 0.22)
        + h.rich(x + 2, (yT + yB) / 2 + 1, 'h', 2.9, 'start');
    };
    let out = '';
    // 円錐の容器（先を下に。水がいっぱい）
    out += `<polygon points="${f2(cx1 - r)},${yT} ${f2(cx1 + r)},${yT} ${f2(cx1)},${f2(yB)}" fill="#cfe8f7" stroke="none"/>`;
    out += topEll(cx1, '#e4f2fb');
    out += h.ln(cx1 - r, yT, cx1, yB, '#222', 0.32, ' stroke-linecap="round"') + h.ln(cx1 + r, yT, cx1, yB, '#222', 0.32, ' stroke-linecap="round"');
    out += dim(cx1);
    // 円柱の容器（空）
    out += h.ln(cx2 - r, yT, cx2 - r, yB, '#222', 0.32) + h.ln(cx2 + r, yT, cx2 + r, yB, '#222', 0.32);
    out += arcBack(cx2) + arcFront(cx2) + topEll(cx2, 'none');
    out += dim(cx2);
    // 水をうつす矢印
    const ax1 = cx1 + 6, ax2 = cx2 - 6, ay = 14, my = -3.4, mx = (ax1 + ax2) / 2;
    out += `<path d="M${f2(ax1)},${ay} Q${f2(mx)},${my} ${f2(ax2)},${ay}" fill="none" stroke="#1d5fbf" stroke-width="0.5"/>`;
    out += arrowHead(ax2, ay, Math.atan2(ay - my, ax2 - mx), '#1d5fbf');
    out += h.rich(mx, 12.2, '水をうつす', 3.1, 'middle');
    out += h.rich(cx1, H - 1.6, '円錐の容器（水がいっぱい）', 3, 'middle') + h.rich(cx2, H - 1.6, '円柱の容器（空）', 3, 'middle');
    return out;
  });

  /* ひろげる（7）の図：底面積も高さも同じ角錐 ア・イ を、正面から見た図。うすい紙を重ねたモデル（細い横長の紙の山） */
  const slantStack = () => SVG((W, H, h) => {
    const a = 46, hh = 36, N = 12, yb = H - 11, panels = [{ cx: W * 0.29, d: 0, cap: 'ア' }, { cx: W * 0.71, d: 19, cap: 'イ' }];
    let out = '';
    panels.forEach(p => {
      for (let i = 0; i < N - 1; i++) {   // 紙：下から i 枚目。上のふちの高さ・幅・中心で、三角形の中にぴったりおさまる
        const t = (i + 1) / N, w = a * (1 - t), cxi = p.cx + p.d * t, yTop = yb - (i + 1) * hh / N, yBot = yb - i * hh / N;
        out += `<rect x="${f2(cxi - w / 2)}" y="${f2(yTop)}" width="${f2(w)}" height="${f2(yBot - yTop)}" fill="#eef3fa" stroke="#7a8aa0" stroke-width="0.2"/>`;
      }
      out += `<polygon points="${f2(p.cx - a / 2)},${f2(yb)} ${f2(p.cx + a / 2)},${f2(yb)} ${f2(p.cx + p.d)},${f2(yb - hh)}" fill="none" stroke="#222" stroke-width="0.34" stroke-linejoin="round"/>`;
      out += h.ln(p.cx + p.d, yb - hh, p.cx + p.d, yb, '#222', 0.22, ' stroke-dasharray="1.2 0.9"');   // 高さ（垂線）
      out += h.ln(p.cx + p.d - 1.6, yb, p.cx + p.d - 1.6, yb - 1.6, '#222', 0.2) + h.ln(p.cx + p.d - 1.6, yb - 1.6, p.cx + p.d, yb - 1.6, '#222', 0.2);   // 直角のしるし
      out += h.rich(p.cx + p.d - 2.6, yb - hh / 2 + 1, 'h', 3, 'end');
      out += h.rich(p.cx, H - 3.4, p.cap + '　底面積 S', 3.2, 'middle');
    });
    return out;
  });

  /* 円錐・正四角錐の見取図（自作）。高さ h は、図の右がわの寸法線に書く（図の線と字がかさならない）。
     o: { shape: 'cone'｜'pyramid', r（円錐の半径）｜a（正四角錐の底面の1辺）, h（高さ）, rT・hT（半径・高さの字。'{{3}}cm' のように書くと空欄）, cap（見出し） } */
  const solidFig = o => SVG((W, H, hp) => {
    const q = 0.28, kc = 0.5 * Math.cos(35 * Math.PI / 180), ks = 0.5 * Math.sin(35 * Math.PI / 180), cone = o.shape === 'cone', h = o.h;
    const segs = [], curves = [];   // 単位の座標（y は上向き）
    let apex, foot, r = o.r, a = o.a;
    if (cone) {
      const t1 = Math.asin(Math.min(0.98, q * r / h));
      const arc = (t0, t1b, hidden) => { const pts = []; for (let k = 0; k <= 60; k++) { const t = t0 + (t1b - t0) * k / 60; pts.push([r * Math.cos(t), q * r * Math.sin(t)]); } curves.push({ pts, hidden }); };
      arc(Math.PI - t1, 2 * Math.PI + t1, false); arc(t1, Math.PI - t1, true);
      apex = [0, h]; foot = [0, 0];
      segs.push({ p: apex, q: [r * Math.cos(t1), q * r * Math.sin(t1)] }, { p: apex, q: [-r * Math.cos(t1), q * r * Math.sin(t1)] });
    } else {
      const P2 = (x, y, z) => [x + kc * y, z + ks * y];
      const A = P2(0, 0, 0), B = P2(a, 0, 0), C = P2(a, a, 0), D = P2(0, a, 0); apex = P2(a / 2, a / 2, h); foot = P2(a / 2, a / 2, 0);
      [[A, B], [B, C], [apex, A], [apex, B], [apex, C]].forEach(e => segs.push({ p: e[0], q: e[1] }));
      [[C, D], [D, A], [apex, D]].forEach(e => segs.push({ p: e[0], q: e[1], hidden: true }));
    }
    const pts = [apex, foot, ...segs.flatMap(s => [s.p, s.q]), ...curves.flatMap(c => c.pts)];
    const x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])), y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1]));
    const top = o.cap ? 8 : 3.5, resR = 19, s = Math.min((W - 3 - resR) / (x1 - x0), (H - top - 3) / (y1 - y0));
    const X = p => 2 + ((W - 3 - resR) - (x1 - x0) * s) / 2 + (p[0] - x0) * s, Y = p => top + ((H - top - 3) - (y1 - y0) * s) / 2 + (y1 - p[1]) * s;
    let out = '';
    if (o.cap) out += hp.tx(W / 2, 3.5, hp.svgMath(o.cap), 3, 'middle', ' class="cap"');
    const dash = ' stroke-dasharray="1.2 0.9"';
    curves.forEach(c => { out += `<polyline points="${c.pts.map(p => f2(X(p)) + ',' + f2(Y(p))).join(' ')}" fill="none" stroke="${c.hidden ? '#555' : '#222'}" stroke-width="${c.hidden ? 0.22 : 0.34}"${c.hidden ? dash : ''}/>`; });
    segs.forEach(g => { out += hp.ln(X(g.p), Y(g.p), X(g.q), Y(g.q), g.hidden ? '#555' : '#222', g.hidden ? 0.22 : 0.34, g.hidden ? dash : ' stroke-linecap="round"'); });
    out += hp.ln(X(apex), Y(apex), X(foot), Y(foot), '#222', 0.22, dash);   // 高さ（垂線）
    const m = 1.6, fx = X(foot), fy = Y(foot);
    if (cone) {
      out += hp.ln(fx, fy, fx + r * s, fy, '#222', 0.22, dash) + hp.ln(fx + m, fy, fx + m, fy - m, '#222', 0.2) + hp.ln(fx, fy - m, fx + m, fy - m, '#222', 0.2);
      if (o.rT) out += hp.rich(fx + r * s / 2, fy - 1.0, o.rT, 2.9, 'middle');
      if (o.lT) {   // 母線の長さ：左の母線の外がわ
        const lx = (X(apex) + X([-r * Math.cos(Math.asin(Math.min(0.98, q * r / h))), 0])) / 2, ly = (Y(apex) + Y([0, q * r * Math.sin(Math.asin(Math.min(0.98, q * r / h)))])) / 2;
        out += hp.rich(lx - 1.8, ly + 1, o.lT, 2.9, 'end');
      }
    }
    const bx = X([x1, 0]) + 6;   // 寸法線（右がわ）
    out += hp.ln(bx, Y(apex), bx, Y(foot), '#222', 0.22) + hp.ln(bx - 1.2, Y(apex), bx + 1.2, Y(apex), '#222', 0.22) + hp.ln(bx - 1.2, Y(foot), bx + 1.2, Y(foot), '#222', 0.22);
    out += hp.ln(X(apex), Y(apex), bx - 1.2, Y(apex), '#999', 0.15, ' stroke-dasharray="0.6 0.9"') + hp.ln(X(foot), Y(foot), bx - 1.2, Y(foot), '#999', 0.15, ' stroke-dasharray="0.6 0.9"');
    if (o.hT) out += hp.rich(bx + 2.2, (Y(apex) + Y(foot)) / 2 + 1, o.hT, 2.9, 'start');
    return out;
  });

  /* 直方体・立方体の見取図（斜投影。かくれた辺は点線）。o: { w, d, h, tri: 'BDE'（色をぬる三角形）, lines: [[頂点, 頂点, かくれているか]…]（青い線）, dims: [[頂点, 頂点, 字]…] } */
  const cuboidFig = o => SVG((W, H, hp) => {
    const w = o.w, d = o.d, ht = o.h, kc = 0.5 * Math.cos(35 * Math.PI / 180), ks = 0.5 * Math.sin(35 * Math.PI / 180);
    const V = { A: [0, 0, 0], B: [w, 0, 0], C: [w, d, 0], D: [0, d, 0], E: [0, 0, ht], F: [w, 0, ht], G: [w, d, ht], H: [0, d, ht] };
    const S = {}; Object.keys(V).forEach(k => { S[k] = [V[k][0] + kc * V[k][1], V[k][2] + ks * V[k][1]]; });
    const xs = Object.values(S).map(p => p[0]), ys = Object.values(S).map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = o.pad || 7, k = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0));
    const X = p => pad + (W - 2 * pad - (x1 - x0) * k) / 2 + (p[0] - x0) * k, Y = p => pad + (H - 2 * pad - (y1 - y0) * k) / 2 + (y1 - p[1]) * k;
    const cx = (X([x0, 0]) + X([x1, 0])) / 2, cy = (Y([0, y0]) + Y([0, y1])) / 2;
    let out = '';
    if (o.tri) out += `<polygon points="${Array.from(o.tri).map(c => f2(X(S[c])) + ',' + f2(Y(S[c]))).join(' ')}" fill="#1d5fbf" fill-opacity="0.16" stroke="none"/>`;
    const E = [['A', 'B', 0], ['B', 'C', 0], ['C', 'D', 1], ['D', 'A', 1], ['E', 'F', 0], ['F', 'G', 0], ['G', 'H', 0], ['H', 'E', 0], ['A', 'E', 0], ['B', 'F', 0], ['C', 'G', 0], ['D', 'H', 1]];
    E.filter(e => e[2]).forEach(e => { out += hp.ln(X(S[e[0]]), Y(S[e[0]]), X(S[e[1]]), Y(S[e[1]]), '#555', 0.22, ' stroke-dasharray="1.2 0.9"'); });
    E.filter(e => !e[2]).forEach(e => { out += hp.ln(X(S[e[0]]), Y(S[e[0]]), X(S[e[1]]), Y(S[e[1]]), '#222', 0.34, ' stroke-linecap="round"'); });
    (o.lines || []).forEach(l => { out += hp.ln(X(S[l[0]]), Y(S[l[0]]), X(S[l[1]]), Y(S[l[1]]), '#1d5fbf', 0.6, (l[2] ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"'); });
    const inc = {};   // 各頂点に集まる線の向き（画面の角度）
    const addSeg = (a, b) => { [[a, b], [b, a]].forEach(q => { (inc[q[0]] = inc[q[0]] || []).push(Math.atan2(Y(S[q[1]]) - Y(S[q[0]]), X(S[q[1]]) - X(S[q[0]]))); }); };
    E.forEach(e => addSeg(e[0], e[1])); (o.lines || []).forEach(l => addSeg(l[0], l[1]));
    Object.keys(S).forEach(c => {   // 頂点の字：集まる線と線のあいだの、いちばん広いすき間の向きに置く
      const x = X(S[c]), y = Y(S[c]), an = inc[c].slice().sort((p, q) => p - q);
      let best = 0, bd = -1;
      an.forEach((a, m) => { const gap = (m + 1 < an.length ? an[m + 1] : an[0] + 2 * Math.PI) - a; if (gap > bd) { bd = gap; best = a + gap / 2; } });
      out += hp.tx(x + Math.cos(best) * 3.6, y + Math.sin(best) * 3.6 + 1.1, c, 3.1, 'middle', ' class="pl"');
    });
    (o.dims || []).forEach(dm => {   // 辺の長さの字（辺の外がわ）
      const p = [(X(S[dm[0]]) + X(S[dm[1]])) / 2, (Y(S[dm[0]]) + Y(S[dm[1]])) / 2]; let nx = p[0] - cx, ny = p[1] - cy; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      out += hp.rich(p[0] + nx * 5.2, p[1] + ny * 4.2 + 1, dm[2], 2.9, Math.abs(nx) < 0.3 ? 'middle' : nx > 0 ? 'start' : 'end');
    });
    return out;
  });

  IK.lesson('kukan_new-11', {
    unit: 'kukan_new', unitName: '空間図形（新しい形）', form: 'new', no: '第11時', title: '角錐や円錐の体積は、角柱や円柱の何分のいくつか、実験で確かめよう',
    summary: '同じ底面・高さの円柱と円錐の容器で水をうつして予想を確かめ、錐体の体積 V＝[[1/3]]Sh にまとめる。考えようから、かたむいた角錐の体積。',
    head: '空間図形　第11時',
    pitch: 8, dots: true,
    checks: [
      // 例題：錐体の体積は柱体の 1/3。（1）正四角錐 底面積 36・体積 96、（2）円錐 12π（同じ底面・高さの円柱 36π の 1/3）
      'near(6 * 6, 36) && near(36 * 8 / 3, 96) && near(PI * 3 * 3 * 4, 36 * PI) && near(PI * 3 * 3 * 4 / 3, 12 * PI) && near(36 * PI / 3, 12 * PI)',
      // 演習プリント 確かめる （1）三角柱 15×6＝90・三角錐 30（3倍のちがい）（2）正四角錐 3×3, 高さ 4 → 12
      'near(15 * 6, 90) && near(15 * 6 / 3, 30) && near(90 / 30, 3) && near(3 * 3 * 4 / 3, 12)',
      // 使ってみる （3）円錐 r3 h5 → 15π （4）直径 8cm → 半径 4：32π （5）底面積 6×8÷2＝24、体積 40 （6）円錐 r5 h12（母線 13）→ 100π。5^2+12^2＝13^2（図の長さの確かめ）
      'near(PI * 3 * 3 * 5 / 3, 15 * PI) && near(8 / 2, 4) && near(PI * 4 * 4 * 6 / 3, 32 * PI) && near(6 * 8 / 2, 24) && near(24 * 5 / 3, 40) && near(PI * 5 * 5 * 12 / 3, 100 * PI) && near(5 * 5 + 12 * 12, 13 * 13)',
      // （7）考えよう：かたむいた角錐。紙1枚の面積（相似）と高さ・枚数は、まっすぐなときと同じ。底面積 S・高さ h のどの角錐も、n 枚の紙の体積の和は同じ（n 等分の紙の面積 S×((n−k)/n)^2、厚さ h/n）
      '[10, 100, 1000].every(n => { let a = 0; for (let k = 0; k < n; k++) a += 36 * ((n - k) / n) ** 2 * (8 / n); return Math.abs(a - 36 * 8 / 3) / (36 * 8 / 3) < 3 / n; })',
      // （8）立方体 6^3＝216、角の三角錐 [[1/3]]×(6×6÷2)×6＝36 が 4つ → 216−144＝72。別の求め方：3つのベクトルの行列式 |6(0×6−6×6)+6(6×0−6×6)+0|÷6＝72（＝立方体の [[1/3]]）。A(0,0,0) C(6,6,0) F(6,0,6) H(0,6,6)
      'near(6 * 6 * 6, 216) && near(6 * 6 / 2 * 6 / 3, 36) && near(216 - 4 * 36, 72) && near(Math.abs(6 * (0 * 6 - 6 * 6) + 6 * (6 * 0 - 6 * 6) + 0) / 6, 72) && near(72, 216 / 3)',
      // 小テスト （2）正四角錐 36×5÷3＝60 （3）円錐 r6 h4 → 48π （4）[[1/3]]π×9×h＝27π → h＝9 ／ チャレンジ：水 [[1/3]]π3^2×6＝18π、容器 [[1/3]]π6^2×12＝144π、[[18π/144π]]＝[[1/8]]（水面の半径 3：6＝深さ 6：12）
      'near(36 * 5 / 3, 60) && near(PI * 36 * 4 / 3, 48 * PI) && near(PI * 9 * 9 / 3, 27 * PI) && near(3 / 6, 6 / 12) && near(PI * 9 * 6 / 3, 18 * PI) && near(PI * 36 * 12 / 3, 144 * PI) && near(18 / 144, 1 / 8)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('角錐や円錐の体積の求め方を、実験から見つけよう'),
      K('今日の問い', '底面も高さも同じ、円柱と円錐の容器がある。円錐の容器いっぱいの水を円柱の容器にうつすと、何はい目でいっぱいになるだろう。', 2),
      F(6, containers()),
      T('①', '自分の考え（3分）　予想と、そう思ったわけを書こう。', 1),
      B(3, '（例）円錐は先がとがっているから、円柱より小さそう。\n　　　2はい？ 3ばい？ 4はい？\n実験 … ちょうど 3ばいで、いっぱいになる。円錐は、円柱の [[1/3]]'),
      T('②', 'ペアの考え（3分）　自分とちがう予想・わけを書こう。', 1),
      B(2, ''),
      G(1),
      WD('角柱・円柱の体積 V＝{{Sh}}（S：底面積、h：高さ）\n錐体の体積は、同じ底面・高さの柱体の {{[[1/3]]}}\n角錐・円錐の体積 V＝{{[[1/3]]Sh}}\n錐体の高さは、頂点から底面への {{垂線}} の長さ', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次の立体の体積を求めよう。\n（1）底面が 1辺 {{6}}cm の正方形で、高さが {{8}}cm の正四角錐\n（2）底面の半径が {{3}}cm、高さが {{4}}cm の円錐', 3),
      F(5, solidFig({ shape: 'pyramid', a: 6, h: 8, hT: '{{8}}cm', cap: '（1）' }), solidFig({ shape: 'cone', r: 3, h: 4, rT: '{{3}}cm', hT: '{{4}}cm', cap: '（2）' })),
      T('', '【式のくふう】式を書く前に、「柱か、錐か」を声に出そう。', 1),
      B(2, '（1）底面積 6×6＝36　　[[1/3]]×36×8＝96（cm^3）\n（2）[[1/3]]×π×3^2×4＝12π（cm^3）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 角柱・円柱の体積は V＝{{Sh}}、角錐・円錐は V＝{{[[1/3]]Sh}}\n② 錐体の体積は、底面積と高さが等しい柱体の体積の {{[[1/3]]}}\n③ 錐体の高さは、頂点から底面にひいた {{垂線}} の長さ（{{母線}}ではない）\n④ 底面が円のとき、底面積 S＝{{πr^2}}', 4, { label: 'ことば' }),
      C2([
        T('（1）', '底面積が 15cm^2、高さが 6cm のア 三角柱、イ 三角錐の体積を求めよう。', 2),
        B(4, 'ア 15×6＝90（cm^3）\nイ [[1/3]]×15×6＝30（cm^3）')
      ], [
        T('（2）', '底面が 1辺 3cm の正方形で、高さが 4cm の正四角錐の体積を求めよう。', 2),
        B(4, '底面積 3×3＝9\n[[1/3]]×9×4＝12（cm^3）')
      ], '1:1'),
      MA('【説明】（1）のアとイで、体積が 3倍ちがうわけを、\n隣の人に説明しよう。　説明できた ☐　聞いてくれた人（　　　　）', 2),
      G(1),
      HD('使ってみる', '式を書く前に、柱か錐かを確かめよう。'),
      C2([
        T('（3）', '底面の半径が 3cm、高さが 5cm の円錐の体積を求めよう。', 2),
        B(4, '[[1/3]]×π×3^2×5\n＝15π（cm^3）')
      ], [
        T('（4）', '底面の直径が 8cm、高さが 6cm の円錐の体積を求めよう。', 2),
        B(4, '半径は 8÷2＝4（cm）\n[[1/3]]×π×4^2×6\n＝32π（cm^3）')
      ], '1:1'),
      C2([
        T('（5）', '底面が、直角をはさむ 2辺が 6cm、8cm の直角三角形で、高さが 5cm の三角錐の体積を求めよう。', 3),
        B(4, '底面積 [[1/2]]×6×8＝24\n[[1/3]]×24×5＝40（cm^3）')
      ], [
        T('（6）', '右の円錐の体積を求めよう。', 1),
        F(6, solidFig({ shape: 'cone', r: 5, h: 12, rT: '5cm', hT: '12cm', lT: '13cm' })),
        B(3, '半径 5cm、高さ 12cm を使う\n[[1/3]]×π×5^2×12\n＝100π（cm^3）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：頂点がかたむいた角錐を、紙の山で考えよう。'),
      T('（7）', '底面積と高さが等しい角錐ア・イ（正面から見た図）がある。頂点がかたむいているイの体積は、アと同じだろうか。うすい紙を重ねたモデルで考えよう。', 2),
      F(7, slantStack()),
      C2([
        T('', '予想と、そのわけ', 1),
        B(7, '')
      ], [
        T('', '紙を重ねたモデルで、説明してみよう。', 1),
        B(7, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '1辺 6cm の立方体 ABCD-EFGH で、4つの頂点 A、C、F、H を結んでできる三角錐 ACFH の体積を求めよう。', 3),
        B(8, '立方体から、B・D・E・G の\n角の三角錐 4つを取りのぞく。\n1つ分 [[1/3]]×([[1/2]]×6×6)×6＝36\n6^3−36×4＝216−144＝72（cm^3）')
      ], [
        F(7, cuboidFig({ w: 6, d: 6, h: 6, lines: [['A', 'C', true], ['A', 'H', true], ['C', 'H', true], ['A', 'F', false], ['C', 'F', false], ['F', 'H', false]] })),
        MA('① 三角錐 ACFH のまわりに、どんな形の立体がくっついているかな。\n② その立体は、いくつあるかな。体積は、どう求められるかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（kukan-11 と同じ） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '角錐・円錐の体積は、底面積と高さが等しい角柱・円柱の体積の、何分のいくつか。（2点）', 2),
      B(2, '[[1/3]]'),
      T('（2）', '底面が 1辺 6cm の正方形で、高さが 5cm の正四角錐の体積を求めよう。（3点）', 1),
      B(3, '[[1/3]]×6×6×5＝60（cm^3）'),
      T('（3）', '底面の半径が 6cm、高さが 4cm の円錐の体積を求めよう。（2点）', 1),
      B(3, '[[1/3]]×π×6^2×4＝48π（cm^3）'),
      T('（4）', '底面の半径が 3cm、体積が 27π cm^3 の円錐の、高さを求めよう。（3点）', 1),
      B(4, '高さを h cm として　[[1/3]]×π×3^2×h＝27π\n3πh＝27π　　h＝9（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '底面の半径 6cm、深さ 12cm の円錐の形をした容器を、頂点を下にして置き、深さ 6cm のところまで水を入れた。水面の円の半径は 3cm である。水の体積は、容器いっぱいの体積の、何分のいくつか。', 3),
      B(6, '水の体積 [[1/3]]×π×3^2×6＝18π\n容器の体積 [[1/3]]×π×6^2×12＝144π\n[[18π/144π]]＝[[1/8]]')
    ]
  });
})();
