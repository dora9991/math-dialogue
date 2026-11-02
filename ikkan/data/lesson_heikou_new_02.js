/* 平行と合同（新しい形） 第2時：平行な2直線に1つの直線が交わると、角はどうなるだろう。
   元：data/lesson_heikou_02.js（前の形）。題・めあて・数値・図の関数・checks を引きつぎ、次のように組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（ℓ∥m の図で ∠a・∠b・∠c を分度器ではかり、同位角・錯角の大きさのきまりを見つける。図は全部印刷）。
     個人3分 → ペア3分 → ことば（平行線の性質・平行線になる条件）→ 例題（ア・イの図で、平行かどうか。表に空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう：ℓ∥m、∠a＝65° のときの7つの角と、錯角が等しくなるわけ。答えなし）・チャレンジ★★（折れ線 A→B→C→D。ヒントカードつき）。
   ・考えよう（演習プリント（7））の答え（65° と 115°、錯角が等しいわけ）は、どこにも書かない。ことばの「錯角も等しい」は事実だけで、わけは書かない。
   ・図は角度から座標を計算してかいた（GEO）。角の大きさ・平行かどうか・位置関係は、座標から計算し直して checks で確かめた。
     「見えるから平行」は根拠にしない（例題・演習（2）・小テスト（2）の図には、平行のしるしをつけない）。折れ線の問題の答えの図には、補助線を赤い点線で出した。
   検算：node tools/verify.cjs heikou_new-02　／　見た目：node tools/check.cjs <出力先> heikou_new-02 */
