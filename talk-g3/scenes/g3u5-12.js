/* 中3 5章 相似な図形　第12時（探）「平行な直線にはさまれた線分の比を調べよう」。自作。平行線と線分の比。
   3本の平行線に直線p,qが交わる：AB＝3cm, BC＝5cm → AB：BC＝3：5、A′B′＝4.5cm, B′C′＝7.5cm → 3：5（同じ比）。理由：Aを通りqに平行な線をひき、まん中の平行線との交点P、下との交点Q。
   AA′B′Pは平行四辺形 → AP＝A′B′、PQ＝B′C′。△ACQ で BP∥CQ → AB：BC＝AP：PQ → AB：BC＝A′B′：B′C′。
   図：平行線の間隔 1.2：2.0（＝3：5）、p は 3-4-5（0.5 目もり＝1cm）、q は A′B′＝2.25, B′C′＝3.75（図の長さ）になるよう計算。
   類題（図3）：AB＝4, BC＝6, A′B′＝6 → B′C′＝9／（図4）AB＝4, BC＝6, A′C′＝15 → A′B′＝6。
   Q1 4.5：7.5＝3：5／Q2 AP＝A′B′／Q3 AB：BC＝AP：PQ／Q4 9cm／Q5 6cm。 */
(function () {
  const { T: T0, B: B0, Q, FIG, tbl } = KL;
  // ---- 読み上げ（say）：記号・英字・比を、ひらがな・カタカナの読みにする（字幕と数字は同じに保つ）----
  const KA = { A: 'エー', B: 'ビー', C: 'シー', D: 'ディー', E: 'イー', F: 'エフ', G: 'ジー', H: 'エイチ', I: 'アイ', J: 'ジェー', K: 'ケー', L: 'エル', M: 'エム', N: 'エヌ', O: 'オー', P: 'ピー', Q: 'キュー', R: 'アール', S: 'エス', T: 'ティー', U: 'ユー', V: 'ブイ', W: 'ダブリュー', X: 'エックス', Y: 'ワイ', Z: 'ゼット' };
  const KS = { a: 'エー', b: 'ビー', c: 'シー', h: 'エイチ', k: 'ケー', l: 'エル', m: 'エム', n: 'エヌ', p: 'ピー', q: 'キュー', r: 'アール', s: 'エス', t: 'ティー', x: 'エックス', y: 'ワイ' };
  const plainS = s => s.replace(/\{\{|\}\}|\*\*/g, '');
  const CN = ['いち', 'に', 'さん', 'よん', 'ご', 'ろく'];
  const rd = s => plainS(s)
    .replace(/\[\[([^\]\/]+)\/([^\]]+)\]\]/g, '$2分の$1')
    .replace(/[①-⑥]+/g, m => m.length === 1 ? 'まる' + CN['①②③④⑤⑥'.indexOf(m)] + '、' : [...m].map(c => CN['①②③④⑤⑥'.indexOf(c)]).join('、') + '、')
    .replace(/△/g, 'さんかく ').replace(/∠/g, 'かく ').replace(/∽/g, ' そうじ ').replace(/≡/g, ' 合同 ').replace(/∥/g, ' へいこう ').replace(/⊥/g, ' 垂直 ')
    .replace(/°/g, '度').replace(/＝/g, ' イコール ').replace(/≠/g, ' イコールではない ').replace(/：/g, ' たい ')
    .replace(/(?<=[0-9度A-Za-z）)])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
    .replace(/[(（]/g, 'かっこ、').replace(/[)）]/g, '、かっことじ、')
    .replace(/(?<![A-Za-z])cm²/g, '平方センチメートル').replace(/(?<![A-Za-z])cm³/g, '立方センチメートル').replace(/(?<![A-Za-z])cm(?![a-z])/g, 'センチメートル')
    .replace(/(?<=[0-9])m²/g, '平方メートル').replace(/(?<=[0-9])m³/g, '立方メートル').replace(/(?<=[0-9])mL/g, 'ミリリットル').replace(/(?<=[0-9])m(?![a-zA-Z²³])/g, 'メートル')
    .replace(/²/g, 'の2乗').replace(/³/g, 'の3乗').replace(/π/g, 'パイ')
    .replace(/逆/g, 'ぎゃく').replace(/二等辺/g, 'にとうへん').replace(/対頂角/g, 'たいちょうかく').replace(/同位角/g, 'どういかく').replace(/錯角/g, 'さっかく').replace(/罫線/g, 'けいせん')
    .replace(/(?:[A-Z]′?)+/g, m => { const t = [...m.matchAll(/([A-Z])(′?)/g)].map(x => ({ r: (KA[x[1]] || x[1]) + (x[2] ? 'ダッシュ' : ''), d: !!x[2] })); return t.map((x, i) => (i && (x.d || t[i - 1].d) ? ' ' : '') + x.r).join(''); })
    .replace(/(?<![A-Za-z])[a-z](?![A-Za-z])/g, m => KS[m] || m)
    .replace(/、、+/g, '、').replace(/ {2,}/g, ' ').trim();
  const wrap = f => (s, o) => { const r = rd(s); return f(s, r === plainS(s) ? o : Object.assign({ say: r }, o)); };
  const T = wrap(T0), B = wrap(B0);
  const sad = { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } };      // ポンタのまちがいを、先生がやさしく直す
  // ---- 図の小さな部品（この台本の中で定義。座標は数学の座標、y が上）----
  const FG = id => Object.assign(FIG(id, [0, 0, 11.6, 5.8], 1160, 580, [], { col: 1 }), { prims: [] });   // 図の入れもの（縦横比 1160:580 ＝ view 11.6:5.8）
  const GF = id => (...i) => ({ fig: id, items: i.flat(4) });                                                // 図 id に描き足す
  const PG = (pts, c, o) => Object.assign({ k: 'poly', pts, close: true, c, wd: 3.4 }, o || {});              // 多角形（close）
  const PL = (pts, c, o) => Object.assign({ k: 'poly', pts, c, wd: 3.4 }, o || {});                           // 折れ線（close なし）
  const LN = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c, wd: 3.4 }, o || {});                          // 線分
  const DT = (at, name, dir, c, o) => Object.assign({ k: 'pt', at, name, dir, off: 28, c: c || 'y', r: 6 }, o || {});   // 点と名前
  const TX = (at, text, c, size, anchor) => ({ k: 'label', at, text, c: c || 'w', size: size || 28, anchor: anchor || 'middle' });
  const RT = (at, u, v, s) => ({ k: 'right', at, u, v, s: s || 16, c: 'w' });                                          // 直角の印
  const EL = (o, rx, ry, a1, a2, c, op) => Object.assign({ k: 'ell', o, rx, ry, a1, a2, c, wd: 3.4 }, op || {});   // 円・だ円・弧
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];                              // a から b へ t（0〜1）の点
  const dirv = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const mul2 = (a, k) => [a[0] * k, a[1] * k];
  // 等しい長さの印：辺 a-b の真ん中に、辺と垂直な短い線を n 本
  const tick = (a, b, c, n) => { n = n || 1; const m = mid(a, b), u = dirv(a, b), v = [-u[1], u[0]], out = [];
    for (let i = 0; i < n; i++) { const s = (i - (n - 1) / 2) * 0.17, p = [m[0] + u[0] * s, m[1] + u[1] * s];
      out.push({ k: 'seg', a: [p[0] - v[0] * 0.14, p[1] - v[1] * 0.14], b: [p[0] + v[0] * 0.14, p[1] + v[1] * 0.14], c, wd: 3.4 }); }
    return out; };
  // 平行の印：辺 a-b の t（0〜1）の所に、b の向きの ＞ を n 個（平行な辺には、同じ向きでつける）
  const para = (a, b, c, n, t) => { n = n || 1; const m = lerp(a, b, t == null ? 0.5 : t), u = dirv(a, b), v = [-u[1], u[0]], out = [];
    for (let i = 0; i < n; i++) { const s = (i - (n - 1) / 2) * 0.26, p = [m[0] + u[0] * s, m[1] + u[1] * s];
      out.push({ k: 'poly', pts: [[p[0] - u[0] * 0.16 + v[0] * 0.15, p[1] - u[1] * 0.16 + v[1] * 0.15], [p[0] + u[0] * 0.08, p[1] + u[1] * 0.08], [p[0] - u[0] * 0.16 - v[0] * 0.15, p[1] - u[1] * 0.16 - v[1] * 0.15]], c, wd: 3.2 }); }
    return out; };
  // 角の印：頂点 o のまわり、o→a と o→b のあいだに、半径 r の弧を n 本（等しい角は、同じ色・同じ本数で）。gap は両端をあける割合
  const arcm = (o, a, b, r, c, n, gap) => { n = n || 1; gap = gap || 0; const t1 = Math.atan2(a[1] - o[1], a[0] - o[0]); let d = Math.atan2(b[1] - o[1], b[0] - o[0]) - t1; d = Math.atan2(Math.sin(d), Math.cos(d)); const out = [];
    for (let j = 0; j < n; j++) { const rr = r + j * 0.14, pts = []; for (let i = 0; i <= 14; i++) { const t = t1 + d * (gap + (1 - 2 * gap) * i / 14); pts.push([o[0] + rr * Math.cos(t), o[1] + rr * Math.sin(t)]); } out.push({ k: 'poly', pts, c, wd: 3 }); }
    return out; };
  // ---- 図の座標：平行線（水平）ys を、直線 p・q が切る。kp,kq は「下へ 1 進むとき、右へ進む量」----
  const ladder = (ys, xa, kp, xq, kq) => ({ P: ys.map(y => [xa + kp * (ys[0] - y), y]), Q: ys.map(y => [xq + kq * (ys[0] - y), y]) });
  const hLines = (ys, c) => ys.map(y => LN([0.4, y], [11.2, y], c || 'w', { wd: 3 }));
  const hMarks = ys => ys.map(y => para([0.4, y], [11.2, y], 'b', 1, 0.96));
  // 1・2ページ目：平行線の間隔 1.2 と 2.0（3：5）。p は 3-4-5（AB＝1.5，BC＝2.5）、q は A′B′＝2.25，B′C′＝3.75
  const ys1 = [4.2, 3.0, 1.0], kq1 = Math.sqrt((2.25 / 1.2) ** 2 - 1);
  const L1 = ladder(ys1, 1.2, 0.75, 4.5, kq1);
  const [pa, pb, pc] = L1.P, [qa, qb, qc] = L1.Q;
  const nmP = [DT(pa, 'A', [-0.9, 0.5], 'y'), DT(pb, 'B', [-1, 0], 'y'), DT(pc, 'C', [-0.9, -0.5], 'y')];
  const nmQ = [DT(qa, 'A′', [0.9, 0.6], 'p'), DT(qb, 'B′', [0.9, 0.6], 'p'), DT(qc, 'C′', [1, 0.6], 'p')];
  const lineP = (pts, c) => [LN(sub2(pts[0], mul2(dirv(pts[0], pts[2]), 0.45)), add2(pts[2], mul2(dirv(pts[0], pts[2]), 0.45)), c, { wd: 3.6 })];
  const base1 = [hLines(ys1), hMarks(ys1), lineP(L1.P, 'y'), lineP(L1.Q, 'p'), nmP, nmQ];
  const labP = [TX(add2(mid(pa, pb), [-0.55, 0.05]), '3cm', 'y', 28, 'end'), TX(add2(mid(pb, pc), [-0.55, 0.0]), '5cm', 'y', 28, 'end')];
  const labQ = [TX(add2(mid(qa, qb), [-0.15, -0.3]), '4.5cm', 'p', 28, 'end'), TX(add2(mid(qb, qc), [-0.15, -0.3]), '7.5cm', 'p', 28, 'end')];
  // 2ページ目：補助線（Aを通り q に平行）
  const Pp = [qb[0] - (qa[0] - pa[0]), qb[1]], Qq = [qc[0] - (qa[0] - pa[0]), qc[1]];
  const auxL = [LN(pa, Qq, 'g', { dash: true, wd: 3.4 }), DT(Pp, 'P', [-0.6, -0.9], 'g', { r: 5 }), DT(Qq, 'Q', [0.2, -1], 'g', { r: 5 })];
  const para2 = [para(pa, Qq, 'g', 1, 0.5), para(qa, qc, 'p', 1, 0.5)];
  const pgm = PG([pa, qa, qb, Pp], 'g', { fill: 'g', alpha: 0.16, wd: 3 });
  const pgm2 = PG([Pp, qb, qc, Qq], 'g', { fill: 'g', alpha: 0.16, wd: 3 });
  const triACQ = PG([pa, pc, Qq], 'y', { fill: 'y', alpha: 0.12, wd: 2.8 });
  // 3・4ページ目：AB＝4, BC＝6（間隔 1.4：2.1）、A′B′＝6, B′C′＝9, A′C′＝15
  const ys3 = [4.5, 3.1, 1.0];
  const hp3 = Math.hypot(1.4 * 1, 1.4 * 0.6);      // AB の図の長さ（kp＝0.6）
  const s3 = hp3 / 4;                               // 1cm の図の長さ
  const kq3 = Math.sqrt((6 * s3 / 1.4) ** 2 - 1);
  const L3 = ladder(ys3, 1.0, 0.6, 4.6, kq3);
  const [ra, rb, rc] = L3.P, [sa, sb, sc] = L3.Q;
  const nmP3 = [DT(ra, 'A', [-0.9, 0.5], 'y'), DT(rb, 'B', [-1, 0], 'y'), DT(rc, 'C', [-0.9, -0.5], 'y')];
  const nmQ3 = [DT(sa, 'A′', [0.9, 0.6], 'p'), DT(sb, 'B′', [0.9, 0.6], 'p'), DT(sc, 'C′', [1, 0.6], 'p')];
  const base3 = [hLines(ys3), hMarks(ys3), lineP(L3.P, 'y'), lineP(L3.Q, 'p'), nmP3, nmQ3];
  const lab3 = [TX(add2(mid(ra, rb), [-0.55, 0.05]), '4cm', 'y', 28, 'end'), TX(add2(mid(rb, rc), [-0.55, 0.0]), '6cm', 'y', 28, 'end'), TX(add2(mid(sa, sb), [-0.15, -0.3]), '6cm', 'p', 28, 'end'), TX(add2(mid(sb, sc), [-0.15, -0.3]), '？', 'p', 32, 'end')];
  const lab4 = [TX(add2(mid(ra, rb), [-0.55, 0.05]), '4cm', 'y', 28, 'end'), TX(add2(mid(rb, rc), [-0.55, 0.0]), '6cm', 'y', 28, 'end'), TX([11.2, 4.85], 'A′C′＝15cm', 'p', 30, 'end'), TX(add2(mid(sa, sb), [-0.15, -0.3]), '？', 'p', 32, 'end')];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3'), g4 = GF('g4');

  KL.lesson({ id: 'g3u5-12', unit: '中3　相似な図形', kick: '3年5章　第12時', title: '平行な直線にはさまれた線分の比を調べよう', card: '平行な直線にはさまれた線分の比を調べよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、平行な直線にはさまれた、線分の比を、調べます。', { title: true, point: false, ft: 'happy' }),
    B('ブラインドの板は、平行に並んでるね。ひもを斜めに通したら、すき間の比は、角度で変わっちゃうよね？', { title: true, fb: 'think', up: true }),
    T('ふふ。変わるのか、変わらないのか。ものさしで測って、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('3本の平行な直線に、直線pとqが、交わっています。交点を、図のように、A、B、C、A′、B′、C′とします。', { part: '測って調べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '平行線で切られた\n線分の比を調べよう', t: 4.0 }, FG('g1')],
      draw: [g1(base1)] }),
    T('直線pの上で、ABは3cm、BCは5cmです。ABとBCの比は、3：5です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'AB＝3cm　BC＝5cm\nAB：BC＝3：5', t: 4.0 }],
      draw: [g1(labP)] }),
    B('pとqは、傾きがちがうよ。だから、A′B′とB′C′の比は、3：5とは、ちがうと思うな！', { fb: 'happy', up: true }),
    T('では、ものさしで、測ります。A′B′は4.5cm、B′C′は7.5cmでした。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'A′B′＝4.5cm\nB′C′＝7.5cm', t: 4.0 }],
      draw: [g1(labQ)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。A′B′：B′C′を、もっとも簡単な整数の比にすると、どれでしょう。', { ft: 'normal' }),
      [{ t: '3：4' }, { t: '3：5', ok: true }, { t: '4：5' }, { t: '5：3' }],
      { 0: [T('4.5：7.5の両方を、1.5でわります。4.5÷1.5＝3、7.5÷1.5＝5で、3：5です。', { ft: 'normal' })],
        3: [B('7.5のほうが大きいから、7.5：4.5で、5：3！', { fb: 'happy', up: true }), T('A′B′が先、B′C′が後です。順番を守って、4.5：7.5＝3：5です。', sad)],
        ok: [T('正解！ 4.5÷1.5＝3、7.5÷1.5＝5。A′B′：B′C′＝3：5です。', { ft: 'happy' }), B('えっ、AB：BCと、同じ比だ！', { fb: 'surprised', up: true })],
        wrong: [T('4.5も7.5も、1.5の倍数です。1.5でわると、3と5になるので、3：5です。', { ft: 'normal' })] }),
    T('AB：BC＝3：5、A′B′：B′C′＝3：5。傾きがちがっても、比は、同じになりました。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '予想', text: 'AB：BC＝A′B′：B′C′', t: 4.0 }] }),
    B('たまたま、じゃないの？ ほかの線でも、同じになるの？', { fb: 'confused', up: true }),
    T('たまたまではないことを、証明で、確かめましょう。三角形と比の性質を、使います。', { ft: 'normal', point: false }),

    T('点Aから、直線qに平行な直線を、ひきます。まん中の平行線との交点を、P、下の平行線との交点を、Qとします。', { clear: true, cols: [0.34, 0.66], part: '理由を考えよう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '補助線', text: 'Aを通り、qに平行な\n直線をひく', t: 4.0 }, FG('g2')],
      draw: [g2(base1, auxL, para2[0])] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。APと、長さが等しい線分は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AB' }, { t: 'PQ' }, { t: 'A′B′', ok: true }, { t: 'B′C′' }],
      { 0: [B('Aから出てる線だから、ABと同じ長さでしょ？', { fb: 'happy', up: true }), T('APとABは、別の方向の線です。APは、qに平行なので、qの上のA′B′と、並びます。', sad)],
        ok: [T('正解！ AA′とPB′は平行、APとA′B′も平行です。AA′B′Pは、平行四辺形になります。', { ft: 'happy' }), B('向かい合う辺が、平行なんだね！', { fb: 'star', up: true })],
        wrong: [T('PQは、APの続きの線で、長さがちがいます。B′C′は、PQと等しい線分です。APと等しいのは、A′B′です。', { ft: 'normal' })] }),
    T('AA′∥PB′で、AP∥A′B′だから、AA′B′Pは、平行四辺形です。だから、AP＝A′B′です。同じように、PQ＝B′C′です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'AP＝A′B′\nPQ＝B′C′', t: 4.0 }],
      draw: [g2(pgm, pgm2)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。△ACQで、BP∥CQです。AB：BCと、等しい比は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'AP：PQ', ok: true }, { t: 'AP：AQ' }, { t: 'PQ：AP' }, { t: 'BP：CQ' }],
      { 1: [B('三角形と比の性質だから、AP：AQでしょ？', { fb: 'happy', up: true }), T('AP：AQは、AB：ACと等しい比です。ABの相手は、BCなので、APの相手は、PQです。', sad)],
        ok: [T('正解！ BP∥CQだから、AB：BC＝AP：PQです。ABにAP、BCにPQが対応します。', { ft: 'happy' }), B('三角形と比の性質が、ここで使えるんだ！', { fb: 'star', up: true })],
        wrong: [T('BP：CQは、AB：ACと等しい比です。PQ：APは、順番が逆です。AB：BCと等しいのは、AP：PQです。', { ft: 'normal' })] }),
    T('AP＝A′B′、PQ＝B′C′です。だから、AB：BC＝A′B′：B′C′が、いえました。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '平行線で切られた\n線分の比は等しい\nAB：BC＝A′B′：B′C′', t: 6.0 }],
      draw: [g2(triACQ)] }),
    B('平行線が、4本でも、5本でも、同じなの？', { fb: 'think', up: true }),
    T('その通りです。平行線は、何本でも、成り立ちます。三角形と比の性質は、この性質の、特別な場合です。', { ft: 'normal', point: false }),

    T('では、使ってみましょう。ABは4cm、BCは6cm、A′B′は6cmです。B′C′の長さを、求めます。', { clear: true, cols: [0.34, 0.66], part: '長さを求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '性質', text: 'AB：BC＝A′B′：B′C′', t: 4.0 }, FG('g3')],
      draw: [g3(base3, lab3)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。B′C′は、何cmでしょう。', { ft: 'normal' }),
      [{ t: '4cm' }, { t: '6cm' }, { t: '8cm' }, { t: '9cm', ok: true }],
      { 2: [B('ABからBCで、2cm増えるから、6cmに2cm足して、8cm！', { fb: 'happy', up: true }), T('足し算では、いけません。比が等しいので、かけ算で考えます。4：6＝6：B′C′です。', sad)],
        ok: [T('正解！ 4：6＝6：B′C′。4×B′C′＝6×6＝36だから、B′C′＝9cmです。', { ft: 'happy' }), B('比例式で、解けるんだね！', { fb: 'star', up: true })],
        wrong: [T('4cmや6cmは、問題の数を、そのまま写しただけです。4：6＝6：B′C′を解くと、B′C′＝9cmです。', { ft: 'normal' })] }),

    T('もう1問です。ABは4cm、BCは6cmで、A′C′の全体が、15cmです。A′B′を、求めます。', { clear: true, cols: [0.34, 0.66], part: '全体から求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'AB＝4cm　BC＝6cm\nA′C′＝15cm', t: 4.0 }, FG('g4')],
      draw: [g4(base3, lab4)] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。A′B′は、何cmでしょう。', { ft: 'happy' }),
      [{ t: '4cm' }, { t: '6cm', ok: true }, { t: '9cm' }, { t: '10cm' }],
      { 3: [B('2：3だから、15の[[2/3]]で、10cm！', { fb: 'happy', up: true }), T('2：3は、A′B′：B′C′です。A′B′：A′C′は、4：10＝2：5になります。', sad)],
        ok: [T('正解！ A′B′：A′C′＝4：10。15×4÷10＝6cmです。', { ft: 'happy' }), B('全体の比に、直せばいいんだね！', { fb: 'star', up: true })],
        wrong: [T('4cmはAB、9cmはB′C′の長さです。A′B′は、A′C′を4：6に分けた、前のほうだから、6cmです。', { ft: 'normal' })] }),
    T('平行線で切られた線分の比は、等しくなります。全体と部分の比に、直して使うことも、できます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '平行線と線分の比\nAB：BC＝A′B′：B′C′\nAB：AC＝A′B′：A′C′', t: 6.0 }] }),
    B('ブラインドのひもは、斜めでも、すき間の比は、そろってるんだね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
