/* 2025 阪大 理系 第4問の類題（自作）：数学Ⅲ 積分法・極限 ― 三角関数を x のべきで割った積分の評価と、積和の公式・置換による極限
   元の問題はうつしていない（「三角関数を変数のべきで割った関数の定積分（端が文字）を絶対値で上から評価する」
   「部分積分とはさみうちで、区間を大きくしたときに定積分が 0 に近づくことを示す」「積を和に直し、置換で区間をずらして、
   定積分の極限が決まった定積分で表せることを示す」というねらいと形式だけを合わせた自作問題。関数・区間・数値は自作）。
   (1) |∫_a^b sin x/x² dx| ≦ ∫_a^b dx/x² = 1/a−1/b
   (2) ∫_a^{2a} cos x/x dx = [sin x/x]_a^{2a} + ∫_a^{2a} sin x/x² dx、|…| ≦ 1/(2a)+1/a+(1/a−1/(2a)) = 2/a → 0
       （|cos x|≦1 だけでは log2 までしか言えない）
   (3) sin3x sinx = (cos2x−cos4x)/2。u=2x, u=4x で ∫_1^R cos2x/x dx=∫_2^{2R} cos u/u du、∫_1^R cos4x/x dx=∫_4^{4R} cos u/u du
       差 = ∫_2^4 − ∫_{2R}^{4R}、(2) で a=2R として後ろは 0 へ → (1/2)∫_2^4 cos x/x dx ≒ −0.28198
   数値（mpmath）：R=10 で −0.2693、R=100 で −0.2831、R=1000 で −0.2817。∫_a^{2a} の恒等式も数値で一致。
   別の見方：sin²x=(1−cos2x)/2 だと (1/2)log R が残り発散。 */
