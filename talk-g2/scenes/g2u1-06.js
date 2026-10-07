/* 中2 1章 式の計算　第6時「式の計算ビンゴで、計算をたしかなものにしよう」（遊）。自作。
   ビンゴ盤（3×3）：A1 2a−2b／B1 3x−7y／C1 2a＋2b／A2 12xy²／B2 −12x²y／C2 3x＋5y／A3 −6a＋15b／B3 −6a−15b／C3 −12xy
   第1問 3a＋5b−a−7b＝2a−2b(A1)／第2問 (4x−y)−(x−6y)＝3x＋5y(C2)／第3問 −3(2a−5b)＝−6a＋15b(A3)／
   第4問 6xy×(−2x)＝−12x²y(B2)／第5問 8x²y÷2x×3y＝12xy²(A2)。Q5でA列と2段目が同時にそろう（ダブルビンゴ）。
   盤にある誤答（罠）：2a＋2b／3x−7y／−6a−15b／−12xy。 */
(function () {
  const { T, B, Q, tbl } = KL;
  const CELLS = { A1: '2a−2b', B1: '3x−7y', C1: '2a＋2b', A2: '12xy²', B2: '−12x²y', C2: '3x＋5y', A3: '−6a＋15b', B3: '−6a−15b', C3: '−12xy' };
  // 印のついたマスは {{ }} で色をつける
  const card = (...done) => {
    const c = k => (done.includes(k) ? '{{' + CELLS[k] + '}}' : CELLS[k]);
    return tbl([['', 'A', 'B', 'C'], ['1', c('A1'), c('B1'), c('C1')], ['2', c('A2'), c('B2'), c('C2')], ['3', c('A3'), c('B3'), c('C3')]],
      { style: 'font-size:34px; align-self:center; margin-top:10px', t: 1.0 });
  };
  const qbox = (n, expr) => ({ col: 0, type: 'box', color: 'y', size: 'xs', label: '第' + n + '問', text: expr, t: 3.5 });
  const sbox = text => ({ col: 0, type: 'box', color: 'b', size: 'xs', label: 'ビンゴ', text, t: 3.5 });

  KL.lesson({ id: 'g2u1-06', unit: '中2　式の計算', kick: '2年1章　第6時', title: '式の計算ビンゴで、計算をたしかなものにしよう', card: '式の計算ビンゴで、計算をたしかなものにしよう', sub: 'ホー先生とポンタと いっしょに ゆっくり解説', cols: [0.34, 0.66], steps: [
    T('みなさん、こんにちは。今日は、式の計算ビンゴ大会です。私が司会、ポンタが挑戦者です。', { title: true, point: false, ft: 'happy' }),
    B('ビンゴ！ 景品は、あるの？ たい焼きが、いいな！', { title: true, fb: 'star', up: true }),
    T('景品は、ありません。でも、計算の力が、身につきますよ。', { title: true, point: false, ft: 'sigh', fx: { t: 'sweat' } }),

    T('ルールを、説明します。ビンゴ盤には、9つの式が、あります。問題の答えと、同じ式に、印をつけます。縦、横、ななめの、どれか1列が、そろえば、ビンゴです。', { part: 'ルール', ft: 'normal',
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ルール', text: '答えと同じ式に印\n縦・横・ななめ\n1列そろえばビンゴ', t: 5.0 }, card()] }),
    B('ぼく、ぜったい、ビンゴをそろえる！ ビンゴ盤にある式を、選べば、いいんだよね！', { fb: 'happy', up: true }),
    T('ちょっと待ってください。盤にある式でも、その問題の答えとは、限りません。ちゃんと計算して、選びましょう。', { ft: 'sorry', point: false }),

    /* ---------- 第1問 ---------- */
    Q('q1', T('第1問です。3a＋5b−a−7b を、計算すると、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: 'ビンゴ　第1問', ft: 'normal',
      add: [qbox(1, '3a＋5b−a−7b'), sbox('印は　0こ'), card()] }),
      [{ t: '2a＋2b' }, { t: '2a−2b', ok: true }, { t: '4a−2b' }, { t: '2a−2' }],
      { 0: [B('2a＋2b が、ビンゴ盤に、あるよ！ これだ！', { fb: 'happy', up: true }), T('5b−7b は、−2b です。小さい数から、大きい数を、ひいているので、マイナスです。盤にあっても、答えとは、限りません。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('−a を、＋a にしていませんか。3a−a＝2a です。', { ft: 'normal' })],
        3: [T('−2b の、b が、消えています。文字は、残します。', { ft: 'normal' })],
        ok: [T('正解！ 3a−a＝2a、5b−7b＝−2b。2a−2b です。A1に、印をつけましょう。', { ft: 'happy' }), B('まず、1つ！ ビンゴ盤の、左上だね！', { fb: 'star', up: true })],
        wrong: [T('a の項は2a、b の項は−2b で、2a−2b です。', { ft: 'normal' })] }),

    /* ---------- 第2問 ---------- */
    Q('q2', T('第2問です。(4x−y)−(x−6y) を、計算すると、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: 'ビンゴ　第2問', ft: 'normal',
      add: [qbox(2, '(4x−y)−(x−6y)'), sbox('印は　1こ'), card('A1')] }),
      [{ t: '3x＋5y', ok: true }, { t: '5x＋5y' }, { t: '3x−5y' }, { t: '3x−7y' }],
      { 3: [B('3x−7y も、盤に、あるよ！ こっちが、いい！', { fb: 'happy', up: true }), T('−(x−6y) は、−x＋6y です。−6y の前の、マイナスも、かけて、＋6y に、変わります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('−x を、＋x に、していませんか。ひくのですから、4x−x＝3x です。', { ft: 'normal' })],
        ok: [T('正解！ 4x−y−x＋6y。x の項は3x、y の項は5y。3x＋5y です。C2に、印です。', { ft: 'happy' }), B('マイナスのかっこは、ぜんぶ変えたよ！', { fb: 'proud', up: true })],
        wrong: [T('かっこをはずして、4x−y−x＋6y。まとめて、3x＋5y です。', { ft: 'normal' })] }),

    /* ---------- 第3問 ---------- */
    Q('q3', T('第3問です。−3(2a−5b) を、計算すると、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: 'ビンゴ　第3問', ft: 'normal',
      add: [qbox(3, '−3(2a−5b)'), sbox('印は　2こ'), card('A1', 'C2')] }),
      [{ t: '−6a−15b' }, { t: '−6a＋5b' }, { t: '−6a＋15b', ok: true }, { t: '6a−15b' }],
      { 0: [B('−3 をかけるから、ぜんぶ、マイナス！ 盤にも、あるし！', { fb: 'happy', up: true }), T('−3×(−5b) は、マイナスとマイナスで、プラスです。＋15b になります。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('−5b にも、−3をかけます。かけ忘れです。−3×(−5b)＝15b です。', { ft: 'normal' })],
        ok: [T('正解！ −3×2a＝−6a、−3×(−5b)＝＋15b。A3に、印です。縦のA列が、リーチです！', { ft: 'happy' }), B('リーチ！ A2が、ほしい！', { fb: 'star', up: true })],
        wrong: [T('−3 を、2a と −5b の、両方にかけて、−6a＋15b です。', { ft: 'normal' })] }),

    /* ---------- 第4問 ---------- */
    Q('q4', T('第4問です。6xy×(−2x) を、計算すると、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: 'ビンゴ　第4問', ft: 'normal',
      add: [qbox(4, '6xy×(−2x)'), sbox('印は　3こ\nA列がリーチ'), card('A1', 'C2', 'A3')] }),
      [{ t: '4x²y' }, { t: '−12xy' }, { t: '12x²y' }, { t: '−12x²y', ok: true }],
      { 1: [B('x と x で、x のままでしょ！ −12xy、盤にもあるよ！', { fb: 'happy', up: true }), T('x×x は、x が2個で、x² です。係数は、6×(−2)＝−12 なので、−12x²y です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        2: [T('6×(−2) は、−12 です。マイナスを、わすれていますよ。', { ft: 'normal' })],
        ok: [T('正解！ 6×(−2)＝−12、x×x＝x²。−12x²y です。B2に、印です。', { ft: 'happy' }), B('あれ？ リーチが、4つも、あるよ！', { fb: 'surprised', up: true })],
        wrong: [T('かけ算は、係数も、かけます。6×(−2)＝−12 で、−12x²y です。', { ft: 'normal' })] }),

    /* ---------- 第5問 ---------- */
    Q('q5', T('最後の、第5問です。8x²y÷2x×3y を、計算すると、どれでしょう。', { clear: true, cols: [0.34, 0.66], part: 'ビンゴ　第5問', ft: 'happy',
      add: [qbox(5, '8x²y÷2x×3y'), sbox('印は　4こ\nリーチが4か所'), card('A1', 'C2', 'A3', 'B2')] }),
      [{ t: '12xy²', ok: true }, { t: '12xy' }, { t: '4xy²' }, { t: '12x²y²' }],
      { 3: [B('x²÷x は、x² のままでしょ？ 12x²y²！', { fb: 'happy', up: true }), T('x²÷x は、x が1個、消えて、x です。8x²y÷2x＝4xy。それに、3y をかけて、12xy² です。', { ft: 'sigh', fb: 'sad', fx: { b: 'sweat' } })],
        1: [T('3y の、y を、わすれています。4xy×3y＝12xy² です。', { ft: 'normal' })],
        ok: [T('正解！ 8x²y÷2x＝4xy。4xy×3y＝12xy² です。A2に、印です！', { ft: 'happy' }), B('そろった！ そろった！', { fb: 'star', up: true })],
        wrong: [T('8x²y÷2x＝4xy。それに、3y をかけて、12xy² です。', { ft: 'normal' })] }),

    T('A1、A2、A3 が、縦にそろいました。さらに、A2、B2、C2 も、横にそろっています。なんと、ダブルビンゴです！', { clear: true, cols: [0.34, 0.66], part: 'ビンゴ！', ft: 'proud',
      add: [{ col: 0, type: 'box', color: 'p', size: 'xs', label: 'ダブルビンゴ！', text: '縦のA列と\n横の2段目', t: 4.0 }, card('A1', 'C2', 'A3', 'B2', 'A2')] }),
    T('今日のポイントを、ふりかえります。−( ) は、中の符号を、ぜんぶ変えます。単項式の乗除は、係数と文字を、別々に計算します。', { ft: 'normal', point: false,
      add: [{ col: 0, type: 'box', color: 'y', size: 'xs', label: 'ポイント', text: '−( )は符号ぜんぶ変える\n係数と文字は別々に', t: 5.0 }] }),
    B('盤にある式を、選ぶんじゃなくて、計算して選ぶと、ほんとに、そろうんだね！', { fb: 'happy', up: true, fx: { b: 'e' } }),
    T('お疲れさまでした。成績は、こちらです。', { ft: 'happy', point: false, result: true })
  ] });
})();
