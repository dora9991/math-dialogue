/* 九大型（理系）2025 第2問の類題（自作）：数学Ⅲ 積分法 ― tan の導関数を tan で表し、tan の分数式の定積分を t=tan x の置換で有理関数の積分に直す
   元の問題はうつしていない（「tan の導関数を tan で表す」「tan の分数式を置換積分で有理関数に直し、因数分解で約分して部分分数分解」というねらいと形式だけを合わせた自作問題）。
   (1) (tan x)' = 1/cos²x = 1+tan²x。∫₀^{π/4} tan²x dx = [tan x − x] = 1 − π/4 ≒ 0.2146
   (2) t=tan x、dx=dt/(1+t²)、x:0→π/4 で t:0→1。分子 t³+t²+t+1=(t+1)(t²+1) が約分で消えて (t+1)/((t+2)(t+3)) = −1/(t+2) + 2/(t+3)
       ∫₀¹ = [−log(t+2)+2log(t+3)]₀¹ = 5log2 − 3log3 = log(32/27) ≒ 0.1699（数値積分でも一致）
   誤答：下端の引き忘れ log(16/3)、符号逆 log(27/32)、係数 2 の落とし log(8/9)。
   別の見方：(sin x+cos x)/(cos x(sin x+2cos x)(sin x+3cos x)) は分母・分子を cos³x で割ると同じ式。python3（sympy・mpmath）で検算ずみ。 */
