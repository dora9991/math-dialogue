/* 平行と合同 第13時「合同を使って、線分や角が等しいことを証明しよう」：授業計画・ワークシート・演習プリント・小テスト（新しい形）。
   授業ナビ 標準版（hyojun-navi）の第13時をもとに、50分の流れ（ペア学習3＋小テスト7＋解説・発問12＋演習23＋振り返り・回収5）に合わせて、新しく書き直した。
   印刷は3点セット：ワークシート（A4 表裏）／演習プリント（A4 表裏：表＝基礎・標準、裏＝応用・入試レベル）／小テスト（A4 片面・5分・10点満点。最後の1問は、別枠の入試レベル「チャレンジ」）。
   ・型は「例（例題と練習）」。証明の進め方（「△ABC と △DCB において」→ 等しいものを3つ → 合同条件 → 合同 → 結論）を、はじめて自分の手で書く時間。
     学習課題＝四角形 ABCD で AB＝DC、∠ABC＝∠DCB ならば AC＝DB（共通な辺 BC。全部印刷。証明は先生の板書を写す）。
     ことば＝共通・合同条件・対応する（用語だけ。証明の進め方そのものは、ことば欄に書かない）。
     例題＝M は AB の中点で PM⊥AB ならば PA＝PB（仮定と結論の空欄あり。証明を書く）。
   ・考えよう＝「AB＝AC、AD は ∠BAC の二等分線ならば BD＝CD」の証明として3人が書いたア〜ウを読んで、正しいか、たりないところはないかを、わけをつけて説明する。
     ア（等しいものが2つしかなく、合同条件もない）・イ（結論の BD＝CD を、根拠に使っている）・ウ（正しい）。答えは、ワークシートにも教卓の解答にも載せない。
     ことば欄には、証明の進め方（3つ・合同条件を書く・結論は根拠にしない）を書かない。発展は、合同から出た等しい角を、もう一度の合同に使う（△ABO≡△DCO）。
   ・図は、平面図形の図 GEO。点の座標を、角度や長さから計算し、仮定どおりに正確にかいた。仮定（等しい辺・等しい角・平行・直角）は、図にしるしがある。
     checks では、図と同じ座標から、仮定・合同・結論を計算し直して確かめた。答えの文の中の、文字のない「…＝…」の計算も確かめた。
   ・表記：垂直は「PM⊥AB」（中1で学習ずみ）。平行は「AB∥DC」。証明の中の根拠は、「仮定より」「共通」「対頂角は等しいから」「平行線の錯角は等しいから」の形にそろえた。
   ・範囲：二等辺三角形・平行四辺形の性質や、直角三角形の合同条件は使わない（第5章）。正方形・正三角形は、辺の長さ・角の大きさ（小学校で学習ずみ）だけを使う。
   検算：node tools/verify.cjs　／　見た目：node tools/check.cjs */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA } = IK.b;
  const GEO = IK.b.GEO || ((o, fo) => IK.b.SVG(() => '', fo));   // verify.cjs は geo.js を読みこまない（図の中身は検査しない）
  const J = JSON.stringify;

  /* ---------------- 図の座標（図と checks の両方で使う。Math だけを使う、独立した関数） ---------------- */
  // 四角形 ABCD：AB＝DC、∠ABC＝∠DCB（BC を底にした、左右対称の形）
  const trapP = () => { const L = 2.9, t = 66 * Math.PI / 180, w = 4.6, h = L * Math.sin(t), c = L * Math.cos(t); return { A: [c, h], B: [0, 0], C: [w, 0], D: [w - c, h] }; };
  // 対角線 AC と DB の交点 O をふくむ
  const trapOP = () => {
    const L = 2.9, t = 66 * Math.PI / 180, w = 4.6, h = L * Math.sin(t), c = L * Math.cos(t), A = [c, h], B = [0, 0], C = [w, 0], D = [w - c, h];
    const u = ((B[0] - A[0]) * (B[1] - D[1]) - (B[1] - A[1]) * (B[0] - D[0])) / ((C[0] - A[0]) * (B[1] - D[1]) - (C[1] - A[1]) * (B[0] - D[0]));
    return { A, B, C, D, O: [A[0] + u * (C[0] - A[0]), A[1] + u * (C[1] - A[1])] };
  };
  // M は AB の中点、PM⊥AB
  const perpP = () => ({ A: [-2.4, 0], B: [2.4, 0], M: [0, 0], P: [0, 2.9] });
  // AB＝AC、AD は ∠BAC の二等分線（D は BC 上）
  const isoP = () => ({ A: [0, 3.4], B: [-2, 0], C: [2, 0], D: [0, 0] });
  // たこ形 ABCD：AB＝AD、CB＝CD、対角線 AC
  const kiteP = () => ({ A: [0, 2.5], B: [-1.8, 1.1], C: [0, -1.9], D: [1.8, 1.1] });
  // 線分 AD と BC が O で交わり、AB∥DC、AB＝DC
  const bowP = () => ({ O: [0, 0], A: [-2.2, 1.4], B: [1.6, 1.4], C: [-1.6, -1.4], D: [2.2, -1.4] });
  // AB＝AC、D は AB 上、E は AC 上で AD＝AE
  const overP = () => {
    const A = [0, 3.4], B = [-2.2, 0], C = [2.2, 0], r = 0.58;
    return { A, B, C, D: [A[0] + r * (B[0] - A[0]), A[1] + r * (B[1] - A[1])], E: [A[0] + r * (C[0] - A[0]), A[1] + r * (C[1] - A[1])] };
  };
  // 正方形 ABCD（A が左上、B が左下）。E は BC 上、F は CD 上で BE＝CF。G は AE と BF の交点
  const sqP = () => {
    const A = [0, 4], B = [0, 0], C = [4, 0], D = [4, 4], E = [1.5, 0], F = [4, 1.5];
    const s = ((B[0] - A[0]) * (F[1] - B[1]) - (B[1] - A[1]) * (F[0] - B[0])) / ((E[0] - A[0]) * (F[1] - B[1]) - (E[1] - A[1]) * (F[0] - B[0]));
    return { A, B, C, D, E, F, G: [A[0] + s * (E[0] - A[0]), A[1] + s * (E[1] - A[1])] };
  };
  // △ABC の外側に、辺 AB、AC を1辺とする正三角形 ABD、ACE
  const eqP = () => {
    const A = [0.3, 2.5], B = [-2.1, 0], C = [2.3, 0.5], rot = (p, q, deg) => { const t = deg * Math.PI / 180, x = q[0] - p[0], y = q[1] - p[1]; return [p[0] + x * Math.cos(t) - y * Math.sin(t), p[1] + x * Math.sin(t) + y * Math.cos(t)]; };
    const side = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    let D = rot(A, B, 60); if (side(A, B, D) * side(A, B, C) > 0) D = rot(A, B, -60);
    let E = rot(A, C, 60); if (side(A, C, E) * side(A, C, B) > 0) E = rot(A, C, -60);
    return { A, B, C, D, E };
  };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     d(P, a, b)：2点の距離　ang(P, v, a, b)：∠avb の大きさ（度）　cong(P, 'ABC', 'DCB')：対応する順の三角形が、3辺・3角ともに等しいか
     par(P, a, b, c, e)：直線 ab と ce が平行か　arith：答えの文の中の、文字のない「…＝…」が、計算として正しいか */
  const d = (P, a, b) => Math.hypot(P[a][0] - P[b][0], P[a][1] - P[b][1]);
  const ang = (P, v, a, b) => { const ux = P[a][0] - P[v][0], uy = P[a][1] - P[v][1], wx = P[b][0] - P[v][0], wy = P[b][1] - P[v][1]; return Math.abs(Math.atan2(ux * wy - uy * wx, ux * wx + uy * wy)) * 180 / Math.PI; };
  const cong = (P, s, t) => [0, 1, 2].every(i => near(d(P, s[i], s[(i + 1) % 3]), d(P, t[i], t[(i + 1) % 3])) && near(ang(P, s[i], s[(i + 1) % 3], s[(i + 2) % 3]), ang(P, t[i], t[(i + 1) % 3], t[(i + 2) % 3])));
  const par = (P, a, b, c, e) => Math.abs((P[b][0] - P[a][0]) * (P[e][1] - P[c][1]) - (P[b][1] - P[a][1]) * (P[e][0] - P[c][0])) < 1e-9;
  const EV = s => { let t = String(s).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/'); for (let k = 0; k < 3; k++) t = t.replace(/\[\[([^\]\/]*)\/([^\]]*)\]\]/g, '(($1)/($2))'); return new Function('return ' + t)(); };
  const arith = t => (String(t).replace(/°/g, '').replace(/…[①-⑥]/g, ' ').match(/[0-9][0-9+\-−×÷＝().\[\]\/]*/g) || []).filter(u => u.includes('＝')).every(u => { const p = u.split('＝').filter(s => s !== ''); return p.length < 2 || p.map(EV).every(v => near(v, EV(p[0]))); });
  const LIB = 'const d = ' + d + '; const ang = ' + ang + '; const cong = ' + cong + '; const par = ' + par + '; const EV = ' + EV + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };
  const PT = f => `const P = (${f})();`;   // checks の中で、図の座標をつくる

  /* ---------------- 図（GEO） ---------------- */
  const FIG = {
    // 四角形 ABCD（AB＝DC、∠ABC＝∠DCB）と、対角線 AC、DB
    trap: o => GEO(Object.assign({ pts: trapP(), poly: 'ABCD', segs: [['A', 'C'], ['D', 'B']], tick: [['A', 'B', 1], ['D', 'C', 1]], vl: 'ABCD', pad: 6,
      ang: [{ at: 'B', a: 'A', b: 'C', n: 1, r: 5 }, { at: 'C', a: 'D', b: 'B', n: 1, r: 5 }] }, o || {})),
    trapO: () => GEO({ pts: trapOP(), poly: 'ABCD', segs: [['A', 'C'], ['D', 'B']], tick: [['A', 'B', 1], ['D', 'C', 1]], vl: { A: 'A', B: 'B', C: 'C', D: 'D', O: ['O', 0, 3.4] }, pad: 5,
      ang: [{ at: 'B', a: 'A', b: 'C', n: 1, r: 4 }, { at: 'C', a: 'D', b: 'B', n: 1, r: 4 }] }),
    // 線分 AB の中点 M、PM⊥AB
    perp: () => GEO({ pts: perpP(), poly: 'PAB', segs: [['P', 'M']], tick: [['A', 'M', 1], ['M', 'B', 1]], vl: 'PABM', pad: 6,
      ang: [{ at: 'M', a: 'P', b: 'B', right: true }, { at: 'M', a: 'P', b: 'A', right: true }] }),
    // 三角形 ABC（AB＝AC）と、∠A の二等分線 AD
    iso: () => GEO({ pts: isoP(), poly: 'ABC', segs: [['A', 'D']], tick: [['A', 'B', 1], ['A', 'C', 1]], vl: 'ABCD', pad: 6,
      ang: [{ at: 'A', a: 'B', b: 'D', n: 1, r: 5 }, { at: 'A', a: 'D', b: 'C', n: 1, r: 5 }] }),
    // たこ形 ABCD と対角線 AC。kind＝'sss'（AB＝AD、CB＝CD）／'sas'（AB＝AD、∠BAC＝∠DAC）
    kite: kind => GEO(kind === 'sss'
      ? { pts: kiteP(), poly: 'ABCD', segs: [['A', 'C']], tick: [['A', 'B', 1], ['A', 'D', 1], ['C', 'B', 2], ['C', 'D', 2]], vl: 'ABCD', pad: 6 }
      : { pts: kiteP(), poly: 'ABCD', segs: [['A', 'C']], tick: [['A', 'B', 1], ['A', 'D', 1]], vl: 'ABCD', pad: 6, ang: [{ at: 'A', a: 'B', b: 'C', n: 1, r: 5 }, { at: 'A', a: 'C', b: 'D', n: 1, r: 5 }] }),
    // 線分 AD、BC が O で交わる。AB∥DC、AB＝DC
    bow: () => GEO({ pts: bowP(), segs: [['A', 'B'], ['C', 'D'], ['A', 'D'], ['B', 'C']], tick: [['A', [-0.3, 1.4], 1], ['D', [0.3, -1.4], 1]], par: [['A', 'B', 1], ['C', 'D', 1]], vl: { A: 'A', B: 'B', C: 'C', D: 'D', O: ['O', 90, 3.2] }, pad: 6 }),
    // AB＝AC、D は AB 上、E は AC 上で AD＝AE
    over: () => GEO({ pts: overP(), poly: 'ABC', segs: [['B', 'E'], ['C', 'D']], tick: [['A', 'D', 1], ['A', 'E', 1], ['D', 'B', 2], ['E', 'C', 2]], vl: 'ABCDE', pad: 6 }),
    // 正方形 ABCD と、BE＝CF の点 E、F
    sq: () => GEO({ pts: sqP(), poly: 'ABCD', segs: [['A', 'E'], ['B', 'F']], tick: [['B', 'E', 1], ['C', 'F', 1]], vl: { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E', F: 'F', G: ['G', 60, 3.2] }, pad: 6,
      ang: [{ at: 'A', a: 'B', b: 'D', right: true }, { at: 'B', a: 'A', b: 'C', right: true }, { at: 'C', a: 'B', b: 'D', right: true }, { at: 'D', a: 'A', b: 'C', right: true }] }),
    // △ABC の外側の正三角形 ABD、ACE と、線分 BE、DC
    eq: () => GEO({ pts: eqP(), poly: 'ABC', segs: [['A', 'D'], ['D', 'B'], ['A', 'E'], ['E', 'C'], ['B', 'E'], ['D', 'C']], tick: [['A', 'B', 1], ['A', 'D', 1], ['D', 'B', 1], ['A', 'C', 2], ['A', 'E', 2], ['E', 'C', 2]], vl: 'ABCDE', pad: 6 })
  };

  /* ---------------- 答えの文（画面にも checks にも、同じ文字列を使う） ---------------- */
  const A_TASK = '△ABC と △DCB において\n仮定より　AB＝DC …①\n仮定より　∠ABC＝∠DCB …②\nBC は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△ABC≡△DCB\n合同な図形の、対応する辺は等しいから\nAC＝DB';
  const A_EX = '△PAM と △PBM において\nM は AB の中点だから　AM＝BM …①\nPM⊥AB だから　∠PMA＝∠PMB＝90° …②\nPM は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△PAM≡△PBM\n合同な図形の、対応する辺は等しいから\nPA＝PB';
  const A_D1 = '左から　CD、共通、3組の辺、角';
  const A_D2 = '△AOB と △DOC において\n仮定より　AB＝DC …①\nAB∥DC より、平行線の錯角は等しいから\n∠OAB＝∠ODC …②　　∠OBA＝∠OCD …③\n①、②、③より、1組の辺とその両端の角が、それぞれ等しいから\n△AOB≡△DOC\n合同な図形の、対応する辺は等しいから\nAO＝DO';
  const A_D3 = '△ABE と △ACD において\n仮定より　AB＝AC …①　　AE＝AD …②\n∠A は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから\n△ABE≡△ACD\n合同な図形の、対応する辺は等しいから\nBE＝CD';
  const A_D4 = '① △ABE と △BCF において\n　 正方形の辺だから　AB＝BC …①\n　 正方形の角だから　∠ABE＝∠BCF＝90° …②\n　 仮定より　BE＝CF …③\n　 ①、②、③より、2組の辺とその間の角が、それぞれ等しいから　△ABE≡△BCF\n　 合同な図形の、対応する辺は等しいから　AE＝BF\n② △ABE≡△BCF より　∠BAE＝∠CBF\n　 ∠ABG＋∠CBF＝∠ABC＝90° だから　∠ABG＋∠BAG＝90°\n　 △ABG の内角の和は 180° だから　∠AGB＝180°−90°＝90°';
  const A_Q1 = '左から　DC、共通、2組の辺とその間の角、角';
  const A_Q2 = '△ABC と △ADC において\n仮定より　AB＝AD …①　　∠BAC＝∠DAC …②\nAC は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから　△ABC≡△ADC\n合同な図形の、対応する辺は等しいから　BC＝DC';
  const A_QC = '△ABE と △ADC において\n正三角形 ABD だから　AB＝AD …①\n正三角形 ACE だから　AE＝AC …②\n∠BAE＝∠BAC＋∠CAE＝∠BAC＋60°\n∠DAC＝∠DAB＋∠BAC＝60°＋∠BAC　より　∠BAE＝∠DAC …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから　△ABE≡△ADC\n合同な図形の、対応する辺は等しいから　BE＝DC';

  const DEF = {
    unit: 'heikou', unitName: '平行と合同', no: '第13時', title: '合同を使って、線分や角が等しいことを証明しよう',
    summary: '三角形の合同を使って、線分や角が等しいことを、「△ABC と △DCB において」で書きはじめる形で証明する。考えようは、3人が書いた証明を読んで、正しいか、たりないところはないかを調べ、証明を書くとき大切なことをまとめる。',
    head: '平行と合同　第13時',
    checks: [
      // 学習課題：AB＝DC、∠ABC＝∠DCB、BC は共通 → △ABC≡△DCB（2組の辺とその間の角）→ AC＝DB。対応する順は A→D、B→C、C→B
      chk('第13時 学習課題', `${PT(trapP)} return near(d(P, 'A', 'B'), d(P, 'D', 'C')) && near(ang(P, 'B', 'A', 'C'), ang(P, 'C', 'D', 'B')) && near(d(P, 'B', 'C'), d(P, 'C', 'B')) && cong(P, 'ABC', 'DCB') && near(d(P, 'A', 'C'), d(P, 'D', 'B')) && !par(P, 'A', 'B', 'D', 'C');`),
      // 例題：M は AB の中点（AM＝BM）、PM⊥AB（∠PMA＝∠PMB＝90°）、PM は共通 → △PAM≡△PBM → PA＝PB
      chk('第13時 例題', `${PT(perpP)} return near(d(P, 'A', 'M'), d(P, 'M', 'B')) && near(ang(P, 'M', 'P', 'A'), 90) && near(ang(P, 'M', 'P', 'B'), 90) && cong(P, 'PAM', 'PBM') && near(d(P, 'P', 'A'), d(P, 'P', 'B'));`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：AB＝AC、AD は ∠BAC の二等分線。ウは正しい（AB＝AC、∠BAD＝∠CAD、AD は共通 → 2組の辺とその間の角）。D は BC 上。イの BD＝CD は、証明したい結論
      chk('第13時 考えよう', `${PT(isoP)} return near(d(P, 'A', 'B'), d(P, 'A', 'C')) && near(ang(P, 'A', 'B', 'D'), ang(P, 'A', 'D', 'C')) && near(ang(P, 'A', 'B', 'D') + ang(P, 'A', 'D', 'C'), ang(P, 'A', 'B', 'C')) && near(d(P, 'B', 'D') + d(P, 'D', 'C'), d(P, 'B', 'C')) && cong(P, 'ABD', 'ACD') && near(d(P, 'B', 'D'), d(P, 'C', 'D'));`),
      // 発展：△ABC≡△DCB から ∠BAC＝∠CDB、∠ACB＝∠DBC。∠ABO＝∠ABC−∠OBC＝∠DCB−∠OCB＝∠DCO。AB＝DC、∠BAO＝∠CDO、∠ABO＝∠DCO → △ABO≡△DCO
      chk('第13時 発展', `${PT(trapOP)} return cong(P, 'ABC', 'DCB') && near(ang(P, 'B', 'A', 'C'), ang(P, 'C', 'D', 'B')) && near(ang(P, 'C', 'A', 'B'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'A', 'B', 'O'), ang(P, 'A', 'B', 'C')) && near(ang(P, 'D', 'C', 'O'), ang(P, 'D', 'C', 'B')) && near(ang(P, 'B', 'A', 'C') - ang(P, 'B', 'O', 'C'), ang(P, 'B', 'A', 'O')) && near(ang(P, 'B', 'O', 'C'), ang(P, 'B', 'D', 'C')) && near(ang(P, 'C', 'O', 'B'), ang(P, 'C', 'A', 'B')) && near(ang(P, 'C', 'D', 'B') - ang(P, 'C', 'O', 'B'), ang(P, 'C', 'D', 'O')) && near(ang(P, 'B', 'A', 'O'), ang(P, 'C', 'D', 'O')) && cong(P, 'ABO', 'DCO');`),
      // 基礎（1）たこ形：AB＝AD、CB＝CD、AC は共通 → △ABC≡△ADC（3組の辺）→ ∠BAC＝∠DAC
      chk('第13時 基礎（1）', `${PT(kiteP)} return near(d(P, 'A', 'B'), d(P, 'A', 'D')) && near(d(P, 'C', 'B'), d(P, 'C', 'D')) && cong(P, 'ABC', 'ADC') && near(ang(P, 'A', 'B', 'C'), ang(P, 'A', 'D', 'C')) && !near(d(P, 'A', 'B'), d(P, 'C', 'B'));`),
      // 標準（2）AB∥DC、AB＝DC。∠OAB＝∠ODC（AD を横切る錯角）、∠OBA＝∠OCD（BC を横切る錯角）→ △AOB≡△DOC（1組の辺とその両端の角）→ AO＝DO
      chk('第13時 標準（2）', `${PT(bowP)} return par(P, 'A', 'B', 'D', 'C') && near(d(P, 'A', 'B'), d(P, 'D', 'C')) && near(ang(P, 'A', 'O', 'B'), ang(P, 'D', 'O', 'C')) && near(ang(P, 'B', 'O', 'A'), ang(P, 'C', 'O', 'D')) && cong(P, 'AOB', 'DOC') && near(d(P, 'A', 'O'), d(P, 'D', 'O')) && near(d(P, 'B', 'O'), d(P, 'C', 'O'));`),
      // 応用（3）AB＝AC、AD＝AE（D は AB 上、E は AC 上）。∠BAE＝∠CAD（∠A は共通）→ △ABE≡△ACD → BE＝CD
      chk('第13時 応用（3）', `${PT(overP)} return near(d(P, 'A', 'B'), d(P, 'A', 'C')) && near(d(P, 'A', 'D'), d(P, 'A', 'E')) && near(d(P, 'A', 'D') + d(P, 'D', 'B'), d(P, 'A', 'B')) && near(d(P, 'A', 'E') + d(P, 'E', 'C'), d(P, 'A', 'C')) && near(ang(P, 'A', 'B', 'E'), ang(P, 'A', 'C', 'D')) && near(ang(P, 'A', 'B', 'E'), ang(P, 'A', 'B', 'C')) && cong(P, 'ABE', 'ACD') && near(d(P, 'B', 'E'), d(P, 'C', 'D'));`),
      // 入試（4）正方形：BE＝CF、AB＝BC、∠ABE＝∠BCF＝90° → △ABE≡△BCF → AE＝BF、∠BAE＝∠CBF。∠AGB＝90°（座標からも）
      chk('第13時 入試（4）', `${PT(sqP)} return near(d(P, 'B', 'E'), d(P, 'C', 'F')) && near(d(P, 'A', 'B'), d(P, 'B', 'C')) && near(ang(P, 'B', 'A', 'E'), 90) && near(ang(P, 'C', 'B', 'F'), 90) && cong(P, 'ABE', 'BCF') && near(d(P, 'A', 'E'), d(P, 'B', 'F')) && near(ang(P, 'A', 'B', 'E'), ang(P, 'B', 'C', 'F')) && near(ang(P, 'B', 'A', 'G') + ang(P, 'B', 'C', 'F'), 90) && near(ang(P, 'B', 'A', 'G') + ang(P, 'A', 'B', 'G'), 90) && near(ang(P, 'G', 'A', 'B'), 90);`),
      // 小テスト（1）たこ形でなく、四角形 ABCD（AB＝DC、∠ABC＝∠DCB）：∠BAC＝∠CDB　（2）たこ形：AB＝AD、∠BAC＝∠DAC、AC は共通 → BC＝DC
      chk('第13時 小テスト（1）', `${PT(trapP)} return cong(P, 'ABC', 'DCB') && near(ang(P, 'A', 'B', 'C'), ang(P, 'D', 'C', 'B'));`),
      chk('第13時 小テスト（2）', `${PT(kiteP)} return near(d(P, 'A', 'B'), d(P, 'A', 'D')) && near(ang(P, 'A', 'B', 'C'), ang(P, 'A', 'D', 'C')) && cong(P, 'ABC', 'ADC') && near(d(P, 'B', 'C'), d(P, 'D', 'C'));`),
      // チャレンジ：正三角形 ABD、ACE（外側）。AB＝AD、AC＝AE、∠BAE＝∠BAC＋60°＝∠DAC → △ABE≡△ADC → BE＝DC
      chk('第13時 小テスト チャレンジ', `${PT(eqP)} return near(d(P, 'A', 'B'), d(P, 'A', 'D')) && near(d(P, 'A', 'B'), d(P, 'B', 'D')) && near(d(P, 'A', 'C'), d(P, 'A', 'E')) && near(d(P, 'A', 'C'), d(P, 'C', 'E')) && near(ang(P, 'A', 'B', 'D'), 60) && near(ang(P, 'A', 'C', 'E'), 60) && near(ang(P, 'A', 'B', 'E'), ang(P, 'A', 'B', 'C') + 60) && near(ang(P, 'A', 'D', 'C'), ang(P, 'A', 'B', 'C') + 60) && near(ang(P, 'A', 'B', 'E'), ang(P, 'A', 'D', 'C')) && cong(P, 'ABE', 'ADC') && near(d(P, 'B', 'E'), d(P, 'D', 'C'));`)
    ],

    /* ================= 授業計画 ================= */
    plan: {
      type: '例（例題と練習）',
      aim: '三角形の合同を使って、線分や角が等しいことを、「△ABC と △DEF において」で書きはじめ、等しいものを根拠をつけて3つ示し、合同条件を書いて結論をみちびく形で、証明できる。',
      flow: [
        { g: '導入', m: 3, scene: 'ペア学習', do: '前時の重要語句（仮定・結論・根拠）を、ペアで1人1問ずつ出題し合う。', st: '意味を、自分の言葉で言う。', note: '静かに、時間を切って。緊張感をつくる。' },
        { g: '小テスト', m: 7, scene: '小テスト', do: '前時分の小テスト。自己採点と回収まで。', st: '静かに取り組む。', note: '5分＋答え合わせ・回収 2分。10点満点。チャレンジは別枠（正解で満点）。' },
        { g: '解説', m: 4, scene: '学習課題', do: 'めあてを書く。仮定と結論を図に印でたしかめ、どの三角形に目をつけるかを考える。板書しながら、1行ずつ根拠を言わせ、証明を写させる。', q: ['結論の AC、DB は、どの三角形の辺だろう。', '等しいものは、あと1つ。図の中にないかな。'], st: '△ABC と △DCB。AB＝DC、∠ABC＝∠DCB、BC は共通。', note: '書き方は、このあと何度も使う。根拠を声に出す。' },
        { g: '解説', m: 3, scene: 'ことば', do: '共通・合同条件・対応するを押さえる。空欄は、先生が言ってから書かせる。', q: ['2つの三角形が同じ辺をもつとき、何と書いたか。'], st: '空欄に書き込む。', note: '重要語句は、先生が言い切る。' },
        { g: '解説', m: 5, scene: '例題', do: '仮定と結論を整理し（空欄）、証明を書く。', q: ['3つ目の等しいものは、どこにある？'], st: 'AM＝BM、∠PMA＝∠PMB＝90°、PM は共通。', note: '語は、先生が言ってから書かせる。' },
        { g: '演習', m: 2, scene: '演習① 考えようの提示', do: '進め方を伝える。ゴールは、「考えよう」（ワークシート裏）を全員が説明できること。立ち歩きOK、解答は教卓（考えようの答えはない）。', st: '', note: '「できた人が教える」ではなく「説明できるようになる」と伝える。' },
        { g: '演習', m: 5, scene: '演習② 基礎', do: '基礎（個人）。穴埋めの証明。解いたら、教卓の解答で答え合わせ。', st: '基礎 →（終わった人から）考えようへ。', note: '解答は教卓。セルフチェック。' },
        { g: '演習', m: 14, scene: '演習③ 考えよう＋標準（学び合い）', do: 'ア〜ウを読み、立ち歩きで「その行の根拠は？」と聞き合う。標準は、自分で証明を書く。先生は回って気づきを拾う。', st: '読む → ○か×か → わけを言う → 直す → 大切なことをまとめる。', note: '判断：止まる→ヒント1／わけが言えない→ヒント2／まとまらない→ヒント3／残り5分→指名。' },
        { g: '演習', m: 2, scene: '演習④ 方向性', do: '答えは示さず、方向性だけを一言で伝える（下の枠）。', st: '', note: '' },
        { g: '振り返り', m: 5, scene: '振り返り・回収', do: '今日わかったことを、ペアで1つずつ言い合う。ワークシートと演習プリントを回収。', st: '今日わかったことを、口で言う。', note: '' }
      ],
      words: ['共通', '合同条件', '対応する'],
      think: {
        q: 'ア〜ウは、「AB＝AC、AD は ∠BAC の二等分線ならば、BD＝CD」の証明として、3人が書いたものである。正しいか、たりないところはないか、わけをつけて説明しよう。',
        views: [
          'ア：等しいものが2つしかなく、合同条件もない。',
          'イ：BD＝CD は、証明したい結論。根拠にはできない。',
          'ウ：AD は共通、2組の辺とその間の角、と書けていて、正しい。',
          'まとめ：3つ・合同条件・結論は根拠にしない。'
        ],
        hints: [
          '①②③ごとに、「なぜ等しいか」の根拠を言ってみる。',
          '合同条件に、等しいものが3つそろっているか確かめる。',
          '結論（BD＝CD）が、途中に出てきていないか見る。'
        ],
        direction: '「証明は、1行ずつ「なぜ？」と問いながら読むと、確かめられるよ。次の時間のまとめでも使ってみよう。」'
      },
      manabi: [
        { kind: '説明', text: '基礎のあと：（1）で「共通」と書いたわけを、隣の人に説明する。' },
        { kind: '比べる', text: '標準のあと：（2）の根拠（仮定・錯角など）を、友達と比べる。' },
        { kind: '教える', text: '最後：解けなかった問題を、できた人に聞く。問題と人の名前を書く。' }
      ],
      see: [
        ['思考・判断・表現', '目をつける三角形を決め、根拠をつけて証明を書いているか。ア〜ウのよしあしを説明しているか（考えよう）。'],
        ['知識・技能', '合同条件・共通・対応を使い、証明の形で書けるか。'],
        ['学び合い', '友達の証明を読み、「その行の根拠は？」と聞き合っているか。']
      ],
      tips: [
        ['何から書けばよいか、わからない', '書き出しは「△□□□ と △□□□ において」。結論の辺や角をふくむ三角形を、色でなぞる。'],
        ['合同条件を書かずに結論へ進む', '手順（3つ → 合同条件 → 合同 → 結論）を、指でたどりながら書く。'],
        ['図の見た目で、等しいと決める', '使ってよいのは、仮定と学んだ性質だけ。「見えるから」は根拠にならない。']
      ],
      prep: ['色ペン（仮定・結論・根拠に印をつける用）', '小テスト（前時分）／今日の小テストは、次時のはじめ用', '教卓：3点セットの解答（考えようの答えは載せない）']
    },

    /* ================= ワークシート（両面） ================= */
    ws: [
      // ---- 表 ----
      M('合同を使って、線分や角が等しいことを証明しよう'),
      C2([
        K('学習課題', '右の図の四角形 ABCD で、AB＝DC、\n∠ABC＝∠DCB ならば、AC＝DB である。\nこのことを、証明しよう。\n　仮定 … AB＝DC、∠ABC＝∠DCB\n　結論 … AC＝DB', 5),
        T('', '【目をつける三角形】', 1),
        B(1, '△ABC と △DCB')
      ], [
        F(7, FIG.trap())
      ], '2:1'),
      B(8, A_TASK),
      G(1),
      WD('2つの三角形が同じ辺（または角）をもつとき、その辺（角）は{{共通}}であるという。\n三角形の{{合同条件}}は、3組の辺、2組の辺とその間の角、\n1組の辺とその両端の角が、それぞれ等しいこと。\n合同な図形では、{{対応する}}辺や角は等しい。', 4),
      G(1),
      C2([
        K('例題', '右の図で、点 M は線分 AB の中点で、\nPM⊥AB である。PA＝PB を証明しよう。\n　仮定 … AM＝{{BM}}、PM⊥{{AB}}\n　結論 … {{PA}}＝PB', 4),
        T('', '【目をつける三角形】', 1),
        B(2, '△PAM と △PBM')
      ], [
        F(7, FIG.perp())
      ], '2:1'),
      B(8, A_EX),
      BR(),

      // ---- 裏：考えよう ----
      C2([
        K('考えよう', 'ア〜ウは、次のことがらの証明として、\n3人が書いたものである。\n△ABC で、AB＝AC、AD は ∠BAC の\n二等分線ならば、BD＝CD である。\n正しいものに ○、そうでないものに ×\nをつけ、わけを書こう。', 6)
      ], [
        F(6, FIG.iso())
      ], '3:1'),
      T('ア', '△ABD と △ACD において\nAB＝AC、∠BAD＝∠CAD だから、△ABD≡△ACD\n合同な図形の、対応する辺は等しいから　BD＝CD', 3),
      B(2, ''),
      T('イ', '△ABD と △ACD において\n仮定より　AB＝AC …①　　BD＝CD …②\nAD は共通 …③\n①、②、③より、3組の辺が、それぞれ等しいから　△ABD≡△ACD\n合同な図形の、対応する辺は等しいから　BD＝CD', 5),
      B(3, ''),
      T('ウ', '△ABD と △ACD において\n仮定より　AB＝AC …①　　∠BAD＝∠CAD …②\nAD は共通 …③\n①、②、③より、2組の辺とその間の角が、それぞれ等しいから　△ABD≡△ACD\n合同な図形の、対応する辺は等しいから　BD＝CD', 5),
      B(2, ''),
      T('①', 'ア〜ウを読んで、証明を書くとき、大切なことをまとめよう。', 1),
      B(3, ''),
      C2([
        T('発展', '演習まで解き終わった人は、考えてみよう！\n学習課題の図で、対角線 AC と DB の交点を O とする。△ABO≡△DCO であることを、証明できるだろうか。考えよう。', 4)
      ], [
        F(4, FIG.trapO())
      ], '3:1'),
      B(3, '')
    ],

    /* ================= 演習プリント（両面） ================= */
    dr: [
      HD('演習', '証明の進め方を使って、線分や角が等しいことを証明しよう。'),
      WD('① 「○○ならば、△△」の ○○ を{{仮定}}、△△ を{{結論}}という。\n② 2つの三角形が同じ辺（角）をもつとき、その辺（角）は{{共通}}であるという。\n③ 三角形の{{合同条件}}は 3つ。合同な図形では、{{対応する}}辺や角は等しい。', 3, { label: 'ことば確認' }),
      HD('基礎', '次の問いに答えよう。'),
      C2([
        T('（1）', '右の図の四角形 ABCD で、\nAB＝AD、CB＝CD ならば、\n∠BAC＝∠DAC である。\n空欄をうめて、証明を完成させよう。', 4)
      ], [
        F(5, FIG.kite('sss'))
      ], '2:1'),
      T('', '△ABC と △ADC において\n仮定より　AB＝AD …①　　CB＝{{CD}} …②\nAC は{{共通}} …③\n①、②、③より、{{3組の辺}}が、それぞれ等しいから　△ABC≡△ADC\n合同な図形の、対応する{{角}}は等しいから　∠BAC＝∠DAC', 5),
      B(2, A_D1),
      MA('【説明】（1）で「共通」と書いたわけを、図の AC を指しながら、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('標準', '次の問いに答えよう。'),
      C2([
        T('（2）', '右の図で、線分 AD と BC が\n点 O で交わっている。\nAB∥DC、AB＝DC ならば、\nAO＝DO である。証明しよう。', 4)
      ], [
        F(6, FIG.bow())
      ], '2:1'),
      B(8, A_D2),
      MA('【比べる】（2）の証明で、等しいものの根拠（仮定・錯角など）を、友達と比べよう。', 2),
      BR(),

      HD('応用', '共通な角や、ほかの図形の性質も使って、証明しよう。'),
      C2([
        T('（3）', '右の図で、AB＝AC、AD＝AE\nである。点 D、E は、それぞれ\n辺 AB、AC 上にある。\nBE＝CD であることを証明しよう。', 4)
      ], [
        F(6, FIG.over())
      ], '2:1'),
      B(7, A_D3),
      HD('入試レベル', '合同を使って、線分や角の大きさを求めよう。'),
      C2([
        T('（4）', '正方形 ABCD の辺 BC 上に点 E、\n辺 CD 上に点 F を、BE＝CF と\nなるようにとり、AE と BF の\n交点を G とする。\n① AE＝BF であることを証明しよう。\n② ∠AGB の大きさを求めよう。', 6)
      ], [
        F(7, FIG.sq())
      ], '2:1'),
      B(10, A_D4),
      MA('【教える】解けなかった問題を、できた人に聞こう。\n教えてもらった問題（　　　）　教えてくれた人（　　　　　　）', 2),
      T('メモ', '気づいたこと・先生に聞きたいこと', 1),
      B(1, '')
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '右の図の四角形 ABCD で、\nAB＝DC、∠ABC＝∠DCB ならば、\n∠BAC＝∠CDB である。\n空欄をうめて、証明を完成させよう。（4点）', 4)
      ], [
        F(5, FIG.trap())
      ], '2:1'),
      T('', '△ABC と △DCB において\n仮定より　AB＝{{DC}} …①　　∠ABC＝∠DCB …②　　BC は{{共通}} …③\n①、②、③より、{{2組の辺とその間の角}}が、それぞれ等しいから　△ABC≡△DCB\n合同な図形の、対応する{{角}}は等しいから　∠BAC＝∠CDB', 4),
      B(1, A_Q1),
      C2([
        T('（2）', '右の図の四角形 ABCD で、\nAB＝AD、∠BAC＝∠DAC ならば、\nBC＝DC である。\nこのことを証明しよう。（6点）', 4)
      ], [
        F(5, FIG.kite('sas'))
      ], '2:1'),
      B(5, A_Q2),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（3）', '△ABC の外側に、辺 AB、AC を\n1辺とする正三角形 ABD、ACE を\nつくる。このとき、BE＝DC である\nことを証明しよう。', 4)
      ], [
        F(6, FIG.eq())
      ], '2:1'),
      B(7, A_QC)
    ]
  };
  // 教卓の解答（B の答え）のすべてについて、文字のない式が、計算として正しいか確かめる
  DEF.checks.push(chk('第13時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith) && arith('180°−90°＝90°');`));
  IK.lesson('heikou-13', DEF);
})();
