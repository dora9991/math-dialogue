/* 中3 5章 相似な図形　第18時（練）「相似の問題を、教え合って解こう」。自作。ホー先生とポンタ先生が交代で出題（教え合い）。ポンタ先生の誤りを直す。
   R1 相似条件：AB＝6, AC＝9, ∠A＝50°, DE＝4, DF＝6, ∠D＝50° → 6：4＝9：6＝3：2 と間の角 → 2組の辺の比とその間の角。
   R2 三角形と比（ポンタ先生）：DE∥BC, AD＝4, DB＝2, DE＝8 → AD：AB＝4：6、8：BC＝4：6 → BC＝12（ポンタ先生は AD：DB＝DE：BC として 4）。
   R3 平行線と線分の比：AB＝3, BC＝2, A′C′＝10 → A′B′＝10×3÷5＝6。
   R4 面積比（ポンタ先生）：相似比3：5、小さい面積27cm² → 27×25÷9＝75cm²（ポンタ先生は 27×5÷3＝45）。
   R5 体積比：相似比2：3、大きい体積405cm³ → 405×8÷27＝120cm³。
   図：R1 は ∠A＝∠D＝50° を極座標で計算（AB：DE＝6：4、AC：DF＝9：6、1cm＝0.4）。R2 は BC＝12cm＝1cm＝0.78、AB＝6cm。R3 は ys の間隔 1.8：1.2、A′C′＝10cm。
   Q1 2組の辺の比とその間の角／Q2 12cm／Q3 6cm／Q4 75cm²／Q5 120cm³。 */
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
  // ---- 立体（斜投影）：prj(o, s)(x, y, z)＝[o.x＋s(x＋0.5y·cos45°), o.y＋s(z＋0.5y·sin45°)]。x：横、y：奥ゆき、z：高さ ----
  const C45 = Math.SQRT1_2;
  const prj = (o, s) => (x, y, z) => [o[0] + s * (x + 0.5 * y * C45), o[1] + s * (z + 0.5 * y * C45)];
  // 直方体 a×b×c（横×奥ゆき×高さ）の12本の辺。見えない3辺（うしろ・左・下）は dash:true
  const boxEdges = (pj, a, b, c, col, wd) => {
    const E = (p, q, dash) => LN(pj(...p), pj(...q), col, Object.assign({ wd: wd || 3.4 }, dash ? { dash: true } : {}));
    return [E([0, 0, 0], [a, 0, 0]), E([a, 0, 0], [a, 0, c]), E([a, 0, c], [0, 0, c]), E([0, 0, c], [0, 0, 0]),
      E([0, b, 0], [a, b, 0], 1), E([a, b, 0], [a, b, c]), E([a, b, c], [0, b, c]), E([0, b, c], [0, b, 0], 1),
      E([0, 0, 0], [0, b, 0], 1), E([a, 0, 0], [a, b, 0]), E([a, 0, c], [a, b, c]), E([0, 0, c], [0, b, c])];
  };
  // 見える3面（正面・上・右）のぬり
  const boxFaces = (pj, a, b, c, col, alpha) => [[[0, 0, 0], [a, 0, 0], [a, 0, c], [0, 0, c]], [[0, 0, c], [a, 0, c], [a, b, c], [0, b, c]], [[a, 0, 0], [a, b, 0], [a, b, c], [a, 0, c]]]
    .map((f, i) => PG(f.map(p => pj(...p)), col, { fill: col, alpha: (alpha || 0.14) * (i === 0 ? 1 : i === 1 ? 1.5 : 0.7), wd: 2 }));
  // 見える3面を、横 na・奥ゆき nb・高さ nc 等分する線（細い線）
  const boxGrid = (pj, a, b, c, na, nb, nc, col) => { const out = [], L = (p, q) => out.push(LN(pj(...p), pj(...q), col || 'd', { wd: 2 }));
    for (let i = 1; i < na; i++) { const x = a * i / na; L([x, 0, 0], [x, 0, c]); L([x, 0, c], [x, b, c]); }
    for (let k = 1; k < nc; k++) { const z = c * k / nc; L([0, 0, z], [a, 0, z]); L([a, 0, z], [a, b, z]); }
    for (let j = 1; j < nb; j++) { const y = b * j / nb; L([0, y, c], [a, y, c]); L([a, y, 0], [a, y, c]); }
    return out; };
  // ---- 図の座標 ----
  const R = Math.PI / 180;
  const polar = (o, len, deg) => [o[0] + len * Math.cos(deg * R), o[1] + len * Math.sin(deg * R)];
  // 1ページ目：∠A＝∠D＝50°。AB＝6cm，AC＝9cm，DE＝4cm，DF＝6cm（1cm＝0.4）
  const k1 = 0.4, rA = [2.6, 4.7], rB = polar(rA, 6 * k1, 245), rC = polar(rA, 9 * k1, 295), rD = [8.0, 4.7], rE = polar(rD, 4 * k1, 245), rF = polar(rD, 6 * k1, 295);
  const triA = [PG([rA, rB, rC], 'y', { fill: 'y', alpha: 0.12 }), DT(rA, 'A', [0, 1], 'y'), DT(rB, 'B', [-0.8, -0.6], 'y'), DT(rC, 'C', [0.8, -0.6], 'y'),
    arcm(rA, rB, rC, 0.5, 'p', 1), TX(add2(rA, [0, -0.95]), '50°', 'p', 26), TX(add2(mid(rA, rB), [-0.15, 0.1]), '6cm', 'y', 26, 'end'), TX(add2(mid(rA, rC), [0.25, 0.1]), '9cm', 'y', 26, 'start')];
  const triD = [PG([rD, rE, rF], 'p', { fill: 'p', alpha: 0.12 }), DT(rD, 'D', [0, 1], 'p'), DT(rE, 'E', [-0.8, -0.6], 'p'), DT(rF, 'F', [0.8, -0.6], 'p'),
    arcm(rD, rE, rF, 0.4, 'p', 1), TX(add2(rD, [0, -0.8]), '50°', 'p', 24), TX(add2(mid(rD, rE), [-0.15, 0.1]), '4cm', 'p', 26, 'end'), TX(add2(mid(rD, rF), [0.25, 0.1]), '6cm', 'p', 26, 'start')];
  // 2ページ目：△ABC で DE∥BC。AD＝4，DB＝2（AB＝6），DE＝8，BC＝12（1cm＝0.78）
  const k2 = 0.78, sB = [1.0, 0.9], sC = [1.0 + 12 * k2, 0.9];
  const sA = [sB[0] + Math.sqrt((6 * k2) ** 2 - 4.0 ** 2), 4.9], sD = lerp(sA, sB, 2 / 3), sE = lerp(sA, sC, 2 / 3);
  const tri2 = [PG([sA, sB, sC], 'w'), DT(sA, 'A', [0, 1], 'y'), DT(sB, 'B', [-0.7, -0.7], 'y'), DT(sC, 'C', [0.7, -0.7], 'y'), DT(sD, 'D', [-0.9, 0.2], 'p', { r: 5.5 }), DT(sE, 'E', [0.9, 0.2], 'p', { r: 5.5 }), LN(sD, sE, 'p', { wd: 4 }), para(sD, sE, 'b', 1), para(sB, sC, 'b', 1)];
  const lab2 = [TX(add2(mid(sA, sD), [-0.2, 0.1]), '4cm', 'g', 26, 'end'), TX(add2(mid(sD, sB), [-0.2, 0.0]), '2cm', 'g', 26, 'end'), TX(add2(mid(sD, sE), [0, 0.35]), '8cm', 'p', 26), TX([mid(sB, sC)[0], 0.45], 'BC＝？', 'y', 28)];
  // 3ページ目：平行線の間隔 1.8：1.2（AB：BC＝3：2）、A′C′＝10cm
  const ys = [4.4, 2.6, 1.4], kp = 0.5, kq = 2.0;
  const pA = [1.0, ys[0]], pB = [1.0 + kp * 1.8, ys[1]], pC = [1.0 + kp * 3.0, ys[2]];
  const qA = [4.0, ys[0]], qB = [4.0 + kq * 1.8, ys[1]], qC = [4.0 + kq * 3.0, ys[2]];
  const lineX = (a, c, col) => LN(sub2(a, mul2(dirv(a, c), 0.45)), add2(c, mul2(dirv(a, c), 0.45)), col, { wd: 3.6 });
  const lad = [ys.map(y => LN([0.4, y], [11.2, y], 'w', { wd: 3 })), ys.map(y => para([0.4, y], [11.2, y], 'b', 1, 0.96)), lineX(pA, pC, 'y'), lineX(qA, qC, 'p'),
    DT(pA, 'A', [-0.9, 0.5], 'y'), DT(pB, 'B', [-1, 0], 'y'), DT(pC, 'C', [-0.9, -0.5], 'y'), DT(qA, 'A′', [0.9, 0.6], 'p'), DT(qB, 'B′', [0.9, 0.6], 'p'), DT(qC, 'C′', [1, 0.6], 'p')];
  const ladLab = [TX(add2(mid(pA, pB), [-0.55, 0.05]), '3cm', 'y', 28, 'end'), TX(add2(mid(pB, pC), [-0.55, 0.0]), '2cm', 'y', 28, 'end'), TX(add2(mid(qA, qC), [0.9, 0.2]), 'A′C′＝10cm', 'p', 28, 'start'), TX(add2(mid(qA, qB), [-0.15, -0.3]), '？', 'p', 32, 'end')];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3');

  KL.lesson({ id: 'g3u5-18', unit: '中3　相似な図形', kick: '3年5章　第18時', title: '相似の問題を、教え合って解こう', card: '相似の問題を、教え合って解こう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、教え合いの時間です。ホー先生と、ポンタ先生が、交代で、問題を出します。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、今日は、先生役だよ！ 黒板の前に立つと、頭が、よくなる気がするんだ！ チョークは、持てないけど！', { title: true, fb: 'proud', up: true }),
    T('ふふ。ポンタ先生の、解説も、聞いてみましょう。まちがいがあったら、いっしょに、直しましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('ラウンド1は、ホー先生の問題です。△ABCと△DEFで、AB＝6cm、AC＝9cm、DE＝4cm、DF＝6cm。∠Aと∠Dは、どちらも50°です。', { part: 'ラウンド1　相似条件', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '相似の問題を\n教え合って解こう', t: 4.0 }, { col: 0, type: 'text', size: 'xs', label: '条件', text: 'AB＝6　AC＝9\nDE＝4　DF＝6\n∠A＝∠D＝50°', t: 5.0 }, FG('g1')],
      draw: [g1(triA, triD)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。この2つの三角形が、相似といえる根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺の比が、すべて等しい' }, { t: '2組の角が、それぞれ等しい' }, { t: '2組の辺の比と、その間の角' , ok: true }, { t: '1組の辺と、その両端の角' }],
      { 0: [T('BCとEFの長さは、わかっていません。3組の辺の比は、確かめられません。', { ft: 'normal' })],
        1: [B('50°が2つあるから、2組の角が、等しいでしょ？', { fb: 'happy', up: true }), T('50°は、∠Aと∠Dの、1組だけです。ほかの角は、わかっていません。', sad)],
        ok: [T('正解！ AB：DE＝6：4＝3：2、AC：DF＝9：6＝3：2。その間の角が、50°で等しいので、相似です。', { ft: 'happy' }), B('辺の比と、間の角を、見るんだね！', { fb: 'star', up: true })],
        wrong: [T('それは、合同の条件です。ここでは、辺の長さではなく、辺の比と、角が、わかっています。', { ft: 'normal' })] }),

    T('ラウンド2は、ポンタ先生の出題です。ポンタ先生、どうぞ。', { clear: true, cols: [0.34, 0.66], part: 'ラウンド2　ポンタ先生の問題', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'DE∥BC\nAD＝4　DB＝2\nDE＝8　BCは？', t: 5.0 }, FG('g2')],
      draw: [g2(tri2, lab2)] }),
    B('△ABCで、DE∥BC！ ぼくの答えは、AD：DB＝DE：BCで、4：2＝8：BCだから、BCは4cm！ 完ぺきだよ！', { fb: 'proud', up: true }),
    T('ポンタ先生の解き方は、本当に、合っているでしょうか。みなさんも、考えてみましょう。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。BCの長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '4cm' }, { t: '12cm', ok: true }, { t: '16cm' }, { t: '24cm' }],
      { 0: [T('4cmは、ポンタ先生の答えです。AD：DBは、辺ABの中の比で、DE：BCとは、対応しません。', { ft: 'normal' }), B('えっ、ちがうの？ AD：DBじゃ、だめなんだ…', { fb: 'sad', up: true })],
        2: [T('16cmは、DE：BC＝DB：ADとした値です。上と下が、逆になっています。', { ft: 'normal' })],
        ok: [T('正解！ DE：BC＝AD：AB。AB＝4＋2＝6だから、8：BC＝4：6です。BC＝12cmです。', { ft: 'happy' }), B('ADと、ABを使うんだね！ ぼく先生、失格かな…', { fb: 'sad', up: true, fx: { b: 'sweat' } })],
        wrong: [T('24cmは、DE：BC＝DB：ABとした値です。DBは、DEとは対応しません。AD：ABを使います。', { ft: 'normal' })] }),

    T('ラウンド3は、ホー先生の問題です。3本の平行線に、2直線が、交わっています。ABは3cm、BCは2cm、A′C′は10cmです。', { clear: true, cols: [0.34, 0.66], part: 'ラウンド3　平行線と比', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'AB＝3　BC＝2\nA′C′＝10\nA′B′は？', t: 5.0 }, FG('g3')],
      draw: [g3(lad, ladLab)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。A′B′の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '3cm' }, { t: '4cm' }, { t: '5cm' }, { t: '6cm', ok: true }],
      { 0: [B('ABが3cmだから、A′B′も、3cmでしょ？', { fb: 'happy', up: true }), T('等しいのは、線分の比です。長さは、同じとは、限りません。AB：BC＝A′B′：B′C′です。', sad)],
        1: [T('4cmは、B′C′の長さです。A′B′は、10cmを、3：2に分けた、前のほうです。', { ft: 'normal' })],
        ok: [T('正解！ AB：BC＝3：2だから、A′B′は、A′C′の、[[3/5]]です。10×3÷5＝6cmです。', { ft: 'happy' }), B('全体を、3：2に分けるんだね！', { fb: 'star', up: true })],
        wrong: [T('5cmは、10の半分です。3：2に分けるので、半分では、ありません。10×3÷5＝6cmです。', { ft: 'normal' })] }),

    T('ラウンド4は、ポンタ先生の出題です。ポンタ先生、どうぞ。', { clear: true, cols: [0.34, 0.66], part: 'ラウンド4　面積比', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '相似比　3：5\n小さいほうの面積\n27cm²　大きいほうは？', t: 5.0 }] }),
    B('相似比が3：5で、小さいほうが27平方センチメートル！ 大きいほうは、27×5÷3＝45平方センチメートルだよ！ すごいでしょ！', { fb: 'proud', up: true }),
    T('ふふ。45平方センチメートルで、いいのでしょうか。みなさんも、確かめてください。', { ft: 'normal', point: false }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。大きいほうの面積は、何平方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '45cm²' }, { t: '75cm²', ok: true }, { t: '125cm²' }, { t: '225cm²' }],
      { 0: [T('45は、ポンタ先生の答えです。相似比の3：5を、そのまま使っています。面積比は、2乗の、9：25です。', { ft: 'normal' }), B('2乗するのを、忘れてたよ…', { fb: 'sad', up: true, fx: { b: 'sweat' } })],
        2: [T('125は、3乗の、27：125を、使った値です。3乗は、体積の比です。面積は、2乗の、9：25です。', { ft: 'normal' })],
        ok: [T('正解！ 面積比は、3²：5²＝9：25です。27×25÷9＝75平方センチメートルです。', { ft: 'happy' }), B('ぼく先生は、2乗を、忘れてたんだね！', { fb: 'surprised', up: true })],
        wrong: [T('225は、27×25÷3の値です。9でわるところを、3でわっています。27×25÷9＝75です。', { ft: 'normal' })] }),

    T('ラウンド5は、立体の問題です。相似な2つの立体の、相似比は、2：3です。大きいほうの体積は、405立方センチメートルです。', { clear: true, cols: [0.34, 0.66], part: 'ラウンド5　体積比', ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '最後の問題', text: '相似比　2：3\n大きいほうの体積\n405cm³', t: 5.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。小さいほうの体積は、何立方センチメートルでしょう。', { ft: 'happy' }),
      [{ t: '120cm³', ok: true }, { t: '180cm³' }, { t: '270cm³' }, { t: '360cm³' }],
      { 2: [B('相似比が2：3だから、405の[[2/3]]で、270立方センチメートルでしょ？', { fb: 'happy', up: true }), T('2：3は、長さの比です。体積比は、3乗の、8：27です。405×8÷27＝120です。', sad)],
        1: [T('180は、2乗の、4：9を使った値です。体積には、3乗の、8：27を使います。', { ft: 'normal' })],
        ok: [T('正解！ 体積比は、2³：3³＝8：27です。405×8÷27＝120立方センチメートルです。', { ft: 'happy' }), B('3乗で、考えるんだね！', { fb: 'star', up: true })],
        wrong: [T('360は、405×8÷9の値です。27でわるところを、9でわっています。405×8÷27＝120です。', { ft: 'normal' })] }),

    T('相似の問題では、まず、何の比なのかを、確かめます。長さの比は、そのまま。面積の比は、2乗。体積の比は、3乗です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '長さ　m：n\n面積　m²：n²\n体積　m³：n³', t: 6.0 }] }),
    B('ぼく先生は、2乗と3乗を、うっかり忘れました。でも、みんなと教え合って、思い出せたよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
