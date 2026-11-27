/* 2026 佐賀大 理系 第3問の類題②（自作）：f(x)=tanx−8sinx（−π/2<x<π/2）の、x 軸との共有点・増減と極値・囲まれた部分の面積
   （類題①は 4sin2x−3tanx。ここは 2倍角を使わず、f'(x)=(1−8cos³x)/cos²x の符号を cosx と 1/2 の大小で決める形）
   答え（python3・sympy と数値積分で検算ずみ）：
   (1) f(x)=sinx(1−8cosx)/cosx。sinx=0 または cosx=1/8 → x=0, ±α（cosα=1/8、α≒1.4455）→ 3 個
   (2) f'(x)=1/cos²x−8cosx=(1−8cos³x)/cos²x。f'(x)>0 ⇔ cosx<1/2 ⇔ π/3<|x|<π/2。
       x=−π/3 で極大値 3√3、x=π/3 で極小値 −3√3（−π/2<x<−π/3 で増加、−π/3<x<π/3 で減少、π/3<x<π/2 で増加）
   (3) 奇関数。0<x<α で f<0。∫(8sinx−tanx)dx=−8cosx+log(cosx)。S=2∫[0,α](−f)dx=2{(−1+log(1/8))−(−8)}=2(7−3log2)=14−6log2≒9.8411
       （数値積分 9.84112 と一致） */
