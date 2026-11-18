/* 中3 5章 相似な図形　第10時（探）「2辺の中点を結ぶと、どんなことがいえるだろう」。自作。中点連結定理。
   図1：△ABC（AB=6，BC=8，CA=7 cm，0.8 倍で描く。∠B≒57.9°）。D，E は AB，AC の中点：DE∥BC，DE＝BC÷2＝4cm，∠ADE＝∠ABC≒58°。
   表：BC＝8，10，7 → DE＝4，5，3.5。
   証明：AD：AB＝AE：AC＝1：2 → 逆で DE∥BC。△ADE∽△ABC（相似比 1：2）→ DE：BC＝1：2。
   図2：△ABC（AB=10，BC=12，CA=14，0.42 倍）。D，E，F は AB，BC，CA の中点。DE∥CA，DE＝CA÷2＝7（AB÷2＝5，BC÷2＝6 は誤り）。 */
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
  const mid = (p, q) => lerp(p, q, 0.5);
  const sat = (a, b, k, ps, text, d) => { const m = lerp(a, b, k), u = unit(cen(ps), lerp(a, b, 0.5)); return tx([m[0] + u[0] * d, m[1] + u[1] * d - 0.1], text, 'w', 'middle', 26); };   // 辺 ab の、a から k の所の外側に長さの文字
  /* ---- 図1：2辺の中点 ---- */
  const s1 = 0.8;
  const T1 = T3([0.8, 0.6], 8 * s1, 6 * s1, 7 * s1);                           // [A,B,C]
  const [A1, B1, C1] = T1, D1 = mid(A1, B1), E1 = mid(A1, C1);
  const f1 = FG('g1', -0.3, -0.7, 8.0, 5.2), f1b = FG('g1b', -0.3, -0.7, 8.0, 5.2);
  const base1 = [tri(T1, 'w', 'y'), ln(D1, E1, 'g', { wd: 3.8 }), nm(T1, ['A', 'B', 'C']), dn(D1, 'D', [-1, 0.2]), dn(E1, 'E', [1, 0.2]),
    tick(A1, D1, 1, 'y'), tick(D1, B1, 1, 'y'), tick(A1, E1, 2, 'b'), tick(E1, C1, 2, 'b')];
  const meas1 = [sl(B1, C1, T1, '8cm', 'w'), tx([(D1[0] + E1[0]) / 2, D1[1] + 0.3], '4cm', 'g', 'middle', 26), ang(D1, A1, E1, 0.5, 2, 'p'), ang(B1, A1, C1, 0.5, 2, 'p'), par(D1, E1, 1, 'p'), par(B1, C1, 1, 'p')];
  const t10 = [['三角形', 'BC', 'DE', '∠ADE と ∠ABC'], ['ア', '8cm', '4cm', '等しい'], ['イ', '10cm', '5cm', '等しい'], ['ウ', '7cm', '3.5cm', '等しい']];
  /* ---- 図2：3辺の中点 ---- */
  const s2 = 0.42;
  const T2 = T3([0.8, 0.6], 12 * s2, 10 * s2, 14 * s2);                         // [A,B,C]
  const [A2, B2, C2] = T2, D2 = mid(A2, B2), E2 = mid(B2, C2), F2 = mid(C2, A2);
  const f2 = FG('g2', -0.2, -0.7, 7.4, 5.5);
  const base2 = [tri(T2, 'w', 'y'), ln(D2, E2, 'g', { wd: 3.8 }), ln(E2, F2, 'w', { wd: 2.6, dash: true }), ln(F2, D2, 'w', { wd: 2.6, dash: true }), nm(T2, ['A', 'B', 'C']),
    dn(D2, 'D', [-1, 0.1]), dn(E2, 'E', [0.1, -1]), dn(F2, 'F', [1, 0.2]), tick(A2, D2, 1, 'y'), tick(D2, B2, 1, 'y'), tick(B2, E2, 2, 'b'), tick(E2, C2, 2, 'b'), tick(C2, F2, 3, 'p'), tick(F2, A2, 3, 'p'),
    sat(A2, B2, 0.22, T2, '10cm', 0.6), sat(B2, C2, 0.22, T2, '12cm', 0.45), sat(C2, A2, 0.78, T2, '14cm', 0.6)];

  KL.lesson({ id: 'g3u5-10', unit: '中3　相似な図形', kick: '3年5章　第10時', title: '2辺の中点を結ぶと、どんなことがいえるだろう', card: '2辺の中点を結ぶと、どんなことがいえるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、三角形の2つの辺の、真ん中の点を結ぶと、どんなことがいえるかを、探します。', { title: true, point: false, ft: 'happy' }),
    b('連結って、電車の連結だよね？ 真ん中の車両どうしを、つなげるの？', { title: true, fb: 'confused', up: true }),
    t('電車では、ありません。辺の真ん中の点を、中点といいます。中点どうしを結ぶ線分の、お話です。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。△ABC で、辺 AB の中点を D、辺 AC の中点を E とします。D と E を結びます。DE と BC は、どんな関係でしょう。', { part: '中点を結んでみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '2辺の中点を結ぶと\nどんなことがいえるか', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', base1)] }),

    /* ---------- 問1（予想）---------- */
    Q('q1', t('問題です。DE と BC には、どんな関係が、ありそうでしょう。', { ft: 'normal' }),
      [{ t: '平行で、長さは同じ' }, { t: '垂直で、長さは半分' }, { t: '平行で、長さは2倍' }, { t: '平行で、長さは半分', ok: true }],
      { 0: [b('真ん中どうしを、結ぶんだから、同じ長さでしょ！ 平行なら、いっしょだよ！', { fb: 'happy', up: true }), t('平行でも、長さが同じとは、かぎりません。DE は、BC より、ずっと短く見えますね。', sad)],
        2: [t('DE は、BC より、長くありません。図で見ると、DE のほうが、短いですね。', { ft: 'normal' })],
        ok: [t('正解！ 平行で、長さが半分に、なりそうです。測って、確かめましょう。', { ft: 'happy' }), b('半分だと、ちょうど、いい感じだね！', { fb: 'star', up: true })],
        wrong: [t('DE と BC は、同じ向きに、傾いています。垂直には、見えません。', { ft: 'normal' })] }),

    t('測ってみます。BC は8cm、DE は4cm でした。∠ADE と ∠ABC は、どちらも約58°で、同位角が等しくなっています。', { ft: 'normal', point: false, draw: [G('g1', meas1)] }),

    /* ---------- 2ページ目：別の三角形 ---------- */
    t('別の三角形でも、調べました。DE の長さは、どれも BC の半分で、∠ADE と ∠ABC は、等しくなりました。', { clear: true, cols: [0.34, 0.66], part: '別の三角形でも', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '条件', text: 'D は AB の中点\nE は AC の中点', t: 4.0 }, tbl(t10, { col: 1, style: 'font-size:40px; align-self:center; margin-top:14px', t: 1.0 })] }),
    t('どんな三角形でも、いえそうです。なぜなのか、理由を考えましょう。これまでに学んだ、定理が使えます。', { ft: 'normal', point: false }),

    /* ---------- 3ページ目：理由 ---------- */
    t('D、E は、AB、AC の中点ですから、AD：AB＝1：2、AE：AC＝1：2 です。2つの比が、等しくなりました。', { clear: true, cols: [0.34, 0.66], part: 'わけを考えよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'わかること', text: 'AD：AB＝1：2\nAE：AC＝1：2', t: 4.5 }, Object.assign(f1b, { prims: [] })], draw: [G('g1b', base1)] }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。比が等しいことから、DE∥BC を導く定理は、どれでしょう。', { ft: 'normal' }),
      [{ t: '三角形と比の定理' }, { t: '合同条件' }, { t: '三角形と比の定理の逆', ok: true }, { t: '対頂角は等しい' }],
      { 0: [b('三角形と比の定理で、平行になるんだよね？ さっき習ったよ！', { fb: 'happy', up: true }), t('三角形と比の定理は、平行から、比が等しいことを導きます。ここでは、比から平行を導くので、逆を使います。', sad)],
        ok: [t('正解！ AD：AB＝AE：AC ですから、三角形と比の定理の逆で、DE∥BC です。', { ft: 'happy' }), b('比が等しいと、平行になるんだったね！', { fb: 'star', up: true })],
        wrong: [t('ここでは、辺の比から、平行を導きたいので、三角形と比の定理の逆を使います。', { ft: 'normal' })] }),

    t('次は、長さです。△ADE と △ABC は、相似で、相似比は 1：2 です。だから、DE：BC＝1：2 で、DE は BC の半分です。', { ft: 'normal', point: false, draw: [G('g1b', meas1.slice(2, 4))],
      add: [{ col: 0, type: 'text', size: 'xs', label: '相似比', text: '△ADE∽△ABC\n相似比 1：2', t: 4.0 }] }),
    t('これを、中点連結定理といいます。2辺の中点を結ぶと、残りの辺に平行で、長さは、その半分になります。', { ft: 'happy', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '中点連結定理', text: 'AB、AC の中点 D、E\nならば DE∥BC\nDE＝BC の半分', t: 7.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。AB、AC の中点 D、E を結んだ DE が、9cm でした。BC の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '27cm' }, { t: '18cm', ok: true }, { t: '9cm' }, { t: '4.5cm' }],
      { 3: [b('半分だから、9cm の半分で、4.5cm！', { fb: 'happy', up: true }), t('半分になるのは、DE のほうです。BC は、DE の2倍です。9×2＝18cm です。', sad)],
        2: [t('DE と BC は、同じ長さでは、ありません。BC は、DE の2倍です。', { ft: 'normal' })],
        ok: [t('正解！ DE は、BC の半分ですから、BC は DE の2倍です。9×2＝18cm です。', { ft: 'happy' }), b('半分の半分に、してはいけないんだね！', { fb: 'star', up: true })],
        wrong: [t('27cm は、DE の3倍です。中点を結んだ DE は、BC の半分ですから、BC は DE の2倍です。', { ft: 'normal' })] }),

    /* ---------- 4ページ目：3辺の中点 ---------- */
    t('もう1つの図です。△ABC の、3辺の中点を、D、E、F とします。D は AB、E は BC、F は CA の中点です。', { clear: true, cols: [0.34, 0.66], part: '3辺の中点', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AB＝10cm\nBC＝12cm\nCA＝14cm', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', base2)] }),
    t('中点連結定理を使って、線分 DE について、調べます。DE は、2辺 AB と BC の、中点を結んでいます。', { ft: 'normal', point: false }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。DE は、どの辺と、平行でしょうか。', { ft: 'normal' }),
      [{ t: 'CA', ok: true }, { t: 'AB' }, { t: 'BC' }, { t: 'どの辺とも平行でない' }],
      { 2: [b('D と E を結ぶから、いちばん近い辺、BC と平行でしょ！', { fb: 'happy', up: true }), t('D は AB の中点、E は BC の中点です。2辺が出会う頂点は B です。DE は、B の向かい側の辺 CA と、平行です。', sad)],
        1: [t('AB は、D が中点になっている辺です。DE は、AB と、D で交わります。平行では、ありません。', { ft: 'normal' })],
        ok: [t('正解！ D、E は、AB と BC の中点です。B の向かい側の辺 CA に、DE∥CA です。', { ft: 'happy' }), b('頂点 B の、反対側なんだね！', { fb: 'star', up: true })],
        wrong: [t('中点連結定理から、DE は、残りの辺 CA と、平行になります。平行にならない辺は、ありません。', { ft: 'normal' })] }),

    /* ---------- 問5 ---------- */
    Q('q5', t('問題です。DE の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '5cm' }, { t: '6cm' }, { t: '7cm', ok: true }, { t: '14cm' }],
      { 0: [b('AB が10cm だから、半分の5cm でしょ！ いちばん上の辺だよ！', { fb: 'happy', up: true }), t('5cm は、AB の半分です。DE は、B をはさむ2辺の中点を結ぶので、残りの CA の半分です。14÷2＝7cm です。', sad)],
        1: [t('6cm は、BC の半分です。DE が、半分になるのは、平行な辺 CA です。', { ft: 'normal' })],
        ok: [t('正解！ DE∥CA で、DE は、CA の半分です。14÷2＝7cm です。', { ft: 'happy' }), b('平行な辺の、半分なんだね！', { fb: 'star', up: true })],
        wrong: [t('14cm は、CA の長さです。DE は、その半分です。14÷2＝7cm です。', { ft: 'normal' })] }),

    t('まとめです。2辺の中点を結ぶと、残りの辺に平行で、長さが半分の線分が、できます。これが、中点連結定理です。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '2辺の中点を結ぶ\n→ 残りの辺と平行\n→ 長さは半分', t: 6.5 }] }),
    b('真ん中どうしを結ぶと、半分の長さで、平行。連結は、電車より、数学のほうが、わかりやすいね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
