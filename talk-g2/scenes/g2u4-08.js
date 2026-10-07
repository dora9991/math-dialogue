/* 中2 4章 平行と合同　第8時「ぴったり重なる図形の、辺や角の関係を調べよう」（例）。自作。
   △ABC：AB＝5cm，BC＝8cm，CA＝7cm，∠B＝60°（余弦定理で 25＋64−2×5×8×cos60°＝49 → CA＝7）。△DEF は △ABC を裏返して回した形（A→E，B→F，C→D）。
   DE＝CA＝7，EF＝AB＝5，FD＝BC＝8，∠F＝∠B＝60°。△ABC≡△EFD。長方形 A（2cm×6cm）と B（3cm×4cm）は、どちらも面積12cm²だが合同でない。 */
(function () {
  const { T, B, Q } = KL;
  const f1 = KL.FIG('g', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const f2 = KL.FIG('h', [0, 0, 11.8, 6.0], 1180, 600, [], { col: 1 });
  const G = (...i) => ({ fig: 'g', items: i.flat(3) });
  const H = (...i) => ({ fig: 'h', items: i.flat(3) });

  /* ---- 図の部品（自分の台本の中で定義） ---- */
  const cen = ps => [(ps[0][0] + ps[1][0] + ps[2][0]) / 3, (ps[0][1] + ps[1][1] + ps[2][1]) / 3];
  const unit = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
  const tri = (ps, fill) => ({ k: 'poly', pts: ps, close: true, c: 'w', wd: 3.4, fill, alpha: 0.12 });
  const names = (ps, nm, c) => ps.map((p, i) => ({ k: 'pt', at: p, name: nm[i], dir: unit(cen(ps), p), off: 30, c: c || 'w', r: 5 }));
  const sideLab = (a, b, ps, text, c) => { const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], u = unit(cen(ps), m); return { k: 'label', at: [m[0] + u[0] * 0.4, m[1] + u[1] * 0.4], text, c: c || 'w', size: 28 }; };
  const tick = (a, b, n, c) => {   // 等しい辺の印：辺の中点に、辺に垂直な短い線を n 本
    const u = unit(a, b), nv = [-u[1], u[0]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], out = [];
    for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 0.11, q = [m[0] + u[0] * o, m[1] + u[1] * o]; out.push({ k: 'seg', a: [q[0] - nv[0] * 0.16, q[1] - nv[1] * 0.16], b: [q[0] + nv[0] * 0.16, q[1] + nv[1] * 0.16], c, wd: 3.2 }); }
    return out;
  };
  const angArc = (v, p, q, r, n, c) => {   // 頂点 v の内角（p と q のあいだ）に、弧を n 本
    const a1 = Math.atan2(p[1] - v[1], p[0] - v[0]) * 180 / Math.PI, a2 = Math.atan2(q[1] - v[1], q[0] - v[0]) * 180 / Math.PI;
    let d = ((a2 - a1) % 360 + 360) % 360, s = a1;
    if (d > 180) { s = a2; d = 360 - d; }
    const out = [];
    for (let i = 0; i < n; i++) out.push({ k: 'ell', o: v, rx: r + 0.12 * i, ry: r + 0.12 * i, a1: s, a2: s + d, c, wd: 3 });
    return out;
  };
  const angLab = (v, p, q, r, text, c) => { const u = unit(v, p), w = unit(v, q), s = unit([0, 0], [u[0] + w[0], u[1] + w[1]]); return { k: 'label', at: [v[0] + s[0] * (r + 0.42), v[1] + s[1] * (r + 0.42)], text, c, size: 26 }; };
  const thick = (a, b, c) => ({ k: 'seg', a, b, c, wd: 7 });

  /* ---- 図1：合同な △ABC と △DEF（座標は python で計算した値） ---- */
  const A = [2.33, 3.15], Bp = [1.2, 1.2], C = [4.8, 1.2];
  const D = [6.51, 3.48], E = [9.61, 4.04], F = [9.69, 1.79];
  const abc = [A, Bp, C], def = [D, E, F];
  const base = [tri(abc, 'y'), tri(def, 'b'), names(abc, ['A', 'B', 'C']), names(def, ['D', 'E', 'F']),
    sideLab(A, Bp, abc, '5cm'), sideLab(Bp, C, abc, '8cm'), sideLab(C, A, abc, '7cm'), sideLab(D, E, def, '7cm'), sideLab(F, D, def, '8cm'),
    angArc(Bp, A, C, 0.55, 1, 'b'), angLab(Bp, A, C, 0.55, '60°', 'b')];
  const sides8 = [thick(Bp, C, 'p'), thick(F, D, 'p')], sides7 = [thick(C, A, 'g'), thick(D, E, 'g')];
  const cd = { k: 'pts', list: [C, D], c: 'y', r: 11 };
  const pairs = [{ k: 'pts', list: [A, E], c: 'y', r: 11 }, { k: 'pts', list: [Bp, F], c: 'p', r: 11 }, { k: 'pts', list: [C, D], c: 'g', r: 11 }];
  const eq = [tick(A, Bp, 1, 'y'), tick(E, F, 1, 'y'), tick(Bp, C, 2, 'p'), tick(F, D, 2, 'p'), tick(C, A, 3, 'g'), tick(D, E, 3, 'g'), angArc(F, E, D, 0.55, 1, 'b')];
  const angF = [angLab(F, E, D, 0.55, '？', 'b')];
  const lenEF = [{ k: 'label', at: [9.95, 2.95], text: '？', c: 'y', size: 30 }];

  /* ---- 図2：面積が同じ2つの長方形（0.6 単位／cm） ---- */
  const recA = [[1.2, 2.0], [4.8, 2.0], [4.8, 3.2], [1.2, 3.2]], recB = [[6.8, 1.6], [9.2, 1.6], [9.2, 3.4], [6.8, 3.4]];
  const rects = [{ k: 'poly', pts: recA, close: true, c: 'w', wd: 3.4, fill: 'y', alpha: 0.12 }, { k: 'poly', pts: recB, close: true, c: 'w', wd: 3.4, fill: 'b', alpha: 0.12 },
    { k: 'label', at: [3.0, 3.6], text: '6cm', c: 'w', size: 28 }, { k: 'label', at: [0.7, 2.6], text: '2cm', c: 'w', size: 28 },
    { k: 'label', at: [8.0, 3.8], text: '4cm', c: 'w', size: 28 }, { k: 'label', at: [6.3, 2.5], text: '3cm', c: 'w', size: 28 },
    { k: 'label', at: [3.0, 2.6], text: '長方形 A', c: 'y', size: 30 }, { k: 'label', at: [8.0, 2.5], text: '長方形 B', c: 'b', size: 30 },
    { k: 'label', at: [3.0, 1.4], text: '面積 12cm²', c: 'y', size: 28 }, { k: 'label', at: [8.0, 0.9], text: '面積 12cm²', c: 'b', size: 28 }];

  KL.lesson({ id: 'g2u4-08', unit: '中2　平行と合同', kick: '2年4章　第8時', title: 'ぴったり重なる図形の、辺や角の関係を調べよう', card: 'ぴったり重なる図形の、辺や角の関係を調べよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、ぴったり重なる図形の、辺や角の関係を、調べます。', { title: true, point: false, ft: 'happy' }),
    B('右の手ぶくろと、左の手ぶくろは、重ならないよね？ ぼくの右手は、左に、入らないもん！', { title: true, fb: 'think', up: true }),
    T('ふふ。紙にかいた図形なら、裏返して、重ねてもよいことにします。図を、見てみましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。△ABC と △DEF は、ぴったり重なります。辺の長さは、図のとおりです。', { part: '問題を読もう', ft: 'normal',
      say: '問題です。さんかく エービーシー と さんかく ディーイーエフ は、ぴったり重なります。辺の長さは、図のとおりです。',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '重なる図形の\n辺や角の関係を\n調べよう', t: 4.0 }, Object.assign(f1, { prims: [] })],
      draw: [G(base)] }),
    T('ぴったり重なる2つの図形を、合同な図形といいます。裏返して重なる場合も、合同です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '合同', text: 'ぴったり重なる\n図形どうし', t: 4.0 }] }),
    T('まず、辺の長さに、注目します。8cm の辺は、BC と FD。7cm の辺は、CA と DE です。', { ft: 'normal', point: false,
      say: 'まず、辺の長さに、注目します。8センチの辺は、ビーシー と エフディー。7センチの辺は、シーエー と ディーイー です。',
      draw: [G(sides8, sides7)] }),
    T('8cm の辺にも、7cm の辺にも、入っている頂点は、C と D です。この2つが、重なります。', { ft: 'normal', point: false,
      say: '8センチの辺にも、7センチの辺にも、入っている頂点は、シー と ディー です。この2つが、重なります。',
      draw: [G(cd)] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。C と D が重なるとき、頂点 B と重なる頂点は、どれでしょう。', { ft: 'normal',
      say: '問題です。シー と ディー が重なるとき、頂点 ビー と重なる頂点は、どれでしょう。' }),
      [{ t: '頂点 D' }, { t: '頂点 F', ok: true }, { t: '頂点 E' }, { t: '決められない' }],
      { 0: [T('D は、C と重なっています。辺 BC は、辺 FD に重なるので、B は F です。', { ft: 'normal',
              say: 'ディー は、シー と重なっています。辺 ビーシー は、辺 エフディー に重なるので、ビー は エフ です。' })],
        2: [B('名前の順だよ！ A、B、C と、D、E、F で、B は E！', { fb: 'happy', up: true }),
            T('名前の順では、決まりません。辺 BC は FD に重なるので、B と重なるのは F です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' },
              say: '名前の順では、決まりません。辺 ビーシー は エフディー に重なるので、ビー と重なるのは エフ です。' })],
        3: [T('決められます。BC が FD に重なり、C が D なので、B は F です。', { ft: 'normal',
              say: '決められます。ビーシー が エフディー に重なり、シー が ディー なので、ビー は エフ です。' })],
        ok: [T('正解！ BC は FD に重なります。C が D なら、B は F です。', { ft: 'happy',
              say: '正解！ ビーシー は エフディー に重なります。シー が ディー なら、ビー は エフ です。' }), B('のこりの A は、E だね！', { fb: 'star', up: true })],
        wrong: [T('辺 BC は、辺 FD に重なります。C が D なら、B は F です。', { ft: 'normal',
              say: '辺 ビーシー は、辺 エフディー に重なります。シー が ディー なら、ビー は エフ です。' })] }),

    T('重なる頂点を、対応する頂点といいます。A と E、B と F、C と D が、対応しています。', { ft: 'normal', point: false,
      say: '重なる頂点を、対応する頂点といいます。エー と イー、ビー と エフ、シー と ディー が、対応しています。',
      draw: [G(pairs)] }),
    T('合同は、記号 ≡ で表します。対応する頂点を、同じ順に書きます。', { ft: 'normal', point: false,
      say: '合同は、合同の記号で表します。対応する頂点を、同じ順に書きます。',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '合同の書き方', text: '△ABC≡△EFD\n対応する順に書く', t: 4.5 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。△ABC と合同な三角形を、記号で正しく書いているのは、どれでしょう。', { ft: 'normal',
      say: '問題です。さんかく エービーシー と合同な三角形を、記号で正しく書いているのは、どれでしょう。' }),
      [{ t: '△ABC≡△DEF' }, { t: '△ABC≡△FDE' }, { t: '△ABC≡△EFD', ok: true }, { t: '△ABC≡△DFE' }],
      { 0: [B('アルファベット順で、DEF でしょ？', { fb: 'happy', up: true }),
            T('順番で、決めません。A は E に、B は F に、C は D に重なります。E、F、D の順です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' },
              say: '順番で、決めません。エー は イー に、ビー は エフ に、シー は ディー に重なります。イー、エフ、ディー の順です。' })],
        1: [T('FDE だと、A が F に対応してしまいます。A は E に重なるので、先頭は E です。', { ft: 'normal',
              say: 'エフディーイー だと、エー が エフ に対応してしまいます。エー は イー に重なるので、先頭は イー です。' })],
        ok: [T('正解！ A と E、B と F、C と D。対応する順に書いて、△ABC≡△EFD です。', { ft: 'happy',
              say: '正解！ エー と イー、ビー と エフ、シー と ディー。対応する順に書いて、さんかく エービーシー 合同 さんかく イーエフディー です。' }), B('順番にも、意味があるんだね！', { fb: 'star', up: true })],
        wrong: [T('A、B、C に重なる頂点を、順に書きます。E、F、D なので、△ABC≡△EFD です。', { ft: 'normal',
              say: 'エー、ビー、シー に重なる頂点を、順に書きます。イー、エフ、ディー なので、さんかく エービーシー 合同 さんかく イーエフディー です。' })] }),

    T('合同な図形では、対応する辺の長さは等しく、対応する角の大きさも等しくなります。', { ft: 'normal', point: false,
      draw: [G(eq)],
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '合同の性質', text: '対応する辺は等しい\n対応する角は等しい', t: 5.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。辺 EF の長さは、何 cm でしょう。辺 EF は、辺 AB に対応します。', { ft: 'normal',
      say: '問題です。辺 イーエフ の長さは、何センチでしょう。辺 イーエフ は、辺 エービー に対応します。', draw: [G(lenEF)] }),
      [{ t: '20cm' }, { t: '8cm' }, { t: '7cm' }, { t: '5cm', ok: true }],
      { 0: [B('3つの辺を、足して、20cm だよ！', { fb: 'happy', up: true }),
            T('20cm は、まわり全部の長さです。EF は1本の辺で、対応する AB と同じ、5cm です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' },
              say: '20センチは、まわり全部の長さです。イーエフ は1本の辺で、対応する エービー と同じ、5センチです。' })],
        1: [T('8cm は、辺 BC や FD の長さです。EF は AB に対応するので、5cm です。', { ft: 'normal',
              say: '8センチは、辺 ビーシー や エフディー の長さです。イーエフ は エービー に対応するので、5センチです。' })],
        ok: [T('正解！ EF は AB に対応するので、長さが等しく、5cm です。', { ft: 'happy',
              say: '正解！ イーエフ は エービー に対応するので、長さが等しく、5センチです。' }), B('場所じゃなくて、対応で決まるんだね！', { fb: 'star', up: true })],
        wrong: [T('EF は、AB に対応します。AB が5cm なので、EF も5cm です。', { ft: 'normal',
              say: 'イーエフ は、エービー に対応します。エービー が5センチなので、イーエフ も5センチです。' })] }),

    T('角も、同じです。△ABC の ∠B は 60° です。∠B に重なる角は、∠F です。', { ft: 'normal', point: false,
      say: 'かくも、同じです。さんかく エービーシー の かく ビー は 60度です。かく ビー に重なる角は、かく エフ です。',
      draw: [G(angF)] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。∠F の大きさは、何度でしょう。', { ft: 'normal', say: '問題です。かく エフ の大きさは、何度でしょう。' }),
      [{ t: '30°' }, { t: '60°', ok: true }, { t: '120°' }, { t: 'この図からは、わからない' }],
      { 0: [T('30°ではありません。∠F は、対応する ∠B と、同じ大きさの 60° です。', { ft: 'normal',
              say: '30度ではありません。かく エフ は、対応する かく ビー と、同じ大きさの 60度です。' })],
        2: [B('180°から60°を引いて、120°でしょ？', { fb: 'happy', up: true }),
            T('それは、∠B と一直線になる角です。∠F は、∠B と同じ 60° です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' },
              say: 'それは、かく ビー と一直線になる角です。かく エフ は、かく ビー と同じ 60度です。' })],
        3: [T('わかります。∠F は、∠B と重なる角なので、同じ 60° です。', { ft: 'normal',
              say: 'わかります。かく エフ は、かく ビー と重なる角なので、同じ 60度です。' })],
        ok: [T('正解！ 対応する角は等しいので、∠F＝∠B＝60° です。', { ft: 'happy',
              say: '正解！ 対応する角は等しいので、かく エフ イコール かく ビー イコール 60度です。' }), B('重なる角は、同じ大きさなんだね！', { fb: 'star', up: true })],
        wrong: [T('∠F は、∠B と重なる角です。同じ大きさの 60° です。', { ft: 'normal',
              say: 'かく エフ は、かく ビー と重なる角です。同じ大きさの 60度です。' })] }),

    T('次は、気をつけたい、まちがいです。長方形が、2つあります。どちらも、面積は12cm²です。', { clear: true, cols: [0.34, 0.66], part: '面積が同じなら？', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: '長方形', text: '面積が同じ\nなら、合同？', t: 3.5 }, Object.assign(f2, { prims: [] })],
      draw: [H(rects)] }),

    /* ---------- 問5 ---------- */
    Q('q5', T('問題です。長方形 A と B は、合同でしょうか。', { ft: 'normal' }),
      [{ t: '重ならないから、合同でない', ok: true }, { t: '面積が同じだから、合同' }, { t: '回せば重なるから、合同' }, { t: 'まわりが同じだから、合同' }],
      { 1: [B('どっちも12cm²！ 板チョコなら、同じ量だよ！', { fb: 'happy', up: true }),
            T('量は同じでも、形がちがいます。2cm×6cm と 3cm×4cm は、ぴったり重なりません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('回しても、辺の長さが、ちがいます。A は6cm と2cm、B は4cm と3cm で、重なりません。', { ft: 'normal' })],
        ok: [T('正解！ 面積が同じでも、辺の長さがちがうので、ぴったり重なりません。', { ft: 'happy' }), B('合同は、形も大きさも、同じことなんだね！', { fb: 'star', up: true })],
        wrong: [T('まわりは、A が16cm、B が14cm で、ちがいます。ぴったり重ならないので、合同ではありません。', { ft: 'normal' })] }),

    T('まとめです。ぴったり重なる図形が、合同です。対応する辺や角は、それぞれ等しくなります。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '合同な図形では\n対応する辺は等しい\n対応する角は等しい', t: 5.0 }] }),
    B('右と左の、手ぶくろ、裏返して、重ねてみるよ！ ぴったり、合同だ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
