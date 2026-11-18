/* 神戸大型 数学（理系）：2026年度 神戸大学 前期 理系 第4問の類題（自作問題・元の問題ではない）
   問題：g は連続、a は定数。F(x)=∫_a^x sin2(x−t) g(t) dt
   答え（python3・sympy で検算ずみ）：
     (1) F'(x)=2∫_a^x cos2(x−t) g(t) dt、F(a)=0、F'(a)=0
     (2) F''(x)=2g(x)−4F(x)
     (3) F=x²+sin²x ⇒ F''=2+2cos2x、2g=F''+4F=4x²+4 → g=2x²+2、F(a)=a²+sin²a=0 → a=0
         g=2t²+2, a=0 ⇒ ∫_0^x(2t²+2)sin2(x−t)dt=x²+1−cos2x−sin²x=x²+sin²x（部分積分2回）
         （(2) の式だけでは不十分：x²+sin²x+sin2x も F''+4F=4x²+4 をみたす） */
(function () {
  const POINTS = [
    '$\\displaystyle\\int_a^x\\sin2(x-t)\\,g(t)\\,dt$ は **加法定理で $x$ を積分の外へ** 出し、$\\dfrac{d}{dx}\\displaystyle\\int_a^x h(t)\\,dt=h(x)$ が使える形にしてから微分する',
    "微分すると $g(x)$ の項は打ち消し合い、$F''(x)=2g(x)-4F(x)$。上端と下端が同じなので $F(a)=F'(a)=0$ も大事な情報",
    '必要十分は両方向。「⇒」は (2) と $F(a)=0$ で決まる。「⇐」は (2) の式だけでは不十分で、**実際に積分を計算**（部分積分 2 回）する'
  ];

  HB.lesson({
    id: 'kobe26-4', field: '神戸大型　数学（理系）', title: '2026 神戸大 理系 第4問の類題 ― sin 2(x−t) をふくむ定積分で決まる関数', level: '2026年度 神戸大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$g(x)$ はすべての実数で定義された連続な関数、$a$ は実数の定数とする。$F(x)=\\displaystyle\\int_a^x\\sin2(x-t)\\,g(t)\\,dt$ とおく。',
      parts: [
        "(1)　$F'(x)=2\\displaystyle\\int_a^x\\cos2(x-t)\\,g(t)\\,dt$ であることを示し、$F(a)$，$F'(a)$ の値を求めよ。",
        "(2)　$F''(x)$ を $F(x)$ と $g(x)$ を用いて表せ。",
        '(3)　「すべての実数 $x$ について $F(x)=x^2+\\sin^2x$」が成り立つことは、「すべての実数 $x$ について $g(x)=2x^2+2$」かつ「$a=0$」であるための必要十分条件であることを示せ。'
      ],
      src: '※ 2026年度 神戸大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: '問題', say: '定積分で決まる関数を微分する問題です。積分の中に $x$ がまざっているのがポイント。まず問題文を読みましょう（Q キーで、いつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.6, 0.4], part: '読みかえ', say: '積分の中には、積分の変数 $t$ と、外の文字 $x$ がまざっています。このままでは微分の公式が使えないので、加法定理で $x$ を積分の外に出します。',
        add: [{ t: 'h', text: '読みかえ：x を積分の外に出す' },
          { t: 'm', tex: 'F(x)=\\int_a^x\\sin2(x-t)\\,g(t)\\,dt' },
          { t: 'box', c: 'b', size: 'sm', label: '微分の公式', text: '$\\dfrac{d}{dx}\\displaystyle\\int_a^x h(t)\\,dt=h(x)$（$h$ は連続）\n※ $h$ の中に $x$ があると、そのままは使えない' }] },
      { ask: { type: 'choice', q: '$\\sin2(x-t)$ を加法定理で展開すると？',
        opts: ['$\\sin2x\\cos2t+\\cos2x\\sin2t$', '$\\sin2x\\cos2t-\\cos2x\\sin2t$', '$\\cos2x\\cos2t+\\sin2x\\sin2t$', '$\\sin2x-\\sin2t$'], ok: 1,
        why: { 0: '$\\sin(A-B)$ は、まん中がひき算です。', 2: 'それは $\\cos2(x-t)$ の展開です。', 3: '$\\sin$ は、ひき算に分配できません。' },
        good: '$\\sin(A-B)=\\sin A\\cos B-\\cos A\\sin B$ で、$A=2x,\\ B=2t$。$x$ だけの部分は積分の外に出せます。',
        add: [{ t: 'm', size: 'sm', tex: 'F(x)=\\sin2x\\int_a^x g(t)\\cos2t\\,dt-\\cos2x\\int_a^x g(t)\\sin2t\\,dt' }] } },
      { say: "2 つの積分を $A(x),\\ B(x)$ とおきます。$g$ は連続なので、微分の公式から $A'(x)=g(x)\\cos2x$、$B'(x)=g(x)\\sin2x$ です。",
        add: [{ t: 'm', tex: 'F(x)=\\sin2x\\cdot A(x)-\\cos2x\\cdot B(x)' },
          { t: 'm', col: 1, size: 'sm', tex: 'A(x)=\\int_a^x g(t)\\cos2t\\,dt' },
          { t: 'm', col: 1, size: 'sm', tex: 'B(x)=\\int_a^x g(t)\\sin2t\\,dt' },
          { t: 'm', col: 1, size: 'sm', tex: "A'(x)=g(x)\\cos2x" },
          { t: 'm', col: 1, size: 'sm', tex: "B'(x)=g(x)\\sin2x" }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.62, 0.38], part: '(1)', say: '(1) です。積の微分で、$F(x)=\\sin2x\\cdot A(x)-\\cos2x\\cdot B(x)$ を微分します。',
        add: [{ t: 'h', text: "(1)　$F'(x)$ と $F(a),\\ F'(a)$" },
          { t: 'm', size: 'sm', tex: "\\begin{aligned}F'(x)&=2\\cos2x\\cdot A+\\sin2x\\cdot g(x)\\cos2x\\\\ &\\quad+2\\sin2x\\cdot B-\\cos2x\\cdot g(x)\\sin2x\\end{aligned}" }] },
      { ask: { type: 'choice', q: '$g(x)$ をふくむ 2 つの項はどうなる？',
        opts: ['$2g(x)\\sin2x\\cos2x$ が残る', '$g(x)$ が残る', '打ち消し合って消える', '$g(x)\\sin4x$ が残る'], ok: 2,
        why: { 0: '符号を見ましょう。$+g\\sin2x\\cos2x$ と $-g\\cos2x\\sin2x$ です。', 1: '$\\sin^2+\\cos^2$ の形ではなく、同じ積のひき算です。', 3: '$2\\sin2x\\cos2x=\\sin4x$ ですが、ここはひき算なので 0 です。' },
        good: '同じ $g(x)\\sin2x\\cos2x$ のひき算で 0。残りは $2\\{\\cos2x\\cdot A+\\sin2x\\cdot B\\}$ です。',
        add: [{ t: 'm', tex: "F'(x)=2\\{\\cos2x\\cdot A(x)+\\sin2x\\cdot B(x)\\}" }] } },
      { say: '$A,\\ B$ を積分にもどし、加法定理を逆に使います。$\\cos2x\\cos2t+\\sin2x\\sin2t=\\cos2(x-t)$ なので、示す式になります。',
        add: [{ t: 'm', size: 'sm', tex: "F'(x)=2\\int_a^x(\\cos2x\\cos2t+\\sin2x\\sin2t)\\,g(t)\\,dt" },
          { t: 'm', tex: "\\phantom{F'(x)}=2\\int_a^x\\cos2(x-t)\\,g(t)\\,dt" }] },
      { say: "上端と下端が同じ積分は 0 なので、$F(a)=0$、$F'(a)=0$ です。この 2 つは (3) で使います。",
        add: [{ t: 'ans', col: 1, label: '(1) 答', text: "$F(a)=0$\n$F'(a)=0$" },
          { t: 'p', col: 1, size: 'sm', text: '$\\displaystyle\\int_a^a(\\cdots)\\,dt=0$ だから' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.64, 0.36], part: '(2)', say: "(2) です。$F'(x)=2\\{\\cos2x\\cdot A+\\sin2x\\cdot B\\}$ を、もう一度積の微分で微分します。かっこの外の 2 はそのまま残しておきます。",
        add: [{ t: 'h', text: "(2)　$F''(x)$ を $F(x),\\ g(x)$ で表す" },
          { t: 'm', size: 'sm', tex: "\\begin{aligned}F''(x)&=2\\{-2\\sin2x\\cdot A+\\cos2x\\cdot g(x)\\cos2x\\\\ &\\qquad+2\\cos2x\\cdot B+\\sin2x\\cdot g(x)\\sin2x\\}\\end{aligned}" }] },
      { say: '整理します。$A,\\ B$ の項は $-2(\\sin2x\\cdot A-\\cos2x\\cdot B)=-2F(x)$。$g(x)$ の項は $g(x)(\\cos^22x+\\sin^22x)=g(x)$ です。',
        add: [{ t: 'm', tex: "F''(x)=2\\{-2F(x)+g(x)\\}" }] },
      { ask: { type: 'choice', q: "$F''(x)$ を $F(x),\\ g(x)$ で表すと？",
        opts: ['$g(x)-F(x)$', '$2g(x)+4F(x)$', '$2g(x)-2F(x)$', '$2g(x)-4F(x)$'], ok: 3,
        why: { 0: 'それは $\\sin(x-t)$ のときの形です。ここは $\\sin2(x-t)$ なので、係数が変わります。', 1: '$\\cos2x$ を微分すると $-2\\sin2x$。$F$ の項はマイナスです。', 2: 'かっこをはずすとき、$-2F$ も 2 倍して $-4F$ です。' },
        good: "$F''(x)=2g(x)-4F(x)$。「$F''+4F=2g$」の形でも見ておくと、(3) で使いやすくなります。",
        add: [{ t: 'ans', label: '(2) 答', tex: "F''(x)=2g(x)-4F(x)" }] } },

      // ---------- (3) 必要 ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: '(3) は必要十分条件の証明です。「ならば」の 2 つの向き（ア）（イ）を、それぞれ示します。',
        add: [{ t: 'h', text: '(3)　必要十分条件を示す' },
          { t: 'box', c: 'b', size: 'sm', label: '示すこと', text: '（ア）$F(x)=x^2+\\sin^2x$ $\\Rightarrow$ $g(x)=2x^2+2$ かつ $a=0$\n（イ）$g(x)=2x^2+2$ かつ $a=0$ $\\Rightarrow$ $F(x)=x^2+\\sin^2x$' }] },
      { say: "（ア）から。$F(x)=x^2+\\sin^2x$ がすべての $x$ で成り立つなら、$F'(x)=2x+\\sin2x$、$F''(x)=2+2\\cos2x$。これを (2) の式に入れます。",
        add: [{ t: 'm', tex: "F''(x)=2+2\\cos2x" },
          { t: 'm', tex: "2g(x)=F''(x)+4F(x)", note: '(2) より' }] },
      { ask: { type: 'choice', q: '$g(x)$ を求めると？',
        opts: ['$4x^2+4$', '$2x^2+2+2\\cos2x$', '$2x^2+2$', '$x^2+1$'], ok: 2,
        why: { 0: 'それは $2g(x)$ です。2 で割るのを忘れています。', 1: '$4\\sin^2x=2-2\\cos2x$ を使うと、$\\cos2x$ は消えます。', 3: '$2g=4x^2+4$ を 4 で割っています。' },
        good: '$2g=2+2\\cos2x+4x^2+4\\sin^2x=4x^2+4$（$4\\sin^2x=2-2\\cos2x$）。よって $g(x)=2x^2+2$。',
        add: [{ t: 'm', tex: 'g(x)=2x^2+2' }] } },
      { say: '$a$ は (1) の $F(a)=0$ から決まります。$a^2+\\sin^2a=0$ で、2 乗の和が 0 だから $a=0$。これで（ア）が示せました。',
        add: [{ t: 'm', tex: 'F(a)=a^2+\\sin^2a=0\\ \\Rightarrow\\ a=0', note: '2 乗の和が 0' }] },

      // ---------- (3) 十分 ----------
      { clear: true, cols: [0.64, 0.36], part: '(3) 逆', say: '（イ）です。$g(t)=2t^2+2$、$a=0$ のとき、$F(x)$ が本当に $x^2+\\sin^2x$ になるかを確かめます。',
        add: [{ t: 'h', text: '(3)　（イ）g(x) = 2x² + 2，a = 0 のとき' },
          { t: 'm', tex: 'F(x)=\\int_0^x(2t^2+2)\\sin2(x-t)\\,dt' }] },
      { ask: { type: 'choice', q: '（イ）の示し方として確実なのは？',
        opts: ['この積分を実際に計算する', "(2) の式 $F''=2g-4F$ をみたすことを確かめる", '$x=0$ を代入して両辺を比べる', '（ア）の計算を逆にたどる'], ok: 0,
        why: { 1: "$F''+4F=4x^2+4$ をみたす関数は、$x^2+\\sin^2x+\\sin2x$ などほかにもあります。", 2: '1 つの $x$ で等しくても、すべての $x$ で等しいとは言えません。', 3: '（ア）は (2) の式だけを使っているので、同じく不十分です。' },
        good: '$x$ を定数とみて、$t$ で部分積分します。これがいちばん確実です。' } },
      { say: '$\\sin2(x-t)$ の（$t$ についての）原始関数は $\\frac12\\cos2(x-t)$。$t$ で微分すると、$-2$ が 2 回かかってもどります。これで部分積分します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}F(x)&=\\Big[(t^2+1)\\cos2(x-t)\\Big]_0^x-\\int_0^x2t\\cos2(x-t)\\,dt\\\\ &=x^2+1-\\cos2x-\\int_0^x2t\\cos2(x-t)\\,dt\\end{aligned}' }] },
      { ask: { type: 'think', q: '$\\displaystyle\\int_0^x2t\\cos2(x-t)\\,dt$ を計算しよう。',
        hint: 'もう一度部分積分。$\\cos2(x-t)$ の（$t$ についての）原始関数は $-\\dfrac12\\sin2(x-t)$。',
        ans: '$\\Big[-t\\sin2(x-t)\\Big]_0^x+\\displaystyle\\int_0^x\\sin2(x-t)\\,dt=0+\\dfrac{1-\\cos2x}{2}=\\sin^2x$',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^x2t\\cos2(x-t)\\,dt=\\sin^2x' }] } },
      { say: '$1-\\cos2x=2\\sin^2x$ なので、$F(x)=x^2+2\\sin^2x-\\sin^2x=x^2+\\sin^2x$。（イ）も示せました。',
        add: [{ t: 'm', size: 'sm', tex: 'F(x)=x^2+(1-\\cos2x)-\\sin^2x=x^2+\\sin^2x' },
          { t: 'ans', label: '(3) 結論', text: '（ア）（イ）より、必要十分条件である。' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: "（イ）は (1)(2) からも示せます。$D(x)=F(x)-(x^2+\\sin^2x)$ とおくと、$D''=-4D$、$D(0)=D'(0)=0$。ここから $D=0$ を導く工夫があります。",
        add: [{ t: 'h', text: '別の見方：（イ）を (1)(2) から示す' },
          { t: 'm', tex: "D''(x)=-4D(x),\\quad D(0)=D'(0)=0" },
          { t: 'm', tex: "E(x)=\\{D'(x)\\}^2+4\\{D(x)\\}^2" },
          { t: 'm', tex: "E'(x)=2D'(x)\\{D''(x)+4D(x)\\}=0" }] },
      { say: '$E(x)$ は定数で $E(0)=0$ だから、つねに $E(x)=0$。2 乗の和が 0 なので $D(x)=0$。(2) の式に「$F(0)=F\'(0)=0$」を合わせると、関数が1つに決まるわけです。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: "・(1) 加法定理で $x$ を積分の外に出してから微分する\n・(2) $g(x)$ の項が消えること、$\\cos^2+\\sin^2=1$ を書く\n・(3) 必要と十分の両方。十分は「計算」か「$E(x)$ の工夫」で" }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「$x$ を外に出して微分」「$F\'\'=2g-4F$」「十分のほうは実際に計算」の 3 つが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
