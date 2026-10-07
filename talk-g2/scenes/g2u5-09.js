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
  /* 中2 5章 三角形と四角形　第9時（例）「平行四辺形の性質を使って証明しよう」。自作。
     平行四辺形 ABCD：B(0,0)，C(6,0)，A(1.3,3.5)，D(7.3,3.5)，O＝対角線の交点(3.65,1.75)。
     ③対角線は中点で交わる：△OAB≡△OCD（AB＝CD，∠OAB＝∠OCD，∠OBA＝∠ODC）。
     点 O を通る直線が AD，BC と交わる点 E，F：△OAE≡△OCF（OA＝OC，対頂角，錯角）→ OE＝OF。E(2.98,3.5)，F＝2O−E。
     類題：AB＝5，BC＝6，AC＝8 の平行四辺形（A(−0.25,4.994)）で AO＝4。 */
  const pB = [0, 0], pC = [6, 0], pA = [1.3, 3.5], pD = [7.3, 3.5], pO = [3.65, 1.75];
  const pE = [pA[0] + 0.28 * (pD[0] - pA[0]), 3.5], pF = [2 * pO[0] - pE[0], 2 * pO[1] - pE[1]];
  const q = 25 + 36 - 64, nx = q / 12, ny = Math.sqrt(25 - nx * nx);
  const nB = [0, 0], nC = [6, 0], nA = [nx, ny], nD = [nx + 6, ny], nO = [(nA[0] + nC[0]) / 2, (nA[1] + nC[1]) / 2];
  const f1 = FG('g1', -1.1, -0.9, 8.5, 4.8), f2 = FG('g2', -1.1, -0.9, 8.5, 4.8), f3 = FG('g3', -1.1, -0.9, 8.5, 4.8), f4 = FG('g4', -1.1, -0.9, 8.5, 4.8), f5 = FG('g5', -1.1, -0.9, 8.5, 4.8), f6 = FG('g6', -1.6, -0.9, 7.8, 5.9);
  const names = [dn(pA, 'A', [-0.7, 0.7]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7]), dn(pD, 'D', [0.7, 0.7])];
  const para = [tri([pA, pB, pC, pD], 'w'), names];
  const marks = [par(pB, pA, 1, 'b'), par(pC, pD, 1, 'b'), par(pB, pC, 2, 'b'), par(pA, pD, 2, 'b')];
  const diags = [ln(pA, pC, 'w'), ln(pB, pD, 'w'), dn(pO, 'O', [0.8, -0.5])];
  const triOAB = tri([pO, pA, pB], 'p', 'p', { temp: true }), triOCD = tri([pO, pC, pD], 'b', 'b', { temp: true });
  const altOAB = [ang(pA, pB, pO, 0.9, 1, 'g'), ang(pC, pD, pO, 0.9, 1, 'g'), ang(pB, pA, pO, 0.9, 2, 'p'), ang(pD, pC, pO, 0.9, 2, 'p')];
  const eqAB = [tick(pA, pB, 1, 'y'), tick(pD, pC, 1, 'y')];
  const eqO = [tick(pO, pA, 2, 'g'), tick(pO, pC, 2, 'g'), tick(pO, pB, 3, 'b'), tick(pO, pD, 3, 'b')];
  const line = [ln(pE, pF, 'y', { wd: 3.6 }), dn(pE, 'E', [0, 1]), dn(pF, 'F', [0, -1])];
  const triOAE = tri([pO, pA, pE], 'p', 'p', { temp: true }), triOCF = tri([pO, pC, pF], 'b', 'b', { temp: true });
  const vert = [ang(pO, pA, pE, 0.55, 1, 'g'), ang(pO, pC, pF, 0.55, 1, 'g')];
  const altAE = [ang(pA, pO, pE, 0.9, 2, 'p'), ang(pC, pO, pF, 0.9, 2, 'p')];
  const eqOEF = [tick(pO, pE, 3, 'y'), tick(pO, pF, 3, 'y')];
  const numFig = [tri([nA, nB, nC, nD], 'w'), dn(nA, 'A', [-0.7, 0.7]), dn(nB, 'B', [-0.7, -0.7]), dn(nC, 'C', [0.7, -0.7]), dn(nD, 'D', [0.7, 0.7]), ln(nA, nC, 'w'), ln(nB, nD, 'w'), dn(nO, 'O', [0.8, -0.5]),
    tx([-0.45, 2.2], '5cm', 'y', 'end', 26), tx([3, -0.62], '6cm', 'y', 'middle', 26), tx([nO[0] - 0.35, nO[1] + 0.55], '8cm', 'g', 'end', 26)];

  KL.lesson({ id: 'g2u5-09', unit: '中2　三角形と四角形', kick: '2年5章　第9時', title: '平行四辺形の性質を使って証明しよう', card: '平行四辺形の性質を使って証明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、平行四辺形の性質を、使って、証明をします。対角線の性質も、証明しましょう。', { title: true, point: false, ft: 'happy' }),
    b('ようかんを、真ん中の点を通る包丁で、切るよ！ どこで切っても、2つに分かれた長さは、同じだよね！', { title: true, fb: 'star', up: true }),
    t('おいしそうな話ですね。その直感が、本当に正しいか、証明で、確かめましょう。まずは、対角線の性質からです。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('前の時間に、予想した、対角線の性質を、証明します。平行四辺形 ABCD の、対角線の交点を、O とします。', { part: '対角線の性質を証明', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB∥DC　AD∥BC', t: 3.5 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'OA＝OC　OB＝OD', t: 3.5 }, Object.assign(f1, { prims: [] })], draw: [G('g1', para, marks, diags)] }),
    t('△OAB と △OCD を、比べます。まず、辺 AB と CD です。この2つが等しいことは、どうやって、いえるでしょうか。', { ft: 'normal', point: false, draw: [G('g1', triOAB, triOCD)] }),

    /* ---------- 問1（AB＝CD の根拠）---------- */
    Q('q1', t('問題です。AB＝CD といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '仮定より' }, { t: '平行四辺形の対辺は等しい', ok: true }, { t: '平行線の錯角は等しいから' }, { t: '共通な辺だから' }],
      { 0: [b('AB∥DC が仮定だから、AB＝CD も、仮定でいいよね？', { fb: 'happy', up: true }), t('仮定は、平行で、等しいとは、書いてありません。等しいことは、前の時間に、証明した性質で、いえます。', sad)],
        ok: [t('正解！ 平行四辺形の対辺は、等しい。前の時間に、証明した性質を、使います。', { ft: 'happy' }), b('証明した性質は、次の証明で、使えるんだね！', { fb: 'star', up: true })],
        wrong: [t('錯角は、角の話です。AB と CD は、辺です。共通な辺でも、ありません。対辺だから、等しいのです。', { ft: 'normal' })] }),

    t('次に、AB∥DC ですから、錯角が等しく、∠OAB＝∠OCD、∠OBA＝∠ODC です。これを、②③とします。', { ft: 'normal', point: false, draw: [G('g1', altOAB)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '△OAB と △OCD において\n平行四辺形の対辺は\n等しいから　AB＝CD　…①', t: 5.0 }, { col: 0, type: 'text', size: 'xs', text: '平行線の錯角は等しいから\n∠OAB＝∠OCD　…②\n∠OBA＝∠ODC　…③', t: 5.0 }] }),

    /* ---------- 2ページ目：対角線の性質の結論 ---------- */
    t('①②③より、1組の辺と、その両端の角が、それぞれ等しいから、△OAB≡△OCD です。', { clear: true, cols: [0.34, 0.66], part: '合同から結論へ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ここまで', text: '①AB＝CD\n②∠OAB＝∠OCD\n③∠OBA＝∠ODC', t: 4.0 }, { col: 0, type: 'text', size: 'xs', text: '①②③より、1組の辺と\nその両端の角が等しいから\n△OAB≡△OCD', t: 4.5 }, Object.assign(f2, { prims: [] })],
      draw: [G('g2', para, diags, altOAB, eqAB, triOAB, triOCD)] }),
    t('対応する辺は、等しいので、OA＝OC、OB＝OD です。対角線は、それぞれの中点で、交わります。性質③が、証明できました。', { ft: 'normal', point: false, draw: [G('g2', eqO)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '対応する辺は等しいから\nOA＝OC　OB＝OD', t: 4.0 }] }),

    /* ---------- 3ページ目：使う ---------- */
    t('では、この性質を、使います。点 O を通る直線が、辺 AD、BC と交わる点を、E、F とします。OE＝OF を、証明しましょう。', { clear: true, cols: [0.34, 0.66], part: '性質を使って証明', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'ABCD は平行四辺形\nE，O，F は一直線', t: 4.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'OE＝OF', t: 3.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', para, marks, diags, line)] }),
    b('E を、5回、動かしてみたよ！ 5回とも、OE＝OF だった！ もう、証明、いらないね！', { fb: 'proud', up: true }),
    t('5回、確かめても、すべての E の位置は、確かめられません。証明は、E がどこにあっても、いえるように、書きます。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),

    /* ---------- 問2（三角形）---------- */
    Q('q2', t('問題です。OE＝OF を示すために、OE と OF を辺にもつ、合同な三角形の組は、どれでしょう。', { ft: 'normal' }),
      [{ t: '△OAB と △OCD' }, { t: '△OAE と △OCE' }, { t: '△OAE と △OCF', ok: true }, { t: '△OAD と △OCB' }],
      { 0: [t('△OAB と △OCD も、合同です。でも、OE と OF が、辺に入っていません。OE、OF を辺にもつ組を、選びます。', { ft: 'normal' })],
        ok: [t('正解！ △OAE の辺 OE と、△OCF の辺 OF が、対応します。この2つの合同を、示します。', { ft: 'happy', draw: [G('g3', triOAE, triOCF)] }), b('点 O を、はさんで、向かい合う三角形だね！', { fb: 'star', up: true })],
        wrong: [t('OE と OF が、それぞれ辺に入る、組を選びます。OE は △OAE、OF は △OCF の辺です。', { ft: 'normal' })] }),

    /* ---------- 4ページ目：証明 ---------- */
    t('△OAE と △OCF において、まず、平行四辺形の対角線は、中点で交わるので、OA＝OC です。これを、①とします。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '△OAE と △OCF において\n対角線は中点で交わるから\nOA＝OC　…①', t: 5.0 }, Object.assign(f4, { prims: [] })], draw: [G('g4', para, marks, diags, line, triOAE, triOCF)] }),

    /* ---------- 問3（対頂角）---------- */
    Q('q3', t('問題です。∠AOE＝∠COF といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '錯角は、等しいから' }, { t: '共通な角だから' }, { t: '対頂角は、等しいから', ok: true }, { t: '仮定より' }],
      { 0: [t('錯角は、平行な2直線に、1本の直線が交わる、ときの角です。AC と EF は、平行では、ありません。', { ft: 'normal' })],
        ok: [t('正解！ AC と EF が、O で交わってできる、向かい合う角です。対頂角は、等しいですね。', { ft: 'happy', draw: [G('g4', vert)] }), b('X の形の、向かい合う角だね！', { fb: 'star', up: true })],
        wrong: [t('∠AOE と ∠COF は、2直線が交わる点 O で、向かい合う角です。仮定でも、共通な角でも、ありません。', { ft: 'normal' })] }),

    t('これを、②とします。次は、∠OAE と ∠OCF です。AD∥BC ですから、AC を、横切る直線と考えます。', { ft: 'normal', point: false, draw: [G('g4', vert)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '対頂角は等しいから\n∠AOE＝∠COF　…②', t: 4.0 }] }),

    /* ---------- 問4（錯角）---------- */
    Q('q4', t('問題です。∠OAE＝∠OCF といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '対頂角は、等しいから' }, { t: 'AD∥BC の錯角は等しいから', ok: true }, { t: '二等辺三角形の底角は等しいから' }, { t: '対角は、等しいから' }],
      { 0: [b('E と F は、O をはさんで、向かい合ってるから、対頂角でしょ？', { fb: 'happy', up: true }), t('対頂角は、同じ点で交わる、2直線が作る角です。∠OAE と ∠OCF は、頂点が、A と C で、ちがいます。', sad)],
        ok: [t('正解！ AD∥BC に、AC が交わってできる、錯角です。錯角は、等しいですね。', { ft: 'happy' }), b('平行線の性質も、ここで、活躍するんだね！', { fb: 'star', up: true })],
        wrong: [t('この2つの角は、二等辺三角形の底角でも、平行四辺形の対角でも、ありません。AD∥BC の、錯角です。', { ft: 'normal' })] }),

    t('これを、③とします。AD∥BC の錯角は等しく、∠OAE＝∠OCF です。', { ft: 'normal', point: false, draw: [G('g4', altAE)],
      add: [{ col: 0, type: 'text', size: 'xs', text: 'AD∥BC の錯角は等しいから\n∠OAE＝∠OCF　…③', t: 4.0 }] }),

    /* ---------- 5ページ目：結論 ---------- */
    t('①②③より、1組の辺と、その両端の角が、それぞれ等しいから、△OAE≡△OCF です。対応する辺は等しいので、OE＝OF です。', { clear: true, cols: [0.34, 0.66], part: '合同から結論へ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ここまで', text: '①OA＝OC\n②∠AOE＝∠COF\n③∠OAE＝∠OCF', t: 4.0 }, { col: 0, type: 'text', size: 'xs', text: '①②③より、1組の辺と\nその両端の角が等しいから\n△OAE≡△OCF', t: 4.5 }, { col: 0, type: 'text', size: 'xs', text: '対応する辺は等しいから\nOE＝OF', t: 3.5 }, Object.assign(f5, { prims: [] })],
      draw: [G('g5', para, marks, diags, line, vert, altAE, eqOEF)] }),
    t('E の位置を、決めずに、証明しました。だから、点 O を通る、どんな直線でも、OE＝OF です。', { ft: 'normal', point: false }),

    /* ---------- 6ページ目：類題 ---------- */
    t('では、性質を使う、類題です。平行四辺形 ABCD で、AB＝5cm、BC＝6cm、対角線 AC＝8cm です。', { clear: true, cols: [0.34, 0.66], part: '類題', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AB＝5cm　BC＝6cm\nAC＝8cm　AO は？', t: 4.0 }, Object.assign(f6, { prims: [] })], draw: [G('g6', numFig)] }),

    /* ---------- 問5（AO）---------- */
    Q('q5', t('最後の問題です。対角線の交点を O とします。AO の長さは、何cmでしょう。', { ft: 'happy' }),
      [{ t: '8cm' }, { t: '5cm' }, { t: '4cm', ok: true }, { t: '6cm' }],
      { 0: [b('対角線の長さが、8cmだから、AO も、8cmでしょ？', { fb: 'happy', up: true }), t('8cmは、AC 全体の長さです。AO は、AC の半分です。対角線は、中点で交わるからです。', sad)],
        ok: [t('正解！ 対角線は、それぞれの中点で、交わります。AO＝8÷2＝4cm です。', { ft: 'happy' }), b('半分に、するだけなんだね！', { fb: 'star', up: true })],
        wrong: [t('5cmは AB、6cmは BC の長さです。AO は、AC＝8cm の半分で、4cmです。', { ft: 'normal' })] }),

    t('平行四辺形の性質は、証明の根拠として、使えます。何を使ったかを、きちんと、書きましょう。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '平行四辺形の性質', text: '①対辺は、それぞれ等しい\n②対角は、それぞれ等しい\n③対角線は、中点で交わる', t: 6.0 }] }),
    b('ようかんは、真ん中の点を通れば、どう切っても、OE と OF が、同じ。安心して、切れるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
