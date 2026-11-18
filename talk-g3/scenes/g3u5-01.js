/* 中3 5章 相似な図形　第1時（探）「「形が同じ」とは、どういうことだろう」。自作。相似の意味・性質（対応する角が等しく、対応する辺の比が等しい）。
   図1：△ABC（AB=4，BC=5，CA=6 cm を 0.5 倍で描く）と、2倍に拡大した △DEF（DE=8，EF=10，FD=12）。角 A≒55.8°，B≒82.8°，C≒41.4°。
   図2：長方形 ア（3×2cm）・イ（6×4＝2倍）・ウ（6×2＝横だけ2倍）。ア：イ は 1：2（相似），ア：ウ は 辺の比がそろわない（4つの角は直角で等しい）。
   図3：△ABC と、1/2 に縮めて 180°回した △PQR（A→R，B→P，C→Q）→ △ABC∽△RPQ，相似比 2：1。
   図4：△GHI∽△JKL（GH=5，HI=6，IG=7，3倍）→ JK=15，KL=18，LJ=21。 */
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
  /* ---- 図1：2倍の拡大 ---- */
  const a1 = T3([0.3, 0.4], 2.5, 2.0, 3.0), a2 = T3([4.5, 0.4], 5, 4, 6);           // [A,B,C]，[D,E,F]
  const f1 = FG('g1', -0.9, -0.7, 10.3, 5.1);
  const shape1 = [tri(a1, 'w', 'y'), tri(a2, 'w', 'b'), nm(a1, ['A', 'B', 'C']), nm(a2, ['D', 'E', 'F'])];
  const len1 = [sl(a1[0], a1[1], a1, '4cm', 'y'), sl(a1[1], a1[2], a1, '5cm', 'y'), sl(a1[2], a1[0], a1, '6cm', 'y'),
    sl(a2[0], a2[1], a2, '8cm', 'b'), sl(a2[1], a2[2], a2, '10cm', 'b'), sl(a2[2], a2[0], a2, '12cm', 'b')];
  const angs1 = [ang(a1[0], a1[1], a1[2], 0.4, 1, 'g'), ang(a2[0], a2[1], a2[2], 0.8, 1, 'g'),
    ang(a1[1], a1[0], a1[2], 0.4, 2, 'p'), ang(a2[1], a2[0], a2[2], 0.8, 2, 'p'),
    ang(a1[2], a1[0], a1[1], 0.4, 3, 'b'), ang(a2[2], a2[0], a2[1], 0.8, 3, 'b')];
  /* ---- 図2：長方形 ---- */
  const f2 = FG('g2', -0.6, -0.9, 12.0, 3.5);
  const RC = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const rcs = [[0.2, 0.3, 3, 2, 'y', 'ア'], [3.4, 0.3, 6, 4, 'g', 'イ'], [8.0, 0.3, 6, 2, 'p', 'ウ']].map(([x, y, w, h, c, n]) => {
    const p = RC(x, y, w * 0.6, h * 0.6);
    return [tri(p, c, c), tx([x + w * 0.3, y + h * 0.6 + 0.3], n, c, 'middle', 34), tx([x + w * 0.3, y - 0.42], w + 'cm', c, 'middle', 26), tx([x - 0.12, y + h * 0.3 - 0.1], h + 'cm', c, 'end', 26),
      rt(p[0], p[1], p[3], c), rt(p[1], p[2], p[0], c), rt(p[2], p[3], p[1], c), rt(p[3], p[0], p[2], c)];
  });
  /* ---- 図3：向きを変えて 1/2 に縮めた △PQR ---- */
  const f3 = FG('g3', -0.8, -0.7, 10.4, 4.1);
  const c3 = T3([0.3, 0.5], 3.5, 2.8, 4.2), g3 = cen(c3), o3 = [7.6, 1.7];
  const q3 = c3.map(p => [o3[0] - (p[0] - g3[0]) * 0.5, o3[1] - (p[1] - g3[1]) * 0.5]);    // [R,P,Q]（A→R，B→P，C→Q）
  const [pR, pP, pQ] = q3;
  const shape3 = [tri(c3, 'w', 'y'), tri([pP, pQ, pR], 'w', 'b'), nm(c3, ['A', 'B', 'C']), nm([pP, pQ, pR], ['P', 'Q', 'R'])];
  const angs3 = [ang(c3[0], c3[1], c3[2], 0.4, 1, 'g'), ang(pR, pP, pQ, 0.3, 1, 'g'), ang(c3[1], c3[0], c3[2], 0.4, 2, 'p'), ang(pP, pR, pQ, 0.3, 2, 'p'),
    ang(c3[2], c3[0], c3[1], 0.4, 3, 'b'), ang(pQ, pR, pP, 0.3, 3, 'b')];
  /* ---- 図4：△GHI∽△JKL（3倍）。1cm＝0.25 ---- */
  const f4 = FG('g4', -0.6, -0.8, 9.2, 4.8);
  const g4 = T3([0.3, 0.3], 6 * 0.25, 5 * 0.25, 7 * 0.25), j4 = T3([3.6, 0.3], 18 * 0.25, 15 * 0.25, 21 * 0.25);   // [G,H,I]，[J,K,L]
  const shape4 = [tri(g4, 'w', 'y'), tri(j4, 'w', 'b'), nm(g4, ['G', 'H', 'I']), nm(j4, ['J', 'K', 'L']),
    sl(g4[0], g4[1], g4, '5cm', 'y'), sl(g4[1], g4[2], g4, '6cm', 'y'), sl(j4[0], j4[1], j4, '15cm', 'b'), sl(j4[1], j4[2], j4, '？', 'g')];

  KL.lesson({ id: 'g3u5-01', unit: '中3　相似な図形', kick: '3年5章　第1時', title: '「形が同じ」とは、どういうことだろう', card: '「形が同じ」とは、どういうことだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、「形が同じ」とは、どういうことなのかを、はっきりさせます。', { title: true, point: false, ft: 'happy' }),
    b('写真を拡大コピーしたら、ぼくの顔が、横にだけ、びよーんと広がったよ！ これも、形は同じだよね？', { title: true, fb: 'surprised', up: true }),
    t('顔が横に広がったなら、形は、変わっています。「形が同じ」を、数学のことばで、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。三角形 ABC を、コピー機で、2倍に拡大して、三角形 DEF を作りました。', { part: '拡大コピーを見よう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '形が同じとは？', t: 3.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', shape1)] }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。拡大コピーしても、変わらないものは、どれでしょう。', { ft: 'normal' }),
      [{ t: '辺の長さ' }, { t: 'まわりの長さ' }, { t: '面積' }, { t: '角の大きさ', ok: true }],
      { 2: [b('コピーしても、ぼくの顔は、ぼくの顔のままだから、面積は、同じ！', { fb: 'happy', up: true }), t('紙ごと拡大されるので、顔も大きくなります。面積は、変わります。変わらないのは、角の大きさです。', sad)],
        ok: [t('正解！ 角の大きさは、拡大しても、変わりません。', { ft: 'happy' }), b('角のとがり方は、そのままなんだね！', { fb: 'star', up: true })],
        wrong: [t('辺の長さも、まわりの長さも、2倍になります。変わらないのは、角の大きさです。', { ft: 'normal' })] }),

    t('分度器で、角を測ってみましょう。∠A と ∠D、∠B と ∠E、∠C と ∠F は、それぞれ、ぴったり同じです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '対応する角', text: '∠A＝∠D\n∠B＝∠E\n∠C＝∠F', t: 4.0 }], draw: [G('g1', angs1)] }),
    t('つぎは、辺の長さです。AB は4cm、BC は5cm、CA は6cm です。拡大した DE、EF、FD は、8cm、10cm、12cm です。', { ft: 'normal', point: false, draw: [G('g1', len1)] }),
    t('対応する辺の比を、調べましょう。AB：DE も、BC：EF も、CA：FD も、どれも 1：2 です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '対応する辺の比', text: 'AB：DE＝1：2\nBC：EF＝1：2\nCA：FD＝1：2', t: 4.5 }] }),
    b('どれも、1：2！ 倍率が、ぴったりそろっているんだね。ぼくの顔は、横だけ2倍だったから、そろっていなかった…！', { fb: 'surprised', up: true }),

    /* ---------- 2ページ目：相似とは ---------- */
    t('このように、形を変えずに、拡大や縮小した図形どうしを、「相似」であるといいます。', { clear: true, cols: [0.34, 0.66], part: '相似とは', ft: 'normal',
      add: [{ col: 1, type: 'box', color: 'y', size: 'sm', label: '相似', text: '形を変えずに、拡大・縮小した\n図形どうしは、相似である', t: 5.0 }] }),
    t('相似を表す記号は ∽ です。三角形 ABC と DEF は相似なので、△ABC∽△DEF と書きます。', { ft: 'normal', point: false,
      add: [{ col: 1, type: 'box', color: 'p', size: 'sm', label: '書き方', text: '△ABC∽△DEF\n対応する頂点を、同じ順に書く', t: 6.0 }] }),
    b('この ∽ って、ぼくが、ごろんと寝ころんだ形に、見えるよ！', { fb: 'happy', up: true }),

    /* ---------- 3ページ目：長方形 ---------- */
    t('もう1つ、確かめます。たて2cm、横3cm の長方形ア。イは、たても横も2倍。ウは、横だけ2倍です。', { clear: true, cols: [0.34, 0.66], part: '長方形で確かめよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '調べること', text: 'ア と相似なのは\nイ と ウ のどちら？', t: 4.0 }, Object.assign(f2, { prims: [] })], draw: [G('g2', rcs)] }),
    b('ぼくの顔の写真は、ウだね！ 横にだけ、2倍に広がったんだよ！', { fb: 'proud', up: true }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。ア も ウ も、4つの角は、すべて直角です。ウ は、ア と相似でしょうか。', { ft: 'normal' }),
      [{ t: '角が等しいので、相似である' }, { t: '辺の比がそろわず、相似でない', ok: true }, { t: '長方形どうしは、必ず相似' }, { t: 'たてが同じ長さなので、相似' }],
      { 0: [b('どれも、角は直角でしょ！ 角が同じなら、同じ形だよ！', { fb: 'happy', up: true }), t('角だけでは、足りません。ウ は、たては同じで、横が2倍です。辺の比が、そろっていません。', sad)],
        2: [t('長方形でも、たてと横の比がちがえば、形はちがいます。ア と イ は相似ですが、ア と ウ は、ちがいます。', { ft: 'normal' })],
        ok: [t('正解！ ア と ウ は、たてが同じで、横が2倍です。辺の比がそろわないので、相似ではありません。', { ft: 'happy' }), b('ぼくの顔は、相似じゃなかったんだ…！', { fb: 'surprised', up: true })],
        wrong: [t('たては同じ長さですが、横は2倍です。辺の比がそろっていないので、相似ではありません。', { ft: 'normal' })] }),

    t('相似であるためには、角が等しいだけでは足りません。辺の比も、すべて等しいことが、必要です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '相似な図形', text: '対応する角は\nそれぞれ等しい\n対応する辺の比は\nすべて等しい', t: 6.0 }] }),

    /* ---------- 4ページ目：書き方 ---------- */
    t('次は、書き方です。向きを変えて、小さくした三角形 PQR があります。角の印が同じ頂点が、対応しています。', { clear: true, cols: [0.34, 0.66], part: '対応する頂点', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '印', text: '同じ数の弧の角が\n対応している', t: 4.0 }, Object.assign(f3, { prims: [] })], draw: [G('g3', shape3, angs3)] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。△ABC と △PQR は、相似です。対応する頂点の順に、正しく書いたものは、どれでしょう。', { ft: 'normal' }),
      [{ t: '△ABC∽△RPQ', ok: true }, { t: '△ABC∽△PQR' }, { t: '△ABC∽△QRP' }, { t: '△ABC∽△RQP' }],
      { 1: [b('ABC と PQR で、文字の順が、そろっているから、これでしょ！', { fb: 'happy', up: true }), t('文字の順では、ありません。∠A と等しいのは、∠P ではなく ∠R です。対応する頂点を、順に書きます。', sad)],
        2: [t('A に対応するのは、R です。Q では、ありません。弧の数が同じ頂点を、さがしましょう。', { ft: 'normal' })],
        ok: [t('正解！ A と R、B と P、C と Q が対応するので、△ABC∽△RPQ です。', { ft: 'happy' }), b('順番にも、決まりがあるんだね！', { fb: 'star', up: true })],
        wrong: [t('A と R は対応していますが、B と P、C と Q も、対応します。B と C の順が、入れかわっていますね。', { ft: 'normal' })] }),

    t('相似な図形で、対応する辺の比を、相似比といいます。△ABC と △RPQ の相似比は、2：1 です。くわしくは、次の時間です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '相似比', text: '対応する辺の比', t: 3.5 }] }),

    /* ---------- 5ページ目：使ってみよう ---------- */
    t('では、使ってみましょう。△GHI∽△JKL で、GH は5cm、JK は15cm です。HI は6cm です。', { clear: true, cols: [0.34, 0.66], part: '使ってみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: 'GH＝5cm　JK＝15cm\nHI＝6cm\nKL は？', t: 4.0 }, Object.assign(f4, { prims: [] })], draw: [G('g4', shape4)] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。対応する辺 KL の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '90cm' }, { t: '60cm' }, { t: '18cm', ok: true }, { t: '16cm' }],
      { 3: [b('5cm が15cm で、10cm ふえたから、6cm にも、10cm 足して、16cm！', { fb: 'happy', up: true }), t('足すのではなく、かけます。5cm が15cm で、3倍です。対応する辺は、どれも3倍になります。', sad)],
        0: [t('かけているのは、15ですね。かける数は、倍率の3です。KL は、HI の3倍です。', { ft: 'normal' })],
        ok: [t('正解！ 5cm が15cm で、3倍です。KL は、HI の3倍で、6×3＝18cm です。', { ft: 'happy' }), b('倍率の3を、ぜんぶの辺に、かければいいんだね！', { fb: 'star', up: true })],
        wrong: [t('倍率は、15÷5＝3 です。KL は、6×3＝18cm です。60cm は、大きすぎます。', { ft: 'normal' })] }),

    t('まとめです。相似な図形は、対応する角が、それぞれ等しく、対応する辺の比が、すべて等しい図形です。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '相似な図形\n・対応する角は等しい\n・対応する辺の比は\n　すべて等しい', t: 6.5 }] }),
    b('角と比、両方そろって、はじめて同じ形！ ぼくの顔は、もとの形に、戻してもらおう！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
