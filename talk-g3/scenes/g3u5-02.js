/* 中3 5章 相似な図形　第2時（例）「相似比を使って、辺の長さを求めよう」。自作。相似比・比例式。
   図1：△ABC∽△DEF，AB=10，BC=12，CA=14（cm，0.25 倍で描く），相似比 2：3 → DE=15，EF=18，FD=21。
   比例式：12：x＝2：3 → 2x＝36 → x＝18。14：y＝2：3 → y＝21。誤答：12：x＝3：2 などはどれも x＝8（EF が BC より小さくなる）。
   図2：△PQR∽△STU，相似比 5：3，PQ=15，QR=20，RP=30（0.2 倍で描く）→ ST=9，TU=12，US=18。PQR の ∠Q≒117.3°（鈍角）。
   最後：相似比 1：1 → 合同。 */
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
  /* ---- 図1：△ABC∽△DEF（相似比 2：3）。1cm＝0.25 ---- */
  const a1 = T3([0.4, 0.5], 3.0, 2.5, 3.5), a2 = T3([4.8, 0.5], 4.5, 3.75, 5.25);      // [A,B,C]，[D,E,F]
  const f1 = FG('g1', -0.6, -0.7, 10.0, 4.9), f1b = FG('g1b', -0.6, -0.7, 10.0, 4.9);
  const shape1 = [tri(a1, 'w', 'y'), tri(a2, 'w', 'b'), nm(a1, ['A', 'B', 'C']), nm(a2, ['D', 'E', 'F'])];
  const arcs1 = [ang(a1[0], a1[1], a1[2], 0.4, 1, 'g'), ang(a2[0], a2[1], a2[2], 0.6, 1, 'g'), ang(a1[1], a1[0], a1[2], 0.4, 2, 'p'), ang(a2[1], a2[0], a2[2], 0.6, 2, 'p'),
    ang(a1[2], a1[0], a1[1], 0.4, 3, 'b'), ang(a2[2], a2[0], a2[1], 0.6, 3, 'b')];
  const lenA = [sl(a1[0], a1[1], a1, '10cm', 'y'), sl(a1[1], a1[2], a1, '12cm', 'y'), sl(a1[2], a1[0], a1, '14cm', 'y')];
  const lenD = [sl(a2[0], a2[1], a2, '15cm', 'b'), sl(a2[1], a2[2], a2, 'x', 'g'), sl(a2[2], a2[0], a2, 'y', 'g')];
  const lenDE = sl(a2[0], a2[1], a2, '15cm', 'b'), lenX = Object.assign(sl(a2[1], a2[2], a2, 'x', 'g'), { temp: true });
  const lenEF = sl(a2[1], a2[2], a2, '18cm', 'g'), lenFD = sl(a2[2], a2[0], a2, '21cm', 'g');
  /* ---- 図2：△PQR∽△STU（相似比 5：3）。1cm＝0.2 ---- */
  const f2 = FG('g2', -1.9, -0.7, 9.4, 4.0);
  const p2 = T3([0.3, 0.5], 4.0, 3.0, 6.0), s2 = T3([6.2, 0.5], 2.4, 1.8, 3.6);          // [P,Q,R]，[S,T,U]
  const shape2 = [tri(p2, 'w', 'y'), tri(s2, 'w', 'b'), nm(p2, ['P', 'Q', 'R']), nm(s2, ['S', 'T', 'U']),
    sl(p2[0], p2[1], p2, '15cm', 'y'), sl(s2[0], s2[1], s2, '？', 'g')];

  KL.lesson({ id: 'g3u5-02', unit: '中3　相似な図形', kick: '3年5章　第2時', title: '相似比を使って、辺の長さを求めよう', card: '相似比を使って、辺の長さを求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    t('みなさん、こんにちは。今日は、相似な図形の、辺の長さを、相似比を使って、求めます。', { title: true, point: false, ft: 'happy' }),
    b('ぼくの銅像を、ぼくの10倍の大きさで、作ってもらうんだ！ 相似比は、10：1 だよね？ 大きいほうを、先に言うんでしょ？', { title: true, fb: 'proud', up: true }),
    t('相似比は、問題で示された順に、言います。ポンタと銅像の順なら、1：10 です。順番に気をつけて、進めましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    t('問題です。△ABC∽△DEF で、AB は10cm、DE は15cm、BC は12cm、CA は14cm です。EF と FD の長さを、求めます。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '相似比を使って\n辺の長さを求めよう', t: 4.0 }, Object.assign(f1, { prims: [] })], draw: [G('g1', shape1, arcs1, lenA, lenD)] }),
    t('まず、相似比を、調べます。対応する辺 AB と DE の、比を考えます。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', t('問題です。△ABC と △DEF の相似比は、どれでしょう。AB は10cm、DE は15cm です。', { ft: 'normal' }),
      [{ t: '2：3', ok: true }, { t: '2：1' }, { t: '2：5' }, { t: '3：2' }],
      { 3: [b('大きいほうが、先でしょ！ 15：10 で、3：2 だよ！', { fb: 'happy', up: true }), t('△ABC と △DEF の順に、聞かれています。先に言うのは、△ABC の辺 AB です。10：15 で、2：3 です。', sad)],
        1: [t('2：1 は、10：5 の比です。差の5を、使っていませんか。AB：DE＝10：15 を、かんたんにします。', { ft: 'normal' })],
        ok: [t('正解！ AB：DE＝10：15 で、5でわって、2：3 です。', { ft: 'happy' }), b('△ABC を、先に言えばいいんだね！', { fb: 'star', up: true })],
        wrong: [t('2：5 は、10：25 の比です。25は、10と15を足した数です。相似比は、10：15 です。', { ft: 'normal' })] }),

    t('対応する辺の比を、相似比といいます。△ABC と △DEF の相似比は、2：3 です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '相似比', text: '△ABC：△DEF\n＝2：3', t: 4.0 }] }),
    t('相似比は、どの辺でも、同じです。BC：EF も、2：3 です。EF を x として、比例式を立てましょう。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', t('問題です。EF の長さを x cm として、BC と EF の比例式を立てます。正しいものは、どれでしょう。', { ft: 'normal' }),
      [{ t: 'x：12＝2：3' }, { t: '12：x＝3：2' }, { t: '12：x＝2：3', ok: true }, { t: '12：3＝x：2' }],
      { 0: [b('x を、先に書いたほうが、かっこいいよ！', { fb: 'happy', up: true }), t('x：12＝2：3 だと、EF：BC が、2：3 になります。EF は BC より大きいので、おかしいですね。', sad)],
        1: [t('BC：EF を、3：2 にすると、EF のほうが小さくなります。EF は、BC より大きいはずです。', { ft: 'normal' })],
        ok: [t('正解！ BC：EF＝AB：DE＝2：3 です。BC の側が2、EF の側が3です。', { ft: 'happy' }), b('同じ並びで、書けばいいんだね！', { fb: 'star', up: true })],
        wrong: [t('12：3＝x：2 は、BC と、相似比の3を、つないでいます。比の並べ方が、ちがいます。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：比例式を解く ---------- */
    t('比例式は、内側の2つの数の積と、外側の2つの数の積が、等しくなります。これを使って、解きます。', { clear: true, cols: [0.34, 0.66], part: '比例式を解こう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '比例式の性質', text: 'a：b＝c：d ならば\nad＝bc', t: 4.5 }, Object.assign(f1b, { prims: [] })], draw: [G('g1b', shape1, arcs1, lenA, lenDE, lenX)] }),
    t('12：x＝2：3 では、外側が12と3、内側が x と2です。ですから、2x＝12×3 です。', { ft: 'normal', point: false, draw: [G('g1b', lenX)],
      add: [{ col: 0, type: 'text', size: 'xs', label: '解き方', text: '12：x＝2：3\n2x＝12×3', t: 4.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', t('問題です。2x＝12×3 から、x の値を求めます。EF は、何cmでしょう。', { ft: 'normal', draw: [G('g1b', lenX)] }),
      [{ t: '36cm' }, { t: '18cm', ok: true }, { t: '17cm' }, { t: '8cm' }],
      { 0: [b('12×3＝36 だから、x は36cm でしょ！', { fb: 'happy', up: true }), t('36 は、2x の値です。x は、その2分の1です。2でわって、18 です。', sad)],
        3: [t('8cm は、BC より短いですね。EF は、BC より大きいはずです。2x＝36 を、2でわります。', { ft: 'normal' })],
        ok: [t('正解！ 2x＝36 を、2でわって、x＝18 です。EF は、18cm です。', { ft: 'happy' }), b('BC の12cm より、大きくなったね！', { fb: 'star', up: true })],
        wrong: [t('17cm は、12に、15−10 の差の5を、足した数です。足すのではなく、比で考えます。', { ft: 'normal' })] }),

    t('FD も、同じです。14：y＝2：3 から、2y＝14×3＝42 で、y＝21 です。FD は、21cm です。', { ft: 'normal', point: false, draw: [G('g1b', lenEF, lenFD)],
      add: [{ col: 0, type: 'text', size: 'xs', label: 'FD', text: '14：y＝2：3\n2y＝14×3\ny＝21', t: 4.0 }] }),

    /* ---------- 3ページ目：大きいほうから小さいほうへ ---------- */
    t('今度は、大きいほうから、小さいほうを、求めます。△PQR∽△STU で、相似比は 5：3 です。PQ は15cm です。', { clear: true, cols: [0.34, 0.66], part: '小さいほうを求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '問題', text: '△PQR∽△STU\n相似比 5：3\nPQ＝15cm\nST は？', t: 4.5 }, Object.assign(f2, { prims: [] })], draw: [G('g2', shape2)] }),

    /* ---------- 問4 ---------- */
    Q('q4', t('問題です。対応する辺 ST の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '9cm', ok: true }, { t: '13cm' }, { t: '25cm' }, { t: '45cm' }],
      { 2: [b('15cm に、5：3 の、5÷3 をかけて、25cm！ 5を使えば、いいんでしょ？', { fb: 'happy', up: true }), t('相似比 5：3 は、PQ のほうが大きい、という意味です。ST は PQ より小さいので、15cm より短くなります。', sad)],
        1: [t('13cm は、15から、5と3の差の2を、引いた数です。差を引いても、求まりません。比例式を立てます。', { ft: 'normal' })],
        ok: [t('正解！ PQ：ST＝5：3 だから、15：ST＝5：3 です。5×ST＝15×3 で、ST＝9cm です。', { ft: 'happy' }), b('小さいほうは、PQ より短くなったね！', { fb: 'star', up: true })],
        wrong: [t('45cm は、15×3 です。3をかけたら、5でわる必要があります。45÷5＝9 です。', { ft: 'normal' })] }),

    /* ---------- 問5 ---------- */
    t('最後に、特別な場合です。相似比が 1：1 の、相似な図形を、考えます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '考えよう', text: '相似比が 1：1', t: 3.0 }] }),
    Q('q5', t('問題です。相似比が 1：1 の、相似な図形は、どんな関係でしょう。', { ft: 'normal' }),
      [{ t: '相似ではない' }, { t: '角がちがう' }, { t: '一方が2倍の大きさ' }, { t: '合同', ok: true }],
      { 0: [b('1：1 は、比べる意味が、ないよね？ だから、相似じゃないよ！', { fb: 'happy', up: true }), t('1：1 は、対応する辺が、すべて同じ長さ、ということです。相似の特別な場合で、合同になります。', sad)],
        ok: [t('正解！ 相似比が 1：1 なら、ぴったり重なります。合同は、相似の特別な場合です。', { ft: 'happy' }), b('合同って、相似の仲間だったんだね！', { fb: 'star', up: true })],
        wrong: [t('1：1 なら、対応する辺が、すべて等しく、角も等しくなります。ぴったり重なる、合同です。', { ft: 'normal' })] }),

    t('まとめです。相似比は、対応する辺の比です。順番に気をつけて、比例式を立てれば、辺の長さが求まります。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '相似比＝\n対応する辺の比\n比例式を立てて解く\nad＝bc', t: 6.0 }] }),
    b('1：10 の銅像なら、ぼくの鼻が 2cm で、銅像の鼻は 20cm！ 鼻だけ、目立ちすぎるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    t('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
