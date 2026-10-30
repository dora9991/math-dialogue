/* 三平方の定理（新しい形） 第10時：立体の表面を通る、いちばん短い道のりを求めよう。
   元：授業ナビ標準版 sanhei-10（探）。直方体の頂点 A から G まで、辺 BF・BC・EF を通る3つの広げ方をくらべる課題を「今日の問い」に、円錐の側面を1周するひも（問題）を「例題」に、
   「直方体の形をかえても、最短になる通り方に、きまりはあるか」を考えよう（演習プリント（7））にした（元の考える問い＝円柱を1周するひもは、演習プリント（4）に回した）。
   ・ワークシートは A4 1枚：問いは1つ（予想して確かめる。数値・図は全部印刷）。個人3分 → ペア3分 → ことば → 例題（円錐。おうぎ形の図に空欄）。
   ・演習プリントは表裏：表＝確かめる 2問・使ってみる 4問／裏＝ひろげる（考えよう・答えなし）・チャレンジ★★（辺 BF 上の点 P。ヒントカードつき）。
   ・最短の道のりは、どの問題も、展開図の上で1通りに決まるようにした（辺を指定する・立方体で対称・円錐と円柱の1周）。問題の数値は新しく作り、答えは checks で、
     2つの面を辺のまわりに回して同じ平面にのせる計算（3次元の座標）と、円柱のらせんを細かい線分でたどる計算で、別の式から出しなおした。
   検算：node tools/verify.cjs sanhei-10　／　見た目：node tools/check.cjs <出力先> sanhei-10 */
