/* 数学Ⅰ 第1章 数と式 2節 実数 ③：根号を含む式の計算
   例はすべて自作。答え・途中式・誤答は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '$a>0,\\ b>0$ のとき $\\sqrt a\\sqrt b=\\sqrt{ab}$、$\\dfrac{\\sqrt a}{\\sqrt b}=\\sqrt{\\dfrac ab}$。$\\sqrt{k^2a}=k\\sqrt a$（$k>0$）で、根号の中をできるだけ小さい自然数にする',
    '和・差は、根号の中を簡単にしてから、同じ根号の項どうしを **同類項のように** まとめる。展開は乗法公式がそのまま使える',
    '$\\sqrt{a^2}=|a|$。$a\\ge0$ なら $a$、$a<0$ なら $-a$（$a$ の符号を調べてからはずす）'
  ];
  HB.lesson({
    id: 'm1a-11', field: '数学Ⅰ　数と式', title: '根号を含む式の計算', level: '2節 実数', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\sqrt{80}$ を簡単にする', '(2)　$\\sqrt{12}\\times\\sqrt{18}$', '(3)　$2\\sqrt{27}-\\sqrt{48}+\\sqrt3$', '(4)　$(\\sqrt5-\\sqrt3)^2$', '(5)　$\\sqrt{(1-\\sqrt5)^2}$ を簡単にする', '(6)　$-1<x<3$ のとき　$\\sqrt{(x+1)^2}+\\sqrt{(x-3)^2}$ を簡単にする'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '中学で学んだ平方根の計算を、高校の記号で整理し直します。最後に、前の時間の **絶対値** ともつながります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '根号（$\\sqrt{\\ }$）をふくむ式の、積・商・和・差・展開ができる\n$\\sqrt{a^2}=|a|$ の意味がわかる' }] },

      // ---------- 平方根の復習 ----------
      { clear: true, part: '平方根', say: '$a\\ge0$ のとき、2乗すると $a$ になる数を $a$ の **平方根** といいます。そのうち 0 以上の方を $\\sqrt a$ と書きます。',
        add: [{ t: 'h', text: '平方根の復習' },
          { t: 'm', tex: '\\sqrt a\\ge0,\\qquad (\\sqrt a)^2=a,\\qquad (-\\sqrt a)^2=a', note: '$a\\ge0$' },
          { t: 'p', size: 'sm', text: '例：$7$ の平方根は $\\pm\\sqrt7$　　$\\sqrt{25}=5$（$\\pm5$ ではない）' }] },

      // ---------- 積と商 ----------
      { clear: true, part: '積と商', say: '$a>0,\\ b>0$ のとき、根号どうしのかけ算・わり算は、**中身どうしを計算** して1つの根号にまとめられます。',
        add: [{ t: 'h', text: '根号の積と商' },
          { t: 'box', c: 'y', label: '性質', text: '$a>0,\\ b>0$ のとき\n$\\sqrt a\\sqrt b=\\sqrt{ab}$　　$\\dfrac{\\sqrt a}{\\sqrt b}=\\sqrt{\\dfrac ab}$' },
          { t: 'm', tex: '\\sqrt3\\times\\sqrt7=\\sqrt{21},\\qquad \\frac{\\sqrt{42}}{\\sqrt6}=\\sqrt{\\frac{42}{6}}=\\sqrt7' }] },
      { say: 'なぜ成り立つか。$\\sqrt a\\sqrt b$ を2乗すると $ab$ で、しかも正の数。2乗して $ab$ になる正の数は $\\sqrt{ab}$ だけです。',
        add: [{ t: 'm', size: 'sm', tex: '(\\sqrt a\\sqrt b)^2=(\\sqrt a)^2(\\sqrt b)^2=ab', note: '$\\sqrt a\\sqrt b>0$ なので\n$\\sqrt a\\sqrt b=\\sqrt{ab}$' }] },

      // ---------- √(k²a)=k√a ----------
      { clear: true, part: '根号の中を簡単に', say: '根号の中に **平方数**（$4,\\ 9,\\ 16,\\ 25,\\ \\cdots$）がかくれていたら、外に出せます。$\\sqrt{k^2a}=k\\sqrt a$（$k>0$）です。',
        add: [{ t: 'h', text: '$\\sqrt{k^2a}=k\\sqrt a$　（$k>0$）' },
          { t: 'm', tex: '\\sqrt{48}=\\sqrt{\\hy{4^2}\\times3}=\\hy{4}\\sqrt3', note: '$48=16\\times3$' },
          { t: 'm', tex: '\\sqrt{63}=\\sqrt{\\hy{3^2}\\times7}=\\hy{3}\\sqrt7', note: '$63=9\\times7$' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['$k$', '2', '3', '4', '5', '6', '7'], ['$k^2$', '4', '9', '16', '25', '36', '49']] },
          { t: 'p', col: 1, size: 'xs', text: 'いちばん大きい平方数でくくると、一度ですむ' }] },
      { ask: { type: 'choice', q: '$\\sqrt{80}$ を、根号の中ができるだけ小さい自然数になる形にすると？',
        opts: ['$2\\sqrt{20}$', '$8\\sqrt{10}$', '$4\\sqrt5$', '$16\\sqrt5$'], ok: 2,
        why: { 0: '$\\sqrt{20}$ の中にまだ平方数 4 が残っています。いちばん大きい平方数 16 でくくります。', 1: '$80=8\\times10$ の 8 は平方数ではないので、外に出せません。', 3: '$80=16\\times5$ の 16 は、外に出すと $\\sqrt{16}=4$ になります。' },
        good: '$80=16\\times5=4^2\\times5$ なので $\\sqrt{80}=4\\sqrt5$。',
        add: [{ t: 'm', tex: '\\sqrt{80}=\\sqrt{4^2\\times5}=4\\sqrt5' }] } },
      { say: '積は、かける前に **素因数に分けておく** と、ペアになる数がすぐ見つかります。ペアは1つにして外へ出します。',
        add: [{ t: 'm', tex: '\\sqrt6\\times\\sqrt{15}=\\sqrt{2\\times\\hy{3\\times3}\\times5}=\\hy{3}\\sqrt{10}' }] },
      { ask: { type: 'choice', q: '$\\sqrt{12}\\times\\sqrt{18}$ を計算すると？',
        opts: ['$6\\sqrt6$', '$5\\sqrt6$', '$\\sqrt{30}$', '$36\\sqrt6$'], ok: 0,
        why: { 1: '$2\\sqrt3\\times3\\sqrt2$ の係数は、たすのではなく **かけます**：$2\\times3=6$。', 2: 'かけ算なので、中身は $12\\times18$。たすのはまちがい。', 3: '$\\sqrt{216}=\\sqrt{36\\times6}$ の 36 は、外に出すと $\\sqrt{36}=6$。' },
        good: '$2\\sqrt3\\times3\\sqrt2=6\\sqrt6$（$\\sqrt{216}=\\sqrt{6^2\\times6}$ と考えても同じ）。',
        add: [{ t: 'm', tex: '\\sqrt{12}\\times\\sqrt{18}=2\\sqrt3\\times3\\sqrt2=6\\sqrt6' }] } },

      // ---------- 和と差 ----------
      { clear: true, part: '和と差', say: '$\\sqrt2+\\sqrt3$ は $\\sqrt5$ ではありません。和・差は、**同じ根号の項どうし** だけを、同類項のようにまとめます。',
        add: [{ t: 'h', text: '根号の和と差' },
          { t: 'm', tex: '3\\sqrt2+5\\sqrt2=8\\sqrt2', note: '$3x+5x=8x$ と同じ' },
          { t: 'm', tex: '\\sqrt2+\\sqrt3\\ne\\sqrt5', note: '$1.41+1.73=3.14$\n$\\sqrt5\\approx2.24$' }] },
      { say: '根号の中がちがって見えても、**簡単にすると同じ根号** になることがあります。先に $k\\sqrt a$ の形にしてから、まとめます。',
        add: [{ t: 'm', tex: '\\begin{aligned}\\sqrt{45}+\\sqrt{20}-\\sqrt{80}&=3\\sqrt5+2\\sqrt5-4\\sqrt5\\\\ &=\\sqrt5\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$2\\sqrt{27}-\\sqrt{48}+\\sqrt3$ を計算すると？',
        opts: ['$0$', '$11\\sqrt3$', '$2\\sqrt3$', '$3\\sqrt3$'], ok: 3,
        why: { 0: '$2\\sqrt{27}=2\\times3\\sqrt3=6\\sqrt3$。前の係数 2 もかけます。', 1: '$-\\sqrt{48}=-4\\sqrt3$。ひく項の符号に注意。', 2: '最後の $+\\sqrt3$ は係数 1 の項。わすれずにたします。' },
        good: '$6\\sqrt3-4\\sqrt3+\\sqrt3=3\\sqrt3$。',
        add: [{ t: 'm', tex: '2\\sqrt{27}-\\sqrt{48}+\\sqrt3=6\\sqrt3-4\\sqrt3+\\sqrt3=3\\sqrt3' }] } },

      // ---------- 展開 ----------
      { clear: true, part: '展開', say: '根号をふくむ式も、**文字と同じように** 分配法則・乗法公式で展開できます。$(\\sqrt a)^2=a$ を使って整理します。',
        add: [{ t: 'h', text: '乗法公式で展開する' },
          { t: 'm', tex: '(\\sqrt7+\\sqrt2)(\\sqrt7-\\sqrt2)=(\\sqrt7)^2-(\\sqrt2)^2=5', note: '$(a+b)(a-b)$\n$=a^2-b^2$' }] },
      { ask: { type: 'choice', q: '$(\\sqrt5-\\sqrt3)^2$ を展開すると？',
        opts: ['$2$', '$8-2\\sqrt{15}$', '$8-\\sqrt{15}$', '$2-2\\sqrt{15}$'], ok: 1,
        why: { 0: '$(a-b)^2$ は $a^2-b^2$ ではありません。まん中の $-2ab$ が必要です。', 2: 'まん中の項は $2ab=2\\sqrt5\\sqrt3=2\\sqrt{15}$。2 をわすれずに。', 3: '$(\\sqrt5)^2$ と $(\\sqrt3)^2$ は、どちらも $+$ で $5+3=8$。' },
        good: '$(\\sqrt5)^2-2\\sqrt5\\sqrt3+(\\sqrt3)^2=8-2\\sqrt{15}$。',
        add: [{ t: 'm', tex: '(\\sqrt5-\\sqrt3)^2=5-2\\sqrt{15}+3=8-2\\sqrt{15}' }] } },
      { say: '係数がついていても同じです。1つずつかけて、最後に同類項（数どうし・$\\sqrt3$ どうし）をまとめます。',
        add: [{ t: 'm', tex: '\\begin{aligned}(2\\sqrt3+1)(\\sqrt3-2)&=2\\cdot3-4\\sqrt3+\\sqrt3-2\\\\ &=4-3\\sqrt3\\end{aligned}' }] },

      // ---------- √(a²)=|a| ----------
      { clear: true, part: '√a²＝|a|', say: '$\\sqrt{(-4)^2}$ はいくつ？ 中の $(-4)^2=16$ なので、答えは $4$。根号の値は 0 以上なので、$-4$ にはなりません。',
        add: [{ t: 'h', text: '$\\sqrt{a^2}=|a|$' },
          { t: 'm', tex: '\\sqrt{(-4)^2}=\\sqrt{16}=4=|-4|', note: '$-4$ ではない' }] },
      { say: 'つまり $\\sqrt{a^2}$ は、$a$ を 0 以上にしたもの＝ **絶対値** です。前の時間と同じく、$a$ の符号で場合分けしてはずします。',
        add: [{ t: 'box', c: 'y', label: '大切', text: '$\\sqrt{a^2}=|a|=\\begin{cases} a & (a\\ge0)\\\\ -a & (a<0)\\end{cases}$' }] },
      { ask: { type: 'choice', q: '$\\sqrt{(1-\\sqrt5)^2}$ を簡単にすると？',
        opts: ['$1-\\sqrt5$', '$\\pm(1-\\sqrt5)$', '$\\sqrt5-1$', '$1+\\sqrt5$'], ok: 2,
        why: { 0: '$1-\\sqrt5\\approx-1.24$ は負の数。根号の値は 0 以上なので、そのままではだめです。', 1: '根号の値は1つ（0 以上）。$\\pm$ はつきません。', 3: '$-(1-\\sqrt5)=-1+\\sqrt5$。$1$ の符号も変わります。' },
        good: '$1-\\sqrt5<0$ なので　$|1-\\sqrt5|=-(1-\\sqrt5)=\\sqrt5-1$。',
        add: [{ t: 'm', tex: '\\sqrt{(1-\\sqrt5)^2}=|1-\\sqrt5|=\\sqrt5-1', note: '$1-\\sqrt5<0$' }] } },
      { ask: { type: 'think', q: '$-1<x<3$ のとき、$\\sqrt{(x+1)^2}+\\sqrt{(x-3)^2}$ を簡単にしよう。',
        hint: '$|x+1|+|x-3|$ です。$-1<x<3$ のとき、$x+1$ と $x-3$ はそれぞれ正？負？',
        ans: '$x+1>0$、$x-3<0$ なので　$(x+1)-(x-3)=4$',
        after: '数直線で見ると、$x$ から $-1$ までと $3$ までの距離の和。間にいれば、いつも 4 です。',
        add: [{ t: 'm', size: 'sm', tex: '|x+1|+|x-3|=(x+1)-(x-3)=4', note: '$-1<x<3$' },
          { t: 'fig', id: 'nd', col: 1, view: [-2.5, -1.6, 4.5, 1.4], w: 600, h: 257, items: [{ k: 'numline' },
            { k: 'pt', at: [-1, 0], c: 'y' }, { k: 'pt', at: [3, 0], c: 'y' }, { k: 'pt', at: [1.5, 0], c: 'p', name: 'x', dir: 's', off: 54 },
            { k: 'dim', a: [-1, 0], b: [1.5, 0], dy: -26, label: 'x+1', c: 'b' }, { k: 'dim', a: [1.5, 0], b: [3, 0], dy: -26, label: '3−x', c: 'g' },
            { k: 'dim', a: [-1, 0], b: [3, 0], dy: 92, label: '4', c: 'p' }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、分母に根号がある式を、根号のない形に直す **分母の有理化** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
