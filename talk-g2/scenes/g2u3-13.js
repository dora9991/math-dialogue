/* 中2 3章 一次関数　第13時「連立方程式の解は、グラフのどこに現れるだろう」（探）。自作問題。
   ①3x＋y＝7（y＝−3x＋7）②x−y＝−3（y＝x＋3）→ 解 x＝1、y＝4 ＝ 交点（1，4）。
   もう1組：y＝2x−1 と y＝−x＋5 → 交点（2，3）。2直線が平行なら交点なし＝解なし（ひとこと）。 */
(function () {
  const { T, B, Q, FIG, tbl } = KL;
  const fig = (id, pl, w, h, u) => {
    const cx = (pl[0] + pl[2]) / 2, cy = (pl[1] + pl[3]) / 2, hw = w / u / 2, hh = h / u / 2;
    return FIG(id, [cx - hw, cy - hh, cx + hw, cy + hh], w, h, [], { col: 1, plane: pl });
  };
  const G = (id, ...i) => ({ fig: id, items: i.flat(3) });
  const PLN = { k: 'plane', lab: 1, size: 19 };
  const LB = (x, y, text, c, size, anchor) => ({ k: 'label', at: [x, y], text, c: c || 'w', size: size || 28, anchor: anchor || 'start' });
  const FN = (a, b, c, label, lat) => ({ k: 'fn', a, b, c, label, lat, lanchor: 'start', wd: 3.8, size: 26 });
  const NP = (x, y, name, c, dir) => ({ k: 'pt', at: [x, y], name, dir: dir || [0.8, 0.8], c: c || 'y', r: 8 });
  const f1 = fig('g1', [-2, -1, 5, 8], 480, 540, 48);
  const f2 = fig('g2', [-2, -3, 6, 6], 480, 500, 44);

  KL.lesson({ id: 'g2u3-13', unit: '中2　一次関数', kick: '2年3章　第13時', title: '連立方程式の解は、グラフのどこに現れるだろう', card: '連立方程式の解は、グラフのどこに現れるだろう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、連立方程式の解が、グラフのどこに現れるかを、調べます。', { title: true, point: false, ft: 'happy' }),
    B('ぼくの宝の地図にはね、2本の道が交わるところに、宝があるって、書いてあるよ！', { title: true, fb: 'star', up: true }),
    T('それは、今日の授業に、ぴったりの話です。確かめてみましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。右の連立方程式を、解きましょう。そのあとで、グラフとの関係を、調べます。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '連立方程式の解は\nグラフのどこ？', t: 4.0 },
        { col: 1, type: 'text', size: 'lg', label: '連立方程式', text: '①　3x＋y＝7\n②　x−y＝−3', t: 4.0 }] }),
    T('2章で学んだ、加減法で解きます。①と②を、たすと、yが消えます。4x＝4で、x＝1です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '加減法', text: '①＋②\n4x＝4　x＝{{1}}', t: 3.5 }] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。x＝1を、①に代入すると、yは、いくつになるでしょう。', { ft: 'normal' }),
      [{ t: '7' }, { t: '10' }, { t: '4', ok: true }, { t: '3' }],
      { 1: [B('3＋y＝7だから、yは、7＋3で、10だよ！', { fb: 'happy', up: true }), T('3を右に移すと、符号が変わります。y＝7−3＝4です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('yは、7そのものでは、ありません。3×1＋y＝7 から、y＝7−3＝4です。', { ft: 'normal' })],
        ok: [T('正解！ 3×1＋y＝7 から、y＝7−3＝4。解は、x＝1、y＝4です。', { ft: 'happy' }), B('解は、（1，4）の組なんだね！', { fb: 'star', up: true })],
        wrong: [T('3は、3xの値です。3＋y＝7 から、y＝7−3＝4です。', { ft: 'normal' })] }),
    T('この解は、グラフでは、どこに現れるでしょう。調べるために、①と②を、yについて解いて、直線の式にします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '解', text: 'x＝1、y＝4', t: 3.0 }] }),
    T('①は、3xを右に移して、y＝−3x＋7になります。②は、どうなるでしょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '①', text: 'y＝−3x＋{{7}}', t: 3.0 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。②のx−y＝−3を、yについて解くと、どれでしょう。', { ft: 'normal' }),
      [{ t: 'y＝−x＋3' }, { t: 'y＝−x−3' }, { t: 'y＝x−3' }, { t: 'y＝x＋3', ok: true }],
      { 1: [B('−yを、yにして、右は、そのままでしょ？', { fb: 'happy', up: true }), T('xを移して、−y＝−x−3。両方の符号を、すべて変えて、y＝x＋3です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('−y＝−x−3 の、右の−3の符号も、変わります。y＝x＋3です。', { ft: 'normal' })],
        ok: [T('正解！ −y＝−x−3。両方の符号を変えて、y＝x＋3です。', { ft: 'happy' }), B('マイナスのyは、やっかいだね！', { fb: 'star', up: true })],
        wrong: [T('x−y＝−3 から、−y＝−x−3。符号を全部変えて、y＝x＋3です。', { ft: 'normal' })] }),

    T('①は、y＝−3x＋7。②は、y＝x＋3。この2本の直線を、かきましょう。', { clear: true, cols: [0.34, 0.66], part: '2本の直線', ft: 'normal',
      add: [{ col: 0, type: 'text', size: 'xs', label: '①', text: 'y＝−3x＋7', t: 3.0 }, { col: 0, type: 'text', size: 'xs', label: '②', text: 'y＝x＋3', t: 3.0 }, Object.assign(f1, { prims: [] })],
      draw: [G('g1', PLN, FN(-3, 7, 'b', 'y＝−3x＋7', [0.6, 7.5]), FN(1, 3, 'p', 'y＝x＋3', [3.0, 4.6]))] }),
    T('さあ、さっきの解（1，4）は、この図の、どこに現れるでしょう。', { ft: 'normal', point: false }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。解（1，4）は、グラフのどこにあるでしょう。', { ft: 'normal' }),
      [{ t: '2直線の交点', ok: true }, { t: '①の切片の点' }, { t: '②の切片の点' }, { t: '原点' }],
      { 1: [B('①の切片は7。解は、（0，7）じゃないの？', { fb: 'happy', up: true }), T('（0，7）は、①の切片の点です。解の（1，4）とは、ちがいます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('（0，3）は、②の切片の点です。解の（1，4）とは、ちがいます。', { ft: 'normal' })],
        ok: [T('正解！ （1，4）は、①の上にも、②の上にもある点です。つまり、2直線の交点です。', { ft: 'happy' }), B('2本の道が出会う場所が、解なんだね！', { fb: 'star', up: true })],
        wrong: [T('原点（0，0）は、①も②も、通っていません。交点とは、別の場所です。', { ft: 'normal' })] }),
    T('確かめましょう。（1，4）を、①に代入すると、3×1＋4＝7。②に代入すると、1−4＝−3。どちらも成り立ちます。', { ft: 'normal', point: false,
      draw: [G('g1', NP(1, 4, '', 'y'), LB(1.6, 3.5, '（1，4）', 'y', 28))] }),
    T('つまり、連立方程式の解は、2つの式のグラフの、交点の座標です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '連立方程式の解\n＝ 2直線の交点の座標', t: 5.0 }] }),

    T('もう1組、やってみましょう。y＝2x−1と、y＝−x＋5の、2本の直線が、かいてあります。', { clear: true, cols: [0.34, 0.66], part: '交点から解を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '連立方程式', text: 'y＝2x−1\ny＝−x＋5', t: 4.0 }, Object.assign(f2, { prims: [] })],
      draw: [G('g2', PLN, FN(2, -1, 'b', 'y＝2x−1', [0.25, -2.3]), FN(-1, 5, 'p', 'y＝−x＋5', [3.4, 3.3]))] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。この連立方程式の解は、グラフの交点から、どう読みとれるでしょう。', { ft: 'normal',
      draw: [G('g2', NP(2, 3, '', 'y'))] }),
      [{ t: 'x＝3、y＝2' }, { t: 'x＝2、y＝3', ok: true }, { t: 'x＝0、y＝−1' }, { t: 'x＝0、y＝5' }],
      { 0: [B('交点は（2，3）。ぼくは、yから読んだよ！ x＝3、y＝2！', { fb: 'happy', up: true }), T('点の座標は、x座標が先で、y座標があとです。（2，3）は、x＝2、y＝3です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('x＝0、y＝−1は、y＝2x−1の切片の点です。2直線が交わる点とは、別の場所です。', { ft: 'normal' })],
        ok: [T('正解！ 交点は（2，3）。だから、解は、x＝2、y＝3です。', { ft: 'happy' }), B('グラフを見るだけで、解がわかるなんて、すごいね！', { fb: 'star', up: true })],
        wrong: [T('x＝0、y＝5は、y＝−x＋5の切片の点です。2直線が交わる点を、読みとります。', { ft: 'normal' })] }),
    T('ちなみに、2本の直線が平行なら、交点がありません。そのときは、連立方程式の解も、ありません。', { ft: 'normal', point: false }),
    T('まとめます。連立方程式の解は、2直線の交点の座標です。グラフをかくと、解が、目で見えます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '解 ＝ 交点の座標\n平行なら 解なし', t: 5.0 }] }),
    B('ぼくの宝の地図の、バツじるしも、きっと交点だね！ 掘りにいくよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
