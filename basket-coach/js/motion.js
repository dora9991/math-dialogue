/* 棒人間のアニメーション：練習メニュー・改善の視点の「動き」を、かんたんな棒人間で見せる。
   BC.anim(el, 'pound') で el の中に動きを入れる（▶ ⏸・ゆっくり・ポイント）。どの練習にどの動きを見せるかは、下の BC.MOTION_OF。

   ■ しくみ
     位置は m（床が y=0、上がプラス）。人は「腰・足首・手」の位置だけを書き、ひざ・ひじは自動で曲げる（2関節の IK）。
     view：'side'（横から。face=1 で右向き）| 'front'（前から。r は画面の右、l は画面の左の手足）
     キー（keys）は at（0〜1、1回分の中の時刻）と、書いた項目だけ。書かない項目は前のキーと同じ。
       hip [x, 高さ]・lean 体の傾き（度。side は前へ、front は右へ）・nod 頭の傾き
       rf・lf 足首の下（足の位置）[x, 高さ]・rh・lh 手 [x, 高さ]
     ボール（balls）のキー：p [x, 高さ]（その場所）| h 'r'・'l'・'both'（手につける。a で人の番号、o でずらす）。arc で、このキーまでを山なりに。
     scroll：床の目印を流す（その場で走るとき）。fade：くり返しのつなぎ目を、ふっと消す。 */
