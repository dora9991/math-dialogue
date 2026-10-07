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
  // 角の印：頂点 v で、v→p と v→q のあいだの円弧を n 本（gap：両はしを、その度だけ短くする）
  const ang = (v, p, q, r, n, c, gap) => {
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]) / R, a2 = Math.atan2(q[1] - v[1], q[0] - v[0]) / R, g = gap || 0;
    const d = ((a2 - a1 + 540) % 360) - 180, s0 = (((d > 0 ? a1 : a1 + d) % 360) + 360) % 360 + g;
    return Array.from({ length: n }, (_, i) => ({ k: 'ell', o: v, rx: r + i * 7 / U, ry: r + i * 7 / U, a1: s0, a2: s0 + Math.abs(d) - 2 * g, c, wd: 3 }));
  };
  // 直角の印：頂点 v、v→p と v→q が直角
  const rt = (v, p, q, c) => { const u = x => { const l = Math.hypot(x[0] - v[0], x[1] - v[1]); return [(x[0] - v[0]) / l, (x[1] - v[1]) / l]; }; return { k: 'right', at: v, u: u(p), v: u(q), s: 15, c: c || 'w' }; };
  /* ---- 読み上げ（say）：記号と英字を、ひらがな・カタカナの読みにする ---- */
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const plainS = s => s.replace(/\{\{|\}\}|\*\*/g, '');
  const KS = { a: 'エー', b: 'ビー', c: 'シー', x: 'エックス', y: 'ワイ' };
  const rd = s => plainS(s)
    .replace(/[①-⑤]+/g, m => m.length === 1 ? 'まる' + ['いち', 'に', 'さん', 'よん', 'ご']['①②③④⑤'.indexOf(m)] + '、' : [...m].map(c => ['いち', 'に', 'さん', 'よん', 'ご']['①②③④⑤'.indexOf(c)]).join('、') + '、')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/≡/g, ' 合同 ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ')
    .replace(/(?<=[0-9°A-Za-z）)])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/²/g, 'の2乗').replace(/(?<=[0-9])m(?![a-z])/g, 'メートル')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const t = wrap(T), b = wrap(B);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  /* 中2 5章 三角形と四角形　第6時（例）「直角三角形の合同を使って証明しよう」。自作。
     △ABC（AB＝AC）：B(0,0)，C(6,0)，A(3,4.4)，M(3,0)（BC の中点）。M から AB，AC への垂線の足 D，E → MD＝ME。
     △MBD と △MCE：∠MDB＝∠MEC＝90°，BM＝CM（斜辺），∠B＝∠C（底角）→ 斜辺と1つの鋭角 → MD＝ME。
     類題：∠XOY の二等分線 OP 上の点 P から OX，OY への垂線 PA，PB → PA＝PB（斜辺 OP 共通，∠POA＝∠POB）。 */
  const foot = (p, a, c) => { const dx = c[0] - a[0], dy = c[1] - a[1], k = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy); return [a[0] + k * dx, a[1] + k * dy]; };
  const pA = [3, 4.4], pB = [0, 0], pC = [6, 0], pM = [3, 0], pD = foot(pM, pB, pA), pE = foot(pM, pC, pA);
  const oO = [0, 0], oX = [4.6 * Math.cos(30 * R), 4.6 * Math.sin(30 * R)], oY = [4.6 * Math.cos(30 * R), -4.6 * Math.sin(30 * R)], oP = [3.4, 0], oA = foot(oP, oO, oX), oB = foot(oP, oO, oY);
  const f1 = FG('g1', -1.1, -1.0, 7.1, 5.1), f2 = FG('g2', -1.1, -1.0, 7.1, 5.1), f3 = FG('g3', -1.1, -1.0, 7.1, 5.1), f4 = FG('g4', -0.9, -2.9, 5.4, 2.9);
  const garden = [tri([pA, pB, pC], 'w'), dn(pA, 'A', [0, 1]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7]), dn(pM, 'M', [0, -1]), tick(pB, pA, 1, 'y'), tick(pC, pA, 1, 'y'), tick(pB, pM, 2, 'g'), tick(pC, pM, 2, 'g')];
  const hose = [ln(pM, pD, 'b', { wd: 4 }), ln(pM, pE, 'b', { wd: 4 }), dn(pD, 'D', [-0.8, 0.5]), dn(pE, 'E', [0.8, 0.5]), rt(pD, pM, pB, 'b'), rt(pE, pM, pC, 'b')];
  const baseAng = [ang(pB, pC, pA, 0.9, 1, 'p'), ang(pC, pB, pA, 0.9, 1, 'p')];
  const triL = tri([pM, pB, pD], 'p', 'p', { temp: true }), triR = tri([pM, pC, pE], 'b', 'b', { temp: true });
  const eqHose = [tick(pM, pD, 3, 'b'), tick(pM, pE, 3, 'b')];
  const bis = [ln(oO, oX, 'w'), ln(oO, oY, 'w'), ln(oO, [4.6, 0], 'w', { dash: true }), dn(oO, 'O', [-0.8, 0]), dn(oX, 'X', [0.7, 0.5]), dn(oY, 'Y', [0.7, -0.5]), dn(oP, 'P', [0.2, 0.9]),
    ang(oO, oX, oP, 1.0, 1, 'g'), ang(oO, oP, oY, 1.0, 1, 'g')];
  const perp = [ln(oP, oA, 'b', { wd: 4 }), ln(oP, oB, 'b', { wd: 4 }), dn(oA, 'A', [-0.2, 0.9]), dn(oB, 'B', [-0.2, -0.9]), rt(oA, oP, oO, 'b'), rt(oB, oP, oO, 'b')];
  const triPOA = tri([oP, oO, oA], 'p', 'p', { temp: true }), triPOB = tri([oP, oO, oB], 'b', 'b', { temp: true });
  const eqPerp = [tick(oP, oA, 3, 'b'), tick(oP, oB, 3, 'b')];

  KL.lesson({ id: 'g2u5-06', unit: '中2　三角形と四角形', kick: '2年5章　第6時', title: '直角三角形の合同を使って証明しよう', card: '直角三角形の合同を使って証明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、直角三角形の合同を使って、辺の長さが等しいことを、証明します。', { title: true, point: false, ft: 'happy' }),
    b('水飲み場から、ホースを、のばす話だね！ 長さは、ぼくの歩幅で、はかるよ！', { title: true, fb: 'star', up: true }),
    t('歩幅で、はかる前に、まず、図を見ましょう。どんな三角形が、ひそんでいるかが、ポイントです。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。ポンタの三角形の庭 ABC は、AB＝AC の二等辺三角形です。底辺 BC の真ん中の点 M に、水飲み場があります。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '直角三角形の合同を使って\n辺が等しいことを証明しよう', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', garden)] }),
    t('M から、柵 AB と AC へ、垂直に、ホースをのばします。柵にとどく点を、D、E とします。MD＝ME を、証明しましょう。', { ft: 'normal', point: false,
      draw: [G('g1', hose)] }),
    b('ホースの長さなら、ぼくが、歩いて数えたよ！ どっちも、17歩！ もう、証明、おしまいだね！', { fb: 'proud', up: true }),
    t('数えたのは、この庭の、1回だけです。どんな二等辺三角形でも、いえるように、証明しましょう。', { ft: 'normal', point: false }),

    /* ---------- 2ページ目：証明 ---------- */
    t('まず、仮定と結論です。仮定は、AB＝AC、BM＝CM、MD は AB に垂直、ME は AC に垂直。結論は、MD＝ME です。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB＝AC　BM＝CM\nMD⊥AB　ME⊥AC', t: 4.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'MD＝ME', t: 3.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', garden, hose)] }),

    /* ---------- 問1（どの三角形？）---------- */
    Q('q1', t('問題です。MD＝ME を示すために、MD と ME を辺にもつ、合同な三角形の組は、どれでしょう。', { ft: 'normal' }),
      [{ t: '△ABM と △ACM' }, { t: '△MBD と △MCE', ok: true }, { t: '△ABC と △MDE' }, { t: '△MBD と △MCD' }],
      { 0: [b('△ABM と △ACM なら、仮定が、ぜんぶ使えるよ！', { fb: 'happy', up: true }), t('その2つも、合同です。でも、MD と ME が、辺に入っていません。MD、ME を辺にもつ、三角形を、比べます。', sad)],
        ok: [t('正解！ △MBD の辺 MD と、△MCE の辺 ME が、対応します。この2つの合同を、示します。', { ft: 'happy' }), b('2つの直角三角形だね！', { fb: 'star', up: true })],
        wrong: [t('MD と ME が、どちらも辺に入る、組を選びます。△MBD と △MCE です。', { ft: 'normal' })] }),

    t('△MBD と △MCE において、仮定より、∠MDB＝∠MEC＝90°です。これを、①とします。', { ft: 'normal', point: false, draw: [G('g2', triL, triR)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '△MBD と △MCE において\n仮定より\n∠MDB＝∠MEC＝90°　…①', t: 4.5 }] }),
    t('M は BC の真ん中の点ですから、BM＝CM です。これを、②とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '仮定より　BM＝CM　…②', t: 3.0 }] }),
    b('∠B と ∠C も、図で見ると、同じ大きさに、見えるよ！ 同じって、書いちゃおう！', { fb: 'happy', up: true }),
    t('見た目では、根拠になりません。AB＝AC ですから、二等辺三角形の底角は等しい、という定理を、使います。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),

    /* ---------- 問2（∠B＝∠C の根拠）---------- */
    Q('q2', t('問題です。∠B＝∠C といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '仮定より' }, { t: '対頂角は、等しいから' }, { t: '図で同じに見えるから' }, { t: '二等辺三角形の底角は等しい', ok: true }],
      { ok: [t('正解！ AB＝AC の二等辺三角形ですから、底角 ∠B と ∠C は、等しいです。', { ft: 'happy' }), b('第1時の定理が、ここで、役に立つんだね！', { fb: 'star', up: true })],
        wrong: [t('∠B＝∠C は、仮定ではありません。AB＝AC から、二等辺三角形の底角は等しい、という定理で、いえます。', { ft: 'normal' })] }),

    t('これを、③とします。①②③が、そろいました。次のページで、合同条件を、考えましょう。', { ft: 'normal', point: false, draw: [G('g2', baseAng)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '二等辺三角形の底角は\n等しいから　∠B＝∠C　…③', t: 4.0 }] }),

    /* ---------- 3ページ目：合同から結論へ ---------- */
    t('△MBD の斜辺は、BM。△MCE の斜辺は、CM です。①の直角を、頼りに、条件を探します。', { clear: true, cols: [0.34, 0.66], part: '合同から結論へ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'そろった条件', text: '①∠MDB＝∠MEC＝90°\n②BM＝CM（斜辺）\n③∠B＝∠C', t: 5.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', garden, hose, baseAng, triL, triR)] }),

    /* ---------- 問3（合同条件）---------- */
    Q('q3', t('問題です。①②③から、使える合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '斜辺と1つの鋭角がそれぞれ等しい', ok: true }, { t: '斜辺と他の1辺がそれぞれ等しい' }, { t: '3組の辺がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい' }],
      { 1: [b('斜辺 BM＝CM と、あと1辺で、いいんでしょ？', { fb: 'happy', up: true }), t('他の1辺が等しいかは、まだ、わかっていません。わかっているのは、斜辺と、1つの鋭角、∠B＝∠C です。', sad)],
        ok: [t('正解！ 直角三角形で、斜辺 BM＝CM と、鋭角 ∠B＝∠C が、それぞれ等しいです。', { ft: 'happy' }), b('直角三角形の、合同条件だね！', { fb: 'star', up: true })],
        wrong: [t('等しいとわかっている辺は、斜辺の1組だけです。3組の辺も、2組の辺とその間の角も、使えません。', { ft: 'normal' })] }),

    t('①②③より、直角三角形で、斜辺と、1つの鋭角が、それぞれ等しいから、△MBD≡△MCE です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①②③より、直角三角形で\n斜辺と1つの鋭角が\nそれぞれ等しいから\n△MBD≡△MCE', t: 5.0 }] }),
    t('合同な図形では、対応する辺は、等しいですね。MD と ME は、対応していますから、MD＝ME です。', { ft: 'normal', point: false, draw: [G('g3', eqHose)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '対応する辺は等しいから\nMD＝ME', t: 3.5 }] }),

    /* ---------- 4ページ目：類題 ---------- */
    t('では、類題です。∠XOY の、二等分線 OP 上に、点 P をとります。P から、OX、OY へ、垂線 PA、PB を、ひきます。', { clear: true, cols: [0.34, 0.66], part: '類題', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'OP は ∠XOY の二等分線\nPA⊥OX　PB⊥OY\nPA＝PB を示そう', t: 5.0 }, Object.assign(f4, { prims: [] })], draw: [G('g4', bis, perp)] }),
    t('△POA と △POB に注目します。∠PAO＝∠PBO＝90°。OP は、共通で、どちらの斜辺です。∠POA＝∠POB です。', { ft: 'normal', point: false, draw: [G('g4', triPOA, triPOB)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '条件', text: '∠PAO＝∠PBO＝90°\nOP は共通（斜辺）\n∠POA＝∠POB', t: 5.0 }] }),

    /* ---------- 問4（類題・合同条件）---------- */
    Q('q4', t('問題です。△POA≡△POB を示す、合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '斜辺と他の1辺がそれぞれ等しい' }, { t: '3組の辺がそれぞれ等しい' }, { t: '斜辺と1つの鋭角がそれぞれ等しい', ok: true }, { t: '2組の辺とその間の角がそれぞれ等しい' }],
      { 0: [b('OA＝OB も、見た目で、同じでしょ？ 斜辺と他の1辺で、いこう！', { fb: 'happy', up: true }), t('OA＝OB は、見た目では、根拠になりません。わかっているのは、斜辺 OP と、鋭角 ∠POA＝∠POB です。', sad)],
        ok: [t('正解！ 斜辺 OP が共通。鋭角 ∠POA＝∠POB。斜辺と1つの鋭角が、それぞれ等しいです。', { ft: 'happy' }), b('PA＝PB が、いえたね！', { fb: 'star', up: true })],
        wrong: [t('等しいとわかっている辺は、斜辺 OP の1組だけです。3組の辺も、2組の辺とその間の角も、使えません。', { ft: 'normal' })] }),

    t('よって、△POA≡△POB。対応する辺は等しいので、PA＝PB です。角の二等分線上の点から、2辺までの長さは、等しいのです。', { ft: 'normal', point: false, draw: [G('g4', eqPerp)] }),

    /* ---------- 問5（Pを動かす）---------- */
    Q('q5', t('最後の問題です。点 P を、OP 上で、動かしても、PA＝PB は、成り立つでしょうか。', { ft: 'happy' }),
      [{ t: 'OP の真ん中でだけ成り立つ' }, { t: 'どの位置でも成り立つ', ok: true }, { t: 'O に近いときだけ成り立つ' }, { t: '動かすと成り立たなくなる' }],
      { 0: [b('ぼくは、OP の真ん中で、歩いて数えたよ！ そこだけだと思う！', { fb: 'happy', up: true }), t('証明では、P の位置を、決めていません。OP 上の、どこでも、同じ証明が使えます。', sad)],
        ok: [t('正解！ P の位置を、決めずに、証明しました。OP 上の、どこに P があっても、PA＝PB です。', { ft: 'happy' }), b('1回だけじゃなくて、全部に通じるのが、証明なんだね！', { fb: 'star', up: true })],
        wrong: [t('証明は、P の位置を、決めずに行いました。OP 上の、どこでも、成り立ちます。', { ft: 'normal' })] }),

    t('直角三角形の合同条件は、直角が、すでにある、図形の証明で、力を発揮します。斜辺と、鋭角、または、他の1辺に、注目しましょう。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '直角三角形の合同条件\n①斜辺と1つの鋭角\n②斜辺と他の1辺', t: 6.0 }] }),
    b('ホース選びも、証明も、歩幅だけじゃ、ダメなんだね！ 先生、ありがとう！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
