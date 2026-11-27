/* 九大型（理系）2025 第2問の類題②（自作）：数学Ⅲ 積分法 ― tan の導関数を tan で表し、tan の分数式の定積分を t=tan x の置換で有理関数の積分に直す
   元の問題はうつしていない（「tan の導関数を tan で表す」「tan の分数式を置換積分で有理関数に直し、因数分解で約分して部分分数分解」というねらいと形式だけを合わせた自作問題。類題①とは、被積分関数・係数・(1) の積分がすべてちがう）。
   (1) (tan x)' = 1/cos²x = 1+tan²x。∫₀^{π/4} tan x/cos²x dx = [tan²x/2] = 1/2
   (2) t=tan x、dx=dt/(1+t²)、x:0→π/4 で t:0→1。分子 2t³+t²+2t+1=(2t+1)(t²+1) が約分で消えて (2t+1)/((t+1)(t+3)) = −(1/2)/(t+1) + (5/2)/(t+3)
       ∫₀¹ = [−(1/2)log(t+1)+(5/2)log(t+3)]₀¹ = (9/2)log2 − (5/2)log3 = (1/2)log(512/243) ≒ 0.3726（数値積分でも一致）
   誤答：下端の引き忘れ (9/2)log2、符号逆 (1/2)log(243/512)、係数 1/2 の落とし log(512/243)。
   別の見方：g(t)=(2t+1)/((t+1)(t+3))、g(0)=1/3、g(1)=3/8、g(1/2)=8/21。
   発展（考えてみよう）：∫₀^{π/4} dx/(cos²x(tan x+1)) = ∫₀¹ dt/(t+1) = log 2。
   python3（sympy・mpmath）で検算ずみ。 */
