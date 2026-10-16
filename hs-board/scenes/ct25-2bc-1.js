/* 共通テスト型 数学Ⅱ，B，C：2025年度 第1問（三角関数）の類題（自作問題。元の問題文・数値は使っていない）
   ねらい：「三角関数の値が等しくなる角」を単位円で確かめる誘導 → それを道具に三角方程式を解く（会話・後半は丸投げ）
   答え（python3・sympy で検算ずみ）：
   (1) ア ①（x 軸）　イ ⓪（−α）　ウ/エ = 9/5（cosβ = cos(π/5)、β≠π/5）
   (2) cos2θ = cos(θ+π/3)（0≦θ<2π）：θ = π/3, 5π/9, 11π/9, 17π/9 → オ 3、カ 4、キク 17
   (3) sin3θ = cosθ（0≦θ<π）：θ = π/8, π/4, 5π/8 → ケ 3、コ/サ = 5/8 */
(function () {
  const D = Math.PI / 180;
  const at = deg => [Math.cos(deg * D), Math.sin(deg * D)];
  const P = at(36), Q = at(-36);
  const VIEW = [-1.45, -1.35, 1.45, 1.35];
  const base = () => [
    { k: 'axes', tx: [], ty: [], o: false },
    { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 },
    { k: 'label', at: [0, 0], text: 'O', dx: -16, dy: 18, size: 22, c: 'd' },
    { k: 'label', at: [1, 0], text: '1', dx: 12, dy: 18, size: 21, c: 'd' }
  ];
  const ucirc = (id, items, w) => ({ t: 'fig', id, col: 1, view: VIEW, w: w || 440, h: Math.round((w || 440) * 2.7 / 2.9), items: base().concat(items || []) });
  const ptP = [{ k: 'seg', a: [0, 0], b: P, c: 'y' }, { k: 'pt', at: P, name: 'P', dir: 'ne', c: 'y' }, { k: 'angle', o: [0, 0], a: [1, 0], b: P, rp: 46, label: 'α', c: 'y' }];
  const SOL2 = [100, 220, 340].map(d => at(d));
  const POINTS = [
    '$\\cos\\beta=\\cos\\alpha\\iff\\beta=\\pm\\alpha+2n\\pi$（単位円で **$x$ 軸に関して対称**）。$\\sin$ なら $\\beta=\\alpha,\\ \\pi-\\alpha$（$y$ 軸に関して対称）',
    '$\\cos A=\\cos B$ の形にしてから2つに場合分け。$3\\theta=\\cdots+2n\\pi$ を割るときは **$2n\\pi$ も割る**。範囲に入る $n$ を全部書き出す',
    '誘導のない小問は、$\\sin3\\theta=\\cos\\left(\\dfrac{\\pi}{2}-3\\theta\\right)$ のように **関数をそろえて** 前の小問の道具に持ちこむ'
  ];

  HB.lesson({
    id: 'ct25-2bc-1', field: '共通テスト型　数学Ⅱ，B，C', title: '2025 共通テスト 数学Ⅱ，B，C 第1問の類題 ― cos の値が等しい角と三角方程式',
    level: '2025年度 第1問の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '太郎さんと花子さんは、$\\cos$ の値が等しくなる角について話している。\n太郎：$\\cos\\dfrac{\\pi}{5}$ と同じ値になる角は、ほかにもあるのかな。\n花子：単位円で考えてみよう。角 $\\alpha$ の動径と単位円の交点を P とすると、$\\cos\\alpha$ は P の $x$ 座標だよね。\n以下、$n$ は整数とする。',
      parts: [
        '(1)　$\\cos\\beta=\\cos\\alpha$ となる角 $\\beta$ の動径と単位円の交点を Q とすると、Q は P と一致するか、P と $\\boxed{\\text{ア}}$ に関して対称な点である。よって\n　　$\\cos\\beta=\\cos\\alpha\\iff\\beta=\\alpha+2n\\pi$　または　$\\beta=\\boxed{\\text{イ}}+2n\\pi$\nである。とくに、$0\\leqq\\beta<2\\pi$ で $\\cos\\beta=\\cos\\dfrac{\\pi}{5}$ となる $\\beta$ は、$\\dfrac{\\pi}{5}$ と $\\dfrac{\\boxed{\\text{ウ}}}{\\boxed{\\text{エ}}}\\pi$ である。\n　ア の解答群　⓪ 原点　① $x$ 軸　② $y$ 軸　③ 直線 $y=x$\n　イ の解答群　⓪ $-\\alpha$　① $\\pi-\\alpha$　② $\\pi+\\alpha$　③ $\\dfrac{\\pi}{2}-\\alpha$',
        '(2)　$0\\leqq\\theta<2\\pi$ のとき、方程式　$\\cos2\\theta=\\cos\\left(\\theta+\\dfrac{\\pi}{3}\\right)$ ……(*)　を考える。(1) を用いると、(*) の解のうち $2\\theta=\\theta+\\dfrac{\\pi}{3}+2n\\pi$ をみたすものは $\\theta=\\dfrac{\\pi}{\\boxed{\\text{オ}}}$ である。(*) の解は全部で $\\boxed{\\text{カ}}$ 個あり、そのうち最大のものは $\\theta=\\dfrac{\\boxed{\\text{キク}}}{9}\\pi$ である。',
        '(3)　$0\\leqq\\theta<\\pi$ のとき、方程式　$\\sin3\\theta=\\cos\\theta$　の解は $\\boxed{\\text{ケ}}$ 個あり、そのうち最大のものは $\\theta=\\dfrac{\\boxed{\\text{コ}}}{\\boxed{\\text{サ}}}\\pi$ である。'
      ],
      src: '※ 2025年度 共通テスト 数学Ⅱ，B，C 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '共通テスト 数学Ⅱ，B，C 第1問（三角関数）の類題です。会話文の誘導を使って三角方程式を解きます。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'h', text: 'この大問の流れ' },
          { t: 'p', size: 'sm', text: '(1)　$\\cos$ の値が等しい角を **単位円** で調べる\n(2)　(1) を使って　$\\cos2\\theta=\\cos\\left(\\theta+\\dfrac{\\pi}{3}\\right)$\n(3)　誘導なしで　$\\sin3\\theta=\\cos\\theta$' },
          { t: 'box', c: 'g', size: 'sm', label: '共通テストのコツ', text: '会話文の「単位円で考えてみよう」は、**(1) を図で考えよ** という合図。(1) で出した結論が、(2)(3) の道具になります。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。単位円で、角 $\\alpha$ の動径との交点を P とします。$\\cos\\alpha$ は P の **$x$ 座標** です。',
        add: [{ t: 'h', text: '(1)　cos の値が等しい角' },
          { t: 'p', size: 'sm', text: '$\\cos\\alpha$ ＝ 点 P の $x$ 座標\n$\\cos\\beta=\\cos\\alpha$ ⇔ 交点 Q の $x$ 座標が P と同じ' },
          ucirc('u1', ptP.concat([{ k: 'line', x: P[0], dash: true, c: 'd' }]))] },
      { ask: { type: 'choice', q: 'P と $x$ 座標が同じ単位円上の点 Q（P 以外）は、P と何に関して対称？（ア）',
        opts: ['⓪ 原点', '① $x$ 軸', '② $y$ 軸', '③ 直線 $y=x$'], ok: 1,
        why: { 0: '原点に関して対称な点は $(-\\cos\\alpha,\\,-\\sin\\alpha)$。$x$ 座標の符号が変わります。', 2: '$y$ 軸に関して対称な点で等しくなるのは $y$ 座標、つまり $\\sin$ です。', 3: '直線 $y=x$ で折り返すと、$x$ 座標と $y$ 座標が入れかわります。' },
        good: '縦の点線と単位円のもう1つの交点が Q。Q は P と **$x$ 軸に関して対称** で、Q の角は $-\\alpha$ です。',
        draw: [{ fig: 'u1', items: [{ k: 'seg', a: [0, 0], b: Q, c: 'p' }, { k: 'pt', at: Q, name: 'Q', dir: 'se', c: 'p' }, { k: 'angle', o: [0, 0], a: [1, 0], b: Q, rp: 58, label: '−α', lr: 26, c: 'p' }]}] } },
      { say: 'Q の角は $-\\alpha$。動径が同じなら $2\\pi$ の整数倍だけちがってもよいので、$\\cos\\beta=\\cos\\alpha$ は次のようにまとめられます。イは ⓪ です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'cos の値が等しい角', text: '$\\cos\\beta=\\cos\\alpha\\iff\\beta=\\alpha+2n\\pi$　または　$\\beta=\\hy{-\\alpha}+2n\\pi$' },
          { t: 'p', size: 'xs', c: 'd', text: '（$\\sin$ なら $y$ 軸に関して対称なので　$\\beta=\\alpha+2n\\pi$ または $\\beta=\\pi-\\alpha+2n\\pi$）' }] },
      { ask: { type: 'choice', q: '$0\\leqq\\beta<2\\pi$、$\\beta\\neq\\dfrac{\\pi}{5}$ で、$\\cos\\beta=\\cos\\dfrac{\\pi}{5}$ となる $\\beta$ は？（ウ・エ）',
        opts: ['$\\dfrac45\\pi$', '$\\dfrac65\\pi$', '$\\dfrac95\\pi$', '$-\\dfrac15\\pi$'], ok: 2,
        why: { 0: '$\\pi-\\alpha$ は $\\sin$ が等しい角（$y$ 軸に関して対称）。$\\cos\\dfrac45\\pi$ は負です。', 1: '$\\pi+\\alpha$ は原点に関して対称。$\\cos$ も $\\sin$ も符号が変わります。', 3: '$-\\dfrac{\\pi}{5}$ は $0\\leqq\\beta<2\\pi$ に入りません。$2\\pi$ を足します。' },
        good: '$-\\dfrac{\\pi}{5}+2\\pi=\\dfrac95\\pi$。図の Q の角です。',
        add: [{ t: 'ans', label: '(1) 答', text: 'ア ①　イ ⓪　$\\dfrac{\\text{ウ}}{\\text{エ}}=\\dfrac95$' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。両辺がどちらも $\\cos$ なので、(1) がそのまま使えます。角どうしが「等しい」か「符号が逆」かの2つに分けます。',
        add: [{ t: 'h', text: '(2)　cos2θ = cos(θ + π/3)' },
          { t: 'box', c: 'b', size: 'sm', label: '(1) より', text: '$2\\theta=\\left(\\theta+\\dfrac{\\pi}{3}\\right)+2n\\pi$　……ⓐ\n$2\\theta=-\\left(\\theta+\\dfrac{\\pi}{3}\\right)+2n\\pi$　……ⓑ' },
          ucirc('u2', [], 380)] },
      { say: 'ⓐ は $\\theta=\\dfrac{\\pi}{3}+2n\\pi$。$0\\leqq\\theta<2\\pi$ に入るのは $\\theta=\\dfrac{\\pi}{3}$ だけです。オは 3。',
        add: [{ t: 'm', size: 'sm', tex: '\\theta=\\frac{\\pi}{3}+2n\\pi\\ \\ \\to\\ \\ \\theta=\\frac{\\pi}{3}', note: 'ⓐ より' }],
        draw: [{ fig: 'u2', items: [{ k: 'pt', at: at(60), name: 'π/3', dir: 'ne', c: 'y', size: 22 }] }] },
      { ask: { type: 'choice', q: 'ⓑ を $\\theta$ について解くと？',
        opts: ['$\\theta=-\\dfrac{\\pi}{9}+2n\\pi$', '$\\theta=-\\dfrac{\\pi}{3}+\\dfrac{2n}{3}\\pi$', '$\\theta=\\dfrac{\\pi}{9}+\\dfrac{2n}{3}\\pi$', '$\\theta=-\\dfrac{\\pi}{9}+\\dfrac{2n}{3}\\pi$'], ok: 3,
        why: { 0: '$3\\theta=-\\dfrac{\\pi}{3}+2n\\pi$ を 3 で割るとき、$2n\\pi$ も 3 で割ります。', 1: '$-\\dfrac{\\pi}{3}$ のほうも 3 で割ります。', 2: '符号が逆です。$3\\theta=-\\dfrac{\\pi}{3}+2n\\pi$ です。' },
        good: '$3\\theta=-\\dfrac{\\pi}{3}+2n\\pi$ より $\\theta=-\\dfrac{\\pi}{9}+\\dfrac{2n}{3}\\pi$。$\\dfrac23\\pi$ ずつずれた解が出ます。',
        add: [{ t: 'm', size: 'sm', tex: '3\\theta=-\\frac{\\pi}{3}+2n\\pi\\ \\ \\to\\ \\ \\theta=-\\frac{\\pi}{9}+\\frac{2n}{3}\\pi', note: 'ⓑ より' }] } },
      { say: '$n=1,\\,2,\\,3$ で $\\dfrac59\\pi,\\ \\dfrac{11}{9}\\pi,\\ \\dfrac{17}{9}\\pi$。$n=0$ は負、$n=4$ は $2\\pi$ をこえます。単位円の上では、正三角形の頂点のように並びます。',
        add: [{ t: 'tbl', col: 1, size: 'xs', rows: [['$n$', '0', '1', '2', '3', '4'], ['$\\theta$', '$-\\frac{\\pi}{9}$', '$\\frac59\\pi$', '$\\frac{11}{9}\\pi$', '$\\frac{17}{9}\\pi$', '$\\frac{23}{9}\\pi$'], ['範囲', '×', '○', '○', '○', '×']] }],
        draw: [{ fig: 'u2', items: [{ k: 'poly', pts: SOL2, close: true, c: 'p', dash: true },
          { k: 'pt', at: SOL2[0], name: '5π/9', dir: 'nw', c: 'p', size: 22 }, { k: 'pt', at: SOL2[1], name: '11π/9', dir: 'sw', c: 'p', size: 22 }, { k: 'pt', at: SOL2[2], name: '17π/9', dir: 'se', c: 'p', size: 22 }] }] },
      { ask: { type: 'choice', q: '(*) の解は全部で何個？（カ）',
        opts: ['2 個', '3 個', '4 個', '6 個'], ok: 2,
        why: { 0: 'ⓑ で $2n\\pi$ を 3 で割り忘れると、解が1つしか出ません。', 1: 'ⓐ から出る $\\theta=\\dfrac{\\pi}{3}$ を忘れています。', 3: 'ⓑ で範囲に入るのは $n=1,\\,2,\\,3$ の 3 つだけです。' },
        good: '$\\dfrac{\\pi}{3}$ と $\\dfrac59\\pi,\\ \\dfrac{11}{9}\\pi,\\ \\dfrac{17}{9}\\pi$ の 4 個（重なりはない）。最大は $\\dfrac{17}{9}\\pi$ です。',
        add: [{ t: 'ans', label: '(2) 答', text: 'オ 3　カ 4　キク 17' }] } },
      { ask: { type: 'think', q: '$\\theta=\\dfrac59\\pi$ が本当に (*) をみたすか、単位円で確かめよう。',
        hint: '$2\\theta$ と $\\theta+\\dfrac{\\pi}{3}$ をそれぞれ計算して、2つの動径の位置を比べる。',
        ans: '$2\\theta=\\dfrac{10}{9}\\pi$、$\\theta+\\dfrac{\\pi}{3}=\\dfrac89\\pi$。和が $2\\pi$ なので、2つの動径は $x$ 軸に関して対称 → $\\cos$ が等しい',
        after: '出した解を1つ代入して確かめるだけで、「$2n\\pi$ の割り忘れ」のようなミスに気づけます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) は誘導がありません（丸投げ）。左辺は $\\sin$、右辺は $\\cos$。**関数をそろえれば** (1) の道具が使えます。',
        add: [{ t: 'h', text: '(3)　sin3θ = cosθ　（0 ≦ θ < π）' },
          { t: 'box', c: 'g', size: 'sm', label: '方針', text: '$\\sin$ を $\\cos$ に直して「$\\cos A=\\cos B$」の形にする' },
          { t: 'fig', id: 'g3', col: 1, view: [-0.3, -1.45, 3.55, 1.5], w: 640, h: 420, items: [
            { k: 'axes', tx: [[Math.PI / 8, 'π/8'], [Math.PI / 4, 'π/4'], [5 * Math.PI / 8, '5π/8'], [Math.PI, 'π']], ty: [[1, '1'], [-1, '−1']], xl: 'θ' },
            { k: 'fn', f: 'sin(3*x)', a: 0, b: Math.PI, c: 'b', label: 'y=sin3θ', lat: [0.12, 1.28] },
            { k: 'fn', f: 'cos(x)', a: 0, b: Math.PI, c: 'y', label: 'y=cosθ', lat: [2.55, -1.1] }] }] },
      { ask: { type: 'choice', q: '$\\sin3\\theta$ を $\\cos$ で表すと？',
        opts: ['$\\cos\\left(\\dfrac{\\pi}{2}-3\\theta\\right)$', '$\\cos3\\theta$', '$\\cos\\left(3\\theta+\\dfrac{\\pi}{2}\\right)$', '$\\cos(\\pi-3\\theta)$'], ok: 0,
        why: { 1: '関数の名前を変えるだけでは等しくなりません（$\\theta=0$ で $0$ と $1$）。', 2: '$\\cos\\left(3\\theta+\\dfrac{\\pi}{2}\\right)=-\\sin3\\theta$。符号が逆です。', 3: '$\\cos(\\pi-3\\theta)=-\\cos3\\theta$ です。' },
        good: '$\\sin x=\\cos\\left(\\dfrac{\\pi}{2}-x\\right)$。これで「cos の値が等しい」形になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\left(\\frac{\\pi}{2}-3\\theta\\right)=\\cos\\theta' }] } },
      { say: '(1) より、$\\dfrac{\\pi}{2}-3\\theta=\\theta+2n\\pi$（ⓒ）または $\\dfrac{\\pi}{2}-3\\theta=-\\theta+2n\\pi$（ⓓ）。ⓒ は $4\\theta=\\dfrac{\\pi}{2}-2n\\pi$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\theta=\\frac{\\pi}{8}-\\frac{n}{2}\\pi\\ \\ \\to\\ \\ \\frac{\\pi}{8},\\ \\frac58\\pi', note: 'ⓒ より（$n=0,\\,-1$）' }] },
      { say: 'ⓓ は $2\\theta=\\dfrac{\\pi}{2}-2n\\pi$、つまり $\\theta=\\dfrac{\\pi}{4}-n\\pi$。$0\\leqq\\theta<\\pi$ に入るのは $\\dfrac{\\pi}{4}$ だけです。',
        add: [{ t: 'm', size: 'sm', tex: '\\theta=\\frac{\\pi}{4}-n\\pi\\ \\ \\to\\ \\ \\frac{\\pi}{4}', note: 'ⓓ より（$n=0$）' }] },
      { ask: { type: 'choice', q: '解の個数（ケ）と、最大の解（コ・サ）の組は？',
        opts: ['2 個、$\\dfrac58\\pi$', '3 個、$\\dfrac58\\pi$', '3 個、$\\dfrac98\\pi$', '4 個、$\\dfrac98\\pi$'], ok: 1,
        why: { 0: 'ⓓ から出る $\\theta=\\dfrac{\\pi}{4}$ を落としています。', 2: '$\\dfrac98\\pi$ は $\\pi$ より大きいので、範囲の外です。', 3: '$\\dfrac98\\pi$ は $0\\leqq\\theta<\\pi$ に入りません。' },
        good: '$\\dfrac{\\pi}{8},\\ \\dfrac{\\pi}{4},\\ \\dfrac58\\pi$ の 3 個。グラフの交点も 3 つです。',
        add: [{ t: 'ans', label: '(3) 答', text: 'ケ 3　$\\dfrac{\\text{コ}}{\\text{サ}}=\\dfrac58$' }],
        draw: [{ fig: 'g3', items: [Math.PI / 8, Math.PI / 4, 5 * Math.PI / 8].map(x => ({ k: 'pt', at: [x, Math.cos(x)], c: 'p' })) }] } },
      { ask: { type: 'think', q: '別解：右辺を $\\cos\\theta=\\sin\\left(\\dfrac{\\pi}{2}-\\theta\\right)$ と直し、「$\\sin$ の値が等しい」条件で解き直そう。',
        hint: '$\\sin\\beta=\\sin\\alpha\\iff\\beta=\\alpha+2n\\pi$ または $\\beta=\\pi-\\alpha+2n\\pi$（$y$ 軸に関して対称）',
        ans: '$3\\theta=\\dfrac{\\pi}{2}-\\theta+2n\\pi$ → $\\theta=\\dfrac{\\pi}{8}+\\dfrac{n}{2}\\pi$、\n$3\\theta=\\dfrac{\\pi}{2}+\\theta+2n\\pi$ → $\\theta=\\dfrac{\\pi}{4}+n\\pi$。同じ3個の解が出る',
        after: 'どちらにそろえても解ける。迷ったら、(1) で調べた形（ここでは $\\cos$）にそろえるのが速いです。' } },

      // ---------- 共通テストのコツ ----------
      { clear: true, cols: [1], part: 'コツ', say: '共通テストの三角関数では、誘導が長くても、使うのは「単位円での対称性」の1つだけ、ということがよくあります。',
        add: [{ t: 'h', text: '共通テストで、この大問を解くときのコツ' },
          { t: 'box', c: 'b', size: 'sm', label: '誘導の読み方', text: '会話文は「何を使うか」の予告。(1) の結論（$\\beta=\\pm\\alpha+2n\\pi$）を **1行メモ** してから (2) へ進む' },
          { t: 'box', c: 'p', size: 'sm', label: '時間をかける所', text: '$2n\\pi$ を割ったあとの **$n$ の書き出し**。表にして、範囲に入る $n$ を全部チェックする（解の個数がマークの答えになる）' },
          { t: 'box', c: 'g', size: 'sm', label: '丸投げの小問', text: '$\\sin$ と $\\cos$ がまざっていたら、まず関数をそろえる。グラフをざっとかいて、交点の個数で答えを確かめる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角方程式は「値が等しい角」の対称性に持ちこめば、場合分け2つで解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、時間を計ってもう一度ノートで解いてみましょう。' }
    ]
  });
})();
