/* 中3 5章 相似な図形　第14時（探）「2倍に拡大すると、面積も2倍になるだろうか」。自作。相似な図形の面積比。
   正方形 1辺1cm→2cm：面積 1→4（4個分）、→3cm：9個分。三角形 △ABC（底辺4cm，高さ3cm，面積6cm²）と2倍の △DEF（底辺8cm，高さ6cm，面積24cm²）→ 面積比 1：4。
   一般に相似比 m：n → 面積比 m²：n²。相似比3：5 → 9：25。面積比 4：9 → 相似比 2：3。
   導入・結び：A4を2倍に拡大 → A2（面積4倍）。A3はA4の面積2倍＝長さ約1.4倍（√2倍）。
   図の座標：正方形は 1cm＝1.3、三角形は 1cm＝0.65 の目もりで計算（相似比どおり）。
   Q1 4個分／Q2 9倍／Q3 24cm²／Q4 9：25／Q5 2：3。 */
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
  // ---- 図の座標（1ページ目：正方形 1cm＝1.3、2ページ目：三角形 1cm＝0.65、3ページ目：正方形 1cm＝0.8）----
  const sq = (x0, y0, w, c, o) => PG([[x0, y0], [x0 + w, y0], [x0 + w, y0 + w], [x0, y0 + w]], c, o);
  const grid = (x0, y0, w, n, c) => { const out = []; for (let i = 1; i < n; i++) out.push(LN([x0 + w * i / n, y0], [x0 + w * i / n, y0 + w], c, { wd: 2 }), LN([x0, y0 + w * i / n], [x0 + w, y0 + w * i / n], c, { wd: 2 })); return out; };
  const u1 = 1.3, y1 = 1.0;
  const s1 = [sq(0.9, y1, u1, 'y', { fill: 'y', alpha: 0.18 }), TX([0.9 + u1 / 2, y1 - 0.4], '1cm', 'y', 28)];
  const s2 = [sq(3.3, y1, 2 * u1, 'p', { fill: 'p', alpha: 0.12 }), grid(3.3, y1, 2 * u1, 2, 'd'), TX([3.3 + u1, y1 - 0.4], '2cm', 'p', 28)];
  const s3 = [sq(7.0, y1, 3 * u1, 'b', { fill: 'b', alpha: 0.12 }), grid(7.0, y1, 3 * u1, 3, 'd'), TX([7.0 + 1.5 * u1, y1 - 0.4], '3cm', 'b', 28)];
  const k2 = 0.65;
  const tB = [0.8, 1.1], tC = [0.8 + 4 * k2, 1.1], tA = [0.8 + 1.5 * k2, 1.1 + 3 * k2], tH = [tA[0], 1.1];
  const tE = [4.8, 1.1], tF = [4.8 + 8 * k2, 1.1], tD = [4.8 + 3 * k2, 1.1 + 6 * k2], tH2 = [tD[0], 1.1];
  const triS = [PG([tA, tB, tC], 'y', { fill: 'y', alpha: 0.12 }), DT(tA, 'A', [0, 1], 'y'), DT(tB, 'B', [-0.7, -0.7], 'y'), DT(tC, 'C', [0.7, -0.7], 'y'),
    LN(tA, tH, 'b', { wd: 3, dash: true }), RT(tH, [1, 0], [0, 1], 14), TX([tH[0] + 0.12, 1.1 + 1.2 * k2], '3cm', 'b', 26, 'start'), TX([mid(tB, tC)[0], 0.55], '4cm', 'y', 26)];
  const triL = [PG([tD, tE, tF], 'p', { fill: 'p', alpha: 0.12 }), DT(tD, 'D', [0, 1], 'p'), DT(tE, 'E', [-0.7, -0.7], 'p'), DT(tF, 'F', [0.7, -0.7], 'p'),
    LN(tD, tH2, 'b', { wd: 3, dash: true }), RT(tH2, [1, 0], [0, 1], 14), TX([tH2[0] + 0.12, 1.1 + 3 * k2], '6cm', 'b', 26, 'start'), TX([mid(tE, tF)[0], 0.55], '8cm', 'p', 26)];
  const u3 = 0.8, y3 = 1.0;
  const q3 = [sq(1.2, y3, 3 * u3, 'y', { fill: 'y', alpha: 0.16 }), grid(1.2, y3, 3 * u3, 3, 'd'), TX([1.2 + 1.5 * u3, y3 - 0.4], '3', 'y', 28), TX([1.2 + 1.5 * u3, y3 + 3 * u3 + 0.4], '9個分', 'y', 28)];
  const q5 = [sq(5.4, y3, 5 * u3, 'p', { fill: 'p', alpha: 0.12 }), grid(5.4, y3, 5 * u3, 5, 'd'), TX([5.4 + 2.5 * u3, y3 - 0.4], '5', 'p', 28), TX([5.4 + 2.5 * u3, y3 + 5 * u3 + 0.4], '25個分', 'p', 28)];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3');

  KL.lesson({ id: 'g3u5-14', unit: '中3　相似な図形', kick: '3年5章　第14時', title: '2倍に拡大すると、面積も2倍になるだろうか', card: '2倍に拡大すると、面積も2倍になるだろうか', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、図形を拡大したとき、面積が、何倍になるのかを、探します。', { title: true, point: false, ft: 'happy' }),
    B('コピー機で、2倍に拡大したら、紙の大きさも、2倍でしょ？ A4を2倍に拡大したら、A3になるよね！', { title: true, fb: 'proud', up: true }),
    T('ふふ。本当にA3になるのでしょうか。拡大した図形の、面積を調べて、確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('まず、1辺が1cmの正方形を、2倍に拡大します。1辺は、2cmになります。', { part: '正方形で調べよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '拡大したとき\n面積は何倍になる？', t: 4.0 }, FG('g1')],
      draw: [g1(s1, s2)] }),
    T('面積を、比べます。1辺2cmの正方形に、1辺1cmの正方形が、何個ならぶか、数えましょう。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。1辺2cmの正方形は、1辺1cmの正方形の、何個分でしょう。', { ft: 'normal' }),
      [{ t: '2個分' }, { t: '3個分' }, { t: '4個分', ok: true }, { t: '8個分' }],
      { 0: [B('2倍に拡大したから、面積も、2倍の、2個分だよ！', { fb: 'happy', up: true }), T('図を見ましょう。たてに2列、横に2列で、2×2＝4個、ならびます。2倍になるのは、1辺の長さです。', sad)],
        1: [T('2＋1と、考えたのでしょうか。面積は、たて×横です。2×2＝4個です。', { ft: 'normal' })],
        ok: [T('正解！ たてに2個、横に2個で、2×2＝4個分です。面積は、4倍になりました。', { ft: 'happy' }), B('2倍に拡大して、4倍になるんだ！', { fb: 'surprised', up: true })],
        wrong: [T('8個では、多すぎます。たてに2列、横に2列で、2×2＝4個です。', { ft: 'normal' })] }),
    T('1平方センチメートルの正方形が、4平方センチメートルになりました。相似比が1：2のとき、面積比は、1：4です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '2倍', text: '相似比　1：2\n面積比　1：4', t: 4.0 }] }),
    T('次は、3倍です。1辺3cmの正方形には、1辺1cmの正方形が、たてに3列、横に3列、ならびます。', { ft: 'normal', point: false,
      draw: [g1(s3)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。相似比が1：3の、正方形の面積は、何倍になるでしょう。', { ft: 'normal' }),
      [{ t: '12倍' }, { t: '9倍', ok: true }, { t: '6倍' }, { t: '3倍' }],
      { 3: [B('3倍に拡大したから、面積も、3倍でしょ？', { fb: 'happy', up: true }), T('3倍になるのは、1辺の長さです。面積は、たて3列、横3列で、3×3＝9倍です。', sad)],
        ok: [T('正解！ たて3個、横3個で、3×3＝9個分です。面積比は、1：9です。', { ft: 'happy' }), B('長さが3倍だと、面積は9倍なんだね！', { fb: 'star', up: true })],
        wrong: [T('面積は、たてと横を、かけます。足したり、増やしすぎたりしません。3×3＝9倍です。', { ft: 'normal' })] }),
    T('1辺が2倍なら4倍、3倍なら9倍。1辺の長さの、2乗の倍率に、なっていますね。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '3倍', text: '相似比　1：3\n面積比　1：9', t: 4.0 }] }),

    T('正方形だけの、決まりでしょうか。三角形でも、調べます。△ABCは、底辺4cm、高さ3cmで、面積は、4×3÷2＝6平方センチメートルです。', { clear: true, cols: [0.34, 0.66], part: '三角形で調べよう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '△ABC', text: '底辺4cm　高さ3cm\n4×3÷2＝6cm²', t: 5.0 }, FG('g2')],
      draw: [g2(triS)] }),
    T('△DEFは、△ABCを、2倍に拡大した三角形です。底辺は8cm、高さは6cmです。面積を、求めましょう。', { ft: 'normal', point: false,
      draw: [g2(triL)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。△DEFの面積は、何平方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '6cm²' }, { t: '12cm²' }, { t: '18cm²' }, { t: '24cm²', ok: true }],
      { 0: [T('6平方センチメートルは、もとの△ABCの面積です。△DEFは、底辺8cm、高さ6cmで、面積は、8×6÷2です。', { ft: 'normal' })],
        1: [B('2倍に拡大したんだから、面積も、2倍の12平方センチメートルだよ！', { fb: 'happy', up: true }), T('底辺も、高さも、2倍です。面積は、8×6÷2＝24平方センチメートルで、6平方センチメートルの、4倍です。', sad)],
        ok: [T('正解！ 8×6÷2＝24平方センチメートルです。6平方センチメートルの、4倍になりました。', { ft: 'happy' }), B('三角形でも、4倍になるんだね！', { fb: 'star', up: true })],
        wrong: [T('18平方センチメートルは、3倍です。底辺も高さも2倍なので、面積は、2×2＝4倍の、24平方センチメートルです。', { ft: 'normal' })] }),
    T('底辺が2倍、高さも2倍だから、面積は、2×2＝4倍です。三角形でも、相似比1：2で、面積比は1：4です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '三角形でも', text: '底辺2倍×高さ2倍\n面積は4倍', t: 5.0 }] }),

    T('一般に、相似比がm：nの図形では、面積比は、m²：n²になります。長さの比を、2回かけるのです。', { clear: true, cols: [0.34, 0.66], part: 'きまりを見つけよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '面積比', text: '相似比 m：n\n面積比 m²：n²', t: 5.0 }, FG('g3')],
      draw: [g3(q3)] }),
    B('じゃあ、5倍に拡大したら、面積は、25倍？ 紙が大きすぎて、持てないよ！', { fb: 'surprised', up: true }),
    T('その通りです。正方形で、確かめましょう。1辺3cmの正方形と、1辺5cmの正方形の、面積を、比べます。', { ft: 'normal', point: false,
      draw: [g3(q5)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。相似比が3：5の、2つの三角形の、面積比は、どれでしょう。', { ft: 'normal' }),
      [{ t: '9：25', ok: true }, { t: '3：5' }, { t: '6：10' }, { t: '27：125' }],
      { 1: [B('相似比が3：5だから、面積比も、3：5じゃない？', { fb: 'happy', up: true }), T('3：5は、長さの比です。面積は、たてと横が、ともに変わるので、2乗して、9：25です。', sad)],
        ok: [T('正解！ 3²：5²＝9：25です。正方形で数えた、9個と25個とも、合っています。', { ft: 'happy' }), B('長さの比を、2回かけるんだね！', { fb: 'star', up: true })],
        wrong: [T('6：10は、3：5と同じ比です。27：125は、3乗した比です。面積比は、2乗の、9：25です。', { ft: 'normal' })] }),
    T('逆も、考えます。2つの相似な図形の、面積比が、4：9だったとします。相似比は、いくつでしょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '逆', text: '面積比　4：9\n相似比は？', t: 4.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。面積比が4：9のとき、相似比は、どれでしょう。', { ft: 'happy' }),
      [{ t: '1：2' }, { t: '2：3', ok: true }, { t: '4：9' }, { t: '16：81' }],
      { 2: [B('面積の比と、長さの比は、同じでしょ？', { fb: 'happy', up: true }), T('同じではありません。面積比は、相似比の2乗です。2乗して4と9になるのは、2と3です。', sad)],
        ok: [T('正解！ 2²＝4、3²＝9だから、相似比は、2：3です。', { ft: 'happy' }), B('2乗の逆だから、もとに戻すんだね！', { fb: 'star', up: true })],
        wrong: [T('16：81は、4：9を、さらに2乗した比です。2乗して、4：9になる比は、2：3です。', { ft: 'normal' })] }),
    T('最初の、コピー機の話です。A4を2倍に拡大すると、面積は4倍で、A2の大きさです。A3は、A4の面積の、2倍です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '相似比 m：n\n面積比 m²：n²', t: 5.0 }] }),
    B('なるほど！ A3にしたいなら、長さを、約1.4倍に拡大すれば、面積が2倍になるんだね！', { fb: 'star', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