(function () {
  const { M, K, B, G, F, C2, BR, T, HD, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具（座標は、角度から計算する。checks でも同じものを使って、座標から角を計算し直す） ----------------
     rad・pp(p, r, d)：点 p から、向き d（度）に r だけ進んだ点　aD(v, p, q)：∠pvq の大きさ（度）
     TRV({ th, pl, pm, h, t, par, cap, … })：直線 ℓ（上）・m（下）に、直線 n が交わる図。th＝n の向き、pl・pm＝ℓ・m の向き（同じなら平行。par:true でしるし＞をつける）。
        P＝ℓ と n の交点、Q＝m と n の交点。角 a〜h：P のまわりが a（右上）b（左上）c（左下）d（右下）、Q のまわりが e（右上）f（左上）g（左下）h（右下）。t＝{ 角: 字 }
     ZIG({ al, ga })：ℓ∥m の間の折れ線 A→E→C（A は ℓ 上、C は m 上）。al＝∠(ℓ の右, AE)、ga＝∠(m の右, CE)、x＝∠AEC
     ZZ({ d1, d2, d3, r1, r2, r3 })：ℓ∥m の間の折れ線 A→B→C→D（A は ℓ 上、D は m 上）。d＝各線分の向き（度） */
  const rad = d => d * Math.PI / 180;
  const pp = (p, r, d) => [p[0] + r * Math.cos(rad(d)), p[1] + r * Math.sin(rad(d))];
  const aD = (v, p, q) => { const d = Math.abs(Math.atan2(p[1] - v[1], p[0] - v[0]) - Math.atan2(q[1] - v[1], q[0] - v[0])) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
  const TRV = o => {
    const th = o.th == null ? 65 : o.th, pl = o.pl || 0, pm = o.pm == null ? pl : o.pm, hh = o.h || 4.6, len = o.len || 5, ext = o.ext || 1.4;
    const dn = pp([0, 0], 1, th), P = [0, hh], Q = [P[0] - dn[0] * hh / dn[1], 0];
    const pts = { P, Q, l1: pp(P, -len, pl), l2: pp(P, len, pl), m1: pp(Q, -len, pm), m2: pp(Q, len, pm), n1: pp(Q, -ext, th), n2: pp(P, ext, th),
      RP: pp(P, 2, pl), LP: pp(P, -2, pl), RQ: pp(Q, 2, pm), LQ: pp(Q, -2, pm), p1: pp(P, 3.1, pl), p2: pp(P, 4.1, pl), q1: pp(Q, 3.1, pm), q2: pp(Q, 4.1, pm) };
    const AN = { a: ['P', 'RP', 'n2'], b: ['P', 'n2', 'LP'], c: ['P', 'LP', 'Q'], d: ['P', 'Q', 'RP'], e: ['Q', 'RQ', 'P'], f: ['Q', 'P', 'LQ'], g: ['Q', 'LQ', 'n1'], h: ['Q', 'n1', 'RQ'] };
    const keys = Object.keys(o.t || {}), only = keys.length >= 8, ang = [], txt = [];
    keys.forEach(k => {
      const [v, p, q] = AN[k], V = pts[v], u = z => { const L = Math.hypot(pts[z][0] - V[0], pts[z][1] - V[1]); return [(pts[z][0] - V[0]) / L, (pts[z][1] - V[1]) / L]; };
      const mid = Math.atan2(u(p)[1] + u(q)[1], u(p)[0] + u(q)[0]);
      if (o.arc && o.arc.indexOf(k) >= 0) ang.push({ k, at: v, a: p, b: q, r: o.r || 4 });   // 弧だけ（字は、下で、弧から少しはなして置く）
      if (only) { const lr = o.lr && o.lr[k] != null ? o.lr[k] : 5.4; txt.push(lab(v, mid * 180 / Math.PI, lr, o.t[k])); return; }
      ang.push({ k, at: v, a: p, b: q, t: o.t[k], r: o.r || 4, lr: o.lr && o.lr[k] != null ? o.lr[k] : (String(o.t[k]).replace(/\{\{|\}\}/g, '').length > 3 ? 9.4 : String(o.t[k]).length > 2 ? 8.6 : 6.8) });
    });
    if (o.cap) txt.push({ p: 'l1', t: o.cap, dx: -1, dy: -4.5, anchor: 'start' });
    const nm = o.names || ['ℓ', 'm'];
    const spec = { pts, segs: [['l1', 'l2', { lab: nm[0] }], ['m1', 'm2', { lab: nm[1] }], ['n1', 'n2']], ang, A: AN, scale: o.scale, pad: o.pad == null ? 7 : o.pad };
    if (txt.length) spec.txt = txt;
    if (o.par) spec.par = [['p1', 'p2', 1], ['q1', 'q2', 1]];
    return spec;
  };
  // 字を、頂点 v から向き d（度）に r mm のところに。スライドの図は字が大きくなる（IK.labelScale 倍）ので、そのぶん、距離もひろげる（描くときに計算する）
  const GR = () => 3.0 * (((typeof IK !== 'undefined' && IK.labelScale) || 1) - 1);
  const lab = (v, d, r, t) => ({ p: v, t, get dx() { return (r + 0.7 * GR()) * Math.cos(rad(d)); }, get dy() { return -(r + 0.7 * GR()) * Math.sin(rad(d)); } });
  const ZIG = o => {
    const h = 4.2, A = [0, h], E = pp(A, o.r1 || 3, -o.al), r2 = E[1] / Math.sin(rad(o.ga)), C = pp(E, r2, 180 + o.ga);
    const xs = [A[0], E[0], C[0]], x0 = Math.min(...xs) - 1.6, x1 = Math.max(...xs) + 2.4;
    const pts = { A, E, C, l1: [x0, h], l2: [x1, h], m1: [x0, 0], m2: [x1, 0], rA: pp(A, 2, 0), rC: pp(C, 2, 0), f1: [E[0] - 3, E[1]], f2: [E[0] + 2.6, E[1]], pa1: [x1 - 2.2, h], pa2: [x1 - 1.2, h], pb1: [x1 - 2.2, 0], pb2: [x1 - 1.2, 0] };
    const AX = { al: ['A', 'rA', 'E'], ga: ['C', 'rC', 'E'], x: ['E', 'A', 'C'] };
    return { pts, segs: [['l1', 'l2', { lab: 'ℓ' }], ['m1', 'm2', { lab: 'm' }], ['A', 'E'], ['E', 'C']], par: [['pa1', 'pa2', 1], ['pb1', 'pb2', 1]],
      ang: [{ k: 'al', at: 'A', a: 'rA', b: 'E', t: o.al + '°', r: 4, lr: 8.4 }, { k: 'ga', at: 'C', a: 'rC', b: 'E', t: o.ga + '°', r: 4, lr: 8.4 }, { k: 'x', at: 'E', a: 'A', b: 'C', r: 4 }], A: AX,
      txt: [lab('E', 158, 9.5, 'x')], a: { segs: [['f1', 'f2', { dash: 1 }]] }, scale: o.scale, pad: o.pad == null ? 7 : o.pad };
  };
  const ZZ = o => {
    const A = [0, 0], B = pp(A, o.r1 || 2.4, o.d1), C = pp(B, o.r2 || 2.2, o.d2), D = pp(C, o.r3 || 2.4, o.d3);
    const xs = [A[0], B[0], C[0], D[0]], x0 = Math.min(...xs) - 1.6, x1 = Math.max(...xs) + 2.6;
    const pts = { A, B, C, D, l1: [x0, 0], l2: [x1, 0], m1: [x0, D[1]], m2: [x1, D[1]], rA: pp(A, 2, 0), lD: pp(D, -2, 0), gB1: [B[0] - 3, B[1]], gB2: [B[0] + 3, B[1]], gC1: [C[0] - 3, C[1]], gC2: [C[0] + 3, C[1]],
      pa1: [x1 - 2.2, 0], pa2: [x1 - 1.2, 0], pb1: [x1 - 2.2, D[1]], pb2: [x1 - 1.2, D[1]] };
    const AX = { al: ['A', 'rA', 'B'], b: ['B', 'A', 'C'], c: ['C', 'B', 'D'], x: ['D', 'C', 'lD'] };
    const v = k => Math.round(aD(pts[AX[k][0]], pts[AX[k][1]], pts[AX[k][2]]));
    return { pts, segs: [['l1', 'l2', { lab: 'ℓ' }], ['m1', 'm2', { lab: 'm' }], ['A', 'B'], ['B', 'C'], ['C', 'D']], par: [['pa1', 'pa2', 1], ['pb1', 'pb2', 1]],
      ang: [{ k: 'al', at: 'A', a: 'rA', b: 'B', t: v('al') + '°', r: 4, lr: 9 }, { k: 'b', at: 'B', a: 'A', b: 'C', r: 4 }, { k: 'c', at: 'C', a: 'B', b: 'D', r: 4 }, { k: 'x', at: 'D', a: 'C', b: 'lD', t: 'x', r: 4, lr: 7 }], A: AX,
      txt: [lab('B', 165, 9.5, v('b') + '°'), lab('C', -18, 9.5, v('c') + '°')], a: { segs: [['gB1', 'gB2', { dash: 1 }], ['gC1', 'gC2', { dash: 1 }]] }, scale: o.scale, pad: o.pad == null ? 7 : o.pad };
  };
  const mkFig = o => (o.al ? ZIG(o) : o.d1 != null ? ZZ(o) : TRV(o));
  // checks の式の中に、そのまま埋めこむ：座標から角を計算し直す
  const LIB = 'const rad = ' + rad + '; const pp = ' + pp + '; const aD = ' + aD + '; const GR = ' + GR + '; const lab = ' + lab + '; const TRV = ' + TRV + ';  const ZIG = ' + ZIG + '; const ZZ = ' + ZZ + ';' +
    ' const val = (s, k) => { const g = s.A[k]; return aD(s.pts[g[0]], s.pts[g[1]], s.pts[g[2]]); };' +
    ' const cr = (u, w) => u[0] * w[1] - u[1] * w[0];' +
    ' const par = s => Math.abs(cr([s.pts.l2[0] - s.pts.l1[0], s.pts.l2[1] - s.pts.l1[1]], [s.pts.m2[0] - s.pts.m1[0], s.pts.m2[1] - s.pts.m1[1]])) < 1e-9;' +
    ' const eq = (x, y) => Math.abs(x - y) < 1e-6;' +
    ' const mid = (s, k) => { const g = s.A[k], V = s.pts[g[0]]; const u = z => { const L = Math.hypot(s.pts[z][0] - V[0], s.pts[z][1] - V[1]); return [(s.pts[z][0] - V[0]) / L, (s.pts[z][1] - V[1]) / L]; }; return [u(g[1])[0] + u(g[2])[0], u(g[1])[1] + u(g[2])[1]]; };' +
    ' const sn = (s, k) => { const n = [s.pts.P[0] - s.pts.Q[0], s.pts.P[1] - s.pts.Q[1]], m = mid(s, k); return Math.sign(n[0] * m[1] - n[1] * m[0]); };' +
    ' const sl = (s, k) => Math.sign(mid(s, k)[1]);' +
    ' const inn = (s, k) => (s.A[k][0] === "P" ? sl(s, k) < 0 : sl(s, k) > 0);' +
    ' const dou = (s, x, y) => s.A[x][0] !== s.A[y][0] && sn(s, x) === sn(s, y) && sl(s, x) === sl(s, y);' +
    ' const saku = (s, x, y) => s.A[x][0] !== s.A[y][0] && sn(s, x) === -sn(s, y) && inn(s, x) && inn(s, y);' +
    ' const tai = (s, x, y) => s.A[x][0] === s.A[y][0] && Math.abs(cr(mid(s, x), mid(s, y))) < 1e-9 && mid(s, x)[0] * mid(s, y)[0] + mid(s, x)[1] * mid(s, y)[1] < 0;';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  // 図の上に「図1」などの名前をつける（GEO は caption を読まないので、図の中に書く）。auto：scale をはずして、枠におさまるように縮める
  const cap = (fig, text, fo) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, fo);
  const auto = o => Object.assign({}, o, { scale: 0 });

  /* ---------------- 問題のデータ（図・答えは、ここから作る） ---------------- */
  const T_W = { th: 65, pl: 0, pm: 0, par: true, t: { a: 'a', e: 'b', c: 'c' }, scale: 4.8, r: 3.6 };                   // 今日の問い：ℓ∥m。∠a＝∠b＝∠c＝65°
  const T_EA = { th: 75, pl: 0, pm: 0, t: { a: '75°', e: '75°' }, scale: 3.8, r: 3.6, cap: 'ア' };                      // 例題 ア：同位角 75° と 75° → 平行
  const T_EB = { th: 60, pl: 0, pm: -3, t: { c: '60°', e: '63°' }, scale: 3.8, r: 3.6, cap: 'イ' };                     // 例題 イ：錯角 60° と 63° → 平行でない
  const ALL = { a: '65°', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h' };
  const T_TH = { th: 65, pl: 0, pm: 0, par: true, t: ALL, scale: 5.0, arc: ['a'], lr: { a: 9.6 } };                      // 考えよう：ℓ∥m。∠a＝65°。a・c・e・g＝65°、b・d・f・h＝115°
  const T_D1 = [['図1', { th: 60, par: true, t: { a: '60°', e: 'x' } }, 60], ['図2', { th: 125, par: true, t: { d: '55°', f: 'x' } }, 55]];   // 演習（1）：同位角 60°、錯角 55°
  const T_D2 = [['図3', { th: 52, t: { a: '52°', e: '52°' } }, true], ['図4', { th: 48, pm: -4, t: { c: '48°', e: '52°' } }, false]];            // 演習（2）：図3 ○（同位角 52° と 52°）　図4 ×（錯角 48° と 52°）
  const T_D3 = { th: 70, par: true, t: { b: '110°', e: 'x' } };                                                          // 演習（3）：x＝70
  const Z_D4 = { al: 40, ga: 25 };                                                                                       // 演習（4）：x＝65
  const T_D5 = { th: 122, par: true, t: { b: '(2x−10)°', e: '(3x+20)°' }, lr: { b: 13 } };                              // 演習（5）：x＝34（58°・122°）
  const T_D6 = { th: 80, h: 5.6, par: true, t: { c: '80°', f: 'x' } };                                                  // 演習（6）：x＝100
  const Z_D8 = { d1: -40, d2: 200, d3: -35, scale: 5.0 };                                                                // 演習（8）：40°・60°・55° → x＝35
  const T_Q1 = [['①', { th: 72, par: true, t: { a: '72°', e: 'x' } }, 72], ['②', { th: 50, par: true, t: { c: '50°', e: 'x' } }, 50], ['③', { th: 120, par: true, t: { a: '120°', f: 'x' } }, 60]];   // 小テスト（1）
  const T_Q2 = { th: 116, pl: 0, pm: 0, t: { d: '64°', f: '64°' }, scale: 3.6, r: 3.4 };                                 // 小テスト（2）：錯角 64° と 64° → 平行
  const Z_Q4 = { al: 35, ga: 50, scale: 4.6 };                                                                           // 小テスト（4）：x＝85
  const Z_QC = { d1: -50, d2: 200, d3: -45, scale: 4.8 };                                                                // チャレンジ：50°・70°・65° → x＝45

  const A_W = '（例）∠a＝65°、∠b＝65°、∠c＝65°\n同位角 ∠a と ∠b は、等しい。\n錯角 ∠b と ∠c も、等しい。\n平行な2直線では、等しくなりそうだ。';
  const A_D1 = '図1 … 60°（同位角）\n図2 … 55°（錯角）';
  const A_D2 = '図3 ○　同位角が等しい\n図4 ×　錯角が等しくない';
  const A_D3 = '110° の同位角は 110°\n180°−110°＝70°';
  const A_D4 = 'E を通り ℓ に平行な\n直線をひくと、錯角が\n等しいから　40°＋25°＝65°';
  const A_D5 = '同位角と一直線の角で\n(2x−10)＋(3x+20)＝180\n5x＝170　　x＝34';
  const A_D6 = '80° の錯角は 80°\nx は、その角と一直線\n180°−80°＝100°';
  const A_D8 = '点 B、C を通る、ℓ に平行な直線をひく。\nB … 60°−40°＝20°（40° は錯角）\nC … 55°−20°＝35°（20° は錯角）\n35° は m との錯角だから　∠x＝35°';
  const A_Q1 = '① 72°（同位角）　② 50°（錯角）\n③ 120° の同位角は 120°。x＝180−120＝60°';
  const A_Q2 = '平行である。錯角が 64° で等しいから。';
  const A_Q3 = 'ア、イ';
  const A_Q4 = 'E を通り ℓ に平行な直線をひく。\n錯角が等しいから　35°＋50°＝85°';
  const A_QC = '点 B、C を通る、ℓ に平行な直線をひく。\nB … 70°−50°＝20°（50° は錯角）\nC … 65°−20°＝45°（20° は錯角）\n45° は m との錯角だから　∠x＝45°';

  IK.lesson('heikou_new-02', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第2時', title: '平行な2直線に1つの直線が交わると、角はどうなるだろう',
    summary: '平行な2直線に1つの直線が交わるとき、同位角・錯角が等しいこと（平行線の性質）と、同位角か錯角が等しければ平行になること（条件）を調べる。考えようは、錯角が等しくなるわけ。',
    head: '平行と合同　第2時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ℓ∥m。∠a（P の右上）＝∠b（Q の右上、同位角）＝∠c（P の左下、∠b の錯角）＝65°
      chk('第2時 今日の問い', `const s = TRV(${J(T_W)}); return par(s) && eq(val(s, 'a'), 65) && eq(val(s, 'e'), 65) && eq(val(s, 'c'), 65) && dou(s, 'a', 'e') && saku(s, 'c', 'e') && tai(s, 'a', 'c') && ${J(A_W)}.includes('65°');`),
      // 例題：ア 同位角 75° と 75° で、ℓ・m は平行（座標）。イ 錯角 60° と 63° で、平行でない。表の答え（同位角・錯角・○・×）を、位置関係と座標から出し直す
      chk('第2時 例題', `const a = TRV(${J(T_EA)}), b = TRV(${J(T_EB)}); const kind = (s, x, y) => dou(s, x, y) ? '同位角' : saku(s, x, y) ? '錯角' : '?'; return par(a) && eq(val(a, 'a'), 75) && eq(val(a, 'e'), 75) && kind(a, 'a', 'e') === '同位角' && !par(b) && eq(val(b, 'c'), 60) && eq(val(b, 'e'), 63) && kind(b, 'c', 'e') === '錯角' && !eq(val(b, 'c'), val(b, 'e')) && (par(a) ? '○' : '×') === '○' && (par(b) ? '○' : '×') === '×';`),
      // 考えよう（答えは載せない）：ℓ∥m、∠a＝65°。a・c・e・g＝65°、b・d・f・h＝115°。錯角 c＝e は、c＝a（対頂角）、a＝e（同位角）
      chk('第2時 考えよう', `const s = TRV(${J(T_TH)}); const v = k => val(s, k); return par(s) && ['a', 'c', 'e', 'g'].every(k => eq(v(k), 65)) && ['b', 'd', 'f', 'h'].every(k => eq(v(k), 115)) && tai(s, 'a', 'c') && tai(s, 'e', 'g') && tai(s, 'b', 'd') && tai(s, 'f', 'h') && dou(s, 'a', 'e') && saku(s, 'c', 'e') && saku(s, 'd', 'f') && eq(v('a') + v('b'), 180);`),
      // 演習（1）図1：ℓ∥m で同位角 60°、図2：錯角 55°
      chk('第2時 （1）', `const D = ${J(T_D1)}; const s = D.map(r => TRV(r[1])); return D.every(([k, o, x], i) => { const ks = Object.keys(o.t), kx = ks.find(j => o.t[j] === 'x'), kg = ks.find(j => o.t[j] !== 'x'); return par(s[i]) && eq(val(s[i], kx), x) && eq(val(s[i], kg), x); }) && dou(s[0], 'a', 'e') && saku(s[1], 'd', 'f');`),
      // 演習（2）図3 ○（同位角 52° と 52°）　図4 ×（錯角 48° と 52°）：座標から平行かどうかを出し直す
      chk('第2時 （2）', `const D = ${J(T_D2)}; const s = D.map(r => TRV(r[1])); return D.every(([k, o, ans], i) => par(s[i]) === ans) && eq(val(s[0], 'a'), 52) && eq(val(s[0], 'e'), 52) && dou(s[0], 'a', 'e') && eq(val(s[1], 'c'), 48) && eq(val(s[1], 'e'), 52) && saku(s[1], 'c', 'e');`),
      // 演習（3）図5：b＝110°（P の左上）の同位角 f＝110°、x＝e＝180−110＝70°
      chk('第2時 （3）', `const s = TRV(${J(T_D3)}); return par(s) && eq(val(s, 'e'), 70) && eq(val(s, 'f'), 110) && dou(s, 'b', 'f') && eq(val(s, 'e') + val(s, 'f'), 180) && eq(val(s, 'b'), 110) && eq(180 - 110, 70);`),
      // 演習（4）図6：折れ線。∠x＝40°＋25°＝65°（座標から）
      chk('第2時 （4）', `const s = ZIG(${J(Z_D4)}); return par({ pts: s.pts }) && eq(val(s, 'al'), 40) && eq(val(s, 'ga'), 25) && eq(val(s, 'x'), 65) && eq(val(s, 'al') + val(s, 'ga'), val(s, 'x'));`),
      // 演習（5）図7：(2x−10)＋(3x+20)＝180 → x＝34（しらみつぶし）。b＝58°（f＝58°）、e＝122°
      chk('第2時 （5）', `const s = TRV(${J(T_D5)}); const sol = []; for (let x = 0; x <= 90; x++) if ((2 * x - 10) + (3 * x + 20) === 180) sol.push(x); return par(s) && sol.join() === '34' && eq(val(s, 'b'), 2 * 34 - 10) && eq(val(s, 'e'), 3 * 34 + 20) && dou(s, 'b', 'f') && eq(val(s, 'f'), val(s, 'b')) && eq(val(s, 'e') + val(s, 'f'), 180);`),
      // 演習（6）図8：c＝80°（P の左下）の錯角 e＝80°、x＝f＝180−80＝100°
      chk('第2時 （6）', `const s = TRV(${J(T_D6)}); return par(s) && eq(val(s, 'c'), 80) && eq(val(s, 'e'), 80) && saku(s, 'c', 'e') && eq(val(s, 'f'), 100) && eq(val(s, 'e') + val(s, 'f'), 180) && eq(180 - 80, 100);`),
      // 演習（8）折れ線 A→B→C→D：∠(ℓ, AB)＝40°、∠ABC＝60°、∠BCD＝55° → x＝40＋55−60＝35°（座標から）。補助線の角 40°・20°・20°・35°
      chk('第2時 （8）', `const s = ZZ(${J(Z_D8)}); const p = s.pts; return eq(val(s, 'al'), 40) && eq(val(s, 'b'), 60) && eq(val(s, 'c'), 55) && eq(val(s, 'x'), 35) && eq(val(s, 'al') + val(s, 'c'), val(s, 'b') + val(s, 'x')) && eq(aD(p.B, p.A, p.gB1), 40) && eq(aD(p.B, p.gB1, p.C), 20) && eq(aD(p.C, p.B, p.gC2), 20) && eq(aD(p.C, p.gC2, p.D), 35) && eq(p.l1[1], p.l2[1]) && eq(p.m1[1], p.m2[1]);`),
      // 小テスト（1）①〜③　（2）　（3）　（4）　チャレンジ
      chk('第2時 小テスト（1）', `const D = ${J(T_Q1)}; const s = D.map(r => TRV(r[1])); return D.every(([k, o, x], i) => par(s[i]) && eq(val(s[i], Object.keys(o.t).find(j => o.t[j] === 'x')), x)) && dou(s[0], 'a', 'e') && saku(s[1], 'c', 'e') && eq(val(s[2], 'e'), 120) && eq(val(s[2], 'e') + val(s[2], 'f'), 180);`),
      chk('第2時 小テスト（2）（3）', `const s = TRV(${J(T_Q2)}); const ok = [-9, -4, 0, 5, 11].every(pm => { const t = TRV({ th: 80, pl: 0, pm, t: { c: 'c' } }); return (eq(val(t, 'c'), val(t, 'e')) === par(t)) && (eq(val(t, 'a'), val(t, 'e')) === par(t)); }); return par(s) && eq(val(s, 'd'), 64) && eq(val(s, 'f'), 64) && saku(s, 'd', 'f') && ok;`),
      chk('第2時 小テスト（4）', `const s = ZIG(${J(Z_Q4)}); return eq(val(s, 'al'), 35) && eq(val(s, 'ga'), 50) && eq(val(s, 'x'), 85) && eq(val(s, 'al') + val(s, 'ga'), val(s, 'x'));`),
      chk('第2時 小テスト チャレンジ', `const s = ZZ(${J(Z_QC)}); const p = s.pts; return eq(val(s, 'al'), 50) && eq(val(s, 'b'), 70) && eq(val(s, 'c'), 65) && eq(val(s, 'x'), 45) && eq(val(s, 'al') + val(s, 'c'), val(s, 'b') + val(s, 'x')) && eq(aD(p.B, p.A, p.gB1), 50) && eq(aD(p.B, p.gB1, p.C), 20) && eq(aD(p.C, p.B, p.gC2), 20) && eq(aD(p.C, p.gC2, p.D), 45);`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('平行な2直線に1つの直線が交わると、角はどうなるだろう'),
      K('今日の問い', '右の図で、ℓ∥m である。∠a、∠b、∠c を分度器ではかって、同位角（∠a と ∠b）や錯角（∠b と ∠c）の大きさを、くらべよう。', 2),
      F(5, GEO(mkFig(T_W))),
      T('①', '自分の考え（3分）　はかった角度と、気づいたことを書こう。', 1),
      B(4, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('2直線に1つの直線が交わるとき、\n【平行線の性質】2直線が平行ならば、{{同位角}}は等しい。{{錯角}}も等しい。\n【平行線になる条件】{{同位角}}か{{錯角}}が等しければ、2直線は{{平行}}である。', 5, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '下のア、イの図で、2直線 ℓ、m は、平行だろうか。角の大きさをくらべて、表を完成させよう。', 2),
      F(5, GEO(mkFig(T_EA), { w: 1 }), GEO(mkFig(T_EB), { w: 1 })),
      TB('', ['ア', 'イ'], [['くらべた角', ['{{同位角}}', '{{錯角}}']], ['平行か（○ か ×）', ['{{○}}', '{{×}}']]], { hw: 40, width: 70 })
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2直線が平行ならば、{{同位角}}は等しく、{{錯角}}も等しい。\n② {{同位角}}か{{錯角}}が等しければ、2直線は{{平行}}である。\n③ 2直線 ℓ と m が平行であることを、{{ℓ∥m}}と書く。\n④ 一直線をつくる 2つの角の和は、{{180°}}である。', 4, { label: 'ことば' }),
      F(5, cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D1[0][1])))), '図1'), cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D1[1][1])))), '図2'),
        cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D2[0][1])))), '図3'), cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D2[1][1])))), '図4')),
      C2([
        T('（1）', 'ℓ∥m のとき、図1・図2の ∠x の大きさを求めよう。', 2),
        B(2, A_D1)
      ], [
        T('（2）', '図3・図4で、ℓ と m は平行だろうか。○ か × で答えよう。', 2),
        B(2, A_D2)
      ], '1:1'),
      MA('【説明】性質と条件のちがいを、「ならば」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      HD('使ってみる', '平行線の性質を使って、考えよう。'),
      F(5, cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D3)))), '図5'), cap(GEO(mkFig(auto(Object.assign({ pad: 6 }, Z_D4)))), '図6'),
        cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D5)))), '図7', { w: 1.3 }), cap(GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, T_D6)))), '図8')),
      C2([
        T('（3）', 'ℓ∥m のとき、図5の ∠x の大きさを求めよう。', 2),
        B(3, A_D3)
      ], [
        T('（4）', 'ℓ∥m のとき、図6の ∠x の大きさを求めよう。', 2),
        B(3, A_D4)
      ], '1:1'),
      C2([
        T('（5）', 'ℓ∥m のとき、図7で、x の値を求めよう。', 2),
        B(3, A_D5)
      ], [
        T('（6）', 'ℓ∥m のとき、図8の ∠x の大きさを求めよう。', 2),
        B(3, A_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：平行な2直線のまわりの角を、全部しらべよう。'),
      C2([
        T('（7）', 'ℓ∥m で ∠a＝65° のとき、ほかの 7つの角の大きさを、分度器を使わずに求めよう。', 2),
        TB('', ['∠b', '∠c', '∠d', '∠e', '∠f', '∠g', '∠h'], [['大きさ', ['', '', '', '', '', '', '']]], { hw: 16 }),
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        F(10, GEO(mkFig(T_TH)))
      ], '3:2'),
      T('', '錯角 ∠c と ∠e が等しくなるのは、なぜだろう。わけを説明しよう。（等しい角に印をつけて、使った性質も書こう。）', 2),
      B(8, ''),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、ℓ∥m のとき、∠x を求めよう。', 1),
        B(6, A_D8)
      ], [
        F(7, GEO(mkFig(Z_D8)))
      ], '3:2'),
      MA('① B や C を通って ℓ に平行な直線をひくと、等しい角が見つからないかな。\n② 平行線の錯角を使って、40° や 55° を、ほかの場所に移せないかな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '下の図①〜③で、ℓ∥m のとき、∠x の大きさを求めよう。（3点）', 1),
      F(4, ...T_Q1.map(([k, o]) => GEO(mkFig(auto(Object.assign({ r: 3.2, pad: 6 }, o)))))),
      B(2, A_Q1),
      C2([
        T('（2）', '右の図で、ℓ と m は平行だろうか。\nわけも答えよう。（2点）', 2),
        B(2, A_Q2)
      ], [
        F(4, GEO(mkFig(auto(T_Q2))))
      ], '3:2'),
      T('（3）', '次のア〜ウのうち、正しいものをすべて選ぼう。（2点）\nア 2直線が平行ならば、錯角は等しい。\nイ 同位角が等しければ、2直線は平行である。\nウ 錯角が等しくなければ、2直線は平行である。', 4),
      B(1, A_Q3),
      C2([
        T('（4）', '右の図で、ℓ∥m のとき、\n∠x の大きさを求めよう。（3点）', 2),
        B(3, A_Q4)
      ], [
        F(5, GEO(mkFig(auto(Z_Q4))))
      ], '3:2'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図で、ℓ∥m のとき、∠x の大きさを求めよう。', 2),
        B(4, A_QC)
      ], [
        F(7, GEO(mkFig(Z_QC)))
      ], '3:2')
    ]
  });
})();
