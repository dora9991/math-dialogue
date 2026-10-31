/* 平行と合同（新しい形） 第5時：多角形の内角の和は、どう求められるだろう。 元：data/lesson_heikou_05.js を、新しい形に組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（四角形〜七角形を、頂点 A から対角線をひいて三角形に分け、内角の和を求める。三角形の数と頂点の数の関係）。個人3分 → ペア3分 → ことば → 例題（八角形の内角の和・正八角形の1つの内角・内角の和 1440° の多角形。空欄あり）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる 1問（元の考えよう：五角形の、ちがう分け方。答えは載せない）・チャレンジ★★ 1問（元の入試（9）。ヒントカードつき）。
     元の基礎（1）〜（3）を（1）（2）（4）に、標準（4）（5）を、図1〜図3の1問（3）に、応用（6）を（5）に。応用（7）（六角形の x の式）は、短い問題（四角形の内角の比）にかえて（6）にした（新しく作った）。
     元の「発展」・授業計画は使わない。
   ・図：GEO（js/geo.js）。多角形は、内角の大きさと辺の長さから座標を計算してかいた。checks で、図の字と座標が合うこと・凸の多角形であること・内角の和を、座標から測った角の合計で確かめた。
   検算：node tools/verify.cjs heikou_new-05　／　見た目：node tools/check.cjs <出力先> heikou_new-05 */
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
  const NM = 'ABCDEFGH';
  // 点 p から向き d1（度）の半直線と、点 q から向き d2 の半直線の交点
  const isect = (p, d1, q, d2) => {
    const u = pol(1, d1), v = pol(1, d2), den = u[0] * (-v[1]) - u[1] * (-v[0]);
    const s = ((q[0] - p[0]) * (-v[1]) - (q[1] - p[1]) * (-v[0])) / den;
    return [p[0] + s * u[0], p[1] + s * u[1]];
  };
  // 頂点 b での、∠abc の二等分線の向き（度）
  const bisDir = (a, b, c) => { const u = [a[0] - b[0], a[1] - b[1]], v = [c[0] - b[0], c[1] - b[1]], lu = Math.hypot(u[0], u[1]), lv = Math.hypot(v[0], v[1]); return Math.atan2(u[1] / lu + v[1] / lv, u[0] / lu + v[0] / lv) * 180 / Math.PI; };
  const polyO = (P, extra) => Object.assign({ pts: Object.fromEntries(P.map((p, k) => [NM[k], p])), poly: NM.slice(0, P.length), vl: NM.slice(0, P.length) }, extra);
  // 内角の字：labels[k]＝頂点 k の内角の字（null なら書かない）
  const intAng = (n, labels, r, lr) => labels.map((t, k) => (t == null ? null : { at: NM[k], a: NM[(k + n - 1) % n], b: NM[(k + 1) % n], t, r: r || 3.6, lr: Array.isArray(lr) ? lr[k] : (lr || 7.4) })).filter(Boolean);
  // 図の見出し（図1・ア など）を、図の枠の左上のすみに書く
  const GEOC = (o, t) => { const blk = GEO(o), g = blk.svg; blk.svg = (W, H, h) => { const k = Math.min(1.6, (window.IK && window.IK.labelScale) || 1); return g(W, H, h) + '<g class="geo">' + h.tx(1.2, 1.4 + 3.0 * k, t, 3.6 * k, 'start') + '</g>'; }; return blk; };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     ag(P, a, b, c)：座標 P から、∠abc（b が頂点）の大きさ（度）　geoOK(o)：GEO の図 o の、数字の角の字が座標と合っているか・多角形が凸か・字のない同じ本数の弧が等しいか
     isum(o)：図 o の多角形の、内角の和（座標から）　arith(t)：答えの文の中の、数だけの「…＝…＝…」が、計算として正しいか */
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
  const isum = o => { const c = [...o.poly], n = c.length; return c.reduce((s, _, k) => s + ag(o.pts, c[(k + n - 1) % n], c[k], c[(k + 1) % n]), 0); };
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
  const LIB = 'const pol = ' + pol + '; const polyInt = ' + polyInt + '; const isect = ' + isect + '; const bisDir = ' + bisDir + '; const ag = ' + ag + '; const geoOK = ' + geoOK + '; const isum = ' + isum + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 図のデータ ---------------- */
  // 今日の問い：四角形〜七角形（形だけ）。答えの図（赤）は、頂点 A から出る対角線
  const SH = {
    4: polyInt([100, 85, 95, 80], [3.4, 3.0, null, null], 0),
    5: polyInt([105, 110, 95, 120, 110], [3.0, 3.2, 2.8, null, null], 0),
    6: polyInt([125, 110, 130, 115, 120, 120], [3.0, 3.0, 2.8, 3.2, null, null], 0),
    7: polyInt([130, 120, 135, 125, 140, 120, 130], [2.4, 2.6, 2.4, 2.5, 2.6, null, null], 0)
  };
  const F_T = [4, 5, 6, 7].map(n => polyO(SH[n], { a: { segs: Array.from({ length: n - 3 }, (_, k) => ['A', NM[k + 2]]) } }));
  // ひろげる（7）：五角形（ア・イ・ウ）。答えは載せない（a はなし）
  const F_TH = polyO(SH[5]);
  // 使ってみる（3）の図：x を求める四角形・五角形・六角形（内角が書いてある）
  const I_D1 = [75, 110, 80, 95], I_D2 = [105, 120, 90, 130, 95], I_D3 = [100, 130, 115, 125, 140, 110];
  const F_D1 = polyO(polyInt(I_D1, [3.4, 3.0, null, null], 0), { vl: {}, pad: 4, ang: intAng(4, ['x', '110°', '80°', '95°']) });
  const F_D2 = polyO(polyInt(I_D2, [3.6, 3.4, 3.2, null, null], 0), { vl: {}, pad: 4, ang: intAng(5, ['x', '120°', '90°', '130°', '95°']) });
  const F_D3 = polyO(polyInt(I_D3, [3.2, 3.2, 3.0, 2.6, null, null], 0), { vl: {}, pad: 4, ang: intAng(6, ['x', '130°', '115°', '125°', '140°', '110°'], 3.2, [6, 6, 7.4, 6, 6, 7.4]) });
  // チャレンジ（8）：四角形 ABCD（∠A＝120°、∠B＝80°、∠C＝70°、∠D＝90°）。P は ∠C・∠D の二等分線の交点。∠x＝∠CPD＝100°
  const F_D4 = (() => { const P = polyInt([120, 80, 70, 90], [4.4, 4.6, null, null], 0), pC = bisDir(P[1], P[2], P[3]), pD = bisDir(P[2], P[3], P[0]), Q = isect(P[2], pC, P[3], pD); const o = polyO(P); o.pts.P = Q; o.vl = { A: ['A', 160], B: ['B', 250], C: ['C', 330], D: ['D', 150], P: ['P', 270, 3.6] }; o.segs = [['C', 'P'], ['D', 'P']]; o.ang = [{ at: 'A', a: 'D', b: 'B', t: '120°', r: 5, lr: 9 }, { at: 'B', a: 'A', b: 'C', t: '80°', r: 5, lr: 9 }, { at: 'C', a: 'B', b: 'P', n: 1, r: 6 }, { at: 'C', a: 'P', b: 'D', n: 1, r: 6 }, { at: 'D', a: 'C', b: 'P', n: 2, r: 6 }, { at: 'D', a: 'P', b: 'A', n: 2, r: 6 }, { at: 'P', a: 'C', b: 'D', t: 'x', r: 5, lr: 9 }]; return o; })();
  // 小テスト（4）：五角形（x＝115°、のこりが 90°・110°・125°・100°）
  const I_Q = [115, 90, 110, 125, 100];
  const F_Q = polyO(polyInt(I_Q, [3.2, 3.4, 3.0, null, null], 0), { vl: {}, ang: intAng(5, ['x', '90°', '110°', '125°', '100°']) });

  // 手で書いた答え（画面にも checks にも、同じ文字列を使う）
  const T_W1 = '（例）四角形 … 三角形 2個　180°×2＝360°\n五角形 … 三角形 3個　180°×3＝540°\n六角形 … 三角形 4個　180°×4＝720°\n七角形 … 三角形 5個　180°×5＝900°\n頂点が n個なら、三角形は (n−2) 個';
  const T_E1 = '（1）180°×(8−2)＝1080°\n（2）1080°÷8＝135°\n（3）180°×(n−2)＝1440° より\n　　n−2＝8　　n＝10\n　　十角形';
  const T_D1 = '① 180°×(6−2)＝720°\n② 180°×(9−2)＝1260°\n③ 180°×(12−2)＝1800°';
  const T_D2 = '① 180°×(5−2)÷5＝108°\n② 180°×(6−2)÷6＝120°\n③ 180°×(10−2)÷10＝144°';
  const T_D3 = '① 360−(110+80+95)＝75°\n② 540−(120+90+130+95)＝105°\n③ 720−(130+115+125+140+110)＝100°';
  const T_D4 = '① 180°×(n−2)＝900° より\n　 n−2＝5　n＝7　七角形\n② 180°×(n−2)＝1620° より\n　 n−2＝9　n＝11　十一角形';
  const T_D5 = '180°×(n−2)＝156°×n\n180n−360＝156n　　24n＝360\nn＝15　　正十五角形';
  const T_D6 = '内角の和は 360° だから\n360°÷(2+3+3+4)＝30°\n30°×4＝120°';
  const T_D8 = '四角形の内角の和は 360° だから\n∠C+∠D＝360°−(120°+80°)＝160°\n∠PCD+∠PDC＝160°÷2＝80°\n△PCD の内角の和から\n∠x＝180°−80°＝100°';
  const T_Q1 = '① 180°×(13−2)＝1980°\n② 180°×(20−2)＝3240°';
  const T_Q2 = '① 180°×(9−2)÷9＝140°\n② 180°×(18−2)÷18＝160°';
  const T_Q3 = '180°×(n−2)＝2160° より\nn−2＝12　　n＝14　　十四角形';
  const T_Q4 = '五角形の内角の和は　180°×(5−2)＝540°\n∠x＝540°−(90°+110°+125°+100°)＝115°';
  const T_QC = '180°×(n−2)＝150°×n\n180n−360＝150n　　30n＝360　　n＝12\n正十二角形';

  const DEF = {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第5時', title: '多角形の内角の和は、どう求められるだろう',
    summary: '多角形を、1つの頂点から対角線をひいて三角形に分け、内角の和 180°×(n−2) を見つける。正多角形の1つの内角。ひろげるは、ちがう分け方でも同じ答えになるか。',
    head: '平行と合同　第5時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：四角形〜七角形。内角の和は座標から 180°×(n−2)。頂点 A からの対角線は n−3 本で、三角形は n−2 個
      chk('第5時 今日の問い', `const F = ${J(F_T)}; return F.every((o, i) => { const n = i + 4; return geoOK(o) && Math.abs(isum(o) - 180 * (n - 2)) < 1e-6 && o.a.segs.length + 1 === n - 2 && Object.keys(o.pts).length === n; }) && F.map((o, i) => 180 * (o.a.segs.length + 1)).join(',') === '360,540,720,900' && arith(${J(T_W1)});`),
      // 例題：八角形 1080°、正八角形の 1つの内角 135°、内角の和 1440° は十角形
      chk('第5時 例題', `return near(180 * (8 - 2), 1080) && near(1080 / 8, 135) && near(180 * (10 - 2), 1440) && [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter(n => near(180 * (n - 2), 1440)).join('') === '10' && arith(${J(T_E1)});`),
      // ひろげる（7）（答えは載せない。ここで確かめるだけ）：五角形（図）の中の点 I と、辺 BC 上の点 J から分けても、内角の和は 540°。n角形でも 180n−360＝180(n−1)−180＝180(n−2)
      chk('第5時 ひろげる（7）', `const o = ${J(F_TH)}, P = o.pts, c = [...o.poly], cx = c.reduce((s, k) => s + P[k][0], 0) / 5, cy = c.reduce((s, k) => s + P[k][1], 0) / 5; P.I = [cx, cy]; P.J = [(P.B[0] + P.C[0]) / 2, (P.B[1] + P.C[1]) / 2]; const around = c.reduce((s, k, i) => s + ag(P, k, 'I', c[(i + 1) % 5]), 0); const atJ = ag(P, 'B', 'J', 'C'); const tri = (x, y, z) => ag(P, y, x, z) + ag(P, x, y, z) + ag(P, x, z, y); const fromI = c.reduce((s, k, i) => s + tri('I', k, c[(i + 1) % 5]), 0), fromJ = ['C', 'D', 'E', 'A', 'B'].reduce((s, k, i, a) => i < 4 ? s + tri('J', k, a[i + 1]) : s, 0) ; return geoOK(o) && near(around, 360) && near(atJ, 180) && near(fromI, 180 * 5) && near(fromI - around, isum(o)) && near(fromJ, 180 * 4) && near(fromJ - atJ, isum(o)) && near(isum(o), 540) && [3, 4, 5, 6, 7, 8, 9, 10, 15, 20].every(n => near(180 * n - 360, 180 * (n - 2)) && near(180 * (n - 1) - 180, 180 * (n - 2)));`),
      // 演習（1）（2）（4）
      chk('第5時 演習（1）', `return [6, 9, 12].map(n => 180 * (n - 2)).join(',') === '720,1260,1800' && arith(${J(T_D1)});`),
      chk('第5時 演習（2）', `return [5, 6, 10].map(n => 180 * (n - 2) / n).join(',') === '108,120,144' && arith(${J(T_D2)});`),
      chk('第5時 演習（4）', `return [900, 1620].map(s => { const k = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].filter(n => near(180 * (n - 2), s)); return k.length === 1 ? k[0] : 0; }).join(',') === '7,11' && arith(${J(T_D4)});`),
      // 演習（3）図1〜図3：x＝のこりの内角（座標から）
      chk('第5時 演習（3）', `const a = ${J(F_D1)}, b = ${J(F_D2)}, c = ${J(F_D3)}; return geoOK(a) && geoOK(b) && geoOK(c) && near(isum(a), 360) && near(isum(b), 540) && near(isum(c), 720) && near(ag(a.pts, 'D', 'A', 'B'), 75) && near(ag(b.pts, 'E', 'A', 'B'), 105) && near(ag(c.pts, 'F', 'A', 'B'), 100) && near(360 - (80 + 110 + 95), 75) && near(540 - (120 + 90 + 130 + 95), 105) && near(720 - (130 + 115 + 125 + 140 + 110), 100) && arith(${J(T_D3)});`),
      // 演習（5）1つの内角 156° → 正十五角形
      chk('第5時 演習（5）', `return [3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24].filter(n => near(180 * (n - 2) / n, 156)).join('') === '15' && near(180 * (15 - 2), 156 * 15) && near(24 * 15, 360) && arith(${J(T_D5)});`),
      // 演習（6）四角形の内角の比 2:3:3:4：内角の和 360° を比で分ける。いちばん大きい角 120°。ほかの比べ方（4 つの角を 30° ずつの何こ分か）でも
      chk('第5時 演習（6）', `const q = [2, 3, 3, 4], u = 180 * (4 - 2) / q.reduce((a, b) => a + b, 0), ang = q.map(v => v * u); return near(u, 30) && ang.join() === '60,90,90,120' && near(ang.reduce((a, b) => a + b, 0), 360) && near(Math.max(...ang), 120) && arith(${J(T_D6)});`),
      // チャレンジ（8）四角形の ∠A＝120°、∠B＝80°。∠C・∠D の二等分線の交点 P → ∠CPD＝100°（座標から。ほかの形でも）
      chk('第5時 チャレンジ（8）', `const o = ${J(F_D4)}, P = o.pts; let all = true; [[70, 90], [60, 100], [80, 80], [90, 70], [75, 85]].forEach(([c, d]) => { const Q = polyInt([120, 80, c, d], [4.4, 4.6, null, null], 0), I = isect(Q[2], bisDir(Q[1], Q[2], Q[3]), Q[3], bisDir(Q[2], Q[3], Q[0])), W = { C: Q[2], D: Q[3], P: I }; if (Math.abs(ag(W, 'C', 'P', 'D') - (180 - (c + d) / 2)) > 1e-6) all = false; }); return geoOK(o) && near(isum(o), 360) && near(ag(P, 'B', 'A', 'D'), 120) && near(ag(P, 'A', 'B', 'C'), 80) && near(ag(P, 'B', 'C', 'D') + ag(P, 'C', 'D', 'A'), 160) && near(ag(P, 'C', 'P', 'D'), 100) && all && near(180 - (360 - (120 + 80)) / 2, 100) && arith(${J(T_D8)});`),
      // 小テスト
      chk('第5時 小テスト（1）〜（3）', `return [13, 20].map(n => 180 * (n - 2)).join(',') === '1980,3240' && [9, 18].map(n => 180 * (n - 2) / n).join(',') === '140,160' && [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].filter(n => near(180 * (n - 2), 2160)).join('') === '14' && arith(${J(T_Q1)}) && arith(${J(T_Q2)}) && arith(${J(T_Q3)});`),
      chk('第5時 小テスト（4）', `const o = ${J(F_Q)}; return geoOK(o) && near(isum(o), 540) && near(ag(o.pts, 'E', 'A', 'B'), 115) && near(540 - (90 + 110 + 125 + 100), 115) && arith(${J(T_Q4)});`),
      // チャレンジ：1つの内角が 150° の正多角形は 正十二角形
      chk('第5時 小テスト チャレンジ', `return [3, 4, 5, 6, 8, 9, 10, 12, 15].filter(n => near(180 * (n - 2) / n, 150)).join('') === '12' && near(180 * 12 - 360, 150 * 12) && near(30 * 12, 360) && arith(${J(T_QC)});`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('多角形の内角の和は、どう求められるだろう'),
      K('今日の問い', '1つの頂点 A から対角線をひいて三角形に分け、四角形〜七角形の内角の和を求めよう。三角形の数と、頂点の数の関係は？', 2),
      F(6, GEOC(F_T[0], '四角形'), GEOC(F_T[1], '五角形'), GEOC(F_T[2], '六角形'), GEOC(F_T[3], '七角形')),
      T('①', '自分の考え（3分）　図にかきこんで、求めよう。', 1),
      B(5, T_W1),
      T('②', 'ペアの考え（3分）　自分とちがう気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('多角形の内側の角を{{内角}}という。\nとなりあわない2つの頂点を結ぶ線分を{{対角線}}という。\nn角形の内角の和は、{{180°×(n−2)}}である。\n辺も角もすべて等しい多角形を{{正多角形}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '（1）{{八}}角形の内角の和を求めよう。\n（2）正{{八}}角形の1つの内角を求めよう。\n（3）内角の和が {{1440}}° の多角形は、何角形だろう。', 3),
      B(5, T_E1)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① n角形の内角の和は、{{180°×(n−2)}}である。\n② 1つの頂点から対角線をひくと、n角形は{{n−2}}個の三角形に分かれる。\n③ 正n角形の1つの内角は、内角の和を{{n}}でわって求める。\n④ 辺も角もすべて等しい多角形を{{正多角形}}という。', 4, { label: 'ことば' }),
      C2([
        T('（1）', '内角の和を求めよう。\n① 六角形　② 九角形\n③ 十二角形', 3),
        B(3, T_D1)
      ], [
        T('（2）', '正多角形の1つの内角を求めよう。\n① 正五角形　② 正六角形\n③ 正十角形', 3),
        B(3, T_D2)
      ], '1:1'),
      MA('【説明】「n−2」は何を表すか、図をかいて隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '内角の和を使って、求めよう。'),
      F(5, GEOC(F_D1, '図1'), GEOC(F_D2, '図2'), GEOC(F_D3, '図3')),
      C2([
        T('（3）', '図1〜図3で、∠x の大きさを求めよう。', 2),
        B(3, T_D3)
      ], [
        T('（4）', '内角の和が、① 900°、② 1620° になる多角形は、何角形だろう。', 3),
        B(4, T_D4)
      ], '1:1'),
      C2([
        T('（5）', '1つの内角が 156° の正多角形は、正何角形だろう。n の方程式をつくろう。', 3),
        B(3, T_D5)
      ], [
        T('（6）', '四角形の4つの内角の大きさの比が 2：3：3：4 である。いちばん大きい角は何度だろう。', 3),
        B(3, T_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：ちがう分け方でも、同じ答えになるか調べよう。'),
      T('（7）', '五角形の内角の和を、「1つの頂点から対角線をひく」分け方とは、ちがう分け方で求めよう。ア〜ウの五角形にかいて、式を書こう。', 2),
      F(6, GEOC(F_TH, 'ア'), GEOC(F_TH, 'イ'), GEOC(F_TH, 'ウ')),
      B(4, ''),
      T('', 'どの分け方でも、同じ答えになるだろうか。n角形で考えて、n を使った式で説明しよう。', 2),
      B(5, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の四角形 ABCD で、∠A＝120°、∠B＝80° である。∠C の二等分線と ∠D の二等分線の交点を P とするとき、∠CPD（図の ∠x）を求めよう。', 4),
        B(6, T_D8)
      ], [
        F(6, GEO(F_D4)),
        MA('① 四角形の内角の和は何度か。∠C と ∠D の和は、何度になるかな。\n② ∠PCD と ∠PDC の和は？　△PCD で考えよう。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 片面・5分） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次の多角形の内角の和を求めよう。（2点）\n　① 十三角形　　② 二十角形', 2),
      B(3, T_Q1),
      T('（2）', '次の正多角形の 1つの内角の大きさを求めよう。（3点）\n　① 正九角形　　② 正十八角形', 2),
      B(3, T_Q2),
      T('（3）', '内角の和が 2160° である多角形は、何角形だろう。（2点）', 1),
      B(3, T_Q3),
      C2([
        T('（4）', '右の図で、∠x の大きさを求めよう。（3点）', 1),
        B(5, T_Q4)
      ], [
        F(7, GEO(F_Q))
      ], '3:2'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '1つの内角の大きさが 150° である正多角形は、正何角形だろう。n についての方程式をつくって、求めよう。', 2),
      B(3, T_QC)
    ]
  };
  DEF.checks.push(chk('第5時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('heikou_new-05', DEF);
})();
