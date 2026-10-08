/* 中3 5章 相似な図形　第13時（遊）「ノートの罫線だけで、線分を等分しよう」。自作。クイズ番組「罫線チャレンジ」（司会：ホー先生、挑戦者：ポンタ）。
   平行で間かくの等しい罫線は、線分を等しく分ける（平行線と線分の比：AP：PQ：QB＝1：1：1）。AB＝10cm を3等分：Aを罫線0に、Bを3本先の罫線に（すき間の数＝等分の数）。
   AB＝15cm を5等分：1つ分3cm、Aから2つ目の点まで 3×2＝6cm。AR：RB＝4：1 → 5等分の4つ目（1つ目 1：4、2つ目 2：3、3つ目 3：2、4つ目 4：1）。AP：PB＝7：3 → 10等分の7つ目。
   Q1 3本先（選択肢は大きい順）／Q2 理由＝罫線が平行で間かくが同じ／Q3 6cm／Q4 4つ目／Q5 7個目。図の点は線分を等分する点を lerp で計算。 */
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
  // ---- 図の座標：ノートの罫線（水平，間かく h）と、線分AB（Aは罫線0、Bは n 本先の罫線）----
  const rules = (n, y0, h, c) => Array.from({ length: n + 1 }, (_, k) => LN([0.4, y0 + h * k], [10.6, y0 + h * k], c || 'd', { wd: 2.4 }));
  const rnum = (n, y0, h) => Array.from({ length: n + 1 }, (_, k) => TX([11.2, y0 + h * k - 0.05], String(k), 'd', 24, 'end'));
  const pts = (A, B, n) => Array.from({ length: n + 1 }, (_, k) => lerp(A, B, k / n));
  // 1ページ目：3等分（罫線 6 本、間かく 0.8）
  const A1 = [1.8, 0.8], B1 = [7.6, 3.2], P1 = pts(A1, B1, 3);
  const ab1 = [LN(A1, B1, 'y', { wd: 4.6 }), DT(A1, 'A', [-0.9, -0.5], 'y'), DT(B1, 'B', [0.8, 0.7], 'y')];
  const pq1 = [DT(P1[1], 'P', [0.9, -0.7], 'p', { r: 5.5 }), DT(P1[2], 'Q', [0.9, -0.7], 'p', { r: 5.5 })];
  const eq1 = [tick(P1[0], P1[1], 'g', 1), tick(P1[1], P1[2], 'g', 1), tick(P1[2], P1[3], 'g', 1)];
  // 2ページ目：5等分（AB＝15cm、Bは5本先）
  const A2 = [1.0, 0.8], B2 = [9.0, 4.8], P2 = pts(A2, B2, 5);
  const ab2 = [LN(A2, B2, 'y', { wd: 4.6 }), DT(A2, 'A', [-0.9, -0.5], 'y'), DT(B2, 'B', [0.8, 0.7], 'y'), TX([3.6, 4.35], 'AB＝15cm', 'y', 30, 'middle')];
  const dots2 = [1, 2, 3, 4].map(k => ({ k: 'pts', list: [P2[k]], c: 'p', r: 5.5 })).concat([1, 2, 3, 4].map(k => TX(add2(P2[k], [0.38, -0.2]), String(k), 'p', 26)));
  const pP = DT(P2[2], 'P', [-0.9, 0.7], 'g', { r: 7 });
  const pR = DT(P2[4], 'R', [-0.9, 0.7], 'g', { r: 7 });
  // 3ページ目：10等分（罫線 11 本、間かく 0.4）
  const A3 = [1.0, 0.8], B3 = [10.0, 4.8], P3 = pts(A3, B3, 10);
  const ab3 = [LN(A3, B3, 'y', { wd: 4.4 }), DT(A3, 'A', [-0.9, -0.5], 'y'), DT(B3, 'B', [0.8, 0.7], 'y')];
  const dots3 = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(k => ({ k: 'pts', list: [P3[k]], c: 'p', r: 4.2 }));
  const pP3 = [DT(P3[7], 'P', [0.9, -0.8], 'g', { r: 7 }), TX(add2(P3[7], [-0.9, 0.5]), '7個目', 'g', 28, 'middle')];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3');

  KL.lesson({ id: 'g3u5-13', unit: '中3　相似な図形', kick: '3年5章　第13時', title: 'ノートの罫線だけで、線分を等分しよう', card: 'ノートの罫線だけで、線分を等分しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、クイズ番組、「罫線チャレンジ」です。ノートの罫線だけで、線分を等分します。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、挑戦者のポンタです！ 10cmの線を3等分なら、定規で、3.33cmくらいを、測ればいいよね？', { title: true, fb: 'proud', up: true }),
    T('ふふ。3.33cmぴったりは、定規では、むずかしいですね。罫線を使えば、ぴったり、等分できますよ。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('ラウンド1です。線分ABを、3等分します。ABは10cmです。10÷3は、割り切れませんね。', { part: 'ラウンド1　3等分', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '罫線だけで\n線分を等分しよう', t: 4.0 }, FG('g1')],
      draw: [g1(rules(5, 0.8, 0.8), rnum(5, 0.8, 0.8))] }),
    T('ABをかいた、うすい紙を、ノートに重ねます。Aは、罫線の上に、のせます。Bは、どの罫線に、のせればいいでしょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '線分AB', text: 'AB＝10cm\nAは罫線0にのせる', t: 4.0 }],
      draw: [g1(ab1[0], ab1[1])] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。Aがのっている罫線から、何本先の罫線に、Bをのせると、3等分できるでしょう。', { ft: 'normal' }),
      [{ t: '5本先' }, { t: '4本先' }, { t: '3本先', ok: true }, { t: '2本先' }],
      { 3: [B('Aの罫線も入れて、3本の罫線を使うから、Bは、2本先だよね？', { fb: 'happy', up: true }), T('Aの罫線も入れると、確かに、3本です。でも、その間の、すき間は、2つだけです。3等分には、すき間が、3つ必要です。', sad)],
        ok: [T('正解！ Aから3本先です。罫線の、すき間が3つできるので、ABが、3つに分かれます。', { ft: 'happy' }), B('すき間の数が、等分の数なんだね！', { fb: 'star', up: true })],
        wrong: [T('すき間の数が、等分の数になります。4本先なら4等分、5本先なら5等分に、なってしまいます。', { ft: 'normal' })] }),
    T('Bを、3本先の罫線に、のせました。ABと、間の2本の罫線が、交わる点を、P、Qとします。', { ft: 'normal', point: false,
      draw: [g1(ab1[2], pq1)] }),
    T('ABは、P、Qで、3つに分かれました。この3つは、本当に、等しい長さなのでしょうか。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', T('ボーナス問題です。AP、PQ、QBが、等しくなる理由は、どれでしょう。', { ft: 'normal' }),
      [{ t: '罫線が平行で、間かくが同じだから', ok: true }, { t: 'ABが、斜めにのっているから' }, { t: '罫線が、細いから' }, { t: 'たまたま、ぴったり合ったから' }],
      { 3: [B('運が良かったんだよ。ぼくの、日ごろの行いかな？', { fb: 'proud', up: true }), T('運では、ありません。罫線は、平行で、間かくが同じです。だから、どんなABでも、同じように、等分できます。', sad)],
        ok: [T('正解！ 平行線で切られた線分の比は、等しくなります。間かくが同じなので、比は、1：1：1です。', { ft: 'happy' }), B('平行線の性質が、使えるんだね！', { fb: 'star', up: true })],
        wrong: [T('斜めでも、細くても、関係ありません。罫線が、平行で、間かくが同じことが、理由です。', { ft: 'normal' })] }),
    T('間かくの、等しい平行線は、線分を、等しく分けます。AP、PQ、QBは、どれも、10÷3cmです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'ポイント', text: '平行で、間かくが同じ\n→ 線分を等しく分ける', t: 5.0 }],
      draw: [g1(eq1)] }),

    T('ラウンド2です。ABは15cmです。これを、5等分します。Bは、Aの罫線から、5本先にのせます。', { clear: true, cols: [0.34, 0.66], part: 'ラウンド2　5等分', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'AB＝15cm\n5等分する', t: 4.0 }, FG('g2')],
      draw: [g2(rules(5, 0.8, 0.8), rnum(5, 0.8, 0.8), ab2, dots2)] }),
    T('Aから、2つ目の点を、Pとします。Aから、Pまでの長さを、求めましょう。', { ft: 'normal', point: false,
      draw: [g2(pP)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。APは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '3cm' }, { t: '6cm', ok: true }, { t: '9cm' }, { t: '12cm' }],
      { 0: [B('15÷5＝3だから、APも、3cmでしょ？', { fb: 'happy', up: true }), T('3cmは、1つ分の長さです。Pは、2つ目の点だから、2つ分で、6cmです。', sad)],
        ok: [T('正解！ 1つ分は、15÷5＝3cm。Pは、2つ目の点だから、3×2＝6cmです。', { ft: 'happy' }), B('1つ分の長さを、まず出すんだね！', { fb: 'star', up: true })],
        wrong: [T('9cmは、3つ目の点まで、12cmは、4つ目の点までの長さです。Pは、2つ目だから、3×2＝6cmです。', { ft: 'normal' })] }),
    T('ラウンド3は、比です。ABの上に、点Rをとります。AR：RBが、4：1になる位置を、探しましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '比', text: 'AR：RB＝4：1', t: 4.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。AR：RBが、4：1になる点Rは、Aから何個目の点でしょう。', { ft: 'normal' }),
      [{ t: '1つ目' }, { t: '2つ目' }, { t: '3つ目' }, { t: '4つ目', ok: true }],
      { 0: [B('4：1の、1を使って、1つ目でしょ？', { fb: 'happy', up: true }), T('1つ目の点では、ARが1つ分、RBが4つ分で、1：4です。ARが4つ分になる点を、選びます。', sad)],
        ok: [T('正解！ ARが4つ分、RBが1つ分です。5等分の点で、Aから4つ目が、点Rです。', { ft: 'happy' }), B('合わせて、5つ分になるんだね！', { fb: 'star', up: true })],
        wrong: [T('2つ目では2：3、3つ目では3：2です。4：1になるのは、4つ目の点です。', { ft: 'normal' })] }),
    T('4：1に分けるには、4＋1＝5で、5等分します。そして、Aから4つ目の点を、選べばいいのです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '4＋1＝5　5等分\nAから4つ目の点', t: 4.0 }],
      draw: [g2(pR)] }),

    T('ファイナルです。ABを、7：3に分ける、点Pを探します。罫線の間かくが、せまいノートを使って、10等分します。', { clear: true, cols: [0.34, 0.66], part: 'ファイナル　7：3', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'AP：PB＝7：3', t: 4.0 }, FG('g3')],
      draw: [g3(rules(10, 0.8, 0.4, 'd'), ab3, dots3)] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。AP：PB＝7：3になる点Pは、Aから何個目の点でしょう。', { ft: 'happy' }),
      [{ t: '3個目' }, { t: '7個目', ok: true }, { t: '9個目' }, { t: '10個目' }],
      { 0: [B('7：3の、3を使って、3個目でしょ？', { fb: 'happy', up: true }), T('3個目の点では、APが3つ分、PBが7つ分で、3：7です。APが7つ分になる点を、選びます。', sad)],
        ok: [T('正解！ 7＋3＝10だから、10等分です。APが7つ分になる、Aから7個目の点です。', { ft: 'happy' }), B('ぴったり、7：3だ！', { fb: 'star', up: true })],
        wrong: [T('9個目では、9：1です。10個目は、点Bそのものです。7：3になるのは、7個目の点です。', { ft: 'normal' })] }),
    T('m：nに分けるときは、m＋n等分して、Aから、m個目の点を、選びます。罫線だけで、比も、作れます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '間かくが同じ罫線で\n線分を等分できる\nm：n に分けるときは\nm＋n 等分して\nm 個目の点', t: 7.0 }],
      draw: [g3(pP3)] }),
    B('ぼく、優勝だね！ これから、ノートを見るたびに、定規なしで、何でも分けたくなるよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('おめでとうございます。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
