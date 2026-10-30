/* 三平方の定理 第2時：三平方の定理が、いつでも成り立つわけを説明しよう（証明）。
   元：授業ナビ標準版 sanhei-02（探）。「合同な直角三角形 4つを並べた、1辺 a+b の正方形の面積を 2通りに表して、a²+b²＝c² を証明する」（課題）を「今日の問い」に、
   「内側の四角形が正方形になるわけ」（証明の途中の 1歩）を「例題」に、「台形の面積を 2通りに表して証明する」を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（証明）。個人3分 → ペア3分 → ことば → 例題（表の空欄）。証明の例は ① の板書（B）にある。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問（図1・図2の面積を、数で確かめる）／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・図は、頂点の座標から描いた。正方形になること・面積の関係・並べかえた図（まん中の正方形の 1辺 a−b）・台形は、checks で座標から確かめた。
   ・小テストの証明（1）は、{{ }} の穴埋め（答えは、すぐ下の B にも書いた）。
   検算：node tools/verify.cjs sanhei-02　／　見た目：node tools/check.cjs <出力先> sanhei-02 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SVG } = IK.b;
  const RED = '#d62828', INK = '#222';
  const f2 = n => String(Math.round(n * 100) / 100);
  // 字の幅のめやす（mm）。字の大きさ s
  const tw = (t, s) => [...String(t)].reduce((a, ch) => a + (/[0-9]/.test(ch) ? 0.56 : /[A-Za-z]/.test(ch) ? 0.52 : /[⺀-￿]/.test(ch) ? 1 : 0.6) * s, 0);
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

  // ●（α）・○（β）：直角三角形の、直角でない 2つの角のしるし。頂点 v のところの角（v→r と v→o の間）の中に、小さな丸をおく
  const dot = (h, X, Y, P, v, r, o, k) => {
    const vx = X(P[v][0]), vy = Y(P[v][1]), u1 = [X(P[r][0]) - vx, Y(P[r][1]) - vy], u2 = [X(P[o][0]) - vx, Y(P[o][1]) - vy], l1 = Math.hypot(u1[0], u1[1]), l2 = Math.hypot(u2[0], u2[1]);
    let bx = u1[0] / l1 + u2[0] / l2, by = u1[1] / l1 + u2[1] / l2; const bl = Math.hypot(bx, by); bx /= bl; by /= bl;
    const x = vx + bx * 5.2, y = vy + by * 5.2;
    return k === 'a' ? `<circle cx="${f2(x)}" cy="${f2(y)}" r="0.85" fill="${INK}"/>` : `<circle cx="${f2(x)}" cy="${f2(y)}" r="0.85" fill="#fff" stroke="${INK}" stroke-width="0.3"/>`;
  };

  // 使う直角三角形（直角をはさむ 2辺 a・b、斜辺 c）。● は B のところの角、○ は A のところの角
  const tri = (a, b, cap) => {
    const P = { C: [0, 0], B: [a, 0], A: [0, b] };
    return FIG({ pts: P, polys: ['CBA'], right: [['C', 'B', 'A']], lens: [{ a: 'C', b: 'B', t: 'a' }, { a: 'C', b: 'A', t: 'b' }, { a: 'B', b: 'A', t: 'c' }], cap, pad: 6, w: 0.62,
      extra: (h, X, Y) => dot(h, X, Y, P, 'B', 'C', 'A', 'a') + dot(h, X, Y, P, 'A', 'C', 'B', 'b') });
  };

  // 図1：直角三角形 4つを並べた、1辺 a+b の正方形。内側の四角形 PQRS（辺は c）。marks＝●○のしるし
  const PF1 = (a, b, cap, marks) => {
    const s = a + b, P = { K: [0, 0], L: [s, 0], M: [s, s], N: [0, s], P: [a, 0], Q: [s, a], R: [b, s], S: [0, b] };
    const lens = [['K', 'P', 'a'], ['P', 'L', 'b'], ['L', 'Q', 'a'], ['Q', 'M', 'b'], ['M', 'R', 'a'], ['R', 'N', 'b'], ['N', 'S', 'a'], ['S', 'K', 'b']].map(([p, q, t]) => ({ a: p, b: q, t }));
    ['PQ', 'QR', 'RS', 'SP'].forEach(e => lens.push({ a: e[0], b: e[1], t: 'c', k: 1.0, flip: true }));
    const M8 = [['P', 'K', 'S', 'a'], ['S', 'K', 'P', 'b'], ['Q', 'L', 'P', 'a'], ['P', 'L', 'Q', 'b'], ['R', 'M', 'Q', 'a'], ['Q', 'M', 'R', 'b'], ['S', 'N', 'R', 'a'], ['R', 'N', 'S', 'b']];
    return FIG({ pts: P, polys: ['KLMN', 'PQRS'], lens, cap, pad: 6, extra: marks ? (h, X, Y) => M8.map(m => dot(h, X, Y, P, ...m)).join('') : null });
  };

  // 図2：同じ直角三角形 4つを、1辺 c の正方形になるように並べたもの。まん中に、1辺 a−b の正方形 EFGH
  const pf2pts = (a, b) => { const c = Math.hypot(a, b), E = [a * a / c, a * b / c], r = p => [c - p[1], p[0]], F = r(E), G = r(F), H = r(G); return { K: [0, 0], L: [c, 0], M: [c, c], N: [0, c], E, F, G, H }; };
  const PF2 = (a, b, cap) => FIG({ pts: pf2pts(a, b), polys: ['KLMN'], segs: [['K', 'E'], ['L', 'F'], ['M', 'G'], ['N', 'H']], right: [['E', 'K', 'L']],
    lens: [{ a: 'K', b: 'L', t: 'c' }, { a: 'K', b: 'E', t: 'a', flip: true }, { a: 'E', b: 'L', t: 'b', flip: true }], cap, pad: 6 });

  // 図3：合同な直角三角形 2つと、まん中の三角形でつくる台形
  const PF3 = (a, b, cap) => FIG({ pts: { K: [0, 0], P: [b, 0], L: [a + b, 0], M: [a + b, b], N: [0, a] }, polys: ['KLMN'], segs: [['N', 'P'], ['P', 'M']], right: [['K', 'P', 'N'], ['L', 'M', 'P']],
    lens: [{ a: 'K', b: 'P', t: 'b' }, { a: 'P', b: 'L', t: 'a' }, { a: 'N', b: 'K', t: 'a' }, { a: 'L', b: 'M', t: 'b' }, { a: 'N', b: 'P', t: 'c', flip: true, k: 0.4 }, { a: 'P', b: 'M', t: 'c', flip: true, k: 0.4 }], cap, pad: 7 });

  // 検算の道具（checks の式の先頭にそえる）
  const LIB = 'const hy=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1]), dt=(o,p,q)=>(p[0]-o[0])*(q[0]-o[0])+(p[1]-o[1])*(q[1]-o[1]), sh=P=>Math.abs(P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;'
    + 'const p1=(a,b)=>{const s=a+b;return {K:[0,0],L:[s,0],M:[s,s],N:[0,s],P:[a,0],Q:[s,a],R:[b,s],S:[0,b]};};'
    + 'const p2=(a,b)=>{const c=Math.hypot(a,b),E=[a*a/c,a*b/c],r=p=>[c-p[1],p[0]],F=r(E),G=r(F),H=r(G);return {K:[0,0],L:[c,0],M:[c,c],N:[0,c],E,F,G,H};};';

  IK.lesson('sanhei-02', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第2時', title: '三平方の定理が、いつでも成り立つわけを説明しよう',
    summary: '合同な直角三角形 4つを並べた、1辺 a+b の正方形の面積を、2通りの式で表して、a²+b²＝c² が、いつでも成り立つことを説明する。内側の四角形が正方形になるわけも確かめる。',
    head: '三平方の定理　第2時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い・例題（図：a＝3.6、b＝2）：内側の四角形 PQRS は、4辺が c（＝√(a²+b²)）で、4つの角が 90°（内積 0）→ 正方形。面積 c²＝(a+b)²−三角形 4つ＝(a²+b²)。(a+b)²＝c²+2ab
      `(() => { ${LIB} return [[3.6,2],[5,2],[7,1],[6,8],[4,3]].every(([a,b]) => { const Z=p1(a,b), c=Math.hypot(a,b), Q=[Z.P,Z.Q,Z.R,Z.S]; return Q.every((p,i)=>near(hy(p,Q[(i+1)%4]),c) && near(dt(p,Q[(i+1)%4],Q[(i+3)%4]),0)) && near(sh(Q),c*c) && near((a+b)**2, c*c+2*a*b) && near(sh([Z.K,Z.L,Z.M,Z.N]) - 4*a*b/2, c*c); }); })()`,
      // 例題：直角三角形の直角でない 2つの角の和は 90°（α＝atan(b/a)、β＝atan(a/b)）。点 P のところ：180°−(α+β)＝90°（∠SPQ は座標でも 90°）
      `(() => { ${LIB} const a=3.6,b=2,Z=p1(a,b), al=Math.atan2(b,a), be=Math.atan2(a,b); return near(al+be,PI/2) && near(PI-(al+be),PI/2) && near(dt(Z.P,Z.S,Z.Q),0); })()`,
      // （1）（2）図1：a＝5、b＝2 → 大きい正方形 49、三角形 4つで 20、内側 29（＝c^2＝a^2+b^2）
      `(() => { ${LIB} const Z=p1(5,2); return near(sh([Z.K,Z.L,Z.M,Z.N]),49) && near(4*5*2/2,20) && near(sh([Z.P,Z.Q,Z.R,Z.S]),29) && near(hy([0,0],[5,2])**2,29) && near(5**2+2**2,29); })()`,
      // （3）図2：a＝5、b＝2 → まん中の正方形（EFGH）の 1辺 3、面積 9。c^2＝9+20＝29。E は直角（内積 0）
      `(() => { ${LIB} const Z=p2(5,2), Q=[Z.E,Z.F,Z.G,Z.H]; return Q.every((p,i)=>near(hy(p,Q[(i+1)%4]),3) && near(dt(p,Q[(i+1)%4],Q[(i+3)%4]),0)) && near(sh(Q),9) && near(dt(Z.E,Z.K,Z.L),0) && near(9+20,hy(Z.K,Z.E)**2+hy(Z.E,Z.L)**2) && near(hy(Z.K,Z.E),5) && near(hy(Z.E,Z.L),2); })()`,
      // （4）図1：a＝7、b＝1 → 64−14＝50、c＝5√2
      `(() => { ${LIB} const Z=p1(7,1); return near(sh([Z.K,Z.L,Z.M,Z.N]),64) && near(4*7*1/2,14) && near(sh([Z.P,Z.Q,Z.R,Z.S]),50) && near(Math.hypot(7,1),5*Math.SQRT2); })()`,
      // （5）a＝6、b＝8、c＝10：(6+8)^2＝196、10^2+4×(1/2×6×8)＝100+96＝196
      'near((6 + 8) ** 2, 196) && near(10 ** 2 + 4 * 6 * 8 / 2, 196) && near(Math.hypot(6, 8), 10)',
      // （6）図2：まん中の 1辺 1、三角形 1つの面積 6 → c^2＝1+4×6＝25、c＝5（a−b＝1、ab＝12 → a＝4、b＝3。hypot(4,3)＝5）
      'near(1 ** 2 + 4 * 6, 25) && near(Math.hypot(4, 3), 5) && near(4 - 3, 1) && near(4 * 3 / 2, 6)',
      // （7）考えよう（答えは紙面に載せない）：台形 K(0,0)・L(a+b,0)・M(a+b,b)・N(0,a)。面積 (a+b)^2/2＝ab+c^2/2。まん中の三角形 NPM は、NP＝PM＝c、∠P＝90°（a＝3、b＝4 と 5、2 で確かめる）
      `(() => { ${LIB} return [[3,4],[5,2]].every(([a,b]) => { const N=[0,a],Pp=[b,0],M=[a+b,b],c=Math.hypot(a,b); return near(sh([[0,0],[a+b,0],M,N]),(a+b)**2/2) && near((a+b)**2/2,a*b+c*c/2) && near(hy(N,Pp),c) && near(hy(Pp,M),c) && near(dt(Pp,N,M),0); }); })()`,
      // （8）a+b＝7、c^2＝29 → 三角形 1つの面積 (49−29)/4＝5、ab＝10。x^2−7x+10＝0 → x＝2、5。2^2+5^2＝29
      'near((49 - 29) / 4, 5) && near(2 * 5, 10) && near((7 - Math.sqrt(49 - 40)) / 2, 2) && near((7 + Math.sqrt(49 - 40)) / 2, 5) && near(2 ** 2 + 5 ** 2, 29)',
      // 小テスト（2）a＝4、b＝3：大きい正方形 49、内側 25（＝c^2）
      `(() => { ${LIB} const Z=p1(4,3); return near(sh([Z.K,Z.L,Z.M,Z.N]),49) && near(sh([Z.P,Z.Q,Z.R,Z.S]),25) && near(Math.hypot(4,3)**2,25); })()`,
      // 小テスト（3）図2：a＝6、b＝1 → まん中 5^2＝25、c^2＝25+12＝37（＝hypot^2）
      `(() => { ${LIB} const Z=p2(6,1), Q=[Z.E,Z.F,Z.G,Z.H]; return near(sh(Q),25) && near(25+4*6*1/2,37) && near(Math.hypot(6,1)**2,37); })()`,
      // 小テスト（4）チャレンジ：1辺 10、内側 52 → 三角形 1つ 12、ab＝24、x^2−10x+24＝0 → x＝4、6。4^2+6^2＝52
      'near((100 - 52) / 4, 12) && near(4 * 6, 24) && near(4 + 6, 10) && near(4 ** 2 + 6 ** 2, 52) && near((10 - Math.sqrt(100 - 96)) / 2, 4)'
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三平方の定理が、いつでも成り立つわけを説明しよう'),
      K('今日の問い', '直角をはさむ 2辺が a、b、斜辺が c の、合同な直角三角形 4つを、図のように並べると、1辺が a+b の大きい正方形ができた。a^2+b^2＝c^2 が、いつでも成り立つわけを、この図を使って説明しよう。', 3),
      F(6, tri(3.6, 2, '使う三角形（4つ）'), PF1(3.6, 2, '並べた図', true)),
      T('①', '自分の考え（3分）　大きい正方形の面積を、2通りの式で表してみよう。', 1),
      B(4, '（例）大きい正方形の面積　(a+b)^2　…①\n内側の正方形 c^2 と、三角形 4つ [[1/2]]ab×4 の和　c^2+2ab　…②\n①＝② だから　a^2+2ab+b^2＝c^2+2ab\nよって　a^2+b^2＝c^2'),
      T('②', 'ペアの考え（3分）　自分とちがう考え・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('正しいことを筋道立てて示すことを{{証明}}という。\n三平方の定理は、{{ピタゴラス}}の定理ともいう。\n同じ図形の{{面積}}を 2通りに表して、等しいとおく。\n正方形は、4辺が等しく、4つの角が{{直角}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '内側の四角形が正方形といえるわけを、表を完成させて確かめよう。（図の ●、○ は、直角でない 2つの角）', 2),
      TB('', null, [
        ['(1) 内側の 4つの辺の長さ', ['どれも {{c}}（直角三角形の斜辺）']],
        ['(2) ●+○ の大きさ', ['{{90}}°（直角三角形の、直角でない 2角の和）']],
        ['(3) 内側の 1つの角', ['180°−(●+○)＝{{90}}°']],
        ['(4) 内側の四角形は', ['4辺が等しく、4つの角が直角だから、{{正方形}}']]
      ], { hw: 58 }),
      T('', '【証明のくふう】4辺が等しいだけでは、なぜ正方形といえないか。', 1),
      B(2, 'ひし形も、4辺が等しいから。\n1つの角が 90° であることも、示す必要がある。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 正しいことを、筋道を立てて示すことを{{証明}}という。\n② 図1の大きい正方形の面積は、1辺が{{a+b}}だから (a+b)^2 である。\n③ (a+b)^2＝{{a^2+2ab+b^2}} と、式を展開できる。\n④ 同じ図形の面積を、{{2通り}}の式で表して、等しいとおく。', 4, { label: 'ことば' }),
      F(5, PF1(5, 2, '図1'), PF2(5, 2, '図2')),
      C2([
        T('（1）', '図1で、a＝5、b＝2 のとき、大きい正方形の面積と、直角三角形 4つの面積の和を求めよう。', 3),
        B(2, '大きい正方形 7^2＝49\n三角形 4つ [[1/2]]×5×2×4＝20')
      ], [
        T('（2）', '（1）のとき、内側の正方形の面積 c^2 を求め、a^2+b^2＝c^2 を確かめよう。', 3),
        B(2, 'c^2＝49−20＝29\na^2+b^2＝25+4＝29 で、等しい')
      ], '1:1'),
      MA('【説明】内側の四角形が、正方形になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '図の面積を使って、確かめよう。'),
      C2([
        T('（3）', '図2で、a＝5、b＝2 のとき、まん中の正方形の 1辺の長さと面積、c^2 の値を求めよう。', 3),
        B(2, '1辺 5−2＝3、面積 9\nc^2＝9+20＝29')
      ], [
        T('（4）', '図1で、a＝7、b＝1 のとき、c の長さを求めよう。', 2),
        B(3, 'c^2＝8^2−[[1/2]]×7×1×4＝50\nc＝√{50}＝5√{2}')
      ], '1:1'),
      C2([
        T('（5）', 'a＝6、b＝8、c＝10 のとき、図1の大きい正方形の面積を、2通りの式で表して、等しいことを確かめよう。', 3),
        B(2, '(6+8)^2＝196\n10^2+[[1/2]]×6×8×4＝196')
      ], [
        T('（6）', '図2で、まん中の正方形の 1辺が 1cm、直角三角形 1つの面積が 6cm^2 のとき、c の長さを求めよう。', 3),
        B(2, 'c^2＝1^2+6×4＝25\nc＝5（cm）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：台形を使って、証明しよう。'),
      T('（7）', '合同な直角三角形 2つと、まん中の三角形で、図3のような台形をつくった。台形の面積を 2通りの式で表して、a^2+b^2＝c^2 を証明しよう。', 3),
      C2([
        F(5, PF3(3.6, 2, '図3'))
      ], [
        T('', 'まん中の三角形は、どんな三角形かな。', 1),
        B(4, '')
      ], '1:1'),
      C2([
        T('', '台形の面積を、2通りの式で表そう', 1),
        B(9, '')
      ], [
        T('', 'a^2+b^2＝c^2 を、導こう', 1),
        B(9, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '合同な直角三角形 4つで、図1のように、1辺が 7cm の大きい正方形をつくったところ、内側の正方形の面積が 29cm^2 になった。直角をはさむ 2辺の長さを、短いほうから答えよう。', 5),
        B(5, '三角形 1つの面積は (49−29)÷4＝5\n短い辺を x cm とすると、長い辺は 7−x\n[[1/2]]x(7−x)＝5　x^2−7x+10＝0\n(x−2)(x−5)＝0\n2cm と 5cm')
      ], [
        MA('① 直角三角形 1つの面積は、いくつかな。\n② 短い辺を x cm とすると、長い辺は何 cm かな。', 6, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      C2([
        T('（1）', '図は、直角をはさむ 2辺が a、b、斜辺が c の合同な直角三角形 4つを並べたものである。a^2+b^2＝c^2 の証明を完成させよう。（4点）\n大きい正方形の面積は　{{(a+b)^2}}\n内側の正方形と、三角形 4つの面積の和は\n{{c^2}}+[[1/2]]ab×4＝c^2+{{2ab}}\nよって　(a+b)^2＝c^2+2ab\n{{a^2+2ab+b^2}}＝c^2+2ab\nしたがって　a^2+b^2＝c^2', 9),
        B(2, '(a+b)^2、c^2、2ab、a^2+2ab+b^2\nの順に入る')
      ], [
        F(8, PF1(3.6, 2))
      ], '3:2'),
      T('（2）', '図で、a＝4、b＝3 のとき、大きい正方形の面積と、内側の正方形の面積を求めよう。（3点）', 2),
      B(2, '大きい正方形 7^2＝49\n内側の正方形 49−[[1/2]]×4×3×4＝25'),
      T('（3）', '同じ 4つの直角三角形（a＝6、b＝1）を、1辺が c の正方形になるように並べると、まん中に小さい正方形ができる。その面積と、c^2 の値を求めよう。（3点）', 3),
      B(2, 'まん中の 1辺 6−1＝5、面積 25\nc^2＝25+[[1/2]]×6×1×4＝37'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '合同な直角三角形 4つで、1辺が 10cm の大きい正方形をつくったところ、内側の正方形の面積が 52cm^2 になった。直角をはさむ 2辺の長さを、短いほうから答えよう。', 3),
      B(4, '三角形 1つの面積は (100−52)÷4＝12\n短い辺を x cm として　[[1/2]]x(10−x)＝12\nx^2−10x+24＝0　(x−4)(x−6)＝0\n4cm と 6cm')
    ]
  });
})();
