/* 中3 5章 相似な図形　第15時（例）「面積比を使って、面積を求めよう」。自作。面積比の計算。
   例1：△ABC∽△DEF、相似比2：3、△ABC＝20cm² → 面積比4：9 → △DEF＝20×9÷4＝45cm²。
   例2：△ABC で DE∥BC、AD：DB＝2：3、△ABC＝50cm² → AD：AB＝2：5 → △ADE：△ABC＝4：25 → △ADE＝50×4÷25＝8cm²、台形DBCE＝50−8＝42cm²（4：21 でも 50×21÷25＝42）。
   例3（逆）：相似な2つの三角形の面積が18cm²と50cm² → 面積比9：25 → 相似比3：5（対応する辺 6cm なら 10cm）。
   例4：縮尺1：5000の地図で 3cm² → 1cm＝50m、1cm²＝2500m² → 7500m²。
   図：例1は相似比2：3（1cm＝0.533）、例2は D＝A から B へ 0.4、例3は底辺6cm・高さ6cmと底辺10cm・高さ10cm（1cm＝0.38）。
   Q1 45cm²／Q2 8cm²／Q3 42cm²／Q4 3：5／Q5 7500m²。 */
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
  // 1ページ目：△ABC∽△DEF（相似比2：3）。1cm＝0.5333。底辺 BC＝6cm（3.2），EF＝9cm（4.8）
  const k1 = 0.5333333, tB = [0.9, 1.1], tC = [0.9 + 6 * k1, 1.1], tA = [0.9 + 2 * k1, 1.1 + 4 * k1];
  const tE = [5.3, 1.1], tF = [5.3 + 9 * k1, 1.1], tD = [5.3 + 3 * k1, 1.1 + 6 * k1];
  const tri1S = [PG([tA, tB, tC], 'y', { fill: 'y', alpha: 0.14 }), DT(tA, 'A', [0, 1], 'y'), DT(tB, 'B', [-0.7, -0.7], 'y'), DT(tC, 'C', [0.7, -0.7], 'y'), TX([mid(tB, tC)[0], 0.55], '6cm', 'y', 26), TX([mid(tB, tC)[0] + 0.1, 1.1 + 1.4 * k1], '20cm²', 'y', 28)];
  const tri1L = [PG([tD, tE, tF], 'p', { fill: 'p', alpha: 0.14 }), DT(tD, 'D', [0, 1], 'p'), DT(tE, 'E', [-0.7, -0.7], 'p'), DT(tF, 'F', [0.7, -0.7], 'p'), TX([mid(tE, tF)[0], 0.55], '9cm', 'p', 26), TX([mid(tE, tF)[0] + 0.1, 1.1 + 2.2 * k1], '？', 'p', 40)];
  // 2ページ目：△ABC で DE∥BC、AD：DB＝2：3
  const uA = [5.4, 5.0], uB = [1.2, 0.9], uC = [9.6, 0.9];
  const uD = lerp(uA, uB, 0.4), uE = lerp(uA, uC, 0.4);
  const tri2 = [PG([uA, uB, uC], 'w'), DT(uA, 'A', [0, 1], 'y'), DT(uB, 'B', [-0.7, -0.7], 'y'), DT(uC, 'C', [0.7, -0.7], 'y'), DT(uD, 'D', [-0.9, 0.2], 'p', { r: 5.5 }), DT(uE, 'E', [0.9, 0.2], 'p', { r: 5.5 }), LN(uD, uE, 'p', { wd: 4 })];
  const lab2 = [TX(add2(mid(uA, uD), [-0.4, 0.05]), '2', 'g', 30, 'end'), TX(add2(mid(uD, uB), [-0.4, 0.0]), '3', 'g', 30, 'end'), TX([5.4, 0.45], '△ABC＝50cm²', 'y', 28), para(uD, uE, 'b', 1), para(uB, uC, 'b', 1)];
  const fillADE = PG([uA, uD, uE], 'y', { fill: 'y', alpha: 0.22, wd: 3 }), fillDBCE = PG([uD, uB, uC, uE], 'p', { fill: 'p', alpha: 0.16, wd: 3 });
  const area2 = [TX([5.4, 3.95], '△ADE', 'y', 28), TX([5.4, 1.9], '台形DBCE', 'p', 28)];
  // 3ページ目：面積が 18cm² と 50cm² の相似な三角形（底辺6cm・高さ6cm と 底辺10cm・高さ10cm。1cm＝0.38）
  const k3 = 0.38, vB = [1.2, 1.2], vC = [1.2 + 6 * k3, 1.2], vA = [1.2 + 2 * k3, 1.2 + 6 * k3];
  const vE = [5.2, 1.2], vF = [5.2 + 10 * k3, 1.2];
  const vD2 = [5.2 + 2 * k3 * 10 / 6, 1.2 + 10 * k3];
  const tri3S = [PG([vA, vB, vC], 'y', { fill: 'y', alpha: 0.14 }), DT(vA, 'A', [0, 1], 'y'), DT(vB, 'B', [-0.7, -0.7], 'y'), DT(vC, 'C', [0.7, -0.7], 'y'), TX([mid(vB, vC)[0] + 0.1, 1.2 + 1.3 * k3], '18cm²', 'y', 28)];
  const tri3L = [PG([vD2, vE, vF], 'p', { fill: 'p', alpha: 0.14 }), DT(vD2, 'D', [0, 1], 'p'), DT(vE, 'E', [-0.7, -0.7], 'p'), DT(vF, 'F', [0.7, -0.7], 'p'), TX([mid(vE, vF)[0] + 0.1, 1.2 + 2.2 * k3], '50cm²', 'p', 28)];
  const base3 = [TX([mid(vB, vC)[0], 0.65], '6cm', 'y', 26), TX([mid(vE, vF)[0], 0.65], '？', 'p', 34)];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3');

  KL.lesson({ id: 'g3u5-15', unit: '中3　相似な図形', kick: '3年5章　第15時', title: '面積比を使って、面積を求めよう', card: '面積比を使って、面積を求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、面積比を使って、いろいろな図形の、面積を求めます。', { title: true, point: false, ft: 'happy' }),
    B('ぼく、三角サンドイッチが好き！ 1辺が半分の、小さいサンドイッチは、半分の量でしょ？ 2つ食べれば、同じだよね！', { title: true, fb: 'happy', up: true }),
    T('ふふ。本当に、半分の量でしょうか。面積比で、きちんと計算してみましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('△ABCと△DEFは、相似で、相似比は2：3です。△ABCの面積は、20平方センチメートルです。△DEFの面積を、求めます。', { part: '面積比を使おう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '面積比を使って\n面積を求めよう', t: 4.0 }, { col: 0, type: 'text', size: 'xs', label: '相似比', text: '△ABC∽△DEF\n2：3', t: 3.5 }, FG('g1')],
      draw: [g1(tri1S, tri1L)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。△DEFの面積は、何平方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '30cm²' }, { t: '40cm²' }, { t: '45cm²', ok: true }, { t: '80cm²' }],
      { 0: [B('相似比が2：3だから、20の1.5倍で、30平方センチメートルだよ！', { fb: 'happy', up: true }), T('1.5倍は、長さの倍率です。面積の倍率は、2乗した、4：9を使います。', sad)],
        ok: [T('正解！ 面積比は、2²：3²＝4：9です。4：9＝20：xを解いて、x＝45平方センチメートルです。', { ft: 'happy' }), B('2乗してから、比例式にするんだね！', { fb: 'star', up: true })],
        wrong: [T('面積比は、4：9です。△ABCの4が20なので、1あたり5。△DEFは、9だから、45平方センチメートルです。', { ft: 'normal' })] }),
    T('△ABCが、面積比の4にあたり、20平方センチメートルです。1あたり、20÷4＝5平方センチメートル。△DEFは、9にあたるので、5×9＝45平方センチメートルです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '面積比', text: '2²：3²＝4：9\n4：9＝20：x\nx＝{{45}}cm²', t: 5.0 }] }),

    T('次は、三角形の中に、平行線がある場合です。△ABCで、DE∥BC、AD：DB＝2：3です。△ABCの面積は、50平方センチメートルです。', { clear: true, cols: [0.34, 0.66], part: '台形の面積', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'DE∥BC\nAD：DB＝2：3\n△ABC＝50cm²', t: 4.5 }, FG('g2')],
      draw: [g2(tri2, lab2)] }),
    T('DE∥BCだから、△ADE∽△ABCです。相似比は、AD：AB。ADとDBが2：3なので、AD：AB＝2：5です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '相似比', text: 'AD：AB＝2：5', t: 3.5 }],
      draw: [g2(fillADE)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。△ADEの面積は、何平方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '8cm²', ok: true }, { t: '18cm²' }, { t: '20cm²' }, { t: '40cm²' }],
      { 1: [T('18平方センチメートルは、DB：ABを2乗した、9：25を使った値です。△ADEは、AD：ABを2乗した、4：25です。', { ft: 'normal' })],
        2: [B('相似比が2：5だから、50の[[2/5]]で、20平方センチメートルでしょ？', { fb: 'happy', up: true }), T('2：5は、長さの比です。面積比は、2乗して、4：25です。50×4÷25＝8平方センチメートルです。', sad)],
        ok: [T('正解！ 面積比は、2²：5²＝4：25です。△ABCの25が50平方センチメートルだから、△ADEは、50×4÷25＝8平方センチメートルです。', { ft: 'happy' }), B('小さい三角形は、8平方センチメートルしかないんだね！', { fb: 'surprised', up: true })],
        wrong: [T('40平方センチメートルは、50の[[4/5]]です。面積比は、4：25だから、△ADEは、50×4÷25＝8平方センチメートルです。', { ft: 'normal' })] }),
    T('続いて、台形DBCEの面積を、求めます。台形は、△ABCから、△ADEを、ひいた部分です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '△ADE', text: '50×4÷25＝{{8}}cm²', t: 4.0 }],
      draw: [g2(fillDBCE, area2)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。台形DBCEの面積は、何平方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '8cm²' }, { t: '30cm²' }, { t: '32cm²' }, { t: '42cm²', ok: true }],
      { 0: [T('8平方センチメートルは、△ADEの面積です。台形は、△ABCから、△ADEをひいた、残りの部分です。', { ft: 'normal' })],
        1: [B('DBは3だから、50の[[3/5]]で、30平方センチメートルだよ！', { fb: 'happy', up: true }), T('3：5は、長さの比です。面積は、2乗の比で考えます。台形は、50−8＝42平方センチメートルです。', sad)],
        ok: [T('正解！ 50−8＝42平方センチメートルです。面積比で見ると、△ADE：台形：△ABC＝4：21：25です。', { ft: 'happy' }), B('全体から、小さい三角形を、ひけばいいんだね！', { fb: 'star', up: true })],
        wrong: [T('32平方センチメートルは、50−18です。ひくのは、△ADEの8平方センチメートルです。50−8＝42平方センチメートルです。', { ft: 'normal' })] }),

    T('次は、逆です。相似な2つの三角形の面積が、18平方センチメートルと、50平方センチメートルです。相似比を、求めます。', { clear: true, cols: [0.34, 0.66], part: '面積比から相似比', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '面積　18cm²と50cm²\n相似比は？', t: 4.5 }, FG('g3')],
      draw: [g3(tri3S, tri3L)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。この2つの三角形の、相似比は、どれでしょう。', { ft: 'normal' }),
      [{ t: '9：25' }, { t: '18：50' }, { t: '3：5', ok: true }, { t: '5：3' }],
      { 0: [B('面積が18と50だから、約分して、9：25でしょ？', { fb: 'happy', up: true }), T('9：25は、面積比です。相似比は、その、2乗の逆で、2乗して9と25になる、3：5です。', sad)],
        1: [T('18：50は、面積比そのものです。相似比は、2乗する前の、長さの比です。', { ft: 'normal' })],
        ok: [T('正解！ 面積比は、18：50＝9：25。3²＝9、5²＝25だから、相似比は、3：5です。', { ft: 'happy' }), B('面積比を、約分してから、元に戻すんだね！', { fb: 'star', up: true })],
        wrong: [T('5：3は、順番が逆です。小さいほうが先だから、3：5です。', { ft: 'normal' })] }),
    T('相似比は、3：5です。小さい三角形の底辺が、6cmなら、大きい三角形の底辺は、3：5＝6：xで、10cmです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '手順', text: '18：50＝9：25\n3²＝9　5²＝25\n相似比　3：5', t: 5.0 }],
      draw: [g3(base3)] }),

    T('最後は、地図の問題です。縮尺が、5000分の1の地図で、公園の面積が、3平方センチメートルです。実際の面積を、求めます。', { clear: true, cols: [0.34, 0.66], part: '地図の面積', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '縮尺 1：5000\n地図上の面積 3cm²\n実際の面積は？', t: 5.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。公園の実際の面積は、何平方メートルでしょう。', { ft: 'happy' }),
      [{ t: '1.5m²' }, { t: '7500m²', ok: true }, { t: '15000m²' }, { t: '750000m²' }],
      { 0: [B('5000倍だから、3×5000＝15000で、15000平方メートル！', { fb: 'happy', up: true }), T('5000倍は、長さの倍率です。面積は、5000の2乗倍になります。単位にも、気をつけましょう。', sad)],
        2: [T('15000は、5000倍にした数です。面積は、2乗倍です。また、平方センチメートルから、平方メートルに、直す必要があります。', { ft: 'normal' })],
        ok: [T('正解！ 1cmが50mだから、1平方センチメートルは、50×50＝2500平方メートル。3×2500＝7500平方メートルです。', { ft: 'happy' }), B('地図の1平方センチメートルが、2500平方メートルなんだね！', { fb: 'star', up: true })],
        wrong: [T('750000平方メートルは、単位の直しまちがいです。1平方センチメートルは、2500平方メートルだから、3×2500＝7500平方メートルです。', { ft: 'normal' })] }),
    T('長さの比が、m：nなら、面積比は、m²：n²です。面積比は、2乗の比です。長さの倍率を、2回かけます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '相似比 m：n\n面積比 m²：n²\n面積は2乗倍', t: 5.5 }] }),
    B('小さいサンドイッチは、半分の長さなら、量は、4分の1なんだね！ 4つ食べないと、足りないよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