(function () {
  const POINTS = [
    '$\\left|\\displaystyle\\int_a^b f\\,dx\\right|\\le\\displaystyle\\int_a^b|f|\\,dx$ と $|\\sin x|\\le1$ で上から評価。分母が $x^2$ なら $\\dfrac1a-\\dfrac1b$ で、小さくおさえられる',
    '$\\dfrac{\\cos x}{x}$ は絶対値だけでは $\\log2$ どまり。**部分積分で分母を $x^2$ にして**から評価し、はさみうちで 0 へ',
    '積を和に直し（$\\sin3x\\sin x=\\frac{\\cos2x-\\cos4x}{2}$）、$u=2x,\\ 4x$ と置換すると区間がずれる。重なりが消えて、残りは決まった区間と「0 に近づく区間」'
  ];
  // y = cos x / x と ±1/x（(2) の図）
  const cfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [4.3, -0.26, 13.6, 0.26], w: 520, h: 290, items: [
    { k: 'axes', at: [4.3, 0], yaxis: false, tx: [[6, 'a'], [12, '2a']], xl: 'x' },
    { k: 'fn', f: '1/x', a: 4.4, b: 13.5, c: 'd', dash: true, wd: 2 }, { k: 'fn', f: '-1/x', a: 4.4, b: 13.5, c: 'd', dash: true, wd: 2 },
    { k: 'area', f: 'cos(x)/x', g: '0', a: 6, b: 12, c: 'y', alpha: 0.3 },
    { k: 'fn', f: 'cos(x)/x', a: 4.4, b: 13.5, c: 'w', wd: 3 },
    { k: 'label', at: [13.5, 1 / 13.5], text: 'y = 1/x', size: 18, c: 'd', anchor: 'end', dy: -14 },
    { k: 'label', at: [9.3, 0.2], text: 'y = cos x / x', size: 19, c: 'w', anchor: 'middle', plain: true }].concat(extra || []) });
  // 区間のずれの図
  const ifig = (id, extra) => ({ t: 'fig', id, col: 0, view: [0.6, -0.7, 10.6, 2.0], w: 560, h: 170, items: [
    { k: 'numline', ticks: [[2, '2'], [4, '4'], [7, '2R'], [9.6, '4R']], size: 21 },
    { k: 'range', from: 2, to: 7, fromIn: true, toIn: true, h: 30, c: 'y', label: '＋（2 から 2R）', size: 19, dx: -130 },
    { k: 'range', from: 4, to: 9.6, fromIn: true, toIn: true, h: 78, c: 'b', label: '−（4 から 4R）', size: 19, dx: 40 }].concat(extra || []) });

  HB.lesson({
    id: 'osaka25-4', noDec: true, field: '阪大型　数学（理系）', title: '2025 阪大 理系 第4問の類題 ― 三角関数を x で割った積分の評価と極限', level: '2025年度 大阪大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '次の問いに答えよ。',
      parts: [
        '(1)　$0<a<b$ のとき、不等式 $\\left|\\displaystyle\\int_a^b\\frac{\\sin x}{x^2}\\,dx\\right|\\le\\frac1a-\\frac1b$ が成り立つことを示せ。',
        '(2)　$\\displaystyle\\lim_{a\\to\\infty}\\int_a^{2a}\\frac{\\cos x}{x}\\,dx=0$ を示せ。',
        '(3)　$\\displaystyle\\lim_{R\\to\\infty}\\int_1^R\\frac{\\sin3x\\,\\sin x}{x}\\,dx=\\frac12\\int_2^4\\frac{\\cos x}{x}\\,dx$ を示せ。'
      ],
      src: '※ 2025年度 大阪大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', cols: [1], say: '積分と極限の証明問題です。(1) の不等式を (2) で使い、(2) の結果を (3) で使う、3段の誘導になっています。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) は、積分の絶対値を上からおさえる基本の形です。絶対値を積分の中に入れ、$|\\sin x|\\le1$ を使います。$a<b$ なので、積分の向きは正しい向きです。',
        add: [{ t: 'h', text: '(1)　絶対値で上から評価する' },
          { t: 'm', tex: '\\left|\\int_a^b\\frac{\\sin x}{x^2}\\,dx\\right|\\le\\int_a^b\\frac{|\\sin x|}{x^2}\\,dx\\le\\int_a^b\\frac{1}{x^2}\\,dx', note: '$a<b$' }] },
      { say: '最後の積分は $\\Big[-\\dfrac1x\\Big]_a^b=-\\dfrac1b+\\dfrac1a$。これで (1) が示せました。答案では「$a<b$ だから」「$|\\sin x|\\le1$ だから」を必ず書きます。',
        add: [{ t: 'm', tex: '\\int_a^b\\frac{dx}{x^2}=\\Big[-\\frac1x\\Big]_a^b=\\frac1a-\\frac1b' },
          { t: 'ans', label: '(1)', tex: '\\left|\\int_a^b\\frac{\\sin x}{x^2}\\,dx\\right|\\le\\frac1a-\\frac1b' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.5, 0.5], part: '(2)', say: '(2) の $\\dfrac{\\cos x}{x}$ のグラフです。正と負の部分が打ち消し合うので、積分（黄の面積の差し引き）は小さくなりそうです。でも、それをどう示すか。',
        add: [{ t: 'h', text: '(2)　まず (1) と同じように？' },
          { t: 'm', tex: '\\left|\\int_a^{2a}\\frac{\\cos x}{x}\\,dx\\right|\\le\\int_a^{2a}\\frac{1}{x}\\,dx' },
          cfig('g1')] },
      { ask: { type: 'choice', q: '$|\\cos x|\\le1$ だけで評価すると、右辺 $\\displaystyle\\int_a^{2a}\\frac{dx}{x}$ は？',
        opts: ['$\\dfrac{1}{2a}$', '$\\log2$', '$\\dfrac1a$', '$\\log a$'], ok: 1,
        why: { 0: '$\\frac1x$ の積分は $\\log x$ です。$\\frac{1}{x^2}$ のときと混同しています。', 2: '$\\frac1x$ の積分は $\\log x$ です。', 3: '$\\log2a-\\log a=\\log2$。$a$ は消えます。' },
        good: '$\\log2a-\\log a=\\log2$。$a$ をどれだけ大きくしても $\\log2$ のままで、0 に近づくことは言えません。',
        add: [{ t: 'm', tex: '=\\log2a-\\log a=\\log2', note: '0 に近づかない！' },
          { t: 'box', c: 'p', size: 'sm', label: '方針', text: '打ち消し合いを生かすため、**部分積分**で分母を $x^2$ にしてから (1) を使う' }] } },
      { clear: true, cols: [1], part: '(2) 部分積分', say: '$\\cos x=(\\sin x)\'$ と見て部分積分します。$\\dfrac1x$ を微分すると $-\\dfrac{1}{x^2}$ になり、分母が $x^2$ になります。',
        add: [{ t: 'h', text: '(2)　部分積分で分母を x² に' },
          { t: 'm', tex: '\\int_a^{2a}\\frac{\\cos x}{x}\\,dx=\\int_a^{2a}(\\sin x)\'\\cdot\\frac1x\\,dx' }] },
      { ask: { type: 'choice', q: '端の項は $\\Big[\\dfrac{\\sin x}{x}\\Big]_a^{2a}$。そのあとに続く積分の項は？',
        opts: ['$-\\int_a^{2a}\\frac{\\sin x}{x^2}dx$', '$+\\int_a^{2a}\\frac{\\sin x}{x^2}dx$', '$-\\int_a^{2a}\\frac{\\sin x}{x}dx$', '$+\\int_a^{2a}\\frac{\\cos x}{x^2}dx$'], ok: 1,
        why: { 0: '$\\left(\\frac1x\\right)\'=-\\frac{1}{x^2}$。引く項の中にマイナスがあるので、全体は＋になります。', 2: '$\\frac1x$ を微分する側にしたので、分母は $x^2$ になります。', 3: '$\\sin x$ はそのまま残ります。$\\cos x$ は積分して $\\sin x$ になった側です。' },
        good: '$\\Big[\\sin x\\cdot\\frac1x\\Big]-\\int\\sin x\\cdot\\left(-\\frac{1}{x^2}\\right)dx$。マイナスどうしで＋。',
        add: [{ t: 'm', tex: '=\\frac{\\sin2a}{2a}-\\frac{\\sin a}{a}+\\int_a^{2a}\\frac{\\sin x}{x^2}\\,dx', note: '…①' }] } },
      { say: '① の3つの項を、それぞれ絶対値でおさえます。端の項は $|\\sin|\\le1$、積分の項は (1) で $b=2a$ とします。合わせると $\\dfrac2a$ 以下です。',
        add: [{ t: 'm', tex: '\\left|\\int_a^{2a}\\frac{\\cos x}{x}\\,dx\\right|\\le\\frac{1}{2a}+\\frac1a+\\left(\\frac1a-\\frac{1}{2a}\\right)=\\frac2a', note: '三角不等式と (1)' },
          { t: 'p', size: 'sm', text: '$a\\to\\infty$ のとき $\\dfrac2a\\to0$。はさみうちの原理より' },
          { t: 'ans', label: '(2)', tex: '\\lim_{a\\to\\infty}\\int_a^{2a}\\frac{\\cos x}{x}\\,dx=0' }] },

      // ---------- (3) ----------
      { clear: true, cols: [1], part: '(3)', say: '(3) は積の形。まず積を和に直します。$\\cos(A-B)-\\cos(A+B)=2\\sin A\\sin B$ を使います。',
        add: [{ t: 'h', text: '(3)　積を和に直す' },
          { t: 'm', tex: '\\cos(A-B)-\\cos(A+B)=2\\sin A\\sin B', note: '加法定理から' }] },
      { ask: { type: 'choice', q: '$\\sin3x\\,\\sin x$ を和の形にすると？',
        opts: ['$\\dfrac{\\cos4x-\\cos2x}{2}$', '$\\dfrac{\\sin4x+\\sin2x}{2}$', '$\\cos2x-\\cos4x$', '$\\dfrac{\\cos2x-\\cos4x}{2}$'], ok: 3,
        why: { 0: '符号が逆です。$\\cos(A-B)$ のほうが先（＋）です。', 1: '$\\sin\\times\\sin$ は $\\cos$ の和・差になります。', 2: '$\\frac12$ を忘れています。' },
        good: '$A=3x,\\ B=x$ で $\\cos2x-\\cos4x=2\\sin3x\\sin x$。',
        add: [{ t: 'm', tex: '\\int_1^R\\frac{\\sin3x\\,\\sin x}{x}\\,dx=\\frac12\\int_1^R\\frac{\\cos2x}{x}\\,dx-\\frac12\\int_1^R\\frac{\\cos4x}{x}\\,dx', note: '…②' }] } },
      { say: '② の右辺は1つずつだと極限がわかりません。そこで $u=2x,\\ u=4x$ と置換して、どちらも $\\dfrac{\\cos u}{u}$ の積分にそろえます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '置換で同じ形 $\\displaystyle\\int\\frac{\\cos u}{u}\\,du$ にそろえる → 区間だけがちがう → 重なりを消す' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_1^R\\frac{\\cos4x}{x}\\,dx$ を $u=4x$ で置換すると？',
        opts: ['$\\displaystyle\\int_4^{4R}\\frac{\\cos u}{u}\\,du$', '$\\dfrac14\\displaystyle\\int_4^{4R}\\frac{\\cos u}{u}\\,du$', '$\\displaystyle\\int_1^{R}\\frac{\\cos u}{u}\\,du$', '$4\\displaystyle\\int_4^{4R}\\frac{\\cos u}{u}\\,du$'], ok: 0,
        why: { 1: '$dx=\\frac{du}{4}$ ですが、$\\frac1x=\\frac4u$ なので $\\frac14$ は打ち消されます。', 2: '積分区間も $u$ に変えます。$x:1\\to R$ なら $u:4\\to4R$。', 3: '$\\frac{dx}{x}=\\frac{du}{u}$ で、係数は残りません。' },
        good: '$\\dfrac{dx}{x}=\\dfrac{du}{u}$ なので係数は 1。区間は $4\\to4R$。同じように $\\displaystyle\\int_1^R\\frac{\\cos2x}{x}dx=\\int_2^{2R}\\frac{\\cos u}{u}du$。',
        add: [{ t: 'm', tex: '\\frac12\\int_2^{2R}\\frac{\\cos u}{u}\\,du-\\frac12\\int_4^{4R}\\frac{\\cos u}{u}\\,du', note: '② の右辺' }] } },
      { clear: true, cols: [1], part: '(3) 区間をずらす', say: '2つの区間 $[2,\\ 2R]$ と $[4,\\ 4R]$ は、$[4,\\ 2R]$ の部分が重なっていて、引くと消えます。残るのは $[2,\\ 4]$ と $[2R,\\ 4R]$ です。',
        add: [{ t: 'h', text: '(3)　重なりが消える' },
          ifig('i1'),
          { t: 'm', tex: '\\int_2^{2R}\\frac{\\cos u}{u}\\,du-\\int_4^{4R}\\frac{\\cos u}{u}\\,du=\\int_2^{4}\\frac{\\cos u}{u}\\,du-\\int_{2R}^{4R}\\frac{\\cos u}{u}\\,du' }] },
      { ask: { type: 'think', q: '$R\\to\\infty$ のとき、$\\displaystyle\\int_{2R}^{4R}\\frac{\\cos u}{u}\\,du\\to0$ となるのはなぜ？',
        hint: '(2) の $a$ を何にすればよいか。',
        ans: '(2) で $a=2R$ とおくと $\\displaystyle\\int_{2R}^{4R}\\frac{\\cos u}{u}\\,du\\to0$（$R\\to\\infty$ のとき $a\\to\\infty$）',
        after: '(2) の区間が $[a,\\ 2a]$ だったのは、ここで使うためでした。誘導の意味を読みとりましょう。' } },
      { say: 'したがって、$R\\to\\infty$ で後ろの項は 0 に近づき、(3) が示せました。',
        add: [{ t: 'ans', label: '(3)', tex: '\\lim_{R\\to\\infty}\\int_1^R\\frac{\\sin3x\\,\\sin x}{x}\\,dx=\\frac12\\int_2^4\\frac{\\cos x}{x}\\,dx' }] },
      { say: '数値でも確かめます。右辺は約 $-0.282$。$[2,\\ 4]$ では $\\cos x<0$（$\\frac{\\pi}{2}<2,\\ 4<\\frac{3\\pi}{2}$）なので、負の値になるのも当然です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$R$', '10', '100', '1000', '極限'], ['$\\displaystyle\\int_1^R\\frac{\\sin3x\\sin x}{x}dx$', '$-0.269$', '$-0.283$', '$-0.282$', '$-0.282$']] }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: 'この方法がうまくいったのは、和に直したとき **cos だけ** が残ったからです。定数項が残ると話が変わります。',
        add: [{ t: 'h', text: '別の見方：定数項が残ると？' },
          { t: 'm', tex: '\\sin^2x=\\frac{1-\\cos2x}{2}' }] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{R\\to\\infty}\\int_1^R\\frac{\\sin^2x}{x}\\,dx$ はどうなる？',
        opts: ['$\\dfrac12\\displaystyle\\int_1^2\\frac{\\cos x}{x}dx$ に収束', '$0$ に収束', '$\\dfrac12$ に収束', '正の無限大に発散'], ok: 3,
        why: { 0: '$\\frac{1}{2x}$ の項が残ります。その積分が収束しません。', 1: '被積分関数は 0 以上で、しかも大きくなっていきます。', 2: '$\\int_1^R\\frac{dx}{2x}=\\frac12\\log R$ は限りなく大きくなります。' },
        good: '$\\displaystyle\\int_1^R\\frac{\\sin^2x}{x}dx=\\frac12\\log R-\\frac12\\int_1^R\\frac{\\cos2x}{x}dx$。後ろは収束するが、$\\frac12\\log R\\to\\infty$。',
        add: [{ t: 'm', tex: '\\int_1^R\\frac{\\sin^2x}{x}\\,dx=\\frac12\\log R-\\frac12\\int_2^{2R}\\frac{\\cos u}{u}\\,du\\ \\to\\ \\infty' }] } },
      { say: '答案では、(2) の「三角不等式で3つの項をおさえる」所と、(3) の「置換で区間が変わる」所を、式で省略せずに書くこと。ここが採点のポイントです。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案のポイント', text: '(2)：$|A+B+C|\\le|A|+|B|+|C|$ を書いてから、各項を評価 → $0\\le|\\cdots|\\le\\frac2a\\to0$\n(3)：$u=2x$ で $x:1\\to R$ のとき $u:2\\to2R$、$\\frac{dx}{x}=\\frac{du}{u}$ と明記' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。評価する → 部分積分で評価しやすくする → 置換で区間をそろえる。積分と極限の証明の基本の流れでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
