/* 中2 5章 三角形と四角形　第4時（例）「「逆」が正しいかどうかを調べよう」。自作。
   定義（二等辺三角形＝2辺が等しい三角形）・定理（底角は等しい）。逆：仮定と結論を入れかえる。反例：「たぬきならばポンタ」→ たぬきのタヌ子さん，
   「x²＝9 ならば x＝3」→ x＝−3。正三角形（3辺が等しい）：AB＝AC，BA＝BC → ∠A＝∠B＝∠C＝60°，逆（3つの角が等しい → 正三角形）も正しい。 */
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
  const T50 = 3 * Math.tan(50 * R);
  const pA = [3, T50], pB = [0, 0], pC = [6, 0];
  const eA = [2.5, 2.5 * Math.sqrt(3)], eB = [0, 0], eC = [5, 0];
  const f1 = FG('g1', -1.1, -0.9, 7.1, 4.7), f2 = FG('g2', -1.1, -0.9, 7.1, 4.7), f3 = FG('g3', -5.6, -1.3, 5.6, 1.7), f4 = FG('g4', -1.1, -0.9, 6.1, 5.2);
  const iso = [tri([pA, pB, pC], 'w'), dn(pA, 'A', [0, 1]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7]), tick(pB, pA, 1, 'y'), tick(pC, pA, 1, 'y')];
  const baseEq = [ang(pB, pC, pA, 0.9, 1, 'p'), ang(pC, pB, pA, 0.9, 1, 'p')];
  const nline = [ln([-5.3, 0], [5.3, 0], 'w'), Array.from({ length: 11 }, (_, i) => ln([i - 5, -0.12], [i - 5, 0.12], 'w', { wd: 2.4 })), tx([-3, -0.5], '−3', 'w'), tx([0, -0.5], '0', 'w'), tx([3, -0.5], '3', 'w')];
  const nptsA = [{ k: 'pts', list: [[-3, 0], [3, 0]], c: 'p', r: 7 }, tx([-3, 0.55], 'x＝−3', 'p'), tx([3, 0.55], 'x＝3', 'p'), tx([0, 1.25], 'どちらも、2乗すると 9', 'y')];
  const equi = [tri([eA, eB, eC], 'w'), dn(eA, 'A', [0, 1]), dn(eB, 'B', [-0.7, -0.7]), dn(eC, 'C', [0.7, -0.7]), tick(eB, eA, 1, 'y'), tick(eC, eA, 1, 'y'), tick(eB, eC, 1, 'y')];
  const equiAng = [ang(eB, eC, eA, 0.8, 1, 'p'), ang(eC, eB, eA, 0.8, 1, 'p'), ang(eA, eB, eC, 0.8, 1, 'p'), tx([1.35, 0.4], '60°', 'p', 'middle', 24), tx([3.65, 0.4], '60°', 'p', 'middle', 24), tx([2.5, 3.1], '60°', 'p', 'middle', 24)];

  KL.lesson({ id: 'g2u5-04', unit: '中2　三角形と四角形', kick: '2年5章　第4時', title: '「逆」が正しいかどうかを調べよう', card: '「逆」が正しいかどうかを調べよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、ことがらの「逆」が、いつも正しいのかを、調べます。', { title: true, point: false, ft: 'happy' }),
    b('逆！ ぼく、逆立ちが、得意だよ！ 見て見て、頭が下で、しっぽが上！', { title: true, fb: 'star', up: true }),
    t('逆立ちとは、ちがいますが、「さかさま」という意味は、近いですね。まず、ことばを、整理しましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('ことばの意味を、はっきり決めたものを、定義といいます。二等辺三角形の定義は、2つの辺が等しい三角形、です。', { part: '定義と定理', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '定義', text: '二等辺三角形は\n2つの辺が等しい三角形', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', iso)] }),
    t('定義や、正しいと決まったことから、証明されたことがらのうち、大切なものを、定理といいます。「二等辺三角形の底角は等しい」は、定理です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '定理', text: '二等辺三角形の\n底角は等しい', t: 4.0 }], draw: [G('g1', baseEq)] }),

    /* ---------- 問1（定義）---------- */
    Q('q1', t('問題です。次のうち、ことばの意味を決めた、定義は、どれでしょう。', { ft: 'normal' }),
      [{ t: '二等辺三角形の底角は等しい' }, { t: '三角形の内角の和は180°' }, { t: '2辺が等しい三角形を二等辺三角形という', ok: true }, { t: '2つの角が等しい三角形は二等辺三角形' }],
      { 0: [b('底角が等しいのは、二等辺三角形の特ちょうでしょ？ だから、定義！', { fb: 'happy', up: true }), t('特ちょうは、証明して、わかったことです。それは、定理です。定義は、ことばの意味を、決めたものです。', sad)],
        ok: [t('正解！ 「2辺が等しい三角形を、二等辺三角形という」は、ことばの意味を、決めています。', { ft: 'happy' }), b('ことばの意味を決めるのが、定義なんだね！', { fb: 'star', up: true })],
        wrong: [t('それは、証明されたことがらで、定理です。定義は、ことばの意味を、はじめに決めたものです。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：逆 ---------- */
    t('ことがらは、「ならば」の形で書けます。ならばの前が仮定、後ろが結論です。AB＝AC ならば、∠B＝∠C。', { clear: true, cols: [0.34, 0.66], part: '「逆」とは', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ことがら', text: '仮定　AB＝AC\n結論　∠B＝∠C', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', iso, baseEq)] }),
    t('仮定と結論を、入れかえたことがらを、もとのことがらの、逆といいます。「∠B＝∠C ならば、AB＝AC」が、逆です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '逆', text: '仮定　∠B＝∠C\n結論　AB＝AC', t: 4.0 }] }),

    /* ---------- 問2（逆はどれ）---------- */
    Q('q2', t('問題です。「AB＝AC ならば ∠B＝∠C」の、逆は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AB＝AC ならば ∠B＝∠C' }, { t: '∠B＝∠C ならば AB＝AC', ok: true }, { t: 'AC＝AB ならば ∠C＝∠B' }, { t: '∠B＝∠C ならば BC＝AB' }],
      { 2: [b('AB と AC を、さかさまに書けば、逆でしょ？', { fb: 'happy', up: true }), t('文字を書く順番を、かえただけです。仮定と結論は、入れかわって、いません。', sad)],
        ok: [t('正解！ 仮定と結論を、入れかえた、∠B＝∠C ならば AB＝AC が、逆です。', { ft: 'happy' }), b('ほんとに、さかさまだね！', { fb: 'star', up: true })],
        wrong: [t('それは、もとのことがらと、同じか、結論が、ちがっています。仮定と結論を、入れかえたものが、逆です。', { ft: 'normal' })] }),

    t('この逆は、前の時間に、証明しました。この場合は、逆も、正しかったのです。', { ft: 'normal', point: false }),
    b('じゃあ、逆は、いつも正しいんだね！ さかさまにしただけだもん！ ぼくの逆立ちも、ぼくだよ！', { fb: 'proud', up: true }),

    /* ---------- 3ページ目：反例 ---------- */
    t('「ポンタならば、たぬき」は、正しいですね。この逆は、「たぬきならば、ポンタ」です。', { clear: true, cols: [0.34, 0.66], part: '逆は、いつも正しい？', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ことがら', text: 'ポンタならば、たぬき', t: 3.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '逆', text: 'たぬきならば、ポンタ', t: 3.0 }] }),
    b('たぬきならば、ぼく！ 正しいよ！ ぼくは、たぬきの代表だもん！', { fb: 'proud', up: true }),

    /* ---------- 問3（反例・たぬき）---------- */
    Q('q3', t('問題です。「たぬきならば、ポンタ」が、正しくないことを示す例は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'ポンタ' }, { t: 'ふくろうのホー先生' }, { t: 'きつねのコン太くん' }, { t: 'たぬきのタヌ子さん', ok: true }],
      { 0: [b('ぼくだよ！ たぬきで、ポンタだから、ぴったり！', { fb: 'happy', up: true }), t('ポンタは、逆が成り立つ例です。正しくないと示すには、たぬきなのに、ポンタではない例が、必要です。', sad)],
        ok: [t('正解！ タヌ子さんは、たぬきですが、ポンタでは、ありません。', { ft: 'happy' }), b('たぬきでも、ぼくじゃない子が、いるんだね！', { fb: 'surprised', up: true })],
        wrong: [t('ふくろうや、きつねは、「たぬき」という仮定に、あてはまりません。仮定にあてはまる例が、必要です。', { ft: 'normal' })] }),

    t('このように、仮定にあてはまるのに、結論が成り立たない例を、反例といいます。反例が1つでもあれば、そのことがらは、正しくありません。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '反例', text: '仮定にあてはまるのに\n結論が成り立たない例', t: 5.0 }] }),
    b('じゃあ、正しい例を、たくさん見つければ、正しいって、言えるよね？', { fb: 'happy', up: true }),
    t('いいえ。正しい例を、いくつ集めても、証明にはなりません。でも、反例は、1つ見つけるだけで、正しくないと、言えます。', { ft: 'normal', point: false }),
    t('数でも、確かめましょう。「x＝3 ならば、x²＝9」は、正しいですね。この逆は、「x²＝9 ならば、x＝3」です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '逆', text: 'x²＝9 ならば x＝3', t: 3.5 }, Object.assign(f3, { prims: [] })], draw: [G('g3', nline)] }),

    /* ---------- 問4（反例・x²）---------- */
    Q('q4', t('問題です。「x²＝9 ならば x＝3」が、正しくないことを示す、反例は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'x＝−3', ok: true }, { t: 'x＝0' }, { t: 'x＝3' }, { t: 'x＝9' }],
      { 2: [b('x＝3 で、確かめたら、成り立ったよ！ だから、正しいよ！', { fb: 'happy', up: true }), t('x＝3 は、結論も成り立つ、正しい例です。反例は、仮定にあてはまるのに、結論が成り立たない例です。', sad)],
        ok: [t('正解！ x＝−3 は、(−3)²＝9 で、仮定にあてはまります。でも、x＝3 では、ありません。', { ft: 'happy' }), b('マイナスも、2乗すると、9になるんだね！', { fb: 'surprised', up: true })],
        wrong: [t('x＝0 や x＝9 は、2乗しても、9になりません。仮定に、あてはまらないので、反例では、ありません。', { ft: 'normal' })] }),

    t('反例が見つかったので、この逆は、正しくありません。逆は、いつも正しいとは、限らないのです。', { ft: 'normal', point: false,
      draw: [G('g3', nptsA)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '反例', text: 'x＝−3', t: 2.5 }] }),

    /* ---------- 4ページ目：正三角形 ---------- */
    t('もう1つ、図形のことばです。3つの辺が等しい三角形を、正三角形といいます。これが、正三角形の定義です。', { clear: true, cols: [0.34, 0.66], part: '正三角形', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '定義', text: '正三角形は\n3つの辺が等しい三角形', t: 4.0 }, Object.assign(f4, { prims: [] })], draw: [G('g4', equi)] }),
    t('正三角形は、二等辺三角形でもあります。AB＝AC ですから、∠B＝∠C。BA＝BC ですから、∠A＝∠C です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'AB＝AC より　∠B＝∠C\nBA＝BC より　∠A＝∠C\nよって　∠A＝∠B＝∠C', t: 5.0 }], draw: [G('g4', equiAng)] }),
    t('3つの角が等しく、内角の和は180°ですから、1つの角は、60°です。では、逆はどうでしょう。「3つの角が等しい三角形は、正三角形である」です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '180°÷3＝60°', t: 2.5 }] }),

    /* ---------- 問5（正三角形の逆）---------- */
    Q('q5', t('最後の問題です。3つの角が等しい三角形は、どうなるでしょう。', { ft: 'happy' }),
      [{ t: '直角三角形になる' }, { t: '正三角形になる', ok: true }, { t: '鈍角三角形になる' }, { t: '二等辺三角形だが、正三角形とは限らない' }],
      { 3: [b('角が3つ等しくても、辺は、2つだけ等しい、かもしれないよ！', { fb: 'happy', up: true }), t('二等辺三角形になる条件を、使います。∠B＝∠C から AB＝AC、∠A＝∠C から BA＝BC。3辺が等しいので、正三角形です。', sad)],
        ok: [t('正解！ ∠B＝∠C から AB＝AC、∠A＝∠C から BA＝BC。3つの辺が等しくなり、正三角形です。', { ft: 'happy' }), b('正三角形は、逆も、正しいんだね！', { fb: 'star', up: true })],
        wrong: [t('3つの角が等しいと、1つの角は、180°÷3＝60°です。直角でも、鈍角でも、ありません。', { ft: 'normal' })] }),

    t('ことがらの逆は、正しいとは、限りません。正しくないことは、反例を1つ見つければ、示せます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '逆は、いつも\n正しいとは限らない\n反例が1つあれば\n正しくない', t: 6.0 }] }),
    b('逆立ちは、いつでもできるけど、逆のことがらは、気をつけなきゃ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
