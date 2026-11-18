/* 九工大型 数学：2026年度 九州工業大学 前期 第4問の類題（自作問題・元の問題ではない）
   問題：六角形の輪 A-B-C-D-E-F-A に、行き止まり G（A とつながる）・H（C とつながる）。P は時刻 0 に A、
         1 秒ごとに隣の点へ等確率で移る。時刻 n に A にいる確率 p_n、C にいる確率 q_n。
   答え（python3・sympy で 8×8 の推移行列を 11 回かけて検算ずみ）：
     2 秒後の移り方：A→(A,C,E)=(2/3,1/6,1/6)、C→(1/6,2/3,1/6)、E→(1/4,1/4,1/2)
     (1) p_2=2/3, q_2=1/6, p_4=37/72
     (2) n 偶数：p_{n+2}=(5/12)p_n−(1/12)q_n+1/4、q_{n+2}=−(1/12)p_n+(5/12)q_n+1/4（奇数のとき p_n=q_n=0）
     (3) p_{n+4}=(5/6)p_{n+2}−(1/6)p_n+1/8
     (4) c=3/8、(α,β)=(1/2,1/3)（(1/3,1/2) でも可）
     (5) r_0=5/8, r_2=7/24。r_{n+2}−r_n/3=(1/12)(1/2)^{n/2}、r_{n+2}−r_n/2=−(1/48)(1/3)^{n/2}
         n 偶数：p_n=3/8+(1/2)^{n/2+1}+(1/8)(1/3)^{n/2}、n 奇数：p_n=0（n=0〜10 で一致を確認）
     別の見方：p+q と p−q に分けると s_{n+2}=s_n/3+1/2、d_{n+2}=d_n/2（A と C が左右対称なため） */
