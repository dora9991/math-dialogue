/* 九大型 数学（理系）：2026年度 九州大学 前期 理系 第5問の類題（自作問題・元の問題ではない）
   問題：F(x) = ∫_x^{x+4} log(t²−2t+5) dt。(1) F(x) の極値 (2) lim_{x→∞} x{F(x+4)−F(x)}
   答え（python3・sympy で検算ずみ、(2) は数値でも x=10⁴ で 31.99）：
     F'(x) = log{(x+3)²+4} − log{(x−1)²+4}、(x+3)²−(x−1)² = 8(x+1) → x=−1 で極小（極大なし）
     (1) F(−1) = ∫_{−2}^{2} log(u²+4)du = 2(6log2 − 4 + π) = 12log2 − 8 + 2π ≈ 6.601
         （部分積分、2u²/(u²+4) = 2 − 8/(u²+4)、u=2tanθ で ∫_0^2 du/(u²+4) = π/8）
     (2) 平均値の定理 2 回：x{F(x+4)−F(x)} = 16x f'(d)（x<d<x+8）、f'(t)=2(t−1)/((t−1)²+4) → 32 */
(function () {
  const F = 'log((x-1)**2+4)';
  const LG4 = Math.log(4);
  const graph = (id, items) => ({ t: 'fig', id, col: 1, view: [-4.4, -0.45, 6.6, 3.85], w: 600, h: 330, items: [
    { k: 'axes', tx: [[-1, '−1'], [1, '1'], [3, '3']], ty: [[LG4, 'log 4']], xl: 't', yl: 'y' },
    { k: 'fn', f: F, a: -4.3, b: 6.4, c: 'w', label: 'y = f(t)', lat: [3.7, 3.45], la: 'end' },
    { k: 'line', x: 1, c: 'd', dash: true }].concat(items || []) });
  const win = (a, id, c) => ({ k: 'area', f: F, a, b: a + 4, c: c || 'y', alpha: 0.32, id });
  // 平均値の定理の図：c=0.5 の弦（区間 [c, c+4]）と、同じ傾きの接線（d≈1.770、傾き≈0.335）
  const mvt = { t: 'fig', id: 'mv', col: 1, view: [-0.9, -0.35, 6.1, 3.45], w: 520, h: 282, items: [
    { k: 'axes', tx: [[0.5, 'c'], [4.5, 'c+4']], ty: [], xl: 't', yl: 'y' },
    { k: 'fn', f: F, a: -0.8, b: 5.9, c: 'w', label: 'y = f(t)', lat: [4.3, 3.2], la: 'end' },
    { k: 'seg', a: [0.5, Math.log(4.25)], b: [4.5, Math.log(16.25)], c: 'y', wd: 3 },
    { k: 'seg', a: [0.47, 1.0886], b: [3.37, 2.0610], c: 'p', wd: 3 },
    { k: 'pt', at: [0.5, Math.log(4.25)], c: 'y' }, { k: 'pt', at: [4.5, Math.log(16.25)], c: 'y' },
    { k: 'pt', at: [1.77, 1.5245], c: 'p' },
    { k: 'seg', a: [1.77, 0], b: [1.77, 1.5245], c: 'p', wd: 1.5, dash: true },
    { k: 'label', at: [1.77, 0], text: 'd', c: 'p', size: 21, dy: 22 },
    { k: 'label', at: [3.5, 1.0], text: '弦（黄）と接線（桃）は平行', c: 'd', size: 18, plain: true }] };
  const POINTS = [
    "$F(x)=\\displaystyle\\int_x^{x+4}f(t)\\,dt$ なら $F'(x)=f(x+4)-f(x)$。$\\log$ は増加関数なので、真数の大小で符号を決める",
    '$\\int\\log(u^2+a^2)\\,du$ は部分積分 → $\\dfrac{2u^2}{u^2+a^2}=2-\\dfrac{2a^2}{u^2+a^2}$ → $u=a\\tan\\theta$ の置換',
    '「関数の差」の極限は平均値の定理で微分に直す。2 回使って $16xf\'(d)$、$d$ の範囲 $x<d<x+8$ からはさみうち'
  ];

  HB.lesson({
    id: 'kyushu26-5', field: '九大型　数学（理系）', title: '2026 九大 理系 第5問の類題 ― 対数関数の定積分で決まる関数の極値と極限', level: '2026年度 九州大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '実数 $x$ に対して、$F(x)=\\displaystyle\\int_x^{x+4}\\log(t^2-2t+5)\\,dt$ とする。ただし、$\\log$ は自然対数である。',
      parts: [
        '(1)　$F(x)$ の極値を求めよ。',
        '(2)　極限 $\\displaystyle\\lim_{x\\to\\infty}x\\{F(x+4)-F(x)\\}$ を求めよ。'
      ],
      src: '※ 2026年度 九州大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '数学Ⅲの微分・積分・極限の問題です。積分の区間が「幅 4 のまま動く」関数を調べます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.47, 0.53], part: '読みかえ', say: '$f(t)=\\log(t^2-2t+5)=\\log\\{(t-1)^2+4\\}$ とおきます。グラフは $t=1$ について対称。$F(x)$ は、幅 4 の「窓」の下の面積です。',
        add: [{ t: 'h', text: '関数のようすと F(x) の意味' },
          { t: 'm', size: 'sm', tex: 'f(t)=\\log\\{(t-1)^2+4\\}', note: '$t=1$ で最小 $\\log4$' },
          { t: 'p', size: 'sm', text: '$f(t)>0$ なので、$F(x)$ は\n区間 $[x,\\ x+4]$ の下の面積' },
          graph('g1', [win(1.5, 'w1')])] },
      { ask: { type: 'choice', q: "$F'(x)$ は？",
        opts: ['$f(x+4)$', '$f(x+4)-f(x)$', '$f(x+4)+f(x)$', "$f'(x+4)-f'(x)$"], ok: 1,
        why: { 0: '下端も $x$ で動くので、$-f(x)$ がつきます。', 2: '下端の分は引きます。原始関数 $G$ で $F(x)=G(x+4)-G(x)$。', 3: '積分を微分すると被積分関数そのもの。さらに微分はしません。' },
        good: '$F(x)=G(x+4)-G(x)$（$G$ は $f$ の原始関数）を微分すると $f(x+4)-f(x)$。',
        add: [{ t: 'm', size: 'sm', tex: "F'(x)=\\log\\{(x+3)^2+4\\}-\\log\\{(x-1)^2+4\\}" }] } },
      { say: '$\\log$ は増加関数なので、真数の大小で符号が決まります。$(x+3)^2-(x-1)^2=8(x+1)$ です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$\\cdots$', '$-1$', '$\\cdots$'], ["$F'(x)$", '$-$', '$0$', '$+$'], ['$F(x)$', '$\\searrow$', '極小', '$\\nearrow$']] }] },
      { ask: { type: 'choice', q: '$F(x)$ の極値は？',
        opts: ['$x=1$ で極小', '$x=-1$ で極大', '$x=-1$ で極小', '$x=-3$ で極小'], ok: 2,
        why: { 0: '$x=1$ は $f(t)$ が最小の所。$F$ では、窓 $[x,\\ x+4]$ の真ん中が 1 になる $x$ を考えます。', 1: "$F'$ は $-$ から $+$ に変わるので、極小です。", 3: '$(x+3)^2=(x-1)^2$ を解くと $x=-1$ です。' },
        good: '窓の真ん中 $x+2$ が対称軸 $t=1$ に来るとき面積が最小。$x=-1$ で極小、極大はありません。',
        draw: [{ fig: 'g1', items: [win(-1, 'w2', 'p'), { k: 'line', x: -1, c: 'p', wd: 2 }, { k: 'line', x: 3, c: 'p', wd: 2 }] }] }, dim: ['w1'] },

      // ---------- (1) 極小値 ----------
      { clear: true, cols: [0.66, 0.34], part: '(1) 極小値', say: '極小値は $F(-1)$。$u=t-1$ とおくと区間は $-2\\le u\\le2$。$\\log(u^2+4)$ は偶関数なので、$0$ から $2$ の 2 倍です。',
        add: [{ t: 'h', text: '(1)　極小値 F(−1) の計算' },
          { t: 'm', size: 'sm', tex: 'F(-1)=\\int_{-1}^{3}f(t)\\,dt=\\int_{-2}^{2}\\log(u^2+4)\\,du=2\\int_0^2\\log(u^2+4)\\,du' }] },
      { say: "部分積分です。$\\log(u^2+4)=(u)'\\log(u^2+4)$ と見て、$u$ を積分した側、$\\log$ を微分する側にします。",
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^2\\log(u^2+4)\\,du=\\Big[u\\log(u^2+4)\\Big]_0^2-\\int_0^2\\frac{2u^2}{u^2+4}\\,du' }] },
      { ask: { type: 'choice', q: '$\\dfrac{2u^2}{u^2+4}$ を、分子の次数を下げた形にすると？',
        opts: ['$2-\\dfrac{4}{u^2+4}$', '$2+\\dfrac{8}{u^2+4}$', '$1-\\dfrac{4}{u^2+4}$', '$2-\\dfrac{8}{u^2+4}$'], ok: 3,
        why: { 0: '$2(u^2+4)=2u^2+8$ なので、引くのは 8 です。', 1: '$2u^2=2(u^2+4)-8$。符号はマイナスです。', 2: '分子 $2u^2$ を分母 $u^2+4$ で割った商は 2 です。' },
        good: '$2u^2=2(u^2+4)-8$ だから $\\dfrac{2u^2}{u^2+4}=2-\\dfrac{8}{u^2+4}$。',
        add: [{ t: 'm', size: 'sm', tex: '=6\\log2-\\int_0^2\\Big(2-\\frac{8}{u^2+4}\\Big)du=6\\log2-4+8\\int_0^2\\frac{du}{u^2+4}' }] } },
      { clear: true, cols: [0.66, 0.34], part: '(1) 置換', say: '残りは $u=2\\tan\\theta$ と置換。$u:0\\to2$ のとき $\\theta:0\\to\\frac\\pi4$。$du=\\frac{2}{\\cos^2\\theta}d\\theta$、$u^2+4=\\frac{4}{\\cos^2\\theta}$ です。',
        add: [{ t: 'h', text: '(1)　つづき：tan の置換' },
          { t: 'm', size: 'sm', tex: '\\int_0^2\\log(u^2+4)\\,du=6\\log2-4+8\\int_0^2\\frac{du}{u^2+4}', note: 'ここまでの結果' },
          { t: 'm', size: 'sm', tex: 'u=2\\tan\\theta,\\quad du=\\frac{2}{\\cos^2\\theta}\\,d\\theta,\\quad u^2+4=\\frac{4}{\\cos^2\\theta}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^2\\frac{du}{u^2+4}$ の値は？',
        opts: ['$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{8}$', '$\\dfrac{\\pi}{2}$', '$\\dfrac{\\pi}{16}$'], ok: 1,
        why: { 0: '$\\frac{2/\\cos^2\\theta}{4/\\cos^2\\theta}=\\frac12$ の $\\frac12$ を忘れています。', 2: '上端は $\\tan\\theta=1$ の $\\theta=\\frac\\pi4$ です。', 3: '$\\frac12\\cdot\\frac\\pi4$ を、さらに半分にしています。' },
        good: '$\\displaystyle\\int_0^{\\frac\\pi4}\\frac12\\,d\\theta=\\frac\\pi8$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^2\\frac{du}{u^2+4}=\\int_0^{\\frac\\pi4}\\frac12\\,d\\theta=\\frac\\pi8' }] } },
      { say: 'まとめると $\\int_0^2\\log(u^2+4)\\,du=6\\log2-4+8\\cdot\\frac\\pi8=6\\log2-4+\\pi$。これを 2 倍したものが極小値です。',
        add: [{ t: 'ans', label: '(1) 答', text: '$x=-1$ で極小値 $12\\log2-8+2\\pi$\n（極大値はない）' }] },
      { ask: { type: 'think', q: '検算：極小値はおよそいくつ？ 窓 $[-1,\\ 3]$ での $f$ は、最小 $\\log4\\approx1.39$、端で $\\log8\\approx2.08$。面積を大まかに見積もって比べよう。',
        hint: '$\\log2\\approx0.693$、$\\pi\\approx3.142$。面積は「幅 4 × 高さ」の間にあるはず。',
        ans: '$12\\times0.693-8+6.283\\approx6.60$。$4\\times1.39\\approx5.5$ と $4\\times2.08\\approx8.3$ の間で、つじつまが合う',
        after: '置換積分の $\\frac12$ を忘れると $12\\log2-8+4\\pi\\approx12.9$ になり、上の見積もりの範囲から外れます。概算は計算ミスの発見に役立ちます。' } },

      // ---------- (2) ----------
      { clear: true, cols: [0.54, 0.46], part: '(2) 方針', say: '(2) は「$F$ の差 × $x$」の極限。差は平均値の定理で $F\'$ に直せます。$F\'$ も $f$ の差なので、もう一度使えます。',
        add: [{ t: 'h', text: '(2)　x{F(x+4) − F(x)} の極限' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: "$F(x+4)-F(x)$ → $F'$ → $f$ の差 → $f'$\n（平均値の定理を 2 回）" }] },
      { ask: { type: 'choice', q: '平均値の定理を $F$ に使うと？（$x<c<x+4$ となる $c$ がある）',
        opts: ["$F(x+4)-F(x)=4F'(c)$", "$F(x+4)-F(x)=F'(c)$", "$F(x+4)-F(x)=\\frac14F'(c)$", "$F(x+4)-F(x)=4F'(x)$"], ok: 0,
        why: { 1: "平均値の定理は $\\frac{F(b)-F(a)}{b-a}=F'(c)$。幅 $b-a=4$ をかけます。", 2: '4 は分母ではなく、かけ算になります。', 3: '$c$ は区間の中のある数で、$x$ そのものとはかぎりません。' },
        good: "$f$ が連続なので $F$ は微分可能。$\\frac{F(x+4)-F(x)}{4}=F'(c)$ となる $c$ が $x<c<x+4$ にあります。",
        add: [{ t: 'm', size: 'sm', tex: "F(x+4)-F(x)=4F'(c)=4\\{f(c+4)-f(c)\\}" }] } },
      { say: "もう一度、こんどは $f$ に使います。$f(c+4)-f(c)=4f'(d)$ となる $d$ が $c<d<c+4$ にあり、$x<d<x+8$ です。",
        add: [{ t: 'm', size: 'sm', tex: "f(c+4)-f(c)=4f'(d),\\quad f'(t)=\\frac{2(t-1)}{(t-1)^2+4}" }, mvt] },
      { ask: { type: 'choice', q: '$x\\{F(x+4)-F(x)\\}$ を $d$ で表すと？',
        opts: ["$4xf'(d)$", "$8xf'(d)$", "$16xf'(d)$", "$16f'(d)$"], ok: 2,
        why: { 0: '平均値の定理を 2 回使うので、4 が 2 回かかります。', 1: '$4\\times4=16$ です。', 3: '問題の式の $x$ をかけ忘れています。' },
        good: "$x\\cdot4\\cdot4f'(d)=16x\\cdot\\dfrac{2(d-1)}{(d-1)^2+4}$。",
        add: [{ t: 'm', size: 'sm', tex: 'x\\{F(x+4)-F(x)\\}=\\frac{32x(d-1)}{(d-1)^2+4}' }] } },
      { clear: true, cols: [0.6, 0.4], part: '(2) 答案', say: '分母・分子を $(d-1)^2$ で割ります。$x<d<x+8$ なので、$x\\to\\infty$ のとき $d\\to\\infty$ です。',
        add: [{ t: 'h', text: '(2)　はさみうちで極限' },
          { t: 'm', size: 'sm', tex: 'x\\{F(x+4)-F(x)\\}=32\\cdot\\frac{x}{d-1}\\cdot\\frac{1}{1+\\frac{4}{(d-1)^2}}' },
          { t: 'm', size: 'sm', tex: 'x-1<d-1<x+7', note: '← $x<d<x+8$' }] },
      { ask: { type: 'think', q: '$x>1$ のとき、$\\dfrac{x}{d-1}$ をはさみうちして極限を求めよう。',
        hint: '$x-1<d-1<x+7$ の逆数をとって $x$ をかける。',
        ans: '$\\dfrac{x}{x+7}<\\dfrac{x}{d-1}<\\dfrac{x}{x-1}$。両はしは 1 に近づくので $\\dfrac{x}{d-1}\\to1$。また $\\dfrac{4}{(d-1)^2}\\to0$。よって極限は $32$',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\lim_{x\\to\\infty}x\\{F(x+4)-F(x)\\}=32' }] } },
      { say: '直感の検算：$x$ が大きいと $f\'(t)\\approx\\frac2t$。差 $F(x+4)-F(x)\\approx16\\cdot\\frac2x$ なので、$x$ 倍して 32。数値でも $x=1000$ で約 31.9 です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・平均値の定理を使える理由（微分可能）を書く\n・$c,\\ d$ の範囲（$x<d<x+8$）を明記する\n・はさみうちで $\\frac{x}{d-1}\\to1$ を示す' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「積分区間が動く関数の微分」「部分積分と tan の置換」「平均値の定理で差を微分に」の 3 つが、この問題の柱でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
