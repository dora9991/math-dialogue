/* 図形の単元（中2・中3）でよく使う図の道具。点の座標を計算して、問題に書いた角度・長さのとおりにかく（tools/verify.py が確かめる）。すべて自作。
   data ファイルで const { XN, PAR, PARN, ZIG, PO, PG, asa, sas, sss, tf, FIGS } = WSL.HG; として使う。
     XN(向きのならび, 印, o)        … 1点で交わる直線。向き＝[0, 60]（度）。角は、0°の向きから反時計まわりに 0、1、2 … と数える。印＝[[番号, 字, '*'（答え）か '二重'], …]
     PAR(向き, 印, o)                … 平行な2直線 ℓ（上）・m（下）と、それに交わる1つの直線。印＝[['P'（ℓ上の交点）か 'Q'（m上）, 場所, 字, '*'], …]
                                        場所＝'ur'（右上）'ul'（左上）'ll'（左下）'lr'（右下）。o.tilt＝m をかたむける角度（平行でない図）
     PARN([[m上の位置, 向き], …], 印, o) … 交わる直線が2つ以上のとき。印＝[[何本目(0〜), 'P'か'Q', 場所, 字, '*'], …]
     ZIG(角1, 角2, {A, C, E}, o)     … 平行な2直線の間の点 E で折れる線 A−E−C。A は ℓ 上、C は m 上。角1＝ℓ と AE、角2＝m と CE、∠AEC＝角1+角2
     PO(点のならび, 名前, o)          … 多角形。o＝{ ang:{B:'60°'}, len:{BC:'5cm'}, tick:{AB:1}, right:['C'], dirs:{A:'上'}, more:[行…], raw:true（行のまま返す）, open:true（辺をかかない） }
     PG(n, o)                         … 正多角形。o＝{ r, n:'ABCDE', ang:{}, more }
     asa(∠B, BC, ∠C)・sas(AB, ∠B, BC)・sss(BC, CA, AB) … 三角形の3点 [A, B, C]（B が原点、BC が横）
     tf(点のならび, {rot, flip, k, o}) … 回す・うら返す・何倍かする・ずらす
     FIGS([行のならび…], o)           … いくつかの PO（raw）を、1つの図にまとめる */
