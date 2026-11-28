/* 2024 佐賀大 理系 第3問の類題②（自作）：y = (log x)² に原点から引いた接線と、囲まれた部分の面積（置換積分・部分積分）
   答え（python3・sympy で検算ずみ）：
   (1) 接点 (e², 4)、傾き 4/e²（ℓ: y=4x/e²）。a=1 のとき接線は x 軸（これも原点を通る）なので x>1 の条件で除く
   (2) 囲む線は「C の x≧1 の部分・ℓ・x 軸」（C と ℓ は 0<x<1 でも x≒0.573 で交わるので、問題文で x≧1 と決めてある）
       S = ∫₀^{e²} (4x/e²) dx − ∫₁^{e²} (log x)² dx = 2e² − (2e² − 2) = 2
   ∫₁^{e²}(log x)² dx = ∫₀² t²eᵗ dt = [(t²−2t+2)eᵗ]₀² = 2e²−2（x=eᵗ）。y 方向の積分 ∫₀⁴ (e^√y − e²y/4) dy = 2 でも確認。変曲点 (e, 1) */
(function () {
  const E = Math.E, E2 = Math.exp(2), M = 4 / E2;
  const VIEW = [-1, -1.2, 9.4, 5.6];
  const gfig = (id, items, w) => {
    const cut = (items || []).some(p => p.k === 'area');   // 面積の図では、C の x<1 の部分（境界に使わない）を点線にする
    const CC = cut ? [{ k: 'fn', f: 'log(x)**2', a: 0.11, b: 1, dash: true }, { k: 'fn', f: 'log(x)**2', a: 1, b: 9, label: 'C', lat: [8.2, 5.2], la: 'end' }]
      : [{ k: 'fn', f: 'log(x)**2', a: 0.11, b: 9, label: 'C', lat: [8.2, 5.2], la: 'end' }];
    return { t: 'fig', id, col: 1, view: VIEW, w: w || 470, h: Math.round((w || 470) * 6.8 / 10.4), items: [   // 縦横比は VIEW にそろえる
      { k: 'axes', tx: [1, [E2, 'e²']], ty: [1, 4] }].concat(CC, items || []) };
  };
  const ELL = { k: 'line', m: M, n: 0, a: -0.8, b: 9.2, c: 'b', label: 'ℓ', lat: [9.0, 5.3], la: 'end' };
  const TP = { k: 'pt', at: [E2, 4], name: '(e², 4)', dir: 'nw', c: 'p', size: 22 };
  const REG = [
    { k: 'area', f: M + '*x', g: '0', a: 0, b: 1, c: 'y', alpha: 0.35 },
    { k: 'area', f: M + '*x', g: 'log(x)**2', a: 1, b: E2, c: 'y', alpha: 0.35, label: 'S', lat: [4.4, 1.1] }
  ];
  const POINTS = [
    '原点を通る接線は、接点を $(a,\\,f(a))$ とおいて接線の式に $(0,\\,0)$ を代入。$t=\\log a$ とおくと対数が消えて $t(t-2)=0$。$a=1$（$x$ 軸）は条件 $x>1$ で除く',
    '面積は図をかいて「上 − 下」。左はしの $0\\le x\\le1$ では下側が $x$ 軸。直線の部分は三角形、曲線の部分は $x=e^t$（$dx=e^t\\,dt$）と置換して、積分区間も変える',
    '$\\displaystyle\\int t^2e^t\\,dt=(t^2-2t+2)e^t+C$（部分積分を2回、次数を下げる向きに）。答案では、どちらが上かの根拠も一言書く'
  ];

  HB.lesson({
    id: 'saga24-3b', field: '佐賀大型　数学（理系）', title: '2024 佐賀大 理系 第3問の類題② ― 対数関数の接線と面積', level: '2024年度 佐賀大学 理系 第3問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '関数 $f(x)=(\\log x)^2\\ \\ (x>0)$ について、曲線 $C:\\ y=f(x)$ を考える。原点 O を通る直線 $\\ell$ が、$C$ 上の $x>1$ の点で $C$ に接している。',
      parts: [
        '(1)　接点の座標と、$\\ell$ の傾きを求めよ。',
        '(2)　曲線 $C$ の $x\\ge1$ の部分、直線 $\\ell$ および $x$ 軸で囲まれた部分の面積 $S$ を求めよ。'
      ],
      src: '※ 2024年度 佐賀大学 前期 理工学部 数学 第3問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '数学Ⅲの微分・積分です。原点から曲線に引いた接線を求め、囲まれた部分の面積を、置換積分と部分積分で計算します。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$C$ は点 $(1,\\,0)$ で $x$ 軸にふれ、右へ行くほど上がる曲線です。まず導関数を求めます。$(\\log x)^2$ は合成関数です。',
        add: [{ t: 'h', text: '読みかえ：曲線 C と導関数' },
          { t: 'm', tex: 'f(x)=(\\log x)^2\\ \\ (x>0)' },
          gfig('c1', [{ k: 'pt', at: [1, 0], name: '(1, 0)', dir: 'se', c: 'y', size: 21 }])] },
      { ask: { type: 'choice', q: "$f'(x)$ はどれ？",
        opts: ['$\\dfrac{\\log x}{x}$', '$2\\log x$', '$\\dfrac{2\\log x}{x}$', '$\\dfrac{2}{x}$'], ok: 2,
        why: { 0: '外側の2乗の微分で出る係数 2 を落としています。$\\{u^2\\}\'=2u\\cdot u\'$ です。', 1: '中身 $\\log x$ の微分 $\\frac1x$ をかけ忘れています。', 3: '$2u\\cdot u\'$ の $u=\\log x$ が消えています。$\\log x$ は残ります。' },
        good: "$f'(x)=2\\log x\\cdot\\dfrac1x=\\dfrac{2\\log x}{x}$。$x=1$ で $f'(1)=0$、つまり $C$ は $(1,\\,0)$ で $x$ 軸に接しています。",
        add: [{ t: 'm', tex: "f'(x)=\\frac{2\\log x}{x}" }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。接点を $(a,\\,f(a))$ とします。$t=\\log a$ とおくと、$f(a)=t^2$、$f\'(a)=\\dfrac{2t}{a}$ と、対数が消えて書けます。',
        add: [{ t: 'h', text: '(1)　原点を通る接線' },
          { t: 'm', size: 'sm', tex: "t=\\log a:\\quad f(a)=t^2,\\quad f'(a)=\\frac{2t}{a}" },
          { t: 'm', size: 'sm', tex: '\\text{接線}:\\ y-t^2=\\frac{2t}{a}(x-a)' },
          gfig('c2', [ELL, TP])] },
      { say: '接線が原点 O を通るので、$x=0,\\ y=0$ を代入します。右辺は $\\dfrac{2t}{a}\\cdot(-a)=-2t$ で、$a$ が消えます。',
        add: [{ t: 'm', tex: '0-t^2=-2t\\ \\Rightarrow\\ t(t-2)=0', note: '(0, 0) を代入' }] },
      { ask: { type: 'choice', q: '$x>1$ の接点の $x$ 座標 $a$ は？',
        opts: ['$e$', '$2$', '$e^2$', '$1$'], ok: 2,
        why: { 0: '$a=e$ は $t=1$ のとき。$t(t-2)=0$ の解は $t=0,\\ 2$ です。', 1: '$2$ は $t$ の値です。$a=e^t$ なので $a=e^2$。', 3: '$a=1$ は $t=0$ のとき。条件 $x>1$ に合いません（このときの接線は $x$ 軸）。' },
        good: '$t=0$ は $a=1$ で、このときの接線は $x$ 軸（これも原点を通る）。$x>1$ なので $t=2$、$a=e^2$ です。',
        add: [{ t: 'm', tex: 't=2,\\qquad a=e^2' }] } },
      { say: '接点は $(e^2,\\,4)$。傾きは $f\'(e^2)=\\dfrac{2\\cdot2}{e^2}=\\dfrac{4}{e^2}$。原点と接点を結ぶ傾き $\\dfrac{4}{e^2}$ とも一致します。',
        add: [{ t: 'ans', label: '(1) 答', text: '接点 $(e^2,\\ 4)$、傾き $\\dfrac{4}{e^2}$\n（$\\ell:\\ y=\\dfrac{4}{e^2}x$）' }] },

      // ---------- (2) 式を立てる ----------
      { clear: true, part: '(2)', say: '(2) です。$C$ は $x\\ge1$ の部分だけを使います。囲まれた部分は、$0\\le x\\le1$ では $\\ell$ と $x$ 軸の間、$1\\le x\\le e^2$ では $\\ell$ と $C$ の間（黄色）。上下は、あとで確かめます。',
        add: [{ t: 'h', text: '(2)　面積 S を式にする' },
          { t: 'p', size: 'sm', text: '$0\\le x\\le1$：上が $\\ell$、下が $x$ 軸\n$1\\le x\\le e^2$：上が $\\ell$、下が $C$\n（左はしは原点、右はしは接点 $x=e^2$。点線は $C$ の $x<1$ の部分）' },
          gfig('c3', [ELL].concat(REG, [TP]))] },
      { ask: { type: 'choice', q: '$S$ を表す式はどれ？（$g=\\frac{4x}{e^2}$、$\\log^2x=(\\log x)^2$）',
        opts: ['$\\int_0^{e^2}\\{g-\\log^2x\\}dx$', '$\\int_1^{e^2}\\{g-\\log^2x\\}dx$', '$\\int_0^{e^2}\\{\\log^2x-g\\}dx$', '$\\int_0^{e^2}g\\,dx-\\int_1^{e^2}\\log^2x\\,dx$'], ok: 3,
        why: { 0: '$0<x<1$ の部分の下側は $C$ でなく $x$ 軸。$C$ は $x=1$ から先です。', 1: '$0\\le x\\le1$ の部分（$\\ell$ と $x$ 軸の間）がぬけています。', 2: '上と下が逆です。また、$0<x<1$ の部分の下側は $C$ でなく $x$ 軸です。' },
        good: '$0$ から $e^2$ までは $\\ell$ の下の面積から、$1$ から $e^2$ までの $C$ の下の面積を引く形です。直線の部分と曲線の部分に分けて計算します。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\int_0^{e^2}\\frac{4}{e^2}x\\,dx-\\int_1^{e^2}(\\log x)^2\\,dx' }] } },
      { say: '直線の部分は、底辺 $e^2$・高さ 4 の直角三角形の面積と同じです。$\\dfrac12\\cdot e^2\\cdot4=2e^2$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^{e^2}\\frac{4}{e^2}x\\,dx=\\frac12\\cdot e^2\\cdot4=2e^2', note: '三角形' }] },

      // ---------- (2) 置換積分と部分積分 ----------
      { clear: true, cols: [0.6, 0.4], say: '曲線の部分は、$\\log x=t$ とおいて置換します。$x=e^t$ なので $dx=e^t\\,dt$、$x$ が $1\\to e^2$ のとき $t$ は $0\\to2$。',
        add: [{ t: 'h', text: '(2)　つづき：置換積分' },
          { t: 'm', tex: '\\log x=t\\ \\Rightarrow\\ x=e^t,\\quad dx=e^t\\,dt' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['$x$', '$1\\ \\to\\ e^2$'], ['$t$', '$0\\ \\to\\ 2$']] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_1^{e^2}(\\log x)^2\\,dx$ を $t$ の積分にすると？',
        opts: ['$\\displaystyle\\int_0^{2}t^2e^{t}\\,dt$', '$\\displaystyle\\int_0^{2}t^2\\,dt$', '$\\displaystyle\\int_1^{e^2}t^2e^{t}\\,dt$', '$\\displaystyle\\int_0^{2}\\frac{t^2}{e^{t}}\\,dt$'], ok: 0,
        why: { 1: '$dx$ を $dt$ に変え忘れています。$dx=e^t\\,dt$ です。', 2: '積分区間も $t$ の値に変えます。$x=e^2$ のとき $t=2$。', 3: '$dx=e^t\\,dt$ です。$\\frac{dt}{dx}=\\frac1x=e^{-t}$ のほうと取りちがえています。' },
        good: '$dx=e^t\\,dt$ と区間 $0\\to2$ を入れます。$t^2e^t$ の積は、部分積分で計算します。',
        add: [{ t: 'm', tex: '\\int_1^{e^2}(\\log x)^2\\,dx=\\int_0^{2}t^2e^{t}\\,dt' }] } },
      { say: '$t^2e^t$ は部分積分を2回。$t^2$ を微分する側にすると、次数が $2\\to1\\to0$ と下がっていきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int t^2e^t\\,dt&=t^2e^t-\\int2te^t\\,dt\\\\ &=t^2e^t-2\\left(te^t-\\int e^t\\,dt\\right)\\\\ &=(t^2-2t+2)e^t+C\\end{aligned}' }] },
      { clear: true, cols: [0.6, 0.4], say: 'これで計算できます。$\\Big[\\,(t^2-2t+2)e^t\\,\\Big]_0^2$ を求め、三角形の部分から引けば $S$ です。',
        add: [{ t: 'h', text: '(2)　つづき：S を計算する' },
          { t: 'm', size: 'sm', tex: 'S=2e^2-\\int_0^{2}t^2e^{t}\\,dt' },
          gfig('c5', [ELL].concat(REG, [TP]), 380)] },
      { ask: { type: 'think', q: '$\\displaystyle\\int_0^{2}t^2e^{t}\\,dt$ の値を求めよう。',
        hint: '$\\Big[\\,(t^2-2t+2)e^t\\,\\Big]_0^2$。$t=0$ のときの値（$2e^0=2$）も忘れずに。',
        ans: '$(4-4+2)e^2-2=2e^2-2$',
        after: '下はし $t=0$ でも $(0-0+2)e^0=2$ が残ります。ここで落とす人が多いので注意。',
        add: [{ t: 'm', tex: '\\int_0^{2}t^2e^{t}\\,dt=2e^2-2' }] } },
      { ask: { type: 'choice', q: 'よって $S$ は？',
        opts: ['$2e^2-2$', '$2$', '$2e^2$', '$4e^2-2$'], ok: 1,
        why: { 0: '曲線の下の面積だけです。三角形の部分 $2e^2$ から引きます。', 2: '三角形の面積だけです。$C$ の下の面積 $2e^2-2$ を引き忘れています。', 3: '足しています。$S$ は「上 − 下」なので、引き算です。' },
        good: '$S=2e^2-(2e^2-2)=2$。$e^2$ が消えて、整数になりました。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'S=2' }] } },

      // ---------- 上下の確認 ----------
      { clear: true, part: '上下の確認', say: '答案で「$1\\le x\\le e^2$ で $C$ が $\\ell$ より下」の根拠を書く方法です。$x=e^t$ とおくと、$\\ell$ のほうが上 ⇔ $\\dfrac{4}{e^2}e^t\\ge t^2$。両辺とも正なので平方根をとります。',
        add: [{ t: 'h', text: 'C が ℓ より下であることの確認' },
          { t: 'm', size: 'sm', tex: '\\frac{4}{e^2}e^t\\ge t^2\\iff 2e^{\\frac{t-2}{2}}\\ge t', note: '両辺の平方根\n（$t\\ge0$）' },
          { t: 'm', size: 'sm', tex: 'u=\\frac t2\\ \\text{とおくと}\\quad e^{u-1}\\ge u' }] },
      { ask: { type: 'think', q: 'すべての実数 $v$ で $e^v\\ge1+v$ が成り立つことを使って、$e^{u-1}\\ge u$ を示そう。等号はいつ？',
        hint: '$v=u-1$ とおく。$e^v\\ge1+v$ は、$g(v)=e^v-1-v$ の増減（最小値 $g(0)=0$）で示せる。',
        ans: '$v=u-1$ とおくと $e^{u-1}\\ge1+(u-1)=u$。等号は $v=0$、つまり $u=1$（$t=2$、$x=e^2$、接点）のときだけ',
        after: 'これで、$\\ell$ は接点以外で $C$ より上にあるとわかります。上下が入れかわらないので、(2) の式は正しいです。' } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '検算に、$y$ 方向に積分してみます。$C$ の $x>1$ の部分は $x=e^{\\sqrt y}$、$\\ell$ は $x=\\dfrac{e^2}{4}y$。$y$ は $0$ から $4$ まで、右が $C$、左が $\\ell$ です。',
        add: [{ t: 'h', text: 'y で積分して検算する' },
          { t: 'm', size: 'sm', tex: 'S=\\int_0^{4}\\left(e^{\\sqrt y}-\\frac{e^2}{4}y\\right)dy' },
          gfig('c4', [ELL].concat(REG, [TP, { k: 'seg', a: [E2 * 0.5, 2], b: [Math.exp(Math.sqrt(2)), 2], c: 'g', dash: true }]))] },
      { ask: { type: 'think', q: '$\\sqrt y=t$ とおいて、$\\displaystyle\\int_0^{4}e^{\\sqrt y}\\,dy$ を求めよう。',
        hint: '$y=t^2$、$dy=2t\\,dt$、$y:0\\to4$ のとき $t:0\\to2$。$\\displaystyle\\int te^t\\,dt=(t-1)e^t+C$。',
        ans: '$\\displaystyle\\int_0^{2}2te^t\\,dt=2\\Big[(t-1)e^t\\Big]_0^2=2(e^2+1)$。一方 $\\displaystyle\\int_0^{4}\\frac{e^2}{4}y\\,dy=2e^2$。差は $2$',
        after: '$x$ で積分した結果 $S=2$ と一致しました。積分の向きを変えても同じ面積になります。',
        add: [{ t: 'm', size: 'sm', tex: 'S=2(e^2+1)-2e^2=2', note: '一致' }] } },

      // ---------- 凹凸 ----------
      { clear: true, part: '凹凸', say: '曲線の形も見ておきます。$f\'\'(x)=\\dfrac{2(1-\\log x)}{x^2}$。符号は $1-\\log x$ で決まります。',
        add: [{ t: 'h', text: '別の見方：凹凸と接点' },
          { t: 'm', size: 'sm', tex: "f''(x)=\\frac{2(1-\\log x)}{x^2}\\quad(x>0)" },
          gfig('c6', [ELL, TP, { k: 'pt', at: [E, 1], name: '(e, 1)', dir: 'se', c: 'g', size: 21 }, { k: 'line', x: E, dash: true, c: 'g' }])] },
      { ask: { type: 'choice', q: '$C$ が上に凸になる $x$ の範囲（すべて）は？',
        opts: ['$0<x<e$', '$x>1$', '$x>e^2$', '$x>e$'], ok: 3,
        why: { 0: 'その範囲は $1-\\log x>0$ で $f\'\'(x)>0$、下に凸です。', 1: '1 は $f\'(x)=0$ になる所。凹凸の境目は $f\'\'(x)=0$ の $x=e$ です。', 2: '$e^2$ は接点。凹凸の境目は $\\log x=1$ の所で、$e<x\\le e^2$ がぬけています。' },
        good: '$x>e$ で上に凸、$0<x<e$ で下に凸。変曲点は $(e,\\,1)$。接点 $x=e^2$ は上に凸の部分なので、接線 $\\ell$ は $C$ の上側にあります。',
        add: [{ t: 'p', size: 'sm', text: '$0<x<e$：下に凸　$x>e$：上に凸\n変曲点 $(e,\\ 1)$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。対数は文字でおきかえて消す。面積は図をかいて「上 − 下」。置換したら区間も変える。部分積分は次数を下げる向きに。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
