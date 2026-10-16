/* 数学Ⅱ 第4章 指数関数と対数関数 ④：対数とその性質
   例はすべて自作。値は python3（sympy）で検算ずみ。
   log₃81=4、log₂(1/8)=−3、log₅√5=1/2、log_(1/2)4=−2、log₄8=3/2、log₃12+2log₃6−log₃16=log₃27=3、
   log₈32=5/3、log₂3·log₃8=3、log₂3=a のとき log₁₂18=(1+2a)/(2+a)、log₂5≒2.32（図） */
(function () {
  const POINTS = [
    '$a>0,\\ a\\neq1,\\ M>0$ のとき　$a^p=M\\iff p=\\log_aM$。$\\log_aM$ は「$a$ を何乗すると $M$ か」',
    '積は和、商は差、累乗は係数：$\\log_aMN=\\log_aM+\\log_aN$、$\\log_a\\frac MN=\\log_aM-\\log_aN$、$\\log_aM^k=k\\log_aM$',
    '底の変換公式 $\\log_ab=\\dfrac{\\log_cb}{\\log_ca}$ で、**底をそろえて** から計算する'
  ];
  HB.lesson({
    id: 'm2d-04', field: '数学Ⅱ　指数関数と対数関数', title: '対数とその性質', level: '対数関数', time: '目安 7分',
    noDec: true,   // log の底の分数の横に小数が出ると読みにくいので使わない
    problem: { label: '例題', lead: '次の値を求めよ。',
      parts: ['(1)　$\\log_{\\frac12}4$', '(2)　$\\log_48$', '(3)　$\\log_312+2\\log_36-\\log_316$',
        '(4)　$\\log_832$', '(5)　$\\log_23\\cdot\\log_38$', '(6)　$\\log_23=a$ のとき、$\\log_{12}18$ を $a$ で表せ'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間の最後に「$2^p=5$ となる $p$」という話をしました。この $p$ を表す新しい記号が **対数** です。指数を、べつの向きから見る道具です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '対数 $\\log_aM$ の意味がわかり、値を求められる\n対数の性質と底の変換公式を使って計算できる' }] },

      // ---------- 定義 ----------
      { clear: true, part: '対数の定義', say: '$2^p=8$ なら $p=3$。では $2^p=5$ となる $p$ は？ $y=2^x$ のグラフと直線 $y=5$ はただ1点で交わるので、$p$ はただ1つ決まります。',
        add: [{ t: 'h', text: '対数' },
          { t: 'm', tex: '2^p=8\\quad\\Rightarrow\\quad p=3' },
          { t: 'm', tex: '2^p=5\\quad\\Rightarrow\\quad p=\\ ?' },
          { t: 'fig', id: 'd1', col: 1, view: [-1.6, -1.3, 3.5, 7.6], w: 540, h: 430, items: [
            { k: 'axes', tx: [1, 2, 3], ty: [2, 4] },
            { k: 'fn', f: '2**x', a: -1.6, b: 2.92, c: 'y', label: 'y=2ˣ', lat: [1.3, 4.6], la: 'end' },
            { k: 'line', m: 0, n: 5, dash: true, c: 'g', label: 'y=5', lat: [-1.5, 5.6], la: 'start' },
            { k: 'seg', a: [2.3219, 0], b: [2.3219, 5], dash: true, c: 'p' }, { k: 'pt', at: [2.3219, 5], c: 'p' },
            { k: 'pt', at: [2.3219, 0], c: 'p', r: 5 }] }] },
      { say: 'この $p$ を $\\log_25$ と書き、「2 を **底** とする 5 の **対数**」といいます。5 を **真数** といいます。真数はいつも正の数です。',
        add: [{ t: 'box', c: 'b', label: '定義', text: '$a>0,\\ a\\neq1,\\ M>0$ のとき\n$a^p=M\\iff p=\\log_aM$' },
          { t: 'p', size: 'sm', text: '$a$：**底**　　$M$：**真数**（真数は正）\n$\\log_25$ は 2 と 3 の間の数（約 2.32）' }],
        draw: [{ fig: 'd1', items: [{ k: 'label', at: [2.3219, 0], text: 'log₂5', c: 'p', size: 22, dy: 48, plain: true }] }] },

      // ---------- 値 ----------
      { clear: true, part: '対数の値', say: '指数の形と対数の形は、行ったり来たりできます。$\\log_aM$ を求めるときは「$a$ を何乗すると $M$ になるか」と読みかえます。',
        add: [{ t: 'h', text: '指数の形 ⇔ 対数の形' },
          { t: 'tbl', rows: [['指数の形', '対数の形'], ['$3^4=81$', '$\\log_381=4$'], ['$2^{-3}=\\frac18$', '$\\log_2\\frac18=-3$'], ['$5^{\\frac12}=\\sqrt5$', '$\\log_5\\sqrt5=\\frac12$'], ['$a^0=1$', '$\\log_a1=0$'], ['$a^1=a$', '$\\log_aa=1$']], cls: 'rowh' },
          { t: 'box', col: 1, c: 'y', label: '読みかえ', text: '$\\log_aM$ は\n「$a$ を **何乗** すると $M$ になるか」' }] },
      { ask: { type: 'choice', q: '$\\log_{\\frac12}4$ の値は？',
        opts: ['$-2$', '$2$', '$-\\dfrac12$', '$8$'], ok: 0,
        why: { 1: '$\\left(\\frac12\\right)^2=\\frac14$ です。4 にするには $-2$ 乗します。', 2: '$\\left(\\frac12\\right)^{-\\frac12}=\\sqrt2$ です。4 にはなりません。', 3: '4 と $\\frac12$ をわり算するのではなく、「何乗か」を考えます。' },
        good: '$\\left(\\frac12\\right)^{-2}=2^2=4$ なので $-2$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\left(\\frac12\\right)^{-2}=4\\ \\text{より}\\ \\log_{\\frac12}4=\\ans{-2}' }] } },
      { ask: { type: 'choice', q: '$\\log_48$ の値は？',
        opts: ['$2$', '$\\dfrac32$', '$\\dfrac23$', '$3$'], ok: 1,
        why: { 0: '$8\\div4=2$ としています。対数は「何乗か」です。', 2: '$\\dfrac23$ は $\\log_84$。底と真数が逆です。', 3: '$8=2^3$ の 3 は、底が 2 のときの答え。底は 4 です。' },
        good: '$4^p=8$ を底 2 にそろえて $2^{2p}=2^3$、$p=\\dfrac32$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '4^p=8\\ \\Rightarrow\\ 2^{2p}=2^3\\ \\Rightarrow\\ p=\\ans{\\frac32}' }] } },

      // ---------- 性質 ----------
      { clear: true, part: '対数の性質', say: '指数法則を対数で言いかえると、性質が出てきます。$M=a^p,\\ N=a^q$ とおくと $MN=a^{p+q}$ なので、$\\log_aMN=p+q$ です。',
        add: [{ t: 'h', text: '対数の性質' },
          { t: 'm', tex: 'M=a^p,\\ N=a^q\\ \\Rightarrow\\ MN=a^{p+q}' },
          { t: 'm', tex: '\\log_aMN=p+q=\\log_aM+\\log_aN' },
          { t: 'box', col: 1, c: 'y', label: '性質', text: '$\\log_aMN=\\log_aM+\\log_aN$\n$\\log_a\\dfrac MN=\\log_aM-\\log_aN$\n$\\log_aM^k=k\\log_aM$' },
          { t: 'p', col: 1, size: 'sm', text: '（$M>0,\\ N>0$、$k$ は実数）\n積 → 和、商 → 差、累乗 → 係数' }] },
      { say: '性質を使って、1つの $\\log$ にまとめます。まず $2\\log_36=\\log_36^2=\\log_336$。あとは、たし算は積に、ひき算は商にまとめます。',
        add: [{ t: 'gap', h: 10 }, { t: 'm', tex: '\\begin{aligned}&\\log_312+2\\log_36-\\log_316\\\\ &=\\log_312+\\log_3\\hy{36}-\\log_316\\\\ &=\\log_3\\frac{12\\times36}{16}=\\log_327=\\ans{3}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$M>0,\\ N>0$ のとき、**正しい** 式はどれ？',
        opts: ['$\\log_2(M+N)=\\log_2M+\\log_2N$', '$\\log_2M^3=(\\log_2M)^3$', '$\\log_2\\frac MN=\\frac{\\log_2M}{\\log_2N}$', '$\\log_2M^3=3\\log_2M$'], ok: 3,
        why: { 0: 'たし算に分かれるのは、真数が **積** のとき。$\\log_2(M+N)$ は分けられません。', 1: '真数の指数は前に出て **係数** になります。3乗にはなりません。', 2: '商の対数は **ひき算** です。わり算にはなりません。' },
        good: '$M^3=M\\cdot M\\cdot M$ なので $\\log_2M^3=\\log_2M+\\log_2M+\\log_2M=3\\log_2M$。' } },

      // ---------- 底の変換公式 ----------
      { clear: true, part: '底の変換公式', say: '底がちがう対数は、そのままでは計算できません。**底の変換公式** で、好きな底にそろえます。',
        add: [{ t: 'h', text: '底の変換公式' },
          { t: 'box', c: 'b', label: '公式', text: '$a,\\ b,\\ c$ は正の数で、$a\\neq1,\\ c\\neq1$ のとき\n$\\log_ab=\\dfrac{\\log_cb}{\\log_ca}$' },
          { t: 'p', col: 1, size: 'sm', text: '[[g:なぜ？]]　$p=\\log_ab$ とおくと $a^p=b$\n両辺の $c$ を底とする対数をとる' },
          { t: 'm', col: 1, size: 'sm', tex: '\\log_ca^p=\\log_cb' },
          { t: 'm', col: 1, size: 'sm', tex: 'p\\log_ca=\\log_cb\\ \\Rightarrow\\ p=\\frac{\\log_cb}{\\log_ca}' }] },
      { say: '$\\log_832$ は、8 も 32 も 2 の累乗なので、底を 2 にそろえます。$\\log_232=5$、$\\log_28=3$ です。',
        add: [{ t: 'm', tex: '\\log_832=\\frac{\\log_232}{\\log_28}=\\ans{\\frac53}' }] },
      { ask: { type: 'choice', q: '$\\log_23\\cdot\\log_38$ の値は？',
        opts: ['$\\log_624$', '$1$', '$3$', '$\\log_224$'], ok: 2,
        why: { 0: '底どうし・真数どうしをかけ合わせる性質はありません。', 1: '$\\log_23\\cdot\\log_32=1$ ですが、ここは $\\log_38$ で、$\\log_38=3\\log_32$ です。', 3: '$\\log_224$ は $\\log_23+\\log_28$（たし算）です。' },
        good: '底を 2 にそろえると $\\log_23\\times\\dfrac{\\log_28}{\\log_23}=\\log_28=3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\log_23\\cdot\\frac{\\log_28}{\\log_23}=\\log_28=\\ans{3}', note: '底を 2 に\nそろえる' }] } },
      { ask: { type: 'think', q: '$\\log_23=a$ とするとき、$\\log_{12}18$ を $a$ で表そう。',
        hint: '底を 2 にそろえる。$18=2\\times3^2$、$12=2^2\\times3$。',
        ans: '$\\log_{12}18=\\dfrac{\\log_218}{\\log_212}=\\dfrac{1+2\\log_23}{2+\\log_23}=\\dfrac{1+2a}{2+a}$',
        after: '底の変換公式で、値がわかっている $\\log_23$ の底 2 にそろえるのがコツです。',
        add: [{ t: 'm', size: 'sm', tex: '\\log_{12}18=\\frac{\\log_2(2\\cdot3^2)}{\\log_2(2^2\\cdot3)}=\\ans{\\frac{1+2a}{2+a}}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、$y=\\log_2x$ のような **対数関数** のグラフを、指数関数のグラフと見くらべながら調べます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
