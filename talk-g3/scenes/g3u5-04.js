/* 中3 5章 相似な図形　第4時（例）「相似条件を使って、相似な三角形を見つけよう」。自作。相似条件の使い方。
   図1：△ABC（A(3.2,4.3)，B(0.5,0.6)，C(7.4,0.6)）に，D＝A＋0.6(B−A)，E＝A＋0.6(C−A)（DE∥BC，AD：AB＝3：5）。△ABC∽△ADE（共通な角＋同位角）。
   図2：A(0.5,0.6)，AB＝9，AD＝4，AC＝6，∠A＝50°（0.7倍で描く）。AD：AC＝AC：AB＝2：3 なので △ACD∽△ABC で ∠ACD＝∠ABC（図の中でも成り立つ）。AB：AC＝AC：AD → 9：6＝6：AD → AD＝4。
   表：ア（4,6,8），イ（6,8,10），ウ（8,12,15），エ（5,7,9），オ（6,9,12）。ア∽オ（比 1：1.5）だけ。ウ は 2，2，1.875 でそろわない。 */
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
  /* ---- 図1：DE∥BC ---- */
  const f1 = FG('g1', -0.6, -0.7, 8.4, 5.2);
  const A1 = [3.2, 4.3], B1 = [0.5, 0.6], C1 = [7.4, 0.6], D1 = lerp(A1, B1, 0.6), E1 = lerp(A1, C1, 0.6);
  const base1 = [tri([A1, B1, C1], 'w', 'y'), ln(D1, E1, 'w'), nm([A1, B1, C1], ['A', 'B', 'C']), dn(D1, 'D', [-1, 0.1]), dn(E1, 'E', [1, 0.1]), par(D1, E1, 1, 'p'), par(B1, C1, 1, 'p')];
  const triADE = tri([A1, D1, E1], 'b', 'b', { temp: true });
  const arcA1 = [ang(A1, B1, C1, 0.6, 1, 'g')];
  const arcD1 = [ang(D1, A1, E1, 0.55, 2, 'p'), ang(B1, A1, C1, 0.55, 2, 'p')];
  /* ---- 図2：∠ACD＝∠ABC。1cm＝0.7 ---- */
  const f2 = FG('g2', -0.4, -0.7, 8.0, 4.8);
  const s2 = 0.7, A2 = [0.5, 0.6], B2 = [0.5 + 9 * s2, 0.6], D2 = [0.5 + 4 * s2, 0.6], C2 = [0.5 + 6 * s2 * Math.cos(50 * R), 0.6 + 6 * s2 * Math.sin(50 * R)];
  const base2 = [tri([A2, B2, C2], 'w', 'y'), ln(C2, D2, 'w'), dn(A2, 'A', [-0.7, -0.7]), dn(B2, 'B', [0.7, -0.7]), dn(C2, 'C', [0, 1]), dn(D2, 'D', [0, -1]),
    sl(A2, B2, [A2, B2, C2], '9cm', 'y', 0.9), sl(C2, A2, [A2, B2, C2], '6cm', 'y')];
  const arcs2 = [ang(A2, B2, C2, 0.7, 1, 'g'), ang(B2, A2, C2, 0.7, 2, 'p'), ang(C2, A2, D2, 0.7, 2, 'p')];
  const adq = [sl(A2, D2, [A2, B2, C2], '？', 'g', 0.55)];
  /* ---- 表：ア〜オ ---- */
  const t5 = [['', '短い辺', '中の辺', '長い辺'], ['ア', '4cm', '6cm', '8cm'], ['イ', '6cm', '8cm', '10cm'], ['ウ', '8cm', '12cm', '15cm'], ['エ', '5cm', '7cm', '9cm'], ['オ', '6cm', '9cm', '12cm']];

  KL.lesson({ id: 'g3u5-04', unit: '中3　相似な図形', kick: '3年5章　第4時', title: '相似条件を使って、相似な三角形を見つけよう', card: '相似条件を使って、相似な三角形を見つけよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、相似条件を使って、相似な三角形を、見つけます。', { title: true, point: false, ft: 'happy' }),
    b('ぼくと弟は、顔がそっくり！ だから、相似でしょ！ 根拠は、見た目だよ！', { title: true, fb: 'proud', up: true }),
    t('見た目が似ているだけでは、相似とは言えません。相似条件を、根拠にしましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。三角形 ABC の辺 AB、AC 上に、点 D、E をとります。DE∥BC です。相似な三角形を、見つけましょう。', { part: '図から見つけよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '相似な三角形を\n見つけよう', t: 3.5 }, Object.assign(f1, { prims: [] })], draw: [G('g1', base1)] }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。この図で、相似な三角形の組は、どれでしょう。', { ft: 'normal' }),
      [{ t: '△ABC と △DBE' }, { t: '△ABC と △ADE', ok: true }, { t: '△ADE と △DBE' }, { t: '△ABE と △ACD' }],
      { 0: [b('B をふくむ三角形どうしだから、これでしょ！ 見た目で、わかるよ！', { fb: 'happy', up: true }), t('見た目では、決められません。△DBE の角は、△ABC の角と、そろいません。', sad)],
        2: [t('△ADE と △DBE は、対応する角が、そろいません。形が、ちがいます。', { ft: 'normal' })],
        ok: [t('正解！ △ABC と △ADE は、角 A を共通にもつ、大小の三角形です。', { ft: 'happy', draw: [G('g1', triADE)] }), b('大きい三角形の中に、小さい三角形が、かくれていたんだ！', { fb: 'star', up: true })],
        wrong: [t('△ABE と △ACD は、辺の長さも角も、そろいません。相似とは、言えません。', { ft: 'normal' })] }),

    t('相似になる理由を、考えます。図には、辺の長さが、書かれていません。DE∥BC を、使います。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。△ABC と △ADE の相似を、言うために、使える相似条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '2組の角がそれぞれ等しい', ok: true }, { t: '3組の辺の比がすべて等しい' }, { t: '2組の辺の比とその間の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }],
      { 1: [b('辺の比が、そろっているのは、見ればわかるよ！', { fb: 'happy', up: true }), t('長さが書かれていないので、辺の比は、確かめられません。DE∥BC から、角を調べます。', sad)],
        3: [t('それは、合同条件です。相似条件は、辺の比か、角を使います。長さがないので、角を使います。', { ft: 'normal' })],
        ok: [t('正解！ DE∥BC があるので、角が使えます。2組の角を、さがしましょう。', { ft: 'happy' }), b('平行線は、角が等しくなるんだったね！', { fb: 'star', up: true })],
        wrong: [t('辺の長さが、ないので、辺の比は使えません。DE∥BC を使って、角を調べます。', { ft: 'normal' })] }),

    t('まず、∠A は、△ABC と △ADE に共通です。∠A＝∠A です。', { ft: 'normal', point: false, draw: [G('g1', arcA1)] }),
    t('次に、DE∥BC なので、同位角が等しく、∠ADE＝∠ABC です。2組の角が、それぞれ等しくなりました。', { ft: 'normal', point: false, draw: [G('g1', arcD1)],
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'わかったこと', text: '2組の角が\nそれぞれ等しいから\n△ABC∽△ADE', t: 5.0 }] }),

    /* ---------- 2ページ目：重なった三角形 ---------- */
    t('もう1つの図です。△ABC の辺 AB 上に、点 D をとり、∠ACD＝∠ABC にします。AB は9cm、AC は6cm です。', { clear: true, cols: [0.34, 0.66], part: '重なった三角形', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AB＝9cm　AC＝6cm\n∠ACD＝∠ABC\nAD は？', t: 4.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', base2, adq)] }),
    t('等しい角の印が、あります。∠A は、△ABC と △ACD に共通です。もう1組が、∠ABC と ∠ACD です。', { ft: 'normal', point: false, draw: [G('g2', arcs2)] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。対応する頂点の順に、正しく書いた相似の式は、どれでしょう。', { ft: 'normal' }),
      [{ t: '△ABC∽△ADC' }, { t: '△ABC∽△CAD' }, { t: '△ABC∽△ACD', ok: true }, { t: '△ABC∽△CDA' }],
      { 0: [b('A、D、C と、A、B、C で、文字が似ているから、これでしょ！', { fb: 'happy', up: true }), t('文字の似かたでは、決まりません。∠B と等しいのは ∠ACD です。B に対応するのは、D ではなく C です。', sad)],
        ok: [t('正解！ A と A、B と C、C と D が対応するので、△ABC∽△ACD です。', { ft: 'happy' }), b('印が同じ角を、順に、ならべるんだね！', { fb: 'star', up: true })],
        wrong: [t('A に対応するのは A です。B に対応するのは、∠ACD の頂点 C です。順番を、たしかめましょう。', { ft: 'normal' })] }),

    t('△ABC∽△ACD ですから、対応する辺の比は、等しくなります。AB：AC＝AC：AD です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '辺の比', text: 'AB：AC＝AC：AD\n9：6＝6：AD', t: 4.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。9：6＝6：AD を解いて、AD の長さを求めます。何cmでしょう。', { ft: 'normal' }),
      [{ t: '3cm' }, { t: '4cm', ok: true }, { t: '6cm' }, { t: '13.5cm' }],
      { 3: [b('9×9÷6 で、13.5cm だよ！ 大きい数が、答えでしょ？', { fb: 'happy', up: true }), t('AD は、AB の一部ですから、9cm より短くなります。9×AD＝6×6 で、AD＝4 です。', sad)],
        2: [t('6cm は、AC の長さです。AD は、AB：AC＝AC：AD を解いて、求めます。', { ft: 'normal' })],
        ok: [t('正解！ 9×AD＝6×6＝36 で、AD＝36÷9＝4cm です。', { ft: 'happy' }), b('AD が4cm なら、BD は、5cm だね！', { fb: 'star', up: true })],
        wrong: [t('3cm は、9−6 の差です。差ではなく、比で考えます。9×AD＝36 です。', { ft: 'normal' })] }),

    t('相似な三角形を見つければ、辺の長さも、比例式で求められます。', { ft: 'normal', point: false }),

    /* ---------- 3ページ目：辺の長さで見つける ---------- */
    t('最後は、辺の長さで調べます。三角形 ア から オ の、3辺を、短い順に、表にしました。ア と相似な三角形を、見つけます。', { clear: true, cols: [0.34, 0.66], part: '辺の長さで見つけよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べること', text: '対応する辺の比が\nすべて同じか', t: 4.0 }, tbl(t5, { col: 1, style: 'font-size:38px; align-self:center; margin-top:10px', t: 1.0 })] }),

    /* ---------- 問5 ---------- */
    Q('q5', t('問題です。ア と相似な三角形は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'イ' }, { t: 'ウ' }, { t: 'エ' }, { t: 'オ', ok: true }],
      { 1: [b('ウは、2組も、2倍でそろっているから、ほぼ相似だよ！ ほぼで、いいでしょ？', { fb: 'happy', up: true }), t('「ほぼ」では、だめです。15÷8 は2になりません。3組すべてが、同じ比になる必要があります。', sad)],
        2: [t('エ は、4が5、6が7、8が9と、1ずつ、ふえただけです。比は、そろいません。', { ft: 'normal' })],
        ok: [t('正解！ 6÷4、9÷6、12÷8 は、どれも1.5 です。3組の辺の比が、すべて等しいので、相似です。', { ft: 'happy' }), b('3組とも、1.5倍だね！', { fb: 'star', up: true })],
        wrong: [t('イ は、6÷4＝1.5 ですが、8÷6 は1.5になりません。3組の比が、そろっていません。', { ft: 'normal' })] }),

    t('まとめです。相似な三角形を見つけるときは、等しい角や、辺の比を探して、相似条件に、当てはめます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '① 等しい角・辺の比を探す\n② 相似条件に当てはめる\n③ 対応する頂点の順に書く', t: 7.0 }] }),
    b('ぼくと弟は、目と鼻が、そっくり！ でも、相似条件は、ないから、相似とは、言えないね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
