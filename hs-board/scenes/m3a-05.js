/* 数学Ⅲ 第1章 関数と極限 ⑤：無限等比数列 {rⁿ} の極限
   例はすべて自作。極限値は python3（sympy の limit。r が負のときは偶数番目・奇数番目に分けて）で検算ずみ。図の点は数値計算。 */
(function () {
  const POINTS = [
    '$\\{r^n\\}$ の極限：$r>1$ で $\\infty$ に発散、$r=1$ で $1$、$|r|<1$ で $0$、$r\\le-1$ で振動。**収束する ⇔ $-1<r\\le1$**',
    '$r^n$ をふくむ $\\dfrac{\\infty}{\\infty}$ の形は、**いちばん大きい底**（$3^n$ など）で分母・分子を割り、$\\left(\\dfrac23\\right)^n\\to0$ を使う',
    '$r$ が文字のときは、$|r|<1$・$r=1$・$|r|>1$（必要なら $r=-1$）に **場合分け** する。$r=1$ を忘れない'
  ];
  const pw = (r, N) => Array.from({ length: N }, (_, i) => [i + 1, Math.pow(r, i + 1)]);

  HB.lesson({
    id: 'm3a-05', field: '数学Ⅲ　関数と極限', title: '無限等比数列 rⁿ の極限', level: '数列の極限', time: '目安 7分',
    noDec: true,   // (2/3)ⁿ などの底に小数がつくと読みにくい
    problem: { label: '例題', lead: '次の極限を調べよ。',
      parts: ['(1)　$\\displaystyle\\lim_{n\\to\\infty}\\left(-\\frac34\\right)^n$',
        '(2)　数列 $\\left\\{\\left(\\dfrac{x-2}{3}\\right)^n\\right\\}$ が収束する $x$ の値の範囲',
        '(3)　$\\displaystyle\\lim_{n\\to\\infty}\\frac{3^{n+1}-2^n}{3^n+2^n}$',
        '(4)　$\\displaystyle\\lim_{n\\to\\infty}\\frac{r^{n+1}+2}{r^n+1}\\ \\ (r\\neq-1)$'] },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: 'めあて', say: '前の時間は、数列の極限の基本を学びました。この時間は、等比数列 $\\{r^n\\}$ の極限が、公比 $r$ によってどう変わるかを調べます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '$\\{r^n\\}$ の極限を、$r$ の値で分けて言える\n$r^n$ をふくむ式の極限を求められる\n$r$ が文字のとき、場合分けして極限を求められる' }] },

      // ---------- r>0 ----------
      { clear: true, part: 'r が正のとき', say: '$r=1.2$ なら $1.2,\\ 1.44,\\ 1.728,\\ \\cdots$ と限りなく大きくなります。$r=0.6$ なら $0.6,\\ 0.36,\\ 0.216,\\ \\cdots$ と $0$ に近づきます。',
        add: [{ t: 'h', text: '$\\{r^n\\}$ の極限（$r>0$ のとき）' },
          { t: 'tbl', size: 'sm', rows: [['$n$', '$1$', '$2$', '$3$', '$4$', '$\\cdots$'], ['$1.2^n$', '$1.2$', '$1.44$', '$1.728$', '$2.07\\cdots$', '$\\to\\infty$'], ['$0.6^n$', '$0.6$', '$0.36$', '$0.216$', '$0.13\\cdots$', '$\\to0$']] },
          { t: 'fig', id: 'p1', col: 1, view: [-0.6, -0.5, 8.8, 4.4], w: 560, h: 340, items: [
            { k: 'axes', tx: [1, 4, 8], ty: [1, 2, 3, 4], xl: 'n', yl: 'rⁿ' },
            { k: 'pts', list: pw(1.2, 8), c: 'p', r: 6 }, { k: 'label', at: [6.6, 3.7], text: 'r=1.2', c: 'p', size: 22, anchor: 'end' },
            { k: 'pts', list: pw(0.6, 8), c: 'b', r: 6 }, { k: 'label', at: [6.2, 0.45], text: 'r=0.6', c: 'b', size: 22 }] }] },
      { say: '$r=1$ なら、どの項も $1$ なので極限値は $1$。まとめると、$r>1$ なら正の無限大に発散、$r=1$ なら $1$、$0<r<1$ なら $0$ に収束します。',
        add: [{ t: 'p', size: 'sm', text: '$r>1$ → $\\infty$ に発散　　$r=1$ → $1$ に収束\n$0<r<1$ → $0$ に収束（$r=0$ でも $0$）' }],
        draw: [{ fig: 'p1', items: [{ k: 'pts', list: pw(1, 8), c: 'y', r: 6 }, { k: 'label', at: [8.7, 1], text: 'r=1', c: 'y', size: 22, dy: -20, anchor: 'end' }] }] },

      // ---------- r<0 ----------
      { clear: true, part: 'r が負のとき', say: '$r$ が負のとき、$r^n$ は正と負が交互に入れかわります。$r=-0.6$ なら、ゆれながら $0$ に近づきます。$r=-1.2$ なら、ゆれ幅が大きくなっていきます。',
        add: [{ t: 'h', text: '$\\{r^n\\}$ の極限（$r<0$ のとき）' },
          { t: 'tbl', size: 'sm', rows: [['$n$', '$1$', '$2$', '$3$', '$4$', '$\\cdots$'], ['$(-0.6)^n$', '$-0.6$', '$0.36$', '$-0.216$', '$0.13\\cdots$', '$\\to0$'], ['$(-1.2)^n$', '$-1.2$', '$1.44$', '$-1.728$', '$2.07\\cdots$', '振動']] },
          { t: 'p', size: 'sm', text: '$r=-1$ なら　$-1,\\ 1,\\ -1,\\ 1,\\ \\cdots$　と振動する' },
          { t: 'fig', id: 'p2', col: 1, view: [-0.6, -4.4, 8.8, 4.6], w: 560, h: 470, items: [
            { k: 'axes', tx: [1, 4, 8], ty: [-4, -2, 2, 4], xl: 'n', yl: 'rⁿ' },
            { k: 'pts', list: pw(-1.2, 8), c: 'p', r: 6 },
            { k: 'label', at: [7.8, 4.3], text: 'r=−1.2', c: 'p', size: 22, anchor: 'end' },
            { k: 'poly', pts: pw(-0.6, 8), c: 'b', wd: 1.5 }, { k: 'pts', list: pw(-0.6, 8), c: 'b', r: 6 },
            { k: 'label', at: [3.5, -1.2], text: 'r=−0.6', c: 'b', size: 22 }] }] },

      // ---------- まとめの表 ----------
      { clear: true, cols: [1], part: 'r による分類', say: '$\\{r^n\\}$ の極限を、$r$ の値で分けてまとめます。収束するのは $-1<r\\le1$ のとき。$r=-1$ はふくまず、$r=1$ はふくむことに注意します。',
        add: [{ t: 'h', text: '$\\{r^n\\}$ の極限のまとめ' },
          { t: 'fig', id: 'nl', view: [-3.4, -0.6, 3.4, 1.6], w: 980, h: 250, items: [
            { k: 'numline', ticks: [-1, 0, 1] },
            { k: 'range', from: null, to: -1, toIn: true, c: 'p', label: '振動する' },
            { k: 'range', from: -1, to: 1, fromIn: false, toIn: false, c: 'b', label: '0 に収束' },
            { k: 'range', from: 1, to: null, fromIn: false, c: 'g', label: '∞ に発散' },
            { k: 'pt', at: [1, 0], c: 'y', r: 8, name: '1 に収束', dir: 'n', off: 92, size: 24 },
            { k: 'seg', a: [1, 0.13], b: [1, 0.62], c: 'y', wd: 2 }] },
          { t: 'box', c: 'y', label: '収束条件', text: '$\\{r^n\\}$ が収束する　⟺　$-1<r\\le1$\n（$|r|<1$ のとき極限値 $0$、$r=1$ のとき極限値 $1$）' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}\\left(-\\frac34\\right)^n$ は？',
        opts: ['$0$', '振動する（極限はない）', '$-\\infty$', '$\\dfrac34$'], ok: 0,
        why: { 1: '符号は交互に変わりますが、$\\left|-\\dfrac34\\right|<1$ なので絶対値が $0$ に近づき、$0$ に収束します。', 2: '負の数の累乗は、正と負をくり返します。$-\\infty$ にはなりません。', 3: '$r^n$ の値は、$n$ が大きくなると変わっていきます。' },
        good: '$-1<-\\dfrac34<1$ なので、$0$ に収束します。' } },
      { ask: { type: 'choice', q: '数列 $\\left\\{\\left(\\dfrac{x-2}{3}\\right)^n\\right\\}$ が収束する $x$ の値の範囲は？',
        opts: ['$-1<x<5$', '$-1<x\\le5$', '$-1\\le x\\le5$', '$-5<x\\le1$'], ok: 1,
        why: { 0: '公比が $1$ のときも、$1$ に収束します。$x=5$ をふくみます。', 2: '公比が $-1$（$x=-1$）のときは振動するので、ふくみません。', 3: '$-3<x-2\\le3$ の各辺に $2$ を足します。' },
        good: '$-1<\\dfrac{x-2}{3}\\le1$ から $-3<x-2\\le3$、よって $-1<x\\le5$。',
        add: [{ t: 'm', tex: '-1<\\frac{x-2}{3}\\le1\\ \\ \\Longrightarrow\\ \\ \\ans{-1<x\\le5}' }] } },

      // ---------- rⁿ をふくむ式 ----------
      { clear: true, cols: [1], part: 'rⁿ をふくむ式', say: '$\\dfrac{3^{n+1}-2^n}{3^n+2^n}$ は $\\dfrac{\\infty}{\\infty}$ の形。**いちばん大きい底の $3^n$** で分母・分子を割ると、$0$ に収束する $\\left(\\dfrac23\\right)^n$ の形が出てきます。',
        add: [{ t: 'h', text: '$r^n$ をふくむ式の極限' },
          { t: 'm', tex: '\\frac{3^{n+1}-2^n}{3^n+2^n}=\\frac{\\hy{3}-\\left(\\frac23\\right)^n}{1+\\left(\\frac23\\right)^n}', note: '分母・分子を $3^n$ で割る\n$3^{n+1}\\div3^n=3$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}\\frac{3^{n+1}-2^n}{3^n+2^n}$ の値は？',
        opts: ['$1$', '$0$', '$\\infty$', '$3$'], ok: 3,
        why: { 0: '$3^{n+1}=3\\cdot3^n$ です。$3^n$ と同じではありません。', 1: '$\\left(\\dfrac23\\right)^n$ は $0$ に近づきますが、$3$ と $1$ は残ります。', 2: '$3^n$ で割ると、分子も分母も収束します。' },
        good: '$\\dfrac{3-0}{1+0}=3$。$3^{n+1}=3\\cdot3^n$ と見るのがポイントです。',
        add: [{ t: 'm', tex: '\\lim_{n\\to\\infty}\\frac{3-\\left(\\frac23\\right)^n}{1+\\left(\\frac23\\right)^n}=\\frac{3-0}{1+0}=\\ans{3}' }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\lim_{n\\to\\infty}\\frac{4^n-5^n}{4^n+5^n}$ を求めよう。',
        hint: 'いちばん大きい底は $5$。分母・分子を $5^n$ で割る。',
        ans: '$\\dfrac{\\left(\\frac45\\right)^n-1}{\\left(\\frac45\\right)^n+1}\\to\\dfrac{0-1}{0+1}=-1$',
        after: '小さい底で割ると $\\left(\\dfrac54\\right)^n\\to\\infty$ が出てきて、うまくいきません。**大きい底で割る** のがコツです。' } },

      // ---------- r で場合分け ----------
      { clear: true, part: 'r で場合分け', say: '公比が文字 $r$ のときは、$r^n$ のふるまいで場合を分けます。$\\dfrac{r^{n+1}+2}{r^n+1}$（$r\\neq-1$）の極限を考えます。',
        add: [{ t: 'h', text: '$\\displaystyle\\lim_{n\\to\\infty}\\frac{r^{n+1}+2}{r^n+1}\\ \\ (r\\neq-1)$' },
          { t: 'box', c: 'b', size: 'sm', label: '分け方', text: '$|r|<1$、$r=1$、$|r|>1$ の3つ\n（$r=-1$ だと、$n$ が奇数のとき分母が $0$ になる）' }] },
      { say: '$|r|<1$ なら、$r^n\\to0$、$r^{n+1}\\to0$ です。そのまま代入して、極限値は $\\dfrac{0+2}{0+1}=2$。',
        add: [{ t: 'm', tex: '|r|<1:\\quad \\frac{r^{n+1}+2}{r^n+1}\\to\\frac{0+2}{0+1}=\\ans{2}' }] },
      { ask: { type: 'choice', q: '$r=1$ のとき、極限値は？',
        opts: ['$2$', '$1$', '$\\dfrac32$', '$3$'], ok: 2,
        why: { 0: 'それは $|r|<1$ のとき。$r=1$ なら $r^n=1$ のままで、$0$ にはなりません。', 1: '$1^n=1$ を代入すると $\\dfrac{1+2}{1+1}$ です。', 3: '分母の $1^n+1=2$ で割るのを忘れています。' },
        good: '$r^n=r^{n+1}=1$ なので $\\dfrac{1+2}{1+1}=\\dfrac32$。',
        add: [{ t: 'm', tex: 'r=1:\\quad \\frac{1+2}{1+1}=\\ans{\\frac32}' }] } },
      { ask: { type: 'think', q: '$|r|>1$ のときの極限を求めよう。',
        hint: '分母・分子を $r^n$ で割る。$|r|>1$ なら $\\left|\\dfrac1r\\right|<1$ なので $\\dfrac{1}{r^n}\\to0$。',
        ans: '$\\dfrac{r+\\frac{2}{r^n}}{1+\\frac{1}{r^n}}\\to\\dfrac{r+0}{1+0}=r$',
        after: '$|r|<1$ のとき $2$、$r=1$ のとき $\\dfrac32$、$|r|>1$ のとき $r$。答えは1つの式になりません。',
        add: [{ t: 'm', tex: '|r|>1:\\quad \\frac{r+\\frac{2}{r^n}}{1+\\frac{1}{r^n}}\\to\\ans{r}' },
          { t: 'tbl', col: 1, rows: [['$r$ の範囲', '極限値'], ['$|r|<1$', '$2$'], ['$r=1$', '$\\dfrac32$'], ['$|r|>1$', '$r$']] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、数列の項を限りなく足していく **無限級数** と、その代表の **無限等比級数** です。$r^n$ の極限がそのまま使えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
