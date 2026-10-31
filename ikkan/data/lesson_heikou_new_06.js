/* 平行と合同（新しい形） 第6時：多角形の外角の和は、何度になるだろう。 元：data/lesson_heikou_06.js を、新しい形に組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（図1の五角形・図2の六角形で、内角が書いてある各頂点の外角を求め、外角の和を求めて、気づいたことを書く）。個人3分 → ペア3分 → ことば → 例題（正十二角形の外角と内角・外角 40° の正多角形。空欄あり）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる 1問（元の考えよう：外角の和がいつも 360° になるわけ。式と、1周歩く動き。答えは載せない）・チャレンジ★★ 1問（元の入試（9）：正五角形の辺をのばした交点。ヒントカードつき）。
     元の基礎（1）（2）を（1）（2）に、基礎（3）を（3）に、標準（5）を（4）に、応用（6）を（5）に。標準（4）は、外角の和を使う短い問題（五角形の、4つの外角から1つの内角を求める）にかえて（6）にした（新しく作った）。
     元の「発展」・応用（7）・入試（8）・授業計画は使わない。
   ・元の数値・答えのまちがいではないが、ロボットの問題（元の応用（6）・小テスト（4））の問い方を直した：「はじめの位置にもどるまでに、何回向きを変えるか」は、8回とも9回とも読める（9回目に進んだあと、はじめの位置に着くが、向きを変えるのはそのあと）。
     「はじめの位置に、はじめと同じ向きでもどるのは、向きを何回変えたときか」にして、答えを9回（小テストは6回）に決まるようにした。進んだ道のりは同じ（45\\m・36\\m）。
   ・図：GEO（js/geo.js）。多角形は、内角の大きさと辺の長さから座標を計算してかいた（図の角は、本当にその大きさ）。checks で、図の字と座標が合っていること、外角の和が 360° になること、ロボットの動きを座標で追って、もどる回数・道のりを出し直したことを確かめた。
   検算：node tools/verify.cjs heikou_new-06　／　見た目：node tools/check.cjs <出力先> heikou_new-06 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  const pol = (r, deg) => [r * Math.cos(deg * Math.PI / 180), r * Math.sin(deg * Math.PI / 180)];
  // 凸多角形（反時計まわり）：内角 ints（頂点 A, B, … の順）と、辺の長さ lens（A→B, B→C, …。2つだけ null にして、閉じるように決める）、辺 AB の向き d0 から、頂点の座標を出す
  const polyInt = (ints, lens, d0) => {
    const n = ints.length, d = [d0];
    for (let k = 1; k < n; k++) d.push(d[k - 1] + 180 - ints[k]);
    const u = d.map(a => pol(1, a)), un = lens.map((l, i) => (l == null ? i : -1)).filter(i => i >= 0), i = un[0], j = un[1];
    let sx = 0, sy = 0; lens.forEach((l, k) => { if (l != null) { sx += l * u[k][0]; sy += l * u[k][1]; } });
    const det = u[i][0] * u[j][1] - u[i][1] * u[j][0], L = lens.slice();
    L[i] = (-sx * u[j][1] + sy * u[j][0]) / det; L[j] = (-u[i][0] * sy + u[i][1] * sx) / det;
    const P = [[0, 0]]; for (let k = 0; k < n - 1; k++) P.push([P[k][0] + L[k] * u[k][0], P[k][1] + L[k] * u[k][1]]);
    return P;
  };
  // 正n角形（外接円の半径 r、頂点 A の向き d0。反時計まわり）
  const reg = (n, r, d0) => Array.from({ length: n }, (_, k) => pol(r, d0 + 360 * k / n));
  // 点 p から向き d1（度）の半直線と、点 q から向き d2 の半直線の交点
  const isect = (p, d1, q, d2) => {
    const u = pol(1, d1), v = pol(1, d2), den = u[0] * (-v[1]) - u[1] * (-v[0]);
    const s = ((q[0] - p[0]) * (-v[1]) - (q[1] - p[1]) * (-v[0])) / den;
    return [p[0] + s * u[0], p[1] + s * u[1]];
  };
  const NM = 'ABCDEFGH', EX = '123456789';
  // 多角形 P の、各頂点の外角のかきこみ。il[k]＝内角の字、el[k]＝外角の字（null なら、その頂点には、何もかかない）。外角は、頂点 k に入る辺を、頂点のむこうへのばして（点 EX[k]）、となりの辺との間の角
  const extFig = (P, il, el, len, extra) => {
    const n = P.length, pts = {}, segs = [], ang = [];
    P.forEach((p, k) => { pts[NM[k]] = p; });
    P.forEach((p, k) => {
      const q = P[(k + n - 1) % n], dx = p[0] - q[0], dy = p[1] - q[1], l = Math.hypot(dx, dy);
      if (el[k] != null) { pts[EX[k]] = [p[0] + dx / l * (len || 1.3), p[1] + dy / l * (len || 1.3)]; segs.push([NM[k], EX[k]]); ang.push({ at: NM[k], a: EX[k], b: NM[(k + 1) % n], t: el[k], r: 3.6, lr: 8 }); }
      if (il[k] != null) ang.push({ at: NM[k], a: NM[(k + n - 1) % n], b: NM[(k + 1) % n], t: il[k], r: 3.6, lr: 7.4 });
    });
    return Object.assign({ pts, poly: NM.slice(0, n), vl: {}, segs, ang }, extra || {});
  };
  // 図の見出し（図1・図2）を、図の枠の左上のすみに書く
  const GEOC = (o, t) => { const blk = GEO(o), g = blk.svg; blk.svg = (W, H, h) => g(W, H, h) + h.tx(1.2, 4.4, t, 3.6, 'start'); return blk; };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     ag(P, a, b, c)：座標 P から、∠abc（b が頂点）の大きさ（度）　geoOK(o)：GEO の図 o の、数字の角の字が座標と合っているか・多角形が凸か・字のない同じ本数の弧が等しいか
     isum(o)：図 o の多角形の、内角の和（座標から）　extOf(o, k)：図 o の、頂点 k の外角（座標から）　arith(t)：答えの文の中の、数だけの「…＝…＝…」が、計算として正しいか
     robot(len, turn)：ロボット（len 進み、その場で左に turn 度向きを変える、をくり返す）の動きを座標で追って、はじめの位置に、はじめと同じ向きでもどるまでの、向きを変えた回数と、進んだ道のりを出す */
  const ag = (P, a, b, c) => { const u = [P[a][0] - P[b][0], P[a][1] - P[b][1]], v = [P[c][0] - P[b][0], P[c][1] - P[b][1]]; return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) * 180 / Math.PI; };
  const geoOK = o => {
    const P = o.pts, num = t => { const m = /^\{*(\d+(?:\.\d+)?)°\}*$/.exec(String(t == null ? '' : t)); return m ? +m[1] : null; };
    const val = a => { const d = ag(P, a.a, a.at, a.b); return a.reflex ? 360 - d : d; };
    let ok = true;
    if (typeof o.poly === 'string') { const c = [...o.poly], s = c.map((_, k) => { const a = P[c[k]], b = P[c[(k + 1) % c.length]], d = P[c[(k + 2) % c.length]]; return (b[0] - a[0]) * (d[1] - b[1]) - (b[1] - a[1]) * (d[0] - b[0]); }); if (!(s.every(v => v > 1e-9) || s.every(v => v < -1e-9))) ok = false; }
    [o].concat(o.a ? [o.a] : []).forEach(s => {
      (s.ang || []).forEach(a => { const n = num(a.t); if (a.right) { if (Math.abs(val(a) - 90) > 1e-6) ok = false; } else if (n != null && Math.abs(val(a) - n) > 1e-6) ok = false; });
      const g = {}; (s.ang || []).filter(a => !a.t && !a.right).forEach(a => { (g[a.n || 1] = g[a.n || 1] || []).push(val(a)); });
      Object.values(g).forEach(L => { if (L.some(v => Math.abs(v - L[0]) > 1e-6)) ok = false; });
    });
    return ok;
  };
  const NMS = 'ABCDEFGH', EXS = '123456789';
  const isum = o => { const c = [...o.poly], n = c.length; return c.reduce((s, _, k) => s + ag(o.pts, c[(k + n - 1) % n], c[k], c[(k + 1) % n]), 0); };
  const extOf = (o, k) => { const n = o.poly.length; return ag(o.pts, EXS[k], NMS[k], NMS[(k + 1) % n]); };
  const robot = (len, turn) => {
    let x = 0, y = 0, d = 0, turns = 0, dist = 0;
    for (let step = 1; step <= 1000; step++) {
      x += len * Math.cos(d * Math.PI / 180); y += len * Math.sin(d * Math.PI / 180); dist += len;
      d += turn; turns++;
      if (Math.abs(x) < 1e-9 && Math.abs(y) < 1e-9 && Math.abs(((d % 360) + 360) % 360) < 1e-9) return { turns, dist };
    }
    return null;
  };
  const arith = t => {
    const S = String(t).replace(/°/g, ''), re = /[0-9.(][0-9.()+\-−×÷\[\]\/]*(?:＝[0-9.(][0-9.()+\-−×÷\[\]\/]*)+/g;
    let m, ok = true;
    while ((m = re.exec(S))) {
      if (m.index > 0 && /[0-9.()+\-−×÷\[\]\/A-Za-z]/.test(S[m.index - 1])) continue;
      const ps = m[0].split('＝');
      if (ps.some(p => (p.match(/\(/g) || []).length !== (p.match(/\)/g) || []).length || (p.match(/\[/g) || []).length !== (p.match(/\]/g) || []).length)) continue;
      if (ps.some(p => /[+\-−×÷\/]$/.test(p))) continue;
      let vs;
      try { vs = ps.map(p => { let u = p.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/'); for (let k = 0; k < 3; k++) u = u.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))'); return new Function('return ' + u)(); }); } catch (e) { continue; }
      if (vs.some(v => !(Math.abs(v - vs[0]) < 1e-9 * Math.max(1, Math.abs(vs[0]))))) ok = false;
    }
    return ok;
  };
  const LIB = 'const ag = ' + ag + '; const geoOK = ' + geoOK + '; const NMS = "ABCDEFGH", EXS = "123456789"; const isum = ' + isum + '; const extOf = ' + extOf + '; const robot = ' + robot + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 図のデータ ---------------- */
  // 今日の問い：五角形（内角 100°・125°・95°・115°・105°）と六角形（内角 130°・110°・125°・115°・120°・120°）。外角 a〜e、a〜f
  const I5 = [100, 125, 95, 115, 105], I6 = [130, 110, 125, 115, 120, 120];
  const E5 = I5.map(v => 180 - v), E6 = I6.map(v => 180 - v);   // 外角：80・55・85・65・75／50・70・55・65・60・60
  const F_T5 = extFig(polyInt(I5, [3.2, 3.4, 3.0, null, null], 0), I5.map(v => v + '°'), ['a', 'b', 'c', 'd', 'e'], null, { pad: 4 });
  const F_T6 = extFig(polyInt(I6, [3.0, 3.0, 2.8, 2.8, null, null], 0), I6.map(v => v + '°'), ['a', 'b', 'c', 'd', 'e', 'f'], null, { pad: 4 });
  // ひろげる（7）：六角形。外角に、a〜f（内角の字はなし）。答えは載せない
  const I_TH = [135, 110, 125, 120, 130, 100];
  const F_TH = extFig(polyInt(I_TH, [3.0, 3.0, 2.8, 2.8, null, null], 0), I_TH.map(() => null), ['a', 'b', 'c', 'd', 'e', 'f']);
  // 使ってみる（3）図1 五角形：外角 x、75°、65°、80°、85°（x＝55°）　図2 四角形：外角 95°、80°、105°、x（x＝80°）
  const I_D1 = [125, 105, 115, 100, 95], I_D2 = [85, 100, 75, 100];
  const F_D1 = extFig(polyInt(I_D1, [3.2, 3.2, 3.0, null, null], 0), I_D1.map(() => null), ['x', '75°', '65°', '80°', '85°'], null, { pad: 4 });
  const F_D2 = extFig(polyInt(I_D2, [3.4, 3.6, null, null], 0), I_D2.map(() => null), ['95°', '80°', '105°', 'x'], null, { pad: 4 });
  // チャレンジ（8）：正五角形 ABCDE。辺 BC・辺 ED を、C・D の方へのばした線の交点 F。∠x＝∠CFD＝36°
  const F_D4 = (() => { const P = reg(5, 3, 90), o = { pts: Object.fromEntries(P.map((p, k) => [NM[k], p])), poly: 'ABCDE' }, F0 = isect(P[2], Math.atan2(P[2][1] - P[1][1], P[2][0] - P[1][0]) * 180 / Math.PI, P[3], Math.atan2(P[3][1] - P[4][1], P[3][0] - P[4][0]) * 180 / Math.PI); o.pts.F = F0; o.segs = [['C', 'F'], ['D', 'F']]; o.vl = { A: ['A', 90], B: ['B', 162], C: ['C', 234], D: ['D', 306], E: ['E', 18], F: ['F', 270, 3.6] }; o.ang = [{ at: 'F', a: 'C', b: 'D', t: 'x', r: 4, lr: 7.5 }]; return o; })();
  // 小テスト（3）：五角形。外角 x、80°、65°、70°、90°（x＝55°）
  const I_Q = [125, 100, 115, 110, 90];
  const F_Q = extFig(polyInt(I_Q, [3.2, 3.4, 3.0, null, null], 0), I_Q.map(() => null), ['x', '80°', '65°', '70°', '90°'], null, { pad: 4 });
  // チャレンジ：正八角形 ABCDEFGH。辺 AB・辺 DC を、B・C の方へのばした線の交点 P。∠x＝∠BPC＝90°
  const F_QC = (() => { const P = reg(8, 3, 202.5), o = { pts: Object.fromEntries(P.map((p, k) => [NM[k], p])), poly: 'ABCDEFGH' }, h = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; o.pts.P = isect(P[1], h(P[0], P[1]), P[2], h(P[3], P[2])); o.segs = [['B', 'P'], ['C', 'P']]; o.vl = { A: ['A', 202.5], B: ['B', 247.5], C: ['C', 292.5], D: ['D', 337.5], E: ['E', 22.5], F: ['F', 67.5], G: ['G', 112.5], H: ['H', 157.5], P: ['P', 270, 3.6] }; o.ang = [{ at: 'P', a: 'B', b: 'C', t: 'x', r: 4, lr: 7.5 }]; return o; })();

  // 手で書いた答え（画面にも checks にも、同じ文字列を使う）
  const T_W1 = '（例）外角＝180°−内角（頂点ごと）\n五角形　80°、55°、85°、65°、75°\n　　外角の和　80°+55°+85°+65°+75°＝360°\n六角形　50°、70°、55°、65°、60°、60°\n　　外角の和　50°+70°+55°+65°+60°+60°＝360°';
  const T_E1 = '（1）外角　360°÷12＝30°\n　　　内角　180°−30°＝150°\n（2）360°÷40°＝9\n　　　正九角形';
  const T_D1 = '① 360°÷6＝60°\n② 360°÷8＝45°\n③ 360°÷18＝20°';
  const T_D2 = '① 360°÷30°＝12　正十二角形\n② 360°÷72°＝5　正五角形\n③ 外角は 180°−165°＝15°\n　 360°÷15°＝24　正二十四角形';
  const T_D3 = '① 360−(75+65+80+85)＝55°\n② 360−(95+80+105)＝80°';
  const T_D4 = '外角を x° とすると、内角は 3x°\nx+3x＝180　　x＝45\n360°÷45°＝8　正八角形';
  const T_D5 = '1周で 360° 向きが変わる\n360°÷40°＝9　　9回\n5×9＝45　　45\\m';
  const T_D6 = 'E の外角\n　360−(70+80+75+65)＝70°\nE の内角　180°−70°＝110°';
  const T_D8 = '正五角形の1つの外角は\n　360°÷5＝72°\n∠FCD＝∠FDC＝72°（外角）\n△FCD の内角の和から\n　∠x＝180°−72°−72°＝36°';
  const T_Q1 = '① 360°÷9＝40°\n② 360°÷15＝24°';
  const T_Q2 = '① 360°÷36°＝10　　正十角形\n② 外角は　180°−140°＝40°\n　 360°÷40°＝9　　正九角形';
  const T_Q3 = '∠x＝360°−(80°+65°+70°+90°)＝55°';
  const T_Q4 = '1周で 360° 向きが変わる\n360°÷60°＝6　　6回\n6×6＝36　　36\\m';
  const T_QC = '正八角形の1つの外角は　360°÷8＝45°\n∠PBC＝45°、∠PCB＝45°　（B、C の外角）\n△PBC の内角の和から\n　∠x＝180°−45°−45°＝90°';

  const DEF = {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第6時', title: '多角形の外角の和は、何度になるだろう',
    summary: '五角形と六角形で、外角を「180°−内角」で求めて、外角の和が 360° になることをつかむ。正多角形の1つの外角。ひろげるは、外角の和がいつも 360° になるわけ。',
    head: '平行と合同　第6時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：五角形・六角形。内角の字は座標と合う。外角（座標から）＝180°−内角＝80・55・85・65・75／50・70・55・65・60・60。和は 360°
      chk('第6時 今日の問い', `const a = ${J(F_T5)}, b = ${J(F_T6)}, e5 = ${J(E5)}, e6 = ${J(E6)}; const sum = (o, e) => e.reduce((s, v, k) => s + extOf(o, k), 0); return geoOK(a) && geoOK(b) && near(isum(a), 540) && near(isum(b), 720) && e5.every((v, k) => near(extOf(a, k), v)) && e6.every((v, k) => near(extOf(b, k), v)) && near(sum(a, e5), 360) && near(sum(b, e6), 360) && e5.join() === '80,55,85,65,75' && e6.join() === '50,70,55,65,60,60' && e5.every(v => ${J(T_W1)}.includes(v + '°')) && e6.every(v => ${J(T_W1)}.includes(v + '°')) && arith(${J(T_W1)});`),
      // 例題：正十二角形の外角 30°、内角 150°（＝180°×10÷12）。外角 40° → 正九角形
      chk('第6時 例題', `return near(360 / 12, 30) && near(180 - 30, 150) && near(180 * (12 - 2) / 12, 150) && near(360 / 40, 9) && [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20].filter(n => near(360 / n, 40)).join('') === '9' && arith(${J(T_E1)});`),
      // ひろげる（7）（答えは載せない。ここで確かめるだけ）：n角形で 180°×n−180°×(n−2)＝360°。図の六角形を 1周すると、向きの変わる角（＝外角）の合計が 360°
      chk('第6時 ひろげる（7）', `const o = ${J(F_TH)}, c = [...o.poly], n = c.length, P = o.pts; const h = k => { const a = P[c[k]], b = P[c[(k + 1) % n]]; return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI; }; let turn = 0; for (let k = 0; k < n; k++) { let d = h((k + 1) % n) - h(k); d = ((d % 360) + 360) % 360; turn += d; } let ok = true; for (let m = 3; m <= 30; m++) { if (!near(180 * m - 180 * (m - 2), 360)) ok = false; } return geoOK(o) && near(isum(o), 720) && near(turn, 360) && o.pts && c.every((_, k) => near(extOf(o, k), 180 - ag(P, c[(k + n - 1) % n], c[k], c[(k + 1) % n]))) && ok;`),
      // 演習（1）（2）
      chk('第6時 演習（1）（2）', `return [6, 8, 18].map(n => 360 / n).join(',') === '60,45,20' && [[30, 12], [72, 5]].every(([e, n]) => near(360 / e, n)) && near(360 / (180 - 165), 24) && [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30].filter(n => near(180 * (n - 2) / n, 165)).join('') === '24' && arith(${J(T_D1)}) && arith(${J(T_D2)});`),
      // 演習（3）図1・図2の ∠x（座標から）
      chk('第6時 演習（3）', `const a = ${J(F_D1)}, b = ${J(F_D2)}; return geoOK(a) && geoOK(b) && near(extOf(a, 0), 55) && near(extOf(a, 1), 75) && near(extOf(a, 2), 65) && near(extOf(a, 3), 80) && near(extOf(a, 4), 85) && near(extOf(b, 0), 95) && near(extOf(b, 1), 80) && near(extOf(b, 2), 105) && near(extOf(b, 3), 80) && near(360 - (75 + 65 + 80 + 85), 55) && near(360 - (95 + 80 + 105), 80) && arith(${J(T_D3)});`),
      // 演習（4）内角＝外角×3 → 外角 45° → 正八角形
      chk('第6時 演習（4）', `return near(45 + 3 * 45, 180) && near(360 / 45, 8) && near(180 * (8 - 2) / 8, 135) && near(135, 3 * 45) && [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24].filter(n => near(180 * (n - 2) / n, 3 * (360 / n))).join('') === '8' && arith(${J(T_D4)});`),
      // 演習（5）ロボット：左に 40° → はじめの位置に、はじめと同じ向きでもどるのは 9回目、道のり 45m（座標で追う）
      chk('第6時 演習（5）', `const r = robot(5, 40); return r && r.turns === 9 && near(r.dist, 45) && near(360 / 40, 9) && near(5 * 9, 45) && arith(${J(T_D5)});`),
      // 演習（6）五角形の 4つの外角 70°・80°・75°・65° → E の外角 70°、内角 110°。この五角形（外角 70、80、75、65、70）を座標でかいて、E の内角を測り直す
      chk('第6時 演習（6）', `const ex = [70, 80, 75, 65, 70], ints = ex.map(v => 180 - v); let x = 0, y = 0, d = 0; const V = [[0, 0]]; for (let k = 0; k < 4; k++) { x += Math.cos(d * Math.PI / 180); y += Math.sin(d * Math.PI / 180); V.push([x, y]); d += ex[(k + 1) % 5]; } const P = { A: V[0], B: V[1], C: V[2], D: V[3], E: V[4] }; return near(ex.reduce((a, b) => a + b, 0), 360) && near(360 - (70 + 80 + 75 + 65), 70) && near(180 - 70, 110) && near(ints.reduce((a, b) => a + b, 0), 540) && ex.every(v => v > 0 && v < 180) && arith(${J(T_D6)});`),
      // チャレンジ（8）正五角形 ABCDE。辺 BC・ED の延長の交点 F → ∠CFD＝36°（座標から）
      chk('第6時 チャレンジ（8）', `const o = ${J(F_D4)}, P = o.pts; return geoOK(o) && near(isum({ pts: P, poly: o.poly }), 540) && near(ag(P, 'B', 'C', 'D'), 108) && near(ag(P, 'F', 'C', 'D'), 72) && near(ag(P, 'F', 'D', 'C'), 72) && near(ag(P, 'C', 'F', 'D'), 36) && near(ag(P, 'B', 'C', 'F'), 180) && near(ag(P, 'E', 'D', 'F'), 180) && near(360 / 5, 72) && near(180 - 72 - 72, 36) && arith(${J(T_D8)});`),
      // 小テスト
      chk('第6時 小テスト（1）（2）', `return [9, 15].map(n => 360 / n).join(',') === '40,24' && near(360 / 36, 10) && near(360 / (180 - 140), 9) && near(180 * (9 - 2) / 9, 140) && arith(${J(T_Q1)}) && arith(${J(T_Q2)});`),
      chk('第6時 小テスト（3）（4）', `const o = ${J(F_Q)}; const r = robot(6, 60); return geoOK(o) && near(extOf(o, 0), 55) && near(extOf(o, 1), 80) && near(extOf(o, 2), 65) && near(extOf(o, 3), 70) && near(extOf(o, 4), 90) && near(360 - (80 + 65 + 70 + 90), 55) && r && r.turns === 6 && near(r.dist, 36) && arith(${J(T_Q3)}) && arith(${J(T_Q4)});`),
      // チャレンジ：正八角形の辺 AB・DC の延長の交点 P → ∠BPC＝90°
      chk('第6時 小テスト チャレンジ', `const o = ${J(F_QC)}, P = o.pts; return geoOK(o) && near(isum({ pts: P, poly: o.poly }), 1080) && near(ag(P, 'A', 'B', 'C'), 135) && near(ag(P, 'P', 'B', 'C'), 45) && near(ag(P, 'P', 'C', 'B'), 45) && near(ag(P, 'B', 'P', 'C'), 90) && near(ag(P, 'A', 'B', 'P'), 180) && near(ag(P, 'D', 'C', 'P'), 180) && near(180 - 45 - 45, 90) && arith(${J(T_QC)});`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('多角形の外角の和は、何度になるだろう'),
      K('今日の問い', '図1の五角形、図2の六角形で、各頂点の外角 a〜e、a〜f を求めて、外角の和を求めよう。外角の和について、気づいたことは？', 2),
      F(7, GEOC(F_T5, '図1　五角形'), GEOC(F_T6, '図2　六角形')),
      T('①', '自分の考え（3分）　外角を求めて、たそう。', 1),
      B(5, T_W1),
      T('②', 'ペアの考え（3分）　自分とちがう気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('多角形の辺をのばしてできる角を{{外角}}という。\nどの頂点でも、内角と外角の和は{{180°}}。\n多角形の外角の和は、何角形でも{{360°}}。\n正n角形の1つの外角は、{{360°÷n}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '（1）正{{十二}}角形の1つの外角と、1つの内角を求めよう。\n（2）1つの外角が {{40}}° である正多角形は、正何角形だろう。', 3),
      B(4, T_E1)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 多角形の外角の和は、何角形でも {{360°}} である。\n② 正n角形の1つの外角は、{{360°÷n}} である。\n③ どの頂点でも、内角と外角の和は {{180°}} である。', 3, { label: 'ことば' }),
      C2([
        T('（1）', '正多角形の、1つの外角を求めよう。\n① 正六角形　② 正八角形\n③ 正十八角形', 3),
        B(3, T_D1)
      ], [
        T('（2）', '正多角形は、正何角形だろう。\n① 外角 30°　② 外角 72°\n③ 内角 165°', 3),
        B(4, T_D2)
      ], '1:1'),
      MA('【説明】正n角形の1つの外角が 360°÷n になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '外角の和を使って、求めよう。'),
      F(4, GEOC(F_D1, '図1'), GEOC(F_D2, '図2')),
      C2([
        T('（3）', '図1、図2で、∠x の大きさを求めよう。', 2),
        B(3, T_D3)
      ], [
        T('（4）', '1つの内角が、1つの外角の 3倍である正多角形は、正何角形だろう。', 3),
        B(3, T_D4)
      ], '1:1'),
      C2([
        T('（5）', 'ロボットが、「まっすぐ 5\\m 進み、その場で左へ 40° 向きを変える」をくり返す。はじめの位置に、はじめと同じ向きでもどるのは、向きを何回変えたときか。進んだ道のりは。', 5),
        B(3, T_D5)
      ], [
        T('（6）', '五角形 ABCDE で、頂点 A、B、C、D の外角が 70°、80°、75°、65° である。頂点 E の内角を求めよう。', 4),
        B(3, T_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：どんな多角形でも、外角の和は、いつも 360° になるのは、なぜだろう。'),
      T('（7）', '式と、動き、2通りで説明しよう。', 1),
      T('①', '式で説明しよう。n角形で、「内角と外角の和」に目をつけて、外角の和を n を使った式で表そう。', 2),
      B(5, ''),
      C2([
        T('②', '動きで説明しよう。多角形のまわりを 1周歩くとき、頂点で向きを変える角は、どの角にあたるだろう。そこから、外角の和が 360° になるわけを説明しよう。', 5),
        B(6, '')
      ], [
        F(11, GEO(F_TH))
      ], '3:2'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図は、正五角形 ABCDE である。辺 BC と辺 ED を、C、D の方へのばした線の交点を F とする。∠CFD（図の ∠x）を求めよう。', 6),
        B(5, T_D8)
      ], [
        F(6, GEO(F_D4)),
        MA('① 正五角形の 1つの外角は、何度かな。\n② △FCD の ∠FCD と ∠FDC は、五角形の外角にあたるかな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 片面・5分） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の正多角形の、1つの外角の大きさを求めよう。（3点）\n　① 正九角形　　② 正十五角形', 2),
      B(2, T_Q1),
      T('（2）', '次の正多角形は、正何角形だろう。（3点）\n　① 1つの外角が 36°　　② 1つの内角が 140°', 2),
      B(3, T_Q2),
      C2([
        T('（3）', '右の図で、∠x の大きさを求めよう。（2点）', 2),
        B(2, T_Q3)
      ], [
        F(5, GEO(F_Q))
      ], '3:2'),
      T('（4）', 'ロボットが、「まっすぐ 6\\m 進み、その場で左へ 60° 向きを変える」をくり返す。はじめの位置に、はじめと同じ向きでもどるのは、向きを何回変えたときか。また、そこまでに進んだ道のりは。（2点）', 3),
      B(3, T_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図は、正八角形 ABCDEFGH である。辺 AB と辺 DC を、B、C の方へのばした線の交点を P とする。∠BPC（図の ∠x）を求めよう。', 5),
        B(4, T_QC)
      ], [
        F(9, GEO(F_QC))
      ], '3:2')
    ]
  };
  DEF.checks.push(chk('第6時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('heikou_new-06', DEF);
})();
