/* 2025 広島大 理系 第2問の類題（自作）：数学Ⅱ 図形と方程式・対数関数、数学B 数列 ― 垂線と平行線をくり返してできる点列と漸化式
   元の問題はうつしていない（「三角形の2辺をふくむ2直線の間で、垂線を下ろす・平行線を引くことをくり返して点列を作る」
   「x 座標の1次の漸化式 → 文字の範囲 → 一般項 → 隣の項の差が小さくなる最初の番号を常用対数で」というねらいと形式だけを合わせた自作問題。
   三角形は O(0,0)・A(4,0)・B(1,3)、垂線は直線 AB へ、平行線は OB に平行）。
   答え（python3・sympy と分数の計算で検算ずみ）：
   (1) Q₁((p+4)/2, (4−p)/2)、P₂((2p+4)/3, 0)。同じ計算で x_{n+1}=(2x_n+4)/3
   (2) 必要：0≦x₂≦4 ⇔ −2≦p≦4。十分：0≦x_n≦4 ⇒ 4/3≦x_{n+1}≦4（帰納法）。答 −2≦p≦4（p=−2 では Q₁=B、P₂=O）
   (3) x_n = 4+(p−4)(2/3)^{n−1}
   (4) p=0：P_nP_{n+1}=(4/3)(2/3)^{n−1} < 1/1000 ⇔ (n−1)(0.4771−0.3010) > 3+0.6020−0.4771 ⇔ n−1 > 17.74… → n=19
       （n=18 で 0.00135、n=19 で 0.00090。分数で直接計算しても 19） */
