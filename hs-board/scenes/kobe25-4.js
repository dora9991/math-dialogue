/* 神戸大型（理系）2025 第4問の類題（自作）：数学C 空間ベクトル ― 平面上を動く点から直線に下ろした垂線の足と、三角形の面積の最小値
   元の問題はうつしていない（「決まった2点と、2つの文字で座標が決まり1つの平面上を動く点の3点が一直線上にないことを示す」
   「動く点から2点を通る直線に下ろした垂線の足を文字で表す」「底辺一定なので高さ＝垂線の長さを2変数の2次式として最小にする」
   というねらいと形式だけを合わせた自作問題）。
   A(0,1,0)、B(2,2,−2)、P(s,t,2−s)。AB=(2,1,−2)、|AB|=3。直線 AB 上の点 (2u,1+u,−2u) は x+z=0、P は x+z=2 → 一直線上にない。
   H=A+k·AB、PH·AB=9k−4s−t+5=0 → k=(4s+t−5)/9、H((8s+2t−10)/9, (4s+t+4)/9, (−8s−2t+10)/9)。
   PH=((−s+2t−10)/9, (4s−8t+4)/9, (s−2t−8)/9)、PH²=(2/9)(s²−4st+4t²+2s−4t+10)=(2/9){(s−2t+1)²+9}=2+(2/9)(s−2t+1)²。
   最小 PH=√2（s−2t+1=0、例 s=t=1 で P(1,1,1)、H=A）、面積の最小値 (1/2)·3·√2=3√2/2。
   別の見方：AB は平面 x+z=2 に平行（AB·(1,0,1)=0）。最小は直線と平面の距離＝A から平面への距離（A から (1,0,1) 方向に進んで (1,1,1)）＝√2。
   python3（sympy）で検算ずみ（s=2,t=3 の例：H(4/3,5/3,−4/3)、PH=2）。 */
