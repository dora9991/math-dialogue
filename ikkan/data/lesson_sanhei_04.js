/* 三平方の定理 第4時：三角定規の形の、辺の比を調べよう（特別な直角三角形）。
   元：授業ナビ標準版 sanhei-04（例）。「三角定規 ア（正方形の半分）・イ（正三角形の半分）の、残りの辺の長さ」（課題）を「今日の問い」に、
   比を使って辺の長さを求める（例題1）を「例題」に、「1辺 a の正三角形の高さと面積を、a の式で表す」（考える問い）を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（ア・イの残りの辺の長さ）。個人3分 → ペア3分 → ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・図は、頂点の座標から描いた（根号の字は、図の中に自分で描いた）。辺の長さ・角（30°・45°・60°）は、checks で座標から Math.hypot・atan2 で計算し直した。
   ・考えようの答え（正三角形の高さ [[√3/2]]a・面積 [[√3/4]]a²）は、ほかの問題に出さないため、正三角形の問題の1辺は、表（2・4・8・10）とちがう 6cm・12cm にした。
   検算：node tools/verify.cjs sanhei-04　／　見た目：node tools/check.cjs <出力先> sanhei-04 */
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

  // （8）∠B＝90°、∠A＝30°、AC＝12cm の直角三角形 ABC と、B から AC への垂線 BH
  const S3 = Math.sqrt(3);
  const fig8 = FIG({ pts: { B: [0, 0], A: [6 * S3, 0], C: [0, 6], H: [1.5 * S3, 4.5] }, polys: ['BAC'], segs: [['B', 'H', { dash: 1 }]], right: [['B', 'A', 'C'], ['H', 'B', 'A']],
    lens: [{ a: 'A', b: 'C', t: '12cm' }], angs: [{ at: 'A', a: 'B', b: 'C', t: '30°', r: 7, lr: 14 }], vn: 'ABCH', names: { B: 225, H: 45 }, pad: 8 });

  // 検算の道具（checks の式の先頭にそえる）
  const LIB = 'const hy=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1]), sh=P=>Math.abs(P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2, deg=r=>r*180/Math.PI;'
    + 'const S2=Math.SQRT2, S3=Math.sqrt(3);'
    + 'const eq=a=>[[0,0],[a,0],[a/2,a*Math.sin(Math.PI/3)]];';   // 1辺 a の正三角形（頂点 3つ）

  IK.lesson('sanhei-04', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第4時', title: '三角定規の形の、辺の比を調べよう',
    summary: '三角定規の形（直角二等辺三角形・30°、60°、90° の直角三角形）の辺の長さを、三平方の定理で求めて、辺の比 1：1：√2、1：2：√3 をとらえる。比を使って、辺の長さを求める。',
    head: '三平方の定理　第4時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ア（正方形を対角線で半分）：等しい辺 1 → 斜辺 √2、角は 45°、45°。イ（正三角形を半分）：正三角形の 1辺 2、高さ（残りの辺）√3、短い辺 1、角は 30°、60°
      `(() => { ${LIB} const E=eq(2), H=[1,0]; return near(hy([0,0],[1,0]),1) && near(hy([1,0],[0,1]),S2) && near(deg(Math.atan2(1,1)),45) && near(hy(E[0],E[1]),2) && near(hy(E[1],E[2]),2) && near(hy(E[0],E[2]),2) && near(hy(H,E[2]),S3) && near(hy(E[0],H),1) && near(deg(Math.atan2(S3,1)),60) && near(deg(Math.atan2(1,S3)),30); })()`,
      // 例題（1）等しい辺 5 → 斜辺 5√2　（2）斜辺 8、30° → 短い辺 4（＝8 sin30°）、残りの辺 4√3（＝8 cos30°）。座標でも斜辺は 8
      `(() => { ${LIB} const sx=8*Math.sin(PI/6), lx=8*Math.cos(PI/6); return near(hy([0,0],[5,5]),5*S2) && near(sx,4) && near(lx,4*S3) && near(hy([0,0],[lx,sx]),8) && near(deg(Math.atan2(sx,lx)),30); })()`,
      // （1）図1：等しい辺 4 → 斜辺 4√2　（2）図2：斜辺 10、30° → x＝5、y＝5√3
      `(() => { ${LIB} const sx=10*Math.sin(PI/6), lx=10*Math.cos(PI/6); return near(hy([0,0],[4,4]),4*S2) && near(sx,5) && near(lx,5*S3) && near(hy([0,0],[lx,sx]),10) && near(hy([0,0],[5*S3,5]),10); })()`,
      // （3）1辺 7 の正方形の対角線 7√2　（4）1辺 6 の正三角形（座標）の高さ 3√3
      `(() => { ${LIB} const E=eq(6); return near(hy([0,0],[7,7]),7*S2) && near(E[2][1],3*S3) && near(hy(E[0],E[1]),6) && near(hy(E[0],E[2]),6) && near(hy(E[1],E[2]),6); })()`,
      // （5）斜辺 8 の直角二等辺三角形：等しい辺 4√2（座標でも斜辺 8）　（6）30°、60° で、60° の向かいの辺 9 → 短い辺 3√3、斜辺 6√3（斜辺 h：h cos30°＝9）
      `(() => { ${LIB} const h=9/Math.cos(PI/6); return near(hy([0,0],[4*S2,4*S2]),8) && near(8/S2,4*S2) && near(h,6*S3) && near(h*Math.sin(PI/6),3*S3) && near(9/S3,3*S3); })()`,
      // （7）考えよう（答えは紙面に載せない）：正三角形の高さ＝(√3/2)a、面積＝(√3/4)a²。表の a＝2、4、8、10 と、a（a＝7 など）で、座標から確かめる
      `(() => { ${LIB} return [2,4,8,10,7,13].every(a => { const E=eq(a); return near(E[2][1],S3/2*a) && near(sh(E),S3/4*a*a); }) && [2,4,8,10].map(a=>Math.round(eq(a)[2][1]/S3*1e6)/1e6).join()==="1,2,4,5"; })()`,
      // （8）B(0,0)、A(6√3,0)、C(0,6)：AC＝12、∠A＝30°、BC＝6、AB＝6√3。B から AC への垂線の足 H：BH＝3√3、AH＝9
      `(() => { ${LIB} const A=[6*S3,0], C=[0,6], B0=[0,0], t=((B0[0]-A[0])*(C[0]-A[0])+(B0[1]-A[1])*(C[1]-A[1]))/hy(A,C)**2, H=[A[0]+t*(C[0]-A[0]), A[1]+t*(C[1]-A[1])]; return near(hy(A,C),12) && near(deg(Math.atan2(6,6*S3)),30) && near(hy(B0,C),6) && near(hy(A,B0),6*S3) && near(hy(B0,H),3*S3) && near(hy(A,H),9) && near(hy(H,C),3) && near(9+3,12); })()`,
      // 小テスト（1）等しい辺 6 → 斜辺 6√2　斜辺 12、30° → x＝6、y＝6√3　（2）1辺 10 の正方形の対角線 10√2　（3）1辺 12 の正三角形（座標）の高さ 6√3
      `(() => { ${LIB} const E=eq(12); return near(hy([0,0],[6,6]),6*S2) && near(12*Math.sin(PI/6),6) && near(12*Math.cos(PI/6),6*S3) && near(hy([0,0],[6*S3,6]),12) && near(hy([0,0],[10,10]),10*S2) && near(E[2][1],6*S3); })()`,
      // 小テスト（4）チャレンジ：斜辺 4 の直角二等辺三角形：等しい辺 2√2、面積 4（座標でも）
      `(() => { ${LIB} return near(hy([0,0],[2*S2,2*S2]),4) && near(4/S2,2*S2) && near(sh([[0,0],[2*S2,0],[0,2*S2]]),4); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('三角定規の形の、辺の長さの比を調べよう'),
      K('今日の問い', '三角定規のア、イは、それぞれ、正方形を対角線で半分にした形、正三角形を半分にした形である。ア の等しい辺を 1、イ のいちばん短い辺を 1 とすると、残りの辺の長さは、いくつになるだろう。', 3),
      F(5, RT(1, 1, { cap: 'ア', ha: '1', vb: '1', angB: '45°', angA: '45°', scale: 20, pad: 8 }), RT(S3, 1, { cap: 'イ', vb: '1', angB: '30°', angA: '60°', angBlr: 13, scale: 20, pad: 8 })),
      T('①', '自分の考え（3分）　ア、イの、残りの辺の長さを求めて書こう。', 1),
      B(4, '（例）ア 斜辺を x として　x^2＝1^2+1^2＝2　x＝√{2}\nイ 2枚合わせると、1辺 2 の正三角形になる。斜辺は 2\n　 残りの辺を y として　y^2＝2^2−1^2＝3　y＝√{3}'),
      T('②', 'ペアの考え（3分）　自分とちがう求め方・気づきを書こう。', 1),
      B(2, ''),
      G(1),
      WD('直角二等辺三角形の 3辺の比は　1：1：{{√{2} }}\n30°、60°、90° の直角三角形の 3辺の比は\n短い辺：斜辺：残りの辺＝1：{{2}}：{{√{3} }}\n正方形の対角線の長さは、1辺の{{√{2} }}倍。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '次の長さを、辺の比を使って求め、表を完成させよう。\n(1) 等しい辺が 5cm の直角二等辺三角形の、斜辺 x\n(2) 斜辺が 8cm の、30°、60° の直角三角形の、短い辺 x と残りの辺 y', 3),
      TB('', ['(1)', '(2)'], [
        ['使う比', ['1：1：√{2}', '1：2：√{3}']],
        ['x の値', ['{{5√{2} }}', '{{4}}']],
        ['y の値', ['—', '{{4√{3} }}']]
      ], { hw: 34 }),
      T('', '【比のくふう】(2) で、x を先に求められるのは、なぜだろう。', 1),
      B(2, '斜辺 8cm は、比の「2」にあたる。\n短い辺 x は「1」だから　x＝8÷2＝4　　y＝4×√{3}＝4√{3}')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 直角二等辺三角形の 3辺の比は、1：1：{{√{2} }} である。\n② 30°、60°、90° の直角三角形の 3辺の比は、1：{{2}}：{{√{3} }} である。\n③ ②の比は、短い辺：{{斜辺}}：残りの辺 の順に並べる。\n④ 正方形の対角線の長さは、1辺の{{√{2} }}倍である。', 4, { label: 'ことば' }),
      F(5, RT(4, 4, { cap: '図1', ha: '4cm', vb: '4cm', hy: 'x', angB: '45°', pad: 8 }), RT(5 * S3, 5, { cap: '図2', ha: 'y', vb: 'x', hy: '10cm', angB: '30°', angBlr: 13, pad: 8 })),
      C2([
        T('（1）', '図1で、x の値を求めよう。', 2),
        B(2, '1：√{2}＝4：x より\nx＝4√{2}')
      ], [
        T('（2）', '図2で、x、y の値を求めよう。', 2),
        B(2, 'x＝10÷2＝5\ny＝5√{3}')
      ], '1:1'),
      MA('【説明】辺の比 1：2：√{3} になるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '辺の比を使って、長さを求めよう。'),
      C2([
        T('（3）', '1辺が 7cm の正方形の、対角線の長さを求めよう。', 2),
        B(2, '対角線は、1辺の √{2}倍\n7√{2}（cm）')
      ], [
        T('（4）', '1辺が 6cm の正三角形の、高さを求めよう。', 2),
        B(3, '半分にした三角形は 1：2：√{3}\n斜辺 6、底辺の半分 3\n高さ 3√{3}（cm）')
      ], '1:1'),
      C2([
        T('（5）', '斜辺が 8cm の直角二等辺三角形の、等しい辺の長さを求めよう。', 3),
        B(2, 'x：8＝1：√{2}\nx＝[[8/√{2}]]＝4√{2}（cm）')
      ], [
        T('（6）', '30°、60°、90° の直角三角形で、60° の向かいの辺が 9cm のとき、斜辺の長さを求めよう。', 4),
        B(2, '短い辺は　9÷√{3}＝3√{3}\n斜辺は　3√{3}×2＝6√{3}（cm）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：正三角形の高さと面積を、1辺の長さで表そう。'),
      T('（7）', '表の、正三角形の高さと面積を求めよう。1辺が a cm のときは、どうなるだろう。', 1),
      TB('1辺（cm）', ['2', '4', '8', '10', 'a'], [['高さ（cm）', ['', '', '', '', '']], ['面積（cm^2）', ['', '', '', '', '']]], { hw: 40 }),
      C2([
        T('', '気づいたこと', 1),
        B(8, '')
      ], [
        T('', '1辺が a cm のときの、高さと面積を、式で表そう', 2),
        B(7, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '∠B＝90°、∠A＝30° の直角三角形 ABC があり、AC＝12cm である。B から AC に垂線 BH をひく。\n① BC、AB の長さを求めよう。\n② BH の長さを求めよう。\n③ AH の長さを求めよう。', 6),
        B(7, '① BC＝6cm、AB＝6√{3}cm\n② △ABH も 30°、60°、90° の\n　 三角形。斜辺 AB の半分だから\n　 BH＝3√{3}（cm）\n③ AH＝BH×√{3}＝3√{3}×√{3}\n　 ＝9（cm）')
      ], [
        F(5, fig8),
        MA('① BC は、30° の向かいの辺。AC は、比のどれにあたるかな。\n② △ABH は、どんな形の三角形かな。', 5, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '図で、x、y の値を求めよう。（5点）', 1),
      F(5, RT(6, 6, { cap: '（1）', ha: '6cm', vb: '6cm', hy: 'x', angB: '45°', pad: 8 }), RT(6 * S3, 6, { cap: '（2）', ha: 'y', vb: 'x', hy: '12cm', angB: '30°', angBlr: 13, pad: 8 })),
      B(2, '（1）x＝6√{2}\n（2）x＝12÷2＝6　　y＝6√{3}'),
      T('（2）', '1辺が 10cm の正方形の、対角線の長さを求めよう。（2点）', 1),
      B(1, '10√{2}cm'),
      T('（3）', '1辺が 12cm の正三角形の、高さを求めよう。（3点）', 1),
      B(2, '半分にした三角形は 1：2：√{3}\n斜辺 12、底辺の半分 6　高さ 6√{3}cm'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '斜辺が 4cm の直角二等辺三角形の、面積を求めよう。', 1),
      B(3, '等しい辺は　4÷√{2}＝2√{2}\n面積は　[[1/2]]×2√{2}×2√{2}＝4（cm^2）')
    ]
  });
})();
