/* 平行と合同（新しい形） 第13時：合同を使って、線分や角が等しいことを証明しよう（証明の授業）。 元：data/lesson_heikou_13.js（前の形）を、新しい形に組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（四角形 ABCD で AB＝DC、∠ABC＝∠DCB ならば AC＝DB を、はじめて自分の手で証明する）。個人3分 → ペア3分 → ことば（共通・合同条件・対応）→ 例題（PM⊥AB、M は AB の中点 → PA＝PB。
     目をつける三角形・等しい3つとその根拠・合同条件・結論を、表の空欄にうめる）。先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形で、証明を全部書いた。
   ・演習プリントは表裏：表＝確かめる 2問（等しい3組の辺と合同条件・あと1つ何が等しければ）・使ってみる 4問（証明の「等しい3つ」を見つけて、根拠・合同条件を答える問い。（6）は、合同を使って角を求める）
     ／裏＝ひろげる（元の考えよう：ア〜ウの証明が正しいか。答えなし）・チャレンジ★★（元の入試（4）：正方形の AE＝BF の証明と ∠AGB。ヒントカードつき）。
     元の基礎（1）・標準（2）・応用（3）は、全部の証明を書く形から、「等しい3つのうち、見つけにくいもの」を答える短い問いにかえて（1）（3）（4）にした（証明を書くのは、今日の問い・（8）・小テストで行う）。
     （2）（5）（6）は新しく作った。元の「発展」・授業計画は使わない。
   ・小テストは、33行におさめるため、元（1）の空欄うめの証明を「等しい3組と合同条件を答える」形にかえた（点数は元と同じ 4点・6点）。（2）（3）は元と同じ問題。
   ・図は GEO。座標から、仮定どおりに正確にかいた（たこ形は ∠BAC＝35°、∠ABC＝105° の形。図4 は ∠ABD＝∠ACE＝28°）。答えは checks で、座標から長さ・角を計算し直して、等しい組・合同条件の形・結論が成り立つことを確かめた。
   ・範囲：根拠に使うのは、仮定・共通・対頂角・平行線の錯角・三角形の合同条件（3つ）・合同な図形の性質・内角の和・正方形の辺と角。二等辺三角形・平行四辺形の性質・直角三角形の合同条件・「1辺と2角」（AAS）は使わない。
   検算：node tools/verify.cjs heikou_new-13　／　見た目：node tools/check.cjs <出力先> heikou_new-13 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     D：長さ（'AB'）　AN：角の大きさ（度。'∠ABC' は B が頂点）　VAL：長さか角
     CONG(P, c)：△t1 と △t2（頂点を対応する順に）の、等しいと言った組 eq が、座標から計算して等しく、kind（SSS・SAS・ASA）の形で、6つの要素がすべて等しいこと
     FIGOK(f)：図の印。同じ本数の印の辺が等しい・同じ本数の弧の角が等しい・同じ番号の平行のしるしの線が平行
     STOK(s)：ことがら「〇〇〇 ならば △△△」の、ならばの前が仮定 h、後ろが結論 c になっているか */
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

  /* ---------------- 図の道具 ---------------- */
  const mark = given => { const tick = [], ang = []; let ns = 0, na = 0; (given || []).forEach(g => { if (g[0][0] === '∠') { na++; g.forEach(s => { const [a, v, b] = [...s.replace('∠', '')]; ang.push({ at: v, a, b, n: na, k: na }); }); } else { ns++; g.forEach(s => tick.push([s[0], s[1], ns])); } }); return { tick, ang }; };
  const figData = f => { const mk = mark(f.given); return { pts: f.pts, tick: mk.tick.concat(f.tick || []), ang: mk.ang.concat(f.ang || []), par: f.par || [] }; };
  const geoOf = (f, o) => GEO(Object.assign({ poly: f.poly, segs: f.segs, vl: f.vl, dots: f.dots, size: f.size, pad: f.pad, scale: f.scale, a: f.a }, figData(f), o || {}));
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const KIND = { SSS: '3組の辺', SAS: '2組の辺とその間の角', ASA: '1組の辺とその両端の角' };
  const blanksOf = s => (String(s).match(/\{\{([^}]*)\}\}/g) || []).map(t => t.slice(2, -2));
  const rad = d => d * Math.PI / 180;

  /* ---------------- 問題の図と、答えの組（座標から作る） ---------------- */
  // 今日の問い：四角形 ABCD（BC を底にした、左右対称の形）。AB＝DC、∠ABC＝∠DCB（66°）。対角線 AC、DB
  const TRAP = (() => { const L = 2.9, t = rad(66), w = 4.6; return { A: [L * Math.cos(t), L * Math.sin(t)], B: [0, 0], C: [w, 0], D: [w - L * Math.cos(t), L * Math.sin(t)] }; })();
  const F_TRAP = { pts: TRAP, poly: 'ABCD', segs: ['AC', 'DB'], vl: 'ABCD', given: [['AB', 'DC'], ['∠ABC', '∠DCB']], pad: 6 };
  const C_TRAP = { t1: 'ABC', t2: 'DCB', kind: 'SAS', eq: [['AB', 'DC'], ['∠ABC', '∠DCB'], ['BC', 'CB']] };
  // 例題：M は AB の中点、PM⊥AB
  const F_PERP = { pts: { A: [-2.4, 0], B: [2.4, 0], M: [0, 0], P: [0, 2.9] }, poly: 'PAB', segs: ['PM'], vl: 'PABM', given: [['AM', 'MB']], pad: 6,
    ang: [{ at: 'M', a: 'P', b: 'B', right: true, r: 4 }, { at: 'M', a: 'P', b: 'A', right: true, r: 4 }] };
  const C_PERP = { t1: 'PAM', t2: 'PBM', kind: 'SAS', eq: [['AM', 'BM'], ['∠PMA', '∠PMB'], ['PM', 'PM']] };
  // たこ形 ABCD（AC は対称の軸）：AB＝AD、CB＝CD。∠BAC＝∠DAC＝35°、∠ABC＝∠ADC＝105°、∠ACB＝∠ACD＝40°
  const KT = (() => { const AC = 4.4, AB = AC * Math.sin(rad(40)) / Math.sin(rad(105)), A = [0, 2.2], C = [0, -2.2], B = [A[0] - AB * Math.sin(rad(35)), A[1] - AB * Math.cos(rad(35))]; return { A, B, C, D: [-B[0], B[1]] }; })();
  const F_KITE = { pts: KT, poly: 'ABCD', segs: ['AC'], vl: 'ABCD', given: [['AB', 'AD'], ['CB', 'CD']], pad: 4 };
  const F_KITE2 = { pts: KT, poly: 'ABCD', segs: ['AC'], vl: 'ABCD', given: [['AB', 'AD'], ['∠BAC', '∠DAC']], pad: 5 };
  const C_KITE = { t1: 'ABC', t2: 'ADC', kind: 'SSS', eq: [['AB', 'AD'], ['CB', 'CD'], ['AC', 'AC']] };
  const C_KITE2 = { t1: 'ABC', t2: 'ADC', kind: 'SAS', eq: [['AB', 'AD'], ['∠BAC', '∠DAC'], ['AC', 'AC']] };
  // 線分 AD と BC が O で交わり、AB∥DC、AB＝DC（O は両方の中点）
  const F_BOW = { pts: { O: [0, 0], A: [-2.2, 1.4], B: [1.6, 1.4], C: [-1.6, -1.4], D: [2.2, -1.4] }, segs: ['AB', 'CD', 'AD', 'BC'], dots: ['O'], pad: 4,
    vl: { A: ['A', 135], B: ['B', 45], C: ['C', 225], D: ['D', 315], O: ['O', 90, 3.4] }, tick: [['A', 'B', 1, 0.3], ['D', 'C', 1, 0.3]], par: [['A', 'B', 1, 0.72], ['C', 'D', 1, 0.72]] };
  const C_BOW = { t1: 'AOB', t2: 'DOC', kind: 'ASA', eq: [['∠OAB', '∠ODC'], ['AB', 'DC'], ['∠OBA', '∠OCD']] };
  // AB＝AC、D は AB 上、E は AC 上で AD＝AE
  const OV = (() => { const A = [0, 3.4], B = [-2.2, 0], C = [2.2, 0], r = 0.4; return { A, B, C, D: [A[0] + r * (B[0] - A[0]), A[1] + r * (B[1] - A[1])], E: [A[0] + r * (C[0] - A[0]), A[1] + r * (C[1] - A[1])] }; })();
  const F_OVER = { pts: OV, poly: 'ABC', segs: ['BE', 'CD'], vl: 'ABCDE', given: [['AB', 'AC'], ['AD', 'AE']], pad: 4 };
  const C_OVER = { t1: 'ABE', t2: 'ACD', kind: 'SAS', eq: [['AB', 'AC'], ['AE', 'AD'], ['∠BAE', '∠CAD']] };
  // AB＝AC、D は AC 上、E は AB 上で ∠ABD＝∠ACE（28°）
  const AS = (() => {
    const A = [0, 3.4], B = [-2.2, 0], C = [2.2, 0], dB = Math.atan2(A[1] - B[1], A[0] - B[0]) - rad(28), dir = [Math.cos(dB), Math.sin(dB)], e = [C[0] - A[0], C[1] - A[1]], ab = [A[0] - B[0], A[1] - B[1]];
    const det = -dir[0] * e[1] + e[0] * dir[1], u = (dir[0] * ab[1] - dir[1] * ab[0]) / det, Dp = [A[0] + u * e[0], A[1] + u * e[1]];
    return { A, B, C, D: Dp, E: [-Dp[0], Dp[1]] };
  })();
  const F_ASA = { pts: AS, poly: 'ABC', segs: ['BD', 'CE'], vl: 'ABCDE', given: [['AB', 'AC'], ['∠ABD', '∠ACE']], pad: 4 };
  const C_ASA = { t1: 'ABD', t2: 'ACE', kind: 'ASA', eq: [['∠ABD', '∠ACE'], ['AB', 'AC'], ['∠BAD', '∠CAE']] };
  // 考えよう：AB＝AC、AD は ∠BAC の二等分線（D は BC 上）
  const F_ISO = { pts: { A: [0, 3.4], B: [-2, 0], C: [2, 0], D: [0, 0] }, poly: 'ABC', segs: ['AD'], vl: 'ABCD', given: [['AB', 'AC'], ['∠BAD', '∠DAC']], pad: 5 };
  const C_ISO = { t1: 'ABD', t2: 'ACD', kind: 'SAS', eq: [['AB', 'AC'], ['∠BAD', '∠CAD'], ['AD', 'AD']] };
  // チャレンジ★★：正方形 ABCD（A が左上、B が左下）。E は BC 上、F は CD 上で BE＝CF。G は AE と BF の交点
  const SQ = (() => {
    const A = [0, 4], B = [0, 0], C = [4, 0], Dd = [4, 4], E = [1.5, 0], F2 = [4, 1.5];
    const s = ((B[0] - A[0]) * (F2[1] - B[1]) - (B[1] - A[1]) * (F2[0] - B[0])) / ((E[0] - A[0]) * (F2[1] - B[1]) - (E[1] - A[1]) * (F2[0] - B[0]));
    return { A, B, C, D: Dd, E, F: F2, G: [A[0] + s * (E[0] - A[0]), A[1] + s * (E[1] - A[1])] };
  })();
  const F_SQ = { pts: SQ, poly: 'ABCD', segs: ['AE', 'BF'], vl: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: ['G', 60, 3.2] }, given: [['BE', 'CF']], pad: 5,
    ang: [{ at: 'A', a: 'B', b: 'D', right: true }, { at: 'B', a: 'A', b: 'C', right: true }, { at: 'C', a: 'B', b: 'D', right: true }, { at: 'D', a: 'A', b: 'C', right: true }] };
  const C_SQ = { t1: 'ABE', t2: 'BCF', kind: 'SAS', eq: [['AB', 'BC'], ['BE', 'CF'], ['∠ABE', '∠BCF']] };
  // 小テスト チャレンジ：△ABC の外側の正三角形 ABD、ACE
  const EQP = (() => {
    const A = [0.3, 2.5], B = [-2.1, 0], C = [2.3, 0.5], rot = (p, q, deg) => { const t = rad(deg), x = q[0] - p[0], y = q[1] - p[1]; return [p[0] + x * Math.cos(t) - y * Math.sin(t), p[1] + x * Math.sin(t) + y * Math.cos(t)]; };
    const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    let Dd = rot(A, B, 60); if (side(A, B, Dd) * side(A, B, C) > 0) Dd = rot(A, B, -60);
    let E = rot(A, C, 60); if (side(A, C, E) * side(A, C, B) > 0) E = rot(A, C, -60);
    return { A, B, C, D: Dd, E };
  })();
  const F_EQ = { pts: EQP, poly: 'ABC', segs: ['AD', 'DB', 'AE', 'EC', 'BE', 'DC'], vl: 'ABCDE', given: [['AB', 'AD', 'DB'], ['AC', 'AE', 'EC']], pad: 5 };
  const C_EQ = { t1: 'ABE', t2: 'ADC', kind: 'SAS', eq: [['AB', 'AD'], ['AE', 'AC'], ['∠BAE', '∠DAC']] };

  // 例題の表（空欄をうめる）
  const EX_ROWS = [
    ['目をつける', ['△PAM と △{{PBM}}', 'PA、PB を辺にもつ三角形']],
    ['①', ['AM＝{{BM}}', '仮定（M は AB の{{中点}}）']],
    ['②', ['∠PMA＝∠PMB＝{{90°}}', '仮定（PM⊥AB）']],
    ['③', ['PM＝PM', '{{共通}}']],
    ['合同', ['△PAM≡△PBM', '{{' + KIND.SAS + '}}']],
    ['結論', ['PA＝PB', '合同な図形の、{{対応}}する辺は等しい']]
  ];

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const A_W = '（例）（仮定）AB＝DC、∠ABC＝∠DCB　（結論）AC＝DB\n（証明）△ABC と △DCB において\n仮定より　AB＝DC …①　　∠ABC＝∠DCB …②\nBC は共通 …③\n①、②、③より、' + KIND.SAS + 'が、それぞれ等しいから　△ABC≡△DCB\n合同な図形の、対応する辺は等しいから　AC＝DB';
  const A_D1 = 'AB＝AD、CB＝CD（仮定）\nAC は共通\n' + KIND.SSS;
  const A_D2 = 'CA＝FD（' + KIND.SSS + '）\n∠B＝∠E\n（' + KIND.SAS + '）';
  const A_D3 = '∠OAB＝∠ODC\n∠OBA＝∠OCD\n（平行線の錯角は等しい）';
  const A_D4 = '∠BAE＝∠CAD\n（∠A は共通）\n' + KIND.SAS;
  const A_D5 = '∠BAD＝∠CAE\n（∠A は共通）\n' + KIND.ASA;
  const A_D6 = '△ABC≡△ADC より\n∠ADC＝∠ABC＝105°\n∠ACB＝180°−105°−35°＝40°\n∠ACD＝∠ACB＝40°';
  const A_D8 = '（仮定）正方形 ABCD、BE＝CF　（結論）① AE＝BF　② ∠AGB＝90°\n（証明）① △ABE と △BCF において\n正方形の辺だから　AB＝BC …①　　仮定より　BE＝CF …②\n正方形の角だから　∠ABE＝∠BCF＝90° …③\n①、②、③より、' + KIND.SAS + 'が、それぞれ等しいから　△ABE≡△BCF\n合同な図形の、対応する辺は等しいから　AE＝BF\n② △ABE≡△BCF より　∠BAE＝∠CBF\n∠ABG＋∠CBF＝∠ABC＝90° だから　∠ABG＋∠BAG＝90°\n△ABG の内角の和は 180° だから　∠AGB＝180°−90°＝90°';
  const A_Q1 = 'AB＝DC、∠ABC＝∠DCB（仮定）\nBC は共通\n' + KIND.SAS;
  const A_Q2 = '（仮定）AB＝AD、∠BAC＝∠DAC　（結論）BC＝DC\n（証明）△ABC と △ADC において\n仮定より　AB＝AD …①　　∠BAC＝∠DAC …②\nAC は共通 …③\n①、②、③より、' + KIND.SAS + 'が、それぞれ等しいから　△ABC≡△ADC\n合同な図形の、対応する辺は等しいから　BC＝DC';
  const A_QC = '（仮定）正三角形 ABD、ACE　（結論）BE＝DC\n（証明）△ABE と △ADC において\n正三角形 ABD だから　AB＝AD …①\n正三角形 ACE だから　AE＝AC …②\n∠BAE＝∠BAC＋60°、∠DAC＝60°＋∠BAC より　∠BAE＝∠DAC …③\n①、②、③より、' + KIND.SAS + 'が、それぞれ等しいから　△ABE≡△ADC\n合同な図形の、対応する辺は等しいから　BE＝DC';

  IK.lesson('heikou_new-13', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第13時', title: '合同を使って、線分や角が等しいことを証明しよう',
    summary: '三角形の合同を使って、線分や角が等しいことを、「△ABC と △DCB において」で書きはじめる形で証明する。目をつける三角形を決め、等しいものを根拠をつけて3つ示し、合同条件を書いて結論をみちびく。考えようは、3人が書いた証明が正しいかを調べる。',
    head: '平行と合同　第13時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：図は AB＝DC、∠ABC＝∠DCB（66°）。△ABC≡△DCB（2組の辺とその間の角：BC は共通）。AC＝DB。板書の例は 6行
      chk('第13時 今日の問い', `const f = ${J(figData(F_TRAP))}, P = f.pts; return FIGOK(f) && f.tick.length === 2 && CONG(P, ${J(C_TRAP)}) && near(D(P, 'AC'), D(P, 'DB')) && near(D(P, 'AB'), D(P, 'DC')) && near(AN(P, '∠ABC'), AN(P, '∠DCB')) && near(AN(P, '∠ABC'), 66) && near(D(P, 'BC'), D(P, 'CB')) && ${J(A_W)}.split('\\n').length === 6 && ${J(A_W)}.includes('△ABC≡△DCB') && ${J(A_W)}.includes('AC＝DB');`),
      // いつでも成り立つ：AB＝DC、∠ABC＝∠DCB の四角形を、長さと角を変えて 40個つくって、△ABC≡△DCB と AC＝DB（計算で確かめる）
      chk('第13時 今日の問い（ほかの図でも）', `let ok = true; for (let i = 0; i < 40; i++) { const w = 3 + (i % 7) * 0.5, L = 1.5 + (i % 5) * 0.6, t = (40 + (i * 13) % 100) * Math.PI / 180, P = { A: [L * Math.cos(t), L * Math.sin(t)], B: [0, 0], C: [w, 0], D: [w - L * Math.cos(t), L * Math.sin(t)] }; ok = ok && near(D(P, 'AB'), D(P, 'DC')) && near(AN(P, '∠ABC'), AN(P, '∠DCB')) && CONG(P, ${J(C_TRAP)}) && near(D(P, 'AC'), D(P, 'DB')); } return ok;`),
      // 例題：M は AB の中点、PM⊥AB。△PAM≡△PBM（2組の辺とその間の角）。PA＝PB。表の空欄の答え。P を PM の上のいろいろな高さにとっても成り立つ
      chk('第13時 例題', `const f = ${J(figData(F_PERP))}, P = f.pts; let ok = FIGOK(f) && CONG(P, ${J(C_PERP)}) && near(AN(P, '∠PMA'), 90) && near(AN(P, '∠PMB'), 90) && near(D(P, 'AM'), D(P, 'MB')) && near(D(P, 'PA'), D(P, 'PB')) && near(D(P, 'AM') + D(P, 'MB'), D(P, 'AB')); for (let i = 0; i < 20; i++) { const a = 1 + (i % 5) * 0.7, h = 0.8 + (i % 7) * 0.5, Q = { A: [-a, 0], B: [a, 0], M: [0, 0], P: [0, h] }; ok = ok && CONG(Q, ${J(C_PERP)}) && near(D(Q, 'PA'), D(Q, 'PB')); } return ok && ${J(blanksOf(JSON.stringify(EX_ROWS)))}.join('、') === 'PBM、BM、中点、90°、共通、2組の辺とその間の角、対応';`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：AB＝AC、AD は ∠BAC の二等分線（D は BC 上）。ウは正しい（△ABD≡△ACD：2組の辺とその間の角、AD は共通）。アは「2つ」だけ（AB＝AC、∠BAD＝∠CAD だけでは、合同にならない図がある）。イの BD＝CD は結論
      chk('第13時 考えよう', `const f = ${J(figData(F_ISO))}, P = f.pts; const pl = (r, d) => [r * Math.cos(d * Math.PI / 180), r * Math.sin(d * Math.PI / 180)], T = { A: [0, 0], B: pl(3, 20), D: pl(2, 60), C: pl(3, 100), E: pl(2.6, 60) }; return FIGOK(f) && CONG(P, ${J(C_ISO)}) && near(AN(P, '∠BAD') + AN(P, '∠DAC'), AN(P, '∠BAC')) && near(D(P, 'BD') + D(P, 'DC'), D(P, 'BC')) && near(D(P, 'BD'), D(P, 'CD')) && near(D(T, 'AB'), D(T, 'AC')) && near(AN(T, '∠BAD'), AN(T, '∠CAE')) && !near(D(T, 'BD'), D(T, 'CE'));`),
      // 基礎（1）たこ形：AB＝AD、CB＝CD、AC は共通 → △ABC≡△ADC（3組の辺）。（6）∠BAC＝35°、∠ABC＝105° → ∠ADC＝105°、∠ACB＝180°−105°−35°＝40°＝∠ACD
      chk('第13時 基礎（1）・使ってみる（6）', `const f = ${J(figData(F_KITE))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_KITE)}) && near(AN(P, '∠BAC'), 35) && near(AN(P, '∠ABC'), 105) && near(AN(P, '∠ADC'), 105) && near(AN(P, '∠ACB'), 180 - 105 - 35) && near(AN(P, '∠ACB'), 40) && near(AN(P, '∠ACD'), 40) && near(180 - 105 - 35, 40) && near(AN(P, '∠BAC'), AN(P, '∠DAC')) && ${J(A_D1)}.split('\\n').length === 3 && ${J(A_D6)}.split('\\n').length === 4;`),
      // 基礎（2）AB＝DE、BC＝EF のとき、あと1つ：CA＝FD（3組の辺）か ∠B＝∠E（2組の辺とその間の角）。∠A＝∠D や ∠C＝∠F では、合同でない図がある（AB＝5、BC＝3.5、角 40°の2つの三角形）
      chk('第13時 基礎（2）', `const r = Math.PI / 180, pl = (c, t, d) => [c[0] + t * Math.cos(d * r), c[1] + t * Math.sin(d * r)]; const B1 = [0, 0], E2 = [10, 2], th = 25, S = { A: pl(B1, 4, 0), B: B1, C: pl(B1, 3, 70), D: pl(E2, 4, th), E: E2, F: pl(E2, 3, th + 70) }; const ok1 = near(D(S, 'AB'), D(S, 'DE')) && near(D(S, 'BC'), D(S, 'EF')) && near(D(S, 'CA'), D(S, 'FD')) && CONG(S, { t1: 'ABC', t2: 'DEF', kind: 'SSS', eq: [['AB', 'DE'], ['BC', 'EF'], ['CA', 'FD']] }) && near(AN(S, '∠ABC'), AN(S, '∠DEF')) && CONG(S, { t1: 'ABC', t2: 'DEF', kind: 'SAS', eq: [['AB', 'DE'], ['BC', 'EF'], ['∠ABC', '∠DEF']] }); const q = 100 * Math.cos(40 * r) ** 2 - 4 * (25 - 12.25), tt = [(10 * Math.cos(40 * r) + Math.sqrt(q)) / 2, (10 * Math.cos(40 * r) - Math.sqrt(q)) / 2]; const U = { A: [0, 0], B: [5, 0], C: pl([0, 0], tt[0], 40), D: [0, 0], E: [5, 0], F: pl([0, 0], tt[1], 40) }; const ok2 = near(D(U, 'AB'), D(U, 'DE')) && near(D(U, 'BC'), 3.5) && near(D(U, 'EF'), 3.5) && near(AN(U, '∠BAC'), AN(U, '∠EDF')) && !near(D(U, 'CA'), D(U, 'FD')); const V = { C: [0, 0], B: [5, 0], A: pl([0, 0], tt[0], 40), F: [0, 0], E: [5, 0], D: pl([0, 0], tt[1], 40) }; const ok3 = near(D(V, 'AB'), 3.5) && near(D(V, 'DE'), 3.5) && near(D(V, 'BC'), D(V, 'EF')) && near(AN(V, '∠ACB'), AN(V, '∠DFE')) && !near(D(V, 'CA'), D(V, 'FD')); return ok1 && ok2 && ok3 && ${J(A_D2)}.includes('CA＝FD') && ${J(A_D2)}.includes('∠B＝∠E');`),
      // 標準（3）AB∥DC、AB＝DC。△AOB≡△DOC（1組の辺とその両端の角：∠OAB＝∠ODC、∠OBA＝∠OCD は錯角）。AO＝DO
      chk('第13時 標準（3）', `const f = ${J(figData(F_BOW))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_BOW)}) && near(AN(P, '∠OAB'), AN(P, '∠ODC')) && near(AN(P, '∠OBA'), AN(P, '∠OCD')) && near(D(P, 'AO'), D(P, 'DO')) && near(D(P, 'AO') + D(P, 'OD'), D(P, 'AD')) && near(D(P, 'BO') + D(P, 'OC'), D(P, 'BC')) && near(D(P, 'AB'), D(P, 'DC'));`),
      // 標準（4）AB＝AC、AD＝AE（D は AB 上、E は AC 上）。△ABE≡△ACD（2組の辺とその間の角：∠BAE＝∠CAD は ∠A）。BE＝CD
      chk('第13時 標準（4）', `const f = ${J(figData(F_OVER))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_OVER)}) && near(AN(P, '∠BAE'), AN(P, '∠BAC')) && near(AN(P, '∠CAD'), AN(P, '∠BAC')) && near(D(P, 'AD') + D(P, 'DB'), D(P, 'AB')) && near(D(P, 'AE') + D(P, 'EC'), D(P, 'AC')) && near(D(P, 'BE'), D(P, 'CD'));`),
      // 標準（5）AB＝AC、∠ABD＝∠ACE（28°）（D は AC 上、E は AB 上）。△ABD≡△ACE（1組の辺とその両端の角：∠BAD＝∠CAE は ∠A）。BD＝CE
      chk('第13時 標準（5）', `const f = ${J(figData(F_ASA))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_ASA)}) && near(AN(P, '∠ABD'), 28) && near(AN(P, '∠ACE'), 28) && near(AN(P, '∠BAD'), AN(P, '∠BAC')) && near(AN(P, '∠CAE'), AN(P, '∠BAC')) && near(D(P, 'BD'), D(P, 'CE')) && near(D(P, 'AB'), D(P, 'AC')) && near(D(P, 'AD') + D(P, 'DC'), D(P, 'AC'));`),
      // チャレンジ（8）正方形：BE＝CF、AB＝BC、∠ABE＝∠BCF＝90° → △ABE≡△BCF → AE＝BF、∠BAE＝∠CBF。∠ABG＋∠CBF＝90°、∠AGB＝90°（BE＝CF を 0.5〜3.5 に変えても成り立つ）
      chk('第13時 チャレンジ（8）', `const f = ${J(figData(F_SQ))}, P = f.pts; let ok = FIGOK(f) && CONG(P, ${J(C_SQ)}) && near(AN(P, '∠ABE'), 90) && near(AN(P, '∠BCF'), 90) && near(D(P, 'AE'), D(P, 'BF')) && near(AN(P, '∠BAE'), AN(P, '∠CBF')) && near(AN(P, '∠ABG') + AN(P, '∠CBF'), AN(P, '∠ABC')) && near(AN(P, '∠ABC'), 90) && near(AN(P, '∠ABG') + AN(P, '∠BAG'), 90) && near(AN(P, '∠AGB'), 90) && near(180 - 90, 90); for (let k = 1; k <= 7; k++) { const e = k * 0.5, A = [0, 4], B = [0, 0], C = [4, 0], E = [e, 0], F2 = [4, e], s = ((B[0] - A[0]) * (F2[1] - B[1]) - (B[1] - A[1]) * (F2[0] - B[0])) / ((E[0] - A[0]) * (F2[1] - B[1]) - (E[1] - A[1]) * (F2[0] - B[0])), Q = { A, B, C, D: [4, 4], E, F: F2, G: [A[0] + s * (E[0] - A[0]), A[1] + s * (E[1] - A[1])] }; ok = ok && CONG(Q, ${J(C_SQ)}) && near(D(Q, 'AE'), D(Q, 'BF')) && near(AN(Q, '∠AGB'), 90); } return ok && ${J(A_D8)}.split('\\n').length === 9;`),
      // 小テスト（1）：四角形 ABCD（AB＝DC、∠ABC＝∠DCB）：△ABC≡△DCB から ∠BAC＝∠CDB。等しい3組の答え
      chk('第13時 小テスト（1）', `const f = ${J(figData(F_TRAP))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_TRAP)}) && near(AN(P, '∠BAC'), AN(P, '∠CDB')) && ${J(A_Q1)}.split('\\n').length === 3 && ${J(A_Q1)}.includes('BC は共通');`),
      // 小テスト（2）たこ形：AB＝AD、∠BAC＝∠DAC、AC は共通 → △ABC≡△ADC（2組の辺とその間の角）→ BC＝DC。板書の例は 6行
      chk('第13時 小テスト（2）', `const f = ${J(figData(F_KITE2))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_KITE2)}) && near(D(P, 'BC'), D(P, 'DC')) && ${J(A_Q2)}.split('\\n').length === 6;`),
      // チャレンジ：正三角形 ABD、ACE（外側）。AB＝AD、AC＝AE、∠BAE＝∠BAC＋60°＝∠DAC → △ABE≡△ADC → BE＝DC。板書の例は 7行
      chk('第13時 小テスト チャレンジ', `const f = ${J(figData(F_EQ))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_EQ)}) && near(AN(P, '∠ABD'), 60) && near(AN(P, '∠ACE'), 60) && near(AN(P, '∠BAE'), AN(P, '∠BAC') + 60) && near(AN(P, '∠DAC'), AN(P, '∠BAC') + 60) && near(AN(P, '∠BAE'), AN(P, '∠DAC')) && near(D(P, 'BE'), D(P, 'DC')) && ${J(A_QC)}.split('\\n').length === 7;`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('合同を使って、線分や角が等しいことを証明しよう'),
      C2([
        K('今日の問い', '右の図の四角形 ABCD で、AB＝DC、∠ABC＝∠DCB ならば、AC＝DB である。このことを、証明しよう。', 4)
      ], [
        F(5, geoOf(F_TRAP))
      ], '3:2'),
      T('①', '自分の考え（3分）　目をつける三角形を決めて、証明を書こう。', 1),
      B(6, A_W),
      T('②', 'ペアの考え（3分）　友だちの証明と、ちがうところを書こう。', 1),
      B(2, ''),
      WD('2つの三角形が同じ辺（角）をもつとき、\nその辺（角）は{{共通}}であるという。\n三角形の{{合同条件}}は 3つある。\n合同な図形では、{{対応}}する辺や角は等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '右の図で、点 M は線分 AB の中点で、PM⊥AB である。PA＝PB を証明するために、表の空欄をうめよう。', 4)
      ], [
        F(4, geoOf(F_PERP))
      ], '3:2'),
      TB('', ['等しいもの', 'わけ（根拠）'], EX_ROWS, { hw: 22 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2つの三角形が同じ辺（角）をもつとき、その辺（角）は{{共通}}である。\n② 三角形の{{合同条件}}は 3つある。\n③ 合同な図形では、{{対応}}する辺や角は等しい。\n④ 「〇〇〇 ならば △△△」の、〇〇〇 を{{仮定}}、△△△ を{{結論}}という。', 4, { label: 'ことば' }),
      F(4, cap(geoOf(F_KITE), '図1'), cap(geoOf(F_BOW), '図2'), cap(geoOf(F_OVER), '図3'), cap(geoOf(F_ASA), '図4')),
      C2([
        T('（1）', '図1で、AB＝AD、CB＝CD である。△ABC≡△ADC を示す。等しい3組の辺と合同条件は？', 3),
        B(3, A_D1)
      ], [
        T('（2）', '△ABC と △DEF で、AB＝DE、BC＝EF のとき、あと1つ何が等しければ合同か。2通り。', 3),
        B(3, A_D2)
      ], '1:1'),
      MA('【説明】（1）で「AC は共通」と書くわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '等しい3つを、根拠をつけて見つけよう。'),
      C2([
        T('（3）', '図2で、AB∥DC、AB＝DC である。△AOB≡△DOC を「1組の辺とその両端の角」で示す。等しい2組の角と根拠は？', 4),
        B(3, A_D3)
      ], [
        T('（4）', '図3で、AB＝AC、AD＝AE である。△ABE≡△ACD を示す。等しい角と、その根拠、合同条件は？', 4),
        B(3, A_D4)
      ], '1:1'),
      C2([
        T('（5）', '図4で、AB＝AC、∠ABD＝∠ACE である。△ABD≡△ACE を示す。もう1組の等しい角と、根拠、合同条件は？', 4),
        B(3, A_D5)
      ], [
        T('（6）', '図1で、∠ABC＝105°、∠BAC＝35° である。（1）の合同から、∠ADC と ∠ACD を求めよう。', 3),
        B(4, A_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：どの証明が、正しいだろう。'),
      C2([
        T('（7）', '右の図で、AB＝AC、AD は ∠BAC の二等分線である。「BD＝CD」の証明の、合同を示す部分を、3人が書いた。', 4)
      ], [
        F(4, geoOf(F_ISO))
      ], '2:1'),
      T('ア', 'AB＝AC、∠BAD＝∠CAD だから、△ABD≡△ACD', 1),
      T('イ', '仮定より　AB＝AC …①　BD＝CD …②　AD は共通 …③\n①、②、③より、3組の辺が、それぞれ等しいから　△ABD≡△ACD', 2),
      T('ウ', '仮定より　AB＝AC …①　　∠BAD＝∠CAD …②\nAD は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから　△ABD≡△ACD', 3),
      T('①', 'ア〜ウは正しいか。○×とわけと、大切なことを書こう。', 1),
      B(4, ''),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '正方形 ABCD の辺 BC 上に点 E、辺 CD 上に点 F を、BE＝CF となるようにとり、AE と BF の交点を G とする。① AE＝BF を証明しよう。② ∠AGB の大きさを求めよう。', 5)
      ], [
        F(5, geoOf(F_SQ))
      ], '2:1'),
      B(9, A_D8),
      MA('① △ABE と △BCF で、等しい辺や角はどこにあるかな。\n② △ABE≡△BCF から、等しい角はどれかな。∠ABG と ∠BAG の和は？', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図の四角形 ABCD で、AB＝DC、∠ABC＝∠DCB ならば、∠BAC＝∠CDB である。△ABC≡△DCB を示すとき、等しい3組と合同条件を答えよう。（4点）', 4)
      ], [
        F(4, geoOf(F_TRAP, { pad: 4 }))
      ], '2:1'),
      B(3, A_Q1),
      C2([
        T('（2）', '右の図の四角形 ABCD で、AB＝AD、∠BAC＝∠DAC ならば、BC＝DC である。このことを証明しよう。（6点）', 4)
      ], [
        F(4, geoOf(F_KITE2))
      ], '2:1'),
      B(6, A_Q2),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（3）', '△ABC の外側に、辺 AB、AC を1辺とする正三角形 ABD、ACE をつくる。このとき、BE＝DC であることを証明しよう。', 5)
      ], [
        F(5, geoOf(F_EQ))
      ], '2:1'),
      B(7, A_QC)
    ]
  });
})();
