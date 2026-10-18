/* 2025 慶應 理工 第3問の類題（自作）：2つの駒の差のランダムウォークと、連立漸化式（空欄補充）
   さいころ 1,2 → A だけ +1、3 → B だけ +1、4,5,6 → 両方 +1。差 d=(A の位置)−(B の位置) が初めて ±2 で終了。
   元の問題はうつしていない（分野・ねらい・形式だけを合わせた自作問題）。答えは python3（Fraction による全状態の計算）で n≦11 まで検算ずみ。
   推移：a'=½a+⅙b+⅓c、b'=⅓a+½b、c'=⅙a+½c（a:d=0、b:d=1、c:d=−1）
   (1) a₁=½, b₁=⅓, c₁=⅙。ア a₂=13/36、イ 2回目で終了 (⅓)²+(⅙)²=5/36
   (2) b'−2c'=½(b−2c)、b₀−2c₀=0 → ウ b=2c。a'=½a+エ(2/3)c
   (3) a+kc が等比 ⟺ k²=4：オ k=2（公比 キ 5/6）、カ k=−2（公比 ク 1/6）
   (4) a+2c=(5/6)ⁿ、a−2c=(1/6)ⁿ → ケ aₙ={(5/6)ⁿ+(1/6)ⁿ}/2、cₙ={(5/6)ⁿ−(1/6)ⁿ}/4
       ちょうど n 回目で終了＝⅓b_{n−1}+⅙c_{n−1}=⅚c_{n−1} → コ (5/24){(5/6)^{n−1}−(1/6)^{n−1}}（n=2,3 で 5/36）
   考えてみよう：A が 2 先に出て終わる確率 ⅓Σbₖ=4/5（B は 1/5） */
