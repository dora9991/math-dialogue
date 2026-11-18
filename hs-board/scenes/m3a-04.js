/* 数学Ⅲ 第1章 関数と極限 ④：数列の極限
   例はすべて自作。極限値は python3（sympy の limit）で、表の値・図の点は数値計算で検算ずみ。 */
(function () {
  const POINTS = [
    '数列は **収束**（極限値 $\\alpha$）か **発散**（正の無限大・負の無限大・振動）のどれか。$\\infty$ は数ではない',
    '$\\dfrac{\\infty}{\\infty}$ の形は **分母の最高次の項** で分母・分子を割る。$\\infty-\\infty$ の形（$\\sqrt{\\ \\ }$ あり）は **有理化** してから',
    '直接求めにくいときは **はさみうちの原理**：$a_n\\le c_n\\le b_n$ で、両はしが同じ $\\alpha$ に収束すれば $c_n\\to\\alpha$'
  ];
  const seq = (f, N) => Array.from({ length: N }, (_, i) => [i + 1, f(i + 1)]);

  HB.lesson({
    id: 'm3a-04', field: '数学Ⅲ　関数と極限', title: '数列の極限', level: '数列の極限', time: '目安 7分',
    problem: { label: '例題', lead: '次の極限を調べよ。',
      parts: ['(1)　$\\displaystyle\\lim_{n\\to\\infty}\\frac{6n^2+5}{3n^2-n}$',
        '(2)　$\\displaystyle\\lim_{n\\to\\infty}(\\sqrt{n^2+4n}-n)$',
        '(3)　$\\displaystyle\\lim_{n\\to\\infty}\\frac{2+(-1)^n}{n}$',
        '(4)　$\\displaystyle\\lim_{n\\to\\infty}(\\sqrt{n^2+6n}-\\sqrt{n^2-2n})$'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '数学Bで数列を学びました。ここからは、項の番号 $n$ を限りなく大きくしたとき、数列がどうなっていくかを考えます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '数列の **収束・発散** を区別できる\n$\\dfrac{\\infty}{\\infty}$、$\\infty-\\infty$ の形の極限を計算できる\n**はさみうちの原理** を使える' }] },

      // ---------- 収束 ----------
      { clear: true, part: '収束', say: '$a_n=2+\\dfrac1n$ は $3,\\ 2.5,\\ 2.33\\cdots$ と、$n$ を大きくすると $2$ に限りなく近づきます。このとき数列は $2$ に **収束** するといい、$2$ を **極限値** といいます。',
        add: [{ t: 'h', text: '数列の収束' },
          { t: 'm', tex: '\\lim_{n\\to\\infty}\\left(2+\\frac1n\\right)=2', note: '「$n\\to\\infty$ のとき\n$a_n\\to2$」とも書く' },
          { t: 'fig', id: 'c1', col: 1, view: [-0.8, -0.5, 11.2, 3.6], w: 560, h: 330, items: [
            { k: 'axes', tx: [1, 5, 10], ty: [1, 3], xl: 'n', yl: 'aₙ' },
            { k: 'line', m: 0, n: 2, dash: true, c: 'b', label: 'y=2', lat: [11, 1.7], la: 'end' },
            { k: 'pts', list: seq(n => 2 + 1 / n, 10), c: 'y', r: 6 }] }] },
      { say: '一般に、$n$ を限りなく大きくするとき $a_n$ が一定の値 $\\alpha$ に限りなく近づくなら、$\\{a_n\\}$ は $\\alpha$ に収束するといい、$\\displaystyle\\lim_{n\\to\\infty}a_n=\\alpha$ と書きます。',
        add: [{ t: 'box', c: 'b', label: '収束', text: '$\\displaystyle\\lim_{n\\to\\infty}a_n=\\alpha$　（極限値 $\\alpha$）\n例：$\\displaystyle\\lim_{n\\to\\infty}\\frac1n=0,\\quad \\lim_{n\\to\\infty}\\frac{1}{n^2}=0$' }] },

      // ---------- 発散 ----------
      { clear: true, cols: [1], part: '発散', say: '収束しないとき、数列は **発散** するといいます。発散には次の3つのタイプがあります。$\\infty$ は数ではないので、「極限値が $\\infty$」とはいいません。',
        add: [{ t: 'h', text: '数列の発散' },
          { t: 'tbl', rows: [['例', '項を並べると', 'いいかた', '書きかた'],
            ['$a_n=n^2$', '$1,\\ 4,\\ 9,\\ 16,\\ \\cdots$', '**正の無限大に発散**', '$\\displaystyle\\lim_{n\\to\\infty}a_n=\\infty$'],
            ['$a_n=-3n$', '$-3,\\ -6,\\ -9,\\ -12,\\ \\cdots$', '**負の無限大に発散**', '$\\displaystyle\\lim_{n\\to\\infty}a_n=-\\infty$'],
            ['$a_n=(-1)^n$', '$-1,\\ 1,\\ -1,\\ 1,\\ \\cdots$', '**振動** する', '極限はない']] },
          { t: 'p', size: 'sm', text: '$\\infty$ は「限りなく大きくなる」ようすを表す記号で、数ではない' }] },
      { ask: { type: 'choice', q: '次の数列のうち、**収束する** ものは？',
        opts: ['$a_n=n^2-n$', '$a_n=(-1)^n\\cdot n$', '$a_n=3-\\dfrac{1}{n^2}$', '$a_n=(-1)^n$'], ok: 2,
        why: { 0: '$n^2-n=n(n-1)$ は限りなく大きくなり、正の無限大に発散します。', 1: '$-1,\\ 2,\\ -3,\\ 4,\\ \\cdots$ と符号を変えながら絶対値が大きくなる（振動）。', 3: '$-1$ と $1$ をくり返すだけで、1つの値に近づきません（振動）。' },
        good: '$\\dfrac1{n^2}\\to0$ なので $3-\\dfrac1{n^2}\\to3$。極限値は $3$ です。' } },

      // ---------- ∞/∞ ----------
      { clear: true, part: '∞/∞ の形', say: '$\\dfrac{3n^2-n}{n^2+2}$ は、分子も分母も限りなく大きくなる $\\dfrac{\\infty}{\\infty}$ の形。このままでは決まりません。**分母の最高次の項 $n^2$** で、分母・分子を割ります。',
        add: [{ t: 'h', text: '$\\dfrac{\\infty}{\\infty}$ の形' },
          { t: 'm', tex: '\\begin{aligned}\\lim_{n\\to\\infty}\\frac{3n^2-n}{n^2+2}&=\\lim_{n\\to\\infty}\\frac{3-\\hy{\\frac1n}}{1+\\hy{\\frac{2}{n^2}}}\\\\ &=\\frac{3-0}{1+0}=3\\end{aligned}', note: '分母・分子を\n$n^2$ で割る' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}\\frac{6n^2+5}{3n^2-n}$ の値は？',
        opts: ['$1$', '$\\infty$', '$2$', '$0$'], ok: 2,
        why: { 0: '$\\dfrac{\\infty}{\\infty}$ は「$1$」とは限りません。$n^2$ で割って考えます。', 1: '$n$ で割るだけでは、まだ $\\dfrac{\\infty}{\\infty}$ の形です。分母の最高次 $n^2$ で割ります。', 3: '分子も分母も2次なので、$0$ にはなりません。' },
        good: '$n^2$ で割ると $\\dfrac{6+\\frac{5}{n^2}}{3-\\frac1n}\\to\\dfrac63=2$。',
        add: [{ t: 'm', tex: '\\lim_{n\\to\\infty}\\frac{6+\\frac{5}{n^2}}{3-\\frac1n}=\\frac{6}{3}=\\ans{2}' }] } },
      { say: '分子と分母の次数をくらべると、結果の見当がつきます。分子の次数が大きいと発散、同じなら最高次の係数の比、分母が大きいと $0$ です。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['次数', '極限'], ['分子 ＜ 分母', '$0$ に収束'], ['分子 ＝ 分母', '最高次の係数の比'], ['分子 ＞ 分母', '発散（$\\infty$ か $-\\infty$）']] },
          { t: 'p', col: 1, size: 'sm', text: '例：$\\dfrac{2n+5}{n^2+1}\\to0$、$\\dfrac{n^2}{4-n}\\to-\\infty$' }] },

      // ---------- ∞−∞ ----------
      { clear: true, part: '∞−∞ の形', say: '$\\sqrt{n^2+4n}-n$ は $\\infty-\\infty$ の形。「$0$」と決めつけてはいけません。$\\sqrt{\\ \\ }$ をふくむときは、分子の **有理化** をします。',
        add: [{ t: 'h', text: '$\\infty-\\infty$ の形' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\sqrt{n^2+4n}-n&=\\frac{(\\sqrt{n^2+4n}-n)(\\sqrt{n^2+4n}+n)}{\\sqrt{n^2+4n}+n}\\\\ &=\\frac{(n^2+4n)-n^2}{\\sqrt{n^2+4n}+n}=\\frac{4n}{\\sqrt{n^2+4n}+n}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{n\\to\\infty}(\\sqrt{n^2+4n}-n)$ の値は？',
        opts: ['$0$', '$2$', '$4$', '$\\infty$'], ok: 1,
        why: { 0: '$\\infty-\\infty$ は $0$ とは限りません。有理化すると $\\dfrac{4n}{\\sqrt{n^2+4n}+n}$ です。', 2: '分母を $n$ で割ると $\\sqrt{1+\\frac4n}+1\\to2$。$2$ で割るのを忘れています。', 3: '有理化すると分子も分母も1次なので、収束します。' },
        good: '分母・分子を $n$ で割ると $\\dfrac{4}{\\sqrt{1+\\frac4n}+1}\\to\\dfrac42=2$。',
        add: [{ t: 'm', tex: '=\\lim_{n\\to\\infty}\\frac{4}{\\sqrt{1+\\frac4n}+1}=\\frac{4}{1+1}=\\ans{2}', note: '$n>0$ なので\n$\\dfrac{\\sqrt{n^2+4n}}{n}=\\sqrt{1+\\frac4n}$' }] } },
      { say: '数値でも確かめましょう。$n=100$ で $1.98\\cdots$、$n=10000$ で $1.9998\\cdots$。たしかに $2$ に近づいています。',
        add: [{ t: 'tbl', col: 1, rows: [['$n$', '$\\sqrt{n^2+4n}-n$'], ['$10$', '$1.832\\cdots$'], ['$100$', '$1.980\\cdots$'], ['$10000$', '$1.9998\\cdots$']] }] },

      // ---------- はさみうち ----------
      { clear: true, part: 'はさみうち', say: '$\\dfrac{2+(-1)^n}{n}$ は、分子が $1$ と $3$ をくり返すので、分母の割り算では決められません。このようなときに使えるのが **はさみうちの原理** です。',
        add: [{ t: 'h', text: 'はさみうちの原理' },
          { t: 'box', c: 'y', label: 'はさみうちの原理', text: 'すべての $n$ で　$a_n\\le c_n\\le b_n$\n$\\displaystyle\\lim_{n\\to\\infty}a_n=\\lim_{n\\to\\infty}b_n=\\alpha$　ならば　$\\displaystyle\\lim_{n\\to\\infty}c_n=\\alpha$' },
          { t: 'fig', id: 's1', col: 1, view: [-0.8, -0.4, 11.2, 3.4], w: 560, h: 330, items: [
            { k: 'axes', tx: [1, 5, 10], ty: [1, 2, 3], xl: 'n', yl: 'cₙ' },
            { k: 'fn', f: '3/x', a: 0.9, b: 11.2, c: 'p', label: '3/n', lat: [3.2, 1.25] },
            { k: 'fn', f: '1/x', a: 0.9, b: 11.2, c: 'b', label: '1/n', lat: [10.9, 0.38], la: 'end' },
            { k: 'pts', list: seq(n => (2 + (n % 2 ? -1 : 1)) / n, 10), c: 'y', r: 6 }] }] },
      { say: '$1\\le2+(-1)^n\\le3$ なので、$n$ で割って $\\dfrac1n\\le\\dfrac{2+(-1)^n}{n}\\le\\dfrac3n$。両はしは $0$ に収束するので、はさまれた数列も $0$ に収束します。',
        add: [{ t: 'm', tex: '\\hb{\\frac1n}\\le\\frac{2+(-1)^n}{n}\\le\\ans{\\frac3n}' },
          { t: 'm', tex: '\\lim_{n\\to\\infty}\\frac1n=\\lim_{n\\to\\infty}\\frac3n=0\\ \\ \\text{より}\\ \\ \\lim_{n\\to\\infty}\\frac{2+(-1)^n}{n}=0' }] },
      { ask: { type: 'choice', q: 'はさみうちの原理で $\\displaystyle\\lim_{n\\to\\infty}\\frac{\\sin n}{n}$ を求めたい。はさむ不等式として正しく、使えるものは？',
        opts: ['$-\\dfrac1n\\le\\dfrac{\\sin n}{n}\\le\\dfrac1n$', '$0\\le\\dfrac{\\sin n}{n}\\le\\dfrac1n$', '$\\dfrac1n\\le\\dfrac{\\sin n}{n}\\le1$', '$-1\\le\\dfrac{\\sin n}{n}\\le1$'], ok: 0,
        why: { 1: '$\\sin n$ は負になることもあります（たとえば $\\sin4<0$）。', 2: '$\\sin n\\le1$ なので、左の不等式は成り立ちません。', 3: '正しい不等式ですが、両はしが同じ値に近づかないので、極限は決まりません。' },
        good: '$-1\\le\\sin n\\le1$ を $n$ で割ります。両はしが $0$ に近づくので、極限値は $0$。' } },

      // ---------- やってみよう ----------
      { clear: true, cols: [1], part: 'やってみよう', say: '最後に、$\\sqrt{\\ \\ }$ が2つある $\\infty-\\infty$ の形です。有理化のしかたは同じです。',
        add: [{ t: 'h', text: 'やってみよう' }, { t: 'm', tex: '\\lim_{n\\to\\infty}(\\sqrt{n^2+6n}-\\sqrt{n^2-2n})' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\lim_{n\\to\\infty}(\\sqrt{n^2+6n}-\\sqrt{n^2-2n})$ を求めよう。',
        hint: '$\\sqrt{n^2+6n}+\\sqrt{n^2-2n}$ をかけて割る。分子は $(n^2+6n)-(n^2-2n)=8n$。',
        ans: '$\\dfrac{8n}{\\sqrt{n^2+6n}+\\sqrt{n^2-2n}}=\\dfrac{8}{\\sqrt{1+\\frac6n}+\\sqrt{1-\\frac2n}}\\to\\dfrac{8}{2}=4$',
        after: '「$\\infty-\\infty$」は、有理化 → 最高次で割る、の順。「$0$」や「$\\infty$」と決めつけないこと。',
        add: [{ t: 'm', tex: '=\\lim_{n\\to\\infty}\\frac{8n}{\\sqrt{n^2+6n}+\\sqrt{n^2-2n}}=\\lim_{n\\to\\infty}\\frac{8}{\\sqrt{1+\\frac6n}+\\sqrt{1-\\frac2n}}=\\ans{4}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、等比数列 $\\{r^n\\}$ の極限が、公比 $r$ によってどう変わるかを調べます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