(function () {
  const POINTS = [
    "$(\\tan x)'=\\dfrac1{\\cos^2x}=1+\\tan^2x$。$\\tan x\\cdot(\\tan x)'$ の形は $\\Big[\\dfrac{\\tan^2x}{2}\\Big]$ と、そのまま積分できる",
    '$\\tan x$ だけの分数式は $t=\\tan x$ と置換。$dx=\\dfrac{dt}{1+t^2}$、積分区間も $t$ に変える。$1+t^2$ が約分で消えることが多い',
    '有理関数の積分は「因数分解 → 約分 → 部分分数分解」。最後に「正の値か」「大きさは合うか」を確かめる'
  ];
  const FX = '(2*tan(x)**3+tan(x)**2+2*tan(x)+1)/(tan(x)**2+4*tan(x)+3)';
  const GT = '(2*x+1)/((x+1)*(x+3))';
  const Q4 = Math.PI / 4;
  const tanFig = (id) => ({ t: 'fig', id, col: 1, view: [-0.14, -0.3, 1.0, 2.4], w: 380, h: 330, items: [
    { k: 'axes', tx: [[Q4, 'π/4']], ty: [[1, '1'], [2, '2']] },
    { k: 'area', f: 'tan(x)*(1+tan(x)**2)', a: 0, b: Q4, c: 'y', alpha: 0.3, label: 'S', lat: [0.45, 0.4] },
    { k: 'fn', f: 'tan(x)*(1+tan(x)**2)', a: 0, b: 0.9, label: 'y = tan x / cos²x', lat: [0.08, 2.15], la: 'start' },
    { k: 'seg', a: [Q4, 0], b: [Q4, 2], c: 'd', dash: true, wd: 2 }] });
  const fFig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.16, -0.17, 1.0, 0.95], w: 380, h: 330, items: [
    { k: 'axes', tx: [[Q4, 'π/4']], ty: [[1 / 3, '1/3'], [3 / 4, '3/4']] },
    { k: 'seg', a: [0, 1 / 3], b: [Q4, 1 / 3], c: 'd', dash: true, wd: 1.5 },
    { k: 'seg', a: [0, 3 / 4], b: [Q4, 3 / 4], c: 'd', dash: true, wd: 1.5 },
    { k: 'fn', f: FX, a: 0, b: 0.93, c: 'w' },
    { k: 'seg', a: [Q4, 0], b: [Q4, 3 / 4], c: 'd', dash: true, wd: 2 }].concat(extra || []) });
  const gFig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.15, -0.08, 1.15, 0.5], w: 400, h: 290, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1 / 3, '1/3'], [3 / 8, '3/8']], xl: 't', yl: '' },
    { k: 'area', f: GT, a: 0, b: 1, c: 'y', alpha: 0.3, label: 'S', lat: [0.4, 0.15] },
    { k: 'fn', f: GT, a: 0, b: 1.1, c: 'w', label: 'y = g(t)', lat: [0.55, 0.43], la: 'start' },
    { k: 'seg', a: [1, 0], b: [1, 3 / 8], c: 'd', dash: true, wd: 2 }].concat(extra || []) });

  HB.lesson({
    id: 'kyushu25-2b', noDec: true, field: '九大型　数学（理系）', title: '2025 九大 理系 第2問の類題② ― tan の分数式の定積分と置換積分', level: '2025年度 九州大学 理系 第2問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '次の問いに答えよ。',
      parts: [
        '(1)　$\\tan x$ の導関数を、$\\tan x$ を用いて表せ。また、定積分 $\\displaystyle\\int_0^{\\frac{\\pi}{4}}\\frac{\\tan x}{\\cos^2x}\\,dx$ を求めよ。',
        '(2)　定積分 $\\displaystyle\\int_0^{\\frac{\\pi}{4}}\\frac{2\\tan^3x+\\tan^2x+2\\tan x+1}{\\tan^2x+4\\tan x+3}\\,dx$ を求めよ。'
      ],
      src: '※ 2025年度 九州大学 前期 理系 第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', say: '三角関数の微分と置換積分の問題です。(1) で作った道具を、(2) でそのまま使う誘導になっています。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '$\\tan x=\\dfrac{\\sin x}{\\cos x}$ と見て、商の微分法で計算します。分子は $\\cos^2x+\\sin^2x$ になります。',
        add: [{ t: 'h', text: '(1)　tan x の導関数' },
          { t: 'm', tex: "(\\tan x)'=\\left(\\frac{\\sin x}{\\cos x}\\right)'=\\frac{\\cos x\\cdot\\cos x-\\sin x\\cdot(-\\sin x)}{\\cos^2x}" },
          { t: 'm', tex: '=\\frac{\\cos^2x+\\sin^2x}{\\cos^2x}=\\frac1{\\cos^2x}' }] },
      { ask: { type: 'choice', q: '$\\dfrac1{\\cos^2x}$ を $\\tan x$ で表すと？',
        opts: ['$1-\\tan^2x$', '$\\tan^2x$', '$\\dfrac1{1+\\tan^2x}$', '$1+\\tan^2x$'], ok: 3,
        why: { 0: '$\\sin^2x+\\cos^2x=1$ を $\\cos^2x$ で割ると $\\tan^2x+1$。符号は＋です。', 1: '1 を忘れています。$\\frac{\\sin^2x+\\cos^2x}{\\cos^2x}=\\tan^2x+1$。', 2: 'それは逆数で、$\\cos^2x$ のほうです。' },
        good: '$\\dfrac1{\\cos^2x}=\\dfrac{\\sin^2x+\\cos^2x}{\\cos^2x}=\\tan^2x+1$。',
        add: [{ t: 'ans', label: '(1) 答', tex: "(\\tan x)'=1+\\tan^2x" }] } },
      { clear: true, part: '(1) 後半', say: '後半です。被積分関数は $\\tan x\\cdot\\dfrac1{\\cos^2x}=\\tan x\\cdot(\\tan x)\'$。$f\\cdot f\'$ の形は、$\\dfrac{f^2}{2}$ を微分したものです。',
        add: [{ t: 'h', text: '(1)　後半：tan x / cos²x の定積分' },
          { t: 'm', tex: "\\frac{\\tan x}{\\cos^2x}=\\tan x\\cdot(\\tan x)'", note: '前半の結果を使う' },
          { t: 'm', tex: "\\left(\\frac{\\tan^2x}{2}\\right)'=\\tan x\\cdot(\\tan x)'" },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}\\frac{\\tan x}{\\cos^2x}\\,dx=\\Big[\\,\\frac{\\tan^2x}{2}\\,\\Big]_0^{\\frac{\\pi}{4}}' },
          tanFig('t1')] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\frac{\\pi}{4}}\\frac{\\tan x}{\\cos^2x}\\,dx$ の値は？',
        opts: ['$1$', '$2$', '$\\dfrac12$', '$\\dfrac14$'], ok: 2,
        why: { 0: '$\\frac12$ を落としています。$\\left(\\tan^2x\\right)\'=2\\tan x\\cdot(\\tan x)\'$ なので、積分は $\\frac{\\tan^2x}{2}$。', 1: 'それは $x=\\frac{\\pi}{4}$ での被積分関数の値 $1\\cdot2$ です。面積ではありません。', 3: '$\\frac12$ を2回かけています。$\\frac{\\tan^2\\frac{\\pi}{4}}{2}=\\frac12$ です。' },
        good: '$\\Big[\\dfrac{\\tan^2x}{2}\\Big]_0^{\\frac{\\pi}{4}}=\\dfrac{1}{2}-0=\\dfrac12$。図の面積とも合います。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\int_0^{\\frac{\\pi}{4}}\\frac{\\tan x}{\\cos^2x}\\,dx=\\frac12' }] } },

      // ---------- (2) 方針 ----------
      { clear: true, part: '(2)', say: '(2) の被積分関数は、$\\tan x$ だけでできた分数式。$t=\\tan x$ と置換すると、$t$ の分数式（有理関数）の積分になります。$dx$ の変換に (1) を使います。',
        add: [{ t: 'h', text: '(2)　tan の分数式の定積分' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '被積分関数が $\\tan x$ だけの式 → $t=\\tan x$ と置換\n(1) より $\\dfrac{dt}{dx}=1+\\tan^2x=1+t^2$' },
          fFig('f1')] },
      { ask: { type: 'choice', q: '$t=\\tan x$ のとき、$dx$ を $t$ で表すと？',
        opts: ['$(1+t^2)\\,dt$', '$\\dfrac{dt}{1-t^2}$', '$\\dfrac{dt}{t^2}$', '$\\dfrac{dt}{1+t^2}$'], ok: 3,
        why: { 0: '逆です。$\\frac{dt}{dx}=1+t^2$ なので、$dx=\\frac{dt}{1+t^2}$。', 1: '(1) の結果は $1+\\tan^2x$。符号は＋です。', 2: '$\\frac{dt}{dx}=1+t^2$ の 1 を落としています。' },
        good: '$\\dfrac{dt}{dx}=1+t^2$ より $dx=\\dfrac{dt}{1+t^2}$。積分区間も $t$ に変えます。',
        add: [{ t: 'm', tex: 'dx=\\frac{dt}{1+t^2}' },
          { t: 'tbl', size: 'sm', rows: [['$x$', '$0\\ \\to\\ \\dfrac{\\pi}{4}$'], ['$t$', '$0\\ \\to\\ 1$']] }] } },
      { clear: true, cols: [1], say: '置きかえると、$t$ の分数式の積分になります。分母の $1+t^2$ は、$dx$ から出てきたものです。',
        add: [{ t: 'h', text: '(2)　t の積分に直す' },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}\\frac{2\\tan^3x+\\tan^2x+2\\tan x+1}{\\tan^2x+4\\tan x+3}\\,dx=\\int_0^1\\frac{2t^3+t^2+2t+1}{t^2+4t+3}\\cdot\\frac{1}{\\hy{1+t^2}}\\,dt' }] },
      { ask: { type: 'choice', q: '分子 $2t^3+t^2+2t+1$ を因数分解すると？',
        opts: ['$(2t-1)(t^2+1)$', '$(2t+1)(t^2-1)$', '$(2t+1)(t^2+1)$', '$(t+1)(2t^2+1)$'], ok: 2,
        why: { 0: '展開すると $2t^3-t^2+2t-1$。$t^2$ と定数の符号が合いません。', 1: '展開すると $2t^3+t^2-2t-1$。$t$ の係数の符号が合いません。', 3: '展開すると $2t^3+2t^2+t+1$ になり、合いません。' },
        good: '前2つ・後ろ2つで組にして $t^2(2t+1)+(2t+1)=(2t+1)(t^2+1)$。$t^2+1$ が約分できます。',
        add: [{ t: 'm', tex: '\\frac{(2t+1)\\hy{(t^2+1)}}{(t+1)(t+3)}\\cdot\\frac{1}{\\hy{1+t^2}}=\\frac{2t+1}{(t+1)(t+3)}', note: '分母も因数分解' }] } },
      { ask: { type: 'think', q: '$\\dfrac{2t+1}{(t+1)(t+3)}=\\dfrac{A}{t+1}+\\dfrac{B}{t+3}$ と部分分数に分けよう。',
        hint: '分母をはらうと $2t+1=A(t+3)+B(t+1)$。$t=-1$、$t=-3$ を代入する。',
        ans: '$A=-\\dfrac12,\\ B=\\dfrac52$　つまり　$-\\dfrac{1}{2(t+1)}+\\dfrac{5}{2(t+3)}$',
        after: '$t=-1$ で $-1=2A$、$t=-3$ で $-5=-2B$。通分して $2t+1$ にもどることも確かめましょう。',
        add: [{ t: 'm', tex: '\\frac{2t+1}{(t+1)(t+3)}=-\\frac{1}{2(t+1)}+\\frac{5}{2(t+3)}' }] } },

      // ---------- (2) 計算 ----------
      { clear: true, part: '(2) 計算', say: 'あとは対数の積分。$0\\le t\\le1$ では $t+1>0,\\ t+3>0$ なので、絶対値の記号はいりません。',
        add: [{ t: 'h', text: '(2)　つづき：積分の計算' },
          { t: 'm', tex: '\\int_0^1\\left(-\\frac{1}{2(t+1)}+\\frac{5}{2(t+3)}\\right)dt' },
          { t: 'm', tex: '=\\Big[-\\frac12\\log(t+1)+\\frac52\\log(t+3)\\Big]_0^1' },
          fFig('f2', [{ k: 'area', f: FX, a: 0, b: Q4, c: 'y', alpha: 0.3, label: 'S', lat: [0.4, 0.15] }])] },
      { ask: { type: 'choice', q: 'この値は？',
        opts: ['$\\dfrac92\\log2$', '$\\dfrac12\\log\\dfrac{243}{512}$', '$\\log\\dfrac{512}{243}$', '$\\dfrac12\\log\\dfrac{512}{243}$'], ok: 3,
        why: { 0: '下端 $t=0$ の値 $\\frac52\\log3$ を引き忘れています。', 1: '部分分数の符号が逆になっています。被積分関数は正なので、値が負なのはおかしい。', 2: '係数 $\\frac12$ を落としています。$\\frac92\\log2-\\frac52\\log3$ は $\\frac12$ でくくれます。' },
        good: '$\\left(-\\frac12\\log2+\\frac52\\log4\\right)-\\frac52\\log3=\\frac92\\log2-\\frac52\\log3=\\frac12\\log\\frac{512}{243}$。',
        add: [{ t: 'm', tex: '=\\left(-\\frac12\\log2+\\frac52\\log4\\right)-\\left(0+\\frac52\\log3\\right)=\\frac92\\log2-\\frac52\\log3' },
          { t: 'ans', label: '(2) 答', tex: '\\frac12\\log\\frac{512}{243}\\quad\\left(=\\frac92\\log2-\\frac52\\log3\\right)' }] } },
      { say: '見直し：$\\frac12\\log\\frac{512}{243}\\approx0.373$。被積分関数は $\\frac13$ から $\\frac34$ の間で、幅は $\\frac{\\pi}{4}\\approx0.785$。面積は 0.26〜0.59 の間のはずで、合っています。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: '見直し', text: '$\\frac13\\cdot\\frac{\\pi}{4}\\approx0.26<S<\\frac34\\cdot\\frac{\\pi}{4}\\approx0.59$\n$S=\\frac12\\log\\frac{512}{243}\\approx0.373$　✓' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: '置換のあとの式 $g(t)=\\dfrac{2t+1}{(t+1)(t+3)}$ のグラフです。置換積分では、$x$ の面積と $t$ の面積が、形はちがっても同じ値になります。',
        add: [{ t: 'h', text: '別の見方：t のグラフで見る' },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}f(x)\\,dx=\\int_0^1g(t)\\,dt=S', size: 'sm' },
          { t: 'p', size: 'sm', text: '区間の幅は $\\frac{\\pi}{4}$ から $1$ に変わり、\n高さは $\\frac13\\sim\\frac34$ から $\\frac13\\sim\\frac38$ ほどに変わる' },
          gFig('g1')] },
      { ask: { type: 'choice', q: '$g(t)=\\dfrac{2t+1}{(t+1)(t+3)}$ の $g(0)$ と $g(1)$ は？',
        opts: ['$\\dfrac13$ と $\\dfrac34$', '$1$ と $\\dfrac38$', '$\\dfrac13$ と $\\dfrac12$', '$\\dfrac13$ と $\\dfrac38$'], ok: 3,
        why: { 0: '$\\frac34$ は置換前の $f\\left(\\frac{\\pi}{4}\\right)$。$g$ は $1+t^2$ で割ったあとの式です。', 1: '$g(0)=\\frac{1}{1\\cdot3}$。分母の $(t+3)$ を忘れています。', 2: '$g(1)=\\frac{3}{2\\cdot4}$。分母の $(t+3)=4$ を 3 にしています。' },
        good: '$g(0)=\\dfrac{1}{3}$、$g(1)=\\dfrac{3}{2\\cdot4}=\\dfrac38$。幅 1 の長方形と比べても $S\\approx0.373$ は自然です。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: '見直し', text: '$g\\left(\\frac12\\right)=\\frac{8}{21}\\approx0.381$\n幅 1 で高さ 0.33〜0.38 → $S\\approx0.373$ ✓' }] } },
      { say: '答案では、置換・区間・約分の理由を一言ずつ書きます。$t=\\tan x$ とおくと $\\dfrac{dt}{dx}=1+t^2$（(1) より）、$x:0\\to\\frac{\\pi}{4}$ で $t:0\\to1$ です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '答案のポイント', text: '「$t=\\tan x$ とおくと $\\dfrac{dt}{dx}=1+t^2$（(1) より）」「$x:0\\to\\frac{\\pi}{4}$ のとき $t:0\\to1$」\n「$2t^3+t^2+2t+1=(2t+1)(t^2+1)$ より約分」「$t+1>0$ なので絶対値は不要」' }] },

      // ---------- 発展 ----------
      { clear: true, cols: [1], part: '発展', say: '最後に、(1) の結果を使う別の積分です。分母に $\\cos^2x$ があるときは、$\\dfrac{1}{\\cos^2x}=(\\tan x)\'$ を $dt$ に見立てます。',
        add: [{ t: 'h', text: '発展：cos²x が分母にあるとき' },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}\\frac{dx}{\\cos^2x\\,(\\tan x+1)}' }] },
      { ask: { type: 'think', q: '$t=\\tan x$ と置換して、この定積分を求めよう。',
        hint: '$\\dfrac{dx}{\\cos^2x}=dt$。区間は $t:0\\to1$。',
        ans: '$\\displaystyle\\int_0^1\\frac{dt}{t+1}=\\Big[\\log(t+1)\\Big]_0^1=\\log2$',
        after: '$\\frac{dt}{dx}=\\frac{1}{\\cos^2x}$ をそのまま使うと、$dx=\\frac{dt}{1+t^2}$ を経由せずに済みます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。(1) の小さな結果が (2) の置換の道具になる、九大らしい誘導でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
