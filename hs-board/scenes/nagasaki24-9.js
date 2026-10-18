/* 2024 長崎大 理系 第9問の類題（自作）：実数係数の4次方程式が α と α³ を解にもつ ― 共役・解と係数の関係・絶対値
   元の問題はうつしていない（「3次の項がなく定数項が具体的な実数係数の4次方程式が、ある複素数とその累乗をともに解にもつ。
   共役の性質 → 共役も解 → 解の和から純虚数 → 解の積から絶対値 → 複素数と係数を決める」というねらい・誘導の形だけを合わせ、
   累乗を 3 乗に、条件・数値をすべて自作した）。
   答え（python3・sympy で検算ずみ）：x⁴+px²+qx+81=0、α は実部・虚部が正で実部＞虚部（偏角 0<θ<π/4）
   (2) f(ᾱ)=conj f(α)=0（p,q 実数）、同様に ᾱ³ も解
   (3) 偏角 ±θ, ±3θ（0<3θ<3π/4）で4つは異なる → 4つの解のすべて。和=0 → Re(α+α³)=0、Im=r sinθ+r³ sin3θ>0 → 純虚数
   (4) 積 |α|²|α|⁶=|α|⁸=81 → |α|=√3
   (5) α=a+bi：a²+b²=3、a(1+a²−3b²)=0 → b²=1, a²=2 → α=√2+i、α³=−√2+5i、α+α³=6i
       (x²−2√2x+3)(x²+2√2x+27)=x⁴+22x²−48√2x+81 → p=22, q=−48√2（nroots で 4 解を確認）
   別の見方：極形式 √3cosθ+3√3cos3θ=0 → cos²θ=2/3 → α=√3(√6/3+√3/3 i)=√2+i */
