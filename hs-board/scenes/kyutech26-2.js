/* 九工大型 数学：2026年度 九州工業大学 前期 第2問の類題（自作問題・元の問題ではない）
   問題：x>0、f(x)=2x/√(x⁴+4)。∠C=90°, BC=2x, CA=√(x⁴+4) の直角三角形 ABC、θ(x)=∠BAC（tan θ = f(x)）
   答え（python3・sympy で検算ずみ。積分は数値積分 30 けたでも一致）：
     (1) AB = x²+2（4x²+x⁴+4=(x²+2)²）、tan θ = f(x)、sin θ = 2x/(x²+2)
     (2) f'(x) = (8−2x⁴)/(x⁴+4)^{3/2} → x=√2 で極大値 1（極小値なし）
     (3) θ'(x) = 2(2−x²)/{(x²+2)√(x⁴+4)}
     (4) ∫_{2−√2}^{√2} (2−x²)/{(x²+2)√(x⁴+4)} dx = (1/2){θ(√2)−θ(2−√2)} = (1/2)(π/4−π/6) = π/24
         （sin θ(2−√2) = 1/2、tan θ(√2) = 1）
     (5) sin φ = √2x/(x²+1)（辺 √2x, √(x⁴+1), 斜辺 x²+1）、φ' = √2(1−x²)/{(x²+1)√(x⁴+1)}
         ∫_0^1 (1−x²)/{(x²+1)√(x⁴+1)} dx = (1/√2)(π/4 − 0) = √2π/8
     別の見方：f(2/x)=f(x) なので ∫_1^2 (4) の被積分関数 dx = 0 */
