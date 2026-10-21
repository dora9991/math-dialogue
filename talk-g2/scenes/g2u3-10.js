/* 中2 3章 一次関数　第10時「2点から、一次関数の式を求めよう」（例）。自作問題。
   消えた直線：2点 A（1，5）B（4，−1）→ 傾き（−1−5）÷（4−1）＝−2、5＝−2×1＋b より b＝7、y＝−2x＋7（Bで確かめ −2×4＋7＝−1）。
   類題1：（2，3）（6，11）→ 傾き8÷4＝2、3＝4＋b より b＝−1、y＝2x−1。
   類題2：（0，4）（3，−2）→ 切片4、傾き−6÷3＝−2、y＝−2x＋4。 */
(function () {
  const { T, B, Q, FIG, tbl } = KL;
  // 座標平面の図。pl＝[x0,y0,x1,y1]（目もりの範囲）、u＝1目もりのpx。view は w:h とそろえる。
  const fig = (id, pl, w, h, u) => {
    const cx = (pl[0] + pl[2]) / 2, cy = (pl[1] + pl[3]) / 2, hw = w / u / 2, hh = h / u / 2;
    return FIG(id, [cx - hw, cy - hh, cx + hw, cy + hh], w, h, [], { col: 1, plane: pl });
  };
  const G = (id, ...i) => ({ fig: id, items: i.flat(3) });
  const PLN = { k: 'plane', lab: 1, size: 19 };
  const NM = (x, y, name, c, dir) => ({ k: 'pt', at: [x, y], name, dir: dir || [0.8, 0.8], c: c || 'y', r: 7 });
  const LB = (x, y, text, c, size, anchor) => ({ k: 'label', at: [x, y], text, c: c || 'w', size: size || 26, anchor: anchor || 'start' });
  const DS = (a, b, c) => ({ k: 'seg', a, b, c: c || 'b', wd: 3.2, dash: true });
  const FN = (a, b, c, label, lat) => ({ k: 'fn', a, b, c, label, lat, lanchor: 'start', wd: 3.8, size: 26 });
  const f1 = fig('g1', [-1, -2, 6, 8], 520, 580, 46);

  KL.lesson({ id: 'g2u3-10', unit: '中2　一次関数', kick: '2年3章　第10時', title: '2点から、一次関数の式を求めよう', card: '2点から、一次関数の式を求めよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、グラフが通る2点から、一次関数の式を求める方法を、学びます。', { title: true, point: false, ft: 'happy' }),
    B('あっ、黒板の直線が、消えてる！ ぼくが、黒板消しで、消しちゃった！', { title: true, fb: 'surprised', up: true, fx: { b: 'sweat' } }),
    T('大丈夫です。通る点が2つ残っていれば、直線の式は、わかりますよ。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。直線が、2点A（1，5）と、B（4，−1）を通っています。この直線の式を、求めましょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '2点 A（1，5）B（4，−1）\nを通る直線の式は？', t: 4.5 }, Object.assign(f1, { prims: [] })],
      draw: [G('g1', PLN, NM(1, 5, 'A'), NM(4, -1, 'B'))] }),
    T('一次関数は、y＝ax＋b の形です。まず、傾きaを求めて、次に、切片bを求めます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '手順', text: '① 傾き a を求める\n② 切片 b を求める', t: 3.5 }] }),
    T('傾きは、変化の割合です。点Aから点Bまで、xは1から4へ、3増えます。', { ft: 'normal', draw: [G('g1', DS([1, 5], [4, 5], 'b'), LB(2.0, 5.6, '＋3', 'b'))] }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。そのとき、yは、5から−1に変わります。yの増加量は、いくつでしょう。', { ft: 'normal' }),
      [{ t: '6' }, { t: '−4' }, { t: '4' }, { t: '−6', ok: true }],
      { 0: [B('5と−1の、差だから、6だよ！', { fb: 'happy', up: true }), T('yは、減っています。減ったときの増加量は、マイナスです。−1−5＝−6です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('5−1と、計算していませんか。1はxの値で、yの値は−1です。増加量は、−1−5＝−6です。', { ft: 'normal' })],
        ok: [T('正解！ あとの値ひく前の値で、−1−5＝−6。yは、6減ったので、増加量は−6です。', { ft: 'happy' }), B('減ったときは、マイナスなんだね！', { fb: 'star', up: true })],
        wrong: [T('増加量は、あとの値ひく前の値で、−1−5＝−6です。たし算では、ありません。', { ft: 'normal' })] }),
    T('変化の割合は、yの増加量÷xの増加量です。−6÷3＝−2。この−2が、傾きaです。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '傾き', text: 'a＝−6÷3＝{{−2}}', t: 3.0 }],
      draw: [G('g1', DS([4, 5], [4, -1], 'p'), LB(4.25, 2.0, '−6', 'p'))] }),
    T('傾きが−2なので、式は、y＝−2x＋b。点Aを通るので、x＝1、y＝5を、代入します。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '代入', text: 'y＝−2x＋b\n5＝−2×1＋b', t: 3.5 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。5＝−2×1＋b を解くと、bは、いくつでしょう。', { ft: 'normal' }),
      [{ t: '7', ok: true }, { t: '5' }, { t: '3' }, { t: '−7' }],
      { 2: [B('5−2で、3だよ！', { fb: 'happy', up: true }), T('−2を、反対側に移すと、符号が変わって、＋2です。b＝5＋2＝7です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('bは、yの値とは、ちがいます。5＝−2＋b より、b＝5＋2＝7です。', { ft: 'normal' })],
        ok: [T('正解！ 5＝−2＋b より、b＝5＋2＝7。切片は、7です。', { ft: 'happy' }), B('傾きが−2で、切片が7だね！', { fb: 'star', up: true })],
        wrong: [T('bの符号は、そのままです。−2を移して、b＝5＋2＝7です。', { ft: 'normal' })] }),
    T('式は、y＝−2x＋7です。点Bでも、確かめましょう。x＝4のとき、−2×4＋7＝−1。ちゃんと、点Bを通ります。', { ft: 'happy', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '答え', text: 'y＝−2x＋{{7}}', t: 3.0 }],
      draw: [G('g1', FN(-2, 7, 'y', 'y＝−2x＋7', [1.7, 7.4]))] }),

    T('では、類題です。2点（2，3）と（6，11）を通る直線の式を、求めましょう。', { clear: true, cols: [0.34, 0.66], part: '類題に挑戦', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '類題', text: '2点（2，3）（6，11）\nを通る直線の式は？', t: 4.0 },
        tbl([['x', '2', '6'], ['y', '3', '11']], { style: 'font-size:44px; align-self:center; margin-top:14px', t: 1.0 }),
        { col: 1, type: 'text', size: 'lg', label: '手順', text: '① a＝（yの増加量）÷（xの増加量）\n② 1点を代入して、b を求める', t: 5.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。この直線の式は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'y＝2x＋1' }, { t: 'y＝2x−1', ok: true }, { t: 'y＝[[1/2]]x＋2' }, { t: 'y＝2x＋3' }],
      { 0: [T('3＝2×2＋b より、b＝3−4＝−1です。4−3＝1と、引く順番が、逆になっていませんか。', { ft: 'normal' })],
        2: [B('xが4増えて、yが8増える。だから、4÷8で、[[1/2]]だよ！', { fb: 'happy', up: true }), T('変化の割合は、yの増加量÷xの増加量です。8÷4＝2。割る順番が、逆です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 傾きは、8÷4＝2。3＝2×2＋b より、b＝−1。y＝2x−1です。', { ft: 'happy' }), B('傾きを出して、1点を代入すれば、いいんだね！', { fb: 'star', up: true })],
        wrong: [T('3は、点のyの値です。bは、3＝2×2＋b を解いて、−1です。', { ft: 'normal' })] }),
    T('もう1つ、類題です。今度は、x＝0の点が入っています。x＝0のときのyの値は、そのまま、切片です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '切片', text: 'x＝0 のときの y が b', t: 3.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。2点（0，4）と（3，−2）を通る直線の式は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'y＝2x＋4' }, { t: 'y＝−2x−2' }, { t: 'y＝−2x＋4', ok: true }, { t: 'y＝−[[1/2]]x＋4' }],
      { 0: [T('yは、4から−2へ、6減っています。傾きは、−6÷3＝−2です。符号に、気をつけましょう。', { ft: 'normal' })],
        1: [B('点（3，−2）だから、切片は−2だよ！', { fb: 'happy', up: true }), T('切片は、x＝0の点のyの値です。それは、点（0，4）の、4です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 切片は4。傾きは、−6÷3＝−2。y＝−2x＋4です。', { ft: 'happy' }), B('x＝0の点があると、切片は、すぐにわかるね！', { fb: 'star', up: true })],
        wrong: [T('傾きは、yの増加量÷xの増加量で、−6÷3＝−2です。逆に、割っていませんか。', { ft: 'normal' })] }),
    T('2点から式を求めるときは、まず、傾きを出します。次に、1点を代入して、切片を求めます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '① 傾き＝yの増加量÷xの増加量\n② 1点を代入して b を求める', t: 5.5 }] }),
    T('ほかに、2点の座標を、y＝ax＋b に代入して、連立方程式を解く方法もあります。どちらでも、同じ式になります。', { ft: 'normal', point: false }),
    B('黒板の直線も、もとどおり！ 消した犯人は、ぼくだけど！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
