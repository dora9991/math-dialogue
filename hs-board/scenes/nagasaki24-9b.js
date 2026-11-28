/* 2024 長崎大 理系 第9問の類題②（自作）：実数係数の4次方程式が α と α² を解にもつ ― 共役・解と係数の関係・絶対値
   元の問題はうつしていない（類題①とも別の問題。「3次の項がなく定数項が具体的な実数係数の4次方程式が、ある複素数とその累乗をともに
   解にもつ。共役の性質 → 共役も解 → 解の和から純虚数 → 解の積から絶対値 → 複素数と係数を決める」というねらい・誘導の形だけを合わせ、
   累乗を 2 乗に、定数項を 27 に、「実部と虚部がともに正」だけの条件に変えた自作問題。①と違い 4 解の異なることは偏角の範囲だけで言え、
   p,q は有理数になる）。
   答え（python3・sympy で検算ずみ）：x⁴+px²+qx+27=0、α は実部・虚部がともに正（偏角 0<θ<π/2）
   (1) zw=(ac−bd)+(ad+bc)i の共役 = z̄ w̄、|z|²=a²+b²=z z̄
   (2) f(ᾱ)=conj f(α)=0（p,q 実数）、同様に ᾱ² も解
   (3) 偏角 ±θ, ±2θ（0<2θ<π）は互いに異なる → 4つは異なる → 4つの解のすべて。和=0 → Re(α+α²)=0、Im=r sinθ+r² sin2θ>0 → 純虚数
   (4) 積 |α|²|α|⁴=|α|⁶=27 → |α|=√3
   (5) α=a+bi：a²+b²=3、a+a²−b²=0 → 2a²+a−3=0 → a=1（a>0）、b²=2 → α=1+√2 i、α²=−1+2√2 i、α+α²=3√2 i
       (x²−2x+3)(x²+2x+9)=x⁴+8x²−12x+27 → p=8, q=−12（nroots で 4 解を確認）
   別の見方：極形式 √3cosθ+3cos2θ=0 → 6c²+√3c−3=0（c=cosθ）→ cosθ=1/√3、sinθ=√6/3 → α=√3(1/√3+i√6/3)=1+√2 i */
