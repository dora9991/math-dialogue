/* 2025 東大 理系 第2問の類題（自作）：対数の不等式を示し、それを使って定積分でできた数列の極限を求める
   問題：(1) x>0 で x−x²/2 < log(1+x) < x−x²/2+x³/3
         (2) J_n=∫₀¹(1+x/n)ⁿ dx。lim n(e−1−J_n) を求めよ。
   答え（python3・sympy・mpmath で検算ずみ）：
   (1) f=log(1+x)−x+x²/2 → f'=x²/(1+x)>0、g=x−x²/2+x³/3−log(1+x) → g'=x³/(1+x)>0
   (2) J_n=n/(n+1)·(E_n−1)、E_n=(1+1/n)^{n+1}。n(e−1−J_n)=−n(E_n−e)+n/(n+1)·(E_n−1)
       δ_n=(n+1)log(1+1/n)−1 は 1/(2n)−1/(2n²) < δ_n < 1/(2n)−1/(6n²)+1/(3n³) → nδ_n→1/2
       n(E_n−e)=e·(e^{δ_n}−1)/δ_n·nδ_n → e/2。答 e/2−1（≈0.35914。n=1000 で 0.35890、n=10⁷ で 0.3591409）
   別の見方：n(eˣ−(1+x/n)ⁿ) → x²eˣ/2、∫₀¹ x²eˣ/2 dx = e/2−1（部分積分2回） */
