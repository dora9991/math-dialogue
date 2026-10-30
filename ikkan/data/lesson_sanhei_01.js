/* 三平方の定理 第1時：直角三角形の3辺の長さには、どんな関係があるだろう。
   元：授業ナビ標準版 sanhei-01（探）。「方眼の上の直角三角形ア〜ウの3辺の上の正方形 P、Q、R の面積の関係」（課題）を「今日の問い」に、
   直角をはさむ2辺から斜辺の上の正方形の面積と斜辺の長さを求める練習を「例題」に、「正方形のかわりに半円をかいたらどうか」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（P、Q、R の面積の関係）。個人3分 → ペア3分 → ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・図は、頂点の座標から描いた。方眼の1目もり、正方形の面積、辺の長さは、checks で座標から Math.hypot・多角形の面積で計算し直した。
   ・授業ナビ（ワークシートの練習2cm と 4cm、演習プリントの 5cm と 12cm、6cm と 8cm）は、数を変えた（5-12-13 は、第3時の考えようの答えになるため、ここでは使わない）。
   検算：node tools/verify.cjs sanhei-01　／　見た目：node tools/check.cjs <出力先> sanhei-01 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828', INK = '#222';
  const f2 = n => String(Math.round(n * 100) / 100);
  // 字の幅のめやす（mm）。字の大きさ s
  const tw = (t, s) => [...String(t)].reduce((a, ch) => a + (/[0-9]/.test(ch) ? 0.62 : /[A-Za-z]/.test(ch) ? 0.58 : /[⺀-￿]/.test(ch) ? 1 : 0.6) * s, 0);
  const wOf = (str, s) => String(str).split(/(√\d+)/).filter(Boolean).reduce((a, p) => a + (p[0] === '√' ? 0.7 * s + (p.length - 1) * 0.56 * s : tw(p, s)), 0);

  // 図の中の字。「2√13cm」のように書くと、√ のあとの数字の上に線をひく（h.rich は √ に対応していないため、ここで描く）。c＝√ の線の色
  const lab = (h, x, y, str, s, anchor, c) => {
    const ps = String(str).split(/(√\d+)/).filter(Boolean), dw = p => (p.length - 1) * 0.56 * s, w1 = p => (p[0] === '√' ? 0.7 * s + dw(p) : tw(p, s));
    const total = ps.reduce((a, p) => a + w1(p), 0);
    let cur = anchor === 'start' ? x : anchor === 'end' ? x - total : x - total / 2, out = '';
    ps.forEach(p => {
      if (p[0] === '√') {
        out += `<path d="M${f2(cur)},${f2(y - 0.3 * s)}L${f2(cur + 0.12 * s)},${f2(y - 0.38 * s)}L${f2(cur + 0.3 * s)},${f2(y + 0.06 * s)}L${f2(cur + 0.56 * s)},${f2(y - 0.84 * s)}L${f2(cur + 0.64 * s + dw(p))},${f2(y - 0.84 * s)}" fill="none" stroke="${c || INK}" stroke-width="0.24" stroke-linecap="round" stroke-linejoin="round"/>` + h.tx(cur + 0.62 * s, y, p.slice(1), s, 'start');
      } else out += h.tx(cur, y, h.svgMath(p), s, 'start');
      cur += w1(p);
    });
    return out;
  };

  // 点の座標（数学の座標。y が上）から図を描く。枠におさまるように、縦横比をそのままに拡大・縮小する
  //   pts＝{名前:[x,y]}  polys＝['ABC']（閉じた多角形）  segs＝[['A','B',{dash:1}]]  right＝[['C','B','A']]（C の直角のしるし）
  //   lens＝[{a:'B',b:'C',t:'6cm',flip:true,k:1.4,dx,dy,red:true}]（辺の長さ。字は図形の外がわ。red＝解答のとき赤）
  //   angs＝[{at:'B',a:'C',b:'A',t:'45°',r:5,lr:9}]（角の弧と字）  vn＝'ABC'（頂点の名前を書く）  names＝{A:向き(度)}
  //   cap＝図の名前  w＝図の幅の割合  scale＝1目もりの mm  pad＝まわりの余白  under・extra＝(h,X,Y,s)=>'SVG'（さきに描く・あとに描く）
  const FIG = o => SVG((W, H, h) => {
    const P = o.pts, pt = k => (Array.isArray(k) ? k : P[k]);
    const all = Object.keys(P).map(k => P[k]).concat(o.ext || []);
    const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pd = o.pad == null ? 9 : o.pad, capH = o.cap ? 5 : 0, bw = Math.max(x1 - x0, 1e-6), bh = Math.max(y1 - y0, 1e-6);
    const aw = W - 2 * pd, ah = H - capH - 2 * pd, s = o.scale || Math.min(aw / bw, ah / bh);
    const ox = pd + (aw - bw * s) / 2 - x0 * s, oy = capH + pd + (ah - bh * s) / 2 + y1 * s;
    const X = x => ox + x * s, Y = y => oy - y * s, sx = k => X(pt(k)[0]), sy = k => Y(pt(k)[1]);
    const cn = [...(o.polys && o.polys[0] ? o.polys[0] : Object.keys(P).join(''))], cen = [cn.reduce((a, k) => a + P[k][0], 0) / cn.length, cn.reduce((a, k) => a + P[k][1], 0) / cn.length];
    let out = o.cap ? h.tx(W / 2, 3.8, o.cap, 3.2, 'middle', ' class="cap"') : '';
    if (o.under) out += o.under(h, X, Y, s);
    (o.polys || []).forEach(pl => { out += `<polygon points="${[...pl].map(k => f2(sx(k)) + ',' + f2(sy(k))).join(' ')}" fill="none" stroke="${INK}" stroke-width="0.38" stroke-linejoin="round"/>`; });
    (o.segs || []).forEach(([a, b, op]) => { op = op || {}; out += h.ln(sx(a), sy(a), sx(b), sy(b), INK, op.w || 0.32, (op.dash ? ' stroke-dasharray="1.4 1"' : '') + ' stroke-linecap="round"'); });
    if (o.extra) out += o.extra(h, X, Y, s);
    (o.right || []).forEach(([v, a, b]) => {
      const vx = sx(v), vy = sy(v), u = [sx(a) - vx, sy(a) - vy], w = [sx(b) - vx, sy(b) - vy], lu = Math.hypot(u[0], u[1]), lw = Math.hypot(w[0], w[1]), r = 2.4;
      const p1 = [vx + u[0] / lu * r, vy + u[1] / lu * r], p3 = [vx + w[0] / lw * r, vy + w[1] / lw * r], p2 = [p1[0] + p3[0] - vx, p1[1] + p3[1] - vy];
      out += `<polyline points="${f2(p1[0])},${f2(p1[1])} ${f2(p2[0])},${f2(p2[1])} ${f2(p3[0])},${f2(p3[1])}" fill="none" stroke="${INK}" stroke-width="0.28"/>`;
    });
    (o.angs || []).forEach(g => {
      const vx = sx(g.at), vy = sy(g.at), ta = Math.atan2(sy(g.a) - vy, sx(g.a) - vx), tb = Math.atan2(sy(g.b) - vy, sx(g.b) - vx);
      let d = tb - ta; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const r = g.r || 5, tm = ta + d / 2, lr = g.lr || r + 4;
      out += `<path d="M${f2(vx + r * Math.cos(ta))},${f2(vy + r * Math.sin(ta))}A${r},${r} 0 0 ${d > 0 ? 1 : 0} ${f2(vx + r * Math.cos(tb))},${f2(vy + r * Math.sin(tb))}" fill="none" stroke="${INK}" stroke-width="0.28"/>`;
      if (g.t) out += lab(h, vx + lr * Math.cos(tm), vy + lr * Math.sin(tm) + 1.0, g.t, 2.9, 'middle');
    });
    (o.lens || []).forEach(L => {
      const ax = sx(L.a), ay = sy(L.a), bx = sx(L.b), by = sy(L.b), mx = (ax + bx) / 2, my = (ay + by) / 2, d = Math.hypot(bx - ax, by - ay) || 1;
      let nx = -(by - ay) / d, ny = (bx - ax) / d;
      if ((mx - X(cen[0])) * nx + (my - Y(cen[1])) * ny < 0) { nx = -nx; ny = -ny; }
      if (L.flip) { nx = -nx; ny = -ny; }
      const sz = L.s || 3.1, off = (L.k == null ? 1.4 : L.k) + Math.abs(nx) * wOf(L.t, sz) / 2 + Math.abs(ny) * sz * 0.5;
      const html = lab(h, mx + nx * off + (L.dx || 0), my + ny * off + sz * 0.35 + (L.dy || 0), L.t, sz, 'middle', L.red ? RED : INK);
      out += L.red ? h.ans(html) : html;
    });
    [...(o.vn || '')].forEach(k => {
      const v = P[k], nm = o.names || {}, an = nm[k] != null ? nm[k] * Math.PI / 180 : Math.atan2(v[1] - cen[1], v[0] - cen[0]), kk = o.vk || 3.8;
      out += h.tx(sx(k) + kk * Math.cos(an), sy(k) - kk * Math.sin(an) + 1.1, k, 3.3, 'middle', ' class="pl"');
    });
    return out;
  }, o.w ? { w: o.w } : undefined);

  // 直角三角形（直角は左下の C。a＝横の辺 CB、b＝たての辺 CA）。ha・vb・hy＝辺の字、angB・angA＝B・A のところの角の字、cap＝図の名前
  const RT = (a, b, o) => {
    o = o || {};
    const lens = [['C', 'B', o.ha], ['C', 'A', o.vb], ['B', 'A', o.hy]].filter(t => t[2]).map(t => ({ a: t[0], b: t[1], t: t[2] }));
    const angs = [];
    if (o.angB) angs.push({ at: 'B', a: 'C', b: 'A', t: o.angB, r: o.angBr || 6, lr: o.angBlr || 11 });
    if (o.angA) angs.push({ at: 'A', a: 'C', b: 'B', t: o.angA, r: o.angAr || 6, lr: o.angAlr || 11 });
    return FIG({ pts: { C: [0, 0], B: [a, 0], A: [0, b] }, polys: ['CBA'], right: [['C', 'B', 'A']], lens, angs, vn: o.vn, names: o.names, cap: o.cap, scale: o.scale, pad: o.pad });
  };

  // 方眼（1目もり 1cm）の上の直角三角形（直角をはさむ辺 a＝横、b＝たて）と、3辺の上の正方形 P（横の辺）・Q（たての辺）・R（斜辺）。
  // u＝1目もりの mm。解答を表示したときだけ、面積（赤）が出る
  const SQ3 = (a, b, cap, u) => SVG((W, H, h) => {
    const x0 = -b, x1 = a + b, y0 = -a, y1 = a + b, capH = cap ? 5 : 0;
    const s = u || Math.min((W - 4) / (x1 - x0), (H - capH - 2) / (y1 - y0));
    const ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = capH + 1.5 + y1 * s;
    const X = x => ox + x * s, Y = y => oy - y * s;
    let o = cap ? h.tx(W / 2, 3.8, cap, 3.2, 'middle', ' class="cap"') : '';
    for (let i = x0; i <= x1; i++) o += h.ln(X(i), Y(y0), X(i), Y(y1), '#c3c8cf', 0.15);
    for (let j = y0; j <= y1; j++) o += h.ln(X(x0), Y(j), X(x1), Y(j), '#c3c8cf', 0.15);
    const poly = (ps, fill, w) => `<polygon points="${ps.map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="${fill}" fill-opacity="0.16" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round"/>`;
    o += poly([[0, 0], [a, 0], [a, -a], [0, -a]], '#2a6fb0', 0.42) + poly([[0, 0], [0, b], [-b, b], [-b, 0]], '#2a6fb0', 0.42) + poly([[0, b], [a, 0], [a + b, a], [b, a + b]], '#d9822b', 0.42);
    o += poly([[0, 0], [a, 0], [0, b]], '#555', 0.6);
    const m = 2.4, p1 = [X(0) + m, Y(0)], p3 = [X(0), Y(0) - m];
    o += `<polyline points="${f2(p1[0])},${f2(p1[1])} ${f2(p1[0])},${f2(p3[1])} ${f2(p3[0])},${f2(p3[1])}" fill="none" stroke="${INK}" stroke-width="0.28"/>`;
    let an = '';
    const halo = ' stroke="#fff" stroke-width="0.9" paint-order="stroke" stroke-linejoin="round"';   // 字のまわりを白くぬいて、方眼の線と重ならないようにする
    // 正方形の名前（P・Q・R）と、解答のときだけ出る面積（赤）。1辺が 7mm より小さい正方形は、外がわ（Q は左、P は右）に書く
    [[[a / 2, -a / 2], 'P', a * a, a * s, 1], [[-b / 2, b / 2], 'Q', b * b, b * s, -1], [[(a + b) / 2, (a + b) / 2], 'R', a * a + b * b, 99, 0]].forEach(([c, n, v, side, out]) => {
      const w = 2.4 + tw('=' + v, 2.9), y = Y(c[1]) + 1.0;
      let x = X(c[0]) - w / 2;
      if (side < 7 && out > 0) x = X(c[0]) + side / 2 + 0.8;
      if (side < 7 && out < 0) x = X(c[0]) - side / 2 - 0.8 - w;
      o += h.tx(x, y, n, 3.1, 'start', ' class="pl"' + halo);
      an += h.tx(x + 2.4, y, '=' + v, 2.9, 'start', halo);
    });
    return o + h.ans(an);
  });

  // （7）直角三角形（3cm、4cm、5cm）の 3辺を直径とする半円。三角形の外がわにかく
  const semi = SVG((W, H, h) => {
    const A = [0, 4], Bp = [3, 0], C = [0, 0], x0 = -2, x1 = 4, y0 = -1.5, y1 = 4.5, pd = 4;
    const s = Math.min((W - 2 * pd) / (x1 - x0), (H - 2 * pd) / (y1 - y0)), ox = (W - (x1 - x0) * s) / 2 - x0 * s, oy = (H - (y1 - y0) * s) / 2 + y1 * s;
    const X = x => ox + x * s, Y = y => oy - y * s;
    const arc = (p, q, r, sweep) => `M${f2(X(p[0]))},${f2(Y(p[1]))}A${f2(r * s)},${f2(r * s)} 0 0 ${sweep} ${f2(X(q[0]))},${f2(Y(q[1]))}`;
    let o = `<polygon points="${[C, Bp, A].map(p => f2(X(p[0])) + ',' + f2(Y(p[1]))).join(' ')}" fill="none" stroke="${INK}" stroke-width="0.45" stroke-linejoin="round"/>`;
    o += `<path d="${arc(C, Bp, 1.5, 0)}" fill="none" stroke="${INK}" stroke-width="0.4"/><path d="${arc(A, C, 2, 0)}" fill="none" stroke="${INK}" stroke-width="0.4"/><path d="${arc(Bp, A, 2.5, 0)}" fill="none" stroke="${INK}" stroke-width="0.4"/>`;
    o += `<polyline points="${f2(X(0) + 2.4)},${f2(Y(0))} ${f2(X(0) + 2.4)},${f2(Y(0) - 2.4)} ${f2(X(0))},${f2(Y(0) - 2.4)}" fill="none" stroke="${INK}" stroke-width="0.28"/>`;
    o += lab(h, X(1.5), Y(0) + 5.2, '3cm', 3.1, 'middle') + lab(h, X(0) - 2, Y(2) + 1.1, '4cm', 3.1, 'end') + lab(h, X(1.5) + 6.5, Y(2) - 4.4, '5cm', 3.1, 'start');
    return o;
  });

  // 検算の道具（checks の式の先頭にそえる）：sh＝多角形の面積（座標から）、hy＝距離
  const LIB = 'const hy=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1]), sh=P=>Math.abs(P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;';
  // 方眼の上の 3つの正方形を、座標から確かめる：P＝横の辺の上、Q＝たての辺の上、R＝斜辺の上（C(0,0)、B(a,0)、A(0,b)）
  const SQ = '((a,b)=>{const C=[0,0],Bp=[a,0],A=[0,b],Pp=[[0,0],[a,0],[a,-a],[0,-a]],Qq=[[0,0],[0,b],[-b,b],[-b,0]],Rr=[A,Bp,[a+b,a],[b,a+b]]; return [sh(Pp),sh(Qq),sh(Rr),Rr.every((p,i)=>near(hy(p,Rr[(i+1)%4]),hy(A,Bp))),near((a+b)**2-4*sh([C,Bp,A]),sh(Rr))];})';

  IK.lesson('sanhei-01', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第1時', title: '直角三角形の3辺の長さには、どんな関係があるだろう',
    summary: '方眼の上の直角三角形の3辺を1辺とする正方形の面積を調べ、直角三角形の3辺の間の関係（三平方の定理 a²+b²＝c²）を見つける。斜辺の上の正方形の面積から、斜辺の長さを求める。',
    head: '三平方の定理　第1時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ア（a,b）＝(2,1)・イ(3,1)・ウ(3,2)。座標から、正方形 P・Q・R の面積（ア 4,1,5／イ 9,1,10／ウ 9,4,13）を出す。R は 4辺が等しく、(a+b)^2−三角形4つ でも同じ。どれも P+Q＝R
      `(() => { ${LIB} const f=${SQ}; const r=[f(2,1),f(3,1),f(3,2)]; return r.every(t=>t[3]&&t[4]) && r.map(t=>t.slice(0,3).join()).join(";")==="4,1,5;9,1,10;9,4,13" && r.every(t=>near(t[0]+t[1],t[2])); })()`,
      // 例題：直角をはさむ 2辺 3cm・4cm → 25（斜辺 5）、6cm・8cm → 100（10）、2cm・4cm → 20（2√5＝4.4721…）
      `(() => { ${LIB} return near(3*3+4*4,25) && near(hy([0,0],[0,0]),0) && near(Math.hypot(3,4),5) && near(6*6+8*8,100) && near(Math.hypot(6,8),10) && near(2*2+4*4,20) && near(Math.hypot(2,4),2*Math.sqrt(5)); })()`,
      // （1）図1（1,2）：P1・Q4・R5／図2（2,2）：4,4,8／図3（1,1）：1,1,2
      `(() => { ${LIB} const f=${SQ}; return [f(1,2),f(2,2),f(1,1)].map(t=>t.slice(0,3).join()).join(";")==="1,4,5;4,4,8;1,1,2"; })()`,
      // （2）7cm と 24cm → 斜辺 25
      'near(Math.hypot(7, 24), 25) && near(7 * 7 + 24 * 24, 625)',
      // （3）4cm と 7cm → R＝65、c＝√65　（4）3cm と 6cm → R＝45、c＝3√5
      'near(Math.hypot(4, 7) ** 2, 65) && near(Math.hypot(4, 7), Math.sqrt(65)) && near(Math.hypot(3, 6) ** 2, 45) && near(Math.hypot(3, 6), 3 * Math.sqrt(5))',
      // （5）斜辺の上 50、1辺の上 18 → 残りの辺の上 32、辺の長さ 4√2
      'near(50 - 18, 32) && near(Math.sqrt(32), 4 * Math.SQRT2)',
      // （6）面積 13 の正方形：a²+b²＝13 になる正の整数の組は (2,3) だけ
      'Array.from({ length: 4 }, (_, i) => i + 1).flatMap(a => Array.from({ length: 4 }, (_, j) => [a, j + 1])).filter(([a, b]) => a <= b && a * a + b * b === 13).join(";") === "2,3"',
      // （7）考えよう（答えは紙面に載せない）：3cm・4cm・5cm の辺を直径とする半円の面積は 9π/8・2π・25π/8 で、9π/8+2π＝25π/8
      'near(PI / 2 * 1.5 ** 2 + PI / 2 * 2 ** 2, PI / 2 * 2.5 ** 2) && near(Math.hypot(3, 4), 5)',
      // （8）3つの正方形の面積の和 200 → 2R＝200、R＝100、斜辺 10。1辺の上が 36 → もう 1辺の上が 64（8cm）。36+64＝100
      'near(200 / 2, 100) && near(Math.sqrt(100), 10) && near(100 - 36, 64) && near(Math.hypot(6, 8), 10) && near(36 + 64 + 100, 200)',
      // 小テスト（1）a,b＝(2,3)：P4・Q9・R13
      `(() => { ${LIB} const t=${SQ}(2,3); return t[3] && t[4] && t.slice(0,3).join()==="4,9,13"; })()`,
      // 小テスト（3）9cm と 12cm → 15、1cm と 2cm → √5　（4）40−15＝25、辺は 5
      'near(Math.hypot(9, 12), 15) && near(Math.hypot(1, 2), Math.sqrt(5)) && near(40 - 15, 25) && near(Math.sqrt(25), 5)',
      // 小テスト（5）チャレンジ：面積 25 の正方形で、辺が方眼の線の上にないもの → a²+b²＝25 になる正の整数の組は (3,4) だけ
      'Array.from({ length: 5 }, (_, i) => i + 1).flatMap(a => Array.from({ length: 5 }, (_, j) => [a, j + 1])).filter(([a, b]) => a <= b && a * a + b * b === 25).join(";") === "3,4"'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直角三角形の 3つの辺の長さの関係を、見つけよう'),
      K('今日の問い', '方眼（1目もり 1cm）の上の直角三角形ア〜ウの、3つの辺を 1辺とする正方形 P、Q、R をかいた。P、Q、R の面積には、どんな関係があるだろう。', 2),
      F(7, SQ3(2, 1, 'ア', 6), SQ3(3, 1, 'イ', 6), SQ3(3, 2, 'ウ', 6)),
      T('①', '自分の考え（3分）　面積の求め方と、見つけた関係を書こう。', 1),
      B(4, '（例）R は、囲む大きい正方形から、直角三角形 4つをひいて求める。\nア P＝4、Q＝1、R＝3×3−[[1/2]]×2×1×4＝5\nイ P＝9、Q＝1、R＝10　　ウ P＝9、Q＝4、R＝13\nどれも　P+Q＝R　になっている。'),
      T('②', 'ペアの考え（3分）　自分とちがう求め方・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('直角の向かいの辺を{{斜辺}}という。\n斜辺は、3つの辺で、いちばん{{長い}}。\n直角をはさむ 2辺を a、b、斜辺を c とすると\n{{a^2+b^2＝c^2}} が成り立つ。（三平方の定理）', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '直角をはさむ 2辺の長さから、斜辺の上の正方形の面積 R と、斜辺の長さ c を求め、表を完成させよう。（3cm と 4cm は見本）', 2),
      TB('直角をはさむ 2辺', ['3cm と 4cm', '6cm と 8cm', '2cm と 4cm'], [
        ['P+Q＝R（cm^2）', ['9+16＝25', '{{36+64＝100}}', '{{4+16＝20}}']],
        ['斜辺の長さ c（cm）', ['5', '{{10}}', '{{2√{5} }}']]
      ], { hw: 44 }),
      T('', '【斜辺のくふう】R の値から、斜辺の長さ c を求める式を書こう。', 1),
      B(3, 'R は c の上の正方形の面積だから　c^2＝R　　c＞0 より　c＝√{R}\n（例）R＝20 のとき　c＝√{20}＝2√{5}（cm）')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。（図の方眼は、1目もり 1cm）'),
      WD('① 直角の向かいの辺を{{斜辺}}といい、3つの辺で、いちばん{{長い}}。\n② 直角をはさむ 2辺を a、b、斜辺を c とすると、{{a^2+b^2＝c^2}} が成り立つ。\n③ ②の関係を、{{三平方の定理}}という。\n④ 斜辺の上の正方形の面積は、ほかの 2辺の上の正方形の面積の{{和}}に等しい。', 4, { label: 'ことば' }),
      F(5, SQ3(1, 2, '図1', 5.5), SQ3(2, 2, '図2', 5.5), SQ3(1, 1, '図3', 5.5)),
      C2([
        T('（1）', '図1〜図3で、P、Q、R の面積を求めよう。', 2),
        B(3, '図1 P＝1、Q＝4、R＝5\n図2 P＝4、Q＝4、R＝8\n図3 P＝1、Q＝1、R＝2')
      ], [
        T('（2）', '直角をはさむ 2辺が 7cm、24cm の直角三角形の、斜辺の長さを求めよう。', 3),
        B(2, 'c^2＝7^2+24^2＝625\nc＝25（cm）')
      ], '1:1'),
      MA('【説明】三平方の定理を、「面積」を使って、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '三平方の定理を使って、求めよう。'),
      C2([
        T('（3）', '直角をはさむ 2辺が 4cm、7cm のとき、斜辺の上の正方形の面積と、斜辺の長さを求めよう。', 3),
        B(2, 'R＝16+49＝65（cm^2）\nc＝√{65}（cm）')
      ], [
        T('（4）', '直角をはさむ 2辺が 3cm、6cm のとき、斜辺の上の正方形の面積と、斜辺の長さを求めよう。', 3),
        B(2, 'R＝9+36＝45（cm^2）\nc＝√{45}＝3√{5}（cm）')
      ], '1:1'),
      C2([
        T('（5）', '直角三角形の 3辺の上に、正方形をかく。斜辺の上が 50cm^2、1辺の上が 18cm^2 のとき、残りの辺の上の正方形の面積と、その辺の長さを求めよう。', 5),
        B(2, '50−18＝32（cm^2）\n√{32}＝4√{2}（cm）')
      ], [
        T('（6）', '方眼（1目もり 1cm）の上に、面積 13cm^2 の正方形をかきたい。直角をはさむ 2辺が整数 cm の直角三角形の斜辺を 1辺にする。何 cm と何 cm か。', 5),
        B(2, '4+9＝13 だから\n2cm と 3cm')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：正方形のかわりに、半円をかいてみよう。'),
      T('（7）', '直角をはさむ 2辺が 3cm、4cm、斜辺が 5cm の直角三角形がある。3つの辺を、それぞれ直径とする半円を、三角形の外がわにかいた。3つの半円の面積の間には、どんな関係があるだろう。', 3),
      C2([
        F(5, semi),
        T('', '自分で直角三角形を 1つ選んで、同じように確かめよう。', 2),
        B(4, '')
      ], [
        TB('辺（直径）', ['3cm', '4cm', '5cm'], [['半円の面積（cm^2）', ['', '', '']]], { hw: 42 }),
        T('', '気づいたこと', 1),
        B(8, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '直角三角形の 3辺の上に、それぞれ正方形をかいたところ、3つの正方形の面積の和が 200cm^2 になった。直角をはさむ 1辺の上の正方形の面積が 36cm^2 のとき、斜辺の長さと、もう 1辺の長さを求めよう。', 6),
        B(6, 'P+Q＝R だから　P+Q+R＝2R＝200\nR＝100　斜辺は　√{100}＝10（cm）\nもう 1辺の上は　100−36＝64\n長さは　√{64}＝8（cm）')
      ], [
        MA('① P+Q と R には、どんな関係があったかな。\n② 3つの面積の和を、R だけで表すと、どうなるかな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図（1目もり 1cm）で、正方形 P、Q、R の面積を求めよう。（3点）', 1),
      F(6, SQ3(2, 3, '', 5)),
      B(1, 'P＝4cm^2、Q＝9cm^2、R＝13cm^2'),
      T('（2）', '直角三角形で、直角をはさむ 2辺を a、b、斜辺を c とするとき、成り立つ関係を式で書こう。（2点）', 2),
      B(1, 'a^2+b^2＝c^2'),
      T('（3）', '直角をはさむ 2辺の長さが、次のとき、斜辺の長さを求めよう。（3点）\nア 9cm と 12cm　　　イ 1cm と 2cm', 2),
      B(2, 'ア c^2＝81+144＝225　c＝15（cm）\nイ c^2＝1+4＝5　c＝√{5}（cm）'),
      T('（4）', '直角三角形の 3辺の上に、正方形をかいた。斜辺の上の正方形の面積が 40cm^2、ほかの 1辺の上の正方形の面積が 15cm^2 のとき、残りの辺の長さを求めよう。（2点）', 3),
      B(2, '40−15＝25　　√{25}＝5（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '方眼（1目もり 1cm）の上に、面積が 25cm^2 の正方形を、辺が方眼の線の上にないようにかきたい。直角をはさむ 2辺が、整数 cm の直角三角形の斜辺を、1辺にすればよい。何 cm と何 cm の直角三角形か。', 4),
      B(3, 'a^2+b^2＝25 になる整数の組を、さがす。\n9+16＝25 だから　3cm と 4cm')
    ]
  });
})();
