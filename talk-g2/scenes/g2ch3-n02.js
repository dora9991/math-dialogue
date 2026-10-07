/* 中2 3章 一次関数　入試レベル2「動く点と面積のグラフ」。自作問題。
   長方形 ABCD（AB＝6、AD＝4）。点 P は A を出発し B→C→D と毎秒2cmで進む。x 秒後の △APD の面積を y cm²。
   0≦x≦3：y＝4x ／ 3≦x≦5：y＝12 ／ 5≦x≦8：y＝−4x＋32（DP＝16−2x）。y＝6 になるのは x＝1.5 と 6.5。
   1ページ目は長方形の図、2ページ目（clear）はグラフ。 */
(function () {
  const { T, B, Q, FIG } = KL;
  // 1ページ目：長方形（A（0，0）B（6，0）C（6，4）D（0，4）、1cm＝80px）
  const fr = FIG('r', [-1.5, -1.3, 7.5, 5.5], 720, 544, [], { col: 1 });
  const R = (...i) => ({ fig: 'r', items: i.flat(3) });
  const rect = [{ k: 'poly', pts: [[0, 0], [6, 0], [6, 4], [0, 4]], close: true, c: 'w', wd: 3.4 },
    { k: 'pt', at: [0, 0], name: 'A', dir: [-0.8, -0.8], c: 'y', r: 5 }, { k: 'pt', at: [6, 0], name: 'B', dir: [0.8, -0.8], c: 'y', r: 5 },
    { k: 'pt', at: [6, 4], name: 'C', dir: [0.8, 0.8], c: 'y', r: 5 }, { k: 'pt', at: [0, 4], name: 'D', dir: [-0.8, 0.8], c: 'y', r: 5 },
    { k: 'label', at: [3, -0.65], text: '6cm', c: 'w', size: 26 }, { k: 'label', at: [-0.35, 2], text: '4cm', c: 'w', size: 26, anchor: 'end' },
    { k: 'poly', pts: [[0.3, 0.3], [5.7, 0.3], [5.7, 3.7], [0.3, 3.7]], c: 'b', wd: 2.4, dash: true }];
  const posP = (p, label) => R({ k: 'poly', pts: [[0, 0], p, [0, 4]], close: true, c: 'g', fill: 'g', wd: 3, temp: true }, { k: 'pt', at: p, name: 'P', dir: label, c: 'p', r: 6.5, temp: true });
  // 2ページ目：グラフ（横 1目もり＝1秒、縦 1目もり＝1cm²）
  const U = 40;
  const fg = FIG('g', [-46 / U, -44 / U, 8 + 58 / U, 12 + 58 / U], Math.round(8 * U + 104), Math.round(12 * U + 102), [], { col: 1, plane: [0, 0, 8, 12] });
  const G = (...i) => ({ fig: 'g', items: i.flat(3) });
  const lab = (x, y, text, c, o) => Object.assign({ k: 'label', at: [x, y], text, c, size: 24, anchor: 'start' }, o || {});
  const pts = (list, c) => ({ k: 'pts', list, c, r: 6.5 });
  const dash = (a, b, c) => ({ k: 'seg', a, b, c, wd: 2.6, dash: true });

  KL.lesson({ id: 'g2ch3-n02', unit: '中2　一次関数', kick: '2年3章　入試レベル2', title: '【入試】動く点と面積のグラフ', card: '【入試】動く点と面積のグラフ', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、入試レベルの問題です。動く点と、面積のグラフを、調べます。', { title: true, point: false, ft: 'happy' }),
    B('動く点！ ぼくが、長方形の上を走るんだね！ よーい、どん！', { title: true, fb: 'surprised', up: true }),
    T('走るのは、点 P です。辺の上を進むときの、面積の変わり方を、調べましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。長方形 ABCD で、AB は6センチ、AD は4センチです。点 P は、A を出発して、B、C を通り、D まで、毎秒2センチで進みます。x 秒後の、三角形 APD の面積を、y 平方センチメートルとします。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: 'AB＝6cm，AD＝4cm\nP：A→B→C→D\n毎秒2cmで進む\n△APD の面積 y cm²', t: 5.5 }, Object.assign(fr, { prims: [] })],
      draw: [R(rect)] }),
    T('点 P がどの辺にいるかで、式が変わります。辺ごとに、分けて考えます。まず、辺 AB の上です。', { ft: 'normal', point: false, draw: [posP([2, 0], [0, -1])] }),

    /* ---------- 問1：AP の長さ ---------- */
    Q('q1', T('問題です。点 P が辺 AB の上にあるとき、AP の長さは、x を使って、どう表せるでしょう。', { ft: 'normal' }),
      [{ t: '2x cm', ok: true }, { t: 'x cm' }, { t: '[[x/2]] cm' }, { t: 'x＋2 cm' }],
      { 1: [B('1秒に1センチで、x センチだよ！', { fb: 'happy', up: true }), T('毎秒2センチなので、x 秒間に進む道のりは、2×x＝2x センチです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('道のりは、速さ×時間です。割るのではなく、2×x＝2x センチです。', { ft: 'normal' })],
        3: [T('足すのではなく、かけます。道のり＝速さ×時間で、2×x＝2x センチです。', { ft: 'normal' })],
        ok: [T('正解！ 道のりは、速さ×時間。AP＝2×x＝2x センチです。', { ft: 'happy' }), B('道のりは、速さ×時間だね！', { fb: 'star', up: true })],
        wrong: [T('速さ2×時間 x で、AP＝2x センチです。', { ft: 'normal' })] }),
    T('P が B に着くのは、6÷2＝3秒後です。0≦x≦3 のとき、△APD は、底辺が AD、高さが AP の三角形です。', { ft: 'normal', point: false, say: 'P が B に着くのは、6わる2で、3秒後です。0 以上 x 3 以下 のとき、△APD は、底辺が AD、高さが AP の三角形です。',
      add: [{ col: 0, type: 'text', size: 'xs', label: 'AB 上', text: 'AP＝2x cm\n0≦x≦3', t: 3.5 }] }),

    /* ---------- 問2：AB 上の式 ---------- */
    Q('q2', T('問題です。0≦x≦3 のとき、y を x の式で表すと、どれでしょう。', { ft: 'normal' }),
      [{ t: 'y＝4x', ok: true }, { t: 'y＝8x' }, { t: 'y＝2x' }, { t: 'y＝x' }],
      { 1: [B('底辺4、高さ2x で、4×2x＝8x だよ！', { fb: 'happy', up: true }), T('三角形の面積は、底辺×高さ÷2です。÷2を忘れずに、4×2x÷2＝4x です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('2x は、AP の長さです。面積は、AD の4をかけて、2で割ります。4×2x÷2＝4x です。', { ft: 'normal' })],
        3: [T('AD の4を、かけ忘れています。4×2x÷2＝4x です。', { ft: 'normal' })],
        ok: [T('正解！ AD×AP÷2＝4×2x÷2＝4x です。', { ft: 'happy', say: '正解！ AD かける AP わる 2 は、4 かける 2x わる 2 で、4x です。' }), B('x が1増えると、面積は4増えるんだね！', { fb: 'star', up: true })],
        wrong: [T('4×2x÷2＝4x です。', { ft: 'normal' })] }),
    T('次は、P が辺 BC の上にあるときです。P は、B から C へ進みます。', { ft: 'normal', point: false, draw: [posP([6, 2], [0.8, 0])] }),

    /* ---------- 問3：BC 上の面積 ---------- */
    Q('q3', T('問題です。P が辺 BC の上にあるとき、y は、どうなるでしょう。', { ft: 'normal' }),
      [{ t: 'y＝12', ok: true }, { t: 'y＝4x' }, { t: 'y＝6' }, { t: 'y＝24' }],
      { 1: [B('進んでいるから、面積も、増え続けるでしょ？', { fb: 'happy', up: true }), T('P が BC の上を動いても、P から AD までの距離は、いつも6センチです。底辺も高さも同じなので、面積は一定です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('÷2を、2回しています。4×6÷2＝12 です。', { ft: 'normal' })],
        3: [T('÷2を、忘れています。4×6÷2＝12 です。', { ft: 'normal' })],
        ok: [T('正解！ P から AD までの距離は、いつも6。4×6÷2＝12。面積は、一定の12です。', { ft: 'happy' }), B('面積が、止まるんだね！', { fb: 'star', up: true })],
        wrong: [T('底辺4、高さ6で、4×6÷2＝12 です。', { ft: 'normal' })] }),
    T('B から C までは、4÷2＝2秒です。3≦x≦5 のとき、y＝12 です。次は、辺 CD の上です。A から D までは、全部で16センチなので、DP＝16−2x センチです。', { ft: 'normal', point: false,
      say: 'B から C までは、4わる2で、2秒です。3 以上 x 5 以下 のとき、ワイ イコール 12 です。次は、辺 CD の上です。A から D までは、全部で16センチなので、DP は、16 ひく 2x センチです。',
      add: [{ col: 0, type: 'text', size: 'xs', label: 'BC・CD 上', text: 'y＝12（3≦x≦5）\nDP＝16−2x cm', t: 4.0 }], draw: [posP([4, 4], [0, 1])] }),

    /* ---------- 問4：CD 上の式 ---------- */
    Q('q4', T('問題です。5≦x≦8 のとき、y を x の式で表すと、どれでしょう。底辺は AD、高さは DP です。', { ft: 'normal' }),
      [{ t: 'y＝−4x＋32', ok: true }, { t: 'y＝4x−20' }, { t: 'y＝−2x＋32' }, { t: 'y＝−4x＋12' }],
      { 1: [B('C から P までの、2x−10 を、使うんじゃないの？', { fb: 'happy', up: true }), T('高さは、D から P までの DP です。DP は、16−2x です。CP では、ありません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('DP は、16−2x です。2をかけ忘れて、16−x としています。4×（16−2x）÷2＝32−4x です。', { ft: 'normal' })],
        3: [T('x＝5 のとき、y は12のはずです。−4×5＋12＝−8 では、合いません。切片は32です。', { ft: 'normal' })],
        ok: [T('正解！ DP＝16−2x。y＝4×（16−2x）÷2＝32−4x です。x＝5 で12、x＝8 で0になります。', { ft: 'happy' }), B('ちゃんと、前の12に、つながるんだね！', { fb: 'star', up: true })],
        wrong: [T('y＝4×（16−2x）÷2＝32−4x です。', { ft: 'normal' })] }),

    /* ---------- 2ページ目：グラフ ---------- */
    T('3つの範囲を、グラフにまとめます。0≦x≦3 は y＝4x。3≦x≦5 は y＝12。5≦x≦8 は y＝−4x＋32 です。', { clear: true, cols: [0.34, 0.66], part: 'グラフにまとめよう', ft: 'normal',
      say: '3つの範囲を、グラフにまとめます。0 以上 x 3 以下 は、ワイ イコール 4x。3 以上 x 5 以下 は、ワイ イコール 12。5 以上 x 8 以下 は、ワイ イコール マイナス4x プラス 32 です。',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '式と変域', text: '0≦x≦3：y＝4x\n3≦x≦5：y＝12\n5≦x≦8：y＝−4x＋32', t: 6.0 }, Object.assign(fg, { prims: [] })],
      draw: [G({ k: 'plane', lab: 1, size: 18 }, { k: 'seg', a: [0, 0], b: [3, 12], c: 'y', wd: 4 }, lab(1.8, 5.2, 'y＝4x', 'y', {}), { k: 'seg', a: [3, 12], b: [5, 12], c: 'p', wd: 4 }, lab(4, 12.55, 'y＝12', 'p', { anchor: 'middle' }), { k: 'seg', a: [5, 12], b: [8, 0], c: 'b', wd: 4 }, lab(6.3, 9, 'y＝−4x＋32', 'b', {}), pts([[0, 0], [3, 12], [5, 12], [8, 0]], 'w'), dash([3, 12], [3, 0], 'd'), dash([5, 12], [5, 0], 'd'))] }),

    /* ---------- 問5：y＝6 ---------- */
    Q('q5', T('最後の問題です。三角形 APD の面積が、6平方センチメートルになるのは、出発から何秒後でしょう。', { ft: 'happy', draw: [G(dash([0, 6], [8, 6], 'g'))] }),
      [{ t: '1.5秒後と6.5秒後', ok: true }, { t: '1.5秒後だけ' }, { t: '6.5秒後だけ' }, { t: '3秒後' }],
      { 1: [B('4x＝6 を解いて、1.5秒後だけでしょ？', { fb: 'happy', up: true }), T('グラフを見ると、y＝6 の線は、2か所で交わります。5≦x≦8 でも、−4x＋32＝6 より、x＝6.5 です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('0≦x≦3 でも、4x＝6 より、x＝1.5 です。y＝6 になるのは、2回あります。', { ft: 'normal' })],
        3: [T('3秒後は、y＝12 です。12は、6の2倍で、条件に合いません。', { ft: 'normal' })],
        ok: [T('正解！ 4x＝6 より、x＝1.5。−4x＋32＝6 より、x＝6.5。どちらも、変域の中です。', { ft: 'happy', draw: [G(pts([[1.5, 6], [6.5, 6]], 'g'), dash([1.5, 6], [1.5, 0], 'g'), dash([6.5, 6], [6.5, 0], 'g'), lab(1.5, 0, '1.5', 'g', { anchor: 'middle', dy: 40 }), lab(6.5, 0, '6.5', 'g', { anchor: 'middle', dy: 40 }))] }), B('面積6は、行きと帰りで、2回あるんだね！', { fb: 'star', up: true })],
        wrong: [T('4x＝6 より1.5秒後、−4x＋32＝6 より6.5秒後。2回あります。', { ft: 'normal' })] }),

    T('まとめです。グラフは折れ線で、点が頂点 B と C を通るところで、式が変わります。範囲ごとに式を立て、変域も書いて答えます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '頂点で式が変わる\n範囲ごとに式を立てる\n変域も書いて答える', t: 5.0 }] }),
    B('動く点も、範囲ごとに分ければ、こわくないね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
