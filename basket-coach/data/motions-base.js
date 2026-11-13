/* 動きのデータ（基本の14）：低いドリブル・クロスオーバー・2ボール・スピードドリブル・スライド・クローズアウト・シュート・レイアップ・
   チェストパス・ジャンプストップ・ボックスアウト・着地・ランジ・トリプルスレット。書き方は js/motion.js の先頭。 */
(function () {
  // 腰を落とした構え（横から・右向き）
  const LOW = BC.mo.LOW;

  /* 低いドリブル（ポンド）：体つきのある人（look: 'real'）と、物理にそったボール。
     1回の流れ（秒）：0 手の中のいちばん上 →（押す）→ tR 手をはなれる →（落ちる）→ tB 床 →（はね返る）→ tC 指でうける →（吸収する）→ T
     ・ボール：手の中は なめらかに加速、空中は 重力で落ちて はね返る（はね返りの係数 E）。床で少しつぶれ、回りながら動く
     ・手：指の腹が ボールの上にのる。うけるときは 指がのびて、押すときは 手首が返る（スナップ）。はなれたあとも 床へ向かってのびる
     ・体：押すときに 肩が少し入り、腰は わずかに引く。頭の高さと向きは 変えない（腰の高さで つり合わせる）
     動画チェックの基準（腰の低さ・顔・頭の高さ・手首が腰より下）に合う形にしてある（tools/analyze-test.cjs） */
  const pound = (function () {
    const G = 9.8, R = 0.12, E = 0.8;
    const HIP = 0.69, LEAN = 34, NOD = -28;
    const yTop = 0.5, yRel = 0.36, yCat = 0.41, vRel = 2.6, tauP = 0.145, tauA = 0.18;
    const vImp = Math.sqrt(vRel * vRel + 2 * G * (yRel - R)), tDown = (vImp - vRel) / G;
    const vB = E * vImp, vCat = Math.sqrt(vB * vB - 2 * G * (yCat - R)), tUp = (vB - vCat) / G;
    const tR = tauP, tB = tR + tDown, tC = tB + tUp, T = tC + tauA;
    const rad = (d) => (d * Math.PI) / 180, dir = (d) => [Math.cos(rad(d)), Math.sin(rad(d))];
    const wrap = (t) => ((t % T) + T) % T;
    const herm = (p0, v0, p1, v1, tau, s) => { const s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * tau * v0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * tau * v1; };
    // くり返す なめらかな線（[秒, 値] の点を通る）
    const spline = (keys) => (t0) => {
      const t = wrap(t0), n = keys.length;
      let j = -1;
      for (let k = 0; k < n; k++) if (keys[k][0] <= t) j = k;
      const K = (i) => { const q = ((i % n) + n) % n; return [keys[q][0] + Math.floor(i / n) * T, keys[q][1]]; };
      const a = K(j), b = K(j + 1), a0 = K(j - 1), b1 = K(j + 2);
      return herm(a[1], (b[1] - a0[1]) / (b[0] - a0[0]), b[1], (b1[1] - a[1]) / (b1[0] - a[0]), b[0] - a[0], (t - a[0]) / (b[0] - a[0]));
    };
    const ballAt = (t0) => {
      const t = wrap(t0);
      let y;
      if (t < tR) y = herm(yTop, 0, yRel, -vRel, tauP, t / tauP);
      else if (t < tB) { const q = t - tR; y = yRel - vRel * q - 0.5 * G * q * q; }
      else if (t < tC) { const q = t - tB; y = R + vB * q - 0.5 * G * q * q; }
      else y = herm(yCat, vCat, yTop, 0, tauA, (t - tC) / tauA);
      return [0.43 + 0.018 * Math.cos((2 * Math.PI * (t - tB)) / T), y];
    };
    // 手のひらの向き・指の曲げ・指の腹が のる場所（ボールの てっぺんから 前へ何度）
    const palm = spline([[0, 6], [tR * 0.65, 3], [tR, -14], [tR + 0.05, -38], [tB + 0.04, -16], [tC - 0.035, 8], [tC, 10]]);
    const curl = spline([[0, 40], [tR * 0.65, 40], [tR, 30], [tR + 0.05, 22], [tB + 0.04, 16], [tC - 0.035, 16], [tC, 18]]);
    // 腕をのばすとき、手前の肩が 少し下がって前へ出る（1：いちばん のびたとき）
    const reach = spline([[0, 0.1], [tR, 0.6], [tR + 0.06, 1], [tB + 0.05, 0.8], [tC, 0.45], [tC + 0.08, 0.15]]);
    const pad = spline([[0, 30], [tR, 14], [tB, 10], [tC, 8]]);
    const wristOn = (t) => {
      const B = ballAt(t), a = palm(t), c = curl(t), th = rad(pad(t));
      const d0 = dir(a), d1 = dir(a - 0.4 * c), d2 = dir(a - c);
      return [B[0] + (R + 0.011) * Math.sin(th) - 0.04 * d2[0] - 0.045 * d1[0] - 0.085 * d0[0], B[1] + (R + 0.011) * Math.cos(th) - 0.04 * d2[1] - 0.045 * d1[1] - 0.085 * d0[1]];
    };
    // 手をはなれてから うけるまで：はなれたときの勢いのまま 下へのびて、うける場所へ もどる
    const h = 0.004, wR = wristOn(tR), wC = wristOn(tC), wR0 = wristOn(tR - h), wC1 = wristOn(tC + h);
    const kR = 0.7, kC = 0.4; // はなれたあとは 少しゆるめ、うける前は 少し上がりはじめる
    const vR = [((wR[0] - wR0[0]) / h) * kR, ((wR[1] - wR0[1]) / h) * kR], vC = [((wC1[0] - wC[0]) / h) * kC, ((wC1[1] - wC[1]) / h) * kC];
    const wristAt = (t0) => {
      const t = wrap(t0);
      if (t <= tR || t >= tC) return wristOn(t);
      const s = (t - tR) / (tC - tR);
      return [herm(wR[0], vR[0], wC[0], vC[0], tC - tR, s), herm(wR[1], vR[1], wC[1], vC[1], tC - tR, s)];
    };
    const poseAt = (t) => {
      const sway = Math.cos((2 * Math.PI * (t - (tR + 0.03))) / T); // 1：押しきったとき
      const lean = LEAN + 1.4 * sway;
      return {
        hip: [-0.004 * sway, HIP + 0.5 * (Math.cos(rad(LEAN)) - Math.cos(rad(lean)))], lean, nod: NOD - 1.4 * sway,
        rf: [0.12, 0], lf: [-0.16, 0], rh: wristAt(t), rw: palm(t), rc: curl(t), rs: [0.014 * reach(t), 0.006 - 0.03 * reach(t)], lh: [0.43 - 0.006 * sway, 0.955 + 0.012 * sway], lw: -6 + 3 * sway, lc: 52,
      };
    };
    // 細かいキー（直線でつなぐ）。床につく瞬間・はなれる瞬間・うける瞬間は かならず入れる
    const N = 44, times = [];
    for (let i = 0; i < N; i++) times.push((T * i) / N);
    for (const e of [tR, tB - 0.012, tB, tB + 0.012, tC]) if (!times.some((x) => Math.abs(x - e) < 0.002)) times.push(e);
    times.sort((a, b) => a - b);
    times.push(T);
    const r4 = (n) => Math.round(n * 1e4) / 1e4;
    const keys = times.map((t) => { const p = poseAt(t === T ? 0 : t); return Object.assign({ at: r4(t / T), lin: true }, p); });
    const ball = times.map((t) => {
      const p = ballAt(t === T ? 0 : t), air = t > tR && t < tC;
      return { at: r4(t / T), p, rot: r4((180 * t) / T), sq: Math.abs(t - tB) < 1e-9 ? 0.1 : 0, f: 'r', w: air ? Math.max(0, Math.min(1, (p[1] - R) / (yRel - R))) : 1 };
    });
    return { T, tR, tB, tC, keys, ball, low: Object.assign({}, poseAt(0)) };
  })();

  BC.motion({ id: 'pound',
    name: '低いドリブル（ポンド）', view: 'side', box: [-0.75, 1.05, -0.05, 1.85], dur: Math.round(pound.T * 100) / 100, guides: ['head'],
    phases: [{ at: 0, label: '押す' }, { at: Math.round((pound.tR / pound.T) * 100) / 100, label: '床へ' }, { at: Math.round(((pound.tB + 0.015) / pound.T) * 100) / 100, label: '手にもどる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.2 } }, { id: 'look', label: 'ボールを見る', mods: { nod: 38 } }],
    still: 0.1,
    actors: [{ keys: pound.keys }],
    balls: [{ keys: pound.ball }],
    points: ['腰を落とす（おしりを少しうしろへ）', '頭の高さを変えない・顔を上げる', '指の腹で、床へ強く押しこむ'],
  });

  // 前から：腰を落とした構え
  const FLOW = BC.mo.FLOW;
  /* クロスオーバー（前から）：低いドリブルと同じように、ボールの動きを式から作る（BC.mo.crossCycle。レッグスルーも使う）。
     半分の流れ（秒）：0 右手の中（ひざの外・いちばん上）→（内へ押す）→ tR はなれる →（落ちる）→ tB 体のまん中の床 →（はね返る）→ tC 左手でうける →（外へ流して吸収）→ Th
     うしろ半分は 左右を入れかえた同じ動き。
     ・ボール：手の中は なめらかに加速、空中は 重力で落ちて はね返る（係数 E。横の速さは 床で少し落ちる）。ひざより下を、速く通る
     ・手：ボールの外がわ・上にのる。押したあとは 内へ少しついていき、もう片方の手は 外がわで待つ
     ・体：ボールのある側へ 体重と上体が少し寄る。頭は まっすぐのまま。上体は前へたおしている（tk：胴が短く見える）
     o（なくてよい）：HIP 腰の高さ・TK・FEET 足の x・X0 手の中のボールの x・yTop・xRel／yRel はなす所・xB 床の x・vy0 はなす速さ・
       tauP 押す時間・tauA うける時間・hold・F／Gd 押したあと・待つときの手首・dip 腰のしずみ・sway 腰のゆれ・behind 床のあとは 体のうしろ（脚の間を通す） */
  BC.mo.crossCycle = function (o = {}) {
    const G = 9.8, R = 0.12, E = 0.8, HIP = o.HIP || 0.66, TK = o.TK || 0.84, FEET = o.FEET || 0.33;
    const X0 = o.X0 || 0.36, yTop = o.yTop || 0.47, xRel = o.xRel || 0.27, yRel = o.yRel || 0.385, xB = o.xB != null ? o.xB : -0.02, vy0 = o.vy0 || 2.2;
    const tauP = o.tauP || 0.16, tauA = o.tauA || 0.22, hold = o.hold != null ? o.hold : 0.06;
    const vImp = Math.sqrt(vy0 * vy0 + 2 * G * (yRel - R)), tDown = (vImp - vy0) / G, vB = E * vImp;
    const vCat = Math.sqrt(vB * vB - 2 * G * (yRel - R)), tUp = (vB - vCat) / G;
    const vx1 = (xB - xRel) / tDown, vx2 = vx1 * 0.72, xCat = xB + vx2 * tUp;
    const tR = tauP, tB = tR + tDown, tC = tB + tUp, Th = tC + tauA + hold, T = 2 * Th;
    const herm = BC.mo.herm;
    const wrap = (t) => ((t % T) + T) % T;
    const ease = (u) => u * u * (3 - 2 * u);
    // 前半（右 → 左）のボール
    const half = (t) => {
      if (t < tR) { const s = t / tauP; return [herm(X0, 0, xRel, vx1, tauP, s), herm(yTop, 0, yRel, -vy0, tauP, s)]; }
      if (t < tB) { const q = t - tR; return [xRel + vx1 * q, yRel - vy0 * q - 0.5 * G * q * q]; }
      if (t < tC) { const q = t - tB; return [xB + vx2 * q, R + vB * q - 0.5 * G * q * q]; }
      if (t < tC + tauA) { const s = (t - tC) / tauA; return [herm(xCat, vx2, -X0, 0, tauA, s), herm(yRel, vCat, yTop, 0, tauA, s)]; }
      return [-X0, yTop];
    };
    const ballAt = (t0) => { const t = wrap(t0); if (t < Th) return half(t); const b = half(t - Th); return [-b[0], b[1]]; };
    // 右手（画面の右）の手首。ボールにのっているとき：ボールの外がわ・上（押す・うけるときほど 外がわへ回る）
    const onBall = (t, u) => { const b = ballAt(t); return [b[0] + 0.04 + 0.04 * u, b[1] + 0.14 - 0.012 * u]; };
    const tC2 = Th + tC, h = 0.004;
    const wRel = onBall(tR, 1), wCat = onBall(tC2, 1), w0 = onBall(tR - h, 1), w1 = onBall(tC2 + h, 1);
    const vRel = [(wRel[0] - w0[0]) / h, (wRel[1] - w0[1]) / h], vCat2 = [(w1[0] - wCat[0]) / h, (w1[1] - wCat[1]) / h];
    const F = o.F || [0.215, 0.515], Gd = o.Gd || [0.43, 0.64], tF = tR + 0.13, tG = tC2 - 0.2;
    const right = (t0) => {
      const t = wrap(t0);
      if (t <= tR) return onBall(t, ease(t / tauP));                                   // 押す
      if (t >= tC2) return onBall(t, 1 - ease(Math.min(1, (t - tC2) / tauA)));          // うける → 上へ
      if (t < tF) { const s = (t - tR) / (tF - tR); return [herm(wRel[0], vRel[0] * 0.5, F[0], 0, tF - tR, s), herm(wRel[1], vRel[1] * 0.5, F[1], 0, tF - tR, s)]; } // 内へ ついていく
      if (t < tG) { const s = ease((t - tF) / (tG - tF)); return [F[0] + (Gd[0] - F[0]) * s, F[1] + (Gd[1] - F[1]) * s]; }                                             // 外がわで 守る・待つ
      const s = (t - tG) / (tC2 - tG);
      return [herm(Gd[0], 0, wCat[0], vCat2[0] * 0.35, tC2 - tG, s), herm(Gd[1], 0, wCat[1], vCat2[1] * 0.35, tC2 - tG, s)];
    };
    const left = (t) => { const w = right(t + Th); return [-w[0], w[1]]; };
    const dipK = o.dip != null ? o.dip : 0.005, swayK = o.sway != null ? o.sway : 0.04;
    const poseAt = (t) => {
      const sway = Math.cos((2 * Math.PI * (t - 0.04)) / T);                            // 1：ボールが右
      const dip = (1 + Math.cos((4 * Math.PI * (t - tR)) / T)) / 2;                     // 1：押しきったとき
      const lean = 3.5 * sway;
      return { hip: [swayK * sway, HIP - dipK * dip], lean, nod: -0.85 * lean, tk: TK, rf: [FEET, 0], lf: [-FEET, 0], rh: right(t), lh: left(t) };
    };
    const N = 72, times = [];
    for (let i = 0; i < N; i++) times.push((T * i) / N);
    for (const e of [tR, tB - 0.012, tB, tB + 0.012, tC, Th, Th + tR, Th + tB - 0.012, Th + tB, Th + tB + 0.012, tC2]) if (!times.some((x) => Math.abs(x - e) < 0.002)) times.push(e);
    times.sort((a, b) => a - b);
    times.push(T);
    const r4 = (n) => Math.round(n * 1e4) / 1e4;
    const keys = times.map((t) => Object.assign({ at: r4(t / T), lin: true }, poseAt(t === T ? 0 : t)));
    const ball = times.map((t) => {
      const tt = t === T ? 0 : t, p = ballAt(tt), q = tt < Th ? tt : tt - Th, firstHalf = tt < Th;
      const air = q > tR && q < tC, bounce = Math.abs(q - tB) < 1e-9;
      // 手のずれに ついていく手：押した手（床まで）→ うける手（床から）
      const pusher = firstHalf ? 'r' : 'l', catcher = firstHalf ? 'l' : 'r';
      const k = { at: r4(t / T), p, rot: r4(150 * p[0]), sq: bounce ? 0.1 : 0, f: q < tB ? pusher : catcher, w: air ? Math.max(0, Math.min(1, (p[1] - R) / (yRel - R))) : 1 };
      if (o.behind && q >= tB && q < tC + tauA * 0.55) k.bk = 1; // 床で はねたあと、うける手に入るまでは 体のうしろ
      return k;
    });
    return { T, Th, tR, tB, tC, tC2, keys, ball };
  };
  const cross = BC.mo.crossCycle();

  BC.motion({ id: 'crossover',
    name: 'クロスオーバー', view: 'front', box: [-0.95, 0.95, -0.05, 1.8], dur: Math.round(cross.T * 100) / 100, guides: ['head'],
    phases: [{ at: 0, label: '右手で押す' }, { at: Math.round((cross.tR / cross.T) * 100) / 100, label: '低く前を通す' }, { at: Math.round((cross.tC / cross.T) * 100) / 100, label: '左手でうける' },
      { at: Math.round(((cross.Th + cross.tR) / cross.T) * 100) / 100, label: '低く前を通す' }, { at: Math.round((cross.tC2 / cross.T) * 100) / 100, label: '右手でうける' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17 } }],
    still: 0.05,
    actors: [{ keys: cross.keys }],
    balls: [{ keys: cross.ball }],
    points: ['ひざより下の低さで、体の前を速く通す', '顔は上げたまま（ボールを見ない）', '受けた手の反対の腕で、ボールを守る'],
  });

  /* 2ボール・ドリブル（前から）：低いドリブルと同じ物理で、左右のボールを同時につく。
     手はボールの上（指を広げて）。押したあとも 手は少し下へのび、うける前に 上がりはじめる。腰は 押すときに わずかに沈み、頭の高さは変えない */
  const twob = (function () {
    const G = BC.mo.G, R = 0.12, E = 0.8, HIP = 0.645, TK = 0.82, XB = 0.44;
    const yTop = 0.5, yRel = 0.39, yCat = 0.43, vRel = 2.45, tauP = 0.14, tauA = 0.18;
    const vImp = Math.sqrt(vRel * vRel + 2 * G * (yRel - R)), tDown = (vImp - vRel) / G, vB = E * vImp;
    const vCat = Math.sqrt(vB * vB - 2 * G * (yCat - R)), tUp = (vB - vCat) / G;
    const tR = tauP, tB = tR + tDown, tC = tB + tUp, T = tC + tauA;
    const herm = BC.mo.herm, wrap = (t) => ((t % T) + T) % T;
    const ballY = (t0) => {
      const t = wrap(t0);
      if (t < tR) return herm(yTop, 0, yRel, -vRel, tauP, t / tauP);
      if (t < tB) { const q = t - tR; return yRel - vRel * q - 0.5 * G * q * q; }
      if (t < tC) { const q = t - tB; return R + vB * q - 0.5 * G * q * q; }
      return herm(yCat, vCat, yTop, 0, tauA, (t - tC) / tauA);
    };
    const on = (t) => ballY(t) + 0.15, h = 0.004; // 手首：ボールの上
    const yR = on(tR), yC = on(tC), vR = ((on(tR) - on(tR - h)) / h) * 0.55, vC = ((on(tC + h) - on(tC)) / h) * 0.4;
    const wristY = (t0) => { const t = wrap(t0); return t <= tR || t >= tC ? on(t) : herm(yR, vR, yC, vC, tC - tR, (t - tR) / (tC - tR)); };
    const pose = (t) => {
      const dip = (1 + Math.cos((2 * Math.PI * (t - tR - 0.03)) / T)) / 2, y = wristY(t);
      return { hip: [0, HIP - 0.006 * dip], lean: 0, nod: 0, tk: TK, rf: [0.34, 0], lf: [-0.34, 0], rh: [XB + 0.03, y], lh: [-XB - 0.03, y] };
    };
    const ball = (o) => (t) => {
      const tt = wrap(t), y = ballY(t), air = tt > tR && tt < tC;
      return { p: [o * XB, y], sq: Math.abs(tt - tB) < 0.001 ? 0.1 : 0, f: o > 0 ? 'r' : 'l', w: air ? Math.max(0, Math.min(1, (y - R) / (yRel - R))) : 1 };
    };
    const b = BC.mo.bake(T, { actors: [pose], balls: [ball(1), ball(-1)], extra: [tR, tB - 0.012, tB, tB + 0.012, tC], fps: 80 });
    return { T, tR, tB, tC, b };
  })();
  BC.motion({ id: 'twoball',
    name: '2ボール・ドリブル', view: 'front', box: [-0.95, 0.95, -0.05, 1.8], dur: Math.round(twob.T * 100) / 100, guides: ['head'],
    phases: [{ at: 0, label: '同時に押す' }, { at: Math.round((twob.tR / twob.T) * 100) / 100, label: '床へ' }, { at: Math.round(((twob.tB + 0.015) / twob.T) * 100) / 100, label: '手にもどる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17 } }],
    still: 0.1,
    actors: [{ keys: twob.b.actors[0] }],
    balls: twob.b.balls.map((keys) => ({ keys })),
    points: ['左右を同じ高さ・同じ強さで', '弱い手のリズムに合わせる', '顔を上げて、前を見る'],
  });



  BC.motion({ id: 'speed',
    name: 'スピードドリブル', view: 'side', box: [-1.0, 1.4, -0.05, 1.9], dur: 0.9,
    phases: [{ at: 0, label: '前へ押し出す' }, { at: 0.5, label: '走って追いつく' }],
    mistakes: [{ id: 'look', label: 'ボールを見る', mods: { nod: 40 } }],
    still: 0.25,
    scroll: [{ at: 0, v: 0 }, { at: 1, v: 1.6 }],
    actors: [{ keys: BC.mo.runKeys(0, 1, { h: 0.88, lean: 18, arms: (u) => ({ rh: [0.52, 0.98 - 0.16 * Math.sin(u * Math.PI * 2)], lh: u < 0.5 ? [-0.1 + 0.4 * u, 0.9] : [0.3 - 0.4 * (u - 0.5), 1.05] }) }) }],
    balls: [{ keys: [{ at: 0, h: 'r', o: [0.05, -0.12] }, { at: 0.12, h: 'r', o: [0.08, -0.12] }, { at: 0.5, p: [0.95, 0.12] }, { at: 1, h: 'r', o: [0.05, -0.12] }] }],
    points: ['ボールを前へ押し出して、走りながら追いつく', 'つく回数を少なく（3〜4歩で1回）', '顔を上げて、前の空いている所を見る'],
  });

  // ディフェンスのスライド（前から・守り）。右へ3回・左へ3回
  /* ディフェンスのスライド（前から）：出す足 → 寄せる足。1歩 0.5秒・右へ3歩 → 左へ3歩（3秒でもとの場所）。
     うしろの足で床を押して、出す足を 低く・すべるように 大きく出す。腰は 止まらずに 横へ流れ（BC.mo.track）、頭の高さは 変えない。
     出す方の手を上（パスのコース）、反対の手を下（ドリブルのコース）。上体は少し前へたおす（tk） */
  function slideKeys() {
    const T = 3.0, H = 0.66, W = 0.3, STEP = 0.26, K = [];
    let x = -0.39;
    const arms = (hx, dir) => ({ rh: [hx + 0.56, dir > 0 ? 1.05 : 0.72], lh: [hx - 0.56, dir > 0 ? 0.72 : 1.05] });
    [1, 1, 1, -1, -1, -1].forEach((dir, i) => {
      const t0 = i * 0.5, nx = x + dir * STEP, lead = dir > 0 ? 'rf' : 'lf', trail = dir > 0 ? 'lf' : 'rf';
      const key = (t, hx, lean, o) => Object.assign({ at: t / T, hip: [hx, H], lean, nod: -0.8 * lean, tk: 0.92 }, arms(hx, dir), o);
      K.push(key(t0, x, 0, { [lead]: [x + dir * W, 0], [trail]: [x - dir * W, 0] }));
      K.push(key(t0 + 0.07, x + dir * 0.03, dir * 1.5, { [lead]: [x + dir * (W + 0.1), 0.035] }));   // 出す足を 低く出す
      K.push(key(t0 + 0.17, x + dir * 0.11, dir * 2.5, { [lead]: [x + dir * (W + STEP), 0] }));      // 出す足が つく（足が広い）
      K.push(key(t0 + 0.31, x + dir * 0.2, dir * 1.5, { [trail]: [x - dir * W + dir * 0.14, 0.025] })); // うしろの足を 寄せる
      K.push(key(t0 + 0.43, x + dir * 0.245, 0.3 * dir, { [trail]: [nx - dir * W, 0] }));
      x = nx;
    });
    K.push(Object.assign({}, K[0], { at: 1 }));
    const tr = BC.mo.track(K, true);
    return BC.mo.bake(T, { actors: [(t) => tr(t / T)], fps: 40 }).actors[0];
  }

  BC.motion({ id: 'defslide',
    name: 'ディフェンスのスライド', view: 'front', box: [-1.4, 1.4, -0.05, 1.85], dur: 3.0, guides: ['head'],
    phases: [{ at: 0, label: '右へスライド' }, { at: 0.5, label: '左へスライド' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.18, hands: true } }, { id: 'bob', label: '頭が上下にはねる', mods: { bob: 0.11, freq: 6 } }],
    still: 0.1,
    actors: [{ role: 'x', keys: slideKeys() }],
    balls: [],
    points: ['足を交差させない（出す足→寄せる足）', '頭の高さを変えない（上下にはねない）', '手を広げて、パスとドリブルのコースを消す'],
  });



  // クローズアウト（横から・守りは右向き、シューターは左向き）
  (function () {
    const run = BC.mo.steps(0.08, 0.42, { r: -1.75, l: -1.95 }, [['r', -1.35], ['l', -0.95], ['r', -0.6]], { h: 0.9, lean: 16, ahead: 0.1,
      arms: (f, i) => (i % 2 < 1 ? { rh: [f.r - 0.05, 0.9], lh: [f.l + 0.45, 1.1] } : { rh: [f.r + 0.4, 1.1], lh: [f.l - 0.05, 0.9] }) });
    const chop = BC.mo.steps(0.42, 0.66, run.feet, [['l', -0.55], ['r', -0.42], ['l', -0.44], ['r', -0.32]], { h: 0.74, lean: 22, ahead: 0.06, lift: 0.05,
      arms: (f) => ({ rh: [f.r + 0.25, 1.75], lh: [f.l + 0.5, 0.7] }) });
    const last = { at: 0.72, hip: [-0.36, 0.7], lean: 18, rf: [-0.24, 0], lf: [-0.52, 0], rh: [-0.06, 2.0], lh: [-0.02, 0.72] };
    BC.motion({ id: 'closeout',
      name: 'クローズアウト', view: 'side', box: [-2.3, 1.1, -0.05, 2.2], dur: 2.4, fade: true,
      phases: [{ at: 0, label: 'まつ' }, { at: 0.08, label: '全力で走る' }, { at: 0.42, label: '小さく速いステップ' }, { at: 0.68, label: '手を上げて止まる' }],
        still: 0.72,
      actors: [
        { role: 'x', keys: [{ at: 0, hip: [-1.77, 0.78], lean: 22, nod: -15, rf: [-1.65, 0], lf: [-1.95, 0], rh: [-1.5, 1.0], lh: [-1.55, 0.95] }, ...run.keys.slice(1), ...chop.keys.slice(1), last, { at: 1 }] },
        { role: 'o', face: -1, keys: [{ at: 0, hip: [0.62, 0.86], lean: 6, nod: 0, rf: [0.52, 0], lf: [0.72, 0], rh: [0.36, 1.2], lh: [0.42, 1.18] }, { at: 0.5, hip: [0.62, 0.84] }, { at: 1, hip: [0.62, 0.86] }] },
      ],
      balls: [{ keys: [{ at: 0, a: 1, h: 'both', o: [-0.06, 0] }, { at: 1, a: 1, h: 'both', o: [-0.06, 0] }] }],
      points: ['最初は全力で走り、最後の数歩は小さく速く（チョップステップ）', '腰を落として止まり、シューターに手を上げる', '近づきすぎない（腕1本の間合い）'],
    });
  })();

  // シュート（横から・右にゴール）
  const HOOP = 2.15; // リングの中心の x（近くからのフォームシューティングの距離）
  BC.motion({ id: 'shoot',
    name: 'シュート（ジャンプシュート）', view: 'side', box: [-1.35, 2.75, -0.05, 4.05], dur: 2.6, fade: true, hoop: HOOP,
    phases: [{ at: 0, label: 'かまえ' }, { at: 0.12, label: 'しずむ' }, { at: 0.26, label: 'セット' }, { at: 0.36, label: 'のびて放す' }, { at: 0.48, label: 'フォロースルー' }],
    mistakes: [{ id: 'stiff', label: 'ひざを使わない', mods: { stiff: true } }],
    still: 0.42,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 6, nod: -6, rf: [0.1, 0], lf: [-0.1, 0], rh: [0.3, 1.08], lh: [0.24, 1.12] },
      { at: 0.18, hip: [0, 0.76], lean: 14, rh: [0.34, 1.0], lh: [0.27, 1.04] },
      { at: 0.25, hip: [0, 0.84], lean: 9, rh: [0.44, 1.42], lh: [0.37, 1.44] }, // ボールを体の前で持ち上げる（ひじは L字のまま）
      { at: 0.32, hip: [0, 0.92], lean: 4, rh: [0.2, 1.78], lh: [0.12, 1.74] },
      { at: 0.42, hip: [0, 1.0], lean: 2, rf: [0.1, 0.08], lf: [-0.1, 0.08], rh: [0.32, 2.14], lh: [0.16, 1.82] },
      { at: 0.55, hip: [0, 0.94], rf: [0.1, 0], lf: [-0.1, 0], rh: [0.36, 2.1], lh: [0.18, 1.75] },
      { at: 0.86, hip: [0, 0.9] },
      { at: 1, hip: [0, 0.9], lean: 6, rh: [0.3, 1.08], lh: [0.24, 1.12] },
    ] }],
    balls: [{ keys: [
      { at: 0, h: 'both', o: [0.06, 0.02] }, { at: 0.18, h: 'both', o: [0.06, 0.02] },
      { at: 0.25, h: 'r', o: [-0.02, 0.12] }, { at: 0.32, h: 'r', o: [0.02, 0.13] }, { at: 0.42, h: 'r', o: [0.04, 0.13] },
      { at: 0.78, p: [HOOP, 3.18], arc: 0.75 }, { at: 0.86, p: [HOOP, 2.62] }, { at: 0.96, p: [HOOP - 0.1, 0.12] }, { at: 1, p: [HOOP - 0.1, 0.12] },
    ] }],
    points: ['ひざを曲げて、のばす力で打つ（腕だけで打たない）', '肘はリングへ、足・ひざ・肘・手首が1本の線', 'リリースのあと、手首をたおしたまま（フォロースルー）'],
  });

  // レイアップ（横から・右にゴール）
  (function () {
    const R = 1.0; // 右のゴールに近づく（リングの中心は R + 0.15）
    BC.motion({ id: 'layup',
      name: 'レイアップ（ランニングシュート）', view: 'side', box: [-2.9, 1.55, -0.05, 4.2], dur: 2.6, fade: true, hoop: R + 0.15,
      phases: [{ at: 0, label: 'ドリブル' }, { at: 0.14, label: '1歩目（右）' }, { at: 0.3, label: '2歩目（左）' }, { at: 0.42, label: '上へとぶ' }, { at: 0.6, label: 'ボードへ' }, { at: 0.74, label: '着地' }],
        still: 0.56,
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
        { at: 0.68, p: [R + 0.41, 3.45], arc: 0.25 }, { at: 0.76, p: [R + 0.15, 3.12] }, { at: 0.84, p: [R + 0.15, 2.6] },
        { at: 0.96, p: [R + 0.05, 0.12] }, { at: 1, p: [R + 0.05, 0.12] },
      ] }],
      points: ['右手で打つときは「右・左」で踏み切り（左足でジャンプ）', '右ひざを高く上げて、上へ跳ぶ（前へ流れない）', 'ボードの四角の上の角をねらう'],
    });
  })();

  // チェストパス（横から・パスの人は右向き、受け手は左向き）
  BC.motion({ id: 'chestpass',
    name: 'チェストパス', view: 'side', box: [-0.8, 3.6, -0.05, 2.0], dur: 1.8, fade: true,
    phases: [{ at: 0, label: 'かまえ' }, { at: 0.12, label: 'ふみ出す' }, { at: 0.28, label: '押し出す' }, { at: 0.45, label: 'とどく' }],
    still: 0.32,
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
  });

  // ジャンプストップ（その場で走って、両足で止まる）
  BC.motion({ id: 'jumpstop',
    name: 'ジャンプストップ', view: 'side', box: [-1.1, 1.3, -0.05, 1.9], dur: 2.2, fade: true,
    phases: [{ at: 0, label: '走る' }, { at: 0.44, label: '小さくとぶ' }, { at: 0.56, label: '両足で止まる' }],
    mistakes: [{ id: 'tall', label: '止まるとき腰が高い', mods: { stiffAfter: 0.54 } }],
    still: 0.62,
    scroll: [{ at: 0, v: 0 }, { at: 0.44, v: 1.6 }, { at: 0.56, v: 2.1 }, { at: 1, v: 2.1 }],
    actors: [{ keys: [
      ...BC.mo.runKeys(0, 0.44, { h: 0.9, lean: 12, arms: () => ({ rh: [0.3, 1.05], lh: [0.24, 1.08] }) }),
      { at: 0.5, hip: [0, 1.04], lean: 8, rf: [0.12, 0.2], lf: [-0.12, 0.22], lin: false },
      { at: 0.58, hip: [0, 0.7], lean: 26, nod: -20, rf: [0.16, 0], lf: [-0.16, 0] },
      { at: 0.9 },
      { at: 1 },
    ] }],
    balls: [{ keys: [{ at: 0, h: 'both', o: [0.06, 0] }, { at: 1, h: 'both', o: [0.06, 0] }] }],
    points: ['両足で同時に着地する（どちらの足も軸足にできる）', '着地はひざを曲げて、低く止まる', 'ボールはあごの前で、ひじを張って守る'],
  });

  // ボックスアウト（横から・守りは右のゴールを向いて、うしろの相手に当たる）
  BC.motion({ id: 'boxout',
    name: 'ボックスアウト', view: 'side', box: [-1.0, 3.3, -0.05, 4.2], dur: 2.8, fade: true, hoop: 2.75,
    phases: [{ at: 0, label: 'シュートを見る' }, { at: 0.1, label: '相手に当たる' }, { at: 0.6, label: 'とぶ' }, { at: 0.74, label: '両手でとる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.2, hands: true } }],
    still: 0.4,
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
  });

  // 着地（ケガ予防）
  BC.motion({ id: 'landing',
    name: '着地（やわらかく止まる）', view: 'side', box: [-0.9, 1.1, -0.05, 2.6], dur: 2.0,
    phases: [{ at: 0, label: '立つ' }, { at: 0.1, label: 'しずむ' }, { at: 0.26, label: 'とぶ' }, { at: 0.48, label: 'ひざで吸収' }],
    mistakes: [{ id: 'stiff', label: 'ひざで吸収しない', mods: { stiffAfter: 0.5 } }],
    still: 0.6,
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
  });

  // 着地（前から）：ひざがつま先と同じ向きか（ニーイン）を見せる
  /* 着地（前から：ひざの向き）：立つ → 腕を下へふって しずむ → 腕をふり上げ、つま先で床を押して とぶ → 空中は 重力どおり（ひざを少したたむ）→
     つま先から着地して、ひざと股関節で吸収する（上体は 前へ少したおす・腕は 前でバランス）→ 止まる → 立つ */
  const landF = (function () {
    const T = 2.0, G = BC.mo.G, tA = 0.27, tB = 0.5, H0 = 0.97;
    const K = [
      { at: 0, hip: [0, 0.9], lean: 0, nod: 0, tk: 1, rf: [0.15, 0], lf: [-0.15, 0], rh: [0.3, 0.86], lh: [-0.3, 0.86] },
      { at: 0.09 },
      { at: 0.17, hip: [0, 0.71], tk: 0.9, rh: [0.37, 0.68], lh: [-0.37, 0.68] },
      { at: 0.235, hip: [0, 0.88], tk: 0.97, rh: [0.31, 1.45], lh: [-0.31, 1.45] },
      { at: tA, hip: [0, H0], tk: 1, rf: [0.14, 0.04], lf: [-0.14, 0.04], rh: [0.28, 2.0], lh: [-0.28, 2.0] },
      { at: 0.37, rh: [0.27, 2.08], lh: [-0.27, 2.08] },
      { at: 0.46, rh: [0.33, 1.45], lh: [-0.33, 1.45] },
      { at: tB, hip: [0, H0], rf: [0.16, 0], lf: [-0.16, 0], rh: [0.34, 1.2], lh: [-0.34, 1.2] },
      { at: 0.585, hip: [0, 0.66], tk: 0.88, rh: [0.27, 0.96], lh: [-0.27, 0.96] },
      { at: 0.65, hip: [0, 0.68] },
      { at: 0.82, hip: [0, 0.68] },
      { at: 1, hip: [0, 0.9], tk: 1, rf: [0.15, 0], lf: [-0.15, 0], rh: [0.3, 0.86], lh: [-0.3, 0.86] },
    ];
    const tr = BC.mo.track(K, true), D = (tB - tA) * T, v = (G * D) / 2;
    const pose = (t) => {
      const at = t / T, p = tr(at);
      if (at > tA && at < tB) { // 空中：腰は 重力どおり。足は 腰についていき、少したたむ
        const s = (at - tA) / (tB - tA), q = at * T - tA * T, y = H0 + v * q - (G * q * q) / 2;
        const fy = y - H0 + 0.04 * (1 - s) + 0.08 * Math.sin(Math.PI * s);
        p.hip = [p.hip[0], y]; p.rf = [p.rf[0], fy]; p.lf = [p.lf[0], fy];
      }
      return p;
    };
    return BC.mo.bake(T, { actors: [pose], extra: [tA * T, tB * T], fps: 40 }).actors[0];
  })();
  BC.motion({ id: 'landing-front',
    name: '着地（前から：ひざの向き）', view: 'front', box: [-1.0, 1.0, -0.05, 2.6], dur: 2.0,
    phases: [{ at: 0, label: '立つ' }, { at: 0.1, label: 'しずむ' }, { at: 0.25, label: 'とぶ' }, { at: 0.5, label: 'ひざで吸収' }],
    mistakes: [{ id: 'kneein', label: 'ひざが内に入る', mods: { kneeIn: 0.48 } }, { id: 'stiff', label: 'ひざで吸収しない', mods: { stiffAfter: 0.5 } }],
    still: 0.62,
    actors: [{ keys: landF }],
    balls: [],
    points: ['ひざは つま先と同じ向き（内側に入れない）', '両足に 同じように体重をのせる', 'つま先から着地して、ひざと股関節で吸収する'],
  });

  // ランジ（ダイナミック・ウォームアップ）
  BC.motion({ id: 'lunge',
    name: 'ランジ（動きながらのストレッチ）', view: 'side', box: [-1.0, 1.3, -0.05, 2.3], dur: 3.6,
    phases: [{ at: 0, label: '立つ' }, { at: 0.08, label: '右足を前へ' }, { at: 0.4, label: 'もどる' }, { at: 0.58, label: '左足を前へ' }, { at: 0.9, label: 'もどる' }],
    still: 0.3,
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
  });

  // トリプルスレット（構え → ジャブステップ → ショットフェイク）
  BC.motion({ id: 'stance',
    name: 'トリプルスレット（ジャブ・ショットフェイク）', view: 'side', box: [-0.9, 1.3, -0.05, 2.0], dur: 2.0,
    phases: [{ at: 0, label: 'かまえ' }, { at: 0.08, label: 'ジャブステップ' }, { at: 0.3, label: 'もどる' }, { at: 0.58, label: 'ショットフェイク' }, { at: 0.8, label: 'もどる' }],
    mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.18, hands: true } }],
    still: 0.04,
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
  });


  BC.motionLink({
    'd-wallpass': 'chestpass',
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
    'v-body-injury': 'landing-front',
  });
})();