(function () {
  const POINTS = [
    "$(\\tan x)'=\\dfrac1{\\cos^2x}=1+\\tan^2x$。$\\tan^2x=(\\tan x)'-1$ と見れば $\\displaystyle\\int\\tan^2x\\,dx=\\tan x-x+C$",
    '$\\tan x$ だけの分数式は $t=\\tan x$ と置換。$dx=\\dfrac{dt}{1+t^2}$、積分区間も $t$ に変える。$1+t^2$ が約分で消えることが多い',
    '有理関数の積分は「因数分解 → 約分 → 部分分数分解」。最後に「正の値か」「大きさは合うか」を確かめる'
  ];
  const FX = '(tan(x)**3+tan(x)**2+tan(x)+1)/(tan(x)**2+5*tan(x)+6)';
  const Q4 = Math.PI / 4;
  const tanFig = (id) => ({ t: 'fig', id, col: 1, view: [-0.14, -0.16, 1.0, 1.22], w: 380, h: 350, items: [
    { k: 'axes', tx: [[Q4, 'π/4']], ty: [[1, '1']] },
    { k: 'area', f: 'tan(x)**2', a: 0, b: Q4, c: 'y', alpha: 0.3 },
    { k: 'fn', f: 'tan(x)**2', a: 0, b: 0.86, label: 'y = tan²x', lat: [0.3, 1.0] },
    { k: 'seg', a: [Q4, 0], b: [Q4, 1], c: 'd', dash: true, wd: 2 }] });
  const fFig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.16, -0.07, 1.0, 0.43], w: 380, h: 330, items: [
    { k: 'axes', tx: [[Q4, 'π/4']], ty: [[1 / 6, '1/6'], [1 / 3, '1/3']] },
    { k: 'seg', a: [0, 1 / 3], b: [Q4, 1 / 3], c: 'd', dash: true, wd: 1.5 },
    { k: 'fn', f: FX, a: 0, b: 0.93, c: 'w' },
    { k: 'seg', a: [Q4, 0], b: [Q4, 1 / 3], c: 'd', dash: true, wd: 2 }].concat(extra || []) });

  HB.lesson({
    id: 'kyushu25-2', noDec: true, field: '九大型　数学（理系）', title: '2025 九大 理系 第2問の類題 ― tan の分数式の定積分と置換積分', level: '2025年度 九州大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '次の問いに答えよ。',
      parts: [
        '(1)　$\\tan x$ の導関数を、$\\tan x$ を用いて表せ。また、定積分 $\\displaystyle\\int_0^{\\frac{\\pi}{4}}\\tan^2x\\,dx$ を求めよ。',
        '(2)　定積分 $\\displaystyle\\int_0^{\\frac{\\pi}{4}}\\frac{\\tan^3x+\\tan^2x+\\tan x+1}{\\tan^2x+5\\tan x+6}\\,dx$ を求めよ。'
      ],
      src: '※ 2025年度 九州大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
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
        opts: ['$1-\\tan^2x$', '$\\tan^2x$', '$1+\\tan^2x$', '$\\dfrac1{1+\\tan^2x}$'], ok: 2,
        why: { 0: '$\\sin^2x+\\cos^2x=1$ を $\\cos^2x$ で割ると $\\tan^2x+1$。符号は＋です。', 1: '1 を忘れています。$\\frac{\\sin^2x+\\cos^2x}{\\cos^2x}=\\tan^2x+1$。', 3: 'それは逆数で、$\\cos^2x$ のほうです。' },
        good: '$\\dfrac1{\\cos^2x}=\\dfrac{\\sin^2x+\\cos^2x}{\\cos^2x}=\\tan^2x+1$。',
        add: [{ t: 'ans', label: '(1) 答', tex: "(\\tan x)'=1+\\tan^2x" }] } },
      { clear: true, part: '(1) 後半', say: '後半です。$\\tan^2x=(\\tan x)\'-1$ と見れば、そのまま積分できます。右の図の面積が、求める定積分です。',
        add: [{ t: 'h', text: '(1)　後半：tan²x の定積分' },
          { t: 'm', tex: "\\tan^2x=(\\tan x)'-1", note: '前半の結果を使う' },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}\\tan^2x\\,dx=\\Big[\\,\\tan x-x\\,\\Big]_0^{\\frac{\\pi}{4}}' },
          tanFig('t1')] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\frac{\\pi}{4}}\\tan^2x\\,dx$ の値は？',
        opts: ['$1-\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{4}-1$', '$\\dfrac13$', '$1+\\dfrac{\\pi}{4}$'], ok: 0,
        why: { 1: '符号が逆です。$\\tan\\frac{\\pi}{4}-\\frac{\\pi}{4}=1-\\frac{\\pi}{4}$ で、正の値になるはず。', 2: '$x^2$ のつもりで $\\frac{\\tan^3x}{3}$ としています。合成関数なので、この積分はできません。', 3: '$-x$ の符号がちがいます。$\\tan^2x=(\\tan x)\'-1$ です。' },
        good: '$\\Big[\\tan x-x\\Big]_0^{\\frac{\\pi}{4}}=1-\\dfrac{\\pi}{4}\\approx0.215$。図の面積とも合います。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\int_0^{\\frac{\\pi}{4}}\\tan^2x\\,dx=1-\\frac{\\pi}{4}' }] } },

      // ---------- (2) 方針 ----------
      { clear: true, part: '(2)', say: '(2) の被積分関数は、$\\tan x$ だけでできた分数式。$t=\\tan x$ と置換すると、$t$ の分数式（有理関数）の積分になります。$dx$ の変換に (1) を使います。',
        add: [{ t: 'h', text: '(2)　tan の分数式の定積分' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '被積分関数が $\\tan x$ だけの式 → $t=\\tan x$ と置換\n(1) より $\\dfrac{dt}{dx}=1+\\tan^2x=1+t^2$' },
          fFig('f1')] },
      { ask: { type: 'choice', q: '$t=\\tan x$ のとき、$dx$ を $t$ で表すと？',
        opts: ['$(1+t^2)\\,dt$', '$\\dfrac{dt}{1-t^2}$', '$\\dfrac{dt}{1+t^2}$', '$\\dfrac{dt}{t^2}$'], ok: 2,
        why: { 0: '逆です。$\\frac{dt}{dx}=1+t^2$ なので、$dx=\\frac{dt}{1+t^2}$。', 1: '(1) の結果は $1+\\tan^2x$。符号は＋です。', 3: '$\\frac{dt}{dx}=1+t^2$ の 1 を落としています。' },
        good: '$\\dfrac{dt}{dx}=1+t^2$ より $dx=\\dfrac{dt}{1+t^2}$。積分区間も $t$ に変えます。',
        add: [{ t: 'm', tex: 'dx=\\frac{dt}{1+t^2}' },
          { t: 'tbl', size: 'sm', rows: [['$x$', '$0\\ \\to\\ \\dfrac{\\pi}{4}$'], ['$t$', '$0\\ \\to\\ 1$']] }] } },
      { clear: true, cols: [1], say: '置きかえると、$t$ の分数式の積分になります。分母の $1+t^2$ は、$dx$ から出てきたものです。',
        add: [{ t: 'h', text: '(2)　t の積分に直す' },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}\\frac{\\tan^3x+\\tan^2x+\\tan x+1}{\\tan^2x+5\\tan x+6}\\,dx=\\int_0^1\\frac{t^3+t^2+t+1}{t^2+5t+6}\\cdot\\frac{1}{\\hy{1+t^2}}\\,dt' }] },
      { ask: { type: 'choice', q: '分子 $t^3+t^2+t+1$ を因数分解すると？',
        opts: ['$(t+1)^2(t-1)$', '$(t-1)(t^2+1)$', '$(t+1)(t^2+t+1)$', '$(t+1)(t^2+1)$'], ok: 3,
        why: { 0: '展開すると $t^3+t^2-t-1$。$t$ と定数の符号が合いません。', 1: '$t=-1$ を代入すると $-1+1-1+1=0$。因数は $t+1$ です。', 2: '展開すると $t^3+2t^2+2t+1$ になり、合いません。' },
        good: '前2つ・後ろ2つで組にして $t^2(t+1)+(t+1)=(t+1)(t^2+1)$。$t^2+1$ が約分できます。',
        add: [{ t: 'm', tex: '\\frac{(t+1)\\hy{(t^2+1)}}{(t+2)(t+3)}\\cdot\\frac{1}{\\hy{1+t^2}}=\\frac{t+1}{(t+2)(t+3)}', note: '分母も因数分解' }] } },
      { ask: { type: 'think', q: '$\\dfrac{t+1}{(t+2)(t+3)}=\\dfrac{A}{t+2}+\\dfrac{B}{t+3}$ と部分分数に分けよう。',
        hint: '分母をはらうと $t+1=A(t+3)+B(t+2)$。$t=-2$、$t=-3$ を代入する。',
        ans: '$A=-1,\\ B=2$　つまり　$-\\dfrac{1}{t+2}+\\dfrac{2}{t+3}$',
        after: '$t=-2$ で $-1=A$、$t=-3$ で $-2=-B$。通分して $t+1$ にもどることも確かめましょう。',
        add: [{ t: 'm', tex: '\\frac{t+1}{(t+2)(t+3)}=-\\frac{1}{t+2}+\\frac{2}{t+3}' }] } },

      // ---------- (2) 計算 ----------
      { clear: true, part: '(2) 計算', say: 'あとは対数の積分。$0\\le t\\le1$ では $t+2>0,\\ t+3>0$ なので、絶対値の記号はいりません。',
        add: [{ t: 'h', text: '(2)　つづき：積分の計算' },
          { t: 'm', tex: '\\int_0^1\\left(-\\frac{1}{t+2}+\\frac{2}{t+3}\\right)dt' },
          { t: 'm', tex: '=\\Big[-\\log(t+2)+2\\log(t+3)\\Big]_0^1' },
          fFig('f2', [{ k: 'area', f: FX, a: 0, b: Q4, c: 'y', alpha: 0.3, label: 'S', lat: [0.4, 0.1] }])] },
      { ask: { type: 'choice', q: 'この値は？',
        opts: ['$\\log\\dfrac{16}{3}$', '$\\log\\dfrac{32}{27}$', '$\\log\\dfrac{27}{32}$', '$\\log\\dfrac{8}{9}$'], ok: 1,
        why: { 0: '下端 $t=0$ の値 $-\\log2+2\\log3$ を引き忘れています。', 2: '部分分数の符号が逆になっています。被積分関数は正なので、値が負なのはおかしい。', 3: '$2\\log(t+3)$ の係数 2 を落としています。' },
        good: '$(-\\log3+2\\log4)-(-\\log2+2\\log3)=5\\log2-3\\log3=\\log\\dfrac{32}{27}$。',
        add: [{ t: 'm', tex: '=(-\\log3+4\\log2)-(-\\log2+2\\log3)=5\\log2-3\\log3' },
          { t: 'ans', label: '(2) 答', tex: '\\log\\frac{32}{27}\\quad(=5\\log2-3\\log3)' }] } },
      { say: '見直し：$\\log\\frac{32}{27}\\approx0.170$。被積分関数は $\\frac16$ から $\\frac13$ の間で、幅は $\\frac{\\pi}{4}\\approx0.785$。面積は 0.13〜0.26 の間のはずで、合っています。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: '見直し', text: '$\\frac16\\cdot\\frac{\\pi}{4}\\approx0.13<S<\\frac13\\cdot\\frac{\\pi}{4}\\approx0.26$\n$S=\\log\\frac{32}{27}\\approx0.170$　✓' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '入試では、同じ式が $\\sin,\\ \\cos$ で書かれて出ることもあります。そのときに $\\tan$ の式へ直せるかが、この置換のカギです。',
        add: [{ t: 'h', text: '別の見方：sin・cos で書かれていたら？' },
          { t: 'm', tex: '\\int_0^{\\frac{\\pi}{4}}\\frac{\\sin x+\\cos x}{\\cos x\\,(\\sin x+2\\cos x)(\\sin x+3\\cos x)}\\,dx' }] },
      { ask: { type: 'choice', q: 'この被積分関数を $\\tan x$ の式に直すには、分母・分子を何で割る？',
        opts: ['$\\cos x$', '$\\cos^2x$', '$\\cos^3x$', '$\\sin^3x$'], ok: 2,
        why: { 0: '分母は $\\sin,\\ \\cos$ の3次式。$\\cos x$ で割っても $\\cos$ が残ります。', 1: '分母が3次なので、$\\cos^2x$ では分母に $\\cos x$ が残ります。', 3: '$\\sin x$ で割ると $\\frac1{\\tan x}$ の式になり、$x=0$ で分母が 0 になります。' },
        good: '分母は3次。$\\cos^3x$ で割ると、分子は $\\frac{\\tan x+1}{\\cos^2x}=(t+1)(1+t^2)$、分母は $(t+2)(t+3)$。',
        add: [{ t: 'm', tex: '=\\int_0^{\\frac{\\pi}{4}}\\frac{(\\tan x+1)(1+\\tan^2x)}{(\\tan x+2)(\\tan x+3)}\\,dx', note: '(2) と同じ式' }] } },
      { say: '$\\sin$ と $\\cos$ の次数がそろった式（同じ次数の式）の分数は、$\\cos^n x$ で割ると $\\tan$ の式になります。答案では、置換・区間・約分の理由を一言ずつ書きましょう。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '答案のポイント', text: '「$t=\\tan x$ とおくと $\\dfrac{dt}{dx}=1+t^2$（(1) より）」「$x:0\\to\\frac{\\pi}{4}$ のとき $t:0\\to1$」\n「$t^3+t^2+t+1=(t+1)(t^2+1)$ より約分」「$t+2>0$ なので絶対値は不要」' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。(1) の小さな結果が (2) の置換の道具になる、九大らしい誘導でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
