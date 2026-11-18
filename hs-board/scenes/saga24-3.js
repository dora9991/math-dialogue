/* 2024 佐賀大 理系 第3問の類題（自作）：y = e^(3乗根 x) に原点から引いた接線と、囲まれた部分の面積
   答え（python3・sympy で検算ずみ）：
   (1) 接点 (27, e³)、傾き e³/27　（a=s³ とおくと、原点を通る条件は 1 = s/3）
   (2) S = ∫₀²⁷ (e^∛x − e³x/27) dx = (15e³ − 6) − 27e³/2 = 3e³/2 − 6 ≒ 24.13
   0≦x≦27 で C が ℓ の上：e^∛x ≧ e³x/27 ⇔ e^(u−1) ≧ u（u=∛x/3）⇔ e^v ≧ 1+v。変曲点は (8, e²) */
(function () {
  const E3 = Math.exp(3), M = E3 / 27;
  const VIEW = [-2.5, -2.2, 31, 23];
  const gfig = (id, items, w) => ({ t: 'fig', id, col: 1, view: VIEW, w: w || 480, h: Math.round((w || 480) * 0.98), items: [   // y 方向を少しのばして、C と ℓ のすきまを見やすく
    { k: 'axes', tx: [[8, '8'], [27, '27']], ty: [[1, '1'], [E3, 'e³']] },
    { k: 'fn', f: 'exp(cbrt(x))', a: 0, b: 30.5, label: 'C', lat: [29.2, 22.2], la: 'end' }
  ].concat(items || []) });
  const ELL = { k: 'line', m: M, n: 0, a: -1.5, b: 30.5, c: 'b', label: 'ℓ', lat: [29.5, 18.6], la: 'start' };
  const TP = { k: 'pt', at: [27, E3], name: '(27, e³)', dir: 'nw', c: 'p', size: 22 };
  const REG = { k: 'area', f: 'exp(cbrt(x))', g: M + '*x', a: 0, b: 27, c: 'y', alpha: 0.35, label: 'S', lat: [9, 9.6] };
  const POINTS = [
    '原点を通る接線は、接点を $(a,\\,f(a))$ とおいて接線の式に $(0,\\,0)$ を代入。$a=s^3$ とおくと根号が消えて計算が楽',
    '面積は「上 − 下」を積分。直線の部分は三角形、曲線の部分は $x=t^3$（$dx=3t^2\\,dt$）と置換して、積分区間も変える',
    '$\\displaystyle\\int t^2e^t\\,dt=(t^2-2t+2)e^t+C$（部分積分を2回）。答案では、どちらが上かの根拠も一言書く'
  ];

  HB.lesson({
    id: 'saga24-3', field: '佐賀大型　数学（理系）', title: '2024 佐賀大 理系 第3問の類題 ― 3乗根をふくむ指数関数の接線と面積', level: '2024年度 佐賀大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '関数 $f(x)=e^{\\sqrt[3]{x}}\\ \\ (x\\ge0)$ について、曲線 $C:\\ y=f(x)$ を考える。原点 O を通る直線 $\\ell$ が、$C$ 上の $x>0$ の点で $C$ に接している。',
      parts: [
        '(1)　接点の座標と、$\\ell$ の傾きを求めよ。',
        '(2)　曲線 $C$、直線 $\\ell$ および $y$ 軸で囲まれた部分の面積 $S$ を求めよ。'
      ],
      src: '※ 2024年度 佐賀大学 前期 理工学部 数学 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '数学Ⅲの微分・積分です。原点から曲線に引いた接線を求め、囲まれた部分の面積を、置換積分と部分積分で計算します。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$C$ は点 $(0,\\,1)$ から右上へのびる曲線です。まず導関数を求めます。$\\sqrt[3]{x}=x^{\\frac13}$ と書き直して、合成関数の微分を使います。',
        add: [{ t: 'h', text: '読みかえ：曲線 C と導関数' },
          { t: 'm', tex: 'f(x)=e^{\\sqrt[3]{x}}=e^{x^{\\frac13}}' },
          gfig('c1', [{ k: 'pt', at: [0, 1], name: '(0, 1)', dir: 'e', c: 'y', size: 21 }])] },
      { ask: { type: 'choice', q: "$x>0$ のとき、$f'(x)$ はどれ？",
        opts: ['$e^{\\sqrt[3]{x}}$', '$\\dfrac{e^{\\sqrt[3]{x}}}{3\\sqrt[3]{x}}$', '$\\dfrac{e^{\\sqrt[3]{x}}}{3\\sqrt[3]{x^2}}$', '$\\sqrt[3]{x}\\,e^{\\sqrt[3]{x}-1}$'], ok: 2,
        why: { 0: '合成関数です。$e^u$ を微分したあと、中身 $u=x^{\\frac13}$ の微分をかけます。', 1: '$\\left(x^{\\frac13}\\right)\'=\\frac13x^{-\\frac23}$。指数は $\\frac13-1=-\\frac23$ です。', 3: 'べき関数の公式を指数関数に使っています。$(e^u)\'=e^u\\cdot u\'$ です。' },
        good: "$f'(x)=e^{\\sqrt[3]{x}}\\cdot\\dfrac13x^{-\\frac23}=\\dfrac{e^{\\sqrt[3]{x}}}{3\\sqrt[3]{x^2}}$。$x>0$ でいつも正なので、$C$ は増加します。",
        add: [{ t: 'm', tex: "f'(x)=\\frac{e^{\\sqrt[3]{x}}}{3\\sqrt[3]{x^2}}\\ \\ (x>0)" }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。接点を $(a,\\,f(a))$ とします。根号をなくすために $a=s^3$（$s>0$）とおくと、$f(a)=e^s$、$f\'(a)=\\dfrac{e^s}{3s^2}$ ときれいに書けます。',
        add: [{ t: 'h', text: '(1)　原点を通る接線' },
          { t: 'm', size: 'sm', tex: "a=s^3\\ (s>0):\\quad f(a)=e^s,\\quad f'(a)=\\frac{e^s}{3s^2}" },
          { t: 'm', size: 'sm', tex: '\\text{接線}:\\ y-e^s=\\frac{e^s}{3s^2}(x-s^3)' },
          gfig('c2', [ELL, TP])] },
      { say: '接線が原点 O を通るので、$x=0,\\ y=0$ を代入します。右辺は $\\dfrac{e^s}{3s^2}\\cdot(-s^3)=-\\dfrac{s}{3}e^s$ です。',
        add: [{ t: 'm', tex: '0-e^s=-\\frac{s}{3}e^s', note: '(0, 0) を代入' }] },
      { ask: { type: 'choice', q: '$s$ の値は？',
        opts: ['$3$', '$\\dfrac13$', '$27$', '$2$'], ok: 0,
        why: { 1: '$e^s>0$ で割ると $1=\\frac{s}{3}$。$s=3$ です。逆数にしています。', 2: '27 は $a=s^3$ のほう。$s=\\sqrt[3]{a}=3$ です。', 3: '$s=2$（$x=8$）は、あとで見る「凹凸が変わる点」。接線の条件は $1=\\frac s3$ です。' },
        good: '$e^s>0$ で両辺を割ると $1=\\dfrac s3$、$s=3$。接点の $x$ 座標は $a=27$ です。',
        add: [{ t: 'm', tex: 's=3,\\qquad a=s^3=27' }] } },
      { say: '接点は $(27,\\,e^3)$。傾きは $f\'(27)=\\dfrac{e^3}{3\\cdot9}=\\dfrac{e^3}{27}$。原点と接点を結ぶ傾き $\\dfrac{e^3}{27}$ とも一致します。',
        add: [{ t: 'ans', label: '(1) 答', text: '接点 $(27,\\ e^3)$、傾き $\\dfrac{e^3}{27}$\n（$\\ell:\\ y=\\dfrac{e^3}{27}x$）' }] },

      // ---------- (2) 式を立てる ----------
      { clear: true, part: '(2)', say: '(2) です。囲まれた部分は、$0\\le x\\le27$ で $C$ が上、$\\ell$ が下の部分（黄色）。上下が入れかわらないことは、あとで確かめます。',
        add: [{ t: 'h', text: '(2)　面積 S を式にする' },
          { t: 'p', size: 'sm', text: '$0\\le x\\le27$ で　$C$ が上、$\\ell$ が下\n左はしは $y$ 軸（$x=0$）、右はしは接点（$x=27$）' },
          gfig('c3', [ELL, REG, TP])] },
      { ask: { type: 'choice', q: '$S$ を表す式はどれ？',
        opts: ['$\\displaystyle\\int_0^{27}\\left(\\frac{e^3}{27}x-e^{\\sqrt[3]{x}}\\right)dx$', '$\\displaystyle\\int_1^{27}\\left(e^{\\sqrt[3]{x}}-\\frac{e^3}{27}x\\right)dx$', '$\\displaystyle\\int_0^{3}\\left(e^{t}-\\frac{e^3}{27}t\\right)dt$', '$\\displaystyle\\int_0^{27}\\left(e^{\\sqrt[3]{x}}-\\frac{e^3}{27}x\\right)dx$'], ok: 3,
        why: { 0: '上と下が逆です。これでは負の値になります。', 1: '1 は $C$ の $y$ 切片。左はしは $y$ 軸、つまり $x=0$ です。', 2: '$x$ を $t$ に変えただけでは置換になりません。$dx=3t^2\\,dt$ も変えます。' },
        good: '「上 − 下」を $x=0$ から $27$ まで。直線の部分と曲線の部分に分けて計算します。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\int_0^{27}e^{\\sqrt[3]{x}}\\,dx-\\int_0^{27}\\frac{e^3}{27}x\\,dx' }] } },
      { say: '直線の部分は、底辺 27・高さ $e^3$ の直角三角形の面積と同じです。$\\dfrac12\\cdot27\\cdot e^3=\\dfrac{27}{2}e^3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\int_0^{27}\\frac{e^3}{27}x\\,dx=\\frac12\\cdot27\\cdot e^3=\\frac{27}{2}e^3', note: '三角形' }] },

      // ---------- (2) 置換積分と部分積分 ----------
      { clear: true, cols: [0.6, 0.4], say: '曲線の部分は、$\\sqrt[3]{x}=t$ とおいて置換します。$x=t^3$ なので $dx=3t^2\\,dt$、$x$ が $0\\to27$ のとき $t$ は $0\\to3$。',
        add: [{ t: 'h', text: '(2)　つづき：置換積分' },
          { t: 'm', tex: '\\sqrt[3]{x}=t\\ \\Rightarrow\\ x=t^3,\\quad dx=3t^2\\,dt' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['$x$', '$0\\ \\to\\ 27$'], ['$t$', '$0\\ \\to\\ 3$']] }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{27}e^{\\sqrt[3]{x}}\\,dx$ を $t$ の積分にすると？',
        opts: ['$\\displaystyle\\int_0^{3}e^{t}\\,dt$', '$\\displaystyle\\int_0^{3}3t^2e^{t}\\,dt$', '$\\displaystyle\\int_0^{27}3t^2e^{t}\\,dt$', '$\\displaystyle\\int_0^{3}\\frac{e^{t}}{3t^2}\\,dt$'], ok: 1,
        why: { 0: '$dx$ を $dt$ に変え忘れています。$dx=3t^2\\,dt$ です。', 2: '積分区間も $t$ の値に変えます。$x=27$ のとき $t=3$。', 3: '$dx=3t^2\\,dt$ です。$\\frac{dt}{dx}$ と $\\frac{dx}{dt}$ を取りちがえています。' },
        good: '$dx=3t^2\\,dt$ と区間 $0\\to3$ を入れます。$t^2e^t$ の積は、部分積分で計算します。',
        add: [{ t: 'm', tex: '\\int_0^{27}e^{\\sqrt[3]{x}}\\,dx=\\int_0^{3}3t^2e^{t}\\,dt' }] } },
      { say: '$t^2e^t$ は部分積分を2回。$t^2$ を微分する側にすると、次数が $2\\to1\\to0$ と下がっていきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\int t^2e^t\\,dt&=t^2e^t-\\int2te^t\\,dt\\\\ &=t^2e^t-2\\left(te^t-\\int e^t\\,dt\\right)\\\\ &=(t^2-2t+2)e^t+C\\end{aligned}' }] },
      { clear: true, cols: [0.6, 0.4], say: 'これで計算できます。$3\\Big[\\,(t^2-2t+2)e^t\\,\\Big]_0^3$ を求め、三角形の部分を引けば $S$ です。',
        add: [{ t: 'h', text: '(2)　つづき：S を計算する' },
          { t: 'm', size: 'sm', tex: 'S=\\int_0^{3}3t^2e^{t}\\,dt-\\frac{27}{2}e^3' },
          gfig('c5', [ELL, REG, TP], 380)] },
      { ask: { type: 'think', q: '$\\displaystyle\\int_0^{3}3t^2e^{t}\\,dt$ の値を求めよう。',
        hint: '$3\\Big[\\,(t^2-2t+2)e^t\\,\\Big]_0^3$。$t=0$ のときの値（$2e^0=2$）も忘れずに。',
        ans: '$3\\{(9-6+2)e^3-2\\}=3(5e^3-2)=15e^3-6$',
        after: '下はし $t=0$ でも $(0-0+2)e^0=2$ が残ります。ここで落とす人が多いので注意。',
        add: [{ t: 'm', tex: '\\int_0^{3}3t^2e^{t}\\,dt=15e^3-6' }] } },
      { ask: { type: 'choice', q: 'よって $S$ は？',
        opts: ['$15e^3-6$', '$\\dfrac32e^3-2$', '$\\dfrac32e^3-6$', '$\\dfrac32e^3+6$'], ok: 2,
        why: { 0: '三角形の部分 $\\frac{27}{2}e^3$ を引き忘れています。', 1: '下はしの値 2 にも 3 をかけます。$3(5e^3-2)$ です。', 3: '$[F(t)]_0^3=F(3)-F(0)$。下はしの値は引きます。' },
        good: '$S=(15e^3-6)-\\dfrac{27}{2}e^3=\\dfrac32e^3-6$。$e^3\\fallingdotseq20.09$ なので $S\\fallingdotseq24.1$。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'S=\\frac32e^3-6' }] } },

      // ---------- 上下の確認・凹凸 ----------
      { clear: true, part: '上下の確認', say: '最後に、答案で「$0\\le x\\le27$ で $C$ が $\\ell$ より上」の根拠を書く方法です。両辺とも正なので、3乗根をとってくらべます。',
        add: [{ t: 'h', text: 'C が ℓ より上であることの確認' },
          { t: 'm', size: 'sm', tex: 'e^{\\sqrt[3]{x}}\\ge\\frac{e^3}{27}x\\iff e^{\\frac{\\sqrt[3]{x}}{3}}\\ge\\frac{e}{3}\\sqrt[3]{x}', note: '両辺の3乗根' },
          { t: 'm', size: 'sm', tex: 'u=\\frac{\\sqrt[3]{x}}{3}\\ \\text{とおくと}\\quad e^{u-1}\\ge u' }] },
      { ask: { type: 'think', q: 'すべての実数 $v$ で $e^v\\ge1+v$ が成り立つことを使って、$e^{u-1}\\ge u$ を示そう。等号はいつ？',
        hint: '$v=u-1$ とおく。$e^v\\ge1+v$ は、$g(v)=e^v-1-v$ の増減（最小値 $g(0)=0$）で示せる。',
        ans: '$v=u-1$ とおくと $e^{u-1}\\ge1+(u-1)=u$。等号は $v=0$、つまり $u=1$（$x=27$、接点）のときだけ',
        after: 'これで、$\\ell$ は接点以外で $C$ より下にあるとわかります。$x\\ge0$ のどこでも成り立つので、$\\ell$ と $C$ の共有点は接点だけです。' } },
      { clear: true, part: '凹凸', say: '曲線の形も見ておきます。$f\'\'(x)=\\dfrac{e^{\\sqrt[3]{x}}(\\sqrt[3]{x}-2)}{9x\\sqrt[3]{x^2}}$。符号は $\\sqrt[3]{x}-2$ で決まります。',
        add: [{ t: 'h', text: '別の見方：凹凸と接点' },
          { t: 'm', size: 'sm', tex: "f''(x)=\\frac{e^{\\sqrt[3]{x}}\\,(\\sqrt[3]{x}-2)}{9x\\sqrt[3]{x^2}}\\quad(x>0)" },
          gfig('c4', [ELL, TP, { k: 'pt', at: [8, Math.exp(2)], name: '(8, e²)', dir: 'nw', c: 'g', size: 21 }, { k: 'line', x: 8, dash: true, c: 'g' }])] },
      { ask: { type: 'choice', q: '$C$ が下に凸になるのは、$x$ がどの範囲のとき？',
        opts: ['$0<x<8$', '$x>2$', '$x>27$', '$x>8$'], ok: 3,
        why: { 0: 'その範囲は $\\sqrt[3]{x}-2<0$ で $f\'\'(x)<0$、上に凸です。', 1: '2 は $\\sqrt[3]{x}$ の値。$\\sqrt[3]{x}>2$ ⇔ $x>8$ です。', 2: '27 は接点。凹凸の境目は $f\'\'(x)=0$ の所です。' },
        good: '$x>8$ で下に凸、$0<x<8$ で上に凸。変曲点は $(8,\\,e^2)$。原点からの接線は、下に凸の部分（$x=27$）で接しています。',
        add: [{ t: 'p', size: 'sm', text: '$0<x<8$：上に凸　$x>8$：下に凸\n変曲点 $(8,\\ e^2)$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。根号は文字でおきかえて消す。面積は図をかいて「上 − 下」。置換したら区間も変える。部分積分は次数を下げる向きに。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
