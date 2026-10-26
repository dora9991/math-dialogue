/* 平行と合同 第10時「合同条件を使って、合同な三角形を見つけよう」：授業計画・ワークシート・演習プリント・小テスト（新しい形）。
   授業ナビ 標準版（hyojun-navi）の第10時をもとに、50分の流れ（ペア学習3＋小テスト7＋解説・発問12＋演習23＋振り返り・回収5）に合わせて、新しく書き直した。
   印刷は3点セット：ワークシート（A4 表裏）／演習プリント（A4 表裏：表＝基礎・標準、裏＝応用・入試レベル）／小テスト（A4 片面・5分・10点満点。最後の1問は、別枠の入試レベル「チャレンジ」）。
   ・型は「例（例題と練習）」。第9時で見つけた合同条件（3組の辺／2組の辺とその間の角／1組の辺とその両端の角）を、図の中で使う。
     学習課題＝たこ形 ABCD（AB＝AD、CB＝CD）で △ABC≡△ADC を見つける（全部印刷）。共通な辺 AC に気づく。ことば＝3つの合同条件（穴埋め）と「共通」。
     例題＝重なった三角形（AB＝AC、AD＝AE）で △ABE≡△ACD を見つける。共通な角 ∠A に気づく。対頂角・錯角にも目をつける、というまとめは、例題の板書で書く。
   ・考えよう＝「線分 AD と BC が点 O で交わり、AB∥CD。△AOB≡△DOC といえるために、あと何がわかればよいか」。
     図には、等しい角が3組ある（対頂角と、錯角2つ）。角だけでは合同といえないので、辺が1組わかればよい。AO＝DO・BO＝CO・AB＝DC のどれでもよい。答え（見方）は、ワークシートにも教卓の解答にも載せない。
     ことば欄には、「角が3組等しいだけでは足りない」「辺がどれか1つでよい」を書かない。図は、わざと AB＜CD（合同でない形）にかいてある。発展は、AB＝DE、∠A＝∠D、∠C＝∠F のとき（内角の和で ∠B＝∠E を示す）。
   ・条件が足りない場合は、演習（標準の（4）オ、応用の（6））で扱う：「2組の辺と、その間でない角」（等しい角が、2辺の間にない）と「3組の角」。相似とは言わない。
   ・checks：問題の図の座標から、辺の長さ・角の大きさを三角関数で計算し直して、問題文の条件（印）・答えの組が成り立つこと、合同条件の種類（3辺／2辺と間の角／1辺と両端の角）の形になっていること、
     6つの要素（3辺・3角）がすべて等しくなること、合同といえない例は、印の3組が等しいのに合同でないこと、を確かめた。答えの文は、データから作っている。
   ・見本（空間図形 第1時）との違い：平面図形の図（GEO）が中心。印（等しい辺・角・平行）は、問題文の条件から自動でつくっている。
   検算：node tools/verify.cjs　／　見た目：node tools/check.cjs */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = d => d * Math.PI / 180;
  const pol = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  // 直線 p1p2 と直線 p3p4 の交点
  const ints = (p1, p2, p3, p4) => { const d1 = [p2[0] - p1[0], p2[1] - p1[1]], d2 = [p4[0] - p3[0], p4[1] - p3[1]], den = d1[0] * d2[1] - d1[1] * d2[0], t = ((p3[0] - p1[0]) * d2[1] - (p3[1] - p1[1]) * d2[0]) / den; return [p1[0] + d1[0] * t, p1[1] + d1[1] * t]; };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     D：長さ（'AB'）　AN：角の大きさ（度。'∠ABC' は B が頂点）　VAL：長さか角
     CONG(P, c)：c＝{ t1, t2, eq, kind }。△t1 と △t2（頂点を対応する順に）の、等しいと言った組 eq（t1 の要素, t2 の要素）が、
                 対応する辺・角で、座標から計算して等しく、kind（SSS・SAS・ASA）の形になっていて、6つの要素がすべて等しいこと
     FIGOK(f)：図の印。同じ本数の印の辺が等しい・同じ本数の弧の角が等しい・同じ番号の平行のしるしの線が平行 */
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
  const LIB = 'const D = ' + D + '; const AN = ' + AN + '; const VAL = ' + VAL + '; const CONG = ' + CONG + '; const FIGOK = ' + FIGOK + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 図の道具 ----------------
     given：問題文の「〜＝〜」の組。辺の組は、同じ本数の印（tick）、角の組は、同じ本数の弧（ang）になる（図と問題文がずれない） */
  const mark = given => { const tick = [], ang = []; let ns = 0, na = 0; (given || []).forEach(g => { if (g[0][0] === '∠') { na++; g.forEach(s => { const [a, v, b] = [...s.replace('∠', '')]; ang.push({ at: v, a, b, n: na, k: na }); }); } else { ns++; g.forEach(s => tick.push([s[0], s[1], ns])); } }); return { tick, ang }; };
  const figData = f => { const mk = mark(f.given); return { pts: f.pts, tick: mk.tick.concat(f.tick || []), ang: mk.ang.concat(f.ang || []), par: f.par || [] }; };
  const geoOf = (f, o) => GEO(Object.assign({ poly: f.poly, segs: f.segs, vl: f.vl, dots: f.dots, size: f.size, pad: f.pad, a: f.a }, figData(f), o || {}));
  const KIND = { SSS: '3組の辺', SAS: '2組の辺とその間の角', ASA: '1組の辺とその両端の角' };
  const srt = s => [...s].sort().join('');
  const pairText = e => e[2] || (e[0][0] !== '∠' && srt(e[0]) === srt(e[1]) ? e[0] + ' は共通' : e[0] + '＝' + e[1]);
  const condLine = c => c.eq.map(pairText).join('、');
  const cgText = c => '△' + c.t1 + '≡△' + c.t2 + '\n' + condLine(c) + '\n' + KIND[c.kind] + 'が、それぞれ等しい。';
  const giv = f => f.given.map(g => g[0] + '＝' + g[1]).join('、');   // 問題文の「AB＝AD、CB＝CD」

  /* ---------------- 問題の図と、答えの組（座標から作る） ---------------- */
  // 学習課題：たこ形 ABCD。AB＝AD、CB＝CD。AC は共通 → 3組の辺
  const F_KITE = { pts: { A: [0, 3.2], B: [-2, 0.9], C: [0, -1.8], D: [2, 0.9] }, poly: 'ABCD', segs: ['AC'], vl: 'ABCD', given: [['AB', 'AD'], ['CB', 'CD']] };
  const C_KITE = { t1: 'ABC', t2: 'ADC', eq: [['AB', 'AD'], ['CB', 'CD'], ['AC', 'AC']], kind: 'SSS' };
  // 例題：重なった三角形。AB＝AC、AD＝AE（D は AB 上、E は AC 上）。∠A は共通 → 2組の辺とその間の角
  const OVA = [0, 4.4], OVB = [-2.6, 0], OVC = [2.6, 0], OVD = lerp(OVA, OVB, 0.55), OVE = lerp(OVA, OVC, 0.55);
  const F_OV = { pts: { A: OVA, B: OVB, C: OVC, D: OVD, E: OVE }, poly: 'ABC', segs: ['BE', 'CD'], vl: { A: 'A', B: 'B', C: 'C', D: ['D', 180], E: ['E', 0] }, given: [['AB', 'AC'], ['AD', 'AE']] };
  const C_OV = { t1: 'ABE', t2: 'ACD', eq: [['AB', 'AC'], ['AE', 'AD'], ['∠BAE', '∠CAD', '∠A は共通']], kind: 'SAS' };
  // 考えよう：線分 AD と BC が点 O で交わり、AB∥CD。図は AB＜CD（合同でない形）
  const GA = [-2.2, 1.6], GB = [1.8, 1.6], GC = [-2.5, -1.6], GD = [2.5, -1.6], GO = ints(GA, GD, GB, GC);
  const F_HG = { pts: { A: GA, B: GB, C: GC, D: GD, O: GO }, segs: ['AB', 'CD', 'AD', 'BC'], vl: { A: ['A', 135], B: ['B', 45], C: ['C', 225], D: ['D', 315], O: ['O', 0, 3.2] }, par: [['A', 'B', 1], ['C', 'D', 1]], dots: ['O'] };
  // 考えよう：C・D を O のまわりに k 倍した図（AB∥CD が保たれる）。k＝1 のとき、AO＝DO・BO＝CO・AB＝DC がどれも成り立つ
    const HG_PLUS = [['AO', 'DO'], ['BO', 'CO'], ['AB', 'DC']];   // あと1つ（辺）
  const C_HG = { t1: 'AOB', t2: 'DOC', kind: 'ASA' };
  // 基礎（1）AB＝AC、D は辺 BC の中点 → △ABD≡△ACD（3組の辺。AD は共通）
  const F_ISO = { pts: { A: [0, 3.4], B: [-2.8, 0], C: [2.8, 0], D: [0, 0] }, poly: 'ABC', segs: ['AD'], vl: { A: 'A', B: ['B', 225], C: ['C', 315], D: ['D', 270] }, given: [['AB', 'AC'], ['BD', 'CD']] };
  const C_ISO = { t1: 'ABD', t2: 'ACD', eq: [['AB', 'AC'], ['BD', 'CD'], ['AD', 'AD']], kind: 'SSS' };
  // 基礎（2）AB∥DC、AB＝DC → △ABC≡△CDA（2組の辺とその間の角。錯角と共通な辺）
  const F_PAR = { pts: { A: [0, 2.2], B: [3.6, 2.2], C: [2.8, 0], D: [-0.8, 0] }, poly: 'ABCD', segs: ['AC'], vl: { A: ['A', 135], B: ['B', 45], C: ['C', 315], D: ['D', 225] }, given: [['AB', 'DC']], par: [['A', 'B', 1], ['D', 'C', 1]] };
  const C_PAR = { t1: 'ABC', t2: 'CDA', eq: [['AB', 'CD'], ['∠BAC', '∠DCA', '∠BAC＝∠DCA（錯角）'], ['AC', 'CA', 'AC は共通']], kind: 'SAS' };
  // 基礎（3）線分 AB と CD が点 O で交わり、OA＝OB、∠OAC＝∠OBD → △AOC≡△BOD（1組の辺とその両端の角。対頂角）
  const XA = [-2.6, 1.0], XC = [-1.4, -1.7];
  const F_X = { pts: { A: XA, B: [-XA[0], -XA[1]], C: XC, D: [-XC[0], -XC[1]], O: [0, 0] }, segs: ['AB', 'CD', 'AC', 'BD'], vl: { A: ['A', 150], B: ['B', 330], C: ['C', 210], D: ['D', 30], O: ['O', 90, 3.2] }, given: [['OA', 'OB'], ['∠OAC', '∠OBD']] };
  const C_X = { t1: 'AOC', t2: 'BOD', eq: [['∠OAC', '∠OBD'], ['AO', 'BO'], ['∠AOC', '∠BOD', '∠AOC＝∠BOD（対頂角）']], kind: 'ASA' };
  // 標準（4）△ABC と △DEF で、3つの条件。ア〜オ
  const OPT = [
    { k: 'ア', t: 'AB＝DE、BC＝EF、CA＝FD', c: { t1: 'ABC', t2: 'DEF', eq: [['AB', 'DE'], ['BC', 'EF'], ['CA', 'FD']], kind: 'SSS' } },
    { k: 'イ', t: 'AB＝DE、BC＝EF、∠B＝∠E', c: { t1: 'ABC', t2: 'DEF', eq: [['AB', 'DE'], ['∠ABC', '∠DEF'], ['BC', 'EF']], kind: 'SAS' } },
    { k: 'ウ', t: '∠A＝∠D、∠B＝∠E、∠C＝∠F', no: 'aaa' },
    { k: 'エ', t: 'AB＝DE、∠A＝∠D、∠B＝∠E', c: { t1: 'ABC', t2: 'DEF', eq: [['∠CAB', '∠FDE'], ['AB', 'DE'], ['∠ABC', '∠DEF']], kind: 'ASA' } },
    { k: 'オ', t: 'AB＝DE、BC＝EF、∠C＝∠F', no: 'ssa' }
  ];
  // 合同でない例：（AB, BC, ∠C）が等しいが、△ABC と △DEF は合同でない。∠C＝35°、BC＝EF＝4.6、AB＝DE＝3.4（正弦定理で、A が鋭角・鈍角の2つ）
  const SSA = (() => {
    const g = 35, a = 4.6, c = 3.4, sA = a * Math.sin(rad(g)) / c, A1 = Math.asin(sA) * 180 / Math.PI, A2 = 180 - A1;
    const tri = A => { const B = 180 - g - A, b = c * Math.sin(rad(B)) / Math.sin(rad(g)); return { C: [0, 0], B: [a, 0], A: pol(b, g) }; };   // C が原点、B が x 軸上、∠C＝g
    const t1 = tri(A1), t2 = tri(A2), sh = p => [p[0] + a + 2.2, p[1]];   // △DEF は、右へずらして並べる
    return { g, a, c, A1, A2, P: { A: t1.A, B: t1.B, C: t1.C, D: sh(t2.A), E: sh(t2.B), F: sh(t2.C) } };
  })();
  // 発展：AB＝DE、∠A＝∠D、∠C＝∠F（△DEF は左右を反転した向き）。内角の和から ∠B＝∠E → 1組の辺 AB とその両端の角が等しい
  const AAS_T = { A: [0, 2.6], B: [-1.4, 0], C: [1.8, 0] };
  const F_AAS = { pts: Object.assign({}, AAS_T, { D: [6, 2.6], E: [7.4, 0], F: [4.2, 0] }), poly: ['ABC', 'DEF'], vl: 'ABCDEF', given: [['AB', 'DE'], ['∠BAC', '∠EDF'], ['∠ACB', '∠DFE']] };
  // 応用（6）AB＝AD だけがわかっている四角形。あと1つ：CB＝CD（3組の辺）／∠BAC＝∠DAC（2組の辺とその間の角）。図は、わざとたこ形でない
  const KA = [0, 3.2];
  const F_K2 = { pts: { A: KA, B: add(KA, pol(3.05, 245)), C: [1.0, -1.6], D: add(KA, pol(3.05, 297)) }, poly: 'ABCD', segs: ['AC'], vl: { A: ['A', 90], B: ['B', 200], C: ['C', 300], D: ['D', 20] }, given: [['AB', 'AD']] };
  const C_K2a = { t1: 'ABC', t2: 'ADC', eq: [['AB', 'AD'], ['CB', 'CD'], ['AC', 'AC']], kind: 'SSS' };
  const C_K2b = { t1: 'ABC', t2: 'ADC', eq: [['AB', 'AD'], ['∠BAC', '∠DAC'], ['AC', 'AC']], kind: 'SAS' };
  const F_K2sym = Object.assign({}, F_KITE);   // 条件を足した図（たこ形）で、合同になることを確かめる
  // 入試（8）正方形 ABCD の辺 BC 上に E、辺 CD 上に F。BE＝CF。AE と BF の交点 P。∠BAE＝35° のとき ∠APB＝90°
  const T35 = Math.tan(rad(35));
  const SQE = [1, T35], SQF = [1 - T35, 1], SQP = ints([0, 0], SQE, [1, 0], SQF);
  const F_SQ = { pts: { A: [0, 0], B: [1, 0], C: [1, 1], D: [0, 1], E: SQE, F: SQF, P: SQP }, poly: 'ABCD', segs: ['AE', 'BF'], vl: { A: ['A', 225], B: ['B', 315], C: ['C', 45], D: ['D', 135], E: ['E', 0], F: ['F', 90], P: ['P', 170, 3.4] }, given: [['BE', 'CF']], ang: [{ at: 'A', a: 'B', b: 'E', t: '35°', n: 1, r: 9, lr: 12.5 }], a: { ang: [{ at: 'P', a: 'A', b: 'B', right: true, r: 4.6 }, { at: 'B', a: 'C', b: 'F', t: '35°', n: 1, r: 8, lr: 11.5 }] } };
  const C_SQ = { t1: 'ABE', t2: 'BCF', eq: [['AB', 'BC', 'AB＝BC（正方形の辺）'], ['∠ABE', '∠BCF', '∠ABE＝∠BCF＝90°（正方形の角）'], ['BE', 'CF']], kind: 'SAS' };
  // 入試（8）正三角形 ABC の辺 BC 上に D、辺 CA 上に E。BD＝CE。AD と BE の交点 P → ∠APE＝60°
  const TA = [0, 2 * Math.sqrt(3)], TB = [-2, 0], TC = [2, 0], TD = lerp(TB, TC, 0.35), TE = lerp(TC, TA, 0.35);
  const F_TRI = { pts: { A: TA, B: TB, C: TC, D: TD, E: TE, P: ints(TA, TD, TB, TE) }, poly: 'ABC', segs: ['AD', 'BE'], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270], E: ['E', 30], P: ['P', 140, 3.4] }, given: [['BD', 'CE']], a: { ang: [{ at: 'P', a: 'A', b: 'E', t: '60°', n: 1, r: 5, lr: 8.5 }] } };
  const C_TRI = { t1: 'ABD', t2: 'BCE', eq: [['AB', 'BC', 'AB＝BC（正三角形の辺）'], ['BD', 'CE'], ['∠ABD', '∠BCE', '∠ABD＝∠BCE＝60°（正三角形の角）']], kind: 'SAS' };
  // 小テスト（1）　（2）AB＝CD、AD＝CB（対角線 AC）　（3）AD∥BC、AD＝CB（対角線 BD）　チャレンジ：正五角形
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
  const A_FIND = '共通な辺・共通な角のほかに、次のところに目をつける。\n・対頂角は等しい\n・平行線の錯角・同位角は等しい';
  const A_ISO = cgText(C_ISO), A_PAR = cgText(C_PAR), A_X = cgText(C_X);
  const A_OPT = 'ア 3組の辺　　イ 2組の辺とその間の角　　ウ ×　　エ 1組の辺とその両端の角　　オ ×\n（ウは3組の角だけ。オは ∠C が、AB と BC の間の角ではない。）';
  const A_K2 = 'AC は共通だから、あと1つで合同条件がそろう。\nCB＝CD　… 3組の辺\n∠BAC＝∠DAC　… 2組の辺とその間の角';
  const A_SSA = 'AB＝DE、BC＝EF、∠C＝∠F で、等しい角 ∠C は、\n等しい 2辺 AB、BC の間の角ではない。\n「2組の辺とその間の角」にあてはまらないから、\n合同になるとはかぎらない。';
  const A_SQ = '① ' + cgText(C_SQ).replace(/\n/g, '\n　') + '\n② 対応する角だから　∠CBF＝∠BAE＝35°\n　 ∠ABF＝90°−35°＝55°\n　 △ABP の内角の和から　∠APB＝180°−35°−55°＝90°';
  const A_TRI = '① ' + cgText(C_TRI).replace(/\n/g, '\n　') + '\n② 対応する角だから　∠BAD＝∠CBE\n　 ∠APE は △ABP の外角だから\n　 ∠APE＝∠BAD+∠ABE＝∠CBE+∠ABE＝∠ABC＝60°';
  const A_Q1 = 'ア（' + KIND.SAS + '）、ウ（' + KIND.ASA + '）';
  const A_Q2 = cgText(C_Q2), A_Q3 = cgText(C_Q3);
  const A_PENT = cgText(C_PENT).replace('が、それぞれ等しい。', 'が、それぞれ等しい。\n対応する辺だから　AC＝BD');

  IK.lesson('heikou-10', {
    unit: 'heikou', unitName: '平行と合同', no: '第10時', title: '合同条件を使って、合同な三角形を見つけよう',
    summary: 'たこ形・重なった三角形の中から、等しい辺や角（共通な辺・角、対頂角、錯角）を見つけ、合同条件を使って合同な三角形を判断する。考えようは、「角が3組等しい図で、あと何がわかれば合同といえるか」。',
    head: '平行と合同　第10時',
    checks: [
      // 学習課題：たこ形。図の印（AB＝AD、CB＝CD）と、答えの組（3組の辺）
      chk('第10時 学習課題', `const f = ${J(figData(F_KITE))}; return FIGOK(f) && CONG(f.pts, ${J(C_KITE)}) && ${J(A_KITE)}.split('\\n')[1] === ${J(condLine(C_KITE))} && D(f.pts, 'AB') !== D(f.pts, 'CB');`),
      // 例題：D は AB 上、E は AC 上。AB＝AC、AD＝AE。∠BAE と ∠CAD は同じ角（共通）。△ABE≡△ACD
      chk('第10時 例題', `const f = ${J(figData(F_OV))}, P = f.pts; const onSeg = (a, b, c) => near(D(P, a + c) + D(P, c + b), D(P, a + b)); return FIGOK(f) && onSeg('A', 'B', 'D') && onSeg('A', 'C', 'E') && CONG(P, ${J(C_OV)}) && near(AN(P, '∠BAE'), AN(P, '∠BAC')) && near(AN(P, '∠CAD'), AN(P, '∠BAC'));`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：図は AB∥CD で、AB≠CD。等しい角は3組（対頂角と錯角2つ）。角だけでは合同でない。k 倍の図で、AO＝DO・BO＝CO・AB＝DC のどれが成り立っても k＝1 で、ASA で合同
      chk('第10時 考えよう', `const f = ${J(figData(F_HG))}, P = f.pts; const mk = k => { const O = P.O, Q = { A: P.A, B: P.B, O, D: [O[0] + (O[0] - P.A[0]) * k, O[1] + (O[1] - P.A[1]) * k], C: [O[0] + (O[0] - P.B[0]) * k, O[1] + (O[1] - P.B[1]) * k] }; return Q; }; const eqA = [['∠OAB', '∠ODC'], ['∠OBA', '∠OCD'], ['∠AOB', '∠DOC']]; const kk = [1.25, 0.7, 1.6]; const cong = (Q, extra) => CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: extra }); const plus = ${J(HG_PLUS)}; return FIGOK(f) && Math.abs((P.B[1] - P.A[1]) * (P.D[0] - P.C[0]) - (P.B[0] - P.A[0]) * (P.D[1] - P.C[1])) < 1e-9 && (P.D[0] - P.C[0]) > (P.B[0] - P.A[0]) && near(AN(P, '∠OAB'), AN(P, '∠ODC')) && near(AN(P, '∠OBA'), AN(P, '∠OCD')) && near(AN(P, '∠AOB'), AN(P, '∠DOC')) && near(D(P, 'AO') + D(P, 'OD'), D(P, 'AD')) && near(D(P, 'BO') + D(P, 'OC'), D(P, 'BC')) && kk.every(k => { const Q = mk(k); return near(AN(Q, '∠OAB'), AN(Q, '∠ODC')) && near(AN(Q, '∠OBA'), AN(Q, '∠OCD')) && near(AN(Q, '∠AOB'), AN(Q, '∠DOC')) && !near(D(Q, 'AB'), D(Q, 'DC')) && near(D(Q, 'DO') / D(Q, 'AO'), k) && near(D(Q, 'CO') / D(Q, 'BO'), k) && near(D(Q, 'DC') / D(Q, 'AB'), k); }) && (() => { const Q = mk(1); return plus.every(([x, y]) => near(D(Q, x), D(Q, y))) && CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OAB', '∠ODC'], ['AO', 'DO'], ['∠AOB', '∠DOC']] }) && CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OBA', '∠OCD'], ['BO', 'CO'], ['∠AOB', '∠DOC']] }) && CONG(Q, { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OAB', '∠ODC'], ['AB', 'DC'], ['∠OBA', '∠OCD']] }); })();`),
      // 発展：AB＝DE、∠A＝∠D、∠C＝∠F。内角の和から ∠B＝∠E。1組の辺 AB とその両端の角が等しくなり、合同（6つの要素がすべて等しい）
      chk('第10時 発展', `const f = ${J(figData(F_AAS))}, P = f.pts; return FIGOK(f) && near(AN(P, '∠BAC') + AN(P, '∠ABC') + AN(P, '∠ACB'), 180) && near(AN(P, '∠EDF') + AN(P, '∠DEF') + AN(P, '∠DFE'), 180) && near(AN(P, '∠ABC'), AN(P, '∠DEF')) && CONG(P, { t1: 'ABC', t2: 'DEF', kind: 'ASA', eq: [['∠BAC', '∠EDF'], ['AB', 'DE'], ['∠ABC', '∠DEF']] }) && CONG(P, { t1: 'ABC', t2: 'DEF', kind: 'AAS', eq: [['∠BAC', '∠EDF'], ['AB', 'DE'], ['∠ACB', '∠DFE']] });`),
      // 基礎（1）〜（3）
      chk('第10時 基礎（1）', `const f = ${J(figData(F_ISO))}; return FIGOK(f) && CONG(f.pts, ${J(C_ISO)}) && near(f.pts.D[0], (f.pts.B[0] + f.pts.C[0]) / 2) && near(f.pts.D[1], (f.pts.B[1] + f.pts.C[1]) / 2);`),
      chk('第10時 基礎（2）', `const f = ${J(figData(F_PAR))}; return FIGOK(f) && CONG(f.pts, ${J(C_PAR)});`),
      chk('第10時 基礎（3）', `const f = ${J(figData(F_X))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_X)}) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && near(D(P, 'OA') + D(P, 'OB'), D(P, 'AB')) && near(D(P, 'OC') + D(P, 'OD'), D(P, 'CD'));`),
      // 標準（4）：△ABC と △DEF（頂点の順に対応）。ア〜オ。○は合同条件の形（座標でも合同）、×は印の3組が等しいのに合同でない例を座標でつくる
      chk('第10時 標準（4）', `const O = ${J(OPT)}, S = ${J(SSA.P)}; const T1 = { A: [0, 3], B: [-1, 0], C: [3, 0] }, T2 = { D: [20, 3], E: [19, 0], F: [23, 0] }; const P = Object.assign({}, T1, T2); const sc = {}; Object.keys(T1).forEach((k, i) => { sc['DEF'[i]] = [T1[k][0] * 2 + 30, T1[k][1] * 2]; }); const Q = Object.assign({}, T1, sc); const same = P2 => ['AB:DE', 'BC:EF', 'CA:FD'].every(s => near(D(P2, s.slice(0, 2)), D(P2, s.slice(3, 5)))); const okAll = O.filter(o => o.c).every(o => CONG(P, o.c)); const aaa = near(AN(Q, '∠CAB'), AN(Q, '∠FDE')) && near(AN(Q, '∠ABC'), AN(Q, '∠DEF')) && near(AN(Q, '∠BCA'), AN(Q, '∠EFD')) && !near(D(Q, 'AB'), D(Q, 'DE')); const ssa = near(D(S, 'AB'), D(S, 'DE')) && near(D(S, 'BC'), D(S, 'EF')) && near(AN(S, '∠BCA'), AN(S, '∠EFD')) && !near(D(S, 'CA'), D(S, 'FD')); return okAll && aaa && ssa && O.map(o => o.c ? 1 : 0).join('') === '11010' && O.find(o => o.k === 'ウ').no === 'aaa' && O.find(o => o.k === 'オ').no === 'ssa' && ${J(A_OPT)}.includes('ア 3組の辺') && ${J(A_OPT)}.includes('エ 1組の辺とその両端の角');`),
      // 標準（4）オ・応用（6）：AB, BC と ∠C が等しいが、合同でない。∠C は AB と BC の間の角でない（∠B が間）
      chk('第10時 応用（6）', `const S = ${J(SSA.P)}; return near(D(S, 'AB'), 3.4) && near(D(S, 'DE'), 3.4) && near(D(S, 'BC'), 4.6) && near(D(S, 'EF'), 4.6) && near(AN(S, '∠BCA'), 35) && near(AN(S, '∠EFD'), 35) && !near(D(S, 'CA'), D(S, 'FD')) && !near(AN(S, '∠CAB'), AN(S, '∠FDE')) && near(AN(S, '∠CAB') + AN(S, '∠FDE'), 180) && AN(S, '∠CAB') < 90 && AN(S, '∠FDE') > 90;`),
      // 標準（5）AB＝AD だけの図は、たこ形でない（CB≠CD、∠BAC≠∠DAC）。足した図（たこ形）で、どちらの条件でも合同
      chk('第10時 標準（5）', `const f = ${J(figData(F_K2))}, P = f.pts, S = ${J(figData(F_K2sym))}.pts; return FIGOK(f) && !near(D(P, 'CB'), D(P, 'CD')) && !near(AN(P, '∠BAC'), AN(P, '∠DAC')) && near(D(S, 'AB'), D(S, 'AD')) && near(D(S, 'CB'), D(S, 'CD')) && near(AN(S, '∠BAC'), AN(S, '∠DAC')) && CONG(S, ${J(C_K2a)}) && CONG(S, ${J(C_K2b)}) && ${J(A_K2)}.includes('CB＝CD') && ${J(A_K2)}.includes('∠BAC＝∠DAC');`),
      // 入試（7）正方形。BE＝CF（E は BC 上、F は CD 上）。△ABE≡△BCF。∠BAE＝35° のとき ∠CBF＝35°、∠ABF＝55°、∠APB＝90°
      chk('第10時 入試（7）', `const f = ${J(figData(F_SQ))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_SQ)}) && near(AN(P, '∠BAE'), 35) && near(AN(P, '∠CBF'), 35) && near(AN(P, '∠ABF'), 55) && near(AN(P, '∠APB'), 90) && near(AN(P, '∠ABC'), 90) && near(AN(P, '∠BCD'), 90) && near(D(P, 'AB'), D(P, 'BC')) && near(D(P, 'BE') + D(P, 'EC'), D(P, 'BC')) && near(D(P, 'CF') + D(P, 'FD'), D(P, 'CD')) && near(180 - 35 - 55, 90) && ${J(A_SQ)}.includes('∠APB＝180°−35°−55°＝90°');`),
      // 入試（8）正三角形。BD＝CE。△ABD≡△BCE。∠APE＝60°（D の位置が変わっても）
      chk('第10時 入試（8）', `const f = ${J(figData(F_TRI))}, P = f.pts; const at = t => { const B = [-2, 0], C = [2, 0], A = [0, 2 * Math.sqrt(3)], Dd = [B[0] + 4 * t, 0], Ee = [C[0] + (A[0] - C[0]) * t, C[1] + (A[1] - C[1]) * t]; const d1 = [Dd[0] - A[0], Dd[1] - A[1]], d2 = [Ee[0] - B[0], Ee[1] - B[1]], den = d1[0] * d2[1] - d1[1] * d2[0], s = ((B[0] - A[0]) * d2[1] - (B[1] - A[1]) * d2[0]) / den, Pp = [A[0] + d1[0] * s, A[1] + d1[1] * s]; return { A, B, C, D: Dd, E: Ee, P: Pp }; }; return FIGOK(f) && CONG(P, ${J(C_TRI)}) && near(AN(P, '∠APE'), 60) && near(AN(P, '∠ABC'), 60) && [0.15, 0.35, 0.5, 0.8].every(t => { const Q = at(t); return near(D(Q, 'BD'), D(Q, 'CE')) && near(AN(Q, '∠APE'), 60) && CONG(Q, ${J(C_TRI)}); }) && ${J(A_TRI)}.includes('∠ABC＝60°');`),
      // 小テスト（1）：ア、ウが合同（形も座標で確かめる）。イは SSA、エは AAA（印の3組が等しいのに合同でない）
      chk('第10時 小テスト（1）', `const O = ${J(QOPT)}, S = ${J(SSA.P)}; const T1 = { A: [0, 3], B: [-1, 0], C: [3, 0] }; const P = Object.assign({}, T1, { D: [20, 3], E: [19, 0], F: [23, 0] }); const sc = {}; Object.keys(T1).forEach((k, i) => { sc['DEF'[i]] = [T1[k][0] * 2 + 30, T1[k][1] * 2]; }); const Q = Object.assign({}, T1, sc); return O.filter(o => o.c).every(o => CONG(P, o.c)) && O.map(o => o.c ? 1 : 0).join('') === '1010' && near(D(S, 'AB'), D(S, 'DE')) && near(D(S, 'BC'), D(S, 'EF')) && near(AN(S, '∠BCA'), AN(S, '∠EFD')) && !near(D(S, 'CA'), D(S, 'FD')) && near(AN(Q, '∠CAB'), AN(Q, '∠FDE')) && near(AN(Q, '∠ABC'), AN(Q, '∠DEF')) && near(AN(Q, '∠BCA'), AN(Q, '∠EFD')) && !near(D(Q, 'AB'), D(Q, 'DE')) && ${J(A_Q1)}.includes('ア') && ${J(A_Q1)}.includes('ウ');`),
      chk('第10時 小テスト（2）（3）', `const a = ${J(figData(F_Q2))}, b = ${J(figData(F_Q3))}; return FIGOK(a) && CONG(a.pts, ${J(C_Q2)}) && FIGOK(b) && CONG(b.pts, ${J(C_Q3)}) && near(AN(b.pts, '∠ADB'), AN(b.pts, '∠CBD'));`),
      // チャレンジ：正五角形。5辺が等しく、5つの内角が等しい。△ABC≡△BCD（2組の辺とその間の角）。AC＝BD
      chk('第10時 小テスト チャレンジ', `const f = ${J(figData(F_PENT))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_PENT)}) && near(AN(P, '∠ABC'), 108) && near(D(P, 'AC'), D(P, 'BD')) && ${J(A_PENT)}.includes('AC＝BD');`)
    ],

    /* ================= 授業計画 ================= */
    plan: {
      type: '例（例題と練習）',
      aim: '共通な辺・角、対頂角、平行線の錯角などに目をつけて、等しい辺や角を見つけ、合同条件を使って合同な三角形を判断できる。',
      flow: [
        { g: '導入', m: 3, scene: 'ペア学習', do: '前時の重要語句（合同・対応・合同条件）を、ペアで1人1問ずつ出題し合う。', st: '言葉の意味を、自分の言葉で言う。', note: '静かに、時間を切って。緊張感をつくる。' },
        { g: '小テスト', m: 7, scene: '小テスト', do: '前時分の小テスト。自己採点と回収まで。', st: '静かに取り組む。', note: '5分＋答え合わせ・回収 2分。10点満点。チャレンジは別枠（正解で満点）。' },
        { g: '解説', m: 4, scene: '学習課題', do: 'めあてを書く。たこ形 ABCD を対角線で分けた △ABC と △ADC が合同か、個人→ペアで考える。', q: ['AB＝AD、CB＝CD のほかに、等しい辺はないだろうか。'], st: 'AC が共通。3組の辺が等しい。', note: '見た目で決めず、等しいものを3つ書き出す。' },
        { g: '解説', m: 3, scene: 'ことば', do: '合同条件3つを穴埋めで確かめ、共通な辺（角）を押さえる。', q: ['2つの三角形のどちらにもある辺を、何というだろう。'], st: '空欄に書き込む。', note: '空欄は、先生が言ってから書かせる。' },
        { g: '解説', m: 5, scene: '例題', do: '重なった三角形で、等しいものを3つ見つけ、合同条件を答える。見つけ方を板書にまとめる。', q: ['∠A は、どちらの三角形にふくまれているだろう。'], st: '∠A が共通。2組の辺とその間の角。', note: '図に印をつけさせる。' },
        { g: '演習', m: 2, scene: '演習① 考えようの提示', do: '進め方を伝える。ゴールは、「考えよう」（ワークシート裏）を全員が説明できること。立ち歩きOK、解答は教卓（考えようの答えはない）。', st: '', note: '「できた人が教える」ではなく「説明できるようになる」と伝える。' },
        { g: '演習', m: 5, scene: '演習② 基礎', do: '基礎（個人）。解いたら、教卓の解答で答え合わせ。早く終わったら、考えようへ。', st: '基礎 →（終わった人から）考えようへ。', note: '解答は教卓。セルフチェック。' },
        { g: '演習', m: 14, scene: '演習③ 考えよう＋標準（学び合い）', do: '立ち歩きで、教え合い・説明し合い。先生は回って、気づきの言葉を拾い、必要なら判断して短く全体に戻す。', st: '等しい角を見つける → 足す条件を考える → 合同条件で確かめる。', note: '判断：角が見つからない→ヒント1／条件が出ない→ヒント2／止まる→ヒント3／残り5分→指名。答えは言わない。' },
        { g: '演習', m: 2, scene: '演習④ 方向性', do: '答えは示さず、方向性だけを一言で伝える（下の枠）。', st: '', note: '' },
        { g: '振り返り', m: 5, scene: '振り返り・回収', do: '今日わかったことを、ペアで1つずつ言い合う。ワークシートと演習プリントを回収（未完成でも出す）。', st: '今日わかったことを、口で言う。', note: '' }
      ],
      words: ['合同条件', '共通な辺（角）', '対頂角', '錯角'],
      think: {
        q: '線分 AD と BC が点 O で交わり、AB∥CD。△AOB≡△DOC といえるために、あと何がわかればよいか、いくつか見つけよう。',
        views: [
          '等しい角が3組ある。（対頂角1つと、錯角2つ）',
          '角だけでは足りない。辺が1組わかれば、「1組の辺とその両端の角」になる。',
          'AO＝DO、BO＝CO、AB＝DC のどれでもよい。'
        ],
        hints: [
          '等しい角に、同じ印をつける。',
          '「1組の辺とその両端の角」に、あと何が足りないか考える。',
          '見つけた条件ごとに、使う合同条件を書き、友達とくらべる。'
        ],
        direction: '「条件のそろえ方は、1つとはかぎらない。次の時間は、この見方を使って、ことがらを説明するよ。」'
      },
      manabi: [
        { kind: '説明', text: '基礎のあと：（2）で、等しい辺や角を、図のどこから見つけたか、隣の人に説明する。' },
        { kind: '比べる', text: '標準のあと：（4）の ア〜オ を、友達と比べ、ちがうものは理由を言い合う。' },
        { kind: '教える', text: '最後：解けなかった問題を、できた人に聞く。問題と人の名前を書く。' }
      ],
      see: [
        ['思考・判断・表現', '足りない条件を見いだし、合同条件と結びつけて説明しているか（考えよう）。'],
        ['知識・技能', '図から等しい辺・角を見つけ、合同条件で判断できるか。'],
        ['学び合い', 'わからないことを聞き、説明するために動いているか。']
      ],
      tips: [
        ['見た目で合同と決め、合同条件を言えない', '等しいものを3つ書き出し、合同条件とつき合わせる。'],
        ['共通な辺・角、対頂角、錯角を見落とす', '図に印をつけ、「どちらの三角形にもある辺は？」と聞く。'],
        ['「間の角」「両端の角」の位置をまちがえる', '指で辺と角をなぞり、辺のどこにあるか確かめさせる。']
      ],
      prep: ['合同条件3つの掲示、図の拡大（学習課題・例題・考えよう）', '小テスト（前時分）／今日の小テストは、次時のはじめ用', '教卓：ワークシート・演習プリント・小テストの解答（考えようの答えは載せない）']
    },

    /* ================= ワークシート（両面） ================= */
    ws: [
      // ---- 表 ----
      M('合同条件を使って、合同な三角形を見つけよう'),
      C2([
        K('学習課題', '右の図の四角形 ABCD で、' + giv(F_KITE) + ' である。対角線 AC をひくと、△ABC と △ADC ができる。\n2つは合同といえるだろうか。合同といえるなら、記号 ≡ を使って表し、使った合同条件も答えよう。', 6),
        B(4, A_KITE)
      ], [
        F(10, geoOf(F_KITE))
      ], '3:2'),
      G(1),
      WD('2つの三角形は、次のどれかが成り立つとき、合同である。（三角形の合同条件）\n① {{3組の辺}}が、それぞれ等しい。\n② {{2組の辺}}と{{その間の角}}が、それぞれ等しい。\n③ {{1組の辺}}と{{その両端の角}}が、それぞれ等しい。\n2つの三角形のどちらにもふくまれる辺（角）を、{{共通}}な辺（角）という。', 6),
      G(1),
      C2([
        K('例題', '右の図の △ABC で、辺 AB 上に点 D、辺 AC 上に点 E があり、AB＝{{AC}}、AD＝{{AE}} である。BE、CD をひくとき、合同な三角形を、記号 ≡ を使って表そう。また、使った合同条件も答えよう。', 6),
        B(4, A_OV)
      ], [
        F(10, geoOf(F_OV, { a: { ang: [{ at: 'A', a: 'B', b: 'C', n: 1, r: 7 }] } }))
      ], '3:2'),
      T('', '【等しいものの見つけ方】図に印をつけて、気づいたことを書こう。', 1),
      B(6, A_FIND),
      BR(),

      // ---- 裏：考えよう ----
      K('考えよう', '右の図で、線分 AD と BC が点 O で交わり、AB∥CD である。\n△AOB≡△DOC といえるために、あと何がわかればよいだろう。いくつか見つけよう。', 3),
      C2([
        T('①', '図の中で、等しい角を見つけて、図に同じ印をつけよう。見つけた角を書こう。', 2),
        B(4, ''),
        T('②', 'あと何がわかれば、△AOB≡△DOC といえるだろう。「わかること」と「使う合同条件」を、いくつか書こう。', 3),
        B(8, '')
      ], [
        F(10, geoOf(F_HG))
      ], '3:2'),
      T('③', '友達の見つけた条件と、くらべよう。気づいたことを書こう。', 1),
      B(6, ''),
      C2([
        T('発展', '演習まで解き終わった人は、考えてみよう！\n△ABC と △DEF で、AB＝DE、∠A＝∠D、∠C＝∠F のとき、△ABC≡△DEF といえるだろうか。三角形の内角の和に目をつけて、考えよう。', 6),
        B(2, '')
      ], [
        F(8, geoOf(F_AAS))
      ], '3:2')
    ],

    /* ================= 演習プリント（両面） ================= */
    dr: [
      HD('演習', 'ことばを使って、合同な三角形を見つけよう。'),
      WD('① 合同条件は、{{3組の辺}}・{{2組の辺とその間の角}}・{{1組の辺とその両端の角}}が、それぞれ等しいこと。\n② 2つの三角形のどちらにもふくまれる辺（角）を、{{共通}}な辺（角）という。\n③ 等しい角は、{{対頂角}}や、平行線の{{錯角}}にも目をつけて見つける。', 4, { label: 'ことば確認' }),
      HD('基礎', '次の図で、合同な三角形を、記号 ≡ を使って表そう。また、使った合同条件も答えよう。'),
      C2([
        T('（1）', giv(F_ISO).replace('BD＝CD', 'D は辺 BC の中点'), 1),
        B(3, A_ISO)
      ], [
        F(4, geoOf(F_ISO))
      ], '3:2'),
      C2([
        T('（2）', 'AB∥DC、AB＝DC', 1),
        B(4, A_PAR)
      ], [
        F(5, geoOf(F_PAR))
      ], '3:2'),
      C2([
        T('（3）', '線分 AB と CD が点 O で交わり、' + giv(F_X), 2),
        B(4, A_X)
      ], [
        F(6, geoOf(F_X))
      ], '3:2'),
      MA('【説明】（2）で、等しい辺や角を、図のどこから見つけたか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('標準', '次の問いに答えよう。'),
      T('（4）', '△ABC と △DEF で、次のことがわかっているとき、△ABC≡△DEF といえるものには、使う合同条件を書こう。いえないものには × を書こう。\n' + OPT.map(o => o.k + ' ' + o.t).join('　　'), 4),
      B(2, A_OPT),
      C2([
        T('（5）', '右の図の四角形 ABCD で、AB＝AD であることがわかっている。対角線 AC をひくとき、△ABC≡△ADC といえるためには、あと1つ、何がわかればよいだろう。2通り答えよう。', 4),
        B(3, A_K2)
      ], [
        F(7, geoOf(F_K2))
      ], '2:1'),
      BR(),

      HD('応用', '合同といえない場合を、考えよう。'),
      C2([
        T('（6）', '右の図の △ABC と △DEF は、AB＝DE、BC＝EF、∠C＝∠F である。しかし、合同ではない。（4）のオが「いえない」わけを、「間の角」ということばを使って説明しよう。', 5),
        B(4, A_SSA)
      ], [
        F(8, GEO({ pts: SSA.P, poly: ['ABC', 'DEF'], vl: { A: ['A', 70], B: ['B', 320], C: ['C', 200], D: ['D', 95], E: ['E', 340], F: ['F', 215] }, tick: [['A', 'B', 1], ['D', 'E', 1], ['B', 'C', 2], ['E', 'F', 2]], ang: [{ at: 'C', a: 'A', b: 'B', n: 1 }, { at: 'F', a: 'D', b: 'E', n: 1 }] }))
      ], '3:2'),
      HD('入試レベル', '合同な三角形を見つけて、角の大きさを求めよう。'),
      C2([
        T('（7）', '正方形 ABCD の辺 BC 上に点 E、辺 CD 上に点 F を、BE＝CF となるようにとる。AE と BF の交点を P とする。\n① 合同な三角形を、記号 ≡ を使って表し、使った合同条件も答えよう。\n② ∠BAE＝35° のとき、∠APB の大きさを求めよう。', 5),
        B(7, A_SQ)
      ], [
        F(9, geoOf(F_SQ))
      ], '2:1'),
      C2([
        T('（8）', '正三角形 ABC の辺 BC 上に点 D、辺 CA 上に点 E を、BD＝CE となるようにとる。AD と BE の交点を P とする。\n① △ABD と合同な三角形を答え、使った合同条件も答えよう。\n② ∠APE の大きさを求めよう。', 5),
        B(7, A_TRI)
      ], [
        F(9, geoOf(F_TRI))
      ], '2:1'),
      MA('【教える】解けなかった問題を、できた人に聞こう。\n教えてもらった問題（　　　）　教えてくれた人（　　　　　　）', 2)
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '△ABC と △DEF で、次のことがわかっているとき、△ABC≡△DEF といえるものを、2つ選び、使う合同条件も答えよう。（3点）\n' + QOPT.map(o => o.k + ' ' + o.t).join('　　'), 4),
      B(2, A_Q1),
      C2([
        T('（2）', '右の図の四角形 ABCD で、' + giv(F_Q2) + ' である。対角線 AC をひくとき、合同な三角形を、記号 ≡ を使って表し、使った合同条件も答えよう。（3点）', 4),
        B(3, A_Q2)
      ], [
        F(7, geoOf(F_Q2))
      ], '3:2'),
      C2([
        T('（3）', '右の図の四角形 ABCD で、AD∥BC、AD＝CB である。対角線 BD をひくとき、合同な三角形を、記号 ≡ を使って表し、使った合同条件も答えよう。（4点）', 4),
        B(3, A_Q3)
      ], [
        F(7, geoOf(F_Q3))
      ], '3:2'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（4）', '右の図は正五角形 ABCDE である。対角線 AC、BD をひくとき、合同な三角形を、記号 ≡ を使って表し、使った合同条件も答えよう。また、AC と BD の長さの関係を答えよう。', 5),
        B(5, A_PENT)
      ], [
        F(8, geoOf(F_PENT))
      ], '3:2')
    ]
  });
})();