(function () {
  const POINTS = [
    '2つの駒の問題は **差 $d$** だけを追う。両方進む目は $d$ を変えない。状態（$d=0,\\ \\pm1$）と矢印の図をかいて推移を書く',
    '連立漸化式は、まず **比例する組**（ここでは $b_n=2c_n$）を見つけて文字を減らす。$a_n+kc_n$ が等比になる $k$ は係数比較で $k^2=4$',
    '「ちょうど $n$ 回目に終わる」は **$n-1$ 回目の状態 × 最後の1回**。$n=1,\\ 2$ を代入して (1) の値と合うか検算'
  ];
  // 状態の図（d の値）
  const node = (x, name, c, sub) => [{ k: 'circle', o: [x, 0], r: 0.3, c, wd: 2.5 }, { k: 'label', at: [x, 0], text: name, size: 24, c, dy: 8 },
    { k: 'label', at: [x, -0.62], text: sub, size: 21, c: 'd', plain: true }];
  const STATES = [{ k: 'label', at: [-2.85, 0.75], text: 'd の値', size: 21, c: 'd', plain: true, anchor: 'start' }]
    .concat(node(-2, '−2', 'p', 'おわり'), node(-1, '−1', 'b', 'c'), node(0, '0', 'w', 'a'), node(1, '1', 'y', 'b'), node(2, '2', 'p', 'おわり'));
  const arrows = [];
  [-2, -1, 0, 1].forEach(x => {
    if (x > -2) arrows.push({ k: 'seg', a: [x + 0.32, 0.14], b: [x + 0.68, 0.14], arrow: true, c: 'y', wd: 2 }, { k: 'label', at: [x + 0.5, 0.42], text: '1/3', size: 20, c: 'y' });
    if (x < 1) arrows.push({ k: 'seg', a: [x + 0.68, -0.14], b: [x + 0.32, -0.14], arrow: true, c: 'b', wd: 2 }, { k: 'label', at: [x + 0.5, -0.36], text: '1/6', size: 20, c: 'b' });
  });
  arrows.push({ k: 'label', at: [0, 0.82], text: 'その場 1/2', size: 20, c: 'g', plain: true });
  const stfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.9, -0.95, 2.6, 1.1], w: 680, h: 253, items: STATES.concat(arrows, extra || []) });

  HB.lesson({
    id: 'keio25-3', field: '慶應型　数学（理工）', title: '2025 慶應 理工 第3問の類題 ― 2つの駒の差と、連立漸化式', level: '2025年度 慶應義塾大学 理工学部 第3問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '数直線上に 2 つの駒 A，B があり、最初はどちらも原点にある。1 個のさいころを投げ、1，2 の目が出たら A だけを正の向きに 1 進め、3 の目が出たら B だけを正の向きに 1 進め、4，5，6 の目が出たら A と B の両方を正の向きに 1 進める。この操作をくり返し、A と B の距離が初めて 2 になったところで操作をやめる。\n$n$ 回目の操作のあと、まだ操作をやめておらず、A と B が同じ位置にある確率を $a_n$、A が B より 1 だけ大きい位置にある確率を $b_n$、B が A より 1 だけ大きい位置にある確率を $c_n$ とする（$a_0=1,\\ b_0=c_0=0$）。次の文章中の空欄に適切な数または式を入れよ。',
      parts: [
        '(1)　$a_2=\\boxed{\\text{ア}}$ であり、ちょうど 2 回目の操作で操作をやめる確率は $\\boxed{\\text{イ}}$ である。',
        '(2)　すべての $n\\ge0$ で $b_n=\\boxed{\\text{ウ}}\\,c_n$ が成り立つ。これを用いると $a_{n+1}=\\dfrac12a_n+\\boxed{\\text{エ}}\\,c_n$ と表せる。',
        '(3)　数列 $\\{a_n+kc_n\\}$ が等比数列となる定数 $k$ は $k=\\boxed{\\text{オ}}$，$\\boxed{\\text{カ}}$（オ＞カ）であり、公比はそれぞれ $\\boxed{\\text{キ}}$，$\\boxed{\\text{ク}}$ である。',
        '(4)　$a_n=\\boxed{\\text{ケ}}$ であり、$n\\ge1$ のとき、ちょうど $n$ 回目の操作で操作をやめる確率は $\\boxed{\\text{コ}}$ である。'
      ],
      src: '※ 2025年度 慶應義塾大学 理工学部 一般選抜 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { clear: true, cols: [1], part: '問題', say: '2つの駒が動く確率と、漸化式の問題です。空欄が多いので、(1) の小さい値を **検算用** に取っておくのがコツ。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.5' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '大事なのは位置そのものではなく、**差** $d=$（A の位置）−（B の位置）だけ。終わるのは $d=\\pm2$ のときです。',
        add: [{ t: 'h', text: '差 d だけを追う' },
          { t: 'tbl', size: 'sm', rows: [['目', '動く駒', '確率'], ['1, 2', 'A だけ', '$\\frac13$'], ['3', 'B だけ', '$\\frac16$'], ['4, 5, 6', '両方', '$\\frac12$']] },
          stfig('s1')] },
      { ask: { type: 'choice', q: '4, 5, 6 の目が出たとき、差 $d$ はどう変わる？',
        opts: ['$d$ が 2 ふえる', '$d$ が 1 ふえる', '$d$ は 0 にもどる', '$d$ は変わらない'], ok: 3,
        why: { 0: '両方が同じだけ進むので、差は変わりません。', 1: '1 ふえるのは、A だけが進む 1, 2 の目のときです。', 2: '両方が 1 ずつ進むだけで、2つの駒が同じ位置にそろうわけではありません。' },
        good: '両方が 1 進むので差は同じ。図の「その場 $\\frac12$」です。状態は $d=0,\\ 1,\\ -1$ の3つだけ。',
        add: [{ t: 'p', size: 'sm', text: '$d=0$ … 確率 $a_n$　　$d=1$ … $b_n$　　$d=-1$ … $c_n$\n$d=\\pm2$ になったら終わり' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。1回目は $a_1=\\frac12$、$b_1=\\frac13$、$c_1=\\frac16$。2回目で $d=0$ にいるのは、3通りの道があります。',
        add: [{ t: 'h', text: '(1)　2 回目までのようす' },
          { t: 'm', tex: 'a_1=\\frac12,\\quad b_1=\\frac13,\\quad c_1=\\frac16' },
          stfig('s2'),
          { t: 'p', size: 'sm', text: '2回目に $d=0$：\n① $0\\to0\\to0$　② $0\\to1\\to0$　③ $0\\to-1\\to0$' }] },
      { ask: { type: 'choice', q: '$a_2$（ア）は？',
        opts: ['$\\dfrac14$', '$\\dfrac{11}{36}$', '$\\dfrac{13}{36}$', '$\\dfrac12$'], ok: 2,
        why: { 0: '「その場」を2回の ① だけです。② ③ の行って戻る道も足します。', 1: '② か ③ の片方を数え忘れています。', 3: '1回目の $a_1$ と同じにしてしまっています。' },
        good: '$\\frac12\\cdot\\frac12+\\frac13\\cdot\\frac16+\\frac16\\cdot\\frac13=\\frac14+\\frac1{18}+\\frac1{18}=\\frac{13}{36}$。',
        add: [{ t: 'm', tex: 'a_2=\\frac14+\\frac1{18}+\\frac1{18}=\\ans{\\frac{13}{36}}' }] } },
      { say: '2回目で終わるのは、A が2回続けて進むか、B が2回続けて進むときだけ。$\\left(\\frac13\\right)^2+\\left(\\frac16\\right)^2=\\frac{5}{36}$（イ）。',
        add: [{ t: 'm', tex: '\\left(\\frac13\\right)^2+\\left(\\frac16\\right)^2=\\ans{\\frac5{36}}', note: 'イ（あとで検算に使う）' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。図の矢印を読んで、$n+1$ 回目の確率を $n$ 回目の確率で表します。$d=\\pm2$ への矢印は「終わり」なので、式には入りません。',
        add: [{ t: 'h', text: '(2)　推移の式' },
          { t: 'm', tex: '\\begin{aligned} a_{n+1}&=\\frac12a_n+\\frac16b_n+\\frac13c_n\\\\ b_{n+1}&=\\frac13a_n+\\frac12b_n\\\\ c_{n+1}&=\\frac16a_n+\\frac12c_n \\end{aligned}' },
          stfig('s3')] },
      { ask: { type: 'choice', q: '下の2つの式を見くらべると、$b_n$ と $c_n$ の関係は？（ウ）',
        opts: ['$b_n=c_n$', '$b_n=2c_n$', '$b_n=\\dfrac12c_n$', '$b_n=4c_n$'], ok: 1,
        why: { 0: '左右対称ではありません。A が進む確率 $\\frac13$ は、B の $\\frac16$ の 2 倍です。', 2: '向きが逆です。A が先に出る $b_n$ の方が大きいはず。', 3: '入ってくる確率の比 $\\frac13:\\frac16=2:1$ なので 2 倍です。' },
        good: '$b_{n+1}-2c_{n+1}=\\frac12(b_n-2c_n)$。$b_0-2c_0=0$ なので、ずっと 0 です。',
        add: [{ t: 'm', tex: 'b_{n+1}-2c_{n+1}=\\frac12(b_n-2c_n)\\ \\Rightarrow\\ b_n=\\ans{2}c_n' }] } },
      { say: '$b_n=2c_n$ を $a_{n+1}$ の式に入れると $\\frac16\\cdot2c_n+\\frac13c_n=\\frac23c_n$（エ）。これで、$a_n$ と $c_n$ だけの連立漸化式になりました。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '連立漸化式', text: '$a_{n+1}=\\dfrac12a_n+\\dfrac23c_n$　（エ $\\dfrac23$）\n$c_{n+1}=\\dfrac16a_n+\\dfrac12c_n$' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: '(3) です。$a_{n+1}+kc_{n+1}$ を計算し、それが $\\lambda(a_n+kc_n)$ の形になるように、係数を比べます。',
        add: [{ t: 'h', text: '(3)　等比数列になる組' },
          { t: 'm', size: 'sm', tex: 'a_{n+1}+kc_{n+1}=\\left(\\frac12+\\frac k6\\right)a_n+\\left(\\frac23+\\frac k2\\right)c_n' },
          { t: 'm', size: 'sm', tex: '\\lambda=\\frac12+\\frac k6,\\qquad \\lambda k=\\frac23+\\frac k2' }] },
      { ask: { type: 'choice', q: '2つの式から $\\lambda$ を消すと、$k$ は？',
        opts: ['$k=\\pm2$', '$k=\\pm4$', '$k=2$ だけ', '$k=\\pm\\dfrac23$'], ok: 0,
        why: { 1: '$\\frac{k^2}{6}=\\frac23$ から $k^2=4$。4 は $k^2$ の値です。', 2: '$k^2=4$ の解は2つ。2つあるから、連立漸化式が解けます。', 3: '$\\frac k2$ の項が両辺で消えることを見落としています。' },
        good: '$\\left(\\frac12+\\frac k6\\right)k=\\frac23+\\frac k2$ で $\\frac k2$ が消えて $\\frac{k^2}{6}=\\frac23$、$k^2=4$。',
        add: [{ t: 'm', tex: 'k^2=4\\qquad k=\\ans{2},\\ \\ans{-2}' }] } },
      { say: '公比は $\\lambda=\\frac12+\\frac k6$。$k=2$ なら $\\frac56$（キ）、$k=-2$ なら $\\frac16$（ク）。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['$k$', '公比 $\\lambda$'], ['$2$', '$\\frac12+\\frac13=\\frac56$'], ['$-2$', '$\\frac12-\\frac13=\\frac16$']] },
          { t: 'box', col: 1, c: 'g', size: 'sm', label: '検算', text: '$n=1$ で確かめる：\n$a_1+2c_1=\\frac12+\\frac13=\\frac56$　○\n$a_1-2c_1=\\frac12-\\frac13=\\frac16$　○' }] },
      { ask: { type: 'choice', q: '$a_n+2c_n$ を $n$ の式で表すと？',
        opts: ['$\\left(\\dfrac56\\right)^{n-1}$', '$\\left(\\dfrac56\\right)^n$', '$\\dfrac12\\left(\\dfrac56\\right)^n$', '$2\\left(\\dfrac56\\right)^n$'], ok: 1,
        why: { 0: '初項は $n=0$ の $a_0+2c_0=1$。$n=0$ から数えるので、指数は $n$ です。', 2: '$a_1+2c_1=\\frac12+\\frac13=\\frac56$。$\\frac12$ はかかりません。', 3: '$n=0$ で 2 になってしまい、$a_0+2c_0=1$ と合いません。' },
        good: '初項 $a_0+2c_0=1$、公比 $\\frac56$。同じように $a_n-2c_n=\\left(\\frac16\\right)^n$。',
        add: [{ t: 'm', size: 'sm', tex: 'a_n+2c_n=\\left(\\frac56\\right)^n,\\qquad a_n-2c_n=\\left(\\frac16\\right)^n' }] } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。2つの式を足したり引いたりして、$a_n$ と $c_n$ を求めます。$b_n=2c_n$ も忘れずに。',
        add: [{ t: 'h', text: '(4)　一般項と、ちょうど n 回目で終わる確率' },
          { t: 'm', tex: 'a_n=\\ans{\\frac12\\left\\{\\left(\\frac56\\right)^n+\\left(\\frac16\\right)^n\\right\\}}', note: 'ケ' },
          { t: 'm', tex: 'c_n=\\frac14\\left\\{\\left(\\frac56\\right)^n-\\left(\\frac16\\right)^n\\right\\},\\quad b_n=2c_n' },
          stfig('s4')] },
      { say: 'ちょうど $n$ 回目で終わるのは、$n-1$ 回目に $d=1$ で A が進むか、$d=-1$ で B が進むとき。$b_{n-1}=2c_{n-1}$ を使うとまとまります。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac13b_{n-1}+\\frac16c_{n-1}=\\frac23c_{n-1}+\\frac16c_{n-1}=\\frac56c_{n-1}' }] },
      { ask: { type: 'choice', q: 'ちょうど $n$ 回目で終わる確率（コ）は？',
        opts: ['$\\frac5{24}\\{(\\frac56)^{n}-(\\frac16)^{n}\\}$', '$\\frac16\\{(\\frac56)^{n-1}-(\\frac16)^{n-1}\\}$', '$\\frac5{24}\\{(\\frac56)^{n-1}-(\\frac16)^{n-1}\\}$', '$\\frac5{36}(\\frac56)^{n-2}$'], ok: 2,
        why: { 0: 'それは $\\frac56c_n$。使うのは1回前の $c_{n-1}$ です。$n=2$ で 5/36 になりません。', 1: 'A が 2 先に出る場合 $\\frac13b_{n-1}$ だけです。B の場合も足します。', 3: '$n=2$ では合いますが、$n=3$ で $\\frac{25}{216}$ となり、正しい値 $\\frac5{36}$ とずれます。' },
        good: '$\\frac56c_{n-1}$ に $c_{n-1}$ の式を入れます。$n=2$ では $\\frac5{24}\\cdot\\frac46=\\frac5{36}$ で、(1) のイと一致。',
        add: [{ t: 'ans', label: '(4) 答', text: 'コ　$\\dfrac5{24}\\left\\{\\left(\\dfrac56\\right)^{n-1}-\\left(\\dfrac16\\right)^{n-1}\\right\\}$' }] } },
      { clear: true, cols: [1], say: '検算の表です。$n=1$ では 0（1回では終われない）、$n=2$ で (1) のイ、$n=3$ も同じ $\\frac5{36}$ になります。',
        add: [{ t: 'h', text: '検算と、もう一歩' },
          { t: 'tbl', rows: [['$n$', '1', '2', '3', '4'], ['$a_n$', '$\\dfrac12$', '$\\dfrac{13}{36}$', '$\\dfrac{7}{24}$', '$\\dfrac{313}{1296}$'], ['ちょうど $n$ 回目で終わる', '0', '$\\dfrac5{36}$', '$\\dfrac5{36}$', '$\\dfrac{155}{1296}$']] },
          { t: 'p', size: 'sm', text: '空欄の答えが式のときは、$n=1,\\ 2$ を入れて、(1) で出した値と合うかを必ず確かめます。' }] },
      { ask: { type: 'think', q: 'A が B より 2 先に出て終わる確率（何回目でもよい）を求めよう。',
        hint: '$\\displaystyle\\sum_{n=1}^{\\infty}\\frac13b_{n-1}$。$b_k=\\frac12\\left\\{\\left(\\frac56\\right)^k-\\left(\\frac16\\right)^k\\right\\}$ の無限等比級数。',
        ans: '$\\dfrac13\\cdot\\dfrac12\\left(\\dfrac{1}{1-\\frac56}-\\dfrac{1}{1-\\frac16}\\right)=\\dfrac16\\left(6-\\dfrac65\\right)=\\dfrac45$',
        after: 'B が先に出て終わる確率は $\\frac15$。合わせて 1 なので、いつかは必ず終わります。A は B の 2 倍進みやすいので、4：1 です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。状態を減らす、比例を見つける、検算する。この3つで、連立漸化式の確率は速く正確に解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
