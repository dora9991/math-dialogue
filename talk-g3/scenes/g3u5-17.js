/* 中3 5章 相似な図形　第17時（例）「体積比を使って、体積を求めよう」。自作。体積比の計算。
   例1：円錐 底面の半径6cm・高さ9cm（V＝1/3×π×6²×9＝108π）を、頂点から3cmの所で底面に平行に切る → 小円錐は相似比3：9＝1：3、体積比1：27 → 108π÷27＝4π cm³、円錐台＝108π−4π＝104π cm³。
   例2：円錐形のコップ（容積270mL）に深さの2/3まで水 → 相似比2：3、体積比8：27 → 270×8÷27＝80mL。
   例3（逆）：相似な2つの立体の体積24cm³と81cm³ → 体積比8：27 → 相似比2：3 → 表面積比4：9 → 大きいほうの表面積が135cm²なら 135×4÷9＝60cm²。
   図：円錐は 1cm＝0.4（半径2.4，高さ3.6，だ円のたて半径＝0.3r、接線を計算）。コップは 半径1.8・深さ3.6、水面は 2/3。例3は相似比2：3の直方体（斜投影）。
   Q1 4π／Q2 104π／Q3 80mL／Q4 2：3／Q5 60cm²。 */
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
  // ---- 図の座標：円錐（だ円のたて半径 e＝0.3r。頂点から底面のだ円への接線を計算）----
  const D2R = Math.PI / 180;
  const arcPts = (c, rx, ry, a1, a2, n) => Array.from({ length: n + 1 }, (_, i) => { const t = (a1 + (a2 - a1) * i / n) * D2R; return [c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t)]; });
  // 頂点を上にした円錐：底面の中心 c、半径 r、高さ h。lam＝頂点からの割合（切る位置）
  const upCone = (c, r, h, lam, col) => {
    const e = 0.3 * r, apex = [c[0], c[1] + h], tR = Math.asin(e / h) / D2R;
    const sect = (l) => { const c2 = lerp(apex, c, l); return { c: c2, r: r * l, e: e * l }; };
    const front = (s, n) => arcPts(s.c, s.r, s.e, 180 - tR, 360 + tR, n || 40), back = (s) => arcPts(s.c, s.r, s.e, tR, 180 - tR, 30);
    const big = sect(1), cut = sect(lam);
    return { apex, tR, big, cut,
      body: [PL(front(big), col), PL(back(big), col, { dash: true }), LN(apex, front(big)[0], col), LN(apex, front(big)[40], col)],
      cutLine: [PL(front(cut), 'p', { wd: 4 }), PL(back(cut), 'p', { wd: 3, dash: true })],
      fillSmall: PG([apex, ...front(cut)], 'y', { fill: 'y', alpha: 0.26, wd: 2 }),
      fillFrustum: PG([...front(big), ...front(cut).reverse()], 'p', { fill: 'p', alpha: 0.16, wd: 2 }) };
  };
  // 頂点を下にした円錐（コップ）：頂点 a、半径 r、深さ h。水の深さの割合 lam
  const downCone = (a, r, h, lam, col) => {
    const e = 0.3 * r, c = [a[0], a[1] + h], tR = Math.asin(e / h) / D2R;
    const rim = arcPts(c, r, e, 0, 360, 60), cw = lerp(a, c, lam), rw = r * lam, ew = e * lam;
    const surf = arcPts(cw, rw, ew, 0, 360, 60);
    const pL = [c[0] - r * Math.sqrt(1 - (e / h) ** 2), c[1] - e * e / h], pR = [c[0] + r * Math.sqrt(1 - (e / h) ** 2), c[1] - e * e / h];
    return { c, cw, rim, surf,
      body: [PG(rim, col), LN(a, pL, col), LN(a, pR, col)],
      water: [PG([a, lerp(a, pL, lam), ...arcPts(cw, rw, ew, 180 + tR, -tR, 40), lerp(a, pR, lam)], 'b', { fill: 'b', alpha: 0.28, wd: 2 }), PG(surf, 'b', { wd: 3.4 })] };
  };
  // 1ページ目：r＝6cm、h＝9cm（1cm＝0.4）、頂点から3cmの所で切る
  const U1 = 0.4, c1 = [3.2, 0.9], cone1 = upCone(c1, 6 * U1, 9 * U1, 1 / 3, 'w');
  const cone1Lab = [LN(cone1.apex, c1, 'b', { wd: 3, dash: true }), LN(c1, [c1[0] + 6 * U1, c1[1]], 'y', { wd: 3.4 }), { k: 'pts', list: [cone1.apex], c: 'y', r: 5.5 },
    TX([5.9, 3.7], '底面の半径　6cm', 'y', 30, 'start'), TX([5.9, 3.1], '高さ　9cm', 'b', 30, 'start')];
  const cone1Cut = [TX([5.9, 2.4], '頂点から3cmの所で切る', 'p', 30, 'start'), LN(cone1.apex, cone1.cut.c, 'p', { wd: 3, dash: true })];
  // 2ページ目：コップ（頂点を下に。深さ 3.6、半径 1.8、水面は 2/3）
  const cupA = [3.0, 0.7], cup = downCone(cupA, 1.8, 3.6, 2 / 3, 'w');
  const cupLab = [TX([6.2, 4.3], 'コップの容積　270mL', 'y', 30, 'start'), TX([6.2, 3.6], '水の深さ　コップの深さの 2/3', 'b', 30, 'start')];
  // 3ページ目：相似比2：3の直方体（斜投影。1cm＝0.48）
  const sc3 = 0.48, pjA = prj([1.4, 0.9], sc3), pjB = prj([5.2, 0.9], sc3);
  const bxA = [boxFaces(pjA, 2 * 1.2, 3 * 1.2, 4 * 1.2, 'y', 0.16), boxEdges(pjA, 2 * 1.2, 3 * 1.2, 4 * 1.2, 'y'), TX([2.3, 0.45], '体積　24cm³', 'y', 28)];
  const bxB = [boxFaces(pjB, 3 * 1.2, 4.5 * 1.2, 6 * 1.2, 'p', 0.14), boxEdges(pjB, 3 * 1.2, 4.5 * 1.2, 6 * 1.2, 'p'), TX([6.5, 0.45], '体積　81cm³', 'p', 28)];
  const g1 = GF('g1'), g2 = GF('g2'), g3 = GF('g3');

  KL.lesson({ id: 'g3u5-17', unit: '中3　相似な図形', kick: '3年5章　第17時', title: '体積比を使って、体積を求めよう', card: '体積比を使って、体積を求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、体積比を使って、いろいろな立体の、体積を求めます。', { title: true, point: false, ft: 'happy' }),
    B('ソフトクリームのコーンに、半分の高さまで、アイスを入れたら、量も、半分でしょ？ 半分でも、うれしいけど！', { title: true, fb: 'happy', up: true }),
    T('ふふ。本当に、半分でしょうか。体積比を使って、確かめてみましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('円錐を、底面に平行な平面で、切ります。もとの円錐は、底面の半径が6cm、高さが9cmです。体積は、108π立方センチメートルです。', { part: '円錐を切ろう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '体積比を使って\n体積を求めよう', t: 4.0 }, { col: 0, type: 'text', size: 'xs', label: 'もとの円錐', text: 'V＝1/3×π×6²×9\n　＝108π cm³', t: 5.0 }, FG('g1')],
      draw: [g1(cone1.body, cone1Lab)] }),
    T('頂点から3cmの所で、切ります。上にできた、小さな円錐は、もとの円錐と、相似です。', { ft: 'normal', point: false,
      draw: [g1(cone1.cutLine, cone1.fillSmall, cone1Cut)] }),
    T('小さな円錐の高さは3cm、もとの円錐の高さは9cmです。相似比は、3：9＝1：3です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '相似比　3：9＝1：3', t: 3.5 }] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。上の、小さな円錐の体積は、何立方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '54π cm³' }, { t: '36π cm³' }, { t: '12π cm³' }, { t: '4π cm³', ok: true }],
      { 2: [B('相似比が1：3だから、体積比は、1：9じゃない？', { fb: 'happy', up: true }), T('1：9は、面積比です。体積比は、3乗して、1：27です。108π÷27＝4πです。', sad)],
        1: [T('36πは、108πを、3でわった値です。3は、長さの比です。体積比は、3乗の、1：27です。', { ft: 'normal' })],
        ok: [T('正解！ 体積比は、1³：3³＝1：27です。108π÷27＝4π立方センチメートルです。', { ft: 'happy' }), B('27個に分けた、1個分なんだね！', { fb: 'star', up: true })],
        wrong: [T('54πは、半分の値です。体積比は、1：27です。108π÷27＝4πです。', { ft: 'normal' })] }),
    T('体積比は、1：27です。もとの円錐を、27個に分けた、1個分が、小さな円錐です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '体積比　1³：3³＝1：27\n108π÷27＝{{4π}}', t: 4.5 }] }),
    T('では、切り取った残りの部分、円錐台の体積を、求めましょう。', { ft: 'normal', point: false,
      draw: [g1(cone1.fillFrustum)] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。円錐台の体積は、何立方センチメートルでしょう。', { ft: 'normal' }),
      [{ t: '72π cm³' }, { t: '96π cm³' }, { t: '104π cm³', ok: true }, { t: '108π cm³' }],
      { 1: [B('小さい円錐は、体積比1：9で、12πだから、108π−12π＝96πでしょ？', { fb: 'happy', up: true }), T('12πは、面積比で出した値です。小さい円錐は、4π。108π−4π＝104πです。', sad)],
        ok: [T('正解！ 円錐台は、もとの円錐から、小さな円錐を、ひいた残りです。108π−4π＝104πです。', { ft: 'happy' }), B('27個のうち、26個分なんだね！', { fb: 'star', up: true })],
        wrong: [T('108πは、もとの円錐、72πは、その3分の2です。ひくのは、小さな円錐の、4πだけです。', { ft: 'normal' })] }),

    T('次は、円錐形の、コップです。コップの容積は、270ミリリットルです。深さの、[[2/3]]まで、水を入れます。', { clear: true, cols: [0.34, 0.66], part: 'コップの水', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '容積　270mL\n水の深さ　2/3\n水の量は？', t: 5.0 }, FG('g2')],
      draw: [g2(cup.body, cupLab)] }),
    T('水の部分も、コップと、相似な円錐です。相似比は、水の深さ：コップの深さ＝2：3です。', { ft: 'normal', point: false,
      draw: [g2(cup.water)] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。入っている水は、何ミリリットルでしょう。', { ft: 'normal' }),
      [{ t: '240mL' }, { t: '180mL' }, { t: '120mL' }, { t: '80mL', ok: true }],
      { 1: [B('深さが[[2/3]]だから、水も、270の[[2/3]]で、180mLでしょ？', { fb: 'happy', up: true }), T('2：3は、長さの比です。体積比は、3乗して、8：27です。270×8÷27＝80です。', sad)],
        2: [T('120は、面積比の、4：9を使った値です。体積には、3乗の、8：27を使います。', { ft: 'normal' })],
        ok: [T('正解！ 体積比は、2³：3³＝8：27。270×8÷27＝80ミリリットルです。', { ft: 'happy' }), B('深さが3分の2でも、水は、3分の1より少ないんだね！', { fb: 'surprised', up: true })],
        wrong: [T('240mLは、ほとんど満タンです。深さが3分の2でも、体積比は、8：27です。80mLです。', { ft: 'normal' })] }),
    T('水は80ミリリットルで、コップの、27分の8です。深さの半分なら、体積は、8分の1です。コーンのアイスと、同じですね。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '水の量', text: '2³：3³＝8：27\n270×8÷27＝{{80}}mL', t: 5.0 }] }),

    T('次は、逆です。相似な2つの立体の、体積が、24立方センチメートルと、81立方センチメートルです。相似比を、求めましょう。', { clear: true, cols: [0.34, 0.66], part: '体積比から相似比', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '体積　24cm³と81cm³\n相似比は？', t: 4.5 }, FG('g3')],
      draw: [g3(bxA, bxB)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。この2つの立体の、相似比は、どれでしょう。', { ft: 'normal' }),
      [{ t: '2：3', ok: true }, { t: '1：3' }, { t: '8：27' }, { t: '24：81' }],
      { 3: [B('体積が24と81だから、相似比も、24：81でしょ？', { fb: 'happy', up: true }), T('24：81は、体積比そのものです。約分すると、8：27。3乗する前の、長さの比が、相似比です。', sad)],
        2: [T('8：27は、体積比です。3乗して8と27になる比が、相似比で、2：3です。', { ft: 'normal' })],
        ok: [T('正解！ 体積比は、24：81＝8：27。2³＝8、3³＝27だから、相似比は、2：3です。', { ft: 'happy' }), B('3乗の逆で、もとに戻すんだね！', { fb: 'star', up: true })],
        wrong: [T('1：3では、体積比が、1：27になってしまいます。8：27になる相似比は、2：3です。', { ft: 'normal' })] }),
    T('相似比が、2：3なら、表面積比は、2²：3²＝4：9です。大きいほうの表面積が、135平方センチメートルなら、小さいほうは、いくつでしょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', text: '体積比　8：27\n相似比　2：3\n表面積比　4：9', t: 5.0 }] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('最後の問題です。小さいほうの、表面積は、何平方センチメートルでしょう。', { ft: 'happy' }),
      [{ t: '40cm²' }, { t: '60cm²', ok: true }, { t: '90cm²' }, { t: '120cm²' }],
      { 2: [B('相似比が2：3だから、135の[[2/3]]で、90平方センチメートルでしょ？', { fb: 'happy', up: true }), T('2：3は、長さの比です。表面積は、2乗の、4：9を使います。135×4÷9＝60です。', sad)],
        0: [T('40平方センチメートルは、体積比の、8：27を使った値です。表面積は、2乗の比で、4：9です。', { ft: 'normal' })],
        ok: [T('正解！ 表面積比は、4：9です。135×4÷9＝60平方センチメートルです。', { ft: 'happy' }), B('体積比から、相似比、そして、表面積比なんだね！', { fb: 'star', up: true })],
        wrong: [T('120平方センチメートルは、135×8÷9の値で、8：9を使っています。表面積比は、2乗の、4：9です。135×4÷9＝60です。', { ft: 'normal' })] }),
    T('体積比は3乗、表面積比は2乗です。どちらも、まず相似比を出して、それから、2乗や3乗を、考えます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'まとめ', text: '相似比 m：n\n面積比 m²：n²\n体積比 m³：n³', t: 5.5 }] }),
    B('コーンの半分の高さのアイスは、8分の1だけ！ ぼく、ちょっと、ショックだよ！', { fb: 'sad', up: true, fx: { b: 'sweat' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
