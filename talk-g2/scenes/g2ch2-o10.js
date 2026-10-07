/* 中2 2章 連立方程式　応用10「解から係数を決める」。自作問題。
   ax＋by＝1、bx−ay＝8 の解が x＝2、y＝−1。代入して 2a−b＝1、a＋2b＝8 → a＝2、b＝3。もとの式は 2x＋3y＝1、3x−2y＝8（解 x＝2、y＝−1 で確かめ）。
   ※ ax・by・bx・ay のように文字が並ぶ行は say でカタカナ読みにした。 */
(function () {
  const { T, B, Q, tbl } = KL;
  const sys = [['式①', 'ax＋by＝1'], ['式②', 'bx−ay＝8'], ['解', 'x＝2、y＝−1']];
  const sab = [['式①', '2a−b＝1'], ['式②', 'a＋2b＝8']];

  KL.lesson({ id: 'g2ch2-o10', unit: '中2　連立方程式', kick: '2年2章　応用10', title: '解から係数を決める', card: '解から係数を決める', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、解が、わかっているとき、式の中の、aとbを、求めます。', { title: true, point: false, ft: 'happy' }),
    B('aとbが、どっちも、わからない！ 名探偵でも、手がかりがないよ！', { title: true, fb: 'confused', up: true }),
    T('手がかりは、あります。解が、わかっていることです。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。連立方程式 ax＋by＝1、bx−ay＝8 の解は、x＝2、y＝−1です。aとbの値を、求めましょう。', { part: '問題を読もう', ft: 'normal',
      say: 'もんだいです。れんりつほうていしき、エーエックス たす ビーワイ イコール 1、ビーエックス ひく エーワイ イコール 8、のかいは、エックス イコール 2、ワイ イコール マイナス1です。エーとビーのあたいを、もとめましょう。',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '解は x＝2、y＝−1\n求めるのは aとb', t: 4.0 }, tbl(sys, { style: 'font-size:50px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('解は、式を、成り立たせる組です。だから、解を、式に入れても、成り立つはずです。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。x＝2、y＝−1を、1つ目の式の、ax＋by＝1に、代入すると、どうなるでしょう。', { ft: 'normal',
        say: 'もんだいです。エックス イコール 2、ワイ イコール マイナス1を、1つめのしきの、エーエックス たす ビーワイ イコール 1に、だいにゅうすると、どうなるでしょう。' }),
      [{ t: '2a−b＝1', ok: true }, { t: '2a＋b＝1' }, { t: '−a＋2b＝1' }, { t: 'a−b＝1' }],
      { 1: [B('yは−1だけど、かけ算だから、プラスでしょ？', { fb: 'happy', up: true }), T('bに、−1を、かけるので、b×(−1)＝−bです。マイナスは、消えません。2a−bです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('xの2は、aにかかります。yの−1は、bにかかります。a×2＋b×(−1)で、2a−bです。xとyが、逆になっています。', { ft: 'normal' })],
        3: [T('xは2なので、aは、2倍になります。2a−bです。2を、かけ忘れています。', { ft: 'normal' })],
        ok: [T('正解！ a×2＋b×(−1)＝2a−b。2a−b＝1です。', { ft: 'happy' }), B('マイナスの数は、かっこをつけて、入れるんだね！', { fb: 'star', up: true })],
        wrong: [T('a×2＋b×(−1)＝2a−bです。2a−b＝1です。', { ft: 'normal' })] }),
    T('同じように、2つ目の式にも、解を入れます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '式①に代入', text: '2a−b＝{{1}}', t: 3.0 }] }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。x＝2、y＝−1を、2つ目の式の、bx−ay＝8に、代入すると、どうなるでしょう。', { ft: 'normal',
        say: 'もんだいです。エックス イコール 2、ワイ イコール マイナス1を、2つめのしきの、ビーエックス ひく エーワイ イコール 8に、だいにゅうすると、どうなるでしょう。' }),
      [{ t: 'a＋2b＝8', ok: true }, { t: '−a＋2b＝8' }, { t: '2a−b＝8' }, { t: '−a−2b＝8' }],
      { 1: [B('ひき算の、マイナスは、そのまま、残すでしょ？ だから、−a！', { fb: 'happy', up: true }), T('ひく、a×(−1)です。マイナスどうしで、プラスになって、＋aです。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [B('1つ目と、同じ形で、いいでしょ？', { fb: 'confused', up: true }), T('2つ目の式は、xにbが、yにaが、かかっています。1つ目とは、aとbが、入れかわっています。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('b×2は、＋2bです。ひく、a×(−1)は、＋aです。どちらも、プラスです。', { ft: 'normal' })],
        ok: [T('正解！ b×2−a×(−1)＝2b＋a。a＋2b＝8です。', { ft: 'happy' }), B('マイナスと、マイナスで、プラスだね！', { fb: 'star', up: true })],
        wrong: [T('b×2−a×(−1)＝2b＋aです。a＋2b＝8です。', { ft: 'normal' })] }),
    T('これで、aとbの、連立方程式が、できました。2a−b＝1と、a＋2b＝8です。', { clear: true, cols: [0.34, 0.66], part: 'aとbの連立方程式', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'aとbの式', text: '2a−b＝1\na＋2b＝8', t: 4.0 }, tbl(sab, { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('bを消しましょう。1つ目の式を、2倍すると、4a−2b＝2です。これと、2つ目の式を、たします。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '1つ目×2', text: '4a−2b＝2', t: 3.0 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。4a−2b＝2と、a＋2b＝8を、たして、aを求めます。aは、いくつでしょう。', { ft: 'normal' }),
      [{ t: 'a＝2', ok: true }, { t: 'a＝3' }, { t: 'a＝[[9/5]]' }, { t: 'a＝10' }],
      { 1: [T('3は、bの値です。aとbを、取りちがえていませんか。5a＝10を、5でわって、a＝2です。', { ft: 'normal' })],
        2: [B('右側は、1＋8で、9！ だから、5a＝9！', { fb: 'happy', up: true }), T('1つ目の式を、2倍したので、右側も、2倍して、2です。2＋8＝10で、5a＝10、a＝2です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('5a＝10の、あとに、5でわるのを、わすれています。a＝10÷5＝2です。', { ft: 'normal' })],
        ok: [T('正解！ 4a＋a＝5a、−2b＋2b＝0、2＋8＝10。5a＝10で、a＝2です。', { ft: 'happy' }), B('bが、消えたね！', { fb: 'star', up: true })],
        wrong: [T('たすと、5a＝10です。a＝2です。', { ft: 'normal' })] }),
    T('a＝2が、わかりました。2a−b＝1に、入れて、bを求めます。2×2−b＝1、つまり、4−b＝1です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'たし算', text: '5a＝10\na＝{{2}}', t: 3.0 }, { col: 0, type: 'text', size: 'xs', label: '式①に代入', text: '2×2−b＝1\n4−b＝1', t: 3.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('最後の問題です。4−b＝1を、解きましょう。bは、いくつでしょう。', { ft: 'happy' }),
      [{ t: 'b＝3', ok: true }, { t: 'b＝5' }, { t: 'b＝−3' }, { t: 'b＝2' }],
      { 1: [B('4を、右に移して、1＋4で、5！', { fb: 'happy', up: true }), T('4を、右へ移すと、−4です。−b＝1−4＝−3。b＝3です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('−b＝−3の、両側を、−1でわって、b＝3です。マイナスの符号も、とります。', { ft: 'normal' })],
        3: [T('2は、aの値です。bは、4−b＝1を、解いて、3です。', { ft: 'normal' })],
        ok: [T('正解！ −b＝1−4＝−3。b＝3です。a＝2、b＝3です。', { ft: 'happy' }), B('a＝2、b＝3だね！', { fb: 'star', up: true })],
        wrong: [T('4−b＝1より、−b＝−3。b＝3です。', { ft: 'normal' })] }),
    T('a＝2、b＝3を、もとの式に入れると、2x＋3y＝1と、3x−2y＝8です。解で、確かめます。', { clear: true, cols: [0.34, 0.66], part: '答えを確かめよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'こたえ', text: 'a＝2、b＝3', t: 3.0 }, { col: 0, type: 'text', size: 'xs', label: '確かめ', text: '2×2＋3×(−1)＝1　○\n3×2−2×(−1)＝8　○', t: 4.5 }, tbl([['式①', '2x＋3y＝1'], ['式②', '3x−2y＝8'], ['解', '{{x＝2、y＝−1}}']], { style: 'font-size:50px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('解がわかっているときは、解を、式に入れます。すると、aとbの、連立方程式が、できます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '解を式に代入\n→ aとbの連立方程式\n→ 解いてa、bを求める', t: 5.5 }] }),
    B('名探偵のカギは、解だったんだね！ 手がかりは、ちゃんと、あったよ！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
