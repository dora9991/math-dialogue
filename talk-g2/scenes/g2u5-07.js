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
  /* 中2 5章 三角形と四角形　第7時（練）「三角形の証明を、教え合って書けるようになろう」。自作。
     △ABC（AB＝AC）：B(0,0)，C(6,0)，A(3,4.2)。AB 上に D，AC 上に E，BD＝CE＝2.2。CD＝BE を証明。
     △DBC≡△ECB：BD＝CE（仮定）、∠DBC＝∠ECB（二等辺三角形の底角）、BC＝CB（共通）→ 2組の辺とその間の角。
     ポンタ先生の証明のまちがい：①図を見ると同じ ②BC＝BC を「仮定より」 ③3組の辺 ④△DBC≡△EBC（頂点の順）⑤結論の根拠なし。 */
  const pA = [3, 4.2], pB = [0, 0], pC = [6, 0];
  const LAB = Math.hypot(3, 4.2), uB = [3 / LAB, 4.2 / LAB], uC = [-3 / LAB, 4.2 / LAB];
  const pD = [pB[0] + 2.2 * uB[0], pB[1] + 2.2 * uB[1]], pE = [pC[0] + 2.2 * uC[0], pC[1] + 2.2 * uC[1]];
  const f1 = FG('g1', -1.1, -0.9, 7.1, 5.1), f2 = FG('g2', -1.1, -0.9, 7.1, 5.1), f3 = FG('g3', -1.1, -0.9, 7.1, 5.1);
  const body = [tri([pA, pB, pC], 'w'), dn(pA, 'A', [0, 1]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7]), dn(pD, 'D', [-0.9, 0.3]), dn(pE, 'E', [0.9, 0.3]),
    tick(pB, pD, 2, 'g'), tick(pC, pE, 2, 'g')];
  const cross = [ln(pC, pD, 'b', { wd: 3.6 }), ln(pB, pE, 'b', { wd: 3.6 })];
  const triL = tri([pD, pB, pC], 'p', 'p', { temp: true }), triR = tri([pE, pC, pB], 'b', 'b', { temp: true });
  const baseAng = [ang(pB, pC, pA, 0.9, 1, 'p'), ang(pC, pB, pA, 0.9, 1, 'p')];
  const eqCross = [tick(pC, pD, 3, 'b'), tick(pB, pE, 3, 'b')];

  KL.lesson({ id: 'g2u5-07', unit: '中2　三角形と四角形', kick: '2年5章　第7時', title: '三角形の証明を、教え合って書けるようになろう', card: '三角形の証明を、教え合って書けるようになろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、三角形の証明を、教え合って、書けるようになりましょう。', { title: true, point: false, ft: 'happy' }),
    b('今日は、ぼくが、先生だよ！ 証明を、書いてきたんだ！ 先生、ぼくに、教わってね！', { title: true, fb: 'proud', up: true }),
    t('では、ポンタ先生の証明を、いっしょに、チェックします。まちがいを、直しながら、進めましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。AB＝AC の二等辺三角形 ABC です。辺 AB、AC 上に、BD＝CE となる点 D、E を、とります。CD＝BE を、証明しましょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB＝AC　BD＝CE', t: 3.5 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'CD＝BE', t: 3.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', body, cross)] }),
    b('この問題、証明、いらないよ！ 図を見れば、CD と BE は、同じ長さに見える！ 1行で、おしまい！', { fb: 'happy', up: true }),
    t('見た目は、根拠になりません。「同じに見える」だけでは、証明に、なりませんよ。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),

    /* ---------- 2ページ目：ポンタ先生の証明 ---------- */
    t('では、ポンタ先生が、書いてきた証明を、見てみましょう。まちがいが、いくつか、かくれています。', { clear: true, cols: [0.34, 0.66], part: 'ポンタ先生の証明', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'ポンタ先生', text: '△DBC と △EBC において\nBD＝CE　（仮定）\n∠DBC＝∠ECB（図で同じ）\nBC＝BC　（仮定より）\n3組の辺が等しいから\n△DBC≡△EBC\nよって　CD＝BE', t: 7.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', body, cross)] }),
    t('ひとつずつ、直していきます。まず、3行目の、「図で同じ」からです。D は AB 上、E は AC 上なので、∠DBC は ∠B、∠ECB は ∠C です。', { ft: 'normal', point: false, draw: [G('g2', baseAng)] }),

    /* ---------- 問1（3行目）---------- */
    Q('q1', t('問題です。∠DBC＝∠ECB の、正しい根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '仮定より' }, { t: '共通な辺だから' }, { t: '二等辺三角形の底角は等しい', ok: true }, { t: '対頂角は、等しいから' }],
      { 0: [b('仮定に、∠B＝∠C って、あったよね？', { fb: 'happy', up: true }), t('仮定は、AB＝AC と BD＝CE です。∠B＝∠C は、AB＝AC から、二等辺三角形の底角は等しい、でいえることです。', sad)],
        ok: [t('正解！ AB＝AC ですから、二等辺三角形の底角は、等しいです。「図で同じ」は、根拠ではありません。', { ft: 'happy' }), b('見た目は、ダメなんだね！', { fb: 'surprised', up: true })],
        wrong: [t('∠B と ∠C は、辺ではなく、角で、対頂角でもありません。AB＝AC から、二等辺三角形の底角は等しい、といえます。', { ft: 'normal' })] }),

    /* ---------- 問2（4行目）---------- */
    Q('q2', t('問題です。4行目、BC＝BC の根拠は、「仮定より」ではありません。正しいのは、どれでしょう。', { ft: 'normal' }),
      [{ t: '定義より' }, { t: '共通な辺だから', ok: true }, { t: '合同だから' }, { t: '二等辺三角形だから' }],
      { 2: [b('△DBC と △EBC は、合同だから、BC＝BC でしょ？', { fb: 'happy', up: true }), t('合同は、まだ、示していません。これから示すことを、根拠に使うのは、順番が逆です。', sad)],
        ok: [t('正解！ BC は、2つの三角形に、共通な辺です。仮定には、BC＝BC は、ありません。', { ft: 'happy' }), b('同じ辺を、2回、使うんだね！', { fb: 'star', up: true })],
        wrong: [t('BC＝BC は、定義でも、二等辺三角形の性質でも、ありません。2つの三角形に共通な辺だから、等しいのです。', { ft: 'normal' })] }),

    /* ---------- 問3（5行目）---------- */
    Q('q3', t('問題です。BD＝CE、∠DBC＝∠ECB、BC＝CB。この3つから使える、合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい', ok: true }],
      { 0: [b('辺が3組、そろってるよ！ CD＝BE も、図で同じだし！', { fb: 'happy', up: true }), t('CD＝BE は、これから証明する、結論です。使えません。使える辺は、BD＝CE と BC の、2組です。', sad)],
        ok: [t('正解！ BD と BC の間の角が ∠DBC、CE と CB の間の角が ∠ECB。2組の辺と、その間の角が、等しいです。', { ft: 'happy' }), b('辺・角・辺、そろってるね！', { fb: 'star', up: true })],
        wrong: [t('そろっているのは、2組の辺と、その間の角です。3組の角は、合同条件では、ありません。両端の角は、わかっていません。', { ft: 'normal' })] }),

    /* ---------- 問4（合同の式の順番）---------- */
    Q('q4', t('問題です。合同の式は、対応する頂点を、同じ順に書きます。△DBC に合同な、正しい式は、どれでしょう。', { ft: 'normal', draw: [G('g2', triL, triR)] }),
      [{ t: '△DBC≡△ECB', ok: true }, { t: '△DBC≡△EBC' }, { t: '△DBC≡△BCE' }, { t: '△DBC≡△CBE' }],
      { 1: [b('ぼくの書いたのが、アルファベット順で、読みやすいよ！', { fb: 'happy', up: true }), t('読みやすさでは、ありません。対応を、見ます。D と E、B と C、C と B が、それぞれ、対応します。', sad)],
        ok: [t('正解！ D と E、B と C、C と B が対応するので、△DBC≡△ECB です。', { ft: 'happy' }), b('頂点の順番が、大事なんだね！', { fb: 'star', up: true })],
        wrong: [t('頂点の順番が、対応していません。D は E に、B は C に、C は B に、対応します。', { ft: 'normal' })] }),

    /* ---------- 3ページ目：直した証明 ---------- */
    t('ポンタ先生の証明が、直りました。まとめて、書き直しましょう。まず、△DBC と △ECB で、仮定より、BD＝CE です。', { clear: true, cols: [0.34, 0.66], part: '直した証明', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '△DBC と △ECB において\n仮定より　BD＝CE　…①', t: 4.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', body, cross, triL, triR)] }),
    t('次に、二等辺三角形の底角は、等しいので、∠DBC＝∠ECB です。BC は、共通な辺で、BC＝CB です。', { ft: 'normal', point: false, draw: [G('g3', baseAng)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '底角は等しいから\n∠DBC＝∠ECB　…②\n共通な辺　BC＝CB　…③', t: 5.0 }] }),
    t('①②③より、2組の辺と、その間の角が、それぞれ等しいから、△DBC≡△ECB です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①②③より、2組の辺と\nその間の角が等しいから\n△DBC≡△ECB', t: 4.5 }] }),

    /* ---------- 問5（結論の根拠）---------- */
    Q('q5', t('最後の問題です。「よって CD＝BE」に、そえる根拠は、どれでしょう。', { ft: 'happy' }),
      [{ t: '仮定より' }, { t: '共通な辺だから' }, { t: '対応する辺は等しいから', ok: true }, { t: '二等辺三角形だから' }],
      { 3: [b('二等辺三角形だから、辺が等しいんでしょ？', { fb: 'happy', up: true }), t('CD と BE は、二等辺三角形の、2辺では、ありません。合同な三角形の、対応する辺だから、等しいのです。', sad)],
        ok: [t('正解！ △DBC≡△ECB で、CD と BE は、対応する辺です。対応する辺は、等しいですね。', { ft: 'happy' }), b('これで、証明の完成だね！', { fb: 'star', up: true })],
        wrong: [t('CD＝BE は、仮定にも、共通な辺にも、ありません。合同な図形の、対応する辺だから、等しいのです。', { ft: 'normal' })] }),

    t('結論の行にも、根拠が必要です。「対応する辺は等しいから、CD＝BE」と、書きます。', { ft: 'normal', point: false, draw: [G('g3', eqCross)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '対応する辺は等しいから\nCD＝BE', t: 3.5 }] }),
    t('では、最後に、ポンタ先生に、直した証明を、説明してもらいましょう。', { ft: 'happy', point: false }),
    b('えーと、△DBC と △ECB で、BD＝CE。底角が等しくて、BC は共通。2組の辺と、その間の角が、等しいから、合同！ だから、CD＝BE！', { fb: 'proud', up: true }),
    t('すばらしい！ 教えられるようになれば、本当に、わかった証拠です。', { ft: 'proud', point: false }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
