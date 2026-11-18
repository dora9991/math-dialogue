/* 平行と合同（新しい形） 第10時：合同条件を使って、合同な三角形を見つけよう。 元：data/lesson_heikou_10.js を、新しい形に組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（たこ形 ABCD の △ABC と △ADC は合同といえるか。等しいものを3つさがす）。個人3分 → ペア3分 → ことば（合同条件・共通）→ 例題（重なった三角形 △ABE と △ACD。共通な角に気づく。空欄あり）。
     元の「等しいものの見つけ方」の欄は、対頂角・錯角にふれると、考えようの見方が出てしまうので、共通な辺・角だけにした。
   ・演習プリントは表裏：表＝確かめる 2問（辺が共通・錯角）・使ってみる 4問（対頂角・3つの角・あと1つ・2辺と間にない角）／裏＝ひろげる 1問（元の考えよう：AB∥CD の図で、△AOB≡△DOC といえるために、あと何がわかればよいか。答えは載せない。発展は使わない）・チャレンジ★★ 1問（元の入試（7）：正方形で、合同と角の大きさ。ヒントカードつき）。
     元の標準（4）は、「3つの角」（4）と「2辺と間にない角」（6）の2問に分け、元の応用（6）の図（2つの三角形）は、問いを文だけにした。元の入試（8）（正三角形）は使わない。
     第9時の考えようの答え（2辺と、その間にない角）は、この時間のはじめに先生が伝えている前提で、（6）で扱う。
   ・数値・図は、元と同じ。答えは checks で、座標から長さ・角を計算し直した（合同条件の形・6つの要素がすべて等しいこと・図の印・合同でない例・∠APB＝90° など）。答えの文は、データから作っている。
   ・範囲：合同条件（3つ）・共通・対頂角・平行線の錯角・三角形の内角の和は学習ずみ。証明（仮定・結論・根拠）は、第11時以降なので使わない。
   検算：node tools/verify.cjs heikou_new-10　／　見た目：node tools/check.cjs <出力先> heikou_new-10 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = d => d * Math.PI / 180;
  const pol = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // 直線 p1p2 と直線 p3p4 の交点
  const ints = (p1, p2, p3, p4) => { const d1 = [p2[0] - p1[0], p2[1] - p1[1]], d2 = [p4[0] - p3[0], p4[1] - p3[1]], den = d1[0] * d2[1] - d1[1] * d2[0], t = ((p3[0] - p1[0]) * d2[1] - (p3[1] - p1[1]) * d2[0]) / den; return [p1[0] + d1[0] * t, p1[1] + d1[1] * t]; };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     D：長さ（'AB'）　AN：角の大きさ（度。'∠ABC' は B が頂点）　VAL：長さか角
     CONG(P, c)：c＝{ t1, t2, eq, kind }。△t1 と △t2（頂点を対応する順に）の、等しいと言った組 eq が、対応する辺・角で、座標から計算して等しく、kind（SSS・SAS・ASA）の形になっていて、6つの要素がすべて等しいこと
     FIGOK(f)：図の印。同じ本数の印の辺が等しい・同じ本数の弧の角が等しい・同じ番号の平行のしるしの線が平行
     arith(t)：答えの文の中の、数だけの「…＝…＝…」（180°−35°−55°＝90° など）が、計算として正しいか */
  const D = (P, s) => Math.hypot(P[s[0]][0] - P[s[1]][0], P[s[0]][1] - P[s[1]][1]);
  const AN = (P, s) => { const [a, v, b] = [...s.replace('∠', '')], u = [P[a][0] - P[v][0], P[a][1] - P[v][1]], w = [P[b][0] - P[v][0], P[b][1] - P[v][1]]; return Math.acos(Math.max(-1, Math.min(1, (u[0] * w[0] + u[1] * w[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(w[0], w[1]))))) * 180 / Math.PI; };
  const VAL = (P, s) => (s[0] === '∠' ? AN(P, s) : D(P, s));
  const CONG = (P, c) => {
    const m = {}; [...c.t1].forEach((ch, i) => { m[ch] = c.t2[i]; });
    const srt = s => [...s].sort().join(''), isA = s => s[0] === '∠', letters = s => s.replace('∠', ''), vx = s => s[2], inT = (s, t) => [...letters(s)].every(ch => t.includes(ch));
    let ok = c.eq.every(([x, y]) => isA(x) === isA(y) && inT(x, c.t1) && inT(y, c.t2) && near(VAL(P, x), VAL(P, y)));
    ok = ok && c.eq.every(([x, y]) => { const a = letters(x), b = letters(y); return isA(x) ? (m[a[1]] === b[1] && srt(m[a[0]] + m[a[2]]) === srt(b[0] + b[2])) : srt([...a].map(ch => m[ch]).join('')) === srt(b); });
    const S = c.eq.filter(e => !isA(e[0])), A = c.eq.filter(e => isA(e[0])), sides = [...new Set(S.map(e => srt(e[0])))];
    if (c.kind === 'SSS') ok = ok && S.length === 3 && A.length === 0 && sides.length === 3;
    if (c.kind === 'SAS') ok = ok && S.length === 2 && A.length === 1 && sides.length === 2 && [...sides[0]].filter(ch => sides[1].includes(ch)).length === 1 && [...sides[0]].filter(ch => sides[1].includes(ch))[0] === vx(A[0][0]);
    if (c.kind === 'ASA') ok = ok && S.length === 1 && A.length === 2 && vx(A[0][0]) !== vx(A[1][0]) && [...S[0][0]].every(ch => A.some(a => vx(a[0]) === ch));
    const t1 = [...c.t1], t2 = [...c.t2];
    return ok && [0, 1, 2].every(i => near(D(P, t1[i] + t1[(i + 1) % 3]), D(P, t2[i] + t2[(i + 1) % 3])) && near(AN(P, '∠' + t1[(i + 2) % 3] + t1[i] + t1[(i + 1) % 3]), AN(P, '∠' + t2[(i + 2) % 3] + t2[i] + t2[(i + 1) % 3])));
  };
  const FIGOK = f => {
    const P = f.pts, tk = {}, ak = {}, pr = {};
    f.tick.forEach(([a, b, n]) => { (tk[n] = tk[n] || []).push(D(P, a + b)); });
    f.ang.forEach(g => { if (g.k) (ak[g.k] = ak[g.k] || []).push(AN(P, '∠' + g.a + g.at + g.b)); });
    f.par.forEach(([a, b, n]) => { (pr[n] = pr[n] || []).push([P[b][0] - P[a][0], P[b][1] - P[a][1]]); });
    const eqAll = o => Object.values(o).every(v => v.length >= 2 && v.every(x => near(x, v[0])));
    return eqAll(tk) && eqAll(ak) && Object.values(pr).every(v => v.length >= 2 && v.every(w => Math.abs(w[0] * v[0][1] - w[1] * v[0][0]) < 1e-9 * Math.hypot(w[0], w[1]) * Math.hypot(v[0][0], v[0][1])));
  };
  const arith = t => {
    const S = String(t).replace(/°/g, ''), re = /[0-9.(][0-9.()+\-−×÷\[\]\/]*(?:＝[0-9.(][0-9.()+\-−×÷\[\]\/]*)+/g;
    let m, ok = true;
    while ((m = re.exec(S))) {
      if (m.index > 0 && /[0-9.()+\-−×÷\[\]\/A-Za-z]/.test(S[m.index - 1])) continue;
      const ps = m[0].split('＝');
      if (ps.some(p => (p.match(/\(/g) || []).length !== (p.match(/\)/g) || []).length)) continue;
      if (ps.some(p => /[+\-−×÷\/]$/.test(p))) continue;
      let vs;
      try { vs = ps.map(p => new Function('return ' + p.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/'))()); } catch (e) { continue; }
      if (vs.some(v => !(Math.abs(v - vs[0]) < 1e-9 * Math.max(1, Math.abs(vs[0]))))) ok = false;
    }
    return ok;
  };
  const LIB = 'const D = ' + D + '; const AN = ' + AN + '; const VAL = ' + VAL + '; const CONG = ' + CONG + '; const FIGOK = ' + FIGOK + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 図の道具 ----------------
     given：問題文の「〜＝〜」の組。辺の組は、同じ本数の印（tick）、角の組は、同じ本数の弧（ang）になる（図と答えがずれない） */
  const mark = given => { const tick = [], ang = []; let ns = 0, na = 0; (given || []).forEach(g => { if (g[0][0] === '∠') { na++; g.forEach(s => { const [a, v, b] = [...s.replace('∠', '')]; ang.push({ at: v, a, b, n: na, k: na }); }); } else { ns++; g.forEach(s => tick.push([s[0], s[1], ns])); } }); return { tick, ang }; };
  const figData = f => { const mk = mark(f.given); return { pts: f.pts, tick: mk.tick.concat(f.tick || []), ang: mk.ang.concat(f.ang || []), par: f.par || [] }; };
  // 平行のしるしと同じ辺に、等しい印をつけるときは、等しい印を、辺の中点からずらして（辺の 18〜38％の所に）かく（重ならないように）
  const geoOf = (f, o) => {
    const d = figData(f), P = f.pts, key = (x, y) => [x, y].sort().join(''), pk = d.par.map(q => key(q[0], q[1]));
    const tick = d.tick.map(([x, y, n, pos]) => (pk.includes(key(x, y)) ? [[P[x][0] + (P[y][0] - P[x][0]) * 0.18, P[x][1] + (P[y][1] - P[x][1]) * 0.18], [P[x][0] + (P[y][0] - P[x][0]) * 0.38, P[x][1] + (P[y][1] - P[x][1]) * 0.38], n] : [x, y, n, pos]));
    return GEO(Object.assign({ poly: f.poly, segs: f.segs, vl: f.vl, dots: f.dots, size: f.size, pad: f.pad, a: f.a }, d, { tick }, o || {}));
  };
  // 図の見出し（図1・図2 …）を、図の上に書く
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const KIND = { SSS: '3組の辺', SAS: '2組の辺とその間の角', ASA: '1組の辺とその両端の角' };
  const srt = s => [...s].sort().join('');
  const pairText = e => e[2] || (e[0][0] !== '∠' && srt(e[0]) === srt(e[1]) ? e[0] + ' は共通' : e[0] + '＝' + e[1]);
  const condLine = c => c.eq.map(pairText).join('、');
  const cgText = c => '△' + c.t1 + '≡△' + c.t2 + '\n' + condLine(c) + '\n' + KIND[c.kind] + 'が、それぞれ等しい。';

  /* ---------------- 問題の図と、答えの組（座標から作る） ---------------- */
  // 今日の問い：たこ形 ABCD。AB＝AD、CB＝CD。AC は共通 → 3組の辺
  const F_KITE = { pts: { A: [0, 3.2], B: [-2, 0.9], C: [0, -1.8], D: [2, 0.9] }, poly: 'ABCD', segs: ['AC'], vl: 'ABCD', pad: 5, given: [['AB', 'AD'], ['CB', 'CD']] };
  const C_KITE = { t1: 'ABC', t2: 'ADC', eq: [['AB', 'AD'], ['CB', 'CD'], ['AC', 'AC']], kind: 'SSS' };
  // 例題：重なった三角形。AB＝AC、AD＝AE（D は AB 上、E は AC 上）。∠A は共通 → 2組の辺とその間の角
  const OVA = [0, 4.4], OVB = [-2.6, 0], OVC = [2.6, 0], OVD = lerp(OVA, OVB, 0.4), OVE = lerp(OVA, OVC, 0.4);
  const F_OV = { pts: { A: OVA, B: OVB, C: OVC, D: OVD, E: OVE }, poly: 'ABC', segs: ['BE', 'CD'], vl: { A: 'A', B: 'B', C: 'C', D: ['D', 180], E: ['E', 0] }, given: [['AB', 'AC'], ['AD', 'AE']] };
  const C_OV = { t1: 'ABE', t2: 'ACD', eq: [['AB', 'AC'], ['AE', 'AD'], ['∠BAE', '∠CAD', '∠A は共通']], kind: 'SAS' };
  // ひろげる（7）：線分 AD と BC が点 O で交わり、AB∥CD。図は AB＜CD（合同でない形）。答えは載せない
  const GA = [-2.2, 1.6], GB = [1.8, 1.6], GC = [-2.5, -1.6], GD = [2.5, -1.6], GO = ints(GA, GD, GB, GC);
  const F_HG = { pts: { A: GA, B: GB, C: GC, D: GD, O: GO }, segs: ['AB', 'CD', 'AD', 'BC'], vl: { A: ['A', 135], B: ['B', 45], C: ['C', 225], D: ['D', 315], O: ['O', 0, 3.2] }, par: [['A', 'B', 1], ['C', 'D', 1]], dots: ['O'] };
  const HG_PLUS = [['AO', 'DO'], ['BO', 'CO'], ['AB', 'DC']];   // あと1つ（辺）
  // 確かめる（1）AB＝AC、D は辺 BC の中点 → △ABD≡△ACD（3組の辺。AD は共通）
  const F_ISO = { pts: { A: [0, 3.4], B: [-2.8, 0], C: [2.8, 0], D: [0, 0] }, poly: 'ABC', segs: ['AD'], vl: { A: 'A', B: ['B', 225], C: ['C', 315], D: ['D', 270] }, pad: 5, given: [['AB', 'AC'], ['BD', 'CD']] };
  const C_ISO = { t1: 'ABD', t2: 'ACD', eq: [['AB', 'AC'], ['BD', 'CD'], ['AD', 'AD']], kind: 'SSS' };
  // 確かめる（2）AB∥DC、AB＝DC → △ABC≡△CDA（2組の辺とその間の角。錯角と共通な辺）
  const F_PAR = { pts: { A: [0, 2.2], B: [3.6, 2.2], C: [2.8, 0], D: [-0.8, 0] }, poly: 'ABCD', segs: ['AC'], vl: { A: ['A', 135], B: ['B', 45], C: ['C', 315], D: ['D', 225] }, pad: 5, given: [['AB', 'DC']], par: [['A', 'B', 1], ['D', 'C', 1]] };
  const C_PAR = { t1: 'ABC', t2: 'CDA', eq: [['AB', 'CD'], ['∠BAC', '∠DCA', '∠BAC＝∠DCA（錯角）'], ['AC', 'CA', 'AC は共通']], kind: 'SAS' };
  // 使ってみる（3）線分 AB と CD が点 O で交わり、OA＝OB、∠OAC＝∠OBD → △AOC≡△BOD（1組の辺とその両端の角。対頂角）
  const XA = [-2.6, 1.0], XC = [-1.4, -1.7];
  const F_X = { pts: { A: XA, B: [-XA[0], -XA[1]], C: XC, D: [-XC[0], -XC[1]], O: [0, 0] }, segs: ['AB', 'CD', 'AC', 'BD'], vl: { A: ['A', 150], B: ['B', 330], C: ['C', 210], D: ['D', 30], O: ['O', 90, 3.2] }, pad: 5, given: [['OA', 'OB'], ['∠OAC', '∠OBD']] };
  const C_X = { t1: 'AOC', t2: 'BOD', eq: [['∠OAC', '∠OBD'], ['AO', 'BO'], ['∠AOC', '∠BOD', '∠AOC＝∠BOD（対頂角）']], kind: 'ASA' };
  // 使ってみる（5）AB＝AD だけがわかっている四角形。あと1つ：CB＝CD（3組の辺）／∠BAC＝∠DAC（2組の辺とその間の角）。たこ形の図で、どちらでも合同になることを確かめる
  const C_K2a = { t1: 'ABC', t2: 'ADC', eq: [['AB', 'AD'], ['CB', 'CD'], ['AC', 'AC']], kind: 'SSS' };
  const C_K2b = { t1: 'ABC', t2: 'ADC', eq: [['AB', 'AD'], ['∠BAC', '∠DAC'], ['AC', 'AC']], kind: 'SAS' };
  // 使ってみる（6）AB, BC と ∠C が等しいが、合同でない：∠C＝35°、BC＝EF＝4.6、AB＝DE＝3.4（A が鋭角・鈍角の2つ）
  const SSA = (() => {
    const g = 35, a = 4.6, c = 3.4, sA = a * Math.sin(rad(g)) / c, A1 = Math.asin(sA) * 180 / Math.PI, A2 = 180 - A1;
    const tri = A => { const B = 180 - g - A, b = c * Math.sin(rad(B)) / Math.sin(rad(g)); return { C: [0, 0], B: [a, 0], A: pol(b, g) }; };
    const t1 = tri(A1), t2 = tri(A2), sh = p => [p[0] + a + 2.2, p[1]];
    return { g, a, c, A1, A2, P: { A: t1.A, B: t1.B, C: t1.C, D: sh(t2.A), E: sh(t2.B), F: sh(t2.C) } };
  })();
  // チャレンジ（8）正方形 ABCD の辺 BC 上に E、辺 CD 上に F。BE＝CF。AE と BF の交点 P。∠BAE＝35° のとき ∠APB＝90°
  const T35 = Math.tan(rad(35));
  const SQE = [1, T35], SQF = [1 - T35, 1], SQP = ints([0, 0], SQE, [1, 0], SQF);
  const F_SQ = { pts: { A: [0, 0], B: [1, 0], C: [1, 1], D: [0, 1], E: SQE, F: SQF, P: SQP }, poly: 'ABCD', segs: ['AE', 'BF'], vl: { A: ['A', 225], B: ['B', 315], C: ['C', 45], D: ['D', 135], E: ['E', 0], F: ['F', 90], P: ['P', 170, 3.4] }, tick: [['B', 'E', 1, 0.75], ['C', 'F', 1]], ang: [{ at: 'A', a: 'B', b: 'E', t: '35°', n: 1, r: 9, lr: 12.5 }], a: { ang: [{ at: 'P', a: 'A', b: 'B', right: true, r: 4.6 }, { at: 'B', a: 'C', b: 'F', t: '35°', n: 1, r: 8, lr: 11.5 }] } };
  const C_SQ = { t1: 'ABE', t2: 'BCF', eq: [['AB', 'BC'], ['BE', 'CF'], ['∠ABE', '∠BCF']], kind: 'SAS' };
  // 小テスト（1）ア〜エ　（2）AB＝CD、AD＝CB（対角線 AC）　（3）AD∥BC、AD＝CB（対角線 BD）　チャレンジ：正五角形
  const QOPT = [
    { k: 'ア', t: 'AB＝DE、AC＝DF、∠A＝∠D', c: { t1: 'ABC', t2: 'DEF', eq: [['AB', 'DE'], ['∠BAC', '∠EDF'], ['AC', 'DF']], kind: 'SAS' } },
    { k: 'イ', t: 'AB＝DE、BC＝EF、∠C＝∠F', no: 'ssa' },
    { k: 'ウ', t: 'BC＝EF、∠B＝∠E、∠C＝∠F', c: { t1: 'ABC', t2: 'DEF', eq: [['∠ABC', '∠DEF'], ['BC', 'EF'], ['∠BCA', '∠EFD']], kind: 'ASA' } },
    { k: 'エ', t: '∠A＝∠D、∠B＝∠E、∠C＝∠F', no: 'aaa' }
  ];
  const F_Q2 = { pts: { A: [0, 2.3], B: [-1.4, 0], C: [2.4, 0], D: [3.8, 2.3] }, poly: 'ABCD', segs: ['AC'], vl: { A: ['A', 120], B: ['B', 225], C: ['C', 315], D: ['D', 45] }, given: [['AB', 'CD'], ['AD', 'CB']] };
  const C_Q2 = { t1: 'ABC', t2: 'CDA', eq: [['AB', 'CD'], ['CB', 'AD'], ['AC', 'CA', 'AC は共通']], kind: 'SSS' };
  const F_Q3 = { pts: { A: [0.3, 2.2], B: [-0.9, 0], C: [2.7, 0], D: [3.9, 2.2] }, poly: 'ABCD', segs: ['BD'], vl: { A: ['A', 135], B: ['B', 225], C: ['C', 315], D: ['D', 45] }, given: [['AD', 'CB']], par: [['A', 'D', 1], ['B', 'C', 1]] };
  const C_Q3 = { t1: 'ADB', t2: 'CBD', eq: [['AD', 'CB'], ['∠ADB', '∠CBD', '∠ADB＝∠CBD（錯角）'], ['DB', 'BD', 'BD は共通']], kind: 'SAS' };
  const PENT = (() => { const p = {}; 'ABCDE'.split('').forEach((c, i) => { p[c] = pol(3, 90 - 72 * i); }); return p; })();
  const F_PENT = { pts: PENT, poly: 'ABCDE', segs: ['AC', 'BD'], vl: { A: ['A', 90], B: ['B', 18], C: ['C', 306], D: ['D', 234], E: ['E', 162] }, given: [['AB', 'BC', 'CD', 'DE', 'EA'], ['∠EAB', '∠ABC', '∠BCD', '∠CDE', '∠DEA']] };
  const C_PENT = { t1: 'ABC', t2: 'BCD', eq: [['AB', 'BC'], ['∠ABC', '∠BCD'], ['BC', 'CD']], kind: 'SAS' };

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const A_KITE = cgText(C_KITE);
  const A_OV = cgText(C_OV);
  const A_FIND = '共通な辺・共通な角は、どちらの三角形にもふくまれる。\n図に印をつけて、等しいものを3つそろえる。';
  const A_ISO = '△ABD≡△ACD\nAB＝AC、BD＝CD、AD は共通\n3組の辺が、それぞれ等しい。';
  const A_PAR = '△ABC≡△CDA\nAB＝CD、AC は共通\n∠BAC＝∠DCA（錯角）\n2組の辺とその間の角';
  const A_X = '△AOC≡△BOD\nAO＝BO、∠OAC＝∠OBD\n∠AOC＝∠BOD（対頂角）\n1組の辺とその両端の角';
  const A_AAA = 'いえない。\n3つの角が等しくても、\n辺の長さがちがうことがある。\n（例）大きさだけ 2倍にした三角形';
  const A_K2 = 'CB＝CD　（3組の辺）\n∠BAC＝∠DAC\n（2組の辺とその間の角）';
  const A_SSA = '∠C は、2辺 AB、BC の\n間の角ではないから、\n合同条件にあてはまらない。';
  const A_SQ = '① △ABE≡△BCF\n　AB＝BC、BE＝CF、\n　∠ABE＝∠BCF＝90°\n　2組の辺とその間の角\n② ∠CBF＝∠BAE＝35°\n　∠ABF＝90°−35°＝55°\n　∠APB＝180°−35°−55°＝90°';
  const A_Q1 = 'ア（' + KIND.SAS + '）、ウ（' + KIND.ASA + '）';
  const A_Q2 = cgText(C_Q2), A_Q3 = cgText(C_Q3);
  const A_PENT = cgText(C_PENT).replace('が、それぞれ等しい。', 'が、それぞれ等しい。\n対応する辺だから　AC＝BD');

  const DEF = {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第10時', title: '合同条件を使って、合同な三角形を見つけよう',
    summary: 'たこ形・重なった三角形の中から、等しい辺や角（共通な辺・角、対頂角、錯角）を見つけ、合同条件を使って合同な三角形を判断する。ひろげるは、「AB∥CD の図で、あと何がわかれば合同といえるか」。',
    head: '平行と合同　第10時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：たこ形。図の印（AB＝AD、CB＝CD）と、答えの組（3組の辺）
      chk('第10時 今日の問い', `const f = ${J(figData(F_KITE))}; return FIGOK(f) && CONG(f.pts, ${J(C_KITE)}) && ${J(A_KITE)}.split('\\n')[1] === ${J(condLine(C_KITE))} && D(f.pts, 'AB') !== D(f.pts, 'CB');`),
      // 例題：D は AB 上、E は AC 上。AB＝AC、AD＝AE。∠BAE と ∠CAD は同じ角（共通）。△ABE≡△ACD
      chk('第10時 例題', `const f = ${J(figData(F_OV))}, P = f.pts; const onSeg = (a, b, c) => near(D(P, a + c) + D(P, c + b), D(P, a + b)); return FIGOK(f) && onSeg('A', 'B', 'D') && onSeg('A', 'C', 'E') && CONG(P, ${J(C_OV)}) && near(AN(P, '∠BAE'), AN(P, '∠BAC')) && near(AN(P, '∠CAD'), AN(P, '∠BAC'));`),
      // ひろげる（7）（答えは載せない。ここで確かめるだけ）：図は AB∥CD で、AB≠CD。等しい角は3組（対頂角と錯角2つ）。角だけでは合同でない。O のまわりに C・D を k 倍した図で、AO＝DO・BO＝CO・AB＝DC のどれが成り立っても k＝1 で、ASA で合同
      chk('第10時 ひろげる（7）', `const f = ${J(figData(F_HG))}, P = f.pts; const mk = k => { const O = P.O; return { A: P.A, B: P.B, O, D: [O[0] + (O[0] - P.A[0]) * k, O[1] + (O[1] - P.A[1]) * k], C: [O[0] + (O[0] - P.B[0]) * k, O[1] + (O[1] - P.B[1]) * k] }; }; const kk = [1.25, 0.7, 1.6]; const plus = ${J(HG_PLUS)}; return FIGOK(f) && Math.abs((P.B[1] - P.A[1]) * (P.D[0] - P.C[0]) - (P.B[0] - P.A[0]) * (P.D[1] - P.C[1])) < 1e-9 && (P.D[0] - P.C[0]) > (P.B[0] - P.A[0]) && near(AN(P, '∠OAB'), AN(P, '∠ODC')) && near(AN(P, '∠OBA'), AN(P, '∠OCD')) && near(AN(P, '∠AOB'), AN(P, '∠DOC')) && near(D(P, 'AO') + D(P, 'OD'), D(P, 'AD')) && near(D(P, 'BO') + D(P, 'OC'), D(P, 'BC')) && kk.every(k => { const Q = mk(k); return near(AN(Q, '∠OAB'), AN(Q, '∠ODC')) && near(AN(Q, '∠OBA'), AN(Q, '∠OCD')) && near(AN(Q, '∠AOB'), AN(Q, '∠DOC')) && !near(D(Q, 'AB'), D(Q, 'DC')) && near(D(Q, 'DO') / D(Q, 'AO'), k) && near(D(Q, 'CO') / D(Q, 'BO'), k) && near(D(Q, 'DC') / D(Q, 'AB'), k); }) && (() => { const Q = mk(1); return plus.every(([x, y]) => near(D(Q, x), D(Q, y))) && CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OAB', '∠ODC'], ['AO', 'DO'], ['∠AOB', '∠DOC']] }) && CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OBA', '∠OCD'], ['BO', 'CO'], ['∠AOB', '∠DOC']] }) && CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OAB', '∠ODC'], ['AB', 'DC'], ['∠OBA', '∠OCD']] }); })();`),
      // 確かめる（1）（2）、使ってみる（3）
      chk('第10時 確かめる（1）', `const f = ${J(figData(F_ISO))}; return FIGOK(f) && CONG(f.pts, ${J(C_ISO)}) && near(f.pts.D[0], (f.pts.B[0] + f.pts.C[0]) / 2) && near(f.pts.D[1], (f.pts.B[1] + f.pts.C[1]) / 2) && ${J(A_ISO)}.includes('AD は共通');`),
      chk('第10時 確かめる（2）', `const f = ${J(figData(F_PAR))}; return FIGOK(f) && CONG(f.pts, ${J(C_PAR)}) && ${J(A_PAR)}.includes('∠BAC＝∠DCA（錯角）');`),
      chk('第10時 使ってみる（3）', `const f = ${J(figData(F_X))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_X)}) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && near(D(P, 'OA') + D(P, 'OB'), D(P, 'AB')) && near(D(P, 'OC') + D(P, 'OD'), D(P, 'CD')) && ${J(A_X)}.includes('対頂角');`),
      // 使ってみる（4）：3つの角が等しくても合同でない（△ABC を 2倍にした △DEF：3つの角は等しく、辺は 2倍）
      chk('第10時 使ってみる（4）', `const T1 = { A: [0, 3], B: [-1, 0], C: [3, 0] }, sc = {}; Object.keys(T1).forEach((k, i) => { sc['DEF'[i]] = [T1[k][0] * 2 + 30, T1[k][1] * 2]; }); const Q = Object.assign({}, T1, sc); return near(AN(Q, '∠CAB'), AN(Q, '∠FDE')) && near(AN(Q, '∠ABC'), AN(Q, '∠DEF')) && near(AN(Q, '∠BCA'), AN(Q, '∠EFD')) && !near(D(Q, 'AB'), D(Q, 'DE')) && near(D(Q, 'DE'), 2 * D(Q, 'AB')) && ${J(A_AAA)}.includes('2倍');`),
      // 使ってみる（5）AB＝AD だけの四角形は、CB≠CD でも、∠BAC≠∠DAC でもありうる。CB＝CD なら、また ∠BAC＝∠DAC なら、合同（図はたこ形。AC を軸に、C を動かして確かめる）
      chk('第10時 使ってみる（5）', `const S = ${J(figData(F_KITE))}.pts; const P = { A: [0, 3.2], B: [-2, 0.9], D: [2, 0.9] }; let ok = near(D(S, 'AB'), D(S, 'AD')) && near(D(S, 'CB'), D(S, 'CD')) && near(AN(S, '∠BAC'), AN(S, '∠DAC')) && CONG(S, ${J(C_K2a)}) && CONG(S, ${J(C_K2b)}); const Cn = [0.8, -1.6], Q = Object.assign({ C: Cn }, P); ok = ok && !near(D(Q, 'CB'), D(Q, 'CD')) && !near(AN(Q, '∠BAC'), AN(Q, '∠DAC')); return ok && ${J(A_K2)}.includes('CB＝CD') && ${J(A_K2)}.includes('∠BAC＝∠DAC');`),
      // 使ってみる（6）AB, BC と ∠C が等しいが、合同でない。∠C は AB と BC の間の角でない（∠B が間）
      chk('第10時 使ってみる（6）', `const S = ${J(SSA.P)}; return near(D(S, 'AB'), 3.4) && near(D(S, 'DE'), 3.4) && near(D(S, 'BC'), 4.6) && near(D(S, 'EF'), 4.6) && near(AN(S, '∠BCA'), 35) && near(AN(S, '∠EFD'), 35) && !near(D(S, 'CA'), D(S, 'FD')) && !near(AN(S, '∠CAB'), AN(S, '∠FDE')) && near(AN(S, '∠CAB') + AN(S, '∠FDE'), 180) && AN(S, '∠CAB') < 90 && AN(S, '∠FDE') > 90;`),
      // チャレンジ（8）正方形。BE＝CF（E は BC 上、F は CD 上）。△ABE≡△BCF。∠BAE＝35° のとき ∠CBF＝35°、∠ABF＝55°、∠APB＝90°
      chk('第10時 チャレンジ（8）', `const f = ${J(figData(F_SQ))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_SQ)}) && near(AN(P, '∠BAE'), 35) && near(AN(P, '∠CBF'), 35) && near(AN(P, '∠ABF'), 55) && near(AN(P, '∠APB'), 90) && near(AN(P, '∠ABC'), 90) && near(AN(P, '∠BCD'), 90) && near(AN(P, '∠ABE'), 90) && near(AN(P, '∠BCF'), 90) && near(D(P, 'AB'), D(P, 'BC')) && near(D(P, 'BE') + D(P, 'EC'), D(P, 'BC')) && near(D(P, 'CF') + D(P, 'FD'), D(P, 'CD')) && near(180 - 35 - 55, 90) && ${J(A_SQ)}.includes('∠APB＝180°−35°−55°＝90°');`),
      // 小テスト（1）：ア、ウが合同（形も座標で確かめる）。イは SSA、エは AAA（印の3組が等しいのに合同でない）
      chk('第10時 小テスト（1）', `const O = ${J(QOPT)}, S = ${J(SSA.P)}; const T1 = { A: [0, 3], B: [-1, 0], C: [3, 0] }; const P = Object.assign({}, T1, { D: [20, 3], E: [19, 0], F: [23, 0] }); const sc = {}; Object.keys(T1).forEach((k, i) => { sc['DEF'[i]] = [T1[k][0] * 2 + 30, T1[k][1] * 2]; }); const Q = Object.assign({}, T1, sc); return O.filter(o => o.c).every(o => CONG(P, o.c)) && O.map(o => o.c ? 1 : 0).join('') === '1010' && near(D(S, 'AB'), D(S, 'DE')) && near(D(S, 'BC'), D(S, 'EF')) && near(AN(S, '∠BCA'), AN(S, '∠EFD')) && !near(D(S, 'CA'), D(S, 'FD')) && near(AN(Q, '∠CAB'), AN(Q, '∠FDE')) && near(AN(Q, '∠ABC'), AN(Q, '∠DEF')) && near(AN(Q, '∠BCA'), AN(Q, '∠EFD')) && !near(D(Q, 'AB'), D(Q, 'DE')) && ${J(A_Q1)}.includes('ア') && ${J(A_Q1)}.includes('ウ');`),
      chk('第10時 小テスト（2）（3）', `const a = ${J(figData(F_Q2))}, b = ${J(figData(F_Q3))}; return FIGOK(a) && CONG(a.pts, ${J(C_Q2)}) && FIGOK(b) && CONG(b.pts, ${J(C_Q3)}) && near(AN(b.pts, '∠ADB'), AN(b.pts, '∠CBD'));`),
      // チャレンジ：正五角形。5辺が等しく、5つの内角が等しい。△ABC≡△BCD（2組の辺とその間の角）。AC＝BD
      chk('第10時 小テスト チャレンジ', `const f = ${J(figData(F_PENT))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_PENT)}) && near(AN(P, '∠ABC'), 108) && near(D(P, 'AC'), D(P, 'BD')) && ${J(A_PENT)}.includes('AC＝BD');`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('合同条件を使って、合同な三角形を見つけよう'),
      C2([
        K('今日の問い', '右の図は、AB＝AD、CB＝CD の四角形 ABCD に、対角線 AC をひいたものである。△ABC と △ADC は、合同といえるだろうか。合同なら ≡ で表し、使った合同条件も答えよう。', 5)
      ], [
        F(6, geoOf(F_KITE))
      ], '3:2'),
      T('①', '自分の考え（3分）　等しいものを3つさがして、書こう。', 1),
      B(3, A_KITE),
      T('②', 'ペアの考え（3分）　見つけ方を、くらべよう。', 1),
      B(2, ''),
      G(1),
      WD('合同条件は、{{3組の辺}}・{{2組の辺とその間の角}}・{{1組の辺とその両端の角}}が、それぞれ等しいこと。\n2つの三角形のどちらにもふくまれる辺（角）を、{{共通}}な辺（角）という。', 5, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '右の図で、AB＝{{AC}}、AD＝{{AE}} である。BE、CD をひくとき、合同な三角形を ≡ で表し、使った合同条件も答えよう。', 4),
        B(3, A_OV)
      ], [
        F(7, geoOf(F_OV, { a: { ang: [{ at: 'A', a: 'B', b: 'C', n: 1, r: 7 }] } }))
      ], '3:2'),
      T('', '【等しいものの見つけ方】どこに目をつけたか、書こう。', 1),
      B(2, A_FIND)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 合同条件は、{{3組の辺}}・{{2組の辺とその間の角}}・{{1組の辺とその両端の角}}が、それぞれ等しいこと。\n② 2つの三角形のどちらにもふくまれる辺（角）を、{{共通}}な辺（角）という。', 3, { label: 'ことば' }),
      F(5, cap(geoOf(F_ISO), '図1'), cap(geoOf(F_PAR), '図2'), cap(geoOf(F_X), '図3')),
      C2([
        T('（1）', '図1で、合同な三角形を ≡ で表し、使った合同条件も答えよう。', 2),
        B(3, A_ISO)
      ], [
        T('（2）', '図2で、合同な三角形を ≡ で表し、使った合同条件も答えよう。', 2),
        B(4, A_PAR)
      ], '1:1'),
      MA('【説明】（2）で、等しいものを見つけた場所を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '等しいものを見つけて、考えよう。'),
      C2([
        T('（3）', '図3で、AB と CD は点 O で交わる。合同な三角形を ≡ で表し、合同条件も答えよう。', 3),
        B(4, A_X)
      ], [
        T('（4）', '3つの角がそれぞれ等しい △ABC と △DEF は、合同といえるだろうか。わけも書こう。', 3),
        B(4, A_AAA)
      ], '1:1'),
      C2([
        T('（5）', '四角形 ABCD で、AB＝AD。対角線 AC をひくとき、△ABC≡△ADC といえるには、あと1つ何がわかればよいか。2通り。', 4),
        B(3, A_K2)
      ], [
        T('（6）', '△ABC と △DEF で、AB＝DE、BC＝EF、∠C＝∠F でも、合同とはいえない。わけを、「間の角」を使って説明しよう。', 4),
        B(3, A_SSA)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：あと何がわかればよいか、見つけよう。'),
      T('（7）', '右の図で、線分 AD と BC は点 O で交わり、AB∥CD である。△AOB≡△DOC といえるために、あと何がわかればよいだろう。いくつか見つけよう。', 2),
      C2([
        T('①', '図の中で、等しい角を見つけて、同じ印をつけよう。見つけた角を書こう。', 3),
        B(2, ''),
        T('②', 'あと何がわかれば、△AOB≡△DOC といえるだろう。「わかること」と「使う合同条件」を、いくつか書こう。', 4),
        B(5, '')
      ], [
        F(9, geoOf(F_HG))
      ], '3:2'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '正方形 ABCD で、BE＝CF（E は辺 BC 上、F は辺 CD 上）。AE と BF の交点を P とする。\n① 合同な三角形を ≡ で表し、合同条件も答えよう。\n② ∠BAE＝35° のとき、∠APB は？', 6),
        B(7, A_SQ)
      ], [
        F(6, geoOf(F_SQ)),
        MA('① BE＝CF のほか、正方形の辺や角から、等しいものを2つ見つけよう。\n② 合同な三角形では、対応する角は等しい。∠BAE と等しい角は、どこかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 片面・5分） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '△ABC と △DEF で、次のことがわかっているとき、△ABC≡△DEF といえるものを、2つ選び、使う合同条件も答えよう。（3点）\n' + QOPT.map((o, i) => o.k + ' ' + o.t + (i % 2 === 0 ? '　　' : (i < 3 ? '\n' : ''))).join(''), 4),
      B(2, A_Q1),
      C2([
        T('（2）', '右の図の四角形 ABCD で、AB＝CD、AD＝CB である。対角線 AC をひくとき、合同な三角形を ≡ で表し、使った合同条件も答えよう。（3点）', 4),
        B(3, A_Q2)
      ], [
        F(7, geoOf(F_Q2))
      ], '3:2'),
      C2([
        T('（3）', '右の図の四角形 ABCD で、AD∥BC、AD＝CB である。対角線 BD をひくとき、合同な三角形を ≡ で表し、使った合同条件も答えよう。（4点）', 4),
        B(3, A_Q3)
      ], [
        F(7, geoOf(F_Q3))
      ], '3:2'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（4）', '右の図は正五角形 ABCDE である。対角線 AC、BD をひくとき、合同な三角形を ≡ で表し、使った合同条件も答えよう。また、AC と BD の長さの関係を答えよう。', 4),
        B(4, A_PENT)
      ], [
        F(8, geoOf(F_PENT))
      ], '3:2')
    ]
  };
  DEF.checks.push(chk('第10時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('heikou_new-10', DEF);
})();
