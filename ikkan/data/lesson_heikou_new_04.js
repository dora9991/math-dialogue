/* 平行と合同（新しい形） 第4時：三角形の内角・外角の性質を使って、角の大きさを求めよう。 元：data/lesson_heikou_04.js を、新しい形に組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（図1・図2で ∠ACD を求め、∠A・∠B とくらべて、気づいたことを書く。図・数は全部印刷）。個人3分 → ペア3分 → ことば → 例題（D で分けた図。空欄あり）。
     元の学習課題は図が1つだったので、「どんな三角形でも？」と考えられるよう、鋭角三角形（図1）と鈍角三角形（図2）の2つにした。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる 1問（元の考えよう：内角の鋭・直・鈍の10通り。答えは載せない）・チャレンジ★★ 1問（元の入試（7）。ヒントカードつき）。
     元の「発展」（外角が鋭角になるとき）・授業計画は使わない。元の基礎（1）の三角形の分類は（2）に、標準（3）（4）は（3）（4）に。応用（5）は、外角から内角を出す問題（新しく作った）にかえ、元の応用（5）（比の分類）は（6）に短くして使う。
     元の応用（6）（外角 120°・∠A＝2∠B）は、（4）と同じ型なので使わない。
   ・図：GEO（js/geo.js）。角の大きさは、座標から角を測り直して、図の字・答えと合うことを checks で確かめた。式の答えは、別の式（全部の整数の場合をしらべあげる など）でも出し直した。
   検算：node tools/verify.cjs heikou_new-04　／　見た目：node tools/check.cjs <出力先> heikou_new-04 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具 ---------------- */
  const D2R = Math.PI / 180;
  const pol = (r, deg) => [r * Math.cos(deg * D2R), r * Math.sin(deg * D2R)];
  // 三角形：B＝(0,0)、C＝(a,0)、∠B＝b°、∠C＝c° のときの A
  const triA = (a, b, c) => pol(a * Math.sin(c * D2R) / Math.sin((b + c) * D2R), b);
  // 辺 BC 上の点 D（∠BAD＝t°）：△ABD で、BD＝AB×sin t÷sin(180°−b−t)
  const onBC = (A, b, t) => [Math.hypot(A[0], A[1]) * Math.sin(t * D2R) / Math.sin((b + t) * D2R), 0];
  // 点 p から向き d1（度）の半直線と、点 q から向き d2 の半直線の交点
  const isect = (p, d1, q, d2) => {
    const u = pol(1, d1), v = pol(1, d2), den = u[0] * (-v[1]) - u[1] * (-v[0]);
    const s = ((q[0] - p[0]) * (-v[1]) - (q[1] - p[1]) * (-v[0])) / den;
    return [p[0] + s * u[0], p[1] + s * u[1]];
  };
  // 図の見出し（図1・図2 …）を、図の枠の左上のすみに書く（GEO の図に、字を足す）
  const GEOC = (o, t) => { const blk = GEO(o), g = blk.svg; blk.svg = (W, H, h) => g(W, H, h) + h.tx(1.2, 4.4, t, 3.6, 'start'); return blk; };

  /* ---------------- 検算の道具（checks の式の中に、そのまま埋めこむ） ----------------
     ag(P, a, b, c)：座標 P から、∠abc（b が頂点）の大きさ（度）を出す
     geoOK(o)：GEO の図 o の、数字の角の字（65° など）が座標と合っているか、字のない同じ本数の弧が等しい角か
     arith(t)：答えの文の中の、数だけの「…＝…＝…」（180°−55°−40°＝85° など）が、計算として正しいか */
  const ag = (P, a, b, c) => { const u = [P[a][0] - P[b][0], P[a][1] - P[b][1]], v = [P[c][0] - P[b][0], P[c][1] - P[b][1]]; return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], u[0] * v[0] + u[1] * v[1])) * 180 / Math.PI; };
  const geoOK = o => {
    const P = o.pts, num = t => { const m = /^\{*(\d+(?:\.\d+)?)°\}*$/.exec(String(t == null ? '' : t)); return m ? +m[1] : null; };
    const val = a => { const d = ag(P, a.a, a.at, a.b); return a.reflex ? 360 - d : d; };
    let ok = true;
    [o].concat(o.a ? [o.a] : []).forEach(s => {
      (s.ang || []).forEach(a => { const n = num(a.t); if (a.right) { if (Math.abs(val(a) - 90) > 1e-6) ok = false; } else if (n != null && Math.abs(val(a) - n) > 1e-6) ok = false; });
      const g = {}; (s.ang || []).filter(a => !a.t && !a.right).forEach(a => { (g[a.n || 1] = g[a.n || 1] || []).push(val(a)); });
      Object.values(g).forEach(L => { if (L.some(v => Math.abs(v - L[0]) > 1e-6)) ok = false; });
    });
    return ok;
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
  const LIB = 'const ag = ' + ag + '; const geoOK = ' + geoOK + '; const arith = ' + arith + ';';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const ANS = bs => { const o = []; const w = a => a.forEach(b => { if (b.type === 'board' && b.answer) o.push(b.answer); if (b.type === 'cols') b.cols.forEach(c => w(c.blocks)); }); w(bs); return o; };

  /* ---------------- 図のデータ（図・字・答えは、ここから作る） ---------------- */
  const VL3 = { A: ['A', 90], B: ['B', 225], C: ['C', 315] };
  const VLD = Object.assign({}, VL3, { C: ['C', 270], D: ['D', 315] });
  // 今日の問い 図1：∠A＝55°、∠B＝40°（∠C＝85°）。辺 BC を C の方へのばした先に D。∠x＝∠ACD＝95°
  const F_T1 = (() => { const b = 40, c = 85, A = triA(6, b, c); return { pts: { A, B: [0, 0], C: [6, 0], D: [8.6, 0] }, poly: 'ABC', segs: [['C', 'D']], vl: VLD, pad: 5, ang: [{ at: 'A', a: 'B', b: 'C', t: '55°', r: 6, lr: 13 }, { at: 'B', a: 'C', b: 'A', t: '40°', r: 7, lr: 14 }, { at: 'C', a: 'A', b: 'D', t: 'x', r: 6 }], a: { ang: [{ at: 'C', a: 'B', b: 'A', t: '85°', r: 6, lr: 11 }] } }; })();
  // 今日の問い 図2：∠A＝95°、∠B＝45°（∠C＝40°）。∠x＝∠ACD＝140°
  const F_T2 = (() => { const b = 45, c = 40, A = triA(6, b, c); return { pts: { A, B: [0, 0], C: [6, 0], D: [8.6, 0] }, poly: 'ABC', segs: [['C', 'D']], vl: VLD, pad: 5, ang: [{ at: 'A', a: 'B', b: 'C', t: '95°', r: 6, lr: 11 }, { at: 'B', a: 'C', b: 'A', t: '45°', r: 7, lr: 12 }, { at: 'C', a: 'A', b: 'D', t: 'x', r: 6 }], a: { ang: [{ at: 'C', a: 'B', b: 'A', t: '40°', r: 6, lr: 12 }] } }; })();
  // 例題：∠B＝40°、∠BAD＝30°、∠DAC＝35°（∠C＝75°）。∠x＝∠ADC（△ABD の外角）、∠y＝∠C
  const F_E1 = (() => { const b = 40, c = 75, A = triA(6.4, b, c), D = onBC(A, b, 30); return { pts: { A, B: [0, 0], C: [6.4, 0], D }, poly: 'ABC', segs: [['A', 'D']], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270] }, ang: [{ at: 'B', a: 'C', b: 'A', t: '{{40°}}', r: 6, lr: 14 }, { at: 'A', a: 'B', b: 'D', t: '{{30°}}', r: 6, lr: 16 }, { at: 'A', a: 'D', b: 'C', t: '{{35°}}', r: 6, lr: 16 }, { at: 'D', a: 'A', b: 'C', t: 'x', r: 5 }, { at: 'C', a: 'A', b: 'D', t: 'y', r: 6, lr: 9 }] }; })();
  // 演習（1）図1：∠A＝45°、∠B＝70°、∠C の外角 x＝115°　図2：∠B＝50°、∠C の外角＝125°、∠A＝x＝75°
  const F_D1 = (() => { const A = triA(6, 70, 65); return { pts: { A, B: [0, 0], C: [6, 0], D: [8.6, 0] }, poly: 'ABC', segs: [['C', 'D']], vl: VLD, pad: 4, ang: [{ at: 'A', a: 'B', b: 'C', t: '45°', r: 6, lr: 11 }, { at: 'B', a: 'C', b: 'A', t: '70°', r: 7, lr: 12 }, { at: 'C', a: 'A', b: 'D', t: 'x', r: 6 }] }; })();
  const F_D2 = (() => { const A = triA(6, 50, 55); return { pts: { A, B: [0, 0], C: [6, 0], D: [8.6, 0] }, poly: 'ABC', segs: [['C', 'D']], vl: VLD, pad: 4, ang: [{ at: 'A', a: 'B', b: 'C', t: 'x', r: 6, lr: 9 }, { at: 'B', a: 'C', b: 'A', t: '50°', r: 7, lr: 12 }, { at: 'C', a: 'A', b: 'D', t: '125°', r: 6, lr: 9.5 }] }; })();
  // 演習（3）図3：∠B＝50°、∠C＝60°、∠BAD＝25°。∠x＝∠ADC＝75°、∠y＝∠DAC＝45°
  const F_D3 = (() => { const b = 50, c = 60, A = triA(6, b, c), D = onBC(A, b, 25); return { pts: { A, B: [0, 0], C: [6, 0], D }, poly: 'ABC', segs: [['A', 'D']], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270] }, pad: 4, ang: [{ at: 'B', a: 'C', b: 'A', t: '50°', r: 6, lr: 12 }, { at: 'C', a: 'B', b: 'A', t: '60°', r: 6, lr: 10 }, { at: 'A', a: 'B', b: 'D', t: '25°', r: 6, lr: 15 }, { at: 'D', a: 'A', b: 'C', t: 'x', r: 5 }, { at: 'A', a: 'D', b: 'C', t: 'y', r: 6, lr: 11 }] }; })();
  // チャレンジ（8）：∠A＝70°（∠B＝50°、∠C＝60° でかいたが、答えは ∠B・∠C によらない）。P は ∠B の二等分線と、∠ACD の二等分線の交点。∠x＝∠BPC＝35°
  const F_D4 = (() => { const b = 50, c = 60, A = triA(6, b, c), P = isect([0, 0], b / 2, [6, 0], (180 - c) / 2); return { pts: { A, B: [0, 0], C: [6, 0], D: [9.6, 0], P }, poly: 'ABC', segs: [['C', 'D'], ['B', 'P'], ['C', 'P']], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 270], D: ['D', 315], P: ['P', 45] }, ang: [{ at: 'A', a: 'B', b: 'C', t: '70°', r: 6, lr: 9.5 }, { at: 'B', a: 'A', b: 'P', n: 1, r: 8 }, { at: 'B', a: 'P', b: 'C', n: 1, r: 8 }, { at: 'C', a: 'A', b: 'P', n: 2, r: 5 }, { at: 'C', a: 'P', b: 'D', n: 2, r: 5 }, { at: 'P', a: 'B', b: 'C', t: 'x', r: 6, lr: 11 }] }; })();
  // 小テスト（2）図1：∠A＝60°、∠B＝35°、∠C の外角 x＝95°　（3）図2：∠B＝55°、∠C の外角＝130°、∠A＝x＝75°
  const F_Q1 = (() => { const A = triA(6, 35, 85); return { pts: { A, B: [0, 0], C: [6, 0], D: [8.6, 0] }, poly: 'ABC', segs: [['C', 'D']], vl: VLD, pad: 4, ang: [{ at: 'A', a: 'B', b: 'C', t: '60°', r: 6, lr: 11 }, { at: 'B', a: 'C', b: 'A', t: '35°', r: 7, lr: 13 }, { at: 'C', a: 'A', b: 'D', t: 'x', r: 6 }] }; })();
  const F_Q2 = (() => { const A = triA(6, 55, 50); return { pts: { A, B: [0, 0], C: [6, 0], D: [8.6, 0] }, poly: 'ABC', segs: [['C', 'D']], vl: VLD, pad: 4, ang: [{ at: 'A', a: 'B', b: 'C', t: 'x', r: 6, lr: 9 }, { at: 'B', a: 'C', b: 'A', t: '55°', r: 7, lr: 11 }, { at: 'C', a: 'A', b: 'D', t: '130°', r: 6, lr: 9.5 }] }; })();
  // （4）図3：∠B＝35°、∠BAD＝40°、∠C＝50°。∠ADC＝75°、∠x＝∠DAC＝55°
  const F_Q3 = (() => { const b = 35, c = 50, A = triA(6, b, c), D = onBC(A, b, 40); return { pts: { A, B: [0, 0], C: [6, 0], D }, poly: 'ABC', segs: [['A', 'D']], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], D: ['D', 270] }, pad: 4, ang: [{ at: 'B', a: 'C', b: 'A', t: '35°', r: 7, lr: 13 }, { at: 'C', a: 'B', b: 'A', t: '50°', r: 6, lr: 10 }, { at: 'A', a: 'B', b: 'D', t: '40°', r: 6, lr: 13 }, { at: 'A', a: 'D', b: 'C', t: 'x', r: 6, lr: 10 }] }; })();
  // チャレンジ：∠A＝64°（∠B＝56°、∠C＝60°）。I は ∠B・∠C の二等分線の交点。∠x＝∠BIC＝122°
  const F_QC = (() => { const b = 56, c = 60, A = triA(6, b, c), I = isect([0, 0], b / 2, [6, 0], 180 - c / 2); return { pts: { A, B: [0, 0], C: [6, 0], I }, poly: 'ABC', segs: [['B', 'I'], ['C', 'I']], vl: { A: ['A', 90], B: ['B', 225], C: ['C', 315], I: ['I', 90, 3.8] }, ang: [{ at: 'A', a: 'B', b: 'C', t: '64°', r: 6, lr: 13 }, { at: 'B', a: 'A', b: 'I', n: 1, r: 8 }, { at: 'B', a: 'I', b: 'C', n: 1, r: 8 }, { at: 'C', a: 'B', b: 'I', n: 2, r: 8 }, { at: 'C', a: 'I', b: 'A', n: 2, r: 8 }, { at: 'I', a: 'B', b: 'C', t: 'x', r: 5, lr: 9 }] }; })();

  // 考えよう（ひろげる（7））：鋭・直・鈍の10通り
  const COMBOS = [['鋭', '鋭', '鋭'], ['鋭', '鋭', '直'], ['鋭', '鋭', '鈍'], ['鋭', '直', '直'], ['鋭', '直', '鈍'], ['鋭', '鈍', '鈍'], ['直', '直', '直'], ['直', '直', '鈍'], ['直', '鈍', '鈍'], ['鈍', '鈍', '鈍']];
  const row5 = list => list.map(c => c.join('・'));

  // 手で書いた答え（画面にも checks にも、同じ文字列を使う）
  const T_W1 = '（例）図1　∠ACB＝180°−55°−40°＝85°、∠x＝180°−85°＝95°\n　　図2　∠ACB＝180°−95°−45°＝40°、∠x＝180°−40°＝140°\n気づいたこと　∠x＝∠A+∠B';
  const T_E1 = '∠x は △ABD の外角だから\n∠x＝∠B+∠BAD＝40°+30°＝70°\n△ADC の内角の和は 180° だから\n∠y＝180°−70°−35°＝75°\n確かめ　△ABC の内角の和\n　40°+(30°+35°)+75°＝180°';
  const T_D1 = '① ∠x＝45°+70°＝115°\n② 125°＝∠x+50° より\n　∠x＝125°−50°＝75°';
  const T_D2 = 'ア 180°−40°−70°＝70°　鋭角三角形\nイ 180°−20°−70°＝90°　直角三角形\nウ 180°−35°−45°＝100°　鈍角三角形';
  const T_D3 = '∠x は △ABD の外角だから\n　∠x＝50°+25°＝75°\n△ADC の内角の和から\n　∠y＝180°−75°−60°＝45°';
  const T_D4 = '∠B＝x° とすると\n∠A＝2x°、∠C＝(x+20)°\n2x+x+(x+20)＝180　x＝40\n∠A＝80°、∠C＝60°';
  const T_D5 = '∠A＝180°−125°＝55°\n∠B＝180°−115°＝65°\n∠C＝180°−55°−65°＝60°';
  const T_D6 = '① 30°、60°、90°　直角三角形\n② 30°、30°、120°　鈍角三角形';
  const T_D7 = '●＝∠ABP＝∠PBC、○＝∠ACP＝∠PCD\n∠ACD は △ABC の外角だから\n　2○＝70°+2●　…①\n∠PCD は △PBC の外角だから\n　○＝●+∠x　…②\n①より　○＝35°+●\n②に入れて　35°+●＝●+∠x\nよって　∠x＝35°';
  const T_Q1 = 'ア 180°−50°−50°＝80°　鋭角三角形\nイ 180°−35°−55°＝90°　直角三角形\nウ 180°−20°−40°＝120°　鈍角三角形';
  const T_Q2 = '∠x＝60°+35°＝95°';
  const T_Q3 = '130°＝55°+∠x より\n∠x＝130°−55°＝75°';
  const T_Q4 = '∠ADC は △ABD の外角だから\n　∠ADC＝35°+40°＝75°\n△ADC の内角の和から\n　∠x＝180°−75°−50°＝55°';
  const T_QC = '∠IBC＝●、∠ICB＝○ とすると\n●+●+○+○＝180°−64°＝116°\nよって　●+○＝58°\n△IBC の内角の和から\n　∠x＝180°−58°＝122°';

  const DEF = {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第4時', title: '三角形の内角・外角の性質を使って、角の大きさを求めよう',
    summary: '三角形の外角が、となりあわない2つの内角の和に等しいことをつかみ、内角の和と合わせて角の大きさを求める。鋭角・直角・鈍角三角形に分ける。ひろげるは、三角形の3つの内角の組み合わせ。',
    head: '平行と合同　第4時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：図1（∠A＝55°、∠B＝40°）と図2（∠A＝95°、∠B＝45°）。∠ACB と ∠ACD を、座標から測る。∠ACD＝∠A+∠B（95°・140°）、∠ACB+∠ACD＝180°
      chk('第4時 今日の問い', `const a = ${J(F_T1)}, b = ${J(F_T2)}; const ok = (o, A, B0, C0, X) => geoOK(o) && near(ag(o.pts, 'B', 'A', 'C'), A) && near(ag(o.pts, 'A', 'B', 'C'), B0) && near(ag(o.pts, 'A', 'C', 'B'), C0) && near(ag(o.pts, 'A', 'C', 'D'), X) && near(ag(o.pts, 'A', 'C', 'D'), A + B0) && near(ag(o.pts, 'A', 'C', 'B') + ag(o.pts, 'A', 'C', 'D'), 180) && near(ag(o.pts, 'B', 'C', 'D'), 180); return ok(a, 55, 40, 85, 95) && ok(b, 95, 45, 40, 140) && a.a.ang[0].t === '85°' && b.a.ang[0].t === '40°' && arith(${J(T_W1)});`),
      // 例題：∠x＝∠ADC＝70°（△ABD の外角）、∠y＝∠C＝75°
      chk('第4時 例題', `const o = ${J(F_E1)}, P = o.pts; return geoOK(o) && near(ag(P, 'A', 'D', 'C'), 70) && near(ag(P, 'A', 'D', 'C'), ag(P, 'A', 'B', 'D') + ag(P, 'B', 'A', 'D')) && near(ag(P, 'A', 'C', 'B'), 75) && near(ag(P, 'A', 'C', 'B'), 180 - 70 - 35) && near(ag(P, 'D', 'A', 'C'), 35) && near(ag(P, 'B', 'A', 'D') + ag(P, 'D', 'A', 'C') + ag(P, 'A', 'B', 'C') + ag(P, 'A', 'C', 'B'), 180) && arith(${J(T_E1)});`),
      // ひろげる（7）（答えは載せない。ここで確かめるだけ）：10通りのうち、三角形になるのは 鋭鋭鋭・鋭鋭直・鋭鋭鈍 の3つだけ。内角を 1°きざみで、全部しらべる
      chk('第4時 ひろげる（7）', `const C = ${J(COMBOS)}, kd = x => x < 90 ? '鋭' : near(x, 90) ? '直' : '鈍'; const can = c => { for (let a = 1; a < 180; a++) for (let b = 1; a + b < 180; b++) { const t = 180 - a - b, k = [a, b, t].map(kd).sort().join(''); if (k === c.slice().sort().join('')) return true; } return false; }; const ok = C.filter(can).map(c => c.join('')); return C.length === 10 && new Set(C.map(c => c.join(''))).size === 10 && ok.join(',') === '鋭鋭鋭,鋭鋭直,鋭鋭鈍' && C.every(c => c.join('') === c.slice().sort((p, q) => '鋭直鈍'.indexOf(p) - '鋭直鈍'.indexOf(q)).join('')) && near(90 + 90, 180) && 90 + 90 + 1 > 180;`),
      // 演習（1）図1・図2：∠x＝115°、75°。座標から
      chk('第4時 演習（1）', `const a = ${J(F_D1)}, b = ${J(F_D2)}; return geoOK(a) && geoOK(b) && near(ag(a.pts, 'A', 'C', 'D'), 115) && near(ag(a.pts, 'A', 'C', 'D'), ag(a.pts, 'B', 'A', 'C') + ag(a.pts, 'A', 'B', 'C')) && near(ag(b.pts, 'B', 'A', 'C'), 75) && near(ag(b.pts, 'A', 'C', 'D'), 125) && near(ag(b.pts, 'A', 'C', 'D'), ag(b.pts, 'B', 'A', 'C') + ag(b.pts, 'A', 'B', 'C')) && arith(${J(T_D1)});`),
      // 演習（2）残りの角で分類（ア 70°鋭、イ 90°直、ウ 100°鈍）
      chk('第4時 演習（2）', `const kd = x => x < 90 ? '鋭' : near(x, 90) ? '直' : '鈍'; const r = [[40, 70], [20, 70], [35, 45]].map(([a, b]) => { const c = 180 - a - b; return [c, [a, b, c].some(x => kd(x) === '鈍') ? '鈍' : [a, b, c].some(x => kd(x) === '直') ? '直' : '鋭']; }); return r.map(x => x[0]).join(',') === '70,90,100' && r.map(x => x[1]).join('') === '鋭直鈍' && arith(${J(T_D2)});`),
      // 演習（3）図3：∠x＝75°、∠y＝45°
      chk('第4時 演習（3）', `const o = ${J(F_D3)}, P = o.pts; return geoOK(o) && near(ag(P, 'A', 'D', 'C'), 75) && near(ag(P, 'D', 'A', 'C'), 45) && near(ag(P, 'A', 'D', 'C'), 50 + 25) && near(ag(P, 'A', 'D', 'B'), 105) && near(ag(P, 'D', 'A', 'C') + ag(P, 'A', 'D', 'C') + ag(P, 'A', 'C', 'D'), 180) && arith(${J(T_D3)});`),
      // 演習（4）∠A＝2∠B、∠C＝∠B+20°：∠B を 1°きざみで全部しらべる → 40° だけ。∠A＝80°、∠C＝60°
      chk('第4時 演習（4）', `const s = []; for (let b = 1; b < 180; b++) { const a = 2 * b, c = b + 20; if (near(a + b + c, 180)) s.push(b); } return s.join() === '40' && near(2 * 40, 80) && near(40 + 20, 60) && arith(${J(T_D4)});`),
      // 演習（5）頂点 A の外角 125°、頂点 B の外角 115°：内角 55°、65°、のこり 60°。この三角形（∠A＝55°、∠B＝65°）を座標でかいて、外角を測り直す
      chk('第4時 演習（5）', `const R = Math.PI / 180, Bp = [0, 0], Cp = [6, 0], A = [6 * Math.sin(60 * R) / Math.sin(125 * R) * Math.cos(65 * R), 6 * Math.sin(60 * R) / Math.sin(125 * R) * Math.sin(65 * R)], P = { A, B: Bp, C: Cp, A2: [A[0] + (A[0] - Cp[0]), A[1] + (A[1] - Cp[1])], B2: [Bp[0] + (Bp[0] - Cp[0]), Bp[1] + (Bp[1] - Cp[1])] }; return near(ag(P, 'B', 'A', 'C'), 55) && near(ag(P, 'A', 'B', 'C'), 65) && near(ag(P, 'A', 'C', 'B'), 60) && near(ag(P, 'B', 'A', 'A2'), 125) && near(ag(P, 'A', 'B', 'B2'), 115) && near(180 - 125, 55) && near(180 - 115, 65) && near(180 - 55 - 65, 60) && arith(${J(T_D5)});`),
      // 演習（6）比 1:2:3、1:1:4
      chk('第4時 演習（6）', `const kd = x => x < 90 ? '鋭' : near(x, 90) ? '直' : '鈍'; const r = [[1, 2, 3], [1, 1, 4]].map(q => { const s = q[0] + q[1] + q[2], a = q.map(v => 180 * v / s); return a.join('、') + ':' + (a.some(v => kd(v) === '鈍') ? '鈍' : a.some(v => kd(v) === '直') ? '直' : '鋭'); }); return r.join(' ') === '30、60、90:直 30、30、120:鈍' && arith(${J(T_D6)});`),
      // チャレンジ（8）∠BPC＝∠A÷2。図（∠B＝50°、∠C＝60°）だけでなく、いろいろな ∠B・∠C で、座標から確かめる
      chk('第4時 チャレンジ（8）', `const o = ${J(F_D4)}, P = o.pts; const gen = (b, c) => { const R = Math.PI / 180, pl = (r, d) => [r * Math.cos(d * R), r * Math.sin(d * R)], u = pl(1, b / 2), v = pl(1, (180 - c) / 2), det = u[0] * (-v[1]) - u[1] * (-v[0]), s = (6 * (-v[1])) / det; return { A: pl(6 * Math.sin(c * R) / Math.sin((b + c) * R), b), B: [0, 0], C: [6, 0], P: [s * u[0], s * u[1]] }; }; let okAll = true; for (const [b, c] of [[50, 60], [40, 70], [66, 44], [30, 80], [58, 52]]) { const Q = gen(b, c); if (Math.abs(ag(Q, 'B', 'P', 'C') - (180 - b - c) / 2) > 1e-6) okAll = false; } return geoOK(o) && near(ag(P, 'B', 'A', 'C'), 70) && near(ag(P, 'B', 'P', 'C'), 35) && okAll && near(70 / 2, 35) && arith(${J(T_D7)});`),
      // 小テスト（1）〜（4）チャレンジ
      chk('第4時 小テスト（1）', `const kd = x => x < 90 ? '鋭' : near(x, 90) ? '直' : '鈍'; const r = [[50, 50], [35, 55], [20, 40]].map(([a, b]) => { const c = 180 - a - b; return c + [a, b, c].map(kd).sort().join(''); }); return r.join(',') === '80鋭鋭鋭,90直鋭鋭,120鈍鋭鋭' && arith(${J(T_Q1)});`),
      chk('第4時 小テスト（2）（3）', `const a = ${J(F_Q1)}, b = ${J(F_Q2)}; return geoOK(a) && geoOK(b) && near(ag(a.pts, 'A', 'C', 'D'), 95) && near(ag(a.pts, 'B', 'A', 'C') + ag(a.pts, 'A', 'B', 'C'), 95) && near(ag(b.pts, 'B', 'A', 'C'), 75) && near(ag(b.pts, 'A', 'C', 'D'), 130) && near(130 - 55, 75) && arith(${J(T_Q2)}) && arith(${J(T_Q3)});`),
      chk('第4時 小テスト（4）', `const o = ${J(F_Q3)}, P = o.pts; return geoOK(o) && near(ag(P, 'A', 'D', 'C'), 75) && near(ag(P, 'D', 'A', 'C'), 55) && near(180 - 75 - 50, 55) && arith(${J(T_Q4)});`),
      chk('第4時 小テスト チャレンジ', `const o = ${J(F_QC)}, P = o.pts; return geoOK(o) && near(ag(P, 'B', 'A', 'C'), 64) && near(ag(P, 'B', 'I', 'C'), 122) && near(ag(P, 'A', 'B', 'I'), ag(P, 'I', 'B', 'C')) && near(ag(P, 'A', 'C', 'I'), ag(P, 'I', 'C', 'B')) && near(180 - (180 - 64) / 2, 122) && arith(${J(T_QC)});`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形の内角・外角の性質を使って、角の大きさを求めよう'),
      K('今日の問い', '図1、図2で、辺 BC を C の方へのばした先を D とする。∠x（∠ACD）を求めて、∠A・∠B とくらべ、気づいたことを書こう。', 2),
      F(6, GEOC(F_T1, '図1'), GEOC(F_T2, '図2')),
      T('①', '自分の考え（3分）　求め方と、気づいたことを書こう。', 1),
      B(3, T_W1),
      T('②', 'ペアの考え（3分）　自分とちがう求め方や気づきを書こう。', 1),
      B(3, ''),
      G(1),
      WD('三角形の内側の角を{{内角}}という。\n三角形の1つの辺をのばしたとき、のばした辺と、となりの辺がつくる角を{{外角}}という。\n外角は、となりあわない2つの{{内角}}の{{和}}に等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '右の図で、点 D は辺 BC 上にある。∠B＝{{40}}°、∠BAD＝{{30}}°、∠DAC＝{{35}}° のとき、∠x、∠y の大きさを求めよう。', 2),
      C2([
        T('', '【求め方】使う性質を書きながら求めよう。', 1),
        B(6, T_E1)
      ], [
        F(7, GEO(F_E1))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① のばした辺と、となりの辺がつくる角を、三角形の{{外角}}という。\n② 三角形の外角は、となりあわない2つの{{内角}}の{{和}}に等しい。\n③ 内角がすべて鋭角なら{{鋭角三角形}}、1つが鈍角なら{{鈍角三角形}}という。', 3, { label: 'ことば' }),
      F(5, GEOC(F_D1, '図1'), GEOC(F_D2, '図2'), GEOC(F_D3, '図3')),
      C2([
        T('（1）', '図1、図2で、∠x の大きさを求めよう。', 2),
        B(3, T_D1)
      ], [
        T('（2）', '2つの内角が次の三角形は、何三角形だろう。\nア 40°、70°　イ 20°、70°\nウ 35°、45°', 4),
        B(3, T_D2)
      ], '1:1'),
      MA('【説明】外角の性質を、図をかいて、隣の人に30秒で説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '性質を使って、角の大きさを求めよう。'),
      C2([
        T('（3）', '図3で、点 D は辺 BC 上にある。∠x、∠y を求めよう。', 2),
        B(5, T_D3)
      ], [
        T('（4）', '△ABC で、∠A は ∠B の 2倍、∠C は ∠B より 20° 大きい。∠A、∠C は？', 2),
        B(5, T_D4)
      ], '1:1'),
      C2([
        T('（5）', '△ABC で、頂点 A の外角が 125°、頂点 B の外角が 115° である。∠C を求めよう。', 3),
        B(3, T_D5)
      ], [
        T('（6）', '3つの内角の比が、次の三角形は、何三角形だろう。\n① 1：2：3　② 1：1：4', 3),
        B(2, T_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：三角形の3つの内角の組み合わせを、調べよう。'),
      T('（7）', '三角形の3つの内角は、鋭角・直角・鈍角の、どんな組み合わせになれるだろう。ア〜コに、あり得るなら ○、あり得ないなら × を書こう。（鋭＝鋭角など）', 2),
      TB('', ['ア', 'イ', 'ウ', 'エ', 'オ'], [['3つの内角', row5(COMBOS.slice(0, 5))], ['あり得る？', ['', '', '', '', '']]], { hw: 24 }),
      G(1),
      TB('', ['カ', 'キ', 'ク', 'ケ', 'コ'], [['3つの内角', row5(COMBOS.slice(5))], ['あり得る？', ['', '', '', '', '']]], { hw: 24 }),
      T('', '×になったものは、どうして、あり得ないのだろう。わけを書いて、わかったことをまとめよう。', 2),
      B(6, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、点 P は、∠B の二等分線と、∠C の外角 ∠ACD の二等分線の交点である。∠A＝70° のとき、∠BPC（図の ∠x）の大きさを求めよう。', 5),
        B(8, T_D7)
      ], [
        F(6, GEO(F_D4)),
        MA('①∠ABP＝∠PBC＝●、∠ACP＝∠PCD＝○ とおくと、外角 ∠ACD は、●と○で、どう表せるかな。\n② △PBC の外角 ∠PCD に目をつけると、∠x は？', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 片面・5分） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '2つの内角が次のとき、鋭角・直角・鈍角三角形のどれだろう。（3点）\nア 50°、50°　　イ 35°、55°　　ウ 20°、40°', 2),
      B(3, T_Q1),
      F(4, GEOC(F_Q1, '図1'), GEOC(F_Q2, '図2'), GEOC(F_Q3, '図3')),
      T('（2）', '図1で、∠x の大きさを求めよう。（2点）', 1),
      B(1, T_Q2),
      T('（3）', '図2で、∠x の大きさを求めよう。（2点）', 1),
      B(2, T_Q3),
      T('（4）', '図3で、点 D は辺 BC 上にある。∠x の大きさを求めよう。（3点）', 1),
      B(4, T_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図の △ABC で、点 I は、∠B の二等分線と ∠C の二等分線の交点である。∠A＝64° のとき、∠BIC（図の ∠x）の大きさを求めよう。', 4),
        B(5, T_QC)
      ], [
        F(9, GEO(F_QC))
      ], '3:2')
    ]
  };
  DEF.checks.push(chk('第4時 答えの文の計算', `const T = ${J(ANS(DEF.ws).concat(ANS(DEF.dr), ANS(DEF.qz)))}; return T.length > 10 && T.every(arith);`));
  IK.lesson('heikou_new-04', DEF);
})();
