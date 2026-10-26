/* 平行と合同 第12時「証明のしくみを読み取ろう」：授業計画・ワークシート・演習プリント・小テスト（新しい形）。
   授業ナビ 標準版（hyojun-navi）の第12時をもとに、50分の流れ（ペア学習3＋小テスト7＋解説・発問12＋演習23＋振り返り・回収5）に合わせて、新しく書き直した。
   印刷は3点セット：ワークシート（A4 表裏）／演習プリント（A4 表裏：表＝基礎・標準、裏＝応用・入試レベル）／小テスト（A4 片面・5分・10点満点。最後の1問は、別枠の入試レベル「チャレンジ」）。
   ・型は「例（例題と練習）」。できあがった証明を読んで、1行ごとの根拠を言う。第13時（自分で書く）の前の、読み取りの時間。証明は「△〜 と △〜 において」の形で書く。
     学習課題＝線分 AB と CD が点 O で交わり、AC∥DB、AO＝BO ならば CO＝DO。証明①〜⑤（根拠を書かない形）を全部印刷し、①〜⑤ が何を根拠にしているかを答える。
     ことば＝証明で根拠にできること（仮定・対頂角・平行線の錯角・同位角・合同条件・合同な図形の対応する辺や角）を穴埋め。ことば欄には、証明の順番（合同条件が先、性質があと）を書かない（考えようで見つけさせる）。
     例題＝角の二等分線（OA＝OB、∠AOP＝∠BOP、OP 共通 → PA＝PB）の証明の穴うめ（空欄あり）。
   ・考えよう＝「ばらばらにした証明（ア〜カ。PQ＝PS、RQ＝RS ならば ∠PQR＝∠PSR）を、正しい順にならべよう。入れかえてよい行と、入れかえてはいけない行は、どれか」。
     答え（見方）は、ワークシートにも教卓の解答にも載せない。発展は、「PR は共通」の行を消した証明が、証明といえるか（等しいものが2組しか示せない）。
   ・証明の根拠に使うのは、仮定・対頂角・平行線の同位角と錯角・三角形の合同条件（3つ）・合同な図形の性質・正三角形の定義（辺・角）・内角の和・平行線になる条件。合同条件は3つ以外に使わない。直角三角形の合同条件・反例・逆は使わない。
   ・checks：問題の図の座標から、辺の長さ・角の大きさを三角関数で計算し直して、証明の各行（等しいと言った組）が成り立つこと、合同条件の形（3辺／2辺と間の角／1辺と両端の角）、6つの要素がすべて等しいこと、
     結論（CO＝DO・PA＝PB・QT＝RS・AB∥DC・BD＝CE など）が座標から成り立つこと、を確かめた。証明の文は、データと照らして確かめた。
   ・見本（空間図形 第1時）との違い：平面図形の図（GEO）と、証明の文（穴埋め・読み取り）が中心。
   検算：node tools/verify.cjs　／　見た目：node tools/check.cjs */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = d => d * Math.PI / 180;
  const pol = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const neg = p => [-p[0], -p[1]];

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     D：長さ（'AB'）　AN：角の大きさ（度。'∠ABC' は B が頂点）　VAL：長さか角
     CONG(P, c)：△t1 と △t2（頂点を対応する順に）の、等しいと言った組 eq が、座標から計算して等しく、kind（SSS・SAS・ASA）の形で、6つの要素がすべて等しいこと
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

  /* ---------------- 図の道具 ---------------- */
  const mark = given => { const tick = [], ang = []; let ns = 0, na = 0; (given || []).forEach(g => { if (g[0][0] === '∠') { na++; g.forEach(s => { const [a, v, b] = [...s.replace('∠', '')]; ang.push({ at: v, a, b, n: na, k: na }); }); } else { ns++; g.forEach(s => tick.push([s[0], s[1], ns])); } }); return { tick, ang }; };
  const figData = f => { const mk = mark(f.given); return { pts: f.pts, tick: mk.tick.concat(f.tick || []), ang: mk.ang.concat(f.ang || []), par: f.par || [] }; };
  const geoOf = (f, o) => GEO(Object.assign({ poly: f.poly, segs: f.segs, vl: f.vl, dots: f.dots, size: f.size, pad: f.pad, a: f.a }, figData(f), o || {}));
  const KIND = { SSS: '3組の辺', SAS: '2組の辺とその間の角', ASA: '1組の辺とその両端の角' };
  const giv = f => f.given.map(g => g.join('＝')).join('、');

  /* ---------------- 問題の図と、証明（座標から作る） ---------------- */
  // 学習課題：線分 AB と CD が点 O で交わり、AC∥DB、AO＝BO ならば CO＝DO。△AOC≡△BOD（1組の辺とその両端の角：∠OAC＝∠OBD は錯角、∠AOC＝∠BOD は対頂角）
  const HA = [-2.2, 1.7], HC = [-2.2, -1.3];
  const F_H = { pts: { A: HA, B: neg(HA), C: HC, D: neg(HC), O: [0, 0] }, segs: ['AB', 'CD', 'AC', 'DB'], vl: { A: ['A', 135], B: ['B', 315], C: ['C', 225], D: ['D', 45], O: ['O', 90, 3.4] }, dots: ['O'], given: [['AO', 'BO']], par: [['A', 'C', 1], ['D', 'B', 1]], a: { ang: [{ at: 'O', a: 'A', b: 'C', n: 1, r: 5 }, { at: 'O', a: 'B', b: 'D', n: 1, r: 5 }, { at: 'A', a: 'O', b: 'C', n: 2, r: 5 }, { at: 'B', a: 'O', b: 'D', n: 2, r: 5 }] } };
  const C_H = { t1: 'AOC', t2: 'BOD', kind: 'ASA', eq: [['∠OAC', '∠OBD'], ['AO', 'BO'], ['∠AOC', '∠BOD']] };
  const W1 = ['AO＝BO', '∠AOC＝∠BOD', '∠OAC＝∠OBD', '△AOC≡△BOD', 'CO＝DO'];   // 証明の ①〜⑤（根拠を書かない形）
  const A_W1 = '① 仮定\n② 対頂角は等しい\n③ 平行線の錯角は等しい（AC∥DB）\n④ 合同条件（1組の辺とその両端の角）\n⑤ 合同な図形の、対応する辺は等しい';
  // 例題：OP は ∠XOY の二等分線。OA＝OB のとき PA＝PB。△OAP≡△OBP（2組の辺とその間の角：OA＝OB、∠AOP＝∠BOP、OP は共通）
  const F_BIS = { pts: { O: [0, 0], P: pol(4.4, 0), A: pol(3.0, 35), B: pol(3.0, -35), X: pol(5.4, 35), Y: pol(5.4, -35) }, segs: ['OX', 'OY', 'OP', 'PA', 'PB'], vl: { O: ['O', 180], P: ['P', 0], A: ['A', 100], B: ['B', 260], X: ['X', 35], Y: ['Y', 325] }, given: [['OA', 'OB'], ['∠AOP', '∠POB']] };
  const C_BIS = { t1: 'OAP', t2: 'OBP', kind: 'SAS', eq: [['OA', 'OB'], ['∠AOP', '∠BOP'], ['OP', 'OP']] };
  const PF_BIS = '△OAP と △OBP において\n仮定より　OA＝{{OB}} …①\nOP は ∠XOY の二等分線だから　∠AOP＝∠{{BOP}} …②\nOP は{{共通}} …③\n①、②、③ より、{{2組の辺とその間の角}}が、それぞれ等しいから　△OAP≡△OBP\n合同な図形の、対応する{{辺}}は等しいから　PA＝PB';
  // 考えよう：たこ形 PQRS（PQ＝PS、RQ＝RS）→ ∠PQR＝∠PSR。△PQR≡△PSR（3組の辺：PR は共通）
  const F_KT = { pts: { P: [3.2, 0], Q: [0.9, 2], R: [-1.8, 0], S: [0.9, -2] }, poly: 'PQRS', segs: ['PR'], vl: { P: ['P', 0], Q: ['Q', 90], R: ['R', 180], S: ['S', 270] }, given: [['PQ', 'PS'], ['RQ', 'RS']] };
  const C_KT = { t1: 'PQR', t2: 'PSR', kind: 'SSS', eq: [['PQ', 'PS'], ['RQ', 'RS'], ['PR', 'PR']] };
  const KT_LINES = [['ア', '3組の辺が、それぞれ等しいから　△PQR≡△PSR'], ['イ', '仮定より　RQ＝RS'], ['ウ', '△PQR と △PSR において'], ['エ', '合同な図形の、対応する角は等しいから　∠PQR＝∠PSR'], ['オ', 'PR は共通'], ['カ', '仮定より　PQ＝PS']];
  const KT_ORDER = 'ウ → （カ・イ・オ は、どの順でもよい） → ア → エ';   // 考えようの答え（載せない）
  // 演習（3）△PQR で、S は辺 PQ 上、T は辺 PR 上。PS＝PT、SQ＝TR（PQ＝PR）→ QT＝RS。△PQT≡△PRS（2組の辺とその間の角：∠P は共通）
  const PA_ = [0, 0], PQ_ = pol(5, 20), PR_ = pol(5, -20);
  const F_PT = { pts: { P: PA_, Q: PQ_, R: PR_, S: lerp(PA_, PQ_, 0.55), T: lerp(PA_, PR_, 0.55) }, poly: 'PQR', segs: ['QT', 'RS'], vl: { P: ['P', 180], Q: ['Q', 20], R: ['R', 340], S: ['S', 115], T: ['T', 245] }, given: [['PS', 'PT'], ['SQ', 'TR']] };
  const C_PT = { t1: 'PQT', t2: 'PRS', kind: 'SAS', eq: [['PT', 'PS'], ['PQ', 'PR'], ['∠QPT', '∠RPS']] };
  const PF_PT = '△PQT と △PRS において\n仮定より　PS＝{{PT}} …①\nPQ＝PS+SQ、PR＝PT+TR で、仮定より SQ＝{{TR}} だから　PQ＝PR …②\n∠P は{{共通}} …③\n①、②、③ より、{{2組の辺とその間の角}}が、それぞれ等しいから　△PQT≡△PRS\n合同な図形の、対応する辺は等しいから　QT＝{{RS}}';
  // 応用（5）線分 AC と BD が点 O で交わり、AO＝CO、BO＝DO ならば AB∥DC。△AOB≡△COD（2組の辺とその間の角）→ ∠OAB＝∠OCD（錯角）→ AB∥DC
  const F_PR = { pts: { A: pol(2.6, 160), B: pol(2.2, 20), C: pol(2.6, 340), D: pol(2.2, 200), O: [0, 0] }, segs: ['AC', 'BD', 'AB', 'DC'], vl: { A: ['A', 160], B: ['B', 20], C: ['C', 340], D: ['D', 200], O: ['O', 270, 3.4] }, dots: ['O'], given: [['AO', 'CO'], ['BO', 'DO']], a: { par: [['A', 'B', 1], ['D', 'C', 1]] } };
  const C_PR = { t1: 'AOB', t2: 'COD', kind: 'SAS', eq: [['AO', 'CO'], ['∠AOB', '∠COD'], ['BO', 'DO']] };
  const PF_PR = '△AOB と △COD において\n仮定より　AO＝{{CO}} …①　BO＝{{DO}} …②\n{{対頂角}}は等しいから　∠AOB＝∠{{COD}} …③\n①、②、③ より、{{2組の辺とその間の角}}が、それぞれ等しいから　△AOB≡△COD\n合同な図形の、対応する角は等しいから　∠OAB＝∠{{OCD}}\n{{錯角}}が等しいから　AB∥DC';
  // 入試（6）正三角形 ABC と ADE が頂点 A を共有。BD＝CE。△ABD≡△ACE（∠BAD＝∠CAE は、60°＋∠CAD）
  const F_EQ = { pts: { A: [0, 0], B: pol(3, -55), C: pol(3, 5), D: pol(2, 80), E: pol(2, 140) }, poly: ['ABC', 'ADE'], segs: ['BD', 'CE'], vl: { A: ['A', 200], B: ['B', 300], C: ['C', 10], D: ['D', 60], E: ['E', 130] }, given: [['AB', 'BC', 'CA'], ['AD', 'DE', 'EA']] };
  const C_EQ = { t1: 'ABD', t2: 'ACE', kind: 'SAS', eq: [['AB', 'AC'], ['AD', 'AE'], ['∠BAD', '∠CAE']] };
  const PF_EQ = '△ABD と △ACE において\n△ABC は正三角形だから　AB＝{{AC}} …①\n△ADE は正三角形だから　AD＝{{AE}} …②\n∠BAD＝60°+∠CAD、∠CAE＝60°+∠CAD だから　∠BAD＝∠{{CAE}} …③\n①、②、③ より、{{2組の辺とその間の角}}が、それぞれ等しいから　△ABD≡△ACE\n合同な図形の、対応する辺は等しいから　BD＝CE';
  // 演習（4）まちがった証明：AO＝BO、∠AOC＝∠BOD の2つだけで、「2組の辺とその間の角」としている（3つめがない）
  const WRONG = '△AOC と △BOD において、AO＝BO、∠AOC＝∠BOD。2組の辺とその間の角が、それぞれ等しいから、△AOC≡△BOD。よって、CO＝DO。';
  // 小テスト（2）AC∥DB、CO＝DO ならば AO＝BO（図 F_H と同じ形で、印は CO＝DO）　チャレンジ：線分 AB の中点 M を通る直線 ℓ。A、B から ℓ への垂線の足 P、Q → AP＝BQ
  const F_Q2 = Object.assign({}, F_H, { given: [['CO', 'DO']], a: undefined });
  const C_Q2 = { t1: 'AOC', t2: 'BOD', kind: 'ASA', eq: [['∠OCA', '∠ODB'], ['CO', 'DO'], ['∠AOC', '∠BOD']] };
  const PF_Q2 = '△AOC と △BOD において\n仮定より　CO＝DO …①\n{{対頂角}}は等しいから　∠AOC＝∠BOD …②\nAC∥DB で、平行線の{{錯角}}は等しいから　∠OCA＝∠ODB …③\n①、②、③ より、{{1組の辺とその両端の角}}が、それぞれ等しいから　△AOC≡△BOD\n合同な図形の、対応する{{辺}}は等しいから　AO＝BO';
  const F_M = { pts: { A: [-1.2, 2.4], B: [1.2, -2.4], M: [0, 0], P: [-1.2, 0], Q: [1.2, 0], L: [-3.2, 0], R: [3.2, 0] }, segs: ['AB', 'AP', 'BQ', ['L', 'R', { lab: 'ℓ' }]], vl: { A: ['A', 90], B: ['B', 270], M: ['M', 60, 3.4], P: ['P', 225], Q: ['Q', 45] }, given: [['AM', 'BM']], ang: [{ at: 'P', a: 'A', b: 'M', right: true, r: 4 }, { at: 'Q', a: 'B', b: 'M', right: true, r: 4 }] };
  const C_M = { t1: 'APM', t2: 'BQM', kind: 'ASA', eq: [['∠PAM', '∠QBM'], ['AM', 'BM'], ['∠AMP', '∠BMQ']] };
  const PF_M = '△APM と △BQM において\n仮定より　AM＝BM …①\n仮定より　∠APM＝∠BQM＝90° …②\n{{対頂角}}は等しいから　∠AMP＝∠BMQ …③\n②、③ と、三角形の{{内角の和}}は 180° から　∠PAM＝∠QBM …④\n①、③、④ より、{{1組の辺とその両端の角}}が、それぞれ等しいから　△APM≡△BQM\n合同な図形の、対応する{{辺}}は等しいから　AP＝BQ';

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const blanksOf = pf => (pf.match(/\{\{([^}]*)\}\}/g) || []).map(s => s.slice(2, -2));
  const BL = (pf, nums) => blanksOf(pf).map((b, i) => (nums ? nums[i] + ' ' : '') + b).join('　');
  const A_EX2 = BL(PF_BIS);
  const A_D1 = '① 対頂角は等しい\n② 合同な図形の、対応する辺は等しい\n③ 三角形の合同条件（3組の辺）';
  const A_D2 = 'ア、イ、オ';
  const A_D3 = BL(PF_PT);
  const A_D4 = 'まちがい … 等しいのは、AO＝BO と ∠AOC＝∠BOD の2つだけで、3つめが書かれていない。\n正しくは、AC∥DB より、平行線の錯角は等しいから ∠OAC＝∠OBD を加え、「1組の辺とその両端の角が、それぞれ等しいから」とする。';
  const A_D5 = BL(PF_PR);
  const A_D6 = BL(PF_EQ);
  const A_Q1 = '① 対頂角は等しい（1点）\n② 合同な図形の、対応する辺は等しい（1点）\n③ 三角形の合同条件（3組の辺）（2点）';
  const A_Q2 = blanksOf(PF_Q2).map((b, i) => b + '（' + [1, 1, 2, 2][i] + '点）').join('　');
    const A_QC = BL(PF_M);

  IK.lesson('heikou-12', {
    unit: 'heikou', unitName: '平行と合同', no: '第12時', title: '証明のしくみを読み取ろう',
    summary: 'できあがった証明を読んで、1行ごとの根拠（仮定・対頂角・錯角・合同条件・合同な図形の性質）を言う。考えようは、ばらばらにした証明を正しい順にならべ、入れかえてよい行といけない行を見つけること。',
    head: '平行と合同　第12時',
    checks: [
      // 学習課題：図は AC∥DB、AO＝BO。△AOC≡△BOD（ASA）。①〜⑤の文が、図の座標で成り立つ（CO＝DO は、図でも成り立つ）。答えの文は 5行
      chk('第12時 学習課題', `const f = ${J(figData(F_H))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_H)}) && near(D(P, 'CO'), D(P, 'DO')) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && near(AN(P, '∠OAC'), AN(P, '∠OBD')) && near(D(P, 'AO') + D(P, 'OB'), D(P, 'AB')) && near(D(P, 'CO') + D(P, 'OD'), D(P, 'CD')) && ${J(A_W1)}.split('\\n').length === 5 && ${J(W1)}.length === 5;`),
      // 例題：OP は ∠XOY の二等分線（∠AOP＝∠POB＝35°）。OA＝OB。△OAP≡△OBP（SAS）。PA＝PB。証明の文の空欄の答え
      chk('第12時 例題', `const f = ${J(figData(F_BIS))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_BIS)}) && near(AN(P, '∠XOP'), AN(P, '∠YOP')) && near(AN(P, '∠XOP'), 35) && near(D(P, 'PA'), D(P, 'PB')) && near(D(P, 'OA') + D(P, 'AX'), D(P, 'OX')) && ${J(PF_BIS)}.includes('△OAP≡△OBP') && ${J(PF_BIS)}.includes('PA＝PB') && ${J(A_EX2)} === 'OB　BOP　共通　2組の辺とその間の角　辺';`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：たこ形 PQRS。△PQR≡△PSR（SSS）。∠PQR＝∠PSR。ア〜カ は、順番 ウ→（カ・イ・オ）→ア→エ のとき、どの行も、前の行から導ける。ほかの順では、導けない行がある
      chk('第12時 考えよう', `const f = ${J(figData(F_KT))}, P = f.pts, L = ${J(KT_LINES)}.map(r => r[0]); return FIGOK(f) && CONG(P, ${J(C_KT)}) && near(AN(P, '∠PQR'), AN(P, '∠PSR')) && (() => { const need = { 'ウ': [], 'カ': ['ウ'], 'イ': ['ウ'], 'オ': ['ウ'], 'ア': ['ウ', 'カ', 'イ', 'オ'], 'エ': ['ウ', 'ア'] }; const ok = ord => ord.every((x, i) => need[x].every(y => ord.indexOf(y) >= 0 && ord.indexOf(y) < i)); const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p])); const good = perms(L).filter(ok); return good.length === 6 && good.every(o => o[0] === 'ウ' && o[4] === 'ア' && o[5] === 'エ' && new Set(o.slice(1, 4)).size === 3) && L.join('') === 'アイウエオカ'; })() && ${J(KT_LINES)}.length === 6;`),
      // 発展：「PR は共通」の行を消すと、等しいと示せるのは PQ＝PS、RQ＝RS の2組だけ。2組の辺が等しくても、合同でない三角形がある（辺が 3・4・5 と 3・4・6 の三角形）
      chk('第12時 発展', `const f = ${J(figData(F_KT))}, P = f.pts; const tri = (a, b, c) => { const x = (b * b + c * c - a * a) / (2 * c), y = Math.sqrt(b * b - x * x); return [[0, 0], [c, 0], [x, y]]; }; const t1 = tri(4, 3, 5), t2 = tri(4, 3, 6); const Q = { P: t1[0], Q: t1[1], R: t1[2], S: [t2[0][0] + 20, t2[0][1]], T: [t2[1][0] + 20, t2[1][1]], U: [t2[2][0] + 20, t2[2][1]] }; return near(D(P, 'PQ'), D(P, 'PS')) && near(D(P, 'RQ'), D(P, 'RS')) && near(D(Q, 'PR'), 3) && near(D(Q, 'SU'), 3) && near(D(Q, 'QR'), 4) && near(D(Q, 'TU'), 4) && !near(D(Q, 'PQ'), D(Q, 'ST')) && !near(AN(Q, '∠QPR'), AN(Q, '∠TSU'));`),
      // 基礎の根拠の問題：答えの行数
      chk('第12時 基礎（1）（2）', `return ${J(A_D1)}.split('\\n').length === 3 && ${J(A_D2)} === 'ア、イ、オ';`),
      // 標準（3）：△PQR の辺 PQ 上に S、辺 PR 上に T。PS＝PT、SQ＝TR。PQ＝PS+SQ＝PT+TR＝PR。△PQT≡△PRS（SAS）。QT＝RS
      chk('第12時 標準（3）', `const f = ${J(figData(F_PT))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_PT)}) && near(D(P, 'PQ'), D(P, 'PS') + D(P, 'SQ')) && near(D(P, 'PR'), D(P, 'PT') + D(P, 'TR')) && near(D(P, 'PQ'), D(P, 'PR')) && near(D(P, 'QT'), D(P, 'RS')) && near(AN(P, '∠QPT'), AN(P, '∠RPS')) && ${J(A_D3)} === 'PT　TR　共通　2組の辺とその間の角　RS';`),
      // 応用（4）まちがった証明：AO＝BO と ∠AOC＝∠BOD の2つ。座標では △AOC≡△BOD が成り立つが、この文では 3つめ（∠OAC＝∠OBD）が足りない
      chk('第12時 応用（4）', `const f = ${J(figData(F_H))}, P = f.pts; return near(D(P, 'AO'), D(P, 'BO')) && near(AN(P, '∠AOC'), AN(P, '∠BOD')) && near(AN(P, '∠OAC'), AN(P, '∠OBD')) && ${J(WRONG)}.includes('2組の辺とその間の角') && ${J(A_D4)}.includes('∠OAC＝∠OBD') && ${J(A_D4)}.includes('1組の辺とその両端の角');`),
      // 応用（5）AO＝CO、BO＝DO、対頂角 → △AOB≡△COD。∠OAB＝∠OCD は錯角 → AB∥DC（座標でも、AB と DC は平行）
      chk('第12時 応用（5）', `const f = ${J(figData(F_PR))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_PR)}) && near(AN(P, '∠OAB'), AN(P, '∠OCD')) && Math.abs((P.B[0] - P.A[0]) * (P.C[1] - P.D[1]) - (P.B[1] - P.A[1]) * (P.C[0] - P.D[0])) < 1e-9 && near(D(P, 'AO') + D(P, 'OC'), D(P, 'AC')) && near(D(P, 'BO') + D(P, 'OD'), D(P, 'BD')) && ${J(A_D5)} === 'CO　DO　対頂角　COD　2組の辺とその間の角　OCD　錯角';`),
      // 入試（6）正三角形 ABC と ADE。∠BAD＝60°+∠CAD、∠CAE＝60°+∠CAD。△ABD≡△ACE。BD＝CE
      chk('第12時 入試（6）', `const f = ${J(figData(F_EQ))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_EQ)}) && near(AN(P, '∠BAC'), 60) && near(AN(P, '∠DAE'), 60) && near(AN(P, '∠BAD'), AN(P, '∠BAC') + AN(P, '∠CAD')) && near(AN(P, '∠CAE'), AN(P, '∠DAE') + AN(P, '∠CAD')) && near(AN(P, '∠BAD'), AN(P, '∠CAE')) && near(D(P, 'BD'), D(P, 'CE')) && near(D(P, 'AB'), D(P, 'BC')) && near(D(P, 'AD'), D(P, 'DE')) && ${J(A_D6)} === 'AC　AE　CAE　2組の辺とその間の角';`),
      // 小テスト（1）
      chk('第12時 小テスト（1）', `return ${J(A_Q1)}.split('\\n').length === 3;`),
      // 小テスト（2）AC∥DB、CO＝DO ならば AO＝BO。△AOC≡△BOD（ASA：∠OCA＝∠ODB は錯角）
      chk('第12時 小テスト（2）', `const f = ${J(figData(F_Q2))}, P = f.pts; return FIGOK(f) && CONG(P, ${J(C_Q2)}) && near(D(P, 'AO'), D(P, 'BO')) && near(AN(P, '∠OCA'), AN(P, '∠ODB')) && ${J(A_Q2)}.replace(/（\\d点）/g, '') === '対頂角　錯角　1組の辺とその両端の角　辺' && ${J(A_Q2)}.match(/（(\\d)点）/g).map(t => +t[1]).reduce((a, c) => a + c, 0) === 6;`),
      // チャレンジ：M は AB の中点、AP⊥ℓ、BQ⊥ℓ（P、Q は ℓ 上）。△APM≡△BQM（ASA：∠PAM＝∠QBM は内角の和から）。AP＝BQ
      chk('第12時 小テスト チャレンジ', `const f = ${J(figData(F_M))}, P = f.pts; return near(D(P, 'AM'), D(P, 'BM')) && near(D(P, 'AM') + D(P, 'MB'), D(P, 'AB')) && near(AN(P, '∠APM'), 90) && near(AN(P, '∠BQM'), 90) && near(AN(P, '∠AMP'), AN(P, '∠BMQ')) && near(180 - 90 - AN(P, '∠AMP'), AN(P, '∠PAM')) && near(AN(P, '∠PAM'), AN(P, '∠QBM')) && CONG(P, ${J(C_M)}) && near(D(P, 'AP'), D(P, 'BQ')) && ${J(A_QC)} === '対頂角　内角の和　1組の辺とその両端の角　辺';`)
    ],

    /* ================= 授業計画 ================= */
    plan: {
      type: '例（例題と練習）',
      aim: '証明の流れ（仮定 → 根拠 → 結論）を読み取り、証明の各行が、何を根拠にしているかを言うことができる。',
      flow: [
        { g: '導入', m: 3, scene: 'ペア学習', do: '前時の重要語句（仮定・結論・根拠・証明）を、ペアで1人1問ずつ出題し合う。', st: '言葉の意味を、自分の言葉で言う。', note: '静かに、時間を切って。緊張感をつくる。' },
        { g: '小テスト', m: 7, scene: '小テスト', do: '前時分の小テスト。自己採点と回収まで。', st: '静かに取り組む。', note: '5分＋答え合わせ・回収 2分。10点満点。チャレンジは別枠（正解で満点）。' },
        { g: '解説', m: 4, scene: '学習課題', do: 'めあてを書く。できあがった証明を読み、①〜⑤が何を根拠にしているか、個人→ペアで考える。', q: ['③の ∠OAC＝∠OBD は、なぜいえるだろう。'], st: '① 仮定　② 対頂角　③ 錯角　④ 合同条件　⑤ 合同の性質', note: '「図を見ればわかる」は、根拠にならないと伝える。' },
        { g: '解説', m: 3, scene: 'ことば', do: '証明で、根拠にできることがらを、穴埋めで押さえる。', q: ['根拠にしてよいのは、どんなことがらだろう。'], st: '空欄に書き込む。', note: '空欄は、先生が言ってから書かせる。' },
        { g: '解説', m: 5, scene: '例題', do: '角の二等分線の証明の、空欄をうめる。1行ごとに、根拠を言いながら書かせる。', q: ['この行は、何を根拠にしているだろう。'], st: '行ごとに、根拠を言って書く。', note: '語は、先生が言ってから書かせる。' },
        { g: '演習', m: 2, scene: '演習① 考えようの提示', do: '進め方を伝える。ゴールは、「考えよう」（ワークシート裏）を全員が説明できること。立ち歩きOK、解答は教卓（考えようの答えはない）。', st: '', note: '「できた人が教える」ではなく「説明できるようになる」と伝える。' },
        { g: '演習', m: 5, scene: '演習② 基礎', do: '基礎（個人）。解いたら、教卓の解答で答え合わせ。早く終わったら、考えようへ。', st: '基礎 →（終わった人から）考えようへ。', note: '解答は教卓。セルフチェック。' },
        { g: '演習', m: 14, scene: '演習③ 考えよう＋標準（学び合い）', do: '立ち歩きで、教え合い・説明し合い。先生は回って、気づきの言葉を拾い、必要なら判断して短く全体に戻す。', st: '行をならべる → 入れかえてよい行を探す → わけを話す。', note: '判断：ならべ方が決まらない→ヒント1／入れかえで止まる→ヒント2・3／残り5分→指名。答えは言わない。' },
        { g: '演習', m: 2, scene: '演習④ 方向性', do: '答えは示さず、方向性だけを一言で伝える（下の枠）。', st: '', note: '' },
        { g: '振り返り', m: 5, scene: '振り返り・回収', do: '今日わかったことを、ペアで1つずつ言い合う。ワークシートと演習プリントを回収（未完成でも出す）。', st: '今日わかったことを、口で言う。', note: '' }
      ],
      words: ['仮定', '根拠', '証明', '合同条件'],
      think: {
        q: 'ア〜カは、「PQ＝PS、RQ＝RS ならば、∠PQR＝∠PSR」の証明を、ばらばらにしたものである。正しい順にならべよう。入れかえてよい行と、入れかえてはいけない行は、どれだろう。',
        views: [
          'はじめは ウ（どの三角形に目をつけるか）。',
          'カ・イ・オ（等しいもの3つ）は、どの順でもよい。',
          'ア（合同条件）は、等しいもの3つのあと。エ（合同の性質）は、合同がいえたあと。'
        ],
        hints: [
          'どの行が、いちばん先に書けるだろう。',
          'ア、エの行は、どの行のあとでないと書けないだろう。',
          '入れかえてもよい行は、友達と確かめる。'
        ],
        direction: '「証明の読み方がわかったら、次は、自分で書いてみよう。次の時間は、その練習だよ。」'
      },
      manabi: [
        { kind: '説明', text: '基礎のあと：（1）の根拠を、「なぜそういえるか」を使って、隣の人に説明する。' },
        { kind: '比べる', text: '標準のあと：（3）の空欄を、友達と比べ、根拠の言い方のちがいを話す。' },
        { kind: '教える', text: '最後：解けなかった問題を、できた人に聞く。問題と人の名前を書く。' }
      ],
      see: [
        ['思考・判断・表現', '証明の行の順序と、前の行とのつながりを、根拠をもとに説明しているか（考えよう）。'],
        ['知識・技能', '証明の各行の根拠を言い、空欄をうめられるか。'],
        ['学び合い', 'わからないことを聞き、説明するために動いているか。']
      ],
      tips: [
        ['根拠を、「図を見ればわかる」とする', '見た目は根拠にならない。仮定か、習った性質の名前で答えさせる。'],
        ['合同条件と、合同な図形の性質を、混同する', '合同を示すのが合同条件、合同のあとに使うのが性質、と行の位置で考えさせる。'],
        ['等しいものを、2つしか書かない', '「合同条件は、いくつそろえばよいか」と聞く。']
      ],
      prep: ['学習課題の証明・例題の図の拡大（黒板用）', '小テスト（前時分）／今日の小テストは、次時のはじめ用', '教卓：ワークシート・演習プリント・小テストの解答（考えようの答えは載せない）']
    },

    /* ================= ワークシート（両面） ================= */
    ws: [
      // ---- 表 ----
      M('証明のしくみを読み取ろう'),
      C2([
        K('学習課題', '右の図で、線分 AB と CD が点 O で交わり、AC∥DB、AO＝BO ならば、CO＝DO である。この証明の ①〜⑤ は、それぞれ何を根拠にしているだろう。\n△AOC と △BOD において\n① ' + W1[0] + '\n② ' + W1[1] + '\n③ ' + W1[2] + '\n④ ' + W1[3] + '\n⑤ ' + W1[4], 10),
        B(5, A_W1)
      ], [
        F(10, geoOf(F_H))
      ], '2:1'),
      G(1),
      WD('証明では、次のことがらを根拠にする。\n・{{仮定}}（問題で、はじめにわかっていること）\n・対頂角は等しい。平行線の{{同位角}}・{{錯角}}は等しい。\n・三角形の{{合同条件}}（3つ）\n・合同な図形の、{{対応}}する辺や角は等しい。', 5),
      G(1),
      C2([
        K('例題', '右の図で、OP は ∠XOY の二等分線で、半直線 OX、OY 上に OA＝{{OB}} となる点 A、B をとる。PA＝PB であることの証明を、空欄をうめて完成させよう。', 4),
        T('証明', PF_BIS, 10)
      ], [
        F(9, geoOf(F_BIS))
      ], '2:1'),
      BR(),

      // ---- 裏：考えよう ----
      K('考えよう', '次のア〜カは、右の図の「PQ＝PS、RQ＝RS ならば、∠PQR＝∠PSR」の証明を、\nばらばらにしたものである。正しい順にならべよう。\n入れかえてよい行と、入れかえてはいけない行は、どれだろう。', 3),
      C2([
        ...KT_LINES.map(r => T(r[0], r[1], r[0] === 'エ' ? 2 : 1))
      ], [
        F(7, geoOf(F_KT))
      ], '3:2'),
      T('①', '正しい順に、記号をならべよう。', 1),
      B(2, ''),
      T('②', '入れかえてよい行と、入れかえてはいけない行を、わけといっしょに書こう。', 2),
      B(8, ''),
      T('③', '友達と話して、証明が、どのようにつながっているかを、自分のことばでまとめよう。', 2),
      B(7, ''),
      T('発展', '演習まで解き終わった人は、考えてみよう！\n「PR は共通」の行を消すと、この証明は、どうなるだろう。', 3),
      B(2, '')
    ],

    /* ================= 演習プリント（両面） ================= */
    dr: [
      HD('演習', 'ことばを使って、証明の根拠を言おう。'),
      WD('① 「〇〇〇 ならば △△△」の、〇〇〇 を{{仮定}}、△△△ を{{結論}}という。\n② 証明の根拠にできるのは、仮定と、すでに正しいと認められた{{性質}}（対頂角、平行線の錯角・同位角、三角形の合同条件など）である。', 4, { label: 'ことば確認' }),
      HD('基礎', '次の問いに答えよう。'),
      T('（1）', '次のことがいえる根拠を、答えよう。\n① 線分 AB と CD が点 O で交わっているとき、∠AOC＝∠BOD\n② △ABC≡△DEF のとき、BC＝EF\n③ AB＝DE、BC＝EF、CA＝FD のとき、△ABC≡△DEF', 4),
      B(3, A_D1),
      T('（2）', '次のア〜カのうち、証明の根拠にしてよいものを、すべて選ぼう。\nア 問題で、はじめに与えられていること　　イ 対頂角は等しい\nウ 図を見て、等しく見えること　　エ これから示そうとしていること\nオ 三角形の合同条件　　カ 定規ではかった長さ', 4),
      B(1, A_D2),
      MA('【説明】（1）の根拠を、「なぜ、そういえるか」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('標準', '証明の空欄をうめよう。'),
      C2([
        T('（3）', '右の図の △PQR で、辺 PQ 上に点 S、辺 PR 上に点 T があり、PS＝PT、SQ＝TR ならば、QT＝RS である。\n' + PF_PT, 10),
        B(1, A_D3)
      ], [
        F(9, geoOf(F_PT))
      ], '2:1'),
      MA('【比べる】（3）の空欄を、友達と比べよう。根拠の言い方で、ちがうところを書こう。', 2),
      BR(),

      HD('応用', '証明の中の、まちがいや空欄を考えよう。'),
      T('（4）', '「AC∥DB、AO＝BO ならば、CO＝DO である」の証明が、次のように書かれている。まちがいを指摘して、正しく直そう。\n' + WRONG, 4),
      B(3, A_D4),
      C2([
        T('（5）', '右の図で、線分 AC と BD が点 O で交わり、AO＝CO、BO＝DO ならば、AB∥DC である。\n' + PF_PR, 9),
        B(1, A_D5)
      ], [
        F(8, geoOf(F_PR))
      ], '2:1'),
      HD('入試レベル', '証明の空欄をうめよう。'),
      C2([
        T('（6）', '正三角形 ABC と正三角形 ADE が、図のように頂点 A を共有している。このとき、BD＝CE である。\n' + PF_EQ, 12),
        B(1, A_D6)
      ], [
        F(9, geoOf(F_EQ))
      ], '2:1'),
      MA('【教える】解けなかった問題を、できた人に聞こう。\n教えてもらった問題（　　　）　教えてくれた人（　　　　　　）', 2)
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次のことがいえる根拠を、答えよう。（4点）\n① 線分 AB と CD が点 O で交わっているとき、∠AOC＝∠BOD\n② △ABC≡△DEF のとき、BC＝EF\n③ AB＝DE、BC＝EF、CA＝FD のとき、△ABC≡△DEF', 4),
      B(3, A_Q1),
      C2([
        T('（2）', '右の図で、線分 AB と CD が点 O で交わり、AC∥DB、CO＝DO ならば、AO＝BO である。証明の空欄をうめよう。（6点）\n' + PF_Q2, 10),
        B(1, A_Q2)
      ], [
        F(8, geoOf(F_Q2))
      ], '3:1'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（3）', '右の図で、M は線分 AB の中点で、直線 ℓ は M を通る。A、B から ℓ にひいた垂線と ℓ との交点を、それぞれ P、Q とすると、AP＝BQ である。証明の空欄をうめよう。\n' + PF_M, 13),
        B(1, A_QC)
      ], [
        F(9, geoOf(F_M))
      ], '3:1')
    ]
  });
})();
