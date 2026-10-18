/* 2025 広島大 理系 第4問の類題（自作）：数学A 確率（条件付き確率・原因の確率）・数学B 数列・数学Ⅲ 区分求積法
   元の問題はうつしていない（「番号のついた入れ物の列と、その中の数の平均値」「全部をまとめて1つ取り出したとき平均値と等しい数が出る確率」
   「一部の入れ物を集め、入れ物を選んでから取り出すときの原因の確率に n をかけた極限を区分求積法で」というねらいと形式だけを合わせた自作問題。
   入れ物は袋、袋 B_k には k+1〜2k の番号の玉 k 個。平均値はいつも整数 n+1 になり、確率は n の偶奇で分かれる）。
   答え（python3 の分数計算で n=1〜12 を全部数えて一致。極限は n=100001 まで数値でも確認）：
   (1) (3k+1)/2
   (2) 玉の数 n(n+1)/2、番号の和 Σk(3k+1)/2 = n(n+1)²/2 → m_n = n+1
   (3) 番号 n+1 の玉は (n+1)/2 ≦ k ≦ n の袋に1個ずつ。n=2m：m 個 → p_n = 1/(n+1)、n=2m−1：m 個 → p_n = 1/n
   (4) q_n = (1/n) / H_n、H_n = Σ_{k=k₀}^{n} 1/k（n=2m：k₀=m+1、n=2m−1：k₀=m）
       n=2m：H = (1/m)Σ_{j=1}^{m} 1/(1+j/m) → ∫₀¹ dx/(1+x) = log 2。n=2m−1：H は上の和 + 1/m − 1/(2m) → log 2
       lim n q_n = 1/log 2（≒ 1.4427） */