(function () {
  const F = 'tan(x)-8*sin(x)';
  const PI = Math.PI, r3 = Math.sqrt(3), AL = Math.acos(1 / 8), M3 = 3 * r3;
  const graph = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-1.9, -6.6, 1.9, 6.6], w: w || 470, h: Math.round((w || 470) * 0.8), items: [
    { k: 'axes', tx: [[-PI / 2, '−π/2'], [-PI / 3, '−π/3'], [PI / 3, 'π/3'], [PI / 2, 'π/2']], ty: [[M3, '3√3'], [-M3, '−3√3']] },
    { k: 'line', x: -PI / 2, dash: true, c: 'd' }, { k: 'line', x: PI / 2, dash: true, c: 'd' }
  ].concat(extra || [], [{ k: 'fn', f: F, a: -1.5, b: 1.5, c: 'w', wd: 3.5 }]) });   // グラフは最後にかいて、ぬりの上に出す
  const zeros = [{ k: 'pt', at: [AL, 0], name: 'α', dir: 'nw', c: 'p', r: 5 }, { k: 'pt', at: [-AL, 0], name: '−α', dir: 'ne', c: 'p', r: 5 }];
  const ext = [{ k: 'pt', at: [PI / 3, -M3], c: 'y', r: 5 }, { k: 'pt', at: [-PI / 3, M3], c: 'y', r: 5 },
    { k: 'seg', a: [PI / 3, 0], b: [PI / 3, -M3], c: 'y', dash: true, wd: 1.5 }, { k: 'seg', a: [-PI / 3, 0], b: [-PI / 3, M3], c: 'y', dash: true, wd: 1.5 }];
  const POINTS = [
    '$\\tan x=\\dfrac{\\sin x}{\\cos x}$ で $\\sin x$ をくくり出す。区間の中では $\\cos x>0$ なので、符号は $1-8\\cos x$ だけで決まる',
    "$f'(x)=\\dfrac{1-8\\cos^3x}{\\cos^2x}$。分母は正なので、$\\cos x$ と $\\dfrac12$ の大小（$\\cos^3x$ と $\\dfrac18$ の大小）で符号を決める",
    '奇関数なら面積は $2\\displaystyle\\int_0^{\\alpha}|f(x)|\\,dx$。$f(x)\\le0$ の部分は符号を反転して積分する。$\\displaystyle\\int\\tan x\\,dx=-\\log|\\cos x|+C$'
  ];

  HB.lesson({
    id: 'saga26-3b', field: '佐賀大型　数学（理系）', title: '2026 佐賀大 理系 第3問の類題② ― tan x−8sin x のグラフと面積', level: '2026年度 佐賀大学 理系 第3問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$-\\dfrac{\\pi}{2}<x<\\dfrac{\\pi}{2}$ で定義された関数 $f(x)=\\tan x-8\\sin x$ について、次の問いに答えよ。',
      parts: [
        '(1)　曲線 $y=f(x)$ と $x$ 軸の共有点の個数を求めよ。',
        '(2)　$f(x)$ の増減を調べ、極値を求めよ。',
        '(3)　曲線 $y=f(x)$ と $x$ 軸で囲まれた2つの部分の面積の和 $S$ を求めよ。'
      ],
      src: '※ 2026年度 佐賀大学 前期 理工学部 数学 第3問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '三角関数のグラフを、微分と積分で調べる問題です。数学Ⅲの基本がそろっています。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず形をつかみます。$f(-x)=-f(x)$ なので **奇関数**、グラフは原点について対称です。また $x\\to\\frac{\\pi}{2}-0$ では $\\tan x$ がどこまでも大きくなり、$f(x)\\to\\infty$ です。',
        add: [{ t: 'h', text: '読みかえ：対称性と区間の端' },
          { t: 'm', size: 'sm', tex: 'f(-x)=\\tan(-x)-8\\sin(-x)=-f(x)' },
          { t: 'm', size: 'sm', tex: '\\lim_{x\\to\\frac{\\pi}{2}-0}f(x)=\\infty,\\qquad \\lim_{x\\to-\\frac{\\pi}{2}+0}f(x)=-\\infty' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '$x\\ge0$ の側を調べれば、残りは原点対称で決まる。\n(3) の面積も「片方を求めて 2 倍」にできる。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\tan x=\\dfrac{\\sin x}{\\cos x}$ と書きかえて、$\\sin x$ でくくります。',
        add: [{ t: 'h', text: '(1)　x 軸との共有点の個数' },
          { t: 'm', tex: '\\begin{aligned}f(x)&=\\frac{\\sin x}{\\cos x}-8\\sin x\\\\ &=\\frac{\\sin x\\,(1-8\\cos x)}{\\cos x}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$f(x)=0$ と同じ条件は？',
        opts: ['$\\sin x=0$ だけ', '$\\sin x=0$ または $\\cos x=8$', '$\\sin x=0$ または $\\cos x=\\dfrac18$', '$\\cos x=\\dfrac18$ だけ'], ok: 2,
        why: { 0: 'もう1つの因数 $1-8\\cos x=0$ を忘れています。', 1: '$1-8\\cos x=0$ を解くと $\\cos x=\\frac18$。$8$ にはなりません（$\\cos x\\le1$）。', 3: '$\\sin x=0$（$x=0$）も解です。' },
        good: '分子 $=0$ が条件です（分母 $\\cos x$ は区間の中で 0 にならない）。',
        add: [{ t: 'm', tex: '\\sin x=0\\quad\\text{または}\\quad\\cos x=\\frac18' }] } },
      { say: '区間の中では $\\cos x>0$ で、$0<\\frac18<1$ だから、$\\cos x=\\frac18$ をみたす $x$ は $\\pm\\alpha$ の2つ。これに $x=0$ を加えて 3 個です。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos x=\\frac18\\ \\Longrightarrow\\ x=\\pm\\alpha', note: '$\\cos\\alpha=\\frac18$\n$0<\\alpha<\\frac{\\pi}{2}$' },
          { t: 'ans', label: '(1) 答', text: '共有点は $x=-\\alpha,\\ 0,\\ \\alpha$ の **3 個**' },
          graph('g1', zeros, 480)] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: "(2) です。$f'(x)$ を求めます。$\\tan x$ の微分は $\\dfrac{1}{\\cos^2x}$、$\\sin x$ の微分は $\\cos x$ です。",
        add: [{ t: 'h', text: '(2)　増減と極値' }] },
      { ask: { type: 'choice', q: "$f'(x)$ はどれ？",
        opts: ['$\\dfrac{1}{\\cos^2x}+8\\cos x$', '$\\dfrac{1}{\\cos^2x}-8\\cos x$', '$\\dfrac{1}{\\sin^2x}-8\\cos x$', '$\\dfrac{1}{\\cos^2x}-8\\sin x$'], ok: 1,
        why: { 0: '$-8\\sin x$ の微分は $-8\\cos x$。符号が変わるのは $\\cos x$ を微分したときです。', 2: '$(\\tan x)\'=\\frac{1}{\\cos^2x}$ です。分母は $\\sin^2x$ ではありません。', 3: '$(\\sin x)\'=\\cos x$ です。$\\sin x$ のまま残っています。' },
        good: "$f'(x)=\\dfrac{1}{\\cos^2x}-8\\cos x$。通分すると分子は $1-8\\cos^3x$ です。",
        add: [{ t: 'm', tex: "f'(x)=\\frac{1}{\\cos^2x}-8\\cos x=\\frac{1-8\\cos^3x}{\\cos^2x}" }] } },
      { say: '分母 $\\cos^2x$ は正なので、分子 $1-8\\cos^3x$ の符号を見ます。$\\cos^3x$ と $\\frac18$ の大小は、$\\cos x$ と $\\frac12$ の大小と同じです。',
        add: [{ t: 'm', size: 'sm', tex: "f'(x)>0\\iff\\cos^3x<\\frac18\\iff\\cos x<\\frac12", note: '$\\cos x>0$ なので\n3乗しても向きは同じ' }] },
      { ask: { type: 'choice', q: "$\\cos x<\\dfrac12$ をみたす $x$（$-\\dfrac{\\pi}{2}<x<\\dfrac{\\pi}{2}$）、つまり $f'(x)>0$ の範囲は？",
        opts: ['$-\\dfrac{\\pi}{3}<x<\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{6}<|x|<\\dfrac{\\pi}{2}$', '$\\dfrac{\\pi}{3}<x<\\dfrac{\\pi}{2}$ だけ', '$\\dfrac{\\pi}{3}<|x|<\\dfrac{\\pi}{2}$'], ok: 3,
        why: { 0: '不等号の向きが逆です。$|x|$ が小さいほど $\\cos x$ は大きいので、$\\cos x>\\frac12$ の範囲です。', 1: '$\\cos\\frac{\\pi}{6}=\\frac{\\sqrt3}{2}$。$\\cos x=\\frac12$ となるのは $x=\\frac{\\pi}{3}$ です。', 2: '$x<-\\frac{\\pi}{3}$ でも $\\cos x<\\frac12$ です。$\\cos x$ は偶関数。' },
        good: "$\\cos x=\\frac12$ は $x=\\pm\\frac{\\pi}{3}$。$f'(x)>0$ は $\\frac{\\pi}{3}<|x|<\\frac{\\pi}{2}$ で、$|x|<\\frac{\\pi}{3}$ では $f'(x)<0$ です。",
        add: [{ t: 'p', size: 'sm', text: "$f'(x)>0\\iff\\dfrac{\\pi}{3}<|x|<\\dfrac{\\pi}{2}$" }] } },

      { clear: true, cols: [0.56, 0.44], say: '増減表にまとめます。$x=-\\frac{\\pi}{3}$ で極大、$x=\\frac{\\pi}{3}$ で極小。極値は、奇関数なので符号だけがちがいます。',
        add: [{ t: 'h', text: '(2)　つづき：増減表' },
          { t: 'tbl', size: 'sm', rows: [['$x$', '$\\left(-\\frac{\\pi}{2}\\right)$', '$\\cdots$', '$-\\frac{\\pi}{3}$', '$\\cdots$', '$\\frac{\\pi}{3}$', '$\\cdots$', '$\\left(\\frac{\\pi}{2}\\right)$'], ["$f'(x)$", '', '$+$', '$0$', '$-$', '$0$', '$+$', ''], ['$f(x)$', '', '↗', '極大', '↘', '極小', '↗', '']] },
          graph('g2', [], 470)] },
      { ask: { type: 'choice', q: '極小値 $f\\left(\\dfrac{\\pi}{3}\\right)$ の値は？',
        opts: ['$3\\sqrt3$', '$-3\\sqrt3$', '$-4\\sqrt3$', '$\\sqrt3-4$'], ok: 1,
        why: { 0: '$\\tan\\frac{\\pi}{3}-8\\sin\\frac{\\pi}{3}$ は負です。$3\\sqrt3$ は極大値のほう。', 2: '$-8\\sin\\frac{\\pi}{3}=-4\\sqrt3$ だけで、$\\tan\\frac{\\pi}{3}=\\sqrt3$ を足し忘れています。', 3: '$\\sin\\frac{\\pi}{3}=\\frac{\\sqrt3}{2}$（$\\frac12$ は $\\cos\\frac{\\pi}{3}$）です。' },
        good: '$\\tan\\dfrac{\\pi}{3}-8\\sin\\dfrac{\\pi}{3}=\\sqrt3-4\\sqrt3=-3\\sqrt3$。',
        add: [{ t: 'ans', label: '(2) 答', text: '増加：$-\\frac{\\pi}{2}<x<-\\frac{\\pi}{3}$、$\\frac{\\pi}{3}<x<\\frac{\\pi}{2}$\n減少：$-\\frac{\\pi}{3}<x<\\frac{\\pi}{3}$\n極大値 $3\\sqrt3$（$x=-\\frac{\\pi}{3}$）、極小値 $-3\\sqrt3$（$x=\\frac{\\pi}{3}$）' }],
        draw: [{ fig: 'g2', items: ext.concat([{ k: 'label', at: [PI / 3, -M3], text: '極小', c: 'y', size: 20, dx: 30, dy: 10, plain: true, anchor: 'start' }, { k: 'label', at: [-PI / 3, M3], text: '極大', c: 'y', size: 20, dx: -30, dy: -8, plain: true, anchor: 'end' }]) }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) です。囲まれた部分は $-\\alpha\\le x\\le0$ と $0\\le x\\le\\alpha$ の2つ。$x>\\alpha$ の側はどこまでも上にのびるので、囲まれません。',
        add: [{ t: 'h', text: '(3)　面積の和 S' },
          { t: 'p', size: 'sm', text: '奇関数なので、2つの部分の面積は等しい。$0\\le x\\le\\alpha$ ではグラフが $x$ 軸の **下** にある。' },
          { t: 'm', tex: 'S=2\\int_0^{\\alpha}\\{-f(x)\\}\\,dx' },
          graph('g3', [{ k: 'area', f: F, a: 0, b: AL, c: 'y', alpha: 0.4 }, { k: 'area', f: '0', g: F, a: -AL, b: 0, c: 'b', alpha: 0.4 }].concat(zeros), 470)] },
      { ask: { type: 'think', q: '$0<x<\\alpha$ で $f(x)<0$ となることを、(1) の因数分解を使って確かめよう。',
        hint: '$f(x)=\\dfrac{\\sin x\\,(1-8\\cos x)}{\\cos x}$。$\\sin x>0$、$\\cos x>0$、$\\cos x>\\frac18$ の3つを見る。',
        ans: '$0<x<\\alpha$ では $\\sin x>0,\\ \\cos x>0,\\ \\cos x>\\dfrac18$ より $1-8\\cos x<0$。よって $f(x)<0$',
        after: '$x$ 軸の下にある部分は $-f(x)$ を積分します。符号を確かめずに $\\int_0^{\\alpha}f(x)\\,dx$ を 2 倍すると、負の値が出てしまいます。',
        add: [{ t: 'm', size: 'sm', tex: '0<x<\\alpha\\ \\Longrightarrow\\ f(x)<0' }] } },
      { ask: { type: 'choice', q: '$\\displaystyle\\int(8\\sin x-\\tan x)\\,dx$ は？（$C$ は積分定数、区間の中では $\\cos x>0$）',
        opts: ['$8\\cos x+\\log(\\cos x)+C$', '$-8\\cos x-\\log(\\cos x)+C$', '$-8\\cos x+\\log(\\cos x)+C$', '$-8\\cos x-\\log(\\sin x)+C$'], ok: 2,
        why: { 0: '$\\int\\sin x\\,dx=-\\cos x$。$8\\sin x$ の積分は $-8\\cos x$ です。', 1: '$\\int\\tan x\\,dx=-\\log(\\cos x)$ なので、$-\\tan x$ の積分は $+\\log(\\cos x)$ です。', 3: '$\\int\\tan x\\,dx$ に $\\log(\\sin x)$ は出てきません。$\\tan x=-\\frac{(\\cos x)\'}{\\cos x}$ と見ます。' },
        good: '$\\tan x=-\\dfrac{(\\cos x)\'}{\\cos x}$ と見て $\\int\\tan x\\,dx=-\\log|\\cos x|+C$。区間の中では絶対値はいりません。',
        add: [{ t: 'm', size: 'sm', tex: '\\int\\{-f(x)\\}\\,dx=-8\\cos x+\\log(\\cos x)+C' }] } },
      { clear: true, cols: [0.6, 0.4], say: 'あとは $x=\\alpha$ での値です。$\\cos\\alpha=\\frac18$ をそのまま代入できます。$\\log\\frac18=-3\\log2$ です。',
        add: [{ t: 'h', text: '(3)　つづき：定積分の計算' },
          { t: 'm', size: 'sm', tex: '\\int_0^{\\alpha}\\{-f(x)\\}\\,dx=\\Big[-8\\cos x+\\log(\\cos x)\\Big]_0^{\\alpha}' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: 'わかっていること', text: '$\\cos\\alpha=\\dfrac18$\n$\\cos0=1$\n$\\log\\dfrac18=-3\\log2$' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\Big[-8\\cos x+\\log(\\cos x)\\Big]_0^{\\alpha}$ の値は？',
        opts: ['$9+3\\log2$', '$7-3\\log2$', '$-9-3\\log2$', '$7+3\\log2$'], ok: 1,
        why: { 0: '上端 $\\alpha$ の値は $-1-3\\log2$。下端 $-8$ を引くと $+8$ です。$-1+8=7$。', 2: '上端 − 下端の順です。逆に引いています。', 3: '$\\log\\frac18=-3\\log2$。符号を見落としています。' },
        good: '$(-8\\cdot\\frac18+\\log\\frac18)-(-8\\cdot1+\\log1)=(-1-3\\log2)+8=7-3\\log2$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&=\\Big(-1+\\log\\frac18\\Big)-(-8+0)\\\\ &=7-3\\log2\\end{aligned}' }] } },
      { say: '2 倍して答えです。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'S=2(7-3\\log2)=14-6\\log2' }] },
      { ask: { type: 'think', q: '$\\log2\\fallingdotseq0.693$ を使って $S$ を近似し、図の見た目と合うか確かめよう。（片方の面積 $\\frac S2$ は、幅 $\\alpha\\fallingdotseq1.45$・高さ $3\\sqrt3\\fallingdotseq5.2$ の長方形より小さいはず）',
        hint: '$\\dfrac S2=7-3\\log2$。長方形の面積は $1.45\\times5.2$。',
        ans: '$\\dfrac S2=7-3\\times0.693\\fallingdotseq4.92$、長方形は $1.45\\times5.2\\fallingdotseq7.5$。$4.92<7.5$ で合う。$S\\fallingdotseq9.84$',
        after: '面積が負や 0 になったり、図の大きさとかけ離れたりしたら、どこかでまちがえています。答えの近似値を出す確かめは、記述式でも効果があります。',
        add: [{ t: 'm', size: 'sm', tex: 'S\\fallingdotseq9.84' }] } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案のポイント', say: '答案で点を落としやすい所をまとめます。とくに「$\\alpha$ のおき方」と「符号の確認」は、1行ずつ書いておきましょう。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', size: 'sm', label: '(1)', text: '「$\\cos\\alpha=\\frac18,\\ 0<\\alpha<\\frac{\\pi}{2}$ をみたす $\\alpha$ がただ1つある」と、$\\alpha$ を定義してから使う' },
          { t: 'box', c: 'p', size: 'sm', label: '(2)', text: "$f'(x)$ の符号を決めるのは $1-8\\cos^3x$ だけ（$\\cos^2x>0$）。$\\cos x>0$ なので $\\cos^3x<\\frac18\\iff\\cos x<\\frac12$ と理由を書く" },
          { t: 'box', c: 'b', size: 'sm', label: '(3)', text: '$f(-x)=-f(x)$ を示してから 2 倍する。$0\\le x\\le\\alpha$ で $f(x)\\le0$ も一言。$\\log$ の中が正であることも確認' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三角関数の「因数分解 → 増減表 → 面積」は、数学Ⅲの微積分の定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
