/* 京大型（理系）2025 第1問の類題（自作）：問1 複素数平面（|z|=1 のときの式の絶対値の最大・最小）／問2 定積分 2 題
   元の問題はうつしていない（分野・ねらい・形式だけを合わせた自作問題）。答え・誤答は python3（sympy・数値計算）で検算ずみ。
   問1：|z|=1 のとき |z⁴−2z³+5z²−2z+1| = 4cos²θ−4cosθ+3 = (2c−1)²+2（c=cosθ）→ 最大 11（z=−1）、最小 2（z=1/2±(√3/2)i）
   問2：(1) ∫₀^{π/3} x/cos²x dx = (√3/3)π − log2 ≒ 1.1207　(2) ∫₀¹ (x+2)/(x²+x+1) dx = (1/2)log3 + (√3/6)π ≒ 1.4562
        （∫₀^{π/3} tan x dx = log2、∫₀¹ dx/(x²+x+1) = (√3/9)π） */
(function () {
  const POINTS = [
    '$|z|=1$ なら $z=\\cos\\theta+i\\sin\\theta$、$\\dfrac1z=\\bar z$。係数が左右対称な式は $z^2$ でくくって $z^n+\\dfrac1{z^n}=2\\cos n\\theta$ の式に',
    '積の積分は部分積分。$\\dfrac1{\\cos^2x}=(\\tan x)\'$ と見て、$x$ を微分する側に。$\\displaystyle\\int\\tan x\\,dx=-\\log|\\cos x|+C$',
    '分母が因数分解できない分数式は、分子を「分母の微分」＋「定数」に分ける。$\\dfrac1{u^2+a^2}$ は $u=a\\tan\\theta$ と置換'
  ];
  const IM = n => [n, n === 1 ? 'i' : '−i'];
  const unit = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.7, -1.55, 1.8, 1.55], w: 452, h: 400, items: [
    { k: 'axes', tx: [[-1, '−1'], [1, '1']], ty: [IM(1), IM(-1)], xl: '実軸', yl: '虚軸' },
    { k: 'circle', o: [0, 0], r: 1, c: 'w', wd: 2.5 }].concat(extra || []) });
  const th = 50 * Math.PI / 180, Z = [Math.cos(th), Math.sin(th)], Zb = [Math.cos(th), -Math.sin(th)];
  const zpts = [{ k: 'seg', a: [0, 0], b: Z, c: 'y', wd: 2 }, { k: 'pt', at: Z, name: 'z', dir: 'ne', c: 'y' },
    { k: 'angle', o: [0, 0], a: [1, 0], b: Z, rp: 34, label: 'θ', c: 'y' },
    { k: 'seg', a: [0, 0], b: Zb, c: 'b', wd: 2, dash: true }, { k: 'pt', at: Zb, name: '1/z', dir: 'se', c: 'b' }];
  const G = '4*x**2-4*x+3';
  const gfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.6, -1.6, 1.75, 12.6], w: 430, h: 400, items: [
    { k: 'axes', tx: [[-1, '−1'], [0.5, '1/2'], [1, '1']], ty: [2, 3], xl: 'c', yl: 'g' },
    { k: 'fn', f: G, a: -1, b: 1, c: 'w', label: 'g(c)', lat: [0.98, 5.4] },
    { k: 'seg', a: [0.5, 0], b: [0.5, 12.4], c: 'd', dash: true, wd: 2 }].concat(extra || []) });

  HB.lesson({
    id: 'kyo25-1', field: '京大型　数学（理系）', title: '2025 京大 理系 第1問の類題 ― 単位円上の z と式の絶対値／定積分2題', level: '2025年度 京都大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '次の問1、問2に答えよ。',
      parts: [
        '問1　複素数 $z$ が $|z|=1$ を満たしながら動くとき、$|z^4-2z^3+5z^2-2z+1|$ の最大値と最小値を求めよ。また、それぞれの値をとるときの $z$ を求めよ。',
        '問2　次の定積分の値を求めよ。\n(1)　$\\displaystyle\\int_0^{\\frac{\\pi}{3}}\\frac{x}{\\cos^2x}\\,dx$　　　(2)　$\\displaystyle\\int_0^1\\frac{x+2}{x^2+x+1}\\,dx$'
      ],
      src: '※ 2025年度 京都大学 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.57, 0.43],
    steps: [
      { part: '問題', say: '京大の第1問は小問集合。問1は複素数平面、問2は定積分の計算です。短いけれど、論理と計算の正確さが問われます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 問1 ----------
      { clear: true, part: '問1', say: '問1。$|z|=1$ の条件をどう使うかがカギです。$z$ は単位円の上の点なので、極形式 $z=\\cos\\theta+i\\sin\\theta$ と書けます。',
        add: [{ t: 'h', text: '問1　|z| = 1 のときの最大・最小' },
          { t: 'box', c: 'b', size: 'sm', label: '条件の読みかえ', text: '$|z|=1$ より $z=\\cos\\theta+i\\sin\\theta$\n$\\dfrac1z=\\bar z=\\cos\\theta-i\\sin\\theta$（$z\\bar z=|z|^2=1$）' },
          unit('u1', zpts)] },
      { ask: { type: 'choice', q: '最大・最小を調べるために、まず何をする？',
        opts: ['$z^2$ でくくって $z+\\frac1z$ で表す', '$z=x+yi$ とおいて展開する', '三角不等式で項ごとに分ける', '$z=\\pm1,\\ \\pm i$ を代入して比べる'], ok: 0,
        why: { 1: '$x^2+y^2=1$ の条件つきで4次式を展開すると、計算が大きくなり見通しが悪くなります。', 2: '三角不等式は「≦」なので、等号が成り立つとは限らず、最大値は決まりません。', 3: 'いくつかの値を調べても、それが最大・最小であることは示せません。' },
        good: '係数が 1, −2, 5, −2, 1 と左右対称。$z^2$ でくくるのが定石です。',
        add: [{ t: 'm', size: 'sm', tex: 'z^4-2z^3+5z^2-2z+1=z^2\\left\\{\\left(z^2+\\frac1{z^2}\\right)-2\\left(z+\\frac1z\\right)+5\\right\\}' }] } },
      { say: '$\\frac1z=\\bar z$ なので $z+\\frac1z=2\\cos\\theta$。ド・モアブルの定理より $z^2+\\frac1{z^2}=2\\cos2\\theta=4\\cos^2\\theta-2$。$c=\\cos\\theta$ とおきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned} z+\\frac1z&=2\\cos\\theta=2c\\\\ z^2+\\frac1{z^2}&=2\\cos2\\theta=4c^2-2 \\end{aligned}', note: '$c=\\cos\\theta$' }],
        draw: [{ fig: 'u1', items: [{ k: 'seg', a: Z, b: Zb, c: 'g', wd: 2 }, { k: 'pt', at: [Z[0], 0], c: 'g', r: 5 }] }] },
      { say: '{ } の中は $4c^2-2-4c+5=4c^2-4c+3$。$|z^2|=|z|^2=1$、しかも $4c^2-4c+3=(2c-1)^2+2>0$ なので、絶対値の記号はそのままはずせます。',
        add: [{ t: 'm', size: 'sm', tex: '|z^4-2z^3+5z^2-2z+1|=|z|^2\\,|4c^2-4c+3|=\\hy{(2c-1)^2+2}' }] },

      // ---------- 問1 つづき ----------
      { clear: true, say: 'あとは $c$ の2次関数の最大・最小。$\\theta$ はすべての実数を動くので、$c=\\cos\\theta$ は $-1\\le c\\le1$ の **すべての値** をとります。',
        add: [{ t: 'h', text: '問1　つづき：c の2次関数' },
          { t: 'm', tex: 'g(c)=(2c-1)^2+2\\qquad(-1\\le c\\le1)' },
          gfig('g1')] },
      { ask: { type: 'choice', q: '$g(c)$ の最大値は？',
        opts: ['$3$', '$7$', '$11$', '$9$'], ok: 2,
        why: { 0: 'それは $c=1$ のときの値。軸 $c=\\frac12$ から遠い端は $c=-1$ の方です。', 1: '計算ミスです。$(2\\cdot(-1)-1)^2+2=9+2$。', 3: '$(2c-1)^2$ の部分だけで、$+2$ を足し忘れています。' },
        good: '軸 $c=\\frac12$ から遠い端 $c=-1$ で最大：$(-3)^2+2=11$。',
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [-1, 11], name: '最大 11', dir: 'e', c: 'p', size: 22 }] }] } },
      { say: '最小は頂点 $c=\\frac12$ で、値は 2。答案では「そのときの $z$」も書きます。$c=-1$ は $\\theta=\\pi$、$c=\\frac12$ は $\\theta=\\pm\\frac{\\pi}{3}$ のときです。',
        add: [{ t: 'm', size: 'sm', tex: 'c=-1\\iff z=-1,\\qquad c=\\frac12\\iff z=\\frac12\\pm\\frac{\\sqrt3}{2}i' }],
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [0.5, 2], name: '最小 2', dir: 'se', c: 'g', size: 22 }] }] },
      { say: '問1の答えです。最大は $z=-1$、最小は偏角 $\\pm\\frac{\\pi}{3}$ の2点。「$c$ が $-1\\le c\\le1$ の値を全部とる」ことを書いておくと、答案として完全です。',
        add: [{ t: 'ans', label: '問1 答', text: '最大値 $11$（$z=-1$ のとき）\n最小値 $2$（$z=\\dfrac12\\pm\\dfrac{\\sqrt3}{2}i$ のとき）' }] },
      { ask: { type: 'think', q: '検算：$z=-1$ をもとの式に代入して、絶対値が 11 になることを確かめよう。',
        hint: '$(-1)^4=1,\\ (-1)^3=-1,\\ (-1)^2=1$ を入れる。',
        ans: '$1-2\\cdot(-1)+5\\cdot1-2\\cdot(-1)+1=1+2+5+2+1=11$',
        after: 'くくる前の式に戻して確かめると、変形のまちがいに気づけます。$z=\\frac12+\\frac{\\sqrt3}{2}i$ でも 2 になります。' } },

      // ---------- 問2 (1) ----------
      { clear: true, part: '問2 (1)', say: '問2の(1)。$\\dfrac{x}{\\cos^2x}$ は「$x$」と「$\\dfrac1{\\cos^2x}$」の積。積の形の積分なので、**部分積分** を考えます。',
        add: [{ t: 'h', text: '問2 (1)　x / cos²x の定積分' },
          { t: 'box', c: 'b', size: 'sm', label: '部分積分', text: "$\\displaystyle\\int_a^b f(x)g'(x)\\,dx=\\Big[\\,f(x)g(x)\\,\\Big]_a^b-\\int_a^b f'(x)g(x)\\,dx$" },
          { t: 'fig', id: 'i1', col: 1, view: [-0.22, -0.7, 1.32, 4.8], w: 420, h: 400, items: [
            { k: 'axes', tx: [[Math.PI / 6, 'π/6'], [Math.PI / 3, 'π/3']], ty: [2, 4] },
            { k: 'area', f: 'x/cos(x)**2', a: 0, b: Math.PI / 3, c: 'y', label: 'S', lat: [0.82, 0.7] },
            { k: 'fn', f: 'x/cos(x)**2', a: 0, b: 1.12, label: 'y = x/cos²x', lat: [0.15, 4.25] },
            { k: 'seg', a: [Math.PI / 3, 0], b: [Math.PI / 3, 4 * Math.PI / 3], c: 'd', dash: true, wd: 2 }] }] },
      { ask: { type: 'choice', q: 'どちらを「積分する側（$g\'(x)$）」にする？',
        opts: ['$x$ を積分し、$\\dfrac1{\\cos^2x}$ を微分する', '$\\dfrac1{\\cos^2x}$ を積分（$\\tan x$）し、$x$ を微分する', 'どちらにしても手間は同じ', '部分積分ではなく $t=\\cos x$ と置換する'], ok: 1,
        why: { 0: '$\\frac1{\\cos^2x}$ を微分すると式がもっと複雑になり、積分が終わりません。', 2: '$x$ は微分すると 1 になって消えます。こちらの方がずっと楽です。', 3: '$dt=-\\sin x\\,dx$ の $\\sin x$ が式の中にないので、この置換はうまくいきません。' },
        good: "$(\\tan x)'=\\dfrac1{\\cos^2x}$。$x$ は微分すると 1 になって消えます。",
        add: [{ t: 'm', size: 'sm', tex: "\\int_0^{\\frac{\\pi}{3}}x(\\tan x)'\\,dx=\\Big[\\,x\\tan x\\,\\Big]_0^{\\frac{\\pi}{3}}-\\int_0^{\\frac{\\pi}{3}}\\tan x\\,dx" }] } },
      { say: '前の項は $\\frac{\\pi}{3}\\tan\\frac{\\pi}{3}=\\frac{\\sqrt3}{3}\\pi$。残りの $\\tan x$ は $\\dfrac{\\sin x}{\\cos x}=-\\dfrac{(\\cos x)\'}{\\cos x}$ と見ると、「分母の微分／分母」の形です。',
        add: [{ t: 'm', size: 'sm', tex: "\\int\\tan x\\,dx=-\\int\\frac{(\\cos x)'}{\\cos x}\\,dx=-\\log|\\cos x|+C" }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\frac{\\pi}{3}}\\tan x\\,dx$ の値は？',
        opts: ['$-\\log2$', '$\\log\\dfrac12$', '$\\dfrac{\\sqrt3}{2}$', '$\\log2$'], ok: 3,
        why: { 0: '符号のミスです。$-\\log\\frac12-(-\\log1)=\\log2$。', 1: '$\\log\\frac12<0$ ですが、$0\\le x\\le\\frac{\\pi}{3}$ で $\\tan x\\ge0$ なので、値は正のはず。', 2: '$\\frac{\\sqrt3}{2}$ は $\\sin\\frac{\\pi}{3}$ の値で、積分とは関係ありません。' },
        good: '$\\Big[-\\log\\cos x\\Big]_0^{\\frac{\\pi}{3}}=-\\log\\frac12+\\log1=\\log2$。正の値になることも確かめます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^{\\frac{\\pi}{3}}\\tan x\\,dx=\\Big[-\\log\\cos x\\Big]_0^{\\frac{\\pi}{3}}=\\log2' }] } },
      { say: '(1) の答えは $\\frac{\\sqrt3}{3}\\pi-\\log2$、およそ 1.12。右のグラフの面積 S と見くらべても、それらしい大きさです。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\frac{\\sqrt3}{3}\\pi-\\log2' }] },

      // ---------- 問2 (2) ----------
      { clear: true, cols: [1], part: '問2 (2)', say: '(2) は分数式。分母 $x^2+x+1$ は判別式が負で、実数の範囲では因数分解できません。こういうときは、分子を「**分母の微分**」と「定数」に分けます。',
        add: [{ t: 'h', text: '問2 (2)　(x + 2) / (x² + x + 1) の定積分' },
          { t: 'm', tex: "(x^2+x+1)'=2x+1", note: '分母の微分' }] },
      { ask: { type: 'choice', q: '$x+2=\\square\\,(2x+1)+\\triangle$ と分けるとき、$\\square,\\ \\triangle$ は？',
        opts: ['$\\square=\\frac12,\\ \\triangle=\\frac32$', '$\\square=1,\\ \\triangle=1$', '$\\square=\\frac12,\\ \\triangle=2$', '$\\square=2,\\ \\triangle=0$'], ok: 0,
        why: { 1: '$(2x+1)+1=2x+2$ となり、$x$ の係数が合いません。', 2: '$\\frac12(2x+1)+2=x+\\frac52$ となり、定数がずれています。', 3: '$2(2x+1)=4x+2$ となり、$x$ の係数が合いません。' },
        good: '$\\frac12(2x+1)+\\frac32=x+2$。$x$ の係数を先にそろえてから、定数を合わせます。',
        add: [{ t: 'm', tex: '\\frac{x+2}{x^2+x+1}=\\frac12\\cdot\\frac{2x+1}{x^2+x+1}+\\frac32\\cdot\\frac1{x^2+x+1}' }] } },
      { say: '前半は「分母の微分／分母」なので、すぐに積分できて $\\frac12\\log3$。$x^2+x+1>0$ なので、絶対値の記号はいりません。',
        add: [{ t: 'm', tex: '\\frac12\\int_0^1\\frac{2x+1}{x^2+x+1}\\,dx=\\frac12\\Big[\\log(x^2+x+1)\\Big]_0^1=\\frac12\\log3' }] },
      { clear: true, cols: [0.6, 0.4], say: '後半は分母を平方完成。$\\dfrac1{u^2+a^2}$ の形の積分は、$u=a\\tan\\theta$ と置換するのが定石です。ここでは $x+\\frac12=\\frac{\\sqrt3}{2}\\tan\\theta$。',
        add: [{ t: 'h', text: '問2 (2)　つづき：後半の積分' },
          { t: 'm', tex: 'x^2+x+1=\\left(x+\\frac12\\right)^2+\\left(\\frac{\\sqrt3}{2}\\right)^2' },
          { t: 'm', tex: 'x+\\frac12=\\frac{\\sqrt3}{2}\\tan\\theta', note: '← 置換' }] },
      { ask: { type: 'choice', q: '$x$ が $0\\to1$ と動くとき、$\\theta$ はどこからどこまで？',
        opts: ['$0\\to\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{6}\\to\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{6}\\to\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{3}\\to\\dfrac{\\pi}{6}$'], ok: 2,
        why: { 0: '$x=0$ のとき $\\tan\\theta=\\frac{1/2}{\\sqrt3/2}=\\frac1{\\sqrt3}$ なので、$\\theta=0$ ではありません。', 1: '$x=1$ のとき $\\tan\\theta=\\frac{3/2}{\\sqrt3/2}=\\sqrt3$ です。', 3: '向きが逆です。$x$ が増えると $\\tan\\theta$ も増えます。' },
        good: '$x=0$ で $\\tan\\theta=\\frac1{\\sqrt3}$、$x=1$ で $\\tan\\theta=\\sqrt3$。区間の変えわすれに注意。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['$x$', '$0\\ \\to\\ 1$'], ['$\\theta$', '$\\dfrac{\\pi}{6}\\ \\to\\ \\dfrac{\\pi}{3}$']] }] } },
      { ask: { type: 'think', q: '後半の積分 $\\displaystyle\\int_0^1\\frac{dx}{x^2+x+1}$ を計算しよう。',
        hint: '$dx=\\dfrac{\\sqrt3}{2}\\cdot\\dfrac{d\\theta}{\\cos^2\\theta}$、分母は $\\dfrac34(\\tan^2\\theta+1)=\\dfrac{3}{4\\cos^2\\theta}$。',
        ans: '$\\displaystyle\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{3}}\\frac{4\\cos^2\\theta}{3}\\cdot\\frac{\\sqrt3}{2\\cos^2\\theta}\\,d\\theta=\\frac{2}{\\sqrt3}\\cdot\\frac{\\pi}{6}=\\frac{\\sqrt3}{9}\\pi$',
        after: '$\\cos^2\\theta$ が約分で消えて、$d\\theta$ の定数倍だけが残る。これがこの置換のよいところです。',
        add: [{ t: 'm', tex: '\\int_0^1\\frac{dx}{x^2+x+1}=\\int_{\\frac{\\pi}{6}}^{\\frac{\\pi}{3}}\\frac{2}{\\sqrt3}\\,d\\theta=\\frac{\\sqrt3}{9}\\pi' }] } },
      { say: '最後に合わせます。後半には $\\frac32$ がかかっていることを忘れずに：$\\frac32\\cdot\\frac{\\sqrt3}{9}\\pi=\\frac{\\sqrt3}{6}\\pi$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac12\\log3+\\frac32\\cdot\\frac{\\sqrt3}{9}\\pi', note: '前半 ＋ 後半' },
          { t: 'ans', label: '(2) 答', tex: '\\frac12\\log3+\\frac{\\sqrt3}{6}\\pi' }] },
      { say: 'ミスが出やすいのは、(1) の符号、(2) の係数 $\\frac32$ と積分区間の変えわすれ。最後に「正の値か」「大きさは合うか」（ここでは約 1.46）を確かめましょう。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: '見直しのコツ', text: '(1) 被積分関数は正\n→ 答えも正（約 1.12）\n(2) 被積分関数は 2 から 1 へ減少\n→ 答えは 1 と 2 の間（約 1.46）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。小問集合こそ、方針の選び方と、最後の見直しで差がつきます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