(function () {
  const POINTS = [
    '平均は「合計 ÷ 個数」。$\\sum k^2,\\ \\sum k$ の公式で計算し、因数分解した形で約分する。番号 $n+1$ の玉が入る袋は $\\frac{n+1}{2}\\leqq k\\leqq n$',
    '原因の確率は $P_E(A)=\\dfrac{P(A\\cap E)}{P(E)}$。「袋を選ぶ確率 × その袋から出る確率」を、原因ごとに足して $P(E)$ を作る',
    '$\\sum\\frac1k$ の極限は **区分求積法**：$\\frac1m\\sum f\\!\\left(\\frac jm\\right)\\to\\int_0^1f(x)\\,dx$。$n$ の偶奇で和の範囲がずれても、ずれは 0 に近づく'
  ];
  const ballRow = (k, hl) => ['$\\mathrm{B}_' + k + '$', Array.from({ length: k }, (_, i) => k + 1 + i).map(v => v === hl ? '{{' + v + '}}' : String(v)).join('，'), String(k * (3 * k + 1) / 2)];
  const riemann = (id, m, extra) => {
    const rects = [];
    for (let j = 1; j <= m; j++) { const x0 = (j - 1) / m, x1 = j / m, h = 1 / (1 + j / m); rects.push({ k: 'poly', pts: [[x0, 0], [x1, 0], [x1, h], [x0, h]], close: true, c: 'y', fill: 'y', alpha: 0.25, wd: 1.5 }); }
    return { t: 'fig', id, col: 1, view: [-0.22, -0.16, 1.32, 1.18], w: 520, h: 360, items: [
      { k: 'axes', tx: [[1, '1']], ty: [[0.5, '1/2'], [1, '1']] }].concat(rects).concat([
      { k: 'fn', f: '1/(1+x)', a: -0.1, b: 1.25, c: 'p', label: 'y = 1/(1+x)', lat: [0.55, 0.86] }]).concat(extra || []) };
  };

  HB.lesson({
    id: 'hiro25-4', field: '広島大型　数学（理系）', title: '2025 広島大 理系 第4問の類題 ― 玉の番号の平均と原因の確率・区分求積', level: '2025年度 広島大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '$n$ を自然数とする。$n$ 個の袋 $\\mathrm{B}_1,\\ \\mathrm{B}_2,\\ \\cdots,\\ \\mathrm{B}_n$ があり、袋 $\\mathrm{B}_k\\ (k=1,\\ 2,\\ \\cdots,\\ n)$ には、$k+1,\\ k+2,\\ \\cdots,\\ 2k$ の番号が1つずつ書かれた $k$ 個の玉が入っている。',
      parts: [
        '(1)　袋 $\\mathrm{B}_k$ に入っている玉の番号の平均値を求めよ。',
        '(2)　$n$ 個の袋の玉をすべて1つの箱に移す。箱の中の玉の番号の平均値 $m_n$ を求めよ。',
        '(3)　(2) の箱から玉を1個取り出すとき、その番号が $m_n$ である確率 $p_n$ を求めよ。',
        '(4)　$n$ 個の袋のうち、番号 $m_n$ の玉が入っている袋だけを集め、その中から1つの袋を同じ確率で選び、選んだ袋から玉を1個取り出す。取り出した玉の番号が $m_n$ であったとき、それが袋 $\\mathrm{B}_n$ から取り出されたものである条件付き確率を $q_n$ とする。極限 $\\displaystyle\\lim_{n\\to\\infty}nq_n$ を求めよ。'
      ],
      src: '※ 2025年度 広島大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '確率・数列・積分の3つがつながる問題です。(4) は「原因の確率」と「区分求積法」。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず小さい $n$ で実験します。$n=4$ なら袋は4つ。袋 $\\mathrm{B}_k$ の中身は「$k+1$ から $2k$ まで」で、袋の番号が大きいほど玉が多くなります。',
        add: [{ t: 'h', text: 'n = 4 で実験' },
          { t: 'tbl', cls: 'rowh', rows: [['袋', '玉の番号', '番号の合計'], ballRow(1), ballRow(2), ballRow(3), ballRow(4)] },
          { t: 'p', size: 'sm', text: '玉は全部で $1+2+3+4=10$ 個' }] },
      { ask: { type: 'choice', q: '$n=4$ のとき、10 個の玉の番号の平均値 $m_4$ は？',
        opts: ['$4.25$', '$5$', '$6.5$', '$4$'], ok: 1,
        why: { 0: '4つの袋の平均 $2,\\ 3.5,\\ 5,\\ 6.5$ をそのまま平均しています。袋ごとに玉の数がちがいます。', 2: 'それは $\\mathrm{B}_4$ だけの平均です。全部の玉で平均します。', 3: '番号の合計は $2+7+15+26=50$、個数は 10 です。' },
        good: '合計 $2+7+15+26=50$、個数 10 で、平均は 5。$n+1$ と同じです。',
        add: [{ t: 'm', col: 1, tex: 'm_4=\\frac{50}{10}=5' },
          { t: 'p', col: 1, size: 'sm', text: '番号 {{5}} の玉は $\\mathrm{B}_3,\\ \\mathrm{B}_4$ に1個ずつ\n→ 10 個から取って 5 が出る確率は $\\frac{2}{10}=\\frac15$' }] } },

      // ---------- (1)(2) ----------
      { clear: true, part: '(1)(2)', say: '(1) $\\mathrm{B}_k$ の番号は $k+1$ から $2k$ までの等差数列なので、平均は「最初と最後の平均」で $\\dfrac{3k+1}{2}$。合計はそれに個数 $k$ をかけたものです。',
        add: [{ t: 'h', text: '(1)(2)　平均値' },
          { t: 'ans', label: '(1) 答', tex: '\\frac{(k+1)+2k}{2}=\\frac{3k+1}{2}' },
          { t: 'p', size: 'sm', text: '$\\mathrm{B}_k$ の番号の合計は　$k\\cdot\\dfrac{3k+1}{2}$' },
          { t: 'm', size: 'sm', tex: '\\text{個数}=\\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}' }] },
      { ask: { type: 'choice', q: '箱の中の番号の合計 $\\displaystyle\\sum_{k=1}^{n}\\frac{k(3k+1)}{2}$ は？',
        opts: ['$\\dfrac{n(n+1)(3n+1)}{4}$', '$\\dfrac{n^2(n+1)}{2}$', '$\\dfrac{n(n+1)^2}{2}$', '$\\dfrac{n(n+1)(2n+1)}{4}$'], ok: 2,
        why: { 0: '$\\sum k(3k+1)$ を $\\sum k\\times(3n+1)$ のように、$k$ を $n$ にしています。', 1: '$\\frac{2n+1}{2}+\\frac12=n+1$ のところを $n$ にしています。', 3: '$3\\sum k^2$ の 3 と、$\\sum k$ の部分を落としています。' },
        good: '$\\frac12\\left\\{3\\cdot\\frac{n(n+1)(2n+1)}{6}+\\frac{n(n+1)}{2}\\right\\}=\\frac{n(n+1)}{2}\\cdot\\frac{(2n+1)+1}{2}=\\frac{n(n+1)^2}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{合計}=\\frac12\\Big(3\\sum k^2+\\sum k\\Big)=\\frac{n(n+1)^2}{2}' }] } },
      { say: '合計を個数で割ると、$\\dfrac{n(n+1)}{2}$ がそっくり約分されて $n+1$。平均値はいつも整数です。実験の $m_4=5$ とも合っています。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'm_n=\\frac{n(n+1)^2/2}{n(n+1)/2}=n+1' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。番号 $n+1$ の玉は、どの袋に入っているでしょう。$\\mathrm{B}_k$ の番号は $k+1$ から $2k$ なので、条件は $k+1\\leqq n+1\\leqq2k$ です。',
        add: [{ t: 'h', text: '(3)　番号 n + 1 が出る確率' },
          { t: 'm', tex: 'k+1\\leqq n+1\\leqq2k\\iff\\frac{n+1}{2}\\leqq k\\leqq n' },
          { t: 'p', size: 'sm', text: 'その袋に、番号 $n+1$ の玉は **1個ずつ**' }] },
      { ask: { type: 'choice', q: '$n=2m$（偶数）のとき、$\\frac{n+1}{2}\\leqq k\\leqq n$ をみたす整数 $k$ は何個？',
        opts: ['$m-1$ 個', '$m$ 個', '$m+1$ 個', '$2m$ 個'], ok: 1,
        why: { 0: '$k=m+1$ から $2m$ までの個数は $2m-(m+1)+1=m$。1 を足し忘れています。', 2: '$\\frac{2m+1}{2}=m+\\frac12$ なので、$k=m$ はふくみません。', 3: '$k$ は $\\frac{n+1}{2}$ 以上の所だけです。' },
        good: '$m+\\frac12\\leqq k\\leqq2m$ なので $k=m+1,\\ \\cdots,\\ 2m$ の $m$ 個。$n=2m-1$ なら $k=m,\\ \\cdots,\\ 2m-1$ でやはり $m$ 個。',
        add: [{ t: 'tbl', col: 1, rows: [['$n$', '袋の番号 $k$', '個数'], ['$2m$', '$m+1\\sim2m$', '$m$'], ['$2m-1$', '$m\\sim2m-1$', '$m$']] }] } },
      { ask: { type: 'choice', q: '$n=2m$ のとき、$p_n$ は？（玉は全部で $\\frac{n(n+1)}{2}$ 個）',
        opts: ['$\\dfrac1n$', '$\\dfrac2{n+1}$', '$\\dfrac1{n+2}$', '$\\dfrac1{n+1}$'], ok: 3,
        why: { 0: 'それは $n$ が奇数のときの答えです。', 1: '個数 $m=\\frac n2$ の $\\frac12$ を落としています。', 2: '玉の総数は $\\frac{n(n+1)}{2}$。$n+2$ は出てきません。' },
        good: '$p_n=\\dfrac{n/2}{n(n+1)/2}=\\dfrac1{n+1}$。$n=4$ で $\\frac15$（実験と一致）。',
        add: [{ t: 'ans', label: '(3) 答', text: '$n$ が偶数のとき　$p_n=\\dfrac1{n+1}$\n$n$ が奇数のとき　$p_n=\\dfrac{(n+1)/2}{n(n+1)/2}=\\dfrac1n$' }] } },
      { ask: { type: 'think', q: '$n=3$ のとき、袋の中身を全部書き出して、$p_3=\\dfrac13$ を確かめよう。',
        hint: '$\\mathrm{B}_1:2$、$\\mathrm{B}_2:3,4$、$\\mathrm{B}_3:4,5,6$。$m_3=4$。',
        ans: '玉は 6 個で、番号 4 は $\\mathrm{B}_2$ と $\\mathrm{B}_3$ に1個ずつ。$p_3=\\dfrac26=\\dfrac13=\\dfrac1n$',
        after: '奇数・偶数で式が変わる問題は、両方の小さな例で確かめておくと安心です。' } },

      // ---------- (4) 条件付き確率 ----------
      { clear: true, part: '(4)', say: '(4) です。番号 $n+1$ の玉が入っている袋は $\\mathrm{B}_{k_0},\\ \\cdots,\\ \\mathrm{B}_n$ の $N$ 個（$N=m$）。袋を選ぶ確率は $\\frac1N$、$\\mathrm{B}_k$ から番号 $n+1$ が出る確率は $\\frac1k$ です。',
        add: [{ t: 'h', text: '(4)　原因の確率（条件付き確率）' },
          { t: 'p', size: 'sm', text: '$k_0$：番号 $n+1$ の玉が入っている袋の、いちばん小さい番号\n（$n=2m$ なら $k_0=m+1$、$n=2m-1$ なら $k_0=m$）' },
          { t: 'tbl', size: 'sm', rows: [['原因（選んだ袋）', '$\\mathrm{B}_{k_0}$', '$\\cdots$', '$\\mathrm{B}_k$', '$\\cdots$', '$\\mathrm{B}_n$'], ['選ぶ確率', '$\\frac1N$', '', '$\\frac1N$', '', '$\\frac1N$'], ['$n+1$ が出る確率', '$\\frac1{k_0}$', '', '$\\frac1k$', '', '$\\frac1n$']] }] },
      { ask: { type: 'choice', q: '事象 $E$「取り出した玉の番号が $n+1$」の確率 $P(E)$ は？',
        opts: ['$\\displaystyle\\sum_{k=k_0}^{n}\\frac1k$', '$\\dfrac1N\\displaystyle\\sum_{k=k_0}^{n}\\frac1k$', '$\\dfrac{N}{n(n+1)/2}$', '$\\dfrac1N\\cdot\\dfrac1n$'], ok: 1,
        why: { 0: '袋を選ぶ確率 $\\frac1N$ をかけ忘れています。', 2: 'それは (3) の「全部まぜてから取り出す」場合。今は袋を選んでから取り出します。', 3: 'それは $\\mathrm{B}_n$ を選んで $n+1$ が出る確率だけ。ほかの袋の場合も足します。' },
        good: '原因ごとに「選ぶ確率 × 出る確率」を求めて足します。',
        add: [{ t: 'm', size: 'sm', tex: 'P(E)=\\sum_{k=k_0}^{n}\\frac1N\\cdot\\frac1k' }] } },
      { say: 'B$_n$ を選んで $n+1$ が出る確率は $\\frac1N\\cdot\\frac1n$。条件付き確率は、それを $P(E)$ で割ったもの。$\\frac1N$ は約分されて消えます。',
        add: [{ t: 'm', tex: 'q_n=\\frac{\\frac1N\\cdot\\frac1n}{\\frac1N\\displaystyle\\sum_{k=k_0}^{n}\\frac1k}\\qquad\\therefore\\ nq_n=\\frac{1}{\\displaystyle\\sum_{k=k_0}^{n}\\frac1k}' }] },

      // ---------- (4) 区分求積 ----------
      { clear: true, part: '(4) 区分求積', say: '分母の和を $H_n$ とします。まず $n=2m$ の場合。$k=m+j$ とおくと、$\\frac1m$ をくくり出せて、区分求積法の形になります。',
        add: [{ t: 'h', text: '(4)　Hₙ の極限（n = 2m のとき）' },
          { t: 'm', size: 'sm', tex: 'H_{2m}=\\sum_{k=m+1}^{2m}\\frac1k=\\sum_{j=1}^{m}\\frac{1}{m+j}=\\frac1m\\sum_{j=1}^{m}\\frac{1}{1+\\frac jm}' },
          riemann('r1', 6, [{ k: 'label', at: [0.5, 0.2], text: 'm = 6', c: 'y', size: 20 }])] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{m\\to\\infty}\\frac1m\\sum_{j=1}^{m}\\frac{1}{1+\\frac jm}$ は、どの定積分？',
        opts: ['$\\displaystyle\\int_0^1\\frac{dx}{x}$', '$\\displaystyle\\int_0^1(1+x)\\,dx$', '$\\displaystyle\\int_0^2\\frac{dx}{1+x}$', '$\\displaystyle\\int_0^1\\frac{dx}{1+x}$'], ok: 3,
        why: { 0: '$\\frac jm$ を $x$ にするので、$\\frac{1}{1+\\frac jm}$ は $\\frac{1}{1+x}$。1 を落としています。', 1: '逆数になっていません。和の中身は $\\frac{1}{1+\\frac jm}$ です。', 2: '$j$ は 1 から $m$ まで、$\\frac jm$ は 0 から 1 までです。' },
        good: '$\\frac jm\\to x$、$\\frac1m\\to dx$、$j=1\\sim m$ で $x$ は 0〜1。黄色の長方形の面積の和が、曲線の下の面積に近づきます。',
        add: [{ t: 'm', tex: '\\lim_{m\\to\\infty}H_{2m}=\\int_0^1\\frac{dx}{1+x}=\\Big[\\log(1+x)\\Big]_0^1=\\log2' }] } },
      { say: '$n=2m-1$ のときは、和が $k=m$ から $2m-1$ まで。さっきの和より $\\frac1m$ が1つ多く、$\\frac1{2m}$ が1つ少ないだけです。そのずれは 0 に近づきます。',
        add: [{ t: 'm', size: 'sm', tex: 'H_{2m-1}=\\sum_{k=m}^{2m-1}\\frac1k=H_{2m}+\\frac1m-\\frac1{2m}\\ \\longrightarrow\\ \\log2' },
          { t: 'ans', label: '(4) 答', tex: '\\lim_{n\\to\\infty}nq_n=\\frac1{\\log2}' }] },
      { ask: { type: 'think', q: '袋は約 $\\frac n2$ 個なので、袋を選ぶ確率は約 $\\frac2n$。なのに $nq_n\\to\\frac1{\\log2}\\fallingdotseq1.44$ は 2 より小さい。$\\mathrm{B}_n$ が「原因」として選ばれにくいのはなぜ？',
        hint: '$\\mathrm{B}_n$ には玉が何個ある？ その中で番号 $n+1$ は何個？',
        ans: '$\\mathrm{B}_n$ は玉が $n$ 個といちばん多く、番号 $n+1$ が出る確率 $\\frac1n$ がいちばん小さい。だから「$n+1$ が出た」と知ると、$\\mathrm{B}_n$ だった見こみは平均より下がる',
        after: '逆に、玉の少ない $\\mathrm{B}_{k_0}$ なら $nq\\to\\frac{2}{\\log2}\\fallingdotseq2.89$ と、平均の 2 より大きくなります。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '記述式では、(3) の偶奇の場合分け、(4) の条件付き確率の式と、区分求積法の形への変形を、ていねいに書きます。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(3)', text: '「番号 $n+1$ の玉は $\\frac{n+1}{2}\\leqq k\\leqq n$ をみたす $\\mathrm{B}_k$ に1個ずつ」と根拠を書き、$n$ の偶奇で場合分けする。' },
          { t: 'box', c: 'y', size: 'sm', label: '(4) 確率', text: '事象を文字でおく（$A$：$\\mathrm{B}_n$ を選ぶ、$E$：番号 $n+1$ が出る）。$q_n=P_E(A)=\\dfrac{P(A\\cap E)}{P(E)}$ と式で示す。' },
          { t: 'box', c: 'p', size: 'sm', label: '(4) 極限', text: '$\\frac1m\\sum f\\left(\\frac jm\\right)$ の形をはっきり書き、$f(x)=\\frac1{1+x}$ が $0\\leqq x\\leqq1$ で連続なことにふれる。奇数の場合も忘れずに。' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。数え上げ → 確率 → 原因の確率 → 区分求積。複数の分野を、1本の流れで使う問題でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
