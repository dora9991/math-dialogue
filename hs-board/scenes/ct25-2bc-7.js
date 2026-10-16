/* 共通テスト型 数学Ⅱ，B，C：2025年度 第7問（数学C 複素数平面）の類題（自作問題。元の問題文・数値・点の定め方は使っていない）
   ねらい：2直線が垂直になる条件（比が純虚数）から、点が描く図形（軌跡）を調べる（会話・誘導が長い形）
   設定（自作）：O(0)、A(1)、P(z)、Q(z²)（z≠0, ±1）。OP⊥AQ となる P の集合。
   答え（python3・sympy で検算ずみ）：
   (1) 垂直 ⇔ (δ−γ)/(β−α) が純虚数 → ア ①。w が純虚数 ⇔ w+w̄=0 かつ w≠0 → イ ③
   (2) w=(z²−1)/z=z−1/z → ウ ①。w+w̄=(z+z̄)(1−1/|z|²) → エ 1。z=x+yi なら Re w = x(x²+y²−1)/(x²+y²)。
       P は 虚軸（0 を除く）と単位円（±1 を除く）→ オ ②（w≠0 ⇔ z≠±1）
   (3) |z|=1 のとき m=(1+z²)/2、m−1/2=z²/2 → |m−1/2|=1/2 → カ/キ=1/2、ク/ケ=1/2。z²≠1 なので m≠1 → コ ①
   考えてみよう：P が虚軸上（z=ti, t≠0）なら m=(1−t²)/2 → 実軸の 1/2 より小さい部分 */
