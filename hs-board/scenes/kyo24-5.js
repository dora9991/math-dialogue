/* 2024 京大 理系 第5問の類題（自作）：0≦x≦1、0≦y≦eˣ|sin nπx| の面積 Sₙ と、その極限
   答え（python3 で検算ずみ。n=1,2,3,5,10 で数値積分と一致）：
   (1) Sₙ = nπ(e−1)(e^{1/n}+1) / {(n²π²+1)(e^{1/n}−1)}　（S₁ = π(e+1)/(π²+1) ≒ 1.0747）
   (2) lim Sₙ = 2(e−1)/π ≒ 1.0939 */
(function () {
  const graph = (id, n, extra, w) => ({ t: 'fig', id, col: 1, view: [-0.12, -0.42, 1.14, 3.05], w: w || 520, h: Math.round((w || 520) * 0.74), items: [
    { k: 'axes', tx: n <= 4 ? [[1 / n, '1/' + n], [2 / n, '2/' + n], [1, '1']] : [[1, '1']], ty: [[1, '1'], [Math.E, 'e']] },
    { k: 'fn', f: 'exp(x)', a: -0.05, b: 1.08, c: 'd', dash: true, label: 'y=eˣ', lat: [0.62, 2.35] },
    { k: 'area', f: 'exp(x)*abs(sin(' + n + '*PI*x))', a: 0, b: 1, c: 'y', alpha: 0.3 },
    { k: 'fn', f: 'exp(x)*abs(sin(' + n + '*PI*x))', a: 0, b: 1, c: 'y' }
  ].concat(extra || []) });

  const POINTS = [
    '絶対値は「中身の符号が変わる所」で区間を分けてはずす。$x=\\dfrac kn+u$ と置換すると、どの区間も同じ形 $e^{\\frac kn}\\times J$ になる',
    '$\\int e^u\\sin bu\\,du$ は、$\\{e^u(\\sin bu-b\\cos bu)\\}\'=(1+b^2)e^u\\sin bu$ を使うと一度で求まる（部分積分2回と同じ）',
    '$\\displaystyle\\lim_{h\\to0}\\frac{e^h-1}{h}=1$ を $h=\\dfrac1n$ で使う。極限 $\\dfrac2\\pi(e-1)$ は「$|\\sin|$ の平均 $\\dfrac2\\pi$」×「$\\int_0^1e^x\\,dx$」'
  ];

  HB.lesson({
    id: 'kyo24-5', field: '京大型　数学（理系）', title: '2024 京大 理系 第5問の類題 ― eˣ|sin nπx| の面積とその極限', level: '2024年度 京都大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$n$ を正の整数とする。座標平面において、連立不等式 $0\\le x\\le1$、$0\\le y\\le e^x|\\sin n\\pi x|$ の表す領域の面積を $S_n$ とする。',
      parts: [
        '(1)　$S_n$ を $n$ の式で表せ。',
        '(2)　極限 $\\displaystyle\\lim_{n\\to\\infty}S_n$ を求めよ。'
      ],
      src: '※ 2024年度 京都大学 前期 理系 数学 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '連立不等式で表された領域の面積を定積分で求め、$n\\to\\infty$ の極限を調べる問題です。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '領域は、曲線 $y=e^x|\\sin n\\pi x|$ と $x$ 軸の間。右の図は $n=3$ のとき。山が3つあり、高さは点線 $y=e^x$ の下で、右ほど高くなります。',
        add: [{ t: 'h', text: '領域の形（n = 3 の図）' },
          { t: 'm', tex: 'S_n=\\int_0^1e^x|\\sin n\\pi x|\\,dx' },
          graph('g1', 3)] },
      { ask: { type: 'choice', q: '$|\\sin n\\pi x|$ の絶対値をはずすために、$0\\le x\\le1$ をどう分ける？',
        opts: ['$x=\\frac kn$ で区切って $n$ 個', '$x=\\frac12$ で区切って 2 個', '$x=\\frac{k}{2n}$ で区切って $2n$ 個', '分ける必要はない'], ok: 0,
        why: { 1: '$\\sin n\\pi x$ の符号は $x=\\frac1n,\\ \\frac2n,\\ \\cdots$ で変わります。2つでは足りません。', 2: '$x=\\frac{k}{2n}$ では符号は変わりません。分けすぎても計算がふえるだけです。', 3: '$\\sin n\\pi x$ は正と負の両方になるので、そのままでは絶対値がはずれません。' },
        good: '$\\sin n\\pi x=0$ となるのは $x=\\dfrac kn$。その間では符号が一定なので、絶対値がはずせます。',
        add: [{ t: 'm', size: 'sm', tex: 'S_n=\\sum_{k=0}^{n-1}\\int_{\\frac kn}^{\\frac{k+1}{n}}e^x|\\sin n\\pi x|\\,dx' }] } },

      // ---------- (1) 置換 ----------
      { clear: true, part: '(1)', say: '(1) です。$k$ 番目の区間で $x=\\dfrac kn+u$ と置換すると、$u$ は $0$ から $\\dfrac1n$ まで動きます。$\\sin(k\\pi+\\theta)=(-1)^k\\sin\\theta$ に注意。',
        add: [{ t: 'h', text: '(1)　k 番目の山の面積' },
          { t: 'm', size: 'sm', tex: 'x=\\frac kn+u,\\qquad |\\sin n\\pi x|=|\\sin(k\\pi+n\\pi u)|=|\\sin n\\pi u|' },
          { t: 'p', size: 'sm', text: '$0\\le u\\le\\dfrac1n$ では $\\sin n\\pi u\\ge0$' },
          graph('g2', 3, [{ k: 'area', f: 'exp(x)*abs(sin(3*PI*x))', a: 1 / 3, b: 2 / 3, c: 'p', alpha: 0.45, label: 'k=1', lat: [0.5, 0.7] }])] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_{\\frac kn}^{\\frac{k+1}{n}}e^x|\\sin n\\pi x|\\,dx$ を、$J=\\displaystyle\\int_0^{\\frac1n}e^u\\sin n\\pi u\\,du$ で表すと？',
        opts: ['$J$', '$(-1)^ke^{\\frac kn}J$', '$e^kJ$', '$e^{\\frac kn}J$'], ok: 3,
        why: { 0: '$e^x=e^{\\frac kn}e^u$ の $e^{\\frac kn}$ を忘れています。右の山ほど高いはずです。', 1: '絶対値がついているので、$(-1)^k$ は消えます。面積は負になりません。', 2: '$x=\\frac kn+u$ なので、$e^x=e^{\\frac kn}\\cdot e^u$ です。' },
        good: '$e^x=e^{\\frac kn}e^u$、$dx=du$。どの山も「$J$ の $e^{\\frac kn}$ 倍」。$k$ によらない積分 $J$ を1回求めればよいのです。',
        add: [{ t: 'm', tex: 'S_n=\\sum_{k=0}^{n-1}e^{\\frac kn}\\,J' }] } },

      // ---------- (1) J の計算 ----------
      { clear: true, cols: [0.6, 0.4], say: '$J$ を求めます。$e^u\\sin bu$ の積分は、部分積分を2回する代わりに、次の微分の式を使うと一度ですみます（$b=n\\pi$）。',
        add: [{ t: 'h', text: '(1)　J を求める（b = nπ）' },
          { t: 'm', tex: 'J=\\int_0^{\\frac1n}e^u\\sin bu\\,du' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: 'くふう', text: '$e^u\\sin bu$ と $e^u\\cos bu$ を微分すると、たがいに入れかわる\n→ 2つを組み合わせた式を微分して、$e^u\\sin bu$ だけを残す\n（部分積分を2回するのと同じこと）' }] },
      { ask: { type: 'choice', q: '$\\{e^u(\\sin bu-b\\cos bu)\\}\'$ を計算すると？',
        opts: ['$(1-b^2)e^u\\sin bu$', '$(1+b^2)e^u\\sin bu$', '$e^u\\sin bu$', '$(1+b)e^u\\sin bu$'], ok: 1,
        why: { 0: '$-b\\cos bu$ を微分すると $+b^2\\sin bu$。符号に注意。', 2: '$\\sin bu$ の微分 $b\\cos bu$ と $-b\\cos bu$ は消えますが、$b^2\\sin bu$ が残ります。', 3: '$\\cos bu$ の微分は $-b\\sin bu$。$b$ がもう1つかかります。' },
        good: '$e^u(\\sin bu-b\\cos bu)+e^u(b\\cos bu+b^2\\sin bu)=(1+b^2)e^u\\sin bu$。',
        add: [{ t: 'm', size: 'sm', tex: 'J=\\frac{1}{1+b^2}\\Big[\\,e^u(\\sin bu-b\\cos bu)\\,\\Big]_0^{\\frac1n}' }] } },
      { ask: { type: 'think', q: '$b=n\\pi$ として、$J$ の値を計算しよう。',
        hint: '$u=\\frac1n$ で $bu=\\pi$：$\\sin\\pi=0,\\ \\cos\\pi=-1$。$u=0$ で $\\sin0=0,\\ \\cos0=1$。',
        ans: '$J=\\dfrac{1}{1+n^2\\pi^2}\\left\\{e^{\\frac1n}(0+n\\pi)-(0-n\\pi)\\right\\}=\\dfrac{n\\pi\\left(e^{\\frac1n}+1\\right)}{n^2\\pi^2+1}$',
        after: '$J>0$ になっていて、面積として自然です。',
        add: [{ t: 'm', tex: 'J=\\frac{n\\pi\\left(e^{\\frac1n}+1\\right)}{n^2\\pi^2+1}' }] } },

      // ---------- (1) 和 ----------
      { clear: true, cols: [1], say: '最後に $\\displaystyle\\sum_{k=0}^{n-1}e^{\\frac kn}$。初項 1、公比 $e^{\\frac1n}$ の等比数列の、$n$ 項の和です。',
        add: [{ t: 'h', text: '(1)　山を全部たす' },
          { t: 'm', tex: 'S_n=J\\sum_{k=0}^{n-1}\\left(e^{\\frac1n}\\right)^k' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\sum_{k=0}^{n-1}\\left(e^{\\frac1n}\\right)^k$ は？',
        opts: ['$\\dfrac{e-1}{e^{\\frac1n}-1}$', '$\\dfrac{e^{\\frac{n-1}{n}}-1}{e^{\\frac1n}-1}$', '$\\dfrac{e-1}{e-e^{\\frac1n}}$', '$n\\,e^{\\frac1n}$'], ok: 0,
        why: { 1: '項の数は $n$ 個なので、分子は $\\left(e^{\\frac1n}\\right)^n-1=e-1$。', 2: '公比は $e^{\\frac1n}$。分母は「公比 $-1$」です。', 3: '項は1つずつちがう値なので、同じ値の $n$ 倍にはなりません。' },
        good: '$\\dfrac{r^n-1}{r-1}$ で $r=e^{\\frac1n}$、$r^n=e$。',
        add: [{ t: 'm', tex: '\\sum_{k=0}^{n-1}\\left(e^{\\frac1n}\\right)^k=\\frac{e-1}{e^{\\frac1n}-1}' }] } },
      { say: '$J$ とかけ合わせて、(1) の答えです。$n=1$ なら $S_1=\\dfrac{\\pi(e+1)}{\\pi^2+1}$ で、$\\int_0^1e^x\\sin\\pi x\\,dx$ を直接計算したものと一致します。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'S_n=\\frac{n\\pi(e-1)\\left(e^{\\frac1n}+1\\right)}{(n^2\\pi^2+1)\\left(e^{\\frac1n}-1\\right)}' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.56, 0.44], part: '(2)', say: '(2) です。$n\\to\\infty$ で $e^{\\frac1n}-1\\to0$ なので、このままでは $\\dfrac{\\infty}{\\infty}$ のような形。極限のわかる部分に分けます。',
        add: [{ t: 'h', text: '(2)　Sₙ の極限' },
          { t: 'm', size: 'sm', tex: 'S_n=\\frac{n^2\\pi}{n^2\\pi^2+1}\\cdot\\left(e^{\\frac1n}+1\\right)(e-1)\\cdot\\frac{\\frac1n}{e^{\\frac1n}-1}' },
          graph('g3', 8, [], 440)] },
      { ask: { type: 'choice', q: '$h=\\dfrac1n$ とおく。$\\displaystyle\\lim_{n\\to\\infty}\\frac{\\frac1n}{e^{\\frac1n}-1}=\\lim_{h\\to+0}\\frac{h}{e^h-1}$ は？',
        opts: ['$0$', '$e$', '$1$', '$\\infty$'], ok: 2,
        why: { 0: '分子も分母も 0 に近づく形です。0 になるとは限りません。', 1: '$e$ が出てくるのは $(1+h)^{\\frac1h}$ の極限です。', 3: '$e^h-1$ と $h$ は同じくらいの速さで 0 に近づきます。' },
        good: '$\\displaystyle\\lim_{h\\to0}\\frac{e^h-1}{h}=1$（$y=e^x$ の $x=0$ での微分係数）。その逆数なので 1。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{n^2\\pi}{n^2\\pi^2+1}\\to\\frac1\\pi,\\quad e^{\\frac1n}+1\\to2,\\quad \\frac{\\frac1n}{e^{\\frac1n}-1}\\to1' }] } },
      { say: 'それぞれの極限をかけ合わせて、(2) の答えです。数値では約 1.094。$n=1$ の $S_1\\fallingdotseq1.075$ から、少しずつふえて近づきます。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\lim_{n\\to\\infty}S_n=\\frac1\\pi\\cdot2\\cdot(e-1)=\\frac{2(e-1)}{\\pi}' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '$n$ が大きいと山はとても細かくなり、$|\\sin n\\pi x|$ は平均すると一定の値になります。その平均値をかけた形が答えです。',
        add: [{ t: 'h', text: '別の見方：|sin| の平均' },
          { t: 'm', tex: '\\frac{2(e-1)}{\\pi}=\\hy{\\frac2\\pi}\\times\\int_0^1e^x\\,dx', note: '$e-1=\\int_0^1e^x\\,dx$' },
          graph('g4', 8, [], 440)] },
      { ask: { type: 'think', q: '$\\displaystyle\\int_0^1|\\sin n\\pi x|\\,dx$ を求めよう。（$|\\sin|$ の平均）',
        hint: '同じように $n$ 個の山に分けると、どの山も $\\int_0^{\\frac1n}\\sin n\\pi u\\,du$。',
        ans: '$n\\times\\dfrac{2}{n\\pi}=\\dfrac2\\pi$（$n$ によらない）',
        after: '細かく波打つ $|\\sin n\\pi x|$ は、$n\\to\\infty$ で「高さ $\\frac2\\pi$ の平らな関数」と同じはたらきをします。だから $S_n\\to\\frac2\\pi\\int_0^1e^x\\,dx$。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。区間を分けて同じ形をくり返し使うのが、この型の積分のコツです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
