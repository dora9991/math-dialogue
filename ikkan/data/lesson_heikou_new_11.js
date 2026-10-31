/* 平行と合同（新しい形） 第11時：「正しい」ことを、だれもが納得できるように伝えるには（仮定と結論）。 元：data/lesson_heikou_11.js（前の形）を、新しい形に組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（AO＝BO、CO＝DO の図で、AC＝BD はいつでもいえるか。はからずに説明する）。個人3分 → ペア3分 → ことば（仮定・結論・根拠・証明）→ 例題（3つのことがらの仮定と結論。空欄あり）。
     先生の板書の例（B）は、「（仮定）…／（結論）…／（証明）…」の形で、証明を全部書いた。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう：連続する3つの整数の和についての4人の説明。答えなし）・チャレンジ★★（四角形の角の証明。ヒントカードつき）。
     元の考えようは、ワークシートの証明（AC＝BD）と、同じことがらの説明をくらべる形で、ワークシートの板書の例が答えのヒントになってしまうので、別のことがら（連続する3つの整数の和）に作りかえた。
     元の（6）（連続する3つの整数）・チャレンジの（7）（四角形）は、考えよう・チャレンジ★★に使い、元の演習（6）は、x＝6n の説明に変えた。
   ・数値・図は、元と同じ（AO＝BO＝2.8、CO＝DO＝2.0）。答えは checks で、座標から長さ・角を計算し直して確かめた（AC＝BD、△AOC≡△BOD の6つの要素、ほかの図40個、など）。
   ・範囲：合同条件（3つ）・対頂角・平行線の同位角・四角形の内角の和は、すでに学習ずみ。「反例」「逆」は使わない。
   検算：node tools/verify.cjs heikou_new-11　／　見た目：node tools/check.cjs <出力先> heikou_new-11 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;
  const rad = d => d * Math.PI / 180;
  const pol = (r, d) => [r * Math.cos(rad(d)), r * Math.sin(rad(d))];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];

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

  /* ---------------- 問題の図と、答えの組（座標から作る） ---------------- */
  // 今日の問い：線分 AB と CD が点 O で交わる。AO＝BO＝2.8、CO＝DO＝2.0（∠AOC＝∠BOD＝65°）
  const BOW = (pts, o) => Object.assign({ pts, segs: ['AB', 'CD', 'AC', 'BD'], vl: { A: ['A', 150], B: ['B', 330], C: ['C', 215], D: ['D', 35], O: ['O', 92, 3.4] }, dots: ['O'], pad: 6 }, o || {});
  const F_BOW = BOW({ A: pol(2.8, 150), B: pol(2.8, 330), C: pol(2.0, 215), D: pol(2.0, 35), O: [0, 0] }, { given: [['AO', 'BO'], ['CO', 'DO']], a: { ang: [{ at: 'O', a: 'A', b: 'C', n: 1, r: 6 }, { at: 'O', a: 'B', b: 'D', n: 1, r: 6 }] } });
  const C_BOW = { t1: 'AOC', t2: 'BOD', eq: [['AO', 'BO'], ['CO', 'DO'], ['∠AOC', '∠BOD']], kind: 'SAS' };
  // 演習（5）：AO＝BO だけがわかっている図（CO＝2.0、DO＝3.0）。1目もり＝1cm（scale 10）。AC＝約 2.7 cm、BD＝約 3.1 cm
  const F_BOW2 = BOW({ A: pol(2.8, 150), B: pol(2.8, 330), C: pol(2.0, 215), D: pol(3.0, 35), O: [0, 0] }, { given: [['AO', 'BO']], scale: 10, pad: 3 });
  // 演習（3）の図（ワークシートと同じ図。解答では、等しい角の弧は出さない）
  const F_3 = BOW({ A: pol(2.8, 150), B: pol(2.8, 330), C: pol(2.0, 215), D: pol(2.0, 35), O: [0, 0] }, { given: [['AO', 'BO'], ['CO', 'DO']], pad: 4 });
  // 演習（4）平行線：ℓ∥m ならば ∠a＝∠c。∠a＝∠b（同位角）、∠b＝∠c（対頂角）。ℓ は下、m は上
  const PL = { A: [0, 0], B: [10, 0], C: [0, 4], D: [10, 4], P: [3.2, 0], Q: [6.8, 4] };
  PL.R = add(PL.Q, [(PL.Q[0] - PL.P[0]) * 0.4, (PL.Q[1] - PL.P[1]) * 0.4]);
  const F_PL = { pts: PL, segs: [['A', 'B', { ext: [0.08, 0.08], lab: 'ℓ' }], ['C', 'D', { ext: [0.08, 0.08], lab: 'm' }], ['P', 'Q', { ext: [0.45, 0.45], lab: 'n' }]], par: [['A', 'B', 1], ['C', 'D', 1]], pad: 5,
    ang: [{ at: 'P', a: 'B', b: 'Q', t: 'a', r: 5 }, { at: 'Q', a: 'D', b: 'R', t: 'b', r: 5 }, { at: 'Q', a: 'C', b: 'P', t: 'c', r: 5 }] };
  // 例題・演習のことがら：t＝ことがらの文、h＝仮定、c＝結論
  const ST_EX = [
    { t: 'AO＝BO、CO＝DO ならば、AC＝BD である。', h: 'AO＝BO、CO＝DO', c: 'AC＝BD' },
    { t: 'x が 6 の倍数ならば、x は 3 の倍数である。', h: 'x が 6 の倍数', c: 'x は 3 の倍数' },
    { t: '2直線が平行ならば、同位角は等しい。', h: '2直線が平行', c: '同位角は等しい' }
  ];
  const ST1 = { t: '△ABC≡△DEF ならば、∠A＝∠D である。', h: '△ABC≡△DEF', c: '∠A＝∠D' };
  const RW = { o: '対頂角は等しい。', t: '2つの角が対頂角ならば、その2つの角は等しい。', h: '2つの角が対頂角', c: 'その2つの角は等しい' };
  const ST3 = { t: 'AO＝BO、CO＝DO ならば、∠OAC＝∠OBD である。', h: 'AO＝BO、CO＝DO', c: '∠OAC＝∠OBD' };
  const ST4 = { t: 'ℓ∥m ならば、∠a＝∠c である。', h: 'ℓ∥m', c: '∠a＝∠c' };
  const ST6 = { t: 'x が 6 の倍数ならば、x は 3 の倍数である。', h: 'x が 6 の倍数', c: 'x は 3 の倍数' };
  const ST7 = { t: '3つの整数が連続しているならば、その和は 3 の倍数である。', h: '3つの整数が連続している', c: 'その和は 3 の倍数' };
  const ST8 = { t: '四角形 ABCD で、∠A＝∠C、∠B＝∠D ならば、∠A+∠B＝180° である。', h: '四角形 ABCD で、∠A＝∠C、∠B＝∠D', c: '∠A+∠B＝180°' };
  const ST_Q1 = [
    { t: 'x が 10 の倍数ならば、x は 5 の倍数である。', h: 'x が 10 の倍数', c: 'x は 5 の倍数' },
    { t: '△ABC≡△DEF ならば、BC＝EF である。', h: '△ABC≡△DEF', c: 'BC＝EF' }
  ];
  const RW_Q = { o: '正三角形の3つの辺は等しい。', t: '△ABC が正三角形ならば、AB＝BC＝CA である。', h: '△ABC が正三角形', c: 'AB＝BC＝CA' };
  const ST_QC = { t: '3つの偶数が連続しているならば、その和は 6 の倍数である。', h: '3つの偶数が連続している', c: 'その和は 6 の倍数' };
  const hc = s => '仮定 … ' + s.h + '\n結論 … ' + s.c;

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const A_W = '（例）（仮定）AO＝BO、CO＝DO　　（結論）AC＝BD\n（証明）△AOC と △BOD において\n仮定より　AO＝BO …①　　CO＝DO …②\n対頂角は等しいから　∠AOC＝∠BOD …③\n①、②、③より、' + KIND.SAS + 'が、それぞれ等しいから　△AOC≡△BOD\n合同な図形の、対応する辺は等しいから　AC＝BD';
  const A_SEE = '「ならば」の前が仮定、後ろが結論。\n（例）「ならば」のところに線を引いて、前と後ろに分ける。';
  const A_D1 = hc(ST1);
  const A_D2 = RW.t;
  const A_D3 = hc(ST3) + '\n△AOC と △BOD';
  const A_D4 = '∠a＝∠b … 平行線の同位角は等しい\n∠b＝∠c … 対頂角は等しい';
  const A_D5 = 'AC＝約 ' + cm1(D(F_BOW2.pts, 'AC')) + ' cm、BD＝約 ' + cm1(D(F_BOW2.pts, 'BD')) + ' cm\nで、等しくない。\n（CO＝DO がたりない）';
  const A_D6 = 'x は 6 の倍数だから、x＝6n と表せる。\nx＝6n＝3×2n で、2n は整数だから\nx は 3 の倍数である。';
  const A_D8 = '（仮定）四角形 ABCD で、∠A＝∠C、∠B＝∠D　　（結論）∠A+∠B＝180°\n（証明）四角形の内角の和は 360° だから\n　∠A+∠B+∠C+∠D＝360° …①\n仮定より　∠C＝∠A、∠D＝∠B だから、①は\n　∠A+∠B+∠A+∠B＝360°　　2∠A+2∠B＝360°\nよって　∠A+∠B＝180°';
  const A_Q1 = '① 仮定 … ' + ST_Q1[0].h + '　　結論 … ' + ST_Q1[0].c + '\n② 仮定 … ' + ST_Q1[1].h + '　　結論 … ' + ST_Q1[1].c;
  const A_Q2 = RW_Q.t;
  const A_Q3 = 'ならない。\nはかったのは、かいた図だけで、ほかの図でも成り立つとはいえない。';
  const A_QC = '（仮定）3つの偶数が連続している　　（結論）その和は 6 の倍数\n（証明）真ん中の偶数を 2n（n は整数）とすると、\n　3つの偶数は　2n−2、2n、2n+2\n　その和は　(2n−2)+2n+(2n+2)＝6n\n　n は整数だから、6n は 6 の倍数である。';

  IK.lesson('heikou_new-11', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第11時', title: '「正しい」ことを、だれもが納得できるように伝えるには',
    summary: '「AO＝BO、CO＝DO ならば AC＝BD」を、はからずに説明することから、仮定・結論・根拠・証明のことばをとらえる。考えようは、4人の説明をくらべて、納得できる説明に必要なことを見つける。',
    head: '平行と合同　第11時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：図は AO＝BO＝2.8、CO＝DO＝2.0、対頂角 65°。AC＝BD（約 2.7）。△AOC≡△BOD（2組の辺とその間の角）。板書の例の行数・内容と一致
      chk('第11時 今日の問い', `const f = ${J(figData(F_BOW))}, P = f.pts; return FIGOK(f) && f.tick.length === 4 && CONG(P, ${J(C_BOW)}) && near(D(P, 'AC'), D(P, 'BD')) && near(AN(P, '∠AOC'), 65) && near(AN(P, '∠BOD'), 65) && near(D(P, 'AO') + D(P, 'OB'), D(P, 'AB')) && near(D(P, 'CO') + D(P, 'OD'), D(P, 'CD')) && ${J(A_W)}.split('\\n').length === 6 && ${J(A_W)}.includes('△AOC≡△BOD') && ${J(A_W)}.includes('AC＝BD');`),
      // いつでも成り立つ：AO＝BO、CO＝DO の図を、長さと向きを変えて 40個つくって、AC＝BD と △AOC≡△BOD（計算で確かめる。5つはかっても「いつでも」にはならない、ということは、考えようで扱う）
      chk('第11時 今日の問い（ほかの図でも）', `let ok = true; for (let i = 0; i < 40; i++) { const a = 1 + (i % 7) * 0.5, c = 0.8 + (i % 5) * 0.6, th = 20 + (i * 11) % 140, ph = (i * 37) % 360, rr = Math.PI / 180; const A = [a * Math.cos(ph * rr), a * Math.sin(ph * rr)], C = [c * Math.cos((ph + th) * rr), c * Math.sin((ph + th) * rr)], P = { A, B: [-A[0], -A[1]], C, D: [-C[0], -C[1]], O: [0, 0] }; ok = ok && near(D(P, 'AC'), D(P, 'BD')) && CONG(P, ${J(C_BOW)}); } return ok;`),
      // 例題：3つのことがらの、ならばの前後が、仮定・結論と一致。（2）6 の倍数は 3 の倍数（600 まで）。（3）平行線の同位角（座標：ℓ∥m、同位角が等しい）
      chk('第11時 例題', `const S = ${J(ST_EX)}; let ok = S.every(STOK); for (let x = 6; x <= 600; x += 6) ok = ok && x % 3 === 0; const P = { A: [0, 0], B: [10, 0], C: [0, 4], D: [10, 4], P: [3.2, 0], Q: [6.8, 4], R: [8.24, 5.6] }; return ok && near(AN(P, '∠BPQ'), AN(P, '∠DQR'));`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：連続する3つの整数 n−1、n、n+1 の和＝3n（ウは正しい）。アは 5つの例の和（6・9・12・15・18）。エは、和が 3 の倍数であることを、はじめに使っている（結論を根拠にしている）
      chk('第11時 考えよう', `let ok = STOK(${J(ST7)}); const sums = [1, 2, 3, 4, 5].map(k => k + (k + 1) + (k + 2)); ok = ok && sums.join() === '6,9,12,15,18' && sums.every(s => s % 3 === 0); for (let n = -40; n <= 40; n++) ok = ok && (n - 1) + n + (n + 1) === 3 * n && ((n - 1) + n + (n + 1)) % 3 === 0; for (let k = -40; k <= 40; k++) ok = ok && (k + (k + 1) + (k + 2)) % 3 === 0 && (k + (k + 1) + (k + 2)) / 3 === k + 1; return ok;`),
      // 演習（1）（2）：ならばの前後が、仮定・結論と一致。△ABC≡△DEF のとき ∠A＝∠D（座標：合同な2つの三角形）
      chk('第11時 基礎（1）（2）', `const S = [${J(ST1)}, ${J(RW)}]; const P = { A: [0, 0], B: [4, 0], C: [1, 3], D: [10, 1], E: [10 + 4 * Math.cos(0.5), 1 + 4 * Math.sin(0.5)], F: [] }; const r = [1, 3], c = Math.cos(0.5), s = Math.sin(0.5); P.F = [10 + r[0] * c - r[1] * s, 1 + r[0] * s + r[1] * c]; return S.every(STOK) && near(AN(P, '∠CAB'), AN(P, '∠FDE')) && near(D(P, 'AB'), D(P, 'DE')) && ${J(A_D1)}.includes('結論 … ∠A＝∠D') && ${J(A_D2)} === ${J(RW.t)};`),
      // 演習（3）AO＝BO、CO＝DO ならば ∠OAC＝∠OBD。△AOC≡△BOD で、対応する角 ∠OAC＝∠OBD（座標から）
      chk('第11時 標準（3）', `const f = ${J(figData(F_3))}, P = f.pts, S = ${J(ST3)}; return FIGOK(f) && STOK(S) && CONG(P, ${J(C_BOW)}) && near(AN(P, '∠OAC'), AN(P, '∠OBD')) && ${J(A_D3)}.includes('結論 … ∠OAC＝∠OBD') && ${J(A_D3)}.includes('△AOC と △BOD');`),
      // 演習（4）ℓ∥m：∠a（∠BPQ）、∠b（∠DQR）、∠c（∠CQP）。a＝b（同位角）、b＝c（対頂角）、よって a＝c
      chk('第11時 標準（4）', `const f = ${J(figData(F_PL))}, P = f.pts; return FIGOK(f) && STOK(${J(ST4)}) && near(AN(P, '∠BPQ'), AN(P, '∠DQR')) && near(AN(P, '∠DQR'), AN(P, '∠CQP')) && near(AN(P, '∠BPQ'), AN(P, '∠CQP')) && near(AN(P, '∠DQR') + AN(P, '∠RQC'), 180) && ${J(A_D4)}.includes('同位角') && ${J(A_D4)}.includes('対頂角');`),
      // 演習（5）AO＝BO だけの図：AC≠BD（約 2.7 cm と 3.1 cm）。CO≠DO
      chk('第11時 標準（5）', `const f = ${J(figData(F_BOW2))}, P = f.pts; return FIGOK(f) && near(D(P, 'AO'), D(P, 'BO')) && !near(D(P, 'CO'), D(P, 'DO')) && Math.abs(D(P, 'AC') - D(P, 'BD')) > 0.3 && ${J(A_D5)}.includes('約 2.7 cm') && ${J(A_D5)}.includes('約 3.1 cm') && Math.abs(D(P, 'AC') * 10 - 26.7) < 0.1 && Math.abs(D(P, 'BD') * 10 - 31.2) < 0.2;`),
      // 演習（6）x が 6 の倍数 → x＝6n＝3×2n（n を −50〜50 で確かめ）
      chk('第11時 標準（6）', `let ok = STOK(${J(ST6)}); for (let n = -50; n <= 50; n++) { const x = 6 * n; ok = ok && x === 3 * (2 * n) && x % 3 === 0; } return ok && ${J(A_D6)}.includes('x＝6n＝3×2n');`),
      // 演習（8）四角形 ABCD（∠A＝∠C、∠B＝∠D）：内角の和 360°、2∠A+2∠B＝360°、∠A+∠B＝180°（A を 40〜140°、B を 60〜120° で確かめ。平行四辺形の座標でも確かめ）
      chk('第11時 チャレンジ（8）', `let ok = STOK(${J(ST8)}); for (let a = 40; a <= 140; a += 10) for (let b = 60; b <= 120; b += 10) { const c = a, d = b, tot = a + b + c + d; ok = ok && near(tot, 2 * a + 2 * b) && (near(tot, 360) ? near(a + b, 180) : true); } const P = { A: [0, 0], B: [4, 0], C: [5.5, 3], D: [1.5, 3] }; return ok && near(AN(P, '∠DAB') + AN(P, '∠ABC') + AN(P, '∠BCD') + AN(P, '∠CDA'), 360) && near(AN(P, '∠DAB'), AN(P, '∠BCD')) && near(AN(P, '∠ABC'), AN(P, '∠CDA')) && near(AN(P, '∠DAB') + AN(P, '∠ABC'), 180) && ${J(A_D8)}.includes('∠A+∠B＝180°');`),
      // 小テスト（1）（2）：ならばの前後が、仮定・結論と一致。10 の倍数は 5 の倍数（500 まで）。△ABC≡△DEF のとき BC＝EF
      chk('第11時 小テスト（1）（2）', `const S = ${J(ST_Q1)}.concat([${J(RW_Q)}]); let ok = S.every(STOK); for (let x = 10; x <= 500; x += 10) ok = ok && x % 5 === 0; const P = { A: [0, 0], B: [4, 0], C: [1, 3], D: [10, 1] }, c = Math.cos(0.5), s = Math.sin(0.5); P.E = [10 + 4 * c, 1 + 4 * s]; P.F = [10 + 1 * c - 3 * s, 1 + 1 * s + 3 * c]; return ok && near(D(P, 'BC'), D(P, 'EF')) && ${J(A_Q1)}.includes('仮定 … ' + S[0].h) && ${J(A_Q1)}.includes('結論 … ' + S[1].c) && ${J(A_Q2)} === S[2].t;`),
      // チャレンジ：連続する3つの偶数 2n−2、2n、2n+2 の和＝6n（n を −20〜20 で確かめ）。連続する3つの偶数の和が 6 の倍数（開始値が偶数）
      chk('第11時 小テスト チャレンジ', `let ok = STOK(${J(ST_QC)}); for (let n = -20; n <= 20; n++) ok = ok && (2 * n - 2) + 2 * n + (2 * n + 2) === 6 * n; for (let k = -30; k <= 30; k++) { const e = 2 * k; ok = ok && (e + (e + 2) + (e + 4)) % 6 === 0; } return ok && ${J(A_QC)}.includes('＝6n');`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('仮定と結論を分けて、納得できる説明のしかたをとらえよう'),
      C2([
        K('今日の問い', '右の図で、線分 AB と CD は点 O で交わり、AO＝BO、CO＝DO である。AC と BD は、いつでも等しいといえるだろうか。はからずに、だれもが納得できるように説明しよう。', 6)
      ], [
        F(6, geoOf(F_BOW))
      ], '3:2'),
      T('①', '自分の考え（3分）　わけを、順に書こう。', 1),
      B(6, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう説明を書こう。', 1),
      B(2, ''),
      G(1),
      WD('「〇〇〇 ならば △△△」の\n〇〇〇 を{{仮定}}、△△△ を{{結論}}という。\n正しいと認められたことがらを{{根拠}}に、\n仮定から結論を示すことを{{証明}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次のことがらの、仮定と結論を答えよう。（1）は見本。\n（1）' + ST_EX[0].t + '\n（2）' + ST_EX[1].t + '\n（3）' + ST_EX[2].t, 4),
      TB('', ['（1）見本', '（2）', '（3）'], [
        ['仮定', [ST_EX[0].h, '{{' + ST_EX[1].h + '}}', '{{' + ST_EX[2].h + '}}']],
        ['結論', [ST_EX[0].c, '{{' + ST_EX[1].c + '}}', '{{' + ST_EX[2].c + '}}']]
      ], { hw: 18 }),
      T('', '【見分け方】仮定と結論は、どこで分けられるか。', 1),
      B(2, A_SEE)
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 「〇〇〇 ならば △△△」の、〇〇〇 を{{仮定}}という。\n② 「〇〇〇 ならば △△△」の、△△△ を{{結論}}という。\n③ 正しいと認められた、証明のもとになることがらを{{根拠}}という。\n④ 仮定から結論まで、根拠をあげて筋道を立てて示すことを{{証明}}という。', 4, { label: 'ことば' }),
      C2([
        T('（1）', '「' + ST1.t + '」の、仮定と結論を答えよう。', 3),
        B(2, A_D1)
      ], [
        T('（2）', '「' + RW.o + '」を、「〇〇〇 ならば △△△」の形に書き直そう。', 3),
        B(2, A_D2)
      ], '1:1'),
      MA('【説明】仮定と結論を、ことがらのどこを見て分けるか、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '仮定や根拠に目をつけて、考えよう。'),
      F(5, cap(geoOf(F_3), '図1'), cap(geoOf(F_PL), '図2'), cap(geoOf(F_BOW2), '図3')),
      C2([
        T('（3）', '図1で、「' + ST3.t + '」を示したい。仮定と結論を答え、合同を示す2つの三角形も答えよう。', 4),
        B(3, A_D3)
      ], [
        T('（4）', '図2で、ℓ∥m ならば、∠a＝∠c である。∠a＝∠b と ∠b＝∠c の根拠を、それぞれ答えよう。', 4),
        B(3, A_D4)
      ], '1:1'),
      C2([
        T('（5）', '図3は、AO＝BO である。AC と BD をはかって、「AO＝BO ならば、AC＝BD」といえるか答えよう。', 4),
        B(3, A_D5)
      ], [
        T('（6）', '「' + ST6.t + '」わけを、x＝6n（n は整数）として説明しよう。', 3),
        B(3, A_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：納得できる説明は、どれだろう。'),
      T('（7）', '「連続する3つの整数の和は、3 の倍数である」わけを、4人が説明した。だれもが納得できる説明は、どれだろう。', 2),
      T('ア', 'ゆうさん：「1+2+3＝6、2+3+4＝9、3+4+5＝12、4+5+6＝15、5+6+7＝18。どれも 3 の倍数だから、いつでも 3 の倍数である。」', 2),
      T('イ', 'かなさん：「連続する3つの整数の和は、いつも 3 の倍数になりそうに見える。だから、3 の倍数である。」', 2),
      T('ウ', 'そうたさん：「真ん中の整数を n とすると、3つの整数は n−1、n、n+1。その和は (n−1)+n+(n+1)＝3n。n は整数だから、3n は 3 の倍数である。」', 2),
      T('エ', 'りんさん：「和は 3 の倍数だから、3n と表せる。3n÷3＝n だから、真ん中の整数は n。3つの整数は n−1、n、n+1 で、和は 3n になる。」', 2),
      T('①', 'ア〜エを、納得できるものは ○、できないものは × にして、わけも書こう。', 1),
      B(4, ''),
      T('②', '「だれもが納得できる説明」には、何が必要だろう。自分のことばでまとめよう。', 1),
      B(3, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      T('（8）', '「' + ST8.t + '」を、証明しよう。', 2),
      B(6, A_D8),
      MA('① 四角形の内角の和は、何度だったかな。\n② ∠C を ∠A、∠D を ∠B で表して、式をつくってみよう。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '次のことがらの、仮定と結論を答えよう。（4点）\n① ' + ST_Q1[0].t + '\n② ' + ST_Q1[1].t, 3),
      B(3, A_Q1),
      T('（2）', '「' + RW_Q.o + '」を、「〇〇〇 ならば △△△」の形に書き直そう。（3点）', 2),
      B(2, A_Q2),
      T('（3）', '線分 AB と CD が点 O で交わり、AO＝BO、CO＝DO の図を何個もかいて、AC と BD をはかったら、どれも AC＝BD になった。これで、「いつでも AC＝BD である」と証明したことになるだろうか。わけも書こう。（3点）', 3),
      B(3, A_Q3),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '「' + ST_QC.t + '」を、真ん中の偶数を 2n（n は整数）として、証明しよう。', 2),
      B(5, A_QC)
    ]
  });
})();
