/* 2026 共通テスト 数学Ⅱ，B，C 第2問の類題（自作）：加法定理から「差を積に直す公式」を導き、関数の最大・最小と方程式に使う
   答え（python3 で検算ずみ）：(1) ア=③（−2sinαsinβ）、イ=⓪（(A+B)/2）、ウ=①（(A−B)/2）、エ=①
   (2) f(θ)=√3 sin(θ+π/3)、θ=π/6 で最大値 √3、θ=π（ケ=③）で最小値 −3/2
   (3) サ=⓪（2sin2θsinθ）、シ=⓪（2sinθ−1）、解は 6 個、最大は 3π/2 */
(function () {
  const PI = Math.PI, r3 = Math.sqrt(3);
  const POINTS = [
    '加法定理2本を「引く（たす）」と、余分な項が消えて積だけが残る。$\\alpha+\\beta=A,\\ \\alpha-\\beta=B$ とおけば和・差を積に直す公式',
    '$\\cos A-\\cos B=-2\\sin\\dfrac{A+B}{2}\\sin\\dfrac{A-B}{2}$。$\\dfrac{A-B}{2}$ が負の角になったら $\\sin(-x)=-\\sin x$ で符号を整理',
    '方程式は積の形にして「$\\square\\times\\square=0$」。共通因数（$\\sin2\\theta$）で両辺をわると解が消えるので、くくり出す'
  ];
  const G2 = (items) => ({ t: 'fig', id: 'g2', col: 1, view: [-0.35, -2.1, 3.55, 2.25], w: 600, h: 380, items: [
    { k: 'axes', tx: [[PI / 6, 'π/6'], [PI / 2, 'π/2'], [PI, 'π']], ty: [[r3, '√3'], [-1.5, '−3/2']], xl: 'θ' },
    { k: 'fn', f: 'sqrt(3)*sin(x+PI/3)', a: 0, b: PI, c: 'y', label: 'y=f(θ)', lat: [1.9, 1.75] }].concat(items || []) });
  const G3 = (items) => ({ t: 'fig', id: 'g3', col: 1, view: [-0.35, -1.9, 6.75, 2.0], w: 620, h: 340, items: [
    { k: 'axes', tx: [[PI / 2, 'π/2'], [PI, 'π'], [3 * PI / 2, '3π/2'], [2 * PI, '2π']], ty: [1, -1], xl: 'θ' },
    { k: 'fn', f: 'cos(x)-cos(3*x)', a: 0, b: 2 * PI, c: 'y', label: 'cosθ−cos3θ', lat: [3.55, 1.72] },
    { k: 'fn', f: 'sin(2*x)', a: 0, b: 2 * PI, c: 'b', label: 'sin2θ', lat: [4.9, -1.45] }].concat(items || []) });

  HB.lesson({
    id: 'ct26-2bc-2', field: '共通テスト型　数学Ⅱ，B，C', title: '2026 共通テスト 数学Ⅱ，B，C 第2問の類題 ― 差を積に直す公式と、その使い道',
    level: '2026年度 第2問の類題（自作）', time: '目安 15〜20分',
    problem: {
      label: '類題',
      lead: 'ゆいさんとそうたさんは、加法定理から「三角関数の差を積に直す公式」を導き、それを使っていろいろな関数を調べることにした。',
      parts: [
        '(1)　加法定理 $\\cos(\\alpha+\\beta)=\\cos\\alpha\\cos\\beta-\\sin\\alpha\\sin\\beta$、$\\cos(\\alpha-\\beta)=\\cos\\alpha\\cos\\beta+\\sin\\alpha\\sin\\beta$ の辺々を引くと\n　$\\cos(\\alpha+\\beta)-\\cos(\\alpha-\\beta)=\\boxed{\\text{ア}}$ …①\nである。ここで $\\alpha+\\beta=A,\\ \\alpha-\\beta=B$ とおくと $\\alpha=\\boxed{\\text{イ}},\\ \\beta=\\boxed{\\text{ウ}}$ となるので、① から\n　$\\cos A-\\cos B=\\boxed{\\text{エ}}$ …②\nが得られる。\n　$\\boxed{\\text{ア}}$ の解答群　⓪ $2\\cos\\alpha\\cos\\beta$　① $-2\\cos\\alpha\\cos\\beta$　② $2\\sin\\alpha\\sin\\beta$　③ $-2\\sin\\alpha\\sin\\beta$\n　$\\boxed{\\text{イ}},\\ \\boxed{\\text{ウ}}$ の解答群（同じものをくり返し選んでもよい）　⓪ $\\dfrac{A+B}{2}$　① $\\dfrac{A-B}{2}$　② $A+B$　③ $A-B$\n　$\\boxed{\\text{エ}}$ の解答群　⓪ $2\\sin\\dfrac{A+B}{2}\\sin\\dfrac{A-B}{2}$　① $-2\\sin\\dfrac{A+B}{2}\\sin\\dfrac{A-B}{2}$　② $-2\\cos\\dfrac{A+B}{2}\\cos\\dfrac{A-B}{2}$　③ $2\\sin\\dfrac{A+B}{2}\\cos\\dfrac{A-B}{2}$',
        '(2)　$0\\le\\theta\\le\\pi$ のとき、関数 $f(\\theta)=\\cos\\theta-\\cos\\left(\\theta+\\dfrac{2}{3}\\pi\\right)$ を考える。② を用いると\n　$f(\\theta)=\\sqrt{\\boxed{\\text{オ}}}\\,\\sin\\left(\\theta+\\dfrac{\\pi}{\\boxed{\\text{カ}}}\\right)$\nと変形できる。よって、$f(\\theta)$ は $\\theta=\\dfrac{\\pi}{\\boxed{\\text{キ}}}$ のとき最大値 $\\sqrt{\\boxed{\\text{ク}}}$ をとり、$\\theta=\\boxed{\\text{ケ}}$ のとき最小値 $-\\dfrac{\\boxed{\\text{コ}}}{2}$ をとる。\n　$\\boxed{\\text{ケ}}$ の解答群　⓪ $0$　① $\\dfrac{\\pi}{3}$　② $\\dfrac{2}{3}\\pi$　③ $\\pi$',
        '(3)　そうた「② を使うと、$\\cos\\theta-\\cos3\\theta$ も積の形になるね。」\n　$0\\le\\theta<2\\pi$ のとき、方程式 $\\cos\\theta-\\cos3\\theta=\\sin2\\theta$ …③ を考える。② より $\\cos\\theta-\\cos3\\theta=\\boxed{\\text{サ}}$ であるから、③ は $\\sin2\\theta\\,(\\boxed{\\text{シ}})=0$ と変形できる。したがって、③ の解は全部で $\\boxed{\\text{ス}}$ 個あり、そのうち最も大きいものは $\\theta=\\dfrac{\\boxed{\\text{セ}}}{\\boxed{\\text{ソ}}}\\pi$ である。\n　$\\boxed{\\text{サ}}$ の解答群　⓪ $2\\sin2\\theta\\sin\\theta$　① $-2\\sin2\\theta\\sin\\theta$　② $2\\cos2\\theta\\cos\\theta$　③ $2\\sin2\\theta\\cos\\theta$\n　$\\boxed{\\text{シ}}$ の解答群　⓪ $2\\sin\\theta-1$　① $2\\sin\\theta+1$　② $2\\cos\\theta-1$　③ $\\sin\\theta-2$'
      ],
      src: '※ 2026年度 共通テスト 数学Ⅱ，B，C 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: 'テーマは「加法定理から公式を作り、それを使う」。前半は証明の穴うめ、後半はその公式の使い道です。問題文は Q キーで見られます。',
        add: [{ t: 'h', text: '類題（第2問）　三角関数' },
          { t: 'box', c: 'y', label: '流れ', text: '(1) 加法定理 → 差を積に直す公式（証明の穴うめ）\n(2) 公式で $f(\\theta)$ を1つの sin に → 最大・最小\n(3) 公式で方程式を積の形に → 解の個数' }] },
      { say: '共通テストのコツ。証明の穴うめは、**解答群を先に見る** と「何を書かせたいのか」がわかります。ここでは ア の候補は全部「積」の形です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: 'コツ', text: '穴うめの証明は、解答群から「ゴールの形」を先に読む。\n文字を何とおいたか（$\\alpha+\\beta=A$ など）を、メモしながら追う' }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.6, 0.4], part: '(1)', say: '(1) です。cos の加法定理を2本ならべて、上から下を引きます。$\\cos\\alpha\\cos\\beta$ どうしは消えます。',
        add: [{ t: 'h', text: '(1)　公式を導く' },
          { t: 'm', size: 'sm', tex: '\\cos(\\alpha+\\beta)=\\cos\\alpha\\cos\\beta\\hy{-\\sin\\alpha\\sin\\beta}' },
          { t: 'm', size: 'sm', tex: '\\cos(\\alpha-\\beta)=\\cos\\alpha\\cos\\beta\\hy{+\\sin\\alpha\\sin\\beta}' }] },
      { ask: { type: 'choice', q: '上の式から下の式を引くと、右辺（ア）は？',
        opts: ['$2\\cos\\alpha\\cos\\beta$', '$-2\\sin\\alpha\\sin\\beta$', '$2\\sin\\alpha\\sin\\beta$', '$0$'], ok: 1,
        why: { 0: 'それは2本を「たした」とき。引くと $\\cos\\alpha\\cos\\beta$ は消えます。', 2: '$-\\sin\\alpha\\sin\\beta-(+\\sin\\alpha\\sin\\beta)=-2\\sin\\alpha\\sin\\beta$。符号に注意。', 3: '$\\sin\\alpha\\sin\\beta$ の項は消えずに残ります。' },
        good: '$-\\sin\\alpha\\sin\\beta-\\sin\\alpha\\sin\\beta=-2\\sin\\alpha\\sin\\beta$。ア は ③ です。',
        add: [{ t: 'm', tex: '\\cos(\\alpha+\\beta)-\\cos(\\alpha-\\beta)=-2\\sin\\alpha\\sin\\beta', note: '…①' }] } },
      { say: '$\\alpha+\\beta=A$、$\\alpha-\\beta=B$ とおきます。2式をたすと $2\\alpha=A+B$、引くと $2\\beta=A-B$。よって イ は ⓪、ウ は ① です。',
        add: [{ t: 'box', c: 'b', col: 1, size: 'sm', label: 'おきかえ', text: '$\\alpha+\\beta=A,\\ \\alpha-\\beta=B$\nたす：$\\alpha=\\dfrac{A+B}{2}$\n引く：$\\beta=\\dfrac{A-B}{2}$' }] },
      { ask: { type: 'choice', q: '① に代入すると、$\\cos A-\\cos B$（エ）は？',
        opts: ['$2\\sin\\frac{A+B}{2}\\sin\\frac{A-B}{2}$', '$-2\\cos\\frac{A+B}{2}\\cos\\frac{A-B}{2}$', '$2\\sin\\frac{A+B}{2}\\cos\\frac{A-B}{2}$', '$-2\\sin\\frac{A+B}{2}\\sin\\frac{A-B}{2}$'], ok: 3,
        why: { 0: '① の右辺の「マイナス」が落ちています。', 1: '① の右辺は sin と sin の積です。cos にはなりません。', 2: 'それは $\\sin A+\\sin B$ の公式。① からは出てきません。' },
        good: '$\\alpha,\\ \\beta$ をそのまま入れるだけ。エ は ① です。',
        add: [{ t: 'box', c: 'y', label: '公式②', text: '$\\cos A-\\cos B=-2\\sin\\dfrac{A+B}{2}\\sin\\dfrac{A-B}{2}$' }] } },
      { ask: { type: 'think', q: '同じようにして、$\\cos A+\\cos B$ を積の形に直そう。',
        hint: '加法定理2本を「たす」と $\\cos(\\alpha+\\beta)+\\cos(\\alpha-\\beta)=2\\cos\\alpha\\cos\\beta$。',
        ans: '$\\cos A+\\cos B=2\\cos\\dfrac{A+B}{2}\\cos\\dfrac{A-B}{2}$',
        after: '公式を丸暗記していなくても、加法定理から1分で作れます。共通テストは、その「作り方」を聞いてきます。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f(\\theta)=\\cos\\theta-\\cos\\left(\\theta+\\frac23\\pi\\right)$ に公式②を使います。$A=\\theta,\\ B=\\theta+\\frac23\\pi$ とみます。',
        add: [{ t: 'h', text: '(2)　1つの sin にまとめる' },
          { t: 'm', size: 'sm', tex: '\\frac{A+B}{2}=\\theta+\\frac{\\pi}{3},\\qquad \\frac{A-B}{2}=-\\frac{\\pi}{3}' },
          { t: 'm', size: 'sm', tex: 'f(\\theta)=-2\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)\\sin\\left(-\\frac{\\pi}{3}\\right)' }] },
      { ask: { type: 'choice', q: '整理すると $f(\\theta)$ は？',
        opts: ['$-\\sqrt3\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$', '$\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$', '$\\sqrt3\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$', '$\\sqrt3\\cos\\left(\\theta+\\frac{\\pi}{3}\\right)$'], ok: 2,
        why: { 0: '$\\sin\\left(-\\frac{\\pi}{3}\\right)=-\\frac{\\sqrt3}{2}$。マイナスどうしで正になります。', 1: '$-2\\times\\left(-\\frac{\\sqrt3}{2}\\right)=\\sqrt3$。係数が落ちています。', 3: '公式②は sin と sin の積。cos にはなりません。' },
        good: '$-2\\times\\left(-\\frac{\\sqrt3}{2}\\right)=\\sqrt3$。オ＝3、カ＝3。',
        add: [{ t: 'm', tex: 'f(\\theta)=\\sqrt3\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)' }, G2()] } },
      { say: '$0\\le\\theta\\le\\pi$ なので、$\\theta+\\frac{\\pi}{3}$ は $\\frac{\\pi}{3}$ から $\\frac43\\pi$ まで動きます。sin が 1 になるのは $\\theta+\\frac{\\pi}{3}=\\frac{\\pi}{2}$、つまり $\\theta=\\frac{\\pi}{6}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\pi}{3}\\le\\theta+\\frac{\\pi}{3}\\le\\frac43\\pi', note: '動く範囲を先に書く' }],
        draw: [{ fig: 'g2', items: [{ k: 'pt', at: [PI / 6, r3], name: '最大 √3', dir: 'ne', c: 'p', size: 22 }, { k: 'pt', at: [0, 1.5], c: 'y', r: 5 }] }] },
      { ask: { type: 'choice', q: '最小値をとる $\\theta$（ケ）は？',
        opts: ['⓪ $0$', '① $\\frac{\\pi}{3}$', '② $\\frac23\\pi$', '③ $\\pi$'], ok: 3,
        why: { 0: '$\\theta=0$ では $f=\\sqrt3\\sin\\frac{\\pi}{3}=\\frac32$。区間の左はしですが、最小ではありません。', 1: '$\\theta=\\frac{\\pi}{3}$ では $f=\\sqrt3\\sin\\frac23\\pi=\\frac32$。', 2: '$\\theta=\\frac23\\pi$ では $\\sin\\pi=0$ で $f=0$。まだ下がります。' },
        good: '$\\theta+\\frac{\\pi}{3}=\\frac43\\pi$ のとき $\\sin=-\\frac{\\sqrt3}{2}$ で、$f=-\\frac32$（コ＝3）。',
        draw: [{ fig: 'g2', items: [{ k: 'pt', at: [PI, -1.5], name: '最小 −3/2', dir: 'sw', c: 'b', size: 22 }] }] } },
      { say: '(2) の答えです。区間の両はしの値もグラフで確かめておくと、思いこみのミスがへります。',
        add: [{ t: 'ans', label: '(2) 答', text: '最大値 $\\sqrt3$（$\\theta=\\dfrac{\\pi}{6}$ のとき）\n最小値 $-\\dfrac32$（$\\theta=\\pi$ のとき）' }] },
      { ask: { type: 'think', q: '加法定理で $\\cos\\left(\\theta+\\frac23\\pi\\right)$ を展開し、三角関数の合成で $f(\\theta)=\\sqrt3\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$ を確かめよう。',
        hint: '$\\cos\\left(\\theta+\\frac23\\pi\\right)=-\\frac12\\cos\\theta-\\frac{\\sqrt3}{2}\\sin\\theta$。',
        ans: '$f(\\theta)=\\dfrac{\\sqrt3}{2}\\sin\\theta+\\dfrac32\\cos\\theta=\\sqrt3\\left(\\dfrac12\\sin\\theta+\\dfrac{\\sqrt3}{2}\\cos\\theta\\right)=\\sqrt3\\sin\\left(\\theta+\\dfrac{\\pi}{3}\\right)$',
        after: '合成でも同じ答え。公式②を使うと、展開の手間がはぶけて1行で済みます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$\\cos\\theta-\\cos3\\theta$ に公式②を使います。$\\frac{A+B}{2}=2\\theta$、$\\frac{A-B}{2}=-\\theta$ です。',
        add: [{ t: 'h', text: '(3)　方程式を積の形に' },
          { t: 'm', size: 'sm', tex: '\\cos\\theta-\\cos3\\theta=-2\\sin2\\theta\\sin(-\\theta)' }] },
      { ask: { type: 'choice', q: '$\\cos\\theta-\\cos3\\theta$（サ）は？',
        opts: ['$2\\sin2\\theta\\sin\\theta$', '$-2\\sin2\\theta\\sin\\theta$', '$2\\cos2\\theta\\cos\\theta$', '$2\\sin2\\theta\\cos\\theta$'], ok: 0,
        why: { 1: '$\\sin(-\\theta)=-\\sin\\theta$ で、マイナスが2つになり正です。', 2: 'それは $\\cos\\theta+\\cos3\\theta$ のほう。', 3: '公式②は sin と sin の積です。' },
        good: '$\\sin(-\\theta)=-\\sin\\theta$ なので $-2\\sin2\\theta\\cdot(-\\sin\\theta)=2\\sin2\\theta\\sin\\theta$。',
        add: [{ t: 'm', size: 'sm', tex: '2\\sin2\\theta\\sin\\theta=\\sin2\\theta' },
          { t: 'm', tex: '\\sin2\\theta\\,(2\\sin\\theta-1)=0', note: 'シ は ⓪' }] } },
      { say: '注意：両辺を $\\sin2\\theta$ でわってはいけません。$\\sin2\\theta=0$ の場合の解が消えてしまいます。くくり出して「積 $=0$」にします。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: '注意', text: '$\\sin2\\theta$ でわる → $\\sin2\\theta=0$ の解が消える\nくくり出して「$\\sin2\\theta=0$ または $\\sin\\theta=\\frac12$」' }] },
      { ask: { type: 'choice', q: '$0\\le\\theta<2\\pi$ で、③ の解は全部で何個（ス）？',
        opts: ['2 個', '4 個', '6 個', '8 個'], ok: 2,
        why: { 0: '$\\sin\\theta=\\frac12$ の解だけです。$\\sin2\\theta=0$ の解を忘れています。', 1: '$\\sin2\\theta=0$ の解だけ。$\\sin\\theta=\\frac12$ の解も入れます。', 3: '$2\\theta$ は $0\\le2\\theta<4\\pi$ なので $\\sin2\\theta=0$ は4個。全部で8個にはなりません。' },
        good: '$\\sin2\\theta=0$ で 4 個、$\\sin\\theta=\\frac12$ で 2 個。重なりはないので 6 個です。',
        add: [{ t: 'm', size: 'sm', tex: '\\theta=0,\\ \\frac{\\pi}{6},\\ \\frac{\\pi}{2},\\ \\frac56\\pi,\\ \\pi,\\ \\frac32\\pi' }, G3([
          { k: 'pt', at: [0, 0], c: 'p', r: 6 }, { k: 'pt', at: [PI / 6, r3 / 2], c: 'p', r: 6 }, { k: 'pt', at: [PI / 2, 0], c: 'p', r: 6 },
          { k: 'pt', at: [5 * PI / 6, -r3 / 2], c: 'p', r: 6 }, { k: 'pt', at: [PI, 0], c: 'p', r: 6 }, { k: 'pt', at: [3 * PI / 2, 0], c: 'p', r: 6 }])] } },
      { say: '右のグラフで、2つのグラフの交点がちょうど 6 個。いちばん大きい解は $\\frac32\\pi$ です。',
        add: [{ t: 'ans', label: '(3) 答', text: '解は $6$ 個。最大の解は $\\theta=\\dfrac32\\pi$（セ＝3、ソ＝2）' }] },

      // ---------- コツ ----------
      { clear: true, cols: [1], part: 'コツ', say: '時間のかけ方の目安です。(1) の穴うめは2〜3分で通過し、(2)(3) の「使い道」に時間を残しましょう。',
        add: [{ t: 'h', text: '共通テストでの進め方' },
          { t: 'tbl', size: 'sm', rows: [['小問', '目安', 'ここで時間を使わないコツ'], ['(1)', '3分', '解答群の「形」を見て、加法定理を引くかたすかを決める'], ['(2)', '6分', '$\\frac{A-B}{2}$ が負なら $\\sin(-x)=-\\sin x$。動く範囲を先に書く'], ['(3)', '6分', 'わらずにくくる。$2\\theta$ の範囲は $0\\le2\\theta<4\\pi$']] },
          { t: 'box', c: 'p', size: 'sm', label: 'コツ', text: '「② を用いると」と書いてあったら、その公式の $A,\\ B$ に何を入れるかを最初に決める' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。公式を「作る」→「使う」の流れは、共通テストの三角関数でくり返し出ています。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、ノートでもう一度、時間をはかって解いてみましょう。' }
    ]
  });
})();
