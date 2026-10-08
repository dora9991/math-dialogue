/* 中3 5章 相似な図形　第8時（例）「三角形と比の性質を使って、線分の長さを求めよう」。自作。三角形と比の計算。
   図1：△ABC（AB=10，BC=15，CA=20 cm，0.4 倍で描く。∠B≒104.5°）。AD=6，DB=4，EC=8，BC=15 → AD：AB＝DE：BC＝6：10 → DE=9。AD：DB＝AE：EC＝6：4 → AE=12。
   図2：頂点 A をはさむ形。AB=3，AC=4，BC=4.5，AD＝2AB=6（D＝A＋2(A−B)，E＝A＋2(A−C)）→ DE＝2BC＝9（0.5 倍で描く）。
   図3：AD：DB＝2：3，DE=6 → AD：AB＝2：5＝6：BC → BC=15（AB=10，BC=15，AC=12.5 を 0.45 倍で描く）。 */
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
  /* ---- 図1 ---- */
  const s1 = 0.4;
  const T1 = T3([1.6, 0.7], 15 * s1, 10 * s1, 20 * s1);                          // [A,B,C]
  const [A1, B1, C1] = T1, D1 = lerp(A1, B1, 0.6), E1 = lerp(A1, C1, 0.6);
  const f1 = FG('g1', -0.4, -0.7, 8.4, 5.4);
  const base1 = [tri(T1, 'w', 'y'), ln(D1, E1, 'g', { wd: 3.8 }), dn(A1, 'A', [-0.4, 1]), dn(B1, 'B', [-0.7, -0.7]), dn(C1, 'C', [0.7, -0.7]), dn(D1, 'D', [-1, 0.2]), dn(E1, 'E', [1, 0.3]), par(D1, E1, 1, 'p'), par(B1, C1, 1, 'p')];
  const len1 = [sl(A1, D1, T1, '6cm', 'y', 0.5), sl(D1, B1, T1, '4cm', 'y', 0.5), sl(E1, C1, T1, '8cm', 'b', 0.55), sl(B1, C1, T1, '15cm', 'w'), tx([(D1[0] + E1[0]) / 2 + 0.2, D1[1] + 0.32], 'DE は？', 'g', 'middle', 24), tx([(A1[0] + E1[0]) / 2 + 0.5, (A1[1] + E1[1]) / 2 + 0.3], 'AE は？', 'g', 'middle', 24)];
  /* ---- 図2：A をはさむ形 ---- */
  const s2 = 0.5;
  const T2 = T3([2.4, 0.5], 4.5 * s2, 3 * s2, 4 * s2);                           // [A,B,C]
  const [A2, B2, C2] = T2, D2 = [A2[0] + 2 * (A2[0] - B2[0]), A2[1] + 2 * (A2[1] - B2[1])], E2 = [A2[0] + 2 * (A2[0] - C2[0]), A2[1] + 2 * (A2[1] - C2[1])];
  const f2 = FG('g2', -0.7, -0.6, 5.5, 5.1);
  const base2 = [tri(T2, 'w', 'y'), tri([A2, D2, E2], 'w', 'b'), dn(A2, 'A', [1, 0.2]), dn(B2, 'B', [-0.7, -0.7]), dn(C2, 'C', [0.7, -0.7]), dn(D2, 'D', [0.7, 0.7]), dn(E2, 'E', [-0.7, 0.7]), par(B2, C2, 1, 'p'), par(E2, D2, 1, 'p')];
  const len2 = [sl(A2, B2, T2, '3cm', 'y', 0.5), sl(B2, C2, T2, '4.5cm', 'w'), tx([A2[0] + 0.15, D2[1] + 0.32], 'DE は？', 'g', 'middle', 24), tx([(A2[0] + D2[0]) / 2 + 0.55, (A2[1] + D2[1]) / 2], '6cm', 'b', 'middle', 26)];
  /* ---- 図3：AD：DB＝2：3 ---- */
  const s3 = 0.45;
  const T4 = T3([1.0, 0.7], 15 * s3, 10 * s3, 12.5 * s3);                        // [A,B,C]
  const [A3, B3, C3] = T4, D3 = lerp(A3, B3, 0.4), E3 = lerp(A3, C3, 0.4);
  const f3 = FG('g3', -0.3, -0.7, 8.5, 5.3);
  const base3 = [tri(T4, 'w', 'y'), ln(D3, E3, 'g', { wd: 3.8 }), dn(A3, 'A', [0, 1]), dn(B3, 'B', [-0.7, -0.7]), dn(C3, 'C', [0.7, -0.7]), dn(D3, 'D', [-1, 0.2]), dn(E3, 'E', [1, 0.2]), par(D3, E3, 1, 'p'), par(B3, C3, 1, 'p'),
    sl(A3, D3, T4, '2', 'y', 0.4), sl(D3, B3, T4, '3', 'y', 0.4), tx([(D3[0] + E3[0]) / 2, D3[1] + 0.3], '6cm', 'g', 'middle', 26), tx([(B3[0] + C3[0]) / 2, B3[1] - 0.45], 'BC は？', 'w', 'middle', 26)];

  KL.lesson({ id: 'g3u5-08', unit: '中3　相似な図形', kick: '3年5章　第8時', title: '三角形と比の性質を使って、線分の長さを求めよう', card: '三角形と比の性質を使って、線分の長さを求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、三角形と比の性質を使って、線分の長さを、求めます。', { title: true, point: false, ft: 'happy' }),
    b('比例式なら、まかせて！ 内側の積と、外側の積が、等しいんだよ！ ぼく、かけ算は、得意だもん！', { title: true, fb: 'proud', up: true }),
    t('かけ算の前に、どの辺とどの辺の比かを、決めることが、大切です。そこが、今日のポイントです。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。△ABC で、DE∥BC です。AD は6cm、DB は4cm、EC は8cm、BC は15cm です。DE と AE を、求めます。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '比を使って\n線分の長さを求めよう', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', base1, len1)] }),
    t('まず、DE です。DE は、BC と対応します。DE：BC と等しい比を、AD、DB、AB から、選びます。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。DE を求めるための、正しい比例式は、どれでしょう。', { ft: 'normal' }),
      [{ t: '10：6＝DE：15' }, { t: '6：4＝DE：15' }, { t: '4：10＝DE：15' }, { t: '6：10＝DE：15', ok: true }],
      { 1: [b('AD：DB の次は、DE：BC でしょ！ 同じ並びで、書くんだよ！', { fb: 'happy', up: true }), t('AD：DB は、上の部分と、下の部分の比です。DE：BC は、上の辺と、全体の底辺の比です。AD：AB＝DE：BC です。', sad)],
        2: [t('4：10 は、DB：AB の比です。DE：BC と等しいのは、AD：AB です。', { ft: 'normal' })],
        ok: [t('正解！ AD：AB＝DE：BC です。AB は、AD＋DB＝6＋4＝10 ですから、6：10＝DE：15 です。', { ft: 'happy' }), b('AB は、全体の10cm なんだね！', { fb: 'star', up: true })],
        wrong: [t('10：6 は、AB：AD の比で、上下が逆です。DE は BC より短いので、AD：AB と同じ向きに、ならべます。', { ft: 'normal' })] }),

    t('6：10＝DE：15 を、解きます。内側の積と、外側の積が等しいので、10×DE＝6×15 で、DE＝9cm です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'DE', text: '6：10＝DE：15\n10×DE＝6×15\nDE＝9', t: 4.5 }] }),
    t('次は、AE です。AE と EC は、AD と DB に対応します。AD：DB＝AE：EC を、使います。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'AE', text: '6：4＝AE：8', t: 3.0 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。6：4＝AE：8 を解いて、AE の長さを求めます。何cmでしょう。', { ft: 'normal' }),
      [{ t: '20cm' }, { t: '12cm', ok: true }, { t: '10cm' }, { t: '4.8cm' }],
      { 2: [b('AD が DB より2cm 長いから、AE も、EC より2cm 長いでしょ！ 8＋2で、10cm！', { fb: 'happy', up: true }), t('足し算ではなく、比で考えます。6：4 は 3：2 です。AE は、EC の1.5倍で、8×1.5＝12cm です。', sad)],
        0: [t('20cm は、AC の長さです。AE は、AC の一部です。AE＋EC＝12＋8＝20 ですね。', { ft: 'normal' })],
        ok: [t('正解！ 4×AE＝6×8＝48 で、AE＝12cm です。AC は、12＋8＝20cm になります。', { ft: 'happy' }), b('AE は 12cm、EC は 8cm だね！', { fb: 'star', up: true })],
        wrong: [t('4.8cm は、6：10＝AE：8 を、解いた答えです。AE と EC には、AD と DB が対応します。AB では、ありません。', { ft: 'normal' })] }),

    t('三角形と比では、「部分：部分」と「全体：全体」を、混ぜません。AD：DB は AE：EC、AD：AB は AE：AC と DE：BC です。', { clear: true, cols: [0.34, 0.66], part: '気をつけること', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '注意', text: '部分：部分\n全体：全体\n混ぜない', t: 4.5 }] }),

    /* ---------- 2ページ目：A をはさむ形 ---------- */
    t('今度は、点 D、E が、頂点 A の反対側にある、場合です。直線 BA、CA を、のばして、D、E をとります。DE∥BC です。', { clear: true, cols: [0.34, 0.66], part: 'もう1つの形', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AB＝3cm　AD＝6cm\nBC＝4.5cm\nDE は？', t: 4.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', base2, len2)] }),
    t('この形でも、△ABC と △ADE は、対頂角と錯角で、2組の角が等しく、相似です。三角形と比の性質が、使えます。', { ft: 'normal', point: false }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。DE の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '13.5cm' }, { t: '9cm', ok: true }, { t: '4.5cm' }, { t: '2.25cm' }],
      { 0: [b('4.5cm に、3をかけるよ！ 図に出てくる、3か6を、かけるんでしょ？', { fb: 'happy', up: true }), t('3は、AB の長さで、倍率では、ありません。AB：AD＝3：6 から、倍率は2倍です。DE は、BC の2倍で、9cm です。', sad)],
        2: [t('4.5cm は、BC と同じ長さです。AD は AB より長いので、DE も BC より長くなります。', { ft: 'normal' })],
        ok: [t('正解！ AB：AD は 3：6 で、1：2 です。△ADE は、△ABC の2倍なので、DE＝4.5×2＝9cm です。', { ft: 'happy' }), b('A を中心に、ひっくり返して、2倍にしたんだね！', { fb: 'star', up: true })],
        wrong: [t('2.25cm は、BC の半分です。倍率が、逆です。AD は AB の2倍ですから、DE は BC の2倍です。', { ft: 'normal' })] }),

    /* ---------- 3ページ目：よく出る形 ---------- */
    t('最後に、よく出る形です。AD：DB＝2：3 で、DE は6cm です。BC の長さを、求めます。', { clear: true, cols: [0.34, 0.66], part: 'よく出る形', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'AD：DB＝2：3\nDE＝6cm\nBC は？', t: 4.5 }, Object.assign(f3, { prims: [] })], draw: [G('g3', base3)] }),
    t('AD：DB は、部分どうしの比です。DE：BC と等しいのは、全体を使った、AD：AB です。AB は、2＋3＝5 にあたります。', { ft: 'normal', point: false }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。BC の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '9cm' }, { t: '10cm' }, { t: '15cm', ok: true }, { t: '30cm' }],
      { 0: [b('AD：DB＝2：3 で、DE：BC も 2：3 だから、6：BC＝2：3 で、BC は9cm！ 並びを、そろえたよ！', { fb: 'happy', up: true }), t('AD：DB は、部分どうしの比です。DE：BC と等しいのは、AD：AB＝2：5 です。6：BC＝2：5 で、BC＝15cm です。', sad)],
        1: [t('10cm は、DB：AB＝3：5 を使った、答えです。DE に対応するのは、AD です。6：BC＝2：5 を、解きます。', { ft: 'normal' })],
        ok: [t('正解！ AD：AB＝2：5 ですから、6：BC＝2：5 です。2×BC＝6×5＝30 で、BC＝15cm です。', { ft: 'happy' }), b('部分どうしではなく、全体を使うんだね！', { fb: 'star', up: true })],
        wrong: [t('30cm は、6×5 です。2でわるのを、わすれていませんか。2×BC＝30 から、BC＝15cm です。', { ft: 'normal' })] }),

    t('まとめです。三角形と比の性質で、長さを求めるときは、どの辺と、どの辺の比かを決めて、比例式を立てます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '① 対応を決める\n② 部分：部分か\n　 全体：全体か\n③ 比例式を解く', t: 7.0 }] }),
    b('かけ算の前に、対応を決める！ ぼく、かけ算の前に、おやつを決めるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
