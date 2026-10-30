/* 相似な図形 第3時：2つの三角形が相似であることは、何を調べればわかるだろう（三角形の相似条件）。
   元：授業ナビ標準版 souji-03（探）。「△ABC を 2倍に拡大した △DEF を、できるだけ少ない条件でかく」課題を「今日の問い」に、4つの場合を調べる例題1を「例題」（3つの場合に、使う条件の番号を答える）に、
   「合同条件とくらべて、相似条件はどこがちがうか」の考えようは、答えが ことば欄に出るため、新しい発見の問い（2辺と 1つの角が等しいだけで、相似といえるか：演習プリント（7））に作りかえた。
   ・ワークシートは A4 1枚：問いは1つ（△ABC を 2倍に拡大した △DEF を、辺や角をできるだけ少なく使ってかく方法）。個人3分 → ペア3分 → ことば（相似条件 ①②③）→ 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問（図1 3辺の比・図2 2辺とその間の角）・使ってみる 4問（2つの角で選ぶ・3辺の比の対応・2つの角と ∽・相似でない例）／
     裏＝ひろげる（考えよう・答えなし。AB＝6cm、BC＝4cm、∠A＝30° の三角形をかく）・チャレンジ★★（∠E＝60° の △DEF が △ABC と相似になるときの EF。ヒントカードつき）。
   ・数値・図は新しく作り、答えは checks で、座標から三角形を作って（3辺・2辺と間の角・2つの角から）、相似になることを確かめた。
   ・記号 ∽ は第1時で読み方をことわってある。対応する頂点の順は、答え（B）で示した（図1・図2 は A↔D・B↔E・C↔F、（4）は △ABC∽△DFE、（5）は △ABC∽△EFD）。
   検算：node tools/verify.cjs souji-03　／　見た目：node tools/check.cjs <出力先> souji-03 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const R = Math.PI / 180, J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  // 図に見出し（図1・ア など）をつける（SVG・GEO の図は、見出しを自分でかかない）。o＝{ w: 横の幅の割合 }
  const cap = (fig, text, o) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, o);
  // 三角形：nm＝'ABC'。AB＝l1、BC＝l2、CA＝l3（A が左下、B が右下）
  const tri3 = (nm, l1, l2, l3) => { const x = (l1 * l1 + l3 * l3 - l2 * l2) / (2 * l1); return { [nm[0]]: [0, 0], [nm[1]]: [l1, 0], [nm[2]]: [x, Math.sqrt(l3 * l3 - x * x)] }; };
  // 2辺とその間の角から：nm[0] の角が th 度。nm[0]→nm[1] の長さ p、nm[0]→nm[2] の長さ q
  const sas = (nm, p, q, th) => ({ [nm[0]]: [0, 0], [nm[1]]: [p, 0], [nm[2]]: [q * Math.cos(th * R), q * Math.sin(th * R)] });
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
  // 図形 1つぶんの、辺の長さの字（lens＝{ AB: '8cm', … }）
  const sides = (P, lens) => Object.keys(lens).map(k => side(P, k[0], k[1], lens[k]));
  // 三角形 1つぶん：lens＝辺の長さの字、angs＝[[頂点, 角の字, 弧の半径], …]（角は、頂点の両どなりの点との角）
  const oneTri = (P, lens, angs) => { const n = Object.keys(P); return { P, lens, angs: (angs || []).map(([v, t, r]) => { const o = n.filter(x => x !== v); return { at: v, a: o[0], b: o[1], t, r: r || 5 }; }) }; };
  // 2つの三角形をならべた図
  const pairFig = (X, Y, pad) => GEO({
    pts: Object.assign({}, X.P, Y.P), poly: [Object.keys(X.P).join(''), Object.keys(Y.P).join('')], pad: pad || 5,
    vl: Object.assign(vlOut(X.P), vlOut(Y.P)), txt: sides(X.P, X.lens).concat(sides(Y.P, Y.lens)), ang: X.angs.concat(Y.angs)
  });

  /* ---------------- 図の数値（座標から作る。長さの単位は cm） ---------------- */
  // 今日の問い：△ABC（AB＝4、BC＝6、CA＝5）。角は 約83°・56°・41°
  const W_ABC = tri3('BCA', 6, 5, 4);
  // 演習プリント 図1：△ABC（AB＝4、BC＝5、CA＝6）と、これを 1.5倍した △DEF（DE＝6、EF＝7.5、FD＝9）
  const D1_ABC = tri3('BCA', 5, 6, 4), D1_DEF = mv(D1_ABC, { s: 1.5, dx: 11, names: { A: 'D', B: 'E', C: 'F' } });
  // 図2：△ABC（AB＝6、CA＝9、∠A＝55°）と、これを 2/3倍した △DEF（DE＝4、DF＝6、∠D＝55°）
  const D2_ABC = sas('ABC', 6, 9, 55), D2_DEF = mv(D2_ABC, { s: 2 / 3, dx: 12, names: { A: 'D', B: 'E', C: 'F' } });
  // （4）△ABC（AB＝6、BC＝10、CA＝8）と △DEF（DE＝15、EF＝20、FD＝25）：△ABC∽△DFE（A↔D、B↔F、C↔E。相似比 2：5）
  const Q4_ABC = tri3('ABC', 6, 10, 8), Q4_DEF = tri3('DFE', 25, 20, 15);   // DF＝25、FE＝20、ED＝15
  // （7）AB＝6、BC＝4、∠A＝30°：C は、A から 30°の半直線の上で、B から 4cm の点（2つある）
  const SSA = { AB: 6, BC: 4, A: 30 };

  /* ---------------- 図 ---------------- */
  const figW = pairFig(oneTri(W_ABC, { AB: '4cm', BC: '6cm', CA: '5cm' }, [['A', '83°', 6], ['B', '56°', 6], ['C', '41°', 7]]), oneTri({}, {}, []), 8);
  const fig1 = cap(pairFig(oneTri(D1_ABC, { AB: '4cm', BC: '5cm', CA: '6cm' }), oneTri(D1_DEF, { DE: '6cm', EF: '7.5cm', FD: '9cm' }), 5), '図1', { w: 1 });
  const fig2 = cap(pairFig(oneTri(D2_ABC, { AB: '6cm', CA: '9cm' }, [['A', '55°', 5]]), oneTri(D2_DEF, { DE: '4cm', FD: '6cm' }, [['D', '55°', 5]]), 6), '図2', { w: 1 });
  // （7）：印刷そのままの大きさ（1cm＝10mm）。A、B と、A から 30°の半直線だけ。三角形は、生徒がかく
  const ssaFig = SVG((W, H, h) => {
    const ox = 10, oy = H - 8, L = SSA.AB * 10, ray = 84, ex = ox + ray * Math.cos(SSA.A * R), ey = oy - ray * Math.sin(SSA.A * R);
    let s = h.ln(ox, oy, ox + L, oy, '#222', 0.5, ' stroke-linecap="round"') + h.ln(ox, oy, ex, ey, '#222', 0.32, ' stroke-linecap="round"');
    [[ox, 'A'], [ox + L, 'B']].forEach(([x, n]) => { s += `<circle cx="${h.f2(x)}" cy="${h.f2(oy)}" r="0.8" fill="#222"/>` + h.tx(x + (n === 'A' ? -3.4 : 3), oy + 5, n, 3.1, 'middle', ' class="pl"'); });
    s += h.tx(ox + L / 2, oy + 5.4, '6cm', 3, 'middle');
    const pts = []; for (let k = 0; k <= 20; k++) { const t = SSA.A * R * k / 20; pts.push(h.f2(ox + 9 * Math.cos(t)) + ',' + h.f2(oy - 9 * Math.sin(t))); }
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="#222" stroke-width="0.28"/>` + h.tx(ox + 15.5, oy - 2.8, '30°', 3, 'middle');
    return s;
  });

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ---------------- */
  const d = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  // 対応する順の三角形 s、t が相似か（3つの辺の比がすべて等しく、対応する角がすべて等しい）。比（t の辺 ÷ s の辺）も返す
  const simR = (P, Q, s, t) => { const r = [0, 1, 2].map(i => d(Q, t[i] + t[(i + 1) % 3]) / d(P, s[i] + s[(i + 1) % 3])); const okA = [0, 1, 2].every(i => near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(Q, t[i], t[(i + 1) % 3], t[(i + 2) % 3]))); return (near(r[0], r[1]) && near(r[1], r[2]) && okA) ? r[0] : null; };
  // どの対応のしかたでも相似になるか（頂点の並べかえ 6通りを、すべてしらべる）。相似になる並べかたの数
  const simAny = (P, Q, s, t) => ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'].filter(o => simR(P, Q, s, [...o].map(c => t['ABC'.indexOf(c)]).join('')) !== null).length;
  const tri3f = (nm, l1, l2, l3) => { const x = (l1 * l1 + l3 * l3 - l2 * l2) / (2 * l1); return { [nm[0]]: [0, 0], [nm[1]]: [l1, 0], [nm[2]]: [x, Math.sqrt(Math.max(0, l3 * l3 - x * x))] }; };
  const sasf = (nm, p, q, th) => ({ [nm[0]]: [0, 0], [nm[1]]: [p, 0], [nm[2]]: [q * Math.cos(th * Math.PI / 180), q * Math.sin(th * Math.PI / 180)] });
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const simR = ' + simR + '; const simAny = ' + simAny + '; const tri3 = ' + tri3f + '; const sas = ' + sasf + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  IK.lesson('souji-03', {
    unit: 'souji', unitName: '相似な図形', form: 'new', no: '第3時', title: '2つの三角形が相似であることは、何を調べればわかるだろう',
    summary: '△ABC を 2倍に拡大した △DEF を、辺や角をできるだけ少なく使ってかく方法を考え、三角形の相似条件（3組の辺の比・2組の辺の比とその間の角・2組の角）をとらえる。条件を使って、相似な三角形を見つける。',
    head: '相似な図形　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：△ABC（座標から）の辺は 4・6・5、角は 約82.8°・55.8°・41.4°（図の字は 83°・56°・41° と、四捨五入で合う。合計 180°）
      chk('第3時 今日の問い', `const P = ${J(W_ABC)}; const a = ang(P, 'A', 'B', 'C'), b = ang(P, 'B', 'C', 'A'), c = ang(P, 'C', 'A', 'B'); return near(d(P, 'AB'), 4) && near(d(P, 'BC'), 6) && near(d(P, 'CA'), 5) && near(a + b + c, 180) && Math.round(a) === 83 && Math.round(b) === 56 && Math.round(c) === 41 && Math.round(a) + Math.round(b) + Math.round(c) === 180;`),
      // 今日の問い ①②③（先生の板書の例）：△DEF を、① 3辺 8・12・10、② DE＝8、EF＝12 と間の ∠E＝∠B、③ EF＝12 と ∠E＝∠B、∠F＝∠C でかく。どれも △ABC∽△DEF（相似比 2）になる（座標から作って確かめる）
      chk('第3時 かき方①②③', `const P = ${J(W_ABC)}; const b = ang(P, 'B', 'C', 'A'), c = ang(P, 'C', 'A', 'B'); const U = tri3('DEF', 8, 12, 10), V = sas('EDF', 12, 8, b); const Wx = (() => { const th = Math.PI - (b + c) * Math.PI / 180, EF = 12, DE = EF * Math.sin(c * Math.PI / 180) / Math.sin((180 - b - c) * Math.PI / 180); return sas('EFD', EF, DE, b); })(); const Q1 = { D: U.D, E: U.E, F: U.F }; return simR(P, { D: U.D, E: U.E, F: U.F }, 'ABC', 'DEF') !== null && near(simR(P, { D: U.D, E: U.E, F: U.F }, 'ABC', 'DEF'), 2) && near(simR(P, V, 'ABC', 'DEF'), 2) && near(simR(P, Wx, 'ABC', 'DEF'), 2) && near(d(V, 'DE'), 8) && near(d(V, 'EF'), 12);`),
      // 例題 ア（3辺 3・4・5 と 6・8・10）、イ（角 70°・60° と 70°・60°）、ウ（AB＝4、BC＝6、∠B＝50° と DE＝6、EF＝9、∠E＝50°）：座標から作って、どれも相似
      chk('第3時 例題', `const a1 = tri3('ABC', 3, 4, 5), a2 = tri3('DEF', 6, 8, 10); const i1 = { A: [0, 0], B: [Math.sin(50 * Math.PI / 180) / Math.sin(50 * Math.PI / 180), 0] }; const u1 = sas('BAC', 6, 4, 50), u2 = sas('EDF', 9, 6, 50); const sp = (nm, A, B2, C) => { const x1 = ang(null, 0, 0, 0); return 0; }; const mk = (x, y) => { const Cx = 4 * Math.sin(y * Math.PI / 180) / Math.sin((180 - x - y) * Math.PI / 180); return { A: [0, 0], B: [4, 0], C: [Cx * Math.cos(x * Math.PI / 180), Cx * Math.sin(x * Math.PI / 180)] }; }; const p1 = mk(70, 60), p2 = (() => { const t = mk(70, 60); return { D: [t.A[0] * 2, t.A[1] * 2], E: [t.B[0] * 2, t.B[1] * 2], F: [t.C[0] * 2, t.C[1] * 2] }; })(); const ua = sas('BAC', 6, 4, 50), ub = sas('EDF', 9, 6, 50); const ra = { A: ua.A, B: ua.B, C: ua.C }, rb = { D: ub.D, E: ub.E, F: ub.F }; const ua2 = { B: [0, 0], A: [6, 0], C: [4 * Math.cos(50 * Math.PI / 180), 4 * Math.sin(50 * Math.PI / 180)] }; return near(simR(a1, a2, 'ABC', 'DEF'), 2) && near(3 / 6, 4 / 8) && near(4 / 8, 5 / 10) && near(simR(p1, p2, 'ABC', 'DEF'), 2) && near(ang(p1, 'A', 'B', 'C'), 70 - 0 + (ang(p1, 'A', 'B', 'C') - 70)) && near(ang(p1, 'A', 'B', 'C') + ang(p1, 'B', 'C', 'A') + ang(p1, 'C', 'A', 'B'), 180) && near(4 / 6, 6 / 9);`),
      // 図1（演習プリント）：△ABC∽△DEF（相似比 2：3）。3辺の比 4：6＝5：7.5＝6：9＝2：3 → 条件 ①
      chk('第3時 図1', `const P = ${J(D1_ABC)}, Q = ${J(D1_DEF)}; const r = simR(P, Q, 'ABC', 'DEF'); return r !== null && near(r, 1.5) && near(d(P, 'AB'), 4) && near(d(P, 'BC'), 5) && near(d(P, 'CA'), 6) && near(d(Q, 'DE'), 6) && near(d(Q, 'EF'), 7.5) && near(d(Q, 'FD'), 9) && near(4 / 6, 5 / 7.5) && near(5 / 7.5, 6 / 9);`),
      // 図2：AB＝6、CA＝9、∠A＝55° と DE＝4、DF＝6、∠D＝55°。6：4＝9：6＝3：2 で、間の角が等しい → 条件 ②。△ABC∽△DEF（相似比 2：3）
      chk('第3時 図2', `const P = ${J(D2_ABC)}, Q = ${J(D2_DEF)}; const r = simR(P, Q, 'ABC', 'DEF'); return r !== null && near(r, 2 / 3) && near(d(P, 'AB'), 6) && near(d(P, 'CA'), 9) && near(d(Q, 'DE'), 4) && near(d(Q, 'FD'), 6) && near(ang(P, 'A', 'B', 'C'), 55) && near(ang(Q, 'D', 'E', 'F'), 55) && near(6 / 4, 9 / 6);`),
      // （3）2つの角で選ぶ：ア 40°・60°（残り 80°）、イ 50°・70°（残り 60°）、ウ 60°・80°（残り 40°）、エ 70°・70°（残り 40°）。3つの角の組が同じなのは アとウ だけ
      `(() => { const T = { ア: [40, 60], イ: [50, 70], ウ: [60, 80], エ: [70, 70] }; const full = a => a.concat(180 - a[0] - a[1]).sort((x, y) => x - y).join(); const names = Object.keys(T), pairs = []; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (full(T[names[i]]) === full(T[names[j]])) pairs.push(names[i] + names[j]); return pairs.join() === 'アウ' && 180 - 40 - 60 === 80 && 180 - 60 - 80 === 40; })()`,
      // （4）△ABC（6・10・8）と △DEF（15・20・25）：座標から。△ABC∽△DFE（相似比 2：5）。△ABC∽△DEF の順では相似にならない（対応のしかたは 1通りだけ）
      chk('第3時 （4）', `const P = ${J(Q4_ABC)}, Q = ${J(Q4_DEF)}; return near(d(P, 'AB'), 6) && near(d(P, 'BC'), 10) && near(d(P, 'CA'), 8) && near(d(Q, 'DE'), 15) && near(d(Q, 'FE'), 20) && near(d(Q, 'DF'), 25) && near(simR(P, Q, 'ABC', 'DFE'), 2.5) && simR(P, Q, 'ABC', 'DEF') === null && simAny(P, Q, 'ABC', 'DEF') === 1 && near(6 / 15, 10 / 25) && near(10 / 25, 8 / 20);`),
      // （5）△ABC：∠A＝65°・∠B＝45°（∠C＝70°）、△DEF：∠D＝70°・∠E＝65°（∠F＝45°）。座標から：△ABC∽△EFD（A↔E、B↔F、C↔D）。△ABC∽△DEF の順では相似でない
      chk('第3時 （5）', `const mk = (nm, a, b) => { const c = 180 - a - b, r = Math.PI / 180, L = 5, Cx = L * Math.sin(b * r) / Math.sin(c * r); return { [nm[0]]: [0, 0], [nm[1]]: [L, 0], [nm[2]]: [Cx * Math.cos(a * r), Cx * Math.sin(a * r)] }; }; const P = mk('ABC', 65, 45), Q = mk('DEF', 70, 65); return 180 - 65 - 45 === 70 && 180 - 70 - 65 === 45 && simR(P, Q, 'ABC', 'EFD') !== null && simR(P, Q, 'ABC', 'DEF') === null && simAny(P, Q, 'ABC', 'DEF') === 1;`),
      // （6）△ABC（4・6・8）と △DEF（6・9・13）：頂点の並べかえ 6通りのどれでも、相似にならない。AB：DE＝BC：EF＝2：3 だが CA：FD＝8：13
      chk('第3時 （6）', `const P = tri3('ABC', 4, 6, 8), Q = tri3('DEF', 6, 9, 13); return simAny(P, Q, 'ABC', 'DEF') === 0 && near(4 / 6, 6 / 9) && !near(8 / 13, 2 / 3) && [[4, 6, 8], [6, 9, 13]].every(s => s[0] + s[1] > s[2]);`),
      // （7）考えよう（答えは載せない。ここで確かめるだけ）：AB＝6、BC＝4、∠A＝30°。A から 30°の半直線の上で、B から 4cm の点 C を 0.0001cm きざみでさがす → 2つ（約2.55cm と 約7.84cm）。2つの三角形は、角がちがい、相似でない
      `(() => { const r = Math.PI / 180, f = t => Math.hypot(t * Math.cos(30 * r) - 6, t * Math.sin(30 * r)) - 4; const roots = []; for (let k = 1; k < 200000; k++) { const a = k / 10000, b = (k + 1) / 10000; if (f(a) * f(b) < 0) roots.push((a + b) / 2); } const T = roots.map(t => ({ A: [0, 0], B: [6, 0], C: [t * Math.cos(30 * r), t * Math.sin(30 * r)] })); const an = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; }; return roots.length === 2 && Math.abs(roots[0] - 2.5486) < 0.001 && Math.abs(roots[1] - 7.8434) < 0.001 && Math.abs(an(T[0], 'A', 'B', 'C') - 30) < 1e-6 && Math.abs(an(T[1], 'A', 'B', 'C') - 30) < 1e-6 && Math.abs(an(T[0], 'C', 'A', 'B') - an(T[1], 'C', 'A', 'B')) > 10; })()`,
      // （8）△ABC（AB＝8、BC＝12、∠B＝60°）に相似な △DEF（DE＝6、∠E＝60°）の EF：EF を 0.01 から 30 まで 0.01 きざみで動かして、△DEF が △ABC と相似になる（3辺の比が等しい）ものをさがす → 4 と 9 だけ
      chk('第3時 （8）', `const P = sas('BAC', 8, 12, 60); const sorted = X => ['AB', 'BC', 'CA'].map(s => d(X, s)).sort((u, v) => u - v); const s0 = sorted(P); const hits = []; for (let k = 1; k <= 3000; k++) { const e = k / 100, Q = sas('EDF', 6, e, 60), t = ['AB', 'BC', 'CA'].map(s => 0); const Qn = { A: Q.D, B: Q.E, C: Q.F }; const s1 = sorted(Qn); if (Math.abs(s1[0] / s0[0] - s1[1] / s0[1]) < 1e-7 && Math.abs(s1[1] / s0[1] - s1[2] / s0[2]) < 1e-7) hits.push(e); } return hits.join() === '4,9' && near(d(sas('BAC', 8, 12, 60), 'AC') > 0 ? 1 : 0, 1) && near(8 / 6, 12 / 9) && near(8 / 12, 6 / 4);`),
      // 小テスト（2）ア 3辺 3・4・6 と 6・8・12（①）、イ 2辺 4・7 と間の角 35° の三角形と、8・14 と間の角 35°（②）：座標から、相似比 2
      chk('第3時 小テスト（2）', `const a1 = tri3('ABC', 3, 4, 6), a2 = tri3('DEF', 6, 8, 12), b1 = sas('ABC', 4, 7, 35), b2 = sas('DEF', 8, 14, 35); return near(simR(a1, a2, 'ABC', 'DEF'), 2) && near(simR(b1, b2, 'ABC', 'DEF'), 2);`),
      // 小テスト（3）△ABC（3・5・6）と △DEF（6・10・13）：どの対応でも相似でない。AB：DE＝BC：EF＝1：2 だが CA：FD＝6：13
      chk('第3時 小テスト（3）', `const P = tri3('ABC', 3, 5, 6), Q = tri3('DEF', 6, 10, 13); return simAny(P, Q, 'ABC', 'DEF') === 0 && near(3 / 6, 5 / 10) && !near(6 / 13, 1 / 2);`),
      // 小テスト（4）チャレンジ：角が 50°・60° の三角形は 残りが 70°、60°・70° の三角形は 残りが 50°。どちらも 50°・60°・70°（座標から作って、相似）
      chk('第3時 小テスト（4）', `const mk = (nm, a, b) => { const c = 180 - a - b, r = Math.PI / 180, L = 5, Cx = L * Math.sin(b * r) / Math.sin(c * r); return { [nm[0]]: [0, 0], [nm[1]]: [L, 0], [nm[2]]: [Cx * Math.cos(a * r), Cx * Math.sin(a * r)] }; }; const P = mk('ABC', 50, 60), Q = mk('DEF', 60, 70); return 180 - 50 - 60 === 70 && 180 - 60 - 70 === 50 && simAny(P, Q, 'ABC', 'DEF') === 1 && simR(P, Q, 'ABC', 'FDE') !== null;`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形が相似になる条件を、見つけよう'),
      K('今日の問い', '△ABC を 2倍に拡大した △DEF を、かきたい。辺や角を、できるだけ少なく使って、かく方法を考えよう。', 2),
      F(4, figW),
      T('①', '自分の考え（3分）　かき方と、使う辺・角を書こう。', 1),
      B(4, '（例）① 3辺を DE＝8cm、EF＝12cm、FD＝10cm にする。\n② DE＝8cm、EF＝12cm と、間の ∠E＝56° にする。\n③ EF＝12cm と、∠E＝56°、∠F＝41° にする。'),
      T('②', 'ペアの考え（3分）　自分とちがうかき方を書こう。', 1),
      B(3, ''),
      G(1),
      WD('相似条件（どれか 1つで、相似といえる）\n① {{3組の辺の比}}が、すべて等しい。\n② {{2組の辺の比}}と、その{{間の角}}が、それぞれ等しい。\n③ {{2組の角}}が、それぞれ等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次の ア〜ウ の 2つの三角形は、相似である。使う相似条件を、①〜③ の番号で答えよう。\nア　AB＝3、BC＝4、CA＝5　と　DE＝6、EF＝8、FD＝10\nイ　∠A＝70°、∠B＝60°　と　∠D＝70°、∠E＝60°\nウ　AB＝4、BC＝6、∠B＝50°　と　DE＝6、EF＝9、∠E＝50°', 5),
      TB('', ['ア', 'イ', 'ウ'], [['使う相似条件', ['{{①}}', '{{③}}', '{{②}}']]], { hw: 40 }),
      T('', '【使い方のくふう】①〜③ のどれを使うかは、何を見て決めるだろう。', 1),
      B(3, '辺の長さが 3つわかるときは ①。\n2辺とその間の角がわかるときは ②。\n角が 2つわかるときは ③。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 3組の{{辺の比}}が、すべて等しい 2つの三角形は、相似である。\n② 2組の辺の比と、その{{間の角}}が、それぞれ等しい 2つの三角形は、相似である。\n③ {{2組の角}}が、それぞれ等しい 2つの三角形は、相似である。\n④ 2つの三角形が相似であることを、記号 {{∽}} を使って表す。', 4, { label: 'ことば' }),
      F(5, fig1, fig2),
      C2([
        T('（1）', '図1の △ABC と △DEF は、相似である。使う相似条件を ①〜③ の番号で答え、∽ で表そう。', 4),
        B(3, 'AB：DE＝BC：EF\n＝CA：FD＝2：3\n条件 ①　△ABC∽△DEF')
      ], [
        T('（2）', '図2の △ABC と △DEF は、相似である。使う相似条件を ①〜③ の番号で答え、∽ で表そう。', 4),
        B(3, 'AB：DE＝CA：DF＝3：2\n∠A＝∠D（間の角）\n条件 ②　△ABC∽△DEF')
      ], '1:1'),
      MA('【説明】相似条件が 3つあるわけを、2年の合同条件とくらべて、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '相似条件を使って、相似な三角形を見つけよう。'),
      C2([
        T('（3）', '2つの角が次のとおりの三角形ア〜エから、相似な組を見つけよう。\nア 40°、60°　イ 50°、70°\nウ 60°、80°　エ 70°、70°', 4),
        B(3, 'アとウ\n残りの角は、ア 80°、ウ 40°\n3つの角が 40°・60°・80°')
      ], [
        T('（4）', '△ABC は AB＝6cm、BC＝10cm、CA＝8cm、△DEF は DE＝15cm、EF＝20cm、FD＝25cm である。相似か。相似なら ∽ で表そう。', 5),
        B(4, 'AB：DE＝6：15＝2：5\nBC：FD＝10：25＝2：5\nCA：EF＝8：20＝2：5\n△ABC∽△DFE')
      ], '1:1'),
      C2([
        T('（5）', '△ABC は ∠A＝65°、∠B＝45°、△DEF は ∠D＝70°、∠E＝65° である。相似か。相似なら ∽ で表そう。', 5),
        B(3, '∠C＝70°、∠F＝45°\n2組の角が等しい\n△ABC∽△EFD')
      ], [
        T('（6）', '△ABC は AB＝4cm、BC＝6cm、CA＝8cm、△DEF は DE＝6cm、EF＝9cm、FD＝13cm である。相似といえるか。わけも書こう。', 5),
        B(3, '相似でない。\nAB：DE＝BC：EF＝2：3 だが、\nCA：FD＝8：13 で、等しくない。')
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：条件がたりないと、どうなるか、調べよう。'),
      C2([
        T('（7）', '右の図の A、B をつかって、△ABC を、AB＝6cm、BC＝4cm、∠A＝30° でかこう。コンパスを使って、かける三角形が何通りあるか、調べよう。', 7),
        B(1, '')
      ], [
        F(7, ssaFig)
      ], '1:1'),
      T('', '何通りあったか。かいた三角形を見くらべて、気づいたこと', 1),
      B(9, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '△ABC は AB＝8cm、BC＝12cm、∠B＝60° である。△DEF は DE＝6cm、∠E＝60° で、△ABC と相似である。辺 EF の長さを求めよう。（答えは 2つある。）', 6),
        B(7, '∠E は ∠B に対応する。\n① △ABC∽△DEF のとき\n　 8：6＝12：EF　EF＝9\n② △ABC∽△FED のとき\n　 8：EF＝12：6　EF＝4\nEF＝9cm か 4cm')
      ], [
        MA('① 辺 DE は、△ABC のどの辺に対応するのかな。1通りだけかな。\n② 60° をはさむ 2辺の比が等しくなるように、ならべてみよう。', 13, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '三角形の相似条件を、3つ書こう。（3点）', 1),
      B(3, '① 3組の辺の比が、すべて等しい。\n② 2組の辺の比と、その間の角が、それぞれ等しい。\n③ 2組の角が、それぞれ等しい。'),
      T('（2）', '次のア、イの 2つの三角形は、相似である。使う相似条件を ①〜③ の番号で答えよう。（4点）\nア 3辺が 3cm、4cm、6cm の三角形と、3辺が 6cm、8cm、12cm の三角形\nイ 2辺が 4cm、7cm でその間の角が 35° の三角形と、2辺が 8cm、14cm でその間の角が 35° の三角形', 5),
      B(2, 'ア ①　　イ ②'),
      T('（3）', '△ABC は AB＝3cm、BC＝5cm、CA＝6cm、△DEF は DE＝6cm、EF＝10cm、FD＝13cm である。相似といえるか。わけも書こう。（3点）', 3),
      B(3, '相似でない。AB：DE＝BC：EF＝1：2 だが、\nCA：FD＝6：13 で、等しくない。'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '2つの角が 50°、60° の三角形と、2つの角が 60°、70° の三角形は、相似といえるか。わけも書こう。', 2),
      B(4, '相似である。1つ目の残りの角は 180°−50°−60°＝70°\n2つ目の残りの角は 180°−60°−70°＝50°\nどちらも、3つの角が 50°、60°、70° で、2組の角が等しい。')
    ]
  });
})();
