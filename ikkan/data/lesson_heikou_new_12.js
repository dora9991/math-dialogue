/* 平行と合同（新しい形） 第12時：証明のしくみを読み取ろう。 元：data/lesson_heikou_12.js（前の形）を、新しい形に組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（AC∥DB、AO＝BO ならば CO＝DO の証明の ①〜⑤ は、それぞれ何を根拠にしているか）。個人3分 → ペア3分 → ことば（証明の根拠にしてよいこと）→ 例題（角の二等分線の証明の空欄うめ）。
     先生の板書の例（B）は、①〜⑤ の根拠の読み取り。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（証明の一部の根拠・合同条件・まちがい直し）／裏＝ひろげる（考えよう：ばらばらにした証明をならべる。答えなし）・チャレンジ★★（正三角形 ABC、ADE で BD＝CE の証明。ヒントカードつき）。
     チャレンジ★★は、元の入試（6）の空欄うめを、自分で書く証明（「（仮定）…／（結論）…／（証明）…」）に変えた。元の標準（3）・応用（5）の空欄うめ証明は、根拠だけを聞く短い問いにして、（3）（4）（5）に分けた。
   ・数値・図は、元と同じ。答えは checks で、座標から長さ・角を計算し直して、証明の各行の等しい組・合同条件の形（3辺／2辺と間の角／1辺と両端の角）・結論が成り立つことを確かめた。証明の文は、データと照らして確かめた。
   ・範囲：根拠に使うのは、仮定・対頂角・平行線の同位角と錯角・三角形の合同条件（3つ）・合同な図形の性質・正三角形の辺と角・内角の和。直角三角形の合同条件・反例・逆は使わない。
   検算：node tools/verify.cjs heikou_new-12　／　見た目：node tools/check.cjs <出力先> heikou_new-12 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = d => d * Math.PI / 180;
  const pol = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const neg = p => [-p[0], -p[1]];

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
  const STOK = s => { const p = s.t.split('ならば'); return p.length === 2 && p[0].trim() === s.h && p[1].replace(/^[、\s]+/, '').replace(/\s*である。$|。$/, '') === s.c; };
  const LIB = 'const D = ' + D + '; const AN = ' + AN + '; const VAL = ' + VAL + '; const CONG = ' + CONG + '; const FIGOK = ' + FIGOK + '; const STOK = ' + STOK + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  /* ---------------- 図の道具 ---------------- */
  const mark = given => { const tick = [], ang = []; let ns = 0, na = 0; (given || []).forEach(g => { if (g[0][0] === '∠') { na++; g.forEach(s => { const [a, v, b] = [...s.replace('∠', '')]; ang.push({ at: v, a, b, n: na, k: na }); }); } else { ns++; g.forEach(s => tick.push([s[0], s[1], ns])); } }); return { tick, ang }; };
  const figData = f => { const mk = mark(f.given); return { pts: f.pts, tick: mk.tick.concat(f.tick || []), ang: mk.ang.concat(f.ang || []), par: f.par || [] }; };
  const geoOf = (f, o) => GEO(Object.assign({ poly: f.poly, segs: f.segs, vl: f.vl, dots: f.dots, size: f.size, pad: f.pad, scale: f.scale, a: f.a }, figData(f), o || {}));
  const cap = (fig, text) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`);
  const KIND = { SSS: '3組の辺', SAS: '2組の辺とその間の角', ASA: '1組の辺とその両端の角' };
  const cm1 = x => (Math.round(x * 10) / 10).toFixed(1);

  /* ---------------- 問題の図と、証明（座標から作る） ---------------- */
  // 今日の問い：線分 AB と CD が点 O で交わり、AC∥DB、AO＝BO ならば CO＝DO。△AOC≡△BOD（1組の辺とその両端の角：∠OAC＝∠OBD は錯角、∠AOC＝∠BOD は対頂角）
  const HA = [-2.2, 1.7], HC = [-2.2, -1.3];
  const F_H = { pts: { A: HA, B: neg(HA), C: HC, D: neg(HC), O: [0, 0] }, segs: ['AB', 'CD', 'AC', 'DB'], vl: { A: ['A', 135], B: ['B', 315], C: ['C', 225], D: ['D', 45], O: ['O', 90, 3.4] }, dots: ['O'], given: [['AO', 'BO']], par: [['A', 'C', 1], ['D', 'B', 1]], pad: 6,
    a: { ang: [{ at: 'O', a: 'A', b: 'C', n: 1, r: 5 }, { at: 'O', a: 'B', b: 'D', n: 1, r: 5 }, { at: 'A', a: 'O', b: 'C', n: 2, r: 5 }, { at: 'B', a: 'O', b: 'D', n: 2, r: 5 }] } };
  const C_H = { t1: 'AOC', t2: 'BOD', kind: 'ASA', eq: [['∠OAC', '∠OBD'], ['AO', 'BO'], ['∠AOC', '∠BOD']] };
  const W1 = ['AO＝BO', '∠AOC＝∠BOD', '∠OAC＝∠OBD', '△AOC≡△BOD', 'CO＝DO'];   // 証明の ①〜⑤（根拠を書かない形）
  const A_W1 = '（例）① 仮定\n② 対頂角は等しい\n③ AC∥DB より、平行線の錯角は等しい\n④ 合同条件（1組の辺とその両端の角）\n⑤ 合同な図形の、対応する辺は等しい';
  // 例題：OP は ∠XOY の二等分線。OA＝OB のとき PA＝PB。△OAP≡△OBP（2組の辺とその間の角：OA＝OB、∠AOP＝∠BOP、OP は共通）
  const F_BIS = { pts: { O: [0, 0], P: pol(4.4, 0), A: pol(3.0, 35), B: pol(3.0, -35), X: pol(5.4, 35), Y: pol(5.4, -35) }, segs: ['OX', 'OY', 'OP', 'PA', 'PB'], vl: { O: ['O', 180], P: ['P', 0], A: ['A', 100], B: ['B', 260], X: ['X', 35], Y: ['Y', 325] }, given: [['OA', 'OB'], ['∠AOP', '∠POB']], pad: 5 };
  const C_BIS = { t1: 'OAP', t2: 'OBP', kind: 'SAS', eq: [['OA', 'OB'], ['∠AOP', '∠BOP'], ['OP', 'OP']] };
  const PF_BIS = '△OAP と △OBP において\n仮定より　OA＝{{OB}} …①\nOP は ∠XOY の二等分線だから　∠AOP＝∠{{BOP}} …②\nOP は{{共通}} …③\n①、②、③ より、{{2組の辺とその間の角}}が、それぞれ等しいから　△OAP≡△OBP\n合同な図形の、対応する{{辺}}は等しいから　PA＝PB';
  // 考えよう：たこ形 PQRS（PQ＝PS、RQ＝RS）→ ∠PQR＝∠PSR。△PQR≡△PSR（3組の辺：PR は共通）
  const F_KT = { pts: { P: [3.2, 0], Q: [0.9, 2], R: [-1.8, 0], S: [0.9, -2] }, poly: 'PQRS', segs: ['PR'], vl: { P: ['P', 0], Q: ['Q', 90], R: ['R', 180], S: ['S', 270] }, given: [['PQ', 'PS'], ['RQ', 'RS']], pad: 5 };
  const C_KT = { t1: 'PQR', t2: 'PSR', kind: 'SSS', eq: [['PQ', 'PS'], ['RQ', 'RS'], ['PR', 'PR']] };
  const KT_LINES = [['ア', '3組の辺が、それぞれ等しいから　△PQR≡△PSR'], ['イ', '仮定より　RQ＝RS'], ['ウ', '△PQR と △PSR において'], ['エ', '合同な図形の、対応する角は等しいから　∠PQR＝∠PSR'], ['オ', 'PR は共通'], ['カ', '仮定より　PQ＝PS']];
  // 演習（3）（4）△PQR で、S は辺 PQ 上、T は辺 PR 上。PS＝PT、SQ＝TR（→ PQ＝PR）→ QT＝RS。△PQT≡△PRS（2組の辺とその間の角：∠P は共通）
  const PA_ = [0, 0], PQ_ = pol(5, 20), PR_ = pol(5, -20);
  const F_PT = { pts: { P: PA_, Q: PQ_, R: PR_, S: lerp(PA_, PQ_, 0.55), T: lerp(PA_, PR_, 0.55) }, poly: 'PQR', segs: ['QT', 'RS'], vl: { P: ['P', 180], Q: ['Q', 20], R: ['R', 340], S: ['S', 115], T: ['T', 245] }, given: [['PS', 'PT'], ['SQ', 'TR']], pad: 5 };
  const C_PT = { t1: 'PQT', t2: 'PRS', kind: 'SAS', eq: [['PT', 'PS'], ['PQ', 'PR'], ['∠QPT', '∠RPS']] };
  // 演習（5）線分 AC と BD が点 O で交わり、AO＝CO、BO＝DO ならば AB∥DC。△AOB≡△COD（2組の辺とその間の角）→ ∠OAB＝∠OCD（錯角）→ AB∥DC
  const F_PR = { pts: { A: pol(2.6, 160), B: pol(2.2, 20), C: pol(2.6, 340), D: pol(2.2, 200), O: [0, 0] }, segs: ['AC', 'BD', 'AB', 'DC'], vl: { A: ['A', 160], B: ['B', 20], C: ['C', 340], D: ['D', 200], O: ['O', 270, 3.4] }, dots: ['O'], given: [['AO', 'CO'], ['BO', 'DO']], pad: 5, a: { par: [['A', 'B', 1], ['D', 'C', 1]] } };
  const C_PR = { t1: 'AOB', t2: 'COD', kind: 'SAS', eq: [['AO', 'CO'], ['∠AOB', '∠COD'], ['BO', 'DO']] };
  // 演習（6）まちがった証明：AO＝BO、∠AOC＝∠BOD の2つだけで、「2組の辺とその間の角」としている（3つめがない）
  // チャレンジ（8）正三角形 ABC と ADE が頂点 A を共有。BD＝CE。△ABD≡△ACE（∠BAD＝∠CAE は、60°＋∠CAD）
  const F_EQ = { pts: { A: [0, 0], B: pol(3, -55), C: pol(3, 5), D: pol(2, 80), E: pol(2, 140) }, poly: ['ABC', 'ADE'], segs: ['BD', 'CE'], vl: { A: ['A', 200], B: ['B', 300], C: ['C', 10], D: ['D', 60], E: ['E', 130] }, given: [['AB', 'BC', 'CA'], ['AD', 'DE', 'EA']], pad: 5 };
  const C_EQ = { t1: 'ABD', t2: 'ACE', kind: 'SAS', eq: [['AB', 'AC'], ['AD', 'AE'], ['∠BAD', '∠CAE']] };
  // 小テスト（2）AC∥DB、CO＝DO ならば AO＝BO（図 F_H と同じ形で、印は CO＝DO）　チャレンジ：線分 AB の中点 M を通る直線 ℓ。A、B から ℓ への垂線の足 P、Q → AP＝BQ
  const F_Q2 = Object.assign({}, F_H, { given: [['CO', 'DO']], a: undefined });
  const C_Q2 = { t1: 'AOC', t2: 'BOD', kind: 'ASA', eq: [['∠OCA', '∠ODB'], ['CO', 'DO'], ['∠AOC', '∠BOD']] };
  const PF_Q2 = '△AOC と △BOD において\n仮定より　CO＝DO …①\n{{対頂角}}は等しいから　∠AOC＝∠BOD …②\nAC∥DB で、{{錯角}}は等しいから　∠OCA＝∠ODB …③\n①、②、③ より、{{1組の辺とその両端の角}}が\nそれぞれ等しいから　△AOC≡△BOD\n合同な図形の、対応する{{辺}}は等しいから　AO＝BO';
  const F_M = { pts: { A: [-1.2, 2.4], B: [1.2, -2.4], M: [0, 0], P: [-1.2, 0], Q: [1.2, 0], L: [-3.2, 0], R: [3.2, 0] }, segs: ['AB', 'AP', 'BQ', ['L', 'R', { lab: 'ℓ' }]], vl: { A: ['A', 90], B: ['B', 270], M: ['M', 60, 3.4], P: ['P', 225], Q: ['Q', 45] }, given: [['AM', 'BM']], pad: 5,
    ang: [{ at: 'P', a: 'A', b: 'M', right: true, r: 4 }, { at: 'Q', a: 'B', b: 'M', right: true, r: 4 }] };
  const C_M = { t1: 'APM', t2: 'BQM', kind: 'ASA', eq: [['∠PAM', '∠QBM'], ['AM', 'BM'], ['∠AMP', '∠BMQ']] };
  const PF_M = '△APM と △BQM において\n仮定より　AM＝BM …①\n仮定より　∠APM＝∠BQM＝90° …②\n{{対頂角}}は等しいから　∠AMP＝∠BMQ …③\n②、③ と、三角形の{{内角の和}}は 180° から　∠PAM＝∠QBM …④\n①、③、④ より、{{1組の辺とその両端の角}}が\nそれぞれ等しいから　△APM≡△BQM\n合同な図形の、対応する{{辺}}は等しいから　AP＝BQ';

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const blanksOf = pf => (pf.match(/\{\{([^}]*)\}\}/g) || []).map(s => s.slice(2, -2));
  const BL = (pf, nums) => blanksOf(pf).map((b, i) => (nums ? nums[i] + ' ' : '') + b).join('　');
  const A_D1 = '対頂角は等しい';
  const A_D2 = 'ア、イ';
  const A_D3 = 'PQ＝PS+SQ、PR＝PT+TR で、仮定より PS＝PT、SQ＝TR だから。';
  const A_D4 = '2組の辺とその間の角\nPT＝PS、PQ＝PR、\n∠QPT＝∠RPS（共通）';
  const A_D5 = '∠OAB＝∠OCD（合同な図形の、対応する角）\n錯角が等しいから AB∥DC';
  const A_D6 = '等しい辺は AO＝BO の1組だけ。錯角 ∠OAC＝∠OBD を使って、1組の辺とその両端の角にする。';
  const A_D8 = '（仮定）正三角形 ABC、ADE　　（結論）BD＝CE\n（証明）△ABD と △ACE において\n正三角形だから　AB＝AC …①　　AD＝AE …②\n∠BAD＝60°+∠CAD、∠CAE＝60°+∠CAD より\n　∠BAD＝∠CAE …③\n①、②、③より、2組の辺とその間の角が、\nそれぞれ等しいから　△ABD≡△ACE\n合同な図形の、対応する辺は等しいから　BD＝CE';
  const A_Q1 = '① 対頂角は等しい\n② 合同な図形の、対応する辺は等しい\n③ 三角形の合同条件（3組の辺）';
  const A_Q2 = blanksOf(PF_Q2).map((b, i) => b + '（' + [1, 1, 2, 2][i] + '点）').join('　');
  const A_QC = BL(PF_M);

  IK.lesson('heikou_new-12', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第12時', title: '証明のしくみを読み取ろう',
    summary: 'できあがった証明を読んで、1行ごとの根拠（仮定・対頂角・錯角・合同条件・合同な図形の性質）を言う。考えようは、ばらばらにした証明を正しい順にならべ、入れかえてよい行といけない行を見つけること。',
    head: '平行と合同　第12時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：図は AC∥DB、AO＝BO。△AOC≡△BOD（ASA）。①〜⑤の文が、図の座標で成り立つ（CO＝DO も、図で成り立つ）。板書の例は 5つの根拠
      chk('第12時 今日の問い', `const f = ${J(figData(F_H))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_H)}) && near(D(P, 'AO'), D(P, 'BO')) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && near(AN(P, '∠OAC'), AN(P, '∠OBD')) && near(D(P, 'CO'), D(P, 'DO')) && near(D(P, 'AO') + D(P, 'OB'), D(P, 'AB')) && near(D(P, 'CO') + D(P, 'OD'), D(P, 'CD')) && ${J(A_W1)}.split('\\n').length === 5 && ${J(W1)}.length === 5;`),
      // 今日の問いの証明が、ほかの図でも成り立つ：AC∥DB（点対称）、AO＝BO の図を 30個つくって、CO＝DO と △AOC≡△BOD（ASA）
      chk('第12時 今日の問い（ほかの図でも）', `let ok = true; for (let i = 0; i < 30; i++) { const a = [-(1 + (i % 6) * 0.4), 0.8 + (i % 5) * 0.5], c = [-(1 + (i % 4) * 0.5), -(0.4 + (i % 7) * 0.3)], P = { A: a, B: [-a[0], -a[1]], C: c, D: [-c[0], -c[1]], O: [0, 0] }; ok = ok && near(D(P, 'AO'), D(P, 'BO')) && Math.abs((P.D[0] - P.B[0]) * (P.C[1] - P.A[1]) - (P.D[1] - P.B[1]) * (P.C[0] - P.A[0])) < 1e-9 && near(AN(P, '∠OAC'), AN(P, '∠OBD')) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && CONG(P, ${J(C_H)}) && near(D(P, 'CO'), D(P, 'DO')); } return ok;`),
      // 例題：OP は ∠XOY の二等分線（∠AOP＝∠POB＝35°）。OA＝OB。△OAP≡△OBP（SAS）。PA＝PB。証明の文の空欄の答え
      chk('第12時 例題', `const f = ${J(figData(F_BIS))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_BIS)}) && near(AN(P, '∠XOP'), AN(P, '∠YOP')) && near(AN(P, '∠XOP'), 35) && near(D(P, 'PA'), D(P, 'PB')) && near(D(P, 'OA') + D(P, 'AX'), D(P, 'OX')) && ${J(PF_BIS)}.includes('△OAP≡△OBP') && ${J(PF_BIS)}.includes('PA＝PB') && ${J(BL(PF_BIS))} === 'OB　BOP　共通　2組の辺とその間の角　辺';`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：たこ形 PQRS。△PQR≡△PSR（SSS）。∠PQR＝∠PSR。ア〜カ は、順番 ウ→（カ・イ・オ）→ア→エ のとき、どの行も、前の行から導ける。ほかの順では、導けない行がある
      chk('第12時 考えよう', `const f = ${J(figData(F_KT))}, P = f.pts, L = ${J(KT_LINES)}.map(r => r[0]); return FIGOK(f) && CONG(P, ${J(C_KT)}) && near(AN(P, '∠PQR'), AN(P, '∠PSR')) && (() => { const need = { 'ウ': [], 'カ': ['ウ'], 'イ': ['ウ'], 'オ': ['ウ'], 'ア': ['ウ', 'カ', 'イ', 'オ'], 'エ': ['ウ', 'ア'] }; const ok = ord => ord.every((x, i) => need[x].every(y => ord.indexOf(y) >= 0 && ord.indexOf(y) < i)); const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p])); const good = perms(L).filter(ok); return good.length === 6 && good.every(o => o[0] === 'ウ' && o[4] === 'ア' && o[5] === 'エ' && new Set(o.slice(1, 4)).size === 3) && L.join('') === 'アイウエオカ'; })();`),
      // 基礎（1）（2）：答え
      chk('第12時 基礎（1）（2）', `const P = { A: [0, 0], B: [4, 0], C: [1, 2.5], D: [-2, -1.1], E: [-2, 0.9] }; const a1 = near(AN({ O: [0, 0], A: [-2, 1], B: [2, -1], C: [-1, -2], D: [1, 2] }, '∠AOC'), AN({ O: [0, 0], A: [-2, 1], B: [2, -1], C: [-1, -2], D: [1, 2] }, '∠BOD')); return a1 && ${J(A_D1)} === '対頂角は等しい' && ${J(A_D2)} === 'ア、イ';`),
      // 標準（3）（4）：△PQR の辺 PQ 上に S、辺 PR 上に T。PS＝PT、SQ＝TR。PQ＝PS+SQ＝PT+TR＝PR。△PQT≡△PRS（SAS）。QT＝RS
      chk('第12時 標準（3）（4）', `const f = ${J(figData(F_PT))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_PT)}) && near(D(P, 'PQ'), D(P, 'PS') + D(P, 'SQ')) && near(D(P, 'PR'), D(P, 'PT') + D(P, 'TR')) && near(D(P, 'PS'), D(P, 'PT')) && near(D(P, 'SQ'), D(P, 'TR')) && near(D(P, 'PQ'), D(P, 'PR')) && near(D(P, 'QT'), D(P, 'RS')) && near(AN(P, '∠QPT'), AN(P, '∠RPS')) && ${J(A_D3)}.includes('PQ＝PS+SQ') && ${J(A_D4)}.includes('2組の辺とその間の角');`),
      // 標準（5）AO＝CO、BO＝DO、対頂角 → △AOB≡△COD。∠OAB＝∠OCD は錯角 → AB∥DC（座標でも、AB と DC は平行）
      chk('第12時 標準（5）', `const f = ${J(figData(F_PR))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_PR)}) && near(AN(P, '∠OAB'), AN(P, '∠OCD')) && Math.abs((P.B[0] - P.A[0]) * (P.C[1] - P.D[1]) - (P.B[1] - P.A[1]) * (P.C[0] - P.D[0])) < 1e-9 && near(D(P, 'AO') + D(P, 'OC'), D(P, 'AC')) && near(D(P, 'BO') + D(P, 'OD'), D(P, 'BD')) && ${J(A_D5)}.includes('∠OAB＝∠OCD') && ${J(A_D5)}.includes('錯角');`),
      // 標準（6）まちがった証明：AO＝BO と ∠AOC＝∠BOD の2つだけでは、合同といえない（AO＝BO＝2、∠＝60°、CO＝1 と DO＝3 の2つの三角形は、合同でない）。図 F_H では、∠OAC＝∠OBD を加えると、1組の辺とその両端の角になる
      chk('第12時 標準（6）', `const f = ${J(figData(F_H))}, P = f.pts; const T1 = { A: [2, 0], O: [0, 0], C: pol(1, 60) }, T2 = { B: [2, 0], O: [0, 0], Dd: pol(3, 60) }; function pol(r, d) { return [r * Math.cos(d * Math.PI / 180), r * Math.sin(d * Math.PI / 180)]; } const ac = Math.hypot(T1.A[0] - T1.C[0], T1.A[1] - T1.C[1]), bd = Math.hypot(T2.B[0] - T2.Dd[0], T2.B[1] - T2.Dd[1]); return near(D(P, 'AO'), D(P, 'BO')) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && near(AN(P, '∠OAC'), AN(P, '∠OBD')) && CONG(P, ${J(C_H)}) && !near(ac, bd) && ${J(A_D6)}.includes('∠OAC＝∠OBD') && ${J(A_D6)}.includes('1組の辺とその両端の角');`),
      // チャレンジ（8）正三角形 ABC、ADE（頂点 A 共有）。∠BAD＝60°+∠CAD、∠CAE＝60°+∠CAD。△ABD≡△ACE（SAS）。BD＝CE。ほかの図（D、E の位置を変えた 24個）でも成り立つ
      chk('第12時 チャレンジ（8）', `const f = ${J(figData(F_EQ))}, P = f.pts; let ok = FIGOK(f) && CONG(P, ${J(C_EQ)}) && near(AN(P, '∠BAC'), 60) && near(AN(P, '∠DAE'), 60) && near(AN(P, '∠BAD'), AN(P, '∠BAC') + AN(P, '∠CAD')) && near(AN(P, '∠CAE'), AN(P, '∠DAE') + AN(P, '∠CAD')) && near(AN(P, '∠BAD'), AN(P, '∠CAE')) && near(D(P, 'BD'), D(P, 'CE')) && near(D(P, 'AB'), D(P, 'BC')) && near(D(P, 'AD'), D(P, 'DE')); const pl = (r, d) => [r * Math.cos(d * Math.PI / 180), r * Math.sin(d * Math.PI / 180)]; for (let i = 0; i < 24; i++) { const s = 2 + (i % 5) * 0.5, t = 1 + (i % 4) * 0.6, b = -80 + (i * 13) % 60, e = 20 + (i * 17) % 100, Q = { A: [0, 0], B: pl(s, b), C: pl(s, b + 60), D: pl(t, e), E: pl(t, e + 60) }; ok = ok && near(D(Q, 'BD'), D(Q, 'CE')) && CONG(Q, ${J(C_EQ)}.eq ? { t1: 'ABD', t2: 'ACE', kind: 'SAS', eq: [['AB', 'AC'], ['AD', 'AE'], ['∠BAD', '∠CAE']] } : null); } return ok && ${J(A_D8)}.split('\\n').length === 8;`),
      // 小テスト（1）：答えの行数
      chk('第12時 小テスト（1）', `return ${J(A_Q1)}.split('\\n').length === 3;`),
      // 小テスト（2）AC∥DB、CO＝DO ならば AO＝BO。△AOC≡△BOD（ASA：∠OCA＝∠ODB は錯角）
      chk('第12時 小テスト（2）', `const f = ${J(figData(F_Q2))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_Q2)}) && near(D(P, 'AO'), D(P, 'BO')) && near(AN(P, '∠OCA'), AN(P, '∠ODB')) && ${J(A_Q2)}.replace(/（\\d点）/g, '') === '対頂角　錯角　1組の辺とその両端の角　辺' && ${J(A_Q2)}.match(/（(\\d)点）/g).map(t => +t[1]).reduce((a, c) => a + c, 0) === 6;`),
      // チャレンジ：M は AB の中点、AP⊥ℓ、BQ⊥ℓ（P、Q は ℓ 上）。△APM≡△BQM（ASA：∠PAM＝∠QBM は内角の和から）。AP＝BQ
      chk('第12時 小テスト チャレンジ', `const f = ${J(figData(F_M))}, P = f.pts; return near(D(P, 'AM'), D(P, 'BM')) && near(D(P, 'AM') + D(P, 'MB'), D(P, 'AB')) && near(AN(P, '∠APM'), 90) && near(AN(P, '∠BQM'), 90) && near(AN(P, '∠AMP'), AN(P, '∠BMQ')) && near(180 - 90 - AN(P, '∠AMP'), AN(P, '∠PAM')) && near(AN(P, '∠PAM'), AN(P, '∠QBM')) && CONG(P, ${J(C_M)}) && near(D(P, 'AP'), D(P, 'BQ')) && ${J(A_QC)} === '対頂角　内角の和　1組の辺とその両端の角　辺';`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('証明の1行ずつの、根拠を読み取ろう'),
      C2([
        K('今日の問い', '右の図で、AC∥DB、AO＝BO ならば、CO＝DO である。次の ①〜⑤ は、その証明の各行である。それぞれ、何を根拠にしているだろう。\n△AOC と △BOD において\n① ' + W1[0] + '　　② ' + W1[1] + '\n③ ' + W1[2] + '\n④ ' + W1[3] + '　　⑤ ' + W1[4], 8)
      ], [
        F(8, geoOf(F_H))
      ], '3:2'),
      T('①', '自分の考え（3分）　①〜⑤ の根拠を書こう。', 1),
      B(5, A_W1),
      T('②', 'ペアの考え（3分）　③の根拠は、図のどこでわかるか、話し合おう。', 1),
      B(2, ''),
      WD('証明の根拠にしてよいこと\n{{仮定}}、対頂角、平行線の{{錯角}}・{{同位角}}\n三角形の{{合同条件}}（3つ）\n合同な図形の{{対応}}する辺や角は等しい', 4, { label: 'ことば（教科書で調べよう）' }),
      C2([
        K('例題', '右の図で、OP は ∠XOY の二等分線で、OA＝{{OB}} である。PA＝PB の証明の、空欄をうめよう。', 3),
        T('', PF_BIS, 8)
      ], [
        F(8, geoOf(F_BIS))
      ], '2:1')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 証明の根拠にできるのは、{{仮定}}と、正しいと認められた性質。\n② 2つの三角形の合同を示すときは、三角形の{{合同条件}}を使う。\n③ 合同な図形では、{{対応}}する辺や角は等しい。\n④ 2つの三角形が同じ辺をもつとき、その辺は{{共通}}である。', 4, { label: 'ことば' }),
      C2([
        T('（1）', '線分 AB と CD が点 O で交わるとき、∠AOC＝∠BOD がいえる根拠を答えよう。', 3),
        B(2, A_D1)
      ], [
        T('（2）', '根拠にしてよいものを、すべて選ぼう。\nア 仮定（わかっていること）\nイ 対頂角は等しい\nウ 図で、等しく見えること\nエ これから示したい結論', 5),
        B(1, A_D2)
      ], '1:1'),
      MA('【説明】（1）の根拠を、「なぜ、そういえるか」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '図を見て、根拠や合同条件を答えよう。'),
      F(5, cap(geoOf(F_PT), '図1'), cap(geoOf(F_PR), '図2'), cap(geoOf(F_H), '図3')),
      C2([
        T('（3）', '図1で、PS＝PT、SQ＝TR である。PQ＝PR がいえる根拠を答えよう。', 3),
        B(3, A_D3)
      ], [
        T('（4）', '図1で、△PQT≡△PRS を示すときに使う合同条件と、等しい3組を答えよう。', 3),
        B(3, A_D4)
      ], '1:1'),
      C2([
        T('（5）', '図2で、AO＝CO、BO＝DO である。△AOB≡△COD から、AB∥DC をいうには、どの角が等しいことを、何を根拠にいえばよいか。', 4),
        B(3, A_D5)
      ], [
        T('（6）', '図3の証明で、「AO＝BO と ∠AOC＝∠BOD だから、2組の辺とその間の角が等しい」と書いた。まちがいを直そう。', 4),
        B(3, A_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：証明を、正しい順にならべよう。'),
      T('（7）', 'ア〜カは、右の図の「PQ＝PS、RQ＝RS ならば、∠PQR＝∠PSR」の証明を、ばらばらにしたものである。正しい順にならべよう。', 2),
      C2([
        ...KT_LINES.map(r => T(r[0], r[1], r[0] === 'エ' || r[0] === 'ア' ? 2 : 1))
      ], [
        F(8, geoOf(F_KT))
      ], '2:1'),
      T('①', '正しい順に、記号をならべよう。', 1),
      B(1, ''),
      T('②', '入れかえてよい行と、いけない行を、わけといっしょに書こう。', 1),
      B(3, ''),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '正三角形 ABC と正三角形 ADE が、図のように頂点 A を共有している。BD＝CE であることを証明しよう。', 5)
      ], [
        F(5, geoOf(F_EQ))
      ], '2:1'),
      B(8, A_D8),
      MA('① BD と CE を辺にもつ三角形は、どれかな。\n② ∠BAD と ∠CAE を、∠CAD を使って表せないかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次のことがいえる根拠を、答えよう。（4点）\n① 線分 AB と CD が点 O で交わっているとき、∠AOC＝∠BOD\n② △ABC≡△DEF のとき、BC＝EF\n③ AB＝DE、BC＝EF、CA＝FD のとき、△ABC≡△DEF', 4),
      B(3, A_Q1),
      C2([
        T('（2）', '右の図で、AB と CD が点 O で交わり、AC∥DB、CO＝DO ならば、AO＝BO である。証明の空欄をうめよう。（6点）\n' + PF_Q2, 9),
        B(1, A_Q2)
      ], [
        F(8, geoOf(F_Q2))
      ], '3:1'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（3）', '右の図で、M は線分 AB の中点で、直線 ℓ は M を通る。A、B から ℓ にひいた垂線の足を P、Q とすると、AP＝BQ である。証明の空欄をうめよう。\n' + PF_M, 11),
        B(1, A_QC)
      ], [
        F(9, geoOf(F_M))
      ], '3:1')
    ]
  });
})();
