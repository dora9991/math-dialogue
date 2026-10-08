/* 中3 5章 相似な図形　第7時（探）「三角形の辺に平行な直線をひくと、どんな比ができるだろう」。自作。三角形と比（DE∥BC → AD：AB＝AE：AC＝DE：BC，AD：DB＝AE：EC）。
   図：△ABC（AB=6，AC=7.5，BC=9 cm，0.7 倍で描く。辺の比 4：5：6）。D＝A＋(1/3)(B−A)，E＝A＋(1/3)(C−A)。AD=2，DB=4，AE=2.5，EC=5，DE=3。
   表：AB の 1/3，1/2，2/3 で DE∥BC → AD：AB＝AE：AC＝DE：BC がそろう（1：3，1：2，2：3）。AD：DB＝1：2，DE：BC＝1：3 なので AD：DB＝DE：BC は誤り。 */
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
    .replace(/²/g, 'の2乗').replace(/(?<=[0-9何xy] ?)cm(?![a-z²³])/g, 'センチ').replace(/(?<=[0-9])m(?![a-z])/g, 'メートル')
    .replace(/[A-Z]+/g, m => [...m].map(c => KA[c] || c).join(''))
    .replace(/′/g, 'ダッシュ ')
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const t = wrap(T), b = wrap(B);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  const s7 = 0.7;
  const T7 = T3([0.8, 0.6], 9 * s7, 6 * s7, 7.5 * s7);                         // [A,B,C]
  const [A7, B7, C7] = T7, D7 = lerp(A7, B7, 1 / 3), E7 = lerp(A7, C7, 1 / 3);
  const f1 = FG('g1', -0.2, -0.7, 8.0, 4.6), f2 = FG('g2', -0.2, -0.7, 8.0, 4.6);
  const base7 = [tri(T7, 'w', 'y'), ln(D7, E7, 'g', { wd: 3.8 }), dn(A7, 'A', [0, 1]), dn(B7, 'B', [-0.7, -0.7]), dn(C7, 'C', [0.7, -0.7]), dn(D7, 'D', [-1, 0.2]), dn(E7, 'E', [1, 0.2]), par(D7, E7, 1, 'p'), par(B7, C7, 1, 'p')];
  const len7 = [sl(A7, D7, T7, '2cm', 'y', 0.5), sl(D7, B7, T7, '4cm', 'y', 0.5), sl(A7, E7, T7, '2.5cm', 'b', 0.55), sl(E7, C7, T7, '5cm', 'b', 0.55), sl(B7, C7, T7, '9cm', 'w'), tx([(D7[0] + E7[0]) / 2, D7[1] + 0.3], 'DE は？', 'g', 'middle', 24)];
  const triADE = tri([A7, D7, E7], 'b', 'b', { temp: true });
  const arcs7 = [ang(A7, B7, C7, 0.6, 1, 'g'), ang(D7, A7, E7, 0.5, 2, 'p'), ang(B7, A7, C7, 0.5, 2, 'p'), ang(E7, A7, D7, 0.5, 3, 'b'), ang(C7, A7, B7, 0.5, 3, 'b')];
  const t7 = [['切る位置', 'AD：AB', 'AE：AC', 'DE：BC'], ['AB の3分の1', '1：3', '1：3', '1：3'], ['AB の2分の1', '1：2', '1：2', '1：2'], ['AB の3分の2', '2：3', '2：3', '2：3']];

  KL.lesson({ id: 'g3u5-07', unit: '中3　相似な図形', kick: '3年5章　第7時', title: '三角形の辺に平行な直線をひくと、どんな比ができるだろう', card: '三角形の辺に平行な直線をひくと、どんな比ができるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、三角形の辺に、平行な直線をひいたとき、どんな比ができるかを、探します。', { title: true, point: false, ft: 'happy' }),
    b('三角形のケーキを、底辺と平行に切ったら、切り口は、いつも、底辺の半分の長さでしょ？', { title: true, fb: 'happy', up: true }),
    t('切る位置によって、切り口の長さは、変わりますよ。どんなきまりがあるのか、調べましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。△ABC の辺 AB、AC 上に、点 D、E をとり、DE∥BC にします。AB を3等分した、上の点が D です。', { part: '平行線をひいてみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '平行線をひくと\nどんな比ができるか', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', base7)] }),
    t('AB は6cm、AC は7.5cm、BC は9cm です。AD：AB は、1：3 ですね。DE の長さは、BC の、どれくらいでしょう。', { ft: 'normal', point: false, draw: [G('g1', len7)] }),

    /* ---------- 問1（予想）---------- */
    Q('q1', t('問題です。DE の長さは、BC の、どれだけになりそうでしょう。', { ft: 'normal' }),
      [{ t: 'BC の2分の1' }, { t: 'BC の3分の1', ok: true }, { t: 'BC の3分の2' }, { t: 'BC と同じ長さ' }],
      { 0: [b('底辺と平行に切ったら、いつでも、半分でしょ！ ケーキは、半分こが、いちばん！', { fb: 'happy', up: true }), t('D は、AB の3分の1の位置です。真ん中では、ありません。切り口も、半分には、なりません。', sad)],
        2: [t('3分の2は、AB の3分の2の位置で、切ったときの長さです。今は、3分の1の位置です。', { ft: 'normal' })],
        ok: [t('正解！ 測ると、DE は3cm で、BC の3分の1です。AD：AB と、同じ比ですね。', { ft: 'happy' }), b('位置が3分の1なら、長さも3分の1なんだ！', { fb: 'star', up: true })],
        wrong: [t('BC と同じ長さになるのは、DE が、BC に重なったときです。今は、A に近い位置です。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：表 ---------- */
    t('切る位置を、変えて、調べました。AD：AB と AE：AC と DE：BC を、表にまとめます。', { clear: true, cols: [0.34, 0.66], part: '表にまとめよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '条件', text: 'DE∥BC', t: 3.0 }, tbl(t7, { col: 1, style: 'font-size:40px; align-self:center; margin-top:14px', t: 1.0 })] }),
    t('どの位置でも、3つの比は、等しくなりました。DE∥BC ならば、AD：AB＝AE：AC＝DE：BC です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'わかったこと', text: 'AD：AB＝AE：AC\n　　　＝DE：BC', t: 5.0 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。DE∥BC のとき、AD：AB と等しい比は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AE：EC' }, { t: 'EC：AC' }, { t: 'AE：AC', ok: true }, { t: 'BC：DE' }],
      { 0: [b('AD と AE、AB と EC が、ならんでいるから、これでしょ！', { fb: 'happy', up: true }), t('AB は、辺 AB の全体です。対応する全体は、辺 AC です。EC は、AC の一部です。AE：AC です。', sad)],
        1: [t('EC：AC は、DB：AB と等しい比です。AD：AB とは、ちがいます。', { ft: 'normal' })],
        ok: [t('正解！ AD は AB の一部、AE は AC の一部です。AD：AB＝AE：AC です。', { ft: 'happy' }), b('全体どうし、一部どうしを、ならべるんだね！', { fb: 'star', up: true })],
        wrong: [t('BC：DE は、AB：AD と等しい比です。上と下が、逆になっています。', { ft: 'normal' })] }),

    t('DE が BC に平行でないと、この比は、そろいません。平行であることが、大切な条件です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '注意', text: '平行でないと\n比はそろわない', t: 3.5 }] }),

    /* ---------- 3ページ目：理由 ---------- */
    t('なぜ、そうなるのでしょう。△ABC と △ADE は、共通な角と、同位角で、2組の角が等しいので、相似です。', { clear: true, cols: [0.34, 0.66], part: 'わけを考えよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '相似', text: '△ABC∽△ADE', t: 3.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', base7, triADE, arcs7)] }),
    t('相似な図形では、対応する辺の比が、等しくなります。だから、AD：AB＝AE：AC＝DE：BC です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '三角形と比', text: 'DE∥BC ならば\nAD：AB＝AE：AC\n　　　＝DE：BC', t: 5.5 }] }),
    t('次は、AD：DB です。AB は、AD と DB を、合わせた長さです。AD：AB が 1：3 のとき、AD：DB は、どうなるでしょう。', { ft: 'normal', point: false }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。AD：AB＝1：3 のとき、AD：DB は、どれでしょう。', { ft: 'normal' }),
      [{ t: '1：3' }, { t: '1：4' }, { t: '1：2', ok: true }, { t: '2：1' }],
      { 0: [b('AD：AB が 1：3 だから、AD：DB も 1：3 でしょ！ 数字は、そのままで、いいよ！', { fb: 'happy', up: true }), t('AB は、AD と DB を、合わせた長さです。AD が1なら、AB が3で、DB は2です。AD：DB＝1：2 です。', sad)],
        1: [t('AD の1と AB の3を、足して4に、していませんか。DB は、AB から AD を引いて、3−1＝2 です。', { ft: 'normal' })],
        ok: [t('正解！ AD を1とすると、AB は3、DB は、3−1＝2 です。AD：DB＝1：2 です。', { ft: 'happy' }), b('全体から、一部を引けば、いいんだね！', { fb: 'star', up: true })],
        wrong: [t('2：1 は、DB：AD の比です。順番が、逆です。AD：DB は、1：2 です。', { ft: 'normal' })] }),

    t('AE：EC も、同じように、1：2 です。DE∥BC のとき、AD：DB＝AE：EC も、成り立ちます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'もう1つ', text: 'AD：DB＝AE：EC', t: 3.5 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。DE∥BC のとき、いつも成り立つ式は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AD：DB＝DE：BC' }, { t: 'AD：AB＝AE：EC' }, { t: 'DB：AB＝AE：AC' }, { t: 'AD：AB＝DE：BC', ok: true }],
      { 0: [b('並びが、きれいだから、AD：DB＝DE：BC だよ！ 文字の並びで、わかるよ！', { fb: 'happy', up: true }), t('AD：DB は 1：2、DE：BC は 1：3 で、ちがいます。DE：BC と等しいのは、AD：AB です。', sad)],
        1: [t('AD：AB は 1：3、AE：EC は 1：2 です。AE：EC と等しいのは、AD：DB です。', { ft: 'normal' })],
        ok: [t('正解！ AD：AB＝DE：BC は、三角形と比の、定理の1つです。全体どうし、一部どうしを、ならべます。', { ft: 'happy' }), b('AD：AB は、DE：BC の仲間なんだね！', { fb: 'star', up: true })],
        wrong: [t('DB：AB は 2：3、AE：AC は 1：3 で、ちがいます。DB に対応するのは、EC です。', { ft: 'normal' })] }),

    t('まとめです。DE∥BC のとき、AD：AB＝AE：AC＝DE：BC、そして、AD：DB＝AE：EC です。三角形と比の、定理といいます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 1, type: 'box', color: 'y', size: 'sm', label: '三角形と比の定理', text: 'DE∥BC ならば\n　AD：AB＝AE：AC＝DE：BC\n　AD：DB＝AE：EC', t: 7.0 }] }),
    b('ケーキは、どこで切っても、比が、そろっているんだね！ ぼくは、大きいほうを、もらうよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
