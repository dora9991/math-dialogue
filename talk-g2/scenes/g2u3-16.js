/* 中2 3章 一次関数　第16時「図形の中を動く点がつくる面積を調べよう」（活）。自作問題。
   長方形ABCD（AB＝4cm、BC＝6cm）。点PはBを出発し、BC、CDの上を毎秒1cmでDまで。x秒後の△ABPの面積 y cm²。
   0≦x≦6：BP＝x、y＝4×x÷2＝2x。6≦x≦10：高さ（BCの長さ）6、y＝4×6÷2＝12（一定）。y＝10 → x＝5。 */
(function () {
  const { T, B, Q, FIG, tbl } = KL;
  const fig = (id, pl, w, h, u) => {
    const cx = (pl[0] + pl[2]) / 2, cy = (pl[1] + pl[3]) / 2, hw = w / u / 2, hh = h / u / 2;
    return FIG(id, [cx - hw, cy - hh, cx + hw, cy + hh], w, h, [], { col: 1, plane: pl });
  };
  const G = (id, ...i) => ({ fig: id, items: i.flat(3) });
  const PLN = { k: 'plane', lab: 1, size: 19 };
  const PS = (list, c, r) => ({ k: 'pts', list, c: c || 'p', r: r || 7, d: 0.5 });
  const LB = (x, y, text, c, size, anchor) => ({ k: 'label', at: [x, y], text, c: c || 'w', size: size || 26, anchor: anchor || 'start' });
  const DS = (a, b, c) => ({ k: 'seg', a, b, c: c || 'w', wd: 3, dash: true });
  const NP = (x, y, name, c, dir) => ({ k: 'pt', at: [x, y], name, dir: dir || [0.8, 0.8], c: c || 'y', r: 7 });
  // 長方形ABCD（A左上、B左下、C右下、D右上）の図。座標平面ではない。
  const rectFig = id => FIG(id, [-2.2, -1.4, 7.4, 5.4], 672, 476, [], { col: 1 });
  const RECT = [{ k: 'poly', pts: [[0, 4], [0, 0], [6, 0], [6, 4]], close: true, c: 'w', wd: 3.6 },
    NP(0, 4, 'A', 'y', [-0.8, 0.8]), NP(0, 0, 'B', 'y', [-0.8, -0.8]), NP(6, 0, 'C', 'y', [0.8, -0.8]), NP(6, 4, 'D', 'y', [0.8, 0.8]),
    LB(-0.45, 2.0, 'AB＝4cm', 'w', 24, 'end'), LB(3, 4.65, 'BC＝6cm', 'w', 24, 'middle')];
  const PATH = [{ k: 'poly', pts: [[0, 0], [6, 0], [6, 3.4]], c: 'p', wd: 5 }, { k: 'seg', a: [6, 3.0], b: [6, 3.8], c: 'p', wd: 5, arrow: true }];
  const f1 = rectFig('g1');
  const f2 = rectFig('g2');
  const f3 = fig('g3', [0, 0, 10, 13], 460, 570, 36);

  KL.lesson({ id: 'g2u3-16', unit: '中2　一次関数', kick: '2年3章　第16時', title: '図形の中を動く点がつくる面積を調べよう', card: '図形の中を動く点がつくる面積を調べよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、長方形の辺の上を動く点が、つくる面積を、調べます。', { title: true, point: false, ft: 'happy' }),
    B('動く点なら、ぼくに、まかせて！ 長方形の上を、ころがっていくよ！', { title: true, fb: 'happy', up: true }),
    T('ころがるのは、点Pです。ポンタは、ここで、見ていてくださいね。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。AB＝4cm、BC＝6cmの、長方形ABCDがあります。点Pは、Bを出発して、辺BC、CDの上を、毎秒1cmで、Dまで動きます。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'AB＝4cm　BC＝6cm\n点Pは B→C→D\n毎秒1cm', t: 5.0 }, Object.assign(f1, { prims: [] })],
      draw: [G('g1', RECT, PATH)] }),
    T('x秒後の、△ABPの面積を、y cm²とします。yをxの式で表して、グラフにしましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'x秒後', text: '△ABPの面積＝y cm²', t: 3.0 }] }),
    T('図は、x＝2のときです。BP＝2cm。△ABPは、底辺AB、高さBPの、三角形です。', { ft: 'normal', point: false,
      draw: [G('g1', { k: 'poly', pts: [[0, 4], [0, 0], [2, 0]], close: true, c: 'y', fill: 'y', wd: 3 }, NP(2, 0, 'P', 'p', [0, -1.1]))] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。PがBC上にあるとき、△ABPの面積yを、xの式で表すと、どれでしょう。', { ft: 'normal' }),
      [{ t: 'y＝x' }, { t: 'y＝2x', ok: true }, { t: 'y＝3x' }, { t: 'y＝4x' }],
      { 0: [B('BPが、x cmだから、面積も、xだよ！', { fb: 'happy', up: true }), T('BPは、三角形の高さです。面積は、底辺×高さ÷2。4×x÷2＝2xです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('底辺は、ABの4cmです。BCの6cmでは、ありません。4×x÷2＝2xです。', { ft: 'normal' })],
        ok: [T('正解！ 底辺AB＝4、高さBP＝x。面積は、4×x÷2＝2x。y＝2xです。', { ft: 'happy' }), B('三角形は、÷2がつくんだったね！', { fb: 'star', up: true })],
        wrong: [T('三角形の面積は、÷2を、忘れずに。4×x÷2＝2xです。', { ft: 'normal' })] }),
    T('PがCに着くのは、6÷1＝6秒後です。BC上にいるのは、0≦x≦6のとき。このとき、y＝2xです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'BC上', text: 'y＝2x　（0≦x≦6）', t: 3.5 }] }),

    T('PがCを過ぎて、CD上に入ると、どうなるでしょう。図は、x＝8のときです。CP＝2cmです。', { clear: true, cols: [0.34, 0.66], part: 'CD上のとき', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'PがCD上にあるとき\n△ABPの面積は？', t: 4.0 }, Object.assign(f2, { prims: [] })],
      draw: [G('g2', RECT, { k: 'poly', pts: [[0, 4], [0, 0], [6, 2]], close: true, c: 'y', fill: 'y', wd: 3 }, NP(6, 2, 'P', 'p', [1.0, 0.2]), DS([0, 2], [6, 2], 'b'), LB(3, 2.4, '高さ 6cm', 'b', 24, 'middle'))] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。x＝8のとき、△ABPの面積は、いくつでしょう。底辺は、AB＝4cmです。', { ft: 'normal' }),
      [{ t: '16 cm²' }, { t: '24 cm²' }, { t: '8 cm²' }, { t: '12 cm²', ok: true }],
      { 0: [B('y＝2xに、x＝8を入れて、16だよ！', { fb: 'happy', up: true }), T('y＝2xが使えるのは、PがBC上にいる、0≦x≦6のときだけです。CD上では、ちがう式になります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('8は、xの値です。面積では、ありません。底辺4、高さ6で、4×6÷2＝12です。', { ft: 'normal' })],
        ok: [T('正解！ 高さは、ABからCDまでの距離で、6。面積は、4×6÷2＝12です。', { ft: 'happy' }), B('Pが動いても、高さは、変わらないんだね！', { fb: 'star', up: true })],
        wrong: [T('÷2を、忘れていませんか。4×6÷2＝12です。', { ft: 'normal' })] }),
    T('CD上では、底辺も高さも、変わりません。だから、面積は、いつも12。PがDに着くのは、6＋4＝10秒後です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'CD上', text: 'y＝12　（6≦x≦10）', t: 3.5 }] }),

    T('xとyの関係を、グラフにします。0≦x≦6では、y＝2xの直線。6≦x≦10では、y＝12の、横向きの直線です。', { clear: true, cols: [0.34, 0.66], part: '面積のグラフ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '式', text: 'y＝2x　（0≦x≦6）\ny＝12　（6≦x≦10）', t: 4.5 }, Object.assign(f3, { prims: [] })],
      draw: [G('g3', PLN, { k: 'poly', pts: [[0, 0], [6, 12], [10, 12]], c: 'p', wd: 3.8 }, PS([[6, 12]], 'y', 8), LB(1.0, 7.5, 'y＝2x', 'p', 26), LB(7.0, 11.2, 'y＝12', 'p', 26),
        LB(1.0, 13.9, '（cm²）', 'w', 22), LB(10.3, 0.8, '（秒）', 'w', 22, 'end'))] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。面積yが、10cm²になるのは、Pが出発してから、何秒後でしょう。', { ft: 'normal' }),
      [{ t: '20秒後' }, { t: '10秒後' }, { t: '5秒後', ok: true }, { t: '12秒後' }],
      { 1: [B('面積が10だから、10秒後だよ！', { fb: 'happy', up: true }), T('10は、面積yの値です。y＝2xに、y＝10を入れて、2x＝10。x＝5です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        0: [T('2x＝10の、xは、10を2で割って求めます。かけ算では、ありません。x＝5です。', { ft: 'normal' })],
        ok: [T('正解！ y＝10を、y＝2xに代入して、2x＝10。x＝5。5秒後です。', { ft: 'happy' }), B('ちょうど、動く時間の、半分だね！', { fb: 'star', up: true })],
        wrong: [T('y＝12は、6秒から10秒の間の、面積です。10cm²になるのは、y＝2xの部分で、x＝5です。', { ft: 'normal' })] }),
    T('グラフでも、y＝10のとき、x＝5です。では、面積が12cm²になるのは、いつでしょう。', { ft: 'normal', point: false,
      draw: [G('g3', DS([0, 10], [5, 10], 'b'), DS([5, 0], [5, 10], 'b'), PS([[5, 10]], 'b', 7))] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。面積が12cm²になるのは、どんなときでしょう。', { ft: 'normal' }),
      [{ t: '6〜10秒の間', ok: true }, { t: '6秒後のときだけ' }, { t: '10秒後のときだけ' }, { t: '12秒後' }],
      { 1: [B('y＝2xに、12を入れて、x＝6の、1回だけだよ！', { fb: 'happy', up: true }), T('x＝6は、たしかに、12cm²です。でも、そのあとも、Pは、CD上を動いて、面積は12のままです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('10秒は、PがDに着く時刻です。6秒から10秒まで、ずっと、12cm²です。', { ft: 'normal' })],
        ok: [T('正解！ グラフの横向きの部分が、y＝12です。6秒から10秒の間、ずっと、12cm²です。', { ft: 'happy' }), B('横向きの線は、変わらないってことだね！', { fb: 'star', up: true })],
        wrong: [T('12は、面積の値です。Pは、10秒後に、Dに着きます。12秒後は、ありません。', { ft: 'normal' })] }),
    T('まとめます。動く点の問題は、点が辺をまたぐところで、場合分けします。範囲ごとに式をつくり、グラフは、つなげます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '辺ごとに場合分け\n範囲ごとに式をつくる\nグラフは折れ線', t: 5.5 }] }),
    B('ぼくがPなら、Dに着いたら、おやつの時間にするよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