(function () {
  // 直角三角形（A が左下、C が右下の直角、B が C の真上）。w：横の辺（CA）、hgt：たての辺（BC）
  const tri = (id, w, hgt, labs, extra, size) => {
    const A = [0, 0], C = [w, 0], B = [w, hgt], m = 0.5;
    const view = [-m, -0.75, w + 1.6, hgt + 0.55], W = size || 540, H = Math.round(W * (view[3] - view[1]) / (view[2] - view[0]));
    return { t: 'fig', id, col: 1, view, w: W, h: H, items: [
      { k: 'poly', pts: [A, C, B], close: true, c: 'w', wd: 3 },
      { k: 'right', o: C, a: A, b: B, s: 16 },
      { k: 'angle', o: A, a: C, b: B, rp: 40, c: 'y', label: labs[3] || 'θ', lr: 18, size: 24 },
      { k: 'pt', at: A, name: 'A', dir: 'sw', size: 22 }, { k: 'pt', at: B, name: 'B', dir: 'ne', size: 22 }, { k: 'pt', at: C, name: 'C', dir: 'se', size: 22 },
      { k: 'label', at: [w, hgt / 2], text: labs[0], dx: 14, c: 'p', size: 22, anchor: 'start' },
      { k: 'label', at: [w / 2, 0], text: labs[1], dy: 26, c: 'b', size: 22 },
      { k: 'label', at: [w / 2, hgt / 2], text: labs[2], dx: -22, dy: -20, c: 'y', size: 22, anchor: 'end' }].concat(extra || []) };
  };
  const T1 = (id, extra, size) => tri(id, Math.sqrt(5), 2, ['2x', '√(x⁴+4)', 'AB = ?'], extra, size);
  const T2 = (id, extra, size) => tri(id, Math.sqrt(5), 2, ['2x', '√(x⁴+4)', 'x² + 2'], extra, size);
  const graph = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.35, -0.28, 5.4, 1.35], w: 470, h: 300, items: [
    { k: 'axes', tx: [[Math.SQRT2, '√2'], [4, '4']], ty: [[1, '1']] },
    { k: 'fn', f: '2*x/sqrt(x**4+4)', a: 0, b: 5.3, c: 'y', wd: 3, label: 'y = f(x)', lat: [2.9, 0.9] },
    { k: 'line', m: 0, n: 1, c: 'd', wd: 1.5, dash: true }].concat(items || []) });
  const POINTS = [
    '根号の中が $(\\ \\ )^2-(\\ \\ )^2$ の形にできたら、**直角三角形の辺** と見る。$4x^2+(x^4+4)=(x^2+2)^2$ のように、斜辺が根号なしで書ける組を探す',
    "$\\tan\\theta=f(x)$（または $\\sin\\theta=g(x)$）の両辺を $x$ で微分すると $\\theta'(x)$ が出る。斜辺が整式なら $\\sin$ で微分すると計算が軽い",
    "被積分関数が $\\theta'(x)$ の定数倍なら、定積分は **角の差** $\\theta(b)-\\theta(a)$。端の角は三角形の辺の比から読む"
  ];

  HB.lesson({
    id: 'kyutech26-2', field: '九工大型　数学', title: '2026 九工大 第2問の類題 ― 直角三角形の角で読む、根号つきの関数の積分', level: '2026年度 九州工業大学 前期 第2問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '$x>0$ とし、$f(x)=\\dfrac{2x}{\\sqrt{x^4+4}}$ とおく。$\\angle\\mathrm{C}=90^\\circ$，$\\mathrm{BC}=2x$，$\\mathrm{CA}=\\sqrt{x^4+4}$ である直角三角形 ABC を考え、$\\theta(x)=\\angle\\mathrm{BAC}$ とする。ただし、$\\theta(x)$ は $x$ の微分可能な関数として扱ってよい。',
      parts: [
        '(1)　辺 AB の長さを $x$ で表せ。また、$\\tan\\theta(x)$，$\\sin\\theta(x)$ を $x$ で表せ。',
        '(2)　関数 $f(x)\\ (x>0)$ の極値を求めよ。',
        "(3)　導関数 $\\theta'(x)$ を求めよ。",
        '(4)　定積分 $\\displaystyle\\int_{2-\\sqrt2}^{\\sqrt2}\\frac{2-x^2}{(x^2+2)\\sqrt{x^4+4}}\\,dx$ を求めよ。',
        '(5)　定積分 $\\displaystyle\\int_0^1\\frac{1-x^2}{(x^2+1)\\sqrt{x^4+1}}\\,dx$ を求めよ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '根号の中に 4 次式がある分数関数を、直角三角形の「角」として読みかえる問題です。最後の (5) には誘導がありません。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'この問題の道すじです。$f(x)$ は三角形の辺の比、つまり角 $\\theta$ の $\\tan$。その $\\theta$ を微分したものが (4) の被積分関数になっていて、積分は角の差で求まります。',
        add: [{ t: 'h', text: '問題の読みかえ（道すじ）' },
          { t: 'box', c: 'y', size: 'sm', label: '(1)(2)', text: '三角形の辺で $f(x)=\\tan\\theta$ と見る。$f$ の増減は $\\theta$ の増減' },
          { t: 'box', c: 'p', size: 'sm', label: '(3)', text: "$\\theta'(x)$ を計算すると、(4) の被積分関数が出てくる" },
          { t: 'box', c: 'b', size: 'sm', label: '(4)(5)', text: '定積分 $=$ 角の差 $\\theta(b)-\\theta(a)$。(5) は三角形を自分で作る' },
          T1('t0')] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。直角をはさむ 2 辺がわかっているので、三平方の定理で斜辺 AB を求めます。根号の中がきれいな 2 乗になるかがカギです。',
        add: [{ t: 'h', text: '(1)　斜辺 AB と tan θ, sin θ' },
          { t: 'm', tex: '\\mathrm{AB}^2=(2x)^2+\\big(\\sqrt{x^4+4}\\big)^2=x^4+4x^2+4' },
          T1('t1')] },
      { ask: { type: 'choice', q: '斜辺 AB の長さは？',
        opts: ['$x^2+4$', '$2x+\\sqrt{x^4+4}$', '$x^2+2$', '$x^2+2x+2$'], ok: 2,
        why: { 0: '$(x^2+4)^2=x^4+8x^2+16$ で、合いません。', 1: '辺の長さは足し算ではなく、2 乗の和の平方根です。', 3: '$x^4+4x^2+4$ は $(x^2+2)^2$。1 次の項はありません。' },
        good: '$x^4+4x^2+4=(x^2+2)^2$ なので $\\mathrm{AB}=x^2+2$。斜辺が根号なしで書けるのが、この問題のしかけです。',
        add: [{ t: 'm', tex: '\\mathrm{AB}=x^2+2' }],
        draw: [{ fig: 't1', items: [{ k: 'label', at: [Math.sqrt(5) / 2, 1], text: '= x² + 2', dx: -48, dy: 14, c: 'y', size: 22, anchor: 'end' }] }] } },
      { say: '角 $\\theta$ の向かいの辺が BC、となりの辺が CA、斜辺が AB です。$\\tan\\theta$ はちょうど $f(x)$ になります。',
        add: [{ t: 'ans', label: '(1) 答', text: '$\\mathrm{AB}=x^2+2$\n$\\tan\\theta(x)=\\dfrac{2x}{\\sqrt{x^4+4}}=f(x)$，$\\sin\\theta(x)=\\dfrac{2x}{x^2+2}$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f(x)=2x(x^4+4)^{-\\frac12}$ と見て、積の微分と合成関数の微分を使います。',
        add: [{ t: 'h', text: '(2)　f(x) の極値' },
          { t: 'm', size: 'sm', tex: "f'(x)=\\frac{2(x^4+4)-2x\\cdot\\frac12\\cdot4x^3}{(x^4+4)\\sqrt{x^4+4}}" },
          graph('g1')] },
      { ask: { type: 'choice', q: "$f'(x)=\\dfrac{\\boxed{\\phantom{0}}}{(x^4+4)\\sqrt{x^4+4}}$ の分子は？",
        opts: ['$8-2x^4$', '$8+2x^4$', '$8-6x^4$', '$2x^4-8$'], ok: 0,
        why: { 1: '商の微分は「分子の微分 × 分母 − 分子 × 分母の微分」。引き算です。', 2: '$\\sqrt{x^4+4}$ の微分 $\\dfrac{4x^3}{2\\sqrt{x^4+4}}$ の $\\dfrac12$ を忘れています。', 3: '引く順が逆です。符号が反対になり、増減が逆になります。' },
        good: '$2x^4+8-4x^4=8-2x^4=2(2-x^2)(2+x^2)$。符号は $2-x^2$ で決まります。',
        add: [{ t: 'm', size: 'sm', tex: "f'(x)=\\frac{2(2-x^2)(2+x^2)}{(x^4+4)\\sqrt{x^4+4}}" }] } },
      { say: '$0<x<\\sqrt2$ で増加、$x>\\sqrt2$ で減少。$f(\\sqrt2)=\\dfrac{2\\sqrt2}{\\sqrt8}=1$。$\\tan\\theta=1$ なので、このとき $\\theta=\\dfrac{\\pi}{4}$（直角二等辺三角形）です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$(0)$', '$\\cdots$', '$\\sqrt2$', '$\\cdots$'], ["$f'(x)$", '', '$+$', '$0$', '$-$'], ['$f(x)$', '$(0)$', '$\\nearrow$', '$1$', '$\\searrow$']] },
          { t: 'ans', label: '(2) 答', text: '$x=\\sqrt2$ のとき 極大値 $1$（極小値はない）' }],
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [Math.SQRT2, 1], name: '(√2, 1)', dir: 'n', c: 'p', size: 21 }, { k: 'seg', a: [Math.SQRT2, 0], b: [Math.SQRT2, 1], c: 'p', wd: 1.5, dash: true }] }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: "(3) です。$\\tan\\theta(x)=f(x)$ の両辺を $x$ で微分します。左辺は合成関数の微分で、$\\theta'(x)$ が出てきます。",
        add: [{ t: 'h', text: "(3)　θ'(x) を求める" },
          { t: 'm', tex: '\\tan\\theta(x)=f(x)', note: '両辺を $x$ で微分' },
          T2('t2')] },
      { ask: { type: 'choice', q: '$\\tan\\theta(x)=f(x)$ の両辺を $x$ で微分した式は？',
        opts: ["$\\dfrac{1}{\\cos^2\\theta}=f'(x)$", "$\\dfrac{\\theta'(x)}{\\sin^2\\theta}=f'(x)$", "$\\dfrac{\\theta'(x)}{\\cos^2\\theta}=f'(x)$", "$\\theta'(x)\\cos^2\\theta=f'(x)$"], ok: 2,
        why: { 0: '$\\theta$ は $x$ の関数なので、合成関数の微分で $\\theta\'(x)$ がかかります。', 1: '$\\tan\\theta$ の導関数は $\\dfrac{1}{\\cos^2\\theta}$ です。', 3: '$\\dfrac{1}{\\cos^2\\theta}$ を「かける」はずが、$\\cos^2\\theta$ をかけています。' },
        good: "$\\dfrac{d}{dx}\\tan\\theta(x)=\\dfrac{1}{\\cos^2\\theta}\\cdot\\theta'(x)$。だから $\\theta'(x)=f'(x)\\cos^2\\theta$。",
        add: [{ t: 'm', tex: "\\theta'(x)=f'(x)\\cos^2\\theta", note: '$\\cos\\theta=\\dfrac{\\mathrm{CA}}{\\mathrm{AB}}$' }] } },
      { say: '$\\cos^2\\theta=\\dfrac{x^4+4}{(x^2+2)^2}$ を (2) の $f\'(x)$ にかけます。$(x^4+4)$ と $(2+x^2)$ が約分できて、すっきりします。',
        add: [{ t: 'm', size: 'sm', tex: "\\theta'(x)=\\frac{2(2-x^2)(2+x^2)}{(x^4+4)\\sqrt{x^4+4}}\\cdot\\frac{x^4+4}{(x^2+2)^2}" },
          { t: 'ans', label: '(3) 答', tex: "\\theta'(x)=\\frac{2(2-x^2)}{(x^2+2)\\sqrt{x^4+4}}" }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.6, 0.4], part: '(4)', say: "(4) の被積分関数をよく見ると、(3) の $\\theta'(x)$ のちょうど $\\dfrac12$ 倍です。だから、原始関数は $\\dfrac12\\theta(x)$ です。",
        add: [{ t: 'h', text: '(4)　定積分は「角の差」' },
          { t: 'm', size: 'sm', tex: "\\int_{2-\\sqrt2}^{\\sqrt2}\\frac{2-x^2}{(x^2+2)\\sqrt{x^4+4}}\\,dx=\\frac12\\int_{2-\\sqrt2}^{\\sqrt2}\\theta'(x)\\,dx" },
          { t: 'm', tex: '=\\frac12\\Big\\{\\theta(\\sqrt2)-\\theta(2-\\sqrt2)\\Big\\}' },
          { t: 'p', size: 'sm', text: '(2) より $\\tan\\theta(\\sqrt2)=1$ なので　$\\theta(\\sqrt2)=\\dfrac{\\pi}{4}$' }] },
      { ask: { type: 'choice', q: '$\\theta(2-\\sqrt2)$ は？（$\\sin\\theta=\\dfrac{2x}{x^2+2}$ を使うと計算が楽）',
        opts: ['$\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{12}$', '$\\dfrac{\\pi}{8}$'], ok: 1,
        why: { 0: '$\\sin\\theta=\\dfrac12$ になるのは $\\dfrac{\\pi}{6}$。$\\dfrac{\\pi}{3}$ は $\\cos\\theta=\\dfrac12$ のときです。', 2: '$\\sin\\theta$ の値を計算してみると $\\dfrac12$ です。', 3: '$\\sin\\theta$ の値を計算してみると $\\dfrac12$ です。' },
        good: '$(2-\\sqrt2)^2+2=8-4\\sqrt2=4(2-\\sqrt2)$ なので $\\sin\\theta=\\dfrac{2(2-\\sqrt2)}{4(2-\\sqrt2)}=\\dfrac12$。$\\tan$ で計算するより、ずっと楽です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin\\theta(2-\\sqrt2)=\\frac{2(2-\\sqrt2)}{8-4\\sqrt2}=\\frac12\\quad\\therefore\\ \\theta=\\frac{\\pi}{6}' }] } },
      { say: '角の差をとって、$\\dfrac12$ をかけます。$\\dfrac{\\pi}{4}-\\dfrac{\\pi}{6}=\\dfrac{\\pi}{12}$ です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\frac12\\Big(\\frac{\\pi}{4}-\\frac{\\pi}{6}\\Big)=\\frac{\\pi}{24}' }] },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) には誘導がありません。(4) と同じ形で、根号の中が $x^4+1$、分母が $x^2+1$。そこで「斜辺 $x^2+1$、1 辺 $\\sqrt{x^4+1}$」の直角三角形を作れないか考えます。',
        add: [{ t: 'h', text: '(5)　三角形を自分で作る' },
          { t: 'm', tex: '(x^2+1)^2-\\big(\\sqrt{x^4+1}\\big)^2=\\ \\boxed{\\phantom{00}}', note: '残りの辺の 2 乗' },
          tri('t3', 2.2, 1.6, ['?', '√(x⁴+1)', 'x² + 1', 'φ'])] },
      { ask: { type: 'choice', q: '残りの辺（$\\varphi$ の向かいの辺）の長さは？',
        opts: ['$2x$', '$x$', '$\\sqrt{2x}$', '$\\sqrt2\\,x$'], ok: 3,
        why: { 0: '$(x^2+1)^2-(x^4+1)=2x^2$。その平方根は $2x$ ではありません。', 1: '$x^2$ ではなく $2x^2$ が残ります。', 2: '$\\sqrt{2x^2}=\\sqrt2\\,x$。$x$ も根号の外に出ます。' },
        good: '$(x^2+1)^2-(x^4+1)=2x^2$ なので $\\sqrt2\\,x$。$\\sin\\varphi=\\dfrac{\\sqrt2\\,x}{x^2+1}$ となる角 $\\varphi(x)$ を考えます。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin\\varphi(x)=\\frac{\\sqrt2\\,x}{x^2+1}\\quad\\Big(0\\le\\varphi<\\frac{\\pi}{2},\\ \\varphi(0)=0\\Big)' }],
        draw: [{ fig: 't3', items: [{ k: 'label', at: [2.2, 0.8], text: '= √2 x', dx: 32, c: 'g', size: 22, anchor: 'start' }] }] } },
      { say: "今度は $\\sin$ のほうを微分します。$\\cos\\varphi\\cdot\\varphi'(x)=\\dfrac{\\sqrt2(1-x^2)}{(x^2+1)^2}$、$\\cos\\varphi=\\dfrac{\\sqrt{x^4+1}}{x^2+1}$ で割ると、ねらいの形が出ます。",
        add: [{ t: 'm', size: 'sm', tex: "\\varphi'(x)=\\frac{\\sqrt2(1-x^2)}{(x^2+1)\\sqrt{x^4+1}}", note: '被積分関数の\n$\\sqrt2$ 倍' }] },
      { ask: { type: 'think', q: '$\\varphi(1)$ を求めて、(5) の定積分の値を出そう。',
        hint: '$\\sin\\varphi(1)=\\dfrac{\\sqrt2}{2}$。被積分関数は $\\dfrac{1}{\\sqrt2}\\varphi\'(x)$。',
        ans: '$\\varphi(1)=\\dfrac{\\pi}{4}$ より　$\\dfrac{1}{\\sqrt2}\\Big\\{\\varphi(1)-\\varphi(0)\\Big\\}=\\dfrac{1}{\\sqrt2}\\cdot\\dfrac{\\pi}{4}=\\dfrac{\\sqrt2}{8}\\pi$',
        after: '$x=1$ のとき三角形は直角二等辺三角形。(2) の $x=\\sqrt2$ と同じ役わりの点です。',
        add: [{ t: 'ans', label: '(5) 答', tex: '\\frac{1}{\\sqrt2}\\Big(\\frac{\\pi}{4}-0\\Big)=\\frac{\\sqrt2}{8}\\pi' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: '(3) も $\\sin\\theta=\\dfrac{2x}{x^2+2}$ を微分すれば、根号の微分がいりません。斜辺が整式になるように三角形を作ったおかげです。',
        add: [{ t: 'h', text: '別の見方：sin で微分する' },
          { t: 'm', size: 'sm', tex: "\\cos\\theta\\cdot\\theta'=\\frac{2(x^2+2)-2x\\cdot2x}{(x^2+2)^2}=\\frac{2(2-x^2)}{(x^2+2)^2}" },
          { t: 'm', size: 'sm', tex: "\\theta'=\\frac{2(2-x^2)}{(x^2+2)^2}\\cdot\\frac{x^2+2}{\\sqrt{x^4+4}}", note: '(3) と同じ' },
          graph('g2')] },
      { ask: { type: 'think', q: '(4) と同じ被積分関数で、区間を $1\\le x\\le2$ にした定積分の値は？',
        hint: '$f(1)$ と $f(2)$ を比べる。$\\tan\\theta$ が同じなら $\\theta$ も同じ。',
        ans: '$f(1)=f(2)=\\dfrac{2}{\\sqrt5}$ なので $\\theta(1)=\\theta(2)$。定積分は $\\dfrac12\\{\\theta(2)-\\theta(1)\\}=0$',
        after: '実は $f\\Big(\\dfrac2x\\Big)=f(x)$。被積分関数は $x=\\sqrt2$ の前後で符号が変わり、正の部分と負の部分がちょうど打ち消し合います。',
        draw: [{ fig: 'g2', items: [{ k: 'pt', at: [1, 2 / Math.sqrt(5)], c: 'b' }, { k: 'pt', at: [2, 2 / Math.sqrt(5)], c: 'b' }, { k: 'seg', a: [1, 2 / Math.sqrt(5)], b: [2, 2 / Math.sqrt(5)], c: 'b', wd: 2, dash: true }] }] } },
      { say: '答案では、(5) で作った角 $\\varphi(x)$ を「$0\\le\\varphi<\\dfrac{\\pi}{2}$ で $\\sin\\varphi=\\cdots$ をみたす角」とはっきり定義してから微分するのが大事です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: "・(3) の $\\cos^2\\theta$ は三角形の辺の比で書く\n・(5) は $\\varphi(x)$ の定義・$\\varphi'(x)$ の計算・$\\varphi(0)=0,\\ \\varphi(1)=\\dfrac{\\pi}{4}$ を順に書く" }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三平方の定理で「斜辺が整式になる三角形」を見つけると、むずかしそうな積分が角の差で求まりました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
