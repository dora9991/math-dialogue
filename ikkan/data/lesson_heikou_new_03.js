/* 平行と合同（新しい形） 第3時：三角形の内角の和が180°になるわけを説明しよう。 元：data/lesson_heikou_03.js（前の形）。題・めあて・数値・図の関数・checks を引きつぎ、次のように組みかえた。
   ・ワークシートは A4 1枚（約12分）：問いは1つ（△ABC に線を1本かき加えて、内角の和が 180° になるわけを、平行線の性質で説明する。図・数は全部印刷。答えの図に、A を通り BC に平行な直線 DE を赤い点線で出す）。
     個人3分 → ペア3分 → ことば（内角・外角・180°・補助線）→ 例題（外角が、となり合わない2つの内角の和に等しいわけ。空欄あり）。
   ・演習プリントは表裏：表＝確かめる 2問（図1〜3）・使ってみる 4問（図4つき）／裏＝ひろげる 1問（元の考えよう：ちがう線をひいても説明できるか。ア〜ウ。答えは載せない）・チャレンジ★★ 1問（元の入試（7）∠BIC。ヒントカードつき）。
     元の基礎（1）（2）は、図を減らして、（1）図1・図2、（2）図3にした。元の標準（3）（4）・応用（5）（6）は、そのまま（3）〜（6）。元の入試（8）・発展・授業計画は使わない。
   ・考えよう（演習プリント（7））の答えは、どこにも書かない。ことば欄にも、「どの線でも、角を1か所に集めている」ことは書かない。
   ・図は、角度から座標を計算してかいた（GEO）。三角形の角・外角・平行・角の二等分線は、座標から測り直して、答え・図の字と合うことを checks で確かめた。
   検算：node tools/verify.cjs heikou_new-03　／　見た目：node tools/check.cjs <出力先> heikou_new-03 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具（座標は、角度から計算する。checks でも同じものを使って、座標から角を計算し直す） ----------------
     rad・pp(p, r, d)：点 p から、向き d（度）に r だけ進んだ点　aD(v, p, q)：∠pvq の大きさ（度）
     TRI({ B, C, w, ext, par, line, ax, t, n, bis, cap, … })：B＝(0, 0)、C＝(w, 0) の △ABC。B・C は ∠B・∠C（度）。A は、角から計算する。
        ext＝BC を C の先へのばす長さ（点 D）。line・par・ans＝A を通り BC に平行な直線 DE（A の左右 ax ずつ）をつける。
        角の字 t＝{ a, b, c（内角）, d（外角 ∠ACD）, x（I・E のところ）… }。弧の本数 n。bis＝'I'（∠B・∠C の二等分線の交点 I）。cap＝図の見出し（図1・ア …） */
  const rad = d => d * Math.PI / 180;
  const pp = (p, r, d) => [p[0] + r * Math.cos(rad(d)), p[1] + r * Math.sin(rad(d))];
  const aD = (v, p, q) => { const d = Math.abs(Math.atan2(p[1] - v[1], p[0] - v[0]) - Math.atan2(q[1] - v[1], q[0] - v[0])) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
  const TRI = o => {
    const w = o.w || 6, Bd = o.B, Cd = o.C, AB = w * Math.sin(rad(Cd)) / Math.sin(rad(Bd + Cd));
    const Bp = [0, 0], Cp = [w, 0], Ap = pp(Bp, AB, Bd), ax = o.ax || 2.4, ax2 = o.ax2 || 4.2, bis = o.bis;
    const pts = { A: Ap, B: Bp, C: Cp };
    if (o.ext) pts.D = [w + o.ext, 0];
    if (o.line || o.par || o.ans) { pts.dA = [Ap[0] - ax, Ap[1]]; pts.eA = [Ap[0] + ax2, Ap[1]]; }
    if (bis === 'I') {   // I：∠B・∠C の二等分線の交点（内心）
      const la = w, lb = Math.hypot(Cp[0] - Ap[0], Cp[1] - Ap[1]), lc = AB;
      pts.I = [(la * Ap[0] + lb * Bp[0] + lc * Cp[0]) / (la + lb + lc), (la * Ap[1] + lb * Bp[1] + lc * Cp[1]) / (la + lb + lc)];
    }
    const AN = { a: ['A', 'B', 'C'], b: ['B', 'C', 'A'], c: ['C', 'A', 'B'], d: ['C', 'D', 'A'],
      b1: ['B', 'A', 'I'], b2: ['B', 'I', 'C'], c1: ['C', 'B', 'I'], c2: ['C', 'I', 'A'],
      x: ['I', 'B', 'C'], da: ['A', 'dA', 'B'], ea: ['A', 'C', 'eA'] };
    const ang = Object.keys(o.t || {}).map(k => {
      const e = { k, at: AN[k][0], a: AN[k][1], b: AN[k][2], t: o.t[k], n: (o.n && o.n[k]) || 1, r: o.r || 4, lr: o.lr && o.lr[k] != null ? o.lr[k] : (String(o.t[k]).length > 2 ? 9 : 7.4) };
      if (o.right && k === 'b' && o.B === 90) { e.right = true; e.t = ''; }
      return e;
    });
    const spec = { pts, poly: 'ABC', ang, A: AN, scale: o.scale, pad: o.pad == null ? 8 : o.pad, vl: { A: 'A', B: 'B', C: 'C' } };
    const segs = [], txt = [];
    if (o.ext) { segs.push(['C', 'D']); spec.vl.D = ['D', 270, 3.4]; }
    if (bis === 'I') { segs.push(['B', 'I'], ['C', 'I']); spec.vl.I = ['I', 150, 3.6]; }
    if (o.line) { segs.push(['dA', 'eA']); spec.vl.dA = ['D', 180, 3.4]; spec.vl.eA = ['E', 0, 3.4]; }
    if (o.par) spec.par = [['B', 'C', 1], ['dA', 'eA', 1]];
    if (o.cap) { const xs = Object.values(pts).map(q => q[0]), ys = Object.values(pts).map(q => q[1]); txt.push(o.capR ? { p: [Math.max(...xs), Math.max(...ys)], t: o.cap, dx: 0, dy: 0, anchor: 'end' } : { p: [Math.min(...xs), Math.max(...ys)], t: o.cap, dx: -8, dy: 0, anchor: 'start' }); }
    if (segs.length) spec.segs = segs;
    if (txt.length) spec.txt = txt;
    if (o.ans) spec.a = o.ans(spec);
    return spec;
  };
  // 答えの図（今日の問い）：A を通り BC に平行な直線 DE（赤い点線）と、∠DAB＝∠b、∠EAC＝∠c の印
  const ansLine = s => ({ segs: [['dA', 'eA', { dash: 1 }]], vl: { dA: ['D', 180, 3.2], eA: ['E', 0, 3.2] }, par: [['B', 'C', 1], ['dA', 'eA', 1]],
    ang: [{ at: 'A', a: 'dA', b: 'B', t: 'b', r: 5.5, lr: 9.4 }, { at: 'A', a: 'C', b: 'eA', t: 'c', r: 5.5, lr: 9.4 }] });
  // checks の式の中に、そのまま埋めこむ：座標から角を計算し直す
  const LIB = 'const rad = ' + rad + '; const pp = ' + pp + '; const aD = ' + aD + '; const TRI = ' + TRI + ';' +
    ' const val = (s, k) => { const g = s.A[k]; return aD(s.pts[g[0]], s.pts[g[1]], s.pts[g[2]]); };' +
    ' const eq = (x, y) => Math.abs(x - y) < 1e-6;' +
    ' const cr = (u, w) => u[0] * w[1] - u[1] * w[0];' +
    ' const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';

  /* ---------------- 問題のデータ（図・答えは、ここから作る） ---------------- */
  const TW = { B: 48, C: 64, w: 6.2, t: { a: 'a', b: 'b', c: 'c' }, r: 4, ans: ansLine };   // 今日の問い：△ABC（∠A＝68°、∠B＝48°、∠C＝64°）
  const TE = { B: 45, C: 70, w: 5.6, ext: 3.2, t: { a: 'a', b: 'b', c: 'c', d: 'd' }, r: 4 };               // 例題：∠A＝65°、∠B＝45°、∠C＝70°、外角 ∠d＝110°
  const T_TH = [['ア', { B: 40, C: 75 }], ['イ', { B: 110, C: 32, capR: true }], ['ウ', { B: 72, C: 50 }]];                      // 考えよう：ア（∠A＝65°）イ（∠B＝110°、鈍角）ウ（∠A＝58°）
  const thFig = (o, cap) => Object.assign({ w: 5.4, t: { a: 'a', b: 'b', c: 'c' }, r: 3.2, lr: { a: 6.8, b: 6.8, c: 6.8 }, cap, pad: 9 }, o);
  const LR = { a: 7.4, b: 8, c: 7.4, d: 8 };
  const T_D1 = [['図1', { B: 70, C: 60, w: 5.4, t: { a: 'x', b: '70°', c: '60°' }, cap: '図1' }, 50], ['図2', { B: 90, C: 35, t: { a: 'x', b: '', c: '35°' }, right: true, cap: '図2' }, 55]];   // 確かめる（1）図1：50°、図2：55°
  const T_D2 = { B: 45, C: 70, ext: 2.4, t: { a: '65°', b: '45°', d: 'x' }, cap: '図3' };   // 確かめる（2）図3：∠x＝∠d＝65°＋45°＝110°
  const T_D4 = { B: 65, C: 70, w: 5.6, ext: 2.6, t: { a: '', b: '', d: '110°' }, cap: '図4' };                    // 使ってみる（4）：∠A＝(x+10)°＝45°、∠B＝(2x−5)°＝65°、∠ACD＝110°
  const T_D7 = { B: 60, C: 50, w: 6, bis: 'I', t: { a: '70°', x: 'x', b1: '', b2: '', c1: '', c2: '' }, n: { c1: 2, c2: 2 }, r: 4 };      // チャレンジ（8）：∠A＝70°、∠BIC＝125°
  const T_Q1 = [['①', { B: 62, C: 71, w: 5.6, t: { a: 'x', b: '62°', c: '71°' }, cap: '①' }, 47], ['②', { B: 52, C: 66, ext: 3, t: { a: '62°', b: '52°', d: 'x' }, cap: '②' }, 114], ['③', { B: 35, C: 60, ext: 3, t: { b: '35°', a: 'x', d: '120°' }, cap: '③' }, 85]];   // 小テスト（1）
  const T_Q2 = { B: 52, C: 66, w: 6.0, line: true, par: true, t: { a: 'a', b: 'b', c: 'c' }, r: 4 };         // 小テスト（2）：DE∥BC
  const T_QC = { B: 50, C: 50, w: 6, bis: 'I', t: { a: '80°', x: 'x', b1: '', b2: '', c1: '', c2: '' }, n: { c1: 2, c2: 2 }, r: 4 };   // チャレンジ：∠A＝80°、∠BIC＝130°
  const fig = (o, base) => GEO(TRI(Object.assign({ w: 4.4, r: 3.2, pad: 5, lr: LR }, base || {}, o)));

  const A_W = '（例）A を通り BC に平行な\n直線 DE をひく。\n錯角が等しいから\n　∠DAB＝∠b、∠EAC＝∠c\n一直線の角は 180° だから\n　∠a＋∠b＋∠c＝180°';
  const A_E = '△ABC の内角の和は 180° だから\n　∠a＋∠b＋∠c＝180°　…①\n一直線の角は 180° だから\n　∠c＋∠d＝180°　…②\n①、② より　∠d＝∠a＋∠b';
  const A_D1 = '図1　180°−70°−60°＝50°\n図2　180°−90°−35°＝55°';
  const A_D2 = '65°＋45°＝110°';
  const A_D3 = 'x＋(x＋20)＋(2x−40)＝180\n4x−20＝180　　x＝50\n角は 50°、70°、60°';
  const A_D4 = '外角の性質より\n(x＋10)＋(2x−5)＝110\n3x＋5＝110　　x＝35';
  const A_D5 = '∠A＋∠B＋∠C＝180°\n∠B＋∠C＝∠A だから\n2∠A＝180°　　∠A＝90°';
  const A_D6 = '180°÷(2＋3＋4)＝20°\n40°、60°、80°';
  const A_D7 = '∠B＋∠C＝180°−70°＝110°\n∠IBC＋∠ICB＝55°\n（∠B、∠C の半分ずつ）\n∠BIC＝180°−55°＝125°';
  const A_Q1 = '① 180°−62°−71°＝47°　　② 62°＋52°＝114°\n③ 120°−35°＝85°';
  const A_Q2 = '平行線の錯角は等しいから\n　∠DAB＝∠b、∠EAC＝∠c\n点 A のまわりで、一直線の角は 180° だから\n　∠DAB＋∠a＋∠EAC＝180°\nよって　∠a＋∠b＋∠c＝180°';
  const A_Q3 = 'x＋2x＋3x＝180　　6x＝180　　x＝30';
  const A_Q4 = '∠B＋∠C＝180°−50°＝130°　　∠B＝∠C だから\n∠B＝130°÷2＝65°';
  const A_QC = '∠B＋∠C＝180°−80°＝100°\n∠IBC＋∠ICB＝100°÷2＝50°\n∠BIC＝180°−50°＝130°';

  IK.lesson('heikou_new-03', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第3時', title: '三角形の内角の和が180°になるわけを説明しよう',
    summary: '三角形に線を1本かき加えて、内角の和が 180° になるわけを、平行線の錯角と一直線の角から説明する。内角・外角・補助線のことばと、外角の性質を知る。ひろげるは、ちがう線をひいても説明できるか。',
    head: '平行と合同　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：△ABC の内角 ∠A＝68°、∠B＝48°、∠C＝64°（座標から）。A を通る BC に平行な直線 DE：∠DAB＝∠B、∠EAC＝∠C（錯角）、∠DAB＋∠A＋∠EAC＝180°
      chk('第3時 今日の問い', `const s = TRI(${J(Object.assign({}, TW, { ans: null, line: true, t: { a: 'a', b: 'b', c: 'c', da: 'x', ea: 'y' } }))}); const p = s.pts; return eq(val(s, 'a'), 68) && eq(val(s, 'b'), 48) && eq(val(s, 'c'), 64) && eq(val(s, 'a') + val(s, 'b') + val(s, 'c'), 180) && eq(cr(sub(p.eA, p.dA), sub(p.C, p.B)), 0) && eq(val(s, 'da'), val(s, 'b')) && eq(val(s, 'ea'), val(s, 'c')) && eq(val(s, 'da') + val(s, 'a') + val(s, 'ea'), 180);`),
      // 例題：外角 ∠ACD＝110°＝∠A＋∠B（座標から）。∠c＋∠d＝180°
      chk('第3時 例題', `const s = TRI(${J(TE)}); return eq(val(s, 'a'), 65) && eq(val(s, 'b'), 45) && eq(val(s, 'c'), 70) && eq(val(s, 'd'), 110) && eq(val(s, 'c') + val(s, 'd'), 180) && eq(val(s, 'd'), val(s, 'a') + val(s, 'b')) && eq(val(s, 'a') + val(s, 'b') + val(s, 'c'), 180);`),
      // 考えよう（答えは載せない。ここで確かめるだけ）：ア ∠A＝65°、イ ∠B＝110°（鈍角）、ウ ∠A＝58°。どれも内角の和は 180°。C を通り AB に平行な直線で、錯角 ∠ACE＝∠a、同位角 ∠ECD＝∠b（座標から）
      chk('第3時 考えよう', `const D = ${J(T_TH)}; const S = D.map(([k, o]) => TRI(Object.assign({ w: 5.4, ext: 3, t: { a: 'a' } }, o))); return D.every(([k, o], i) => { const s = S[i], p = s.pts, u = sub(p.A, p.B), E = [p.C[0] + u[0] * 0.5, p.C[1] + u[1] * 0.5]; return eq(val(s, 'a') + val(s, 'b') + val(s, 'c'), 180) && eq(aD(p.C, p.A, E), val(s, 'a')) && eq(aD(p.C, E, p.D), val(s, 'b')) && eq(aD(p.C, p.A, E) + aD(p.C, E, p.D) + val(s, 'c'), 180) && eq(cr(sub(E, p.C), sub(p.B, p.A)), 0); }) && eq(val(S[0], 'a'), 65) && eq(val(S[1], 'b'), 110) && eq(val(S[2], 'a'), 58);`),
      // 確かめる（1）図1・図2：内角の和から（座標）。50°、55°（図2 は ∠B＝90°）
      chk('第3時 確かめる（1）', `const D = ${J(T_D1)}; return D.every(([k, o, x]) => { const s = TRI(o); return eq(val(s, 'a'), x) && eq(val(s, 'a') + val(s, 'b') + val(s, 'c'), 180); }) && eq(180 - 70 - 60, 50) && eq(180 - 90 - 35, 55) && eq(val(TRI(D[1][1]), 'b'), 90);`),
      // 確かめる（2）図3：外角の性質（座標）。∠x（∠ACD）＝65＋45＝110　∠c＋∠d＝180
      chk('第3時 確かめる（2）', `const s = TRI(${J(T_D2)}); return eq(val(s, 'a'), 65) && eq(val(s, 'b'), 45) && eq(val(s, 'd'), 110) && eq(val(s, 'd'), val(s, 'a') + val(s, 'b')) && eq(val(s, 'c') + val(s, 'd'), 180) && eq(65 + 45, 110);`),
      // 使ってみる（3）x＋(x＋20)＋(2x−40)＝180 → x＝50（しらみつぶし）。角は 50°、70°、60°
      chk('第3時 使ってみる（3）', `const sol = []; for (let x = 0; x <= 180; x++) if (x + (x + 20) + (2 * x - 40) === 180) sol.push(x); return sol.join() === '50' && eq(50 + 70 + 60, 180) && eq(2 * 50 - 40, 60);`),
      // 使ってみる（4）外角 110°＝(x＋10)＋(2x−5) → x＝35。∠A＝45°、∠B＝65°、∠C＝70°（座標から）
      chk('第3時 使ってみる（4）', `const s = TRI(${J(T_D4)}); const sol = []; for (let x = 0; x <= 90; x++) if ((x + 10) + (2 * x - 5) === 110) sol.push(x); return sol.join() === '35' && eq(val(s, 'a'), 35 + 10) && eq(val(s, 'b'), 2 * 35 - 5) && eq(val(s, 'd'), 110) && eq(val(s, 'a') + val(s, 'b'), val(s, 'd')) && eq(val(s, 'c'), 70);`),
      // 使ってみる（5）∠A＝∠B＋∠C → ∠A＝90°（内角を 1°きざみで全部しらべる）　（6）2：3：4 → 40°、60°、80°
      chk('第3時 使ってみる（5）（6）', `const sol = []; for (let a = 1; a < 180; a++) for (let b = 1; b < 180 - a; b++) { const c = 180 - a - b; if (a === b + c) sol.push(a + ',' + b + ',' + c); } const r = []; for (let k = 1; k < 90; k++) if (2 * k + 3 * k + 4 * k === 180) r.push(k); return sol.every(r2 => r2.split(',')[0] === '90') && sol.length > 0 && r.join() === '20' && eq(180 / (2 + 3 + 4), 20) && eq(2 * 20, 40) && eq(3 * 20, 60) && eq(4 * 20, 80) && eq(40 + 60 + 80, 180);`),
      // チャレンジ（8）∠A＝70° → ∠BIC＝90°＋∠A÷2＝125°（座標から。I は ∠B・∠C の二等分線の交点）
      chk('第3時 チャレンジ（8）', `const s = TRI(${J(T_D7)}); const p = s.pts; return eq(val(s, 'a'), 70) && eq(aD(p.B, p.A, p.I), aD(p.B, p.I, p.C)) && eq(aD(p.C, p.B, p.I), aD(p.C, p.I, p.A)) && eq(aD(p.B, p.I, p.C), val(s, 'b') / 2) && eq(val(s, 'x'), 125) && eq(val(s, 'x'), 90 + val(s, 'a') / 2) && eq(val(s, 'b') / 2 + val(s, 'c') / 2, 55) && eq(180 - 55, 125);`),
      // 小テスト（1）①〜③　（2）DE∥BC　（3）x＝30　（4）∠B＝65°　チャレンジ ∠BIC＝130°
      chk('第3時 小テスト（1）', `const D = ${J(T_Q1)}; const s = D.map(r => TRI(r[1])); return eq(val(s[0], 'a'), 47) && eq(val(s[1], 'd'), 114) && eq(val(s[1], 'd'), val(s[1], 'a') + val(s[1], 'b')) && eq(val(s[2], 'a'), 85) && eq(val(s[2], 'd'), 120) && eq(val(s[2], 'd'), val(s[2], 'a') + val(s[2], 'b'));`),
      chk('第3時 小テスト（2）（3）（4）', `const s = TRI(${J(T_Q2)}); const p = s.pts; const sol = []; for (let x = 1; x < 60; x++) if (x + 2 * x + 3 * x === 180) sol.push(x); return eq(cr(sub(p.eA, p.dA), sub(p.C, p.B)), 0) && eq(aD(p.A, p.dA, p.B), val(s, 'b')) && eq(aD(p.A, p.C, p.eA), val(s, 'c')) && eq(aD(p.A, p.dA, p.B) + val(s, 'a') + aD(p.A, p.C, p.eA), 180) && sol.join() === '30' && eq(180 - 50, 130) && eq(130 / 2, 65);`),
      chk('第3時 小テスト チャレンジ', `const s = TRI(${J(T_QC)}); const p = s.pts; return eq(val(s, 'a'), 80) && eq(aD(p.B, p.A, p.I), aD(p.B, p.I, p.C)) && eq(aD(p.C, p.B, p.I), aD(p.C, p.I, p.A)) && eq(val(s, 'x'), 130) && eq(val(s, 'x'), 90 + 80 / 2);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角形の内角の和が 180° になるわけを説明しよう'),
      K('今日の問い', '△ABC の内角の和 ∠a＋∠b＋∠c が 180° になるわけを、平行線の性質で説明したい。どんな線を1本かき加えればよいだろう。', 2),
      C2([
        T('①', '自分の考え（3分）　線を図にかき入れて、説明を書こう。', 2),
        B(6, A_W)
      ], [
        F(8, GEO(TRI(TW)))
      ], '3:2'),
      T('②', 'ペアの考え（3分）　自分とちがう線や説明を書こう。', 1),
      B(4, ''),
      G(1),
      WD('多角形の内側の角を{{内角}}という。\n辺の延長と、となりの辺がつくる角を{{外角}}という。\n三角形の内角の和は{{180°}}である。\n説明のために、かき加える線を{{補助線}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '右の図で、∠d は △ABC の外角である。∠d＝∠a＋∠b であるわけを、{{内角の和}}と{{一直線の角}}を使って説明しよう。', 2),
      C2([
        T('', '【説明】', 1),
        B(5, A_E)
      ], [
        F(8, GEO(TRI(TE)))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 多角形の内側の角を{{内角}}、辺の延長がつくる角を{{外角}}という。\n② 三角形の内角の和は{{180°}}である。\n③ 三角形の外角は、となり合わない 2つの内角の{{和}}に等しい。\n④ 角を求めるために、図にかき加える線を{{補助線}}という。', 4, { label: 'ことば' }),
      F(5, ...T_D1.map(([k, o]) => fig(o)), fig(T_D2), fig(T_D4)),
      C2([
        T('（1）', '図1・図2で、∠x の大きさを求めよう。', 2),
        B(3, A_D1)
      ], [
        T('（2）', '図3で、∠x の大きさを求めよう。', 2),
        B(3, A_D2)
      ], '1:1'),
      MA('【説明】内角の和 180° のわけを、「錯角」を使って説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '内角の和・外角の性質を使って、考えよう。'),
      C2([
        T('（3）', '三角形の 3つの内角が x°、(x＋20)°、(2x−40)° のとき、x の値と 3つの内角を求めよう。', 3),
        B(3, A_D3)
      ], [
        T('（4）', '図4で、∠A＝(x＋10)°、∠B＝(2x−5)°、外角 ∠ACD＝110° のとき、x の値を求めよう。', 4),
        B(3, A_D4)
      ], '1:1'),
      C2([
        T('（5）', '△ABC で、∠A＝∠B＋∠C のとき、∠A の大きさを求めよう。', 3),
        B(4, A_D5)
      ], [
        T('（6）', '△ABC で、∠A：∠B：∠C＝2：3：4 のとき、3つの内角の大きさを求めよう。', 3),
        B(4, A_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：ちがう線をひいても、説明できるだろうか。'),
      T('（7）', '今日の問いでは、A を通り BC に平行な直線をひいて、説明した。ほかの線をひいても、内角の和が 180° になるわけを、説明できるだろうか。下のア〜ウの三角形に、ちがう線をかき入れて、考えよう。', 3),
      F(5, ...T_TH.map(([k, o]) => GEO(TRI(thFig(o, k)), { w: 1 }))),
      T('', 'ひいた線をもとに、わけを説明しよう。（等しい角に、同じ印をつけよう）', 1),
      B(6, ''),
      T('', '友達のひき方とくらべて、気づいたことを書こう。', 1),
      B(4, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図の △ABC で、∠A＝70° である。∠B の二等分線と、∠C の二等分線の交点を I とするとき、∠BIC の大きさを求めよう。', 5),
        B(4, A_D7)
      ], [
        F(5, GEO(TRI(T_D7))),
        MA('① ∠B と ∠C の和は、何度かな。\n② ∠IBC と ∠ICB の和は、その何分の1かな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 片面・5分。この時間の内容。次の時間のはじめに使う） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '下の図①〜③で、∠x の大きさを求めよう。（3点）', 1),
      F(4, ...T_Q1.map(([k, o]) => fig(o, { w: 4.2 }))),
      B(2, A_Q1),
      C2([
        T('（2）', '右の図で、DE∥BC である。∠a＋∠b＋∠c＝180° となるわけを、説明しよう。（3点）', 3),
        B(5, A_Q2)
      ], [
        F(7, GEO(TRI(T_Q2)))
      ], '3:2'),
      T('（3）', '三角形の3つの内角の大きさが、x°、2x°、3x° のとき、x の値を求めよう。（2点）', 1),
      B(1, A_Q3),
      T('（4）', '△ABC で、∠A＝50°、∠B＝∠C のとき、∠B の大きさを求めよう。（2点）', 1),
      B(2, A_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図の △ABC で、∠A＝80° である。∠B の二等分線と、∠C の二等分線の交点を I とするとき、∠BIC の大きさを求めよう。', 5),
        B(3, A_QC)
      ], [
        F(7, GEO(TRI(T_QC)))
      ], '3:2')
    ]
  });
})();