(function () {
  const AL = 'α';
  // 共役の記号（上の横線）は図の字では出ないので、名前の α の上に短い線をかく（s＝1 あたりの px、side＝名前の向き）
  const bar = (at, s, side, c, wide) => { const w = wide || 0, x0 = side === 'e' ? 23 : -46 - w, x1 = side === 'e' ? 38 + w : -31; return { k: 'seg', a: [at[0] + x0 / s, at[1] + 14 / s], b: [at[0] + x1 / s, at[1] + 14 / s], c, wd: 2.5 }; };
  // (3) の図（イメージ）：|α|=1.1、偏角 28°（α² の偏角は 56°）
  const r = 1.1, th = 28 * Math.PI / 180, a1 = [r * Math.cos(th), r * Math.sin(th)], a2 = [r * r * Math.cos(2 * th), r * r * Math.sin(2 * th)];
  const IMG = { t: 'fig', id: 'c1', col: 1, view: [-0.75, -1.85, 1.85, 1.85], w: 312, h: 444, items: [
    { k: 'axes', tx: [], ty: [], xl: '', yl: '虚軸' }, { k: 'label', at: [1.82, 0], text: '実軸', dy: 26, anchor: 'end', c: 'd', size: 20 },
    { k: 'seg', a: [0, 0], b: a1, c: 'y', wd: 2 }, { k: 'seg', a: [0, 0], b: a2, c: 'p', wd: 2 },
    { k: 'seg', a: [0, 0], b: [a1[0], -a1[1]], c: 'y', wd: 2, dash: true }, { k: 'seg', a: [0, 0], b: [a2[0], -a2[1]], c: 'p', wd: 2, dash: true },
    { k: 'angle', o: [0, 0], a: [1, 0], b: a1, rp: 60, label: 'θ', c: 'y' },
    { k: 'angle', o: [0, 0], a: [1, 0], b: a2, rp: 34, label: '2θ', lr: 26, c: 'p' },
    { k: 'pt', at: a1, name: AL, dir: 'e', c: 'y' }, { k: 'pt', at: [a1[0], -a1[1]], name: AL, dir: 'e', c: 'y' }, bar([a1[0], -a1[1]], 120, 'e', 'y'),
    { k: 'pt', at: a2, name: AL + '²', dir: 'e', c: 'p' }, { k: 'pt', at: [a2[0], -a2[1]], name: AL + '²', dir: 'e', c: 'p' }, bar([a2[0], -a2[1]], 120, 'e', 'p', 8)] };
  // (5) の図：実際の 4 つの解
  const s2 = Math.SQRT2, SC = 270 / 4.8;
  const ROOTS = { t: 'fig', id: 'c2', col: 1, view: [-2.2, -3.6, 2.6, 3.6], w: 270, h: 405, items: [
    { k: 'axes', tx: [[1, '1'], [-1, '−1']], ty: [], xl: '', yl: '虚軸' }, { k: 'label', at: [2.55, 0], text: '実軸', dy: 24, anchor: 'end', c: 'd', size: 20 },
    { k: 'seg', a: [1, s2], b: [-1, 2 * s2], c: 'g', wd: 2, dash: true },
    { k: 'pt', at: [0, 1.5 * s2], c: 'g', r: 5 },
    { k: 'pt', at: [1, s2], name: AL, dir: 'e', c: 'y' }, { k: 'pt', at: [1, -s2], name: AL, dir: 'e', c: 'y' }, bar([1, -s2], SC, 'e', 'y'),
    { k: 'pt', at: [-1, 2 * s2], name: AL + '²', dir: 'w', c: 'p' }, { k: 'pt', at: [-1, -2 * s2], name: AL + '²', dir: 'w', c: 'p' }, bar([-1, -2 * s2], SC, 'w', 'p', 8)] };
  const POINTS = [
    '実数係数なら $\\overline{f(\\alpha)}=f(\\overline{\\alpha})$。$\\alpha$ が解なら $\\overline{\\alpha}$ も解（$\\overline{p}=p$ を使う所を答案に書く）',
    '解と係数の関係を使う前に、4つの解が互いに異なることを確かめる（偏角 $\\pm\\theta,\\ \\pm2\\theta$）。和 $=0$ から $\\alpha+\\alpha^2$ の実部 $=0$',
    '積 $=27$ から $|\\alpha|^6=27$。$\\alpha=a+bi$ とおいて連立（または極形式と2倍角）で α を決め、2次式2つの積で係数を出す'
  ];

  HB.lesson({
    id: 'nagasaki24-9b', field: '長崎大型　数学（理系）', title: '2024 長崎大 理系 第9問の類題② ― α と α² を解にもつ4次方程式', level: '2024年度 長崎大学 理系 第9問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$p,\\ q$ を実数とし，$x$ の 4 次方程式 $x^4+px^2+qx+27=0$ ……(＊) を考える。(＊) は，実部と虚部がともに正の複素数 $\\alpha$ と，その 2 乗 $\\alpha^2$ を，ともに解にもつとする。複素数 $z$ と共役な複素数を $\\overline{z}$ で表す。',
      parts: [
        '(1)　複素数 $z,\\ w$ について，$\\overline{zw}=\\overline{z}\\,\\overline{w}$ が成り立つことを示せ。また，$|z|^2=z\\overline{z}$ を示せ。',
        '(2)　$\\overline{\\alpha}$ も (＊) の解であることを示せ。',
        '(3)　$\\alpha,\\ \\overline{\\alpha},\\ \\alpha^2,\\ \\overline{\\alpha}^{\\,2}$ が互いに異なることを示せ。また，$\\alpha+\\alpha^2$ は純虚数であることを示せ。',
        '(4)　$|\\alpha|$ を求めよ。',
        '(5)　$\\alpha$ を求めよ。また，(＊) の 4 つの解と，$p,\\ q$ の値を求めよ。'
      ],
      src: '※ 2024年度 長崎大学 前期 理系（医学部医学科）第9問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', cols: [1], say: '複素数を解にもつ4次方程式の問題です。(1)〜(3) は証明、(4)(5) は求値。前の小問の結果を順に使う誘導になっています。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.55' }] },

      // ---------- 読みかえと方針 ----------
      { clear: true, cols: [1], part: '方針', say: '読みかえます。実数係数の方程式では、解の共役も解。だから α、α² から $\\overline{\\alpha}$、$\\overline{\\alpha}^{\\,2}$ も解になり、4つの解がそろいます。あとは解と係数の関係です。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'y', label: '4つの解', text: '$\\alpha,\\quad \\overline{\\alpha},\\quad \\alpha^2,\\quad \\overline{\\alpha}^{\\,2}$　（(2) で示す）' },
          { t: 'box', c: 'b', label: '解と係数の関係', text: '$x^3$ の項がない → 4つの解の和 $=0$　…(3) へ\n定数項が 27 → 4つの解の積 $=27$　…(4) へ' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$z=a+bi,\\ w=c+di$（$a,\\ b,\\ c,\\ d$ は実数）とおいて、両辺を計算して比べます。まず積です。',
        add: [{ t: 'h', text: '(1)　共役の性質' },
          { t: 'm', tex: 'zw=(ac-bd)+(ad+bc)i' },
          { t: 'm', tex: '\\overline{zw}=(ac-bd)-(ad+bc)i' },
          { t: 'm', tex: '\\overline{z}\\,\\overline{w}=(a-bi)(c-di)=(ac-bd)-(ad+bc)i' }] },
      { say: '一致しました。もう1つ、$z\\overline{z}=(a+bi)(a-bi)=a^2+b^2=|z|^2$。この2つの性質を、このあと何度も使います。',
        add: [{ t: 'ans', label: '(1)', text: '$\\overline{zw}=\\overline{z}\\,\\overline{w}$\n$z\\overline{z}=a^2+b^2=|z|^2$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f(x)=x^4+px^2+qx+27$ とおくと $f(\\alpha)=0$。この両辺の共役をとって、(1) を使います。くり返すと $\\overline{z^n}=\\overline{z}^{\\,n}$ もいえます。',
        add: [{ t: 'h', text: '(2)　共役も解' },
          { t: 'm', tex: 'f(\\alpha)=\\alpha^4+p\\alpha^2+q\\alpha+27=0' }] },
      { ask: { type: 'choice', q: '$\\overline{f(\\alpha)}=f(\\overline{\\alpha})$ を導くとき、「$p,\\ q$ が実数」を使うのはどこ？',
        opts: ['$\\overline{\\alpha^4}=\\overline{\\alpha}^{\\,4}$ のところ', '$\\overline{27}=27$ のところ', '$\\overline{p\\alpha^2}=p\\,\\overline{\\alpha}^{\\,2}$ のところ', 'どこにも使わない'], ok: 2,
        why: { 0: 'それは (1) の積の性質だけで言えます。', 1: '27 は与えられた実数。係数 $p,\\ q$ とは別の話です。', 3: '係数が虚数だと $\\overline{p}\\neq p$ となり、成り立ちません。' },
        good: '$\\overline{p\\alpha^2}=\\overline{p}\\,\\overline{\\alpha}^{\\,2}$ で、$p$ が実数だから $\\overline{p}=p$。$q$ も同じ。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}0=\\overline{f(\\alpha)}&=\\overline{\\alpha}^{\\,4}+\\overline{p}\\,\\overline{\\alpha}^{\\,2}+\\overline{q}\\,\\overline{\\alpha}+27\\\\ &=\\overline{\\alpha}^{\\,4}+p\\,\\overline{\\alpha}^{\\,2}+q\\,\\overline{\\alpha}+27=f(\\overline{\\alpha})\\end{aligned}' }] } },
      { say: 'よって $\\overline{\\alpha}$ も解。同じことを解 $\\alpha^2$ に使うと、$\\overline{\\alpha^2}=\\overline{\\alpha}^{\\,2}$ も解です。',
        add: [{ t: 'ans', label: '(2)', text: '$f(\\overline{\\alpha})=\\overline{f(\\alpha)}=\\overline{0}=0$ より、$\\overline{\\alpha}$ も (＊) の解\n同様に、$\\overline{\\alpha}^{\\,2}$ も (＊) の解' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。4つの解を「(＊) の解のすべて」として解と係数の関係に使うには、**4つが互いに異なる** ことを確かめる必要があります（重なると数え方が変わる）。',
        add: [{ t: 'h', text: '(3)　異なることと、α＋α² が純虚数' },
          { t: 'p', size: 'sm', text: '右の図はイメージ（|α| と θ は仮の値）' }, IMG] },
      { ask: { type: 'choice', q: '4つが互いに異なることを言うのに、決め手になる条件は？',
        opts: ['$p,\\ q$ が実数', '定数項が 27', '$x^3$ の項がない', '実部も虚部もともに正'], ok: 3,
        why: { 0: 'それは (2)（共役も解）で使いました。', 1: '27 は (4) で $|\\alpha|$ を出すのに使います。', 2: 'それはこのあと、解の和に使います。' },
        good: '偏角 θ は $0<\\theta<\\frac{\\pi}{2}$。4つの偏角 $\\pm\\theta,\\ \\pm2\\theta$ は $-\\pi$ から $\\pi$ の間で、みな異なります。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '偏角で比べる', text: '$\\alpha=r(\\cos\\theta+i\\sin\\theta)$，$0<\\theta<\\frac{\\pi}{2}$\n偏角は $\\theta,\\ -\\theta,\\ 2\\theta,\\ -2\\theta$（$0<2\\theta<\\pi$）\n→ 4つはすべて異なる' }] } },
      { say: 'もし α が純虚数（$\\theta=\\frac{\\pi}{2}$）なら $\\alpha^2$ は負の実数で、$\\alpha^2=\\overline{\\alpha}^{\\,2}$ と重なってしまいます。「実部が正」は、それを防ぐ条件です。' },
      { ask: { type: 'choice', q: '解と係数の関係より、4つの解の和は？',
        opts: ['$p$', '$0$', '$27$', '$-q$'], ok: 1,
        why: { 0: '$p$ は「2つずつの積の和」。和は $x^3$ の係数で決まります。', 2: '27 は4つの解の積です。', 3: '$-q$ は「3つずつの積の和」です。' },
        good: '和 $=-(x^3\\text{ の係数})=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\alpha+\\overline{\\alpha}+\\alpha^2+\\overline{\\alpha}^{\\,2}=0' }] } },
      { clear: true, cols: [1], say: '$\\beta=\\alpha+\\alpha^2$ とおくと、和の式は $\\beta+\\overline{\\beta}=0$。つまり β の実部が 0。さらに虚部は正なので $\\beta\\neq0$。だから純虚数です。',
        add: [{ t: 'h', text: '(3)　答案' },
          { t: 'ans', label: '(3)', text: '$\\alpha=r(\\cos\\theta+i\\sin\\theta)$（$r>0$、$0<\\theta<\\frac{\\pi}{2}$）とおく。4つの数 $\\alpha,\\ \\overline{\\alpha},\\ \\alpha^2,\\ \\overline{\\alpha}^{\\,2}$ の偏角は\n$\\theta,\\ -\\theta,\\ 2\\theta,\\ -2\\theta$ で、$0<2\\theta<\\pi$ よりすべて異なる。よって4つは (＊) の解のすべてである。\n$x^3$ の係数が 0 なので、解と係数の関係より $\\alpha+\\overline{\\alpha}+\\alpha^2+\\overline{\\alpha}^{\\,2}=0$。\n$\\beta=\\alpha+\\alpha^2$ とおくと $\\beta+\\overline{\\beta}=0$ なので、β の実部は 0。\nまた β の虚部は $r\\sin\\theta+r^2\\sin2\\theta>0$（$0<2\\theta<\\pi$）。よって β は純虚数である。' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。4つの解の積は、定数項の 27。$\\alpha\\overline{\\alpha}=|\\alpha|^2$ を使ってまとめます。',
        add: [{ t: 'h', text: '(4)　|α| を求める' },
          { t: 'm', tex: '\\alpha\\cdot\\overline{\\alpha}\\cdot\\alpha^2\\cdot\\overline{\\alpha}^{\\,2}=|\\alpha|^2\\cdot|\\alpha|^4=|\\alpha|^6' },
          { t: 'm', tex: '|\\alpha|^6=27', note: '解の積 ＝ 定数項' }] },
      { ask: { type: 'choice', q: '$|\\alpha|$ は？',
        opts: ['$\\sqrt3$', '$3$', '$3\\sqrt3$', '$\\sqrt[4]{27}$'], ok: 0,
        why: { 1: '$|\\alpha|^3=27$ としています。積は $|\\alpha|^2\\cdot|\\alpha|^4=|\\alpha|^6$。', 2: '$|\\alpha|^2=27$ としています。$|\\alpha|^6=27=3^3$ です。', 3: '$|\\alpha|^4=27$ としています。$\\alpha\\overline{\\alpha}$ の $|\\alpha|^2$ も入ります。' },
        good: '$|\\alpha|^6=27=3^3$、$|\\alpha|>0$ より $|\\alpha|^2=3$、$|\\alpha|=\\sqrt3$。',
        add: [{ t: 'ans', label: '(4) 答', tex: '|\\alpha|=\\sqrt3' }] } },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。$\\alpha=a+bi$（$a>0,\\ b>0$）とおきます。(4) から $a^2+b^2=3$。(3) から $\\alpha+\\alpha^2$ の実部が 0。まず $\\alpha^2$ の実部を出します。',
        add: [{ t: 'h', text: '(5)　α を決める' },
          { t: 'm', tex: '\\alpha=a+bi\\quad(a>0,\\ b>0)' },
          { t: 'm', tex: 'a^2+b^2=3', note: '…① (4) より' }] },
      { ask: { type: 'choice', q: '$\\alpha^2=(a+bi)^2$ の実部は？',
        opts: ['$a^2+b^2$', '$2ab$', '$a^2-2ab+b^2$', '$a^2-b^2$'], ok: 3,
        why: { 0: '$(bi)^2=b^2i^2=-b^2$。$i^2=-1$ を忘れています。', 1: '$2abi$ は虚部の項です。', 2: '$(a-b)^2$ になっています。$(a+bi)^2=a^2+2abi+(bi)^2$。' },
        good: '$(a+bi)^2=a^2+2abi-b^2$。実部は $a^2-b^2$。',
        add: [{ t: 'm', size: 'sm', tex: 'a+(a^2-b^2)=0', note: '…② (3) より' }] } },
      { say: '①から $b^2=3-a^2$ を②に入れると $2a^2+a-3=0$、$(2a+3)(a-1)=0$。$a>0$ より $a=1$、$b^2=2$。$b>0$ なので $b=\\sqrt2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '2a^2+a-3=(2a+3)(a-1)=0' },
          { t: 'm', tex: 'a=1,\\ b=\\sqrt2\\qquad\\therefore\\ \\alpha=1+\\sqrt2\\,i' }] },
      { clear: true, say: '$\\alpha^2$ を計算すると $-1+2\\sqrt2\\,i$。確かに $\\alpha+\\alpha^2=3\\sqrt2\\,i$ は純虚数。図では、α と α² の中点（緑）が虚軸の上にあります。',
        add: [{ t: 'h', text: '(5)　つづき：4つの解と p, q' },
          { t: 'm', tex: '\\alpha^2=(1+\\sqrt2\\,i)^2=-1+2\\sqrt2\\,i' },
          { t: 'p', size: 'sm', text: '4つの解：$1\\pm\\sqrt2\\,i$，　$-1\\pm2\\sqrt2\\,i$' }, ROOTS] },
      { say: '係数は、共役な2つの解ごとに2次式を作ってかけます。和と積から $x^2-2x+3$ と $x^2+2x+9$。',
        add: [{ t: 'm', size: 'sm', tex: '(x-\\alpha)(x-\\overline{\\alpha})=x^2-2x+3' },
          { t: 'm', size: 'sm', tex: '(x-\\alpha^2)(x-\\overline{\\alpha}^{\\,2})=x^2+2x+9' }] },
      { ask: { type: 'choice', q: '2つの2次式をかけたときの $p,\\ q$ は？',
        opts: ['$p=12,\\ q=-12$', '$p=8,\\ q=12$', '$p=8,\\ q=-12$', '$p=6,\\ q=-24$'], ok: 2,
        why: { 0: '$x^2$ の係数に $(-2x)(2x)=-4x^2$ を入れ忘れています。', 1: '$x$ の係数は $-2\\cdot9+3\\cdot2=-12$。符号に注意。', 3: '$x^2$ は $9+3-4=8$、$x$ は $-18+6=-12$ です。' },
        good: '$x^2$：$9+3-4=8$。$x$：$-18+6=-12$。$x^3$ の係数は 0 で、問題と合います。',
        add: [{ t: 'm', size: 'sm', tex: 'x^4+8x^2-12x+27=0' }] } },
      { say: '(5) の答えです。最後に $x^3$ の係数が 0、定数項が 27 になっていることも確かめておきましょう。',
        add: [{ t: 'ans', label: '(5) 答', text: '$\\alpha=1+\\sqrt2\\,i$\n4つの解：$1\\pm\\sqrt2\\,i$，$-1\\pm2\\sqrt2\\,i$\n$p=8$，$q=-12$' }] },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: 'α を極形式で求めることもできます。$|\\alpha|=\\sqrt3$ なので $\\alpha=\\sqrt3(\\cos\\theta+i\\sin\\theta)$。ド・モアブルの定理で、$\\alpha^2$ は大きさ 3、偏角 $2\\theta$ です。',
        add: [{ t: 'h', text: '別の見方：極形式で' },
          { t: 'm', tex: '\\alpha^2=3(\\cos2\\theta+i\\sin2\\theta)' },
          { t: 'm', tex: '\\sqrt3\\cos\\theta+3\\cos2\\theta=0', note: 'α＋α² の実部 ＝ 0' }] },
      { ask: { type: 'think', q: '2倍角の公式 $\\cos2\\theta=2\\cos^2\\theta-1$ を使って $\\cos\\theta$ を求め、α を出そう。（$0<\\theta<\\frac{\\pi}{2}$）',
        hint: '$c=\\cos\\theta$ とおくと $\\sqrt3\\,c+3(2c^2-1)=0$、つまり $6c^2+\\sqrt3\\,c-3=0$。$c>0$ に注意。',
        ans: '解の公式で $c=\\dfrac{\\sqrt3}{3}$（もう1つの解 $-\\dfrac{\\sqrt3}{2}$ は $c>0$ に反する）。$\\cos\\theta=\\dfrac{1}{\\sqrt3}$、$\\sin\\theta=\\dfrac{\\sqrt6}{3}$ で $\\alpha=1+\\sqrt2\\,i$',
        after: '成分でも極形式でも同じ答えです。極形式では $\\theta$ の範囲（$c>0$）で解を選ぶのを忘れずに。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。実数係数の方程式と複素数の解は、「共役も解」と「解と係数の関係」の組み合わせで解きます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
