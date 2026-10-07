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
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー' };
  const plainS = s => s.replace(/\{\{|\}\}|\*\*/g, '');
  const rd = s => plainS(s)
    .replace(/[①-⑤]+/g, m => m.length === 1 ? 'まる' + ['いち', 'に', 'さん', 'よん', 'ご']['①②③④⑤'.indexOf(m)] : [...m].map(c => ['いち', 'に', 'さん', 'よん', 'ご']['①②③④⑤'.indexOf(c)]).join('、') + '、')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/≡/g, ' 合同 ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ').replace(/−/g, 'ひく').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/(?<=[0-9])m(?![a-z])/g, 'メートル')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c]).join(''))
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const t = wrap(T), b = wrap(B);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  /* 中2 5章 三角形と四角形　第1時（探）「二等辺三角形の底角が等しいことを証明しよう」。自作。
     △ABC：B(0,0)，C(6,0)，A(3,4.2)（AB＝AC）。頂角の二等分線 AD（D(3,0)）で △ABD と △ACD に分け、
     AB＝AC，∠BAD＝∠CAD，AD 共通 → 2組の辺とその間の角で合同 → ∠B＝∠C。 */
  const pA = [3, 4.2], pB = [0, 0], pC = [6, 0], pD = [3, 0];
  const f1 = FG('g1', -1.1, -1.0, 7.1, 5.3), f2 = FG('g2', -1.1, -1.0, 7.1, 5.3), f3 = FG('g3', -1.1, -1.0, 7.1, 5.3), f4 = FG('g4', -1.1, -1.0, 7.1, 5.3);
  const names = [dn(pA, 'A', [0, 1]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7])];
  const body = [tri([pA, pB, pC], 'w'), names, tick(pB, pA, 1, 'y'), tick(pC, pA, 1, 'y')];
  const withD = [ln(pA, pD, 'w', { dash: true }), dn(pD, 'D', [0, -1])];
  const apex = [ang(pA, pB, pC, 0.75, 1, 'g'), tx([3.35, 4.55], '頂角', 'g', 'start')];
  const base = [ln(pB, pC, 'b', { wd: 5 }), tx([3, -0.62], '底辺', 'b')];
  const baseAng = [ang(pB, pC, pA, 0.9, 1, 'p'), ang(pC, pB, pA, 0.9, 1, 'p'), tx([1.5, 0.5], '底角', 'p'), tx([4.5, 0.5], '底角', 'p')];
  const halves = [ang(pA, pB, pD, 0.8, 1, 'g'), ang(pA, pD, pC, 0.8, 1, 'g')];
  const triL = tri([pA, pB, pD], 'p', 'p', { temp: true }), triR = tri([pA, pD, pC], 'b', 'b', { temp: true });
  const eqBase = [ang(pB, pC, pA, 0.9, 2, 'p'), ang(pC, pB, pA, 0.9, 2, 'p')];

  KL.lesson({ id: 'g2u5-01', unit: '中2　三角形と四角形', kick: '2年5章　第1時', title: '二等辺三角形の底角が等しいことを証明しよう', card: '二等辺三角形の底角が等しいことを証明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、二等辺三角形の、2つの底角が、いつも等しいことを、証明します。', { title: true, point: false, ft: 'happy' }),
    b('底角！ おにぎりの、底のかどだね！ 食べるときは、まず、そこから、かじるよ！', { title: true, fb: 'star', up: true }),
    t('かじる話では、ありませんよ。でも、おにぎりの形は、二等辺三角形に、よく似ていますね。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('まず、ことばの確認です。二等辺三角形は、2つの辺が、等しい三角形です。AB＝AC とします。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '二等辺三角形の底角が\n等しいことを証明しよう', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', body)] }),
    t('等しい2辺にはさまれた角を、頂角といいます。頂角と向かい合う辺が、底辺です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'ことば', text: '頂角：等しい2辺の間の角\n底辺：頂角と向かい合う辺', t: 4.0 }], draw: [G('g1', apex, base)] }),
    t('底辺の両はしにある、2つの角が、底角です。この図では、∠B と ∠C が、底角です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'ことば', text: '底角：底辺の両はしの角', t: 3.0 }], draw: [G('g1', baseAng)] }),

    /* ---------- 問1（予想）---------- */
    Q('q1', t('問題です。二等辺三角形の、2つの底角は、どんな関係に、ありそうでしょう。', { ft: 'normal' }),
      [{ t: '左の底角が、いつも大きい' }, { t: '頂角と、いつも等しい' }, { t: 'いつも、等しい', ok: true }, { t: '三角形ごとに、ばらばら' }],
      { 0: [b('先に読むのは、左でしょ？ だから、左の角が、大きいんだよ！', { fb: 'happy', up: true }), t('読む順番は、角の大きさに、関係ありません。左右を入れかえても、二等辺三角形は、同じ形です。', sad)],
        1: [t('頂角と底角が等しいのは、3つの角がぜんぶ等しい、特別な場合だけです。いつもでは、ありません。', { ft: 'normal' })],
        ok: [t('正解！ 等しくなりそうです。ただし、これは、まだ予想です。', { ft: 'happy' }), b('よし、確かめてみよう！', { fb: 'star', up: true })],
        wrong: [t('ばらばらには、見えません。いろいろな二等辺三角形で、2つの底角は、同じ大きさに見えます。', { ft: 'normal' })] }),

    t('では、確かめてみましょう。ポンタは、紙で、二等辺三角形を、作りましたね。', { ft: 'normal', point: false }),
    b('うん！ ぴったり半分に折ったら、2つの底角が、きれいに重なったよ！ もう、証明、おしまいだね！', { fb: 'proud', up: true }),
    t('いい発見です。折る方法は、ヒントになります。でも、それだけでは、証明になりません。', { ft: 'normal', point: false }),

    /* ---------- 問2（折っただけでは証明にならない）---------- */
    Q('q2', t('問題です。折って重なっただけでは、証明にならないのは、なぜでしょう。', { ft: 'normal' }),
      [{ t: '折り紙は、数学で使えないから' }, { t: '二等辺三角形は、折ると重ならないから' }, { t: '分度器で、測っていないから' }, { t: 'その1枚しか、確かめていないから', ok: true }],
      { 0: [t('折り紙は、ヒントを見つける道具として、とても役に立ちます。使えない、わけではありません。', { ft: 'normal' })],
        2: [b('分度器で測れば、もう、完ぺきでしょ？', { fb: 'happy', up: true }), t('測っても、その1枚の話です。測るだけでは、証明になりません。', sad)],
        ok: [t('正解！ どんな二等辺三角形でも、成り立つことを、示す必要があります。', { ft: 'happy' }), b('1枚だけじゃ、ダメなんだね！', { fb: 'surprised', up: true })],
        wrong: [t('二等辺三角形は、折ると、ぴったり重なります。だから、ヒントになるのです。', { ft: 'normal' })] }),

    t('証明では、仮定と、すでにわかっていることだけを、使います。そして、すべての二等辺三角形で、成り立つことを、示します。', { ft: 'normal', point: false }),
    t('そこで、折り目に注目します。折り目は、頂角を、半分にする線です。この線を、AD とします。D は、底辺 BC 上の点です。', { ft: 'normal', point: false,
      draw: [G('g1', withD)] }),

    /* ---------- 2ページ目：証明 ---------- */
    t('では、証明を書きましょう。仮定は、AB＝AC。結論は、∠B＝∠C です。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB＝AC', t: 3.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: '∠B＝∠C', t: 3.0 }, Object.assign(f2, { prims: [] })],
      draw: [G('g2', body, withD)] }),
    t('∠A の二等分線を、ひいて、底辺との交点を、D とします。2つの三角形、△ABD と △ACD に、注目します。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '∠Aの二等分線ADをひく\n△ABD と △ACD において', t: 4.0 }], draw: [G('g2', triL, triR)] }),
    t('まず、仮定より、AB＝AC です。これを、①とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '仮定より　AB＝AC　…①', t: 2.5 }] }),

    /* ---------- 問3（等しい角）---------- */
    Q('q3', t('問題です。AD は、∠A の二等分線です。∠BAD と、等しいといえる角は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠CAD', ok: true }, { t: '∠ABD' }, { t: '∠ADB' }, { t: '∠ACD' }],
      { 1: [b('底角どうしだから、∠ABD も、等しいよ！', { fb: 'happy', up: true }), t('∠ABD は、証明したい結論に、出てくる角です。まだ、等しいとは、いえません。', sad)],
        ok: [t('正解！ 二等分線は、角を半分に分けるので、∠BAD＝∠CAD です。', { ft: 'happy' }), b('頂角が、ぴったり半分に、なるんだね！', { fb: 'star', up: true })],
        wrong: [t('二等分線で、半分になった角は、∠BAD と ∠CAD です。この2つが、等しい角です。', { ft: 'normal' })] }),

    t('これを、②とします。二等分線ですから、∠BAD＝∠CAD です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'ADは∠Aの二等分線より\n∠BAD＝∠CAD　…②', t: 3.5 }], draw: [G('g2', halves)] }),
    b('BD と CD も、図で見ると、同じ長さだよ！ 3つ目は、それにしよう！', { fb: 'happy', up: true }),
    t('図で同じに見えるだけでは、根拠になりません。BD＝CD は、合同がいえたあとに、わかることです。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),
    t('3つ目は、どちらの三角形にも入っている、共通な辺 AD です。これを、③とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '共通な辺　AD＝AD　…③', t: 2.5 }] }),

    /* ---------- 3ページ目：合同から結論へ ---------- */
    t('①②③を、並べます。2つの三角形で、辺と、その間の角が、そろいました。', { clear: true, cols: [0.34, 0.66], part: '合同から結論へ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'そろった条件', text: '①AB＝AC\n②∠BAD＝∠CAD\n③AD＝AD', t: 4.0 }, Object.assign(f3, { prims: [] })],
      draw: [G('g3', body, withD, halves, triL, triR)] }),

    /* ---------- 問4（合同条件）---------- */
    Q('q4', t('問題です。①②③から、使える合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい', ok: true }, { t: '3組の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }],
      { 0: [t('BD＝CD は、まだ、わかっていません。使える辺の組は、AB＝AC と AD＝AD の、2組です。', { ft: 'normal' })],
        2: [b('角が3つ等しければ、合同でしょ？', { fb: 'happy', up: true }), t('3組の角が等しいだけでは、大きさのちがう三角形も、できます。合同条件では、ありません。', sad)],
        ok: [t('正解！ AB と AD の間の角が、∠BAD です。2組の辺と、その間の角が、等しいですね。', { ft: 'happy' }), b('辺・角・辺、そろってるね！', { fb: 'star', up: true })],
        wrong: [t('両端の角が、どちらも等しいとは、まだ、いえません。∠ADB と ∠ADC は、わかっていません。', { ft: 'normal' })] }),

    t('①②③より、2組の辺と、その間の角が、それぞれ等しいから、△ABD≡△ACD です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①②③より、2組の辺と\nその間の角が等しいから\n△ABD≡△ACD', t: 4.5 }] }),
    t('合同な図形では、対応する角は、等しいですね。B と C が対応するので、∠B＝∠C です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '対応する角は等しいから\n∠B＝∠C', t: 3.5 }] }),

    t('これで、二等辺三角形の、2つの底角は、いつも等しいと、証明できました。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'happy', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '二等辺三角形の\n2つの底角は等しい', t: 4.0 }, Object.assign(f4, { prims: [] })], draw: [G('g4', body, eqBase)] }),
    b('おにぎりの底の角は、どっちも同じ。これで、安心して、かじれるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
