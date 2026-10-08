/* 中3 5章 相似な図形　第11時（例）「中点連結定理を使って証明しよう」。自作。
   四角形ABCDの各辺の中点 E,F,G,H（AB,BC,CD,DA）→ 四角形EFGHは平行四辺形。対角線ACをひく：△ABCで EF∥AC, EF＝AC÷2、△ACDで HG∥AC, HG＝AC÷2 → EF∥HG, EF＝HG → 1組の対辺が平行で等しい。
   おまけ：EH∥FG∥BD, EH＝FG＝BD÷2。AC＝10cm, BD＝6cm → 周＝2×(5＋3)＝16cm。図の四角形は AC：BD＝5：3 になるように座標を計算。
   Q1 BC＝12→MN＝6／Q2 EF∥HGを示す補助線＝対角線AC（BDだとEH∥FG）／Q3 △ABC→EF∥AC,EF＝AC÷2／Q4 根拠＝1組の対辺が平行で等しい／Q5 周＝16cm。 */
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
  // ---- 図の座標（四角形ABCD。AC：BD＝5：3 になるように BD の長さを決める）----
  const qA = [1.0, 1.2], qC = [9.5, 3.0], qD = [3.6, 5.0];
  const ACl = Math.hypot(qC[0] - qA[0], qC[1] - qA[1]);
  const qB = add2(qD, mul2(dirv(qD, [6.6, 0.8]), ACl * 0.6));
  const E = mid(qA, qB), F = mid(qB, qC), G = mid(qC, qD), H = mid(qD, qA);
  const tA = [5.4, 4.9], tB = [2.0, 0.9], tC = [9.6, 0.9];
  const tM = mid(tA, tB), tN = mid(tA, tC);
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3'), g4 = GF('g4');
  // ---- 1ページ目：中点連結定理のふり返り ----
  const tri1 = [PG([tA, tB, tC], 'w'), DT(tA, 'A', [0, 1], 'y'), DT(tB, 'B', [-0.7, -0.7], 'y'), DT(tC, 'C', [0.7, -0.7], 'y')];
  const mn1 = [LN(tM, tN, 'p', { wd: 4.4 }), DT(tM, 'M', [-0.9, 0.3], 'p', { r: 5 }), DT(tN, 'N', [0.9, 0.3], 'p', { r: 5 }), tick(tA, tM, 'g', 1), tick(tM, tB, 'g', 1), tick(tA, tN, 'g', 2), tick(tN, tC, 'g', 2)];
  const mk1 = [para(tM, tN, 'b', 1), para(tB, tC, 'b', 1), TX([mid(tB, tC)[0], tB[1] - 0.5], '12cm', 'y', 28)];
  // ---- 2ページ目：四角形ABCDと中点 ----
  const quad = (c) => [PG([qA, qB, qC, qD], c || 'w'), DT(qA, 'A', [-0.7, -0.7], 'y'), DT(qB, 'B', [0.7, -0.7], 'y'), DT(qC, 'C', [0.7, 0.7], 'y'), DT(qD, 'D', [-0.7, 0.7], 'y')];
  const mids = [DT(E, 'E', [0.1, -1], 'p', { r: 5 }), DT(F, 'F', [1, -0.5], 'p', { r: 5 }), DT(G, 'G', [0.6, 1], 'p', { r: 5 }), DT(H, 'H', [-1, 0.3], 'p', { r: 5 })];
  const half = [tick(qA, E, 'g', 1), tick(E, qB, 'g', 1), tick(qB, F, 'g', 2), tick(F, qC, 'g', 2), tick(qC, G, 'g', 3), tick(G, qD, 'g', 3), tick(qD, H, 'g', 4), tick(H, qA, 'g', 4)];
  const efgh = PG([E, F, G, H], 'p', { fill: 'p', alpha: 0.12, wd: 3.6 });
  const diagAC = LN(qA, qC, 'b', { dash: true, wd: 3.2 });
  const hiEF = [LN(E, F, 'p', { wd: 5 }), LN(H, G, 'p', { wd: 5 })];
  const parEF = [para(E, F, 'b', 1), para(H, G, 'b', 1), para(qA, qC, 'b', 1)];
  const triABC = PG([qA, qB, qC], 'y', { fill: 'y', alpha: 0.12, wd: 2.6 }), triACD = PG([qA, qC, qD], 'b', { fill: 'b', alpha: 0.12, wd: 2.6 });
  // ---- 4ページ目：対角線の長さ ----
  const diagBD = LN(qB, qD, 'y', { dash: true, wd: 3.2 });
  const parBD = [para(qB, qD, 'y', 2), para(E, H, 'y', 2), para(F, G, 'y', 2)];
  const lenAC = TX([11.4, 5.3], 'AC＝10cm', 'b', 28, 'end'), lenBD = TX([11.4, 4.8], 'BD＝6cm', 'y', 28, 'end');

  KL.lesson({ id: 'g3u5-11', unit: '中3　相似な図形', kick: '3年5章　第11時', title: '中点連結定理を使って証明しよう', card: '中点連結定理を使って証明しよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、中点連結定理を使って、図形の性質を、証明します。', { title: true, point: false, ft: 'happy' }),
    B('ぼくの家の畑は、形がいびつなんだ。四方の辺の真ん中に杭を打って、ひもで結んだら、いびつな形になるよね？', { title: true, fb: 'happy', up: true }),
    T('ふふ。いびつな畑でも、ひもで結ぶと、ある形になります。それを、証明で確かめましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('まず、中点連結定理の、ふり返りです。三角形ABCで、辺ABとACの中点を、MとNとします。', { part: 'ふり返ろう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '中点連結定理を\n使って証明しよう', t: 4.0 }, FG('g1')],
      draw: [g1(tri1, mn1)] }),
    T('このとき、MNは、BCに平行で、長さは、BCの[[1/2]]です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '中点連結定理', text: 'MN∥BC\nMN＝1/2BC', t: 4.0 }],
      draw: [g1(mk1)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。BCが12cmのとき、MNの長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '3cm' }, { t: '6cm', ok: true }, { t: '12cm' }, { t: '24cm' }],
      { 0: [T('3cmは、BCの[[1/4]]です。MNは、BCの[[1/2]]だから、12÷2＝6cmです。', { ft: 'normal' })],
        2: [B('MとNが真ん中だから、MNもBCと、同じ長さでしょ？', { fb: 'happy', up: true }), T('MNは、BCと平行ですが、BCより短い線です。長さは、ちょうど半分で、6cmです。', sad)],
        ok: [T('正解！ MNは、BCの[[1/2]]だから、12÷2＝6cmです。', { ft: 'happy' }), B('ちょうど、半分になるんだね！', { fb: 'star', up: true })],
        wrong: [T('24cmは、BCの2倍です。MNは、BCより短く、半分の、6cmです。', { ft: 'normal' })] }),

    T('では、今日の問題です。四角形ABCDの、各辺の中点を、順に、E、F、G、Hとします。', { clear: true, cols: [0.34, 0.66], part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'b', size: 'xs', label: '仮定', text: 'E，F，G，H は\n各辺の中点', t: 3.5 }, FG('g2')],
      draw: [g2(quad(), mids, half)] }),
    T('四角形EFGHが、平行四辺形になることを、証明しましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '結論', text: 'EFGH は平行四辺形', t: 3.5 }],
      draw: [g2(efgh)] }),
    B('え、平行四辺形？ ABCDは、ぐにゃっとした、いびつな四角形だよ？ 信じられないな！', { fb: 'surprised', up: true }),
    T('いびつでも、大丈夫です。中点連結定理は、三角形の定理です。四角形を、三角形に分けましょう。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。辺EFと辺HGが、平行であることを、示したいとします。ひく補助線は、どれでしょう。', { ft: 'normal' }),
      [{ t: '線分EG' }, { t: '線分FH' }, { t: '対角線AC', ok: true }, { t: '対角線BD' }],
      { 3: [B('BDも対角線だよ。どっちでも、同じじゃない？', { fb: 'happy', up: true }), T('BDをひくと、EHとFGが、BDに平行だとわかります。EFとHGには、ACを使います。', sad)],
        ok: [T('正解！ 対角線ACをひくと、EFは△ABCの中に、HGは△ACDの中に、入ります。', { ft: 'happy' }), B('どっちも、三角形の中の線になるんだね！', { fb: 'star', up: true })],
        wrong: [T('EGやFHをひいても、中点が辺の上にある三角形は、できません。ACをひくと、できます。', { ft: 'normal' })] }),
    T('ACをひくと、四角形ABCDは、△ABCと△ACDに、分かれます。EFとHGは、それぞれ、その中の線です。', { ft: 'normal', point: false,
      draw: [g2(diagAC, hiEF, triABC, triACD)] }),

    T('では、証明を書きます。まず、△ABCで、中点連結定理を使います。', { clear: true, cols: [0.34, 0.66], part: '証明を書こう', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '証明', text: '対角線ACをひく。\n△ABC で　中点連結定理より', t: 4.5 }, FG('g3')],
      draw: [g3(quad(), mids, diagAC, triABC, hiEF[0])] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。EとFは、ABとBCの中点です。EFについて、いえることは、どれでしょう。', { ft: 'normal' }),
      [{ t: 'EF∥AB かつ EF＝AB÷2' }, { t: 'EF∥BC かつ EF＝BC÷2' }, { t: 'EF∥AC かつ EF＝AC' }, { t: 'EF∥AC かつ EF＝AC÷2', ok: true }],
      { 2: [B('平行なら、長さも、同じじゃない？', { fb: 'happy', up: true }), T('平行でも、長さは同じとは、限りません。中点連結定理では、長さは、ACの半分です。', sad)],
        ok: [T('正解！ 中点どうしを結ぶ線は、残りの辺と平行で、長さは、その半分です。', { ft: 'happy' }), B('三角形ABCの、真ん中の線だね！', { fb: 'star', up: true })],
        wrong: [T('EFは、ABとも、BCとも、交わります。平行なのは、残りの辺の、ACです。', { ft: 'normal' })] }),
    T('EFは、ACに平行で、長さは、ACの[[1/2]]です。これを、①とします。次は、△ACDです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'EF∥AC　EF＝1/2AC　…①\n△ACD で　中点連結定理より', t: 5.0 }],
      draw: [g3(parEF[2], hiEF[1], triACD)] }),
    T('HとGは、DAとCDの中点だから、HG∥AC、HG＝[[1/2]]ACです。これを、②とします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: 'HG∥AC　HG＝1/2AC　…②', t: 3.5 }],
      draw: [g3(parEF[0], parEF[1])] }),
    B('EFもHGも、ACと平行だね。じゃあ、EFとHGも、平行だ！ 長さも、どっちも半分だよ！', { fb: 'proud', up: true }),
    T('その通りです。①②より、EF∥HG、EF＝HGです。向かい合う1組の辺が、平行で、等しくなりました。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '①②より　EF∥HG　EF＝HG', t: 4.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。EF∥HG、EF＝HGから、四角形EFGHが、平行四辺形といえる、根拠は、どれでしょう。', { ft: 'normal' }),
      [{ t: '1組の対辺が、平行で等しい', ok: true }, { t: '2組の対辺が、それぞれ平行' }, { t: '2組の対角が、それぞれ等しい' }, { t: '対角線が、中点で交わる' }],
      { 2: [B('平行四辺形の対角は、等しいよね？ それを使うんでしょ？', { fb: 'happy', up: true }), T('それは、平行四辺形の性質です。今は、角については、何もわかっていません。', sad)],
        ok: [T('正解！ 1組の対辺が、平行で等しいから、平行四辺形といえます。', { ft: 'happy' }), B('平行と長さの、両方がそろったんだね！', { fb: 'star', up: true })],
        wrong: [T('平行がわかったのは、EFとHGの、1組だけです。対角線も、まだわかっていません。', { ft: 'normal' })] }),
    T('これで、証明の完成です。ひもで結んだ四角形EFGHは、必ず、平行四辺形になります。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '1組の対辺が平行で等しい\nから　四角形EFGHは平行四辺形', t: 5.0 }],
      draw: [g3(efgh)] }),

    T('おまけです。BDをひいても、同じです。EHとFGは、BDに平行で、長さは、BDの[[1/2]]です。', { clear: true, cols: [0.34, 0.66], part: '対角線の長さ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '辺の長さ', text: 'EF＝HG＝1/2AC\nEH＝FG＝1/2BD', t: 5.0 }, FG('g4')],
      draw: [g4(quad(), mids, efgh, diagAC, diagBD, parBD, parEF, lenAC, lenBD)] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('問題です。ACが10cm、BDが6cmのとき、平行四辺形EFGHの、周の長さは、何cmでしょう。', { ft: 'normal' }),
      [{ t: '5cm' }, { t: '8cm' }, { t: '16cm', ok: true }, { t: '32cm' }],
      { 0: [T('5cmは、EF1本ぶんの、長さです。周は、4つの辺を、合わせた長さです。', { ft: 'normal' })],
        1: [B('EFが5cm、EHが3cmだから、合わせて、8cmだよ！', { fb: 'happy', up: true }), T('8cmは、となり合う2辺の、和です。周は、向かい合う辺も入れて、その2倍です。', sad)],
        ok: [T('正解！ EF＝HG＝5cm、EH＝FG＝3cm。周は、5＋3＋5＋3＝16cmです。', { ft: 'happy' }), B('ACとBDを足した長さと、同じだね！', { fb: 'star', up: true })],
        wrong: [T('32cmは、ACとBDの和の2倍です。EFGHの周は、10＋6＝16cmです。', { ft: 'normal' })] }),
    T('ACとBDが、同じ長さのときは、EFとEHも、同じ長さになります。そのとき、EFGHは、ひし形です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '四角形の各辺の中点を\n結ぶと、平行四辺形', t: 5.0 }] }),
    B('ぼくの畑も、ひもで結べば、平行四辺形になるんだね！ 杭を、打ちに行ってくる！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
