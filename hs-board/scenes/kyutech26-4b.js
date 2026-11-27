/* 九工大型 数学：2026年度 九州工業大学 前期 第4問の類題②（自作問題・元の問題ではない）
   問題：一直線に並ぶ 7 個の点 A〜G（隣どうしが線で結ばれ、A と G は行き止まり）。P は時刻 0 に B にあり、
         1 秒ごとに隣の点へ等確率で移る。時刻 n に B にいる確率 p_n、F にいる確率 q_n。
   答え（python3・sympy で 7×7 の推移行列を 12 回かけて検算ずみ）：
     2 秒後の移り方：B→(B,D,F)=(3/4,1/4,0)、D→(1/4,1/2,1/4)、F→(0,1/4,3/4)
     (1) p_2=3/4, q_2=0, p_4=5/8
     (2) n 偶数：p_{n+2}=(1/2)p_n−(1/4)q_n+1/4、q_{n+2}=−(1/4)p_n+(1/2)q_n+1/4（奇数のとき p_n=q_n=0）
     (3) p_{n+4}=p_{n+2}−(3/16)p_n+1/16
     (4) c=1/3、(α,β)=(1/4,3/4)（(3/4,1/4) でも可）
     (5) r_0=2/3, r_2=5/12。r_{n+2}−r_n/4=(1/4)(3/4)^{n/2}、r_{n+2}−3r_n/4=−(1/12)(1/4)^{n/2}
         n 偶数：p_n=1/3+(1/2)(3/4)^{n/2}+(1/6)(1/4)^{n/2}、n 奇数：p_n=0（n=0〜12 で一致を確認）
     別の見方：p+q と p−q に分けると s_{n+2}=s_n/4+1/2、d_{n+2}=(3/4)d_n（B と F が D について左右対称なため） */
