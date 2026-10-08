/* 中3 5章 相似な図形　第5時（例）「2つの三角形が相似であることを証明しよう」。自作。相似の証明（書式）。
   図1：△ABC（A(0.6,2.0)，B(6.6,4.4)，C(6.0,0.5)）に，D＝A＋0.55(B−A)，E＝A＋0.55(C−A)（DE∥BC）。△ABC∽△ADE：共通な角 ∠A＝∠A，同位角 ∠ABC＝∠ADE → 2組の角。
   図2：台形 ABCD（A(1.5,3.4)，B(5.0,3.4)，D(0.4,0.6)，C(6.4,0.6)，AB∥DC），対角線の交点 O。△OAB∽△OCD：対頂角 ∠AOB＝∠COD，錯角 ∠OAB＝∠OCD → 2組の角。 */
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
  const inter = (p1, p2, p3, p4) => {     // 直線 p1p2 と p3p4 の交点
    const d1 = [p2[0] - p1[0], p2[1] - p1[1]], d2 = [p4[0] - p3[0], p4[1] - p3[1]], k = ((p3[0] - p1[0]) * d2[1] - (p3[1] - p1[1]) * d2[0]) / (d1[0] * d2[1] - d1[1] * d2[0]);
    return [p1[0] + d1[0] * k, p1[1] + d1[1] * k];
  };
  /* ---- 図1：DE∥BC ---- */
  const A1 = [0.6, 2.0], B1 = [6.6, 4.4], C1 = [6.0, 0.5], D1 = lerp(A1, B1, 0.55), E1 = lerp(A1, C1, 0.55);
  const f1 = FG('g1', -0.5, -0.5, 8.0, 5.4), f1b = FG('g1b', -0.5, -0.5, 8.0, 5.4);
  const base1 = [tri([A1, B1, C1], 'w', 'y'), ln(D1, E1, 'w'), dn(A1, 'A', [-1, 0]), dn(B1, 'B', [0.4, 0.9]), dn(C1, 'C', [0.5, -0.8]), dn(D1, 'D', [-0.3, 1]), dn(E1, 'E', [0.4, -0.9]), par(D1, E1, 1, 'p'), par(B1, C1, 1, 'p')];
  const triADE = tri([A1, D1, E1], 'b', 'b', { temp: true });
  const arcA1 = [ang(A1, B1, C1, 0.7, 1, 'g')];
  const arcD1 = [ang(D1, A1, E1, 0.6, 2, 'p'), ang(B1, A1, C1, 0.6, 2, 'p')];
  /* ---- 図2：AB∥DC の台形と対角線 ---- */
  const A2 = [1.5, 3.4], B2 = [5.0, 3.4], D2 = [0.4, 0.6], C2 = [6.4, 0.6], O2 = inter(A2, C2, B2, D2);
  const f2 = FG('g2', -0.6, -0.8, 7.6, 4.4), f2b = FG('g2b', -0.6, -0.8, 7.6, 4.4);
  const base2 = [tri([A2, B2, C2, D2], 'w', 'y'), ln(A2, C2, 'w'), ln(B2, D2, 'w'), dn(A2, 'A', [-0.7, 0.7]), dn(B2, 'B', [0.7, 0.7]), dn(C2, 'C', [0.7, -0.7]), dn(D2, 'D', [-0.7, -0.7]), Object.assign(dn(O2, 'O', [1, 0]), { off: 36 }), par(A2, B2, 1, 'p'), par(D2, C2, 1, 'p')];
  const triOAB = tri([O2, A2, B2], 'y', 'y', { temp: true }), triOCD = tri([O2, C2, D2], 'b', 'b', { temp: true });
  const vert2 = [ang(O2, A2, B2, 0.45, 1, 'g'), ang(O2, C2, D2, 0.45, 1, 'g')];
  const alt2 = [ang(A2, B2, O2, 0.6, 2, 'p'), ang(C2, D2, O2, 0.6, 2, 'p')];

  KL.lesson({ id: 'g3u5-05', unit: '中3　相似な図形', kick: '3年5章　第5時', title: '2つの三角形が相似であることを証明しよう', card: '2つの三角形が相似であることを証明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、2つの三角形が、相似であることを、証明します。', { title: true, point: false, ft: 'happy' }),
    b('証明って、結論を、先に書けば、早いよね？ △ABC∽△ADE、はい、おしまい！', { title: true, fb: 'proud', up: true }),
    t('結論だけでは、証明に、なりません。仮定から結論まで、根拠をそえて、1行ずつ、つなげます。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。△ABC の辺 AB、AC 上に、点 D、E があり、DE∥BC です。△ABC∽△ADE を、証明しましょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'DE∥BC', t: 3.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: '△ABC∽△ADE', t: 3.5 }, Object.assign(f1, { prims: [] })], draw: [G('g1', base1)] }),
    t('まず、方針を立てます。図には、辺の長さが、ありません。使える相似条件は、何でしょう。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。この証明で、使う相似条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺の比がすべて等しい' }, { t: '2組の辺の比とその間の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }, { t: '2組の角がそれぞれ等しい', ok: true }],
      { 0: [b('相似なんだから、辺の比は、ぜんぶ、そろっているはずだよ！', { fb: 'happy', up: true }), t('それは、証明したい結果です。図に長さがないので、辺の比は、根拠にできません。', sad)],
        ok: [t('正解！ DE∥BC があるので、角が使えます。2組の角が、それぞれ等しいことを、示します。', { ft: 'happy' }), b('平行線から、角が見つかるんだね！', { fb: 'star', up: true })],
        wrong: [t('それは、使えません。図に長さがなく、合同条件でも、ありません。平行線から、2組の角を見つけます。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：証明 ---------- */
    t('では、証明を書きましょう。書き出しは、比べる2つの三角形を、「において」で、示します。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', text: '△ABC と △ADE において', t: 3.0 }, Object.assign(f1b, { prims: [] })], draw: [G('g1b', base1, triADE)] }),
    t('1組目の角です。∠A は、△ABC にも、△ADE にも、入っています。', { ft: 'normal', point: false, draw: [G('g1b', arcA1)] }),
    b('∠A は、どう見ても、同じ角だから、書かなくても、いいよね？ 面倒だもん！', { fb: 'happy', up: true }),
    t('見ればわかる、では、証明になりません。理由を、ことばで書きます。この角は、どう言えばよいでしょう。', { ft: 'sigh', fx: { t: 'sweat' }, point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。∠A＝∠A といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '仮定より' }, { t: '共通な角だから', ok: true }, { t: '対頂角は等しいから' }, { t: '平行線の錯角は等しいから' }],
      { 0: [b('∠A は、図に書いてあるから、仮定より、でしょ！', { fb: 'happy', up: true }), t('仮定は、DE∥BC です。∠A＝∠A は、2つの三角形が、同じ角を使っているから、共通な角です。', sad)],
        2: [t('対頂角は、2直線が交わってできる、向かい合う角です。この図の ∠A は、ちがいます。', { ft: 'normal' })],
        ok: [t('正解！ ∠A は、2つの三角形に共通です。共通な角だから、∠A＝∠A と書き、①とします。', { ft: 'happy' }), b('同じ角にも、理由があるんだね！', { fb: 'star', up: true })],
        wrong: [t('錯角は、平行線に、1本の直線が交わるときの角です。∠A＝∠A は、共通な角だから、いえます。', { ft: 'normal' })] }),

    t('これを、①とします。次は、平行線を、使います。DE∥BC なので、∠ABC と等しい角が、あります。', { ft: 'normal', point: false, draw: [G('g1b', arcD1)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '共通な角だから\n∠A＝∠A　…①', t: 3.5 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。∠ABC＝∠ADE といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '平行線の錯角は等しいから' }, { t: '対頂角は等しいから' }, { t: '平行線の同位角は等しいから', ok: true }, { t: '共通な角だから' }],
      { 0: [b('平行線が出てきたら、錯角でしょ！ Z の形だよね？', { fb: 'happy', up: true }), t('AB が、DE と BC を横切ります。同じ向きの角ですから、同位角です。Z の形に見える角が、錯角です。', sad)],
        3: [t('∠ABC と ∠ADE は、頂点がちがう角です。共通な角では、ありません。平行線から、いえます。', { ft: 'normal' })],
        ok: [t('正解！ DE∥BC に、AB が交わってできる、同位角です。同位角は等しいので、②とします。', { ft: 'happy' }), b('同じ向きの角が、同位角だね！', { fb: 'star', up: true })],
        wrong: [t('対頂角は、2直線が交わってできる、向かい合う角です。この2つの角は、ちがいます。', { ft: 'normal' })] }),

    t('②は、平行線の同位角は等しいから、∠ABC＝∠ADE です。これで、2組の角が、そろいました。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '平行線の同位角は\n等しいから\n∠ABC＝∠ADE　…②', t: 4.0 }] }),
    t('最後の行です。①②より、2組の角が、それぞれ等しいから、△ABC∽△ADE と書きます。証明の完成です。', { ft: 'happy', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①②より、2組の角が\nそれぞれ等しいから\n△ABC∽△ADE', t: 4.5 }] }),

    /* ---------- 3ページ目：もう1つの証明 ---------- */
    t('もう1つ、証明します。AB∥DC の台形 ABCD で、対角線 AC と BD が、点 O で交わります。△OAB∽△OCD を、証明しましょう。', { clear: true, cols: [0.34, 0.66], part: 'もう1つの証明', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '仮定', text: 'AB∥DC', t: 3.0 }, { col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: '△OAB∽△OCD', t: 3.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', base2, triOAB, triOCD)] }),

    /* ---------- 4ページ目：証明（台形） ---------- */
    t('△OAB と △OCD において、角を調べます。AC と BD が交わってできる、向かい合う角に、注目します。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', text: '△OAB と △OCD において', t: 3.0 }, Object.assign(f2b, { prims: [] })], draw: [G('g2b', base2, vert2)] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。∠AOB＝∠COD といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '対頂角は等しいから', ok: true }, { t: '共通な角だから' }, { t: '平行線の同位角は等しいから' }, { t: '仮定より' }],
      { 1: [b('O は、どちらの三角形にも、入っているから、共通な角でしょ！', { fb: 'happy', up: true }), t('△OAB の角は ∠AOB、△OCD の角は ∠COD です。別々の角で、向かい合っています。対頂角です。', sad)],
        ok: [t('正解！ AC と BD が、O で交わってできる、向かい合う角です。対頂角は等しいので、①とします。', { ft: 'happy' }), b('X の形の、向かい合う角だね！', { fb: 'star', up: true })],
        wrong: [t('向かい合う角ですから、対頂角です。同位角でも、仮定でも、ありません。', { ft: 'normal' })] }),

    t('これを、①とします。次は、AB∥DC を使います。AC が、2本の平行線を横切るので、∠OAB と ∠OCD は、Z の形の、錯角です。', { ft: 'normal', point: false, draw: [G('g2b', alt2)],
      add: [{ col: 0, type: 'text', size: 'xs', text: '対頂角は等しいから\n∠AOB＝∠COD　…①', t: 4.0 }] }),
    t('平行線の錯角は、等しいので、∠OAB＝∠OCD です。これを、②とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '平行線の錯角は\n等しいから\n∠OAB＝∠OCD　…②', t: 4.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', t('問題です。①②より、2組の角が等しいので、相似を書きます。正しい最後の行は、どれでしょう。', { ft: 'normal' }),
      [{ t: '△OAB∽△ODC' }, { t: '△OAB∽△OCD', ok: true }, { t: '△OAB∽△CDO' }, { t: '△OAB∽△DCO' }],
      { 0: [b('図で、A の下に D があるから、ODC でしょ！ 位置で、決めるんだよ！', { fb: 'happy', up: true }), t('位置ではなく、等しい角で決めます。∠OAB と等しいのは ∠OCD です。A に対応するのは、C です。', sad)],
        ok: [t('正解！ O と O、A と C、B と D が対応するので、△OAB∽△OCD と書きます。', { ft: 'happy' }), b('等しい角の順に、書けばいいんだね！', { fb: 'star', up: true })],
        wrong: [t('O に対応する頂点は、O です。最初に O が来て、その次が、A に対応する C です。', { ft: 'normal' })] }),

    t('証明の完成です。①②より、2組の角が、それぞれ等しいから、△OAB∽△OCD です。', { ft: 'happy', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①②より、2組の角が\nそれぞれ等しいから\n△OAB∽△OCD', t: 4.5 }] }),

    t('まとめです。相似の証明は、相似条件を決めて、等しい角や辺の比を、根拠つきで書き、条件で、まとめます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '証明の進め方', text: '① 使う相似条件を決める\n② 等しい角・辺の比を\n　根拠つきで書く\n③ 条件で結論をまとめる', t: 7.0 }] }),
    b('ぼく、1行も、飛ばさずに、書けたよ！ 面倒だけど、書き終わると、気持ちいいね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