(function () {
  const BC = window.BC;
  const L = { T: 0.5, N: 0.06, R: 0.11, UA: 0.29, FA: 0.31, TH: 0.44, SH: 0.43, ANK: 0.07, TOE: 0.15, HEEL: 0.05, SW: 0.19, HW: 0.1, BALL: 0.12 };
  const NS = 'http://www.w3.org/2000/svg';
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t * t * (3 - 2 * t);
  const rad = (d) => (d * Math.PI) / 180;
  const POSE = ['hip', 'lean', 'nod', 'rf', 'lf', 'rh', 'lh'];

  // 2関節の IK：a から t へ、長さ l1・l2、曲がる向き bend（ベクトル）の側に、まん中の関節を置く
  function ik(a, t, l1, l2, bend) {
    let dx = t[0] - a[0], dy = t[1] - a[1];
    let d = Math.hypot(dx, dy) || 1e-6;
    const dmax = l1 + l2 - 1e-4, dmin = Math.abs(l1 - l2) + 1e-4;
    const dc = Math.max(dmin, Math.min(dmax, d));
    const base = Math.atan2(dy, dx);
    const ang = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc))));
    const c1 = [a[0] + l1 * Math.cos(base + ang), a[1] + l1 * Math.sin(base + ang)];
    const c2 = [a[0] + l1 * Math.cos(base - ang), a[1] + l1 * Math.sin(base - ang)];
    let mid;
    if (typeof bend === 'number') {
      // 横から見たとき：a→関節→t の曲がる向き（左回り +1・右回り -1）で決める（ひざは前、ひじは腕を上げても下げても自然な側に）
      const turn = (c) => (c[0] - a[0]) * (t[1] - c[1]) - (c[1] - a[1]) * (t[0] - c[0]);
      mid = turn(c1) * bend >= turn(c2) * bend ? c1 : c2;
    } else {
      const mx = (a[0] + t[0]) / 2, my = (a[1] + t[1]) / 2;
      const s1 = (c1[0] - mx) * bend[0] + (c1[1] - my) * bend[1];
      const s2 = (c2[0] - mx) * bend[0] + (c2[1] - my) * bend[1];
      mid = s1 >= s2 ? c1 : c2;
    }
    // 届かないときは、手足をのばした先
    const ux = (mid[0] - a[0]) / l1, uy = (mid[1] - a[1]) / l1;
    const end = d > dmax ? [mid[0] + l2 * Math.cos(Math.atan2(t[1] - mid[1], t[0] - mid[0])), mid[1] + l2 * Math.sin(Math.atan2(t[1] - mid[1], t[0] - mid[0]))] : t;
    return { mid, end, ux, uy };
  }

  // 姿勢 → 関節の位置
  function skeleton(p, view, face) {
    const side = view !== 'front';
    const lean = rad(p.lean || 0);
    const hip = p.hip;
    // 体の軸（腰 → 肩）
    const ax = side ? face * Math.sin(lean) : Math.sin(lean);
    const ay = Math.cos(lean);
    const sh = [hip[0] + ax * L.T, hip[1] + ay * L.T];
    const nod = rad(p.nod || 0);
    const hx = side ? face * Math.sin(lean + nod) : Math.sin(lean + nod);
    const hy = Math.cos(lean + nod);
    const neck = [sh[0] + hx * L.N, sh[1] + hy * L.N];
    const head = [sh[0] + hx * (L.N + L.R), sh[1] + hy * (L.N + L.R)];
    // 肩・股関節（front は左右にずらす）
    const px = ay, py = -ax; // 体の軸に直角（右向き）
    const shR = side ? sh : [sh[0] + px * L.SW, sh[1] + py * L.SW];
    const shL = side ? [sh[0] - face * 0.02, sh[1]] : [sh[0] - px * L.SW, sh[1] - py * L.SW];
    const hpR = side ? hip : [hip[0] + px * L.HW, hip[1] + py * L.HW];
    const hpL = side ? [hip[0] - face * 0.02, hip[1]] : [hip[0] - px * L.HW, hip[1] - py * L.HW];
    // ひざは前（side）・外（front）、ひじはうしろ下（side）・外（front）
    const kneeR = side ? -face : [1, 0], kneeL = side ? -face : [-1, 0];
    const elbR = side ? face : [1, -0.4], elbL = side ? face : [-1, -0.4];
    const leg = (hp, f, bend) => {
      const ank = [f[0], f[1] + L.ANK];
      const r = ik(hp, ank, L.TH, L.SH, bend);
      return { knee: r.mid, ank: r.end };
    };
    const arm = (s, h, bend) => {
      const r = ik(s, h, L.UA, L.FA, bend);
      return { elb: r.mid, hand: r.end };
    };
    const legR = leg(hpR, p.rf, kneeR), legL = leg(hpL, p.lf, kneeL);
    const armR = arm(shR, p.rh, elbR), armL = arm(shL, p.lh, elbL);
    const foot = (ank, f, which) => {
      if (side) {
        // 浮いている足は、つま先を少し下げる
        const lift = Math.max(0, Math.min(0.7, (f[1] - 0.02) * 3));
        const c = Math.cos(lift), s = Math.sin(lift);
        const fy = ank[1] - L.ANK;
        return [[ank[0] - face * L.HEEL, fy + 0.02], [ank[0] + face * L.TOE * c, fy - L.TOE * s + 0.01]];
      }
      const o = which === 'r' ? 1 : -1;
      return [[ank[0] - o * 0.03, ank[1] - L.ANK + 0.01], [ank[0] + o * 0.08, ank[1] - L.ANK]];
    };
    return {
      hip, sh, neck, head, shR, shL, hpR, hpL,
      r: { knee: legR.knee, ank: legR.ank, foot: foot(legR.ank, p.rf, 'r'), elb: armR.elb, hand: armR.hand },
      l: { knee: legL.knee, ank: legL.ank, foot: foot(legL.ank, p.lf, 'l'), elb: armL.elb, hand: armL.hand },
    };
  }

  // キーを、前のキーの値でうめる
  function fill(keys) {
    const out = [];
    let prev = {};
    for (const k of keys) {
      const c = Object.assign({}, prev, k);
      out.push(c);
      prev = c;
    }
    return out;
  }
  function seg(keys, t) {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].at <= t) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const span = b.at - a.at;
    const u = span > 0 ? Math.max(0, Math.min(1, (t - a.at) / span)) : 0;
    return { a, b, u };
  }
  function poseAt(keys, t) {
    const { a, b, u } = seg(keys, t);
    const e = b.lin ? u : ease(u);
    const p = {};
    for (const f of POSE) {
      const va = a[f], vb = b[f];
      if (Array.isArray(va)) p[f] = [lerp(va[0], vb[0], e), lerp(va[1], vb[1], e)];
      else p[f] = lerp(va || 0, vb || 0, e);
    }
    return p;
  }
  function ballPos(k, sk, ball) {
    if (k.p) return k.p;
    const s = sk[k.a || 0];
    const o = k.o || [0, 0];
    let hnd;
    if (k.h === 'both') hnd = [(s.r.hand[0] + s.l.hand[0]) / 2, (s.r.hand[1] + s.l.hand[1]) / 2];
    else hnd = s[k.h || 'r'].hand;
    return [hnd[0] + o[0], hnd[1] + o[1]];
  }

  /* ---------- 動き（クリップ） ----------
     box：見せる範囲 [x の左, x の右, 高さの下, 高さの上]。dur：1回の秒数。 */
  const C = {};
  // 腰を落とした構え（横から・右向き）
  const LOW = { hip: [0, 0.72], lean: 28, nod: -22, rf: [0.12, 0], lf: [-0.16, 0], rh: [0.42, 0.64], lh: [0.36, 0.98] };

  C.pound = {
    name: '低いドリブル（ポンド）', view: 'side', box: [-0.9, 1.1, -0.05, 1.85], dur: 0.6, guides: ['head'],
    actors: [{ keys: [
      Object.assign({ at: 0 }, LOW),
      { at: 0.22, hip: [0, 0.70], rh: [0.46, 0.50] },
      { at: 0.55, hip: [0, 0.72], rh: [0.43, 0.6] },
      { at: 1, rh: [0.42, 0.64] },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'r', o: [0.03, -0.13] }, { at: 0.22, h: 'r', o: [0.03, -0.13] }, { at: 0.55, p: [0.5, 0.12] }, { at: 1, h: 'r', o: [0.03, -0.13] }] }],
    points: ['腰を落とす（おしりを少しうしろへ）', '頭の高さを変えない・顔を上げる', '指の腹で、床へ強く押しこむ'],
  };

  // 前から：腰を落とした構え
  const FLOW = { hip: [0, 0.7], lean: 0, nod: 0, rf: [0.33, 0], lf: [-0.33, 0], rh: [0.42, 0.62], lh: [-0.36, 0.8] };
  C.crossover = {
    name: 'クロスオーバー', view: 'front', box: [-1.0, 1.0, -0.05, 1.85], dur: 1.4, guides: ['head'],
    actors: [{ keys: [
      Object.assign({ at: 0 }, FLOW, { hip: [0.04, 0.7], lean: 4 }),
      { at: 0.15, rh: [0.18, 0.46] },
      { at: 0.3, rh: [0.36, 0.72], lh: [-0.3, 0.6] },
      { at: 0.45, hip: [-0.05, 0.7], lean: -4, lh: [-0.42, 0.62], rh: [0.36, 0.82] },
      { at: 0.5 },
      { at: 0.65, lh: [-0.18, 0.46] },
      { at: 0.8, lh: [-0.36, 0.72], rh: [0.3, 0.6] },
      { at: 0.95, hip: [0.04, 0.7], lean: 4, rh: [0.42, 0.62], lh: [-0.36, 0.82] },
      { at: 1 },
    ] }],
    balls: [{ keys: [
      { at: 0, h: 'r', o: [0, -0.13] }, { at: 0.15, h: 'r', o: [0, -0.13] }, { at: 0.3, p: [0, 0.12] },
      { at: 0.45, h: 'l', o: [0, -0.13] }, { at: 0.5, h: 'l', o: [0, -0.13] }, { at: 0.65, h: 'l', o: [0, -0.13] }, { at: 0.8, p: [0, 0.12] },
      { at: 0.95, h: 'r', o: [0, -0.13] }, { at: 1, h: 'r', o: [0, -0.13] },
    ] }],
    points: ['ひざより下の低さで、体の前を速く通す', '顔は上げたまま（ボールを見ない）', '受けた手の反対の腕で、ボールを守る'],
  };

  C.twoball = {
    name: '2ボール・ドリブル', view: 'front', box: [-1.0, 1.0, -0.05, 1.85], dur: 0.6, guides: ['head'],
    actors: [{ keys: [
      Object.assign({ at: 0 }, FLOW, { rh: [0.42, 0.64], lh: [-0.42, 0.64] }),
      { at: 0.22, hip: [0, 0.68], rh: [0.45, 0.5], lh: [-0.45, 0.5] },
      { at: 0.55, hip: [0, 0.7], rh: [0.43, 0.6], lh: [-0.43, 0.6] },
      { at: 1, rh: [0.42, 0.64], lh: [-0.42, 0.64] },
    ] }],
    balls: [
      { keys: [{ at: 0, h: 'r', o: [0, -0.13] }, { at: 0.22, h: 'r', o: [0, -0.13] }, { at: 0.55, p: [0.47, 0.12] }, { at: 1, h: 'r', o: [0, -0.13] }] },
      { keys: [{ at: 0, h: 'l', o: [0, -0.13] }, { at: 0.22, h: 'l', o: [0, -0.13] }, { at: 0.55, p: [-0.47, 0.12] }, { at: 1, h: 'l', o: [0, -0.13] }] },
    ],
    points: ['左右を同じ高さ・同じ強さで', '弱い手のリズムに合わせる', '顔を上げて、前を見る'],
  };

  // その場で走る（床の目印が流れる）。1回で2歩、床は 1.6m 流れる
  function runKeys(t0, t1, opt = {}) {
    const h = opt.h || 0.9, lean = opt.lean == null ? 14 : opt.lean;
    const k = [];
    const n = opt.cycles || 1;
    for (let c = 0; c < n; c++) {
      const b = t0 + ((t1 - t0) * c) / n, w = (t1 - t0) / n;
      k.push({ at: b, hip: [0, h], lean, rf: [0.18, 0], lf: [-0.42, 0.2], ...(opt.arms ? opt.arms(0) : { rh: [-0.18, 0.85], lh: [0.3, 1.08] }) });
      k.push({ at: b + w * 0.25, hip: [0, h + 0.04], rf: [-0.22, 0], lf: [0.12, 0.34], ...(opt.arms ? opt.arms(0.25) : {}) });
      k.push({ at: b + w * 0.5, hip: [0, h], lf: [0.18, 0], rf: [-0.42, 0.2], ...(opt.arms ? opt.arms(0.5) : { lh: [-0.18, 0.85], rh: [0.3, 1.08] }) });
      k.push({ at: b + w * 0.75, hip: [0, h + 0.04], lf: [-0.22, 0], rf: [0.12, 0.34], ...(opt.arms ? opt.arms(0.75) : {}) });
    }
    k.push({ at: t1, hip: [0, h], rf: [0.18, 0], lf: [-0.42, 0.2], ...(opt.arms ? opt.arms(1) : { rh: [-0.18, 0.85], lh: [0.3, 1.08] }) });
    for (const x of k) x.lin = true;
    return k;
  }

  C.speed = {
    name: 'スピードドリブル', view: 'side', box: [-1.0, 1.4, -0.05, 1.9], dur: 0.9,
    scroll: [{ at: 0, v: 0 }, { at: 1, v: 1.6 }],
    actors: [{ keys: runKeys(0, 1, { h: 0.88, lean: 18, arms: (u) => ({ rh: [0.52, 0.98 - 0.16 * Math.sin(u * Math.PI * 2)], lh: u < 0.5 ? [-0.1 + 0.4 * u, 0.9] : [0.3 - 0.4 * (u - 0.5), 1.05] }) }) }],
    balls: [{ keys: [{ at: 0, h: 'r', o: [0.05, -0.12] }, { at: 0.12, h: 'r', o: [0.08, -0.12] }, { at: 0.5, p: [0.95, 0.12] }, { at: 1, h: 'r', o: [0.05, -0.12] }] }],
    points: ['ボールを前へ押し出して、走りながら追いつく', 'つく回数を少なく（3〜4歩で1回）', '顔を上げて、前の空いている所を見る'],
  };

  // ディフェンスのスライド（前から・守り）。右へ3回・左へ3回
  function slideKeys() {
    const k = [];
    const H = 0.66, W = 0.3, step = 0.26;
    let x = -0.39;
    const pose = (x, at, wide, dir) => ({
      at, hip: [x + (wide ? dir * 0.1 : 0), H], lean: 0, nod: 0,
      rf: [x + W + (wide && dir > 0 ? 0.22 : 0), wide && dir > 0 ? 0.04 : 0],
      lf: [x - W - (wide && dir < 0 ? 0.22 : 0), wide && dir < 0 ? 0.04 : 0],
      rh: [x + 0.55 + (wide ? dir * 0.1 : 0), dir > 0 ? 1.05 : 0.7], lh: [x - 0.55 + (wide ? dir * 0.1 : 0), dir > 0 ? 0.7 : 1.05],
    });
    let t = 0;
    const dt = 1 / 12;
    for (const dir of [1, -1]) {
      for (let i = 0; i < 3; i++) {
        k.push(pose(x, t, false, dir));
        k.push(pose(x, t + dt * 0.55, true, dir));
        x += dir * step;
        t += dt * 2;
      }
    }
    k.push(pose(x, 1, false, 1));
    return k;
  }
  C.defslide = {
    name: 'ディフェンスのスライド', view: 'front', box: [-1.4, 1.4, -0.05, 1.85], dur: 3.0, guides: ['head'],
    actors: [{ role: 'x', keys: slideKeys() }],
    balls: [],
    points: ['足を交差させない（出す足→寄せる足）', '頭の高さを変えない（上下にはねない）', '手を広げて、パスとドリブルのコースを消す'],
  };

  // 前へ歩く・走る（足を置く場所を順に）
  function steps(t0, t1, start, plants, opt = {}) {
    const k = [];
    const h = opt.h || 0.88, lean = opt.lean == null ? 12 : opt.lean;
    let feet = { r: start.r, l: start.l };
    const n = plants.length;
    const hipOf = (f) => [(f.r + f.l) / 2 + (opt.ahead || 0.08), h];
    k.push({ at: t0, hip: hipOf(feet), lean, rf: [feet.r, 0], lf: [feet.l, 0], ...(opt.arms ? opt.arms(feet, 0) : {}) });
    plants.forEach(([foot, x], i) => {
      const ta = t0 + ((t1 - t0) * i) / n, tb = t0 + ((t1 - t0) * (i + 1)) / n;
      const mid = Object.assign({}, feet);
      const midX = (feet[foot] + x) / 2;
      const m = { at: (ta + tb) / 2, hip: [(midX + feet[foot === 'r' ? 'l' : 'r']) / 2 + (opt.ahead || 0.08), h + 0.03] };
      m[foot + 'f'] = [midX, opt.lift == null ? 0.16 : opt.lift];
      k.push(Object.assign(m, opt.arms ? opt.arms(mid, i + 0.5) : {}));
      feet = Object.assign({}, feet, { [foot]: x });
      const e = { at: tb, hip: hipOf(feet) };
      e[foot + 'f'] = [x, 0];
      k.push(Object.assign(e, opt.arms ? opt.arms(feet, i + 1) : {}));
    });
    return { keys: k, feet };
  }

  // クローズアウト（横から・守りは右向き、シューターは左向き）
  (function () {
    const run = steps(0.08, 0.42, { r: -1.75, l: -1.95 }, [['r', -1.35], ['l', -0.95], ['r', -0.6]], { h: 0.9, lean: 16, ahead: 0.1,
      arms: (f, i) => (i % 2 < 1 ? { rh: [f.r - 0.05, 0.9], lh: [f.l + 0.45, 1.1] } : { rh: [f.r + 0.4, 1.1], lh: [f.l - 0.05, 0.9] }) });
    const chop = steps(0.42, 0.66, run.feet, [['l', -0.55], ['r', -0.42], ['l', -0.44], ['r', -0.32]], { h: 0.74, lean: 22, ahead: 0.06, lift: 0.05,
      arms: (f) => ({ rh: [f.r + 0.25, 1.75], lh: [f.l + 0.5, 0.7] }) });
    const last = { at: 0.72, hip: [-0.36, 0.7], lean: 18, rf: [-0.24, 0], lf: [-0.52, 0], rh: [-0.06, 2.0], lh: [-0.02, 0.72] };
    C.closeout = {
      name: 'クローズアウト', view: 'side', box: [-2.3, 1.1, -0.05, 2.2], dur: 2.4, fade: true,
      actors: [
        { role: 'x', keys: [{ at: 0, hip: [-1.77, 0.78], lean: 22, nod: -15, rf: [-1.65, 0], lf: [-1.95, 0], rh: [-1.5, 1.0], lh: [-1.55, 0.95] }, ...run.keys.slice(1), ...chop.keys.slice(1), last, { at: 1 }] },
        { role: 'o', face: -1, keys: [{ at: 0, hip: [0.62, 0.86], lean: 6, nod: 0, rf: [0.52, 0], lf: [0.72, 0], rh: [0.36, 1.2], lh: [0.42, 1.18] }, { at: 0.5, hip: [0.62, 0.84] }, { at: 1, hip: [0.62, 0.86] }] },
      ],
      balls: [{ keys: [{ at: 0, a: 1, h: 'both', o: [-0.06, 0] }, { at: 1, a: 1, h: 'both', o: [-0.06, 0] }] }],
      points: ['最初は全力で走り、最後の数歩は小さく速く（チョップステップ）', '腰を落として止まり、シューターに手を上げる', '近づきすぎない（腕1本の間合い）'],
    };
  })();

  // シュート（横から・右にゴール）
  const HOOP = 3.35; // リングの中心の x
  C.shoot = {
    name: 'シュート（ジャンプシュート）', view: 'side', box: [-0.8, 4.0, -0.05, 4.7], dur: 2.6, fade: true, hoop: HOOP,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 6, nod: -6, rf: [0.1, 0], lf: [-0.1, 0], rh: [0.3, 1.08], lh: [0.24, 1.12] },
      { at: 0.18, hip: [0, 0.76], lean: 14, rh: [0.34, 1.0], lh: [0.27, 1.04] },
      { at: 0.32, hip: [0, 0.92], lean: 4, rh: [0.2, 1.78], lh: [0.12, 1.74] },
      { at: 0.42, hip: [0, 1.0], lean: 2, rf: [0.1, 0.08], lf: [-0.1, 0.08], rh: [0.32, 2.14], lh: [0.16, 1.82] },
      { at: 0.55, hip: [0, 0.94], rf: [0.1, 0], lf: [-0.1, 0], rh: [0.36, 2.1], lh: [0.18, 1.75] },
      { at: 0.86, hip: [0, 0.9] },
      { at: 1, hip: [0, 0.9], lean: 6, rh: [0.3, 1.08], lh: [0.24, 1.12] },
    ] }],
    balls: [{ keys: [
      { at: 0, h: 'both', o: [0.06, 0.02] }, { at: 0.18, h: 'both', o: [0.06, 0.02] },
      { at: 0.32, h: 'r', o: [0.02, 0.13] }, { at: 0.42, h: 'r', o: [0.04, 0.13] },
      { at: 0.78, p: [HOOP, 3.18], arc: 1.5 }, { at: 0.86, p: [HOOP, 2.62] }, { at: 0.96, p: [HOOP - 0.1, 0.12] }, { at: 1, p: [HOOP - 0.1, 0.12] },
    ] }],
    points: ['ひざを曲げて、のばす力で打つ（腕だけで打たない）', '肘はリングへ、足・ひざ・肘・手首が1本の線', 'リリースのあと、手首をたおしたまま（フォロースルー）'],
  };

  // レイアップ（横から・右にゴール）
  (function () {
    const R = HOOP - 2.35; // 右のゴールに近づく
    C.layup = {
      name: 'レイアップ（ランニングシュート）', view: 'side', box: [-2.9, 1.55, -0.05, 4.2], dur: 2.6, fade: true, hoop: R + 0.15,
      actors: [{ keys: [
        { at: 0, hip: [-2.15, 0.86], lean: 14, nod: -8, rf: [-2.05, 0], lf: [-2.35, 0], rh: [-1.85, 0.95], lh: [-1.9, 1.0] },
        { at: 0.1, hip: [-1.85, 0.9], lf: [-1.95, 0.16], rf: [-2.0, 0] },
        { at: 0.2, hip: [-1.55, 0.86], rf: [-1.45, 0], lf: [-1.8, 0.12], rh: [-1.3, 1.12], lh: [-1.35, 1.14] },
        { at: 0.28, hip: [-1.22, 0.88], lf: [-1.15, 0.14], rf: [-1.4, 0] },
        { at: 0.36, hip: [-0.95, 0.8], lean: 10, lf: [-0.85, 0], rf: [-1.2, 0.18], rh: [-0.75, 1.25], lh: [-0.8, 1.22] },
        { at: 0.46, hip: [-0.62, 1.12], lean: 4, lf: [-0.7, 0.06], rf: [-0.42, 0.62], rh: [-0.38, 2.05], lh: [-0.5, 1.6] },
        { at: 0.56, hip: [-0.3, 1.48], lean: 2, nod: -2, lf: [-0.4, 0.46], rf: [-0.12, 0.92], rh: [0.0, 2.55], lh: [-0.22, 1.85] },
        { at: 0.66, hip: [-0.05, 1.3], lf: [-0.1, 0.3], rf: [0.05, 0.42], rh: [0.18, 2.4], lh: [-0.02, 1.7] },
        { at: 0.78, hip: [0.1, 0.72], lean: 22, lf: [-0.02, 0], rf: [0.22, 0], rh: [0.42, 1.1], lh: [0.3, 1.05] },
        { at: 1 },
      ] }],
      balls: [{ keys: [
        { at: 0, h: 'both', o: [0.06, 0] }, { at: 0.36, h: 'both', o: [0.06, 0] },
        { at: 0.46, h: 'r', o: [0.03, 0.13] }, { at: 0.58, h: 'r', o: [0.03, 0.13] },
        { at: 0.68, p: [R + 0.52, 3.45], arc: 0.25 }, { at: 0.76, p: [R + 0.15, 3.12] }, { at: 0.84, p: [R + 0.15, 2.6] },
        { at: 0.96, p: [R + 0.05, 0.12] }, { at: 1, p: [R + 0.05, 0.12] },
      ] }],
      points: ['右手で打つときは「右・左」で踏み切り（左足でジャンプ）', '右ひざを高く上げて、上へ跳ぶ（前へ流れない）', 'ボードの四角の上の角をねらう'],
    };
  })();

  // チェストパス（横から・パスの人は右向き、受け手は左向き）
  C.chestpass = {
    name: 'チェストパス', view: 'side', box: [-0.8, 3.6, -0.05, 2.0], dur: 1.8, fade: true,
    actors: [
      { keys: [
        { at: 0, hip: [0, 0.82], lean: 12, nod: -8, rf: [0.12, 0], lf: [-0.18, 0], rh: [0.32, 1.12], lh: [0.26, 1.14] },
        { at: 0.18, hip: [0.12, 0.8], rf: [0.45, 0.06], rh: [0.36, 1.12], lh: [0.3, 1.14] },
        { at: 0.32, hip: [0.2, 0.8], lean: 16, rf: [0.5, 0], rh: [0.82, 1.08], lh: [0.78, 1.1] },
        { at: 0.6 },
        { at: 0.9, hip: [0, 0.82], lean: 12, rf: [0.12, 0], rh: [0.32, 1.12], lh: [0.26, 1.14] },
        { at: 1 },
      ] },
      { role: 'o', face: -1, keys: [
        { at: 0, hip: [2.95, 0.84], lean: 10, nod: -6, rf: [2.85, 0], lf: [3.1, 0], rh: [2.62, 1.18], lh: [2.66, 1.2] },
        { at: 0.5, hip: [2.98, 0.82], rh: [2.66, 1.16], lh: [2.7, 1.18] },
        { at: 1 },
      ] },
    ],
    balls: [{ keys: [
      { at: 0, h: 'both', o: [0.08, 0] }, { at: 0.2, h: 'both', o: [0.08, 0] }, { at: 0.32, h: 'both', o: [0.1, 0] },
      { at: 0.5, a: 1, h: 'both', o: [-0.08, 0] }, { at: 1, a: 1, h: 'both', o: [-0.08, 0] },
    ] }],
    points: ['受け手の胸（手を出している所）をねらう', '一歩ふみ出して、体重をボールにのせる', '親指を下に返して、手のひらを外へ'],
  };

  // ジャンプストップ（その場で走って、両足で止まる）
  C.jumpstop = {
    name: 'ジャンプストップ', view: 'side', box: [-1.1, 1.3, -0.05, 1.9], dur: 2.2, fade: true,
    scroll: [{ at: 0, v: 0 }, { at: 0.44, v: 1.6 }, { at: 0.56, v: 2.1 }, { at: 1, v: 2.1 }],
    actors: [{ keys: [
      ...runKeys(0, 0.44, { h: 0.9, lean: 12, arms: () => ({ rh: [0.3, 1.05], lh: [0.24, 1.08] }) }),
      { at: 0.5, hip: [0, 1.04], lean: 8, rf: [0.12, 0.2], lf: [-0.12, 0.22], lin: false },
      { at: 0.58, hip: [0, 0.7], lean: 26, nod: -20, rf: [0.16, 0], lf: [-0.16, 0] },
      { at: 0.9 },
      { at: 1 },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'both', o: [0.06, 0] }, { at: 1, h: 'both', o: [0.06, 0] }] }],
    points: ['両足で同時に着地する（どちらの足も軸足にできる）', '着地はひざを曲げて、低く止まる', 'ボールはあごの前で、ひじを張って守る'],
  };

  // ボックスアウト（横から・守りは右のゴールを向いて、うしろの相手に当たる）
  C.boxout = {
    name: 'ボックスアウト', view: 'side', box: [-1.0, 3.3, -0.05, 4.2], dur: 2.8, fade: true, hoop: 2.75,
    actors: [
      { role: 'x', keys: [
        { at: 0, hip: [0.75, 0.9], lean: 6, nod: 0, rf: [0.85, 0], lf: [0.62, 0], rh: [0.95, 1.05], lh: [0.9, 1.0] },
        { at: 0.2, hip: [0.55, 0.66], lean: 22, nod: -26, rf: [0.88, 0], lf: [0.2, 0], rh: [0.95, 1.5], lh: [0.78, 1.46] },
        { at: 0.55, hip: [0.52, 0.64] },
        { at: 0.64, hip: [0.6, 0.6], lean: 18 },
        { at: 0.72, hip: [0.72, 1.22], lean: 4, nod: -10, rf: [0.82, 0.34], lf: [0.6, 0.36], rh: [0.98, 2.35], lh: [0.88, 2.32] },
        { at: 0.84, hip: [0.7, 0.68], lean: 20, nod: -10, rf: [0.9, 0], lf: [0.45, 0], rh: [0.98, 1.24], lh: [0.9, 1.22] },
        { at: 1 },
      ] },
      { role: 'o', keys: [
        { at: 0, hip: [0.12, 0.88], lean: 10, nod: -10, rf: [0.22, 0], lf: [-0.02, 0], rh: [0.4, 1.0], lh: [0.35, 1.02] },
        { at: 0.2, hip: [0.0, 0.84], lean: 24, rf: [0.12, 0], lf: [-0.2, 0], rh: [0.32, 1.25], lh: [0.28, 1.2] },
        { at: 0.6, hip: [-0.04, 0.84] },
        { at: 0.75, hip: [-0.04, 0.95], lean: 10, rh: [0.22, 1.7], lh: [0.18, 1.65] },
        { at: 1 },
      ] },
    ],
    balls: [{ keys: [
      { at: 0, p: [1.4, 4.05] }, { at: 0.4, p: [2.62, 3.15], arc: 0.25 }, { at: 0.64, p: [1.25, 2.55], arc: 0.35 },
      { at: 0.72, a: 0, h: 'both', o: [0.06, 0.06] }, { at: 0.84, a: 0, h: 'both', o: [0.08, 0] }, { at: 1, a: 0, h: 'both', o: [0.08, 0] },
    ] }],
    points: ['シュートが打たれたら、まず相手を見て体を当てる', '腰を落とし、足は広く・おしりで相手を押さえる', 'ボールは両手で、いちばん高いところで取る'],
  };

  // 着地（ケガ予防）
  C.landing = {
    name: '着地（やわらかく止まる）', view: 'side', box: [-0.9, 1.1, -0.05, 2.6], dur: 2.0,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 6, nod: 0, rf: [0.08, 0], lf: [-0.08, 0], rh: [0.1, 0.9], lh: [0.06, 0.92] },
      { at: 0.16, hip: [-0.02, 0.68], lean: 30, nod: -20, rh: [-0.3, 0.82], lh: [-0.34, 0.84] },
      { at: 0.3, hip: [0, 1.22], lean: 2, nod: 0, rf: [0.06, 0.32], lf: [-0.08, 0.32], rh: [0.22, 2.15], lh: [0.18, 2.12] },
      { at: 0.42, hip: [0, 1.28], rf: [0.06, 0.36], lf: [-0.08, 0.36] },
      { at: 0.56, hip: [-0.04, 0.64], lean: 32, nod: -22, rf: [0.08, 0], lf: [-0.08, 0], rh: [0.42, 1.0], lh: [0.38, 1.02] },
      { at: 0.82 },
      { at: 1, hip: [0, 0.9], lean: 6, nod: 0, rh: [0.1, 0.9], lh: [0.06, 0.92] },
    ] }],
    balls: [],
    points: ['つま先から着地して、ひざと股関節で吸収する', 'ひざはつま先と同じ向き（内側に入れない）', '着地の音を小さく'],
  };

  // ランジ（ダイナミック・ウォームアップ）
  C.lunge = {
    name: 'ランジ（動きながらのストレッチ）', view: 'side', box: [-1.0, 1.3, -0.05, 2.3], dur: 3.6,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 0, nod: 0, rf: [0.06, 0], lf: [-0.06, 0], rh: [0.04, 0.9], lh: [0, 0.9] },
      { at: 0.2, hip: [0.18, 0.55], lean: 2, rf: [0.62, 0], lf: [-0.42, 0], rh: [0.22, 2.05], lh: [0.18, 2.05] },
      { at: 0.36 },
      { at: 0.5, hip: [0, 0.9], lean: 0, rf: [0.06, 0], lf: [-0.06, 0], rh: [0.04, 0.9], lh: [0, 0.9] },
      { at: 0.7, hip: [0.18, 0.55], lean: 2, lf: [0.62, 0], rf: [-0.42, 0], rh: [0.22, 2.05], lh: [0.18, 2.05] },
      { at: 0.86 },
      { at: 1, hip: [0, 0.9], lean: 0, rf: [0.06, 0], lf: [-0.06, 0], rh: [0.04, 0.9], lh: [0, 0.9] },
    ] }],
    balls: [],
    points: ['前のひざは、つま先より前に出しすぎない', 'うしろのひざは床の近くまで下げる', '反動をつけず、ゆっくり大きく'],
  };

  // トリプルスレット（構え → ジャブステップ → ショットフェイク）
  C.stance = {
    name: 'トリプルスレット（ジャブ・ショットフェイク）', view: 'side', box: [-0.9, 1.3, -0.05, 2.0], dur: 2.0,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.76], lean: 24, nod: -20, rf: [0.12, 0], lf: [-0.2, 0], rh: [0.32, 0.86], lh: [0.24, 0.92] },
      { at: 0.2, hip: [0.1, 0.72], lean: 30, rf: [0.45, 0], rh: [0.36, 0.84], lh: [0.28, 0.9] },
      { at: 0.38, hip: [0, 0.76], lean: 24, rf: [0.12, 0], rh: [0.32, 0.86], lh: [0.24, 0.92] },
      { at: 0.55 },
      { at: 0.7, hip: [0, 0.76], lean: 16, nod: -10, rh: [0.26, 1.58], lh: [0.18, 1.6] },
      { at: 0.85, hip: [0, 0.76], lean: 24, nod: -20, rh: [0.32, 0.86], lh: [0.24, 0.92] },
      { at: 1 },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'both', o: [0.06, 0] }, { at: 1, h: 'both', o: [0.06, 0] }] }],
    points: ['ボールは腰の横で持つ（シュート・パス・ドリブルのどれでもできる）', 'ジャブステップは小さく速く、軸足は動かさない', 'ショットフェイクは、ひざを伸ばさない（すぐ抜ける）'],
  };

  BC.motions = C;

  // 練習メニュー・改善の視点 → 見せる動き
  BC.MOTION_OF = {
    // ドリブル
    'd-pound': 'pound', 'd-headup': 'pound', 'd-protect': 'pound', 'd-tennisball': 'pound', 'd-handling': 'pound',
    'd-2ball': 'twoball', 'd-zigzag': 'crossover', 'd-moves': 'crossover', 'd-1v2-dribble': 'crossover',
    'd-speed-dribble': 'speed', 'd-dribble-tag': 'speed',
    // シュート
    'd-formshoot': 'shoot', 'd-around': 'shoot', 'd-catchshoot': 'shoot', 'd-pullup': 'shoot', 'd-ft': 'shoot', 'd-ftpressure': 'shoot',
    'd-partner': 'shoot', 'd-beatpro': 'shoot', 'd-knockout': 'shoot', 'd-curlshoot': 'shoot', 'd-contested': 'shoot', 'd-fatigue-shoot': 'shoot',
    // フィニッシュ
    'd-mikan': 'layup', 'd-layup-lines': 'layup', 'd-layup-step': 'layup', 'd-weakhand-layup': 'layup', 'd-contact-finish': 'layup', 'd-chase': 'layup',
    // パス
    'd-partner-pass': 'chestpass', 'd-3man-weave': 'chestpass', 'd-starpass': 'chestpass', 'd-2ball-pass': 'chestpass', 'd-pivot-pass': 'chestpass', 'd-meet': 'chestpass', 'd-keepaway': 'chestpass',
    // フットワーク・1対1
    'd-jumpstop': 'jumpstop', 'd-triple': 'stance', 'd-shotfake': 'stance', 'd-1v1-wing': 'stance', 'd-attack-closeout': 'stance',
    // 守り
    'd-stance': 'defslide', 'd-zigzag-d': 'defslide', 'd-mirror': 'defslide', 'd-ballpressure': 'defslide', 'd-reaction': 'defslide',
    'd-closeout': 'closeout',
    // リバウンド
    'd-boxout': 'boxout', 'd-circle-boxout': 'boxout', 'd-rebound-war': 'boxout',
    // からだ
    'd-landing': 'landing', 'd-dynamic': 'lunge',
    // 改善の視点
    'v-drb-low': 'pound', 'v-drb-eyes': 'pound', 'v-drb-protect': 'pound', 'v-drb-change': 'crossover', 'v-drb-weak': 'twoball',
    'v-shoot-base': 'shoot', 'v-shoot-hold': 'shoot', 'v-shoot-release': 'shoot', 'v-shoot-arc': 'shoot', 'v-shoot-rhythm': 'shoot', 'v-shoot-ready': 'shoot', 'v-shoot-range': 'shoot',
    'v-fin-step': 'layup', 'v-fin-board': 'layup', 'v-fin-hand': 'layup',
    'v-pass-target': 'chestpass', 'v-pass-catch': 'chestpass',
    'v-foot-stop': 'jumpstop', 'v-foot-triple': 'stance', 'v-atk-fake': 'stance',
    'v-def-stance': 'defslide', 'v-def-feet': 'defslide', 'v-def-closeout': 'closeout',
    'v-reb-contact': 'boxout', 'v-reb-hands': 'boxout',
    'v-body-injury': 'landing',
  };
  BC.motionFor = (id) => (BC.MOTION_OF[id] && C[BC.MOTION_OF[id]] ? BC.MOTION_OF[id] : null);

  /* ---------- 描く ---------- */
  function build(clip) {
    const actors = clip.actors.map((a) => ({ face: a.face || 1, role: a.role || '', keys: fill(a.keys) }));
    // ボールのキーは前のキーを引きつがない（「床」のあとに「手」が来ても、床の位置が残らないように）
    const balls = (clip.balls || []).map((b) => ({ keys: b.keys.map((k) => Object.assign({}, k)) }));
    return { actors, balls };
  }
  // 時刻 t（0〜1）の、人の関節とボールの位置
  BC.motionFrame = function (clip, t) {
    const B = clip._b || (clip._b = build(clip));
    const sk = B.actors.map((a) => skeleton(poseAt(a.keys, t), clip.view, a.face));
    const balls = B.balls.map((b) => {
      const { a, b: k, u } = seg(b.keys, t);
      const same = a.h && k.h && a.h === k.h && (a.a || 0) === (k.a || 0) && !a.p && !k.p;
      if (same) {
        const p = ballPos(a, sk);
        const o = [lerp((a.o || [0, 0])[0], (k.o || [0, 0])[0], u), lerp((a.o || [0, 0])[1], (k.o || [0, 0])[1], u)];
        return [p[0] - (a.o || [0, 0])[0] + o[0], p[1] - (a.o || [0, 0])[1] + o[1]];
      }
      const skAt = (key) => B.actors.map((ac) => skeleton(poseAt(ac.keys, key.at), clip.view, ac.face));
      const pa = ballPos(a, skAt(a)), pb = ballPos(k, skAt(k));
      const x = lerp(pa[0], pb[0], u);
      let y = lerp(pa[1], pb[1], u);
      if (k.arc) y += k.arc * 4 * u * (1 - u);
      return [x, y];
    });
    let scroll = 0;
    if (clip.scroll) {
      const { a, b, u } = seg(clip.scroll, t);
      scroll = lerp(a.v, b.v, u);
    }
    const fade = clip.fade ? Math.min(1, t / 0.05, (1 - t) / 0.05) : 1;
    return { sk, balls, scroll, fade };
  };

  const color = (role) => (role === 'x' ? 'var(--x)' : role === 'o' ? 'var(--o)' : 'var(--ink)');
  BC.anim = function (el, id, opt = {}) {
    const clip = C[id];
    if (!clip) return null;
    const [x0, x1, y0, y1] = clip.box;
    const W = x1 - x0, H = y1 - y0;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.classList.add('mo');
    const act = clip.actors.map((a, i) => `
      <g class="mo-actor" data-a="${i}" style="--c:${color(a.role)}">
        <ellipse class="mo-shadow" rx="0.32" ry="0.035"></ellipse>
        <g class="mo-far"><line data-k="lth"/><line data-k="lsh"/><line data-k="lft"/><line data-k="lua"/><line data-k="lfa"/></g>
        <line class="mo-body" data-k="torso"/><line class="mo-body" data-k="neck"/><circle class="mo-head" data-k="head" r="${L.R}"/>
        ${clip.view === 'front' ? '<line class="mo-body" data-k="shl"/><line class="mo-body" data-k="hpl"/>' : ''}
        <g class="mo-near"><line data-k="rth"/><line data-k="rsh"/><line data-k="rft"/><line data-k="rua"/><line data-k="rfa"/></g>
      </g>`).join('');
    const hoop = clip.hoop != null ? (() => {
      const hx = clip.hoop, bx = hx + 0.38;
      return `<g class="mo-hoop"><line x1="${bx + 0.45}" y1="0" x2="${bx + 0.45}" y2="${-3.3}"/><line x1="${bx + 0.45}" y1="${-3.3}" x2="${bx}" y2="${-3.3}"/>
        <line class="mo-board" x1="${bx}" y1="${-2.9}" x2="${bx}" y2="${-3.95}"/><line x1="${bx}" y1="${-3.05}" x2="${hx + 0.23}" y2="${-3.05}"/>
        <ellipse class="mo-rim" cx="${hx}" cy="${-3.05}" rx="0.23" ry="0.045"/><path class="mo-net" d="M${hx - 0.22} ${-3.04} L${hx - 0.13} ${-2.62} L${hx + 0.13} ${-2.62} L${hx + 0.22} ${-3.04}"/></g>`;
    })() : '';
    el.innerHTML = `
      <div class="mo-stage"><svg viewBox="${x0} ${-y1} ${W} ${H}" role="img" aria-label="${clip.name}の動き">
        <g class="mo-marks"></g>
        <line class="mo-floor" x1="${x0}" y1="0" x2="${x1}" y2="0"/>
        ${hoop}
        <line class="mo-guide" data-g="head" x1="${x0}" x2="${x1}" y1="0" y2="0" style="display:none"/>
        <g class="mo-world">${act}${(clip.balls || []).map((_, i) => `<g class="mo-ball" data-b="${i}"><circle r="${L.BALL}"/><path d="M${-L.BALL} 0 H${L.BALL} M0 ${-L.BALL} V${L.BALL}"/></g>`).join('')}</g>
      </svg></div>
      <div class="mo-bar">
        <button type="button" class="cv-btn mo-play" aria-label="止める">⏸</button>
        <button type="button" class="chip mo-slow" aria-pressed="false">ゆっくり</button>
        <span class="mo-name">${clip.name}</span>
      </div>
      ${opt.points === false ? '' : `<ul class="mo-points">${clip.points.map((p) => `<li>${p}</li>`).join('')}</ul>`}`;
    const svg = el.querySelector('svg');
    const marks = el.querySelector('.mo-marks');
    const q = (a, k) => svg.querySelector(`[data-a="${a}"] [data-k="${k}"]`);
    const parts = clip.actors.map((_, i) => {
      const o = {};
      for (const k of ['lth', 'lsh', 'lft', 'lua', 'lfa', 'torso', 'neck', 'head', 'shl', 'hpl', 'rth', 'rsh', 'rft', 'rua', 'rfa']) o[k] = q(i, k);
      o.shadow = svg.querySelector(`[data-a="${i}"] .mo-shadow`);
      o.g = svg.querySelector(`[data-a="${i}"]`);
      return o;
    });
    const ballEls = [...svg.querySelectorAll('.mo-ball')];
    const guide = svg.querySelector('[data-g="head"]');
    const ln = (e, a, b) => { if (!e) return; e.setAttribute('x1', a[0].toFixed(3)); e.setAttribute('y1', (-a[1]).toFixed(3)); e.setAttribute('x2', b[0].toFixed(3)); e.setAttribute('y2', (-b[1]).toFixed(3)); };
    // 頭の高さの目安（はじめの姿勢の頭の上）
    if ((clip.guides || []).includes('head')) {
      const f0 = BC.motionFrame(clip, 0);
      const y = -(f0.sk[0].head[1] + L.R + 0.02);
      guide.setAttribute('y1', y); guide.setAttribute('y2', y); guide.style.display = '';
    }
    function draw(t) {
      const fr = BC.motionFrame(clip, t);
      fr.sk.forEach((s, i) => {
        const p = parts[i];
        ln(p.rth, s.hpR, s.r.knee); ln(p.rsh, s.r.knee, s.r.ank); ln(p.rft, s.r.foot[0], s.r.foot[1]);
        ln(p.lth, s.hpL, s.l.knee); ln(p.lsh, s.l.knee, s.l.ank); ln(p.lft, s.l.foot[0], s.l.foot[1]);
        ln(p.rua, s.shR, s.r.elb); ln(p.rfa, s.r.elb, s.r.hand); ln(p.lua, s.shL, s.l.elb); ln(p.lfa, s.l.elb, s.l.hand);
        ln(p.torso, s.hip, s.sh); ln(p.neck, s.sh, s.neck);
        if (p.shl) { ln(p.shl, s.shL, s.shR); ln(p.hpl, s.hpL, s.hpR); }
        p.head.setAttribute('cx', s.head[0].toFixed(3)); p.head.setAttribute('cy', (-s.head[1]).toFixed(3));
        const footY = Math.min(s.r.foot[0][1], s.l.foot[0][1]);
        p.shadow.setAttribute('cx', s.hip[0].toFixed(3)); p.shadow.setAttribute('cy', '0.01');
        p.shadow.setAttribute('rx', (0.32 * Math.max(0.4, 1 - footY)).toFixed(3));
        p.g.style.opacity = fr.fade.toFixed(3);
      });
      fr.balls.forEach((b, i) => {
        ballEls[i].setAttribute('transform', `translate(${b[0].toFixed(3)} ${(-b[1]).toFixed(3)})`);
        ballEls[i].style.opacity = fr.fade.toFixed(3);
      });
      if (clip.scroll) {
        const off = fr.scroll % 0.5;
        let s = '';
        for (let x = Math.ceil(x0 / 0.5) * 0.5 - off; x < x1 + 0.5; x += 0.5) s += `<line x1="${x.toFixed(3)}" y1="0.04" x2="${(x + 0.18).toFixed(3)}" y2="0.04"/>`;
        marks.innerHTML = s;
      }
    }
    let playing = !reduce && opt.autoplay !== false;
    let speed = 1, t = opt.at || 0, last = 0, raf = 0, visible = true;
    const playBtn = el.querySelector('.mo-play');
    const setBtn = () => { playBtn.textContent = playing ? '⏸' : '▶'; playBtn.setAttribute('aria-label', playing ? '止める' : '動かす'); };
    function loop(now) {
      raf = 0;
      if (!el.isConnected) return;
      if (playing && visible) {
        if (last) t = (t + ((now - last) / 1000 / clip.dur) * speed) % 1;
        last = now;
        draw(t);
      } else last = 0;
      if (playing) raf = requestAnimationFrame(loop);
    }
    const start = () => { if (!raf) raf = requestAnimationFrame(loop); };
    playBtn.addEventListener('click', () => { playing = !playing; setBtn(); last = 0; if (playing) start(); });
    el.querySelector('.mo-slow').addEventListener('click', (e) => {
      speed = speed === 1 ? 0.4 : 1;
      e.currentTarget.setAttribute('aria-pressed', String(speed !== 1));
    });
    if (typeof IntersectionObserver === 'function') {
      const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && playing) start(); });
      io.observe(el);
    }
    // 動かないとき（動きを減らす設定）は、いちばん分かりやすい場面で止める
    draw(playing ? t : clip.still != null ? clip.still : 0.3);
    if (!playing) t = clip.still != null ? clip.still : 0.3;
    setBtn();
    if (playing) start();
    return { stop() { playing = false; }, draw };
  };
})();