(function () {
  const NM = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const V = {}; NM.forEach((k, i) => { V[k] = [i, 0]; });
  const EV = ['B', 'D', 'F'];
  const graph = (id, extra, o) => {
    o = o || {};
    const it = [];
    for (let i = 0; i < 6; i++) it.push({ k: 'seg', a: V[NM[i]], b: V[NM[i + 1]], c: 'w', wd: 3 });
    NM.forEach(k => {
      const ev = EV.includes(k);
      it.push({ k: 'pt', at: V[k], name: k, dir: 's', c: o.color ? (ev ? 'y' : 'b') : 'w', size: 24, r: 8 });
    });
    const W = o.w || 520;
    return { t: 'fig', id, col: 1, view: [-0.7, -1.3, 6.7, 1.3], w: W, h: Math.round(W * 2.6 / 7.4), items: it.concat(extra || []) };
  };
  const ar = (a, b, c, s) => {   // 点 a から点 b へ、少しずらした矢印
    const A = V[a], B = V[b], d = B[0] > A[0] ? 1 : -1, e = 0.16, y = s === -1 ? 0.6 : 0.3;
    return { k: 'vec', a: [A[0] + d * e, y], b: [B[0] - d * e, y], c, wd: 2.5 };
  };
  const POINTS = [
    '1 回ごとに「黄の点（B, D, F）」と「青の点」を行き来する（2 色にぬれる図形）。だから **偶数の時刻だけ** を、**2 秒ごとの移り方** で追う',
    '2 秒後の移り方を表にすると、$p_{n+2},\\ q_{n+2}$ の連立漸化式が立つ。D にいる確率は $1-p_n-q_n$（$n$ が偶数のとき）',
    '1 つを消して3項間漸化式 → 極限の値 $c$ を引いて定数項を消す → $\\alpha,\\ \\beta$ を入れかえた 2 つの等比数列の式から $r_n$ を出す'
  ];
  const TBL = { t: 'tbl', col: 1, size: 'sm', rows: [['2 秒後', 'B', 'D', 'F'], ['B から', '$\\frac34$', '$\\frac14$', '$0$'], ['D から', '$\\frac14$', '$\\frac12$', '$\\frac14$'], ['F から', '$0$', '$\\frac14$', '$\\frac34$']] };

  HB.lesson({
    id: 'kyutech26-4b', field: '九工大型　数学', title: '2026 九工大 第4問の類題② ― 両はしが行き止まりの一本道を動く点の確率', level: '2026年度 九州工業大学 前期 第4問の類題②（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題②',
      lead: '一直線上に 7 個の点 A，B，C，D，E，F，G がこの順に並び、となりどうしが線で結ばれている（A と G は行き止まり）。点 P は時刻 0 に B にあり、1 秒ごとに、いまいる点と線で結ばれた点のうちの 1 つへ、等しい確率で移る。時刻 $n$ に P が B にある確率を $p_n$、F にある確率を $q_n$ とする（$n=0,\\,1,\\,2,\\,\\cdots$）。',
      parts: [
        '(1)　$p_2,\\ q_2,\\ p_4$ を求めよ。',
        '(2)　$n$ が奇数のとき $p_n=q_n=0$ である。$n$ が偶数のとき、$p_{n+2},\\ q_{n+2}$ をそれぞれ $p_n,\\ q_n$ で表せ。',
        '(3)　$n$ が偶数のとき、$p_{n+4}$ を $p_{n+2},\\ p_n$ で表せ。',
        '(4)　$r_n=p_n-c$ とおくとき、$r_n$ のみたす漸化式に定数項が現れないような定数 $c$ を求めよ。さらに、$n$ が偶数のとき $r_{n+4}-\\alpha r_{n+2}=\\beta(r_{n+2}-\\alpha r_n)$ がつねに成り立つような定数の組 $(\\alpha,\\ \\beta)$ を 1 組求めよ。',
        '(5)　$p_n$ を $n$ の式で表せ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第4問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', cols: [1], say: '確率と数列の融合問題です。一本道の上を動く点の確率を、漸化式で追いかけます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '図にすると、こうなります。両はしの A と G は線が 1 本で、必ず内側へもどります。ほかの点は線が 2 本で、左右へ $\\frac12$ ずつ進みます。',
        add: [{ t: 'h', text: '図にする' },
          { t: 'p', size: 'sm', text: '線の本数（＝次に行ける点の数）\nA，G：1 本　B，C，D，E，F：2 本' },
          graph('g0')] },
      { ask: { type: 'choice', q: '時刻 0 に B にいる P が、時刻 3 にいる可能性のある点は？',
        opts: ['B，D，F のどれか', 'A か G だけ', 'A，C，E，G のどれか', 'すべての点'], ok: 2,
        why: { 0: 'B，D，F にいられるのは偶数の時刻です。1 回動くと、必ず A，C，E，G のどれかに移ります。', 1: 'C，E にもいられます。', 3: '黄と青の 2 色にぬると、1 回ごとに色が必ず変わります。' },
        good: '黄の点（B, D, F）どうし・青の点どうしは、線で直接つながっていません。だから偶数の時刻は黄、奇数の時刻は青です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '偶奇', text: '$n$ が奇数 → $p_n=q_n=0$\n$n$ が偶数 → P は B, D, F のどれか（D は $1-p_n-q_n$）' }],
        draw: [{ fig: 'g0', items: EV.map(k => ({ k: 'pt', at: V[k], c: 'y', r: 9 })).concat(['A', 'C', 'E', 'G'].map(k => ({ k: 'pt', at: V[k], c: 'b', r: 9 }))) }] } },

      // ---------- (1) 2 秒後の移り方 ----------
      { clear: true, part: '(1)', say: '偶数の時刻だけを見るので、「2 秒後にどこにいるか」の表を先に作ります。B からは、A・C へそれぞれ $\\frac12$ で進みます。',
        add: [{ t: 'h', text: '(1)　2 秒後の移り方の表' },
          { t: 'm', size: 'sm', tex: '\\mathrm{B}\\to\\mathrm{B}:\\ \\frac12\\cdot1+\\frac12\\cdot\\frac12=\\frac34', note: 'A, C を経由' },
          { t: 'm', size: 'sm', tex: '\\mathrm{B}\\to\\mathrm{D}:\\ \\frac12\\cdot\\frac12=\\frac14,\\qquad \\mathrm{B}\\to\\mathrm{F}:\\ 0' },
          graph('g1', [ar('B', 'A', 'p'), ar('A', 'B', 'y', -1), ar('B', 'C', 'p'), ar('C', 'B', 'y', -1)], { color: true })] },
      { ask: { type: 'choice', q: 'D から出発したとき、2 秒後に B にいる確率は？',
        opts: ['$\\dfrac12$', '$\\dfrac14$', '$\\dfrac18$', '$\\dfrac13$'], ok: 1,
        why: { 0: 'D → C → B の 2 回の移動です。$\\frac12$ を 2 回かけます。', 2: '2 秒は 2 回の移動です。$\\frac12$ を 3 回もかけていません。', 3: '$\\frac13$ は線が 3 本の点の確率。この図の D の線は 2 本です。' },
        good: 'D → C → B で $\\frac12\\cdot\\frac12=\\frac14$。D → D は C 経由と E 経由で $\\frac12$、D → F も $\\frac14$。',
        add: [Object.assign({}, TBL)] } },
      { say: 'F からの行は、B の行を左右に折り返したもの（D について左右対称）。$p_2,\\ q_2$ は、B の行そのものです。',
        add: [{ t: 'm', tex: 'p_2=\\frac34,\\qquad q_2=0' }] },
      { ask: { type: 'think', q: '表を使って $p_4$ を求めよう。（時刻 2 に D にいる確率は $\\frac14$）',
        hint: '時刻 2 に B, D, F にいる確率に、それぞれ「2 秒後に B へ行く確率」をかけて足す。',
        ans: '$p_4=\\dfrac34\\cdot\\dfrac34+\\dfrac14\\cdot\\dfrac14+0\\cdot0=\\dfrac{9+1}{16}=\\dfrac58$',
        after: 'この「足し合わせ」を文字でやったものが、(2) の漸化式です。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'p_2=\\frac34,\\quad q_2=0,\\quad p_4=\\frac58' }] } },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '(2) です。$n$ が偶数のとき、時刻 $n$ に D にいる確率は $1-p_n-q_n$。表の「B の列」を縦に見て、時刻 $n+2$ に B にいる確率を作ります。',
        add: [{ t: 'h', text: '(2)　2 秒ごとの連立漸化式' },
          { t: 'm', size: 'sm', tex: 'p_{n+2}=\\frac34p_n+\\frac14(1-p_n-q_n)+0\\cdot q_n' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['2 秒後', 'B', 'D', 'F'], ['B から', '$\\dfrac34$', '$\\dfrac14$', '$0$'], ['D から', '$\\dfrac14$', '$\\dfrac12$', '$\\dfrac14$'], ['F から', '$0$', '$\\dfrac14$', '$\\dfrac34$']] }] },
      { ask: { type: 'choice', q: '整理すると、$p_{n+2}=$？',
        opts: ['$\\dfrac34p_n+\\dfrac14$', '$\\dfrac12p_n+\\dfrac14q_n+\\dfrac14$', '$\\dfrac12p_n-\\dfrac14q_n+\\dfrac14$', '$\\dfrac34p_n-\\dfrac14q_n+\\dfrac14$'], ok: 2,
        why: { 0: '$\\frac14(1-p_n-q_n)$ の $-\\frac14p_n$ と $-\\frac14q_n$ を忘れています。', 1: '$\\frac14(1-p_n-q_n)$ のかっこの中のマイナスを、足し算にしています。', 3: '$p_n$ の係数は $\\frac34-\\frac14=\\frac12$。$-\\frac14p_n$ を引いていません。' },
        good: '$\\frac34-\\frac14=\\frac12$、$q_n$ の係数は $-\\frac14$。定数項 $\\frac14$ が残るのがポイントです。',
        add: [{ t: 'm', size: 'sm', tex: 'q_{n+2}=0\\cdot p_n+\\frac14(1-p_n-q_n)+\\frac34q_n' }] } },
      { say: '$q_{n+2}$ も同じように整理します。B と F を入れかえた形になっています。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\begin{aligned}p_{n+2}&=\\tfrac12p_n-\\tfrac14q_n+\\tfrac14\\\\ q_{n+2}&=-\\tfrac14p_n+\\tfrac12q_n+\\tfrac14\\end{aligned}' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.62, 0.38], part: '(3)', say: '(3) です。$q$ を消します。1 つ目の式を $q_n$ について解き、2 つ目の式に入れます（2 つ目の式は $n$ を $n+2$ にずらした形も使います）。',
        add: [{ t: 'h', text: '(3)　q を消して3項間漸化式に' },
          { t: 'm', size: 'sm', tex: 'p_{n+2}=\\frac12p_n-\\frac14q_n+\\frac14', note: '…①' }] },
      { ask: { type: 'choice', q: '① を $q_n$ について解くと？',
        opts: ['$q_n=4p_{n+2}-2p_n-1$', '$q_n=2p_n+1-p_{n+2}$', '$q_n=2p_n-1-4p_{n+2}$', '$q_n=2p_n+1-4p_{n+2}$'], ok: 3,
        why: { 0: '全体の符号が逆です。$q_n$ の係数はマイナスでした。', 1: '両辺に 4 をかけるとき、$p_{n+2}$ にもかけます。', 2: '$\\frac14\\times4=1$ を移項するときの符号です。$4p_{n+2}=2p_n-q_n+1$。' },
        good: '両辺を 4 倍して $4p_{n+2}=2p_n-q_n+1$。だから $q_n=2p_n+1-4p_{n+2}$。',
        add: [{ t: 'm', size: 'sm', tex: 'q_n=2p_n+1-4p_{n+2},\\qquad q_{n+2}=2p_{n+2}+1-4p_{n+4}' }] } },
      { say: '2 つを $q_{n+2}=-\\frac14p_n+\\frac12q_n+\\frac14$ に入れて整理すると、$q$ が消えて $p$ だけの式になります。',
        add: [{ t: 'm', size: 'sm', tex: '2p_{n+2}+1-4p_{n+4}=-\\tfrac14p_n+\\tfrac12(2p_n+1-4p_{n+2})+\\tfrac14' },
          { t: 'ans', label: '(3) 答', tex: 'p_{n+4}=p_{n+2}-\\frac{3}{16}p_n+\\frac1{16}' }] },
      { say: '検算：$n=0$ を入れると $p_4=\\frac34-\\frac{3}{16}\\cdot1+\\frac1{16}=\\frac58$。(1) の $p_4$ と一致しました。',
        add: [{ t: 'm', size: 'sm', tex: 'p_4=\\frac{12-3+1}{16}=\\frac58', note: '(1) と一致' }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.62, 0.38], part: '(4)', say: '(4) です。$p_n=r_n+c$ を (3) に入れると、定数項が $c-c+\\frac{3}{16}c-\\frac1{16}$ の分だけ残ります。これが 0 になる $c$ を選びます。',
        add: [{ t: 'h', text: '(4)　定数項を消す・等比の形にする' },
          { t: 'm', size: 'sm', tex: 'c=c-\\frac{3}{16}c+\\frac1{16}', note: '$p_n$ を全部 $c$ に\nした式' }] },
      { ask: { type: 'choice', q: '$c$ の値は？',
        opts: ['$\\dfrac13$', '$\\dfrac1{16}$', '$\\dfrac3{16}$', '$\\dfrac14$'], ok: 0,
        why: { 1: '定数項そのものです。$\\frac{3}{16}c=\\frac1{16}$ を解きます。', 2: '$\\frac3{16}$ は $c$ の係数。$c=\\frac1{16}\\div\\frac3{16}$ です。', 3: '$\\frac{3}{16}c=\\frac1{16}$ を解いて、$c=\\frac13$ です。' },
        good: '$\\frac3{16}c=\\frac1{16}$ より $c=\\frac13$。これは、時間がたつと（偶数の時刻で）$p_n$ が近づく値です。',
        add: [{ t: 'm', tex: 'c=\\frac13,\\qquad r_{n+4}=r_{n+2}-\\frac3{16}r_n' }] } },
      { ask: { type: 'choice', q: '$r_{n+4}-\\alpha r_{n+2}=\\beta(r_{n+2}-\\alpha r_n)$ と比べる。$\\alpha+\\beta=1,\\ \\alpha\\beta=\\frac3{16}$ をみたす組は？',
        opts: ['$\\left(\\frac12,\\ \\frac12\\right)$', '$\\left(\\frac14,\\ \\frac34\\right)$', '$\\left(\\frac18,\\ \\frac78\\right)$', '$\\left(-\\frac14,\\ \\frac54\\right)$'], ok: 1,
        why: { 0: '和は 1 ですが、積が $\\frac14$ になってしまいます。', 2: '和は 1 ですが、積が $\\frac7{64}$ になってしまいます。', 3: '和は 1 ですが、積が $-\\frac5{16}$ になってしまいます。' },
        good: '$t^2-t+\\frac3{16}=\\left(t-\\frac14\\right)\\left(t-\\frac34\\right)=0$。$\\left(\\frac34,\\ \\frac14\\right)$ と入れかえても成り立ちます。',
        add: [{ t: 'ans', label: '(4) 答', text: '$c=\\dfrac13$，　$(\\alpha,\\ \\beta)=\\left(\\dfrac14,\\ \\dfrac34\\right)$\n（$\\left(\\dfrac34,\\ \\dfrac14\\right)$ でもよい）' }] } },

      // ---------- (5) ----------
      { clear: true, cols: [1], part: '(5)', say: '(5) です。$r_0=1-\\frac13=\\frac23$、$r_2=\\frac34-\\frac13=\\frac5{12}$。$(\\alpha,\\ \\beta)$ の 2 通りの組それぞれで、「2 つおきの等比数列」を作ります。',
        add: [{ t: 'h', text: '(5)　2 つの等比数列から $r_n$ を出す（$n$ は偶数）' },
          { t: 'm', tex: 'r_{n+2}-\\frac14r_n=\\Big(\\frac34\\Big)^{\\frac n2}\\Big(r_2-\\frac14r_0\\Big)=\\frac14\\Big(\\frac34\\Big)^{\\frac n2}', note: '$(\\alpha,\\beta)=(\\frac14,\\frac34)$' },
          { t: 'm', tex: 'r_{n+2}-\\frac34r_n=\\Big(\\frac14\\Big)^{\\frac n2}\\Big(r_2-\\frac34r_0\\Big)=-\\frac1{12}\\Big(\\frac14\\Big)^{\\frac n2}', note: '$(\\alpha,\\beta)=(\\frac34,\\frac14)$' }] },
      { ask: { type: 'think', q: '上の 2 式の差をとって、$r_n$ を求めよう。',
        hint: '上の式から下の式を引くと、$r_{n+2}$ が消えて $\\left(\\frac34-\\frac14\\right)r_n$ が残る。',
        ans: '$\\dfrac12r_n=\\dfrac14\\Big(\\dfrac34\\Big)^{\\frac n2}+\\dfrac1{12}\\Big(\\dfrac14\\Big)^{\\frac n2}$ より　$r_n=\\dfrac12\\Big(\\dfrac34\\Big)^{\\frac n2}+\\dfrac16\\Big(\\dfrac14\\Big)^{\\frac n2}$',
        after: '$n=0$ で $\\frac12+\\frac16=\\frac23=r_0$。最初の値で検算できます。',
        add: [{ t: 'm', tex: '\\frac12r_n=\\frac14\\Big(\\frac34\\Big)^{\\frac n2}+\\frac1{12}\\Big(\\frac14\\Big)^{\\frac n2}' }] } },
      { say: '$p_n=r_n+\\frac13$ にもどし、奇数のときも合わせて答えます。$n=2$ を入れると $\\frac13+\\frac38+\\frac1{24}=\\frac34$。(1) と合っています。',
        add: [{ t: 'ans', label: '(5) 答', tex: 'p_n=\\begin{cases}\\dfrac13+\\dfrac12\\Big(\\dfrac34\\Big)^{\\frac n2}+\\dfrac16\\Big(\\dfrac14\\Big)^{\\frac n2} & (n\\ \\text{が偶数})\\\\[2mm] 0 & (n\\ \\text{が奇数})\\end{cases}' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.55, 0.45], part: '別の見方', say: '図が D について左右対称なので、$s_n=p_n+q_n$ と $d_n=p_n-q_n$ に分けると、(2) の 2 式を足したり引いたりするだけで、それぞれ 1 つの数列の漸化式になります。',
        add: [{ t: 'h', text: '別の見方：和と差に分ける' },
          { t: 'm', size: 'sm', tex: 's_{n+2}=\\frac14s_n+\\frac12,\\qquad d_{n+2}=\\frac34d_n' },
          { t: 'm', size: 'sm', tex: 's_n=\\frac23+\\frac13\\Big(\\frac14\\Big)^{\\frac n2},\\quad d_n=\\Big(\\frac34\\Big)^{\\frac n2}', note: '$s_0=d_0=1$' },
          { t: 'p', size: 'sm', text: '$p_n=\\dfrac{s_n+d_n}{2}$ は (5) と一致。$\\frac14$ と $\\frac34$ が (4) の $\\alpha,\\ \\beta$ です。' },
          graph('g2', [], { color: true, w: 440 })] },
      { say: '$c=\\frac13$ にも意味があります。長い時間で見ると、線の本数に比例した割合で点にいます。B, D, F の線は 2, 2, 2 本なので、B は $\\frac{1}{3}$。答えの確かめに使えます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・奇数の時刻は 0（理由＝2 色）と書く\n・D の確率 $1-p_n-q_n$ は「$n$ が偶数のとき」だけ\n・(5) は偶数・奇数に分けて答える。$n=0,\\,2$ で検算' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「偶奇で分ける → 2 秒ごとの表 → 連立 → 3項間 → 2 つの等比」が、この型の確率漸化式の一本道でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
