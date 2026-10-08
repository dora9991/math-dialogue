/* 中3 5章 相似な図形　第19時（活）「どちらが得か、相似を使って判断しよう」。自作。面積比・体積比で値段を比べる。
   ①ピザ（厚さは同じ）：M 直径20cm 1000円、L 直径30cm 2400円 → 相似比2：3、面積比4：9（L＝M×2.25）、値段比1：2.4（2.25＜2.4 → 1cm²あたりはMが安い）。同じ割合になる L の値段＝1000×9÷4＝2250円。
   ②相似な缶：小 高さ10cm 200円、大 高さ15cm 600円 → 体積比8：27（3.375倍）、値段は3倍 → 1cm³あたりは大が安い（200×27÷8＝675円と同じ割合、600円は安い）。
   ③相似な立方体の箱 1辺5cmと10cm：表面積（包み紙）は4倍、体積（中身）は8倍 → 中身あたりの包み紙は半分。
   図：ピザは 1cm＝0.15（半径1.5と2.25）、缶は 1cm＝0.22（高さ2.2と3.3、直径はその 0.6倍）、箱は斜投影 1cm＝0.3。
   Q1 4：9／Q2 Mが得／Q3 2250円／Q4 大きい缶が得／Q5 半分になる。 */
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
  // ---- 図の部品：円・缶 ----
  const CI = (o, r, c, op) => Object.assign({ k: 'ell', o, rx: r, ry: r, c, wd: 3.4 }, op || {});
  const CI2 = (o, rx, ry, c, op) => Object.assign({ k: 'ell', o, rx, ry, c, wd: 3.4 }, op || {});
  const spokes = (o, r, n, c) => Array.from({ length: n }, (_, i) => LN(o, [o[0] + r * Math.cos(2 * Math.PI * (i + 0.5) / n), o[1] + r * Math.sin(2 * Math.PI * (i + 0.5) / n)], c, { wd: 1.6 }));
  // 缶（円柱）：底面の中心 c、半径 r、高さ h。底のうしろ半分は dash
  const can = (c, r, h, col) => { const e = 0.3 * r, t = [c[0], c[1] + h];
    return [PG([...arcPts(c, r, e, 180, 360, 30), ...arcPts(t, r, e, 360, 180, 30)], col, { fill: col, alpha: 0.12, wd: 0.5 }),
      LN([c[0] - r, c[1]], [c[0] - r, t[1]], col), LN([c[0] + r, c[1]], [c[0] + r, t[1]], col),
      PL(arcPts(c, r, e, 180, 360, 30), col), PL(arcPts(c, r, e, 0, 180, 30), col, { dash: true }),
      CI2(t, r, e, col, { fill: col, alpha: 0.22 })]; };
  const arcPts = (c, rx, ry, a1, a2, n) => Array.from({ length: n + 1 }, (_, i) => { const t = (a1 + (a2 - a1) * i / n) * Math.PI / 180; return [c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t)]; });
  // 1ページ目：ピザ（1cm＝0.15）
  const kz = 0.15, oM = [2.9, 3.3], oL = [7.8, 3.3];
  const pizzaM = [CI(oM, 10 * kz, 'y', { fill: 'y', alpha: 0.16 }), spokes(oM, 10 * kz, 8, 'd'), TX([oM[0], 1.55], 'Mサイズ', 'y', 30), TX([oM[0], 1.15], '直径20cm　1000円', 'y', 26)];
  const pizzaL = [CI(oL, 15 * kz, 'p', { fill: 'p', alpha: 0.14 }), spokes(oL, 15 * kz, 8, 'd'), TX([oL[0], 0.75], 'Lサイズ', 'p', 30), TX([oL[0], 0.35], '直径30cm　2400円', 'p', 26)];
  // 2ページ目：缶（高さ 10cm と 15cm、1cm＝0.22、直径は高さの 0.6倍）
  const kc = 0.22, canS = [2.9, 0.9], canL = [7.4, 0.9];
  const cansS = [can(canS, 0.3 * 10 * kc, 10 * kc, 'y'), TX([canS[0], 0.55], '高さ10cm　200円', 'y', 26)];
  const cansL = [can(canL, 0.3 * 15 * kc, 15 * kc, 'p'), TX([canL[0], 0.55], '高さ15cm　600円', 'p', 26)];
  // 3ページ目：立方体の箱（斜投影 1cm＝0.3）
  const pjA = prj([1.4, 1.1], 0.3), pjB = prj([5.2, 1.1], 0.3);
  const boxA = [boxFaces(pjA, 5, 5, 5, 'y', 0.18), boxEdges(pjA, 5, 5, 5, 'y'), TX(add2(pjA(2.5, 0, 0), [0, -0.4]), '1辺5cm', 'y', 28)];
  const boxB = [boxFaces(pjB, 10, 10, 10, 'p', 0.14), boxEdges(pjB, 10, 10, 10, 'p'), TX(add2(pjB(5, 0, 0), [0, -0.4]), '1辺10cm', 'p', 28)];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3');

  KL.lesson({ id: 'g3u5-19', unit: '中3　相似な図形', kick: '3年5章　第19時', title: 'どちらが得か、相似を使って判断しよう', card: 'どちらが得か、相似を使って判断しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、相似を使って、どちらが得かを、判断します。', { title: true, point: false, ft: 'happy' }),
    B('ピザは、大きいほうが、お得でしょ？ ぼくは、大きいピザなら、いつでも、お得だと思う！', { title: true, fb: 'proud', up: true }),
    T('ふふ。大きいほうが、いつも得とは、限りません。面積や体積の比で、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('ピザ屋さんの問題です。Mサイズは、直径20cmで1000円。Lサイズは、直径30cmで2400円です。厚さは、同じとします。', { part: 'ピザを比べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: 'どちらが得か\n比で判断しよう', t: 4.0 }, FG('g1')],
      draw: [g1(pizzaM, pizzaL)] }),
    T('ピザは、同じ形で、大きさがちがうので、相似です。相似比は、直径の比で、20：30＝2：3です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '相似比', text: '20：30＝2：3', t: 3.5 }] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。MとLの、ピザの面積の比は、どれでしょう。', { ft: 'normal' }),
      [{ t: '2：3' }, { t: '4：9', ok: true }, { t: '8：27' }, { t: '3：2' }],
      { 0: [B('直径の比が2：3だから、面積の比も、2：3でしょ？', { fb: 'happy', up: true }), T('2：3は、長さの比です。面積比は、2乗して、4：9です。ピザの面積は、直径の、2乗に比例します。', sad)],
        ok: [T('正解！ 面積比は、2²：3²＝4：9です。Mを4とすると、Lは9です。', { ft: 'happy' }), B('Lは、Mの、2倍と少し、あるんだね！', { fb: 'star', up: true })],
        wrong: [T('8：27は、体積の比です。ピザの面積比は、2乗の、4：9です。3：2は、順番が逆です。', { ft: 'normal' })] }),
    T('Lの面積は、Mの、9÷4＝2.25倍です。値段は、2400÷1000＝2.4倍です。どちらが、大きく増えているでしょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'M→L', text: '面積　2.25倍\n値段　2.4倍', t: 4.5 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。1平方センチメートルあたりの値段が、安いのは、どちらでしょう。', { ft: 'normal' }),
      [{ t: 'Mのほうが安い', ok: true }, { t: 'Lのほうが安い' }, { t: 'どちらも同じ' }, { t: '決められない' }],
      { 1: [B('Lは、大きいから、面積が、たっぷり増えるよね？ Lが、お得だよ！', { fb: 'happy', up: true }), T('面積は2.25倍ですが、値段は、2.4倍です。値段の増え方のほうが、大きいので、Lのほうが、割高です。', sad)],
        ok: [T('正解！ 面積は2.25倍、値段は2.4倍です。値段の増え方が大きいので、Mのほうが、安くなります。', { ft: 'happy' }), B('大きいほうが、得とは、限らないんだね！', { fb: 'surprised', up: true })],
        wrong: [T('面積の比は、2.25倍、値段の比は、2.4倍で、同じではありません。比べれば、決められます。', { ft: 'normal' })] }),
    T('では、Lの値段が、いくらなら、Mと、同じ割合になるでしょう。Mの値段を、面積比にあわせて、計算します。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '同じ割合', text: '1000×9÷4＝？', t: 4.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。Lの値段が、いくらなら、1平方センチメートルあたりの値段が、Mと同じになるでしょう。', { ft: 'normal' }),
      [{ t: '3000円' }, { t: '2400円' }, { t: '2250円', ok: true }, { t: '1500円' }],
      { 3: [B('直径が1.5倍だから、値段も、1.5倍の、1500円でしょ？', { fb: 'happy', up: true }), T('1.5倍は、長さの倍率です。面積は、1.5²＝2.25倍だから、値段も、1000×2.25＝2250円です。', sad)],
        ok: [T('正解！ 面積は2.25倍なので、1000×2.25＝2250円です。2400円は、これより高いので、割高です。', { ft: 'happy' }), B('面積の倍率で、値段を考えるんだね！', { fb: 'star', up: true })],
        wrong: [T('2400円は、今のLの値段です。同じ割合になるのは、1000×9÷4＝2250円のときです。', { ft: 'normal' })] }),

    T('次は、缶ジュースです。小さい缶は、高さ10cmで200円、大きい缶は、高さ15cmで600円です。2つは、相似な形です。', { clear: true, cols: [0.34, 0.66], part: '缶ジュースを比べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '小　高さ10cm　200円\n大　高さ15cm　600円\n相似な缶', t: 5.0 }, FG('g2')],
      draw: [g2(cansS, cansL)] }),
    T('ジュースの量は、体積です。相似比は、10：15＝2：3です。体積比は、3乗して、8：27です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '体積比', text: '2³：3³＝8：27\n27÷8＝3.375倍', t: 5.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。1mLあたりの値段が、安いのは、どちらの缶でしょう。', { ft: 'normal' }),
      [{ t: 'どちらも同じ' }, { t: '決められない' }, { t: '小さい缶が得' }, { t: '大きい缶が得', ok: true }],
      { 2: [B('高さが1.5倍で、値段が3倍だから、大きい缶は、割高だよ！', { fb: 'happy', up: true }), T('缶は、たて、横、高さが、全部1.5倍です。体積は、1.5³＝3.375倍になります。値段の3倍より、大きいので、大きい缶が、お得です。', sad)],
        ok: [T('正解！ 量は3.375倍、値段は3倍です。量の増え方が大きいので、大きい缶が、お得です。', { ft: 'happy' }), B('今度は、大きいほうが、お得なんだね！', { fb: 'star', up: true })],
        wrong: [T('量は3.375倍、値段は3倍で、同じではありません。量の増え方のほうが、大きいので、決められます。', { ft: 'normal' })] }),

    T('最後は、お菓子の箱です。1辺5cmの立方体の箱と、1辺10cmの立方体の箱が、あります。包み紙は、箱の、表面積ぶん、必要です。', { clear: true, cols: [0.34, 0.66], part: '包み紙を比べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '1辺5cmと1辺10cmの\n立方体の箱\n包み紙は表面積ぶん', t: 5.0 }, FG('g3')],
      draw: [g3(boxA, boxB)] }),
    T('相似比は、5：10＝1：2です。表面積比は、1：4。体積比は、1：8です。中身は、体積です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '包み紙　4倍\n中身　　8倍', t: 4.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。中身1立方センチメートルあたりの、包み紙の量は、大きい箱では、小さい箱の何倍でしょう。', { ft: 'happy' }),
      [{ t: '2倍になる' }, { t: '変わらない' }, { t: '半分になる', ok: true }, { t: '4分の1になる' }],
      { 1: [B('どっちも、同じ形の箱だから、中身あたりの包み紙も、同じでしょ？', { fb: 'happy', up: true }), T('形は同じでも、大きさがちがいます。包み紙は4倍、中身は8倍。中身あたりでは、4÷8＝半分です。', sad)],
        ok: [T('正解！ 包み紙は4倍、中身は8倍です。中身あたりの包み紙は、4÷8＝[[1/2]]、半分になります。', { ft: 'happy' }), B('大きい箱のほうが、包み紙が、もったいなくないんだね！', { fb: 'surprised', up: true })],
        wrong: [T('包み紙は、面積だから4倍、中身は、体積だから8倍です。4÷8＝[[1/2]]で、半分です。', { ft: 'normal' })] }),

    T('どちらが得かは、面積や体積の比と、値段の比を、比べて、判断します。面積は、2乗。体積は、3乗で、増えます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '面積比 m²：n²\n体積比 m³：n³\n値段の比と比べる', t: 6.0 }] }),
    B('ぼく、どっちが得か、計算してから、食べるよ！ でも、おなかが空くと、計算が、できないんだ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