(function () {
  const IM = n => [n, (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'i'];
  const plane = (o) => Object.assign({ k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [IM(1), IM(-1)], xl: '実軸', yl: '虚軸' }, o || {});
  const D = Math.PI / 180, cs = d => [Math.cos(d * D), Math.sin(d * D)];
  const P1 = cs(53.13), Q1 = cs(106.26), M1 = [(1 + Q1[0]) / 2, Q1[1] / 2];   // z=0.6+0.8i、z²=−0.28+0.96i
  const P3 = cs(50), Q3 = cs(100), M3 = [(1 + Q3[0]) / 2, Q3[1] / 2];
  const cfig = (id, items, w) => ({ t: 'fig', id, col: 1, view: [-1.6, -1.45, 1.9, 1.6], w: w || 560, h: Math.round((w || 560) * 3.05 / 3.5), items: [plane(), { k: 'circle', o: [0, 0], r: 1, c: 'd', wd: 2, dash: true }].concat(items) });
  const POINTS = [
    '点 $\\alpha,\\beta$ を通る直線と点 $\\gamma,\\delta$ を通る直線が垂直 ⇔ $\\dfrac{\\delta-\\gamma}{\\beta-\\alpha}$ が **純虚数**。純虚数 ⇔ $w+\\overline{w}=0$ かつ $w\\neq0$',
    '条件式は、$x+yi$ でも解けるが、**共役複素数のまま** 計算すると $(z+\\overline{z})(|z|^2-1)=0$ のように因数分解でき、「虚軸」「単位円」が見える',
    '軌跡は **除く点** まで答える（$z\\neq0,\\ \\pm1$ など）。図形の意味（中点・二等辺三角形・直径の円）で確かめると速い'
  ];

  HB.lesson({
    id: 'ct25-2bc-7', field: '共通テスト型　数学Ⅱ，B，C', title: '2025 共通テスト 数学Ⅱ，B，C 第7問の類題 ― 垂直の条件と複素数平面の軌跡',
    level: '2025年度 第7問の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '複素数平面上で O$(0)$、A$(1)$ とする。$0,\\ 1,\\ -1$ のいずれでもない複素数 $z$ に対して P$(z)$、Q$(z^2)$ とし、2直線 OP と AQ が垂直になるような点 P について、太郎さんと花子さんが調べている。',
      parts: [
        '(1)　$\\alpha\\neq\\beta$、$\\gamma\\neq\\delta$ とする。点 $\\alpha,\\ \\beta$ を通る直線と、点 $\\gamma,\\ \\delta$ を通る直線が垂直であることは、$\\dfrac{\\delta-\\gamma}{\\beta-\\alpha}$ が $\\boxed{\\text{ア}}$ であることと同値である。また、複素数 $w$ が $\\boxed{\\text{ア}}$ であることは、$\\boxed{\\text{イ}}$ と同値である。\n　ア の解答群　⓪ 実数　① 純虚数　② 絶対値が 1 の複素数　③ 偏角が $\\dfrac{\\pi}{4}$ の複素数\n　イ の解答群　⓪ $w=\\overline{w}$　① $|w|=1$　② $w\\overline{w}=0$　③ $w+\\overline{w}=0$ かつ $w\\neq0$',
        '(2)　直線 OP と直線 AQ が垂直であることは、$w=\\dfrac{z^2-1}{z}=\\boxed{\\text{ウ}}$ が (1) の条件をみたすことと同値である。\n太郎：$z=x+yi$ とおいて計算してみよう。\n花子：共役複素数のまま計算すると、うまく因数分解できそうだよ。\n$w+\\overline{w}=(z+\\overline{z})\\left(1-\\dfrac{\\boxed{\\text{エ}}}{|z|^2}\\right)$ となるから、点 P 全体の集合は $\\boxed{\\text{オ}}$ である。\n　ウ の解答群　⓪ $z-1$　① $z-\\dfrac1z$　② $z+\\dfrac1z$　③ $\\dfrac{z-1}{z}$\n　オ の解答群\n　⓪ 単位円 $|z|=1$ から 2点 $\\pm1$ を除いたもの\n　① 虚軸から原点を除いたもの\n　② 単位円と虚軸を合わせた図形から、3点 $0,\\ \\pm1$ を除いたもの\n　③ 単位円と実軸を合わせた図形から、3点 $0,\\ \\pm1$ を除いたもの',
        '(3)　点 P が単位円 $|z|=1$ 上（$z\\neq\\pm1$）を動くとき、線分 AQ の中点を M$(m)$ とする。$m=\\dfrac{1+z^2}{2}$ であるから\n　　$\\left|m-\\dfrac{\\boxed{\\text{カ}}}{\\boxed{\\text{キ}}}\\right|=\\dfrac{\\boxed{\\text{ク}}}{\\boxed{\\text{ケ}}}$\nが成り立つ。よって、M の描く図形は、点 $\\dfrac{\\boxed{\\text{カ}}}{\\boxed{\\text{キ}}}$ を中心とする円から、点 $\\boxed{\\text{コ}}$ を除いたものである。\n　コ の解答群　⓪ $0$　① $1$　② $-1$　③ $\\dfrac12$'
      ],
      src: '※ 2025年度 共通テスト 数学Ⅱ，B，C 第7問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', say: '共通テスト 第7問（複素数平面）の類題です。問題文が長く、会話の誘導にのって「垂直の条件 → 軌跡」と進みます。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'h', text: 'この大問の流れ' },
          { t: 'p', size: 'sm', text: '(1)　垂直になる条件を複素数で表す\n(2)　OP ⊥ AQ となる点 P の集合（軌跡）\n(3)　P が単位円上のとき、AQ の中点 M の軌跡' },
          { t: 'box', c: 'g', size: 'sm', label: '共通テストのコツ', text: '長い会話文の中で、式が出てくる行だけに印をつける。(1) の「垂直 ⇔ 純虚数 ⇔ $w+\\overline{w}=0$」が、最後まで使う道具です。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。2直線の向きは $\\beta-\\alpha$ と $\\delta-\\gamma$。その比 $\\dfrac{\\delta-\\gamma}{\\beta-\\alpha}$ の偏角が、2つの向きのなす角です。垂直なら、偏角は $\\pm\\dfrac{\\pi}{2}$。',
        add: [{ t: 'h', text: '(1)　垂直の条件' },
          { t: 'm', tex: '\\arg\\frac{\\delta-\\gamma}{\\beta-\\alpha}=\\pm\\frac{\\pi}{2}' },
          { t: 'fig', id: 'f1', col: 1, view: [-1.7, -1.3, 1.9, 1.5], w: 520, h: 404, items: [
            { k: 'axes', tx: [], ty: [], xl: '実軸', yl: '虚軸' },
            { k: 'vec', a: [-1.3, 0.1], b: [0.5, 0.9], c: 'y' }, { k: 'pt', at: [-1.3, 0.1], name: 'α', dir: 'w', c: 'y' }, { k: 'pt', at: [0.5, 0.9], name: 'β', dir: 'n', c: 'y' },
            { k: 'vec', a: [1.3, -1.0], b: [0.82, 0.08], c: 'b' }, { k: 'pt', at: [1.3, -1.0], name: 'γ', dir: 'e', c: 'b' }, { k: 'pt', at: [0.82, 0.08], name: 'δ', dir: 'ne', c: 'b' }] }] },
      { ask: { type: 'choice', q: '2直線が垂直 ⇔ $\\dfrac{\\delta-\\gamma}{\\beta-\\alpha}$ が何であること？（ア）',
        opts: ['⓪ 実数', '① 純虚数', '② 絶対値が 1', '③ 偏角が $\\frac{\\pi}{4}$'], ok: 1,
        why: { 0: '実数（偏角 0 か $\\pi$）は「平行」の条件です。', 2: '絶対値は「長さの比」。向きのなす角とは関係ありません。', 3: '偏角 $\\frac{\\pi}{4}$ なら 45° に交わります。' },
        good: '偏角が $\\pm\\dfrac{\\pi}{2}$ の複素数は、実部が 0 の **純虚数** です。（実数なら平行）',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '垂直の条件', text: '点 $\\alpha,\\beta$ を通る直線 ⊥ 点 $\\gamma,\\delta$ を通る直線\n⇔ $\\dfrac{\\delta-\\gamma}{\\beta-\\alpha}$ が純虚数' }] } },
      { ask: { type: 'choice', q: '複素数 $w$ が純虚数であることと同値なのは？（イ）',
        opts: ['⓪ $w=\\overline{w}$', '① $|w|=1$', '② $w\\overline{w}=0$', '③ $w+\\overline{w}=0$ かつ $w\\neq0$'], ok: 3,
        why: { 0: '$w=\\overline{w}$ は「$w$ が実数」の条件です。', 1: '$|w|=1$ は単位円の上という条件。$\\frac{\\sqrt2}{2}+\\frac{\\sqrt2}{2}i$ も入ってしまいます。', 2: '$w\\overline{w}=|w|^2=0$ は $w=0$ のことです。' },
        good: '$w=a+bi$ なら $w+\\overline{w}=2a$。実部 0 で、しかも $w\\neq0$（0 は純虚数にふくめない）。',
        add: [{ t: 'm', size: 'sm', tex: 'w\\ \\text{が純虚数}\\iff w+\\overline{w}=0,\\ \\ w\\neq0' },
          { t: 'ans', label: '(1) 答', text: 'ア ①　イ ③' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。直線 OP の向きは $z-0=z$、直線 AQ の向きは $z^2-1$。だから OP ⊥ AQ ⇔ $w=\\dfrac{z^2-1}{z}$ が純虚数です。図は $z=0.6+0.8i$ の例です。',
        add: [{ t: 'h', text: '(2)　OP ⊥ AQ となる点 P' },
          { t: 'm', tex: 'w=\\frac{z^2-1}{z-0}\\ \\text{が純虚数}' },
          cfig('f2', [
            { k: 'seg', a: [0, 0], b: [P1[0] * 1.45, P1[1] * 1.45], c: 'y' }, { k: 'seg', a: [1, 0], b: Q1, c: 'b' },
            { k: 'right', o: M1, a: [0, 0], b: [1, 0], s: 14 },
            { k: 'pt', at: [1, 0], name: 'A', dir: 'se', c: 'b' }, { k: 'pt', at: P1, name: 'P(z)', dir: 'e', c: 'y' }, { k: 'pt', at: Q1, name: 'Q(z²)', dir: 'nw', c: 'b' }])] },
      { ask: { type: 'choice', q: '$w=\\dfrac{z^2-1}{z}$ を簡単にすると？（ウ）',
        opts: ['① $z-\\dfrac1z$', '⓪ $z-1$', '② $z+\\dfrac1z$', '③ $\\dfrac{z-1}{z}$'], ok: 0,
        why: { 1: '$\\dfrac{z^2}{z}=z$ ですが、$\\dfrac{-1}{z}$ は $-1$ になりません。', 2: '分子は $z^2-1$。$-\\dfrac1z$ です。', 3: '$z^2-1=(z-1)(z+1)$ なので、$\\dfrac{z-1}{z}$ にはなりません。' },
        good: '$\\dfrac{z^2}{z}-\\dfrac1z=z-\\dfrac1z$。',
        add: [{ t: 'm', tex: 'w=z-\\frac1z' }] } },
      { say: '太郎さんの方法：$z=x+yi$ とおくと、$\\dfrac1z=\\dfrac{x-yi}{x^2+y^2}$。$w$ の実部は $x-\\dfrac{x}{x^2+y^2}=\\dfrac{x(x^2+y^2-1)}{x^2+y^2}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '(w\\ \\text{の実部})=\\frac{x(x^2+y^2-1)}{x^2+y^2}=0', note: '太郎さん' }] },
      { say: '花子さんの方法：$w+\\overline{w}$ をそのまま計算します。$\\dfrac1z+\\dfrac1{\\overline{z}}=\\dfrac{z+\\overline{z}}{z\\overline{z}}=\\dfrac{z+\\overline{z}}{|z|^2}$ なので、$z+\\overline{z}$ でくくれます。エは 1。',
        add: [{ t: 'm', size: 'sm', tex: 'w+\\overline{w}=(z+\\overline{z})-\\frac{z+\\overline{z}}{|z|^2}=(z+\\overline{z})\\left(1-\\frac{1}{|z|^2}\\right)', note: '花子さん' }] },
      { ask: { type: 'choice', q: '$w+\\overline{w}=0$ から、点 P 全体の集合は？（オ）',
        opts: ['⓪ 単位円（$\\pm1$ を除く）', '① 虚軸（原点を除く）', '② 単位円と虚軸（$0,\\pm1$ を除く）', '③ 単位円と実軸（$0,\\pm1$ を除く）'], ok: 2,
        why: { 0: '$z+\\overline{z}=0$ の場合を落としています。「積が 0」は「どちらかが 0」。', 1: '$|z|=1$ の場合を落としています。', 3: '$z+\\overline{z}=2x=0$ は「実部が 0」、つまり虚軸です。' },
        good: '$z+\\overline{z}=0$（虚軸）または $|z|=1$（単位円）。$w\\neq0$ ⇔ $z\\neq\\pm1$、もともと $z\\neq0$ なので、3点を除きます。',
        add: [{ t: 'ans', label: '(2) 答', text: 'ウ ①　エ 1　オ ②' }],
        draw: [{ fig: 'f2', items: [{ k: 'circle', o: [0, 0], r: 1, c: 'p', wd: 4 }, { k: 'seg', a: [0, -1.45], b: [0, 1.6], c: 'p', wd: 4 },
          { k: 'pt', at: [0, 0], open: true, c: 'p' }, { k: 'pt', at: [1, 0], open: true, c: 'p' }, { k: 'pt', at: [-1, 0], open: true, c: 'p' }] }] } },
      { ask: { type: 'think', q: '図形で確かめよう：P が単位円上のとき、なぜ OP ⊥ AQ になる？',
        hint: '$z=\\cos\\theta+i\\sin\\theta$ なら、$z^2$ の偏角は $2\\theta$。OA と OQ の長さは？',
        ans: 'OA＝OQ＝1 の二等辺三角形 OAQ で、OP は頂角 $\\angle\\mathrm{AOQ}$（$2\\theta$）の二等分線。だから底辺 AQ と垂直',
        after: '虚軸上のとき（$z=ti$）は、Q＝$-t^2$ が実軸上にあり、AQ は実軸、OP は虚軸なので垂直です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。P が単位円上のとき、AQ の中点 M は $m=\\dfrac{1+z^2}{2}$。$m-\\dfrac12=\\dfrac{z^2}{2}$ の形にすると、絶対値が計算できます。',
        add: [{ t: 'h', text: '(3)　AQ の中点 M の軌跡' },
          { t: 'm', tex: 'm-\\frac12=\\frac{z^2}{2}' },
          cfig('f3', [
            { k: 'seg', a: [0, 0], b: P3, c: 'y' }, { k: 'seg', a: [1, 0], b: Q3, c: 'b' }, { k: 'seg', a: [0, 0], b: M3, c: 'g', wd: 2 },
            { k: 'right', o: M3, a: [0, 0], b: [1, 0], s: 13 },
            { k: 'pt', at: [1, 0], name: 'A', dir: 'se', c: 'b' }, { k: 'pt', at: P3, name: 'P', dir: 'ne', c: 'y' }, { k: 'pt', at: Q3, name: 'Q', dir: 'nw', c: 'b' },
            { k: 'pt', at: M3, name: 'M', dir: 'n', c: 'g' }])] },
      { ask: { type: 'choice', q: '$\\left|m-\\dfrac12\\right|$ の値は？（ク・ケ）',
        opts: ['$1$', '$\\dfrac14$', '$\\dfrac12$', '$2$'], ok: 2,
        why: { 0: '$|z^2|=1$ ですが、2 で割るのを忘れています。', 1: '$|z^2|=|z|^2=1$。$\\frac12$ を2回かけてはいけません。', 3: '$\\left|\\dfrac{z^2}{2}\\right|=\\dfrac{|z|^2}{2}$。2 倍ではなく 2 で割ります。' },
        good: '$\\left|m-\\dfrac12\\right|=\\dfrac{|z|^2}{2}=\\dfrac12$。M は中心 $\\dfrac12$、半径 $\\dfrac12$ の円の上にあります。',
        add: [{ t: 'm', tex: '\\left|m-\\frac12\\right|=\\frac{|z|^2}{2}=\\frac12' }],
        draw: [{ fig: 'f3', items: [{ k: 'circle', o: [0.5, 0], r: 0.5, c: 'g', wd: 3 }] }] } },
      { say: 'この円は、OA を直径とする円です。(2) で見たように OM ⊥ AQ なので、$\\angle\\mathrm{OMA}=90^\\circ$。円周角の定理の逆から、M は OA を直径とする円の上にある、と図形でも説明できます。',
        add: [{ t: 'p', size: 'sm', text: '中心 $\\dfrac12$・半径 $\\dfrac12$ ＝ **OA を直径とする円**\n（$\\angle\\mathrm{OMA}=90^\\circ$）' }] },
      { ask: { type: 'choice', q: 'M の描く図形から **除く点** は？（コ）',
        opts: ['⓪ $0$', '① $1$', '② $-1$', '③ $\\dfrac12$'], ok: 1,
        why: { 0: '$z=\\pm i$ のとき $z^2=-1$ で $m=0$。0 は図形にふくまれます。', 2: '$-1$ はもともとこの円の上にありません。', 3: '$\\dfrac12$ は円の中心で、円の上の点ではありません。$z^2\\neq1$ なので $m\\neq1$ です。' },
        good: '$z^2$ は単位円上の 1 以外を動くので、$m$ は円の上の 1 以外を動きます。',
        add: [{ t: 'ans', label: '(3) 答', text: '$\\dfrac{\\text{カ}}{\\text{キ}}=\\dfrac12$　$\\dfrac{\\text{ク}}{\\text{ケ}}=\\dfrac12$　コ ①' }],
        draw: [{ fig: 'f3', items: [{ k: 'pt', at: [1, 0], open: true, c: 'g', r: 7 }] }] } },
      { ask: { type: 'think', q: 'では、P が虚軸上（$z=ti$、$t\\neq0$ の実数）を動くとき、M はどんな図形を描く？',
        hint: '$z^2=-t^2$。$m=\\dfrac{1+z^2}{2}$ に入れる。',
        ans: '$m=\\dfrac{1-t^2}{2}$（実数）。$t^2>0$ なので、M は **実軸上の $\\dfrac12$ より小さい部分** を動く',
        after: '(2) の軌跡は2つの部分からできていたので、M の軌跡も2つの部分（円と半直線）に分かれます。' } },

      // ---------- 共通テストのコツ ----------
      { clear: true, cols: [1], part: 'コツ', say: '複素数平面の大問は、問題文が長くても、使う道具は「垂直 ⇔ 純虚数」と「共役複素数の計算」の2つだけ、ということがよくあります。',
        add: [{ t: 'h', text: '共通テストで、この大問を解くときのコツ' },
          { t: 'box', c: 'b', size: 'sm', label: '読み方', text: '会話の「$x+yi$ でおく（太郎）」「共役のまま（花子）」は、どちらでも解ける。式が短くなる花子さんの方針を選ぶと時間が浮く' },
          { t: 'box', c: 'p', size: 'sm', label: '時間をかける所', text: '「積が 0 ⇔ どちらかが 0」で **2つの図形** が出る所と、**除く点**（$z\\neq0,\\pm1$、$w\\neq0$）の確認' },
          { t: 'box', c: 'g', size: 'sm', label: '選択肢の消し方', text: '具体的な点（$z=i$、$z=\\frac{\\sqrt2}{2}(1+i)$ など）を入れて、垂直かどうかを確かめると、図形の選択肢をすばやく消せる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂直の条件を複素数で書き、共役複素数で因数分解すれば、軌跡が見えてきます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、時間を計ってもう一度ノートで解いてみましょう。' }
    ]
  });
})();
