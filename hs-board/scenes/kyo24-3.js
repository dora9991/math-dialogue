/* 2024 京大 理系 第3問の類題（自作）：直線 PQ（P(p,0,0)、Q(0,q,1)）と直線 CE（C(0,1,0)、E(1,0,1)）がねじれの位置にある条件
   答え（python3 で検算ずみ。有理数の格子 27×27 で「ねじれ ⇔ pq≠1」を確認）：
   交わる ⇔ q≠−1 かつ pq=1（交点は s=t=1/(q+1)）、平行 ⇔ p=q=−1（別の直線）、一致はしない
   → ねじれの位置 ⇔ pq≠1。（P,Q,C,E が同一平面上 ⇔ pq=1） */
(function () {
  const S = 2.2, pj = (x, y, z) => [S * (y - 0.5 * x), S * (z - 0.35 * x)];
  const V = { O: [0, 0, 0], A: [1, 0, 0], B: [1, 1, 0], C: [0, 1, 0], D: [0, 0, 1], E: [1, 0, 1], F: [1, 1, 1], G: [0, 1, 1] };
  const J = k => pj(...V[k]);
  const E3 = (a, b, o) => Object.assign({ k: 'seg', a: J(a), b: J(b), c: 'd', wd: 2 }, o || {});
  const lineP = (f, t1, t2) => ({ a: pj(...f(t1)), b: pj(...f(t2)) });
  const ellOf = (p, q) => s => [p - p * s, q * s, s];
  const mOf = t => [t, 1 - t, t];
  const cube = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-2.3, -1.6, 4.0, 3.6], w: w || 460, h: Math.round((w || 460) * 5.2 / 6.3), items: [
    { k: 'vec', a: J('O'), b: pj(1.7, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: J('O'), b: pj(0, 1.6, 0), c: 'd', wd: 2 }, { k: 'vec', a: J('O'), b: pj(0, 0, 1.55), c: 'd', wd: 2 },
    { k: 'label', at: pj(1.7, 0, 0), text: 'x', dx: -12, dy: 14, c: 'd', size: 22 }, { k: 'label', at: pj(0, 1.6, 0), text: 'y', dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 1.55), text: 'z', dx: 14, c: 'd', size: 22 },
    E3('A', 'B'), E3('B', 'C'), E3('A', 'E'), E3('B', 'F'), E3('C', 'G'), E3('D', 'E'), E3('E', 'F'), E3('F', 'G'), E3('D', 'G'),
    { k: 'label', at: J('O'), text: 'O', dx: -16, dy: 4, size: 21 },
    { k: 'pt', at: J('C'), name: 'C', dir: 'se', c: 'b', r: 5, size: 23 }, { k: 'pt', at: J('E'), name: 'E', dir: 'w', c: 'b', r: 5, size: 23 }
  ].concat(extra || []) });
  const mLine = Object.assign({ k: 'seg', c: 'b', wd: 3 }, lineP(mOf, -0.35, 1.35));
  const mLab = { k: 'label', at: pj(...mOf(1.35)), text: 'm', c: 'b', size: 24, dx: 10, dy: -4 };
  const ell = (p, q, s1, s2) => Object.assign({ k: 'seg', c: 'y', wd: 3 }, lineP(ellOf(p, q), s1, s2));
  // 図の見本：p=0.6, q=0.5（pq≠1 → ねじれ）
  const sample = [ell(0.6, 0.5, -0.45, 1.45), { k: 'label', at: pj(...ellOf(0.6, 0.5)(1.45)), text: 'ℓ', c: 'y', size: 24, dx: -14 },
    { k: 'pt', at: pj(0.6, 0, 0), name: 'P', dir: 'sw', c: 'y', r: 5, size: 23 }, { k: 'pt', at: pj(0, 0.5, 1), name: 'Q', dir: 'n', c: 'y', r: 5, size: 23 }, mLine, mLab];

  const POINTS = [
    'ねじれの位置 ⇔ **平行でなく、かつ交わらない**（⇔ 同一平面上にない）。片方だけ調べるのはまちがい',
    '交わる条件は、2直線の式を連立して「解 $s,\\ t$ が **存在する**」条件。係数が 0 になる場合（$q=-1$）を分けて考える',
    '平行な場合は「交わらない」をみたしてしまう。最後に2つの条件を合わせて、必要十分条件として整理する'
  ];

  HB.lesson({
    id: 'kyo24-3', field: '京大型　数学（理系）', title: '2024 京大 理系 第3問の類題 ― 2直線がねじれの位置にある条件', level: '2024年度 京都大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 点 $\\mathrm{C}(0,\\,1,\\,0)$、$\\mathrm{E}(1,\\,0,\\,1)$ をとり、直線 CE を $m$ とする。実数 $p,\\ q$ に対し、2 点 $\\mathrm{P}(p,\\,0,\\,0)$、$\\mathrm{Q}(0,\\,q,\\,1)$ を通る直線を $\\ell$ とする。$\\ell$ と $m$ がねじれの位置にあるための、$p,\\ q$ についての必要十分条件を求めよ。',
      parts: [],
      src: '※ 2024年度 京都大学 前期 理系 数学 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.55, 0.45],
    steps: [
      { part: '問題', say: '空間の2直線が「ねじれの位置」にある条件を、必要十分条件として求める問題です。答えより論証が大切。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'C と E は、1辺 1 の立方体の頂点で、$m$ はその対角線です。P は $x$ 軸上、Q は上の面の辺の延長上を動きます（図は $p=0.6,\\ q=0.5$）。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: '$m$：立方体の対角線 CE\nP：$x$ 軸上の点、Q：平面 $z=1$ 上で $x=0$ の直線上の点\n$\\ell$：直線 PQ（P と Q は $z$ 座標がちがうので、いつも別の点）' },
          cube('c1', sample)] },
      { ask: { type: 'choice', q: '空間の2直線 $\\ell,\\ m$ が「ねじれの位置にある」とは？',
        opts: ['交わらない', '平行でない', '垂直でない', '平行でなく、かつ交わらない'], ok: 3,
        why: { 0: '平行な2直線も交わりませんが、ねじれの位置ではありません。', 1: '交わる2直線も平行ではありませんが、ねじれの位置ではありません。', 2: 'ねじれの位置は、垂直かどうかとは関係ありません（ねじれの位置で垂直なこともあります）。' },
        good: '同じ平面上にない2直線がねじれの位置。「平行でない」かつ「交わらない」の **両方** が必要です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'ねじれの位置', text: '$\\ell$ と $m$ が **平行でなく、かつ交わらない**\n（＝同じ平面上にない）' }] } },
      { say: '図では交わって見えても、空間では交わらないことがあります。だから式で調べます。方針：①「交わる条件」と ②「平行になる条件」を求め、どちらでもない所が答え。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '① 交わる条件　② 平行になる条件\n→ ①でも②でもない $(p,\\ q)$ が答え' }] },

      // ---------- 直線の式 ----------
      { clear: true, part: '答案', say: '2直線をベクトルで表します。$m$ は C を通り、方向は $\\overrightarrow{\\mathrm{CE}}=(1,\\,-1,\\,1)$。',
        add: [{ t: 'h', text: '答案：2直線の式' },
          { t: 'm', tex: 'm:\\ (x,\\,y,\\,z)=(0,\\,1,\\,0)+t(1,\\,-1,\\,1)=(t,\\,1-t,\\,t)' },
          cube('c2', sample, 420)] },
      { ask: { type: 'choice', q: '$\\ell$ の方向ベクトル $\\overrightarrow{\\mathrm{PQ}}$ は？',
        opts: ['$(p,\\,q,\\,1)$', '$(-p,\\,q,\\,1)$', '$(p,\\,-q,\\,-1)$', '$(-p,\\,q,\\,0)$'], ok: 1,
        why: { 0: '$\\overrightarrow{\\mathrm{PQ}}=$（Q の座標）−（P の座標）。$x$ 成分は $0-p=-p$。', 2: 'それは $\\overrightarrow{\\mathrm{QP}}$ です（方向ベクトルとしては使えますが、ここでは PQ を答えます）。', 3: '$z$ 成分は $1-0=1$ です。' },
        good: '$\\overrightarrow{\\mathrm{PQ}}=(0-p,\\ q-0,\\ 1-0)=(-p,\\,q,\\,1)$。$z$ 成分が 1 なので、決して零ベクトルになりません。',
        add: [{ t: 'm', tex: '\\ell:\\ (x,\\,y,\\,z)=(p,\\,0,\\,0)+s(-p,\\,q,\\,1)=(p-ps,\\,qs,\\,s)' }] } },

      // ---------- ① 交わる条件 ----------
      { clear: true, cols: [0.6, 0.4], say: '① 交わる条件。$\\ell$ と $m$ が交わる ⇔ 座標がそろう実数 $s,\\ t$ が **存在する**。成分ごとに等しいとおきます。',
        add: [{ t: 'h', text: '① 交わる条件' },
          { t: 'm', size: 'sm', tex: '\\begin{cases} p-ps=t\\\\ qs=1-t\\\\ s=t\\end{cases}', note: '$x$ 成分\n$y$ 成分\n$z$ 成分' },
          { t: 'p', size: 'sm', text: '$t=s$ を入れると' },
          { t: 'm', tex: '(q+1)s=1\\ \\cdots\\text{(i)},\\qquad (p+1)s=p\\ \\cdots\\text{(ii)}' }] },
      { ask: { type: 'choice', q: '(i) $(q+1)s=1$ をみたす実数 $s$ が存在するための条件は？',
        opts: ['$q\\neq-1$', '$q\\neq0$', 'いつでも存在する', '$q=-1$'], ok: 0,
        why: { 1: '$q=0$ なら $s=1$ で解けます。困るのは $s$ の係数 $q+1$ が 0 のときです。', 2: '$q=-1$ だと $0\\cdot s=1$ となり、解がありません。', 3: '$q=-1$ のときは $0=1$ となって、むしろ解がありません。' },
        good: '$q=-1$ のとき (i) は $0=1$ で解なし → 交わらない。$q\\neq-1$ のとき $s=\\dfrac{1}{q+1}$ にきまります。',
        add: [{ t: 'p', size: 'sm', text: '$q=-1$：(i) が $0=1$ → 解なし（交わらない）\n$q\\neq-1$：$s=\\dfrac{1}{q+1}$' }] } },
      { ask: { type: 'choice', q: '$q\\neq-1$ のとき、$s=\\dfrac{1}{q+1}$ を (ii) に入れると、交わる条件は？',
        opts: ['$p=q$', '$p+q=1$', '$pq=1$', '$pq=-1$'], ok: 2,
        why: { 0: '(ii) は $\\frac{p+1}{q+1}=p$。分母をはらうと $p+1=pq+p$ です。', 1: '$p+1=p(q+1)$ を展開すると、$p$ が両辺から消えます。', 3: '$p+1=pq+p$ より $pq=1$。符号に注意。' },
        good: '$\\dfrac{p+1}{q+1}=p$ より $p+1=pq+p$、よって $pq=1$。このとき $s,\\ t$ が実際に存在するので、交わります。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: '① 交わる', text: '$q\\neq-1$ かつ $pq=1$　（交点は $s=t=\\dfrac{1}{q+1}$）' }] } },
      { ask: { type: 'think', q: '$p=q=1$（P＝(1, 0, 0)、Q＝(0, 1, 1)）のとき、$\\ell$ と $m$ の交点を求めよう。',
        hint: '$s=t=\\dfrac1{q+1}$ を $m$ の式 $(t,\\ 1-t,\\ t)$ に入れる。',
        ans: '$s=t=\\dfrac12$ より　交点は $\\left(\\dfrac12,\\ \\dfrac12,\\ \\dfrac12\\right)$（立方体の中心）',
        after: 'このとき $\\ell$ も立方体の対角線になり、2本の対角線が中心で交わります。',
        add: [{ t: 'fig', id: 'cx', col: 1, view: [-2.3, -1.6, 4.0, 3.6], w: 330, h: 272, items: cube('tmp').items.concat([mLine, mLab, ell(1, 1, -0.35, 1.35),
          { k: 'pt', at: pj(0.5, 0.5, 0.5), c: 'p', r: 6 }, { k: 'label', at: pj(0.5, 0.5, 0.5), text: '交点', c: 'p', size: 20, dx: 28, dy: 4, plain: true }]) }] } },

      // ---------- ② 平行の条件 ----------
      { clear: true, cols: [0.6, 0.4], say: '② 平行になる条件。方向ベクトルが平行 ⇔ $\\overrightarrow{\\mathrm{PQ}}=k\\overrightarrow{\\mathrm{CE}}$ となる実数 $k$ がある、です。',
        add: [{ t: 'h', text: '② 平行になる条件' },
          { t: 'm', tex: '(-p,\\,q,\\,1)=k(1,\\,-1,\\,1)' }] },
      { ask: { type: 'choice', q: '$\\ell\\parallel m$ となる $(p,\\ q)$ は？',
        opts: ['$(1,\\ 1)$', '$(-1,\\ 1)$', '$(1,\\ -1)$', '$(-1,\\ -1)$'], ok: 3,
        why: { 0: '$(1,\\,1)$ のときは ① で調べたとおり、中心で交わります。', 1: '$z$ 成分から $k=1$。すると $q=-k=-1$ です。', 2: '$x$ 成分 $-p=k=1$ より $p=-1$ です。' },
        good: '$z$ 成分から $k=1$、$x$ 成分から $p=-1$、$y$ 成分から $q=-1$。',
        add: [{ t: 'p', size: 'sm', text: '$p=q=-1$ のとき $\\ell:(-1+s,\\,-s,\\,s)$。C$(0,\\,1,\\,0)$ を通るには $s=1$ かつ $s=-1$ が必要で不可能\n→ $\\ell$ と $m$ は一致せず、**平行な別の直線**' },
          { t: 'box', c: 'g', size: 'sm', label: '② 平行', text: '$(p,\\ q)=(-1,\\ -1)$' }] } },

      // ---------- 結論 ----------
      { clear: true, cols: [0.58, 0.42], part: '結論', say: '① と ② を合わせます。点 $(-1,\\,-1)$ は ① からは外れていますが、$pq=1$ はみたしています。',
        add: [{ t: 'h', text: '結論：①②を合わせる' },
          { t: 'p', size: 'sm', text: '① 交わる：$pq=1$ かつ $(p,\\,q)\\neq(-1,\\,-1)$\n② 平行：$(p,\\,q)=(-1,\\,-1)$（これも $pq=1$ の上）' },
          { t: 'fig', id: 'hp', col: 1, view: [-3.2, -3.2, 3.2, 3.2], w: 380, h: 380, items: [
            { k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [[-1, '−1'], [1, '1']], xl: 'p', yl: 'q' },
            { k: 'fn', f: '1/x', a: 0.31, b: 3.2, c: 'p', label: 'pq=1', lat: [1.35, 1.75] }, { k: 'fn', f: '1/x', a: -3.2, b: -0.31, c: 'p' },
            { k: 'pt', at: [1, 1], c: 'p', r: 5 }, { k: 'pt', at: [-1, -1], name: '平行', dir: 'sw', c: 'g', r: 7, size: 20 }] }] },
      { ask: { type: 'choice', q: '$\\ell$ と $m$ がねじれの位置にある $(p,\\ q)$ の条件として正しいのは？',
        opts: ['$pq\\neq1$ または $(p,\\,q)=(-1,\\,-1)$', '$q\\neq-1$ かつ $pq\\neq1$', '$pq\\neq1$', '$(p,\\,q)\\neq(-1,\\,-1)$'], ok: 2,
        why: { 0: '「交わらない」だけを答えています。$(-1,\\,-1)$ は平行なので、ねじれの位置ではありません。', 1: '$q=-1$ でも $p\\neq-1$ なら、交わらず平行でもないので、ねじれの位置です。', 3: '平行の場合を除いただけで、交わる場合（$pq=1$）が残っています。' },
        good: '①②を合わせた「交わるか平行」は、ちょうど $pq=1$。だから、ねじれの位置 ⇔ $pq\\neq1$。',
        add: [{ t: 'ans', label: '答', tex: 'pq\\neq1' }],
        draw: [{ fig: 'hp', items: [{ k: 'label', at: [0.3, -2.3], text: '曲線の上以外 → ねじれ', size: 17, plain: true, anchor: 'start', c: 'y' }] }] } },
      { say: '答案では「$pq\\neq1$ ならば、交わらず平行でもない」「$pq=1$ ならば、交わるか平行」の **両方向** を書きます。$q=-1$ の場合も、この中にふくまれています。',
        add: [{ t: 'p', size: 'sm', text: '$pq\\neq1$ ⇒ ①でも②でもない ⇒ ねじれ\n$pq=1$ ⇒ $q\\neq-1$ なら①、$q=-1$ なら $p=-1$ で②' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.6, 0.4], part: '別の見方', say: 'ねじれの位置 ⇔ 4点 P, Q, C, E が同じ平面上にない、とも言えます。$\\overrightarrow{\\mathrm{CP}}$ と $\\overrightarrow{\\mathrm{CE}}$ は平行でないので、平面 PCE 上の点は $\\overrightarrow{\\mathrm{CP}},\\ \\overrightarrow{\\mathrm{CE}}$ で表せます。',
        add: [{ t: 'h', text: '別の見方：4点が同じ平面上にあるか' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{CP}}=(p,\\,-1,\\,0),\\quad \\overrightarrow{\\mathrm{CE}}=(1,\\,-1,\\,1),\\quad \\overrightarrow{\\mathrm{CQ}}=(0,\\,q-1,\\,1)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{CQ}}=a\\overrightarrow{\\mathrm{CP}}+b\\overrightarrow{\\mathrm{CE}}', note: 'となる実数 $a,\\ b$ があるか' },
          cube('c3', sample, 400)] },
      { ask: { type: 'think', q: '$\\overrightarrow{\\mathrm{CQ}}=a\\overrightarrow{\\mathrm{CP}}+b\\overrightarrow{\\mathrm{CE}}$ をみたす $a,\\ b$ が存在する条件を求めよう。',
        hint: '成分で書くと $ap+b=0$、$-a-b=q-1$、$b=1$。',
        ans: '$b=1$、$a=-q$、$-qp+1=0$ より　条件は $pq=1$（このとき4点は同じ平面上）',
        after: '4点が同じ平面上 ⇔ $pq=1$。だから、ねじれの位置 ⇔ $pq\\neq1$ と、場合分けなしで同じ答えになります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。必要十分条件の問題では、「どの場合が答えにふくまれ、どの場合が外れるか」を最後に整理するのが大切です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
