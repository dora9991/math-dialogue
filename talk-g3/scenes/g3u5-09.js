/* 中3 5章 相似な図形　第9時（探）「線分の比が等しければ、平行といえるだろうか」。自作。三角形と比の逆。
   図：△ABC（A(3.2,4.3)，B(0.5,0.6)，C(7.4,0.6)，∠B≒53.9°）。D＝A＋0.4(B−A)，E＝A＋0.4(C−A)（AD：DB＝AE：EC＝2：3，DE∥BC，∠ADE＝∠ABC≒54°）。
   反例の図：E′＝A＋0.6(C−A)（AE′：E′C＝3：2）→ ∠ADE′≒65.5°≠∠ABC。
   証明：AD：AB＝AE：AC，∠A 共通 → 2組の辺の比とその間の角 → △ADE∽△ABC → ∠ADE＝∠ABC（同位角が等しい）→ DE∥BC。
   表：ア（2，3，3，4），イ（4，6，6，9），ウ（3，5，5，3），エ（4，5，8，9）：AD，DB，AE，EC。イ だけ AD：DB＝AE：EC＝2：3。 */
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
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const sc = (c, p, k) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k];      // 中心 c、倍率 k の拡大・縮小
  const cen = ps => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];
  const rot = (p, c, d) => { const a = d * R, x = p[0] - c[0], y = p[1] - c[1]; return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]; };
  // 辺の長さから三角形：B＝P，C＝P＋(bc,0)，A は上（flip で下）。AB＝ab，CA＝ca。[A,B,C] を返す
  const T3 = (P, bc, ab, ca, flip) => {
    const cb = (ab * ab + bc * bc - ca * ca) / (2 * ab * bc), sb = Math.sqrt(1 - cb * cb) * (flip ? -1 : 1);
    return [[P[0] + ab * cb, P[1] + ab * sb], P, [P[0] + bc, P[1]]];
  };
  const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
  // 2辺とその間の角から三角形：A＝P，B＝P＋(c,0)（AB＝c），AC＝b で ∠A＝deg。[A,B,C] を返す
  const SAS = (P, c, b, deg) => [P, [P[0] + c, P[1]], [P[0] + b * Math.cos(deg * R), P[1] + b * Math.sin(deg * R)]];
  // 1辺とその両端の角から三角形：P（左・角 aP），Q＝P＋(len,0)（右・角 aQ），R は上。[P,Q,R] を返す
  const ASA = (P, len, aP, aQ) => { const pr = len * Math.sin(aQ * R) / Math.sin((aP + aQ) * R); return [P, [P[0] + len, P[1]], [P[0] + pr * Math.cos(aP * R), P[1] + pr * Math.sin(aP * R)]]; };
  // 角の大きさの文字：頂点 v、v→p と v→q のあいだの内側（距離 r）
  const angLab = (v, p, q, r, text, c) => { const u = unit(v, p), w = unit(v, q), s = unit([0, 0], [u[0] + w[0], u[1] + w[1]]); return tx([v[0] + s[0] * r, v[1] + s[1] * r - 0.08], text, c || 'w', 'middle', 24); };
  // 辺 ab の外側（図形の重心 ps と反対がわ）にそえる長さの文字
  const sl = (a, b, ps, text, c, d) => { const m = lerp(a, b, 0.5), u = unit(cen(ps), m); return tx([m[0] + u[0] * (d || 0.42), m[1] + u[1] * (d || 0.42) - 0.1], text, c || 'w', 'middle', 26); };
  // 頂点の名前：図形の重心から外へ向ける
  const nm = (ps, names, c) => ps.map((p, i) => dn(p, names[i], unit(cen(ps), p), c));
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
  /* ---- 読み上げ（say）：記号・比・英字を、ひらがな・カタカナの読みにする ---- */
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const plainS = s => s.replace(/\{\{|\}\}|\*\*/g, '');
  const KS = { a: 'エー', b: 'ビー', c: 'シー', d: 'ディー', e: 'イー', f: 'エフ', g: 'ジー', h: 'エイチ', k: 'ケー', n: 'エヌ', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', x: 'エックス', y: 'ワイ', z: 'ゼット' };
  const NUM = ['いち', 'に', 'さん', 'よん', 'ご'];
  const rd = s => plainS(s)
    .replace(/[①-⑤]+/g, m => m.length === 1 ? 'まる' + NUM['①②③④⑤'.indexOf(m)] + '、' : [...m].map(c => NUM['①②③④⑤'.indexOf(c)]).join('、') + '、')
    .replace(/\[\[(\d+)\/(\d+)\]\]/g, '$2分の$1')
    .replace(/相似比/g, 'そうじひ').replace(/相似/g, 'そうじ').replace(/縮図/g, 'しゅくず').replace(/縮尺/g, 'しゅくしゃく').replace(/対頂角/g, 'たいちょうかく').replace(/同位角/g, 'どういかく').replace(/錯角/g, 'さっかく')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/∽/g, ' そうじ ').replace(/≡/g, ' 合同 ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/：/g, ' たい ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ')
    .replace(/(?<=[0-9°度A-Za-z）)])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/[(（]/g, 'かっこ、').replace(/[)）]/g, '、かっことじ、')
    .replace(/²/g, 'の2乗').replace(/(?<=[0-9何xy] ?)cm(?![a-z²³])/g, 'センチ').replace(/(?<=[0-9何])m(?![a-z])/g, 'メートル')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/′/g, 'ダッシュ ')
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const t = wrap(T), b = wrap(B);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  const A0 = [3.2, 4.3], B0 = [0.5, 0.6], C0 = [7.4, 0.6], D0 = lerp(A0, B0, 0.4), E0 = lerp(A0, C0, 0.4), E1 = lerp(A0, C0, 0.6);
  const f1 = FG('g1', -0.6, -0.7, 8.4, 5.2), f2 = FG('g2', -0.6, -0.7, 8.4, 5.2), f3 = FG('g3', -0.6, -0.7, 8.4, 5.2);
  const base0 = [tri([A0, B0, C0], 'w', 'y'), ln(D0, E0, 'g', { wd: 3.8 }), nm([A0, B0, C0], ['A', 'B', 'C']), dn(D0, 'D', [-1, 0.1]), dn(E0, 'E', [1, 0.1])];
  const ratio0 = [sl(A0, D0, [A0, B0, C0], '2', 'y', 0.4), sl(D0, B0, [A0, B0, C0], '3', 'y', 0.4), sl(A0, E0, [A0, B0, C0], '2', 'b', 0.4), sl(E0, C0, [A0, B0, C0], '3', 'b', 0.4)];
  const arcs0 = [ang(D0, A0, E0, 0.55, 2, 'p'), ang(B0, A0, C0, 0.55, 2, 'p'), angLab(D0, A0, E0, 1.15, '約54°', 'p'), angLab(B0, A0, C0, 1.2, '約54°', 'p')];
  const par0 = [par(D0, E0, 1, 'p'), par(B0, C0, 1, 'p')];
  const base1 = [tri([A0, B0, C0], 'w', 'y'), ln(D0, E1, 'g', { wd: 3.8 }), nm([A0, B0, C0], ['A', 'B', 'C']), dn(D0, 'D', [-1, 0.1]), dn(E1, 'E′', [1, 0.3])];
  const ratio1 = [sl(A0, D0, [A0, B0, C0], '2', 'y', 0.4), sl(D0, B0, [A0, B0, C0], '3', 'y', 0.4), sl(A0, E1, [A0, B0, C0], '3', 'b', 0.4), sl(E1, C0, [A0, B0, C0], '2', 'b', 0.4)];
  const arcs1 = [ang(D0, A0, E1, 0.55, 1, 'g'), ang(B0, A0, C0, 0.55, 2, 'p'), angLab(D0, A0, E1, 1.15, '約65°', 'g'), angLab(B0, A0, C0, 1.2, '約54°', 'p')];
  const arcA0 = [ang(A0, B0, C0, 0.6, 1, 'g')];
  const t9 = [['', 'AD', 'DB', 'AE', 'EC'], ['ア', '2cm', '3cm', '3cm', '4cm'], ['イ', '4cm', '6cm', '6cm', '9cm'], ['ウ', '3cm', '5cm', '5cm', '3cm'], ['エ', '4cm', '5cm', '8cm', '9cm']];

  KL.lesson({ id: 'g3u5-09', unit: '中3　相似な図形', kick: '3年5章　第9時', title: '線分の比が等しければ、平行といえるだろうか', card: '線分の比が等しければ、平行といえるだろうか', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、三角形と比の定理の、逆が成り立つかどうかを、考えます。', { title: true, point: false, ft: 'happy' }),
    b('雨が降ったら、地面がぬれるよね。だから、地面がぬれていたら、雨が降ったってことでしょ？', { title: true, fb: 'proud', up: true }),
    t('打ち水かもしれませんよ。ある文の逆が、いつも正しいとは、かぎりません。今日は、これを調べます。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('前の時間に、三角形と比の定理を、学びました。DE∥BC ならば、AD：AB＝AE：AC です。', { part: '定理の逆とは', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '定理', text: 'DE∥BC ならば\nAD：AB＝AE：AC', t: 4.0 }] }),
    t('「AならばB」の、仮定と結論を、入れかえた文を、逆といいます。この定理の逆は、どんな文でしょう。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。この定理の逆は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'DE∥BC ならば DE＝BC' }, { t: 'AD＝AE ならば DE∥BC' }, { t: 'AD：AB＝AE：ACならばDE∥BC', ok: true }, { t: 'AD：AB＝AE：ACならばDE＝BC' }],
      { 3: [b('比が等しいなら、DE も BC と、等しいでしょ！ ならばの後ろだけ、変えたよ！', { fb: 'happy', up: true }), t('逆は、仮定と結論を、入れかえます。結論の DE∥BC が、仮定になります。DE＝BC では、ありません。', sad)],
        ok: [t('正解！ もとの文の、仮定と結論を、入れかえます。AD：AB＝AE：AC ならば DE∥BC が、逆です。', { ft: 'happy' }), b('「ならば」の前と後ろを、ひっくり返すんだね！', { fb: 'star', up: true })],
        wrong: [t('これは、仮定か結論の、片方だけを変えた文です。逆は、仮定と結論を、そっくり入れかえます。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：逆を調べる ---------- */
    t('この逆は、正しいでしょうか。調べてみます。AD：DB＝2：3、AE：EC＝2：3 になるように、D と E をとります。', { clear: true, cols: [0.34, 0.66], part: '逆を調べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べること', text: '比が等しいとき\n平行になるか', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', base0, ratio0)] }),

    /* ---------- 問2（予想）---------- */
    Q('q2', t('問題です。AD：DB＝AE：EC のとき、DE と BC は、どうなりそうでしょう。', { ft: 'normal' }),
      [{ t: '同じ長さになりそう' }, { t: '平行になりそう', ok: true }, { t: '垂直になりそう' }, { t: '決まらない' }],
      { 0: [b('比が同じなら、DE も BC と、同じ長さでしょ！ 逆でも、同じだよ！', { fb: 'happy', up: true }), t('等しいのは、AD：DB と AE：EC の、比です。DE の長さは、BC と同じとは、かぎりません。図でも、DE は短いですね。', sad)],
        3: [t('決まらないことは、ありません。図を見ると、DE と BC は、同じ向きに見えます。確かめましょう。', { ft: 'normal' })],
        ok: [t('正解！ 図を見ると、DE と BC は、平行に見えます。角を測って、確かめましょう。', { ft: 'happy' }), b('たしかに、同じ向きに、見えるよ！', { fb: 'star', up: true })],
        wrong: [t('垂直には、見えません。DE と BC は、同じ向きに、傾いています。角を測って、確かめましょう。', { ft: 'normal' })] }),

    t('角を測ると、∠ADE と ∠ABC は、どちらも約54°でした。同位角が、等しいですね。', { ft: 'normal', point: false, draw: [G('g1', arcs0, par0)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '測った結果', text: '∠ADE＝約54°\n∠ABC＝約54°', t: 4.0 }] }),

    /* ---------- 3ページ目：比がそろわない場合 ---------- */
    t('もし、比がそろっていないと、どうなるでしょう。AD：DB は 2：3 のまま、AE：EC を 3：2 にして、E′ をとります。', { clear: true, cols: [0.34, 0.66], part: '比がそろわないとき', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '比べる', text: 'AD：DB＝2：3\nAE′：E′C＝3：2', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', base1, ratio1)] }),
    t('このとき、∠ADE′ は約65°で、∠ABC は約54°です。同位角が、等しくありません。DE′ は、BC に平行では、ありません。', { ft: 'normal', point: false, draw: [G('g2', arcs1)] }),
    t('比が、等しくなければ、平行にはなりません。「比が等しい」という条件が、大切です。', { ft: 'normal', point: false }),

    /* ---------- 4ページ目：証明 ---------- */
    t('比が等しいとき、平行になることを、証明します。仮定は AD：AB＝AE：AC、結論は DE∥BC です。', { clear: true, cols: [0.34, 0.66], part: '逆を証明しよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AD：AB＝AE：AC', t: 3.5 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'DE∥BC', t: 3.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', base0, ratio0, arcA0)] }),
    t('まず、△ADE と △ABC を、比べます。AD：AB＝AE：AC が、仮定です。使う相似条件を、考えましょう。', { ft: 'normal', point: false }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。△ADE∽△ABC を示す、相似条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '2組の辺の比とその間の角がそれぞれ等しい', ok: true }, { t: '3組の辺の比がすべて等しい' }, { t: '2組の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }],
      { 2: [b('相似なら、角が等しいから、2組の角でしょ！', { fb: 'happy', up: true }), t('角が等しいことは、まだ、わかっていません。わかっているのは、辺の比です。ここから、角を導きます。', sad)],
        1: [t('3組目の比 DE：BC は、まだ、わかっていません。わかっているのは、2組の辺の比です。', { ft: 'normal' })],
        ok: [t('正解！ AD：AB＝AE：AC と、その間の角 ∠A は、共通です。2組の辺の比と、その間の角が等しいので、△ADE∽△ABC です。', { ft: 'happy' }), b('共通な角が、間の角になるんだね！', { fb: 'star', up: true })],
        wrong: [t('それは、合同条件です。ここでは、辺の比が、使えます。その間の角を、使って、相似を示します。', { ft: 'normal' })] }),

    t('相似な図形では、対応する角が、等しくなります。だから、∠ADE＝∠ABC です。この2つは、同位角です。', { ft: 'normal', point: false, draw: [G('g3', arcs0.slice(0, 2))],
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '2組の辺の比と\nその間の角が等しいから\n△ADE∽△ABC\nよって ∠ADE＝∠ABC', t: 6.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。∠ADE＝∠ABC から、DE∥BC といえる、理由は、どれでしょう。', { ft: 'normal' }),
      [{ t: '錯角が等しいから' }, { t: '対頂角が等しいから' }, { t: '共通な角だから' }, { t: '同位角が等しいから', ok: true }],
      { 0: [b('平行かどうかは、Z の形の、錯角で決めるんでしょ？', { fb: 'happy', up: true }), t('∠ADE と ∠ABC は、同じ向きの角で、同位角です。錯角では、ありません。同位角が等しければ、平行です。', sad)],
        1: [t('対頂角は、2直線が交わってできる、向かい合う角です。∠ADE と ∠ABC は、ちがいます。', { ft: 'normal' })],
        ok: [t('正解！ 同位角が等しいので、DE∥BC です。逆が、証明できました。', { ft: 'happy' }), b('角が等しければ、平行なんだね！', { fb: 'star', up: true })],
        wrong: [t('共通な角は、∠A です。∠ADE と ∠ABC は、頂点がちがいます。同位角が等しいから、平行です。', { ft: 'normal' })] }),

    t('AD：DB＝AE：EC でも、同じです。AD：DB＝2：3 なら、AD：AB＝2：5 です。AE：EC＝2：3 なら、AE：AC＝2：5 です。', { ft: 'normal', point: false, draw: [G('g3', par0)] }),

    /* ---------- 5ページ目：表から選ぶ ---------- */
    t('では、使ってみましょう。△ABC の辺 AB、AC 上に、D、E をとります。表の ア から エ の中で、DE∥BC といえるものを、探します。', { clear: true, cols: [0.34, 0.66], part: '使ってみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '調べること', text: 'AD：DB と\nAE：EC が\n等しいか', t: 4.0 }, tbl(t9, { col: 1, style: 'font-size:40px; align-self:center; margin-top:14px', t: 1.0 })] }),

    /* ---------- 問5 ---------- */
    Q('q5', t('問題です。DE∥BC といえるのは、どれでしょう。', { ft: 'normal' }),
      [{ t: 'ア' }, { t: 'イ', ok: true }, { t: 'ウ' }, { t: 'エ' }],
      { 3: [b('AE が AD の2倍だから、EC も DB の2倍で、平行でしょ！', { fb: 'happy', up: true }), t('EC は9cm、DB の2倍は10cm です。2倍には、なっていません。AD：DB は 4：5、AE：EC は 8：9 で、等しくありません。', sad)],
        2: [t('ウ は、AD：DB が 3：5、AE：EC が 5：3 です。順番が逆で、等しくありません。', { ft: 'normal' })],
        ok: [t('正解！ イは、AD：DB が 4：6 で 2：3、AE：EC が 6：9 で 2：3 です。比が等しいので、DE∥BC です。', { ft: 'happy' }), b('2：3 と 2：3 で、そろったね！', { fb: 'star', up: true })],
        wrong: [t('ア は、AD：DB が 2：3、AE：EC が 3：4 です。比が、そろっていません。', { ft: 'normal' })] }),

    t('まとめです。AD：AB＝AE：AC ならば、DE∥BC です。比が等しいことから、平行が言えます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 1, type: 'box', color: 'y', size: 'sm', label: '三角形と比の定理の逆', text: 'AD：AB＝AE：AC ならば DE∥BC\nAD：DB＝AE：EC ならば DE∥BC', t: 7.0 }] }),
    b('おなかが鳴ったら、おなかがすいている。でも、おなかがすいても、鳴るとは、かぎらないんだね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
