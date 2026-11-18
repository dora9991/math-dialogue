/* 数学B 第1章 数列 ⑥：和の記号 Σ
   例はすべて自作。python3（sympy.summation と、n=1〜5 で項を1つずつたした値）で検算ずみ：
   Σ(2k+1)[k=1..5]=35／Σk²[k=3..6]=86（k=1..6 なら 91、k=3..5 なら 50）／Σ4[k=1..10]=40（Σ4k なら 220）／
   Σ(3k²−k)=n²(n+1)（2,12,36,80,150）／Σk(k+1)=n(n+1)(n+2)/3（2,8,20,40,70）／Σ(2ᵏ+2k)=2ⁿ⁺¹+n²+n−2（4,12,26,50,92） */
(function () {
  const POINTS = [
    '$\\displaystyle\\sum_{k=1}^{n}a_k=a_1+a_2+\\cdots+a_n$。$k$ に下の数から上の数までを順に入れて **たす**',
    '公式：$\\displaystyle\\sum c=nc,\\ \\ \\sum k=\\frac{n(n+1)}{2},\\ \\ \\sum k^2=\\frac{n(n+1)(2n+1)}{6},\\ \\ \\sum k^3=\\left\\{\\frac{n(n+1)}{2}\\right\\}^2$',
    '$\\Sigma$ は和と定数倍に分けられる。でも **積は分けられない**（$\\sum a_kb_k\\neq\\sum a_k\\sum b_k$）。展開してから公式へ'
  ];

  HB.lesson({
    id: 'mb1-06', field: '数学B　数列', title: '和の記号 Σ', level: '数列', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\displaystyle\\sum_{k=3}^{6}k^2$', '(2)　$\\displaystyle\\sum_{k=1}^{10}4$', '(3)　$\\displaystyle\\sum_{k=1}^{n}(3k^2-k)$',
        '(4)　$\\displaystyle\\sum_{k=1}^{n}k(k+1)$', '(5)　$\\displaystyle\\sum_{k=1}^{n}(2^k+2k)$'] },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: 'めあて', say: 'これまで、等差数列・等比数列の和を求めてきました。この時間は、和を短く書く記号 **Σ（シグマ）** と、その計算のしかたを学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '記号 $\\Sigma$ の意味がわかり、和を $\\Sigma$ で書ける\n$\\Sigma$ の公式と性質を使って、和を計算できる' }] },

      // ---------- Σの意味 ----------
      { clear: true, part: 'Σの意味', say: '$\\Sigma$ はギリシャ文字のシグマで、英語の Sum（和）の頭文字 S にあたります。$\\displaystyle\\sum_{k=1}^{n}a_k$ は「$a_k$ の $k$ に $1$ から $n$ までを入れてたす」という意味です。',
        add: [{ t: 'h', text: '和の記号 Σ' }, { t: 'm', tex: '\\sum_{\\hb{k=1}}^{\\hy{n}}a_k=a_1+a_2+a_3+\\cdots+a_n', note: '[[b:下]]＝始まり\n[[y:上]]＝終わり' }] },
      { say: 'たとえば $\\displaystyle\\sum_{k=1}^{5}(2k+1)$ は、$k=1,\\ 2,\\ 3,\\ 4,\\ 5$ を順に入れて、$3+5+7+9+11=35$ です。',
        add: [{ t: 'm', tex: '\\sum_{k=1}^{5}(2k+1)=3+5+7+9+11=35' },
          { t: 'tbl', col: 1, rows: [['$k$', '1', '2', '3', '4', '5'], ['$2k+1$', '3', '5', '7', '9', '11']] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\sum_{k=3}^{6}k^2$ は？',
        opts: ['$91$', '$50$', '$86$', '$36$'], ok: 2,
        why: { 0: '$k=1$ から始めています。下の数 3 が始まりです。', 1: '$k=6$ の $36$ もたします。上の数までふくみます。', 3: '最後の項だけです。$k=3,\\ 4,\\ 5,\\ 6$ の4つをたします。' },
        good: '$3^2+4^2+5^2+6^2=9+16+25+36=86$。始まりは 3、終わりは 6 で、4項の和です。',
        add: [{ t: 'm', tex: '\\sum_{k=3}^{6}k^2=9+16+25+36=\\ans{86}' }] } },
      { say: '逆に、和を $\\Sigma$ で書くこともできます。第 $k$ 項を $k$ の式で表し、始まりと終わりの $k$ を下と上に書きます。',
        add: [{ t: 'm', tex: '2+4+8+\\cdots+2^{10}=\\sum_{k=1}^{10}2^k' }, { t: 'm', tex: '1\\cdot2+2\\cdot3+\\cdots+n(n+1)=\\sum_{k=1}^{n}k(k+1)' }] },

      // ---------- 公式 ----------
      { clear: true, part: 'Σの公式', say: 'よく使う和の公式です。$\\sum k$ は等差数列の和でした。$\\sum c$ は、同じ数 $c$ を $n$ 回たすので $nc$ です。',
        add: [{ t: 'h', text: 'Σ の公式' },
          { t: 'box', c: 'p', label: '公式', tex: '\\begin{aligned} &\\sum_{k=1}^{n}c=nc \\qquad \\sum_{k=1}^{n}k=\\frac{n(n+1)}{2}\\\\ &\\sum_{k=1}^{n}k^2=\\frac{n(n+1)(2n+1)}{6}\\\\ &\\sum_{k=1}^{n}k^3=\\left\\{\\frac{n(n+1)}{2}\\right\\}^2 \\end{aligned}' }] },
      { say: '$\\sum k^2$ の公式は、$(k+1)^3-k^3=3k^2+3k+1$ を $k=1$ から $n$ までたすと、左辺が $(n+1)^3-1$ だけ残ることから導けます。（教科書でたどってみましょう）',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '(k+1)^3-k^3=3k^2+3k+1' }, { t: 'm', col: 1, size: 'sm', tex: '(n+1)^3-1=3\\sum k^2+3\\sum k+n' },
          { t: 'p', col: 1, size: 'sm', text: '$n=3$ で確かめ：$1+4+9=14$、$\\dfrac{3\\cdot4\\cdot7}{6}=14$ ✓' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\sum_{k=1}^{10}4$ は？',
        opts: ['$4$', '$40$', '$220$', '$10$'], ok: 1,
        why: { 0: '式に $k$ がなくても、$k=1$ から $10$ まで、$4$ を10回たします。', 2: 'それは $\\sum 4k=4\\cdot55$。たすのは $4$ だけです。', 3: '10 は回数。たすのは $4$ です。' },
        good: '$4+4+\\cdots+4$（10個）$=4\\times10=40$。$\\sum c=nc$ です。',
        add: [{ t: 'm', col: 1, tex: '\\sum_{k=1}^{10}4=4\\times10=\\ans{40}' }] } },
      { say: '等比数列の和も $\\Sigma$ で書けます。$\\displaystyle\\sum_{k=1}^{n}ar^{k-1}$ は、初項 $a$、公比 $r$、項数 $n$ の等比数列の和です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sum_{k=1}^{n}ar^{k-1}=\\frac{a(r^n-1)}{r-1}\\quad(r\\neq1)', note: '等比数列\nの和' }, { t: 'm', size: 'sm', tex: '\\text{例：}\\sum_{k=1}^{n}3\\cdot2^{k-1}=\\frac{3(2^n-1)}{2-1}=3(2^n-1)' }] },

      // ---------- Σの性質 ----------
      { clear: true, part: 'Σの性質', say: '$\\Sigma$ は、和や差に分けたり、定数をくくり出したりできます。ただし、**積は分けられません**。ここがいちばんのまちがいポイントです。',
        add: [{ t: 'h', text: 'Σ の性質' },
          { t: 'box', c: 'b', label: '性質', tex: '\\begin{aligned}&\\sum(a_k+b_k)=\\sum a_k+\\sum b_k\\\\ &\\sum ca_k=c\\sum a_k\\quad(c\\text{ は定数})\\end{aligned}' },
          { t: 'p', size: 'sm', c: 'p', text: '注意：$\\sum a_kb_k\\neq\\sum a_k\\cdot\\sum b_k$（積は、先に展開する）' }] },
      { say: '$\\displaystyle\\sum_{k=1}^{n}(3k^2-k)$ を計算します。性質で分けて公式を入れ、共通な $\\dfrac{n(n+1)}{2}$ でくくると、すっきりします。',
        add: [{ t: 'm', tex: '\\begin{aligned} \\sum_{k=1}^{n}(3k^2-k)&=3\\sum k^2-\\sum k\\\\ &=\\frac{n(n+1)(2n+1)}{2}-\\frac{n(n+1)}{2}\\\\ &=\\hy{\\frac{n(n+1)}{2}}\\{(2n+1)-1\\}=n^2(n+1) \\end{aligned}' }] },
      { say: '検算：$n=2$ なら、もとの和は $(3-1)+(12-2)=12$、答えの式は $2^2\\cdot3=12$。小さい $n$ で確かめるくせをつけましょう。',
        add: [{ t: 'tbl', col: 1, rows: [['$n$', '1', '2', '3'], ['もとの和', '2', '12', '36'], ['$n^2(n+1)$', '2', '12', '36']] }, { t: 'p', col: 1, size: 'sm', c: 'g', text: '一致 ✓' }] },
      { clear: true, part: '積は展開', say: '$\\displaystyle\\sum_{k=1}^{n}k(k+1)$ のような **積** の形は、$\\sum k\\times\\sum(k+1)$ とはできません。先に展開して $k^2+k$ にしてから、公式を使います。',
        add: [{ t: 'h', text: '積の形は、展開してから' }, { t: 'm', tex: '\\sum_{k=1}^{n}k(k+1)=\\sum_{k=1}^{n}(k^2+k)', note: '先に展開' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\sum_{k=1}^{n}k(k+1)$ は？',
        opts: ['$\\dfrac{n(2n^2+3n+7)}{6}$', '$\\dfrac{n(n+1)^2(n+2)}{4}$', '$\\dfrac{n(n+1)(2n+1)}{6}$', '$\\dfrac{n(n+1)(n+2)}{3}$'], ok: 3,
        why: { 0: '$\\sum k$ を $n$ にしています（$\\sum 1=n$ と混同）。$\\sum k=\\frac{n(n+1)}{2}$ です。', 1: '$\\sum k$ と $\\sum(k+1)$ をかけています。積は分けられません。', 2: '$k^2+k$ の $k$ の分 $\\sum k$ をたし忘れています。' },
        good: '$\\sum k^2+\\sum k$ を $\\frac{n(n+1)}{6}$ でくくって $\\frac{n(n+1)(n+2)}{3}$。',
        add: [{ t: 'm', tex: '\\begin{aligned}&=\\frac{n(n+1)(2n+1)}{6}+\\frac{n(n+1)}{2}\\\\ &=\\frac{n(n+1)}{6}\\{(2n+1)+3\\}=\\ans{\\frac{n(n+1)(n+2)}{3}}\\end{aligned}' }] } },
      { ask: { type: 'think', q: '$\\displaystyle\\sum_{k=1}^{n}(2^k+2k)$ を求めよう。',
        hint: '$\\sum 2^k$ と $\\sum 2k$ に分けます。$\\sum 2^k$ は、初項 $2$、公比 $2$、項数 $n$ の等比数列の和。',
        ans: '$\\dfrac{2(2^n-1)}{2-1}+2\\cdot\\dfrac{n(n+1)}{2}=2^{n+1}+n^2+n-2$',
        after: '$n=1$ で $4$、$n=2$ で $12$。もとの和 $2+2=4$、$4+(4+4)=12$ と一致します。',
        add: [{ t: 'm', tex: '\\sum_{k=1}^{n}(2^k+2k)=2(2^n-1)+n(n+1)=\\ans{2^{n+1}+n^2+n-2}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、となりの項の差を並べた **階差数列** を使って、一般項を求めます。$\\Sigma$ の計算が活躍します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
