/* 中3 5章 相似な図形　第20時（確）「「相似な図形」で学んだことを、整理して確かめよう」。自作。単元のまとめ（前半の相似条件・証明も総ざらい）。
   Q1 直角三角形 ∠B＝∠E＝90°, ∠A＝∠D → 2組の角（図は AB＝6, BC＝8, DE＝9, EF＝12：6-8-10 と 9-12-15 の直角三角形）／Q2 AB＝6, DE＝9, BC＝8 → EF＝8×3÷2＝12cm（相似比2：3）
   Q3 DE∥BC → ∠ABC＝∠ADE は同位角／Q4 AD＝3, DB＝5, DE＝6 → AB＝8、6：BC＝3：8、BC＝16cm（図は AD：AB＝3：8）／Q5 相似比1：2の立方体：表面積4倍・体積8倍。
   その他（文のみ）：相似の意味、平行線と線分の比、中点連結定理（MN∥BC, MN＝BC÷2）。 */
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
    .replace(/逆/g, 'ぎゃく').replace(/二等辺/g, 'にとうへん').replace(/対頂角/g, 'たいちょうかく').replace(/同位角/g, 'どういかく').replace(/錯角/g, 'さっかく').replace(/罫線/g, 'けいせん').replace(/割高/g, 'わりだか').replace(/得意/g, 'とくい').replace(/お得/g, 'おとく').replace(/得/g, 'とく')
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
  // 1ページ目：直角三角形 ABC（AB＝6，BC＝8）と DEF（DE＝9，EF＝12）。1cm＝0.4
  const k1 = 0.4, rB = [1.0, 1.2], rA = [1.0, 1.2 + 6 * k1], rC = [1.0 + 8 * k1, 1.2], rE = [6.0, 1.2], rD = [6.0, 1.2 + 9 * k1], rF = [6.0 + 12 * k1, 1.2];
  const triS = [PG([rA, rB, rC], 'y', { fill: 'y', alpha: 0.12 }), DT(rA, 'A', [-0.7, 0.7], 'y'), DT(rB, 'B', [-0.7, -0.7], 'y'), DT(rC, 'C', [0.7, -0.7], 'y'), RT(rB, [1, 0], [0, 1], 18), arcm(rA, rB, rC, 0.6, 'p', 1)];
  const triL = [PG([rD, rE, rF], 'p', { fill: 'p', alpha: 0.12 }), DT(rD, 'D', [-0.7, 0.7], 'p'), DT(rE, 'E', [-0.7, -0.7], 'p'), DT(rF, 'F', [0.7, -0.7], 'p'), RT(rE, [1, 0], [0, 1], 18), arcm(rD, rE, rF, 0.8, 'p', 1)];
  const sideLab = [TX(add2(mid(rA, rB), [-0.15, 0]), '6cm', 'y', 28, 'end'), TX([mid(rB, rC)[0], 0.7], '8cm', 'y', 28), TX(add2(mid(rD, rE), [-0.15, 0]), '9cm', 'p', 28, 'end'), TX([mid(rE, rF)[0], 0.7], '？', 'p', 34)];
  // 2ページ目：DE∥BC、AD：DB＝3：5（AD：AB＝3：8）、BC＝16 の 1cm＝0.5375
  const k2 = 8.6 / 16, uA = [5.2, 4.9], uB = [1.2, 0.9], uC = [9.8, 0.9], uD = lerp(uA, uB, 3 / 8), uE = lerp(uA, uC, 3 / 8);
  const tri2 = [PG([uA, uB, uC], 'w'), DT(uA, 'A', [0, 1], 'y'), DT(uB, 'B', [-0.7, -0.7], 'y'), DT(uC, 'C', [0.7, -0.7], 'y'), DT(uD, 'D', [-0.9, 0.2], 'p', { r: 5.5 }), DT(uE, 'E', [0.9, 0.2], 'p', { r: 5.5 }), LN(uD, uE, 'p', { wd: 4 }), para(uD, uE, 'b', 1), para(uB, uC, 'b', 1)];
  const angs2 = [arcm(uB, uC, uA, 0.7, 'g', 1), arcm(uD, uE, uA, 0.6, 'g', 1)];
  const lab2 = [TX(add2(mid(uA, uD), [-0.2, 0.1]), '3cm', 'g', 26, 'end'), TX(add2(mid(uD, uB), [-0.2, 0.0]), '5cm', 'g', 26, 'end'), TX(add2(mid(uD, uE), [0, 0.35]), '6cm', 'p', 26), TX([mid(uB, uC)[0], 0.45], 'BC＝？', 'y', 28)];
  // 3ページ目：相似比1：2の立方体（斜投影 1cm＝1.0）
  const pj1 = prj([1.6, 1.2], 1.0), pj2 = prj([4.8, 1.2], 1.0);
  const cube1 = [boxFaces(pj1, 1, 1, 1, 'y', 0.2), boxEdges(pj1, 1, 1, 1, 'y'), TX(add2(pj1(0.5, 0, 0), [0, -0.4]), '1cm', 'y', 28)];
  const cube2 = [boxFaces(pj2, 2, 2, 2, 'p', 0.14), boxEdges(pj2, 2, 2, 2, 'p'), boxGrid(pj2, 2, 2, 2, 2, 2, 2, 'd'), TX(add2(pj2(1, 0, 0), [0, -0.4]), '2cm', 'p', 28)];
  // ふり返りのページ：中点連結定理（MN∥BC、MN＝BC÷2）
  const mA = [5.4, 4.9], mB = [2.0, 0.9], mC = [9.6, 0.9], mM = mid(mA, mB), mN = mid(mA, mC);
  const midFig = [PG([mA, mB, mC], 'w'), DT(mA, 'A', [0, 1], 'y'), DT(mB, 'B', [-0.7, -0.7], 'y'), DT(mC, 'C', [0.7, -0.7], 'y'), LN(mM, mN, 'p', { wd: 4.4 }), DT(mM, 'M', [-0.9, 0.3], 'p', { r: 5 }), DT(mN, 'N', [0.9, 0.3], 'p', { r: 5 }),
    tick(mA, mM, 'g', 1), tick(mM, mB, 'g', 1), tick(mA, mN, 'g', 2), tick(mN, mC, 'g', 2), para(mM, mN, 'b', 1), para(mB, mC, 'b', 1)];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3'), g4 = GF('g4');

  KL.lesson({ id: 'g3u5-20', unit: '中3　相似な図形', kick: '3年5章　第20時', title: '「相似な図形」で学んだことを、整理して確かめよう', card: '「相似な図形」で学んだことを、整理して確かめよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、「相似な図形」の、まとめです。前半の、相似条件や、証明も、いっしょに、ふり返ります。', { title: true, point: false, ft: 'happy' }),
    B('まとめ！ ぼく、縮小コピーの、名人だよ！ ぼくのぬいぐるみも、形はそのままで、小さくしちゃう！', { title: true, fb: 'proud', up: true }),
    T('ふふ。形が同じで、大きさがちがう。それが、相似です。ぬいぐるみの重さが、どうなるかも、あとで、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('形が同じで、大きさがちがう図形を、相似といいます。対応する角は、等しく、対応する辺の比は、すべて等しくなります。', { part: '相似な図形', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '「相似な図形」を\n整理して確かめよう', t: 4.0 }, { col: 0, type: 'box', color: 'b', size: 'xs', label: '相似', text: '対応する角は等しい\n辺の比はすべて等しい', t: 5.0 }, FG('g1')] }),
    T('図の△ABCと△DEFは、どちらも、∠Bと∠Eが、直角で、∠Aと∠Dが、等しい三角形です。', { ft: 'normal', point: false,
      draw: [g1(triS, triL)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。△ABC∽△DEFといえる、相似条件は、どれでしょう。', { ft: 'normal' }),
      [{ t: '3組の辺の比が、すべて等しい' }, { t: '2組の辺の比と、その間の角' }, { t: '2組の角が、それぞれ等しい', ok: true }, { t: '1組の辺と、その両端の角' }],
      { 0: [T('辺の長さは、この時点では、わかっていません。わかっているのは、角の関係です。', { ft: 'normal' })],
        1: [B('直角が、間の角でしょ？ だから、これだよ！', { fb: 'happy', up: true }), T('辺の比は、まだわかっていません。角が2組、等しいことから、判断します。', sad)],
        ok: [T('正解！ ∠B＝∠E＝90°、∠A＝∠D。2組の角が、それぞれ等しいので、相似です。', { ft: 'happy' }), B('角が2つ、そろえば、いいんだね！', { fb: 'star', up: true })],
        wrong: [T('その条件は、合同の条件です。ここでは、角が2組、等しいことを、使います。', { ft: 'normal' })] }),

    T('相似だから、対応する辺の比は、等しくなります。ABは6cm、BCは8cm、DEは9cmです。EFを、求めましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '長さ', text: 'AB＝6　BC＝8\nDE＝9　EF＝？', t: 4.0 }],
      draw: [g1(sideLab)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。EFの長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '16cm' }, { t: '12cm', ok: true }, { t: '11cm' }, { t: '10cm' }],
      { 2: [B('ABからDEで、3cm増えたから、BCにも3cm足して、11cm！', { fb: 'happy', up: true }), T('足し算では、ありません。相似比は、6：9＝2：3です。8：EF＝2：3で、EFは12です。', sad)],
        ok: [T('正解！ 相似比は、6：9＝2：3。8：EF＝2：3だから、EF＝8×3÷2＝12cmです。', { ft: 'happy' }), B('比例式で、解けたね！', { fb: 'star', up: true })],
        wrong: [T('相似比は、AB：DE＝6：9＝2：3です。8：EF＝2：3を解いて、EF＝12cmです。', { ft: 'normal' })] }),

    T('次は、証明です。△ABCで、DE∥BCです。△ABC∽△ADEを、証明します。まず、∠Aは、共通です。', { clear: true, cols: [0.34, 0.66], part: '相似の証明', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'b', size: 'xs', label: '仮定と結論', text: 'DE∥BC のとき\n△ABC∽△ADE', t: 4.0 }, { col: 0, type: 'text', size: 'xs', text: '△ABC と △ADE において\n共通な角だから　∠A＝∠A　…①', t: 5.0 }, FG('g2')],
      draw: [g2(tri2)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。∠ABC＝∠ADEといえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '平行線の錯角は等しいから' }, { t: '対頂角は等しいから' }, { t: '共通な角だから' }, { t: '平行線の同位角は等しいから', ok: true }],
      { 0: [B('平行線だから、錯角でしょ？', { fb: 'happy', up: true }), T('∠ABCと∠ADEは、平行線の、同じ側にある角で、同位角です。錯角は、内側の、斜め向きの角です。', sad)],
        1: [T('対頂角は、2直線が交わって、できる、向かい合う角です。この2つの角は、向かい合っていません。', { ft: 'normal' })],
        ok: [T('正解！ DE∥BCだから、同位角が等しく、∠ABC＝∠ADEです。これを、②とします。', { ft: 'happy' }), B('平行線の、同じ側の角だね！', { fb: 'star', up: true })],
        wrong: [T('∠Aは、共通な角ですが、∠ABCと∠ADEは、別の角です。この2つは、平行線の、同位角です。', { ft: 'normal' })] }),
    T('①②より、2組の角が、それぞれ等しいから、△ABC∽△ADEです。相似だから、AD：AB＝DE：BCです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '平行線の同位角は等しいから\n∠ABC＝∠ADE　…②\n①②より、2組の角が\nそれぞれ等しいから\n△ABC∽△ADE', t: 6.0 }],
      draw: [g2(angs2)] }),
    T('AD＝3cm、DB＝5cm、DE＝6cmとします。BCの長さを、求めましょう。ABは、3＋5で、出せますね。', { ft: 'normal', point: false,
      draw: [g2(lab2)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。BCの長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '10cm' }, { t: '12cm' }, { t: '16cm', ok: true }, { t: '48cm' }],
      { 0: [B('AD：DB＝DE：BCで、3：5＝6：BCだから、10cm！', { fb: 'happy', up: true }), T('DE：BCと対応するのは、AD：ABです。DBは、BCとは、対応しません。AB＝3＋5＝8です。', sad)],
        1: [T('12cmは、DEの2倍です。AD：AB＝3：8を使って、6：BC＝3：8を、解きます。', { ft: 'normal' })],
        ok: [T('正解！ AB＝3＋5＝8。6：BC＝3：8だから、BC＝6×8÷3＝16cmです。', { ft: 'happy' }), B('ABを、足して出すのが、ポイントだね！', { fb: 'star', up: true })],
        wrong: [T('48cmは、6×8の値です。3でわるのを、忘れています。BC＝6×8÷3＝16cmです。', { ft: 'normal' })] }),
    T('ほかにも、平行線と線分の比や、中点連結定理を、学びました。中点を結ぶ線は、残りの辺と平行で、長さは、半分です。', { clear: true, cols: [0.34, 0.66], part: 'ふり返り', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ふり返り', text: '平行線と線分の比\nAB：BC＝A′B′：B′C′\n中点連結定理\nMN∥BC　MN＝1/2BC', t: 7.0 }, FG('g4')],
      draw: [g4(midFig)] }),

    T('最後は、面積と体積です。相似比が、m：nのとき、面積比は、m²：n²。体積比は、m³：n³です。', { clear: true, cols: [0.34, 0.66], part: '面積と体積', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'きまり', text: '相似比 m：n\n面積比 m²：n²\n体積比 m³：n³', t: 5.0 }, FG('g3')],
      draw: [g3(cube1, cube2)] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。相似比が1：2の、2つの立方体で、大きいほうの、表面積と体積は、小さいほうの、何倍でしょう。', { ft: 'happy' }),
      [{ t: '表面積4倍　体積8倍', ok: true }, { t: '表面積4倍　体積4倍' }, { t: '表面積2倍　体積8倍' }, { t: '表面積2倍　体積4倍' }],
      { 1: [B('体積も、面積と同じで、4倍でしょ？', { fb: 'happy', up: true }), T('体積は、3乗で、2³＝8倍です。面積が、2乗で、2²＝4倍です。', sad)],
        2: [T('体積が、8倍は、合っています。でも、表面積は、面積なので、2乗の、4倍です。', { ft: 'normal' })],
        ok: [T('正解！ 表面積は、2²＝4倍、体積は、2³＝8倍です。', { ft: 'happy' }), B('長さが2倍だと、体積は、8倍かあ！', { fb: 'surprised', up: true })],
        wrong: [T('2倍や4倍では、足りません。面積は2乗で4倍、体積は3乗で8倍です。', { ft: 'normal' })] }),
    T('1辺が3倍なら、表面積は9倍、体積は27倍です。長さが増えるほど、体積は、ぐんぐん増えます。', { ft: 'normal', point: false }),
    T('この単元では、形が同じとは何かを、比で考えました。相似条件、証明、平行線と比、面積比と体積比。すべて、比で、つながっています。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '相似条件と証明\n三角形と比\n中点連結定理\n面積比・体積比', t: 7.0 }] }),
    B('ぬいぐるみが、半分の大きさなら、重さは、8分の1！ 軽くて、持ち運びに、便利だよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。この単元の、成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
