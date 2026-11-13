/* リアルな人（前から）：js/motion-real.js の横向きの人と同じ作り方で、正面を向いた人を描く（BC.realFront）。
   画面の右が r、左が l（js/motion.js の前向きの骨格）。光は 左上から。
     ・顔：まるい頭・耳・髪・まゆ・目・鼻・口・ほほ。首・肩・そでなしのユニフォーム（えりぐり・そでぐり）・パンツ（わきの線）
     ・手足は 先細り。ひざ・ひじは 丸い関節。くつ下・シューズ（前から：つま先・ひも・白いソール）
     ・手：手のひら＋4本の指＋親指。ボールが近いときは 指を広げてボールへ向ける（横向きと同じ gripOf） */
(function () {
  const BC = window.BC;
  const R = BC.real, K = R.kit, HS = R.HS;
  const { add, sub, mul, mix, unit, perp, dot, rot, P, f3, corner, pathOf, circle, tube, cut, shade, ball2, paint, flat, line, gripOf } = K;
  const rad = (d) => (d * Math.PI) / 180;
  const LD = unit([-0.38, 1]); // 光の向き（画面の左上から）

  // 太さ（m）：前から見ると 左右対称
  const TH = [[0, 0.082, 0.082], [0.3, 0.084, 0.084], [0.65, 0.072, 0.072], [1, 0.056, 0.056]];
  const SH = [[0, 0.05, 0.05], [0.22, 0.057, 0.057], [0.55, 0.045, 0.045], [1, 0.034, 0.034]];
  const UA = [[0, 0.054, 0.054], [0.3, 0.05, 0.05], [0.7, 0.043, 0.043], [1, 0.039, 0.039]];
  const FA = [[0, 0.039, 0.039], [0.25, 0.043, 0.043], [0.7, 0.033, 0.033], [1, 0.027, 0.027]];

  /* ---------- 足 ---------- */
  function shoe(g, o, far) {
    const x0 = g.ank[0] + o * 0.016, y0 = g.ank[1] - 0.07; // 床（足首から 0.07m 下）
    const Q = (x, y) => [x0 + x, y0 + y];
    const upper = [corner(Q(-0.05, 0.012)), corner(Q(0.05, 0.012)), Q(0.057, 0.04), Q(0.05, 0.07), Q(0.04, 0.108), corner(Q(0.034, 0.122)), corner(Q(-0.034, 0.122)), Q(-0.04, 0.108), Q(-0.05, 0.07), Q(-0.057, 0.04)];
    const sole = [corner(Q(-0.06, 0)), corner(Q(0.06, 0)), Q(0.064, 0.012), corner(Q(0.06, 0.024)), corner(Q(-0.06, 0.024)), Q(-0.064, 0.012)];
    const cap = [Q(-0.038, 0.03), Q(0, 0.044), Q(0.038, 0.03), Q(0.034, 0.05), Q(0, 0.06), Q(-0.034, 0.05)];
    const f = far ? ' far' : '';
    return `<path class="fr-s fr-shoe${f}" d="${pathOf([upper])}"/>` +
      `<path class="fr-wing${f}" d="${pathOf([cap])}"/>` +
      line('lace' + f, [Q(-0.03, 0.078), Q(0, 0.09), Q(0.03, 0.078)], 0.01) + line('lace' + f, [Q(-0.028, 0.098), Q(0, 0.11), Q(0.028, 0.098)], 0.01) +
      `<path class="fr-s fr-sole${f}" d="${pathOf([sole])}"/>`;
  }
  function leg(s, side, o) {
    const g = s[side], hp = side === 'r' ? s.hpR : s.hpL;
    const nT = perp(unit(sub(g.knee, hp))), nS = perp(unit(sub(g.ank, g.knee)));
    const skin = [shade(hp, g.knee, nT, TH, LD), ball2(g.knee, 0.056, LD), shade(g.knee, g.ank, nS, SH, LD), ball2(g.ank, 0.034, LD)];
    const sock = [shade(g.knee, g.ank, nS, cut(SH, 0.56, 1.06, 0.007), LD, 0.4)];
    for (const sh of [sock[0].sil, sock[0].lit]) sh[0].c = sh[sh.length - 1].c = true;
    const band = mix(g.knee, g.ank, 0.6);
    return paint('skin', skin) + paint('sock', sock) + line('rib', [add(band, mul(nS, 0.05)), sub(band, mul(nS, 0.05))], 0.006) + shoe(g, o, false);
  }
  // パンツ：腰まわり ＋ 左右の脚（ももの 7割まで）
  function shorts(s) {
    const [ax, ay] = s.axis, rt = [ay, -ax];
    const T = (x, u) => [s.hip[0] + rt[0] * x + ax * u, s.hip[1] + rt[1] * x + ay * u];
    const pelv = (k) => [corner(T(-0.13, 0.05)), corner(T(0.13, 0.05)), T(0.135 * k, -0.04), T(0.105 * k, -0.135), T(0, -0.165), T(-0.105 * k, -0.135), T(-0.135 * k, -0.04)];
    const parts = [{ sil: pelv(1), lit: pelv(0.86) }];
    let out = '', hems = '';
    for (const side of ['l', 'r']) {
      const g = s[side], hp = side === 'r' ? s.hpR : s.hpL, o = side === 'r' ? 1 : -1;
      const nT = perp(unit(sub(g.knee, hp))), st = cut(TH, 0, 0.72, 0.024, 5);
      const part = shade(hp, g.knee, nT, st, LD, 0.4), n = st.length;
      for (const sh of [part.sil, part.lit]) sh[n - 1].c = sh[n].c = true; // すそ
      parts.push(part);
      const hemF = part.sil[n - 1], hemB = part.sil[n];
      hems += line('hem', [mix(hemF, hemB, 0.07), mix(hemF, hemB, 0.93)], 0.013);
      // わきの線：ウエストの外がわから すその外がわへ
      const d = unit(sub(g.knee, hp)), outer = mul(perp(d), o * (dot(perp(d), [o, 0]) >= 0 ? 1 : -1));
      const e0 = T(o * 0.125, 0.03), e1 = add(mix(hp, g.knee, 0.7), mul(outer, 0.082));
      out += line('stripe', [e0, mix(e0, e1, 0.45), e1], 0.02);
    }
    return paint('shorts', parts) + line('trim', [T(-0.128, 0.042), T(0.128, 0.042)], 0.02) + out + hems;
  }

  /* ---------- 胴・首・頭 ---------- */
  function torso(s) {
    const [ax, ay] = s.axis, rt = [ay, -ax];
    const T = (x, u) => [s.hip[0] + rt[0] * x + ax * u, s.hip[1] + rt[1] * x + ay * u];
    // 左右対称の ユニフォーム（そでなし）。右がわ（lit が 左上から）：右の外がわを 少しけずる
    const half = (m, a) => [[0.134 * m, -0.075], [0.13 * m, 0.04], [0.14 * m, 0.2], [0.152 * m, 0.34], [0.158 * m, 0.43], [0.148 * m * a, 0.497], [0.118 * a, 0.541], [0.088 * a, 0.548]];
    const shape = (kr, a) => {
      const R = half(kr, a).map(([x, u]) => T(x, u));
      const L = half(1, a).map(([x, u]) => T(-x, u)).reverse();
      const neck = [T(0.058, 0.53), T(0.04, 0.46), T(0, 0.425), T(-0.04, 0.46), T(-0.058, 0.53)];
      const pts = R.concat(neck, L);
      pts[0].c = true; pts[R.length - 1].c = false; pts[pts.length - 1].c = true;
      return pts;
    };
    const sil = shape(1, 1), lit = shape(0.9, 1);
    const hole = (side) => { const o = side === 'r' ? 1 : -1, c = T(o * 0.19, 0.4), out = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; out.push([c[0] + rt[0] * o * 0.045 * Math.cos(a) + ax * 0.115 * Math.sin(a), c[1] + rt[1] * o * 0.045 * Math.cos(a) + ay * 0.115 * Math.sin(a)]); } return out; };
    // 首の下の むね（はだ）
    return paint('jersey', [{ sil, lit }]) +
      line('trim', [T(0.058, 0.53), T(0.042, 0.463), T(0, 0.43), T(-0.042, 0.463), T(-0.058, 0.53)], 0.017) +
      line('stripe', [T(0.128, 0.36), T(0.12, 0.2), T(0.114, 0.03)], 0.02) + line('stripe', [T(-0.128, 0.36), T(-0.12, 0.2), T(-0.114, 0.03)], 0.02);
  }
  const headC = (s) => add(s.sh, mul(s.headAxis, 0.213));
  function neck(s) {
    const up = s.headAxis, hc = headC(s);
    const base = sub(s.sh, mul(s.axis, 0.1)), top = add(hc, mul(up, -0.075));
    const nf = perp(unit(sub(top, base)));
    // 首のつけ根は 太く（えりぐりから むねが のぞく）
    return paint('skin', [{ sil: tube(base, top, nf, [[0, 0.075, 0.075], [0.45, 0.07, 0.07], [0.66, 0.043, 0.043], [1.1, 0.044, 0.044]]), lit: tube(base, top, nf, [[0, 0.06, 0.075], [0.45, 0.055, 0.07], [0.66, 0.027, 0.043], [1.1, 0.027, 0.044]]) }]);
  }
  function head(s) {
    const up = s.headAxis, rt = [up[1], -up[0]], c = headC(s);
    const H = (x, y) => [c[0] + (rt[0] * x + up[0] * y) * HS, c[1] + (rt[1] * x + up[1] * y) * HS];
    const m = (a) => a.map(([x, y, k]) => (k ? corner(H(x, y)) : H(x, y)));
    const sym = (a) => a.concat(a.slice(1, -1).reverse().map(([x, y, k]) => [-x, y, k]));
    const skull = m(sym([[0, 0.118], [0.056, 0.108], [0.092, 0.072], [0.1, 0.02], [0.094, -0.03], [0.074, -0.082], [0.042, -0.114], [0, -0.124]]));
    const hair = m([[-0.112, -0.012], [-0.116, 0.05], [-0.094, 0.104], [-0.05, 0.137], [0, 0.147], [0.05, 0.137], [0.094, 0.104], [0.116, 0.05], [0.112, -0.012],
      [0.098, 0.026], [0.08, 0.06], [0.046, 0.082], [0.006, 0.089, 1], [-0.032, 0.082], [-0.075, 0.062], [-0.098, 0.026]]);
    const shine = m([[-0.07, 0.118], [-0.02, 0.134], [0.034, 0.13], [0.07, 0.115], [0.02, 0.122], [-0.03, 0.118]]);
    const ear = (o) => { const e = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; e.push(H(o * 0.104 + 0.014 * Math.cos(a) * o, 0.0 + 0.03 * Math.sin(a))); } return e; };
    const tilt = f3((Math.atan2(up[0], up[1]) * 180) / Math.PI);
    const el = (cls, p, rx, ry) => `<ellipse class="${cls}" cx="${f3(p[0])}" cy="${f3(-p[1])}" rx="${f3(rx * HS)}" ry="${f3(ry * HS)}" transform="rotate(${tilt} ${f3(p[0])} ${f3(-p[1])})"/>`;
    const chin = [H(-0.05, -0.128), H(0.05, -0.128), H(0.04, -0.15), H(0, -0.158), H(-0.04, -0.15)];
    let out = `<path class="fr-jaw" d="${pathOf([chin])}"/>` +
      `<path class="fr-s fr-skin fr-ear" d="${pathOf([ear(-1)])}"/><path class="fr-s fr-skin fr-ear" d="${pathOf([ear(1)])}"/>` +
      `<path class="fr-s fr-skin fr-face" d="${pathOf([skull])}"/>` +
      el('fr-cheek', H(-0.062, -0.04), 0.021, 0.014) + el('fr-cheek', H(0.062, -0.04), 0.021, 0.014) +
      `<path class="fr-s fr-hair" d="${pathOf([hair])}"/><path class="fr-shine" d="${pathOf([shine])}"/>`;
    for (const o of [-1, 1]) {
      out += `<path class="fr-ln fr-brow" d="M${P(H(o * 0.022, 0.042))} Q${P(H(o * 0.045, 0.054))} ${P(H(o * 0.068, 0.043))}" stroke-width="0.0075"/>` +
        el('fr-eye', H(o * 0.044, 0.013), 0.0094, 0.0128) + `<circle class="fr-eyehi" cx="${f3(H(o * 0.047, 0.019)[0])}" cy="${f3(-H(o * 0.047, 0.019)[1])}" r="0.0032"/>`;
    }
    out += `<path class="fr-ln fr-nose" d="M${P(H(0, -0.004))} Q${P(H(0.011, -0.03))} ${P(H(0.0, -0.04))}" stroke-width="0.006"/>` +
      `<path class="fr-ln fr-mouth" d="M${P(H(-0.027, -0.075))} Q${P(H(0, -0.094))} ${P(H(0.027, -0.075))}" stroke-width="0.0058"/>`;
    return out;
  }

  /* ---------- 手・腕 ---------- */
  // 手のひら（だ円）＋4本の指（ひろがり）＋親指。gr：横向きと同じ gripOf（ボールが近いとき ボールへ向けて 指を広げる）
  function hand(g, o, gr, centerX) {
    const W = g.hand, hd = gr.hd, spread = 1 + gr.w * 0.9, c = gr.c * gr.sgn * 0.35;
    const K0 = add(W, mul(hd, 0.075));
    const pal = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, rx = 0.03, ry = 0.047; const v = add(mul(perp(hd), rx * Math.cos(a)), mul(hd, ry * Math.sin(a))); pal.push(add(add(W, mul(hd, 0.04)), v)); }
    const fing = [];
    [[-17, 0.05], [-6, 0.062], [6, 0.06], [17, 0.047]].forEach(([deg, len]) => {
      const d1 = rot(hd, rad(deg * spread)), d2 = rot(d1, c * 0.6);
      const A = add(K0, mul(rot(hd, rad(deg * 0.35)), 0.004)), M = add(A, mul(d1, len * 0.55)), T2 = add(M, mul(d2, len * 0.5));
      fing.push(tube(A, M, perp(d1), [[0, 0.0105, 0.0105], [1, 0.0095, 0.0095]]), circle(M, 0.0097), tube(M, T2, perp(d2), [[0, 0.0095, 0.0095], [1, 0.0082, 0.0082]]), circle(T2, 0.0082));
    });
    // 親指：からだの中心がわへ
    const c1 = rot(hd, rad(58)), c2 = rot(hd, rad(-58));
    const td = dot(c1, [centerX - W[0], 0]) >= dot(c2, [centerX - W[0], 0]) ? c1 : c2;
    const t0 = add(W, add(mul(hd, 0.032), mul(td, 0.024))), t1 = add(t0, mul(td, 0.034)), t2 = add(t1, mul(rot(td, c * 0.5), 0.028));
    fing.push(tube(t0, t1, perp(td), [[0, 0.0125, 0.0125], [1, 0.0105, 0.0105]]), circle(t1, 0.0108), tube(t1, t2, perp(td), [[0, 0.0105, 0.0105], [1, 0.0088, 0.0088]]), circle(t2, 0.0088));
    return flat('hand', [pal].concat(fing));
  }
  function arm(s, side, balls) {
    const g = s[side], sp = side === 'r' ? s.shR : s.shL, o = side === 'r' ? 1 : -1;
    const nU = perp(unit(sub(g.elb, sp))), nF = perp(unit(sub(g.hand, g.elb)));
    const skin = [ball2(sp, 0.05, LD), shade(sp, g.elb, nU, UA, LD), ball2(g.elb, 0.041, LD), shade(g.elb, g.hand, nF, FA, LD), ball2(g.hand, 0.027, LD)];
    return paint('skin', skin) + hand(g, o, gripOf(g, balls, 1), s.hip[0]);
  }

  BC.realFront = function (s, balls) {
    return {
      back: leg(s, 'l', -1) + leg(s, 'r', 1) + shorts(s) + neck(s) + torso(s) + head(s),
      front: arm(s, 'l', balls) + arm(s, 'r', balls),
    };
  };
})();