(function () {
  const { GE } = WSL, G = WSL.G, { pol, meet, apex, mid, n3, dirOf } = G;
  const V = (n, p, d) => `頂点 ${n} ${p[0]} ${p[1]}${d ? ' ' + d : ''}`;
  const H = (n, p) => `点 ${n} ${p[0]} ${p[1]} 非表示`;
  const cen = ps => [ps.reduce((a, p) => a + p[0], 0) / ps.length, ps.reduce((a, p) => a + p[1], 0) / ps.length];
  const out = (p, c) => dirOf(Math.atan2(p[1] - c[1], p[0] - c[0]) * 180 / Math.PI);
  const opt = o => { const r = {}; if (o && o.caption) r.caption = o.caption; if (o && o.ns) r.ns = true; return Object.keys(r).length ? r : undefined; };
  const mk = (s, fl) => (fl === '*' ? '*' : '') + (s + (fl === '二重' ? ' 二重' : '')).trim();

  const XN = (dirs, marks, o) => {
    o = o || {}; const r = o.r || 2.6, O = [0, 0], src = [`点 O 0 0 ${o.O || '非表示'}`], rays = [];
    dirs.forEach((d, i) => {
      const p = pol(O, r, d), q = pol(O, r, d + 180); src.push(H('u' + i, p), H('w' + i, q), `線分 u${i} w${i}`); rays.push([d, 'u' + i], [d + 180, 'w' + i]);
      if (o.names && o.names[i]) { const t = pol(O, r + 0.4, d); src.push(`文字 ${t[0]} ${t[1]} ${o.names[i]}`); }
    });
    rays.sort((a, b) => a[0] - b[0]);
    (marks || []).forEach(([i, lab, fl]) => src.push(mk(`角 ${rays[i][1]} O ${rays[(i + 1) % rays.length][1]} ${lab || ''}`, fl)));
    if (o.more) src.push(...o.more);
    return GE(src, opt(o));
  };

  const QUAD = { ur: ['R', 'U'], ul: ['U', 'L'], ll: ['L', 'D'], lr: ['D', 'R'] };
  const PARN = (ts, marks, o) => {
    o = o || {}; const h = o.h || 2.4, e = o.e || 1.2, tilt = o.tilt || 0, src = [], xs = [];
    const mY = x => n3(Math.tan(tilt * Math.PI / 180) * x);   // m 上の点の高さ（かたむけたとき）
    const I = ts.map(([x, th]) => { const Q = [x, mY(x)], P = meet(Q, th, [0, h], 0); return { P, Q, T: pol(P, e, th), S: pol(Q, e, th + 180) }; });
    I.forEach(t => xs.push(t.P[0], t.Q[0], t.T[0], t.S[0]));
    const x0 = n3(Math.min(...xs) - (o.lm || 1.5)), x1 = n3(Math.max(...xs) + (o.rm || 1.7));
    src.push(H('LL', [x0, h]), H('LR', [x1, h]), H('ML', [x0, mY(x0)]), H('MR', [x1, mY(x1)]), '線分 LL LR', '線分 ML MR');
    const ln = o.ln || 'ℓm'; if (ln) src.push(`文字 ${n3(x1 + 0.45)} ${h} ${ln[0]}`, `文字 ${n3(x1 + 0.45)} ${mY(x1)} ${ln[1]}`);
    I.forEach((t, i) => {
      src.push(H(`P${i}`, t.P), H(`Q${i}`, t.Q), H(`P${i}U`, t.T), H(`Q${i}D`, t.S), `線分 P${i}U Q${i}D`);
      if (o.tn && o.tn[i]) { const w = pol(t.T, 0.4, ts[i][1]); src.push(`文字 ${w[0]} ${w[1]} ${o.tn[i]}`); }
    });
    const ray = (i, pt, k) => k === 'R' ? (pt === 'P' ? 'LR' : 'MR') : k === 'L' ? (pt === 'P' ? 'LL' : 'ML') : k === 'U' ? (pt === 'P' ? `P${i}U` : `P${i}`) : (pt === 'P' ? `Q${i}` : `Q${i}D`);
    (marks || []).forEach(([i, pt, q, lab, fl]) => src.push(mk(`角 ${ray(i, pt, QUAD[q][0])} ${pt}${i} ${ray(i, pt, QUAD[q][1])} ${lab || ''}`, fl)));
    if (o.more) src.push(...(typeof o.more === 'function' ? o.more(I, { x0, x1, h }) : o.more));
    return GE(src, opt(o));
  };
  const PAR = (th, marks, o) => PARN([[0, th]], (marks || []).map(m => [0, ...m]), o);

  const ZIG = (a1, a2, lab, o) => {
    o = o || {}; lab = lab || {}; const h = o.h || 3, k = o.k || h * a2 / (a1 + a2) * 0.9 + 0.2, s = o.flip ? -1 : 1, t = d => Math.tan(d * Math.PI / 180);
    const E = [0, n3(k)], A = [n3(-s * (h - k) / t(a1)), h], C = [n3(-s * k / t(a2)), 0];
    const xa = Math.min(A[0], C[0], 0), xb = Math.max(A[0], C[0], 0), x0 = n3(xa - 1.2), x1 = n3(xb + 1.6);
    const src = [H('LL', [x0, h]), H('LR', [x1, h]), H('ML', [x0, 0]), H('MR', [x1, 0]), '線分 LL LR', '線分 ML MR', `文字 ${n3(x1 + 0.45)} ${h} ℓ`, `文字 ${n3(x1 + 0.45)} 0 m`,
      V(o.n ? o.n[0] : 'A', A, s > 0 ? '左上' : '右上'), V(o.n ? o.n[2] : 'C', C, s > 0 ? '左下' : '右下'), V(o.n ? o.n[1] : 'E', E, s > 0 ? '右' : '左')];
    const [nA, nE, nC] = o.n ? [o.n[0], o.n[1], o.n[2]] : ['A', 'E', 'C'], side = s > 0 ? 'R' : 'L';
    src.push(`線分 ${nA} ${nE}`, `線分 ${nE} ${nC}`);
    const m3 = (v, key) => { if (v == null) return null; const fl = /^\*/.test(v) ? '*' : ''; return [String(v).replace(/^\*/, ''), fl]; };
    [[lab.A, `角 L${side} ${nA} ${nE}`], [lab.C, `角 M${side} ${nC} ${nE}`], [lab.E, `角 ${nA} ${nE} ${nC}`]].forEach(([v, s0]) => { const m = m3(v); if (m) src.push(mk(`${s0} ${m[0]}`, m[1])); });
    if (o.aux) src.push(H('EL', [x0, E[1]]), H('ER', [x1, E[1]]), '*線分 EL ER 点線');   // E を通る、平行な補助線（答え）
    if (o.more) src.push(...o.more);
    return GE(src, opt(o));
  };

  const PO = (pts, names, o) => {
    o = o || {}; const n = pts.length, c = cen(pts), nm = Array.isArray(names) ? names : Array.from(names), ix = k => nm.indexOf(k), src = [];
    pts.forEach((p, i) => src.push(o.nn ? `頂点 ${nm[i]} ${p[0]} ${p[1]} 名前なし` : V(nm[i], p, (o.dirs && o.dirs[nm[i]]) || out(p, c))));
    if (!o.open) src.push(`多角形 ${nm.join(' ')}${o.fill ? ' 塗り' : ''}`);
    Object.entries(o.ang || {}).forEach(([k, v]) => { const i = ix(k), fl = /^\*/.test(v) ? '*' : /二重$/.test(v) ? '二重' : ''; src.push(mk(`角 ${nm[(i + n - 1) % n]} ${k} ${nm[(i + 1) % n]} ${String(v).replace(/^\*/, '').replace(/\s*二重$/, '')}`, fl)); });
    (o.right || []).forEach(k => { const i = ix(k); src.push(`直角 ${nm[(i + n - 1) % n]} ${k} ${nm[(i + 1) % n]}`); });
    Object.entries(o.len || {}).forEach(([k, v]) => { const a = k[0], b = k.slice(1), ans = /^\*/.test(v), [s, d] = String(v).replace(/^\*/, '').split('|'); src.push((ans ? '*' : '') + `長さ ${a} ${b} ${s} ${d || out(mid(pts[ix(a)], pts[ix(b)]), c)}`); });
    Object.entries(o.tick || {}).forEach(([k, v]) => src.push(`印 ${k[0]} ${k.slice(1)} ${v}`));
    if (o.more) src.push(...o.more);
    return o.raw ? src : GE(src, opt(o));
  };
  const PG = (n, o) => {
    o = o || {}; const r = o.r || 2.3, a0 = o.a0 != null ? o.a0 : 90 + (n % 2 ? 0 : 180 / n), pts = Array.from({ length: n }, (_, i) => pol([0, 0], r, a0 + 360 / n * i));
    const nm = o.n ? Array.from(o.n) : pts.map((_, i) => 'v' + i), src = [];
    if (o.n) return PO(pts, nm, o);
    pts.forEach((p, i) => src.push(H(nm[i], p))); src.push(`多角形 ${nm.join(' ')}`);
    if (o.more) src.push(...(typeof o.more === 'function' ? o.more(pts, nm) : o.more));
    return o.raw ? src : GE(src, opt(o));
  };
  const asa = (b, a, cdeg) => { const B = [0, 0], C = [a, 0]; return [meet(B, b, C, 180 - cdeg), B, C]; };
  const sas = (c, b, a) => { const B = [0, 0]; return [pol(B, c, b), B, [a, 0]]; };
  const sss = (a, b, c) => { const B = [0, 0], C = [a, 0]; return [apex(B, C, c, b), B, C]; };
  const tf = (pts, t) => {
    t = t || {}; const r = (t.rot || 0) * Math.PI / 180, k = t.k || 1, ox = t.o ? t.o[0] : 0, oy = t.o ? t.o[1] : 0;
    return pts.map(p => { const x = (t.flip ? -p[0] : p[0]) * k, y = p[1] * k; return [n3(x * Math.cos(r) - y * Math.sin(r) + ox), n3(x * Math.sin(r) + y * Math.cos(r) + oy)]; });
  };
  const FIGS = (parts, o) => GE([].concat(...parts, (o && o.more) || []), opt(o));
  /* 2つの三角形が、頂点 O で向かい合う形（AD と BC が O で交わる）。a＝∠A、b＝∠B、c＝∠C（度）。∠D＝a+b−c。lab＝{A, B, C, D, O} の字 */
  const BOW = (a, b, c, lab, o) => {
    o = o || {}; lab = lab || {}; const d = a + b - c, t = 180 - a - b, sn = x => Math.sin(x * Math.PI / 180), O = [0, 0];
    const OB = o.ob || 2.2, OA = OB * sn(b) / sn(a), OD = o.od || 1.9, OC = OD * sn(d) / sn(c);
    const A = pol(O, OA, 180 - t / 2), B = pol(O, OB, 180 + t / 2), C = pol(O, OC, t / 2), D = pol(O, OD, -t / 2), n = o.n || 'ABCDO';
    const src = [V(n[0], A, '左上'), V(n[1], B, '左下'), V(n[2], C, '右上'), V(n[3], D, '右下'), V(n[4], O, '上'), `線分 ${n[0]} ${n[3]}`, `線分 ${n[1]} ${n[2]}`, `線分 ${n[0]} ${n[1]}`, `線分 ${n[2]} ${n[3]}`];
    const ad = (v, s0) => { if (v != null) src.push(mk(`${s0} ${String(v).replace(/^\*/, '')}`, /^\*/.test(v) ? '*' : '')); };
    ad(lab.A, `角 ${n[4]} ${n[0]} ${n[1]}`); ad(lab.B, `角 ${n[0]} ${n[1]} ${n[4]}`); ad(lab.C, `角 ${n[4]} ${n[2]} ${n[3]}`); ad(lab.D, `角 ${n[2]} ${n[3]} ${n[4]}`); ad(lab.O, `角 ${n[0]} ${n[4]} ${n[1]}`);
    if (o.more) src.push(...o.more);
    return GE(src, opt(o));
  };
  /* くさび形（へこんだ四角形 ABDC）。a＝∠A、b＝∠B、c＝∠C。へこんだところの角 ∠BDC＝a+b+c。lab＝{A, B, C, D} */
  const WEDGE = (a, b, c, lab, o) => {
    o = o || {}; lab = lab || {}; const a1 = a * (o.sp || 0.45), a2 = a - a1, A = [0, 3.3], B = pol(A, o.lb || 3.5, 270 - a1), C = pol(A, o.lc || 3.2, 270 + a2);
    const D = meet(B, 90 - a1 - b, C, 90 + a2 + c), n = o.n || 'ABCD';
    const src = [V(n[0], A, '上'), V(n[1], B, '左下'), V(n[2], C, '右下'), V(n[3], D, o.dd || '上'), `多角形 ${n[0]} ${n[1]} ${n[3]} ${n[2]}`];
    const ad = (v, s0) => { if (v != null) src.push(mk(`${s0} ${String(v).replace(/^\*/, '')}`, /^\*/.test(v) ? '*' : '')); };
    const far = (v, deg, d) => v == null || v === '' || deg >= 32 ? v : v + ' ' + d;   // せまい角の字は、図の外側に書く
    if (b < 32 && lab.B) src.push(H('wl', [n3(B[0] - 1.3), B[1]])); if (c < 32 && lab.C) src.push(H('wr', [n3(C[0] + 1.3), C[1]]));   // 外に書く字のぶん、図の幅を広げる
    ad(lab.A, `角 ${n[1]} ${n[0]} ${n[2]}`); ad(far(lab.B, b, '左'), `角 ${n[0]} ${n[1]} ${n[3]}`); ad(far(lab.C, c, '右'), `角 ${n[3]} ${n[2]} ${n[0]}`); ad(lab.D, `角 ${n[1]} ${n[3]} ${n[2]}`);
    if (o.more) src.push(...(typeof o.more === 'function' ? o.more({ A, B, C, D }) : o.more));
    return GE(src, opt(o));
  };
  /* 平行な2直線 ℓ、m の間で、2回折れる線 A−E−F−C。a＝ℓ と AE の角、e＝∠AEF、f＝∠EFC、c＝m と CF の角（a+f＝e+c）。lab＝{A, E, F, C} の字 */
  const ZIG2 = (a, e, f, lab, o) => {
    o = o || {}; lab = lab || {}; const c = a + f - e, h = o.h || 3, A = [0, h], yE = o.yE || h * 0.66, yF = o.yF || h * 0.33, sn = d => Math.sin(d * Math.PI / 180);
    const E = pol(A, (h - yE) / sn(a), -a), F = pol(E, (yE - yF) / sn(e - a), 180 - a + e), C = pol(F, yF / sn(c), -c);   // e は a より大きくとる
    const xs = [A[0], E[0], F[0], C[0]], x0 = n3(Math.min(...xs) - 1.2), x1 = n3(Math.max(...xs) + 1.5);
    const src = [H('LL', [x0, h]), H('LR', [x1, h]), H('ML', [x0, 0]), H('MR', [x1, 0]), '線分 LL LR', '線分 ML MR', `文字 ${n3(x1 + 0.45)} ${h} ℓ`, `文字 ${n3(x1 + 0.45)} 0 m`,
      V('A', A, '上'), V('E', E, '右'), V('F', F, '左'), V('C', C, '下'), '折れ線 A E F C'];
    const ad = (v, s0) => { if (v != null) src.push(mk(`${s0} ${String(v).replace(/^\*/, '')}`, /^\*/.test(v) ? '*' : '')); };
    ad(lab.A, '角 LR A E'); ad(lab.E, '角 A E F'); ad(lab.F, '角 E F C'); ad(lab.C, '角 F C ML');
    if (o.more) src.push(...o.more);
    return GE(src, opt(o));
  };
  /* 星形（5つの先の角）。lab＝['a','b','c','d','e']（上の先から、反時計まわり） */
  const STAR = (lab, o) => {
    o = o || {}; const r = o.r || 2.5, tp = o.tips, at = [90];   // tips＝先の角（上の先から、反時計まわり。和は 180）。書かなければ、正しい星形（どの先も 36°）
    for (let j = 0; j < 4; j++) at.push(at[j] + (tp ? 2 * tp[(j + 3) % 5] : 72));
    const ps = at.map(a => pol([0, 0], r, a)), src = ps.map((p, i) => H('s' + i, p));
    [0, 1, 2, 3, 4].forEach(i => src.push(`線分 s${i} s${(i + 2) % 5}`));
    (lab || []).forEach((v, i) => { if (v) src.push(`角 s${(i + 2) % 5} s${i} s${(i + 3) % 5} ${v}`); });
    if (o.more) src.push(...o.more);
    return GE(src, opt(o));
  };
  /* 外角のわかっている多角形。exts＝外角（度。和は 360）、lens＝はじめの n−2 本の辺の長さ（残りは、図がとじるように決める）。点のならびを返す */
  const walk = (exts, lens) => {
    const n = exts.length, d = [0]; for (let i = 1; i < n; i++) d.push(d[i - 1] + exts[i]);
    const cs = d.map(v => Math.cos(v * Math.PI / 180)), sn = d.map(v => Math.sin(v * Math.PI / 180));
    let sx = 0, sy = 0; for (let i = 0; i < n - 2; i++) { sx += lens[i] * cs[i]; sy += lens[i] * sn[i]; }
    const i1 = n - 2, i2 = n - 1, det = cs[i1] * sn[i2] - sn[i1] * cs[i2], l1 = (-sx * sn[i2] + sy * cs[i2]) / det, l2 = (-cs[i1] * sy + sn[i1] * sx) / det;
    const L = [...lens.slice(0, n - 2), l1, l2], pts = [[0, 0]];
    for (let i = 0; i < n - 1; i++) pts.push([n3(pts[i][0] + L[i] * cs[i]), n3(pts[i][1] + L[i] * sn[i])]);
    return pts;
  };
  /* 外角に印をつけた多角形。lab＝外角の字（頂点0から。'' は印なし）。o.int＝{番号: 字}（内角の字） */
  const PEXT = (exts, lens, lab, o) => {
    o = o || {}; const pts = walk(exts, lens), n = pts.length, src = pts.map((p, i) => H('q' + i, p));
    src.push(`多角形 ${pts.map((p, i) => 'q' + i).join(' ')}`);
    pts.forEach((p, i) => {
      const pr = pts[(i + n - 1) % n], dx = p[0] - pr[0], dy = p[1] - pr[1], l = Math.hypot(dx, dy), e = [n3(p[0] + dx / l * 1.25), n3(p[1] + dy / l * 1.25)];
      if (lab && lab[i] != null && lab[i] !== '') { src.push(H('x' + i, e), `線分 q${i} x${i}`, mk(`角 x${i} q${i} q${(i + 1) % n} ${String(lab[i]).replace(/^\*/, '')}`, /^\*/.test(lab[i]) ? '*' : '')); }
      if (o.int && o.int[i] != null) src.push(mk(`角 q${(i + n - 1) % n} q${i} q${(i + 1) % n} ${String(o.int[i]).replace(/^\*/, '')}`, /^\*/.test(o.int[i]) ? '*' : ''));
    });
    if (o.more) src.push(...(typeof o.more === 'function' ? o.more(pts) : o.more));
    return GE(src, opt(o));
  };
  /* 三角形と四角形の単元でよく使う形（点のならびを返す）
       iso(BC, 底角)…二等辺三角形 [A, B, C]　　rt(斜辺, ∠B)…∠C＝90° の直角三角形 [A, B, C]
       par4(BC, AB, ∠B)…平行四辺形 [A, B, C, D]　　rect(横, 縦)…長方形　　rhom(1辺, ∠B)…ひし形
       dirTo(p, q)…p から q への向き（度） */
  const iso = (base, bang) => asa(bang, base, bang);
  const rt = (hyp, b) => { const c = n3(hyp * Math.cos(b * Math.PI / 180)), s0 = n3(hyp * Math.sin(b * Math.PI / 180)); return [[c, s0], [0, 0], [c, 0]]; };
  const par4 = (base, side, ang) => { const A = pol([0, 0], side, ang); return [A, [0, 0], [base, 0], [n3(A[0] + base), A[1]]]; };
  const rect = (w, h) => [[0, h], [0, 0], [w, 0], [w, h]];
  const rhom = (a, ang) => par4(a, a, ang);
  const dirTo = (p, q) => Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI;
  /* 樹形図。spec＝[[字, [子…]], …]（子も同じ形。子がなければ字だけでよい）。uni([['表','裏'],['表','裏']]) で、どの枝も同じ形の樹形図になる。
       o＝{ heads:['A','B']（上の見出し）, ans:true（全部を答え＝赤でかく）, given:1（左から1段目までは印刷し、その先は答え）, mark:[葉の番号…]（○をつける。答え）, dx, dy, scale } */
  const uni = lists => lists.length ? lists[0].map(t => [t, uni(lists.slice(1))]) : [];
  const TREE = (spec, o) => {
    o = o || {}; const dx = o.dx || 2.1, dy = o.dy || 0.62, src = [], leaves = [];
    const norm = n => Array.isArray(n) ? { t: String(n[0]), ch: (n[1] || []).map(norm) } : { t: String(n), ch: [] };
    const roots = spec.map(norm); let k = 0, id = 0, md = 0;
    const place = (n, d) => { n.d = d; n.id = id++; md = Math.max(md, d); if (!n.ch.length) { n.y = -k * dy; k++; leaves.push(n); } else { n.ch.forEach(c => place(c, d + 1)); n.y = (n.ch[0].y + n.ch[n.ch.length - 1].y) / 2; } };
    roots.forEach(r => place(r, 0));
    const red = d => (o.given == null ? !!o.ans : d >= o.given) ? '*' : '';
    const draw = n => {
      const x = n.d * dx; src.push(red(n.d) + `文字 ${n3(x)} ${n3(n.y)} ${n.t}`);
      n.ch.forEach(c => { src.push(`点 a${n.id}x${c.id} ${n3(x + 0.42)} ${n3(n.y)} 非表示`, `点 b${n.id}x${c.id} ${n3(c.d * dx - 0.42)} ${n3(c.y)} 非表示`, red(c.d) + `線分 a${n.id}x${c.id} b${n.id}x${c.id} 細`); draw(c); });
    };
    roots.forEach(draw);
    (o.mark || []).forEach(i => { const n = leaves[i]; if (n) src.push(`*文字 ${n3(n.d * dx + 0.75)} ${n3(n.y)} ○`); });
    if (o.heads) o.heads.forEach((h, d) => src.push(`文字 ${n3(d * dx)} ${n3(dy * 1.05)} ${h}`));
    src.push(`範囲 -0.7 ${n3(-(k - 1) * dy - 0.4)} ${n3(md * dx + 1.2)} ${n3(dy * (o.heads ? 1.6 : 0.5))}`, `縮尺 ${o.scale || 9}`);
    return GE(src, opt(o));
  };
  /* 箱ひげ図。list＝[[名前, [最小値, 第1四分位数, 中央値, 第3四分位数, 最大値], '*'（答え＝赤でかく）], …]（数を null にすると、名前と場所だけ）
       o＝{ min, max, step（目もりの数字の間隔）, sub（小さい目もり）, unit:'（点）', more:[図のことばの行…], w（横の長さ。図の単位）, rh（1本ぶんの高さ）, grid:false（たての点線なし）, scale, caption }
     five(データ)…[最小値, 第1四分位数, 中央値, 第3四分位数, 最大値]（中央値でデータを半分に分け、個数が奇数のときは中央値をのぞく） */
  const five = data => {
    const d = data.slice().sort((a, b) => a - b), n = d.length, h = Math.floor(n / 2);
    const med = a => { const m = a.length; return m % 2 ? a[(m - 1) / 2] : n3((a[m / 2 - 1] + a[m / 2]) / 2); };
    return [d[0], med(d.slice(0, h)), med(d), med(d.slice(n - h)), d[n - 1]];
  };
  const BOX = (list, o) => {
    o = o || {}; const mn = o.min, mx = o.max, st = o.step, W = o.w || 12, rh = o.rh || 1.15, bh = o.bh || 0.56, src = []; let id = 0;
    const X = v => n3((v - mn) / (mx - mn) * W), n = list.length, top = n3(n * rh + 0.25);
    const seg = (x1, y1, x2, y2, style, red) => { const a = 'q' + (id++), b = 'q' + (id++); src.push(`点 ${a} ${n3(x1)} ${n3(y1)} 非表示`, `点 ${b} ${n3(x2)} ${n3(y2)} 非表示`, (red ? '*' : '') + `線分 ${a} ${b}${style ? ' ' + style : ''}`); };
    seg(-0.3, 0, W + 0.3, 0, '');
    if (o.sub) for (let v = mn; v <= mx + 1e-9; v += o.sub) seg(X(v), 0, X(v), -0.1, '細');
    for (let v = mn; v <= mx + 1e-9; v += st) { seg(X(v), 0, X(v), -0.18, ''); src.push(`文字 ${X(v)} -0.5 ${n3(v)}`); if (o.grid !== false) seg(X(v), 0, X(v), top, '点線 細'); }
    if (o.unit) src.push(`文字 ${n3(W + 1.2)} -0.5 ${o.unit}`);
    list.forEach((r, i) => {
      const y = n3((n - 1 - i) * rh + 0.75), red = r[2] === '*', f = r[1];
      if (r[0]) src.push(`文字 -1.3 ${y} ${r[0]}`);
      if (!f) return;
      const [a, q1, m, q3, b] = f.map(X), u = y + bh / 2, l = y - bh / 2;
      seg(a, y, q1, y, '', red); seg(q3, y, b, y, '', red); seg(a, y - bh / 3, a, y + bh / 3, '', red); seg(b, y - bh / 3, b, y + bh / 3, '', red);
      seg(q1, l, q3, l, '', red); seg(q1, u, q3, u, '', red); seg(q1, l, q1, u, '', red); seg(q3, l, q3, u, '', red); seg(m, l, m, u, '', red);
    });
    const hasName = list.some(r => r[0]);
    if (o.more) src.push(...o.more);
    src.push(`範囲 ${hasName ? -2.4 : -0.6} -0.85 ${n3(W + (o.unit ? 2.1 : 0.6))} ${n3(top + 0.1)}`, `縮尺 ${o.scale || 9}`);
    return GE(src, { caption: o.caption, ns: true });
  };
  WSL.HG = { XN, PAR, PARN, ZIG, ZIG2, PO, PG, BOW, WEDGE, STAR, walk, PEXT, asa, sas, sss, tf, FIGS, V, H, cen, out, iso, rt, par4, rect, rhom, dirTo, TREE, uni, BOX, five };
})();
