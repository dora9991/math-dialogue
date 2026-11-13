/* リアルな人（横から）：look: 'real' の動きを、体つきのある人で描く。js/motion.js の BC.motionDraw から呼ばれる。
   骨格（BC.skeleton の関節）は いつもの人と同じ。ちがうのは 描き方だけ：
     ・手足は 先細り（太もも・ふくらはぎ・前腕のふくらみ）。ひざ・ひじは 丸い関節でつなぐ
     ・横顔（おでこ・鼻・口・あご・耳・髪）・首・胸と背中のある胴・ユニフォーム（そでなし・パンツの線）
     ・手は 手のひら＋指（2つの節）。向き（palm）と 指の曲げ（curl）で、ボールを包む
     ・シューズは ハイカット（白いソール）・くつ下
     ・かげ：どの部品も「かげの色の形」の上に「明るい面の形」を重ねる（光は 上・少し前から）
     ・ボール：回る線・床でつぶれる・床の影
   色は css/coach.css の .mo-real（--skin・--hair・--c＝ユニフォームの色 から作る）。
   部品の座標は m（床が y=0・上が +）。SVG には y を逆にして書く。 */
(function () {
  const BC = window.BC;
  const rad = (d) => (d * Math.PI) / 180;
  const f3 = (n) => (Math.round(n * 1000) / 1000).toString();
  const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul = (a, k) => [a[0] * k, a[1] * k];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const unit = (a) => { const l = Math.hypot(a[0], a[1]) || 1e-6; return [a[0] / l, a[1] / l]; };
  const perp = (d) => [-d[1], d[0]]; // 左へ 90°
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const P = (p) => `${f3(p[0])} ${f3(-p[1])}`;
  const corner = (p) => { p.c = true; return p; };
  const HEAD_UP = 0.075; // いつもの人より、頭のてっぺん（髪）が高い分
  const HS = 1.08;      // 頭の大きさ（小・中学生の体つきに）

  /* ---------- 形を作る道具 ---------- */
  // 点をなめらかにつないだ、閉じた形（c のついた点は 角）。数が多いので、配列を作らず 文字列だけで組み立てる
  // 0.001 刻みの数字の文字は 最初に表にしておく（小数を文字にするのが、いちばん時間がかかったため）
  const NUM = [], OFF = 8000;
  for (let i = -OFF; i <= OFF; i++) NUM.push(i === 0 ? '0' : String(i / 1000));
  const n3 = (v) => { const i = Math.round(v * 1000); return i >= -OFF && i <= OFF ? NUM[i + OFF] : String(i / 1000); };
  function smooth(pts) {
    const n = pts.length;
    let d = 'M' + n3(pts[0][0]) + ' ' + n3(-pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const ax = p1.c ? p1[0] : p1[0] + (p2[0] - p0[0]) / 6, ay = p1.c ? p1[1] : p1[1] + (p2[1] - p0[1]) / 6;
      const bx = p2.c ? p2[0] : p2[0] - (p3[0] - p1[0]) / 6, by = p2.c ? p2[1] : p2[1] - (p3[1] - p1[1]) / 6;
      d += 'C' + n3(ax) + ' ' + n3(-ay) + ' ' + n3(bx) + ' ' + n3(-by) + ' ' + n3(p2[0]) + ' ' + n3(-p2[1]);
    }
    return d + 'Z';
  }
  // 回る向きをそろえる（重ねた形を、1つの形として ぬるため）
  function orient(pts) {
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; }
    return a < 0 ? pts.slice().reverse() : pts;
  }
  const pathOf = (shapes) => shapes.map((s) => smooth(orient(s))).join('');
  const CIR = Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2), Math.sin((i / 8) * Math.PI * 2)]);
  function circle(c, r) { return CIR.map(([x, y]) => [c[0] + r * x, c[1] + r * y]); }
  // 骨 A→B に太さをつけた形。nf：前の向き・st：[[場所 0〜1, 前の太さ, 後ろの太さ], …]
  function tube(A, B, nf, st) {
    const fr = [], bk = [];
    for (const [u, f, b] of st) { const c = mix(A, B, u); fr.push([c[0] + nf[0] * f, c[1] + nf[1] * f]); bk.push([c[0] - nf[0] * b, c[1] - nf[1] * b]); }
    return fr.concat(bk.reverse());
  }
  // st の途中（u0〜u1）だけを 取り出す（くつ下・パンツ）。grow：太くする分
  function cut(st, u0, u1, grow = 0, n = 4) {
    const at = (u) => {
      let i = 0;
      while (i < st.length - 2 && st[i + 1][0] < u) i++;
      const a = st[i], b = st[i + 1], k = Math.max(0, Math.min(1, (u - a[0]) / (b[0] - a[0] || 1)));
      return [u, a[1] + (b[1] - a[1]) * k + grow, a[2] + (b[2] - a[2]) * k + grow];
    };
    const out = [];
    for (let i = 0; i <= n; i++) out.push(at(u0 + ((u1 - u0) * i) / n));
    return out;
  }
  // かげつきの部品：sil（かげの色・輪郭）と lit（明るい面）。光に そむく側を、少し けずる
  function shade(A, B, nf, st, Ld, amt = 0.5) {
    const s = dot(nf, Ld), k = 1 - amt * Math.min(1, Math.abs(s) * 1.6);
    return { sil: tube(A, B, nf, st), lit: tube(A, B, nf, st.map(([u, f, b]) => (s >= 0 ? [u, f, b * k] : [u, f * k, b]))) };
  }
  const ball2 = (c, r, Ld) => ({ sil: circle(c, r), lit: circle([c[0] + Ld[0] * r * 0.26, c[1] + Ld[1] * r * 0.26], r * 0.74) });
  // 1つの材質（cls）を、かげ → 明るい面 の2枚で
  const paint = (cls, parts) => `<path class="fr-s fr-${cls}" d="${pathOf(parts.map((p) => p.sil))}"/><path class="fr-l fr-${cls}" d="${pathOf(parts.map((p) => p.lit))}"/>`;
  const flat = (cls, shapes) => `<path class="fr-s fr-${cls}" d="${pathOf(shapes)}"/>`;
  const line = (cls, pts, w) => `<path class="fr-ln fr-${cls}" d="M${pts.map(P).join(' L')}" stroke-width="${f3(w)}"/>`;

  /* ---------- 太さ（m）：[場所, 前, 後ろ] ---------- */
  const TH = [[0, 0.088, 0.098], [0.25, 0.09, 0.09], [0.55, 0.078, 0.074], [0.85, 0.062, 0.058], [1, 0.056, 0.052]];
  const SH = [[0, 0.052, 0.054], [0.2, 0.05, 0.073], [0.42, 0.045, 0.066], [0.72, 0.038, 0.042], [1, 0.034, 0.034]];
  const UA = [[0, 0.054, 0.058], [0.3, 0.05, 0.053], [0.7, 0.043, 0.046], [1, 0.039, 0.041]];
  const FA = [[0, 0.039, 0.041], [0.25, 0.042, 0.046], [0.7, 0.032, 0.034], [1, 0.026, 0.027]];

  /* ---------- 足（シューズ） ---------- */
  function shoe(g, face, far) {
    const [heel, toe] = g.foot;
    const e = unit(sub(toe, heel)), n = mul(perp(e), face), o = sub(heel, mul(n, 0.035));
    const Q = (x, y) => [o[0] + e[0] * x + n[0] * y, o[1] + e[1] * x + n[1] * y];
    const f = far ? ' far' : '';
    const upper = [corner(Q(-0.034, 0.03)), corner(Q(0.262, 0.032)), Q(0.266, 0.046), Q(0.243, 0.068), Q(0.192, 0.086), Q(0.143, 0.114), Q(0.114, 0.16), Q(0.07, 0.153), Q(0.018, 0.168), Q(-0.024, 0.128), Q(-0.037, 0.07)];
    const sole = [corner(Q(-0.037, 0.034)), Q(0.1, 0.03), Q(0.21, 0.03), corner(Q(0.266, 0.04)), Q(0.27, 0.026), Q(0.256, 0.009), corner(Q(0.215, 0)), corner(Q(-0.028, 0)), Q(-0.039, 0.012)];
    const wing = [Q(0.006, 0.05), Q(0.085, 0.058), Q(0.152, 0.092), Q(0.118, 0.096), Q(0.06, 0.082)];
    return `<path class="fr-s fr-shoe${f}" d="${pathOf([upper])}"/>` +
      `<path class="fr-wing${f}" d="${pathOf([wing])}"/>` +
      line('lace' + f, [Q(0.135, 0.104), Q(0.158, 0.118)], 0.011) + line('lace' + f, [Q(0.158, 0.09), Q(0.181, 0.104)], 0.011) + line('lace' + f, [Q(0.181, 0.078), Q(0.203, 0.092)], 0.011) +
      line('seam' + f, [Q(0.214, 0.036), Q(0.222, 0.062), Q(0.214, 0.078)], 0.006) + line('seam' + f, [Q(-0.02, 0.126), Q(0.02, 0.148), Q(0.07, 0.136), Q(0.108, 0.142)], 0.006) +
      `<path class="fr-s fr-sole${f}" d="${pathOf([sole])}"/>` + line('tread' + f, [Q(-0.03, 0.004), Q(0.215, 0.004), Q(0.256, 0.013)], 0.009);
  }

  /* ---------- 脚 ---------- */
  function leg(s, side, far, Ld) {
    const g = s[side], hp = side === 'r' ? s.hpR : s.hpL, face = s.face, f = far ? ' far' : '';
    const nT = mul(perp(unit(sub(g.knee, hp))), face), nS = mul(perp(unit(sub(g.ank, g.knee))), face);
    const skin = [shade(hp, g.knee, nT, TH, Ld), ball2(add(g.knee, mul(nT, 0.004)), 0.055, Ld), shade(g.knee, g.ank, nS, SH, Ld), ball2(g.ank, 0.034, Ld)];
    const sock = [shade(g.knee, g.ank, nS, cut(SH, 0.56, 1.04, 0.007), Ld, 0.4)];
    for (const sh of [sock[0].sil, sock[0].lit]) sh[0].c = sh[sh.length - 1].c = true; // くつ下の上のふち
    const band = mix(g.knee, g.ank, 0.6);
    return paint('skin' + f, skin) + paint('sock' + f, sock) +
      line('rib', [add(band, mul(nS, 0.046)), sub(band, mul(nS, 0.058))], 0.006) + shoe(g, face, far);
  }
  // パンツ（片脚ぶん）。手前の脚は、腰まわりも いっしょに（1つの形として ぬる）
  function shorts(s, side, far, Ld) {
    const g = s[side], hp = side === 'r' ? s.hpR : s.hpL, face = s.face, f = far ? ' far' : '';
    const d = unit(sub(g.knee, hp)), nT = mul(perp(d), face);
    const [ax, ay] = s.axis, fw = [face * ay, -face * ax];
    const T = (fx, u) => [s.hip[0] + fw[0] * fx + ax * u, s.hip[1] + fw[1] * fx + ay * u];
    // ももを深く曲げると、つけ根の前は おなかの下に かくれる（上へ ふくらみすぎないように、つけ根だけ細く）
    const fold = Math.max(0, dot(nT, s.axis));
    const st = cut(TH, 0, 0.74, 0.022, 5).map(([u, a, b], i, all) => [u, (a + 0.012 * (i / (all.length - 1))) * (i === 0 ? 1 - 0.34 * fold : i === 1 ? 1 - 0.12 * fold : 1), b + 0.014 * (i / (all.length - 1))]);
    const part = shade(hp, g.knee, nT, st, Ld, 0.42);
    const n = st.length;
    for (const sh of [part.sil, part.lit]) sh[n - 1].c = sh[n].c = true; // すそ
    const hemF = part.sil[n - 1], hemB = part.sil[n];
    const in1 = (q) => sub(q, mul(d, 0.014)); // すその線は、ふちの少し内がわ
    const hem = line('hem' + f, [in1(mix(hemF, hemB, 0.05)), in1(mix(hemF, hemB, 0.95))], 0.013);
    if (far) return paint('shorts' + f, [part]) + hem;
    const k = dot(fw, Ld) >= 0 ? [1, 0.78] : [0.8, 1];
    const pel = (a, b) => [corner(T(0.108 * a, 0.045)), T(0.113 * a, -0.03), T(0.07 * a, -0.115 * b), T(-0.03, -0.128 * b), T(-0.108 * b, -0.085 * b), T(-0.128 * b, -0.015), corner(T(-0.112 * b, 0.045))];
    // 横の線：ウエストから すそまで、ももに そって まっすぐ
    const run = Math.min(0.12, 0.036 / Math.max(0.05, -dot(d, s.axis)));
    return paint('shorts', [{ sil: pel(1, 1), lit: pel(k[0], k[1]) }, part]) +
      line('trim', [T(0.106, 0.036), T(-0.11, 0.036)], 0.02) +
      `<path class="fr-l fr-shorts" d="${pathOf([part.lit])}"/>` +
      line('stripe', [sub(hp, mul(d, run)), mix(hp, g.knee, 0.725)], 0.024) + hem;
  }

  /* ---------- 手・腕 ---------- */
  // 手のひらの向きと指の巻き方。手のひらの向き rw を書いた動き（pound）は そのまま。書いていなければ、
  // ボールが近いとき（0.34m 以内。0.22m 以内で 100%）は、手首からボールの中心へ向け、指をボールの側へ巻く。遠いときは、前腕と同じ向きで 力をぬいた手
  function gripOf(g, balls, face) {
    const base = { hd: g.palm, sgn: -face, c: rad(g.curl == null ? 26 : g.curl), w: 0 };
    if (g.pset || !balls || !balls.length) return base;
    let best = null, bd = 1e9;
    for (const b of balls) { const d = Math.hypot(b[0] - g.hand[0], b[1] - g.hand[1]); if (d < bd) { bd = d; best = b; } }
    const w = Math.max(0, Math.min(1, (0.34 - bd) / 0.12));
    if (w <= 0) return base;
    const a0 = Math.atan2(g.palm[1], g.palm[0]), a1 = Math.atan2(best[1] - g.hand[1], best[0] - g.hand[0]);
    let da = a1 - a0;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    const a = a0 + da * w, hd = [Math.cos(a), Math.sin(a)];
    const K = add(g.hand, mul(hd, 0.085)), sgn = hd[0] * (best[1] - K[1]) - hd[1] * (best[0] - K[0]) >= 0 ? 1 : -1; // 指は ボールの中心の側へ
    return { hd, sgn: base.sgn * (1 - w) + sgn * w, c: base.c + (rad(46) - base.c) * w, w };
  }
  function hand(g, face, far, gr) {
    const W = g.hand, hd = gr.hd, k = gr.sgn * gr.c, f = far ? ' far' : '';
    const f1 = rot(hd, k * 0.4), f2 = rot(hd, k);
    const K = add(W, mul(hd, 0.085)), M = add(K, mul(f1, 0.045)), Tp = add(M, mul(f2, 0.04));
    const nb = (d) => mul(perp(d), face); // 手のこう（外）の向き
    // 奥の指（少しのびている）を 先に
    const g1 = rot(hd, k * 0.15), g2 = rot(hd, k * 0.6);
    const M2 = add(K, mul(g1, 0.046)), T2 = add(M2, mul(g2, 0.038));
    const back = [tube(K, M2, nb(g1), [[0, 0.014, 0.014], [1, 0.012, 0.012]]), circle(M2, 0.012), tube(M2, T2, nb(g2), [[0, 0.012, 0.012], [1, 0.009, 0.009]]), circle(T2, 0.009)];
    const main = [
      tube(W, K, nb(hd), [[-0.12, 0.022, 0.022], [0.45, 0.02, 0.023], [1, 0.017, 0.02]]), circle(K, 0.0185),
      tube(K, M, nb(f1), [[0, 0.016, 0.017], [1, 0.013, 0.0135]]), circle(M, 0.0132),
      tube(M, Tp, nb(f2), [[0, 0.013, 0.013], [1, 0.0098, 0.0098]]), circle(Tp, 0.0098),
    ];
    return flat('hand2' + f, back) + flat('hand' + f, main);
  }
  function arm(s, side, far, Ld, balls) {
    const g = s[side], sp = side === 'r' ? s.shR : s.shL, face = s.face, f = far ? ' far' : '';
    const nU = mul(perp(unit(sub(g.elb, sp))), face), nF = mul(perp(unit(sub(g.hand, g.elb))), face);
    const skin = [ball2(sp, 0.058, Ld), shade(sp, g.elb, nU, UA, Ld), ball2(g.elb, 0.041, Ld), shade(g.elb, g.hand, nF, FA, Ld), ball2(g.hand, 0.027, Ld)];
    return paint('skin' + f, skin) + hand(g, face, far, gripOf(g, balls, face));
  }

  /* ---------- 胴・首・頭 ---------- */
  function torso(s, Ld) {
    const face = s.face, [ax, ay] = s.axis, fw = [face * ay, -face * ax];
    const T = (fx, u) => [s.hip[0] + fw[0] * fx + ax * u, s.hip[1] + fw[1] * fx + ay * u];
    const lit0 = dot(fw, Ld);
    const kf = lit0 >= 0 ? 1 : 1 - 0.3 * Math.min(1, -lit0 * 1.6), kb = lit0 >= 0 ? 1 - 0.3 * Math.min(1, lit0 * 1.6) : 1;
    const shape = (a, b) => [corner(T(0.1 * a, -0.06)), T(0.106 * a, 0.06), T(0.113 * a, 0.18), T(0.125 * a, 0.31), T(0.113 * a, 0.42), T(0.078 * a, 0.505), corner(T(0.046, 0.538)), corner(T(-0.04, 0.552)),
      T(-0.09 * b, 0.492), T(-0.118 * b, 0.38), T(-0.108 * b, 0.24), T(-0.095 * b, 0.11), T(-0.104 * b, 0), corner(T(-0.11 * b, -0.06))];
    // そでぐり（肩のまわり）：ふちの線 → 中は はだ
    const hole = (g) => { const c = T(-0.004, 0.432), out = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; out.push([c[0] + fw[0] * (0.062 + g) * Math.cos(a) + ax * (0.098 + g) * Math.sin(a), c[1] + fw[1] * (0.062 + g) * Math.cos(a) + ay * (0.098 + g) * Math.sin(a)]); } return out; };
    return paint('jersey', [{ sil: shape(1, 1), lit: shape(kf, kb) }]) +
      line('stripe', [T(0.004, 0.31), T(0.002, 0.16), T(0, 0.045)], 0.022) +
      line('trim', [T(0.05, 0.532), T(-0.044, 0.547)], 0.018) +
      `<path class="fr-armhole" d="${pathOf([hole(0.012)])}"/><path class="fr-l fr-skin fr-pit" d="${pathOf([hole(0)])}"/>`;
  }
  // 頭の中心（描くとき）。骨格の頭より 少し上（首が見えるように）
  const headC = (s) => add(s.sh, mul(s.headAxis, 0.213));
  function neck(s, Ld) {
    const face = s.face, up = s.headAxis, fw = [face * up[1], -face * up[0]];
    const [ax, ay] = s.axis, tf = [face * ay, -face * ax];
    const hc = headC(s);
    const base = [s.sh[0] + ax * 0.02 + tf[0] * 0.004, s.sh[1] + ay * 0.02 + tf[1] * 0.004], top = add(add(hc, mul(up, -0.07)), mul(fw, -0.016));
    const nf = mul(perp(unit(sub(top, base))), -face);
    return paint('skin', [{ sil: tube(base, top, nf, [[-0.25, 0.05, 0.058], [0.4, 0.043, 0.05], [1.15, 0.045, 0.05]]), lit: tube(base, top, nf, [[-0.25, 0.012, 0.058], [0.4, 0.008, 0.05], [1.15, 0.006, 0.05]]) }]);
  }
  function head(s) {
    const face = s.face, up = s.headAxis, fw = [face * up[1], -face * up[0]], c = headC(s);
    const H = (x, y) => [c[0] + (fw[0] * x + up[0] * y) * HS, c[1] + (fw[1] * x + up[1] * y) * HS];
    const m = (a) => a.map(([x, y, k]) => (k ? corner(H(x, y)) : H(x, y)));
    const skull = m([[-0.06, -0.078], [-0.098, -0.022], [-0.105, 0.04], [-0.08, 0.092], [-0.025, 0.114], [0.035, 0.107], [0.076, 0.076], [0.091, 0.034], [0.09, 0.008], [0.087, -0.012],
      [0.097, -0.03], [0.113, -0.045, 1], [0.097, -0.054], [0.095, -0.064], [0.099, -0.07], [0.092, -0.077], [0.096, -0.086], [0.086, -0.096], [0.087, -0.111], [0.068, -0.124], [0.024, -0.11], [-0.012, -0.088]]);
    // あごの下の かげ
    const jaw = m([[0.07, -0.123], [0.024, -0.11], [-0.012, -0.088], [-0.03, -0.073], [-0.012, -0.077], [0.024, -0.098], [0.066, -0.112]]);
    const hair = m([[0.085, 0.05], [0.099, 0.074], [0.092, 0.1], [0.064, 0.124], [0.012, 0.138], [-0.05, 0.13], [-0.1, 0.088], [-0.122, 0.028], [-0.11, -0.038], [-0.082, -0.08, 1], [-0.055, -0.066],
      [-0.036, -0.032], [-0.032, 0.004], [-0.008, 0.024], [0.011, 0.006], [0.015, -0.03, 1], [0.028, 0.006], [0.047, 0.04], [0.068, 0.046]]);
    const shine = m([[0.058, 0.108], [0.01, 0.124], [-0.045, 0.114], [-0.082, 0.082], [-0.05, 0.104], [0.004, 0.112]]);
    const ear = (() => { const o = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; const p = rot([0.014 * Math.cos(a), 0.024 * Math.sin(a)], 0.2 * face); o.push(H(-0.011 + p[0], -0.012 + p[1])); } return o; })();
    const eye = H(0.061, 0.004), hi = H(0.064, 0.008);
    const tilt = f3((Math.atan2(up[0], up[1]) * 180) / Math.PI); // 頭の傾き（画面で 右回りが +）
    const el = (cls, p, rx, ry) => `<ellipse class="${cls}" cx="${f3(p[0])}" cy="${f3(-p[1])}" rx="${f3(rx * HS)}" ry="${f3(ry * HS)}" transform="rotate(${tilt} ${f3(p[0])} ${f3(-p[1])})"/>`;
    return `<path class="fr-s fr-skin fr-face" d="${pathOf([skull])}"/>` +
      `<path class="fr-jaw" d="${pathOf([jaw])}"/>` + el('fr-cheek', H(0.042, -0.046), 0.021, 0.014) +
      `<path class="fr-s fr-skin fr-ear" d="${pathOf([ear])}"/>` + line('earin', [H(-0.014, 0.002), H(-0.006, -0.012), H(-0.013, -0.024)], 0.005) +
      `<path class="fr-s fr-hair" d="${pathOf([hair])}"/><path class="fr-shine" d="${pathOf([shine])}"/>` +
      `<path class="fr-ln fr-brow" d="M${P(H(0.046, 0.026))} Q${P(H(0.064, 0.035))} ${P(H(0.082, 0.028))}" stroke-width="0.0075"/>` +
      el('fr-eye', eye, 0.0084, 0.0118) + `<circle class="fr-eyehi" cx="${f3(hi[0])}" cy="${f3(-hi[1])}" r="0.003"/>` +
      `<path class="fr-ln fr-mouth" d="M${P(H(0.093, -0.0765))} Q${P(H(0.08, -0.083))} ${P(H(0.07, -0.076))}" stroke-width="0.0055"/>`;
  }

  /* ---------- 1人ぶん：うしろの層（体）と 前の層（手前の腕） ---------- */
  function figureSide(s, balls) {
    const Ld = unit([0.42 * s.face, 1]);
    return {
      back: arm(s, 'l', true, Ld, balls) + leg(s, 'l', true, Ld) + shorts(s, 'l', true, Ld) + neck(s, Ld) + torso(s, Ld) + head(s) + leg(s, 'r', false, Ld) + shorts(s, 'r', false, Ld),
      front: arm(s, 'r', false, Ld, balls),
    };
  }
  function figure(s, balls, role) { return s.view === 'side' ? figureSide(s, balls) : BC.realFront(s, balls, role); }

  /* ---------- ボール ---------- */
  const R = 0.12;
  function ball(b, op = 1) {
    const sq = b.sq || 0, a = b.rot || 0;
    return `<g class="fr-ball" transform="translate(${f3(b[0])} ${f3(-b[1] + R * sq)}) scale(${f3(1 + sq * 0.55)} ${f3(1 - sq)})" opacity="${f3(op)}">` +
      `<circle class="fr-ball-s" r="${R}"/><circle class="fr-ball-l" cx="${f3(R * 0.1)}" cy="${f3(-R * 0.14)}" r="${f3(R * 0.82)}"/>` +
      `<g transform="rotate(${f3(a)})"><path class="fr-ball-ln" d="M${-R} 0H${R}M0 ${-R}V${R}M${f3(-R * 0.74)} ${f3(-R * 0.67)}Q${f3(-R * 0.22)} 0 ${f3(-R * 0.74)} ${f3(R * 0.67)}M${f3(R * 0.74)} ${f3(-R * 0.67)}Q${f3(R * 0.22)} 0 ${f3(R * 0.74)} ${f3(R * 0.67)}"/></g>` +
      `<ellipse class="fr-ball-hi" cx="${f3(R * 0.34)}" cy="${f3(-R * 0.46)}" rx="${f3(R * 0.26)}" ry="${f3(R * 0.15)}" transform="rotate(32 ${f3(R * 0.34)} ${f3(-R * 0.46)})"/>` +
      `<circle class="fr-ball-ol" r="${R}"/></g>`;
  }
  function ballShadow(b, op = 1) {
    const h = Math.max(0, Math.min(1, (b[1] - R) / 0.7));
    return `<ellipse class="mo-shadow" cx="${f3(b[0])}" cy="0.02" rx="${f3(0.125 * (1 - h * 0.45))}" ry="${f3(0.03 * (1 - h * 0.4))}" opacity="${f3(op * (1 - h * 0.7))}"/>`;
  }

  // 前から見た人（js/motion-real-front.js）が使う道具
  BC.real = { figure, ball, ballShadow, HEAD_UP, HS, kit: { add, sub, mul, mix, unit, perp, dot, rot, P, f3, corner, smooth, orient, pathOf, circle, tube, cut, shade, ball2, paint, flat, line, gripOf } };
})();
