/* 中2 2章 連立方程式　応用6「A＝B＝C の形の連立方程式」。自作問題。
   2x＋y＝x＋3y＝15。A＝2x＋y、B＝x＋3y、C＝15。A＝C、B＝C で 2x＋y＝15、x＋3y＝15 → x＝6、y＝3。（A＝B、B＝C でも x＝2y、5y＝15、y＝3、x＝6）確かめ 2×6＋3＝15、6＋3×3＝15。 */
(function () {
  const { T, B, Q, tbl } = KL;
  const abc = [['A', '2x＋y'], ['B', 'x＋3y'], ['C', '15']];
  const sys = [['式①', '2x＋y＝15'], ['式②', 'x＋3y＝15']];

  KL.lesson({ id: 'g2ch2-o06', unit: '中2　連立方程式', kick: '2年2章　応用6', title: 'A＝B＝C の形の連立方程式', card: 'A＝B＝C の形の連立方程式', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、イコールが、2つある、連立方程式です。', { title: true, point: false, ft: 'happy' }),
    B('イコールが、2つ！ なんだか、お得な感じ！', { title: true, fb: 'star', up: true }),
    T('お得かどうかは、解いてみてから、決めましょう。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('問題です。2x＋y＝x＋3y＝15を、解きましょう。', { part: '問題を読もう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '問題', text: '2x＋y＝x＋3y＝15\nを解こう', t: 4.0 }, tbl(abc, { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('左から、2x＋yをA、x＋3yをB、15をCとよびます。A＝B＝Cの形です。', { ft: 'normal', point: false }),

    /* ---------- 問1 ---------- */
    Q('q1', T('問題です。A＝B＝Cから、連立方程式を、つくります。式は、何本つくればよいでしょう。', { ft: 'normal' }),
      [{ t: '1本' }, { t: '2本', ok: true }, { t: '3本' }, { t: '4本' }],
      { 0: [B('イコールで、全部つながっているから、1本でしょ？', { fb: 'happy', up: true }), T('1本では、xとyの、2つの文字を、決められません。式は、2本、必要です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [B('A＝B、B＝C、A＝C。ぜんぶ書くよ！ 多い方が、安心！', { fb: 'happy', up: true }), T('3本目は、ほかの2本から、自然にできます。2本あれば、足ります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        3: [T('式が、多すぎます。同じ内容の式が、ふえるだけです。文字が2つなので、2本です。', { ft: 'normal' })],
        ok: [T('正解！ 文字が、xとyの2つなので、式は、2本です。', { ft: 'happy' }), B('イコールは2つでも、式は2本なんだね！', { fb: 'star', up: true })],
        wrong: [T('文字が2つなので、必要な式は、2本です。', { ft: 'normal' })] }),
    T('2本は、A＝B、B＝C、A＝Cの、3つの中から、選びます。ただし、同じ意味の式を、2回使っては、いけません。', { ft: 'normal', point: false }),

    /* ---------- 問2 ---------- */
    Q('q2', T('問題です。連立方程式として、使える組は、どれでしょう。', { ft: 'normal' }),
      [{ t: 'A＝C と B＝C', ok: true }, { t: 'A＝B と B＝A' }, { t: 'A＝C と C＝A' }, { t: 'B＝C と C＝B' }],
      { 1: [B('AとBの、両方を使うから、いいでしょ？', { fb: 'happy', up: true }), T('B＝Aは、A＝Bの、左と右を、入れかえただけです。同じ式です。2回使っても、新しいことは、わかりません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('C＝Aは、A＝Cを、ひっくり返しただけです。同じ式を、2回使っています。', { ft: 'normal' })],
        3: [T('C＝Bも、B＝Cを、ひっくり返しただけです。同じ式を、2回使っています。', { ft: 'normal' })],
        ok: [T('正解！ A＝CとB＝Cは、ちがう式です。A＝BとB＝Cの組でも、使えます。', { ft: 'happy' }), B('ちがう式を、2本、選ぶんだね！', { fb: 'star', up: true })],
        wrong: [T('A＝CとB＝Cのように、ちがう式を、2本選びます。', { ft: 'normal' })] }),
    T('では、A＝CとB＝Cで、解きます。2x＋y＝15と、x＋3y＝15です。', { clear: true, cols: [0.34, 0.66], part: '解いてみよう', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: '使う式', text: 'A＝C　2x＋y＝15\nB＝C　x＋3y＝15', t: 4.0 }, tbl(sys, { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('1つ目の式を、3倍すると、yの係数が、そろいます。6x＋3y＝45です。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: '式①×3', text: '6x＋3y＝45', t: 2.5 }] }),

    /* ---------- 問3 ---------- */
    Q('q3', T('問題です。6x＋3y＝45から、x＋3y＝15を、ひきます。xは、いくつになるでしょう。', { ft: 'normal' }),
      [{ t: 'x＝6', ok: true }, { t: 'x＝12' }, { t: 'x＝−6' }, { t: 'x＝30' }],
      { 1: [B('右側は、45＋15で、60だよ！', { fb: 'happy', up: true }), T('3yを消すには、ひき算です。右側も、ひきます。45−15＝30で、5x＝30、x＝6です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('ひく順番が、ぎゃくです。6x−x＝5x、45−15＝30で、5x＝30です。', { ft: 'normal' })],
        3: [T('5x＝30の、あとに、5でわるのを、わすれています。x＝30÷5＝6です。', { ft: 'normal' })],
        ok: [T('正解！ 6x−x＝5x、45−15＝30。5x＝30で、x＝6です。', { ft: 'happy' }), B('3yが、消えたね！', { fb: 'star', up: true })],
        wrong: [T('ひくと、5x＝30です。x＝6です。', { ft: 'normal' })] }),
    T('x＝6が、わかりました。次は、yです。2x＋y＝15に、x＝6を、入れます。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'text', size: 'xs', label: 'ひき算', text: '5x＝30\nx＝{{6}}', t: 3.0 }, { col: 0, type: 'text', size: 'xs', label: '式①に代入', text: '2×6＋y＝15', t: 3.0 }] }),

    /* ---------- 問4 ---------- */
    Q('q4', T('問題です。2×6＋y＝15を、解きましょう。yは、いくつでしょう。', { ft: 'normal' }),
      [{ t: 'y＝3', ok: true }, { t: 'y＝27' }, { t: 'y＝−3' }, { t: 'y＝9' }],
      { 1: [B('12を、右にうつして、15＋12で、27！', { fb: 'happy', up: true }), T('12を、右へ移すと、−12です。y＝15−12＝3です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('15−12＝3です。12−15と、順番が、ぎゃくです。', { ft: 'normal' })],
        3: [T('2×6は、12です。6だけを、ひいて、15−6＝9と、していませんか。2倍を、わすれずに。', { ft: 'normal' })],
        ok: [T('正解！ 12＋y＝15。y＝15−12＝3です。', { ft: 'happy' }), B('x＝6、y＝3だね！', { fb: 'star', up: true })],
        wrong: [T('12＋y＝15より、y＝3です。', { ft: 'normal' })] }),
    T('別の組、A＝BとB＝Cでも、同じ答えになります。A＝Bから、x＝2y。これを、B＝Cに入れると、5y＝15です。', { clear: true, cols: [0.34, 0.66], part: '別の解き方で確かめ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'A＝B と B＝C', text: '2x＋y＝x＋3y\n→ x＝2y\nx＋3y＝15\n→ 5y＝15', t: 5.0 }] }),
    T('y＝3、x＝6。さっきと、同じです。どちらの組でも、答えは、x＝6、y＝3です。', { clear: true, cols: [0.34, 0.66], part: '答えとまとめ', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'こたえ', text: 'x＝6、y＝3', t: 3.0 }, { col: 0, type: 'text', size: 'xs', label: '確かめ', text: '2×6＋3＝15\n6＋3×3＝15', t: 3.5 }, tbl([['A＝C', '2x＋y＝15'], ['B＝C', 'x＋3y＝15'], ['解', '{{x＝6、y＝3}}']], { style: 'font-size:52px; align-self:center; margin-top:30px', t: 1.0 })] }),
    T('A＝B＝Cは、3つの式のうち、ちがう2つを選んで、連立方程式にします。同じ式を、2回使わないように、注意しましょう。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: 'A＝B＝C は\n3つのうち2つ選ぶ\n同じ式は2回使わない', t: 5.0 }] }),
    B('イコールが2つでも、こわくなかったよ！ お得だったね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
