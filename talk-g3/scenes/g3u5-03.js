/* 中3 5章 相似な図形　第3時（探）「2つの三角形が相似であることは、何を調べればわかるだろう」。自作。三角形の相似条件（3つ）。
   図1：△ABC（AB=5，BC=6，CA=7）と △DEF（DE=10，EF=12，FD=14）：3辺の比 1：2。角 A≒57.1°，B≒78.5°，C≒44.4°（表）。0.35 倍で描く。
   図2：△ABC（AB=4，AC=6，∠A=60°）と △DEF（DE=8，DF=12，∠D=60°）：BC＝√28≒5.3，EF＝√112≒10.6，比 1：2。0.4 倍で描く。
   図3：△ABC（∠A=70°，∠B=45°，∠C=65°）と △DEF（∠D=70°，∠E=45°，∠F=65°）。AB=2.6 と DE=4.5（図の単位）で、大きさがちがう。
   最後：合同条件にはなく、相似条件にだけある → 2組の角がそれぞれ等しい。 */
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
  /* ---- 図1：3辺の比が 1：2。1cm＝0.35 ---- */
  const s1 = 0.35;
  const a1 = T3([0.3, 0.5], 6 * s1, 5 * s1, 7 * s1), d1 = T3([4.0, 0.5], 12 * s1, 10 * s1, 14 * s1);     // [A,B,C]，[D,E,F]
  const f1 = FG('g1', -0.7, -0.7, 9.0, 4.4);
  const shape1 = [tri(a1, 'w', 'y'), tri(d1, 'w', 'b'), nm(a1, ['A', 'B', 'C']), nm(d1, ['D', 'E', 'F'])];
  const len1 = [sl(a1[0], a1[1], a1, '5cm', 'y'), sl(a1[1], a1[2], a1, '6cm', 'y'), sl(a1[2], a1[0], a1, '7cm', 'y'),
    sl(d1[0], d1[1], d1, '10cm', 'b'), sl(d1[1], d1[2], d1, '12cm', 'b'), sl(d1[2], d1[0], d1, '14cm', 'b')];
  const t1 = [['角', '△ABC', '△DEF'], ['∠A と ∠D', '57.1°', '57.1°'], ['∠B と ∠E', '78.5°', '78.5°'], ['∠C と ∠F', '44.4°', '44.4°']];
  /* ---- 図2：2辺の比 1：2 と、その間の角 60°。1cm＝0.4 ---- */
  const s2 = 0.4;
  const a2 = SAS([0.5, 0.6], 4 * s2, 6 * s2, 60), d2 = SAS([4.5, 0.6], 8 * s2, 12 * s2, 60);             // [A,B,C]，[D,E,F]
  const f2 = FG('g2', -0.4, -0.7, 9.3, 5.4);
  const shape2 = [tri(a2, 'w', 'y'), tri(d2, 'w', 'b'), nm(a2, ['A', 'B', 'C']), nm(d2, ['D', 'E', 'F']),
    sl(a2[0], a2[1], a2, '4cm', 'y'), sl(a2[2], a2[0], a2, '6cm', 'y'), sl(d2[0], d2[1], d2, '8cm', 'b'), sl(d2[2], d2[0], d2, '12cm', 'b'),
    ang(a2[0], a2[1], a2[2], 0.5, 1, 'g'), ang(d2[0], d2[1], d2[2], 0.7, 1, 'g'), angLab(a2[0], a2[1], a2[2], 1.0, '60°', 'g'), angLab(d2[0], d2[1], d2[2], 1.3, '60°', 'g')];
  const meas2 = [sl(a2[1], a2[2], a2, '約5.3cm', 'p', 0.85), sl(d2[1], d2[2], d2, '約10.6cm', 'p', 0.95)];
  /* ---- 図3：2組の角が 70°，45° ---- */
  const a3 = ASA([0.3, 0.6], 2.6, 70, 45), d3 = ASA([4.6, 0.6], 4.5, 70, 45);                          // [A,B,C]，[D,E,F]
  const f3 = FG('g3', -0.5, -0.7, 10.0, 4.7);
  const shape3 = [tri(a3, 'w', 'y'), tri(d3, 'w', 'b'), nm(a3, ['A', 'B', 'C']), nm(d3, ['D', 'E', 'F']),
    ang(a3[0], a3[1], a3[2], 0.45, 1, 'g'), ang(d3[0], d3[1], d3[2], 0.65, 1, 'g'), ang(a3[1], a3[0], a3[2], 0.45, 2, 'p'), ang(d3[1], d3[0], d3[2], 0.65, 2, 'p'),
    angLab(a3[0], a3[1], a3[2], 1.0, '70°', 'g'), angLab(d3[0], d3[1], d3[2], 1.4, '70°', 'g'), angLab(a3[1], a3[0], a3[2], 1.0, '45°', 'p'), angLab(d3[1], d3[0], d3[2], 1.4, '45°', 'p')];
  const rest3 = [ang(a3[2], a3[0], a3[1], 0.45, 3, 'b'), ang(d3[2], d3[0], d3[1], 0.65, 3, 'b'), angLab(a3[2], a3[0], a3[1], 0.8, '65°', 'b'), angLab(d3[2], d3[0], d3[1], 1.3, '65°', 'b')];

  KL.lesson({ id: 'g3u5-03', unit: '中3　相似な図形', kick: '3年5章　第3時', title: '2つの三角形が相似であることは、何を調べればわかるだろう', card: '2つの三角形が相似であることは、何を調べればわかるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、2つの三角形が、相似であることを、どう調べればよいか、考えます。', { title: true, point: false, ft: 'happy' }),
    b('大きいおにぎりと、小さいおにぎり。のりの巻き方が、同じなら、同じ形でしょ！ 調べることなんて、ないよ！', { title: true, fb: 'proud', up: true }),
    t('見た目だけでは、確かめられません。合同条件のように、相似になる条件を、さがしましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('前に、三角形の合同条件を、3つ学びました。今日は、相似になる条件を、さがします。まず、辺の比に注目します。', { part: '辺の比に注目', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '相似になる条件を\nさがそう', t: 3.5 }] }),
    t('△ABC の辺は、5cm、6cm、7cm です。△DEF の辺は、10cm、12cm、14cm です。3組の辺の比は、すべて 1：2 です。', { ft: 'normal', point: false,
      add: [Object.assign(f1, { prims: [] })], draw: [G('g1', shape1, len1)] }),

    /* ---------- 問1（予想）---------- */
    Q('q1', t('問題です。3組の辺の比が、すべて 1：2 のとき、対応する角は、どうなりそうでしょう。', { ft: 'normal' }),
      [{ t: '1組だけ等しくなりそう' }, { t: 'どれも等しくならない' }, { t: 'すべて等しくなりそう', ok: true }, { t: '決まらない' }],
      { 3: [b('辺の比だけでは、角度までは、わからないよ！ 決まらないでしょ？', { fb: 'happy', up: true }), t('3辺の長さが決まれば、三角形の形は、1つに決まります。角も、決まるのです。', sad)],
        ok: [t('正解！ △DEF を半分に縮めると、3辺が △ABC と等しくなり、合同です。角も、すべて等しくなります。', { ft: 'happy' }), b('縮めたら、ぴったり重なるんだね！', { fb: 'star', up: true })],
        wrong: [t('3組の辺の比が、すべてそろっているので、角も、すべてそろいます。1組だけ等しい、ということも、どれも等しくない、ということも、ありません。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：角を調べる ---------- */
    t('角を、くわしく調べました。結果は、こちらです。どの角も、ぴったり同じでした。', { clear: true, cols: [0.34, 0.66], part: '角を確かめよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べたこと', text: '3組の辺の比が\nすべて 1：2', t: 3.5 }, tbl(t1, { col: 1, style: 'font-size:40px; align-self:center; margin-top:14px', t: 1.0 })] }),
    t('3組の辺の比が、すべて等しい2つの三角形は、相似です。これが、1つ目の条件です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '条件①', text: '3組の辺の比が\nすべて等しい', t: 4.5 }] }),
    b('辺が3本とも2倍なら、ぼくの大きいおにぎりと、小さいおにぎりも、相似だね！', { fb: 'happy', up: true }),

    /* ---------- 3ページ目：2辺の比と間の角 ---------- */
    t('次は、2組の辺の比と、その間の角です。AB：DE＝AC：DF＝1：2 で、∠A＝∠D＝60° の、2つの三角形を、かきます。', { clear: true, cols: [0.34, 0.66], part: '2辺の比と間の角', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べること', text: '2組の辺の比と\nその間の角', t: 3.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', shape2)] }),
    t('BC と EF の長さは、まだ、わかっていません。はかってみると、BC は約5.3cm、EF は約10.6cm で、比は 1：2 でした。', { ft: 'normal', point: false, draw: [G('g2', meas2)] }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。BC と EF を、使わずに、わかっていることだけで、使える相似条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '2組の辺の比とその間の角がそれぞれ等しい', ok: true }, { t: '3組の辺の比がすべて等しい' }, { t: '2組の角がそれぞれ等しい' }, { t: '2組の辺の比が等しい' }],
      { 1: [b('辺の比は、2つも、わかっているよ！ だから、3組の辺の比でしょ？', { fb: 'happy', up: true }), t('わかっている辺の比は、2組だけです。BC と EF は、使えません。2組の辺の比と、その間の角を、使います。', sad)],
        2: [t('等しい角は、∠A と ∠D の、1組だけです。2組の角は、そろっていません。', { ft: 'normal' })],
        ok: [t('正解！ AB：DE＝AC：DF＝1：2 と、その間の角 ∠A＝∠D です。これが、2つ目の条件です。', { ft: 'happy' }), b('間の角が、ポイントなんだね！', { fb: 'star', up: true })],
        wrong: [t('2組の辺の比が等しいだけでは、条件になりません。その間の角が、等しいことも、必要です。', { ft: 'normal' })] }),

    t('2組の辺の比と、その間の角が、それぞれ等しい2つの三角形は、相似です。間の角でないと、形が決まらないことが、あります。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '条件②', text: '2組の辺の比と\nその間の角が\nそれぞれ等しい', t: 5.0 }] }),

    /* ---------- 4ページ目：2組の角 ---------- */
    t('最後は、角に注目します。△ABC と △DEF で、∠A＝∠D＝70°、∠B＝∠E＝45° です。辺の長さは、わかりません。', { clear: true, cols: [0.34, 0.66], part: '2組の角', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べること', text: '2組の角が\nそれぞれ等しい', t: 3.5 }, Object.assign(f3, { prims: [] })], draw: [G('g3', shape3)] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。∠A＝70°、∠B＝45° のとき、∠C は、何度でしょう。', { ft: 'normal' }),
      [{ t: '115°' }, { t: '70°' }, { t: '65°', ok: true }, { t: '45°' }],
      { 0: [b('70°と45°を足して、115°！ 三角形の角は、足せばいいんでしょ？', { fb: 'happy', up: true }), t('115°は、2つの角の和です。残りの角は、180°から引きます。180−115＝65° です。', sad)],
        ok: [t('正解！ 三角形の内角の和は180°です。∠C＝180°−70°−45°＝65° です。', { ft: 'happy' }), b('3つ目の角は、自動で、決まるんだね！', { fb: 'star', up: true })],
        wrong: [t('∠C が、∠A や ∠B と同じとは、かぎりません。内角の和は180°なので、180−70−45＝65° です。', { ft: 'normal' })] }),

    t('△DEF も、同じ計算で、∠F＝65° です。2組の角が等しいと、3組の角が、すべて等しくなります。', { ft: 'normal', point: false, draw: [G('g3', rest3)] }),
    t('2組の角が、それぞれ等しい2つの三角形は、相似です。これが、3つ目の条件です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '条件③', text: '2組の角が\nそれぞれ等しい', t: 4.5 }] }),
    b('角が2つ同じなら、いいのか！ 合同条件より、らくちんだね！', { fb: 'surprised', up: true }),

    /* ---------- 5ページ目：まとめ ---------- */
    t('まとめです。三角形の相似条件は、この3つです。合同条件と、くらべてみましょう。', { clear: true, cols: [0.34, 0.66], part: '三角形の相似条件', ft: 'normal',
      add: [{ col: 1, type: 'box', color: 'y', size: 'sm', label: '三角形の相似条件', text: '①　3組の辺の比が、すべて等しい\n②　2組の辺の比と、その間の角が、\n　　それぞれ等しい\n③　2組の角が、それぞれ等しい', t: 7.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。合同条件には、ありません。でも、相似条件になる条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺がそれぞれ等しい' }, { t: '2組の辺とその間の角がそれぞれ等しい' }, { t: '1組の辺とその両端の角がそれぞれ等しい' }, { t: '2組の角がそれぞれ等しい', ok: true }],
      { 0: [b('3組の辺が、等しい三角形も、相似でしょ？ 同じ形だもん！', { fb: 'happy', up: true }), t('それは、合同条件でもあります。合同条件にはなくて、相似条件にだけある条件は、角に注目したものです。', sad)],
        1: [t('これも、合同条件にあります。辺の比が 1：1 の、特別な場合ですね。', { ft: 'normal' })],
        ok: [t('正解！ 2組の角が等しければ、相似です。合同条件には、ない条件です。', { ft: 'happy' }), b('角が2つだけで、いいなんて、らくちんだね！', { fb: 'star', up: true })],
        wrong: [t('これも、合同条件にあります。2組の角だけで、相似になるのが、合同条件との、大きなちがいです。', { ft: 'normal' })] }),

    t('相似条件は、3つです。辺の比、辺の比と間の角、そして2組の角です。次の時間は、これを使って、相似な三角形を、見つけます。', { ft: 'normal', point: false }),
    b('おにぎりは、角が2つ同じなら、相似！ ぼくのおなかも、おにぎりと、相似かもしれないよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
