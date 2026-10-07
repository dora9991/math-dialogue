/* 中2 2章 連立方程式　応用2「加減法：そのままたす・ひく」。自作問題。
   4x＋3y＝17、4x−y＝5。xの係数がそろっている→ひく。3y−(−y)＝4y、17−5＝12、y＝3。4x−3＝5、x＝2。確かめ 4×2＋3×3＝17。 */
(function () {
  const { T, B, Q, tbl } = KL;
  const sys = [['式①', '4x＋3y＝17'], ['式②', '4x−y＝5']];

  KL.lesson({ id: 'g2ch2-o02', unit: '中2　連立方程式', kick: '2年2章　応用2', title: '加減法：そのままたす・ひく', card: '加減法：そのままたす・ひく', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、連立方程式の、加減法を、学びます。', { title: true, point: false, ft: 'happy' }),
    B('かげんほう？ 味つけの、かげんかな？ 塩を、ひとつまみ！', { title: true, fb: 'think', up: true }),
    T('味つけでは、ありません。式を、たしたり、ひいたりして、文字を1つ、消す方法です。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。この連立方程式を、加減法で、解きましょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'めあて', text: '文字を1つ消して\n解を求めよう', t: 4.0 }, tbl(sys, { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('よく見ると、xの係数が、どちらも4で、そろっています。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。xを消すには、2つの式を、たすでしょうか、ひくでしょうか。', { ft: 'normal' }),
      [{ t: '2つの式をたす' }, { t: '2つの式をひく', ok: true }, { t: '上の式だけ2倍する' }, { t: '下の式だけ3倍する' }],
      { 0: [B('たし算の方が、かんたんだから、たす！', { fb: 'happy', up: true }), T('たすと、4x＋4xで、8xになり、xが消えません。同じ符号なので、ひきます。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('2倍すると、係数が、8と4になって、ずれてしまいます。すでに、そろっているので、そのままひきます。', { ft: 'normal' })],
        3: [T('3倍する必要は、ありません。xの係数は、すでに、4と4です。ひけば、消えます。', { ft: 'normal' })],
        ok: [T('正解！ 4x−4x＝0で、xが消えます。ひき算です。', { ft: 'happy' }), B('同じ数だから、ひけば、ゼロだね！', { fb: 'star', up: true })],
        wrong: [T('xの係数が、どちらも4なので、ひき算で、xが消えます。', { ft: 'normal' })] }),
    T('1つ目の式から、2つ目の式を、ひきます。式の左側どうし、右側どうしを、ひきます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'ひき算', text: '（4x＋3y）−（4x−y）\n＝17−5', t: 4.0 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。yの項は、3yから、−yを、ひきます。何になるでしょう。', { ft: 'normal' }),
      [{ t: '4y', ok: true }, { t: '2y' }, { t: '−4y' }, { t: '3y' }],
      { 1: [B('3y−yだから、2y！', { fb: 'happy', up: true }), T('ひくのは、−yです。マイナスのものを、ひくと、プラスになります。3y＋y＝4yです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('ひく順番は、1つ目の式から2つ目の式です。3y＋y＝4yで、プラスです。', { ft: 'normal' })],
        3: [T('−yの項も、ひき算の相手です。消えずに、3y＋yで、4yになります。', { ft: 'normal' })],
        ok: [T('正解！ 3y−（−y）＝3y＋y＝4yです。', { ft: 'happy' }), B('マイナスを、ひくと、プラスなんだね！', { fb: 'star', up: true })],
        wrong: [T('−yをひくので、3y＋y＝4yです。', { ft: 'normal' })] }),
    T('これで、左側は、4yになりました。次は、右側です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'yの項', text: '3y−（−y）＝{{4y}}', t: 3.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。右側は、17から、5を、ひきます。4y＝いくつになるでしょう。', { ft: 'normal' }),
      [{ t: '4y＝12', ok: true }, { t: '4y＝22' }, { t: '4y＝−12' }, { t: '4y＝17' }],
      { 1: [B('右側は、17＋5で、22でしょ？', { fb: 'happy', up: true }), T('左側をひいたのだから、右側も、ひきます。17−5＝12です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('ひく順番が、ぎゃくです。1つ目の式から2つ目の式なので、17−5＝12です。', { ft: 'normal' })],
        3: [B('右側は、そのまま、17でしょ？', { fb: 'confused', up: true }), T('左側をひいたら、右側も、必ず、ひきます。17−5＝12です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        ok: [T('正解！ 17−5＝12。4y＝12です。', { ft: 'happy' }), B('左も右も、同じ順番で、ひくんだね！', { fb: 'star', up: true })],
        wrong: [T('左側をひいたら、右側も、ひきます。17−5＝12です。', { ft: 'normal' })] }),
    T('4y＝12より、y＝3です。次は、y＝3を、2つ目の式に入れて、xを求めます。', { clear: true, cols: [0.34, 0.66], part: 'xを求めよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'わかったこと', text: '4y＝12\ny＝{{3}}', t: 3.5 }, { col: 0, type: 'text', size: 'xs', label: '式②に代入', text: '4x−3＝5', t: 3.0 }, tbl(sys, { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。4x−3＝5を、解きましょう。xは、いくつでしょう。', { ft: 'normal' }),
      [{ t: 'x＝2', ok: true }, { t: 'x＝[[1/2]]' }, { t: 'x＝8' }, { t: 'x＝3' }],
      { 1: [B('−3を、右に移して、5−3で、2！ 4x＝2！', { fb: 'happy', up: true }), T('−3を、右へ移すと、＋3です。4x＝5＋3＝8です。ひき算では、ありません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('4x＝8の、あとに、4でわるのを、わすれています。x＝8÷4＝2です。', { ft: 'normal' })],
        3: [T('yが3なので、xも3と、思っていませんか。4x−3＝5を解くと、x＝2です。', { ft: 'normal' })],
        ok: [T('正解！ 4x＝5＋3＝8。x＝2です。', { ft: 'happy' }), B('x＝2、y＝3だね！', { fb: 'star', up: true })],
        wrong: [T('4x−3＝5より、4x＝8。x＝2です。', { ft: 'normal' })] }),
    T('使わなかった1つ目の式に、x＝2、y＝3を入れて、確かめます。4×2＋3×3＝8＋9＝17で、成り立ちます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '確かめ', text: '4×2＋3×3＝17　○', t: 3.5 }] }),
    T('消したい文字の係数が同じなら、ひき算。反対の符号なら、たし算です。ひくときは、右側も、ひきます。', { clear: true, cols: [0.34, 0.66], part: 'まとめ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'こたえ', text: 'x＝2、y＝3', t: 3.0 }, { col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '係数が同じ→ひく\n反対の符号→たす\n右側も同じ計算', t: 5.0 }, tbl(sys.concat([['解', '{{x＝2、y＝3}}']]), { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),
    B('ひき算も、ていねいにやれば、こわくないね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