(function () {
  const AL = '\u03b1';
  // 共役の記号（上の横線）は図の字では出ないので、名前の α の上に短い線をかく（s＝1 あたりの px、side＝名前の向き）
  const bar = (at, s, side, c) => { const x0 = side === 'e' ? 23 : -46, x1 = side === 'e' ? 38 : -31; return { k: 'seg', a: [at[0] + x0 / s, at[1] + 14 / s], b: [at[0] + x1 / s, at[1] + 14 / s], c, wd: 2.5 }; };
  // (3) の図（イメージ）：|α|=1.15、偏角 28°
  const r = 1.15, th = 28 * Math.PI / 180, a1 = [r * Math.cos(th), r * Math.sin(th)], a3 = [r ** 3 * Math.cos(3 * th), r ** 3 * Math.sin(3 * th)];
  const IMG = { t: 'fig', id: 'c1', col: 1, view: [-0.75, -1.85, 1.85, 1.85], w: 312, h: 444, items: [
    { k: 'axes', tx: [], ty: [], xl: '', yl: '虚軸' }, { k: 'label', at: [1.82, 0], text: '実軸', dy: 26, anchor: 'end', c: 'd', size: 20 },
    { k: 'line', m: 1, n: 0, a: 0, b: 1.8, c: 'd', wd: 2, dash: true }, { k: 'line', m: -1, n: 0, a: 0, b: 1.8, c: 'd', wd: 2, dash: true },
    { k: 'label', at: [1.62, 1.75], text: 'π/4', c: 'd', size: 18 },
    { k: 'seg', a: [0, 0], b: a1, c: 'y', wd: 2 }, { k: 'seg', a: [0, 0], b: a3, c: 'p', wd: 2 },
    { k: 'seg', a: [0, 0], b: [a1[0], -a1[1]], c: 'y', wd: 2, dash: true }, { k: 'seg', a: [0, 0], b: [a3[0], -a3[1]], c: 'p', wd: 2, dash: true },
    { k: 'angle', o: [0, 0], a: [1, 0], b: a1, rp: 52, label: 'θ', c: 'y' },
    { k: 'angle', o: [0, 0], a: [1, 0], b: a3, rp: 30, label: '3θ', lr: 26, c: 'p' },
    { k: 'pt', at: a1, name: AL, dir: 'e', c: 'y' }, { k: 'pt', at: [a1[0], -a1[1]], name: AL, dir: 'e', c: 'y' }, bar([a1[0], -a1[1]], 120, 'e', 'y'),
    { k: 'pt', at: a3, name: AL + '³', dir: 'e', c: 'p' }, { k: 'pt', at: [a3[0], -a3[1]], name: AL + '³', dir: 'e', c: 'p' }, bar([a3[0], -a3[1]], 120, 'e', 'p')] };
  // (5) の図：実際の 4 つの解
  const s2 = Math.SQRT2;
  const ROOTS = { t: 'fig', id: 'c2', col: 1, view: [-2.3, -5.7, 3.9, 5.7], w: 256, h: 470, items: [
    { k: 'axes', tx: [], ty: [[1, 'i'], [3, '3i'], [5, '5i']], xl: '', yl: '虚軸' }, { k: 'label', at: [3.85, 0], text: '実軸', dy: 24, anchor: 'end', c: 'd', size: 20 },
    { k: 'seg', a: [s2, 1], b: [-s2, 5], c: 'g', wd: 2, dash: true },
    { k: 'pt', at: [0, 3], c: 'g', r: 5 },
    { k: 'pt', at: [s2, 1], name: AL, dir: 'e', c: 'y' }, { k: 'pt', at: [s2, -1], name: AL, dir: 'e', c: 'y' }, bar([s2, -1], 256 / 6.2, 'e', 'y'),
    { k: 'pt', at: [-s2, 5], name: AL + '³', dir: 'w', c: 'p' }, { k: 'pt', at: [-s2, -5], name: AL + '³', dir: 'w', c: 'p' }, bar([-s2, -5], 256 / 6.2, 'w', 'p')] };
  const POINTS = [
    '実数係数なら $\\overline{f(\\alpha)}=f(\\overline{\\alpha})$。$\\alpha$ が解なら $\\overline{\\alpha}$ も解（$\\overline{p}=p$ を使う所を答案に書く）',
    '解と係数の関係を使う前に、4つの解が互いに異なることを確かめる（偏角 $\\pm\\theta,\\ \\pm3\\theta$）。和 $=0$ から $\\alpha+\\alpha^3$ の実部 $=0$',
    '積 $=81$ から $|\\alpha|^8=81$。$\\alpha=a+bi$ とおいて連立（または極形式と3倍角）で α を決め、2次式2つの積で係数を出す'
  ];

  HB.lesson({
    id: 'nagasaki24-9', field: '長崎大型　数学（理系）', title: '2024 長崎大 理系 第9問の類題 ― α と α³ を解にもつ4次方程式', level: '2024年度 長崎大学 理系 第9問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$p,\\ q$ を実数とし，$x$ の 4 次方程式 $x^4+px^2+qx+81=0$ ……(＊) を考える。(＊) は，実部と虚部がともに正で，実部が虚部より大きい複素数 $\\alpha$ と，その 3 乗 $\\alpha^3$ を，ともに解にもつとする。複素数 $z$ と共役な複素数を $\\overline{z}$ で表す。',
      parts: [
        '(1)　複素数 $z,\\ w$ について，$\\overline{z+w}=\\overline{z}+\\overline{w}$，$\\overline{zw}=\\overline{z}\\,\\overline{w}$ が成り立つことを示せ。',
        '(2)　$\\overline{\\alpha}$ も (＊) の解であることを示せ。',
        '(3)　$\\alpha+\\alpha^3$ は純虚数であることを示せ。',
        '(4)　$|\\alpha|$ を求めよ。',
        '(5)　$\\alpha$ を求めよ。また，(＊) の 4 つの解と，$p,\\ q$ の値を求めよ。'
      ],
      src: '※ 2024年度 長崎大学 前期 理系（医学部医学科）第9問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', cols: [1], say: '複素数を解にもつ4次方程式の問題です。(1)〜(3) は証明、(4)(5) は求値。前の小問の結果を順に使う誘導になっています。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.55' }] },

      // ---------- 読みかえと方針 ----------
      { clear: true, cols: [1], part: '方針', say: '読みかえます。実数係数の方程式では、解の共役も解。だから α、α³ から $\\overline{\\alpha}$、$\\overline{\\alpha}^{\\,3}$ も解になり、4つの解がそろいます。あとは解と係数の関係です。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'y', label: '4つの解', text: '$\\alpha,\\quad \\overline{\\alpha},\\quad \\alpha^3,\\quad \\overline{\\alpha}^{\\,3}$　（(2) で示す）' },
          { t: 'box', c: 'b', label: '解と係数の関係', text: '$x^3$ の項がない → 4つの解の和 $=0$　…(3) へ\n定数項が 81 → 4つの解の積 $=81$　…(4) へ' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$z=a+bi,\\ w=c+di$（$a,\\ b,\\ c,\\ d$ は実数）とおいて、両辺を計算して比べます。和はすぐなので、積を見ます。',
        add: [{ t: 'h', text: '(1)　共役の性質' },
          { t: 'm', tex: 'zw=(ac-bd)+(ad+bc)i' },
          { t: 'm', tex: '\\overline{zw}=(ac-bd)-(ad+bc)i' },
          { t: 'm', tex: '\\overline{z}\\,\\overline{w}=(a-bi)(c-di)=(ac-bd)-(ad+bc)i' }] },
      { say: '一致しました。和も $\\overline{z+w}=(a+c)-(b+d)i=\\overline{z}+\\overline{w}$。積の性質をくり返すと $\\overline{z^n}=\\overline{z}^{\\,n}$ もいえます。',
        add: [{ t: 'ans', label: '(1)', text: '$\\overline{z+w}=\\overline{z}+\\overline{w}$，$\\overline{zw}=\\overline{z}\\,\\overline{w}$\nくり返して　$\\overline{z^n}=\\overline{z}^{\\,n}$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f(x)=x^4+px^2+qx+81$ とおくと $f(\\alpha)=0$。この両辺の共役をとって、(1) を使います。',
        add: [{ t: 'h', text: '(2)　共役も解' },
          { t: 'm', tex: 'f(\\alpha)=\\alpha^4+p\\alpha^2+q\\alpha+81=0' }] },
      { ask: { type: 'choice', q: '$\\overline{f(\\alpha)}=f(\\overline{\\alpha})$ を導くとき、「$p,\\ q$ が実数」を使うのはどこ？',
        opts: ['$\\overline{\\alpha^4}=\\overline{\\alpha}^{\\,4}$ のところ', '$\\overline{81}=81$ のところ', '$\\overline{p\\alpha^2}=p\\,\\overline{\\alpha}^{\\,2}$ のところ', 'どこにも使わない'], ok: 2,
        why: { 0: 'それは (1) の積の性質だけで言えます。', 1: '81 は与えられた実数。係数 $p,\\ q$ とは別の話です。', 3: '係数が虚数だと $\\overline{p}\\neq p$ となり、成り立ちません。' },
        good: '$\\overline{p\\alpha^2}=\\overline{p}\\,\\overline{\\alpha}^{\\,2}$ で、$p$ が実数だから $\\overline{p}=p$。$q$ も同じ。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}0=\\overline{f(\\alpha)}&=\\overline{\\alpha}^{\\,4}+\\overline{p}\\,\\overline{\\alpha}^{\\,2}+\\overline{q}\\,\\overline{\\alpha}+81\\\\ &=\\overline{\\alpha}^{\\,4}+p\\,\\overline{\\alpha}^{\\,2}+q\\,\\overline{\\alpha}+81=f(\\overline{\\alpha})\\end{aligned}' }] } },
      { say: 'よって $\\overline{\\alpha}$ も解。同じことを解 $\\alpha^3$ に使うと、$\\overline{\\alpha^3}=\\overline{\\alpha}^{\\,3}$ も解です。',
        add: [{ t: 'ans', label: '(2)', text: '$f(\\overline{\\alpha})=\\overline{f(\\alpha)}=\\overline{0}=0$ より、$\\overline{\\alpha}$ も (＊) の解\n同様に、$\\overline{\\alpha}^{\\,3}$ も (＊) の解' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。4つの解を「(＊) の解のすべて」として解と係数の関係に使うには、**4つが互いに異なる** ことを確かめる必要があります（重なると数え方が変わる）。',
        add: [{ t: 'h', text: '(3)　α＋α³ は純虚数' },
          { t: 'p', size: 'sm', text: '右の図はイメージ（|α| と θ は仮の値）' }, IMG] },
      { ask: { type: 'choice', q: '4つが互いに異なることを言うのに、決め手になる条件は？',
        opts: ['$p,\\ q$ が実数', '定数項が 81', '実部が虚部より大きい', '$x^3$ の項がない'], ok: 2,
        why: { 0: 'それは (2)（共役も解）で使いました。', 1: '81 は (4) で $|\\alpha|$ を出すのに使います。', 3: 'それはこのあと、解の和に使います。' },
        good: '偏角 θ は $0<\\theta<\\frac{\\pi}{4}$。4つの偏角 $\\pm\\theta,\\ \\pm3\\theta$ は $-\\frac{3\\pi}{4}$ から $\\frac{3\\pi}{4}$ の間で、みな異なります。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '偏角で比べる', text: '$\\alpha=r(\\cos\\theta+i\\sin\\theta)$，$0<\\theta<\\frac{\\pi}{4}$\n偏角は $\\theta,\\ -\\theta,\\ 3\\theta,\\ -3\\theta$（$0<3\\theta<\\frac{3\\pi}{4}$）\n→ 4つはすべて異なる' }] } },
      { say: 'もし $\\theta=\\frac{\\pi}{3}$ なら $\\alpha^3$ は実数で、$\\alpha^3=\\overline{\\alpha}^{\\,3}$ と重なってしまいます。「実部が虚部より大きい」は、それを防ぐ条件です。' },
      { ask: { type: 'choice', q: '解と係数の関係より、4つの解の和は？',
        opts: ['$0$', '$p$', '$81$', '$-q$'], ok: 0,
        why: { 1: '$p$ は「2つずつの積の和」。和は $x^3$ の係数で決まります。', 2: '81 は4つの解の積です。', 3: '$-q$ は「3つずつの積の和」です。' },
        good: '和 $=-(x^3\\text{ の係数})=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\alpha+\\overline{\\alpha}+\\alpha^3+\\overline{\\alpha}^{\\,3}=0' }] } },
      { clear: true, cols: [1], say: '$\\beta=\\alpha+\\alpha^3$ とおくと、和の式は $\\beta+\\overline{\\beta}=0$。つまり β の実部が 0。さらに虚部は正なので $\\beta\\neq0$。だから純虚数です。',
        add: [{ t: 'h', text: '(3)　答案' },
          { t: 'ans', label: '(3)', text: '$\\alpha=r(\\cos\\theta+i\\sin\\theta)$（$r>0$、$0<\\theta<\\frac{\\pi}{4}$）とおく。4つの解 $\\alpha,\\ \\overline{\\alpha},\\ \\alpha^3,\\ \\overline{\\alpha}^{\\,3}$ の偏角は\n$\\theta,\\ -\\theta,\\ 3\\theta,\\ -3\\theta$ で、$0<3\\theta<\\frac{3\\pi}{4}$ よりすべて異なるから、これらが (＊) の解のすべてである。\n$x^3$ の係数が 0 なので、解と係数の関係より $\\alpha+\\overline{\\alpha}+\\alpha^3+\\overline{\\alpha}^{\\,3}=0$。\n$\\beta=\\alpha+\\alpha^3$ とおくと $\\beta+\\overline{\\beta}=0$ なので、β の実部は 0。\nまた β の虚部は $r\\sin\\theta+r^3\\sin3\\theta>0$（$0<3\\theta<\\pi$）。よって β は純虚数である。' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。4つの解の積は、定数項の 81。$\\alpha\\overline{\\alpha}=|\\alpha|^2$ を使ってまとめます。',
        add: [{ t: 'h', text: '(4)　|α| を求める' },
          { t: 'm', tex: '\\alpha\\cdot\\overline{\\alpha}\\cdot\\alpha^3\\cdot\\overline{\\alpha}^{\\,3}=|\\alpha|^2\\cdot|\\alpha|^6=|\\alpha|^8' },
          { t: 'm', tex: '|\\alpha|^8=81', note: '解の積 ＝ 定数項' }] },
      { ask: { type: 'choice', q: '$|\\alpha|$ は？',
        opts: ['$3$', '$\\sqrt3$', '$\\sqrt[3]{9}$', '$\\sqrt[4]{3}$'], ok: 1,
        why: { 0: '$|\\alpha|^4=81$ としています。積は $|\\alpha|^2\\cdot|\\alpha|^6=|\\alpha|^8$。', 2: '$|\\alpha|^6=81$ としています。$\\alpha\\overline{\\alpha}$ の $|\\alpha|^2$ も入ります。', 3: '$81=3^4$ なので $|\\alpha|^8=3^4$、$|\\alpha|^2=3$ です。' },
        good: '$|\\alpha|^8=81=3^4$、$|\\alpha|>0$ より $|\\alpha|^2=3$、$|\\alpha|=\\sqrt3$。',
        add: [{ t: 'ans', label: '(4) 答', tex: '|\\alpha|=\\sqrt3' }] } },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。$\\alpha=a+bi$（$a>b>0$）とおきます。(4) から $a^2+b^2=3$。(3) から $\\alpha+\\alpha^3$ の実部が 0。まず $\\alpha^3$ の実部を出します。',
        add: [{ t: 'h', text: '(5)　α を決める' },
          { t: 'm', tex: '\\alpha=a+bi\\quad(a>b>0)' },
          { t: 'm', tex: 'a^2+b^2=3', note: '…① (4) より' }] },
      { ask: { type: 'choice', q: '$\\alpha^3=(a+bi)^3$ の実部は？',
        opts: ['$a^3-b^3$', '$a^3+3ab^2$', '$a^3-3a^2b$', '$a^3-3ab^2$'], ok: 3,
        why: { 0: '$(a+bi)^3$ は $a^3+(bi)^3$ ではありません。展開すると4つの項です。', 1: '$3a(bi)^2=3ab^2i^2=-3ab^2$。$i^2=-1$ を忘れています。', 2: '$3a^2(bi)$ は虚部の項です。' },
        good: '$(a+bi)^3=a^3+3a^2bi-3ab^2-b^3i$。実部は $a^3-3ab^2$。',
        add: [{ t: 'm', size: 'sm', tex: 'a+(a^3-3ab^2)=a(1+a^2-3b^2)=0', note: '…② (3) より' }] } },
      { say: '$a>0$ なので $1+a^2=3b^2$。①から $a^2=3-b^2$ を入れると $4-b^2=3b^2$、$b^2=1$。$b=1$、$a=\\sqrt2$ で、$a>b$ もみたします。',
        add: [{ t: 'm', tex: 'b^2=1,\\quad a^2=2\\qquad\\therefore\\ \\alpha=\\sqrt2+i' }] },
      { clear: true, say: '$\\alpha^3$ を計算すると $-\\sqrt2+5i$。確かに $\\alpha+\\alpha^3=6i$ は純虚数。図では、α と α³ の中点（緑）が虚軸の上にあります。',
        add: [{ t: 'h', text: '(5)　つづき：4つの解と p, q' },
          { t: 'm', tex: '\\alpha^3=(\\sqrt2+i)^3=-\\sqrt2+5i' },
          { t: 'p', size: 'sm', text: '4つの解：$\\sqrt2\\pm i$，　$-\\sqrt2\\pm5i$' }, ROOTS] },
      { say: '係数は、共役な2つの解ごとに2次式を作ってかけます。和と積から $x^2-2\\sqrt2x+3$ と $x^2+2\\sqrt2x+27$。',
        add: [{ t: 'm', size: 'sm', tex: '(x-\\alpha)(x-\\overline{\\alpha})=x^2-2\\sqrt2\\,x+3' },
          { t: 'm', size: 'sm', tex: '(x-\\alpha^3)(x-\\overline{\\alpha}^{\\,3})=x^2+2\\sqrt2\\,x+27' }] },
      { ask: { type: 'choice', q: '2つの2次式をかけたときの $p,\\ q$ は？',
        opts: ['$p=30,\\ q=-48\\sqrt2$', '$p=22,\\ q=48\\sqrt2$', '$p=22,\\ q=-48\\sqrt2$', '$p=-22,\\ q=-60\\sqrt2$'], ok: 2,
        why: { 0: '$x^2$ の係数に $(-2\\sqrt2)(2\\sqrt2)=-8$ を入れ忘れています。', 1: '$x$ の係数は $-2\\sqrt2\\cdot27+3\\cdot2\\sqrt2=-48\\sqrt2$。符号に注意。', 3: '$x^2$ の係数は $27+3-8=22$、$x$ の係数は $-54\\sqrt2+6\\sqrt2$ です。' },
        good: '$x^2$：$27+3-8=22$。$x$：$-54\\sqrt2+6\\sqrt2=-48\\sqrt2$。$x^3$ の係数は 0 で、問題と合います。',
        add: [{ t: 'm', size: 'sm', tex: 'x^4+22x^2-48\\sqrt2\\,x+81=0' }] } },
      { say: '(5) の答えです。最後に $x^3$ の係数が 0、定数項が 81 になっていることも確かめておきましょう。',
        add: [{ t: 'ans', label: '(5) 答', text: '$\\alpha=\\sqrt2+i$\n4つの解：$\\sqrt2\\pm i$，$-\\sqrt2\\pm5i$\n$p=22$，$q=-48\\sqrt2$' }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: 'α を極形式で求めることもできます。$|\\alpha|=\\sqrt3$ なので $\\alpha=\\sqrt3(\\cos\\theta+i\\sin\\theta)$。ド・モアブルの定理で、α³ は大きさ $3\\sqrt3$、偏角 3θ です。',
        add: [{ t: 'h', text: '別の見方：極形式で' },
          { t: 'm', tex: '\\alpha^3=3\\sqrt3(\\cos3\\theta+i\\sin3\\theta)' },
          { t: 'm', tex: '\\sqrt3\\cos\\theta+3\\sqrt3\\cos3\\theta=0', note: 'α＋α³ の実部 ＝ 0' }] },
      { ask: { type: 'think', q: '3倍角の公式 $\\cos3\\theta=4\\cos^3\\theta-3\\cos\\theta$ を使って $\\cos\\theta$ を求め、α を出そう。（$0<\\theta<\\frac{\\pi}{4}$）',
        hint: '$\\cos\\theta+3(4\\cos^3\\theta-3\\cos\\theta)=0$ を $\\cos\\theta$ でくくる。',
        ans: '$\\cos\\theta\\,(12\\cos^2\\theta-8)=0$ より $\\cos^2\\theta=\\dfrac23$。$\\cos\\theta=\\dfrac{\\sqrt6}{3}$、$\\sin\\theta=\\dfrac{\\sqrt3}{3}$ で $\\alpha=\\sqrt2+i$',
        after: '$\\cos^2\\theta=\\frac23>\\frac12$ なので、確かに $0<\\theta<\\frac{\\pi}{4}$。成分でも極形式でも同じ答えです。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。実数係数の方程式と複素数の解は、「共役も解」と「解と係数の関係」の組み合わせで解きます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
