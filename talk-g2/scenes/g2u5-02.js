(function () {
  const { T, B, Q, FIG, tbl } = KL;
  /* ---- 図の部品（座標は数学の座標・y が上）。1目もり＝88px ---- */
  const U = 88, R = Math.PI / 180;
  const FG = (id, x0, y0, x1, y1) => FIG(id, [x0, y0, x1, y1], Math.round((x1 - x0) * U), Math.round((y1 - y0) * U), [], { col: 1 });
  const G = (id, ...i) => ({ fig: id, items: i.flat(3) });
  const ln = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c: c || 'w', wd: 3.4 }, o);
  const dn = (at, name, dir, c) => ({ k: 'pt', at, name, dir: dir || [0.7, 0.7], off: 24, c: c || 'w', r: 5.5 });
  const tx = (at, text, c, anchor, size) => ({ k: 'label', at, text, c: c || 'w', size: size || 28, anchor: anchor || 'middle' });
  const tri = (pts, c, fill, o) => Object.assign({ k: 'poly', pts, close: true, c: c || 'w', wd: 3.4 }, fill ? { fill, alpha: 0.16 } : {}, o);
  // 等しい長さの印：辺 ab の中点に、辺と直角な短い線を n 本
  const tick = (a, b, n, c) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ex = dx / L, ey = dy / L, nx = -ey, ny = ex;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], h = 13 / U, s = 9 / U, out = [];
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * s, p = [m[0] + ex * o, m[1] + ey * o]; out.push(ln([p[0] - nx * h, p[1] - ny * h], [p[0] + nx * h, p[1] + ny * h], c, { wd: 3 })); }
    return out;
  };
  // 平行の印：辺 ab の中点に、a→b の向きの矢じり（＞）を n 個
  const par = (a, b, n, c) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ex = dx / L, ey = dy / L, nx = -ey, ny = ex;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], h = 13 / U, w = 9 / U, s = 11 / U, out = [];
    for (let i = 0; i < n; i++) {
      const o = (i - (n - 1) / 2) * s, p = [m[0] + ex * (o + h / 2), m[1] + ey * (o + h / 2)];
      out.push({ k: 'poly', pts: [[p[0] - ex * h + nx * w, p[1] - ey * h + ny * w], p, [p[0] - ex * h - nx * w, p[1] - ey * h - ny * w]], c, wd: 3 });
    }
    return out;
  };
  // 角の印：頂点 v で、v→p と v→q のあいだの円弧を n 本
  const ang = (v, p, q, r, n, c) => {
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]) / R, a2 = Math.atan2(q[1] - v[1], q[0] - v[0]) / R;
    const d = ((a2 - a1 + 540) % 360) - 180, s0 = (((d > 0 ? a1 : a1 + d) % 360) + 360) % 360;
    return Array.from({ length: n }, (_, i) => ({ k: 'ell', o: v, rx: r + i * 7 / U, ry: r + i * 7 / U, a1: s0, a2: s0 + Math.abs(d), c, wd: 3 }));
  };
  // 直角の印：頂点 v、v→p と v→q が直角
  const rt = (v, p, q, c) => { const u = x => { const l = Math.hypot(x[0] - v[0], x[1] - v[1]); return [(x[0] - v[0]) / l, (x[1] - v[1]) / l]; }; return { k: 'right', at: v, u: u(p), v: u(q), s: 15, c: c || 'w' }; };
  /* ---- 読み上げ（say）：記号と英字を、ひらがな・カタカナの読みにする ---- */
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const plainS = s => s.replace(/\{\{|\}\}|\*\*/g, '');
  const rd = s => plainS(s)
    .replace(/[①-⑤]+/g, m => m.length === 1 ? 'まる' + ['いち', 'に', 'さん', 'よん', 'ご']['①②③④⑤'.indexOf(m)] + '、' : [...m].map(c => ['いち', 'に', 'さん', 'よん', 'ご']['①②③④⑤'.indexOf(c)]).join('、') + '、')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/≡/g, ' 合同 ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ').replace(/−/g, 'ひく').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/(?<=[0-9])m(?![a-z])/g, 'メートル')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const t = wrap(T), b = wrap(B);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  /* 中2 5章 三角形と四角形　第2時（例）「二等辺三角形の性質を使って、角や辺について考えよう」。自作。
     三角テント（正面）＝二等辺三角形 ABC。頂角 80° → 底角 (180−80)÷2＝50°。頂角の二等分線 AD：∠BAD＝40°，∠ADB＝180−50−40＝90°。
     AB＝AC＝5，BC＝6，AD＝4（3-4-5）：BD＝3。逆に底角 35° → 頂角 180−35×2＝110°。 */
  const T50 = 4 * Math.tan(50 * R), T35 = 3 * Math.tan(35 * R);
  const a1 = [4, T50], b1 = [0, 0], c1 = [8, 0], d1 = [4, 0];
  const a2 = [3, 4], b2 = [0, 0], c2 = [6, 0], d2 = [3, 0];
  const a3 = [3, T35], b3 = [0, 0], c3 = [6, 0];
  const f1 = FG('g1', -0.9, -0.85, 8.9, 5.5), f2 = FG('g2', -1.2, -0.95, 7.2, 5.0), f3 = FG('g3', -1.2, -0.95, 7.2, 3.4);
  const nm = (a, b_, c, ad) => [dn(a, 'A', [0, 1]), dn(b_, 'B', [-0.7, -0.7]), dn(c, 'C', [0.7, -0.7]), ad ? dn(ad, 'D', [0, -1]) : []];
  const body1 = [tri([a1, b1, c1], 'w'), nm(a1, b1, c1), tick(b1, a1, 1, 'y'), tick(c1, a1, 1, 'y'), tx([4.45, 4.95], '80°', 'g', 'start')];
  const pole1 = [ln(a1, d1, 'w', { dash: true }), dn(d1, 'D', [0, -1]), ang(a1, b1, d1, 1.0, 1, 'g'), ang(a1, d1, c1, 1.0, 1, 'g'), tx([3.35, 3.5], '40°', 'g'), tx([4.65, 3.5], '40°', 'g'),
    ang(b1, c1, a1, 0.9, 1, 'p'), ang(c1, b1, a1, 0.9, 1, 'p'), tx([1.6, 0.5], '50°', 'p'), tx([6.4, 0.5], '50°', 'p')];
  const right1 = [rt(d1, a1, c1, 'y'), tx([4.45, 0.45], '90°', 'y', 'start')];
  const body2 = [tri([a2, b2, c2], 'w'), nm(a2, b2, c2, d2), tick(b2, a2, 1, 'y'), tick(c2, a2, 1, 'y'), ln(a2, d2, 'w', { dash: true }), rt(d2, a2, c2, 'y'),
    tx([1.15, 2.35], '5ｍ', 'y', 'end'), tx([4.85, 2.35], '5ｍ', 'y', 'start'), tx([3, -0.6], '6ｍ', 'b'), tx([3.2, 1.9], '4ｍ', 'g', 'start')];
  const body3 = [tri([a3, b3, c3], 'w'), dn(a3, 'P', [0, 1]), dn(b3, 'Q', [-0.7, -0.7]), dn(c3, 'R', [0.7, -0.7]), tick(b3, a3, 1, 'y'), tick(c3, a3, 1, 'y'), ang(b3, c3, a3, 0.9, 1, 'p'), tx([1.7, 0.42], '35°', 'p')];
  const more3 = [ang(c3, b3, a3, 0.9, 1, 'p'), tx([4.3, 0.42], '35°', 'p'), ang(a3, b3, c3, 0.8, 1, 'g'), tx([3, 0.95], '110°', 'g')];

  KL.lesson({ id: 'g2u5-02', unit: '中2　三角形と四角形', kick: '2年5章　第2時', title: '二等辺三角形の性質を使って、角や辺について考えよう', card: '二等辺三角形の性質を使って、角や辺について考えよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、二等辺三角形の性質を使って、角の大きさや、辺の長さを、求めます。', { title: true, point: false, ft: 'happy' }),
    b('キャンプだ！ 三角のテントの中で、カレーを、作ろう！', { title: true, fb: 'star', up: true }),
    t('テントは、たしかに、二等辺三角形の形です。その形で、考えましょう。カレーは、あとですよ。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。ポンタの三角テントを、正面から見ると、二等辺三角形 ABC です。AB＝AC で、頂角 ∠A は、80°です。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '二等辺三角形の性質を使って\n角や辺を求めよう', t: 4.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AB＝AC　∠A＝80°\n∠B は何度？', t: 4.5 }, Object.assign(f1, { prims: [] })], draw: [G('g1', body1)] }),
    t('前の時間に、二等辺三角形の、2つの底角は等しいと、証明しました。この性質を使って、底角 ∠B を求めましょう。', { ft: 'normal', point: false }),

    /* ---------- 問1（底角）---------- */
    Q('q1', t('問題です。底角 ∠B は、何度でしょう。', { ft: 'normal' }),
      [{ t: '100°' }, { t: '80°' }, { t: '50°', ok: true }, { t: '40°' }],
      { 0: [b('180から80をひいて、100度！ かんたん！', { fb: 'happy', up: true }), t('100°は、2つの底角を、合わせた大きさです。底角は等しいので、半分にして、50°です。', sad)],
        3: [t('40°は、頂角を半分にした角です。底角は、(180°−80°)÷2＝50°です。', { ft: 'normal' })],
        ok: [t('正解！ 内角の和は180°。底角2つで100°。1つぶんは、50°です。', { ft: 'happy' }), b('2つ分を、半分にするんだね！', { fb: 'star', up: true })],
        wrong: [t('80°は、頂角です。底角は、(180°−80°)÷2＝50°です。', { ft: 'normal' })] }),

    t('次に、テントの真ん中に、支柱 AD を立てます。D は、地面 BC 上の点で、AD は、頂角を半分にします。', { ft: 'normal', point: false,
      draw: [G('g1', pole1)] }),

    /* ---------- 問2（∠ADB）---------- */
    Q('q2', t('問題です。地面と支柱の間の角、∠ADB は、何度でしょう。', { ft: 'normal' }),
      [{ t: '100°' }, { t: '90°', ok: true }, { t: '50°' }, { t: '40°' }],
      { 3: [b('支柱は、頂角を半分にするから、地面との角も、40度！', { fb: 'happy', up: true }), t('40°は、∠BAD です。∠ADB は、△ABD の残りの角で、180°−50°−40°＝90°です。', sad)],
        0: [t('100°は、2つの底角の合計です。△ABD の角は、50°と40°と、残りの90°です。', { ft: 'normal' })],
        ok: [t('正解！ △ABD で、180°−50°−40°＝90°。支柱は、地面に、垂直に立ちます。', { ft: 'happy' }), b('ほんとに、まっすぐ立つんだね！', { fb: 'surprised', up: true })],
        wrong: [t('50°と40°は、△ABD の、ほかの2つの角です。残りは、180°−50°−40°＝90°です。', { ft: 'normal' })] }),

    t('これは、偶然ではありません。前の時間に示した、△ABD≡△ACD から、BD＝CD と、∠ADB＝∠ADC がわかります。', { ft: 'normal', point: false,
      draw: [G('g1', right1)] }),
    t('∠ADB と ∠ADC は、合わせて180°で、等しいので、どちらも90°。つまり、AD は、底辺 BC を、垂直に2等分します。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '二等辺三角形の\n頂角の二等分線は\n底辺を垂直に2等分する', t: 5.0 }] }),

    /* ---------- 問3（性質のことば）---------- */
    Q('q3', t('問題です。二等辺三角形の、頂角の二等分線について、正しいものは、どれでしょう。', { ft: 'normal' }),
      [{ t: '底角を、2等分する' }, { t: '底辺と、平行になる' }, { t: '等しい2辺と、同じ長さになる' }, { t: '底辺を、垂直に2等分する', ok: true }],
      { 0: [t('2等分されるのは、頂角です。底角ではありません。底角は、50°と50°で、もともと等しいのです。', { ft: 'normal' })],
        2: [b('テントの支柱は、屋根の布と、同じ長さでしょ？', { fb: 'happy', up: true }), t('支柱 AD は、屋根の布 AB より、短くなります。底辺までの、最短の長さだからです。', sad)],
        ok: [t('正解！ 頂角の二等分線は、底辺の真ん中を通り、底辺に垂直です。', { ft: 'happy' }), b('真ん中で、まっすぐ、なんだね！', { fb: 'star', up: true })],
        wrong: [t('頂角の二等分線は、頂点から底辺へ、のびます。底辺と交わり、平行にはなりません。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：長さ ---------- */
    t('次は、長さです。屋根の布 AB と AC は、どちらも5メートル。地面 BC は6メートル。支柱 AD は、4メートルです。', { clear: true, cols: [0.34, 0.66], part: '長さを求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AD は ∠A の二等分線\nBD の長さは？', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', body2)] }),

    /* ---------- 問4（BD）---------- */
    Q('q4', t('問題です。BD の長さは、何メートルでしょう。', { ft: 'normal' }),
      [{ t: '3メートル', ok: true }, { t: '4メートル' }, { t: '5メートル' }, { t: '6メートル' }],
      { 1: [t('4メートルは、支柱 AD の長さです。BD は、地面 BC＝6メートルを、2等分した、3メートルです。', { ft: 'normal' })],
        2: [b('屋根の布が5メートルだから、BDも、5メートルでしょ？', { fb: 'happy', up: true }), t('5メートルは、AB の長さです。BD は、地面の上の長さで、BC を半分にした、3メートルです。', sad)],
        ok: [t('正解！ AD は、BC を2等分します。BD＝6÷2＝3メートルです。', { ft: 'happy' }), b('地面を、半分こ、するんだね！', { fb: 'star', up: true })],
        wrong: [t('6メートルは、BC 全体の長さです。BD は、その半分で、3メートルです。', { ft: 'normal' })] }),

    /* ---------- 3ページ目：底角から頂角 ---------- */
    t('では、反対に、底角から、頂角を求めましょう。二等辺三角形 PQR で、PQ＝PR、底角 ∠Q は、35°です。', { clear: true, cols: [0.34, 0.66], part: '底角から頂角へ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'PQ＝PR　∠Q＝35°\n∠P は何度？', t: 4.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', body3)] }),

    /* ---------- 問5（頂角）---------- */
    Q('q5', t('最後の問題です。頂角 ∠P は、何度でしょう。', { ft: 'happy' }),
      [{ t: '145°' }, { t: '110°', ok: true }, { t: '70°' }, { t: '35°' }],
      { 0: [b('180から35をひいて、145度でしょ？', { fb: 'happy', up: true }), t('それは、底角を、1つしか、ひいていません。底角は2つあるので、180°−35°×2＝110°です。', sad)],
        2: [t('70°は、2つの底角を、合わせた大きさです。頂角は、残りで、180°−70°＝110°です。', { ft: 'normal' })],
        ok: [t('正解！ 底角は、どちらも35°。頂角は、180°−35°×2＝110°です。', { ft: 'happy' }), b('底角を、2回ひくんだね！', { fb: 'star', up: true })],
        wrong: [t('35°は、底角です。頂角は、180°−35°×2＝110°です。', { ft: 'normal' })] }),

    t('二等辺三角形では、頂角の二等分線が、底辺を垂直に2等分します。底角が等しいことも、角の計算に使えます。', { ft: 'normal', point: false,
      draw: [G('g3', more3)],
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '頂角の二等分線は\n底辺を垂直に2等分\n頂角＝180°−底角×2', t: 5.0 }] }),
    b('テントの形で、ぜんぶ、わかった！ さあ、カレーを、作ろう！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