(function () {
  const { M, K, B, G, F, C2, T, HD, BR, WD, MA, TB, SO, SVG } = IK.b;
  const RED = '#d62828';

  /* ---- 見取図（ななめ投影。手前の面がゆがまない）。凸の立体。かくれた辺は点線。
     V：頂点 [x,y,z]（y が奥行き、z が高さ）／ F：面（頂点の番号）／ names：頂点の字（V と同じ順。空白は書かない）／ nd：{ 番号: [x, y] } 字をおく向き（画面。y は下向き）
     dims：[{ a, b, t, n }] … 頂点 a-b の辺に長さの字 t（n＝字の向き）／ cap：図の見出し
     pts：[{ p, t, to }] … 点（●）と字　　segs：[{ p, q, dash, ans, t, to }]（3次元の点 2つの線分。ans＝解答のときだけ赤）
     pad：余白 mm（数 か [左, 上, 右, 下]） ---- */
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
    const pts = (o.pts || []).map(q => Object.assign({}, q, { s: P(q.p) }));
    const all = [...S, ...segs.flatMap(s => [s.a, s.b]), ...pts.map(q => q.s)];
    const x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0])), y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
    const pd = Array.isArray(o.pad) ? o.pad : [o.pad || 8, o.pad || 8, o.pad || 8, o.pad || 8];
    const k = Math.min((W - pd[0] - pd[2]) / (x1 - x0), (H - pd[1] - pd[3]) / (y1 - y0));
    const ox = pd[0] + (W - pd[0] - pd[2] - (x1 - x0) * k) / 2 - x0 * k, oy = pd[1] + (H - pd[1] - pd[3] - (y1 - y0) * k) / 2 + y1 * k;
    const X = p => ox + p[0] * k, Y = p => oy - p[1] * k, cs = [X(mean(S)), Y(mean(S))];
    const dashA = ' stroke-dasharray="1.2 0.9"';
    let out = '', red = '';
    edges.filter(e => e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#555', 0.22, dashA); });
    edges.filter(e => !e.hidden).forEach(e => { out += h.ln(X(S[e.i]), Y(S[e.i]), X(S[e.j]), Y(S[e.j]), '#222', 0.34, ' stroke-linecap="round"'); });
    segs.forEach(s => {
      const col = s.ans ? RED : '#222', w = s.ans ? 0.5 : 0.22;
      let g = h.ln(X(s.a), Y(s.a), X(s.b), Y(s.b), col, w, s.dash ? dashA : '');
      if (s.t) g += h.rich((X(s.a) + X(s.b)) / 2 + (s.to ? s.to[0] : 0), (Y(s.a) + Y(s.b)) / 2 + (s.to ? s.to[1] : 0) + 1, s.t, 2.9, s.anchor || 'middle');
      if (s.ans) red += g; else out += g;
    });
    pts.forEach(q => { out += `<circle cx="${h.f2(X(q.s))}" cy="${h.f2(Y(q.s))}" r="0.55" fill="#222"/>`; if (q.t) { const to = q.to || [2.4, -1.8]; out += h.tx(X(q.s) + to[0], Y(q.s) + to[1] + 1, q.t, 3.1, 'middle', ' class="pl"'); } });
    (o.dims || []).forEach(d => {
      const p = S[d.a], q = S[d.b], mx = (X(p) + X(q)) / 2, my = (Y(p) + Y(q)) / 2;
      let n = d.n;
      if (!n) { n = [-(Y(q) - Y(p)), X(q) - X(p)]; const L = Math.hypot(n[0], n[1]) || 1; n = [n[0] / L, n[1] / L]; if (n[0] * (mx - cs[0]) + n[1] * (my - cs[1]) < 0) n = [-n[0], -n[1]]; }
      out += h.rich(mx + n[0] * 3, my + n[1] * 3 + 1, d.t, 2.9, Math.abs(n[0]) < 0.4 ? 'middle' : n[0] > 0 ? 'start' : 'end');
    });
    Array.from(o.names || '').forEach((nm, i) => {
      if (!nm || nm === ' ') return;
      let dx = X(S[i]) - cs[0], dy = Y(S[i]) - cs[1]; if (o.nd && o.nd[i]) [dx, dy] = o.nd[i];
      const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L;
      out += h.tx(X(S[i]) + dx * 2.8, Y(S[i]) + dy * 2.8 + 1.1, nm, 3.1, Math.abs(dx) < 0.3 ? 'middle' : dx > 0 ? 'start' : 'end', ' class="pl"');
    });
    return (o.cap ? h.tx(W / 2, 3.5, o.cap, 3, 'middle', ' class="cap"') : '') + out + (red ? h.ans(red) : '');
  }, fo);

  // 直方体 ABCD−EFGH（ABCD が下の面、EFGH が上の面。A が手前の左、AE・BF・CG・DH が高さ）。w＝AB、d＝AD（＝BC）、hh＝AE
  const box = (w, d, hh, o) => obl(Object.assign({
    V: [[0, 0, 0], [w, 0, 0], [w, d, 0], [0, d, 0], [0, 0, hh], [w, 0, hh], [w, d, hh], [0, d, hh]],
    F: [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]],
    names: 'ABCDEFGH', nd: { 0: [-1, 0.6], 1: [0.3, 1], 2: [1, 0.3], 3: [-1, 0.2], 4: [-1, -0.3], 5: [-0.7, -0.8], 6: [0.6, -0.8], 7: [-0.5, -1] }
  }, o));

  // 円錐の側面の展開図（おうぎ形）：頂点 O が上。半径 R、中心角 th（度）。A、A′ は弧の両はし。解答のときだけ、ひも AA′（赤）と、その長さ
  const fan = (R, th, o) => SVG((W, H, h) => {
    const a = th / 2 * Math.PI / 180, sx = Math.sin(a), cy = Math.cos(a);
    const padL = 11, padR = 11, padT = 8, padB = 4;
    const s = Math.min((W - padL - padR) / (2 * R * sx), (H - padT - padB) / R), cx = W / 2, oy = padT;
    const X = x => cx + x * s, Y = y => oy + y * s;
    const arc = []; for (let k = 0; k <= 60; k++) { const t = -a + 2 * a * k / 60; arc.push([R * Math.sin(t), R * Math.cos(t)]); }
    let out = `<polygon points="${[[0, 0], ...arc].map(p => h.f2(X(p[0])) + ',' + h.f2(Y(p[1]))).join(' ')}" fill="none" stroke="#222" stroke-width="0.34" stroke-linejoin="round"/>`;
    // 中心角の弧と字
    const r1 = 0.22 * R, ang = []; for (let k = 0; k <= 20; k++) { const t = -a + 2 * a * k / 20; ang.push([r1 * Math.sin(t), r1 * Math.cos(t)]); }
    out += `<polyline points="${ang.map(p => h.f2(X(p[0])) + ',' + h.f2(Y(p[1]))).join(' ')}" fill="none" stroke="#222" stroke-width="0.25"/>`;
    out += h.rich(X(0), Y(0.52 * R * Math.min(1, cy + 0.2)), o.ang, 2.9, 'middle');
    out += h.tx(X(0), oy - 1.8, 'O', 3.1, 'middle', ' class="pl"');
    out += h.tx(X(-R * sx) - 1.6, Y(R * cy) + 1.2, 'A', 3.1, 'end', ' class="pl"') + h.tx(X(R * sx) + 1.6, Y(R * cy) + 1.2, 'A′', 3.1, 'start', ' class="pl"');
    // 半径の字（左の辺の外がわ）
    const mx = X(-R * sx / 2), my = Y(R * cy / 2);
    out += h.rich(mx - 4.2, my + 1, o.rad, 2.9, 'end');
    return out + h.ans(h.ln(X(-R * sx), Y(R * cy), X(R * sx), Y(R * cy), RED, 0.55, ' stroke-linecap="round"') + h.tx(X(0), Y(R * cy) + 4.4, o.ans, 3, 'middle'));
  }, o && o.fo);

  // 検算の道具：直方体の表面を通る 2つの面を、辺のまわりに回して同じ平面にのせ（3次元の回転）、A と G の距離をはかる。辺は BF・BC・EF・DH・DC・EH の 6通り
  const boxLib = () => {
    const sub = (p, q) => p.map((v, i) => v - q[i]), add = (p, q) => p.map((v, i) => v + q[i]), mul = (p, k) => p.map(v => v * k);
    const dot = (p, q) => p.reduce((s, v, i) => s + v * q[i], 0), cross = (p, q) => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]], nrm = p => Math.hypot(...p);
    const rot = (p, o, ax, ang) => { const v = sub(p, o), c = Math.cos(ang), s = Math.sin(ang); return add(o, add(add(mul(v, c), mul(cross(ax, v), s)), mul(ax, dot(ax, v) * (1 - c)))); };
    const NORM = { ABCD: [0, 0, -1], EFGH: [0, 0, 1], ABFE: [0, -1, 0], DCGH: [0, 1, 0], ADHE: [-1, 0, 0], BCGF: [1, 0, 0] };
    const ROUTES = { BF: ['ABFE', 'BCGF'], BC: ['ABCD', 'BCGF'], EF: ['ABFE', 'EFGH'], DH: ['ADHE', 'DCGH'], DC: ['ABCD', 'DCGH'], EH: ['ADHE', 'EFGH'] };
    const unfold = (w, d, h, e) => {
      const P = { A: [0, 0, 0], B: [w, 0, 0], C: [w, d, 0], D: [0, d, 0], E: [0, 0, h], F: [w, 0, h], G: [w, d, h], H: [0, d, h] };
      const [f1, f2] = ROUTES[e], n1 = NORM[f1], n2 = NORM[f2], a = P[e[0]], b = P[e[1]], ax = mul(sub(b, a), 1 / nrm(sub(b, a)));
      const t = Math.acos(dot(n1, n2));
      const ang = [t, -t].find(g => nrm(sub(sub(rot(add(a, n2), a, ax, g), a), n1)) < 1e-9);
      return nrm(sub(rot(P.G, a, ax, ang), P.A));
    };
    return { unfold, all: (w, d, h) => Object.keys(ROUTES).map(e => unfold(w, d, h, e)) };
  };
  const LIB = `const L = (${boxLib.toString()})(), sq = Math.sqrt, hyp = Math.hypot,`
    // おうぎ形：中心 O、半径 R、中心角は、弧の長さ＝底面の円周（2πr）から出す。ひも＝A と A′ の距離（座標）
    + ' fan = (r, l) => { const th = 2 * PI * r / l, A = [l, 0], A2 = [l * Math.cos(th), l * Math.sin(th)]; return { th, d: hyp(A[0] - A2[0], A[1] - A2[1]) }; },'
    // 円柱の側面を 1周するらせん（A＝(r,0,0) から B＝(r,0,hh)）を、N 個の線分でたどった長さ
    + ' helix = (r, hh, N) => { let s = 0, p = [r, 0, 0]; for (let i = 1; i <= N; i++) { const t = 2 * PI * i / N, q = [r * Math.cos(t), r * Math.sin(t), hh * i / N]; s += hyp(q[0] - p[0], q[1] - p[1], q[2] - p[2]); p = q; } return s; },'
    // 辺 BF 上の点 P（B から t の高さ）で、AP＋PG が最小になる t（3分探索）。A、G は 面 ABFE と 面 BCGF の上で、それぞれ P と同じ平面内
    + ' bestP = (ab, bc, hh) => { const f = t => hyp(ab, t) + hyp(bc, hh - t); let lo = 0, hi = hh; for (let i = 0; i < 200; i++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (f(m1) < f(m2)) hi = m2; else lo = m1; } return { t: (lo + hi) / 2, v: f((lo + hi) / 2) }; };';

  IK.lesson('sanhei-10', {
    unit: 'sanhei', unitName: '三平方の定理', form: 'new', no: '第10時', title: '立体の表面を通る、いちばん短い道のりを求めよう',
    summary: '直方体の表面を通るひもを、通る辺をかえて3通りくらべ、面を広げた図（展開図）の上で2点を結ぶ線分がいちばん短いことをつかむ。円錐の側面を1周するひもは、おうぎ形の中心角を求めて、直角三角形で長さを求める。考えようでは、直方体の形と、最短になる辺のきまりを調べる。',
    head: '三平方の定理　第10時',
    pitch: 8, dots: true,
    checks: [
      // 今日の問い：直方体 AB＝6・AD＝4・AE＝2。辺 BF → 2√26、辺 BC → 4√5、辺 EF → 6√2（6通りの広げ方のうち、いちばん短いのは 6√2。ほかの 5通りより、はっきり短い）
      `(() => { ${LIB} const u = L.all(6, 4, 2), m = Math.min(...u); return near(u[0], 2 * sq(26)) && near(u[1], 4 * sq(5)) && near(u[2], 6 * sq(2)) && near(m, 6 * sq(2)) && u.filter(x => near(x, m)).length === 2 && u[2] < u[1] && u[1] < u[0]; })()`,
      // 例題：円錐 半径 2・母線 8。中心角 90°、ひも AA′＝8√2
      `(() => { ${LIB} const f = fan(2, 8); return near(f.th, PI / 2) && near(f.d, 8 * sq(2)); })()`,
      // （1）図1 直方体 AB＝5・AD＝3・AE＝4：辺 BC を通る 3√10　（5）辺 EF を通る √74
      `(() => { ${LIB} const u = L.all(5, 3, 4); return near(u[1], 3 * sq(10)) && near(u[2], sq(74)); })()`,
      // （2）立方体 1辺 5：6通りの広げ方が、すべて 5√5
      `(() => { ${LIB} return L.all(5, 5, 5).every(x => near(x, 5 * sq(5))); })()`,
      // （3）円錐 半径 3・母線 12：中心角 90°、12√2　（6）半径 2・母線 6：中心角 120°、6√3
      `(() => { ${LIB} const a = fan(3, 12), b = fan(2, 6); return near(a.th, PI / 2) && near(a.d, 12 * sq(2)) && near(b.th, 2 * PI / 3) && near(b.d, 6 * sq(3)); })()`,
      // （4）円柱 半径 3・高さ 8π：1周するらせんの長さ 10π（20万個の線分でたどる）
      `(() => { ${LIB} return Math.abs(helix(3, 8 * PI, 200000) / (10 * PI) - 1) < 1e-9; })()`,
      // （7）考えよう（答えは紙面に載せない）：2×3×6 の直方体を 3つの向きに置く。（長さ）^2 は、辺 BF・BC・EF の順に ア＝61・73・85、イ＝85・61・73、ウ＝85・73・61。どれも最短は、いちばん長い辺（6）と平行な辺
      `(() => { ${LIB} const sqs = (w, d, h) => L.all(w, d, h).slice(0, 3).map(x => Math.round(x * x)).join(); return sqs(2, 3, 6) === "61,73,85" && sqs(3, 6, 2) === "85,61,73" && sqs(6, 3, 2) === "85,73,61"; })()`,
      // （8）直方体 AB＝4・AD＝2・AE＝3、辺 BF 上の点 P：AP＋PG の最小は 3√5（辺 BF を通る 面 2つの広げ方と同じ）、そのとき BP＝2
      `(() => { ${LIB} const r = bestP(4, 2, 3); return near(r.v, 3 * sq(5)) && near(r.v, L.all(4, 2, 3)[0]) && Math.abs(r.t - 2) < 1e-6; })()`,
      // 小テスト（1）図の直方体 AB＝4・AD＝2・AE＝1：辺 EF を通る 5
      `(() => { ${LIB} return near(L.all(4, 2, 1)[2], 5); })()`,
      // 小テスト（2）（3）円錐 半径 3・母線 9：中心角 120°、ひも 9√3　（4）円柱 半径 2・高さ 3π：5π
      `(() => { ${LIB} const f = fan(3, 9); return near(f.th, 2 * PI / 3) && near(f.d, 9 * sq(3)) && Math.abs(helix(2, 3 * PI, 200000) / (5 * PI) - 1) < 1e-9; })()`,
      // 小テスト（5）チャレンジ：立方体 1辺 6、辺 BF 上の点 P：AP＋PG の最小 6√5、BP＝3
      `(() => { ${LIB} const r = bestP(6, 6, 6); return near(r.v, 6 * sq(5)) && Math.abs(r.t - 3) < 1e-6; })()`
    ],

    /* ================= ワークシート（A4 1枚・約12分） ================= */
    ws: [
      M('立体の表面を通る、いちばん短い道のりを求めよう'),
      K('今日の問い', '図の直方体で、A から G まで、表面にそってひもをかける。いちばん短いのは、辺 BF・BC・EF のどれを通るときだろう。予想して、確かめよう。', 2),
      F(5, box(6, 4, 2, { dims: [{ a: 0, b: 1, t: 'AB 6cm', n: [0, 1] }, { a: 1, b: 2, t: 'BC 4cm', n: [1, 0.4] }, { a: 0, b: 4, t: 'AE 2cm', n: [-1, 0] }], pad: [14, 6, 24, 8] })),
      T('①', '自分の考え（3分）　予想と、確かめ方を書こう。', 1),
      B(4, '（例）面を広げると、ひもは A と G を結ぶ線分になる。\n辺 BF … √((6+4)^2+2^2)＝√104＝2√{26}\n辺 BC … √((6+2)^2+4^2)＝√80＝4√{5}\n辺 EF … √(6^2+(2+4)^2)＝√72＝6√{2}　→　最短'),
      T('②', 'ペアの考え（3分）　自分とちがう考えを書こう。', 1),
      B(2, ''),
      G(1),
      WD('立体の面を平らに広げた図を{{展開図}}という。\n最短の道のりは、展開図で 2点を結ぶ{{線分}}。\n円錐の側面を広げると{{おうぎ形}}になる。\nおうぎ形の弧の長さは、底面の{{円周}}に等しい。', 4, { label: 'ことば（教科書で調べよう）' }),
      G(1),
      K('例題', '底面の半径 {{2}}cm、母線 {{8}}cm の円錐の、底面の円周上の点 A から、側面を 1周して A にもどるひもの、最短の長さを求めよう。', 2),
      F(5, SO({ shape: 'cone', a: 2, c: Math.sqrt(60), dims: 'r {{2}}cm\nl {{8}}cm', w: 0.8 }), fan(8, 90, { ang: '{{90}}°', rad: '{{8}}cm', ans: '8√2 cm' })),
      T('', '【中心角のくふう】側面のおうぎ形の中心角は、どう求めるだろう。', 1),
      B(3, '弧の長さ＝底面の円周＝2π×2＝4π　　半径 8cm の円の周＝2π×8＝16π\n中心角＝360°×[[4π/16π]]＝90°\n直角二等辺三角形の斜辺だから　ひも＝8√{2}cm')
    ],

    /* ================= 演習プリント（A4 表裏） ================= */
    dr: [
      HD('確かめる', 'ことばと、基本をたしかめよう。'),
      WD('① 立体の面を平らに広げた図を{{展開図}}という。\n② 表面を通る最短の道のりは、展開図の上で 2点を結ぶ{{線分}}。\n③ 円錐の側面は{{おうぎ形}}で、弧の長さは底面の{{円周}}に等しい。\n④ 円柱の側面は{{長方形}}で、横の長さは底面の{{円周}}に等しい。', 4, { label: 'ことば' }),
      F(4,
        box(5, 3, 4, { cap: '図1　AB 5cm、BC 3cm、AE 4cm', names: 'ABC EFG', pad: [8, 8, 10, 6] }),
        SO({ shape: 'cone', a: 3, c: Math.sqrt(135), dims: 'r 3cm\nl 12cm', caption: '図2' }),
        SO({ shape: 'cylinder', a: 3, c: 6, dims: 'r 3cm\nh 8πcm', caption: '図3' })),
      C2([
        T('（1）', '図1で、A から G まで、辺 BC を通るひもの最短の長さは？', 2),
        B(3, '2つの面を広げると\nたて 3cm、横 5+4＝9cm\n√(9^2+3^2)＝3√{10}（cm）')
      ], [
        T('（2）', '1辺 5cm の立方体で、いちばん遠い 2頂点を表面で結ぶ最短は？', 2),
        B(3, '広げると 5cm と 10cm\n√(5^2+10^2)＝5√{5}（cm）')
      ], '1:1'),
      MA('【説明】面を広げるわけを、隣の人に説明しよう。\n説明できた ☐　　聞いてくれた人（　　　　　　）', 2),
      G(1),
      HD('使ってみる', '展開図をかいて、最短の道のりを求めよう。'),
      C2([
        T('（3）', '図2の円錐の底面の円周上の点 A から、側面を 1周して A にもどるひもの最短の長さは？', 3),
        B(3, '中心角 360°×[[3/12]]＝90°\n直角二等辺三角形だから\n12√{2}（cm）')
      ], [
        T('（4）', '図3の円柱で、底面の円周上の点 A から、真上の点 B まで、側面を 1周するひもの最短の長さは？', 3),
        B(3, '横 2π×3＝6π、たて 8π\n√((6π)^2+(8π)^2)＝10π（cm）')
      ], '1:1'),
      C2([
        T('（5）', '図1で、A から G まで、辺 EF を通るひもの最短の長さは？', 3),
        B(3, '横 5cm、たて 4+3＝7cm\n√(5^2+7^2)＝√{74}（cm）')
      ], [
        T('（6）', '半径 2cm、母線 6cm の円錐で、底面の点 A から側面を 1周して A にもどる最短の長さは？', 3),
        B(4, '中心角 360°×[[2/6]]＝120°\n垂線 OH で 30°・60°・90°\nAH＝6×[[√{3}/2]]＝3√{3}\nAA′＝6√{3}（cm）')
      ], '1:1'),
      G(1),
      T('', '★ ここまでできたら、今日の合格！　　合格 ☐', 1),
      BR(),

      HD('ひろげる', '考えよう：どの辺を通ると、最短になるだろう。'),
      T('（7）', '3つの直方体ア〜ウで、A から G まで、辺 BF・BC・EF を通るときの、ひもの長さの 2乗を求めよう。どんなことに気づくだろう。', 2),
      F(7,
        box(2, 3, 6, { cap: 'ア　AB 2cm、BC 3cm、AE 6cm', names: 'ABC EFG', pad: [8, 9, 10, 6], nd: { 0: [-1, 0.6], 1: [0.3, 1], 2: [1, 0.3], 4: [-1, -0.3], 5: [0.9, 0.5], 6: [0.6, -0.8] } }),
        box(3, 6, 2, { cap: 'イ　AB 3cm、BC 6cm、AE 2cm', names: 'ABC EFG', pad: [8, 9, 10, 6] }),
        box(6, 3, 2, { cap: 'ウ　AB 6cm、BC 3cm、AE 2cm', names: 'ABC EFG', pad: [8, 9, 10, 6] })),
      TB('（長さ）^2', ['ア', 'イ', 'ウ'], [
        ['辺 BF を通る', ['', '', '']],
        ['辺 BC を通る', ['', '', '']],
        ['辺 EF を通る', ['', '', '']]
      ], { hw: 46 }),
      C2([
        T('', '気づいたこと', 1),
        B(5, '')
      ], [
        T('', 'ほかの直方体を 1つ決めて、確かめよう。', 2),
        B(4, '')
      ], '1:1'),
      G(1),
      HD('チャレンジ★★', '入試にも出る問題。ヒントカードを見てもOK。'),
      C2([
        T('（8）', 'AB＝4cm、AD＝2cm、AE＝3cm の直方体 ABCD−EFGH で、辺 BF 上に点 P をとる。AP+PG がいちばん短くなるとき、AP+PG の長さと、BP の長さを求めよう。', 5),
        B(5, '2つの面を広げると 横 6cm、たて 3cm\nAP+PG＝√(6^2+3^2)＝3√{5}（cm）\nA、P、G が一直線のとき最短\nBP＝3×[[4/6]]＝2（cm）')
      ], [
        MA('① 辺 BF をふくむ 2つの面を、1つの平面に広げてみよう。\n② AP+PG がいちばん短いとき、A、P、G は、どんな位置にあるかな。', 9, { label: 'ヒントカード' })
      ], '1:1')
    ],

    /* ================= 小テスト（A4 1枚・5分・10点満点） ================= */
    qz: [
      HD('小テスト', '5分で解こう。　　　　　　　　　　　　　得点（　　　　／10点）'),
      G(1),
      F(4, box(4, 2, 1, { dims: [{ a: 0, b: 1, t: 'AB 4cm', n: [0, 1] }, { a: 1, b: 2, t: 'BC 2cm', n: [1, 0.4] }, { a: 0, b: 4, t: 'AE 1cm', n: [-1, 0] }], pad: [14, 7, 24, 8] })),
      T('（1）', '図の直方体で、A から G まで、辺 EF を通るひもの最短の長さを求めよう。（3点）', 1),
      B(2, '横 4cm、たて 1+2＝3cm の長方形の対角線\n√(4^2+3^2)＝5（cm）'),
      T('（2）', '底面の半径 3cm、母線 9cm の円錐の、側面のおうぎ形の中心角を求めよう。（2点）', 1),
      B(1, '360°×[[3/9]]＝120°'),
      T('（3）', '（2）の円錐の底面の円周上の点 A から、側面を 1周して A にもどるひもの最短の長さを求めよう。（3点）', 2),
      B(3, '半径 9cm、中心角 120° のおうぎ形。O から弦に垂線をひくと\n30°・60°・90° の直角三角形\n9×[[√{3}/2]]×2＝9√{3}（cm）'),
      T('（4）', '底面の半径 2cm、高さ 3π cm の円柱の側面を、A から真上の B まで 1周するひもの最短の長さを求めよう。（2点）', 2),
      B(2, '横 2π×2＝4π、たて 3π\n√((4π)^2+(3π)^2)＝5π（cm）'),
      G(1),
      HD('チャレンジ', '入試レベル（別枠）。正解なら、ほかがまちがっていても 10点。　　正解 ☐'),
      T('（5）', '1辺が 6cm の立方体 ABCD−EFGH で、辺 BF 上に点 P をとる。AP+PG がいちばん短くなるときの、AP+PG の長さと BP の長さを求めよう。', 3),
      B(4, '面 ABFE と 面 BCGF を広げると 横 12cm、たて 6cm\nAP+PG＝√(12^2+6^2)＝6√{5}（cm）\nA、P、G が一直線のとき、P は BF の中点\nBP＝3cm')
    ]
  });
})();
