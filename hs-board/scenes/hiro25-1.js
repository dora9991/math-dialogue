/* 2025 広島大 理系 第1問の類題（自作）：数学Ⅲ 微分法・積分法 ― 対数を x² で割った関数の最大値 → log・log² の不定積分 → 接する2曲線の回転体
   元の問題はうつしていない（「対数をふくむ分数関数の最大値を微分で求める」「log x と (log x)² の不定積分を部分積分で求める」
   「最大値を係数にした曲線と対数曲線が接することを使い、x 軸と囲む図形の回転体の体積を求める」というねらいと形式だけを合わせた自作問題。
   関数は log x / x²、曲線は放物線 y=Mx²）。
   答え（python3・sympy で検算ずみ。体積は数値積分 20 万分割でも一致）：
   (1) f'(x)=(1−2log x)/x³、x=√e で最大値 1/(2e)
   (2) ∫log x dx = x log x − x + C、∫(log x)² dx = x(log x)² − 2x log x + 2x + C
   (3) M=1/(2e)。(1) より x>0 で log x ≦ Mx²（等号は x=√e だけ）、x=√e での傾きはどちらも 1/√e → 点 (√e, 1/2) で接する
       V = π∫₀^√e M²x⁴ dx − π∫₁^√e (log x)² dx = π√e/20 − π(5√e/4 − 2) = (2π/5)(5−3√e) ≒ 0.0677
       （V>0 ⇔ 9e<25。誤答：(3/2)√e−2 は (log√e)²=1/2 としたもの） */