(function () {
  const O = [0, 0], A = [4, 0], B = [1, 3];
  const POINTS = [
    '垂線の足は「傾きの積が −1 の直線」との交点。1回の操作を **$x_n\\to x_{n+1}$ の1次式** にまとめれば、あとは漸化式の問題',
    '「すべての $n$ で〜」は、最初の1つで **必要条件**、「$0\\leqq x_n\\leqq4$ なら $0\\leqq x_{n+1}\\leqq4$」の帰納法で **十分性**',
    '$x_{n+1}-4=\\frac23(x_n-4)$ と変形して一般項。常用対数で $n$ を求めるときは、**負の数で割ると不等号が逆向き**'
  ];
  // P_n → Q_n → P_{n+1} をくり返す図（p は P₁ の x 座標）
  const Qof = x => [(x + 4) / 2, (4 - x) / 2];
  const zig = (p, N, names) => {
    const out = []; let x = p;
    for (let n = 1; n <= N; n++) {
      const Q = Qof(x), x2 = (2 * x + 4) / 3;
      out.push({ k: 'seg', a: [x, 0], b: Q, c: 'y', wd: 3 }, { k: 'right', o: Q, a: [x, 0], b: A, s: 11, c: 'y' },
        { k: 'seg', a: Q, b: [x2, 0], c: 'g', wd: 3 });
      if (names) out.push({ k: 'pt', at: Q, name: 'Q' + '₁₂₃₄'[n - 1], dir: 'ne', c: 'y', r: 5, size: 21 });
      out.push({ k: 'pt', at: [x, 0], c: 'p', r: 5 });
      if (names && n <= 3) out.push({ k: 'label', at: [x, 0], text: 'P' + '₁₂₃'[n - 1], dy: 24, c: 'p', size: 21 });
      x = x2;
    }
    out.push({ k: 'pt', at: [x, 0], c: 'p', r: 5 });
    return out;
  };
  const tri = (x0) => [
    { k: 'line', m: 0, n: 0, a: x0, b: 4.55, c: 'd', wd: 2 },
    { k: 'line', p1: A, p2: B, a: 0.6, b: 4.4, c: 'd', wd: 1.5, dash: true },
    { k: 'poly', pts: [O, A, B], close: true, c: 'w', wd: 2.5 },
    { k: 'label', at: O, text: 'O', dx: -4, dy: 24, size: 22 }, { k: 'label', at: A, text: 'A', dx: 12, dy: 22, size: 22 }, { k: 'pt', at: B, name: 'B', dir: 'nw', c: 'w', r: 5, size: 22 }];
  const fig = (id, x0, items, h) => { const v = [x0, -0.55, 4.7, 3.45], H = h || 380; return { t: 'fig', id, col: 1, view: v, w: Math.round(H * (v[2] - v[0]) / (v[3] - v[1])), h: H, items: tri(x0 + 0.1).concat(items || []) }; };

  HB.lesson({
    id: 'hiro25-2', field: '広島大型　数学（理系）', title: '2025 広島大 理系 第2問の類題 ― 垂線と平行線でつくる点列と漸化式', level: '2025年度 広島大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '座標平面上に3点 O(0, 0)，A(4, 0)，B(1, 3) を頂点とする $\\triangle\\mathrm{OAB}$ がある。実数 $p$ に対し、直線 OA 上に点 $\\mathrm{P}_1(p,\\ 0)$ をとり、$n=1,2,3,\\cdots$ について次の操作で点 $\\mathrm{Q}_n$，$\\mathrm{P}_{n+1}$ を定める。\n・点 $\\mathrm{P}_n$ から直線 AB に下ろした垂線と、直線 AB との交点を $\\mathrm{Q}_n$ とする。\n・点 $\\mathrm{Q}_n$ を通り直線 OB に平行な直線と、直線 OA との交点を $\\mathrm{P}_{n+1}$ とする。\n$\\mathrm{P}_n$ の $x$ 座標を $x_n$ とする。必要ならば $\\log_{10}2=0.3010$，$\\log_{10}3=0.4771$ を用いてよい。',
      parts: [
        '(1)　点 $\\mathrm{Q}_1$，$\\mathrm{P}_2$ の座標を $p$ を用いて表せ。',
        '(2)　命題「$n\\geqq2$ であるすべての自然数 $n$ について、点 $\\mathrm{P}_n$ は辺 OA 上にある」が真となるような $p$ の値の範囲を求めよ。',
        '(3)　$x_n$ を $n$ と $p$ を用いて表せ。',
        '(4)　$p=0$ のとき、線分 $\\mathrm{P}_n\\mathrm{P}_{n+1}$ の長さが $\\dfrac1{1000}$ より小さくなるような最小の自然数 $n$ を求めよ。'
      ],
      src: '※ 2025年度 広島大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: '問題', say: '図形の操作をくり返して点の列を作る問題です。図形と方程式・数列・対数が1本につながります。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '右の図は $p=-1$ の場合。黄色の垂線と緑の平行線を交互に引くと、P がジグザグに A へ近づいていきます。',
        add: [{ t: 'h', text: '操作をくり返すと' },
          { t: 'p', size: 'sm', text: '黄：$\\mathrm{P}_n$ から直線 AB への垂線\n緑：$\\mathrm{Q}_n$ を通り OB に平行な直線' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　1回ぶんの操作を座標で計算\n→ $x_n$ から $x_{n+1}$ を作る **1次式** にまとめる\n(2)(3)　漸化式で考える\n(4)　常用対数で $n$ をしぼる' },
          fig('z0', -1.5, zig(-1, 4, true))] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。直線 AB は2点 A(4, 0)，B(1, 3) を通るので $y=-x+4$。傾きは $-1$ です。',
        add: [{ t: 'h', text: '(1)　Q₁ と P₂ の座標' },
          { t: 'm', tex: '\\mathrm{AB}:\\ y=-x+4', note: '傾き $-1$' },
          fig('z1', -1.5, zig(-1, 1, true))] },
      { ask: { type: 'choice', q: '$\\mathrm{P}_1(p,\\ 0)$ から AB に下ろした垂線の足 $\\mathrm{Q}_1$ の座標は？',
        opts: ['$\\left(\\frac{p+4}{2},\\ \\frac{p-4}{2}\\right)$', '$\\left(\\frac{4-p}{2},\\ \\frac{p+4}{2}\\right)$', '$\\left(\\frac{p+4}{2},\\ \\frac{4-p}{2}\\right)$', '$(p+4,\\ -p)$'], ok: 2,
        why: { 0: '$y=-x+4$ に $x=\\frac{p+4}2$ を入れると $y=\\frac{4-p}2$。符号が逆です。', 1: '$x$ 座標と $y$ 座標が入れかわっています。', 3: '$2x=p+4$ の 2 で割り忘れています。' },
        good: '垂線は傾き 1 で $y=x-p$。$y=-x+4$ と連立して $2x=p+4$。',
        add: [{ t: 'm', size: 'sm', tex: 'y=x-p\\ \\text{と}\\ y=-x+4\\ \\text{を連立}' },
          { t: 'm', tex: '\\mathrm{Q}_1\\left(\\frac{p+4}{2},\\ \\frac{4-p}{2}\\right)' }] } },
      { say: 'OB の傾きは 3。$\\mathrm{Q}_1$ を通る傾き 3 の直線で $y=0$ とすると、$x$ は $\\mathrm{Q}_1$ の $x$ 座標から $\\frac{4-p}{2}\\div3$ だけ左にずれます。',
        add: [{ t: 'm', size: 'sm', tex: 'y-\\frac{4-p}{2}=3\\left(x-\\frac{p+4}{2}\\right)' }] },
      { ask: { type: 'choice', q: '$\\mathrm{P}_2$ の $x$ 座標は？',
        opts: ['$\\dfrac{p+4}{2}$', '$\\dfrac{2p+4}{3}$', '$\\dfrac{p+8}{3}$', '$\\dfrac{4p+8}{3}$'], ok: 1,
        why: { 0: 'それは $\\mathrm{Q}_1$ から真下（$y$ 軸に平行）に下ろした点。OB に平行に下ります。', 2: '$\\frac{4-p}{6}$ を足しています。右上がりの直線を下るので、左にずれます。', 3: '分母を 6 にそろえたあと、3 で割っています。$\\frac{4p+8}{6}=\\frac{2p+4}{3}$。' },
        good: '$x=\\dfrac{p+4}{2}-\\dfrac{4-p}{6}=\\dfrac{3p+12-4+p}{6}=\\dfrac{2p+4}{3}$。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{Q}_1\\left(\\frac{p+4}{2},\\,\\frac{4-p}{2}\\right),\\ \\mathrm{P}_2\\left(\\frac{2p+4}{3},\\,0\\right)' }],
        draw: [{ fig: 'z1', items: [{ k: 'pt', at: [2 / 3, 0], c: 'p', r: 5 }, { k: 'label', at: [2 / 3, 0], text: 'P₂', dy: 24, c: 'p', size: 21 }] }] } },
      { say: 'この計算は、$p$ を $x_n$ に変えれば $\\mathrm{P}_n$ から $\\mathrm{P}_{n+1}$ を作る計算そのもの。だから、すべての $n$ で次の漸化式が成り立ちます。',
        add: [{ t: 'box', c: 'y', label: '漸化式', tex: 'x_1=p,\\qquad x_{n+1}=\\frac23x_n+\\frac43' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\mathrm{P}_n$ が辺 OA 上 ⇔ $0\\leqq x_n\\leqq4$。まず $n=2$ で成り立つことが必要です。',
        add: [{ t: 'h', text: '(2)　n ≧ 2 のすべてで Pₙ が辺 OA 上' },
          { t: 'm', tex: '0\\leqq\\frac{2p+4}{3}\\leqq4\\iff-2\\leqq p\\leqq4', note: '必要条件' },
          fig('z2', -2.5, zig(-2, 3, false).concat([{ k: 'label', at: [-2, 0], text: 'P₁', dy: 24, c: 'p', size: 21 }, { k: 'label', at: [1, 3], text: '= Q₁', dx: 34, dy: -4, c: 'y', size: 20 }]), 300)] },
      { ask: { type: 'choice', q: '$-2\\leqq p\\leqq4$ のとき、$n\\geqq3$ でも成り立つと言うには、何を示す？',
        opts: ['何も示さなくてよい', '$0\\leqq x_n\\leqq4$ なら $x_{n+1}$ も', '$x_n$ が増加すること', 'つねに $x_n<4$ であること'], ok: 1,
        why: { 0: '「すべての $n$」なので、$n\\geqq3$ の理由も必要です。', 2: '$p=4$ では増加しません。増加だけでは 4 以下とも言えません。', 3: '$p=4$ では $x_n=4$。0 以上も必要です。' },
        good: '「$0\\leqq x_n\\leqq4$ なら $0\\leqq x_{n+1}\\leqq4$」を示せば、帰納法で $n=2$ から順に成り立ちます。',
        add: [{ t: 'm', size: 'sm', tex: '0\\leqq x_n\\leqq4\\Rightarrow\\frac43\\leqq x_{n+1}\\leqq4', note: '十分性' }] } },
      { say: '必要条件と十分性がそろいました。図は境目の $p=-2$。$\\mathrm{Q}_1$ がちょうど B、$\\mathrm{P}_2$ がちょうど O になります。',
        add: [{ t: 'ans', label: '(2) 答', tex: '-2\\leqq p\\leqq4' }] },
      { ask: { type: 'think', q: '$p=5$ のとき、$x_2$ と $x_3$ を求めよう。$\\mathrm{P}_n$ はどう動く？',
        hint: '$x_{n+1}=\\frac23x_n+\\frac43$ に順に入れる。',
        ans: '$x_2=\\dfrac{14}{3},\\ x_3=\\dfrac{40}{9}$。どちらも 4 より大きく、A の右側から A に近づく（辺 OA にはのらない）',
        after: '$x_{n+1}-4=\\frac23(x_n-4)$ なので、$x_n-4$ の符号は変わりません。これが (3) の形です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$x_{n+1}=\\frac23x_n+\\frac43$ は、$\\alpha=\\frac23\\alpha+\\frac43$ の解 $\\alpha=4$ を使って、$x_{n+1}-4=\\frac23(x_n-4)$ と変形できます。',
        add: [{ t: 'h', text: '(3)　一般項 xₙ' },
          { t: 'm', tex: 'x_{n+1}-4=\\frac23(x_n-4)', note: '$\\alpha=\\frac23\\alpha+\\frac43$\nより $\\alpha=4$' },
          { t: 'p', size: 'sm', text: '数列 $\\{x_n-4\\}$ は、初項 $p-4$、公比 $\\frac23$ の等比数列' }] },
      { ask: { type: 'choice', q: '$x_n$ は？',
        opts: ['$4+(p-4)\\left(\\frac23\\right)^{n}$', '$4+(4-p)\\left(\\frac23\\right)^{n-1}$', '$p+4\\left(\\frac23\\right)^{n-1}$', '$4+(p-4)\\left(\\frac23\\right)^{n-1}$'], ok: 3,
        why: { 0: '初項が第1項なので、公比は $n-1$ 回かけます。$n=1$ で $p$ になるか確かめましょう。', 1: '初項は $x_1-4=p-4$。符号が逆です。', 2: '等比数列になるのは $x_n-4$。$x_n$ そのものではありません。' },
        good: '$x_n-4=(p-4)\\left(\\frac23\\right)^{n-1}$。$n=1$ を入れると $x_1=p$ で合っています。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'x_n=4+(p-4)\\left(\\frac23\\right)^{n-1}' }] } },
      { ask: { type: 'think', q: '図形で見ると、$4-x_n$ は線分 $\\mathrm{AP}_n$ の長さ（$x_n\\leqq4$ のとき）。1回の操作で $\\mathrm{AP}$ が $\\frac23$ 倍になることを、図形の性質で説明しよう。',
        hint: '$\\angle\\mathrm{OAB}=45^\\circ$。$\\triangle\\mathrm{AP}_{n+1}\\mathrm{Q}_n$ と $\\triangle\\mathrm{AOB}$ は相似（$\\mathrm{Q}_n\\mathrm{P}_{n+1}\\parallel\\mathrm{BO}$）。',
        ans: '$\\mathrm{AQ}_n=\\mathrm{AP}_n\\cos45^\\circ=\\dfrac{\\mathrm{AP}_n}{\\sqrt2}$。相似比から $\\mathrm{AP}_{n+1}=\\mathrm{AQ}_n\\cdot\\dfrac{\\mathrm{AO}}{\\mathrm{AB}}=\\dfrac{\\mathrm{AP}_n}{\\sqrt2}\\cdot\\dfrac{4}{3\\sqrt2}=\\dfrac23\\mathrm{AP}_n$',
        after: '公比 $\\frac23$ は「$\\cos45^\\circ$」と「相似比 $\\frac{4}{3\\sqrt2}$」の積でした。座標の計算と図形の見方が一致します。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$p=0$ なら $x_n=4-4\\left(\\frac23\\right)^{n-1}$。2点とも $x$ 軸上なので、長さは $x$ 座標の差です。',
        add: [{ t: 'h', text: '(4)　PₙPₙ₊₁ < 1/1000 となる最小の n' },
          { t: 'm', tex: 'x_n=4-4\\left(\\frac23\\right)^{n-1}', note: '$p=0$' },
          fig('z4', -0.5, zig(0, 4, false).concat([{ k: 'label', at: [0, 0], text: '= P₁', dx: 30, dy: 24, c: 'p', size: 20 }]), 290)] },
      { ask: { type: 'choice', q: '$\\mathrm{P}_n\\mathrm{P}_{n+1}=x_{n+1}-x_n$ は？',
        opts: ['$\\frac43\\left(\\frac23\\right)^{n-1}$', '$4\\left(\\frac23\\right)^{n-1}$', '$\\frac43\\left(\\frac23\\right)^{n}$', '$\\frac83\\left(\\frac23\\right)^{n-1}$'], ok: 0,
        why: { 1: 'それは $4-x_n$（$\\mathrm{AP}_n$ の長さ）です。', 2: '$\\left(\\frac23\\right)^n$ と $\\left(\\frac23\\right)^{n-1}$ の差をとるので、指数は $n-1$ のまま。', 3: '$1-\\frac23=\\frac13$ をかけるところを、$\\frac23$ をかけています。' },
        good: '$4\\left(\\frac23\\right)^{n-1}-4\\left(\\frac23\\right)^{n}=4\\left(\\frac23\\right)^{n-1}\\left(1-\\frac23\\right)$。',
        add: [{ t: 'm', tex: '\\mathrm{P}_n\\mathrm{P}_{n+1}=\\frac43\\left(\\frac23\\right)^{n-1}' }] } },
      { clear: true, cols: [1], part: '(4) 対数', say: '両辺の常用対数をとります。$\\log_{10}\\frac23=0.3010-0.4771=-0.1761$ は **負の数**。これで割るとき、不等号の向きが変わります。',
        add: [{ t: 'h', text: '(4)　常用対数で n をしぼる' },
          { t: 'm', tex: '\\frac43\\left(\\frac23\\right)^{n-1}<\\frac1{1000}' },
          { t: 'm', size: 'sm', tex: '\\log_{10}4-\\log_{10}3+(n-1)(\\log_{10}2-\\log_{10}3)<-3' },
          { t: 'm', size: 'sm', tex: '0.1249-0.1761\\,(n-1)<-3\\qquad\\therefore\\ 0.1761\\,(n-1)>3.1249' },
          { t: 'm', tex: 'n-1>\\frac{3.1249}{0.1761}=17.74\\cdots' }] },
      { ask: { type: 'choice', q: '最小の自然数 $n$ は？',
        opts: ['17', '18', '19', '20'], ok: 2,
        why: { 0: '$17.74\\cdots$ を切り捨てています。しかも、これは $n-1$ の値です。', 1: '$n>17.74\\cdots$ としています。不等式は $n-1>17.74\\cdots$ です。', 3: '$n-1\\geqq18$ なので、$n=19$ で条件をみたします。1つ大きすぎます。' },
        good: '$n-1$ は 17.74… より大きい整数なので $n-1\\geqq18$、つまり $n\\geqq19$。',
        add: [{ t: 'ans', label: '(4) 答', text: '$n=19$' }] } },
      { say: '確かめ：$n=18$ では $\\frac43\\left(\\frac23\\right)^{17}\\fallingdotseq0.00135$、$n=19$ では $\\fallingdotseq0.00090$。たしかに 19 で初めて $\\frac1{1000}$ を下回ります。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '境目の確認', text: '対数の値は近似値。$17.74\\cdots$ のように整数から十分はなれていれば安心です。\nぎりぎりのときは、境目の $n$ で直接計算して確かめます。' }] },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '記述式では、(1) の計算が「どの $n$ でも同じ」こと、(2) の必要と十分、(4) の不等号の向きの理由を、ことばで書いておきます。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)→漸化式', text: '「$\\mathrm{P}_n(x_n,\\ 0)$ に対して同様に計算すると $x_{n+1}=\\frac23x_n+\\frac43$」と一般の $n$ で書く。' },
          { t: 'box', c: 'y', size: 'sm', label: '(2)', text: '「$n=2$ で成り立つことが必要 → $-2\\leqq p\\leqq4$。逆にこのとき、$0\\leqq x_n\\leqq4$ ならば $\\frac43\\leqq x_{n+1}\\leqq4$ なので、数学的帰納法により成り立つ」' },
          { t: 'box', c: 'p', size: 'sm', label: '(4)', text: '「$\\log_{10}\\frac23<0$ で両辺を割るので不等号の向きが変わる」と一言。答えは $n-1$ ではなく $n$ で。' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。図形の操作のくり返しは、1回ぶんを式にすれば漸化式になります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
