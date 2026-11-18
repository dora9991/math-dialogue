/* 中3 5章 相似な図形　第16時（探）「相似な立体の表面積と体積は、何倍になるだろう」。自作。相似な立体の表面積比・体積比。
   立方体 1辺1cm→2cm：表面積 6→24（4倍）、体積 1→8（8倍）。1辺3cm：27個分（表面積9倍）。直方体 横2・奥行1・高さ3（V＝6cm³，S＝2(2＋3＋6)＝22cm²）と2倍の 4・2・6（V＝48cm³，S＝2(8＋12＋24)＝88cm²）。
   一般に相似比 m：n → 表面積比 m²：n²、体積比 m³：n³。
   図：斜投影（x＋0.5·y·cos45°，z＋0.5·y·sin45°）の自作関数。見えない辺は dash。立方体 1cm＝1.0、直方体 1cm＝0.7 の目もり。
   Q1 4倍／Q2 8倍／Q3 27個分／Q4 48cm³／Q5 88cm²。 */
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
    .replace(/(?<=[0-9度A-Za-z）)π])−/g, 'ひく').replace(/−/g, 'マイナス').replace(/÷/g, 'わる').replace(/×/g, 'かける').replace(/＋/g, 'たす')
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
  // ---- 図の座標（斜投影）。1ページ目：立方体 1cm＝1.0、2ページ目：直方体 1cm＝0.7 ----
  const pj1 = prj([0.8, 1.0], 1.0), pj2 = prj([3.4, 1.0], 1.0), pj3 = prj([7.3, 1.0], 1.0);
  const cube1 = [boxFaces(pj1, 1, 1, 1, 'y', 0.2), boxEdges(pj1, 1, 1, 1, 'y'), TX(add2(pj1(0.5, 0, 0), [0, -0.4]), '1cm', 'y', 28)];
  const cube2 = [boxFaces(pj2, 2, 2, 2, 'p', 0.14), boxEdges(pj2, 2, 2, 2, 'p'), TX(add2(pj2(1, 0, 0), [0, -0.4]), '2cm', 'p', 28)];
  const grid2 = boxGrid(pj2, 2, 2, 2, 2, 2, 2, 'd');
  const cube3 = [boxFaces(pj3, 3, 3, 3, 'b', 0.12), boxEdges(pj3, 3, 3, 3, 'b'), TX(add2(pj3(1.5, 0, 0), [0, -0.4]), '3cm', 'b', 28)];
  const grid3 = boxGrid(pj3, 3, 3, 3, 3, 3, 3, 'd');
  const pjS = prj([1.0, 0.9], 0.7), pjL = prj([4.6, 0.9], 0.7);
  const boxS = [boxFaces(pjS, 2, 1, 3, 'y', 0.16), boxEdges(pjS, 2, 1, 3, 'y'), TX(add2(pjS(1, 0, 0), [0, -0.35]), '2cm', 'y', 26), TX(add2(pjS(0, 0, 1.5), [-0.12, 0]), '3cm', 'y', 26, 'end'), TX(add2(pjS(2, 0.5, 0), [0.3, -0.22]), '1cm', 'y', 26, 'start')];
  const boxL = [boxFaces(pjL, 4, 2, 6, 'p', 0.14), boxEdges(pjL, 4, 2, 6, 'p'), TX(add2(pjL(2, 0, 0), [0, -0.35]), '4cm', 'p', 26), TX(add2(pjL(0, 0, 3), [-0.12, 0]), '6cm', 'p', 26, 'end'), TX(add2(pjL(4, 1, 0), [0.3, -0.22]), '2cm', 'p', 26, 'start')];
  const g1 = GF('g1'), g2 = GF('g2');

  KL.lesson({ id: 'g3u5-16', unit: '中3　相似な図形', kick: '3年5章　第16時', title: '相似な立体の表面積と体積は、何倍になるだろう', card: '相似な立体の表面積と体積は、何倍になるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、相似な立体の、表面積と体積が、何倍になるのかを、探します。', { title: true, point: false, ft: 'happy' }),
    B('サイコロが、2倍の大きさなら、塗るペンキも、重さも、2倍でしょ？ 簡単だよ！', { title: true, fb: 'proud', up: true }),
    T('ふふ。本当に、2倍でしょうか。立方体の数を、数えて、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('まず、1辺が1cmの立方体を、2倍に拡大します。1辺が2cmの、立方体になります。', { part: '立方体で調べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '拡大すると\n表面積と体積は？', t: 4.0 }, FG('g1')],
      draw: [g1(cube1, cube2)] }),
    T('1辺1cmの立方体の、表面積は、1辺1cmの正方形が6つで、6平方センチメートルです。2倍の立方体の、表面積を、考えましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '表面積 1×1×6＝6cm²', t: 4.0 }] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。1辺2cmの立方体の、表面積は、1辺1cmの立方体の、何倍でしょう。', { ft: 'normal' }),
      [{ t: '2倍' }, { t: '4倍', ok: true }, { t: '6倍' }, { t: '8倍' }],
      { 0: [B('2倍に拡大したから、表面積も、2倍でしょ？', { fb: 'happy', up: true }), T('図を見ましょう。1つの面は、1辺2cmの正方形で、4平方センチメートル。それが6面で、24平方センチメートル。6の、4倍です。', sad)],
        ok: [T('正解！ 1つの面が、2×2＝4平方センチメートル。6面で、24平方センチメートルです。6の、4倍です。', { ft: 'happy' }), B('面が、4倍の大きさに、なるんだね！', { fb: 'star', up: true })],
        wrong: [T('1つの面は、1辺が2倍だから、面積が、2×2＝4倍になります。面の数は、6つのままです。表面積は、4倍です。', { ft: 'normal' })] }),
    T('表面積は、6平方センチメートルから、24平方センチメートルに、なりました。相似比が1：2のとき、表面積比は、1：4です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '相似比　1：2\n表面積比　1：4', t: 4.0 }] }),
    T('次は、体積です。2倍の立方体を、1辺1cmの、小さな立方体で、うめていきます。', { ft: 'normal', point: false,
      draw: [g1(grid2)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。1辺2cmの立方体の、体積は、1辺1cmの立方体の、何倍でしょう。', { ft: 'normal' }),
      [{ t: '2倍' }, { t: '4倍' }, { t: '6倍' }, { t: '8倍', ok: true }],
      { 1: [B('面積が4倍だったから、体積も、4倍でしょ？', { fb: 'happy', up: true }), T('4倍は、面積の倍率です。体積は、たて2個、横2個、高さ2段で、2×2×2＝8個です。', sad)],
        ok: [T('正解！ 底に、2×2＝4個。それが、2段あるので、4×2＝8個。体積は、8倍です。', { ft: 'happy' }), B('たても、横も、高さも、2倍になるからだね！', { fb: 'star', up: true })],
        wrong: [T('2倍や6倍では、立方体の数が、合いません。底に4個、その上に4個で、8個です。', { ft: 'normal' })] }),
    T('1辺が3cmの立方体なら、どうでしょう。底に、3×3＝9個。それが、3段で、27個です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '相似比　1：3\n表面積比　1：9\n体積比　　1：27', t: 5.0 }],
      draw: [g1(cube3, grid3)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。1辺3cmの立方体は、1辺1cmの立方体の、何個分でしょう。', { ft: 'normal' }),
      [{ t: '27個', ok: true }, { t: '18個' }, { t: '9個' }, { t: '3個' }],
      { 2: [B('底に、3×3で9個だから、9個分でしょ？', { fb: 'happy', up: true }), T('9個は、1段ぶんだけです。高さも3段あるので、9×3＝27個です。', sad)],
        ok: [T('正解！ 3×3×3＝27個分です。体積比は、1：27です。', { ft: 'happy' }), B('3倍に拡大して、27倍かあ！', { fb: 'surprised', up: true })],
        wrong: [T('3個分は、3倍の数、18個分は、9×2の数です。底の9個が、3段あるので、27個です。', { ft: 'normal' })] }),

    T('立方体だけの、決まりでしょうか。直方体でも、調べます。小さい直方体は、横2cm、奥行1cm、高さ3cmです。', { clear: true, cols: [0.34, 0.66], part: '直方体でも調べよう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '小さい直方体', text: '体積　2×1×3＝6cm³\n表面積　22cm²', t: 5.0 }, FG('g2')],
      draw: [g2(boxS)] }),
    T('大きい直方体は、それを、2倍に拡大した形です。横4cm、奥行2cm、高さ6cmです。', { ft: 'normal', point: false,
      draw: [g2(boxL)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。大きい直方体の、体積は、何立方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '12cm³' }, { t: '24cm³' }, { t: '48cm³', ok: true }, { t: '96cm³' }],
      { 0: [B('2倍に拡大したから、体積も、2倍で、12立方センチメートルだよ！', { fb: 'happy', up: true }), T('2倍になるのは、横、奥行、高さの、それぞれです。体積は、4×2×6＝48で、6の、8倍です。', sad)],
        1: [T('24立方センチメートルは、6の、4倍です。4倍は、面積の倍率です。体積は、4×2×6＝48です。', { ft: 'normal' })],
        ok: [T('正解！ 4×2×6＝48立方センチメートルです。6の、8倍になっています。', { ft: 'happy' }), B('立方体と、同じ8倍なんだね！', { fb: 'star', up: true })],
        wrong: [T('96立方センチメートルは、6の、16倍です。大きい直方体は、4×2×6＝48で、8倍です。', { ft: 'normal' })] }),
    T('次は、表面積です。小さい直方体の、表面積は、22平方センチメートルです。大きい直方体の、表面積を、求めましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '大きい直方体', text: '体積　4×2×6＝{{48}}cm³', t: 4.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('問題です。大きい直方体の、表面積は、何平方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '44cm²' }, { t: '88cm²', ok: true }, { t: '132cm²' }, { t: '176cm²' }],
      { 0: [B('2倍に拡大したから、表面積も、2倍でしょ？', { fb: 'happy', up: true }), T('2倍になるのは、辺の長さです。面の面積は、4倍になります。だから、表面積は、22の、4倍です。', sad)],
        ok: [T('正解！ 面の面積は、4×2＝8、2×6＝12、4×6＝24が、2つずつ。合計は、88平方センチメートルです。', { ft: 'happy' }), B('22の、ちょうど4倍だね！', { fb: 'star', up: true })],
        wrong: [T('132は6倍、176は8倍です。表面積は、面積の仲間だから、4倍で、22×4＝88です。', { ft: 'normal' })] }),

    T('表に、整理します。相似比が1：2のとき、表面積比は1：4、体積比は1：8。1：3のとき、1：9と、1：27です。', { clear: true, cols: [0.34, 0.66], part: 'きまりを見つけよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'きまり', text: '相似比 m：n\n表面積比 m²：n²\n体積比 m³：n³', t: 6.0 }, tbl([['相似比', '表面積比', '体積比'], ['1：2', '1：4', '1：8'], ['1：3', '1：9', '1：27'], ['m：n', 'm²：n²', 'm³：n³']], { col: 1, style: 'font-size:44px; align-self:center; margin-top:10px', t: 1.0 })] }),
    T('一般に、相似比がm：nの立体では、表面積の比は、m²：n²。体積の比は、m³：n³になります。面積は2乗、体積は3乗です。', { ft: 'normal', point: false }),
    B('ぼくの体が、2倍の大きさになったら、体重は、8倍！ ごはんも、8倍食べないと、足りないよ！', { fb: 'surprised', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
