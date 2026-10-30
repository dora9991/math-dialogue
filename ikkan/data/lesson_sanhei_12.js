/* 三平方の定理（新しい形） 第12時：「三平方の定理」で学んだことを、整理して確かめよう（単元のまとめ）。
   元：授業ナビ標準版 sanhei-12（確）。授業構想の「考える問い」（どの場面で、どこに直角三角形をつくったか）を「今日の問い」に、確かめ1〜3の中心（定理の逆）を「例題」に、
   確かめ1〜5・演習プリントの基礎〜標準（辺・正三角形・2点間・弦）を「確かめる・使ってみる」に、演習プリントの入試（長方形の対角線への垂線）を「チャレンジ★★」にした。
   考えよう（演習プリント（7））は、元のワークシートの考える問いとは別に、「直角三角形の3辺の上に、正方形のかわりに正三角形をかいても、面積の関係は成り立つか」にした。
   ・ワークシートは A4 1枚：問いは1つ（正三角形・2点間・弦・直方体の対角線の4つの図に、直角三角形をかきこむ。数値・図は全部印刷）。個人3分 → ペア3分 → ことば → 例題（定理の逆。表の空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（ヒントカードつき）。
   ・数値は新しく作り、答えは checks で、図形を座標にして Math.hypot・内積・面積（座標の公式）ではかり、答え（根号・分数）と照らして検算した。
   検算：node tools/verify.cjs sanhei-12　／　見た目：node tools/check.cjs <出力先> sanhei-12 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SO, SVG } = IK.b;
  const RED = '#d62828';
  const DASH = ' stroke-dasharray="1.2 0.9"';
  const SQ3 = Math.sqrt(3);

  /* ---- 見取図（ななめ投影。手前の面がゆがまない）。凸の立体。かくれた辺は点線。
     V：頂点 [x,y,z]（y が奥行き、z が高さ）／ F：面（頂点の番号）／ names：頂点の字／ dims：[{ a, b, t, n }] … 頂点 a-b の辺に長さの字 t（n＝字の向き）／ cap：図の見出し
     segs：[{ p, q, dash, t, to, tf }]（3次元の点 2つの線分。tf＝字をおく位置 0〜1）　pad：余白 mm（数 か [左, 上, 右, 下]） ---- */
  const obl = (o, fo) => SVG((W, H, h) => {
    const ph = 35 * Math.PI / 180, kc = 0.5 * Math.cos(ph), ks = 0.5 * Math.sin(ph);
    const P = p => [p[0] + kc * p[1], p[2] + ks * p[1]];
    const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2], sub = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
    const cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
    const mean = A => A.reduce((s, p) => [s[0] + p[0] / A.length, s[1] + p[1] / A.length, s[2] + p[2] / A.length], [0, 0, 0]);
    const V = o.V, S = V.map(P), cen = mean(V), toV = [kc, -1, ks];
    const front = o.F.map(f => { const Q = f.map(i => V[i]); let n = cross(sub(Q[1], Q[0]), sub(Q[2], Q[0])); if (dot(n, sub(mean(Q), cen)) < 0) n = n.map(v => -v); return dot(n, toV) > 1e-9; });
    const E = new Map();
    o.F.forEach((f, fi) => f.forEach((v, k) => { const w = f[(k + 1) % f.length], key = Math.min(v, w) + '-' + Math.max(v, w); if (!E.has(key)) E.set(key, { i: Math.min(v, w), j: Math.max(v, w), f: [] }); E.get(key).f.push(fi); }));
    const edges = [...E.values()].map(e => Object.assign(e, { hidden: !e.f.some(fi => front[fi]) }));
    const segs = (o.segs || []).map(s => Object.assign({}, s, { a: P(s.p), b: P(s.q) }));
    const all = [...S, ...segs.flatMap(s => [s.a, s.b])];
    const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
    const pd = Array.isArray(o.pad) ? o.pad : [o.pad || 8, o.pad || 8, o.pad || 8, o.pad || 8];
    const k = Math.min((W - pd[0] - pd[2]) / (x1 - x0), (H - pd[1] - pd[3]) / (y1 - y0));
    const ox = pd[0] + (W - pd[0] - pd[2] - (x1 - x0) * k) / 2 - x0 * k, oy = pd[1] + (H - pd[1] - pd[3] - (y1 - y0) * k) / 2 + y1 * k;
    const X = p => ox + p[0] * k, Y = p => oy - p[1] * k, cs = [X(mean(S)), Y(mean(S))];
    let out = '';
    edges.filter(e => e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#555', 0.22, DASH); });
    edges.filter(e => !e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#222', 0.34, ' stroke-linecap="round"'); });
    segs.forEach(s => {
      out += h.ln(X(s.a), Y(s.a), X(s.b), Y(s.b), '#222', 0.28, s.dash ? DASH : '');
      if (s.t) { const f = s.tf == null ? 0.5 : s.tf; out += h.rich(X(s.a) + (X(s.b) - X(s.a)) * f + (s.to ? s.to[0] : 0), Y(s.a) + (Y(s.b) - Y(s.a)) * f + (s.to ? s.to[1] : 0) + 1, s.t, 2.9, s.anchor || 'middle'); }
    });
    (o.dims || []).forEach(d => {
      const p = S[d.a], q = S[d.b], mx = (X(p) + X(q)) / 2, my = (Y(p) + Y(q)) / 2;
      let n = d.n;
      if (!n) { n = [-(Y(q) - Y(p)), X(q) - X(p)]; const L = Math.hypot(n[0], n[1]) || 1; n = [n[0] / L, n[1] / L]; if (n[0] * (mx - cs[0]) + n[1] * (my - cs[1]) < 0) n = [-n[0], -n[1]]; }
      out += h.rich(mx + n[0] * 3, my + n[1] * 3 + 1, d.t, 2.9, Math.abs(n[0]) < 0.4 ? 'middle' : n[0] > 0 ? 'start' : 'end');
    });
    return (o.cap ? h.tx(W / 2, 3.5, o.cap, 3, 'middle', ' class="cap"') : '') + out;
  }, fo);

  // 直角三角形をさがす4つの図（ア〜エ）。x が、求める長さ
  // ア：1辺 8cm の正三角形。x＝高さ
  const figA = SVG((W, H, h) => {
    const s = 8, hgt = s * SQ3 / 2, k = Math.min((W - 18) / s, (H - 17) / hgt), bw = s * k, hh = hgt * k, bx = (W - bw) / 2 - 2, by = H - 6, ax = bx + bw / 2, ay = by - hh;
    let out = h.tx(W / 2, 3.5, 'ア', 3, 'middle', ' class="cap"') + `<polygon points="${h.f2(bx)},${h.f2(by)} ${h.f2(bx + bw)},${h.f2(by)} ${h.f2(ax)},${h.f2(ay)}" fill="none" stroke="#222" stroke-width="0.34" stroke-linejoin="round"/>`;
    out += h.ln(ax, ay, ax, by, '#222', 0.25, DASH) + h.rich(ax + 1.6, (ay + by) / 2 + 1, 'x', 3, 'start');
    const nx = hh, ny = -bw / 2, nl = Math.hypot(nx, ny);   // 右の辺の外がわ
    out += h.rich(ax + bw / 4 + nx / nl * 2.6, (ay + by) / 2 + ny / nl * 2.6 + 1, '8cm', 2.9, 'start');
    return out;
  });
  // イ：座標平面の 2点 A(1, 1)、B(5, 4)。x＝線分 AB
  const figB = SVG((W, H, h) => {
    const u = 4.7, ox = 8, oy = H - 8, X = v => ox + v * u, Y = v => oy - v * u;
    let out = h.tx(W / 2, 3.5, 'イ', 3, 'middle', ' class="cap"') + h.ln(ox - 3, oy, X(6.4), oy, '#222', 0.3) + h.ln(ox, oy + 3, ox, Y(5.2), '#222', 0.3);
    out += h.rich(X(6.4) + 1.6, oy + 1, 'x', 3, 'start') + h.rich(ox + 1.8, Y(5.2) + 1, 'y', 3, 'start') + h.tx(ox - 2.4, oy + 4.2, 'O', 3, 'middle', ' class="pl"');
    out += h.ln(X(1), Y(1), X(5), Y(4), '#222', 0.34, ' stroke-linecap="round"');
    [[1, 1], [5, 4]].forEach(p => { out += `<circle cx="${h.f2(X(p[0]))}" cy="${h.f2(Y(p[1]))}" r="0.7" fill="#222"/>`; });
    out += h.rich(X(1) + 1.2, Y(1) + 4.6, '(1, 1)', 2.9, 'start') + h.rich(X(5), Y(4) - 2.6, '(5, 4)', 2.9, 'middle') + h.rich((X(1) + X(5)) / 2 - 2.8, (Y(1) + Y(4)) / 2 - 1, 'x', 3, 'middle');
    return out;
  });
  // ウ：半径 5cm の円 O と弦。中心から弦までのきょり 3cm（垂線）。x＝弦
  const figC = SVG((W, H, h) => {
    const u = 2.8, cx = W / 2, cy = H / 2 + 2, r = 5 * u, d = 3 * u, half = Math.sqrt(r * r - d * d);
    let out = h.tx(W / 2, 3.5, 'ウ', 3, 'middle', ' class="cap"') + `<circle cx="${h.f2(cx)}" cy="${h.f2(cy)}" r="${h.f2(r)}" fill="none" stroke="#222" stroke-width="0.34"/>`;
    out += h.ln(cx - half, cy + d, cx + half, cy + d, '#222', 0.34, ' stroke-linecap="round"') + h.ln(cx, cy, cx, cy + d, '#222', 0.25, DASH) + h.ln(cx, cy, cx + r, cy, '#222', 0.25);
    out += `<polyline points="${h.f2(cx + 1.8)},${h.f2(cy + d)} ${h.f2(cx + 1.8)},${h.f2(cy + d - 1.8)} ${h.f2(cx)},${h.f2(cy + d - 1.8)}" fill="none" stroke="#222" stroke-width="0.22"/>`;
    [[cx, cy], [cx - half, cy + d], [cx + half, cy + d]].forEach(p => { out += `<circle cx="${h.f2(p[0])}" cy="${h.f2(p[1])}" r="0.6" fill="#222"/>`; });
    out += h.tx(cx - 1.8, cy - 1.2, 'O', 3, 'end', ' class="pl"') + h.rich(cx + 3.2, cy + d / 2 + 1, '3cm', 2.9, 'start') + h.rich(cx + r / 2, cy - 1.6, '5cm', 2.9, 'middle') + h.rich(cx, cy + d + 4.6, 'x', 3, 'middle');
    return out;
  });
  // エ：3cm・4cm・12cm の直方体。x＝対角線
  const figD = obl({
    V: [[0, 0, 0], [3, 0, 0], [3, 4, 0], [0, 4, 0], [0, 0, 12], [3, 0, 12], [3, 4, 12], [0, 4, 12]],
    F: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
    cap: 'エ', dims: [{ a: 0, b: 1, t: '3cm', n: [0, 1.3] }, { a: 1, b: 2, t: '4cm', n: [1, 0.5] }, { a: 0, b: 4, t: '12cm', n: [-1, 0] }],
    segs: [{ p: [0, 0, 0], q: [3, 4, 12], dash: true, t: 'x', tf: 0.45, to: [-2.4, 0] }], pad: [14, 8, 14, 9]
  });

  // （7）：直角三角形 CBA（直角は C。CB＝3、CA＝4、AB＝5）の 3辺を 1辺とする正三角形 P（CB の上）・Q（CA の上）・R（AB の上）
  const triFig = SVG((W, H, h) => {
    const C = [0, 0], Bp = [3, 0], A = [0, 4];
    const eq = (p, q, sgn) => { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d), n = [-d[1] / L * sgn, d[0] / L * sgn]; return [p, q, [m[0] + n[0] * L * SQ3 / 2, m[1] + n[1] * L * SQ3 / 2]]; };
    const tP = eq(C, Bp, -1), tQ = eq(A, C, -1), tR = eq(Bp, A, -1);   // どれも、直角三角形の外がわへ
    const all = [...tP, ...tQ, ...tR, C, Bp, A], xs = all.map(p => p[0]), ys = all.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = Math.min((W - 12) / (x1 - x0), (H - 8) / (y1 - y0));
    const X = p => (W - (x1 - x0) * k) / 2 + (p[0] - x0) * k, Y = p => H - 4 - (p[1] - y0) * k;
    const poly = (pts, w) => `<polygon points="${pts.map(p => h.f2(X(p)) + ',' + h.f2(Y(p))).join(' ')}" fill="none" stroke="#222" stroke-width="${w}" stroke-linejoin="round"/>`;
    let out = poly(tP, 0.3) + poly(tQ, 0.3) + poly(tR, 0.3) + poly([C, Bp, A], 0.45);
    const cen = t => [(t[0][0] + t[1][0] + t[2][0]) / 3, (t[0][1] + t[1][1] + t[2][1]) / 3];
    [['P', tP], ['Q', tQ], ['R', tR]].forEach(([nm, t]) => { const c = cen(t); out += h.tx(X(c), Y(c) + 1.1, nm, 3.2, 'middle', ' class="pl"'); });
    const s = 2.2;   // 直角のしるし（C）
    out += `<polyline points="${h.f2(X(C) + s)},${h.f2(Y(C))} ${h.f2(X(C) + s)},${h.f2(Y(C) - s)} ${h.f2(X(C))},${h.f2(Y(C) - s)}" fill="none" stroke="#222" stroke-width="0.25"/>`;
    return out;
  });

  // （8）：長方形 ABCD（A が左上、B が左下、C が右下）と、対角線 AC、B から AC への垂線 BH
  const rectFig = SVG((W, H, h) => {
    const w = 12, ht = 9, A = [0, ht], Bp = [0, 0], C = [w, 0], D = [w, ht];
    const ac = [C[0] - A[0], C[1] - A[1]], t = ((Bp[0] - A[0]) * ac[0] + (Bp[1] - A[1]) * ac[1]) / (ac[0] ** 2 + ac[1] ** 2), Hp = [A[0] + t * ac[0], A[1] + t * ac[1]];
    const k = Math.min((W - 36) / w, (H - 12) / ht), ox = (W - w * k) / 2, oy = H - 6, X = p => ox + p[0] * k, Y = p => oy - p[1] * k;
    let out = `<polygon points="${[A, Bp, C, D].map(p => h.f2(X(p)) + ',' + h.f2(Y(p))).join(' ')}" fill="none" stroke="#222" stroke-width="0.34" stroke-linejoin="round"/>`;
    out += h.ln(X(A), Y(A), X(C), Y(C), '#222', 0.28) + h.ln(X(Bp), Y(Bp), X(Hp), Y(Hp), '#222', 0.28);
    const ux = (A[0] - Hp[0]), uy = (A[1] - Hp[1]), ul = Math.hypot(ux, uy), vx = Bp[0] - Hp[0], vy = Bp[1] - Hp[1], vl = Math.hypot(vx, vy), s = 1.8 / k;   // 直角のしるし（H）
    const p1 = [Hp[0] + ux / ul * s, Hp[1] + uy / ul * s], p2 = [p1[0] + vx / vl * s, p1[1] + vy / vl * s], p3 = [Hp[0] + vx / vl * s, Hp[1] + vy / vl * s];
    out += `<polyline points="${[p1, p2, p3].map(p => h.f2(X(p)) + ',' + h.f2(Y(p))).join(' ')}" fill="none" stroke="#222" stroke-width="0.22"/>`;
    out += `<circle cx="${h.f2(X(Hp))}" cy="${h.f2(Y(Hp))}" r="0.55" fill="#222"/>`;
    out += h.tx(X(A) - 2.4, Y(A) - 0.6, 'A', 3.1, 'end', ' class="pl"') + h.tx(X(Bp) - 2.4, Y(Bp) + 3, 'B', 3.1, 'end', ' class="pl"') + h.tx(X(C) + 2.4, Y(C) + 3, 'C', 3.1, 'start', ' class="pl"') + h.tx(X(D) + 2.4, Y(D) - 0.6, 'D', 3.1, 'start', ' class="pl"');
    out += h.tx(X(Hp) + 2.4, Y(Hp) - 1.2, 'H', 3.1, 'start', ' class="pl"') + h.rich(X(A) - 3.4, (Y(A) + Y(Bp)) / 2 + 1, '9cm', 2.9, 'end') + h.rich((X(Bp) + X(C)) / 2, Y(Bp) + 4.6, '12cm', 2.9, 'middle');
    return out;
  });

  // 検算の道具：図形を座標にして、長さ・面積をはかる
  const LIB = 'const hyp = Math.hypot, sq = Math.sqrt, d2 = (p, q) => hyp(p[0] - q[0], p[1] - q[1]),'
    // 3つの点でつくる三角形の面積（座標の公式）
    + ' area = (p, q, r) => Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / 2,'
    // 辺 pq を 1辺とする正三角形の、頂点を 1つ（外がわ）
    + ' eqApex = (p, q) => { const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], dx = q[0] - p[0], dy = q[1] - p[1]; return [m[0] - dy * sq(3) / 2, m[1] + dx * sq(3) / 2]; },'
    // 余弦定理：辺 a、b をはさむ角が直角か（cos＝0）
    + ' cosC = (a, b, c) => (a * a + b * b - c * c) / (2 * a * b);';

  IK.lesson('sanhei-12', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第12時', title: '「三平方の定理」で学んだことを、整理して確かめよう',
    summary: '単元のまとめ。正三角形の高さ・座標平面の2点間・円の弦・直方体の対角線で、直角三角形を見つける・つくる場所を確かめ、定理とその逆を使って長さを求める。考えようでは、3辺の上に正三角形をかいても、面積の関係が成り立つかを調べる。',
    head: '三平方の定理　第12時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い（答えは B の板書の例）ア 1辺 8 の正三角形：高さ 4√3　イ A(1,1)・B(5,4)：5　ウ 半径 5・中心から 3：弦 8　エ 3・4・12 の直方体：対角線 13
      `(() => { ${LIB} const a = [[0, 0], [8, 0], [4, 4 * sq(3)]]; const o = [0, 0], A = [-4, -3], Bp = [4, -3]; return near(d2(a[0], a[1]), 8) && near(d2(a[1], a[2]), 8) && near(d2(a[0], a[2]), 8) && near(d2(a[2], [4, 0]), 4 * sq(3)) && near(d2([1, 1], [5, 4]), 5) && near(d2(o, A), 5) && near(d2(o, Bp), 5) && near(d2(A, Bp), 8) && near(hyp(3, 4, 12), 13); })()`,
      // 例題：ア 5・12・13（直角をはさむ 5・12 のとき、斜辺 13）　イ 4・6・7（余弦が 0 でない＝直角でない）　ウ 3・√7・4（直角をはさむ 3・√7 のとき、斜辺 4）
      `(() => { ${LIB} return near(d2([0, 0], [5, 12]), 13) && Math.abs(cosC(4, 6, 7)) > 0.01 && near(d2([3, 0], [0, sq(7)]), 4) && near(cosC(3, sq(7), 4), 0) && near(cosC(5, 12, 13), 0); })()`,
      // （1）直角をはさむ 4・6：斜辺 2√13　（2）斜辺 12・1辺 8：残り 4√5（座標 (8,0)・(0,y) の長さが 12）
      `(() => { ${LIB} return near(d2([4, 0], [0, 6]), 2 * sq(13)) && near(d2([8, 0], [0, 4 * sq(5)]), 12); })()`,
      // （3）6・7・9 は直角でない（余弦）、3・2√10・7 は直角（3 と 2√10 をはさむ角）
      `(() => { ${LIB} return Math.abs(cosC(6, 7, 9)) > 0.01 && near(cosC(3, 2 * sq(10), 7), 0); })()`,
      // （4）1辺 12 の正三角形：高さ 6√3（頂点 (6, 6√3) までの長さが 12）、面積 36√3
      `(() => { ${LIB} const a = [0, 0], b = [12, 0], c = [6, 6 * sq(3)]; return near(d2(a, c), 12) && near(d2(b, c), 12) && near(area(a, b, c), 36 * sq(3)); })()`,
      // （5）A(−3,1)・B(2,5)：√41　（6）半径 7・中心から弦まで 3：弦 4√10（端点 (±2√10, −3) が円の上）
      `(() => { ${LIB} return near(d2([-3, 1], [2, 5]), sq(41)) && near(d2([0, 0], [2 * sq(10), -3]), 7) && near(d2([-2 * sq(10), -3], [2 * sq(10), -3]), 4 * sq(10)); })()`,
      // （7）考えよう（答えは紙面に載せない）：直角三角形 3・4・5 の 3辺を 1辺とする正三角形の面積 9√3÷4・4√3・25√3÷4（座標の面積）。P＋Q＝R。5・12・13 でも成り立つ
      `(() => { ${LIB} const eqA = (p, q) => area(p, q, eqApex(p, q)); const C = [0, 0], Bp = [3, 0], A = [0, 4]; const P = eqA(C, Bp), Q = eqA(C, A), R = eqA(Bp, A); const C2 = [0, 0], B2 = [5, 0], A2 = [0, 12]; return near(P, 9 * sq(3) / 4) && near(Q, 4 * sq(3)) && near(R, 25 * sq(3) / 4) && near(P + Q, R) && near(eqA(C2, B2) + eqA(C2, A2), eqA(B2, A2)); })()`,
      // （8）長方形 AB＝9・BC＝12：AC＝15、B から AC への垂線の足 H（座標で射影）→ BH＝36/5、AH＝27/5
      `(() => { ${LIB} const A = [0, 9], Bp = [0, 0], C = [12, 0], ac = [C[0] - A[0], C[1] - A[1]], t = ((Bp[0] - A[0]) * ac[0] + (Bp[1] - A[1]) * ac[1]) / (ac[0] ** 2 + ac[1] ** 2), H = [A[0] + t * ac[0], A[1] + t * ac[1]]; return near(d2(A, C), 15) && near(d2(Bp, H), 36 / 5) && near(d2(A, H), 27 / 5) && near((H[0] - Bp[0]) * ac[0] + (H[1] - Bp[1]) * ac[1], 0); })()`,
      // 小テスト（1）直角をはさむ 5・10：斜辺 5√5　（2）5・6・8 は直角でない、4・2√5・6 は直角
      `(() => { ${LIB} return near(d2([5, 0], [0, 10]), 5 * sq(5)) && Math.abs(cosC(5, 6, 8)) > 0.01 && near(cosC(4, 2 * sq(5), 6), 0); })()`,
      // 小テスト（3）1辺 6 の正三角形：高さ 3√3、面積 9√3　（4）2・4・5 の直方体：対角線 3√5
      `(() => { ${LIB} const a = [0, 0], b = [6, 0], c = [3, 3 * sq(3)]; return near(d2(a, c), 6) && near(d2(b, c), 6) && near(area(a, b, c), 9 * sq(3)) && near(hyp(2, 4, 5), 3 * sq(5)); })()`,
      // 小テスト（5）チャレンジ：半径 10・中心から弦まで 6：弦 16（端点 (±8, −6) が円の上）
      `(() => { ${LIB} return near(d2([0, 0], [8, -6]), 10) && near(d2([-8, -6], [8, -6]), 16); })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('直角三角形を見つけたり、つくったりして、長さを求めよう'),
      K('今日の問い', 'ア〜エの x の長さを求めるには、どこに直角三角形をつくればよいだろう。図にかきこんで、使う辺を書こう。', 2),
      F(5, figA, figB, figC, figD),
      T('①', '自分の考え（3分）　かきこんだ直角三角形と、斜辺を書こう。', 1),
      B(4, '（例）ア 頂点から底辺に垂線 → 斜辺 8、底辺の半分 4　x＝4√{3}\nイ 2点を斜辺にして、軸に平行な線 → 4 と 3　x＝5\nウ 中心から弦に垂線 → 斜辺は半径 5、もう 1辺 3　弦＝4×2＝8\nエ 底面の対角線 5 と高さ 12 を 2辺とする → x＝13'),
      T('②', 'ペアの考え（3分）　自分とちがう見つけ方があれば書こう。', 1),
      B(2, ''),
      G(1),
      WD('直角の向かいの辺を{{斜辺}}という。\n斜辺を c とすると a^2+b^2＝{{c^2}}\n3辺が a^2+b^2＝c^2 なら{{直角三角形}}。\n図形の中に直角三角形を{{見つける}}・{{つくる}}。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '3辺の長さが次のようなア〜ウは、直角三角形だろうか。表を完成させて、○か×で答えよう。', 2),
      TB('三角形', ['ア', 'イ', 'ウ'], [
        ['3辺の長さ（cm）', ['5、12、13', '4、6、7', '3、√{7}、4']],
        ['短い 2辺の 2乗の和', ['{{25+144＝169}}', '{{16+36＝52}}', '{{9+7＝16}}']],
        ['いちばん長い辺の 2乗', ['{{169}}', '{{49}}', '{{16}}']],
        ['直角三角形か', ['{{○}}', '{{×}}', '{{○}}']]
      ], { hw: 50 }),
      T('', '【判定のくふう】どの辺を斜辺と考えて、たしかめればよいだろう。', 1),
      B(3, 'いちばん長い辺を c にして、a^2+b^2 と c^2 をくらべる。\n等しければ直角三角形、等しくなければ直角三角形ではない。\n（イ）52 と 49 は等しくないので、直角三角形ではない。')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 直角三角形の、直角の向かいの辺を{{斜辺}}という。\n② 1辺 a の正方形の対角線は{{√{2}a }}、正三角形の高さは{{[[√{3}/2]]a}}。\n③ 斜辺を c、ほかの 2辺を a、b とすると、{{a^2+b^2＝c^2}}が成り立つ。\n④ a^2+b^2＝c^2 が成り立つ三角形は、{{直角三角形}}である。（定理の{{逆}}）', 4, { label: 'ことば' }),
      C2([
        T('（1）', '直角をはさむ 2辺が 4cm、6cm の直角三角形の、斜辺の長さは？', 3),
        B(3, '√(4^2+6^2)＝√52\n＝2√{13}（cm）')
      ], [
        T('（2）', '斜辺が 12cm、ほかの 1辺が 8cm の直角三角形の、残りの辺の長さは？', 3),
        B(3, '√(12^2−8^2)＝√80\n＝4√{5}（cm）')
      ], '1:1'),
      MA('【説明】直角三角形をつくった場面を、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '直角三角形を見つけたり、つくったりして、求めよう。'),
      C2([
        T('（3）', '3辺が次の三角形のうち、直角三角形はどちらか。\nア 6cm、7cm、9cm\nイ 3cm、2√{10}cm、7cm', 4),
        B(3, 'ア 6^2+7^2＝85　9^2＝81\nイ 3^2+(2√{10})^2＝49＝7^2\n答え イ')
      ], [
        T('（4）', '1辺が 12cm の正三角形の、高さと面積を求めよう。', 3),
        B(4, '高さ √(12^2−6^2)＝6√{3}（cm）\n面積 [[1/2]]×12×6√{3}\n＝36√{3}（cm^2）')
      ], '1:1'),
      C2([
        T('（5）', '2点 A(−3, 1)、B(2, 5) の間のきょりは？', 3),
        B(3, '横 5、たて 4\n√(5^2+4^2)＝√{41}')
      ], [
        T('（6）', '半径 7cm の円 O で、中心から 3cm はなれた弦の長さは？', 3),
        B(4, 'OA＝7、OH＝3\nAH＝√(7^2−3^2)＝2√{10}\n弦 AB＝2×2√{10}\n＝4√{10}（cm）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：正三角形でも、成り立つだろうか。'),
      T('（7）', '直角三角形の 3辺を 1辺とする正三角形 P、Q、R の面積を求めよう。どんなことに気づくだろう。', 2),
      F(6, triFig),
      TB('正三角形', ['P', 'Q', 'R'], [
        ['1辺の長さ（cm）', ['3', '4', '5']],
        ['面積（cm^2）', ['', '', '']]
      ], { hw: 44 }),
      C2([
        T('', '気づいたこと', 1),
        B(6, '')
      ], [
        T('', 'ほかの図形でも、確かめよう。', 1),
        B(6, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', '長方形 ABCD で、AB＝9cm、BC＝12cm である。頂点 B から対角線 AC に垂線 BH をひく。\n① AC　② BH　③ AH の長さを求めよう。', 5),
        B(7, '① √(9^2+12^2)＝15（cm）\n② △ABC の面積から\n　 [[1/2]]×15×BH\n　 ＝[[1/2]]×9×12\n　 BH＝[[36/5]]（cm）\n③ AH＝√(9^2−([[36/5]])^2)\n　 ＝[[27/5]]（cm）')
      ], [
        F(4, rectFig),
        MA('① BH を 1辺とする直角三角形は、いくつ見つかるかな。\n② △ABC の面積を、2通りに表してみよう。', 8, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      T('（1）', '直角をはさむ 2辺が 5cm、10cm の直角三角形の、斜辺の長さを求めよう。（2点）', 2),
      B(2, '√(5^2+10^2)＝√125＝5√{5}（cm）'),
      T('（2）', '3辺が次の三角形のうち、直角三角形はどちらか。（2点）\nア 5cm、6cm、8cm　　イ 4cm、2√{5}cm、6cm', 2),
      B(2, 'ア 5^2+6^2＝61、8^2＝64　　イ 4^2+(2√{5})^2＝36＝6^2\n答え イ'),
      T('（3）', '1辺が 6cm の正三角形の、高さと面積を求めよう。（3点）', 1),
      B(3, '高さ √(6^2−3^2)＝3√{3}（cm）\n面積 [[1/2]]×6×3√{3}＝9√{3}（cm^2）'),
      T('（4）', '3辺が 2cm、4cm、5cm の直方体の、対角線の長さを求めよう。（3点）', 2),
      B(2, '√(2^2+4^2+5^2)＝√45＝3√{5}（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '半径 10cm の円 O で、中心から 6cm はなれた弦の長さを求めよう。', 2),
      B(4, '中心から弦に垂線をひくと、弦の半分は\n√(10^2−6^2)＝8（cm）\n弦の長さは 8×2＝16（cm）')
    ]
  });
})();
