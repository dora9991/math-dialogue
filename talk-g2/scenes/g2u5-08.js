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
  /* 中2 5章 三角形と四角形　第8時（探）「平行四辺形には、どんな性質があるだろう」。自作。
     平行四辺形 ABCD：B(0,0)，C(6,0)，A＝4(cos70°, sin70°)，D＝A＋(6,0)（AB＝4，BC＝6，∠B＝70°，∠A＝110°）。対角線 AC，BD の交点 O。
     表（はかった値）：①AB4・BC6・∠B70° ②AB3・BC5・∠B55° ③AB2・BC7・∠B80°。AO＝CO，BO＝DO は余弦定理で計算（小数第1位）。
     性質 ①対辺は等しい ②対角は等しい（△ABC≡△CDA）。③対角線は中点で交わる（次の時間に証明）。 */
  const pB = [0, 0], pC = [6, 0], pA = [4 * Math.cos(70 * R), 4 * Math.sin(70 * R)], pD = [pA[0] + 6, pA[1]], pO = [(pA[0] + pC[0]) / 2, (pA[1] + pC[1]) / 2];
  const f1 = FG('g1', -1.1, -0.9, 8.5, 4.8), f3 = FG('g3', -1.1, -0.9, 8.5, 4.8), f4 = FG('g4', -1.1, -0.9, 8.5, 4.8);
  const names = [dn(pA, 'A', [-0.7, 0.7]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7]), dn(pD, 'D', [0.7, 0.7])];
  const para = [tri([pA, pB, pC, pD], 'w'), names];
  const marks = [par(pB, pA, 1, 'b'), par(pC, pD, 1, 'b'), par(pB, pC, 2, 'b'), par(pA, pD, 2, 'b')];
  const nums = [tx([0.35, 1.9], '4cm', 'y', 'end', 24), tx([3, -0.62], '6cm', 'y', 'middle', 24), ang(pB, pC, pA, 0.8, 1, 'p'), tx([1.5, 0.4], '70°', 'p', 'middle', 24)];
  const diagAC = [ln(pA, pC, 'w', { dash: true })];
  const altA = [ang(pA, pB, pC, 0.9, 1, 'g'), ang(pC, pD, pA, 0.9, 1, 'g')];
  const altC = [ang(pC, pB, pA, 0.9, 2, 'p'), ang(pA, pD, pC, 0.9, 2, 'p')];
  const triL = tri([pA, pB, pC], 'p', 'p', { temp: true }), triR = tri([pC, pD, pA], 'b', 'b', { temp: true });
  const eqSides = [tick(pA, pB, 1, 'y'), tick(pD, pC, 1, 'y'), tick(pB, pC, 2, 'y'), tick(pA, pD, 2, 'y')];
  const tbl1 = [['', '①', '②', '③'], ['AB と DC', '4 と 4', '3 と 3', '2 と 2'], ['AD と BC', '6 と 6', '5 と 5', '7 と 7'], ['∠A と ∠C', '110° と 110°', '125° と 125°', '100° と 100°'],
    ['∠B と ∠D', '70° と 70°', '55° と 55°', '80° と 80°'], ['AO と CO', '3.0 と 3.0', '2.0 と 2.0', '3.5 と 3.5'], ['BO と DO', '4.1 と 4.1', '3.6 と 3.6', '3.8 と 3.8']];

  KL.lesson({ id: 'g2u5-08', unit: '中2　三角形と四角形', kick: '2年5章　第8時', title: '平行四辺形には、どんな性質があるだろう', card: '平行四辺形には、どんな性質があるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、平行四辺形の、性質を探ります。まず、ストローで、四角形を作ってみましょう。', { title: true, point: false, ft: 'happy' }),
    b('ストロー4本を、つなげたよ！ 押したら、四角が、ぐにゃっと傾いた！ おもしろーい！', { title: true, fb: 'star', up: true }),
    t('いいところに、気づきました。傾いた、その形が、平行四辺形の仲間です。性質を、調べましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('2組の向かい合う辺が、それぞれ平行な四角形を、平行四辺形といいます。AB∥DC で、AD∥BC です。', { part: '平行四辺形とは', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '定義', text: '2組の対辺が\nそれぞれ平行な四角形', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', para, marks)] }),
    t('向かい合う辺を、対辺、向かい合う角を、対角といいます。辺 AB の対辺は、辺 DC です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'ことば', text: '対辺＝向かい合う辺\n対角＝向かい合う角', t: 4.0 }], draw: [G('g1', nums)] }),

    /* ---------- 問1（対角）---------- */
    Q('q1', t('問題です。∠A の、対角は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠D' }, { t: '∠C', ok: true }, { t: '∠B' }, { t: '対角は、ない' }],
      { 2: [b('となり同士が、仲よしだから、∠B でしょ？', { fb: 'happy', up: true }), t('となり合う角では、ありません。向かい合う角が、対角です。∠A の向かい側にあるのは、∠C です。', sad)],
        ok: [t('正解！ ∠A の向かい側にある角が、対角で、∠C です。', { ft: 'happy' }), b('対角は、向かい側なんだね！', { fb: 'star', up: true })],
        wrong: [t('∠D は、となり合う角です。対角は、向かい側の、∠C です。四角形には、対角が、2組あります。', { ft: 'normal' })] }),

    t('ストローの枠を、押して、形を変えても、ストローの長さは、変わりませんね。では、対辺の長さには、どんな関係が、ありそうでしょう。', { ft: 'normal', point: false }),

    /* ---------- 問2（対辺の予想）---------- */
    Q('q2', t('問題です。平行四辺形の、対辺の長さについて、どんなことが、いえそうでしょう。', { ft: 'normal' }),
      [{ t: '4つの辺が、すべて等しい' }, { t: '隣り合う辺が、等しい' }, { t: '対辺が、必ず2倍の長さ' }, { t: '2組の対辺が、それぞれ等しい', ok: true }],
      { 0: [b('ストローは、4本とも、同じ長さだったよ！', { fb: 'happy', up: true }), t('ストローを、4本とも同じにすれば、そうなります。でも、長さのちがう辺が、ある平行四辺形も、あります。', sad)],
        ok: [t('正解！ 向かい合う辺どうしが、2組とも、それぞれ等しくなりそうです。まだ、予想です。', { ft: 'happy' }), b('はかって、確かめてみよう！', { fb: 'star', up: true })],
        wrong: [t('となり合う辺も、2倍の関係も、いつもは成り立ちません。ストローの枠でも、向かい合う辺だけが、等しいままです。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：はかった値 ---------- */
    t('3つの平行四辺形で、辺、角、対角線の、交点 O までの長さを、はかりました。結果は、こちらです。', { clear: true, cols: [0.34, 0.66], part: 'はかってみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べよう', text: 'いろいろな平行四辺形を\nはかって比べる', t: 4.0 }, { col: 0, type: 'text', size: 'xs', label: '単位', text: '長さは cm、角は 度', t: 3.0 }, tbl(tbl1, { col: 1, style: 'font-size:30px; align-self:center; margin-top:10px', t: 1.0 })] }),

    /* ---------- 問3（角）---------- */
    Q('q3', t('問題です。表の、角を見ます。どんなことが、いえそうでしょう。', { ft: 'normal' }),
      [{ t: '対角どうしが、それぞれ等しい', ok: true }, { t: 'となり合う角が、等しい' }, { t: '4つの角が、すべて等しい' }, { t: '対角の和が、180°' }],
      { 3: [b('110°と110°を、たすと、180度かな？', { fb: 'happy', up: true }), t('110°＋110°は、220°です。180°にはなりません。対角どうしが、等しいのです。', sad)],
        ok: [t('正解！ ∠A と ∠C、∠B と ∠D。対角どうしが、それぞれ等しくなっています。', { ft: 'happy' }), b('どの平行四辺形でも、そろってるね！', { fb: 'surprised', up: true })],
        wrong: [t('110°と70°のように、となり合う角は、等しくありません。等しいのは、向かい合う、対角どうしです。', { ft: 'normal' })] }),

    /* ---------- 問4（対角線）---------- */
    Q('q4', t('問題です。AO と CO、BO と DO を、見ます。対角線について、どんなことが、いえそうでしょう。', { ft: 'normal' }),
      [{ t: '2本の対角線は、等しい' }, { t: '対角線は、垂直に交わる' }, { t: '交点で、それぞれ2等分される', ok: true }, { t: '2本の対角線は、平行' }],
      { 0: [b('4と4、6と6だから、対角線も、等しいよ！', { fb: 'happy', up: true }), t('表の AO と CO は、どちらも3.0ですが、BO は4.1です。AC と BD は、等しくありません。', sad)],
        ok: [t('正解！ AO＝CO、BO＝DO。交点 O が、2本の対角線の、真ん中になっています。', { ft: 'happy' }), b('O は、真ん中なんだね！', { fb: 'star', up: true })],
        wrong: [t('対角線は、交点 O で、交わります。平行ではありません。垂直かどうかも、表からは、わかりません。', { ft: 'normal' })] }),

    b('3つとも、そうなった！ だから、どんな平行四辺形でも、そうだよね！ 証明は、いらないね！', { fb: 'proud', up: true }),
    t('3つしか、はかっていません。まだ、はかっていない平行四辺形が、無数にあります。はかった結果は、予想です。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),
    t('いつでも成り立つかは、証明で、確かめます。まず、対辺と対角が、等しいことを、証明しましょう。', { ft: 'normal', point: false }),

    /* ---------- 3ページ目：証明の前半 ---------- */
    t('仮定は、AB∥DC、AD∥BC。結論は、AB＝DC と AD＝BC です。対角線 AC を、ひいて、△ABC と △CDA を、比べます。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB∥DC　AD∥BC', t: 3.5 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'AB＝DC　AD＝BC', t: 3.5 }, Object.assign(f3, { prims: [] })], draw: [G('g3', para, marks, diagAC, triL, triR)] }),
    t('AB∥DC ですから、錯角は等しく、∠BAC＝∠DCA です。これを、①とします。', { ft: 'normal', point: false, draw: [G('g3', altA)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '△ABC と △CDA において\nAB∥DC の錯角は等しいから\n∠BAC＝∠DCA　…①', t: 5.0 }] }),

    /* ---------- 問5（錯角）---------- */
    Q('q5', t('問題です。AD∥BC で、AC が横切ります。∠BCA と、錯角の関係で等しい角は、どれでしょう。', { ft: 'normal' }),
      [{ t: '∠BAC' }, { t: '∠ACD' }, { t: '∠ADC' }, { t: '∠DAC', ok: true }],
      { 1: [b('錯角は、Z の形でしょ？ ∠ACD も、Z に見えるよ！', { fb: 'happy', up: true }), t('錯角は、平行な2直線と、AC が作る、ななめ向かいの角です。AD∥BC では、∠BCA と ∠DAC です。', sad)],
        ok: [t('正解！ AD∥BC ですから、錯角は等しく、∠BCA＝∠DAC です。', { ft: 'happy' }), b('Z の形の、ななめ向かいだね！', { fb: 'star', up: true })],
        wrong: [t('∠BAC や ∠ADC は、AD∥BC の、錯角ではありません。∠BCA の錯角は、AD 側の、∠DAC です。', { ft: 'normal' })] }),

    t('これを、②とします。もう1つは、共通な辺 AC＝CA です。これを、③とします。', { ft: 'normal', point: false, draw: [G('g3', altC)],
      add: [{ col: 0, type: 'text', size: 'xs', text: 'AD∥BC の錯角は等しいから\n∠BCA＝∠DAC　…②\n共通な辺　AC＝CA　…③', t: 5.0 }] }),

    /* ---------- 4ページ目：証明の後半 ---------- */
    t('①②③より、1組の辺と、その両端の角が、それぞれ等しいから、△ABC≡△CDA です。', { clear: true, cols: [0.34, 0.66], part: '合同から結論へ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ここまで', text: '①∠BAC＝∠DCA\n②∠BCA＝∠DAC\n③AC＝CA', t: 4.0 }, { col: 0, type: 'text', size: 'xs', text: '①②③より、1組の辺と\nその両端の角が等しいから\n△ABC≡△CDA', t: 4.5 }, Object.assign(f4, { prims: [] })],
      draw: [G('g4', para, marks, diagAC, altA, altC, triL, triR)] }),
    t('対応する辺は、等しいので、AB＝CD、BC＝DA です。対応する角も、等しいので、∠B＝∠D です。', { ft: 'normal', point: false, draw: [G('g4', eqSides)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '対応する辺は等しいから\nAB＝CD　BC＝DA\n角も等しく　∠B＝∠D', t: 5.0 }] }),
    t('∠A＝∠C も、もう1本の対角線 BD を使えば、同じように、証明できます。対角線の性質は、次の時間に、確かめます。', { ft: 'normal', point: false }),

    t('これで、平行四辺形の、対辺と対角の性質が、証明できました。定理として、使えます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'happy', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '平行四辺形の性質', text: '①対辺は、それぞれ等しい\n②対角は、それぞれ等しい', t: 5.0 }, { col: 0, type: 'text', size: 'xs', label: '予想', text: '③対角線は、中点で交わる\n（次の時間に証明）', t: 4.0 }] }),
    b('ストローの枠は、傾けても、向かい合う辺が、同じ長さなんだね！ 次は、対角線だ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
