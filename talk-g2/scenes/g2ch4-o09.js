/* 中2 4章 平行と合同　応用9「合同な図形の対応」。自作問題。
   △ABC（C＝90°、AB＝5cm、BC＝3cm、CA＝4cm）と、それを裏返して回した△DEF。印：BCとEFは1本線、CAとFDは2本線、ABとDEは3本線。
   A→D、B→E、C→F。Bに対応する頂点＝E、辺CAに対応する辺＝FD、△ABC≡△DEF、EF＝BC＝3cm。2ページ目：△GHI≡△JKL のとき ∠H＝∠K。
   誤答：位置で対応を決める／頂点の並び順をそろえない／長さの取りちがい（5cm・4cm）／同じ三角形の中の角を選ぶ。ポンタは「合同」を合同練習と思う。 */
(function () {
  const { T, B, Q, FIG, tbl } = KL;
  // ---- 図の小さな部品（この台本の中で定義。座標は数学の座標で、y が上） ----
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const dirOf = (V, P) => Math.atan2(P[1] - V[1], P[0] - V[0]) * R2D;
  const sweep = (V, P, Q) => { let a1 = dirOf(V, P), a2 = dirOf(V, Q); let d = ((a2 - a1) % 360 + 360) % 360; if (d > 180) { const t = a1; a1 = a2; a2 = t; d = 360 - d; } return [a1, a1 + d]; };
  const mark = (V, P, Q, r, c, o) => { const s = sweep(V, P, Q); return Object.assign({ k: 'ell', o: V, rx: r, ry: r, a1: s[0], a2: s[1], c, wd: 3.4, d: 0.3 }, o || {}); };
  const num = (V, P, Q, r, text, c, o) => { const s = sweep(V, P, Q), m = (s[0] + s[1]) / 2 * D2R; return Object.assign({ k: 'label', at: [V[0] + r * Math.cos(m), V[1] + r * Math.sin(m)], text, c, size: 27, d: 0.2 }, o || {}); };
  const lab = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c, size: 28, d: 0.2 }, o || {});
  const ln = (a, b, c, o) => Object.assign({ k: 'seg', a, b, c, wd: 3.6, d: 0.6 }, o || {});
  const dot = (at, name, dir, c, o) => Object.assign({ k: 'pt', at, name, dir, off: 26, c, r: 6, d: 0.15 }, o || {});
  const tri = (A, B, C, c, o) => Object.assign({ k: 'poly', pts: [A, B, C], close: true, c, wd: 3.6, d: 0.8 }, o || {});
  const tick = (a, b, n, c) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.17, g = 0.13, out = []; for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * g, cx = mx + ux * o, cy = my + uy * o; out.push({ k: 'seg', a: [cx - uy * h, cy + ux * h], b: [cx + uy * h, cy - ux * h], c, wd: 3, d: 0.1 }); } return out; };
  const chev = (a, b, s, n, c) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l, h = 0.2, w = 0.15, out = []; for (let i = 0; i < n; i++) { const px = a[0] + (b[0] - a[0]) * s + ux * i * 0.22, py = a[1] + (b[1] - a[1]) * s + uy * i * 0.22; out.push({ k: 'poly', pts: [[px - ux * h - uy * w, py - uy * h + ux * w], [px, py], [px - ux * h + uy * w, py - uy * h - ux * w]], c, wd: 3, d: 0.1 }); } return out; };
  const view = [0, 0, 11.8, 6.0];
  const f1 = FIG('f1', view, 1180, 600, [], { col: 1 });
  const G1 = (...i) => ({ fig: 'f1', items: i.flat(3) });
  /* 点（python で計算）：△ABC は C＝90°、BC＝3、CA＝4、AB＝5（1cm＝0.75）。△DEF は △ABC を裏返して回した形 */
  const Ap = [2, 4.4], Bp = [4.25, 1.4], Cp = [2, 1.4];
  const Dp = [10.089, 4.623], Ep = [6.948, 2.573], Fp = [9.063, 1.804];
  const cen1 = [2.75, 2.4], cen2 = [8.7, 3.0];
  const away = (p, c) => { const d = [p[0] - c[0], p[1] - c[1]], l = Math.hypot(d[0], d[1]); return [d[0] / l, d[1] / l]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const sideLab = (a, b, text, c, cen) => { const m = mid(a, b), d = away(m, cen); return lab(m[0] + d[0] * 0.55, m[1] + d[1] * 0.55, text, c, { size: 26 }); };
  const rt = (V, P, Q2) => ({ k: 'right', at: V, u: [P[0] - V[0], P[1] - V[1]], v: [Q2[0] - V[0], Q2[1] - V[1]], s: 18, c: 'w' });
  const tris = [tri(Ap, Bp, Cp, 'w'), tri(Dp, Ep, Fp, 'w'), rt(Cp, Bp, Ap), rt(Fp, Ep, Dp),
    [Ap, Bp, Cp].map((p, i) => dot(p, 'ABC'[i], away(p, cen1), 'y')), [Dp, Ep, Fp].map((p, i) => dot(p, 'DEF'[i], away(p, cen2), 'y'))];
  const ticks = [tick(Bp, Cp, 1, 'y'), tick(Cp, Ap, 2, 'p'), tick(Ap, Bp, 3, 'b'), tick(Ep, Fp, 1, 'y'), tick(Fp, Dp, 2, 'p'), tick(Dp, Ep, 3, 'b')];
  const lens = [sideLab(Bp, Cp, '3cm', 'y', cen1), sideLab(Cp, Ap, '4cm', 'p', cen1), sideLab(Ap, Bp, '5cm', 'b', cen1)];
  const hiSide = (a, b) => ln(a, b, 'g', { wd: 7, temp: true, d: 0.3 });
  const hiPts = (list) => ({ k: 'pts', list, c: 'g', r: 10, temp: true, d: 0.2 });
  const t2 = [['△GHI', 'G', 'H', 'I'], ['△JKL', 'J', 'K', 'L']];

  KL.lesson({ id: 'g2ch4-o09', unit: '中2　平行と合同', kick: '2年4章　応用9', title: '合同な図形の対応', card: '合同な図形の対応', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、合同な図形の、対応を、学びます。対応する頂点、辺、角を、見つけます。', { title: true, point: false, ft: 'happy' }),
    B('合同って、合同練習の、合同？ みんなで、一緒に、練習するの？', { title: true, fb: 'confused', up: true }),
    T('合同練習とは、ちがいます。形も大きさも、同じで、ぴったり重なる図形のことです。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。△ABC と △DEF は、合同です。同じ印の辺は、等しい長さです。△ABC の辺の長さは、図のとおりです。', { say: '問題です。さんかく エービーシー と さんかく ディーイーエフ は、合同です。同じ印の辺は、等しい長さです。さんかく エービーシー の辺の長さは、図のとおりです。', part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '対応する頂点・辺を\n見つけよう', t: 4.0 }, Object.assign(f1, { prims: [] })],
      draw: [G1(tris, ticks, lens)] }),
    T('△DEF は、△ABC を、裏返して、回した形です。位置ではなく、印を手がかりにして、対応を探します。', { say: 'さんかく ディーイーエフ は、さんかく エービーシー を、裏返して、回した形です。位置ではなく、印を手がかりにして、対応を探します。', ft: 'normal', point: false }),

    /* ---------- 問1：対応する頂点 ---------- */
    Q('q1', T('問題です。頂点 B に対応する頂点は、どれでしょう。', { say: '問題です。頂点 ビー に対応する頂点は、どれでしょう。', ft: 'normal', draw: [G1(hiPts([Bp]))] }),
      [{ t: '頂点 D' }, { t: '頂点 E', ok: true }, { t: '頂点 F' }, { t: '頂点 C' }],
      { 0: [T('頂点 D は、頂点 A に対応します。頂点 B は、3本線の辺と、1本線の辺が、集まる頂点です。', { say: '頂点 ディー は、頂点 エー に対応します。頂点 ビー は、3本線の辺と、1本線の辺が、集まる頂点です。', ft: 'normal' })],
        2: [T('頂点 F は、直角の頂点で、頂点 C に対応します。頂点 B は、3本線と、1本線の辺が、集まる頂点です。', { say: '頂点 エフ は、直角の頂点で、頂点 シー に対応します。頂点 ビー は、3本線と、1本線の辺が、集まる頂点です。', ft: 'normal' })],
        3: [B('C は、さっきから、ずっと、図に出てるよ！', { say: 'シー は、さっきから、ずっと、図に出てるよ！', fb: 'happy', up: true }), T('頂点 C は、△ABC の頂点です。△DEF の中から、B に対応する頂点を、選びます。', { say: '頂点 シー は、さんかく エービーシー の頂点です。さんかく ディーイーエフ の中から、ビー に対応する頂点を、選びます。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ B は、3本線の AB と、1本線の BC が、集まる頂点です。△DEF では、3本線の DE と、1本線の EF が、集まる E です。', { say: '正解！ビー は、3本線の エービー と、1本線の ビーシー が、集まる頂点です。さんかく ディーイーエフ では、3本線の ディーイー と、1本線の イーエフ が、集まる イー です。', ft: 'happy', draw: [G1(hiPts([Bp, Ep]))] }), B('印を、手がかりに、すればいいんだね！', { fb: 'star', up: true })],
        wrong: [T('B は、3本線と、1本線の辺が、集まる頂点です。△DEF では、E です。', { say: 'ビー は、3本線と、1本線の辺が、集まる頂点です。さんかく ディーイーエフ では、イー です。', ft: 'normal' })] }),

    /* ---------- 問2：対応する辺 ---------- */
    Q('q2', T('問題です。辺 CA に対応する辺は、どれでしょう。辺 CA は、2本線の辺です。', { say: '問題です。辺 シーエー に対応する辺は、どれでしょう。辺 シーエー は、2本線の辺です。', ft: 'normal', draw: [G1(hiSide(Cp, Ap))] }),
      [{ t: '辺 DE' }, { t: '辺 EF' }, { t: '辺 FD', ok: true }, { t: '辺 BC' }],
      { 0: [T('辺 DE は、3本線です。3本線の辺は、辺 AB に対応します。辺 CA は、2本線です。', { say: '辺 ディーイー は、3本線です。3本線の辺は、辺 エービー に対応します。辺 シーエー は、2本線です。', ft: 'normal' })],
        1: [T('辺 EF は、1本線です。1本線の辺は、辺 BC に対応します。辺 CA は、2本線です。', { say: '辺 イーエフ は、1本線です。1本線の辺は、辺 ビーシー に対応します。辺 シーエー は、2本線です。', ft: 'normal' })],
        3: [T('辺 BC は、△ABC の辺です。△DEF の中から、辺 CA に対応する辺を、選びます。', { say: '辺 ビーシー は、さんかく エービーシー の辺です。さんかく ディーイーエフ の中から、辺 シーエー に対応する辺を、選びます。', ft: 'normal' })],
        ok: [T('正解！ 辺 CA は、2本線の辺です。△DEF で、2本線の辺は、辺 FD です。', { say: '正解！辺 シーエー は、2本線の辺です。さんかく ディーイーエフ で、2本線の辺は、辺 エフディー です。', ft: 'happy', draw: [G1(hiSide(Cp, Ap), hiSide(Fp, Dp))] }), B('印が同じ辺が、対応するんだね！', { fb: 'star', up: true })],
        wrong: [T('辺 CA は、2本線です。△DEF で、2本線の辺は、辺 FD です。', { say: '辺 シーエー は、2本線です。さんかく ディーイーエフ で、2本線の辺は、辺 エフディー です。', ft: 'normal' })] }),
    T('頂点の対応は、A と D、B と E、C と F です。この順に、書くと、合同の式に、なります。', { say: '頂点の対応は、エー と ディー、ビー と イー、シー と エフ です。この順に、書くと、合同の式に、なります。', ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '対応', text: 'A→D　B→E　C→F', t: 4.0 }] }),

    /* ---------- 問3：合同の式 ---------- */
    Q('q3', T('問題です。△ABC と △DEF の合同を、記号で、正しく書いているのは、どれでしょう。', { say: '問題です。さんかく エービーシー と さんかく ディーイーエフ の合同を、記号で、正しく書いているのは、どれでしょう。', ft: 'normal' }),
      [{ t: '△ABC≡△DEF', ok: true }, { t: '△ABC≡△DFE' }, { t: '△ABC≡△EDF' }, { t: '△ABC≡△FED' }],
      { 1: [B('順番は、気にしないで、D、E、F が、あれば、いいでしょ？', { say: '順番は、気にしないで、ディー、イー、エフ が、あれば、いいでしょ？', fb: 'happy', up: true }), T('順番が、大切です。A、B、C の順に、対応する頂点を、書きます。A は D に、B は E に、C は F に、対応するので、△DEF です。', { say: '順番が、大切です。エー、ビー、シー の順に、対応する頂点を、書きます。エー は ディー に、ビー は イー に、シー は エフ に、対応するので、さんかく ディーイーエフ です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('△EDF だと、A が E に、B が D に、対応してしまいます。A は D、B は E です。', { say: 'さんかく イーディーエフ だと、エー が イー に、ビー が ディー に、対応してしまいます。エー は ディー、ビー は イー です。', ft: 'normal' })],
        3: [T('△FED だと、A が F に、C が D に、対応してしまいます。A は D、B は E、C は F です。', { say: 'さんかく エフイーディー だと、エー が エフ に、シー が ディー に、対応してしまいます。エー は ディー、ビー は イー、シー は エフ です。', ft: 'normal' })],
        ok: [T('正解！ A は D、B は E、C は F に、対応します。同じ順に、書いて、△ABC≡△DEF です。', { say: '正解！エー は ディー、ビー は イー、シー は エフ に、対応します。同じ順に、書いて、さんかく エービーシー ごうどう さんかく ディーイーエフ です。', ft: 'happy' }), B('頂点を書く順番が、そのまま、対応なんだね！', { fb: 'star', up: true })],
        wrong: [T('対応する頂点を、同じ順に、書きます。△ABC≡△DEF です。', { say: '対応する頂点を、同じ順に、書きます。さんかく エービーシー ごうどう さんかく ディーイーエフ です。', ft: 'normal' })] }),

    /* ---------- 問4：辺の長さ ---------- */
    Q('q4', T('問題です。辺 EF の長さは、何センチでしょう。', { say: '問題です。辺 イーエフ の長さは、何センチでしょう。', ft: 'normal', draw: [G1(hiSide(Ep, Fp))] }),
      [{ t: '7cm' }, { t: '5cm' }, { t: '4cm' }, { t: '3cm', ok: true }],
      { 0: [T('7cm は、3cm＋4cm です。辺 EF は、辺 BC に対応する、1つの辺の長さです。', { say: '7センチ は、3センチ たす 4センチ です。辺 イーエフ は、辺 ビーシー に対応する、1つの辺の長さです。', ft: 'normal' })],
        1: [B('いちばん長い辺が、EF でしょ？ 5cm！', { say: 'いちばん長い辺が、イーエフ でしょ？5センチ！', fb: 'happy', up: true }), T('5cm は、辺 AB の長さです。辺 AB に対応するのは、辺 DE です。辺 EF は、辺 BC に対応して、3cm です。', { say: '5センチ は、辺 エービー の長さです。辺 エービー に対応するのは、辺 ディーイー です。辺 イーエフ は、辺 ビーシー に対応して、3センチ です。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('4cm は、辺 CA の長さです。辺 CA に対応するのは、辺 FD です。辺 EF は、3cm です。', { say: '4センチ は、辺 シーエー の長さです。辺 シーエー に対応するのは、辺 エフディー です。辺 イーエフ は、3センチ です。', ft: 'normal' })],
        ok: [T('正解！ 辺 EF は、1本線の辺 BC に、対応します。合同な図形は、対応する辺の長さが、等しいので、3cm です。', { say: '正解！辺 イーエフ は、1本線の辺 ビーシー に、対応します。合同な図形は、対応する辺の長さが、等しいので、3センチ です。', ft: 'happy', draw: [G1(hiSide(Bp, Cp), hiSide(Ep, Fp))] }), B('対応する辺は、長さも、同じなんだね！', { fb: 'star', up: true })],
        wrong: [T('辺 EF は、辺 BC に対応するので、3cm です。', { say: '辺 イーエフ は、辺 ビーシー に対応するので、3センチ です。', ft: 'normal' })] }),

    /* ---------- 2ページ目：記号だけの問題 ---------- */
    T('次は、記号だけの問題です。△GHI≡△JKL と、書かれています。図は、ありません。', { say: '次は、記号だけの問題です。さんかく ジーエイチアイ ごうどう さんかく ジェーケーエル と、書かれています。図は、ありません。', clear: true, cols: [0.34, 0.66], part: '記号から読みとる', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '△GHI≡△JKL', t: 3.5 }] }),
    T('合同の式は、対応する頂点を、同じ順に、書いたものです。順番だけで、対応が、わかります。', { ft: 'normal', point: false }),

    /* ---------- 問5：記号から読む ---------- */
    Q('q5', T('最後の問題です。△GHI≡△JKL のとき、∠H に等しい角は、どれでしょう。', { say: '最後の問題です。さんかく ジーエイチアイ ごうどう さんかく ジェーケーエル のとき、かく エイチ に等しい角は、どれでしょう。', ft: 'happy' }),
      [{ t: '∠J' }, { t: '∠K', ok: true }, { t: '∠L' }, { t: '∠I' }],
      { 0: [T('∠J は、1番目の頂点で、∠G に対応します。∠H は、2番目なので、2番目の頂点の、∠K です。', { say: 'かく ジェー は、1番目の頂点で、かく ジー に対応します。かく エイチ は、2番目なので、2番目の頂点の、かく ケー です。', ft: 'normal' })],
        2: [T('∠L は、3番目の頂点で、∠I に対応します。∠H は、2番目なので、2番目の頂点の、∠K です。', { say: 'かく エル は、3番目の頂点で、かく アイ に対応します。かく エイチ は、2番目なので、2番目の頂点の、かく ケー です。', ft: 'normal' })],
        3: [B('△GHI の中の、角だよ！ 近いから、等しいんでしょ？', { say: 'さんかく ジーエイチアイ の中の、角だよ！近いから、等しいんでしょ？', fb: 'happy', up: true }), T('∠I は、同じ △GHI の、中の角です。対応する角は、もう一方の三角形、△JKL の中に、あります。', { say: 'かく アイ は、同じ さんかく ジーエイチアイ の、中の角です。対応する角は、もう一方の三角形、さんかく ジェーケーエル の中に、あります。', ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ G は J、H は K、I は L に、対応します。∠H＝∠K です。', { say: '正解！ジー は ジェー、エイチ は ケー、アイ は エル に、対応します。かく エイチ イコール かく ケー です。', ft: 'happy' }), B('順番を見れば、図が、なくても、わかるんだね！', { fb: 'star', up: true })],
        wrong: [T('合同の式の、同じ順番が、対応です。H は 2番目なので、2番目の K です。', { say: '合同の式の、同じ順番が、対応です。エイチ は 2番目なので、2番目の ケー です。', ft: 'normal' })] }),

    T('合同の記号は、対応する頂点を、同じ順に、書きます。辺や角の対応も、順番から、わかります。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '頂点の順番＝対応の順番\n対応する辺・角は等しい', t: 5.5 }, tbl(t2, { style: 'font-size:46px; align-self:center; margin-top:20px', t: 1.0 })] }),
    B('合同練習の合同じゃなくて、ぴったり重なる、合同だったんだね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
