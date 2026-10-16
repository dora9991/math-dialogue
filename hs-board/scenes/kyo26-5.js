/* 京大型 数学（理系）：2026年度 京都大学 前期 理系 第5問の類題（自作問題・元の問題ではない）
   問題：y=sin x と y=sin(x−2π/3)（−π/6≦x≦5π/6）で囲まれた図形 D を x 軸のまわりに1回転してできる立体の体積 V。
   答え：V = π²/3 + 3√3π/4（= π(4π+9√3)/12 ≒ 7.3709）。python3 で検算ずみ（数値積分 200 万分割と sympy）。
     そのまま π∫(sin²x − sin²(x−2π/3))dx とすると 0 になってしまう（D が x 軸をまたぐため）。
     x↦2π/3−x で (f, g)→(−g, −f) なので、立体は x=π/3 について対称。
     V = 2π{ ∫_{π/3}^{2π/3} sin²x dx + ∫_{2π/3}^{5π/6} (sin²x − sin²(x−2π/3)) dx } = 2π{ (π/6+√3/4) + √3/8 } */
(function () {
  const PI = Math.PI;
  const F = 'sin(x)', G = 'sin(x-2*PI/3)';
  const TX = [[-PI / 6, '−π/6'], [PI / 3, 'π/3'], [2 * PI / 3, '2π/3'], [5 * PI / 6, '5π/6']];
  const graphD = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.05, -1.32, 3.75, 1.32], w: 620, h: 340, items: [
    { k: 'axes', tx: TX, ty: [[1, '1'], [-1, '−1']], xl: 'x', yl: 'y', o: false },
    { k: 'area', f: F, g: G, a: -PI / 6, b: 5 * PI / 6, c: 'y', alpha: 0.3 },
    { k: 'fn', f: F, a: -1, b: 3.7, c: 'b', label: 'y = sin x', lat: [1.0, 1.15], plain: true },
    { k: 'fn', f: G, a: -1, b: 3.7, c: 'p', label: 'y = sin(x − 2π/3)', lat: [1.45, -1.12], plain: true },
    { k: 'label', at: [1.05, 0.25], text: 'D', size: 28, c: 'y' }].concat(extra || []) });
  // 折り返した図：半径の外側 R(x)、内側 r(x)
  const R = 'x<0 ? -sin(x-2*PI/3) : (x<2*PI/3 ? max(sin(x), -sin(x-2*PI/3)) : sin(x))';
  const r = 'x<0 ? -sin(x) : (x<2*PI/3 ? 0 : sin(x-2*PI/3))';
  const folded = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.05, -0.32, 3.75, 1.28], w: 620, h: 300, items: [
    { k: 'axes', tx: TX, ty: [[1, '1']], xl: 'x', yl: '', o: false },
    { k: 'fn', f: 'abs(sin(x))', a: -PI / 6, b: 5 * PI / 6, c: 'b', dash: true, wd: 2 },
    { k: 'fn', f: 'abs(sin(x-2*PI/3))', a: -PI / 6, b: 5 * PI / 6, c: 'p', dash: true, wd: 2 },
    { k: 'area', f: R, g: r, a: -PI / 6, b: 5 * PI / 6, c: 'g', alpha: 0.35 },
    { k: 'fn', f: R, a: -PI / 6, b: 5 * PI / 6, c: 'g', wd: 3.5 }].concat(extra || []) });
  const POINTS = [
    '図形が **$x$ 軸をまたぐ** ときは、$\\pi\\int\\{(\\text{上})^2-(\\text{下})^2\\}dx$ は使えない（この問題では 0 になってしまう）',
    '$x$ 軸より下の部分を折り返し、各 $x$ で「円板（軸をふくむ）」か「ドーナツ形」かを見る。半径は $|y|$ の最大と最小',
    '対称性（$x=\\frac\\pi3$）で積分を半分に。$\\sin^2A-\\sin^2B=\\sin(A+B)\\sin(A-B)$ で計算を軽く'
  ];

  HB.lesson({
    id: 'kyo26-5', field: '京大型　数学（理系）', title: '2026 京大 理系 第5問の類題 ― ずれた2つの正弦曲線が囲む図形の回転体', level: '2026年度 京都大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '2 つの曲線 $y=\\sin x$、$y=\\sin\\!\\left(x-\\dfrac{2\\pi}3\\right)$ の $-\\dfrac\\pi6\\le x\\le\\dfrac{5\\pi}6$ の部分で囲まれた図形を $D$ とする。$D$ を $x$ 軸のまわりに 1 回転してできる立体の体積 $V$ を求めよ。',
      src: '※ 2026年度 京都大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [1],
    steps: [
      { part: '問題', say: '回転体の体積の問題です。式はかんたんそうですが、図をかくと「落とし穴」が見えてきます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 図と落とし穴 ----------
      { clear: true, cols: [0.42, 0.58], part: '図をかく', say: '2つのグラフは、$x=-\\frac\\pi6$ と $x=\\frac{5\\pi}6$ で交わります。その間では $\\sin x$（青）が上。D（黄）は $x$ 軸の **上と下にまたがって** います。',
        add: [{ t: 'h', text: '図形 D' },
          { t: 'p', size: 'sm', text: '交点：$x=-\\frac\\pi6$（$y=-\\frac12$）\n　　　$x=\\frac{5\\pi}6$（$y=\\frac12$）\nその間で $\\sin x\\ge\\sin\\!\\left(x-\\frac{2\\pi}3\\right)$' },
          graphD('d1')] },
      { ask: { type: 'choice', q: 'もし公式どおり $\\pi\\displaystyle\\int_{-\\pi/6}^{5\\pi/6}\\Big\\{\\sin^2x-\\sin^2\\!\\big(x-\\tfrac{2\\pi}3\\big)\\Big\\}dx$ と計算すると、値は？',
        opts: ['$\\dfrac{\\pi^2}3$', '$0$', '$\\dfrac{3\\sqrt3}4\\pi$', '$\\pi$'], ok: 1,
        why: { 0: '被積分関数は $\\frac{\\sqrt3}2\\sin\\!\\left(2x-\\frac{2\\pi}3\\right)$。長さ $\\pi$（1周期）の区間で積分すると 0 です。', 2: '正しい体積の一部の値ですが、この式の値は 0 です。', 3: '$\\sin^2A-\\sin^2B=\\sin(A+B)\\sin(A-B)$ で変形すると、1周期分の積分で 0 です。' },
        good: '体積が 0 のはずはありません。$x$ 軸より下では「上の2乗 − 下の2乗」が **負** になり、打ち消し合ってしまったのです。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: '落とし穴', text: '$\\pi\\int\\{(\\text{上})^2-(\\text{下})^2\\}dx$ は\n2曲線が **どちらも $x$ 軸の上** にあるときの公式' }] } },

      // ---------- 方針 ----------
      { clear: true, cols: [0.5, 0.5], part: '方針', say: '回転体の、$x$ 軸に垂直な切り口を考えます。各 $x$ で、D の縦の線分 $g(x)\\le y\\le f(x)$ を回すと、切り口は次の2種類です。',
        add: [{ t: 'h', text: '切り口は円板かドーナツ形' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['線分の位置', '切り口', '面積'], ['$x$ 軸をまたぐ\n$g\\le0\\le f$', '円板', '$\\pi\\{\\max(|f|,|g|)\\}^2$'], ['$x$ 軸の上\n$0\\le g\\le f$', 'ドーナツ形', '$\\pi(f^2-g^2)$'], ['$x$ 軸の下\n$g\\le f\\le0$', 'ドーナツ形', '$\\pi(g^2-f^2)$']] },
          { t: 'p', size: 'xs', text: '（$f=\\sin x,\\ g=\\sin(x-\\frac{2\\pi}3)$）' }] },
      { say: 'たとえば $x=\\frac\\pi6$ では、線分は $y=-1$ から $y=\\frac12$ まで。回すと、半径 $\\frac12$ のドーナツではなく、**半径 1 の円板** になります。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: 'x=\\tfrac\\pi6:\\ -1\\le y\\le\\tfrac12\\ \\to\\ \\text{半径 }1\\text{ の円板}', note: '下の端のほうが軸から遠い' }] },
      { ask: { type: 'choice', q: '$-\\dfrac\\pi6\\le x\\le\\dfrac{5\\pi}6$ を、切り口の種類で分ける点は？',
        opts: ['$x=\\dfrac\\pi3$ だけ', '$x=0$ と $x=\\pi$', '$x=0$ と $x=\\dfrac{2\\pi}3$', '$x=\\dfrac\\pi2$ だけ'], ok: 2,
        why: { 0: '$x=\\frac\\pi3$ は対称の軸（あとで使います）。種類が変わるのは、どちらかの曲線が $x$ 軸と交わる所です。', 1: '$x=\\pi$ は区間の外。$g$ が 0 になるのは $x=\\frac{2\\pi}3$ です。', 3: '$\\sin x$ の最大の所で、$x$ 軸とは関係ありません。' },
        good: '$f=\\sin x$ は $x=0$ で、$g=\\sin(x-\\frac{2\\pi}3)$ は $x=\\frac{2\\pi}3$ で符号が変わります。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['$x$ の範囲', '切り口'], ['$-\\frac\\pi6\\le x\\le0$', 'ドーナツ（下）'], ['$0\\le x\\le\\frac{2\\pi}3$', '円板'], ['$\\frac{2\\pi}3\\le x\\le\\frac{5\\pi}6$', 'ドーナツ（上）']] }] } },

      // ---------- 折り返し ----------
      { clear: true, cols: [0.4, 0.6], part: '折り返す', say: '$x$ 軸より下を折り返した図です。点線が $|\\sin x|$（青）と $\\left|\\sin(x-\\frac{2\\pi}3)\\right|$（桃）。緑が、回転させる部分（外側の半径と内側の半径の間）です。',
        add: [{ t: 'h', text: '折り返した図' },
          { t: 'm', size: 'sm', tex: '-g(x)=\\sin\\!\\Big(\\frac{2\\pi}3-x\\Big)' },
          folded('f1')] },
      { ask: { type: 'choice', q: '$0\\le x\\le\\frac{2\\pi}3$ での円板の半径 $\\max\\{\\sin x,\\ -g(x)\\}$ は？',
        opts: ['いつも $\\sin x$', '$x=\\frac\\pi3$ を境に入れかわる', 'いつも $-g(x)$', '$x=\\frac\\pi2$ を境に入れかわる'], ok: 1,
        why: { 0: '$x=0$ では $\\sin0=0$ ですが $-g(0)=\\sin\\frac{2\\pi}3=\\frac{\\sqrt3}2$。下の曲線のほうが遠い所があります。', 2: '$x=\\frac{2\\pi}3$ では $-g=0$、$\\sin x=\\frac{\\sqrt3}2$。', 3: '$\\sin x$ と $\\sin(\\frac{2\\pi}3-x)$ が等しいのは $x=\\frac\\pi3$ です。' },
        good: '$\\sin x\\ge\\sin(\\frac{2\\pi}3-x)\\iff x\\ge\\frac\\pi3$（$0\\le x\\le\\frac{2\\pi}3$）。緑の上のふちが $x=\\frac\\pi3$ で入れかわります。',
        draw: [{ fig: 'f1', items: [{ k: 'line', x: PI / 3, dash: true, c: 'y' }, { k: 'pt', at: [PI / 3, Math.sqrt(3) / 2], c: 'y' }] }] } },
      { ask: { type: 'choice', q: '緑の図形（回転させる部分）は、どの直線について対称？',
        opts: ['$x=\\dfrac\\pi2$', '$x=\\dfrac\\pi6$', '$x=\\dfrac{2\\pi}3$', '$x=\\dfrac\\pi3$'], ok: 3,
        why: { 0: '$\\sin x$ だけなら $x=\\frac\\pi2$ で対称ですが、2曲線を合わせた図は別です。', 1: '区間 $-\\frac\\pi6\\le x\\le\\frac{5\\pi}6$ の真ん中は $\\frac\\pi3$ です。', 2: 'それは $g$ が 0 になる所です。' },
        good: '$x\\to\\frac{2\\pi}3-x$ とすると $f\\to-g$、$g\\to-f$。D は点 $(\\frac\\pi3,\\ 0)$ について点対称で、折り返すと $x=\\frac\\pi3$ で線対称になります。' } },
      { clear: true, cols: [1], part: '立式', say: '区間ごとに切り口の面積を書いて足すと、次の式です。$x=\\frac\\pi3$ についての対称性から、右半分の2倍にまとめられます。',
        add: [{ t: 'h', text: '体積の式' },
          { t: 'm', size: 'sm', tex: 'V=\\pi\\!\\int_{-\\pi/6}^{0}\\!(g^2-f^2)\\,dx+\\pi\\!\\int_{0}^{\\pi/3}\\!g^2\\,dx+\\pi\\!\\int_{\\pi/3}^{2\\pi/3}\\!f^2\\,dx+\\pi\\!\\int_{2\\pi/3}^{5\\pi/6}\\!(f^2-g^2)\\,dx' },
          { t: 'm', tex: '=2\\pi\\Big\\{\\int_{\\pi/3}^{2\\pi/3}\\sin^2x\\,dx+\\int_{2\\pi/3}^{5\\pi/6}\\Big(\\sin^2x-\\sin^2\\!\\Big(x-\\frac{2\\pi}3\\Big)\\Big)dx\\Big\\}', note: '← 対称性' }] },

      // ---------- 計算 ----------
      { clear: true, cols: [1], part: '計算', say: '1つ目の積分 $I_1$ は、半角の公式 $\\sin^2x=\\dfrac{1-\\cos2x}2$ で計算します。',
        add: [{ t: 'h', text: '積分の計算' },
          { t: 'm', tex: 'V=2\\pi\\,(I_1+I_2)', note: '前のページの2つの積分を\n$I_1,\\ I_2$ とおく' }] },
      { ask: { type: 'think', q: '$I_1=\\displaystyle\\int_{\\pi/3}^{2\\pi/3}\\sin^2x\\,dx$ を求めよう。',
        hint: '$\\Big[\\,\\frac x2-\\frac{\\sin2x}4\\,\\Big]_{\\pi/3}^{2\\pi/3}$。$\\sin\\frac{4\\pi}3=-\\frac{\\sqrt3}2$、$\\sin\\frac{2\\pi}3=\\frac{\\sqrt3}2$。',
        ans: '$I_1=\\dfrac\\pi6+\\dfrac{\\sqrt3}4$',
        after: '$\\frac12\\cdot\\frac\\pi3-\\frac14\\left(-\\frac{\\sqrt3}2-\\frac{\\sqrt3}2\\right)=\\frac\\pi6+\\frac{\\sqrt3}4$。',
        add: [{ t: 'm', tex: 'I_1=\\Big[\\,\\frac x2-\\frac{\\sin2x}4\\,\\Big]_{\\pi/3}^{2\\pi/3}=\\frac\\pi6+\\frac{\\sqrt3}4' }] } },
      { say: '2つ目は、$\\sin^2A-\\sin^2B=\\sin(A+B)\\sin(A-B)$ を使うと1項になります。$A+B=2x-\\frac{2\\pi}3$、$A-B=\\frac{2\\pi}3$ です。',
        add: [{ t: 'm', tex: '\\sin^2x-\\sin^2\\!\\Big(x-\\frac{2\\pi}3\\Big)=\\frac{\\sqrt3}2\\sin\\!\\Big(2x-\\frac{2\\pi}3\\Big)' }] },
      { ask: { type: 'choice', q: '$I_2=\\displaystyle\\int_{2\\pi/3}^{5\\pi/6}\\frac{\\sqrt3}2\\sin\\!\\Big(2x-\\frac{2\\pi}3\\Big)dx$ は？',
        opts: ['$\\dfrac{\\sqrt3}8$', '$\\dfrac{\\sqrt3}4$', '$-\\dfrac{\\sqrt3}8$', '$\\dfrac{3\\sqrt3}8$'], ok: 0,
        why: { 1: '$\\sin(2x+\\cdots)$ の原始関数は $-\\frac12\\cos(2x+\\cdots)$。$\\frac12$ を忘れています。', 2: '$[-\\cos u]_{2\\pi/3}^{\\pi}=1-\\frac12=\\frac12>0$。符号に注意。', 3: '$\\cos\\frac{2\\pi}3=-\\frac12$ の符号をまちがえて、$1+\\frac12$ にしています。' },
        good: '$\\frac{\\sqrt3}2\\cdot\\frac12\\Big[-\\cos\\big(2x-\\frac{2\\pi}3\\big)\\Big]_{2\\pi/3}^{5\\pi/6}=\\frac{\\sqrt3}4\\left(1-\\frac12\\right)=\\frac{\\sqrt3}8$。',
        add: [{ t: 'm', tex: 'I_2=\\frac{\\sqrt3}4\\Big[-\\cos\\Big(2x-\\frac{2\\pi}3\\Big)\\Big]_{2\\pi/3}^{5\\pi/6}=\\frac{\\sqrt3}8' }] } },
      { say: 'あわせて $V=2\\pi\\left(\\frac\\pi6+\\frac{\\sqrt3}4+\\frac{\\sqrt3}8\\right)$。数値では約 7.37 です（数値積分とも一致）。',
        add: [{ t: 'ans', label: '答', tex: 'V=2\\pi\\left(\\frac\\pi6+\\frac{3\\sqrt3}8\\right)=\\frac{\\pi^2}3+\\frac{3\\sqrt3}4\\pi' }] },

      // ---------- ふりかえり ----------
      { clear: true, cols: [0.45, 0.55], part: 'ふりかえり', say: '最初の「0 になる式」とくらべると、ちがいは $x$ 軸をまたぐ $0\\le x\\le\\frac{2\\pi}3$ の部分。ここを円板として数えたことで、正しい体積になりました。',
        add: [{ t: 'h', text: 'ふりかえり' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・D が $x$ 軸をまたぐことを図で示す\n・区間を分け、各区間の切り口（円板／ドーナツ）を書く\n・対称性を使うなら、その理由（$x\\to\\frac{2\\pi}3-x$）を書く' },
          folded('f2', [{ k: 'line', x: PI / 3, dash: true, c: 'y' }, { k: 'label', at: [PI / 3, 1.13], text: '対称の軸', c: 'y', size: 20, dx: 50, plain: true }])] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。回転体では「回す前に、$x$ 軸の下を折り返して図をかく」習慣が、いちばんの武器になります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
