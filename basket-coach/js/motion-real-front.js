/* リアルな人（前から）：js/motion-real.js の横向きの人と同じ人を、正面から描く（BC.realFront）。
   画面の右が r、左が l（js/motion.js の前向きの骨格）。光は 左上から（右がわに かげ）。
     ・顔：ほほからあごへ細くなる輪郭・耳・前髪（毛先が そろわない）と髪のつや・前髪の影・まゆ・目（まぶたの線・光）・鼻のかげ・口・ほほ
     ・首と肩：首から肩へ下がる線（僧帽筋）。そでなしのユニフォームの外に、肩のはだが見える
     ・ユニフォーム：V首とそでぐりの白いふち・胸の番号（役ごと）。パンツ：ウエストの線・ひも・まん中のぬい目・わきの線・丸いすそ
     ・脚：ひざの皿の線・左右でちがう ふくらはぎ・くつ下。シューズ：つま先・ひも・ベロ・外がわの面（少し外向き）・白いソール
     ・手：手のこう＋1本ずつの指＋親指。ボールが近いときは 指を広げてボールへ向ける（横向きと同じ gripOf） */
(function () {
  const BC = window.BC;
  const R = BC.real, K = R.kit, HS = R.HS;
  const { add, sub, mul, mix, unit, perp, dot, rot, P, f3, corner, pathOf, circle, tube, cut, shade, ball2, paint, flat, line, gripOf } = K;
  const rad = (d) => (d * Math.PI) / 180;
  const LD = unit([-0.38, 1]); // 光の向き（画面の左上から）
  // 体の座標（腰が原点。x：画面の右・u：背骨にそって上）
  // 胴が短く見えるとき（上体を前へたおした姿勢。骨格の肩までの長さ ÷ 0.5）は、u も その分だけ ちぢめる
  const frame = (s) => { const [ax, ay] = s.axis, rt = [ay, -ax], k = Math.hypot(s.sh[0] - s.hip[0], s.sh[1] - s.hip[1]) / 0.5; return (x, u) => { const v = u > 0 ? u * k : u; return [s.hip[0] + rt[0] * x + ax * v, s.hip[1] + rt[1] * x + ay * v]; }; };
  const curve = (cls, a, c, b, w) => `<path class="fr-ln fr-${cls}" d="M${P(a)}Q${P(c)} ${P(b)}" stroke-width="${f3(w)}"/>`;
  const one = (cls, shape) => `<path class="${cls}" d="${pathOf([shape])}"/>`;
  // 左右対称の形（右半分の点 [x, y, 角]。まん中の点は x=0）
  const both = (half) => half.concat(half.slice().reverse().filter(([x]) => x !== 0).map(([x, y, k]) => [-x, y, k]));

  /* ---------- 太さ（m）：[場所, 外がわ, 内がわ] ---------- */
  const TH = [[0, 0.078, 0.078], [0.3, 0.082, 0.08], [0.65, 0.07, 0.068], [1, 0.057, 0.056]];
  const SH = [[0, 0.05, 0.05], [0.2, 0.06, 0.052], [0.36, 0.055, 0.057], [0.62, 0.042, 0.045], [1, 0.033, 0.034]];
  const UA = [[0, 0.048, 0.046], [0.3, 0.046, 0.045], [0.7, 0.039, 0.039], [1, 0.035, 0.035]];
  const FA = [[0, 0.035, 0.035], [0.25, 0.041, 0.038], [0.7, 0.03, 0.03], [1, 0.025, 0.025]];
  const offAt = (st, u, i) => { let k = 0; while (k < st.length - 2 && st[k + 1][0] < u) k++; const a = st[k], b = st[k + 1], t = Math.max(0, Math.min(1, (u - a[0]) / (b[0] - a[0] || 1))); return a[i] + (b[i] - a[i]) * t; };

  /* ---------- シューズ（つま先が手前。少し外向き） ---------- */
  function shoe(g, o) {
    const O = [g.ank[0], g.ank[1] - 0.07];
    const Q = (x, y) => [O[0] + o * x, O[1] + y];
    const tongue = [Q(-0.03, 0.068), Q(0.046, 0.068), Q(0.045, 0.116), corner(Q(0.036, 0.134)), corner(Q(-0.027, 0.134)), Q(-0.035, 0.116)];
    const wall = [Q(0.05, 0.024), Q(0.076, 0.03), Q(0.07, 0.074), Q(0.054, 0.12), Q(0.038, 0.126), Q(0.04, 0.07)];
    const wing = [Q(0.053, 0.04), Q(0.07, 0.046), Q(0.06, 0.088), Q(0.047, 0.094)];
    const toe = [corner(Q(-0.047, 0.024)), corner(Q(0.061, 0.024)), Q(0.064, 0.05), Q(0.051, 0.075), Q(0.012, 0.086), Q(-0.03, 0.077), Q(-0.048, 0.052)];
    const sole = [corner(Q(-0.05, 0)), corner(Q(0.072, 0)), Q(0.078, 0.013), corner(Q(0.073, 0.027)), corner(Q(-0.051, 0.027)), Q(-0.056, 0.013)];
    return one('fr-s fr-shoe', tongue) + one('fr-s fr-shoe far', wall) + one('fr-wing', wing) +
      line('lace', [Q(-0.022, 0.09), Q(0.036, 0.092)], 0.008) + line('lace', [Q(-0.023, 0.104), Q(0.035, 0.106)], 0.008) + line('lace', [Q(-0.023, 0.118), Q(0.034, 0.12)], 0.008) +
      one('fr-s fr-shoe', toe) + curve('seam', Q(-0.044, 0.046), Q(0.008, 0.07), Q(0.06, 0.046), 0.006) +
      one('fr-s fr-sole', sole) + line('tread', [Q(-0.047, 0.004), Q(0.069, 0.004)], 0.008);
  }

  /* ---------- 脚 ---------- */
  function leg(s, side) {
    const g = s[side], hp = side === 'r' ? s.hpR : s.hpL, o = side === 'r' ? 1 : -1;
    const dS = unit(sub(g.ank, g.knee));
    const nT = mul(perp(unit(sub(g.knee, hp))), o), nS = mul(perp(dS), o); // 外がわの向き
    const skin = [shade(hp, g.knee, nT, TH, LD), ball2(g.knee, 0.057, LD), shade(g.knee, g.ank, nS, SH, LD), ball2(g.ank, 0.034, LD)];
    const sock = [shade(g.knee, g.ank, nS, cut(SH, 0.56, 1.06, 0.007), LD, 0.4)];
    for (const sh of [sock[0].sil, sock[0].lit]) sh[0].c = sh[sh.length - 1].c = true;
    const band = mix(g.knee, g.ank, 0.6), kc = add(g.knee, mul(dS, 0.012));
    return paint('skin', skin) +
      curve('knee', sub(kc, mul(nS, 0.034)), add(kc, mul(dS, 0.05)), add(kc, mul(nS, 0.034)), 0.006) + // ひざの皿の下の線
      paint('sock', sock) + line('rib', [add(band, mul(nS, 0.05)), sub(band, mul(nS, 0.052))], 0.006) + shoe(g, o);
  }
  // パンツ：腰まわり ＋ 左右の脚（ももの 7割まで。すそは 手前に丸い）
  function shorts(s) {
    const T = frame(s);
    const pelv = (k) => [corner(T(-0.15, 0.052)), corner(T(0.15, 0.052)), T(0.156 * k, -0.04), T(0.12 * k, -0.13), T(0, -0.152), T(-0.12, -0.13), T(-0.156, -0.04)];
    const parts = [{ sil: pelv(1), lit: pelv(0.88) }];
    let over = '';
    for (const side of ['l', 'r']) {
      const g = s[side], hp = side === 'r' ? s.hpR : s.hpL, o = side === 'r' ? 1 : -1;
      const d = unit(sub(g.knee, hp)), nT = mul(perp(d), o);
      // つけ根の外がわは 細く（腰の形の中に おさめる。ももが内へ向いても、わきに 出っぱらない）
      const st = cut(TH, 0, 0.72, 0.02, 5).map(([u, a, b], i, all) => [u, i === 0 ? 0.056 : a + 0.01 * (i / (all.length - 1)), b + 0.012 * (i / (all.length - 1))]);
      const part = shade(hp, g.knee, nT, st, LD, 0.4), n = st.length;
      for (const sh of [part.sil, part.lit]) { sh[n - 1].c = sh[n].c = true; sh.splice(n, 0, add(mix(sh[n - 1], sh[n], 0.5), mul(d, 0.022))); } // すその丸み
      parts.push(part);
      const hemF = part.sil[n - 1], mid = part.sil[n], hemB = part.sil[n + 1], inn = (q) => sub(q, mul(d, 0.015));
      const a = inn(mix(hemF, hemB, 0.04)), b = inn(mix(hemF, hemB, 0.96)), m = inn(mid);
      over += curve('hem', a, [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2], b, 0.013) +
        // わきの線：ウエストから すそへ、外がわのふちに そって
        line('stripe', [T(o * 0.136, 0.03), add(mix(hp, g.knee, 0.3), mul(nT, offAt(st, 0.3, 1) - 0.022)), add(mix(hp, g.knee, 0.7), mul(nT, offAt(st, 0.7, 1) - 0.022))], 0.02);
    }
    return paint('shorts', parts) + over +
      line('crease', [T(0, 0.02), T(0, -0.14)], 0.006) +
      line('trim', [T(-0.148, 0.04), T(0.148, 0.04)], 0.02) +
      curve('string', T(-0.008, 0.028), T(-0.024, -0.005), T(-0.016, -0.034), 0.007) + curve('string', T(0.008, 0.028), T(0.026, -0.002), T(0.02, -0.03), 0.007);
  }

  /* ---------- 首・肩・ユニフォーム ---------- */
  // 頭の中心（描くとき）。骨格の頭より 少し上（首が見えるように）
  const headC = (s) => add(s.sh, mul(s.headAxis, 0.216));
  const NUMS = {
    7: [[[-0.03, 0.05], [0.03, 0.05], [-0.006, -0.05]]],
    4: [[[0.014, -0.05], [0.014, 0.05], [-0.032, -0.018], [0.034, -0.018]]],
    5: [[[0.028, 0.05], [-0.022, 0.05], [-0.026, 0.006], [0.01, 0.01], [0.028, -0.008], [0.026, -0.034], [0.008, -0.05], [-0.026, -0.044]]],
  };
  const NUM_OF = { '': 7, o: 4, x: 5 };
  function torso(s, role) {
    const T = frame(s), m = (a) => a.map(([x, u, k]) => (k ? corner(T(x, u)) : T(x, u)));
    // はだ：首のつけ根 → 肩 → わき（ユニフォームの下）
    const yoke = m(both([[0.046, 0.552], [0.098, 0.541], [0.168, 0.53], [0.214, 0.495], [0.176, 0.38], [0.16, 0.3, 1]]));
    const up = s.headAxis, top = add(headC(s), mul(up, -0.07)), base = T(0, 0.46), nf = perp(unit(sub(top, base)));
    const neck = { sil: tube(base, top, nf, [[0, 0.05, 0.05], [0.6, 0.046, 0.046], [1.1, 0.047, 0.047]]), lit: tube(base, top, nf, [[0, 0.05, 0.024], [0.5, 0.046, 0.018], [0.62, 0.022, -0.006]]) };
    // ユニフォーム（右半分 → 左右へ）。a：右がわを けずる（かげ）
    const half = (a) => [[0, 0.474, 1], [0.03, 0.49], [0.056, 0.52], [0.074, 0.56, 1], [0.146 - (1 - a) * 0.03, 0.542, 1], [0.134 * a, 0.49], [0.132 * a, 0.43], [0.15 * a, 0.372], [0.166 * a, 0.32], [0.16 * a, 0.2], [0.147 * a, 0.08], [0.146 * a, -0.02, 1]];
    const shape = (a) => m(half(a).slice().reverse().concat(half(1).slice(1).map(([x, u, k]) => [-x, u, k])));
    const num = (NUMS[NUM_OF[role || ''] || 7] || []).map((st) => line('num', st.map(([x, y]) => T(x * 1.3, 0.262 + y * 1.3)), 0.022)).join('');
    return one('fr-s fr-skin', yoke) + one('fr-l fr-skin', m(both([[0.042, 0.549], [0.094, 0.537], [0.162, 0.526], [0.196, 0.495], [0.164, 0.38], [0.15, 0.31, 1]]))) +
      paint('skin', [neck]) +
      paint('jersey', [{ sil: shape(1), lit: shape(0.9) }]) +
      line('trim', m([[0.07, 0.553], [0.053, 0.519], [0.029, 0.492], [0, 0.481], [-0.029, 0.492], [-0.053, 0.519], [-0.07, 0.553]]), 0.016) +
      line('trim', m([[0.143, 0.534], [0.132, 0.49], [0.13, 0.43], [0.146, 0.379]]), 0.013) + line('trim', m([[-0.143, 0.534], [-0.132, 0.49], [-0.13, 0.43], [-0.146, 0.379]]), 0.013) +
      num;
  }

  /* ---------- 頭 ---------- */
  function head(s) {
    const up = s.headAxis, rt = [up[1], -up[0]], c = headC(s);
    const H = (x, y) => [c[0] + (rt[0] * x + up[0] * y) * HS, c[1] + (rt[1] * x + up[1] * y) * HS];
    const m = (a) => a.map(([x, y, k]) => (k ? corner(H(x, y)) : H(x, y)));
    const tilt = f3((Math.atan2(up[0], up[1]) * 180) / Math.PI);
    const el = (cls, p, rx, ry) => `<ellipse class="${cls}" cx="${f3(p[0])}" cy="${f3(-p[1])}" rx="${f3(rx * HS)}" ry="${f3(ry * HS)}" transform="rotate(${tilt} ${f3(p[0])} ${f3(-p[1])})"/>`;
    const dotAt = (cls, p, r) => `<circle class="${cls}" cx="${f3(p[0])}" cy="${f3(-p[1])}" r="${f3(r * HS)}"/>`;
    // 輪郭：ほほ骨がいちばん広く、あごへ細くなる
    const faceHalf = (k) => [[0, 0.116], [0.04 * k, 0.11], [0.066 * k, 0.09], [0.08 * k, 0.055], [0.084 * k, 0.015], [0.08 * k, -0.028], [0.071 * k, -0.066], [0.052 * k, -0.1], [0.028 * k, -0.119], [0, -0.126]];
    const face = m(both(faceHalf(1)));
    const lit = m(faceHalf(0.86).concat(faceHalf(1).slice().reverse().filter(([x]) => x !== 0).map(([x, y]) => [-x, y])));
    const ear = (o) => { const e = []; for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, p = rot([0.012 * Math.cos(a), 0.027 * Math.sin(a)], -0.16 * o); e.push(H(o * 0.087 + p[0], -0.006 + p[1])); } return e; };
    // 髪：外がわ（頭より ひとまわり大きい）→ 前髪（毛先は そろえない。少し左へ流れる）
    const hair = m([[-0.085, -0.014, 1], [-0.096, 0.03], [-0.099, 0.07], [-0.083, 0.113], [-0.046, 0.139], [0, 0.147], [0.046, 0.139], [0.083, 0.113], [0.099, 0.07], [0.096, 0.03], [0.085, -0.014, 1],
      [0.075, 0.016], [0.071, 0.046], [0.058, 0.064], [0.04, 0.042, 1], [0.03, 0.068], [0.007, 0.047, 1], [-0.007, 0.075], [-0.034, 0.05, 1], [-0.046, 0.073], [-0.066, 0.046, 1], [-0.072, 0.036], [-0.075, 0.014]]);
    const cast = m([[0.071, 0.04], [0.058, 0.056], [0.042, 0.03, 1], [0.03, 0.058], [0.009, 0.035, 1], [-0.007, 0.064], [-0.032, 0.038, 1], [-0.046, 0.062], [-0.064, 0.034, 1], [-0.072, 0.03], [-0.07, 0.07], [0, 0.09], [0.07, 0.07]]);
    const shine = m([[-0.074, 0.088], [-0.046, 0.12], [-0.006, 0.133], [0.03, 0.129], [0.0, 0.119], [-0.036, 0.107], [-0.06, 0.082]]);
    const nose = m([[0.003, 0.002], [0.011, -0.024], [0.015, -0.036], [0.006, -0.042], [0, -0.037], [0.004, -0.02]]);
    let out = one('fr-s fr-skin fr-ear', ear(-1)) + one('fr-s fr-skin fr-ear', ear(1)) +
      curve('earin', H(-0.09, 0.008), H(-0.083, -0.006), H(-0.089, -0.02), 0.0045) + curve('earin', H(0.09, 0.008), H(0.083, -0.006), H(0.089, -0.02), 0.0045) +
      one('fr-s fr-skin', face) + one('fr-l fr-skin', lit) +
      one('fr-cast', cast) +
      el('fr-cheek', H(-0.054, -0.042), 0.019, 0.012) + el('fr-cheek', H(0.054, -0.042), 0.019, 0.012) +
      one('fr-s fr-hair', hair) + one('fr-shine', shine);
    for (const o of [-1, 1]) {
      const ex = o * 0.038, e = H(ex, 0.002);
      out += curve('brow', H(o * 0.02, 0.033), H(o * 0.04, 0.043), H(o * 0.06, 0.031), 0.0075) +
        el('fr-eye', e, 0.0096, 0.0128) + dotAt('fr-eyehi', H(ex - 0.0032, 0.0075), 0.0034) +
        curve('lid', H(ex - 0.015, 0.01), H(ex, 0.022), H(ex + 0.015, 0.01), 0.0042);
    }
    return out + one('fr-jaw', nose) + curve('nose', H(-0.009, -0.04), H(0.001, -0.047), H(0.01, -0.04), 0.0045) +
      curve('mouth', H(-0.024, -0.073), H(0, -0.09), H(0.024, -0.073), 0.0058) + curve('lip', H(-0.01, -0.094), H(0, -0.098), H(0.01, -0.094), 0.004);
  }

  /* ---------- 手・腕 ---------- */
  // 手のこう＋指（1本ずつ）＋親指。gr：横向きと同じ gripOf（ボールが近いとき、ボールへ向けて 指を広げる）。cx：体のまん中（親指は そちら側）
  function hand(g, gr, cx) {
    const W = g.hand, hd = gr.hd, n1 = perp(hd);
    const sg = n1[0] * (cx - W[0]) >= 0 ? 1 : -1, tv = mul(n1, sg);
    const open = 1 + gr.w * 0.8, len = 0.86 + 0.14 * gr.w; // 力をぬいた手は、指が少し曲がって 短く見える
    const A = (al, lat) => add(W, add(mul(hd, al), mul(tv, lat)));
    const finger = (b, d, l, w0, w1) => { const tip = add(b, mul(d, l)); return flat('hand', [tube(b, tip, perp(d), [[0, w0, w0], [1, w1, w1]]), circle(tip, w1)]); };
    let out = '';
    // 親指（手のこうの かげに 半分かくれる）
    const td = rot(hd, rad(40 + 14 * gr.w) * sg), t0 = A(0.02, 0.022), t1 = add(t0, mul(td, 0.038)), td2 = rot(td, rad(-14) * sg);
    out += flat('hand', [tube(t0, t1, perp(td), [[0, 0.0125, 0.0125], [1, 0.0105, 0.0105]]), circle(t1, 0.0107), tube(t1, add(t1, mul(td2, 0.027)), perp(td2), [[0, 0.0105, 0.0105], [1, 0.009, 0.009]]), circle(add(t1, mul(td2, 0.027)), 0.009)]);
    // 人さし指 → 小指
    for (const [lat, deg, l] of [[0.027, 13, 0.07], [0.009, 4, 0.078], [-0.009, -5, 0.073], [-0.026, -15, 0.057]]) out += finger(A(0.066, lat), rot(hd, rad(deg * open) * sg), l * len, 0.0088, 0.0072);
    const back = [A(-0.01, 0.025), A(0.028, 0.035), A(0.066, 0.038), A(0.079, 0.018), A(0.08, -0.008), A(0.071, -0.033), A(0.028, -0.03), A(-0.01, -0.025)];
    return out + flat('hand', [back]);
  }
  function arm(s, side, balls) {
    const g = s[side], sp = side === 'r' ? s.shR : s.shL, o = side === 'r' ? 1 : -1;
    const nU = mul(perp(unit(sub(g.elb, sp))), o), nF = mul(perp(unit(sub(g.hand, g.elb))), o);
    const cap = [sp[0] - o * 0.006, sp[1] - 0.013];
    const skin = [ball2(cap, 0.049, LD), shade(sp, g.elb, nU, UA, LD), ball2(g.elb, 0.037, LD), shade(g.elb, g.hand, nF, FA, LD), ball2(g.hand, 0.025, LD)];
    return paint('skin', skin) + hand(g, gripOf(g, balls, 1), s.hip[0]);
  }

  BC.realFront = function (s, balls, role) {
    return {
      back: leg(s, 'l') + leg(s, 'r') + torso(s, role) + shorts(s) + head(s),
      front: arm(s, 'l', balls) + arm(s, 'r', balls),
    };
  };
})();
