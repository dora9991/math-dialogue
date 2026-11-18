/* 中3 5章 相似な図形　第6時（活）「縮図を使って、はかれない高さやきょりを求めよう」。自作。縮図の利用（影の長さ・川はば）。
   図1：ポンタ 身長1.2m・影1.8m，木 影9m → 相似比 1：5 → 木 1.2×5＝6m（1.2：x＝1.8：9 → 1.8x＝10.8）。1m＝0.7 で描く（日の光は平行：傾き 2/3）。
   図2：川はば。∠B＝90°，BC＝30m，∠C＝50° → AB＝30×tan50°≒35.75m（縮図 1/1000：BC＝3cm，AB≒3.575→3.6cm → 実際 36m）。1m＝0.1 で描く。
   図3：縮図（BC＝3cm，∠B＝90°，∠C＝50°）。1cm＝1。 */
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
  /* ---- 図1：影と相似 ---- */
  const f1 = FG('g1', -0.6, -0.7, 10.5, 5.2);
  const gy = 0.3, m1 = 0.7;                                       // 地面の高さ，1m の長さ
  const pB = [0.6, gy], pT = [0.6, gy + 1.2 * m1], pS = [0.6 + 1.8 * m1, gy], tB = [3.4, gy], tT = [3.4, gy + 6 * m1], tS = [3.4 + 9 * m1, gy];
  const scene1 = [ln([-0.4, gy], [10.3, gy], 'd', { wd: 3 }), tri([pB, pT, pS], 'y', 'y'), tri([tB, tT, tS], 'g', 'g'), rt(pB, pS, pT, 'y'), rt(tB, tS, tT, 'g'),
    tx([pB[0] - 0.12, pB[1] + 0.6], '1.2m', 'y', 'end', 26), tx([(pB[0] + pS[0]) / 2, -0.2], '1.8m', 'y', 'middle', 26), tx([tB[0] - 0.15, tB[1] + 2.1], 'x m', 'g', 'end', 28), tx([(tB[0] + tS[0]) / 2, -0.2], '9m', 'g', 'middle', 26),
    tx([pB[0] + 0.1, pT[1] + 0.3], 'ポンタ', 'y', 'middle', 26), tx([tB[0] + 0.05, tT[1] + 0.3], '木', 'g', 'middle', 28)];
  const sun1 = [ang(pS, pB, pT, 0.5, 1, 'p'), ang(tS, tB, tT, 0.9, 1, 'p'), tx([4.7, 4.25], '日の光', 'p', 'middle', 24)];
  /* ---- 図2：川はば（実際）。1m＝0.1 ---- */
  const f2 = FG('g2', -0.6, -0.9, 6.4, 5.0);
  const rB = [1.0, 0.6], rC = [4.0, 0.6], rA = [1.0, 0.6 + 30 * Math.tan(50 * R) * 0.1];
  const scene2 = [ln([-0.2, 0.6], [5.8, 0.6], 'b', { wd: 3 }), ln([-0.2, rA[1]], [5.8, rA[1]], 'b', { wd: 3 }), tx([5.0, 2.4], '川', 'b', 'middle', 34),
    ln(rA, rB, 'w'), ln(rB, rC, 'w'), ln(rA, rC, 'w'), dn(rA, 'A', [-0.7, 0.7]), dn(rB, 'B', [-0.7, -0.7]), dn(rC, 'C', [0.7, -0.7]), rt(rB, rC, rA, 'w'),
    tx([(rB[0] + rC[0]) / 2, 0.05], '30m', 'y', 'middle', 26), tx([rB[0] - 0.12, (rA[1] + rB[1]) / 2], 'AB は？', 'g', 'end', 26)];
  const ang2 = [ang(rC, rB, rA, 0.7, 1, 'p'), tx([rC[0] - 1.15, 0.95], '50°', 'p', 'middle', 26)];
  /* ---- 図3：縮図（1cm＝1） ---- */
  const f3 = FG('g3', -0.6, -0.9, 6.4, 5.0);
  const zB = [1.0, 0.6], zC = [4.0, 0.6], zA = [1.0, 0.6 + 3 * Math.tan(50 * R)];
  const scene3 = [tri([zA, zB, zC], 'w', 'y'), dn(zA, 'A', [-0.7, 0.7]), dn(zB, 'B', [-0.7, -0.7]), dn(zC, 'C', [0.7, -0.7]), rt(zB, zC, zA, 'w'), ang(zC, zB, zA, 0.7, 1, 'p'), tx([zC[0] - 1.15, 0.95], '50°', 'p', 'middle', 26),
    tx([(zB[0] + zC[0]) / 2, 0.05], '3cm', 'y', 'middle', 26)];
  const meas3 = [tx([zB[0] - 0.12, (zA[1] + zB[1]) / 2], '3.6cm', 'g', 'end', 26)];

  KL.lesson({ id: 'g3u5-06', unit: '中3　相似な図形', kick: '3年5章　第6時', title: '縮図を使って、はかれない高さやきょりを求めよう', card: '縮図を使って、はかれない高さやきょりを求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、相似を使って、はかれない高さや、きょりを、求めます。', { title: true, point: false, ft: 'happy' }),
    b('夕方は、影が、長いよね！ だから、夕方の木は、昼間より、背が高くなっているよ！', { title: true, fb: 'surprised', up: true }),
    t('木の高さは、変わりません。変わるのは、影の長さです。影をうまく使って、高さを求めましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。校庭の木の高さを、求めます。同じ時刻に測ると、ポンタの影が1.8m、木の影が9m でした。ポンタの身長は、1.2m です。', { part: '木の高さを求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '影を使って\n木の高さを求めよう', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', scene1)] }),
    t('日の光は、平行に、とどきます。ポンタと影、木と影は、それぞれ、直角三角形です。この2つは、相似でしょうか。', { ft: 'normal', point: false, draw: [G('g1', sun1)] }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。この2つの直角三角形が、相似といえる理由は、どれでしょう。', { ft: 'normal' }),
      [{ t: '直角と日の光の角が等しい', ok: true }, { t: 'どちらも直角三角形だから' }, { t: '影の長さが同じだから' }, { t: '高さが同じだから' }],
      { 1: [b('どっちも、地面に、まっすぐ立っているから、直角三角形どうし！ それで、相似でしょ！', { fb: 'happy', up: true }), t('直角三角形が、2つあるだけでは、相似とは、いえません。直角のほかに、もう1組の角が、等しいことを、示します。', sad)],
        2: [t('影の長さは、1.8m と9m で、ちがいます。等しいのは、日の光と地面が作る、角です。', { ft: 'normal' })],
        ok: [t('正解！ 地面に垂直なものは、どちらも90°です。日の光は平行なので、光と地面の角も、等しくなります。', { ft: 'happy' }), b('光が平行だから、角が同じになるんだね！', { fb: 'star', up: true })],
        wrong: [t('ポンタの身長は1.2m で、木は、もっと高いですね。高さは、ちがいます。', { ft: 'normal' })] }),

    t('2組の角が等しいので、2つの三角形は相似です。ところで、日の光の角は、時刻によって、変わります。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。ポンタの影を朝に、木の影を昼に測ると、どうなるでしょう。', { ft: 'normal' }),
      [{ t: '時刻がちがっても、相似になる' }, { t: '影の長さが、ぜったい同じ' }, { t: '木の高さが、変わってしまう' }, { t: '日の光の角がちがい、相似にならない', ok: true }],
      { 0: [b('朝でも昼でも、影は影でしょ！ 時刻は、気にしなくていいよ！', { fb: 'happy', up: true }), t('日の光の角は、時刻とともに、変わります。朝と昼では、角がちがい、2つの三角形は、相似になりません。', sad)],
        1: [t('朝と昼で、影の長さは、変わります。同じには、なりません。', { ft: 'normal' })],
        ok: [t('正解！ 日の光の角が、時刻で変わるので、同じ時刻に、測る必要があります。', { ft: 'happy' }), b('夕方の木が、背が高く見えたのは、影のせいなんだね！', { fb: 'star', up: true })],
        wrong: [t('木の高さは、時刻では、変わりません。変わるのは、影の長さと、日の光の角です。', { ft: 'normal' })] }),

    t('同じ時刻に測ったので、相似です。ポンタの影と、木の影の比は、1.8：9 です。かんたんにして、1：5 です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '相似比', text: 'ポンタ：木\n影　1：5\n身長　1.2：x', t: 4.5 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。木の高さは、何mでしょう。', { ft: 'normal' }),
      [{ t: '5m' }, { t: '6m', ok: true }, { t: '8.4m' }, { t: '10.8m' }],
      { 2: [b('木の影は、ポンタの影より、7.2m長いから、木も、7.2m高い！ 1.2＋7.2で、8.4m！', { fb: 'happy', up: true }), t('足し算ではなく、比で考えます。相似比は 1：5 です。木の高さは、1.2×5＝6m です。', sad)],
        0: [t('5 は、相似比 1：5 の、5です。ポンタの身長1.2m に、5をかけて、1.2×5＝6m です。', { ft: 'normal' })],
        ok: [t('正解！ 1.2：x＝1.8：9 です。1.8x＝1.2×9＝10.8 で、x＝6。木の高さは、6m です。', { ft: 'happy' }), b('影から、木の高さが、わかったよ！', { fb: 'star', up: true })],
        wrong: [t('10.8 は、1.2×9 です。かけるのは、影の長さではなく、相似比の5です。1.2×5＝6m です。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：川のはば ---------- */
    t('次は、川のはばです。向こう岸の木を A、こちら岸の真正面を B とします。B から、川に沿って、30m 進んだ所が C です。', { clear: true, cols: [0.34, 0.66], part: '川のはばを求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'BC＝30m\n∠ACB＝50°\nAB は？', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', scene2)] }),
    t('C から A を見ると、∠ACB は50°でした。AB の長さは、直接は、はかれません。縮図を、使いましょう。', { ft: 'normal', point: false, draw: [G('g2', ang2)] }),
    t('縮図は、実際の図形を、同じ形のまま、縮めた図です。今回は、1000分の1の縮図を、かきます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '縮尺', text: '1000分の1', t: 3.5 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。BC は、実際は30m です。1000分の1の縮図では、何cmでしょう。', { ft: 'normal' }),
      [{ t: '300cm' }, { t: '30cm' }, { t: '3cm', ok: true }, { t: '0.3cm' }],
      { 1: [b('30m だから、30cm でしょ！ m を cm に、書きかえるだけだよ！', { fb: 'happy', up: true, say: '30メートルだから、30センチでしょ！ メートルをセンチに、書きかえるだけだよ！' }), t('1m は100cm です。30m は3000cm。これを1000分の1にして、3cm です。', sad)],
        0: [t('300cm は、30m の10分の1です。1000分の1にするには、3000cm を、1000でわります。', { ft: 'normal' })],
        ok: [t('正解！ 30m＝3000cm。1000分の1で、3000÷1000＝3cm です。', { ft: 'happy' }), b('縮図の BC は、3cm なんだね！', { fb: 'star', up: true })],
        wrong: [t('0.3cm では、小さすぎます。3000cm を、1000でわって、3cm です。', { ft: 'normal' })] }),

    /* ---------- 3ページ目：縮図をかく ---------- */
    t('縮図をかきます。BC を3cm にかき、B で直角、C で50°の線を、ひきます。交わった点が、A です。', { clear: true, cols: [0.34, 0.66], part: '縮図をかこう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '縮図の手順', text: '① BC＝3cm\n② B で 90°\n③ C で 50°', t: 5.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', scene3)] }),
    t('縮図の AB を、定規で、はかります。結果は、3.6cm でした。', { ft: 'normal', point: false, draw: [G('g3', meas3)] }),

    /* ---------- 問5 ---------- */
    Q('q5', t('問題です。縮図の AB が、3.6cm です。実際の AB は、約何mでしょう。', { ft: 'normal' }),
      [{ t: '3600m' }, { t: '360m' }, { t: '36m', ok: true }, { t: '3.6m' }],
      { 3: [b('3.6cm の長さは、3.6m でしょ！ 単位だけ、変えれば、いいんだよ！', { fb: 'happy', up: true }), t('縮図は、1000分の1です。実際の長さは、1000倍です。3.6cm の1000倍は、3600cm で、36m です。', sad)],
        1: [t('360m は、3.6cm の10000倍です。1000倍は、3600cm。100cm＝1m だから、36m です。', { ft: 'normal' })],
        ok: [t('正解！ 3.6×1000＝3600cm で、36m です。川はばは、約36m です。', { ft: 'happy' }), b('はかれない川も、紙の上で、はかれたよ！', { fb: 'star', up: true })],
        wrong: [t('3600m は、3.6cm の10万倍です。3600cm を、メートルに直すと、36m です。', { ft: 'normal' })] }),

    t('まとめです。直接はかれない高さや、きょりは、相似な図形や、縮図で、求められます。縮尺で、実際の長さに、もどします。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '① 相似な三角形を見つける\n② 縮尺・比を確かめる\n③ 比例式で長さを求める', t: 7.0 }] }),
    b('縮図にすれば、スカイツリーも、ぼくの机の上に、乗っちゃうね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