(function () {
  const RE = Math.sqrt(Math.E), M = 1 / (2 * Math.E);
  const POINTS = [
    '$\\dfrac{\\log x}{x^2}$ は商の微分で $\\dfrac{1-2\\log x}{x^3}$。符号は $1-2\\log x$ で決まり、$x=\\sqrt e$ で最大値 $\\dfrac1{2e}$',
    '$\\log x$ の積分は $(x)\'\\log x$ と見て部分積分。$(\\log x)^2$ も同じで、$\\int(\\log x)^2dx=x(\\log x)^2-2\\int\\log x\\,dx$',
    '最大値 $M$ から **$\\log x\\leqq Mx^2$（等号は1点）** → 2曲線は接する。回転体は「外の円 − 内の円」で、内側は $\\log x\\geqq0$ の所だけ'
  ];
  // f(x) のグラフ
  const gf = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.9, -0.5, 6.3, 0.3], w: 560, h: 300, items: [
    { k: 'axes', tx: [[1, '1'], 3, 5], ty: [] },
    { k: 'fn', f: 'log(x)/x**2', a: 0.62, b: 6.2, c: 'w', label: 'y = f(x)', lat: [3.6, 0.17] }].concat(items || []) });
  // C1・C2 の図（y を少しのばしてある）
  const C1 = { k: 'fn', f: 'x**2/(2*E)', a: -0.25, b: 2.4, c: 'p', label: 'C₁', lat: [1.62, 0.84] };
  const C2 = { k: 'fn', f: 'log(x)', a: 0.72, b: 2.4, c: 'b', label: 'C₂', lat: [2.3, 0.7] };
  const T = { k: 'pt', at: [RE, 0.5], name: '(√e, 1/2)', dir: 'nw', c: 'y', size: 21 };
  const gc = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-0.45, -0.32, 2.5, 1.02], w: 560, h: h || 390, items: [
    { k: 'axes', tx: [[1, '1'], [RE, '√e'], 2], ty: [[0.5, '1/2']] }, C1, C2].concat(items || []) });
  const REG = { k: 'area', f: 'x**2/(2*E)', g: 'max(0,log(x))', a: 0, b: RE, c: 'y', alpha: 0.45 };

  HB.lesson({
    id: 'hiro25-1', field: '広島大型　数学（理系）', title: '2025 広島大 理系 第1問の類題 ― 対数の最大値と、接する2曲線の回転体', level: '2025年度 広島大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$\\log x$ は $x$ の自然対数、$e$ は自然対数の底とする。関数 $f(x)=\\dfrac{\\log x}{x^2}\\ \\ (x>0)$ について、次の問いに答えよ。',
      parts: [
        '(1)　$f(x)$ の最大値と、そのときの $x$ の値を求めよ。',
        '(2)　不定積分 $\\displaystyle\\int\\log x\\,dx$，$\\displaystyle\\int(\\log x)^2\\,dx$ を求めよ。',
        '(3)　(1) の最大値を $M$ とする。曲線 $C_1:y=Mx^2\\ (x\\geqq0)$ と曲線 $C_2:y=\\log x$ は1点で接することを示せ。また、$C_1$，$C_2$ と $x$ 軸で囲まれた図形を、$x$ 軸のまわりに1回転してできる立体の体積 $V$ を求めよ。'
      ],
      src: '※ 2025年度 広島大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '数学Ⅲの微分と積分を1本につなぐ問題です。(1) の最大値と (2) の積分が、どちらも (3) の体積で使われます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [1], part: '読みかえ', say: '(3) の2曲線の共有点は $\\log x=Mx^2$ の解。この方程式は式変形では解けません。そこで (1) の最大値が効いてきます。',
        add: [{ t: 'h', text: '小問のつながり' },
          { t: 'tbl', cls: 'rowh', rows: [['小問', 'すること', '(3) での役目'], ['(1)', '$f(x)=\\dfrac{\\log x}{x^2}$ の最大値 $M$', '$\\log x\\leqq Mx^2$ → 2曲線が **接する** ことが分かる'], ['(2)', '$\\log x$，$(\\log x)^2$ の不定積分', '回転体の体積で $\\pi\\int(\\log x)^2dx$ を計算する']] },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '方程式 $\\log x=Mx^2$ を解くかわりに、「$\\dfrac{\\log x}{x^2}\\leqq M$（等号は1点）」と読みかえる。\n両辺に $x^2\\ (>0)$ をかければ　$\\log x\\leqq Mx^2$' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$f(x)=\\dfrac{\\log x}{x^2}$ を商の微分で微分します。分子の微分は $\\dfrac1x$、分母の微分は $2x$ です。',
        add: [{ t: 'h', text: '(1)　f(x) の最大値' },
          { t: 'box', c: 'b', size: 'sm', label: '商の微分', text: "$\\left(\\dfrac{u}{v}\\right)'=\\dfrac{u'v-uv'}{v^2}$" },
          gf('g1')] },
      { ask: { type: 'choice', q: "$f'(x)$ は？",
        opts: ['$\\dfrac{1-\\log x}{x^3}$', '$\\dfrac{1-2\\log x}{x^4}$', '$\\dfrac{2\\log x-1}{x^3}$', '$\\dfrac{1-2\\log x}{x^3}$'], ok: 3,
        why: { 0: '$(x^2)\'=2x$ の 2 が落ちています。', 1: '分子 $x-2x\\log x$ と分母 $x^4$ を $x$ で約分すると、分母は $x^3$。', 2: '分子は $u\'v-uv\'$ の順。引く順が逆です。' },
        good: "$f'(x)=\\dfrac{\\frac1x\\cdot x^2-\\log x\\cdot2x}{x^4}=\\dfrac{x(1-2\\log x)}{x^4}$。$x$ で約分します。",
        add: [{ t: 'm', tex: "f'(x)=\\frac{1-2\\log x}{x^3}" }] } },
      { say: '$x>0$ では $x^3>0$ なので、符号は $1-2\\log x$ で決まります。$\\log x=\\frac12$、つまり $x=\\sqrt e$ を境に、増加から減少に変わります。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$0$', '$\\cdots$', '$\\sqrt e$', '$\\cdots$'], ["$f'(x)$", '', '$+$', '$0$', '$-$'], ['$f(x)$', '', '↗', '最大', '↘']] }],
        draw: [{ fig: 'g1', items: [{ k: 'seg', a: [RE, 0], b: [RE, M], dash: true, c: 'y', wd: 2 }, { k: 'pt', at: [RE, M], c: 'y' }, { k: 'label', at: [RE, 0], text: '√e', dy: 24, c: 'y', size: 21 }] }] },
      { ask: { type: 'choice', q: '最大値 $f(\\sqrt e)$ は？',
        opts: ['$\\dfrac1{2e}$', '$\\dfrac1{2e^2}$', '$\\dfrac1e$', '$\\dfrac1{2\\sqrt e}$'], ok: 0,
        why: { 1: '$(\\sqrt e)^2=e$ です。$e^2$ ではありません。', 2: '$\\log\\sqrt e=\\frac12$。1 ではありません。', 3: '分母は $x$ ではなく $x^2$。$(\\sqrt e)^2=e$ で割ります。' },
        good: '$f(\\sqrt e)=\\dfrac{\\log\\sqrt e}{(\\sqrt e)^2}=\\dfrac{1/2}{e}=\\dfrac1{2e}$。図の山の高さです。',
        add: [{ t: 'ans', label: '(1) 答', text: '$x=\\sqrt e$ のとき　最大値 $\\dfrac1{2e}$' }],
        draw: [{ fig: 'g1', items: [{ k: 'label', at: [RE, M], text: '1/(2e)', dx: 14, dy: -16, anchor: 'start', c: 'y', size: 21 }] }] } },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '(2) です。$\\log x$ だけの積分は、$\\log x=(x)\'\\cdot\\log x$ と **1 を $x$ の微分と見て** 部分積分します。',
        add: [{ t: 'h', text: '(2)　log x と (log x)² の不定積分' },
          { t: 'm', size: 'sm', tex: '\\int\\log x\\,dx=\\int(x)\'\\log x\\,dx' },
          { t: 'm', size: 'sm', tex: '=x\\log x-\\int x\\cdot\\frac1x\\,dx=x\\log x-x+C' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '部分積分', text: "$\\displaystyle\\int f'g\\,dx=fg-\\int fg'\\,dx$\n\n$f=x$（積分する側）\n$g=\\log x$（微分する側）" }] },
      { say: '$(\\log x)^2$ も同じです。$(x)\'\\cdot(\\log x)^2$ と見ると、$(\\log x)^2$ を微分して $\\dfrac{2\\log x}{x}$。$x$ と約分されて、さっきの $\\int\\log x\\,dx$ にもどります。',
        add: [{ t: 'm', size: 'sm', tex: '\\int(\\log x)^2dx=x(\\log x)^2-\\int x\\cdot\\frac{2\\log x}{x}\\,dx' },
          { t: 'm', size: 'sm', tex: '=x(\\log x)^2-2\\int\\log x\\,dx' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int(\\log x)^2dx$ は？（$C$ は積分定数）',
        opts: ['$x(\\log x)^2-2x\\log x-2x+C$', '$x(\\log x)^2-2x\\log x+2x+C$', '$x(\\log x)^2-2x\\log x+C$', '$\\dfrac{(\\log x)^3}{3}+C$'], ok: 1,
        why: { 0: '$-2(x\\log x-x)=-2x\\log x+2x$。かっこをはずすときの符号です。', 2: '$\\int\\log x\\,dx$ の $-x$ の部分を落としています。', 3: 'それは $\\int\\frac{(\\log x)^2}{x}dx$ の答え。$\\frac1x$ がないので使えません。' },
        good: '$x(\\log x)^2-2(x\\log x-x)+C=x(\\log x)^2-2x\\log x+2x+C$。',
        add: [{ t: 'ans', col: 1, size: 'sm', label: '(2) 答', text: '$\\int\\log x\\,dx$\n$=x\\log x-x+C$\n$\\int(\\log x)^2dx$\n$=x(\\log x)^2-2x\\log x+2x+C$\n（$C$ は積分定数）' }] } },
      { ask: { type: 'think', q: '検算：$F(x)=x(\\log x)^2-2x\\log x+2x$ を微分して、$(\\log x)^2$ にもどることを確かめよう。',
        hint: '$\\{x(\\log x)^2\\}\'=(\\log x)^2+x\\cdot\\dfrac{2\\log x}{x}$、$(2x\\log x)\'=2\\log x+2$。',
        ans: "$F'(x)=(\\log x)^2+2\\log x-(2\\log x+2)+2=(\\log x)^2$",
        after: '不定積分は、微分してもとにもどるかで必ず確かめられます。試験でも 30 秒でできる検算です。' } },

      // ---------- (3) 接すること ----------
      { clear: true, part: '(3)', say: '(3) です。$M=\\dfrac1{2e}$ なので $C_1:y=\\dfrac{x^2}{2e}$。(1) から、すべての $x>0$ で $f(x)\\leqq M$。両辺に $x^2\\ (>0)$ をかけます。',
        add: [{ t: 'h', text: '(3)　C₁ と C₂ が接すること' },
          { t: 'm', tex: '\\frac{\\log x}{x^2}\\leqq\\frac1{2e}\\quad(x>0)', note: '(1) より' },
          gc('c1')] },
      { ask: { type: 'choice', q: '(1) から、$x>0$ で言えることは？',
        opts: ['$\\log x\\geqq\\frac{x^2}{2e}$（等号は $x=\\sqrt e$）', '$\\log x\\leqq\\frac{x^2}{2e}$（等号は $x=\\sqrt e$）', '$\\log x<\\frac{x^2}{2e}$（共有点なし）', '共有点は $x=\\sqrt e$、上下は不明'], ok: 1,
        why: { 0: '不等号の向きが逆です。$x^2>0$ をかけても向きは変わりません。', 2: '$x=\\sqrt e$ では $f(x)=M$ なので、等号が成り立ちます。', 3: '$f(x)\\leqq M$ がすべての $x>0$ で成り立つので、上下も分かります。' },
        good: '$C_2$ はいつも $C_1$ の下にあり、重なるのは $x=\\sqrt e$ の1点だけです。',
        add: [{ t: 'm', tex: '\\log x\\leqq\\frac{x^2}{2e}', note: '等号は $x=\\sqrt e$ だけ' }],
        draw: [{ fig: 'c1', items: [T] }] } },
      { say: '共有点 $(\\sqrt e,\\ \\frac12)$ での傾きを比べます。$C_1$ は $\\dfrac{x}{e}$、$C_2$ は $\\dfrac1x$。$x=\\sqrt e$ ではどちらも $\\dfrac1{\\sqrt e}$。だから2曲線はこの点で **接します**。',
        add: [{ t: 'm', size: 'sm', tex: "C_1:\\ y'=\\frac{x}{e}\\ \\to\\ \\frac{\\sqrt e}{e}=\\frac1{\\sqrt e},\\qquad C_2:\\ y'=\\frac1x\\ \\to\\ \\frac1{\\sqrt e}" },
          { t: 'ans', label: '(3) 前半', text: '共有点は $(\\sqrt e,\\ \\frac12)$ の1つだけで、そこでの接線の傾きが等しい。\nよって $C_1$ と $C_2$ はこの点で接する。' }],
        draw: [{ fig: 'c1', items: [{ k: 'line', m: 1 / RE, n: 0.5 - 1, a: 0.6, b: 2.45, c: 'y', dash: true, wd: 2 }] }] },

      // ---------- (3) 体積 ----------
      { clear: true, part: '(3) 体積', say: '囲まれた図形は黄色の部分。$x$ 軸に垂直に切ると、回転した切り口は **穴のあいた円**。外の半径は $\\frac{x^2}{2e}$、穴の半径は $\\log x$（$x<1$ では穴なし）です。',
        add: [{ t: 'h', text: '(3)　回転体の体積 V' },
          gc('c2', [REG, T,
            { k: 'seg', a: [1.35, 0], b: [1.35, 1.35 * 1.35 * M], c: 'p', wd: 5 }, { k: 'seg', a: [1.35, 0], b: [1.35, Math.log(1.35)], c: 'b', wd: 5 },
            { k: 'label', at: [0.55, 0.2], text: '外の半径', c: 'p', size: 19 }, { k: 'seg', a: [0.85, 0.17], b: [1.33, 0.29], c: 'p', wd: 1.5 }], 330),
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '切り口', text: '$0\\leqq x\\leqq1$：半径 $\\frac{x^2}{2e}$ の円\n$1\\leqq x\\leqq\\sqrt e$：外の半径 $\\frac{x^2}{2e}$、穴の半径 $\\log x$' }] },
      { ask: { type: 'choice', q: '体積 $V$ を表す式は？（$M=\\dfrac1{2e}$）',
        opts: ['$\\pi\\int_0^{\\sqrt e}M^2x^4dx-\\pi\\int_1^{\\sqrt e}(\\log x)^2dx$', '$\\pi\\int_1^{\\sqrt e}(Mx^2-\\log x)^2dx$', '$\\pi\\int_0^{\\sqrt e}M^2x^4dx-\\pi\\int_0^{\\sqrt e}(\\log x)^2dx$', '$\\pi\\int_0^{\\sqrt e}(Mx^2-\\log x)\\,dx$'], ok: 0,
        why: { 1: '「差の2乗」ではなく「2乗の差」。穴のあいた円の面積は $\\pi R^2-\\pi r^2$ です。', 2: '$0<x<1$ では $\\log x<0$ で、図形は $x$ 軸より上だけ。穴はありません。', 3: 'それは（$\\pi$ 倍した）面積の式に近いもの。回転体は半径の2乗です。' },
        good: '切り口の面積 $\\pi(Mx^2)^2-\\pi(\\log x)^2$ を積分します。穴の部分は $1\\leqq x\\leqq\\sqrt e$ だけ。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\pi\\int_0^{\\sqrt e}\\frac{x^4}{4e^2}dx-\\pi\\int_1^{\\sqrt e}(\\log x)^2dx' }] } },
      { say: '前の積分から。$(\\sqrt e)^5=e^2\\sqrt e$ なので、$\\dfrac{1}{4e^2}\\cdot\\dfrac{e^2\\sqrt e}{5}=\\dfrac{\\sqrt e}{20}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^{\\sqrt e}\\frac{x^4}{4e^2}dx=\\frac1{4e^2}\\Big[\\frac{x^5}{5}\\Big]_0^{\\sqrt e}=\\frac{\\sqrt e}{20}' }] },
      { ask: { type: 'choice', q: '(2) を使って、$\\displaystyle\\int_1^{\\sqrt e}(\\log x)^2dx$ は？',
        opts: ['$\\dfrac54\\sqrt e$', '$\\dfrac32\\sqrt e-2$', '$\\dfrac54\\sqrt e-2$', '$\\dfrac54\\sqrt e+2$'], ok: 2,
        why: { 0: '下端 $x=1$ での値 $0-0+2=2$ を引き忘れています。', 1: '$(\\log\\sqrt e)^2=\\left(\\frac12\\right)^2=\\frac14$。$\\frac12$ としています。', 3: '下端の値は **引く** ので $-2$ です。' },
        good: '$\\Big[x(\\log x)^2-2x\\log x+2x\\Big]_1^{\\sqrt e}=\\sqrt e\\left(\\frac14-1+2\\right)-2=\\frac54\\sqrt e-2$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_1^{\\sqrt e}(\\log x)^2dx=\\sqrt e\\Big(\\frac14-1+2\\Big)-2=\\frac54\\sqrt e-2' }] } },
      { say: 'まとめると、$\\dfrac{\\sqrt e}{20}-\\dfrac54\\sqrt e=-\\dfrac{24}{20}\\sqrt e=-\\dfrac65\\sqrt e$。体積は $\\pi\\left(2-\\dfrac65\\sqrt e\\right)$ です。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'V=\\pi\\Big(2-\\frac65\\sqrt e\\Big)=\\frac{2\\pi}{5}\\big(5-3\\sqrt e\\big)' }] },
      { ask: { type: 'think', q: '答えの $V=\\dfrac{2\\pi}{5}(5-3\\sqrt e)$ は、本当に正の数？ $e$ についての条件に直して確かめよう。',
        hint: '$5-3\\sqrt e>0\\iff3\\sqrt e<5$。両辺とも正なので2乗してよい。',
        ans: '$3\\sqrt e<5\\iff9e<25\\iff e<\\dfrac{25}{9}=2.77\\cdots$。$e=2.718\\cdots$ なので正しい。$V\\fallingdotseq0.068$',
        after: '図形がとても細いので、体積も小さくなります。答えが負になったら、どこかでまちがえた合図です。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '記述式では、(3) の「接する」の根拠と、回転体の切り口の説明が採点のポイントになります。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)', text: "$f'(x)$ を因数の形にして増減表を書く。「$x>0$ で $x^3>0$」と符号の理由を一言。" },
          { t: 'box', c: 'y', size: 'sm', label: '(3) 接する', text: '「(1) より $x>0$ で $\\dfrac{\\log x}{x^2}\\leqq M$。$x^2>0$ をかけて $\\log x\\leqq Mx^2$（等号は $x=\\sqrt e$ のときのみ）。共有点 $(\\sqrt e,\\frac12)$ で、両曲線の接線の傾きはともに $\\frac1{\\sqrt e}$」' },
          { t: 'box', c: 'p', size: 'sm', label: '(3) 体積', text: '「$0\\leqq x\\leqq\\sqrt e$ で $C_1$ が上。$0<x<1$ では $\\log x<0$」と、穴がある所・ない所を分けて書いてから積分する。' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。最大値で不等式を作り、その等号から接点を見つける。数学Ⅲでよく使う流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
