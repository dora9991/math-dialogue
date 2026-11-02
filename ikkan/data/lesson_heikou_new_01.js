/* 平行と合同（新しい形） 第1時：2直線が交わってできる角には、どんな関係があるだろう。
   元：data/lesson_heikou_01.js（前の形）。題・めあて・数値・図の関数・checks を引きつぎ、次のように組みかえた。
   ・ワークシートは A4 1枚：問いは1つ（∠a＝50° のとき ∠b・∠c・∠d を、分度器なしで求め、向かい合う角の関係を見つける。図は全部印刷）。
     個人3分 → ペア3分 → ことば（対頂角・同位角・錯角）→ 例題（∠d の対頂角・同位角・錯角。空欄あり）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう：同位角・錯角は、いつも等しいか。答えなし）・チャレンジ★★（二等分線と対頂角。ヒントカードつき）。
   ・考えよう（演習プリント（7））の答えは、どこにも書かない。同位角・錯角が「平行のとき等しい」ことは、ここでは言わない（次の時間）。
   ・図は角度から座標を計算してかいた（GEO）。角の大きさ・位置関係（対頂角・同位角・錯角）は、座標から計算し直して checks で確かめた。
   ・変えた数値：演習プリント（6）を ∠a＋∠c＝140°（∠b＝110°）にした（元は 100°。小テスト（4）が元の数値のまま残るので、重ならないようにした）。
   検算：node tools/verify.cjs heikou_new-01　／　見た目：node tools/check.cjs <出力先> heikou_new-01 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG, GEO } = IK.b;
  const J = JSON.stringify;

  /* ---------------- 図の道具（座標は、角度から計算する。checks でも同じものを使って、座標から角を計算し直す） ----------------
     rad・pp(p, r, d)：点 p から、向き d（度）に r だけ進んだ点　nd：0〜360 度にそろえる　aD(v, p, q)：∠pvq の大きさ（度）
     XL({ dirs, t, names, R, scale, r, lr })：1点 O で交わる直線（向き dirs）。すき間の角（部屋）を、左まわりに 0、1、2、… とよぶ。t＝{ 部屋の番号: 字 }
        すべての角に字をつけるときは、弧をかかず、字だけ（弧が重なって円になるため）
     TRV({ th, pl, pm, h, t, par, cap, … })：直線 ℓ（上）・m（下）に、直線 n が交わる図。th＝n の向き、pl・pm＝ℓ・m の向き（同じなら平行）。
        P＝ℓ と n の交点、Q＝m と n の交点。角 a〜h：P のまわりが a（右上）b（左上）c（左下）d（右下）、Q のまわりが e（右上）f（左上）g（左下）h（右下） */
  const rad = d => d * Math.PI / 180;
  const pp = (p, r, d) => [p[0] + r * Math.cos(rad(d)), p[1] + r * Math.sin(rad(d))];
  const nd = d => ((d % 360) + 360) % 360;
  const aD = (v, p, q) => { const d = Math.abs(Math.atan2(p[1] - v[1], p[0] - v[0]) - Math.atan2(q[1] - v[1], q[0] - v[0])) * 180 / Math.PI; return d > 180 ? 360 - d : d; };
  const XL = o => {
    const R = o.R || 4, rays = [];
    o.dirs.forEach(d => { rays.push(nd(d), nd(d + 180)); });
    rays.sort((x, y) => x - y);
    const n = rays.length, pts = { O: [0, 0] };
    rays.forEach((d, i) => { pts['r' + i] = pp([0, 0], R, d); });
    const at = d => 'r' + rays.indexOf(nd(d));
    const segs = o.dirs.map((d, i) => [at(d + 180), at(d), o.names && o.names[i] ? { lab: o.names[i] } : {}]);
    const keys = Object.keys(o.t || {}), only = keys.length >= n, ang = [], txt = [];
    keys.forEach(j => {
      j = +j;
      const sz = ((rays[(j + 1) % n] - rays[j]) % 360 + 360) % 360, len = String(o.t[j]).replace(/\{\{|\}\}/g, '').length, mid = rays[j] + sz / 2;
      if (only) { const lr = o.lr && o.lr[j] != null ? o.lr[j] : 5.6 + (sz < 60 ? (60 - sz) / 12 : 0); txt.push({ p: 'O', t: o.t[j], dx: lr * Math.cos(rad(mid)), dy: -lr * Math.sin(rad(mid)) }); return; }
      const lr = o.lr && o.lr[j] != null ? o.lr[j] : (len > 3 && sz < 60 ? R * (o.scale || 3) + 6 : 7.6 + (sz < 60 ? (60 - sz) / 6 : 0) + (len > 3 ? 5 : 0));
      ang.push({ k: j, at: 'O', a: 'r' + j, b: 'r' + ((j + 1) % n), t: o.t[j], r: o.r || 4, lr });
    });
    const A = {}; for (let j = 0; j < n; j++) A[j] = ['O', 'r' + j, 'r' + ((j + 1) % n)];
    const spec = { pts, segs, ang, A, scale: o.scale, pad: o.pad == null ? 7 : o.pad };
    if (txt.length) spec.txt = txt;
    return spec;
  };
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
      if (only) { const lr = o.lr && o.lr[k] != null ? o.lr[k] : 5.4; txt.push({ p: v, t: o.t[k], dx: lr * Math.cos(mid), dy: -lr * Math.sin(mid) }); return; }
      ang.push({ k, at: v, a: p, b: q, t: o.t[k], r: o.r || 4, lr: o.lr && o.lr[k] != null ? o.lr[k] : (String(o.t[k]).length > 2 ? 8.6 : 6.8) });
    });
    if (o.cap) txt.push({ p: 'l1', t: o.cap, dx: -1, dy: -4.5, anchor: 'start' });
    const nm = o.names || ['ℓ', 'm'];
    const spec = { pts, segs: [['l1', 'l2', { lab: nm[0] }], ['m1', 'm2', { lab: nm[1] }], ['n1', 'n2']], ang, A: AN, scale: o.scale, pad: o.pad == null ? 7 : o.pad };
    if (txt.length) spec.txt = txt;
    if (o.par) spec.par = [['p1', 'p2', 1], ['q1', 'q2', 1]];
    return spec;
  };
  // checks の式の中に、そのまま埋めこむ：座標から角を計算し直す
  const LIB = 'const rad = ' + rad + '; const pp = ' + pp + '; const nd = ' + nd + '; const aD = ' + aD + '; const XL = ' + XL + '; const TRV = ' + TRV + ';' +
    ' const val = (s, k) => { const g = s.A[k]; return aD(s.pts[g[0]], s.pts[g[1]], s.pts[g[2]]); };' +
    ' const par = s => Math.abs((s.pts.l2[0] - s.pts.l1[0]) * (s.pts.m2[1] - s.pts.m1[1]) - (s.pts.l2[1] - s.pts.l1[1]) * (s.pts.m2[0] - s.pts.m1[0])) < 1e-9;' +
    ' const eq = (x, y) => Math.abs(x - y) < 1e-6;' +
    ' const mid = (s, k) => { const g = s.A[k], V = s.pts[g[0]]; const u = z => { const L = Math.hypot(s.pts[z][0] - V[0], s.pts[z][1] - V[1]); return [(s.pts[z][0] - V[0]) / L, (s.pts[z][1] - V[1]) / L]; }; return [u(g[1])[0] + u(g[2])[0], u(g[1])[1] + u(g[2])[1]]; };' +
    ' const sn = (s, k) => { const n = [s.pts.P[0] - s.pts.Q[0], s.pts.P[1] - s.pts.Q[1]], m = mid(s, k); return Math.sign(n[0] * m[1] - n[1] * m[0]); };' +
    ' const sl = (s, k) => Math.sign(mid(s, k)[1]);' +
    ' const inn = (s, k) => (s.A[k][0] === "P" ? sl(s, k) < 0 : sl(s, k) > 0);' +
    ' const dou = (s, x, y) => s.A[x][0] !== s.A[y][0] && sn(s, x) === sn(s, y) && sl(s, x) === sl(s, y);' +
    ' const saku = (s, x, y) => s.A[x][0] !== s.A[y][0] && sn(s, x) === -sn(s, y) && inn(s, x) && inn(s, y);' +
    ' const tai = (s, x, y) => s.A[x][0] === s.A[y][0] && Math.abs(mid(s, x)[0] * mid(s, y)[1] - mid(s, x)[1] * mid(s, y)[0]) < 1e-9 && mid(s, x)[0] * mid(s, y)[0] + mid(s, x)[1] * mid(s, y)[1] < 0;' +
    ' const L8 = "abcdefgh".split("");';
  const chk = (label, body) => '/* ' + label + ' */ (() => { ' + LIB + ' ' + body + ' })()';
  const f = o => (o.dirs ? XL(o) : TRV(o));
  // 図の上に「図1」などの名前をつける（GEO は caption を読まないので、図の中に書く）
  const cap = (fig, text, fo) => SVG((W, H, h) => h.tx(W / 2, 3.5, text, 3, 'middle', ' class="cap"') + `<g transform="translate(0 4.4)">${fig.svg(W, H - 4.4, h)}</g>`, fo);

  /* ---------------- 問題のデータ（図・答えは、ここから作る） ---------------- */
  const ALL = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'e', f: 'f', g: 'g', h: 'h' };
  const X_W = { dirs: [20, 70], t: { 0: 'a', 1: 'b', 2: 'c', 3: 'd' }, names: ['ℓ', 'm'], scale: 5.2 };            // 今日の問い：∠a＝50°。部屋 0＝a、1＝b、2＝c、3＝d
  const T_E = { th: 62, pl: 0, pm: -14, t: ALL, scale: 5.0 };                                                      // 例題・演習（2）・小テスト（2）：8つの角（ℓ と m は平行でない）
  const T_TH = [['ア', { th: 70, pl: 0, pm: 0 }, 70, 70], ['イ', { th: 62, pl: 0, pm: -18 }, 62, 80], ['ウ', { th: 115, pl: 0, pm: 20 }, 115, 95]];   // 考えよう：[名, 図, ∠a, ∠e]
  const thFig = (o, a, e, cp) => Object.assign({ t: { a: a + '°', c: 'c', e: e + '°' }, scale: 4.0, r: 3.6, cap: cp }, o);
  const X_1 = [['図1', { dirs: [0, 65], t: { 0: '65°', 2: 'x' } }, 65], ['図2', { dirs: [0, 40], t: { 0: '40°', 1: 'x' } }, 140]];   // 演習（1）
  const X_3 = { dirs: [0, 30, 110], t: { 0: '30°', 1: '80°', 2: 'x' } };                                           // 演習（3）：x＝70
  const X_4 = { dirs: [0, 40, 95], t: { 0: 'x', 2: '85°', 4: '55°' } };                                            // 演習（4）：x＝40
  const X_5 = { dirs: [0, 80], t: { 0: '(3x−10)°', 2: '(2x+20)°' } };                                              // 演習（5）：x＝30（80°）
  const X_6 = { dirs: [0, 70], t: { 0: 'a', 1: 'b', 2: 'c', 3: 'd' }, names: ['ℓ', 'm'] };                          // 演習（6）：∠a＋∠c＝140° → ∠b＝110°
  // 演習（8）：直線 AB・CD が O で交わる。∠AOC＝64°。OE は ∠AOC の二等分線。OF は EO をのばした半直線
  const BIS = (() => {
    const O = [0, 0], R = 4, c = 180 - 64, pts = { O, A: pp(O, R, 180), B: pp(O, R, 0), C: pp(O, R, c), D: pp(O, R, c + 180), E: pp(O, R, 180 - 32), F: pp(O, R, 180 - 32 + 180) };
    return { pts, segs: [['A', 'B'], ['C', 'D'], ['E', 'F']], vl: { A: ['A', 180], B: ['B', 0], C: ['C', c], D: ['D', c + 180], E: ['E', 148], F: ['F', 328], O: ['O', 270, 3] },
      ang: [{ k: 'AOE', at: 'O', a: 'A', b: 'E', n: 1, r: 4 }, { k: 'EOC', at: 'O', a: 'E', b: 'C', n: 1, r: 4 }, { k: 'AOC', at: 'O', a: 'A', b: 'C', r: 8.5 }], scale: 5.2, pad: 8 };
  })();
  const X_Q1 = [['①', { dirs: [0, 70], t: { 0: '70°', 2: 'x' } }, 70], ['②', { dirs: [0, 55], t: { 0: '55°', 1: 'x' } }, 125], ['③', { dirs: [0, 45, 120], t: { 0: '45°', 1: '75°', 2: 'x' } }, 60]];   // 小テスト（1）
  const X_Q3 = { dirs: [0, 50], t: { 0: 'a', 1: 'b', 2: 'c', 3: 'd' }, names: ['ℓ', 'm'] };                          // 小テスト（3）（4）：∠a＋∠c＝100° → ∠b＝130°
  const X_QC = { dirs: [0, 80, 115], t: { 0: '(4x−20)°', 2: '(x+40)°', 4: '(x+10)°' } };                           // チャレンジ：x＝25（部屋 0・2・4：80°・65°・35°）

  const A_W = '（例）∠b＝180°−50°＝130°\n∠c＝180°−130°＝50°　　∠d＝180°−50°＝130°\n向かい合う角は等しい。（∠a＝∠c、∠b＝∠d）\nわけ：∠a＋∠b＝180°、∠c＋∠b＝180° だから　∠a＝∠c';
  const A_E = '対頂角 … X の形\n同位角 … F の形　　錯角 … Z の形';
  const A_D1 = '図1 … 65°（対頂角）\n図2 … 180°−40°＝140°';
  const A_D2 = '① ∠e　② ∠g　③ ∠d　④ ∠f';
  const A_D3 = '180°−30°−80°＝70°';
  const A_D4 = 'x の対頂角を使うと、85°、x、55° が\n一直線にならぶ。\n180°−85°−55°＝40°';
  const A_D5 = '対頂角は等しいから\n3x−10＝2x+20　　x＝30';
  const A_D6 = '対頂角は等しいから　∠a＝∠c\n∠a＝140°÷2＝70°\n∠b＝180°−70°＝110°';
  const A_D8 = '∠AOE＝64°÷2＝32°\n∠BOF は ∠AOE の対頂角だから　32°\n（AB と EF が、O で交わっている。）';
  const A_Q1 = '① 70°　② 180°−55°＝125°\n③ 180°−45°−75°＝60°';
  const A_Q2 = '∠a の同位角 … ∠e\n∠d の錯角 … ∠f';
  const A_Q3 = '∠a＋∠b＝180° より　∠a＝180°−∠b\n∠c＋∠b＝180° より　∠c＝180°−∠b\nよって　∠a＝∠c';
  const A_Q4 = '対頂角は等しいから　∠a＝∠c＝50°\n∠b＝180°−50°＝130°';
  const A_QC = '対頂角を使うと、3つの角が一直線にならぶ。\n(4x−20)＋(x＋40)＋(x＋10)＝180\n6x＋30＝180　　x＝25（角は 80°、65°、35°）';

  IK.lesson('heikou_new-01', {
    unit: 'heikou_new', unitName: '平行と合同（新しい形）', form: 'new', no: '第1時', title: '2直線が交わってできる角には、どんな関係があるだろう',
    summary: '2直線が交わってできる角を、一直線の角が 180° であることをもとに調べ、対頂角が等しいことをとらえる。同位角・錯角のことばを知る。考えようは、同位角・錯角がいつも等しいか。',
    head: '平行と合同　第1時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ℓ・m が交わる。∠a＝50°、∠b＝130°、∠c＝50°、∠d＝130°（座標から）。向かい合う角が等しい。となり合う角の和が 180°
      chk('第1時 今日の問い', `const s = XL(${J(X_W)}); const a = val(s, 0), b = val(s, 1), c = val(s, 2), d = val(s, 3); return eq(a, 50) && eq(b, 130) && eq(c, 50) && eq(d, 130) && eq(180 - a, b) && eq(180 - b, c) && eq(180 - a, d) && eq(a, c) && eq(b, d) && eq(a + b + c + d, 360) && ${J(A_W)}.includes('130°') && ${J(A_W)}.includes('50°');`),
      // 例題：∠d の対頂角・同位角・錯角を、座標から探す → ∠b・∠h・∠f（問題文の空欄の答え）。ℓ と m は平行でない
      chk('第1時 例題', `const s = TRV(${J(T_E)}); const pick = fn => L8.filter(k => k !== 'd' && fn(s, 'd', k)).join(''); return !par(s) && pick(tai) === 'b' && pick(dou) === 'h' && pick(saku) === 'f' && !eq(val(s, 'd'), val(s, 'h')) && !eq(val(s, 'd'), val(s, 'f')) && eq(val(s, 'd') + val(s, 'a'), 180);`),
      // 考えよう（答えは載せない）：ア（平行）a＝e＝70°、イ a＝62°・e＝80°、ウ a＝115°・e＝95°。∠c＝∠a（対頂角）。同位角が等しいときは錯角も等しい
      chk('第1時 考えよう', `const D = ${J(T_TH)}; return D.every(([k, o, a, e]) => { const s = TRV(Object.assign({ t: { a: 'a', c: 'c', e: 'e' } }, o)); return tai(s, 'a', 'c') && eq(val(s, 'a'), a) && eq(val(s, 'e'), e) && eq(val(s, 'c'), a) && (eq(val(s, 'a'), val(s, 'e')) === eq(val(s, 'c'), val(s, 'e'))) && (par(s) === (a === e)) && dou(s, 'a', 'e') && saku(s, 'c', 'e'); }) && D.filter(r => r[2] === r[3]).length === 1;`),
      // （1）図1：対頂角 65°　図2：一直線 180°−40°＝140°（座標から）
      chk('第1時 （1）', `const D = ${J(X_1)}; return D.every(([k, o, x]) => { const s = XL(o), ks = Object.keys(o.t); const xk = ks.find(j => o.t[j] === 'x'); return eq(val(s, xk), x); }) && eq(180 - 40, 140) && ${J(A_D1)}.includes('65°') && ${J(A_D1)}.includes('140°');`),
      // （2）図3（T_E）：∠a の同位角 ∠e、∠c の同位角 ∠g、∠f の錯角 ∠d、∠h の対頂角 ∠f（位置関係を、座標から探す）
      chk('第1時 （2）', `const s = TRV(${J(T_E)}); const pick = (fn, k) => L8.filter(j => j !== k && fn(s, k, j)).join(''); return pick(dou, 'a') === 'e' && pick(dou, 'c') === 'g' && pick(saku, 'f') === 'd' && pick(tai, 'h') === 'f';`),
      // （3）30°・80°・x が一直線にならぶ → x＝70°（座標から）
      chk('第1時 （3）', `const s = XL(${J(X_3)}); return eq(val(s, 0), 30) && eq(val(s, 1), 80) && eq(val(s, 2), 70) && eq(val(s, 0) + val(s, 1) + val(s, 2), 180) && eq(180 - 30 - 80, 70);`),
      // （4）85° の対頂角と x の対頂角と 55° の対頂角…が一直線 → x＝40（座標から。部屋 0・2・4）
      chk('第1時 （4）', `const s = XL(${J(X_4)}); return eq(val(s, 0), 40) && eq(val(s, 2), 85) && eq(val(s, 4), 55) && eq(val(s, 0) + val(s, 2) + val(s, 4), 180) && eq(val(s, 3), val(s, 0)) && eq(val(s, 2) + val(s, 3) + val(s, 4), 180) && eq(180 - 85 - 55, 40);`),
      // （5）3x−10＝2x+20：x を 0〜60 までしらべて x＝30 だけ。角は 80°（座標から）
      chk('第1時 （5）', `const s = XL(${J(X_5)}); const sol = []; for (let x = 0; x <= 60; x++) if (3 * x - 10 === 2 * x + 20) sol.push(x); return sol.join() === '30' && eq(val(s, 0), 3 * 30 - 10) && eq(val(s, 2), 2 * 30 + 20) && eq(val(s, 0), val(s, 2)) && eq(val(s, 0), 80);`),
      // （6）∠a＋∠c＝140° → ∠a＝∠c＝70°、∠b＝110°（座標：ℓ・m の向き 0°・70°）
      chk('第1時 （6）', `const s = XL(${J(X_6)}); return eq(val(s, 0), 70) && eq(val(s, 2), 70) && eq(val(s, 0) + val(s, 2), 140) && eq(val(s, 1), 110) && eq(val(s, 3), 110) && eq(180 - 70, 110) && eq(140 / 2, 70);`),
      // （8）∠AOE＝32°（二等分）、∠BOF＝32°。E・O・F が一直線
      chk('第1時 （8）', `const s = ${J(BIS)}, P = s.pts; const A = (v, p, q) => aD(P[v], P[p], P[q]); return eq(A('O', 'A', 'C'), 64) && eq(A('O', 'A', 'E'), 32) && eq(A('O', 'E', 'C'), 32) && eq(A('O', 'B', 'F'), 32) && eq(A('O', 'E', 'F'), 180) && eq(A('O', 'A', 'B'), 180) && eq(A('O', 'C', 'D'), 180);`),
      // 小テスト（1）①〜③　（2）　（3）（4）∠b＝130°　チャレンジ x＝25
      chk('第1時 小テスト（1）', `const D = ${J(X_Q1)}; return D.every(([k, o, x]) => { const s = XL(o), ks = Object.keys(o.t); return eq(val(s, ks.find(j => o.t[j] === 'x')), x); }) && eq(180 - 55, 125) && eq(180 - 45 - 75, 60);`),
      chk('第1時 小テスト（2）（4）', `const s = TRV(${J(T_E)}); const k = XL(${J(X_Q3)}); const pick = (fn, x) => L8.filter(j => j !== x && fn(s, x, j)).join(''); return pick(dou, 'a') === 'e' && pick(saku, 'd') === 'f' && eq(val(s, 'a') + val(s, 'd'), 180) && eq(val(s, 'a'), val(s, 'c')) && eq(val(k, 0) + val(k, 2), 100) && eq(val(k, 1), 130) && eq(val(k, 0), 50);`),
      chk('第1時 小テスト チャレンジ', `const s = XL(${J(X_QC)}); const x = 25; return eq(val(s, 0), 4 * x - 20) && eq(val(s, 2), x + 40) && eq(val(s, 4), x + 10) && eq(val(s, 0) + val(s, 2) + val(s, 4), 180) && [0, 5, 10, 20, 25, 30].filter(t => (4 * t - 20) + (t + 40) + (t + 10) === 180).join() === '25';`)
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('2直線が交わってできる角には、どんな関係があるだろう'),
      K('今日の問い', '2直線 ℓ、m が交わっている。∠a＝50° のとき、∠b、∠c、∠d は何度だろう。分度器を使わずに求めて、向かい合う角の関係を見つけよう。', 2),
      F(6, GEO(Object.assign({ size: 3.4 }, f(X_W)))),
      T('①', '自分の考え（3分）　求め方と、気づいたことを書こう。', 1),
      B(4, A_W),
      T('②', 'ペアの考え（3分）　自分とちがう求め方や気づきを書こう。', 1),
      B(3, ''),
      G(1),
      WD('2直線が交わってできる、向かい合う角を{{対頂角}}という。対頂角は{{等しい}}。\n2直線に1つの直線が交わるとき、同じ位置にある角を{{同位角}}、2直線の内側でななめ向かいにある角を{{錯角}}という。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      C2([
        K('例題', '∠d について、次の角を答えよう。\n（1）対頂角　∠{{b}}\n（2）同位角　∠{{h}}\n（3）錯角　∠{{f}}', 4),
        T('', '【見つけ方】形で、見分けよう。', 1),
        B(3, A_E)
      ], [
        F(8, GEO(f(T_E)))
      ], '3:2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 2直線が交わってできる、向かい合う角を{{対頂角}}といい、{{等しい}}。\n② 2直線に1つの直線が交わるとき、同じ位置にある角を{{同位角}}という。\n③ ② のとき、2直線の内側で、ななめ向かいにある角を{{錯角}}という。\n④ 一直線の角は{{180°}}である。', 4, { label: 'ことば' }),
      F(5, cap(GEO(f(Object.assign({ scale: 2.7, R: 5, r: 3.2, pad: 6 }, X_1[0][1]))), '図1'), cap(GEO(f(Object.assign({ scale: 2.7, R: 5, r: 3.2, pad: 6 }, X_1[1][1]))), '図2'),
        cap(GEO(f(Object.assign({}, T_E, { scale: 3.2 }))), '図3', { w: 1.6 })),
      C2([
        T('（1）', '図1・図2の ∠x の大きさを求めよう。', 2),
        B(2, A_D1)
      ], [
        T('（2）', '図3で、次の角を答えよう。\n① ∠a の同位角　② ∠c の同位角\n③ ∠f の錯角　　④ ∠h の対頂角', 3),
        B(1, A_D2)
      ], '1:1'),
      MA('【説明】同位角と錯角のちがいを、「位置」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '一直線の角や対頂角を使って、求めよう。'),
      F(5, cap(GEO(f(Object.assign({ scale: 2.7, R: 5, r: 3.2, pad: 6 }, X_3))), '図4'), cap(GEO(f(Object.assign({ scale: 2.7, R: 5, r: 3.2, pad: 6 }, X_4))), '図5'),
        cap(GEO(f(Object.assign({ scale: 2.7, R: 5, r: 3.2, pad: 6 }, X_5))), '図6'), cap(GEO(f(Object.assign({ scale: 2.7, R: 5, pad: 6 }, X_6))), '図7')),
      C2([
        T('（3）', '図4で、∠x の大きさを求めよう。', 1),
        B(3, A_D3)
      ], [
        T('（4）', '図5で、∠x の大きさを求めよう。', 1),
        B(3, A_D4)
      ], '1:1'),
      C2([
        T('（5）', '図6で、x の値を求めよう。', 2),
        B(3, A_D5)
      ], [
        T('（6）', '図7で、∠a＋∠c＝140° のとき、∠b の大きさを求めよう。', 2),
        B(3, A_D6)
      ], '1:1'),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：同位角や錯角は、いつも等しいといえるだろうか。'),
      T('（7）', '2直線 ℓ、m に、直線 n が交わっている。ア〜ウの図で、∠c の大きさを求めて、同位角（∠a と ∠e）や錯角（∠c と ∠e）が等しいか調べよう。', 2),
      F(6, ...T_TH.map(([k, o, a, e]) => GEO(f(thFig(o, a, e, k)), { w: 1 }))),
      TB('', ['ア', 'イ', 'ウ'], [['∠c の大きさ', ['', '', '']], ['同位角は等しいか', ['', '', '']], ['錯角は等しいか', ['', '', '']]], { hw: 50, width: 85 }),
      C2([
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        T('', '同位角が等しくなるのは、2直線が、どんなときだろう。予想しよう。', 2),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '右の図で、直線 AB と CD は点 O で交わっている。∠AOC＝64° で、OE は ∠AOC の二等分線、OF は EO をのばした半直線である。∠BOF の大きさを求めよう。理由も説明しよう。', 6),
        B(4, A_D8)
      ], [
        F(10, GEO(BIS))
      ], '3:2'),
      MA('① ∠BOF と大きさが等しい角は、図のなかにないかな。\n② ∠AOE は、∠AOC を、どう分けた角かな。', 2, { label: 'ヒントカード' })
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '下の図①〜③で、∠x の大きさを求めよう。（3点）', 1),
      F(4, ...X_Q1.map(([k, o]) => GEO(f(Object.assign({ scale: 2.7, R: 5, r: 3.2, pad: 6 }, o))))),
      B(2, A_Q1),
      C2([
        T('（2）', '右の図で、次の角を答えよう。（2点）\n∠a の同位角　　∠d の錯角', 2),
        B(2, A_Q2)
      ], [
        F(4, GEO(f(Object.assign({}, T_E, { scale: 3.4 }))))
      ], '3:2'),
      C2([
        T('（3）', '右の図で、∠a＝∠c であることを、「一直線の角は 180°」を使って説明しよう。（3点）', 3),
        B(4, A_Q3)
      ], [
        F(7, GEO(f(Object.assign({ scale: 3.6, R: 4 }, X_Q3))))
      ], '3:2'),
      T('（4）', '（3）の図で、∠a＋∠c＝100° のとき、∠b の大きさを求めよう。（2点）', 1),
      B(2, A_Q4),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      C2([
        T('（5）', '右の図のように、3直線が1点で交わっている。x の値を求めよう。', 3),
        B(4, A_QC)
      ], [
        F(7, GEO(f(Object.assign({ scale: 4.0 }, X_QC))))
      ], '3:2')
    ]
  });
})();
