/* 中2 5章 三角形と四角形　第5時（探）「直角三角形は、何がわかれば合同といえるだろう」。自作。
   斜辺5cm・鋭角40°の直角三角形（もう1つの鋭角は 180−90−40＝50°）→ 斜辺とその両端の角が等しい → 合同（斜辺と1つの鋭角）。
   斜辺5cm・他の1辺3cm：△ABC（C(0,0)，B(0,3)，A(4,0)）を裏返して BC で合わせる → △BAD（D(−4,0)）は BA＝BD＝5 の二等辺三角形 → ∠A＝∠D → 条件①で合同。 */
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
    .replace(/(?<=[0-9°度A-Za-z）)])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/[(（]/g, 'かっこ、').replace(/[)）]/g, '、かっことじ、')
    .replace(/²/g, 'の2乗').replace(/(?<=[0-9])m(?![a-z])/g, 'メートル')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const t = wrap(T), b = wrap(B);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  const cs = Math.cos(40 * R), sn = Math.sin(40 * R), DX = 5.4;
  const b1 = [0, 0], c1 = [5 * cs, 0], a1 = [5 * cs, 5 * sn];
  const f1 = [DX, 0], e1 = [DX + 5 * cs, 0], d1 = [DX, 5 * sn];
  const c2 = [0, 0], b2 = [0, 3], a2 = [4, 0], d2 = [-4, 0];
  const g1 = FG('g1', -1.1, -0.9, 10.3, 4.3), g2 = FG('g2', -5.3, -0.9, 5.3, 4.2);
  const rt1 = [tri([a1, b1, c1], 'w'), dn(a1, 'A', [0.5, 0.8]), dn(b1, 'B', [-0.7, -0.7]), dn(c1, 'C', [0.7, -0.7]), rt(c1, b1, a1, 'w')];
  const hyp = [ln(b1, a1, 'y', { wd: 5 }), tx([1.35, 2.2], '斜辺', 'y', 'end')];
  const give = [tx([2.0, 2.35], '5cm', 'y', 'end', 26), ang(b1, c1, a1, 0.9, 1, 'p'), tx([1.75, 0.42], '40°', 'p', 'middle', 24)];
  const ang50 = [ang(a1, b1, c1, 0.8, 1, 'g'), tx([3.42, 1.85], '50°', 'g', 'middle', 24)];
  const rt2 = [tri([d1, f1, e1], 'w'), dn(d1, 'D', [-0.5, 0.8]), dn(f1, 'F', [-0.7, -0.7]), dn(e1, 'E', [0.7, -0.7]), rt(f1, e1, d1, 'w'), tick(b1, a1, 1, 'y'), tick(e1, d1, 1, 'y'),
    ang(e1, f1, d1, 0.9, 1, 'p'), tx([DX + 5 * cs - 1.6, 0.42], '40°', 'p', 'middle', 24)];
  const both50 = [ang(d1, f1, e1, 0.8, 1, 'g'), tx([DX + 0.42, 1.85], '50°', 'g', 'middle', 24)];
  const t2 = [tri([a2, b2, c2], 'w'), dn(b2, 'B', [0.2, 1]), dn(c2, 'C', [0, -1]), dn(a2, 'A', [0.7, -0.7]), rt(c2, a2, b2, 'w'), tx([2.4, 1.95], '5cm', 'y', 'start', 26), tx([0.3, 1.2], '3cm', 'b', 'start', 26)];
  const mirror = [tri([d2, b2, c2], 'b', 'b'), dn(d2, 'D', [-0.7, -0.7]), rt(c2, d2, b2, 'b'), tx([-2.4, 1.95], '5cm', 'y', 'end', 26), tx([-3.5, 3.2], '（E は B に、F は C に）', 'b', 'start', 22)];
  const isoBAD = [tick(b2, a2, 1, 'y'), tick(b2, d2, 1, 'y')];
  const baseP = [ang(a2, b2, d2, 0.9, 1, 'p'), ang(d2, a2, b2, 0.9, 1, 'p')];
  const bigTri = tri([b2, d2, a2], 'y', 'y', { temp: true });

  KL.lesson({ id: 'g2u5-05', unit: '中2　三角形と四角形', kick: '2年5章　第5時', title: '直角三角形は、何がわかれば合同といえるだろう', card: '直角三角形は、何がわかれば合同といえるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、直角三角形が、合同になる条件を、探ります。', { title: true, point: false, ft: 'happy' }),
    b('三角定規！ 2枚セットで、持ってるよ！ どっちも直角だから、2枚は、合同だよね？', { title: true, fb: 'proud', up: true }),
    t('よく見てください。2枚の三角定規は、形が、ちがいますね。直角があっても、合同とは、限りません。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('まず、ことばです。直角のある三角形が、直角三角形です。直角に向かい合う辺を、斜辺といいます。', { part: '直角三角形のことば', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '直角三角形が合同になる\n条件を探ろう', t: 4.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: 'ことば', text: '斜辺＝直角に\n向かい合う辺', t: 4.0 }, Object.assign(g1, { prims: [] })], draw: [G('g1', rt1, hyp)] }),
    t('ふつうの三角形の、合同条件は、3つでしたね。直角三角形は、直角が、最初から、1組ずつあるので、条件を、へらせそうです。', { ft: 'normal', point: false }),
    t('まず、斜辺が5cm、1つの鋭角が40°の、直角三角形を、考えます。もう1つの、直角三角形 DEF も、斜辺が5cm、鋭角が40°です。', { ft: 'normal', point: false,
      draw: [G('g1', give, rt2)] }),

    /* ---------- 問1（残りの角）---------- */
    Q('q1', t('問題です。直角三角形 ABC の、もう1つの鋭角、∠A は、何度でしょう。', { ft: 'normal' }),
      [{ t: '40°' }, { t: '50°', ok: true }, { t: '90°' }, { t: '140°' }],
      { 3: [b('180から40をひいて、140度！', { fb: 'happy', up: true }), t('直角の、90°も、ひきます。180°−90°−40°＝50°です。', sad)],
        ok: [t('正解！ 三角形の内角の和は、180°。180°−90°−40°＝50°です。', { ft: 'happy' }), b('直角があると、残りの角が、すぐ決まるんだね！', { fb: 'star', up: true })],
        wrong: [t('わかっている角は、直角の90°と、40°です。残りの角は、180°−90°−40°＝50°です。', { ft: 'normal' })] }),

    t('∠A＝50°。DEF も、同じ計算で、∠D＝50°です。斜辺 AB と DE も、等しいので、等しいものが、そろいました。', { ft: 'normal', point: false,
      draw: [G('g1', ang50, both50)] }),

    /* ---------- 問2（合同条件）---------- */
    Q('q2', t('問題です。この2つの三角形は、どの合同条件で、合同といえるでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい', ok: true }],
      { 1: [b('角が、3つとも、等しいから、合同でしょ？', { fb: 'happy', up: true }), t('3組の角が等しいだけでは、合同条件では、ありません。斜辺 AB と、その両端の角に、注目しましょう。', sad)],
        ok: [t('正解！ 斜辺 AB の両端は、鋭角の ∠A と ∠B。それぞれ等しいので、1組の辺と両端の角です。', { ft: 'happy' }), b('斜辺は、2つの鋭角の、間にあるんだね！', { fb: 'star', up: true })],
        wrong: [t('等しい辺は、斜辺の、1組だけです。「3組の辺」でも、「2組の辺と、その間の角」でも、ありません。', { ft: 'normal' })] }),

    t('そこで、直角三角形の合同条件の1つ目は、斜辺と、1つの鋭角が、それぞれ等しい、です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '条件①', text: '斜辺と1つの鋭角が\nそれぞれ等しい', t: 4.0 }] }),

    /* ---------- 2ページ目：斜辺と他の1辺 ---------- */
    t('次は、斜辺と、他の1辺が、等しい場合です。斜辺 AB＝DE＝5cm、辺 BC＝EF＝3cm とします。', { clear: true, cols: [0.34, 0.66], part: '斜辺と他の1辺', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '条件②？', text: '斜辺と他の1辺が\nそれぞれ等しい', t: 4.0 }, Object.assign(g2, { prims: [] })], draw: [G('g2', t2)] }),

    /* ---------- 問3（間の角）---------- */
    Q('q3', t('問題です。∠C＝90°で、斜辺 AB と、辺 BC に、はさまれた角は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠C' }, { t: '∠A' }, { t: '∠B', ok: true }, { t: '∠A と ∠C' }],
      { 0: [b('直角の ∠C でしょ？ 直角が、いちばん大事だもん！', { fb: 'happy', up: true }), t('∠C は、斜辺 AB の、向かい側の角です。AB と BC の間にあるのは、頂点 B の角、∠B です。', sad)],
        ok: [t('正解！ AB と BC は、頂点 B で出会います。はさまれた角は、∠B です。', { ft: 'happy' }), b('直角は、はさまれて、いないんだね！', { fb: 'surprised', up: true })],
        wrong: [t('AB と BC が出会う頂点は、B です。2つの辺に、はさまれた角は、∠B です。', { ft: 'normal' })] }),

    t('直角は、斜辺と他の1辺の、「間の角」では、ありません。だから、「2組の辺と、その間の角」は、そのままでは、使えません。', { ft: 'normal', point: false }),
    t('それでも、合同といえるのか、確かめます。DEF を、裏返して、辺 EF を、辺 BC に、ぴったり重ねます。', { ft: 'normal', point: false,
      draw: [G('g2', mirror)] }),
    b('三角形が、2つ、くっついた！ ピラミッドに、なったよ！', { fb: 'star', up: true }),
    t('2つの直角が、並ぶので、A、C、D は、一直線です。大きな三角形、△BAD ができました。', { ft: 'normal', point: false,
      draw: [G('g2', bigTri)] }),

    /* ---------- 問4（△BAD）---------- */
    Q('q4', t('問題です。BA＝BD＝5cm でした。△BAD は、何三角形でしょう。', { ft: 'normal' }),
      [{ t: '二等辺三角形', ok: true }, { t: '正三角形' }, { t: '直角三角形' }, { t: '3辺がすべて、ちがう三角形' }],
      { 1: [b('正三角形でしょ？ きれいな形だもん！', { fb: 'happy', up: true }), t('BA と BD は、5cm ですが、AD は、5cm より長いです。2辺だけが等しい、二等辺三角形です。', sad)],
        ok: [t('正解！ BA＝BD の、二等辺三角形です。底角は等しいので、∠A＝∠D です。', { ft: 'happy' }), b('第1時の、定理だね！', { fb: 'star', up: true })],
        wrong: [t('BA＝BD で、2辺が等しいので、「3辺がすべてちがう」では、ありません。直角も、ありません。', { ft: 'normal' })] }),

    t('∠A＝∠D と、斜辺 AB＝DE。これで、斜辺と1つの鋭角が、それぞれ等しくなります。条件①で、△ABC≡△DEF です。', { ft: 'normal', point: false,
      draw: [G('g2', isoBAD, baseP)],
      add: [{ col: 0, type: 'text', size: 'xs', label: 'たしかめ', text: '△BAD は二等辺三角形\n底角は等しいから\n∠A＝∠D', t: 4.5 }] }),

    /* ---------- 問5（使ってみる）---------- */
    t('こうして、2つ目の条件も、確かめられました。直角三角形の、合同条件を、使ってみましょう。', { clear: true, cols: [0.34, 0.66], part: '使ってみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '条件②', text: '斜辺と他の1辺が\nそれぞれ等しい', t: 4.0 }] }),
    Q('q5', t('最後の問題です。2つの直角三角形が、合同といえるのは、どれでしょう。', { ft: 'happy' }),
      [{ t: '斜辺6cmだけが等しい' }, { t: '斜辺6cmと、他の1辺4cmが等しい', ok: true }, { t: '鋭角30°だけが等しい' }, { t: '直角をはさむ1辺4cmだけが等しい' }],
      { 0: [b('斜辺が等しければ、あとは、自然に、決まるよ！', { fb: 'happy', up: true }), t('斜辺が同じでも、他の辺の長さは、いろいろです。斜辺と、もう1つ、等しいものが、必要です。', sad)],
        ok: [t('正解！ 斜辺と、他の1辺が、それぞれ等しいので、直角三角形の合同条件で、合同です。', { ft: 'happy' }), b('斜辺が、ポイントなんだね！', { fb: 'star', up: true })],
        wrong: [t('鋭角や、1辺だけでは、足りません。斜辺と、他の1辺、または、斜辺と1つの鋭角が、必要です。', { ft: 'normal' })] }),

    t('直角三角形の合同条件は、2つです。どちらも、斜辺が、ポイントです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '直角三角形の合同条件\n①斜辺と1つの鋭角\n②斜辺と他の1辺\nがそれぞれ等しい', t: 6.0 }] }),
    b('三角定規も、斜辺を、くらべれば、合同か、わかるね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
