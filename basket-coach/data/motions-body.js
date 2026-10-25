/* 動きのデータ（からだ・守り・フットワーク・ストレッチ・こころ）。書き方は js/motion.js の先頭。 */
(function () {
  const BC = window.BC;
  if (!BC || !BC.motion || !BC.mo) return; // 動きのしくみ（js/motion.js）を読みこんでいないとき（データだけの検査など）は何もしない

  /* ---------- 道具 ---------- */
  const X = ['hip', 'rf', 'lf', 'rh', 'lh'];
  // キーの x を変える（f：x → 新しい x）
  const mapX = (k, f) => { const o = Object.assign({}, k); for (const p of X) if (o[p]) o[p] = [f(o[p][0]), o[p][1]]; return o; };
  const mirror = (k) => mapX(k, (x) => -x); // 右向き（face 1）で作ったキーを、左向き（face -1）の人に
  // 画面の外へ（2人で1人を見せるとき、出ていない方を置く。上へも外すのは、角度の目印・影を出さないため）
  const hide = (k) => { const o = Object.assign({}, k); for (const p of X) if (o[p]) o[p] = [o[p][0] + 40, o[p][1] + 50]; return o; };
  // 小さく足ぶみ（その場で、左右交互に足を少し上げる）
  function taps(t0, t1, n, feet, lift) {
    const k = [], dt = (t1 - t0) / n;
    for (let i = 0; i < n; i++) {
      const s = i % 2 ? 'l' : 'r', x = feet[s];
      k.push({ at: t0 + dt * (i + 0.5), [s + 'f']: [x, lift] });
      k.push({ at: t0 + dt * (i + 1), [s + 'f']: [x, 0] });
    }
    return k;
  }

  /* ---------- ディフェンスの構え（横から） ---------- */
  (function () {
    const feet = { r: 0.14, l: -0.2 };
    const base = { hip: [-0.02, 0.66], lean: 26, nod: -14, rf: [feet.r, 0], lf: [feet.l, 0], rh: [0.62, 1.04], lh: [0.48, 0.76] };
    BC.motion({ id: 'def-stance',
      name: 'ディフェンスの構え', view: 'side', box: [-0.9, 1.1, -0.05, 1.85], dur: 2.4, guides: ['head'],
      phases: [{ at: 0, label: '腰を落として構える' }, { at: 0.25, label: '小さく足ぶみ' }, { at: 0.86, label: 'いつでも動ける' }],
      mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.18, hands: true } }, { id: 'look', label: '下を見る', mods: { nod: 32 } }],
      still: 0.2,
      actors: [{ role: 'x', keys: [
        Object.assign({ at: 0 }, base),
        { at: 0.25 },
        ...taps(0.25, 0.85, 10, feet, 0.05),
        { at: 1 },
      ] }],
      points: ['足は肩幅より広く、ひざと股関節を曲げて腰を落とす', '体重は足の親指のつけ根に。小さく速く足を動かす', '頭の高さを変えず、相手のおへそを見る'],
    });
  })();

  /* ---------- 下がりながらのスライド（横から・床が流れる） ---------- */
  (function () {
    const H = 0.66, s = 0.25, n = 4;
    const t0 = 0.1, t1 = 0.9, T = (t1 - t0) / n;
    const arms = { rh: [0.6, 1.02], lh: [0.46, 0.76] };
    const k = [{ at: 0, hip: [-0.03, H], lean: 26, nod: -14, rf: [0.16, 0], lf: [-0.24, 0], ...arms, lin: true }, { at: t0 }];
    for (let i = 0; i < n; i++) {
      const b = t0 + T * i;
      // うしろの足を引く（前の足は床といっしょに動く）
      k.push({ at: b + T * 0.25, rf: [0.16 + s / 4, 0], lf: [-0.3, 0.05] });
      k.push({ at: b + T * 0.5, rf: [0.16 + s / 2, 0], lf: [-0.24 - s / 2, 0] });
      // 前の足を引きよせる
      k.push({ at: b + T * 0.75, lf: [-0.24 - s / 4, 0], rf: [0.22, 0.03] });
      k.push({ at: b + T, lf: [-0.24, 0], rf: [0.16, 0] });
    }
    k.push({ at: 1 });
    BC.motion({ id: 'def-backslide',
      name: '下がりながらのスライド', view: 'side', box: [-1.1, 1.1, -0.05, 1.85], dur: 2.6, guides: ['head'],
      phases: [{ at: 0, label: '低く構える' }, { at: t0, label: 'うしろの足から下がる' }, { at: t0 + T / 2, label: '前の足を引きよせる' }],
      mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.18, hands: true } }, { id: 'bob', label: '頭が上下にはねる', mods: { bob: 0.1, freq: 8 } }],
      still: t0 + T * 0.5,
      scroll: [{ at: 0, v: 0 }, { at: t0, v: 0 }, { at: t1, v: -s * n }, { at: 1, v: -s * n }],
      actors: [{ role: 'x', keys: k }],
      points: ['うしろの足から下がり、前の足を引きよせる（足をそろえない）', '頭の高さを変えない（上下にはねない）', '胸と手は相手に向けたまま'],
    });
  })();

  /* ---------- ボールプレッシャー（横から：腕1本の間合い → ドリブルが止まったら詰める） ---------- */
  (function () {
    // 攻め o（左向き）は、右手でドリブル → ボールを持つ → ボールを上・下へ動かす
    const O = { hip: [1.12, 0.8], lean: 14, nod: -4, rf: [1.0, 0], lf: [1.3, 0], rh: [1.04, 0.7], lh: [1.18, 0.98] };
    const D = { hip: [0, 0.68], lean: 22, nod: -8, rf: [0.14, 0], lf: [-0.2, 0], rh: [0.74, 0.8], lh: [0.42, 0.66] };
    const near = { hip: [0.24, 0.74], lean: 14, rf: [0.38, 0], lf: [0.04, 0] }; // 詰めたあと
    const dribble = [];
    for (let i = 0; i < 3; i++) {
      const b = i * 0.13;
      dribble.push({ at: b + 0.05, a: 1, h: 'r', o: [-0.02, -0.13] }, { at: b + 0.1, p: [1.02, 0.12] });
    }
    BC.motion({ id: 'def-pressure',
      name: 'ボールプレッシャー（間合い）', view: 'side', box: [-0.75, 1.8, -0.05, 2.15], dur: 4.2, fade: true,
      phases: [{ at: 0, label: '腕1本の間合い' }, { at: 0.06, label: '手でボールをなぞる' }, { at: 0.42, label: '止まったら詰める' }, { at: 0.58, label: '両手でボールを追う' }],
      mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17, hands: true } }],
      still: 0.24,
      actors: [
        { role: 'x', keys: [
          Object.assign({ at: 0 }, D),
          { at: 0.1, rh: [0.74, 0.74] }, { at: 0.16, rh: [0.74, 0.82] }, { at: 0.23, rh: [0.74, 0.74] }, { at: 0.29, rh: [0.74, 0.82] }, { at: 0.36, rh: [0.74, 0.76] },
          { at: 0.42 },
          { at: 0.46, hip: [0.1, 0.72], lean: 18, rf: [0.32, 0.05], rh: [0.7, 1.1], lh: [0.5, 0.9] },
          Object.assign({ at: 0.52 }, near, { rh: [0.78, 1.3], lh: [0.66, 1.1] }),
          { at: 0.62, rh: [0.84, 1.62], lh: [0.7, 1.42] },
          { at: 0.68 },
          { at: 0.76, rh: [0.8, 0.96], lh: [0.68, 0.88] },
          { at: 0.82 },
          { at: 0.9, rh: [0.78, 1.3], lh: [0.66, 1.1] },
          { at: 1 },
        ] },
        { role: 'o', face: -1, keys: [
          Object.assign({ at: 0 }, O),
          { at: 0.05, rh: [1.04, 0.64] }, { at: 0.1, rh: [1.04, 0.72] }, { at: 0.18, rh: [1.04, 0.64] }, { at: 0.23, rh: [1.04, 0.72] }, { at: 0.31, rh: [1.04, 0.64] }, { at: 0.36, rh: [1.04, 0.72] },
          { at: 0.42, hip: [1.14, 0.84], lean: 10, rh: [1.0, 1.04], lh: [1.06, 1.08] },
          { at: 0.56 },
          { at: 0.64, rh: [1.0, 1.74], lh: [1.06, 1.76] },
          { at: 0.68 },
          { at: 0.78, hip: [1.16, 0.76], lean: 18, rh: [1.02, 0.84], lh: [1.1, 0.86] },
          { at: 0.84 },
          { at: 0.92, hip: [1.14, 0.84], lean: 10, rh: [1.0, 1.04], lh: [1.06, 1.08] },
          { at: 1 },
        ] },
      ],
      balls: [{ keys: [
        { at: 0, a: 1, h: 'r', o: [-0.02, -0.13] }, ...dribble, { at: 0.42, a: 1, h: 'both', o: [-0.06, 0] }, { at: 1, a: 1, h: 'both', o: [-0.06, 0] },
      ] }],
      points: ['間合いは腕1本（近すぎると抜かれ、遠いと楽にパスされる）', 'ドリブルが止まったら「デッド！」と言って詰める', '手でボールをなぞる。体はぶつけない'],
    });
  })();

  /* ---------- ディナイ（前から：守り x と、マーク o。ボールは右から来る） ---------- */
  (function () {
    const H = 0.68;
    // 守り：x の位置で、ボール側（右）の手と足をパスのコースに
    const D = (x, at, o = {}) => Object.assign({ at, hip: [x, H], lean: 0, nod: 0, rf: [x + 0.32, 0], lf: [x - 0.3, 0], rh: [x + 0.72, 1.2], lh: [x - 0.36, 0.98] }, o);
    // 横へ1歩（進む方の足から出して、うしろの足を寄せる）
    const slide = (x0, x1, ta, tb) => {
      const dir = Math.sign(x1 - x0), m = (ta + tb) / 2;
      const wide = dir > 0 ? { rf: [x1 + 0.32, 0.04], lf: [x0 - 0.3, 0] } : { lf: [x1 - 0.3, 0.04], rf: [x0 + 0.32, 0] };
      return [Object.assign(D(x0 + (x1 - x0) * 0.45, m), wide, { hip: [x0 + (x1 - x0) * 0.45, H - 0.01] }), D(x1, tb)];
    };
    const M = (x, at, o = {}) => Object.assign({ at, hip: [x, 0.84], lean: 0, nod: 0, rf: [x + 0.17, 0], lf: [x - 0.17, 0], rh: [x + 0.33, 1.3], lh: [x - 0.3, 0.95] }, o);
    const step = (x0, x1, ta, tb, o = {}) => {
      const dir = Math.sign(x1 - x0), m = (ta + tb) / 2;
      const lead = dir > 0 ? { rf: [x1 + 0.17, 0.05], lf: [x0 - 0.17, 0] } : { lf: [x1 - 0.17, 0.05], rf: [x0 + 0.17, 0] };
      return [Object.assign(M((x0 + x1) / 2, m, o), lead), M(x1, tb, o)];
    };
    const d0 = 0.22, m0 = -1.1;
    BC.motion({ id: 'def-deny',
      name: 'ディナイ（パスのコースに手）', view: 'front', box: [-1.7, 1.7, -0.05, 2.0], dur: 3.4, fade: true,
      phases: [{ at: 0, label: 'コースに手と足' }, { at: 0.1, label: 'マークと一緒に動く' }, { at: 0.46, label: 'パスをはじく' }, { at: 0.7, label: 'すぐ構え直す' }],
      mistakes: [{ id: 'tall', label: '腰が高い', mods: { hipUp: 0.17, hands: true } }],
      still: 0.545,
      actors: [
        { role: 'x', keys: [
          D(d0, 0), D(d0, 0.1),
          ...slide(d0, d0 + 0.22, 0.1, 0.2),
          D(d0 + 0.22, 0.24),
          ...slide(d0 + 0.22, d0, 0.24, 0.34),
          ...slide(d0, d0 + 0.2, 0.36, 0.45),
          D(d0 + 0.2, 0.5),
          D(d0 + 0.2, 0.56, { rh: [d0 + 0.2 + 0.74, 1.24] }),
          D(d0 + 0.2, 0.62),
          D(d0 + 0.2, 0.72),
          ...slide(d0 + 0.2, d0, 0.74, 0.86),
          D(d0, 1),
        ] },
        { role: 'o', keys: [
          M(m0, 0), M(m0, 0.1),
          ...step(m0, m0 + 0.24, 0.1, 0.2),
          M(m0 + 0.24, 0.24),
          ...step(m0 + 0.24, m0, 0.24, 0.34),
          ...step(m0, m0 + 0.22, 0.36, 0.45, { rh: [m0 + 0.22 + 0.33, 1.38] }),
          M(m0 + 0.22, 0.6, { rh: [m0 + 0.22 + 0.33, 1.38] }),
          M(m0 + 0.22, 0.72),
          ...step(m0 + 0.22, m0, 0.74, 0.86),
          M(m0, 1),
        ] },
      ],
      balls: [{ keys: [
        { at: 0, p: [2.4, 1.22] }, { at: 0.47, p: [2.4, 1.22] }, { at: 0.555, p: [d0 + 1.04, 1.24] },
        { at: 0.63, p: [1.2, 0.12] }, { at: 0.75, p: [2.2, 0.5], arc: 0.35 }, { at: 1, p: [2.4, 1.22] },
      ] }],
      points: ['ボールに近い手と足を、パスのコースに入れる', 'ボールとマークの両方が見える向き（ボールに背を向けない）', '押す・つかむはファウル。ひじを軽く曲げて腕を出す'],
    });
  })();

  /* ---------- テイクチャージ（横から：守り x が、ドライブしてきた o の当たりを受けて、安全に倒れる） ---------- */
  (function () {
    // 攻め o：右からドリブルで来て、当たったあと少し下がって止まる（左向き。右向きで作って左右を反対に）
    const run = BC.mo.steps(0, 0.24, { r: -1.62, l: -1.98 }, [['l', -1.25], ['r', -0.88], ['l', -0.56]], { h: 0.86, lean: 14, ahead: 0.1,
      arms: (f) => ({ rh: [f.r + 0.15, 0.95], lh: [f.l + 0.3, 1.05] }) });
    const hold = { rh: [-0.44, 1.02], lh: [-0.4, 1.04] };
    const o = [
      ...run.keys,
      { at: 0.29, hip: [-0.45, 0.84], lean: 12, rf: [-0.3, 0], lf: [-0.58, 0], ...hold },
      { at: 0.35, hip: [-0.56, 0.86], lean: 6, lf: [-0.78, 0.06], rh: [-0.54, 1.04], lh: [-0.5, 1.06] },
      { at: 0.42, hip: [-0.64, 0.88], lean: 3, rf: [-0.5, 0], lf: [-0.8, 0], rh: [-0.62, 1.04], lh: [-0.58, 1.06] },
      { at: 0.985 },
    ].map(mirror);
    const d0 = { hip: [0, 0.8], lean: 8, nod: -4, rf: [0.1, 0], lf: [-0.12, 0], rh: [0.26, 1.1], lh: [0.22, 1.12] };
    BC.motion({ id: 'def-charge',
      name: 'テイクチャージ（安全な倒れ方）', view: 'side', box: [-1.55, 2.05, -0.05, 2.0], dur: 4.6, fade: true,
      phases: [{ at: 0, label: '先に止まって立つ' }, { at: 0.27, label: '胸で受ける' }, { at: 0.34, label: 'おしりから' }, { at: 0.5, label: '背中を丸めて転がる' }, { at: 0.75, label: 'すぐ起きる' }],
      mistakes: [{ id: 'chin', label: 'あごが上がる', mods: { nod: -55 } }],
      still: 0.6,
      actors: [
        { role: 'x', keys: [
          Object.assign({ at: 0 }, d0),
          { at: 0.28 },
          { at: 0.33, hip: [-0.06, 0.78], lean: 2, nod: 12 },
          { at: 0.43, hip: [-0.24, 0.4], lean: 24, nod: 34, rh: [0.16, 0.86], lh: [0.12, 0.88] },
          { at: 0.5, hip: [-0.36, 0.14], lean: -10, nod: 40, rf: [0.08, 0], lf: [-0.1, 0], rh: [-0.08, 0.66], lh: [-0.12, 0.68] },
          { at: 0.58, hip: [-0.4, 0.17], lean: -78, nod: 46, rf: [0.06, 0.3], lf: [-0.06, 0.27], rh: [-0.6, 0.42], lh: [-0.64, 0.44] },
          { at: 0.66 },
          { at: 0.75, hip: [-0.34, 0.14], lean: -6, nod: 30, rf: [0.06, 0], lf: [-0.12, 0], rh: [-0.02, 0.66], lh: [-0.06, 0.68] },
          { at: 0.84, hip: [-0.14, 0.46], lean: 36, nod: 0, rh: [0.3, 0.86], lh: [0.26, 0.88] },
          Object.assign({ at: 0.93 }, d0, { hip: [-0.03, 0.8], rf: [0.06, 0], lf: [-0.12, 0] }),
          { at: 0.985 },
          Object.assign({ at: 1 }, d0),
        ] },
        { role: 'o', face: -1, keys: [...o, Object.assign({}, o[0], { at: 1 })] },
      ],
      balls: [{ keys: [
        { at: 0, a: 1, h: 'r', o: [-0.04, -0.13] }, { at: 0.07, p: [1.3, 0.12] }, { at: 0.14, a: 1, h: 'r', o: [-0.04, -0.13] },
        { at: 0.2, a: 1, h: 'both', o: [-0.04, 0] }, { at: 0.985, a: 1, h: 'both', o: [-0.04, 0] }, { at: 1, a: 1, h: 'r', o: [-0.04, -0.13] },
      ] }],
      points: ['相手より先に、正面で止まって立つ（横から当たりにいかない）', 'おしり→背中の順に。あごを引いて、おへそを見る', '手は胸の前。床につかない（手首・ひじのケガを防ぐ）'],
    });
  })();

  /* ---------- ラダー（前から：イン・イン・アウト・アウト） ---------- */
  (function () {
    const H = 0.84, OUT = 0.3, IN = 0.09;
    const up = 1.22, dn = 0.8;
    const mid = { rh: [0.22, 1.0], lh: [-0.22, 1.0] };
    // 腕：足と反対の手が前（前から見ると、胸の前に上がる）
    const swing = (s) => (s === 'r' ? { lh: [-0.1, up], rh: [0.32, dn] } : { rh: [0.1, up], lh: [-0.32, dn] });
    const k = [{ at: 0, hip: [0, H], lean: 0, nod: 0, rf: [OUT, 0], lf: [-OUT, 0], ...mid }];
    const pos = { r: OUT, l: -OUT };
    [['r', IN], ['l', -IN], ['r', OUT], ['l', -OUT]].forEach(([s, x], i) => {
      const a = i / 4;
      k.push(Object.assign({ at: a + 0.125, hip: [s === 'r' ? -0.02 : 0.02, H + 0.025], lean: s === 'r' ? -3 : 3, [s + 'f']: [(pos[s] + x) / 2, 0.1] }, swing(s)));
      k.push(Object.assign({ at: a + 0.25, hip: [0, H], lean: 0, [s + 'f']: [x, 0] }, mid));
      pos[s] = x;
    });
    BC.motion({ id: 'ladder',
      name: 'ラダー（イン・イン・アウト・アウト）', view: 'front', box: [-0.95, 0.95, -0.05, 1.85], dur: 0.9, guides: ['head'],
      phases: [{ at: 0, label: '右をイン' }, { at: 0.25, label: '左をイン' }, { at: 0.5, label: '右をアウト' }, { at: 0.75, label: '左をアウト' }],
      mistakes: [{ id: 'bounce', label: '上にはねる', mods: { bob: 0.06, freq: 4 } }],
      still: 0.13,
      actors: [{ keys: k }],
      points: ['親指のつけ根で軽く、すばやく床にふれる', '腕も前後にふって、リズムよく', '目線は2〜3マス先（真下を見すぎない）'],
    });
  })();

  /* ---------- もも上げ・スキップ（横から・その場で。床が流れる） ---------- */
  (function () {
    const k = [];
    const other = (s) => (s === 'r' ? 'l' : 'r');
    const armsUp = (s, big) => (s === 'r' ? { rh: [big ? 0.36 : 0.3, big ? 1.5 : 1.24], lh: [-0.24, 0.94] } : { lh: [big ? 0.36 : 0.3, big ? 1.5 : 1.24], rh: [-0.24, 0.94] });
    const armsMid = { rh: [0.06, 1.0], lh: [0.02, 1.0] };
    // はじまり：右足が床（前）、左足がうしろ（スキップの終わりと同じ形）
    k.push({ at: 0, hip: [0, 0.88], lean: 6, nod: 0, rf: [0.14, 0], lf: [-0.04, 0], ...armsMid });
    // もも上げ（4歩）：上げる足 S、床の足 P
    const A = 0.4, dA = A / 4;
    ['l', 'r', 'l', 'r'].forEach((S, i) => {
      const P = other(S), b = dA * i;
      k.push(Object.assign({ at: b + dA * 0.5, hip: [0, 0.94], lean: 3, [S + 'f']: [0.24, 0.44], [P + 'f']: [-0.02, 0.02] }, armsUp(P, false)));
      k.push(Object.assign({ at: b + dA, hip: [0, 0.92], [S + 'f']: [0.04, 0], [P + 'f']: [-0.08, 0.03] }, armsMid));
    });
    // スキップ（4回）：ふんで、同じ足でとぶ（反対のももを上げる）。F がとぶ足、G が上げる足
    const dB = (1 - A) / 4;
    ['r', 'l', 'r', 'l'].forEach((F, i) => {
      const G = other(F), b = A + dB * i;
      k.push({ at: b + dB * 0.08, hip: [0, 0.88], lean: 6, [F + 'f']: [0.12, 0], [G + 'f']: [-0.06, 0.04] });
      k.push(Object.assign({ at: b + dB * 0.42, hip: [0, 0.99], [F + 'f']: [-0.04, 0.03], [G + 'f']: [0.2, 0.36] }, armsUp(F, true)));
      k.push({ at: b + dB * 0.55, hip: [0, 1.04], [F + 'f']: [-0.04, 0.1], [G + 'f']: [0.26, 0.46] });
      k.push(Object.assign({ at: b + dB * 0.78, hip: [0, 0.92], [F + 'f']: [0.04, 0], [G + 'f']: [0.2, 0.18] }, armsMid));
      k.push({ at: b + dB, hip: [0, 0.88], [F + 'f']: [-0.04, 0], [G + 'f']: [0.14, 0] });
    });
    BC.motion({ id: 'warmup-skip',
      name: 'もも上げ・スキップ', view: 'side', box: [-1.0, 1.2, -0.05, 2.05], dur: 3.4,
      phases: [{ at: 0, label: 'もも上げ' }, { at: A, label: 'スキップ（ふむ）' }, { at: A + dB * 0.42, label: 'スキップ（とぶ）' }],
      still: A + dB * 0.55,
      scroll: [{ at: 0, v: 0 }, { at: A, v: 0.4 }, { at: 1, v: 2.0 }],
      actors: [{ keys: k }],
      points: ['ももを腰の高さまで上げ、親指のつけ根で着く', '腕は前後に大きくふる（上げた足と反対の腕）', '背すじをのばし、前を見る'],
    });
  })();

  /* ---------- ライン走のタッチ（横から：走る → 腰を落として床にタッチ → ふり返って走る。床が流れる）
     向きを変えるところは、右向きの人（0）から左向きの人（1）に入れかえて見せる ---------- */
  (function () {
    const R1 = 0.24; // 行きの走り（1回で2歩）
    const go = BC.mo.runKeys(0, R1, { h: 0.9, lean: 16 });
    const touch = { hip: [-0.02, 0.5], lean: 68, nod: -6, rf: [0.36, 0], lf: [-0.64, 0], rh: [0.5, 0.05], lh: [-0.05, 0.62] };
    const turn = { hip: [0.1, 0.7], lean: 26, nod: 0, rf: [0.34, 0], lf: [0.02, 0], rh: [0.42, 0.62], lh: [0.04, 0.86] };
    const keys0 = [
      ...go,
      { at: 0.31, hip: [0, 0.84], lean: 18, rf: [-0.3, 0.12], lf: [0.14, 0], rh: [0.3, 1.05], lh: [-0.16, 0.86], lin: false },
      Object.assign({ at: 0.4 }, touch, { rh: [0.56, 0.2] }),
      Object.assign({ at: 0.44 }, touch),
      Object.assign({ at: 0.48 }, touch),
      Object.assign({ at: 0.53 }, turn),
      Object.assign({ at: 0.53 }, hide(turn)),
      { at: 1 },
    ];
    // 帰り（左向き）：右向きで作って、左右を反対に
    const back = BC.mo.runKeys(0.64, 1, { h: 0.9, lean: 16, cycles: 2 }).map(mirror);
    const turn1 = mirror({ hip: [-0.1, 0.7], lean: 26, nod: 0, rf: [-0.34, 0], lf: [-0.02, 0], rh: [-0.3, 0.86], lh: [0.2, 1.0] });
    const keys1 = [
      Object.assign({ at: 0 }, hide(turn1)),
      Object.assign({ at: 0.53 }, hide(turn1)),
      Object.assign({ at: 0.53 }, turn1),
      Object.assign({ at: 0.59 }, mirror({ hip: [0, 0.8], lean: 22, rf: [0.06, 0.24], lf: [-0.2, 0], rh: [0.34, 1.05], lh: [-0.14, 0.86] })),
      ...back,
    ];
    BC.motion({ id: 'line-touch',
      name: 'ライン走のタッチと切りかえし', view: 'side', box: [-1.2, 1.3, -0.05, 1.9], dur: 3.0, fade: true,
      phases: [{ at: 0, label: '走る' }, { at: 0.26, label: '歩幅を小さく' }, { at: 0.36, label: '腰を落としてタッチ' }, { at: 0.5, label: 'ふり返る' }, { at: 0.58, label: '走ってもどる' }],
      still: 0.44,
      scroll: [{ at: 0, v: 0 }, { at: R1, v: 1.6 }, { at: 0.31, v: 2.05 }, { at: 0.4, v: 2.5 }, { at: 0.53, v: 2.5 }, { at: 0.64, v: 2.2 }, { at: 1, v: -1.0 }],
      actors: [{ keys: keys0 }, { face: -1, keys: keys1 }],
      points: ['ラインの手前で歩幅を小さくし、腰を落とす', 'ラインに手でタッチして、外側の足でふみ返す', '大きくふくらまずに、すぐ反対へ走り出す'],
    });
  })();

  /* ---------- スクワット（横から） ---------- */
  BC.motion({ id: 'squat',
    name: 'スクワット', view: 'side', box: [-0.95, 1.05, -0.05, 2.0], dur: 3.6,
    phases: [{ at: 0, label: '立つ' }, { at: 0.08, label: 'おしりをうしろへ' }, { at: 0.38, label: 'ももが床と平行' }, { at: 0.56, label: '立ち上がる' }],
    still: 0.46,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.9], lean: 2, nod: 0, rf: [0.07, 0], lf: [0.01, 0], rh: [0.1, 0.9], lh: [0.04, 0.92] },
      { at: 0.08 },
      { at: 0.38, hip: [-0.22, 0.5], lean: 40, nod: -28, rh: [0.69, 0.94], lh: [0.65, 0.96] },
      { at: 0.56 },
      { at: 0.86, hip: [0, 0.9], lean: 2, nod: 0, rh: [0.1, 0.9], lh: [0.04, 0.92] },
      { at: 1 },
    ] }],
    points: ['おしりをうしろへ引き、いすに座るように', 'ひざはつま先と同じ向き（内に入れない）。かかとは床につけたまま', '胸を張って前を見る（背中を丸めない）'],
  });

  /* ---------- プランク（横から・体幹） ---------- */
  (function () {
    const arms = { rh: [0.76, 0.06], lh: [0.72, 0.06] };
    const knee = { hip: [-0.046, 0.42], lean: 96.9, nod: 0, rf: [-0.78, 0.02], lf: [-0.8, 0.02], ...arms }; // ひざを床に（ひざの中心は床から 0.1）
    const plank = { hip: [-0.042, 0.269], lean: 79.5, nod: 10, rf: [-0.896, 0.04], lf: [-0.916, 0.04] };
    const toes = { hip: [-0.045, 0.36], lean: 86, rf: [-0.88, 0.04], lf: [-0.9, 0.04] }; // つま先を立てて、ひざがうく
    BC.motion({ id: 'plank',
      name: 'プランク（体幹）', view: 'side', box: [-1.15, 1.0, -0.05, 1.2], dur: 5.0,
      phases: [{ at: 0, label: 'ひじを肩の真下に' }, { at: 0.1, label: 'ひざを上げる' }, { at: 0.28, label: '一直線でキープ' }, { at: 0.82, label: 'ひざをおろす' }],
      still: 0.5,
      actors: [{ keys: [
        Object.assign({ at: 0 }, knee),
        { at: 0.1 },
        Object.assign({ at: 0.19 }, toes),
        Object.assign({ at: 0.28 }, plank),
        { at: 0.82 },
        Object.assign({ at: 0.89 }, toes),
        Object.assign({ at: 0.97 }, knee),
        { at: 1 },
      ] }],
      points: ['頭からかかとまで一直線（腰を落とさない・おしりを上げない）', 'ひじは肩の真下。目線は床の少し前', '息を止めず、数を声に出して数える（20〜30秒）'],
    });
  })();

  /* ---------- ストレッチ（もも裏・もも前。立って） ---------- */
  (function () {
    const stand = { hip: [0, 0.9], lean: 2, nod: 0, rf: [0.06, 0], lf: [-0.04, 0], rh: [0.08, 0.88], lh: [0.02, 0.9] };
    const ham = { hip: [-0.05, 0.76], lean: 48, nod: -8, rf: [0.45, 0], lf: [-0.2, 0], rh: [0.2, 0.52], lh: [0.16, 0.54] };
    const quad = { hip: [0, 0.9], lean: 3, nod: 0, rf: [-0.2, 0.82], lf: [0.0, 0], rh: [-0.22, 0.86], lh: [0.42, 1.22] };
    BC.motion({ id: 'stretch-legs',
      name: 'ストレッチ（もも裏・もも前）', view: 'side', box: [-0.95, 1.05, -0.05, 2.0], dur: 9.0,
      phases: [{ at: 0, label: '立つ' }, { at: 0.04, label: 'もも裏をのばす' }, { at: 0.39, label: 'もどる' }, { at: 0.5, label: 'もも前をのばす' }, { at: 0.87, label: 'もどる' }],
      mistakes: [{ id: 'bounce', label: '反動をつける', mods: { bob: -0.05, freq: 18 } }],
      still: 0.3,
      actors: [{ keys: [
        Object.assign({ at: 0 }, stand),
        { at: 0.04 },
        Object.assign({ at: 0.14 }, ham),
        Object.assign({ at: 0.38 }, ham, { lean: 52, rh: [0.24, 0.48], lh: [0.2, 0.5] }),
        Object.assign({ at: 0.47 }, stand),
        { at: 0.5 },
        Object.assign({ at: 0.6 }, quad),
        { at: 0.86 },
        Object.assign({ at: 0.96 }, stand),
        { at: 1 },
      ] }],
      points: ['反動をつけず、いたきもちいい所で止める', '止めたら、ゆっくり息をはく（1か所20〜30秒）', 'もも裏は背中をまっすぐ、もも前はひざを下に向ける'],
    });
  })();

  /* ---------- 反応ダッシュ（横から：合図 o を見て、構えから1歩目） ---------- */
  (function () {
    const feet = { r: 0.12, l: -0.18 };
    const ready = { hip: [0, 0.7], lean: 24, nod: -12, rf: [feet.r, 0], lf: [feet.l, 0], rh: [0.34, 0.96], lh: [0.24, 0.9] };
    const plants = [['l', 0.85], ['r', 1.32], ['l', 1.78]];
    const dash = BC.mo.steps(0.42, 0.78, { r: 0.4, l: -0.12 }, plants, { h: 0.76, lean: 32, ahead: 0.1, lift: 0.2 });
    // 腕：前へ出す足と反対の腕を前へ（手の位置は、そのキーの腰から）
    dash.keys.forEach((k, j) => {
      const x = k.hip[0];
      if (j % 2) { const fw = [x + 0.46, 1.16], bk = [x - 0.08, 0.86]; Object.assign(k, plants[(j - 1) / 2][0] === 'l' ? { rh: fw, lh: bk } : { lh: fw, rh: bk }); }
      else Object.assign(k, { rh: [x + 0.3, 0.94], lh: [x + 0.24, 0.92] });
    });
    BC.motion({ id: 'reaction-dash',
      name: '反応ダッシュ（1歩目）', view: 'side', box: [-0.85, 2.75, -0.05, 2.0], dur: 2.6, fade: true,
      phases: [{ at: 0, label: '低く構えて待つ' }, { at: 0.3, label: '合図を見る' }, { at: 0.34, label: '1歩目は小さく低く' }, { at: 0.5, label: '腕をふって加速' }],
      mistakes: [{ id: 'tall', label: '体が起きている', mods: { hipUp: 0.12 } }],
      still: 0.39,
      actors: [
        { keys: [
          Object.assign({ at: 0 }, ready),
          ...taps(0.04, 0.3, 6, feet, 0.04),
          { at: 0.34 },
          { at: 0.39, hip: [0.14, 0.64], lean: 40, nod: -14, rf: [0.36, 0.06], lf: [-0.14, 0], rh: [-0.06, 0.78], lh: [0.5, 1.02] },
          { at: 0.42, hip: [0.22, 0.68], lean: 36, rf: [0.4, 0], lf: [-0.12, 0.04] },
          ...dash.keys.slice(1),
          { at: 0.86, hip: [1.7, 0.72], lean: 20, nod: -8, rf: [1.86, 0], lf: [1.6, 0], rh: [2.0, 0.98], lh: [1.92, 0.96] },
          { at: 1 },
        ] },
        { role: 'o', face: -1, keys: [
          { at: 0, hip: [2.45, 0.88], lean: 4, nod: 0, rf: [2.37, 0], lf: [2.55, 0], rh: [2.36, 0.92], lh: [2.44, 0.9] },
          { at: 0.28 },
          { at: 0.31, rh: [2.3, 1.95] },
          { at: 0.62 },
          { at: 0.72, rh: [2.36, 0.92] },
          { at: 1 },
        ] },
      ],
      points: ['音より、目で見る合図に反応する', '1歩目は小さく低く（足をうしろに引かない）', '頭と肩を、足より先に前へ出す'],
    });
  })();

  /* ---------- 呼吸（前から：ゆっくり吸って、長くはく） ---------- */
  BC.motion({ id: 'breathing',
    name: '呼吸（長くはく）', view: 'front', box: [-0.85, 0.85, -0.05, 1.95], dur: 11,
    phases: [{ at: 0, label: '肩の力をぬく' }, { at: 0.04, label: '鼻から吸う（4秒）' }, { at: 0.4, label: '口から長くはく（6〜8秒）' }],
    still: 0.4,
    actors: [{ keys: [
      { at: 0, hip: [0, 0.91], lean: 0, nod: 0, rf: [0.12, 0], lf: [-0.12, 0], rh: [0.07, 1.03], lh: [-0.07, 1.01] },
      { at: 0.04 },
      { at: 0.4, hip: [0, 0.938], rh: [0.16, 1.1], lh: [-0.16, 1.08] },
      { at: 0.96, hip: [0, 0.91], rh: [0.07, 1.03], lh: [-0.07, 1.01] },
      { at: 1 },
    ] }],
    points: ['はく息を、吸う息より長く', 'おなかに手を当てて、ふくらむのを感じる（肩に力を入れない）', '試合前・フリースローの前など、使う場面を決めておく'],
  });

  /* ---------- 横へ片足ジャンプ（前から：片足で着地して止まる） ---------- */
  (function () {
    const air = { hip: [0, 1.0], lean: 0, nod: 0, rf: [0.12, 0.3], lf: [-0.12, 0.3], rh: [0.42, 1.25], lh: [-0.42, 1.25] };
    // 片足で着地して止まる。dir -1：左足で（画面の左）、1：右足で。how：'touch' 着く・'absorb' しずむ・'hold' 止まる・'load' とぶ前
    const land = (dir, how) => {
      const xs = dir * 0.5, x = xs - dir * 0.08; // 着く足の x・腰の x（腰は着く足の上）
      const h = { touch: 0.8, absorb: 0.72, hold: 0.82, load: 0.7 }[how];
      const free = how === 'touch' ? 0.1 : 0.2;
      const k = { hip: [x, h], lean: 0, rh: [x + 0.74, h + 0.42], lh: [x - 0.74, h + 0.42] }; // 腕を横に広げてバランス
      if (how === 'load') Object.assign(k, { lean: dir * 6, rh: [x - dir * 0.2 + 0.25, 0.88], lh: [x - dir * 0.2 - 0.25, 0.88] });
      if (dir < 0) { k.lf = [xs, 0]; k.rf = [x + 0.24, free]; } else { k.rf = [xs, 0]; k.lf = [x - 0.24, free]; }
      return k;
    };
    BC.motion({ id: 'side-hop',
      name: '横へ片足ジャンプ（片足で止まる）', view: 'front', box: [-1.3, 1.3, -0.05, 2.05], dur: 6.0,
      phases: [{ at: 0, label: '横へとぶ' }, { at: 0.06, label: '片足で着地' }, { at: 0.12, label: '2秒止まる' }, { at: 0.42, label: '反対へとぶ' }],
      still: 0.25,
      actors: [{ keys: [
        Object.assign({ at: 0 }, air),
        Object.assign({ at: 0.06 }, land(-1, 'touch')),
        Object.assign({ at: 0.12 }, land(-1, 'absorb')),
        Object.assign({ at: 0.2 }, land(-1, 'hold')),
        { at: 0.38 },
        Object.assign({ at: 0.44 }, land(-1, 'load')),
        Object.assign({ at: 0.5 }, air),
        Object.assign({ at: 0.56 }, land(1, 'touch')),
        Object.assign({ at: 0.62 }, land(1, 'absorb')),
        Object.assign({ at: 0.7 }, land(1, 'hold')),
        { at: 0.88 },
        Object.assign({ at: 0.94 }, land(1, 'load')),
        Object.assign({ at: 1 }, air),
      ] }],
      points: ['ひざはつま先と同じ向き（内に入れない）', 'ひざと股関節を曲げて、やわらかく着地', '着地したら2秒止まって、ぐらつかない'],
    });
  })();

  /* ---------- 練習メニュー・改善の視点とつなぐ ---------- */
  BC.motionLink({
    // 守り
    'd-stance': 'def-stance', 'v-def-stance': 'def-stance',
    'd-zigzag-d': 'def-backslide',
    'd-ballpressure': 'def-pressure', 'v-def-distance': 'def-pressure', 'v-def-hands': 'def-pressure',
    'd-deny-drill': 'def-deny', 'v-dt-position': 'def-deny',
    'd-charge': 'def-charge',
    'd-help-recover': 'closeout', // リカバーは、クローズアウト（基本の動き）と同じ
    // からだ・フットワーク
    'd-dynamic': 'warmup-skip',
    'd-ladder': 'ladder',
    'd-suicide': 'line-touch', 'd-sideline': 'line-touch', 'v-body-stamina': 'line-touch',
    'd-reaction': 'reaction-dash', 'v-foot-first': 'reaction-dash',
    'd-core': 'plank',
    'v-body-power': 'squat',
    'v-body-agility': 'side-hop',
    'd-cooldown': 'stretch-legs', 'v-body-recovery': 'stretch-legs',
    // メンタル
    'd-breathing': 'breathing', 'v-mind-nerve': 'breathing',
  });
})();
