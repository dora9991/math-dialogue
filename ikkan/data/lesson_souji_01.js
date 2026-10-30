/* 相似な図形 第1時：「形が同じ」とは、どういうことだろう。
   元：授業ナビ標準版 souji-01（探）。方眼の四角形 ア・イ・ウ から「形が同じ」を調べる課題を「今日の問い」に、2つの三角形で対応する辺・角・相似比を答える例題1を「例題」に、
   「いつでも相似といえる図形」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（イ と ウ のうち、ア と形が同じなのはどちらか。辺の長さと角で説明する）。個人3分 → ペア3分 → ことば（相似・∽・相似比・対応する角）→ 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（周の長さの比。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、図の頂点の座標から長さ・比・角を計算し直して確かめた（図に書いた長さは、座標から出した値）。
   ・記号 ∽ は、ことば欄で読み方（△ABC 相似 △DEF）をことわった。対応する頂点の順は、答え（B）で示した。
   検算：node tools/verify.cjs souji-01　／　見た目：node tools/check.cjs <出力先> souji-01 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const R = Math.PI / 180, J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）。o＝{ w: 横の幅の割合 }
  const cap = (fig, text, o) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, o);
  // 三角形：nm＝'ABC'。AB＝l1、BC＝l2、CA＝l3（A が左下、B が右下）
  const tri3 = (nm, l1, l2, l3) => { const x = (l1 * l1 + l3 * l3 - l2 * l2) / (2 * l1); return { [nm[0]]: [0, 0], [nm[1]]: [l1, 0], [nm[2]]: [x, Math.sqrt(l3 * l3 - x * x)] }; };
  // 移す：s＝倍率、rot＝回す角（度。反時計まわり）、dx・dy＝平行移動、names＝名前の置きかえ
  const mv = (P, o) => { const a = (o.rot || 0) * R, s = o.s || 1, out = {}; Object.keys(P).forEach(k => { const x = P[k][0] * s, y = P[k][1] * s; out[(o.names && o.names[k]) || k] = [x * Math.cos(a) - y * Math.sin(a) + (o.dx || 0), x * Math.sin(a) + y * Math.cos(a) + (o.dy || 0)]; }); return out; };
  const cenOf = P => { const ks = Object.keys(P); return [ks.reduce((s, k) => s + P[k][0], 0) / ks.length, ks.reduce((s, k) => s + P[k][1], 0) / ks.length]; };
  // 頂点の字：図形の中心から外へむけて置く
  const vlOut = (P, k) => { const c = cenOf(P), o = {}; Object.keys(P).forEach(n => { o[n] = [n, Math.atan2(P[n][1] - c[1], P[n][0] - c[0]) / R, k || 3.4]; }); return o; };
  // 辺 a-b の外がわに、長さの字 t を置く（字の大きさをみて、辺からはなす）
  const side = (P, a, b, t) => {
    const m = [(P[a][0] + P[b][0]) / 2, (P[a][1] + P[b][1]) / 2], c = cenOf(P), vx = m[0] - c[0], vy = m[1] - c[1], L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L;
    const w = String(t).length * 1.7 + 1, off = Math.abs(ux) * w / 2 + Math.abs(uy) * 1.6 + 1.6;
    return { p: m, t, dx: ux * off, dy: -uy * off };
  };
  // 三角形 1つぶんの、辺の長さの字（lens＝{ AB: '8cm', … }）
  const sides = (P, lens) => Object.keys(lens).map(k => side(P, k[0], k[1], lens[k]));

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：方眼の上の 3つの四角形（ア＝もとの形、イ＝縦も横も 2倍、ウ＝横だけ 2倍）。四角形は、直角のある台形（辺は 6・5・2・3）
  const Q0 = [[0, 0], [6, 0], [2, 3], [0, 3]];
  const QA = Q0, QI = Q0.map(p => [p[0] * 2, p[1] * 2]), QU = Q0.map(p => [p[0] * 2, p[1]]);
  // 例題：△ABC（AB＝8、BC＝12、CA＝10）と、これを 1.5倍して 180°回した △DEF
  const T_ABC = tri3('BCA', 12, 10, 8);
  const T_DEF = mv(T_ABC, { s: 1.5, rot: 180, dx: 34, dy: 9.92, names: { A: 'D', B: 'E', C: 'F' } });
  // 演習プリント 図1：△ABC（AB＝10、BC＝12、CA＝8）と、これを 0.5倍して 90°回した △DEF
  const U_ABC = tri3('BCA', 12, 8, 10);
  const U_DEF = mv(U_ABC, { s: 0.5, rot: 90, dx: 17, dy: 0, names: { A: 'D', B: 'E', C: 'F' } });
  // 演習プリント 図2：方眼の直角三角形 ア〜エ（ア＝横 4・縦 2、イ＝ア の 1.5倍、ウ＝横 5・縦 3、エ＝ア を 90°回して 1.5倍）。ア・イ・エ が相似
  const G_TRI = { ア: [[0, 0], [4, 0], [0, 2]], イ: [[6, 0], [12, 0], [6, 3]], ウ: [[14, 0], [19, 0], [14, 3]], エ: [[24, 0], [21, 0], [24, 6]] };
  // 小テスト（1）：△ABC（AB＝2、BC＝3、CA＝4）と、これを 3倍した △DEF
  const Q_ABC = tri3('BCA', 3, 4, 2);
  const Q_DEF = mv(Q_ABC, { s: 3, dx: 6, dy: 0, names: { A: 'D', B: 'E', C: 'F' } });

  /* ---------------- 図 ---------------- */
  // 方眼：1目もり＝1cm のつもり。字は ア・イ・ウ だけ（辺の長さは、方眼をかぞえて調べる）
  const gridFig = SVG((W, H, h) => {
    const X0 = 1, cols = 36, rows = 6, s = Math.min((W - 2) / cols, (H - 9) / rows), ox = (W - cols * s) / 2, oy = 2 + rows * s;
    const x = c => ox + c * s, y = r => oy - r * s;
    let o = '';
    for (let c = 0; c <= cols; c++) o += h.ln(x(c), y(0), x(c), y(rows), '#c9d1d9', 0.15);
    for (let r = 0; r <= rows; r++) o += h.ln(x(0), y(r), x(cols), y(r), '#c9d1d9', 0.15);
    [[QA, 1, 'ア'], [QI, 9, 'イ'], [QU, 23, 'ウ']].forEach(([Q, off, nm]) => {
      o += `<polygon points="${Q.map(p => h.f2(x(p[0] + off)) + ',' + h.f2(y(p[1]))).join(' ')}" fill="#fff" stroke="#222" stroke-width="0.5" stroke-linejoin="round"/>`;
      o += h.tx(x(off + Math.max(...Q.map(p => p[0])) / 2), y(0) + 5.4, nm, 3.4, 'middle');
    });
    return o;
  });
  // 例題：△ABC と △DEF（長さは全部印刷）
  const triFig = (P1, P2, l1, l2, pad) => GEO({
    pts: Object.assign({}, P1, P2), poly: [Object.keys(P1).join(''), Object.keys(P2).join('')], pad: pad || 5,
    vl: Object.assign(vlOut(P1), vlOut(P2)), txt: sides(P1, l1).concat(sides(P2, l2))
  });
  const fig_ex = triFig(T_ABC, T_DEF, { AB: '8cm', BC: '12cm', CA: '10cm' }, { DE: '12cm', EF: '18cm', FD: '15cm' }, 6);
  const fig1 = cap(triFig(U_ABC, U_DEF, { AB: '10cm', BC: '12cm', CA: '8cm' }, { DE: '5cm', EF: '6cm', FD: '4cm' }, 5), '図1', { w: 1 });
  // 図2：方眼の直角三角形
  const fig2 = cap(SVG((W, H, h) => {
    const cols = 25, rows = 6, s = Math.min((W - 2) / cols, (H - 9) / rows), ox = (W - cols * s) / 2, oy = 1 + rows * s;
    const x = c => ox + c * s, y = r => oy - r * s;
    let o = '';
    for (let c = 0; c <= cols; c++) o += h.ln(x(c), y(0), x(c), y(rows), '#c9d1d9', 0.15);
    for (let r = 0; r <= rows; r++) o += h.ln(x(0), y(r), x(cols), y(r), '#c9d1d9', 0.15);
    Object.keys(G_TRI).forEach(nm => {
      const Q = G_TRI[nm];
      o += `<polygon points="${Q.map(p => h.f2(x(p[0] + 0.5)) + ',' + h.f2(y(p[1]))).join(' ')}" fill="#fff" stroke="#222" stroke-width="0.5" stroke-linejoin="round"/>`;
      o += h.tx(x(0.5 + (Math.min(...Q.map(p => p[0])) + Math.max(...Q.map(p => p[0]))) / 2), y(0) + 5.2, nm, 3.2, 'middle');
    });
    return o;
  }), '図2', { w: 1.5 });
  const figQ = cap(triFig(Q_ABC, Q_DEF, { AB: '2cm', BC: '3cm', CA: '4cm' }, { DE: '6cm', EF: '9cm', FD: '12cm' }, 5), '図', { w: 1 });

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  // 対応する順の三角形 s、t が相似か（3つの辺の比がすべて等しく、対応する角がすべて等しい）。比（t の辺 ÷ s の辺）も返す
  const simR = (P, Q, s, t) => { const r = [0, 1, 2].map(i => d(Q, t[i] + t[(i + 1) % 3]) / d(P, s[i] + s[(i + 1) % 3])); const okA = [0, 1, 2].every(i => near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(Q, t[i], t[(i + 1) % 3], t[(i + 2) % 3]))); return (near(r[0], r[1]) && near(r[1], r[2]) && okA) ? r[0] : null; };
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const simR = ' + simR + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  // 多角形（点の並び）の辺の長さ・角（度）
  const POLY = 'const sd = Q => Q.map((p, i) => Math.hypot(p[0] - Q[(i + 1) % Q.length][0], p[1] - Q[(i + 1) % Q.length][1])); const an = Q => Q.map((p, i) => { const a = Q[(i + Q.length - 1) % Q.length], b = Q[(i + 1) % Q.length]; const ux = a[0] - p[0], uy = a[1] - p[1], wx = b[0] - p[0], wy = b[1] - p[1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; });';

  IK.lesson('souji-01', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第1時', title: '「形が同じ」とは、どういうことだろう',
    summary: '方眼の上の3つの四角形から、ア と「形が同じ」といえるものを選び、辺の長さの比と角の大きさで説明する。相似・∽・相似比のことばと、相似な図形の性質（対応する辺の比が等しい・対応する角が等しい）をとらえる。',
    head: '相似な図形　第1時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ア（辺 6・5・2・3）の各辺と角を、イ・ウ とくらべる（座標から）。イ は 辺の比がすべて 2、角も同じ。ウ は 辺の比が 2・約1.7・2・1 で、角もちがう
      `(() => { ${POLY} const A = ${J(QA)}, I = ${J(QI)}, U = ${J(QU)}; const a = sd(A), i = sd(I), u = sd(U); const ri = i.map((v, k) => v / a[k]), ru = u.map((v, k) => v / a[k]); return near(a[0], 6) && near(a[1], 5) && near(a[2], 2) && near(a[3], 3) && ri.every(r => near(r, 2)) && an(I).every((v, k) => near(v, an(A)[k])) && !ru.every(r => near(r, ru[0])) && an(U).some((v, k) => !near(v, an(A)[k])) && near(ru[0], 2) && near(ru[3], 1); })()`,
      // 例題：△ABC∽△DEF（相似比 2：3）。AB に対応する辺は DE、∠C に対応する角は ∠F。座標から長さ・角を出して、図の字と合わせる
      chk('第1時 例題', `const P = ${J(T_ABC)}, Q = ${J(T_DEF)}; const R = simR(P, Q, 'ABC', 'DEF'); return near(d(P, 'AB'), 8) && near(d(P, 'BC'), 12) && near(d(P, 'CA'), 10) && near(d(Q, 'DE'), 12) && near(d(Q, 'EF'), 18) && near(d(Q, 'FD'), 15) && R !== null && near(R, 1.5) && near(d(P, 'AB') / d(Q, 'DE'), 2 / 3) && near(ang(P, 'C', 'A', 'B'), ang(Q, 'F', 'D', 'E'));`),
      // 演習プリント 図1（1）（2）：△ABC∽△DEF（相似比 2：1）。B に対応する頂点 E、辺 CA に対応する辺 FD、∠A に対応する角 ∠D
      chk('第1時 図1', `const P = ${J(U_ABC)}, Q = ${J(U_DEF)}; const R = simR(P, Q, 'ABC', 'DEF'); return near(d(P, 'AB'), 10) && near(d(P, 'BC'), 12) && near(d(P, 'CA'), 8) && near(d(Q, 'DE'), 5) && near(d(Q, 'EF'), 6) && near(d(Q, 'FD'), 4) && R !== null && near(R, 0.5) && near(d(P, 'AB') / d(Q, 'DE'), 2) && near(d(P, 'CA') / d(Q, 'FD'), 2) && near(ang(P, 'A', 'B', 'C'), ang(Q, 'D', 'E', 'F'));`),
      // （3）図2：直角三角形 ア・イ・エ・ウ。ア と相似なのは イ（各辺 1.5倍）と エ（回して 1.5倍）。ウ は ちがう。辺の長さ・角を座標から出して、相似を調べる
      `(() => { const T = ${J(G_TRI)}; const sdl = Q => [0, 1, 2].map(i => Math.hypot(Q[i][0] - Q[(i + 1) % 3][0], Q[i][1] - Q[(i + 1) % 3][1])).sort((x, y) => x - y); const simT = (Q1, Q2) => { const a = sdl(Q1), b = sdl(Q2); return near(b[0] / a[0], b[1] / a[1]) && near(b[1] / a[1], b[2] / a[2]); }; const right = Q => sdl(Q).map(v => v * v).sort((x, y) => x - y).slice(0, 2).reduce((x, y) => x + y) - sdl(Q).map(v => v * v).sort((x, y) => x - y)[2]; return ['イ', 'ウ', 'エ'].filter(n => simT(T['ア'], T[n])).join() === 'イ,エ' && ['ア', 'イ', 'ウ', 'エ'].every(n => near(right(T[n]), 0)) && near(sdl(T['イ'])[0] / sdl(T['ア'])[0], 1.5) && near(sdl(T['エ'])[2] / sdl(T['ア'])[2], 1.5) && near(T['ウ'][1][0] - T['ウ'][0][0], 5); })()`,
      // （4）四角形 ABCD∽四角形 EFGH、相似比 1：3、AB＝4、GH＝15、∠B＝70°：EF＝4×3＝12、CD＝15÷3＝5（GH に対応するのは CD）、∠F＝70°
      'near(4 * 3, 12) && near(15 / 3, 5) && near(4 / 12, 1 / 3) && near(5 / 15, 1 / 3)',
      // （5）△ABC∽△DEF、AB＝6、DE＝9、∠A＝50°、∠B＝60°：相似比 6：9＝2：3、∠C＝180−50−60＝70°＝∠F
      'near(6 / 9, 2 / 3) && near(180 - 50 - 60, 70)',
      // （6）△ABC∽△DEF、AB＝6、BC＝12、CA＝15、DE＝4：相似比 6：4＝3：2 → EF＝12÷3×2＝8、FD＝15÷3×2＝10（AB 6÷4＝BC 12÷8＝CA 15÷10）
      'near(6 / 4, 12 / 8) && near(12 / 8, 15 / 10) && near(12 / 1.5, 8) && near(15 / 1.5, 10)',
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：正方形・正三角形は、大きさがちがっても いつも相似（辺の比も角も同じ）。長方形（2×1 と 3×1）・ひし形（60°と 80°）・二等辺三角形（高さのちがう 2つ）は、いつでもは相似でない
      `(() => { ${POLY} const sim = (P, Q) => { const a = sd(P), b = sd(Q), x = an(P), y = an(Q); return a.length === b.length && b.every((v, k) => near(v / a[k], b[0] / a[0])) && y.every((v, k) => near(v, x[k])); }; const rect = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]], rh = t => [[0, 0], [1, 0], [1 + Math.cos(t * Math.PI / 180), Math.sin(t * Math.PI / 180)], [Math.cos(t * Math.PI / 180), Math.sin(t * Math.PI / 180)]], iso = (b, h) => [[0, 0], [b, 0], [b / 2, h]], eq = b => iso(b, b * Math.sqrt(3) / 2); return sim(rect(2, 2), rect(7, 7)) && sim(eq(2), eq(5)) && sim(rect(2, 1), rect(4, 2)) && !sim(rect(2, 1), rect(3, 1)) && !sim(rh(60), rh(80)) && sim(rh(60), rh(60)) && !sim(iso(2, 3), iso(2, 2)); })()`,
      // （8）周の長さ：相似比 2：5、△ABC の周 14 → △DEF の周 14×5÷2＝35。座標で確かめる（辺 4・5・5 の三角形を 2.5倍した三角形の周）
      chk('第1時 （8）', `const P = { A: [0, 0], B: [4, 0], C: [1, 4.8] }; const per = Q => d(Q, 'AB') + d(Q, 'BC') + d(Q, 'CA'); const k = 14 / per(P); const Q = {}; Object.keys(P).forEach(n => { Q[n] = [P[n][0] * k * 2.5, P[n][1] * k * 2.5]; }); return near(per(P) * k, 14) && near(per(Q), 35) && near(14 * 5 / 2, 35) && near(35 / 14, 5 / 2);`),
      // 小テスト（1）（2）：△ABC∽△DEF（AB＝2、BC＝3、CA＝4 → DE＝6、EF＝9、FD＝12。相似比 1：3）。C に対応する頂点 F、AB に対応する辺 DE、∠B に対応する角 ∠E
      chk('第1時 小テスト（1）', `const P = ${J(Q_ABC)}, Q = ${J(Q_DEF)}; const R = simR(P, Q, 'ABC', 'DEF'); return near(d(P, 'AB'), 2) && near(d(P, 'BC'), 3) && near(d(P, 'CA'), 4) && near(d(Q, 'DE'), 6) && near(d(Q, 'EF'), 9) && near(d(Q, 'FD'), 12) && R !== null && near(R, 3) && near(d(P, 'AB') / d(Q, 'DE'), 1 / 3) && near(ang(P, 'B', 'C', 'A'), ang(Q, 'E', 'F', 'D'));`),
      // 小テスト（3）相似比 2：3、AB＝8 → EF＝8×3÷2＝12　（4）∠A＝50°、∠B＝70° → ∠F＝∠C＝180−50−70＝60°
      'near(8 * 3 / 2, 12) && near(180 - 50 - 70, 60)',
      // 小テスト（5）チャレンジ：正三角形は、大きさがちがっても いつも相似（角はどれも 60°・辺の比は 1：1：1）。ひし形は、辺の比がどれも 1 でも、角（60°と 80°）がちがうと相似でない
      `(() => { ${POLY} const sim = (P, Q) => { const a = sd(P), b = sd(Q), x = an(P), y = an(Q); return a.length === b.length && b.every((v, k) => near(v / a[k], b[0] / a[0])) && y.every((v, k) => near(v, x[k])); }; const rh = t => [[0, 0], [1, 0], [1 + Math.cos(t * Math.PI / 180), Math.sin(t * Math.PI / 180)], [Math.cos(t * Math.PI / 180), Math.sin(t * Math.PI / 180)]], iso = (b, h) => [[0, 0], [b, 0], [b / 2, h]], eq = b => iso(b, b * Math.sqrt(3) / 2); return [1, 2, 3.5, 9].every(b => sim(eq(1), eq(b)) && an(eq(b)).every(v => near(v, 60))) && sd(rh(60)).every(v => near(v, 1)) && sd(rh(80)).every(v => near(v, 1)) && !sim(rh(60), rh(80)); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('「形が同じ」とは、どういうことかを考えよう'),
      K('今日の問い', '方眼に、四角形 ア・イ・ウ がある。ア と「形が同じ」といえるのは、イ と ウ のどちらだろう。辺の長さや角をくらべて、「形が同じ」とはどういうことか、考えよう。', 3),
      F(5, gridFig),
      T('①', '自分の考え（3分）　くらべたことを書こう。', 1),
      B(3, '（例）イ … ア の辺が、どれも 2倍（横 6→12、縦 3→6、ななめ も 2倍）。角は同じ。\nウ … 横だけ 2倍で、縦は同じ。ななめの辺も、角も、ア とちがう。\n「形が同じ」とは、対応する辺の比がすべて等しく、対応する角が等しいこと。'),
      T('②', 'ペアの考え（3分）　自分とちがう くらべ方を書こう。', 1),
      B(2, ''),
      WD('形を変えずに拡大・縮小した図形は、{{相似}}である。\n相似は {{∽}} で表し、△ABC∽△DEF と書く。\n（△ABC 相似 △DEF と読む。対応する頂点の順に書く）\n対応する辺の{{比}}は、すべて等しい。\nこの比を{{相似比}}という。\n対応する{{角}}は、それぞれ等しい。', 6, { label: 'ことば（教科書で調べよう）' }),
      K('例題', '右の図で、△ABC∽△DEF である。表を完成させよう。', 1),
      F(4, fig_ex),
      TB('', null, [
        ['(1) 辺 AB に対応する辺', ['辺 {{DE}}']],
        ['(2) ∠C に対応する角', ['∠{{F}}']],
        ['(3) 相似比 AB：DE', ['{{2：3}}']]
      ], { hw: 60 }),
      T('', '【書き方のくふう】∽ の左と右で、頂点を書く順番をそろえるのはなぜだろう。', 1),
      B(2, '順にそろえて書けば、A と D、B と E、C と F のように、\n対応する頂点が、記号を見るだけでわかる。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 形を変えずに拡大・縮小した図形を、{{相似}}な図形という。\n② 相似な図形で、対応する辺の長さの比を{{相似比}}という。\n③ 相似な図形では、対応する{{角}}は、それぞれ等しい。\n④ △ABC と △DEF が相似であることを、△ABC{{∽}}△DEF と表す。', 4, { label: 'ことば' }),
      F(5, fig1, fig2),
      C2([
        T('（1）', '図1で、△ABC∽△DEF のとき、次に対応するものを答えよう。\nア 頂点 B　イ 辺 CA　ウ ∠A', 4),
        B(2, 'ア 頂点 E　　イ 辺 FD\nウ ∠D')
      ], [
        T('（2）', '図1で、△ABC と △DEF の相似比を、もっとも簡単な整数の比で答えよう。', 4),
        B(2, 'AB：DE＝10：5＝2：1')
      ], '1:1'),
      MA('【説明】「形が同じ」とは、どういうことか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '相似の性質を使って、長さや角を求めよう。'),
      C2([
        T('（3）', '図2のア〜エのうち、ア と相似なものを、すべて選ぼう。', 2),
        B(3, 'イ、エ\n（ア の 2辺を 1.5倍した形。\nエ は 90° 回した形）')
      ], [
        T('（4）', '四角形 ABCD∽四角形 EFGH で、相似比は 1：3 である。AB＝4cm、GH＝15cm、∠B＝70° のとき、EF、CD の長さと、∠F の大きさを求めよう。', 4),
        B(3, 'EF＝4×3＝12（cm）\nCD＝15÷3＝5（cm）\n∠F＝∠B＝70°')
      ], '1:1'),
      C2([
        T('（5）', '△ABC∽△DEF で、AB＝6cm、DE＝9cm、∠A＝50°、∠B＝60° である。① 相似比 ② ∠F を求めよう。', 3),
        B(3, '① 6：9＝2：3\n② ∠C＝180°−50°−60°＝70°\n　 ∠F＝∠C＝70°')
      ], [
        T('（6）', '△ABC∽△DEF で、AB＝6cm、BC＝12cm、CA＝15cm、DE＝4cm である。EF、FD の長さを求めよう。', 3),
        B(3, '相似比 6：4＝3：2\nEF＝12÷3×2＝8（cm）\nFD＝15÷3×2＝10（cm）')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：どんな図形が、いつでも相似といえるか調べよう。'),
      T('（7）', '次の図形は、いつでも相似といえるだろうか。表に ○ か × を書こう。', 1),
      TB('図形', ['正方形', '長方形', '円', 'ひし形', '二等辺三角形', '正三角形'], [
        ['いつでも相似？', ['', '', '', '', '', '']]
      ], { hw: 36 }),
      C2([
        T('', '× にしたものは、相似でない 2つの例を、図にかこう', 2),
        B(10, '')
      ], [
        T('', '○ にしたものに、共通することは何か', 2),
        B(10, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC∽△DEF で、相似比は 2：5 である。△ABC の周の長さが 14cm のとき、△DEF の周の長さを求めよう。また、そのわけを、3辺の長さを使って説明しよう。', 5),
        B(7, '3辺を AB＝a、BC＝b、CA＝c とすると\nDE＝[[5/2]]a、EF＝[[5/2]]b、FD＝[[5/2]]c\n△DEF の周\n＝[[5/2]](a+b+c)\n＝[[5/2]]×14＝35（cm）')
      ], [
        MA('① △ABC の 3辺を a、b、c として、△DEF の 3辺を、相似比を使って表してみよう。\n② 周の長さは、3辺の長さの和だったね。', 12, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図で、△ABC∽△DEF である。次を答えよう。（3点）\nア 頂点 C に対応する頂点　イ 辺 AB に対応する辺　ウ ∠B に対応する角', 3),
      F(4, figQ),
      B(2, 'ア 頂点 F　　イ 辺 DE　　ウ ∠E'),
      T('（2）', '（1）の △ABC と △DEF の相似比を答えよう。（2点）', 1),
      B(2, 'AB：DE＝2：6＝1：3'),
      T('（3）', '四角形 ABCD∽四角形 EFGH で、相似比は 2：3 である。AB＝8cm のとき、辺 EF の長さを求めよう。（2点）', 2),
      B(2, 'EF＝8÷2×3＝12（cm）'),
      T('（4）', '△ABC∽△DEF で、∠A＝50°、∠B＝70° のとき、∠F の大きさを求めよう。（3点）', 2),
      B(3, '∠C＝180°−50°−70°＝60°\n∠F＝∠C＝60°'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '「2つの正三角形」と「2つのひし形」は、それぞれ、いつでも相似といえるか。わけも書こう。', 2),
      B(4, '正三角形 … いえる。角は どれも 60° で、辺の比も 1：1：1 だから。\nひし形 … いえない。辺の比は同じでも、角の大きさが ちがうひし形がある。')
    ]
  });
})();