(function () {
  const r3 = Math.sqrt(3) / 2;
  const V = { A: [-r3, 0.5], B: [0, 1], C: [r3, 0.5], D: [r3, -0.5], E: [0, -1], F: [-r3, -0.5], G: [-1.62, 0.935], H: [1.62, 0.935] };
  const EV = ['A', 'C', 'E'], DIR = { A: 'sw', B: 'n', C: 'se', D: 'e', E: 's', F: 'w', G: 'n', H: 'n' };
  const ED = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['E', 'F'], ['F', 'A'], ['A', 'G'], ['C', 'H']];
  const graph = (id, extra, o) => {
    o = o || {};
    const it = ED.map(([a, b]) => ({ k: 'seg', a: V[a], b: V[b], c: 'w', wd: 3 }));
    Object.keys(V).forEach(k => {
      const ev = EV.includes(k);
      it.push({ k: 'pt', at: V[k], name: k, dir: DIR[k], c: o.color ? (ev ? 'y' : 'b') : 'w', size: 24, r: 8 });
    });
    return { t: 'fig', id, col: 1, view: [-2.05, -1.42, 2.05, 1.42], w: o.w || 470, h: Math.round((o.w || 470) * 2.84 / 4.1), items: it.concat(extra || []) };
  };
  const ar = (a, b, c, s) => {   // 点 a から点 b へ、少しずらした矢印
    const A = V[a], B = V[b], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy), nx = -dy / L * 0.08, ny = dx / L * 0.08, e = 0.17 / L;
    return { k: 'vec', a: [A[0] + dx * e + nx * (s || 1), A[1] + dy * e + ny * (s || 1)], b: [B[0] - dx * e + nx * (s || 1), B[1] - dy * e + ny * (s || 1)], c, wd: 2.5 };
  };
  const POINTS = [
    '1 回ごとに「黄の点（A, C, E）」と「青の点」を行き来する（2 色にぬれる図形）。だから **偶数の時刻だけ** を、**2 秒ごとの移り方** で追う',
    '2 秒後の移り方を表にすると、$p_{n+2},\\ q_{n+2}$ の連立漸化式が立つ。E にいる確率は $1-p_n-q_n$（$n$ が偶数のとき）',
    '1 つを消して3項間漸化式 → 極限の値 $c$ を引いて定数項を消す → $\\alpha,\\ \\beta$ を入れかえた 2 つの等比数列の式から $r_n$ を出す'
  ];

  HB.lesson({
    id: 'kyutech26-4', field: '九工大型　数学', title: '2026 九工大 第4問の類題 ― 行き止まりのある六角形の上を動く点の確率', level: '2026年度 九州工業大学 前期 第4問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '8 個の点 A，B，C，D，E，F，G，H があり、A と B，B と C，C と D，D と E，E と F，F と A が線で結ばれて六角形の輪をつくり、さらに A と G，C と H が線で結ばれている（G，H は行き止まり）。点 P は時刻 0 に A にあり、1 秒ごとに、いまいる点と線で結ばれた点のうちの 1 つへ、等しい確率で移る。時刻 $n$ に P が A にある確率を $p_n$、C にある確率を $q_n$ とする（$n=0,\\,1,\\,2,\\,\\cdots$）。',
      parts: [
        '(1)　$p_2,\\ q_2,\\ p_4$ を求めよ。',
        '(2)　$n$ が奇数のとき $p_n=q_n=0$ である。$n$ が偶数のとき、$p_{n+2},\\ q_{n+2}$ をそれぞれ $p_n,\\ q_n$ で表せ。',
        '(3)　$n$ が偶数のとき、$p_{n+4}$ を $p_{n+2},\\ p_n$ で表せ。',
        '(4)　$r_n=p_n-c$ とおくとき、$r_n$ のみたす漸化式に定数項が現れないような定数 $c$ を求めよ。さらに、$n$ が偶数のとき $r_{n+4}-\\alpha r_{n+2}=\\beta(r_{n+2}-\\alpha r_n)$ がつねに成り立つような定数の組 $(\\alpha,\\ \\beta)$ を 1 組求めよ。',
        '(5)　$p_n$ を $n$ の式で表せ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', cols: [1], say: '確率と数列の融合問題です。図形の上を動く点の確率を、漸化式で追いかけます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '図にすると、こうなります。A と C には行き止まりの枝がついていて、線が 3 本。ほかの輪の点は 2 本、G と H は 1 本です。',
        add: [{ t: 'h', text: '図にする' },
          { t: 'p', size: 'sm', text: '線の本数（＝次に行ける点の数）\nA，C：3 本　B，D，E，F：2 本　G，H：1 本' },
          graph('g0')] },
      { ask: { type: 'choice', q: '時刻 0 に A にいる P が、時刻 3 にいる可能性のある点は？',
        opts: ['A，C，E のどれか', 'G か H だけ', 'B，D，F，G，H のどれか', 'すべての点'], ok: 2,
        why: { 0: 'A，C，E にいられるのは偶数の時刻です。1 回動くと、必ず B，D，F，G，H のどれかに移ります。', 1: 'B，D，F にもいられます。', 3: '黄と青の 2 色にぬると、1 回ごとに色が必ず変わります。' },
        good: '黄の点（A, C, E）どうし・青の点どうしは、線で直接つながっていません。だから偶数の時刻は黄、奇数の時刻は青です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '偶奇', text: '$n$ が奇数 → $p_n=q_n=0$\n$n$ が偶数 → P は A, C, E のどれか（E は $1-p_n-q_n$）' }],
        draw: [{ fig: 'g0', items: EV.map(k => ({ k: 'pt', at: V[k], c: 'y', r: 9 })).concat(['B', 'D', 'F', 'G', 'H'].map(k => ({ k: 'pt', at: V[k], c: 'b', r: 9 }))) }] } },

      // ---------- (1) 2 秒後の移り方 ----------
      { clear: true, part: '(1)', say: '偶数の時刻だけを見るので、「2 秒後にどこにいるか」の表を先に作ります。A からは、B・F・G へそれぞれ $\\frac13$ で進みます。',
        add: [{ t: 'h', text: '(1)　2 秒後の移り方の表' },
          { t: 'm', size: 'sm', tex: '\\mathrm{A}\\to\\mathrm{A}:\\ \\frac13\\cdot\\frac12+\\frac13\\cdot\\frac12+\\frac13\\cdot1=\\frac23', note: 'B, F, G を経由' },
          { t: 'm', size: 'sm', tex: '\\mathrm{A}\\to\\mathrm{C}:\\ \\frac13\\cdot\\frac12=\\frac16,\\qquad \\mathrm{A}\\to\\mathrm{E}:\\ \\frac13\\cdot\\frac12=\\frac16' },
          graph('g1', [ar('A', 'B', 'p'), ar('A', 'F', 'p'), ar('A', 'G', 'p'), ar('B', 'A', 'y', -1), ar('F', 'A', 'y', -1), ar('G', 'A', 'y', -1)], { color: true, w: 400 })] },
      { ask: { type: 'choice', q: 'E から出発したとき、2 秒後に A にいる確率は？',
        opts: ['$\\dfrac12$', '$\\dfrac13$', '$\\dfrac16$', '$\\dfrac14$'], ok: 3,
        why: { 0: 'E → F → A の道だけなので $\\frac12\\cdot\\frac12$ です。', 1: 'F の線は 2 本。F から A へは $\\frac12$ です。', 2: 'E の線は 2 本なので、E から F へは $\\frac12$ です。' },
        good: 'E → F → A で $\\frac12\\cdot\\frac12=\\frac14$。E → C も $\\frac14$、E → E は $\\frac12$。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['2 秒後', 'A', 'C', 'E'], ['A から', '$\\frac23$', '$\\frac16$', '$\\frac16$'], ['C から', '$\\frac16$', '$\\frac23$', '$\\frac16$'], ['E から', '$\\frac14$', '$\\frac14$', '$\\frac12$']] }] } },
      { say: 'C からの行を A の行と比べると、A と C の役わりが入れかわっただけ（図が左右対称）。$p_2,\\ q_2$ は、A の行そのものです。',
        add: [{ t: 'm', tex: 'p_2=\\frac23,\\qquad q_2=\\frac16' }] },
      { ask: { type: 'think', q: '表を使って $p_4$ を求めよう。（時刻 2 に E にいる確率は $\\frac16$）',
        hint: '時刻 2 に A, C, E にいる確率に、それぞれ「2 秒後に A へ行く確率」をかけて足す。',
        ans: '$p_4=\\dfrac23\\cdot\\dfrac23+\\dfrac16\\cdot\\dfrac16+\\dfrac16\\cdot\\dfrac14=\\dfrac{32+2+3}{72}=\\dfrac{37}{72}$',
        after: 'この「足し合わせ」を文字でやったものが、(2) の漸化式です。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'p_2=\\frac23,\\quad q_2=\\frac16,\\quad p_4=\\frac{37}{72}' }] } },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '(2) です。$n$ が偶数のとき、時刻 $n$ に E にいる確率は $1-p_n-q_n$。表の「A の列」を縦に見て、時刻 $n+2$ に A にいる確率を作ります。',
        add: [{ t: 'h', text: '(2)　2 秒ごとの連立漸化式' },
          { t: 'm', size: 'sm', tex: 'p_{n+2}=\\frac23p_n+\\frac16q_n+\\frac14(1-p_n-q_n)' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['2 秒後', 'A', 'C', 'E'], ['A から', '$\\dfrac23$', '$\\dfrac16$', '$\\dfrac16$'], ['C から', '$\\dfrac16$', '$\\dfrac23$', '$\\dfrac16$'], ['E から', '$\\dfrac14$', '$\\dfrac14$', '$\\dfrac12$']] }] },
      { ask: { type: 'choice', q: '整理すると、$p_{n+2}=$？',
        opts: ['$\\dfrac{5}{12}p_n-\\dfrac{1}{12}q_n+\\dfrac14$', '$\\dfrac23p_n+\\dfrac16q_n$', '$\\dfrac{5}{12}p_n+\\dfrac{1}{12}q_n+\\dfrac14$', '$\\dfrac{11}{12}p_n+\\dfrac{5}{12}q_n+\\dfrac14$'], ok: 0,
        why: { 1: 'E から A に来る分（$\\frac14\\times$ E の確率）を忘れています。', 2: '$\\frac16-\\frac14=-\\frac{1}{12}$。符号がちがいます。', 3: '$\\frac14(1-p_n-q_n)$ のかっこの中のマイナスを、足し算にしています。' },
        good: '$\\frac23-\\frac14=\\frac{5}{12}$、$\\frac16-\\frac14=-\\frac{1}{12}$。定数項 $\\frac14$ が残るのがポイントです。',
        add: [{ t: 'm', size: 'sm', tex: 'q_{n+2}=\\frac16p_n+\\frac23q_n+\\frac14(1-p_n-q_n)' }] } },
      { say: '$q_{n+2}$ も同じように整理します。A と C を入れかえた形になっています。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\begin{aligned}p_{n+2}&=\\tfrac{5}{12}p_n-\\tfrac{1}{12}q_n+\\tfrac14\\\\ q_{n+2}&=-\\tfrac{1}{12}p_n+\\tfrac{5}{12}q_n+\\tfrac14\\end{aligned}' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.62, 0.38], part: '(3)', say: '(3) です。$q$ を消します。1 つ目の式を $q_n$ について解き、2 つ目の式に入れます（2 つ目の式は $n$ を $n+2$ にずらした形も使います）。',
        add: [{ t: 'h', text: '(3)　q を消して3項間漸化式に' },
          { t: 'm', size: 'sm', tex: 'p_{n+2}=\\frac{5}{12}p_n-\\frac{1}{12}q_n+\\frac14', note: '…①' }] },
      { ask: { type: 'choice', q: '① を $q_n$ について解くと？',
        opts: ['$q_n=5p_n-3-12p_{n+2}$', '$q_n=12p_{n+2}-5p_n-3$', '$q_n=5p_n+3-12p_{n+2}$', '$q_n=5p_n+3-p_{n+2}$'], ok: 2,
        why: { 0: '$\\frac14\\times12=3$ を移項するときの符号です。$12p_{n+2}=5p_n-q_n+3$。', 1: '全体の符号が逆です。$q_n$ の係数はマイナスでした。', 3: '両辺に 12 をかけるとき、$p_{n+2}$ にもかけます。' },
        good: '両辺を 12 倍して $12p_{n+2}=5p_n-q_n+3$。だから $q_n=5p_n+3-12p_{n+2}$。',
        add: [{ t: 'm', size: 'sm', tex: 'q_n=5p_n+3-12p_{n+2},\\qquad q_{n+2}=5p_{n+2}+3-12p_{n+4}' }] } },
      { say: '2 つを $q_{n+2}=-\\frac{1}{12}p_n+\\frac{5}{12}q_n+\\frac14$ に入れて整理すると、$q$ が消えて $p$ だけの式になります。',
        add: [{ t: 'm', size: 'sm', tex: '5p_{n+2}+3-12p_{n+4}=-\\tfrac{1}{12}p_n+\\tfrac{5}{12}(5p_n+3-12p_{n+2})+\\tfrac14' },
          { t: 'ans', label: '(3) 答', tex: 'p_{n+4}=\\frac56p_{n+2}-\\frac16p_n+\\frac18' }] },
      { say: '検算：$n=0$ を入れると $p_4=\\frac56\\cdot\\frac23-\\frac16\\cdot1+\\frac18=\\frac{37}{72}$。(1) の $p_4$ と一致しました。',
        add: [{ t: 'm', size: 'sm', tex: 'p_4=\\frac{5}{9}-\\frac16+\\frac18=\\frac{40-12+9}{72}=\\frac{37}{72}', note: '(1) と一致' }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.62, 0.38], part: '(4)', say: '(4) です。$p_n=r_n+c$ を (3) に入れると、定数項は $c-\\frac56c+\\frac16c-\\frac18$ の分だけ残ります。これが 0 になる $c$ を選びます。',
        add: [{ t: 'h', text: '(4)　定数項を消す・等比の形にする' },
          { t: 'm', size: 'sm', tex: 'c=\\frac56c-\\frac16c+\\frac18', note: '$p_n$ を全部 $c$ に\nした式' }] },
      { ask: { type: 'choice', q: '$c$ の値は？',
        opts: ['$\\dfrac18$', '$\\dfrac38$', '$\\dfrac13$', '$\\dfrac34$'], ok: 1,
        why: { 0: '定数項そのものです。$c\\left(1-\\frac56+\\frac16\\right)=\\frac18$ を解きます。', 2: '$1-\\frac56+\\frac16=\\frac13$ は $c$ の係数。$c=\\frac18\\div\\frac13$ です。', 3: '$1-\\frac56+\\frac16$ を $\\frac16$ と計算しています。' },
        good: '$\\frac13c=\\frac18$ より $c=\\frac38$。これは、時間がたつと（偶数の時刻で）$p_n$ が近づく値です。',
        add: [{ t: 'm', tex: 'c=\\frac38,\\qquad r_{n+4}=\\frac56r_{n+2}-\\frac16r_n' }] } },
      { ask: { type: 'choice', q: '$r_{n+4}-\\alpha r_{n+2}=\\beta(r_{n+2}-\\alpha r_n)$ と比べる。$\\alpha+\\beta=\\frac56,\\ \\alpha\\beta=\\frac16$ をみたす組は？',
        opts: ['$\\left(\\frac56,\\ \\frac16\\right)$', '$\\left(\\frac12,\\ -\\frac13\\right)$', '$\\left(-\\frac12,\\ -\\frac13\\right)$', '$\\left(\\frac12,\\ \\frac13\\right)$'], ok: 3,
        why: { 0: '和は $1$ になってしまいます。$\\alpha,\\ \\beta$ は $t^2-\\frac56t+\\frac16=0$ の 2 つの解です。', 1: '積が $-\\frac16$ になります。', 2: '和が $-\\frac56$ になります。' },
        good: '$t^2-\\frac56t+\\frac16=\\left(t-\\frac12\\right)\\left(t-\\frac13\\right)=0$。$\\left(\\frac13,\\ \\frac12\\right)$ と入れかえても成り立ちます。',
        add: [{ t: 'ans', label: '(4) 答', text: '$c=\\dfrac38$，　$(\\alpha,\\ \\beta)=\\left(\\dfrac12,\\ \\dfrac13\\right)$\n（$\\left(\\dfrac13,\\ \\dfrac12\\right)$ でもよい）' }] } },

      // ---------- (5) ----------
      { clear: true, cols: [1], part: '(5)', say: '(5) です。$r_0=1-\\frac38=\\frac58$、$r_2=\\frac23-\\frac38=\\frac{7}{24}$。$(\\alpha,\\ \\beta)$ の 2 通りの組それぞれで、「2 つおきの等比数列」を作ります。',
        add: [{ t: 'h', text: '(5)　2 つの等比数列から $r_n$ を出す（$n$ は偶数）' },
          { t: 'm', tex: 'r_{n+2}-\\frac12r_n=\\Big(\\frac13\\Big)^{\\frac n2}\\Big(r_2-\\frac12r_0\\Big)=-\\frac{1}{48}\\Big(\\frac13\\Big)^{\\frac n2}', note: '$(\\alpha,\\beta)=(\\frac12,\\frac13)$' },
          { t: 'm', tex: 'r_{n+2}-\\frac13r_n=\\Big(\\frac12\\Big)^{\\frac n2}\\Big(r_2-\\frac13r_0\\Big)=\\frac{1}{12}\\Big(\\frac12\\Big)^{\\frac n2}', note: '$(\\alpha,\\beta)=(\\frac13,\\frac12)$' }] },
      { ask: { type: 'think', q: '上の 2 式の差をとって、$r_n$ を求めよう。',
        hint: '下の式から上の式を引くと、$r_{n+2}$ が消えて $\\left(\\frac12-\\frac13\\right)r_n$ が残る。',
        ans: '$\\dfrac16r_n=\\dfrac{1}{12}\\Big(\\dfrac12\\Big)^{\\frac n2}+\\dfrac{1}{48}\\Big(\\dfrac13\\Big)^{\\frac n2}$ より　$r_n=\\dfrac12\\Big(\\dfrac12\\Big)^{\\frac n2}+\\dfrac18\\Big(\\dfrac13\\Big)^{\\frac n2}$',
        after: '$n=0$ で $\\frac12+\\frac18=\\frac58=r_0$。最初の値で検算できます。',
        add: [{ t: 'm', tex: '\\frac16r_n=\\frac{1}{12}\\Big(\\frac12\\Big)^{\\frac n2}+\\frac{1}{48}\\Big(\\frac13\\Big)^{\\frac n2}' }] } },
      { say: '$p_n=r_n+\\frac38$ にもどし、奇数のときも合わせて答えます。$n=2$ を入れると $\\frac38+\\frac14+\\frac1{24}=\\frac23$。(1) と合っています。',
        add: [{ t: 'ans', label: '(5) 答', tex: 'p_n=\\begin{cases}\\dfrac38+\\Big(\\dfrac12\\Big)^{\\frac n2+1}+\\dfrac18\\Big(\\dfrac13\\Big)^{\\frac n2} & (n\\ \\text{が偶数})\\\\[2mm] 0 & (n\\ \\text{が奇数})\\end{cases}' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.55, 0.45], part: '別の見方', say: '図が左右対称なので、$s_n=p_n+q_n$ と $d_n=p_n-q_n$ に分けると、(2) の 2 式を足したり引いたりするだけで、それぞれ 1 つの数列の漸化式になります。',
        add: [{ t: 'h', text: '別の見方：和と差に分ける' },
          { t: 'm', size: 'sm', tex: 's_{n+2}=\\frac13s_n+\\frac12,\\qquad d_{n+2}=\\frac12d_n' },
          { t: 'm', size: 'sm', tex: 's_n=\\frac34+\\frac14\\Big(\\frac13\\Big)^{\\frac n2},\\quad d_n=\\Big(\\frac12\\Big)^{\\frac n2}', note: '$s_0=d_0=1$' },
          { t: 'p', size: 'sm', text: '$p_n=\\dfrac{s_n+d_n}{2}$ は (5) と一致。$\\frac12$ と $\\frac13$ が (4) の $\\alpha,\\ \\beta$ です。' },
          graph('g2', [], { color: true })] },
      { say: '$c=\\frac38$ にも意味があります。長い時間で見ると、線の本数に比例した割合で点にいます。A, C, E の線は 3, 3, 2 本なので、A は $\\frac{3}{8}$。答えの確かめに使えます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・奇数の時刻は 0（理由＝2 色）と書く\n・E の確率 $1-p_n-q_n$ は「$n$ が偶数のとき」だけ\n・(5) は偶数・奇数に分けて答える。$n=0,\\,2$ で検算' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「偶奇で分ける → 2 秒ごとの表 → 連立 → 3項間 → 2 つの等比」が、この型の確率漸化式の一本道でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
