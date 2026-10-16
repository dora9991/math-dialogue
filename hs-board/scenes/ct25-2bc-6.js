/* 共通テスト型 数学Ⅱ，B，C：2025年度 第6問（数学C ベクトル・空間）の類題（自作問題。元の問題文・数値・点は使っていない）
   ねらい：球面上の3点が正三角形になる条件を、内積と座標で調べる（会話・選択肢の多い形）
   答え（python3・sympy で検算ずみ）：S：中心 O・半径 3 の球面
   (1) AB²=|b−a|²=18−2a·b → ア ③。正三角形 ⇔ a·b=b·c=c·a → イ ⓪（①②は十分条件にすぎない、③は不十分）
   (2) A(3,0,0)、B(3/2, 3√3/2, 0)：a·b=9/2。c·a=3p=9/2 → p=3/2、c·b=9/4+(3√3/2)q=9/2 → q=√3/2、r²=9−9/4−3/4=6 → r=±√6
       → ウ/エ=3/2、√オ/カ=√3/2、キ 6。OA=OB=OC=AB=BC=CA=3 → 正四面体 → ク ⓪
   (3) B(3cosθ, 3sinθ, 0)：AB=6sin(θ/2)。外接円の半径 AB/√3 ≦ 3 ⇔ AB≦3√3 ⇔ θ≦2π/3 → ケ ②。最大 3√3 → コ 3、サ 3
       （座標でも 9−(p²+q²)=9(1−c)(2c+1)/(1+c)≧0 ⇔ cosθ≧−1/2 で一致） */
