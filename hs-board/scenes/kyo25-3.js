/* 京大型（理系）2025 第3問の類題（自作）：数学Ⅲ 微分法 ― 対数をふくむ曲線の法線と x 軸の交点の範囲
   元の問題はうつしていない（「対数をふくむ関数」「接線に垂直な直線と x 軸の交点」「増減から値の範囲」というねらいと形式だけを合わせた自作問題）。
   C: y = √x (log x − 2)（x>0）。f'(x) = log x / (2√x)、極小 (1, −2)、x 軸と (e², 0) で交わる。
   法線と x 軸の交点 X(t) = t + f(t)f'(t) = t + (1/2)(log t)² − log t（f'(t)=0 の t=1 でも X=1 で同じ）
   X'(t) = (t + log t − 1)/t、t=1 で最小値 1、t→+0・t→∞ で +∞ → 答え X ≥ 1。python3（sympy・数値）で検算ずみ。 */
(function () {
  const POINTS = [
    "法線と $x$ 軸の交点は $X=t+f(t)f'(t)$。$f'(t)=0$（法線が $x=t$）の場合も別に確かめ、同じ式でよいことを言う",
    "$X'(t)=\\dfrac{t+\\log t-1}{t}$。分子は増加関数で $t=1$ のとき 0 → 増減表。符号を決める部分だけを取り出す",
    '値の範囲は「増減」＋「両はしの極限」＋「連続（中間値の定理）」の3点セットで答える'
  ];
  const F = x => Math.sqrt(x) * (Math.log(x) - 2), FP = x => Math.log(x) / (2 * Math.sqrt(x));
  const XT = t => t + 0.5 * Math.log(t) ** 2 - Math.log(t);
  const VIEW = [-0.6, -2.6, 8.6, 1.4];
  const curve = (w) => [
    { k: 'axes', tx: [1, 2, 3, 4, 5, 6, [Math.E ** 2, 'e²']], ty: [[-2, '−2'], [1, '1']] },
    { k: 'fn', f: 'sqrt(x)*(log(x)-2)', a: 0.000001, b: 8.6, label: 'C', lat: [8.15, 0.75], c: 'w' }];
  // t における法線（P から x 軸の交点 Q を少しこえるまで）
  const normal = (t, c, ext) => {
    const P = [t, F(t)], Q = [XT(t), 0];
    if (Math.abs(FP(t)) < 1e-9) return [{ k: 'seg', a: [1, -2.5], b: [1, 1.2], c, wd: 2.5 }, { k: 'pt', at: P, c, r: 5 }, { k: 'pt', at: Q, c, r: 6 }];
    const d = [-FP(t), 1], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L], e = ext || 0.7;
    return [{ k: 'seg', a: [P[0] - u[0] * 0.35, P[1] - u[1] * 0.35], b: [Q[0] + u[0] * e, Q[1] + u[1] * e], c, wd: 2.5 }, { k: 'pt', at: P, c, r: 5 }, { k: 'pt', at: Q, c, r: 6 }];
  };
  const cfig = (id, items, w) => ({ t: 'fig', id, col: 1, view: VIEW, w: w || 640, h: Math.round((w || 640) * 4 / 9.2), items: curve().concat(items || []) });

  HB.lesson({
    id: 'kyo25-3', field: '京大型　数学（理系）', title: '2025 京大 理系 第3問の類題 ― 法線と x 軸の交点の範囲', level: '2025年度 京都大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上の曲線 $C:\\ y=\\sqrt{x}\\,(\\log x-2)\\ \\ (x>0)$ を考える。$C$ 上の点 P を通り、P における $C$ の接線に垂直な直線を $m$ とし、$m$ と $x$ 軸の交点の $x$ 座標を $X$ とする。点 P が $C$ 上を動くとき、$X$ のとりうる値の範囲を求めよ。ただし、$\\log x$ は $x$ の自然対数である。',
      parts: [],
      src: '※ 2025年度 京都大学 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '微分法の問題です。「接線に垂直な直線」は **法線** のこと。法線と $x$ 軸の交点が、P とともにどう動くかを調べます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 曲線 C ----------
      { clear: true, part: '曲線 C', say: 'まず曲線 $C$ の形をつかみます。$f(x)=\\sqrt x(\\log x-2)$ とおいて、積の微分で $f\'(x)$ を求めます。',
        add: [{ t: 'h', text: '曲線 C の形' },
          { t: 'm', tex: 'f(x)=\\sqrt x\\,(\\log x-2)\\quad(x>0)' }] },
      { ask: { type: 'choice', q: "$f'(x)$ は？",
        opts: ['$\\dfrac{\\log x-2}{2\\sqrt x}$', '$\\dfrac{\\log x}{2\\sqrt x}$', '$\\dfrac{1}{2x\\sqrt x}$', '$\\dfrac{\\log x}{\\sqrt x}$'], ok: 1,
        why: { 0: '積の微分の後ろ半分 $\\sqrt x\\cdot\\frac1x$ を忘れています。', 2: '$(\\sqrt x)\'$ と $(\\log x-2)\'$ をかけています。積の微分の公式ではありません。', 3: '通分のとき、分母の 2 を落としています。' },
        good: '$\\dfrac{\\log x-2}{2\\sqrt x}+\\dfrac{\\sqrt x}{x}=\\dfrac{\\log x-2+2}{2\\sqrt x}=\\dfrac{\\log x}{2\\sqrt x}$。',
        add: [{ t: 'm', tex: "f'(x)=\\frac{\\log x}{2\\sqrt x}" }] } },
      { say: "$f'(x)$ の符号は $\\log x$ と同じ。$x=1$ で極小値 $-2$。また $x\\to+0$ で $f(x)\\to0$、$x=e^2$ で $x$ 軸と交わります。",
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$0$', '$\\cdots$', '$1$', '$\\cdots$'], ["$f'(x)$", '', '$-$', '$0$', '$+$'], ['$f(x)$', '$(0)$', '↘', '$-2$', '↗']] },
          { t: 'p', size: 'sm', text: '$\\displaystyle\\lim_{x\\to+0}\\sqrt x\\log x=0$ より $f(x)\\to0$' },
          cfig('c1', [{ k: 'pt', at: [1, -2], name: '(1, −2)', dir: 'se', c: 'y', size: 21 }, { k: 'pt', at: [Math.E ** 2, 0], c: 'y', r: 5 }])] },

      // ---------- 法線の式 ----------
      { clear: true, cols: [0.56, 0.44], part: '法線', say: "P$(t,\\ f(t))$ とします。$f'(t)\\neq0$ のとき、法線 $m$ の傾きは $-\\dfrac1{f'(t)}$ です。",
        add: [{ t: 'h', text: '法線と x 軸の交点' },
          { t: 'm', tex: "m:\\ y-f(t)=-\\frac{1}{f'(t)}(x-t)", note: "$f'(t)\\neq0$ のとき" },
          cfig('c2', normal(0.3, 'b').concat([{ k: 'label', at: [0.3, F(0.3)], text: 'P', dx: 20, dy: 24, c: 'b', size: 24 }, { k: 'label', at: [XT(0.3), 0], text: 'X', dx: -16, dy: -22, c: 'b', size: 24 }]), 600)] },
      { ask: { type: 'choice', q: '$y=0$ とおくと、交点の $x$ 座標 $X$ は？',
        opts: ["$t-f(t)f'(t)$", "$t-\\dfrac{f(t)}{f'(t)}$", "$t+f(t)f'(t)$", "$t+\\dfrac{f(t)}{f'(t)}$"], ok: 2,
        why: { 0: "符号のミス。$-f(t)=-\\frac{1}{f'(t)}(X-t)$ の両辺に $-f'(t)$ をかけると $X-t=f(t)f'(t)$。", 1: 'それは **接線** と $x$ 軸の交点です。法線ではありません。', 3: '法線では、$f(t)$ と $f\'(t)$ の「積」になります。' },
        good: "$-f(t)=-\\dfrac{1}{f'(t)}(X-t)$ より、$X-t=f(t)f'(t)$。",
        add: [{ t: 'm', tex: "X=t+f(t)f'(t)" }] } },
      { ask: { type: 'choice', q: "$f'(t)=0$（$t=1$）のときは、どう扱う？",
        opts: ['$m$ は直線 $x=1$ で、$X=1$', '$m$ は $x$ 軸に平行で、交点なし', '法線がないので除外する', '$m$ は接線と一致する'], ok: 0,
        why: { 1: '接線が水平（$y=-2$）なので、それに垂直な $m$ は縦の直線 $x=1$ です。', 2: '接線 $y=-2$ に垂直な直線 $x=1$ が、ちゃんとあります。', 3: '垂直な2直線が同じ直線になることはありません。' },
        good: '法線は縦の直線 $x=1$ で $X=1$。式 $t+f(t)f\'(t)$ に $t=1$ を入れた値と一致します。',
        add: [{ t: 'p', size: 'sm', text: "$t=1$：$m$ は $x=1$、$X=1=1+f(1)f'(1)$\n→ すべての $t>0$ で　$X=t+f(t)f'(t)$" }] } },
      { say: "$m$ は傾きが 0 になることがない（$x$ 軸に平行にならない）ので、交点はいつも1つ。代入すると $f(t)f'(t)=\\frac12(\\log t)^2-\\log t$ です。",
        add: [{ t: 'm', size: 'sm', tex: "f(t)f'(t)=\\sqrt t(\\log t-2)\\cdot\\frac{\\log t}{2\\sqrt t}=\\frac12(\\log t)^2-\\log t" },
          { t: 'box', c: 'y', label: 'X を t で表す', tex: 'X(t)=t+\\frac12(\\log t)^2-\\log t\\quad(t>0)' }] },

      // ---------- 増減 ----------
      { clear: true, cols: [0.56, 0.44], part: 'X(t) の増減', say: '残りは、$t>0$ で $X(t)$ がとる値の範囲。微分して増減を調べます。',
        add: [{ t: 'h', text: 'X(t) の増減' },
          { t: 'm', tex: 'X(t)=t+\\frac12(\\log t)^2-\\log t' }] },
      { ask: { type: 'choice', q: "$X'(t)$ は？",
        opts: ['$\\dfrac{t+2\\log t-1}{t}$', '$1+\\log t-\\dfrac1t$', '$\\dfrac{t-\\log t-1}{t}$', '$\\dfrac{t+\\log t-1}{t}$'], ok: 3,
        why: { 0: '$\\frac12(\\log t)^2$ の微分は $\\frac12\\cdot2\\log t\\cdot\\frac1t=\\frac{\\log t}{t}$。2 は残りません。', 1: '$(\\log t)^2$ の微分で、合成関数の $\\frac1t$ をかけ忘れています。', 2: '符号のミス。$\\frac12(\\log t)^2$ の微分は $+\\frac{\\log t}{t}$ です。' },
        good: "$X'(t)=1+\\dfrac{\\log t}{t}-\\dfrac1t=\\dfrac{t+\\log t-1}{t}$。",
        add: [{ t: 'm', tex: "X'(t)=\\frac{t+\\log t-1}{t}" }] } },
      { say: '分母 $t>0$ なので、符号は分子 $g(t)=t+\\log t-1$ で決まります。$t$ も $\\log t$ も増加なので $g$ は **増加関数**、しかも $g(1)=0$。',
        add: [{ t: 'm', size: 'sm', tex: 'g(t)=t+\\log t-1:\\ \\text{増加},\\ \\ g(1)=0', note: '$0<t<1$ で負、$t>1$ で正' },
          { t: 'tbl', size: 'sm', rows: [['$t$', '$0$', '$\\cdots$', '$1$', '$\\cdots$'], ["$X'(t)$", '', '$-$', '$0$', '$+$'], ['$X(t)$', '', '↘', '$1$', '↗']] }] },
      { ask: { type: 'choice', q: '$t\\to+0$ のとき、$X(t)$ はどうなる？',
        opts: ['$0$ に近づく', '$+\\infty$ に発散する', '$-\\infty$ に発散する', '$1$ に近づく'], ok: 1,
        why: { 0: '$t$ の部分は 0 に近づきますが、$(\\log t)^2$ の部分が限りなく大きくなります。', 2: '$\\frac12(\\log t)^2-\\log t=\\frac12\\log t\\,(\\log t-2)$ は（負）×（負）で、正の方へ大きくなります。', 3: '1 は $t=1$ のときの値です。' },
        good: '$\\frac12\\log t\\,(\\log t-2)$ は（負）×（負）で $+\\infty$ へ。$t\\to+0$ でも $X\\to\\infty$。' } },
      { say: '$t\\to\\infty$ では、$\\frac12(\\log t)^2-\\log t=\\frac12(\\log t-1)^2-\\frac12\\ge-\\frac12$ なので、$X(t)\\ge t-\\frac12\\to\\infty$。両はしで $+\\infty$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{t\\to+0}X(t)=\\infty,\\qquad \\lim_{t\\to\\infty}X(t)=\\infty' },
          { t: 'fig', id: 'x1', col: 1, view: [-0.5, -0.8, 6, 6.2], w: 400, h: 400, items: [
            { k: 'axes', tx: [1, 2, 3, 4, 5], ty: [1, 3, 5], xl: 't', yl: 'X' },
            { k: 'line', m: 0, n: 1, a: -0.4, b: 5.9, c: 'd', dash: true },
            { k: 'fn', f: 'x+0.5*log(x)**2-log(x)', a: 0.07, b: 5.6, c: 'b', label: 'X = X(t)', lat: [3.2, 5.6] },
            { k: 'pt', at: [1, 1], name: '最小 (1, 1)', dir: 'se', c: 'p', size: 21 }] }] },
      { ask: { type: 'choice', q: '答案で「$X$ のとりうる値は $X\\ge1$ のすべて」と言うために、増減のほかに必要な根拠は？',
        opts: ['連続で、両はしで $+\\infty$ に発散すること', '$t=1$ で微分可能であること', '$X(t)$ がいつも正であること', '$f(e^2)=0$ であること'], ok: 0,
        why: { 1: '微分可能だけでは、1 以上の値を **全部** とるとは言えません。', 2: '正であることは、値を全部とる根拠になりません。', 3: 'C と $x$ 軸の交点の話で、$X$ の範囲とは別です。' },
        good: '連続で最小値 1、両はしで $+\\infty$。中間値の定理で 1 以上の値をすべてとります。' } },
      { say: '$X(t)$ は連続で、最小値は $X(1)=1$、両はしで $+\\infty$ に発散します。よって $X$ のとりうる値の範囲は $X\\ge1$ です。',
        add: [{ t: 'ans', label: '答', text: '$X\\ge1$\n（$X=1$ となるのは P$(1,\\,-2)$ のとき）' }] },

      // ---------- 図で確かめる ----------
      { clear: true, cols: [1], part: '図で確かめる', say: '図で確かめます。$t=0.3,\\ 0.5,\\ 1,\\ 2,\\ 3$ の点で法線を引くと、$x$ 軸との交点は、どれも $x=1$ の位置か、その右にあります。',
        add: [{ t: 'h', text: 'いろいろな P での法線' },
          cfig('c3', normal(0.3, 'b').concat(normal(0.5, 'g', 0.9), normal(1, 'p'), normal(2, 'g', 0.9), normal(3, 'b', 0.9), [
            { k: 'seg', a: [1, 0], b: [8.5, 0], c: 'y', wd: 7 },
            { k: 'label', at: [3.3, F(3)], text: 't = 3', dx: 16, dy: 12, c: 'b', size: 21, anchor: 'start' },
            { k: 'label', at: [1, 1.15], text: 'x = 1', dx: 14, c: 'p', size: 21, anchor: 'start' }]), 1060)] },
      { ask: { type: 'think', q: '$t=e^2$ のとき、$X$ はいくつ？ 図ではどんな場面か考えよう。',
        hint: '$\\log e^2=2$ を $X(t)=t+\\frac12(\\log t)^2-\\log t$ に代入。$f(e^2)$ の値は？',
        ans: '$X=e^2+\\frac12\\cdot4-2=e^2$。P が $x$ 軸上の点 $(e^2,\\,0)$ にあるので、法線は P そのもので $x$ 軸と交わる。',
        after: '式の値と図の意味が合っているかを確かめると、計算ミスに気づけます。',
        draw: [{ fig: 'c3', items: normal(Math.E ** 2, 'w', 0.6) }] } },
      { say: 'C が $x$ 軸の下にある所では、$0<t<1$ の点の法線は右上へ、$1<t<e^2$ の点の法線は左上へ向かい、どちらも $x\\ge1$ の部分（黄）で $x$ 軸とぶつかります。',
        add: [{ t: 'p', size: 'sm', text: '[[y:黄の線]]：$X$ がとる値 $X\\ge1$', style: 'text-align:center' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。値の範囲を求める問題は、増減だけでなく、極限と連続性まで書いて完成です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
