/* 中2 5章 三角形と四角形　第3時（探）「2つの角が等しい三角形は、二等辺三角形といえるだろうか」。自作。
   底辺 BC＝6cm，底角 35°・45°・55° の作図：AB＝AC＝3÷cos（3.66，4.24，5.23）→ 表は 3.7／4.2／5.2。
   証明：∠B＝∠C，∠A の二等分線 AD → ∠BAD＝∠CAD，内角の和から ∠ADB＝∠ADC，AD 共通 → 1組の辺とその両端の角 → AB＝AC。
   応用：∠P＝∠Q＝55°（∠R＝70°）→ PR＝QR（等しい角の向かい側）。 */
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
  const T50 = 3 * Math.tan(50 * R), T35 = 3 * Math.tan(35 * R), T45 = 3 * Math.tan(45 * R), T55 = 3 * Math.tan(55 * R);
  const pA = [3, T50], pB = [0, 0], pC = [6, 0], pD = [3, 0];
  const f1 = FG('g1', -1.1, -0.9, 7.1, 4.7), f2 = FG('g2', -1.1, -0.9, 7.1, 4.9), f3 = FG('g3', -1.1, -0.9, 7.1, 4.7), f4 = FG('g4', -1.1, -0.9, 7.1, 4.7), f5 = FG('g5', -1.1, -0.9, 7.1, 4.7), f6 = FG('g6', -1.1, -0.9, 7.1, 4.9);
  const names = [dn(pA, 'A', [0, 1]), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7])];
  const basicAng = [ang(pB, pC, pA, 0.9, 1, 'p'), ang(pC, pB, pA, 0.9, 1, 'p')];
  const body1 = [tri([pA, pB, pC], 'w'), names, basicAng, tx([1.0, 2.2], '？', 'y', 'end'), tx([5.0, 2.2], '？', 'y', 'start')];
  const trio = [[T35, 'g'], [T45, 'b'], [T55, 'y']].map(([h, c]) => ({ h, c }));
  const mount = [ln(pB, pC, 'w'), dn(pB, 'B', [-0.7, -0.7]), dn(pC, 'C', [0.7, -0.7]),
    trio.map(o => [ln(pB, [3, o.h], o.c), ln(pC, [3, o.h], o.c), { k: 'pts', list: [[3, o.h]], c: o.c, r: 5 }]),
    tx([3.3, T35], '35°', 'g', 'start', 24), tx([3.3, T45 - 0.05], '45°', 'b', 'start', 24), tx([3.3, T55], '55°', 'y', 'start', 24)];
  const body3 = [tri([pA, pB, pC], 'w'), names, basicAng, ln(pA, pD, 'w', { dash: true }), dn(pD, 'D', [0, -1])];
  const halves = [ang(pA, pB, pD, 0.8, 1, 'g'), ang(pA, pD, pC, 0.8, 1, 'g')];
  const atD = [ang(pD, pB, pA, 0.5, 2, 'y', 10), ang(pD, pA, pC, 0.5, 2, 'y', 10)];
  const triL = tri([pA, pB, pD], 'p', 'p', { temp: true }), triR = tri([pA, pD, pC], 'b', 'b', { temp: true });
  const eqSide = [tick(pB, pA, 1, 'y'), tick(pC, pA, 1, 'y')];
  const qP = [0, 0], qQ = [6, 0], qR = [3, T55];
  const body6 = [tri([qR, qP, qQ], 'w'), dn(qR, 'R', [0, 1]), dn(qP, 'P', [-0.7, -0.7]), dn(qQ, 'Q', [0.7, -0.7]), ang(qP, qQ, qR, 0.9, 1, 'p'), ang(qQ, qP, qR, 0.9, 1, 'p'), tx([1.5, 0.45], '55°', 'p'), tx([4.5, 0.45], '55°', 'p'), tx([3, -0.62], '6cm', 'b')];
  const ans5 = [tick(qP, qR, 1, 'y'), tick(qQ, qR, 1, 'y')];
  const done = [tri([pA, pB, pC], 'w'), names, basicAng, eqSide];
  const t1 = [['底角', 'AB', 'AC'], ['35°', '3.7', '3.7'], ['45°', '4.2', '4.2'], ['55°', '5.2', '5.2']];

  KL.lesson({ id: 'g2u5-03', unit: '中2　三角形と四角形', kick: '2年5章　第3時', title: '2つの角が等しい三角形は、二等辺三角形といえるだろうか', card: '2つの角が等しい三角形は、二等辺三角形といえるだろうか', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、前の時間の、反対のことを、考えます。2つの角が等しい三角形は、二等辺三角形でしょうか。', { title: true, point: false, ft: 'happy' }),
    b('角が同じなら、辺も同じ！ ぼくと弟は、耳の形が同じで、しっぽの長さも、同じだもん！', { title: true, fb: 'proud', up: true }),
    t('たぬきの、耳としっぽの話では、証明になりませんよ。三角形で、じっくり、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('前の時間は、二等辺三角形なら、2つの底角が等しい、でした。今日は、さかさまです。∠B＝∠C の三角形を、考えます。', { part: '予想しよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '2つの角が等しい三角形は\n二等辺三角形といえるか', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', body1)] }),

    /* ---------- 問1（予想）---------- */
    Q('q1', t('問題です。∠B＝∠C の三角形 ABC で、辺 AB と辺 AC は、どうなっていそうでしょう。', { ft: 'normal' }),
      [{ t: '同じ長さ', ok: true }, { t: 'AB が、いつも長い' }, { t: 'AC が、いつも長い' }, { t: '決まらない' }],
      { 3: [b('ぼくと弟は、耳が同じでも、足の速さは、ちがうよ！ 決まらないでしょ？', { fb: 'happy', up: true }), t('たぬきは、たぬきの話です。三角形では、左右の角が同じなら、左右の辺も、同じになりそうです。', sad)],
        ok: [t('正解！ 同じ長さに、なりそうです。ただし、これは、まだ予想です。', { ft: 'happy' }), b('二等辺三角形に、なるってことだね！', { fb: 'star', up: true })],
        wrong: [t('そうは、見えませんね。左右の角が同じなら、辺も、同じ長さに、なりそうです。', { ft: 'normal' })] }),

    t('作図で、試してみましょう。底辺 BC を6cmにして、両はしから、同じ大きさの角を、ひきます。2本の線が交わる点が、A です。', { clear: true, cols: [0.34, 0.66], part: '作図で試そう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '実験', text: '底辺 BC＝6cm\n底角を、同じ大きさに', t: 3.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', mount)] }),
    t('底角が35°、45°、55°の、3つの三角形で、AB と AC の長さを、はかりました。結果は、こちらです。', { ft: 'normal', point: false,
      add: [tbl(t1, { col: 0, style: 'font-size:34px; align-self:center; margin-top:14px', t: 1.0 }), { col: 0, type: 'text', size: 'xs', label: '単位', text: '長さは、cm', t: 2.0 }] }),
    b('ほら、3回とも、AB＝AC！ 100回やっても、同じだよ！ もう、証明、おしまいだね！', { fb: 'happy', up: true }),
    t('何回かいても、まだ、かいていない三角形が、残ります。はかった長さには、ずれも出ます。証明が、必要です。', { ft: 'normal', point: false }),

    /* ---------- 3ページ目：証明の前半 ---------- */
    t('証明しましょう。仮定は、∠B＝∠C。結論は、AB＝AC です。作戦は、前の時間と、同じです。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: '∠B＝∠C', t: 3.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'AB＝AC', t: 3.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', body3)] }),
    t('∠A の二等分線を、ひいて、底辺との交点を、D とします。△ABD と △ACD を、比べます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '∠Aの二等分線ADをひく\n△ABD と △ACD において', t: 4.0 }], draw: [G('g3', triL, triR)] }),
    t('まず、仮定より、∠B＝∠C です。これを、①とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '仮定より　∠B＝∠C　…①', t: 2.5 }] }),
    t('次に、AD は、∠A の二等分線ですから、∠BAD＝∠CAD です。これを、②とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'ADは∠Aの二等分線より\n∠BAD＝∠CAD　…②', t: 3.5 }], draw: [G('g3', halves)] }),

    /* ---------- 4ページ目：証明の後半 ---------- */
    t('次は、∠ADB と ∠ADC です。三角形の内角の和は、180°ですから、△ABD と △ACD の、残りの角を、比べます。', { clear: true, cols: [0.34, 0.66], part: '証明の続き', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ここまで', text: '①∠B＝∠C\n②∠BAD＝∠CAD', t: 3.5 }, Object.assign(f4, { prims: [] })], draw: [G('g4', body3, halves)] }),

    /* ---------- 問2（∠ADB＝∠ADC の理由）---------- */
    Q('q2', t('問題です。①と②から、∠ADB＝∠ADC といえます。その理由は、どれでしょう。', { ft: 'normal' }),
      [{ t: '三角形の内角の和は180°', ok: true }, { t: '対頂角は、等しいから' }, { t: '仮定より' }, { t: 'AD が、二等分線だから' }],
      { 2: [b('∠ADB＝∠ADC も、仮定で、いいんじゃない？', { fb: 'happy', up: true }), t('仮定は、∠B＝∠C だけです。∠ADB＝∠ADC は、これから示す、ことがらです。', sad)],
        ok: [t('正解！ ∠ADB＝180°−∠B−∠BAD。∠ADC＝180°−∠C−∠CAD。①②より、等しくなります。', { ft: 'happy' }), b('等しいものを、同じ数だけ、ひくんだね！', { fb: 'star', up: true })],
        wrong: [t('∠ADB と ∠ADC は、となり合う角で、対頂角では、ありません。二等分線で等しいのは、∠BAD と ∠CAD だけです。', { ft: 'normal' })] }),

    t('これを、③とします。もう1つは、どちらの三角形にも入っている、共通な辺 AD です。これを、④とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '内角の和は180°だから\n∠ADB＝∠ADC　…③\n共通な辺　AD＝AD　…④', t: 5.0 }], draw: [G('g4', atD)] }),

    /* ---------- 問3（合同条件）---------- */
    Q('q3', t('問題です。②③④から、使える合同条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい' }, { t: '3組の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい', ok: true }],
      { 2: [b('角は、3組とも、等しいでしょ？', { fb: 'happy', up: true }), t('3組の角が等しいだけでは、合同条件では、ありません。それに、辺 AD も、使いたいのです。', sad)],
        ok: [t('正解！ 辺 AD の両端の角、∠BAD と ∠ADB が、それぞれ等しいですね。', { ft: 'happy' }), b('角・辺・角、そろってるね！', { fb: 'star', up: true })],
        wrong: [t('等しいとわかっている辺は、AD の1組だけです。3組の辺も、2組の辺も、そろっていません。', { ft: 'normal' })] }),

    t('②③④より、1組の辺と、その両端の角が、それぞれ等しいから、△ABD≡△ACD です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '②③④より、1組の辺と\nその両端の角が等しいから\n△ABD≡△ACD', t: 4.5 }] }),

    /* ---------- 問4（AB＝AC の根拠）---------- */
    Q('q4', t('問題です。△ABD≡△ACD から、AB＝AC といえます。その根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '仮定より' }, { t: '共通な辺だから' }, { t: '対応する辺は等しいから', ok: true }, { t: '二等辺三角形だから' }],
      { 3: [b('AB＝AC だから、二等辺三角形で、いいでしょ？', { fb: 'happy', up: true }), t('それは、順番が逆です。二等辺三角形と、いえるかどうかを、今、証明しているのです。', sad)],
        ok: [t('正解！ 合同な図形では、対応する辺は、等しいですね。AB と AC は、対応しています。', { ft: 'happy' }), b('合同から、辺が出てくるんだね！', { fb: 'star', up: true })],
        wrong: [t('AB＝AC は、仮定にも、共通な辺にも、ありません。根拠は、合同な図形の、対応する辺です。', { ft: 'normal' })] }),

    /* ---------- 5ページ目：定理と逆 ---------- */
    t('よって、AB＝AC。2つの角が等しい三角形は、二等辺三角形になる、と証明できました。', { clear: true, cols: [0.34, 0.66], part: 'わかったこと', ft: 'happy', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '対応する辺は等しいから\nAB＝AC', t: 3.0 }, { col: 0, type: 'box', color: 'y', size: 'xs', label: '定理', text: '2つの角が等しい三角形は\n二等辺三角形である', t: 4.5 }, Object.assign(f5, { prims: [] })], draw: [G('g5', done)] }),
    t('前の時間の定理と、並べます。「二等辺三角形なら、底角が等しい」と、今日の定理は、仮定と結論が、入れかわっています。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'さかさま', text: '二等辺三角形ならば\n　2つの底角は等しい\n2つの角が等しいならば\n　二等辺三角形', t: 6.0 }] }),
    t('この関係を、「逆」といいます。くわしくは、次の時間です。では、三角形 PQR で、使ってみましょう。∠P＝∠Q＝55°です。', { clear: true, cols: [0.34, 0.66], part: '使ってみよう', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: '∠P＝∠Q＝55°\n等しい2辺は？', t: 3.5 }, Object.assign(f6, { prims: [] })], draw: [G('g6', body6)] }),

    /* ---------- 問5（応用）---------- */
    Q('q5', t('最後の問題です。この三角形で、長さが等しい2辺は、どれでしょう。', { ft: 'happy' }),
      [{ t: 'PQ と PR' }, { t: 'PR と QR', ok: true }, { t: 'PQ と QR' }, { t: '3つの辺ぜんぶ' }],
      { 0: [b('∠P と ∠Q が等しいから、P と Q から出る、PQ と PR！', { fb: 'happy', up: true }), t('等しい角の「向かい側」の辺が、等しくなります。∠P の向かいは QR、∠Q の向かいは PR です。', sad)],
        3: [t('∠R は、180°−55°×2＝70°です。3つの角が等しくないので、3辺は、等しくありません。', { ft: 'normal' })],
        ok: [t('正解！ ∠P の向かいが QR、∠Q の向かいが PR。等しい角の向かい側の辺が、等しくなります。', { ft: 'happy' }), b('PR＝QR の、二等辺三角形だね！', { fb: 'star', up: true })],
        wrong: [t('PQ は、∠R の向かい側です。等しいのは、∠P の向かいの QR と、∠Q の向かいの PR です。', { ft: 'normal' })] }),

    t('2つの角が等しければ、その向かい側の辺も、等しくなります。この三角形は、二等辺三角形です。', { ft: 'normal', point: false,
      draw: [G('g6', ans5)],
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '等しい2つの角の\n向かい側の辺は等しい', t: 5.0 }] }),
    b('たぬきの耳でも、三角形でも、角が同じなら、辺も同じ！ …三角形だけ、だったね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
