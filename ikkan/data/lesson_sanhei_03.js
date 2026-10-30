/* 三平方の定理 第3時：辺の長さを求め、直角三角形かどうかを判断しよう（定理の逆）。
   元：授業ナビ標準版 sanhei-03（例）。「3辺の長さが決まった三角形が、直角三角形かどうかを判断する」（例題2）を「今日の問い」に、
   「斜辺をさがして、辺の長さを求める」（例題1）を「例題」に、「3辺が x、x+7、x+8 の三角形が直角三角形になる x」（考える問い）を考えよう（演習プリント（7））にした。
   ・ワークシートは A4 1枚：問いは1つ（ア〜ウのうち直角三角形はどれか）。個人3分 → ペア3分 → ことば → 例題（表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・「直角三角形かどうか」は、いちばん長い辺の2乗と、残り2辺の2乗の和が、等しいか等しくないか（数値で1つに決まる数）で判断する。checks では、3辺の長さから座標（余弦定理）で三角形をつくり、内積でも確かめた。
   ・授業ナビの 5cm・12cm・13cm は、考えようの答えになるため、ほかの問題では使わない（（8）② は 6cm・8cm・10cm にした）。
   検算：node tools/verify.cjs sanhei-03　／　見た目：node tools/check.cjs <出力先> sanhei-03 */
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

  // 検算の道具（checks の式の先頭にそえる）：tri＝3辺 p・q・r（r がいちばん長い）の三角形を座標でつくる（O(0,0)、A(p,0)、B(x,y)。OA＝p、OB＝q、AB＝r）。直角は O で、dt(A,B)＝0 のとき
  const LIB = 'const hy=(p,q)=>Math.hypot(q[0]-p[0],q[1]-p[1]);'
    + 'const tri=(p,q,r)=>{const x=(p*p+q*q-r*r)/(2*p), y=Math.sqrt(Math.max(0,q*q-x*x)); return {O:[0,0],A:[p,0],B:[x,y]};};'
    + 'const isRt=s=>{const [p,q,r]=[...s].sort((a,b)=>a-b), T=tri(p,q,r); return near(hy(T.O,T.A),p) && near(hy(T.O,T.B),q) && near(hy(T.A,T.B),r) && near(T.A[0]*T.B[0]+T.A[1]*T.B[1],0);};';

  IK.lesson('sanhei-03', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第3時', title: '辺の長さを求め、直角三角形かどうかを判断しよう',
    summary: '3辺の長さが決まった三角形が直角三角形かどうかを、三平方の定理の逆（a²+b²＝c²）で判断する。直角三角形で、斜辺か直角をはさむ辺かを見分けて、残りの辺の長さを求める。',
    head: '三平方の定理　第3時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：ア 4、5、6 → 4²+5²＝41、6²＝36（直角でない）／イ 8、15、17 → 289＝289（直角）／ウ 2、√3、√7 → 4+3＝7（直角）。座標でも、内積が 0 になるのは イ・ウ だけ
      `(() => { ${LIB} return !isRt([4,5,6]) && isRt([8,15,17]) && isRt([2,Math.sqrt(3),Math.sqrt(7)]) && near(4*4+5*5,41) && near(6*6,36) && near(8*8+15*15,289) && near(17*17,289) && near(2*2+Math.sqrt(3)**2,7) && near(Math.sqrt(7)**2,7); })()`,
      // 例題（1）直角をはさむ 6、4 → x＝√52＝2√13　（2）斜辺 7、1辺 5 → x＝√24＝2√6（座標：直角をはさむ辺 √24 と 5 の斜辺は 7）
      'near(Math.hypot(6, 4), Math.sqrt(52)) && near(Math.sqrt(52), 2 * Math.sqrt(13)) && near(Math.hypot(Math.sqrt(24), 5), 7) && near(Math.sqrt(24), 2 * Math.sqrt(6)) && near(6 * 6 + 4 * 4, 52) && near(49 - 25, 24)',
      // （1）直角をはさむ 5、2 → x＝√29　（2）斜辺 6、1辺 2 → x＝√32＝4√2（座標：√32 と 2 の斜辺は 6）
      'near(Math.hypot(5, 2), Math.sqrt(29)) && near(Math.hypot(Math.sqrt(32), 2), 6) && near(Math.sqrt(32), 4 * Math.SQRT2) && near(36 - 4, 32)',
      // （3）直角をはさむ 3、√7 → x＝4　（4）斜辺 4、1辺 2√3 → もう 1辺 2（座標：2 と 2√3 の斜辺は 4）
      'near(Math.hypot(3, Math.sqrt(7)), 4) && near(Math.hypot(2, 2 * Math.sqrt(3)), 4) && near(16 - 12, 4) && near(Math.sqrt(16 - 12), 2)',
      // （5）ア 7、8、10：49+64＝113、100（×）／イ 10、24、26：676＝676（○）／ウ 3、√7、4：9+7＝16＝4²（○）／エ 2、3、√15：4+9＝13、15（×）。座標でも イ・ウ だけが直角
      `(() => { ${LIB} return [isRt([7,8,10]),isRt([10,24,26]),isRt([3,Math.sqrt(7),4]),isRt([2,3,Math.sqrt(15)])].join()==="false,true,true,false" && near(7*7+8*8,113) && near(10*10+24*24,676) && near(26*26,676) && near(3*3+7,16) && near(2*2+3*3,13); })()`,
      // （6）9、12、15 は直角三角形（81+144＝225）。面積 1/2×9×12＝54（ヘロンの公式 √(18×9×6×3)＝54 でも同じ）
      `(() => { ${LIB} const s=(9+12+15)/2; return isRt([9,12,15]) && near(9*9+12*12,225) && near(0.5*9*12,54) && near(Math.sqrt(s*(s-9)*(s-12)*(s-15)),54); })()`,
      // （7）考えよう（答えは紙面に載せない）：x、x+7、x+8 が直角三角形になる正の x は 5 だけ（表の x＝2〜6：x²+(x+7)² と (x+8)² が等しいのは 5 のとき）。x²−2x−15＝0 の解は 5、−3
      `(() => { ${LIB} const ok=Array.from({length:400},(_,i)=>(i+1)/10).filter(x=>isRt([x,x+7,x+8])); return ok.length===1 && near(ok[0],5) && [2,3,4,5,6].filter(x=>near(x*x+(x+7)**2,(x+8)**2)).join()==="5" && near(5*5-2*5-15,0) && near(-3*-3-2*-3-15,0); })()`,
      // （8）① 4cm と 6cm：6cm が斜辺 → √20＝2√5、4cm と 6cm が直角をはさむ → √52＝2√13（座標：2√5 と 4 の斜辺は 6）
      'near(Math.hypot(4, 2 * Math.sqrt(5)), 6) && near(Math.sqrt(36 - 16), 2 * Math.sqrt(5)) && near(Math.hypot(4, 6), 2 * Math.sqrt(13))',
      // （8）② 6、8、10 は直角三角形。面積 24。10cm を底辺にした高さ 24×2÷10＝24/5（座標：C(0,0)・A(8,0)・B(0,6) の、点 C から直線 AB までの距離）
      `(() => { ${LIB} const A=[8,0],Bp=[0,6], d=Math.abs((Bp[0]-A[0])*(0-A[1])-(0-A[0])*(Bp[1]-A[1]))/hy(A,Bp); return isRt([6,8,10]) && near(0.5*6*8,24) && near(2*24/10,24/5) && near(d,24/5); })()`,
      // 小テスト（1）直角をはさむ 6、3 → x＝3√5　（2）斜辺 7、1辺 4 → x＝√33
      'near(Math.hypot(6, 3), 3 * Math.sqrt(5)) && near(Math.hypot(Math.sqrt(33), 4), 7) && near(49 - 16, 33)',
      // 小テスト（3）ア 6、8、10 は直角（○）、イ 4、6、7 は 16+36＝52、49（×）
      `(() => { ${LIB} return isRt([6,8,10]) && !isRt([4,6,7]) && near(4*4+6*6,52) && near(7*7,49); })()`,
      // 小テスト（4）チャレンジ：x、x+1、x+2 が直角三角形になる正の x は 3 だけ（3、4、5）
      `(() => { ${LIB} const ok=Array.from({length:400},(_,i)=>(i+1)/10).filter(x=>isRt([x,x+1,x+2])); return ok.length===1 && near(ok[0],3) && near(3*3-2*3-3,0); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('3辺の長さから、直角三角形かどうかを調べよう'),
      K('今日の問い', '3辺の長さが次のような三角形ア〜ウがある。この中に、直角三角形はあるだろうか。調べ方を自分で決めて、調べよう。\nア 4cm、5cm、6cm　　イ 8cm、15cm、17cm　　ウ 2cm、√{3}cm、√{7}cm', 3),
      T('①', '自分の考え（3分）　調べ方と、わかったことを書こう。', 1),
      B(4, '（例）三平方の定理が成り立つか、いちばん長い辺を c として調べる。\nア 4^2+5^2＝41、6^2＝36　→　等しくない\nイ 8^2+15^2＝289、17^2＝289　→　等しい\nウ 2^2+(√{3})^2＝7、(√{7})^2＝7　→　等しい　　答　イ、ウ'),
      T('②', 'ペアの考え（3分）　自分とちがう調べ方・気づきを書こう。', 1),
      B(3, ''),
      G(1),
      WD('3辺 a、b、c の間に a^2+b^2＝c^2 が成り立てば、\nその三角形は、c を斜辺とする{{直角三角形}}である。\nこれを三平方の定理の{{逆}}という。\n調べるときは、いちばん{{長い}}辺を c とする。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '直角三角形で、x の値を求めよう。斜辺をさがしてから、表を完成させよう。', 1),
      F(4, RT(6, 4, { ha: '6cm', vb: '4cm', hy: 'x', pad: 5 }), RT(Math.sqrt(24), 5, { ha: 'x', vb: '5cm', hy: '7cm', pad: 5 })),
      TB('', ['(1)', '(2)'], [
        ['斜辺はどれか', ['{{x}}', '{{7cm}}']],
        ['三平方の定理', ['{{x^2＝6^2+4^2}}', '{{x^2+5^2＝7^2}}']],
        ['x^2 の値', ['{{52}}', '{{24}}']],
        ['x の値（x＞0）', ['{{2√{13} }}', '{{2√{6} }}']]
      ], { hw: 36 }),
      T('', '【斜辺のくふう】x が斜辺のときと、そうでないとき、式はどうちがうか。', 1),
      B(3, '斜辺の 2乗＝ほかの 2辺の 2乗の和\n（1）斜辺が x　→　x^2＝6^2+4^2\n（2）斜辺が 7　→　x^2+5^2＝7^2')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 直角三角形では、斜辺の 2乗が、ほかの 2辺の 2乗の{{和}}に等しい。\n② 斜辺を c、ほかの 2辺を a、b とすると、{{a^2+b^2＝c^2}} が成り立つ。\n③ 3辺の間に ②の関係が成り立てば、その三角形は{{直角三角形}}である。\n④ 直角三角形かどうかは、いちばん{{長い}}辺を c として調べる。', 4, { label: 'ことば' }),
      F(4, RT(5, 2, { cap: '図1', ha: '5cm', vb: '2cm', hy: 'x', pad: 6 }), RT(Math.sqrt(32), 2, { cap: '図2', ha: 'x', vb: '2cm', hy: '6cm', pad: 6 })),
      C2([
        T('（1）', '図1の直角三角形で、x の値を求めよう。', 2),
        B(2, 'x^2＝5^2+2^2＝29\nx＝√{29}')
      ], [
        T('（2）', '図2の直角三角形で、x の値を求めよう。', 2),
        B(2, 'x^2＝6^2−2^2＝32\nx＝√{32}＝4√{2}')
      ], '1:1'),
      MA('【説明】斜辺の見つけ方と、式の立て方を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '三平方の定理とその逆を使って、答えよう。'),
      C2([
        T('（3）', '直角をはさむ 2辺が 3cm、√{7}cm の直角三角形の、斜辺 x の長さを求めよう。', 3),
        B(2, 'x^2＝3^2+(√{7})^2＝16\nx＝4（cm）')
      ], [
        T('（4）', '斜辺が 4cm、1辺が 2√{3}cm の直角三角形の、もう 1辺 x の長さを求めよう。', 3),
        B(2, 'x^2＝4^2−(2√{3})^2＝4\nx＝2（cm）')
      ], '1:1'),
      C2([
        T('（5）', '3辺が次の三角形のうち、直角三角形をすべて選ぼう。（cm）\nア 7、8、10　イ 10、24、26\nウ 3、√{7}、4　エ 2、3、√{15}', 4),
        B(5, 'ア 49+64＝113、100　×\nイ 100+576＝676、676　○\nウ 9+7＝16、16　○\nエ 4+9＝13、15　×\n答　イ、ウ')
      ], [
        T('（6）', '3辺が 9cm、12cm、15cm の三角形の面積を求めよう。', 3),
        B(3, '9^2+12^2＝225＝15^2\nだから直角三角形。面積は\n[[1/2]]×9×12＝54（cm^2）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：直角三角形になる x を、さがそう。'),
      T('（7）', '3辺の長さが x cm、(x+7) cm、(x+8) cm の三角形が、直角三角形になるのは、x がいくつのときだろう。x に数をあてはめて、表で調べよう。', 3),
      TB('x', ['2', '3', '4', '5', '6'], [['x^2+(x+7)^2', ['', '', '', '', '']], ['(x+8)^2', ['', '', '', '', '']]], { hw: 46 }),
      C2([
        T('', '気づいたこと', 1),
        B(7, '')
      ], [
        T('', 'x を、式を立てて求めよう', 1),
        B(7, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '① 直角三角形の 2辺の長さが 4cm と 6cm のとき、残りの辺の長さを、すべて求めよう。\n② 3辺が 6cm、8cm、10cm の三角形で、10cm の辺を底辺としたときの高さを求めよう。', 6),
        B(9, '① 6cm が斜辺のとき　√{20}＝2√{5}\n　 4cm、6cm が直角をはさむ辺のとき\n　 √{52}＝2√{13}\n　 答　2√{5}cm、2√{13}cm\n② 6^2+8^2＝10^2 だから直角三角形\n　 面積 [[1/2]]×6×8＝24\n　 高さを h として\n　 [[1/2]]×10×h＝24\n　 h＝[[24/5]]（cm）')
      ], [
        MA('① 6cm は、斜辺になるかな。ならないとしたら、どうなるかな。\n② 3辺の長さの関係から、どんな三角形かな。面積を 2通りに表せないかな。', 8, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      F(5, RT(6, 3, { cap: '（1）', ha: '6cm', vb: '3cm', hy: 'x', pad: 5 }), RT(Math.sqrt(33), 4, { cap: '（2）', ha: 'x', vb: '4cm', hy: '7cm', pad: 5 })),
      T('（1）', '図（1）の直角三角形で、x の値を求めよう。（3点）', 1),
      B(2, 'x^2＝6^2+3^2＝45\nx＝√{45}＝3√{5}'),
      T('（2）', '図（2）の直角三角形で、x の値を求めよう。（3点）', 1),
      B(2, 'x^2＝7^2−4^2＝33\nx＝√{33}'),
      T('（3）', '3辺の長さが、次のような三角形は、直角三角形か。直角三角形なら ○、そうでなければ × を書こう。（4点）\nア 6cm、8cm、10cm　　イ 4cm、6cm、7cm', 3),
      B(2, 'ア ○（36+64＝100）\nイ ×（16+36＝52、49）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（4）', '3辺の長さが x cm、(x+1) cm、(x+2) cm の直角三角形がある。x の値を求めよう。', 2),
      B(4, 'x^2+(x+1)^2＝(x+2)^2\nx^2−2x−3＝0　　(x−3)(x+1)＝0\nx＞0 だから　x＝3')
    ]
  });
})();