(function () {
  const POINTS = [
    '一直線上にないことは「直線 AB 上の点がみたす式」を見つけるとはやい。AB 上はいつも $x+z=0$、P はいつも $x+z=2$',
    '垂線の足 H は $\\overrightarrow{\\mathrm{AH}}=k\\overrightarrow{\\mathrm{AB}}$ とおき、$\\overrightarrow{\\mathrm{PH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ で $k$ を決める',
    '底辺 AB が一定なので、面積の最小 ⇔ PH の最小。$\\mathrm{PH}^2$ を2変数の2次式として、1文字ずつ平方完成する'
  ];
  // 模式図：平面上の点 (u, v) を画面の [u+0.75v, v] に、平面からの高さ h を上に
  const S = (u, v, h) => [u + 0.6 * v, 0.75 * v + (h || 0)];
  const plane = [S(0, 0), S(6, 0), S(6, 2.6), S(0, 2.6)];
  const A = S(1.0, 0.9, 2.1), B = S(4.0, 0.9, 2.1), P = S(3.3, 2.1), H = S(3.3, 0.9, 2.1), Q = S(3.3, 0.9);
  const sketch = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-0.3, -0.45, 8.1, 3.75], w: Math.round((h || 300) * 8.4 / 4.2), h: h || 300, items: [
    { k: 'poly', pts: plane, close: true, fill: 'b', alpha: 0.15, c: 'b', wd: 2 },
    { k: 'label', at: S(5.9, 0.35), text: '平面 x+z=2', c: 'b', size: 20, anchor: 'end' },
    { k: 'label', at: [8.0, -0.25], text: '（模式図）', c: 'd', size: 17, anchor: 'end' },
    { k: 'seg', a: S(-0.2, 0.9, 2.1), b: S(5.6, 0.9, 2.1), c: 'w', wd: 3 },
    { k: 'label', at: S(5.6, 0.9, 2.1), text: '直線 AB', c: 'w', size: 20, dx: 8, anchor: 'start' },
    { k: 'pt', at: A, name: 'A', dir: 'n', c: 'w' }, { k: 'pt', at: B, name: 'B', dir: 'n', c: 'w' },
    { k: 'pt', at: P, name: 'P', dir: 'se', c: 'y' }].concat(extra || []) });
  const PH = [{ k: 'seg', a: P, b: H, c: 'p', wd: 3 }, { k: 'right', o: H, a: B, b: P, s: 16, c: 'p' }, { k: 'pt', at: H, name: 'H', dir: 'n', c: 'p' }];

  HB.lesson({
    id: 'kobe25-4', field: '神戸大型　数学（理系）', title: '2025 神戸大 理系 第4問の類題 ― 平面上を動く点と垂線の足、三角形の面積の最小', level: '2025年度 神戸大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 点 $\\mathrm{A}(0,\\ 1,\\ 0)$，$\\mathrm{B}(2,\\ 2,\\ -2)$ がある。また、実数 $s,\\ t$ に対して、点 $\\mathrm{P}(s,\\ t,\\ 2-s)$ をとる。',
      parts: [
        '(1)　$s,\\ t$ がどのような実数であっても、3 点 A，B，P は一直線上にないことを示せ。',
        '(2)　P から直線 AB に垂線を下ろし、直線 AB との交点を H とする。H の座標を $s,\\ t$ を用いて表せ。',
        '(3)　$s,\\ t$ が実数全体を動くとき、$\\triangle\\mathrm{ABP}$ の面積の最小値を求めよ。'
      ],
      src: '※ 2025年度 神戸大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間の2点と、2つの文字で動く点 P の問題です。(2) の垂線の足が、(3) の面積の「高さ」になります。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: 'まず登場する点の正体をつかみます。P の座標は $x=s,\\ z=2-s$ なので、$s$ をどう選んでも $x+z=2$ です。',
        add: [{ t: 'h', text: '読みかえ：P はどこを動く？' },
          { t: 'm', tex: '\\mathrm{P}(s,\\ t,\\ 2-s)\\quad\\Longrightarrow\\quad x+z=s+(2-s)=2' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}=(2,\\ 1,\\ -2),\\qquad |\\overrightarrow{\\mathrm{AB}}|=\\sqrt{4+1+4}=3' }] },
      { ask: { type: 'choice', q: '$s,\\ t$ が実数全体を動くとき、P が動く範囲は？',
        opts: ['直線', '平面 $x+z=2$', '平面 $z=2$', '球面'], ok: 1,
        why: { 0: '$s$ と $t$ の2つが自由に動くので、広がりは2次元。直線ではなく平面です。', 2: '$z=2-s$ は $s$ によって変わります。$z$ は一定ではありません。', 3: '座標が $s,\\ t$ の1次式なので、曲がった面にはなりません。' },
        good: '$x+z=2$ をみたす点はすべて P になれます（$s=x,\\ t=y$ と選べばよい）。P は平面 $x+z=2$ 全体を動きます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　直線 AB 上の点がみたす式を見つけ、P と比べる\n(2)　$\\overrightarrow{\\mathrm{AH}}=k\\overrightarrow{\\mathrm{AB}}$、$\\overrightarrow{\\mathrm{PH}}\\perp\\overrightarrow{\\mathrm{AB}}$\n(3)　面積 $=\\dfrac12\\cdot\\mathrm{AB}\\cdot\\mathrm{PH}$。AB $=3$ は一定 → PH を最小に' },
          sketch('s1', PH, 260)] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。直線 AB 上の点は、実数 $u$ を使って $\\overrightarrow{\\mathrm{OA}}+u\\overrightarrow{\\mathrm{AB}}$ と表せます。座標で書くと…',
        add: [{ t: 'h', text: '(1)　一直線上にないことの証明' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OA}}+u\\overrightarrow{\\mathrm{AB}}=(2u,\\ 1+u,\\ -2u)', note: '直線 AB 上の点' }] },
      { ask: { type: 'choice', q: '直線 AB 上の点 $(2u,\\ 1+u,\\ -2u)$ が、$u$ によらずいつもみたす式は？',
        opts: ['$x+y=1$', '$x-z=0$', '$x+z=0$', '$y+z=1$'], ok: 2,
        why: { 0: '$2u+(1+u)=1+3u$。$u$ によって変わります。', 1: '$2u-(-2u)=4u$。$u$ によって変わります。', 3: '$(1+u)+(-2u)=1-u$。$u$ によって変わります。' },
        good: '$x+z=2u+(-2u)=0$。直線 AB 全体が、平面 $x+z=0$ の上にあります。',
        add: [{ t: 'm', tex: 'x+z=2u+(-2u)=0' }] } },
      { say: 'P は $x+z=2$、直線 AB 上の点は $x+z=0$。だから P は直線 AB 上にありません。これで証明できました。',
        add: [{ t: 'ans', label: '(1)', text: '直線 AB 上の点は $(2u,\\ 1+u,\\ -2u)$ と表され、$x+z=0$ をみたす。\n一方 P は $x+z=s+(2-s)=2\\neq0$ なので、P は直線 AB 上にない。\nよって 3 点 A，B，P は一直線上にない。　■' }] },
      { ask: { type: 'think', q: '別の書き方：「$\\overrightarrow{\\mathrm{AP}}=k\\overrightarrow{\\mathrm{AB}}$ となる $k$ がある」と仮定して、矛盾を出そう。',
        hint: '$\\overrightarrow{\\mathrm{AP}}=(s,\\ t-1,\\ 2-s)$。$x$ 成分と $z$ 成分を比べる。',
        ans: '$s=2k$ かつ $2-s=-2k$。足すと $2=0$ となり矛盾。',
        after: '$x$ 成分と $z$ 成分を足すと $s$ と $k$ が同時に消えます。(1) の「$x+z$」と同じ発想です。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。H は直線 AB 上の点なので $\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+k\\overrightarrow{\\mathrm{AB}}=(2k,\\ 1+k,\\ -2k)$。あとは $k$ を決める条件です。',
        add: [{ t: 'h', text: '(2)　垂線の足 H の座標' },
          { t: 'm', tex: '\\mathrm{H}(2k,\\ 1+k,\\ -2k)', note: '直線 AB 上' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PH}}=(2k-s,\\ 1+k-t,\\ -2k-2+s)' },
          sketch('s2', PH, 250)] },
      { ask: { type: 'choice', q: '$k$ を決める条件は？',
        opts: ['$\\overrightarrow{\\mathrm{PH}}\\cdot\\overrightarrow{\\mathrm{AP}}=0$', '$|\\overrightarrow{\\mathrm{PH}}|=|\\overrightarrow{\\mathrm{AB}}|$', '$\\overrightarrow{\\mathrm{PH}}=k\\overrightarrow{\\mathrm{AB}}$', '$\\overrightarrow{\\mathrm{PH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$'], ok: 3,
        why: { 0: 'PH が垂直なのは直線 AB です。AP とは垂直になりません。', 1: '長さが等しいという条件は、問題のどこにもありません。', 2: 'それは PH が AB に平行という意味。垂線なので逆です。' },
        good: '「垂線の足」⇔ $\\overrightarrow{\\mathrm{PH}}\\perp\\overrightarrow{\\mathrm{AB}}$ ⇔ 内積 $=0$。',
        add: [{ t: 'm', size: 'sm', tex: '2(2k-s)+(1+k-t)-2(-2k-2+s)=0' }] } },
      { ask: { type: 'choice', q: '左辺を整理すると $9k-4s-t+5=0$。$k$ は？',
        opts: ['$\\dfrac{4s+t-5}{9}$', '$\\dfrac{4s+t-5}{3}$', '$\\dfrac{4s+t+5}{9}$', '$\\dfrac{5-4s-t}{9}$'], ok: 0,
        why: { 1: '$k$ の係数は 9 です（$4k+k+4k$）。$|\\overrightarrow{\\mathrm{AB}}|=3$ と混同しています。', 2: '$+5$ を右辺に移すと $-5$ になります。', 3: '$-4s-t$ を右辺に移すと符号が変わって $+4s+t$。' },
        good: '$9k=4s+t-5$。$|\\overrightarrow{\\mathrm{AB}}|^2=9$ が係数に出てくるのは、いつものことです。',
        add: [{ t: 'm', tex: 'k=\\frac{4s+t-5}{9}' }] } },
      { say: '$k$ を H の座標に代入して、(2) の答えです。検算：$s=t=1$ なら $k=0$ で H は A に一致。P(1, 1, 1) から見て、A が垂線の足になっています。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\mathrm{H}\\left(\\frac{8s+2t-10}{9},\\ \\frac{4s+t+4}{9},\\ \\frac{-8s-2t+10}{9}\\right)' },
          { t: 'p', size: 'sm', col: 1, text: '検算：$s=t=1$ → $k=0$、H $=$ A$(0,\\ 1,\\ 0)$\n$\\overrightarrow{\\mathrm{PA}}=(-1,\\ 0,\\ -1)$、$\\overrightarrow{\\mathrm{PA}}\\cdot\\overrightarrow{\\mathrm{AB}}=-2+0+2=0$ ✓' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: '(3) です。底辺 AB $=3$ は一定なので、面積 $=\\frac32\\mathrm{PH}$。PH の最小を考えます。まず $\\overrightarrow{\\mathrm{PH}}$ を $s,\\ t$ で表します。',
        add: [{ t: 'h', text: '(3)　面積の最小値' },
          { t: 'm', tex: '\\triangle\\mathrm{ABP}=\\frac12\\cdot\\mathrm{AB}\\cdot\\mathrm{PH}=\\frac32\\,\\mathrm{PH}' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PH}}=\\frac19\\big(-s+2t-10,\\ \\ 4s-8t+4,\\ \\ s-2t-8\\big)', note: '(2) の H − P' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PH}^2=\\frac{2}{9}\\left(s^2-4st+4t^2+2s-4t+10\\right)', note: '展開して整理' }] },
      { ask: { type: 'choice', q: '$s^2-4st+4t^2+2s-4t+10$ を、$s$ について平方完成すると？',
        opts: ['$(s-2t-1)^2+9$', '$(s-2t+1)^2+9$', '$(s-2t+1)^2+4t^2-4t+10$', '$(s-2t+1)^2+10$'], ok: 1,
        why: { 0: '$s$ の1次の係数は $2-4t=-2(2t-1)$ なので、$(s-(2t-1))^2=(s-2t+1)^2$。符号が逆です。', 2: '$(s-2t+1)^2$ を展開すると余分な $(2t-1)^2$ が出るので、それを引き忘れています。', 3: '引くべき $(2t-1)^2$ と、残りの $4t^2-4t+10$ を合わせると $9$ です。' },
        good: '$(s-2t+1)^2-(2t-1)^2+4t^2-4t+10=(s-2t+1)^2+9$。$t$ だけの部分がきれいに消えました。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{PH}^2=\\frac29\\left\\{(s-2t+1)^2+9\\right\\}' }] } },
      { clear: true, cols: [0.56, 0.44], part: '(3) 最小', say: '整理すると $\\mathrm{PH}^2=\\frac29(s-2t+1)^2+2$。$t$ についての平方完成が、もういらない形になっています。',
        add: [{ t: 'h', text: '(3)　つづき：PH の最小' },
          { t: 'm', tex: '\\mathrm{PH}^2=\\frac29(s-2t+1)^2+2' },
          sketch('s4', PH, 230)] },
      { ask: { type: 'think', q: 'ふつうは $t$ についてもう一度平方完成するのに、ここでは $t$ の部分が消えた。なぜだろう？',
        hint: '$s\\to s+2,\\ t\\to t+1$ と変えると、P はどう動く？ $s-2t$ は？',
        ans: 'P は $\\overrightarrow{\\mathrm{AB}}=(2,\\ 1,\\ -2)$ の向きに動き、$s-2t$ は変わらない。AB に平行に動いても、AB までの距離 PH は変わらないから。',
        after: '直線 AB が、P の動く平面に **平行** だからです。だから PH は $s-2t$ だけで決まります。' } },
      { say: 'よって PH$^2\\ge2$ で、等号は $s-2t+1=0$（たとえば $s=t=1$）のとき。PH の最小値は $\\sqrt2$ です。',
        add: [{ t: 'p', size: 'sm', text: '$s-2t+1=0$ をみたす $s,\\ t$ はある（例：$s=t=1$）\n→ PH の最小値は $\\sqrt2$' }] },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{ABP}$ の面積の最小値は？',
        opts: ['$\\sqrt2$', '$3\\sqrt2$', '$\\dfrac{3\\sqrt2}{2}$', '$\\dfrac32$'], ok: 2,
        why: { 0: 'それは PH の最小値。面積は $\\frac12\\cdot3\\cdot\\sqrt2$ です。', 1: '$\\frac12$ をかけ忘れています。', 3: 'PH$^2$ の最小値 2 と PH をとりちがえています（$\\frac32\\cdot1$ ではなく $\\frac32\\cdot\\sqrt2$）。' },
        good: '$\\frac12\\cdot3\\cdot\\sqrt2=\\dfrac{3\\sqrt2}{2}$。$s-2t+1=0$ のとき（$s=t=1$ など）に最小です。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\frac12\\cdot3\\cdot\\sqrt2=\\frac{3\\sqrt2}{2}' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.5, 0.5], part: '別の見方', say: '図で見なおします。直線 AB は平面 $x+z=2$ に平行。P がどこにあっても、PH は「直線と平面の距離」より短くなれません。',
        add: [{ t: 'h', text: '別の見方：直線と平面の距離' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot(1,\\ 0,\\ 1)=2-2=0', note: '$(1,\\ 0,\\ 1)$ は平面の\n法線ベクトル' },
          { t: 'p', size: 'sm', text: 'A から $(1,\\ 0,\\ 1)$ の向きに進む：$(u,\\ 1,\\ u)$\n平面 $x+z=2$ に着くのは $u=1$、点 $(1,\\ 1,\\ 1)$\n→ 直線と平面の距離は $\\sqrt{1+0+1}=\\sqrt2$' },
          sketch('s3', PH.concat([{ k: 'seg', a: S(0, 0.9), b: S(6, 0.9), c: 'g', wd: 2, dash: true },
            { k: 'seg', a: Q, b: H, c: 'g', wd: 2, dash: true }, { k: 'seg', a: Q, b: P, c: 'g', wd: 2, dash: true },
            { k: 'label', at: [Q[0] - 0.12, Q[1] + 1.05], text: '√2', c: 'g', size: 22, anchor: 'end' }, { k: 'pt', at: Q, c: 'g', r: 5 }]), 330)] },
      { say: '図の緑の三角形は直角三角形で、PH$^2=2+$（平面の中で P がずれた分）$^2$。計算で出た $\\frac29(s-2t+1)^2+2$ の、それぞれの項の意味です。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '式の意味', text: '$\\mathrm{PH}^2=\\underbrace{2}_{\\text{距離}^2}+\\underbrace{\\tfrac29(s-2t+1)^2}_{\\text{平面の中のずれ}^2}$' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の動く点の問題は「動く範囲を式で見る → 垂直は内積 → 2変数は1文字ずつ平方完成」の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