(function () {
  const POINTS = [
    '不等式 $f(x)>0$ は「$f(0)=0$ と $f\'(x)>0$」で示す。$\\log(1+x)$ の不等式は、$f\'(x)$ が $\\dfrac{x^2}{1+x}$ のような形にまとまる',
    '$\\left(1+\\frac{x}{n}\\right)^n$ はそのまま積分できる。$n(\\cdots)$ の極限は **∞×0 の不定形** なので、$\\log$ をとって (1) ではさむ',
    '$\\displaystyle\\lim_{h\\to0}\\frac{e^h-1}{h}=1$ を使える形 $\\dfrac{e^{\\delta_n}-1}{\\delta_n}\\cdot n\\delta_n$ に変形する。見当は $n\\log\\left(1+\\frac{x}{n}\\right)\\fallingdotseq x-\\frac{x^2}{2n}$'
  ];
  const gExp = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.15, -0.3, 1.25, 3.05], w: 520, h: 420, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1, '1'], [Math.E, 'e']] },
    { k: 'area', f: 'exp(x)', g: '(1+x/2)**2', a: 0, b: 1, c: 'p', alpha: 0.4 },
    { k: 'area', f: '(1+x/2)**2', a: 0, b: 1, c: 'b', alpha: 0.18 },
    { k: 'fn', f: 'exp(x)', a: -0.12, b: 1.12, c: 'y', label: 'y = eˣ', lat: [0.45, 2.15], la: 'end' },
    { k: 'fn', f: '(1+x/2)**2', a: -0.12, b: 1.15, c: 'b', label: 'y = (1+x/2)²', lat: [0.62, 0.95] },
    { k: 'line', x: 1, dash: true, c: 'd' }].concat(extra || []) });

  HB.lesson({
    id: 'ut25-2', field: '東大型　数学（理系）', title: '2025 東大 理系 第2問の類題 ― log の不等式ではさむ、積分の極限', level: '2025年度 東京大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$e$ は自然対数の底とし、対数は自然対数とする。',
      parts: [
        '(1)　$x>0$ のとき、不等式　$x-\\dfrac{x^2}{2}<\\log(1+x)<x-\\dfrac{x^2}{2}+\\dfrac{x^3}{3}$　が成り立つことを示せ。',
        '(2)　正の整数 $n$ に対して $J_n=\\displaystyle\\int_0^1\\left(1+\\frac{x}{n}\\right)^n dx$ とおく。極限 $\\displaystyle\\lim_{n\\to\\infty}n(e-1-J_n)$ を求めよ。'
      ],
      src: '※ 2025年度 東京大学 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '対数の不等式を示して、それを道具に極限を求める問題です。(1) が (2) のどこで効くかを意識して読みましょう。',
        add: [{ t: 'prob' }] },
      { clear: true, part: '読みかえ', say: '$\\left(1+\\frac{x}{n}\\right)^n$ は $n\\to\\infty$ で $e^x$ に近づきます。図は $n=2$ のとき。$J_n$ は青い部分の面積です。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'm', size: 'sm', tex: '\\lim_{n\\to\\infty}\\left(1+\\frac{x}{n}\\right)^n=e^x', note: '$e$ の定義から' },
          gExp('g1')] },
      { ask: { type: 'choice', q: 'では、$\\displaystyle\\lim_{n\\to\\infty}J_n$ は（見当として）いくつ？',
        opts: ['$e$', '$1$', '$e-1$', '$\\infty$'], ok: 2,
        why: { 0: '$e$ は $x=1$ での値。面積は $\\int_0^1 e^x dx$ です。', 1: '$\\int_0^1 1\\,dx$ ではなく、$\\int_0^1 e^x dx$ です。', 3: '$\\left(1+\\frac{x}{n}\\right)^n\\le e^x$ なので、面積は有限です。' },
        good: '$\\displaystyle\\int_0^1e^x\\,dx=e-1$。(2) は「$e-1-J_n$（桃の部分）が 0 に近づく速さ」を聞いています。',
        add: [{ t: 'p', size: 'sm', text: '$e-1-J_n$＝桃の部分の面積 → 0\n(2) は、それを $n$ 倍した極限\n＝「0 に近づく速さ」を調べる' }] } },

      // ---------- (1) ----------
      { clear: true, cols: [0.62, 0.38], part: '(1)', say: '(1) は左右2つの不等式。左側から。差を $f(x)$ とおくと $f(0)=0$。$f\'(x)>0$ が言えれば、$x>0$ で $f(x)>0$ です。',
        add: [{ t: 'h', text: '(1)　2つの不等式を示す' },
          { t: 'm', size: 'sm', tex: 'f(x)=\\log(1+x)-\\left(x-\\frac{x^2}{2}\\right)', note: '$f(0)=0$' },
          { t: 'm', size: 'sm', tex: "f'(x)=\\frac1{1+x}-1+x=\\frac{1-(1+x)+x(1+x)}{1+x}=\\frac{x^2}{1+x}" },
          { t: 'p', size: 'sm', text: '$x>0$ で $f\'(x)>0$。$f(x)$ は増加し $f(x)>f(0)=0$' }] },
      { ask: { type: 'choice', q: '右側。$g(x)=x-\\dfrac{x^2}{2}+\\dfrac{x^3}{3}-\\log(1+x)$ とおくと、$g\'(x)$ は？',
        opts: ['$-\\dfrac{x^3}{1+x}$', '$\\dfrac{x^3}{1+x}$', '$\\dfrac{x^2}{1+x}$', '$1-x+x^2$'], ok: 1,
        why: { 0: '$1-x+x^2-\\frac1{1+x}=\\frac{(1+x)(1-x+x^2)-1}{1+x}=\\frac{x^3}{1+x}$。符号は正です。', 2: 'それは $f\'(x)$。$x^3$ の項の微分 $x^2$ が加わります。', 3: '$\\log(1+x)$ の微分 $\\frac1{1+x}$ を引き忘れています。' },
        good: '$(1+x)(1-x+x^2)=1+x^3$ なので、$g\'(x)=\\dfrac{x^3}{1+x}>0$。',
        add: [{ t: 'm', size: 'sm', tex: "g'(x)=1-x+x^2-\\frac1{1+x}=\\frac{x^3}{1+x}>0", note: '$g(0)=0$' }] } },
      { say: '$g(0)=0$ で $g$ は増加するので、$x>0$ で $g(x)>0$。これで (1) が示せました。答案では「$f(0)=0$」と「増加」の両方を必ず書きます。',
        add: [{ t: 'ans', label: '(1)', text: '$f(x)>0,\\ g(x)>0$（$x>0$）より\n$x-\\dfrac{x^2}{2}<\\log(1+x)<x-\\dfrac{x^2}{2}+\\dfrac{x^3}{3}$' },
          { t: 'fig', id: 'g2', col: 1, view: [-0.15, -0.3, 2.3, 1.75], w: 470, h: 393, items: [
            { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[1, '1']] },
            { k: 'fn', f: 'x-x**2/2+x**3/3', a: 0, b: 2.2, c: 'g', label: '3次の式', lat: [1.25, 1.55], la: 'end' },
            { k: 'fn', f: 'log(1+x)', a: 0, b: 2.2, c: 'y', label: 'log(1+x)', lat: [2.25, 1.32], la: 'end' },
            { k: 'fn', f: 'x-x**2/2', a: 0, b: 2.1, c: 'b', label: '2次の式', lat: [1.0, 0.25], la: 'middle' }] }] },

      // ---------- (2) J_n を計算 ----------
      { clear: true, cols: [0.62, 0.38], part: '(2)', say: '(2) です。$\\left(1+\\frac{x}{n}\\right)^n$ は1次式の $n$ 乗なので、そのまま積分できます。',
        add: [{ t: 'h', text: '(2)　まず J_n を計算する' }] },
      { ask: { type: 'choice', q: '$J_n=\\displaystyle\\int_0^1\\left(1+\\frac{x}{n}\\right)^n dx$ は？（$E_n=\\left(1+\\frac1n\\right)^{n+1}$ とおく）',
        opts: ['$\\dfrac{1}{n+1}E_n$', '$n(E_n-1)$', '$\\dfrac{n}{n+1}E_n$', '$\\dfrac{n}{n+1}(E_n-1)$'], ok: 3,
        why: { 0: '$x$ の係数が $\\frac1n$ なので、原始関数には $n$ がかかります。', 1: '$(\\cdots)^{n+1}$ の $\\frac1{n+1}$ を忘れています。', 2: '下端 $x=0$ の値 $1$ を引き忘れています。' },
        good: '原始関数は $\\dfrac{n}{n+1}\\left(1+\\frac{x}{n}\\right)^{n+1}$。0 から 1 まで代入します。',
        add: [{ t: 'm', size: 'sm', tex: 'J_n=\\Big[\\,\\frac{n}{n+1}\\left(1+\\frac{x}{n}\\right)^{n+1}\\Big]_0^1=\\frac{n}{n+1}(E_n-1)' }] } },
      { say: '$\\frac{n^2}{n+1}=n-\\frac{n}{n+1}$ を使って整理すると、極限が分かっている部分と、むずかしい部分 $n(E_n-e)$ に分かれます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}n(e-1-J_n)&=n(e-1)-\\frac{n^2}{n+1}(E_n-1)\\\\ &=\\hb{-n(E_n-e)}+\\frac{n}{n+1}(E_n-1)\\end{aligned}' },
          { t: 'p', size: 'sm', text: '後ろの項 → $1\\cdot(e-1)$（$E_n\\to e$ より）' }] },
      { ask: { type: 'choice', q: '青い部分 $n(E_n-e)$ は、このままではどんな形の極限？',
        opts: ['0 に収束することがすぐわかる', '∞×0 の不定形', '∞ に発散することがすぐわかる', '$e$ に収束することがすぐわかる'], ok: 1,
        why: { 0: '$E_n-e\\to0$ ですが、$n\\to\\infty$ がかかっています。', 2: '$n\\to\\infty$ でも、$E_n-e\\to0$ なので発散とは言えません。', 3: '根拠がありません。$E_n-e$ がどのくらいの速さで 0 に近づくかが問題です。' },
        good: '$E_n-e$ が「$\\frac{\\square}{n}$ くらい」で 0 に近づくことを示す必要があります。ここで (1) を使います。' } },

      // ---------- (2) log をとってはさむ ----------
      { clear: true, cols: [0.62, 0.38], say: '指数の $n+1$ を下ろすために log をとります。$\\log E_n=(n+1)\\log\\left(1+\\frac1n\\right)$。(1) に $x=\\frac1n$ を入れます。',
        add: [{ t: 'h', text: '(2)　(1) で log E_n をはさむ' },
          { t: 'm', size: 'sm', tex: '\\frac1n-\\frac1{2n^2}<\\log\\left(1+\\frac1n\\right)<\\frac1n-\\frac1{2n^2}+\\frac1{3n^3}', note: '(1) で\n$x=\\frac1n$' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: 'おく', text: '$\\delta_n=(n+1)\\log\\left(1+\\dfrac1n\\right)-1$\n（$E_n=e^{1+\\delta_n}$）' }] },
      { say: '$n+1$ をかけて 1 を引くと、$\\delta_n$ が上下からはさまれます。左はしは $\\frac{n-1}{2n^2}\\ge0$ なので $\\delta_n>0$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac1{2n}-\\frac1{2n^2}<\\delta_n<\\frac1{2n}-\\frac1{6n^2}+\\frac1{3n^3}' }] },
      { ask: { type: 'choice', q: '両辺に $n$ をかけて、はさみうち。$\\displaystyle\\lim_{n\\to\\infty}n\\delta_n$ は？',
        opts: ['$\\dfrac16$', '$1$', '$0$', '$\\dfrac12$'], ok: 3,
        why: { 0: '$-\\frac1{6n^2}$ の項は、$n$ 倍しても $-\\frac1{6n}\\to0$ です。', 1: '$\\frac1{2n}$ に $n$ をかけると $\\frac12$。$\\frac12$ を落としています。', 2: '$\\delta_n\\to0$ ですが、$n\\delta_n$ は 0 になりません。' },
        good: '両はしとも $n$ 倍すると $\\frac12$ に近づくので、$n\\delta_n\\to\\dfrac12$。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{n\\to\\infty}n\\delta_n=\\frac12,\\qquad \\lim_{n\\to\\infty}\\delta_n=0' }] } },
      { say: '$n(E_n-e)=e\\,n(e^{\\delta_n}-1)$。$\\delta_n>0$ で割って、$e^x$ の $x=0$ での微分係数の形を作ります。',
        add: [{ t: 'm', size: 'sm', tex: 'n(E_n-e)=e\\cdot\\frac{e^{\\delta_n}-1}{\\delta_n}\\cdot n\\delta_n\\ \\longrightarrow\\ e\\cdot1\\cdot\\frac12=\\frac{e}{2}' },
          { t: 'box', col: 1, c: 'y', size: 'sm', label: '使う極限', text: '$\\displaystyle\\lim_{h\\to0}\\frac{e^h-1}{h}=1$\n（$e^x$ の $x=0$ での微分係数）' }] },
      { say: 'まとめると、求める極限は $-\\frac{e}{2}+(e-1)=\\frac{e}{2}-1$。数値で $n=1000$ とすると 0.3589…、$\\frac{e}{2}-1=0.3591\\cdots$ で、合っています。',
        add: [{ t: 'm', size: 'sm', tex: 'n(e-1-J_n)\\ \\longrightarrow\\ -\\frac{e}{2}+(e-1)' },
          { t: 'ans', label: '(2) 答', tex: '\\lim_{n\\to\\infty}n(e-1-J_n)=\\frac{e}{2}-1' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.6, 0.4], part: '別の見方', say: '答えの見当をつける見方です。(1) から $n\\log\\left(1+\\frac{x}{n}\\right)\\fallingdotseq x-\\frac{x^2}{2n}$。だから $\\left(1+\\frac{x}{n}\\right)^n\\fallingdotseq e^x\\left(1-\\frac{x^2}{2n}\\right)$ です。',
        add: [{ t: 'h', text: '別の見方：積分の中で近似する' },
          { t: 'm', size: 'sm', tex: '\\left(1+\\frac{x}{n}\\right)^n=e^{n\\log(1+\\frac{x}{n})}\\fallingdotseq e^{x-\\frac{x^2}{2n}}\\fallingdotseq e^x\\left(1-\\frac{x^2}{2n}\\right)' },
          { t: 'm', size: 'sm', tex: 'n\\left\\{e^x-\\left(1+\\frac{x}{n}\\right)^n\\right\\}\\fallingdotseq\\frac{x^2e^x}{2}' },
          gExp('g3')] },
      { ask: { type: 'think', q: '$\\displaystyle\\int_0^1\\frac{x^2e^x}{2}\\,dx$ を部分積分で計算して、(2) の答えと比べよう。',
        hint: '$\\int x^2e^x\\,dx=x^2e^x-2\\int xe^x\\,dx$、$\\int xe^x\\,dx=(x-1)e^x$。',
        ans: '$\\dfrac12\\Big[(x^2-2x+2)e^x\\Big]_0^1=\\dfrac12(e-2)=\\dfrac{e}{2}-1$　（一致）',
        after: 'この見方は見当づけ。答案にするには、(1) の不等式で被積分関数を上下からはさむ必要があります。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^1\\frac{x^2e^x}{2}\\,dx=\\frac{e}{2}-1' }] } },
      { ask: { type: 'choice', q: '(1) で、右側の $\\dfrac{x^3}{3}$ まである不等式が必要だった理由は？',
        opts: ['$\\delta_n$ を上からもおさえるため', '$\\log(1+x)>0$ を示すため', '$J_n$ を計算するため', '$e$ の定義を使うため'], ok: 0,
        why: { 1: 'それだけなら右側の不等式は要りません。', 2: '$J_n$ はふつうに積分できました。', 3: '$e$ の定義に (1) は使いません。' },
        good: '下からだけでは $n\\delta_n$ の極限が決まりません。**上下からはさむ** ためです。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「不等式を示す → それではさんで極限」は、東大の微積分の定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