(function () {
  const d2r = Math.PI / 180, ph = 25 * d2r, el = 18 * d2r;
  const RR = [-Math.sin(ph), Math.cos(ph), 0], UU = [-Math.sin(el) * Math.cos(ph), -Math.sin(el) * Math.sin(ph), Math.cos(el)];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const po = p => [dot(RR, p), dot(UU, p)];
  const r3 = Math.sqrt(3), r6 = Math.sqrt(6);
  const eqFront = [], eqBack = [];
  for (let t = -65; t <= 115; t += 3) eqFront.push(po([3 * Math.cos(t * d2r), 3 * Math.sin(t * d2r), 0]));
  for (let t = 115; t <= 295; t += 3) eqBack.push(po([3 * Math.cos(t * d2r), 3 * Math.sin(t * d2r), 0]));
  const O3 = [0, 0, 0];
  const sphere = () => [
    { k: 'circle', o: [0, 0], r: 3, c: 'w', wd: 2.5 },
    { k: 'poly', pts: eqBack, c: 'd', dash: true, wd: 2 }, { k: 'poly', pts: eqFront, c: 'd', wd: 2 },
    { k: 'seg', a: po(O3), b: po([4.6, 0, 0]), c: 'd', wd: 1.5, arrow: true }, { k: 'label', at: po([4.6, 0, 0]), text: 'x', dx: -14, dy: 8, c: 'd', size: 22 },
    { k: 'seg', a: po(O3), b: po([0, 4.1, 0]), c: 'd', wd: 1.5, arrow: true }, { k: 'label', at: po([0, 4.1, 0]), text: 'y', dx: 6, dy: -16, c: 'd', size: 22 },
    { k: 'seg', a: po(O3), b: po([0, 0, 3.9]), c: 'd', wd: 1.5, arrow: true }, { k: 'label', at: po([0, 0, 3.9]), text: 'z', dx: 16, c: 'd', size: 22 },
    { k: 'pt', at: po(O3), name: 'O', dir: 'w', c: 'w', r: 4, size: 24 }];
  const fig3 = (id, items, w) => ({ t: 'fig', id, col: 1, view: [-4, -4, 4, 4], w: w || 500, h: w || 500, items: sphere().concat(items) });
  const A2 = [3, 0, 0], B2 = [1.5, 1.5 * r3, 0], C2 = [1.5, r3 / 2, r6], C2b = [1.5, r3 / 2, -r6];
  const ptA = { k: 'pt', at: po(A2), name: 'A', dir: 'sw', c: 'y' }, ptB = { k: 'pt', at: po(B2), name: 'B', dir: 'e', c: 'y' };
  const OAOB = [{ k: 'seg', a: po(O3), b: po(A2), c: 'y', dash: true }, { k: 'seg', a: po(O3), b: po(B2), c: 'y', dash: true }, { k: 'seg', a: po(A2), b: po(B2), c: 'y' }, ptA, ptB];
  const A3 = [3, 0, 0], B3 = [-1.5, 1.5 * r3, 0], C3 = [-1.5, -1.5 * r3, 0];
  const POINTS = [
    '球面（中心 O、半径 $r$）上の2点では　$\\mathrm{AB}^2=2r^2-2\\,\\vec a\\cdot\\vec b$。**長さの条件は内積の条件** に言いかえられる',
    '正三角形 ⇔ $\\vec a\\cdot\\vec b=\\vec b\\cdot\\vec c=\\vec c\\cdot\\vec a$（必要十分）。「$=0$」「$\\vec a+\\vec b+\\vec c=\\vec 0$」は特別な場合だけ',
    '球面を平面で切った切り口は円で、半径は $r$ 以下。正三角形の1辺は外接円の半径の $\\sqrt3$ 倍なので、1辺は $\\sqrt3\\,r$ 以下（大円に内接するとき最大）'
  ];

  HB.lesson({
    id: 'ct25-2bc-6', field: '共通テスト型　数学Ⅱ，B，C', title: '2025 共通テスト 数学Ⅱ，B，C 第6問の類題 ― 球面上の正三角形と内積',
    level: '2025年度 第6問の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '座標空間において、原点 O を中心とする半径 3 の球面を $S$ とする。$S$ 上の異なる3点 A, B, C が正三角形の頂点になる条件について、太郎さんと花子さんが話している。',
      parts: [
        '(1)　太郎：A, B が $S$ 上にあるとき、$|\\overrightarrow{\\mathrm{OA}}|=|\\overrightarrow{\\mathrm{OB}}|=3$ だから、$\\mathrm{AB}^2$ は内積 $\\overrightarrow{\\mathrm{OA}}\\cdot\\overrightarrow{\\mathrm{OB}}$ だけで表せるね。\n$\\mathrm{AB}^2=\\boxed{\\text{ア}}$ である。よって、$S$ 上の3点 A, B, C について、$\\triangle\\mathrm{ABC}$ が正三角形であることは、$\\boxed{\\text{イ}}$ と同値である。\n　ア の解答群（$k=\\overrightarrow{\\mathrm{OA}}\\cdot\\overrightarrow{\\mathrm{OB}}$）　⓪ $9-k$　① $9-2k$　② $18-k$　③ $18-2k$　④ $18+2k$　⑤ $2k$\n　イ の解答群\n　⓪ $\\overrightarrow{\\mathrm{OA}}\\cdot\\overrightarrow{\\mathrm{OB}}=\\overrightarrow{\\mathrm{OB}}\\cdot\\overrightarrow{\\mathrm{OC}}=\\overrightarrow{\\mathrm{OC}}\\cdot\\overrightarrow{\\mathrm{OA}}$\n　① $\\overrightarrow{\\mathrm{OA}}\\cdot\\overrightarrow{\\mathrm{OB}}=\\overrightarrow{\\mathrm{OB}}\\cdot\\overrightarrow{\\mathrm{OC}}=\\overrightarrow{\\mathrm{OC}}\\cdot\\overrightarrow{\\mathrm{OA}}=0$\n　② $\\overrightarrow{\\mathrm{OA}}+\\overrightarrow{\\mathrm{OB}}+\\overrightarrow{\\mathrm{OC}}=\\vec 0$\n　③ $\\overrightarrow{\\mathrm{OA}}\\cdot\\overrightarrow{\\mathrm{OB}}+\\overrightarrow{\\mathrm{OB}}\\cdot\\overrightarrow{\\mathrm{OC}}+\\overrightarrow{\\mathrm{OC}}\\cdot\\overrightarrow{\\mathrm{OA}}=0$',
        '(2)　A$(3,\\,0,\\,0)$、B$\\left(\\dfrac32,\\ \\dfrac{3\\sqrt3}{2},\\ 0\\right)$ とする。$S$ 上の点 C$(p,\\,q,\\,r)$ で $\\triangle\\mathrm{ABC}$ が正三角形となるものは\n　　$p=\\dfrac{\\boxed{\\text{ウ}}}{\\boxed{\\text{エ}}},\\quad q=\\dfrac{\\sqrt{\\boxed{\\text{オ}}}}{\\boxed{\\text{カ}}},\\quad r=\\pm\\sqrt{\\boxed{\\text{キ}}}$\nである。このとき、四面体 OABC は $\\boxed{\\text{ク}}$。\n　ク の解答群　⓪ 正四面体である　① 3つの面が直角二等辺三角形である　② 体積が 0 である　③ OA, OB, OC がたがいに垂直である',
        '(3)　$0<\\theta<\\pi$ とし、A$(3,\\,0,\\,0)$、B$(3\\cos\\theta,\\ 3\\sin\\theta,\\ 0)$ とする。\n花子：正三角形 ABC の外接円は、球面 $S$ を平面 ABC で切った切り口の円だよね。その半径は 3 以下だから……。\n$S$ 上に点 C があって $\\triangle\\mathrm{ABC}$ が正三角形となるような $\\theta$ の値の範囲は $\\boxed{\\text{ケ}}$ である。また、$S$ 上の3点を頂点とする正三角形の1辺の長さの最大値は $\\boxed{\\text{コ}}\\sqrt{\\boxed{\\text{サ}}}$ である。\n　ケ の解答群　⓪ $0<\\theta\\leqq\\dfrac{\\pi}{3}$　① $0<\\theta\\leqq\\dfrac{\\pi}{2}$　② $0<\\theta\\leqq\\dfrac{2}{3}\\pi$　③ $0<\\theta\\leqq\\dfrac{5}{6}\\pi$　④ $\\dfrac{\\pi}{3}\\leqq\\theta<\\pi$　⑤ $0<\\theta<\\pi$'
      ],
      src: '※ 2025年度 共通テスト 数学Ⅱ，B，C 第6問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: '問題', say: '共通テスト 第6問（空間ベクトル）の類題です。球面上の3点が正三角形になる条件を、内積と座標で調べます。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'h', text: 'この大問の流れ' },
          { t: 'p', size: 'sm', text: '(1)　長さ AB を内積で表す → 正三角形の条件\n(2)　A, B を決めて、C の座標を求める\n(3)　正三角形が作れる範囲と、1辺の最大値' },
          { t: 'box', c: 'g', size: 'sm', label: '共通テストのコツ', text: '選択肢が多い大問。**同値か（必要十分か）** を問う選択肢は、「特別な場合だけ成り立つもの」をわなとして混ぜてきます。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\vec a=\\overrightarrow{\\mathrm{OA}}$ などとおきます。$|\\vec a|=|\\vec b|=3$ なので、$\\mathrm{AB}^2=|\\vec b-\\vec a|^2$ を展開すると、内積だけが残ります。',
        add: [{ t: 'h', text: '(1)　AB² を内積で表す' },
          { t: 'p', size: 'sm', text: '$\\vec a=\\overrightarrow{\\mathrm{OA}},\\ \\vec b=\\overrightarrow{\\mathrm{OB}},\\ \\vec c=\\overrightarrow{\\mathrm{OC}}$、$|\\vec a|=|\\vec b|=|\\vec c|=3$' },
          { t: 'm', tex: '\\mathrm{AB}^2=|\\vec b-\\vec a|^2=|\\vec b|^2-2\\,\\vec a\\cdot\\vec b+|\\vec a|^2' },
          fig3('s1', OAOB, 480)] },
      { ask: { type: 'choice', q: '$\\mathrm{AB}^2$ を $k=\\vec a\\cdot\\vec b$ で表すと？（ア）',
        opts: ['⓪ $9-k$', '① $9-2k$', '③ $18-2k$', '④ $18+2k$'], ok: 2,
        why: { 0: '$|\\vec a|^2+|\\vec b|^2=9+9=18$。9 は片方だけです。', 1: '$|\\vec a|^2$ と $|\\vec b|^2$ の両方を足して 18 です。', 3: '$|\\vec b-\\vec a|^2$ の真ん中の項は $-2\\,\\vec a\\cdot\\vec b$。符号が逆です。' },
        good: '$\\mathrm{AB}^2=9-2k+9=18-2k$。内積が大きいほど（角 AOB が小さいほど）AB は短くなります。',
        add: [{ t: 'm', tex: '\\mathrm{AB}^2=18-2\\,\\vec a\\cdot\\vec b' }] } },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{ABC}$ が正三角形であることと **同値** なのは？（イ）',
        opts: ['⓪ 内積 $\\vec a\\cdot\\vec b,\\ \\vec b\\cdot\\vec c,\\ \\vec c\\cdot\\vec a$ が等しい', '① 3つの内積がすべて 0', '② $\\vec a+\\vec b+\\vec c=\\vec 0$', '③ 3つの内積の和が 0'], ok: 0,
        why: { 1: 'すべて 0 なら正三角形になりますが、それは OA, OB, OC がたがいに垂直な特別な場合だけ。逆は成り立ちません。', 2: 'これも正三角形になる特別な場合（O が三角形の重心）。正三角形でも成り立たないことがあります。', 3: '内積の和だけでは、3辺の長さが等しいとは言えません。' },
        good: '3辺の2乗が $18-2\\,\\vec a\\cdot\\vec b$ などなので、「3辺が等しい ⇔ 3つの内積が等しい」。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '正三角形の条件', text: '$\\mathrm{AB}=\\mathrm{BC}=\\mathrm{CA}\\iff\\vec a\\cdot\\vec b=\\vec b\\cdot\\vec c=\\vec c\\cdot\\vec a$' },
          { t: 'ans', label: '(1) 答', text: 'ア ③　イ ⓪' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。A$(3,0,0)$、B$\\left(\\frac32,\\frac{3\\sqrt3}{2},0\\right)$ の内積は $\\vec a\\cdot\\vec b=3\\cdot\\frac32=\\frac92$。C も、$\\vec c\\cdot\\vec a=\\vec c\\cdot\\vec b=\\frac92$ をみたせばよいのです。',
        add: [{ t: 'h', text: '(2)　点 C の座標' },
          { t: 'm', size: 'sm', tex: '\\vec a\\cdot\\vec b=\\frac92\\quad\\to\\quad \\vec c\\cdot\\vec a=\\frac92,\\ \\ \\vec c\\cdot\\vec b=\\frac92' },
          fig3('s2', OAOB, 480)] },
      { say: '$\\vec c=(p,\\,q,\\,r)$ とします。$\\vec c\\cdot\\vec a=3p=\\dfrac92$ から、すぐに $p=\\dfrac32$。',
        add: [{ t: 'm', size: 'sm', tex: '3p=\\frac92\\quad\\therefore\\ p=\\frac32' }] },
      { ask: { type: 'choice', q: '$\\vec c\\cdot\\vec b=\\dfrac32p+\\dfrac{3\\sqrt3}{2}q=\\dfrac92$ に $p=\\dfrac32$ を入れると、$q$ は？（オ・カ）',
        opts: ['$\\dfrac{3\\sqrt3}{2}$', '$\\sqrt3$', '$\\dfrac{\\sqrt3}{6}$', '$\\dfrac{\\sqrt3}{2}$'], ok: 3,
        why: { 0: 'それは B の $y$ 座標です。$\\frac94+\\frac{3\\sqrt3}{2}q=\\frac92$ を解きます。', 1: '$\\frac{3\\sqrt3}{2}q=\\frac94$ の両辺を $\\frac{3\\sqrt3}{2}$ で割ると、$q=\\frac{3}{2\\sqrt3}$ です。', 2: '$\\frac{3}{2\\sqrt3}$ の有理化で、分子に $\\sqrt3$ をかけると $\\frac{3\\sqrt3}{6}=\\frac{\\sqrt3}{2}$。' },
        good: '$\\dfrac{3\\sqrt3}{2}q=\\dfrac92-\\dfrac94=\\dfrac94$ より　$q=\\dfrac{3}{2\\sqrt3}=\\dfrac{\\sqrt3}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{3\\sqrt3}{2}q=\\frac94\\quad\\therefore\\ q=\\frac{\\sqrt3}{2}' }] } },
      { say: 'C は $S$ 上なので $p^2+q^2+r^2=9$。$r^2=9-\\frac94-\\frac34=6$ で、$r=\\pm\\sqrt6$。C は平面 OAB の上と下に1つずつあります。',
        add: [{ t: 'm', size: 'sm', tex: 'r^2=9-\\frac94-\\frac34=6\\quad\\therefore\\ r=\\pm\\sqrt6' }],
        draw: [{ fig: 's2', items: [
          { k: 'seg', a: po(A2), b: po(C2), c: 'p' }, { k: 'seg', a: po(B2), b: po(C2), c: 'p' }, { k: 'seg', a: po(O3), b: po(C2), c: 'p', dash: true },
          { k: 'pt', at: po(C2), name: 'C', dir: 'ne', c: 'p' },
          { k: 'seg', a: po(A2), b: po(C2b), c: 'p', dash: true }, { k: 'seg', a: po(B2), b: po(C2b), c: 'p', dash: true },
          { k: 'pt', at: po(C2b), name: 'C′', dir: 'se', c: 'p', open: true }] }] },
      { ask: { type: 'choice', q: 'このとき、四面体 OABC について正しいものは？（ク）',
        opts: ['③ OA, OB, OC がたがいに垂直', '⓪ 正四面体である', '① 3つの面が直角二等辺三角形', '② 体積が 0'], ok: 1,
        why: { 0: '$\\vec a\\cdot\\vec b=\\frac92\\neq0$ なので、OA と OB は垂直ではありません。', 2: '直角二等辺三角形になるのは、内積が 0 のとき。ここは $\\frac92$ です。', 3: '$r\\neq0$ なので C は平面 OAB 上になく、体積は 0 ではありません。' },
        good: 'OA＝OB＝OC＝3、$\\mathrm{AB}^2=18-2\\cdot\\frac92=9$ より AB＝BC＝CA＝3。6本の辺がすべて 3 の **正四面体** です。',
        add: [{ t: 'ans', label: '(2) 答', text: '$p=\\dfrac32,\\ q=\\dfrac{\\sqrt3}{2},\\ r=\\pm\\sqrt6$　ク ⓪' }] } },
      { ask: { type: 'think', q: 'C$\\left(\\dfrac32,\\ \\dfrac{\\sqrt3}{2},\\ \\sqrt6\\right)$ のとき、BC の長さを座標から計算して確かめよう。',
        hint: '$\\overrightarrow{\\mathrm{BC}}=\\left(0,\\ \\dfrac{\\sqrt3}{2}-\\dfrac{3\\sqrt3}{2},\\ \\sqrt6\\right)$',
        ans: '$\\mathrm{BC}^2=0+(-\\sqrt3)^2+(\\sqrt6)^2=3+6=9$ より $\\mathrm{BC}=3$',
        after: '内積で考えた結果と一致。共通テストでは、出した座標で長さを1つ確かめると安心です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。花子さんの考え方を使います。平面 ABC で球面を切った切り口は円で、それが △ABC の外接円。O から平面に下ろした垂線の足を H とすると、半径 $\\rho$ は 3 以下です。',
        add: [{ t: 'h', text: '(3)　正三角形が作れる範囲' },
          { t: 'm', size: 'sm', tex: '\\rho=\\sqrt{3^2-\\mathrm{OH}^2}\\leqq3' },
          { t: 'p', size: 'sm', text: '正三角形の1辺 ＝ 外接円の半径の $\\sqrt3$ 倍\n→ 1辺 $=\\sqrt3\\,\\rho\\leqq3\\sqrt3$' },
          { t: 'fig', id: 'cut', col: 1, view: [-3.7, -3.7, 3.7, 3.7], w: 440, h: 440, items: [
            { k: 'circle', o: [0, 0], r: 3, c: 'w', wd: 2.5 },
            { k: 'seg', a: [-3.4, 1.6], b: [3.4, 1.6], c: 'b', wd: 2 }, { k: 'label', at: [-3.4, 1.6], text: '平面ABC', dy: -20, anchor: 'start', c: 'b', size: 20, plain: true },
            { k: 'seg', a: [0, 0], b: [0, 1.6], c: 'd', dash: true }, { k: 'seg', a: [0, 0], b: [2.538, 1.6], c: 'y' },
            { k: 'seg', a: [0, 1.6], b: [2.538, 1.6], c: 'p', wd: 4 },
            { k: 'right', o: [0, 1.6], a: [0, 0], b: [2.538, 1.6] },
            { k: 'pt', at: [0, 0], name: 'O', dir: 's' }, { k: 'pt', at: [0, 1.6], name: 'H', dir: 'nw' }, { k: 'pt', at: [2.538, 1.6], name: 'A', dir: 'ne', c: 'y' },
            { k: 'label', at: [1.35, 0.55], text: '3', c: 'y', size: 24, dx: 10, dy: 10 }, { k: 'label', at: [1.27, 1.6], text: 'ρ', c: 'p', size: 26, dy: -22 }] }] },
      { ask: { type: 'choice', q: 'まず、AB の長さを $\\theta$ で表すと？',
        opts: ['$3\\sin\\dfrac{\\theta}{2}$', '$6\\sin\\theta$', '$6\\cos\\dfrac{\\theta}{2}$', '$6\\sin\\dfrac{\\theta}{2}$'], ok: 3,
        why: { 0: '二等辺三角形 OAB（OA＝OB＝3）を半分に切ると、AB の半分が $3\\sin\\frac{\\theta}{2}$。AB 全体はその 2 倍です。', 1: '$\\angle\\mathrm{AOB}=\\theta$ の半分の角を使います。$6\\sin\\theta$ は $\\theta=\\frac{\\pi}{2}$ 以外で合いません。', 2: '$\\theta$ が大きいほど AB は長くなるはず。$\\cos$ だと逆に短くなります。' },
        good: '$\\mathrm{AB}^2=18-18\\cos\\theta=36\\sin^2\\dfrac{\\theta}{2}$（半角の公式）より $\\mathrm{AB}=6\\sin\\dfrac{\\theta}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{AB}=6\\sin\\frac{\\theta}{2}\\leqq3\\sqrt3\\iff\\sin\\frac{\\theta}{2}\\leqq\\frac{\\sqrt3}{2}' }] } },
      { ask: { type: 'choice', q: '$0<\\theta<\\pi$ のとき、正三角形が作れる $\\theta$ の範囲は？（ケ）',
        opts: ['⓪ $0<\\theta\\leqq\\frac{\\pi}{3}$', '① $0<\\theta\\leqq\\frac{\\pi}{2}$', '② $0<\\theta\\leqq\\frac23\\pi$', '⑤ $0<\\theta<\\pi$'], ok: 2,
        why: { 0: '$\\sin\\frac{\\theta}{2}\\leqq\\frac{\\sqrt3}{2}$ の境目は $\\frac{\\theta}{2}=\\frac{\\pi}{3}$。$\\theta$ にすると 2 倍の $\\frac23\\pi$。', 1: '$\\theta=\\frac{\\pi}{2}$ をこえても、$\\frac23\\pi$ までは作れます（(2) の考え方で C が見つかる）。', 3: 'AB が長すぎると、外接円の半径が 3 をこえて球面に乗りません。' },
        good: '$0<\\dfrac{\\theta}{2}<\\dfrac{\\pi}{2}$ で $\\sin\\dfrac{\\theta}{2}\\leqq\\dfrac{\\sqrt3}{2}$ ⇔ $\\dfrac{\\theta}{2}\\leqq\\dfrac{\\pi}{3}$。よって $0<\\theta\\leqq\\dfrac23\\pi$。' } },
      { clear: true, say: '1辺が最大の $3\\sqrt3$ になるのは $\\theta=\\dfrac23\\pi$ のとき。このとき H＝O で、C は $\\left(-\\frac32,\\ -\\frac{3\\sqrt3}{2},\\ 0\\right)$。正三角形は **大円（赤道）に内接** します。',
        add: [{ t: 'h', text: '(3)　つづき：いちばん大きい正三角形' },
          { t: 'p', size: 'sm', text: '$\\theta=\\dfrac23\\pi$：A, B, C はすべて平面 $z=0$ 上\n$\\vec a+\\vec b+\\vec c=\\vec 0$（O が重心）、1辺 $=3\\sqrt3$' },
          { t: 'ans', label: '(3) 答', text: 'ケ ②　コ 3　サ 3' },
          fig3('s3', [{ k: 'poly', pts: [po(A3), po(B3), po(C3)], close: true, c: 'p', fill: 'p', alpha: 0.18 },
            { k: 'pt', at: po(A3), name: 'A', dir: 'sw', c: 'p' }, { k: 'pt', at: po(B3), name: 'B', dir: 'ne', c: 'p' }, { k: 'pt', at: po(C3), name: 'C', dir: 'w', c: 'p' }], 520)] },
      { ask: { type: 'think', q: '太郎さんの方法（座標）でも確かめよう。(2) と同じように $p,\\ q$ を求め、$r^2=9-p^2-q^2\\geqq0$ となる条件を $c=\\cos\\theta$ で表すと？',
        hint: '$p=3c$、$q=\\dfrac{3c(1-c)}{\\sin\\theta}$。$\\sin^2\\theta=(1-c)(1+c)$ を使う。',
        ans: '$r^2=\\dfrac{9(1-c)(2c+1)}{1+c}\\geqq0$ ⇔ $c\\geqq-\\dfrac12$ ⇔ $0<\\theta\\leqq\\dfrac23\\pi$',
        after: '計算でも同じ範囲。図形の見方（切り口の円の半径 ≦ 3）のほうが、ずっと速く答えにたどり着けます。' } },

      // ---------- 共通テストのコツ ----------
      { clear: true, cols: [1], part: 'コツ', say: '空間ベクトルの大問は、図がかきにくいぶん、「長さ → 内積」の言いかえと、会話文の「図形の見方」をセットで使うのが近道です。',
        add: [{ t: 'h', text: '共通テストで、この大問を解くときのコツ' },
          { t: 'box', c: 'b', size: 'sm', label: '読み方', text: '太郎さん（計算）と花子さん（図形）の2つの方針が出たら、**速いほう** を選んでよい。(3) は花子さんの方針が圧倒的に速い' },
          { t: 'box', c: 'p', size: 'sm', label: '選択肢の消し方', text: '「同値なもの」を選ぶ問題は、特別な例（内積が 0、重心が O）で成り立つだけの選択肢を消す' },
          { t: 'box', c: 'g', size: 'sm', label: '検算', text: '(2) の答えは、6本の辺の長さで確かめられる。(3) の境目 $\\theta=\\frac23\\pi$ は「大円に内接」の形をイメージする' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。球面上の点の問題は、長さを内積に、図形を切り口の円に言いかえると見通しがよくなります。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、時間を計ってもう一度ノートで解いてみましょう。' }
    ]
  });
})();
