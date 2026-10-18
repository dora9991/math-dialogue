/* 2024 阪大 理系 第1問の類題（自作）：指数関数と sin の方程式の解がつくる数列の極限
   問題：f_n(x)=3e^{−nx}−2sin x−1。(1) 0<x<π/2 にただ1つの解 a_n (2) lim a_n、lim n a_n (3) lim n(log3 − n a_n)
   答え（python3・mpmath で検算ずみ）：
   (1) f_n'(x)=−3ne^{−nx}−2cos x<0（0≦x≦π/2）、f_n(0)=2>0、f_n(π/2)=3e^{−nπ/2}−3<0
   (2) 3e^{−na_n}=1+2sin a_n>1 → 0<a_n<log3/n → a_n→0、n a_n=log3−log(1+2sin a_n)→log3
   (3) n log(1+2sin a_n)=n a_n・(sin a_n/a_n)・2・log(1+2sin a_n)/(2sin a_n) → 2log3
   数値：n=10 で 1.701、n=100 で 2.132、n=1000 で 2.190、n=10⁶ で 2.19722（2log3≒2.19722）
   a_1≒0.4616、a_2≒0.3107、a_5≒0.1634 */
(function () {
  const HP = Math.PI / 2;
  const fx = n => `3*exp(-${n}*x)-2*sin(x)-1`, ex = n => `3*exp(-${n}*x)`;
  const AN = { 1: 0.461617, 2: 0.310724, 5: 0.163390 };
  const COLS = { 1: 'y', 2: 'g', 5: 'b' };
  // f_n のグラフ（n=1,2,5）
  const gF = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.25, -3.4, 1.85, 2.5], w: 500, h: 430, items: [
    { k: 'axes', tx: [[0.5, '0.5'], [1, '1'], [HP, 'π/2']], ty: [[2, '2'], [-2, '−2']], xl: 'x', yl: 'y' },
    { k: 'line', x: HP, dash: true, c: 'd' },
    { k: 'fn', f: fx(1), a: 0, b: HP, c: 'y', wd: 3 },
    { k: 'fn', f: fx(2), a: 0, b: HP, c: 'g', wd: 3 },
    { k: 'fn', f: fx(5), a: 0, b: HP, c: 'b', wd: 3 }
  ].concat([[1, 2.1], [2, 1.6], [5, 1.1]].map(([n, y]) => [
    { k: 'seg', a: [1.0, y], b: [1.18, y], c: COLS[n], wd: 4 },
    { k: 'label', at: [1.22, y], text: 'n=' + n, c: COLS[n], size: 20, anchor: 'start' }]).flat()).concat(extra || []) });
  // y=3e^{−nx} と y=1+2sin x の交点
  const gE = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.2, -0.35, 1.75, 3.35], w: 520, h: 470, items: [
    { k: 'axes', tx: [[0.5, '0.5'], [1, '1'], [HP, 'π/2']], ty: [[1, '1'], [3, '3']], xl: 'x', yl: 'y' },
    { k: 'line', m: 0, n: 1, c: 'd', dash: true },
    { k: 'fn', f: '1+2*sin(x)', a: 0, b: 1.7, c: 'p', wd: 4, label: 'y=1+2sin x', lat: [1.68, 2.62], la: 'end' },
    { k: 'fn', f: ex(1), a: 0, b: 1.7, c: 'y', wd: 3, label: 'n=1', lat: [1.2, 1.15] },
    { k: 'fn', f: ex(2), a: 0, b: 1.2, c: 'g', wd: 3, label: 'n=2', lat: [0.72, 0.52] },
    { k: 'fn', f: ex(5), a: 0, b: 0.75, c: 'b', wd: 3, label: 'n=5', lat: [0.3, 0.28] }
  ].concat([1, 2, 5].map(n => ({ k: 'pt', at: [AN[n], 1 + 2 * Math.sin(AN[n])], c: COLS[n], r: 6 }))).concat(extra || []) });
  const POINTS = [
    '「ただ1つの解」は **連続・単調（微分の符号）＋ 端の値の符号が逆** の2つをそろえて、中間値の定理で示す',
    '解が式で書けない数列は、**方程式そのもの** $3e^{-na_n}=1+2\\sin a_n$ を材料にする。対数をとって $0<a_n<\\dfrac{\\log3}{n}$ ではさむ',
    '$\\infty\\times0$ 型は、$\\dfrac{\\sin x}{x}\\to1$、$\\dfrac{\\log(1+t)}{t}\\to1$ の形が出るように、かけて割って分解する'
  ];

  HB.lesson({
    id: 'osaka24-1', field: '阪大型　数学（理系）', title: '2024 阪大 理系 第1問の類題 ― 指数と sin の方程式の解がつくる数列の極限', level: '2024年度 大阪大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$n$ を自然数とし、$f_n(x)=3e^{-nx}-2\\sin x-1$ とする。ただし、$\\log$ は自然対数を表す。',
      parts: [
        '(1)　方程式 $f_n(x)=0$ は、$0<x<\\dfrac{\\pi}{2}$ の範囲にただ1つの実数解をもつことを示せ。この解を $a_n$ とする。',
        '(2)　極限値 $\\displaystyle\\lim_{n\\to\\infty}a_n$ と $\\displaystyle\\lim_{n\\to\\infty}na_n$ を求めよ。',
        '(3)　極限値 $\\displaystyle\\lim_{n\\to\\infty}n\\,(\\log3-na_n)$ を求めよ。'
      ],
      src: '※ 2024年度 大阪大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '方程式の解を並べてできる数列 $a_n$ の極限を調べます。$a_n$ は式で書けません。そこがこの問題の山です。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '$a_n$ は「$f_n(a_n)=0$ をみたす数」としか分かりません。だから (2)(3) でも、この **方程式そのもの** を材料にします。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'b', size: 'sm', label: 'a_n について分かること', text: '$0<a_n<\\dfrac{\\pi}{2}$\n$3e^{-na_n}-2\\sin a_n-1=0$\n（$a_n$ を $n$ の式で書くことはできない）' },
          gF('f0')] },
      { ask: { type: 'choice', q: '(1)「ただ1つの解をもつ」を示すのに、そろえるべき2つのことは？',
        opts: ['$f_n(0)>0$ と $f_n\\left(\\frac{\\pi}{2}\\right)<0$ だけ', '連続で単調減少、かつ端の値の符号が逆', '$f_n\'(x)=0$ となる $x$ がないこと だけ', '$f_n(x)$ が下に凸であること'], ok: 1,
        why: { 0: '端の値の符号が逆なら「少なくとも1つ」はあります。でも、2つ以上ないことは言えません。', 2: '単調だけでは、解が1つも無いこともあります（ずっと正など）。', 3: '凸かどうかでは、解の個数は決まりません。' },
        good: '中間値の定理で「ある」、単調性で「1つだけ」。この2つをセットで書きます。',
        add: [{ t: 'p', size: 'sm', text: '「ある」＝ 中間値の定理（端の値の符号が逆）\n「1つだけ」＝ 単調（$f_n\'(x)$ の符号）' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。まず微分します。$e^{-nx}$ の微分は $-ne^{-nx}$、$\\sin x$ の微分は $\\cos x$ です。',
        add: [{ t: 'h', text: '(1)　ただ1つの解をもつこと' },
          { t: 'm', tex: "f_n'(x)=-3ne^{-nx}-2\\cos x" },
          gF('f1')] },
      { ask: { type: 'choice', q: '$0\\le x\\le\\dfrac{\\pi}{2}$ で、$f_n\'(x)$ の符号は？',
        opts: ['$x$ によって正にも負にもなる', 'つねに正', 'つねに負', '$n$ が大きいときだけ負'], ok: 2,
        why: { 0: '$-3ne^{-nx}<0$ で、$0\\le x\\le\\frac{\\pi}{2}$ では $\\cos x\\ge0$。どちらの項も正になりません。', 1: '2つの項はどちらも 0 以下です。符号を見直しましょう。', 3: '$n=1$ でも $-3e^{-x}<0$、$-2\\cos x\\le0$。$n$ に関係なく負です。' },
        good: '$-3ne^{-nx}<0$、$-2\\cos x\\le0$（$\\cos x\\ge0$ の範囲だから）。よって $f_n\'(x)<0$ で、$f_n(x)$ は単調に減少します。',
        add: [{ t: 'm', size: 'sm', tex: "-3ne^{-nx}<0,\\quad -2\\cos x\\le0\\quad\\therefore\\ f_n'(x)<0", note: '$0\\le x\\le\\frac{\\pi}{2}$ で\n単調に減少' }] } },
      { say: '端の値を調べます。$f_n(0)=3-0-1=2>0$。$f_n\\left(\\frac{\\pi}{2}\\right)=3e^{-\\frac{n\\pi}{2}}-3$ は、$e^{-\\frac{n\\pi}{2}}<1$ なので負です。',
        add: [{ t: 'm', size: 'sm', tex: 'f_n(0)=2>0,\\qquad f_n\\!\\left(\\tfrac{\\pi}{2}\\right)=3\\bigl(e^{-\\frac{n\\pi}{2}}-1\\bigr)<0' }],
        draw: [{ fig: 'f1', items: [1, 2, 5].map(n => ({ k: 'pt', at: [AN[n], 0], c: COLS[n], r: 6 })) }] },
      { say: '答案にまとめます。「連続」「単調減少」「端の値の符号」「中間値の定理」の4つのことばが入っているか、確かめましょう。',
        add: [{ t: 'ans', label: '(1)', text: '$f_n(x)$ は $0\\le x\\le\\frac{\\pi}{2}$ で連続で、単調に減少する。\n$f_n(0)>0$、$f_n(\\frac{\\pi}{2})<0$ なので、中間値の定理より\n$f_n(x)=0$ は $0<x<\\frac{\\pi}{2}$ にただ1つの解をもつ。' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f_n(a_n)=0$ を、指数の項だけ左に残す形に書きかえます。右のグラフの交点の $x$ 座標が $a_n$ です。',
        add: [{ t: 'h', text: '(2)　aₙ と naₙ の極限' },
          { t: 'm', tex: '3e^{-na_n}=1+2\\sin a_n', note: '…(＊)' },
          gE('e1')] },
      { ask: { type: 'choice', q: '$0<a_n<\\dfrac{\\pi}{2}$ と (＊) から、正しく言えるのは？',
        opts: ['$e^{-na_n}>\\dfrac13$', '$e^{-na_n}<\\dfrac13$', '$e^{-na_n}>1$', '$e^{-na_n}=\\dfrac13$'], ok: 0,
        why: { 1: '$\\sin a_n>0$ なので右辺は 1 より大きい。$3e^{-na_n}>1$ です。', 2: '$a_n>0$ なので $-na_n<0$、$e^{-na_n}<1$ です。', 3: '等号になるのは $\\sin a_n=0$ のとき。$0<a_n$ なのでなりません。' },
        good: '$\\sin a_n>0$ なので $3e^{-na_n}=1+2\\sin a_n>1$。グラフで交点が $y=1$ より上にあることと同じです。',
        add: [{ t: 'm', tex: '3e^{-na_n}>1\\quad\\therefore\\ e^{-na_n}>\\frac13' }] } },
      { say: '両辺の対数をとると $-na_n>-\\log3$。$n$ で割って、$a_n$ を 0 と $\\frac{\\log3}{n}$ ではさめました。はさみうちの原理で $a_n\\to0$ です。',
        add: [{ t: 'm', tex: '0<a_n<\\frac{\\log3}{n}\\ \\longrightarrow\\ 0', note: 'はさみうち' },
          { t: 'm', tex: '\\therefore\\ \\lim_{n\\to\\infty}a_n=\\ans{0}' }],
        draw: [{ fig: 'e1', items: [{ k: 'line', x: Math.log(3) / 5, dash: true, c: 'b' }, { k: 'label', at: [Math.log(3) / 5, 3.1], text: 'log3/5', c: 'b', size: 18, dx: 6, anchor: 'start' }] }] },
      { ask: { type: 'choice', q: '次は $\\displaystyle\\lim_{n\\to\\infty}na_n$。(＊) の対数をとって $na_n$ について解くと？',
        opts: ['$na_n=\\log3+\\log(1+2\\sin a_n)$', '$na_n=\\log3-\\log(1+2\\sin a_n)$', '$na_n=\\dfrac{\\log3}{1+2\\sin a_n}$', '$na_n=\\log(3-1-2\\sin a_n)$'], ok: 1,
        why: { 0: '$\\log3-na_n=\\log(1+2\\sin a_n)$ なので、移項すると引き算です。', 2: '対数の性質は $\\log\\frac{A}{B}=\\log A-\\log B$。割り算にはなりません。', 3: '$\\log(3e^{-na_n})=\\log3-na_n$。対数の中で引き算はできません。' },
        good: '$\\log3-na_n=\\log(1+2\\sin a_n)$ を移項します。',
        add: [{ t: 'm', tex: 'na_n=\\log3-\\log(1+2\\sin a_n)', note: '…(＊＊)' }] } },
      { say: '$a_n\\to0$ なので $\\sin a_n\\to0$、$\\log(1+2\\sin a_n)\\to\\log1=0$。よって $na_n\\to\\log3$ です。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\lim_{n\\to\\infty}a_n=0,\\qquad \\lim_{n\\to\\infty}na_n=\\log3' }] },
      { ask: { type: 'think', q: '$0<na_n<\\log3$ が分かった時点で、「$\\displaystyle\\lim_{n\\to\\infty}na_n=\\log3$」と言ってよいか？',
        hint: '上からおさえただけで、下は 0 です。たとえば $na_n$ がずっと 1 でも、この不等式はみたします。',
        ans: '言えない。$0<na_n<\\log3$ からは「極限があれば $\\log3$ 以下」までしか分からない。(＊＊) のような **等式** が必要。',
        after: 'はさみうちは「両側が同じ値に近づく」ときだけ使えます。$a_n$ には使えましたが、$na_n$ には使えません。' } },

      // ---------- (3) ----------
      { clear: true, cols: [0.62, 0.38], part: '(3)', say: '(3) です。(＊＊) より $\\log3-na_n=\\log(1+2\\sin a_n)$。これに $n$ をかけたものの極限です。',
        add: [{ t: 'h', text: '(3)　n(log 3 − naₙ) の極限' },
          { t: 'm', tex: 'n\\,(\\log3-na_n)=n\\log(1+2\\sin a_n)' },
          { t: 'p', size: 'sm', text: '$n\\to\\infty$、$\\log(1+2\\sin a_n)\\to0$ なので、$\\infty\\times0$ の形。\nこのままでは極限が分からない。' }] },
      { ask: { type: 'choice', q: 'この $\\infty\\times0$ 型を調べるのに、使うとよい極限は？',
        opts: ['$(1+\\frac1n)^n\\to e$ だけ', '$\\frac{\\log x}{x}\\to0$（$x\\to\\infty$）', '$\\frac{\\sin x}{x}\\to1$ と $\\frac{\\log(1+t)}{t}\\to1$', '$\\frac{e^x-1}{x}\\to1$ だけ'], ok: 2,
        why: { 0: '$n$ 乗の形は出てきません。', 1: 'それは $x\\to\\infty$ の極限。ここで 0 に近づくのは $a_n$ です。', 3: '指数は (＊＊) で対数に直したので、もう出てきません。' },
        good: '$x=a_n\\to0$、$t=2\\sin a_n\\to0$ として使えます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '使う極限', text: '$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1,\\qquad \\lim_{t\\to0}\\frac{\\log(1+t)}{t}=1$' }] } },
      { say: '公式の形が出るように、かけて割ります。$a_n$ と $2\\sin a_n$ をはさむのがコツ。$\\sin a_n>0$ なので割ってよいです。',
        add: [{ t: 'm', size: 'sm', tex: 'n\\log(1+2\\sin a_n)=\\hy{na_n}\\cdot\\hb{\\frac{\\sin a_n}{a_n}}\\cdot2\\cdot\\hg{\\frac{\\log(1+2\\sin a_n)}{2\\sin a_n}}' },
          { t: 'm', col: 1, size: 'sm', tex: '\\hy{na_n}\\to\\log3', note: '(2) より' },
          { t: 'm', col: 1, size: 'sm', tex: '\\hb{\\dfrac{\\sin a_n}{a_n}}\\to1', note: '$a_n\\to0$' },
          { t: 'm', col: 1, size: 'sm', tex: '\\hg{\\dfrac{\\log(1+2\\sin a_n)}{2\\sin a_n}}\\to1', note: '$2\\sin a_n\\to0$' }] },
      { ask: { type: 'choice', q: '求める極限値は？',
        opts: ['$\\log3$', '$2\\log3$', '$2$', '$0$'], ok: 1,
        why: { 0: '真ん中の「2」をかけ忘れています。$t=2\\sin a_n$ にしたので、2 が出ています。', 2: '$na_n$ の極限 $\\log3$ をかけ忘れています。', 3: '$\\log(1+2\\sin a_n)\\to0$ だけを見ると 0 に見えますが、$n\\to\\infty$ とつり合います。' },
        good: '$\\log3\\cdot1\\cdot2\\cdot1=2\\log3$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\lim_{n\\to\\infty}n\\,(\\log3-na_n)=2\\log3' }] } },
      { say: '数値でも確かめます。$n$ を大きくすると、たしかに $2\\log3\\approx2.197$ に近づいていきます。（近づき方はゆっくりです）',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['$n$', '$n(\\log3-na_n)$'], ['$10$', '$1.701$'], ['$100$', '$2.132$'], ['$1000$', '$2.190$'], ['$10^6$', '$2.1972$']] }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '(2)(3) の結果を合わせると、$a_n$ がどれくらいの速さで 0 に近づくかが分かります。$\\frac{1}{n}$ の項と $\\frac{1}{n^2}$ の項に分けて書けます。',
        add: [{ t: 'h', text: '別の見方：aₙ の近づき方' },
          { t: 'm', tex: 'na_n=\\log3-\\frac{2\\log3}{n}+(\\text{もっと小さい項})' },
          { t: 'm', tex: 'a_n\\fallingdotseq\\frac{\\log3}{n}-\\frac{2\\log3}{n^2}' },
          { t: 'p', size: 'sm', text: '確かめ：$n=100$ のとき　右辺 $\\approx0.010766$、\n本当の $a_{100}\\approx0.010773$。よく合っています。' },
          gE('e2')] },
      { ask: { type: 'think', q: '(3) を使って、$\\displaystyle\\lim_{n\\to\\infty}\\left(n^2a_n-n\\log3\\right)$ を求めよう。',
        hint: '$n^2a_n-n\\log3=n\\,(na_n-\\log3)$。(3) の式と、符号だけがちがいます。',
        ans: '$n^2a_n-n\\log3=-n\\,(\\log3-na_n)\\to-2\\log3$',
        after: 'このように「主な部分を引いて、残りに $n$ をかける」と、近づき方がもう一段くわしく分かります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。式で書けない数列は「方程式をそのまま使う」。不等式ではさむ、等式で極限、かけて割って分解、の3段です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
