/* 2026 佐賀大 理系 第3問の類題（自作）：f(x)=4sin2x−3tanx（−π/2<x<π/2）の、x 軸との共有点・増減と極値・囲まれた部分の面積
   答え（python3・sympy と数値積分で検算ずみ）：
   (1) f(x)=sinx(8cos²x−3)/cosx。sinx=0 または cos²x=3/8（cosx=√6/4）→ x=0, ±α（cosα=√6/4、α≒0.912）→ 3 個
   (2) f'(x)=8cos2x−3/cos²x=(16c²−8c−3)/c=(4c−3)(4c+1)/c（c=cos²x）。
       x=−π/6 で極小値 −√3、x=π/6 で極大値 √3（−π/6<x<π/6 で増加、ほかで減少）
   (3) 奇関数なので S=2∫[0,α]f dx。∫f dx=−2cos2x+3log(cosx)。cos2α=−1/4、log(cosα)=(1/2)log(3/8)
       S=2{5/2+(3/2)log(3/8)}=5+3log(3/8)=5−3log(8/3)≒2.0575（数値積分 2.05751 と一致） */
(function () {
  const F = '4*sin(2*x)-3*tan(x)';
  const PI = Math.PI, r3 = Math.sqrt(3), AL = Math.acos(Math.sqrt(6) / 4);
  const graph = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-1.9, -3.1, 1.9, 3.1], w: w || 520, h: Math.round((w || 520) * 0.8), items: [
    { k: 'axes', tx: [[-PI / 2, '−π/2'], [-PI / 6, '−π/6'], [PI / 6, 'π/6'], [PI / 2, 'π/2']], ty: [[r3, '√3'], [-r3, '−√3']] },
    { k: 'line', x: -PI / 2, dash: true, c: 'd' }, { k: 'line', x: PI / 2, dash: true, c: 'd' }
  ].concat(extra || [], [{ k: 'fn', f: F, a: -1.53, b: 1.53, c: 'w', wd: 3.5 }]) });   // グラフは最後にかいて、ぬりの上に出す
  const zeros = [{ k: 'pt', at: [AL, 0], name: 'α', dir: 'ne', c: 'p', r: 5 }, { k: 'pt', at: [-AL, 0], name: '−α', dir: 'nw', c: 'p', r: 5 }];
  const ext = [{ k: 'pt', at: [PI / 6, r3], c: 'y', r: 5 }, { k: 'pt', at: [-PI / 6, -r3], c: 'y', r: 5 },
    { k: 'seg', a: [PI / 6, 0], b: [PI / 6, r3], c: 'y', dash: true, wd: 1.5 }, { k: 'seg', a: [-PI / 6, 0], b: [-PI / 6, -r3], c: 'y', dash: true, wd: 1.5 }];
  const POINTS = [
    '$\\sin2x=2\\sin x\\cos x$、$\\tan x=\\dfrac{\\sin x}{\\cos x}$ で $\\sin x$ をくくり出す。区間の中では $\\cos x>0$',
    "$f'(x)$ は通分して $\\cos^2x=c$ の2次式に。$(4c-3)(4c+1)$ と因数分解し、符号を決める因数だけを見る",
    '奇関数なら面積は $2\\displaystyle\\int_0^{\\alpha}f(x)\\,dx$。$\\displaystyle\\int\\tan x\\,dx=-\\log|\\cos x|+C$'
  ];

  HB.lesson({
    id: 'saga26-3', field: '佐賀大型　数学（理系）', title: '2026 佐賀大 理系 第3問の類題 ― 4sin2x−3tanx のグラフと面積', level: '2026年度 佐賀大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$-\\dfrac{\\pi}{2}<x<\\dfrac{\\pi}{2}$ で定義された関数 $f(x)=4\\sin2x-3\\tan x$ について、次の問いに答えよ。',
      parts: [
        '(1)　曲線 $y=f(x)$ と $x$ 軸の共有点の個数を求めよ。',
        '(2)　$f(x)$ の増減を調べ、極値を求めよ。',
        '(3)　曲線 $y=f(x)$ と $x$ 軸で囲まれた2つの部分の面積の和 $S$ を求めよ。'
      ],
      src: '※ 2026年度 佐賀大学 前期 理工学部 数学 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '三角関数のグラフを、微分と積分で調べる問題です。数学Ⅲの基本がそろっています。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず形をつかみます。$f(-x)=-f(x)$ なので **奇関数**、グラフは原点について対称です。また $x\\to\\frac{\\pi}{2}-0$ で $\\tan x\\to\\infty$ なので、$f(x)\\to-\\infty$ です。',
        add: [{ t: 'h', text: '読みかえ：対称性と区間の端' },
          { t: 'm', size: 'sm', tex: 'f(-x)=4\\sin(-2x)-3\\tan(-x)=-f(x)' },
          { t: 'm', size: 'sm', tex: '\\lim_{x\\to\\frac{\\pi}{2}-0}f(x)=-\\infty,\\qquad \\lim_{x\\to-\\frac{\\pi}{2}+0}f(x)=\\infty' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '$x\\ge0$ の側を調べれば、残りは原点対称で決まる。\n(3) の面積も「片方を求めて 2 倍」にできる。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\sin2x=2\\sin x\\cos x$、$\\tan x=\\dfrac{\\sin x}{\\cos x}$ と書きかえて、$\\sin x$ でくくります。',
        add: [{ t: 'h', text: '(1)　x 軸との共有点の個数' },
          { t: 'm', tex: '\\begin{aligned}f(x)&=8\\sin x\\cos x-\\frac{3\\sin x}{\\cos x}\\\\ &=\\frac{\\sin x\\,(8\\cos^2x-3)}{\\cos x}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$f(x)=0$ と同じ条件は？',
        opts: ['$\\sin x=0$ だけ', '$\\cos^2x=\\dfrac38$ だけ', '$\\sin x=0$ または $\\cos x=\\dfrac38$', '$\\sin x=0$ または $\\cos^2x=\\dfrac38$'], ok: 3,
        why: { 0: 'もう1つの因数 $8\\cos^2x-3=0$ を忘れています。', 1: '$\\sin x=0$（$x=0$）も解です。', 2: '$8\\cos^2x=3$ です。2乗を忘れています。' },
        good: '分子 $=0$ が条件です（分母 $\\cos x$ は区間の中で 0 にならない）。',
        add: [{ t: 'm', tex: '\\sin x=0\\quad\\text{または}\\quad\\cos^2x=\\frac38' }] } },
      { say: '区間の中では $\\cos x>0$ なので $\\cos x=\\frac{\\sqrt6}{4}$。$0<\\frac{\\sqrt6}{4}<1$ だから、解は $x=\\pm\\alpha$ の2つ。これに $x=0$ を加えて 3 個です。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos x=\\frac{\\sqrt6}{4}\\ \\Longrightarrow\\ x=\\pm\\alpha', note: '$\\cos\\alpha=\\frac{\\sqrt6}{4}$\n$0<\\alpha<\\frac{\\pi}{2}$' },
          { t: 'ans', label: '(1) 答', text: '共有点は $x=-\\alpha,\\ 0,\\ \\alpha$ の **3 個**' },
          graph('g1', zeros, 480)] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f\'(x)$ を求めます。$\\sin2x$ を微分するときは、中の $2x$ の微分 $2$ がかかることに注意。',
        add: [{ t: 'h', text: '(2)　増減と極値' }] },
      { ask: { type: 'choice', q: "$f'(x)$ はどれ？",
        opts: ['$4\\cos2x-\\dfrac{3}{\\cos^2x}$', '$8\\cos2x+\\dfrac{3}{\\cos^2x}$', '$8\\cos2x-\\dfrac{3}{\\cos^2x}$', '$-8\\cos2x-\\dfrac{3}{\\cos^2x}$'], ok: 2,
        why: { 0: '合成関数の微分です。$(\\sin2x)\'=2\\cos2x$ なので、$4\\times2=8$。', 1: '$(\\tan x)\'=\\frac{1}{\\cos^2x}$ に $-3$ がかかります。', 3: '$(\\sin u)\'=\\cos u$。$-$ がつくのは $\\cos$ の微分です。' },
        good: "$f'(x)=4\\cdot2\\cos2x-\\dfrac{3}{\\cos^2x}=8\\cos2x-\\dfrac{3}{\\cos^2x}$。",
        add: [{ t: 'm', tex: "f'(x)=8\\cos2x-\\frac{3}{\\cos^2x}=\\frac{8\\cos2x\\cos^2x-3}{\\cos^2x}" }] } },
      { say: '分母は正なので、分子の符号を見ます。$\\cos2x=2\\cos^2x-1$ を使い、$c=\\cos^2x$ とおくと、分子は $c$ の2次式です。',
        add: [{ t: 'm', tex: '8(2c-1)c-3=16c^2-8c-3', note: '$c=\\cos^2x$\n$(0<c\\le1)$' }] },
      { ask: { type: 'choice', q: '$16c^2-8c-3$ を因数分解すると？',
        opts: ['$(4c+3)(4c-1)$', '$(4c-3)(4c+1)$', '$(8c-3)(2c+1)$', '$(2c-1)(8c+3)$'], ok: 1,
        why: { 0: '展開すると $16c^2+8c-3$。$c$ の係数の符号が逆です。', 2: '展開すると $16c^2+2c-3$ になります。', 3: '展開すると $16c^2-2c-3$ になります。' },
        good: '$(4c-3)(4c+1)$。$4c+1>0$ なので、$f\'(x)$ の符号は **$4\\cos^2x-3$ の符号** で決まります。',
        add: [{ t: 'm', tex: "f'(x)=\\frac{(4\\cos^2x-3)(4\\cos^2x+1)}{\\cos^2x}" },
          { t: 'p', size: 'sm', text: "$f'(x)>0\\iff\\cos^2x>\\frac34\\iff-\\frac{\\pi}{6}<x<\\frac{\\pi}{6}$" }] } },

      { clear: true, cols: [0.56, 0.44], say: '増減表にまとめます。$x=-\\frac{\\pi}{6}$ で極小、$x=\\frac{\\pi}{6}$ で極大。極値は、奇関数なので符号だけがちがいます。',
        add: [{ t: 'h', text: '(2)　つづき：増減表' },
          { t: 'tbl', size: 'sm', rows: [['$x$', '$\\left(-\\frac{\\pi}{2}\\right)$', '$\\cdots$', '$-\\frac{\\pi}{6}$', '$\\cdots$', '$\\frac{\\pi}{6}$', '$\\cdots$', '$\\left(\\frac{\\pi}{2}\\right)$'], ["$f'(x)$", '', '$-$', '$0$', '$+$', '$0$', '$-$', ''], ['$f(x)$', '', '↘', '極小', '↗', '極大', '↘', '']] },
          graph('g2', [], 470)] },
      { ask: { type: 'choice', q: '極大値 $f\\left(\\dfrac{\\pi}{6}\\right)$ の値は？',
        opts: ['$\\sqrt3$', '$3\\sqrt3$', '$2-\\sqrt3$', '$2\\sqrt3$'], ok: 0,
        why: { 1: '$-3\\tan\\frac{\\pi}{6}=-\\sqrt3$ は引き算です。', 2: '$\\sin2x$ の $2x$ は $\\frac{\\pi}{3}$。$\\sin\\frac{\\pi}{6}$ ではありません。', 3: '$-3\\tan\\frac{\\pi}{6}=-\\sqrt3$ を引き忘れています。' },
        good: '$4\\sin\\dfrac{\\pi}{3}-3\\tan\\dfrac{\\pi}{6}=2\\sqrt3-\\sqrt3=\\sqrt3$。',
        add: [{ t: 'ans', label: '(2) 答', text: '増加：$-\\frac{\\pi}{6}<x<\\frac{\\pi}{6}$\n減少：$-\\frac{\\pi}{2}<x<-\\frac{\\pi}{6}$、$\\frac{\\pi}{6}<x<\\frac{\\pi}{2}$\n極大値 $\\sqrt3$（$x=\\frac{\\pi}{6}$）、極小値 $-\\sqrt3$（$x=-\\frac{\\pi}{6}$）' }],
        draw: [{ fig: 'g2', items: ext.concat([{ k: 'label', at: [PI / 6, r3], text: '極大', c: 'y', size: 20, dx: 30, dy: -8, plain: true, anchor: 'start' }, { k: 'label', at: [-PI / 6, -r3], text: '極小', c: 'y', size: 20, dx: -30, dy: 10, plain: true, anchor: 'end' }]) }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) です。囲まれた部分は $-\\alpha\\le x\\le0$ と $0\\le x\\le\\alpha$ の2つ。$x>\\alpha$ の側はどこまでも下にのびるので、囲まれません。',
        add: [{ t: 'h', text: '(3)　面積の和 S' },
          { t: 'p', size: 'sm', text: '$0\\le x\\le\\alpha$ で $f(x)\\ge0$。奇関数なので、2つの部分の面積は等しい。' },
          { t: 'm', tex: 'S=2\\int_0^{\\alpha}f(x)\\,dx' },
          graph('g3', [{ k: 'area', f: F, a: 0, b: AL, c: 'y', alpha: 0.4 }, { k: 'area', f: '0', g: F, a: -AL, b: 0, c: 'b', alpha: 0.4 }].concat(zeros), 470)] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int\\tan x\\,dx$ は？（$C$ は積分定数、区間の中では $\\cos x>0$）',
        opts: ['$\\log(\\cos x)+C$', '$\\dfrac{1}{\\cos^2x}+C$', '$-\\log(\\sin x)+C$', '$-\\log(\\cos x)+C$'], ok: 3,
        why: { 0: '$(\\log\\cos x)\'=\\frac{-\\sin x}{\\cos x}=-\\tan x$。符号が逆です。', 1: 'それは $\\tan x$ を **微分** したものです。', 2: '$(\\log\\sin x)\'=\\frac{\\cos x}{\\sin x}$。$\\sin$ と $\\cos$ が逆です。' },
        good: '$\\tan x=-\\dfrac{(\\cos x)\'}{\\cos x}$ と見て $-\\log|\\cos x|+C$。この区間では $\\cos x>0$ なので絶対値はいりません。',
        add: [{ t: 'm', size: 'sm', tex: '\\int f(x)\\,dx=-2\\cos2x+3\\log(\\cos x)+C' }] } },
      { clear: true, cols: [0.6, 0.4], say: 'あとは $x=\\alpha$ での値です。$\\cos\\alpha=\\frac{\\sqrt6}{4}$ だけがわかっているので、$\\cos2\\alpha$ も $\\cos\\alpha$ で表します。',
        add: [{ t: 'h', text: '(3)　つづき：定積分の計算' },
          { t: 'm', size: 'sm', tex: '\\int_0^{\\alpha}f(x)\\,dx=\\Big[-2\\cos2x+3\\log(\\cos x)\\Big]_0^{\\alpha}' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: 'わかっていること', text: '$\\cos^2\\alpha=\\dfrac38$\n$\\log(\\cos\\alpha)=\\dfrac12\\log\\dfrac38$' }] },
      { ask: { type: 'choice', q: '$\\cos2\\alpha$ の値は？',
        opts: ['$\\dfrac14$', '$-\\dfrac58$', '$-\\dfrac14$', '$\\dfrac{\\sqrt6}{2}-1$'], ok: 2,
        why: { 0: '$2\\cdot\\frac38-1=-\\frac14$。符号に注意。', 1: '2倍角の公式は $2\\cos^2\\alpha-1$。$\\cos^2\\alpha$ に 2 をかけ忘れています。', 3: '$2\\cos\\alpha-1$ になっています。$\\cos$ は2乗します。' },
        good: '$\\cos2\\alpha=2\\cos^2\\alpha-1=\\dfrac34-1=-\\dfrac14$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&=\\Big(-2\\cdot\\Big(-\\frac14\\Big)+\\frac32\\log\\frac38\\Big)-(-2+0)\\\\ &=\\frac52+\\frac32\\log\\frac38\\end{aligned}' }] } },
      { say: '2 倍して答えです。$\\log\\frac38=-\\log\\frac83$ と書きかえると、「5 から引く」形になります。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'S=5+3\\log\\frac38=5-3\\log\\frac83' }] },
      { ask: { type: 'think', q: '$\\log2\\fallingdotseq0.693,\\ \\log3\\fallingdotseq1.099$ を使って、$S>0$ になっているか確かめよう。',
        hint: '$3\\log\\frac83=9\\log2-3\\log3$。',
        ans: '$S=5-9\\log2+3\\log3\\fallingdotseq5-6.237+3.297\\fallingdotseq2.06>0$',
        after: '面積が負や 0 になったら、どこかでまちがえています。答えの近似値を出す確かめは、記述式でも効果があります。',
        add: [{ t: 'm', size: 'sm', tex: 'S\\fallingdotseq2.06' }] } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案のポイント', say: '答案で点を落としやすい所をまとめます。とくに「$\\alpha$ のおき方」と「奇関数の確認」は、1行ずつ書いておきましょう。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', size: 'sm', label: '(1)', text: '「$\\cos\\alpha=\\frac{\\sqrt6}{4},\\ 0<\\alpha<\\frac{\\pi}{2}$ をみたす $\\alpha$ がただ1つある」と、$\\alpha$ を定義してから使う' },
          { t: 'box', c: 'p', size: 'sm', label: '(2)', text: "$f'(x)$ の符号を決めるのは $4\\cos^2x-3$ だけ（$4\\cos^2x+1>0$、$\\cos^2x>0$）と理由を書く" },
          { t: 'box', c: 'b', size: 'sm', label: '(3)', text: '$f(-x)=-f(x)$ を示してから 2 倍する。$0\\le x\\le\\alpha$ で $f(x)\\ge0$ も一言。$\\log$ の中が正であることも確認' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角関数の「因数分解 → 増減表 → 面積」は、数学Ⅲの微積分の定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
