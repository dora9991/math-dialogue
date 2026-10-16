/* 京大型（理系）2025 第4問の類題（自作）：数学C 空間ベクトル ― 動く平面がいつも通る定点と、四面体の体積
   元の問題はうつしていない（「四面体の辺を延ばした直線上の3点」「平面が定点を通り、その点がただ1つ」「その点を頂点とする四面体の体積」というねらいと形式だけを合わせた自作問題）。
   OP=(1/s)a, OQ=(1/t)b, OR=(1/u)c、s+t+2u=5。点 X=xa+yb+zc が平面 PQR 上 ⇔ sx+ty+uz=1。
   定点 K：OK = (1/5)a+(1/5)b+(2/5)c（(s,t,u)=(1,2,1),(2,1,1),(1,1,3/2) の3式から一意）。
   (2) 1辺6の正四面体：V=18√2、OH=(5/4)OK（H は直線 OK と平面 ABC の交点）→ 四面体 KABC = V/5 = 18√2/5（考えてみよう：四面体 KOAB = (2/5)V = 36√2/5）。
   python3（numpy・sympy）で、ランダムな (s,t,u) の平面が K を通ること・体積を検算ずみ。 */
(function () {
  const POINTS = [
    '平面 PQR 上の点は $\\alpha\\overrightarrow{\\mathrm{OP}}+\\beta\\overrightarrow{\\mathrm{OQ}}+\\gamma\\overrightarrow{\\mathrm{OR}}$（$\\alpha+\\beta+\\gamma=1$）。係数を比べて「$sx+ty+uz=1$」という **平面の条件** に直す',
    '定点は、条件式 $s+t+2u=5$ を「$=1$」の形に直して見くらべる。「ただ1つ」は、条件を満たす **0 でない** 具体的な組を3つ代入して示す',
    '四面体の体積の比は、底面が共通なら高さの比。直線 OK と平面 ABC の交点 H を「係数の和 $=1$」で求める'
  ];
  // 見取図（平面に写した位置。1次結合はそのまま写る）
  const O = [2.2, 4.0], A = [0, 0.6], B = [2.0, -0.4], C = [4.4, 0.8];
  const comb = (x, y, z) => [O[0] + x * (A[0] - O[0]) + y * (B[0] - O[0]) + z * (C[0] - O[0]), O[1] + x * (A[1] - O[1]) + y * (B[1] - O[1]) + z * (C[1] - O[1])];
  const K = comb(0.2, 0.2, 0.4), H = comb(0.25, 0.25, 0.5);
  const VIEW = [-0.7, -1.0, 5.9, 4.5];
  const tet = (ext) => [
    { k: 'seg', a: O, b: A }, { k: 'seg', a: O, b: B }, { k: 'seg', a: O, b: C }, { k: 'seg', a: A, b: B }, { k: 'seg', a: B, b: C }, { k: 'seg', a: A, b: C, dash: true, wd: 2 },
    { k: 'pt', at: O, name: 'O', dir: 'n' }, { k: 'pt', at: A, name: 'A', dir: 'w' }, { k: 'pt', at: B, name: 'B', dir: 's' }, { k: 'pt', at: C, name: 'C', dir: 'ne' }]
    .concat(ext ? [{ k: 'seg', a: C, b: comb(0, 0, 1.45), c: 'd', dash: true, wd: 2 }, { k: 'seg', a: A, b: comb(1.25, 0, 0), c: 'd', dash: true, wd: 2 }, { k: 'seg', a: B, b: comb(0, 1.2, 0), c: 'd', dash: true, wd: 2 }] : []);
  // (s,t,u)=(2, 3/2, 3/4) のときの P, Q, R（R は OC の延長上）
  const P1 = comb(1 / 2, 0, 0), Q1 = comb(0, 2 / 3, 0), R1 = comb(0, 0, 4 / 3);
  const tri1 = [{ k: 'poly', pts: [P1, Q1, R1], close: true, c: 'b', fill: 'b', alpha: 0.18, wd: 2.5 },
    { k: 'pt', at: P1, name: 'P', dir: 'w', c: 'b' }, { k: 'pt', at: Q1, name: 'Q', dir: 'sw', c: 'b' }, { k: 'pt', at: R1, name: 'R', dir: 'e', c: 'b' }];
  // (s,t,u)=(1, 2, 1) のときの平面（P=A, R=C）
  const Q2 = comb(0, 1 / 2, 0);
  const tri2 = [{ k: 'poly', pts: [A, Q2, C], close: true, c: 'g', fill: 'g', alpha: 0.14, wd: 2.5, dash: true }, { k: 'pt', at: Q2, c: 'g', r: 5 }];
  const Kpt = { k: 'pt', at: K, name: 'K', dir: 'ne', c: 'p', off: 18 };
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: Math.round((h || 470) * 6.6 / 5.5), h: h || 470, items });

  HB.lesson({
    id: 'kyo25-4', field: '京大型　数学（理系）', title: '2025 京大 理系 第4問の類題 ― 動く平面が通る定点', level: '2025年度 京都大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '四面体 OABC において、$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b,\\ \\overrightarrow{\\mathrm{OC}}=\\vec c$ とする。0 でない実数 $s,\\ t,\\ u$ に対して、直線 OA, OB, OC 上の点 P, Q, R を\n$\\overrightarrow{\\mathrm{OA}}=s\\,\\overrightarrow{\\mathrm{OP}},\\quad \\overrightarrow{\\mathrm{OB}}=t\\,\\overrightarrow{\\mathrm{OQ}},\\quad \\overrightarrow{\\mathrm{OC}}=u\\,\\overrightarrow{\\mathrm{OR}}$\nで定める。$s,\\ t,\\ u$ が $s+t+2u=5$ を満たしながら動くとき、次の問いに答えよ。',
      parts: [
        '(1)　3 点 P, Q, R を通る平面は、$s,\\ t,\\ u$ の値によらない定点を通ることを示せ。また、そのような定点はただ 1 つであることを示せ。',
        '(2)　(1) の定点を K とする。四面体 OABC が 1 辺の長さ 6 の正四面体であるとき、四面体 KABC の体積を求めよ。'
      ],
      src: '※ 2025年度 京都大学 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '空間ベクトルの論証問題です。3点が動くと平面も動きますが、その平面が **いつも同じ点を通る** ことを示します。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$\\overrightarrow{\\mathrm{OA}}=s\\overrightarrow{\\mathrm{OP}}$ なので $\\overrightarrow{\\mathrm{OP}}=\\frac1s\\vec a$。$s<0$ なら P は O の反対側、$0<s<1$ なら A をこえた延長上です。図は $(s,\\ t,\\ u)=(2,\\ \\frac32,\\ \\frac34)$ の場合。',
        add: [{ t: 'h', text: 'P, Q, R を a, b, c で表す' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac1s\\vec a,\\quad \\overrightarrow{\\mathrm{OQ}}=\\frac1t\\vec b,\\quad \\overrightarrow{\\mathrm{OR}}=\\frac1u\\vec c' },
          fig('f1', tet(true).concat(tri1))] },
      { ask: { type: 'choice', q: 'P, Q, R が一直線上に並ばず、平面がただ1つ決まる理由は？',
        opts: ['$\\vec a,\\ \\vec b,\\ \\vec c$ が1次独立だから', 'P, Q, R が辺の上にあるから', '$s,\\ t,\\ u$ が正だから', '$s+t+2u=5$ だから'], ok: 0,
        why: { 1: 'P, Q, R は辺の延長上にもあり得ます。', 2: '$s,\\ t,\\ u$ は負にもなり得ます。', 3: 'この条件がなくても、3点は一直線上に並びません。' },
        good: '$\\vec a,\\ \\vec b,\\ \\vec c$ が同じ平面上にない（1次独立）ので、3点 P, Q, R は一直線上に並びません。' } },
      { say: '平面 PQR 上の点 X は、$\\overrightarrow{\\mathrm{OX}}=\\alpha\\overrightarrow{\\mathrm{OP}}+\\beta\\overrightarrow{\\mathrm{OQ}}+\\gamma\\overrightarrow{\\mathrm{OR}}$（$\\alpha+\\beta+\\gamma=1$）と表せます。一方 $\\overrightarrow{\\mathrm{OX}}=x\\vec a+y\\vec b+z\\vec c$ とすると…',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OX}}=\\frac{\\alpha}{s}\\vec a+\\frac{\\beta}{t}\\vec b+\\frac{\\gamma}{u}\\vec c=x\\vec a+y\\vec b+z\\vec c' },
          { t: 'p', size: 'sm', text: '1次独立だから係数を比べて　$\\alpha=sx,\\ \\ \\beta=ty,\\ \\ \\gamma=uz$' }] },
      { ask: { type: 'choice', q: 'したがって、点 X（$\\overrightarrow{\\mathrm{OX}}=x\\vec a+y\\vec b+z\\vec c$）が平面 PQR 上にある条件は？',
        opts: ['$\\dfrac xs+\\dfrac yt+\\dfrac zu=1$', '$x+y+z=1$', '$sx+ty+uz=0$', '$sx+ty+uz=1$'], ok: 3,
        why: { 0: '$x=\\frac{\\alpha}{s}$ なので $\\alpha=sx$。わり算ではなくかけ算です。', 1: 'それは平面 ABC の条件（$s=t=u=1$ の場合）です。', 2: '$\\alpha+\\beta+\\gamma=1$ なので、右辺は 1 です。' },
        good: '$\\alpha=sx,\\ \\beta=ty,\\ \\gamma=uz$ を $\\alpha+\\beta+\\gamma=1$ に入れます。逆にこの式が成り立てば、X は平面上にあります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '平面 PQR', text: '点 X が平面 PQR 上 $\\iff$ $sx+ty+uz=1$' }] } },

      // ---------- (1) 定点 ----------
      { clear: true, part: '(1)', say: '条件 $s+t+2u=5$ の両辺を 5 でわると、「$s\\cdot\\square+t\\cdot\\square+u\\cdot\\square=1$」の形になります。平面の条件と見くらべましょう。',
        add: [{ t: 'h', text: '(1)　定点を見つける' },
          { t: 'm', tex: 'sx+ty+uz=1', note: '平面 PQR の条件' },
          { t: 'm', tex: 's\\cdot\\hy{\\frac15}+t\\cdot\\hy{\\frac15}+u\\cdot\\hy{\\frac25}=\\frac{s+t+2u}{5}=1' },
          fig('f2', tet(false).concat(tri1), 430)] },
      { ask: { type: 'choice', q: '平面 PQR がいつも通る点 K の $\\overrightarrow{\\mathrm{OK}}$ は？',
        opts: ['$\\vec a+\\vec b+2\\vec c$', '$\\frac15(\\vec a+\\vec b+\\vec c)$', '$\\frac15\\vec a+\\frac15\\vec b+\\frac25\\vec c$', '$5\\vec a+5\\vec b+\\frac52\\vec c$'], ok: 2,
        why: { 0: '$s\\cdot1+t\\cdot1+u\\cdot2=5$ で、右辺が 1 になりません。', 1: '$\\vec c$ の係数は $\\frac25$。$u$ の係数 2 を落としています。', 3: 'わり算とかけ算が逆です。' },
        good: '$(x,\\ y,\\ z)=\\left(\\frac15,\\ \\frac15,\\ \\frac25\\right)$ は、どんな $(s,\\ t,\\ u)$ でも $sx+ty+uz=1$ を満たします。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OK}}=\\frac15\\vec a+\\frac15\\vec b+\\frac25\\vec c' }],
        draw: [{ fig: 'f2', items: [Kpt] }] } },
      { say: '別の $(s,\\ t,\\ u)=(1,\\ 2,\\ 1)$ の平面（緑）も、たしかに K を通ります。これで「定点を通る」ことは示せました。次は「定点は K **だけ**」を示します。',
        draw: [{ fig: 'f2', items: tri2.concat([Kpt]) }] },
      { ask: { type: 'choice', q: '「そのような定点はただ1つ」を示すには、何を示せばよい？',
        opts: ['K が四面体の内部にあること', 'すべての平面 PQR が通る点 X は、K と一致すること', '平面 PQR が K を通ること', '$s,\\ t,\\ u$ が1通りに決まること'], ok: 1,
        why: { 0: '内部にあるかどうかは、ただ1つであることとは関係ありません。', 2: 'それは「通る」の部分で、もう示しました。「ほかにない」ことを別に示します。', 3: '$s,\\ t,\\ u$ は動くので、1通りには決まりません。' },
        good: '「どんな $(s,\\ t,\\ u)$ の平面にものっている点 X」を考え、X＝K を導きます。' } },

      // ---------- (1) ただ1つ ----------
      { clear: true, cols: [1], say: '点 X$(\\overrightarrow{\\mathrm{OX}}=x\\vec a+y\\vec b+z\\vec c)$ がすべての平面 PQR 上にあるとします。条件を満たすどの $(s,\\ t,\\ u)$ でも $sx+ty+uz=1$ なので、具体的な組を代入します。',
        add: [{ t: 'h', text: '(1)　定点はただ1つ' },
          { t: 'p', size: 'sm', text: 'X がすべての平面 PQR 上にあるとすると、\n$s+t+2u=5$ を満たす 0 でない $s,\\ t,\\ u$ すべてについて　$sx+ty+uz=1$' }] },
      { ask: { type: 'choice', q: '代入する $(s,\\ t,\\ u)$ として **使えない** のは？',
        opts: ['$(1,\\,2,\\,1)$', '$(2,\\,1,\\,1)$', '$\\left(1,\\,1,\\,\\frac32\\right)$', '$(5,\\,0,\\,0)$'], ok: 3,
        why: { 0: 'これは $s+t+2u=5$ を満たし、どれも 0 でないので使えます。', 1: 'これは $s+t+2u=5$ を満たし、どれも 0 でないので使えます。', 2: 'これは $s+t+2u=5$ を満たし、どれも 0 でないので使えます。' },
        good: '$t=0$ では $\\overrightarrow{\\mathrm{OB}}=0\\cdot\\overrightarrow{\\mathrm{OQ}}$ となり、Q が決まりません。$s,\\ t,\\ u$ は 0 でない数だけです。',
        add: [{ t: 'm', tex: '\\begin{cases} x+2y+z=1\\\\ 2x+y+z=1\\\\ x+y+\\frac32z=1\\end{cases}', note: '$(1,2,1),\\ (2,1,1),\\ (1,1,\\frac32)$\nを代入' }] } },
      { ask: { type: 'think', q: 'この連立方程式を解こう。',
        hint: '1式目 − 2式目 で $x=y$。それを残りの2式に入れる。',
        ans: '$x=y$ より $3x+z=1,\\ 2x+\\frac32z=1$。これを解いて　$x=y=\\frac15,\\ z=\\frac25$',
        after: 'X は K と一致します。つまり、すべての平面が通る点は K しかありません。',
        add: [{ t: 'm', tex: 'x=y=\\frac15,\\quad z=\\frac25\\quad\\therefore\\ \\mathrm{X}=\\mathrm{K}' }] } },
      { say: '(1) の答案の結論です。「通る」と「ただ1つ」の両方を示しました。',
        add: [{ t: 'ans', label: '(1)', text: '平面 PQR は　$\\overrightarrow{\\mathrm{OK}}=\\frac15\\vec a+\\frac15\\vec b+\\frac25\\vec c$\nで定まる点 K をつねに通り、そのような点は K ただ1つ' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。まず正四面体 OABC（1辺 6）の体積 $V$。底面 ABC は1辺 6 の正三角形、高さは $6\\sqrt{\\frac23}=2\\sqrt6$ です。',
        add: [{ t: 'h', text: '(2)　四面体 KABC の体積' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABC}=\\frac{\\sqrt3}{4}\\cdot6^2=9\\sqrt3,\\qquad \\text{高さ}=2\\sqrt6' },
          fig('f3', tet(false).concat([{ k: 'seg', a: O, b: H, c: 'p', wd: 2.5, dash: true }, Kpt, { k: 'pt', at: H, name: 'H', dir: 's', c: 'y', off: 20 }]), 420)] },
      { ask: { type: 'choice', q: '正四面体 OABC の体積 $V$ は？',
        opts: ['$36\\sqrt2$', '$18\\sqrt2$', '$9\\sqrt3$', '$54\\sqrt2$'], ok: 1,
        why: { 0: '底面積を、$\\frac12$ をかけずに $18\\sqrt3$ としています。', 2: 'それは底面 ABC の面積です。', 3: '錐体なので $\\frac13$ をかけます。' },
        good: '$V=\\frac13\\cdot9\\sqrt3\\cdot2\\sqrt6=6\\sqrt{18}=18\\sqrt2$。',
        add: [{ t: 'm', tex: 'V=\\frac13\\cdot9\\sqrt3\\cdot2\\sqrt6=18\\sqrt2' }] } },
      { say: '直線 OK と平面 ABC の交点を H とします。$\\overrightarrow{\\mathrm{OH}}=k\\overrightarrow{\\mathrm{OK}}$ とおき、H が平面 ABC 上にある条件「係数の和 $=1$」から $k$ を求めます。',
        add: [{ t: 'm', size: 'sm', tex: 'k\\left(\\frac15+\\frac15+\\frac25\\right)=1\\quad\\therefore\\ k=\\frac54' }] },
      { say: '$\\overrightarrow{\\mathrm{OH}}=\\frac54\\overrightarrow{\\mathrm{OK}}$ なので OK : OH $=4:5$、つまり KH : OH $=1:5$。底面 ABC が共通なので、体積の比は高さの比 KH : OH と同じです。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{KH}:\\mathrm{OH}=1:5\\quad\\Rightarrow\\quad(\\text{KABC}):(\\text{OABC})=1:5' }] },
      { say: '(2) の答えです。四面体 KABC の体積は $V$ の $\\frac15$ で、$\\frac{18\\sqrt2}{5}$。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\frac15V=\\frac{18\\sqrt2}{5}' }] },
      { ask: { type: 'think', q: '同じ考え方で、四面体 KOAB の体積を求めよう。',
        hint: '底面を △OAB にすると、高さの比は「$\\vec c$ の係数」で決まる。',
        ans: '$\\overrightarrow{\\mathrm{OK}}$ の $\\vec c$ の係数が $\\frac25$ なので、高さは OABC の $\\frac25$ 倍。体積は $\\frac25V=\\frac{36\\sqrt2}{5}$',
        after: '係数 $\\frac15,\\ \\frac15,\\ \\frac25$ と、残り $1-\\frac45=\\frac15$ が、それぞれ4つの面を底面とする四面体の体積の割合になっています。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「定点を通る」と「ただ1つ」は別々に示す。京大の空間ベクトルでは、この論理の区別が採点のポイントになります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
