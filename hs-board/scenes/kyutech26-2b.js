/* 九工大型 数学：2026年度 九州工業大学 前期 第2問の類題②（自作問題・元の問題ではない）
   問題：x>0、f(x)=x/√(x⁴+x²+1)。∠Q=90°, QR=x, PQ=√(x⁴+x²+1) の直角三角形 PQR、θ(x)=∠QPR（tan θ = f(x)）
   答え（python3・sympy で検算ずみ。積分は数値積分 30 けたでも一致）：
     (1) PR = x²+1（(x⁴+x²+1)+x²=(x²+1)²）、tan θ = f(x)、sin θ = x/(x²+1)
     (2) f'(x) = (1−x⁴)/(x⁴+x²+1)^{3/2} → x=1 で極大値 1/√3（極小値なし）、このとき θ=π/6
     (3) θ'(x) = (1−x²)/{(x²+1)√(x⁴+x²+1)}
     (4) ∫_0^1 (1−x²)/{(x²+1)√(x⁴+x²+1)} dx = θ(1)−θ(0) = π/6−0 = π/6（x→+0 で θ→0）
     (5) (x²+1)²−(x⁴−x²+1)=3x²。sin φ = √3x/(x²+1)（辺 √3x, √(x⁴−x²+1), 斜辺 x²+1）
         φ' = √3(1−x²)/{(x²+1)√(x⁴−x²+1)}、φ(0)=0、φ(1)=π/3
         ∫_0^1 (1−x²)/{(x²+1)√(x⁴−x²+1)} dx = (1/√3)(π/3) = √3π/9
     別の見方：f(1/x)=f(x) なので ∫_{1/2}^{2} (4) の被積分関数 dx = 0 */
(function () {
  // 直角三角形（P が左下、Q が右下の直角、R が Q の真上）。w：横の辺（PQ）、hgt：たての辺（QR）
  const tri = (id, w, hgt, labs, extra, size) => {
    const A = [0, 0], C = [w, 0], B = [w, hgt], m = 0.5;
    const view = [-m, -0.75, w + 1.6, hgt + 0.55], W = size || 540, H = Math.round(W * (view[3] - view[1]) / (view[2] - view[0]));
    return { t: 'fig', id, col: 1, view, w: W, h: H, items: [
      { k: 'poly', pts: [A, C, B], close: true, c: 'w', wd: 3 },
      { k: 'right', o: C, a: A, b: B, s: 16 },
      { k: 'angle', o: A, a: C, b: B, rp: 40, c: 'y', label: labs[3] || 'θ', lr: 18, size: 24 },
      { k: 'pt', at: A, name: 'P', dir: 'sw', size: 22 }, { k: 'pt', at: B, name: 'R', dir: 'ne', size: 22 }, { k: 'pt', at: C, name: 'Q', dir: 'se', size: 22 },
      { k: 'label', at: [w, hgt / 2], text: labs[0], dx: 14, c: 'p', size: 22, anchor: 'start' },
      { k: 'label', at: [w / 2, 0], text: labs[1], dy: 26, c: 'b', size: 22 },
      { k: 'label', at: [w / 2, hgt / 2], text: labs[2], dx: -22, dy: -20, c: 'y', size: 22, anchor: 'end' }].concat(extra || []) };
  };
  const T1 = (id, extra, size) => tri(id, Math.sqrt(3), 1, ['x', '√(x⁴+x²+1)', 'PR = ?'], extra, size);
  const T2 = (id, extra, size) => tri(id, Math.sqrt(3), 1, ['x', '√(x⁴+x²+1)', 'x² + 1'], extra, size);
  const S3 = Math.sqrt(3);
  const graph = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.35, -0.12, 4.6, 0.75], w: 470, h: 300, items: [
    { k: 'axes', tx: [[1, '1'], [2, '2'], [3, '3'], [4, '4']], ty: [[1 / S3, '1/√3']] },
    { k: 'fn', f: 'x/sqrt(x**4+x**2+1)', a: 0, b: 4.5, c: 'y', wd: 3, label: 'y = f(x)', lat: [2.2, 0.36] },
    { k: 'line', m: 0, n: 1 / S3, c: 'd', wd: 1.5, dash: true }].concat(items || []) });
  const POINTS = [
    '根号の中が $(\\ \\ )^2-(\\ \\ )^2$ の形にできたら、**直角三角形の辺** と見る。$x^2+(x^4+x^2+1)=(x^2+1)^2$ のように、斜辺が根号なしで書ける組を探す',
    "$\\sin\\theta=g(x)$ の両辺を $x$ で微分すると $\\cos\\theta\\cdot\\theta'(x)$ が出る。$\\cos\\theta$ は三角形の辺の比で書いて割る（$\\tan$ で微分するより根号が減る）",
    "被積分関数が $\\theta'(x)$ の定数倍なら、定積分は **角の差** $\\theta(b)-\\theta(a)$。端の角は三角形の辺の比から読む。下端 $0$ では $\\theta\\to0$ を確かめる"
  ];

  HB.lesson({
    id: 'kyutech26-2b', field: '九工大型　数学', title: '2026 九工大 第2問の類題② ― 直角三角形の角で読む、根号つきの分数関数の積分', level: '2026年度 九州工業大学 前期 第2問の類題②（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題②',
      lead: '$x>0$ とし、$f(x)=\\dfrac{x}{\\sqrt{x^4+x^2+1}}$ とおく。$\\angle\\mathrm{Q}=90^\\circ$，$\\mathrm{QR}=x$，$\\mathrm{PQ}=\\sqrt{x^4+x^2+1}$ である直角三角形 PQR を考え、$\\theta(x)=\\angle\\mathrm{QPR}$ とする。ただし、$\\theta(x)$ は $x$ の微分可能な関数として扱ってよく、$x\\to+0$ のとき $\\theta(x)\\to0$ である。',
      parts: [
        '(1)　辺 PR の長さを $x$ で表せ。また、$\\tan\\theta(x)$，$\\sin\\theta(x)$ を $x$ で表せ。',
        '(2)　関数 $f(x)\\ (x>0)$ の極値を求めよ。',
        "(3)　導関数 $\\theta'(x)$ を求めよ。",
        '(4)　定積分 $\\displaystyle\\int_0^1\\frac{1-x^2}{(x^2+1)\\sqrt{x^4+x^2+1}}\\,dx$ を求めよ。',
        '(5)　定積分 $\\displaystyle\\int_0^1\\frac{1-x^2}{(x^2+1)\\sqrt{x^4-x^2+1}}\\,dx$ を求めよ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
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
      { clear: true, part: '(1)', say: '(1) です。直角をはさむ 2 辺がわかっているので、三平方の定理で斜辺 PR を求めます。根号の中がきれいな 2 乗になるかがカギです。',
        add: [{ t: 'h', text: '(1)　斜辺 PR と tan θ, sin θ' },
          { t: 'm', tex: '\\mathrm{PR}^2=x^2+\\big(\\sqrt{x^4+x^2+1}\\big)^2=x^4+2x^2+1' },
          T1('t1')] },
      { ask: { type: 'choice', q: '斜辺 PR の長さは？',
        opts: ['$x^2+x+1$', '$x^2+1$', '$x^2+2$', '$x^2+x$'], ok: 1,
        why: { 0: '$(x^2+x+1)^2=x^4+2x^3+3x^2+2x+1$ で、$x^3$ の項が出てしまいます。', 2: '$(x^2+2)^2=x^4+4x^2+4$ で、合いません。', 3: '$(x^2+x)^2=x^4+2x^3+x^2$ で、合いません。' },
        good: '$x^4+2x^2+1=(x^2+1)^2$ なので $\\mathrm{PR}=x^2+1$。斜辺が根号なしで書けるのが、この問題のしかけです。',
        add: [{ t: 'm', tex: '\\mathrm{PR}=x^2+1' }],
        draw: [{ fig: 't1', items: [{ k: 'label', at: [S3 / 2, 0.5], text: '= x² + 1', dx: -48, dy: 14, c: 'y', size: 22, anchor: 'end' }] }] } },
      { say: '角 $\\theta$ の向かいの辺が QR、となりの辺が PQ、斜辺が PR です。$\\tan\\theta$ はちょうど $f(x)$ になります。',
        add: [{ t: 'ans', label: '(1) 答', text: '$\\mathrm{PR}=x^2+1$\n$\\tan\\theta(x)=\\dfrac{x}{\\sqrt{x^4+x^2+1}}=f(x)$，$\\sin\\theta(x)=\\dfrac{x}{x^2+1}$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$f(x)=x(x^4+x^2+1)^{-\\frac12}$ と見て、積の微分と合成関数の微分を使います。',
        add: [{ t: 'h', text: '(2)　f(x) の極値' },
          { t: 'm', size: 'sm', tex: "f'(x)=\\frac{(x^4+x^2+1)-x\\cdot\\frac12(4x^3+2x)}{(x^4+x^2+1)\\sqrt{x^4+x^2+1}}" },
          graph('g1')] },
      { ask: { type: 'choice', q: "$f'(x)=\\dfrac{\\boxed{\\phantom{0}}}{(x^4+x^2+1)\\sqrt{x^4+x^2+1}}$ の分子は？",
        opts: ['$1-3x^4-x^2$', '$1+x^4$', '$x^4-1$', '$1-x^4$'], ok: 3,
        why: { 0: '$\\sqrt{x^4+x^2+1}$ の微分 $\\dfrac{4x^3+2x}{2\\sqrt{\\ }}$ の $\\dfrac12$ を忘れています。', 1: '$x\\cdot\\frac12(4x^3+2x)=2x^4+x^2$ は引く項です。$+x^4$ ではなく $-x^4$ が残ります。', 2: '引く順が逆です。符号が反対になり、増減が逆になります。' },
        good: '$x^4+x^2+1-2x^4-x^2=1-x^4=(1-x^2)(1+x^2)$。符号は $1-x^2$ で決まります。',
        add: [{ t: 'm', size: 'sm', tex: "f'(x)=\\frac{(1-x^2)(1+x^2)}{(x^4+x^2+1)\\sqrt{x^4+x^2+1}}" }] } },
      { say: '$0<x<1$ で増加、$x>1$ で減少。$f(1)=\\dfrac{1}{\\sqrt3}$。$\\tan\\theta=\\dfrac{1}{\\sqrt3}$ なので、このとき $\\theta=\\dfrac{\\pi}{6}$（$30^\\circ$ の直角三角形）です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$x$', '$(0)$', '$\\cdots$', '$1$', '$\\cdots$'], ["$f'(x)$", '', '$+$', '$0$', '$-$'], ['$f(x)$', '$(0)$', '$\\nearrow$', '$\\frac{1}{\\sqrt3}$', '$\\searrow$']] },
          { t: 'ans', label: '(2) 答', text: '$x=1$ のとき 極大値 $\\dfrac{1}{\\sqrt3}$（極小値はない）' }],
        draw: [{ fig: 'g1', items: [{ k: 'pt', at: [1, 1 / S3], name: '(1, 1/√3)', dir: 'ne', c: 'p', size: 21 }, { k: 'seg', a: [1, 0], b: [1, 1 / S3], c: 'p', wd: 1.5, dash: true }] }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: "(3) です。今回は斜辺が整式なので、$\\sin\\theta(x)=\\dfrac{x}{x^2+1}$ の両辺を $x$ で微分します。左辺は合成関数の微分で、$\\theta'(x)$ が出てきます。",
        add: [{ t: 'h', text: "(3)　θ'(x) を求める" },
          { t: 'm', tex: '\\sin\\theta(x)=\\frac{x}{x^2+1}', note: '両辺を $x$ で微分' },
          T2('t2')] },
      { ask: { type: 'choice', q: "$\\cos\\theta\\cdot\\theta'(x)=\\left(\\dfrac{x}{x^2+1}\\right)'$ の右辺は？",
        opts: ['$\\dfrac{3x^2+1}{(x^2+1)^2}$', '$\\dfrac{1-x^2}{x^2+1}$', '$\\dfrac{1-x^2}{(x^2+1)^2}$', '$\\dfrac{2x}{(x^2+1)^2}$'], ok: 2,
        why: { 0: '商の微分は「分子の微分 × 分母 − 分子 × 分母の微分」。$-x\\cdot2x$ の符号を逆にしています。', 1: '分母は 2 乗になります。$(x^2+1)^2$ です。', 3: '分子は $1\\cdot(x^2+1)-x\\cdot2x$。$2x$ だけではありません。' },
        good: '$\\dfrac{(x^2+1)-x\\cdot2x}{(x^2+1)^2}=\\dfrac{1-x^2}{(x^2+1)^2}$。$\\cos\\theta=\\dfrac{\\sqrt{x^4+x^2+1}}{x^2+1}$ で割ります。',
        add: [{ t: 'm', tex: "\\cos\\theta\\cdot\\theta'=\\frac{1-x^2}{(x^2+1)^2}", note: '$\\cos\\theta=\\dfrac{\\mathrm{PQ}}{\\mathrm{PR}}$' }] } },
      { say: "$\\cos\\theta=\\dfrac{\\sqrt{x^4+x^2+1}}{x^2+1}$ で割ると、$(x^2+1)$ が 1 つ約分できて、(4) の被積分関数がそのまま出てきます。",
        add: [{ t: 'm', size: 'sm', tex: "\\theta'(x)=\\frac{1-x^2}{(x^2+1)^2}\\cdot\\frac{x^2+1}{\\sqrt{x^4+x^2+1}}" },
          { t: 'ans', label: '(3) 答', tex: "\\theta'(x)=\\frac{1-x^2}{(x^2+1)\\sqrt{x^4+x^2+1}}" }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.6, 0.4], part: '(4)', say: "(4) の被積分関数は、(3) の $\\theta'(x)$ そのものです。だから、原始関数は $\\theta(x)$。定積分は角の差になります。",
        add: [{ t: 'h', text: '(4)　定積分は「角の差」' },
          { t: 'm', size: 'sm', tex: "\\int_0^1\\frac{1-x^2}{(x^2+1)\\sqrt{x^4+x^2+1}}\\,dx=\\int_0^1\\theta'(x)\\,dx" },
          { t: 'm', tex: '=\\theta(1)-\\theta(0)', note: '$x\\to+0$ で\n$\\theta\\to0$' },
          { t: 'p', size: 'sm', text: '(2) より $\\tan\\theta(1)=\\dfrac{1}{\\sqrt3}$' }] },
      { ask: { type: 'choice', q: '$\\theta(1)$ は？（$\\tan\\theta(1)=\\dfrac{1}{\\sqrt3}$，$\\sin\\theta(1)=\\dfrac12$）',
        opts: ['$\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{12}$'], ok: 0,
        why: { 1: '$\\tan\\dfrac{\\pi}{3}=\\sqrt3$。$\\dfrac{1}{\\sqrt3}$ になるのは $\\dfrac{\\pi}{6}$ です。', 2: '$\\tan\\dfrac{\\pi}{4}=1$ です。', 3: '$\\sin\\theta=\\dfrac12$ となる角を思い出しましょう。' },
        good: '$x=1$ では三角形の辺が $1,\\ \\sqrt3,\\ 2$。$30^\\circ$ の直角三角形で、$\\theta(1)=\\dfrac{\\pi}{6}$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin\\theta(1)=\\frac{1}{1+1}=\\frac12\\quad\\therefore\\ \\theta(1)=\\frac{\\pi}{6}' }] } },
      { say: '下端は $x\\to+0$ で三角形がつぶれて $\\theta\\to0$ です（被積分関数は $x=0$ でも連続なので、そのまま 0 から積分してよい）。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\theta(1)-\\theta(0)=\\frac{\\pi}{6}-0=\\frac{\\pi}{6}' }] },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) には誘導がありません。(4) と形が似ていますが、根号の中が $x^4-x^2+1$。そこで「斜辺 $x^2+1$、1 辺 $\\sqrt{x^4-x^2+1}$」の直角三角形を作れないか考えます。',
        add: [{ t: 'h', text: '(5)　三角形を自分で作る' },
          { t: 'm', tex: '(x^2+1)^2-\\big(\\sqrt{x^4-x^2+1}\\big)^2=\\ \\boxed{\\phantom{00}}', note: '残りの辺の 2 乗' },
          tri('t3', 1.2, 2.0, ['?', '√(x⁴−x²+1)', 'x² + 1', 'φ'], null, 430)] },
      { ask: { type: 'choice', q: '残りの辺（$\\varphi$ の向かいの辺）の長さは？',
        opts: ['$3x$', '$x$', '$\\sqrt3\\,x$', '$\\sqrt3\\,x^2$'], ok: 2,
        why: { 0: '$(x^2+1)^2-(x^4-x^2+1)=3x^2$。その平方根は $3x$ ではありません。', 1: '$x^2$ ではなく $3x^2$ が残ります。', 3: '$\\sqrt{3x^2}=\\sqrt3\\,x$。$x^2$ ではありません。' },
        good: '$(x^2+1)^2-(x^4-x^2+1)=3x^2$ なので $\\sqrt3\\,x$。$\\sin\\varphi=\\dfrac{\\sqrt3\\,x}{x^2+1}$ となる角 $\\varphi(x)$ を考えます。',
        add: [{ t: 'm', size: 'sm', tex: '\\sin\\varphi(x)=\\frac{\\sqrt3\\,x}{x^2+1}\\quad\\Big(0\\le\\varphi<\\frac{\\pi}{2},\\ \\varphi(0)=0\\Big)' }],
        draw: [{ fig: 't3', items: [{ k: 'label', at: [1.2, 1.0], text: '= √3 x', dx: 32, c: 'g', size: 22, anchor: 'start' }] }] } },
      { say: "$\\sin$ を微分します。$\\cos\\varphi\\cdot\\varphi'(x)=\\dfrac{\\sqrt3(1-x^2)}{(x^2+1)^2}$、$\\cos\\varphi=\\dfrac{\\sqrt{x^4-x^2+1}}{x^2+1}$ で割ると、ねらいの形が出ます。",
        add: [{ t: 'm', size: 'sm', tex: "\\varphi'(x)=\\frac{\\sqrt3(1-x^2)}{(x^2+1)\\sqrt{x^4-x^2+1}}", note: '被積分関数の\n$\\sqrt3$ 倍' }] },
      { ask: { type: 'think', q: '$\\varphi(1)$ を求めて、(5) の定積分の値を出そう。',
        hint: '$\\sin\\varphi(1)=\\dfrac{\\sqrt3}{2}$。被積分関数は $\\dfrac{1}{\\sqrt3}\\varphi\'(x)$。',
        ans: '$\\varphi(1)=\\dfrac{\\pi}{3}$ より　$\\dfrac{1}{\\sqrt3}\\Big\\{\\varphi(1)-\\varphi(0)\\Big\\}=\\dfrac{1}{\\sqrt3}\\cdot\\dfrac{\\pi}{3}=\\dfrac{\\sqrt3}{9}\\pi$',
        after: '$x=1$ のとき三角形の辺は $1,\\ \\sqrt3,\\ 2$ の $60^\\circ$ の直角三角形。$\\cos\\varphi=\\dfrac12>0$ なので $\\varphi=\\dfrac{\\pi}{3}$ と決まります。',
        add: [{ t: 'ans', label: '(5) 答', tex: '\\frac{1}{\\sqrt3}\\Big(\\frac{\\pi}{3}-0\\Big)=\\frac{\\sqrt3}{9}\\pi' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: '(2) のグラフを見ると、$x=\\dfrac12$ と $x=2$ で高さが同じです。実は $f\\Big(\\dfrac1x\\Big)=f(x)$ になっています。',
        add: [{ t: 'h', text: '別の見方：f(1/x) = f(x)' },
          { t: 'm', size: 'sm', tex: 'f\\Big(\\frac1x\\Big)=\\frac{\\frac1x}{\\sqrt{\\frac{1}{x^4}+\\frac{1}{x^2}+1}}=\\frac{x}{\\sqrt{x^4+x^2+1}}=f(x)' },
          graph('g2')] },
      { ask: { type: 'think', q: '(4) と同じ被積分関数で、区間を $\\dfrac12\\le x\\le2$ にした定積分の値は？',
        hint: '$f(\\tfrac12)$ と $f(2)$ を比べる。$\\tan\\theta$ が同じなら $\\theta$ も同じ。',
        ans: '$f(\\tfrac12)=f(2)=\\dfrac{2}{\\sqrt{21}}$ なので $\\theta(\\tfrac12)=\\theta(2)$。定積分は $\\theta(2)-\\theta(\\tfrac12)=0$',
        after: '被積分関数は $x=1$ の前後で符号が変わり、正の部分と負の部分がちょうど打ち消し合います。',
        draw: [{ fig: 'g2', items: [{ k: 'pt', at: [0.5, 2 / Math.sqrt(21)], c: 'b' }, { k: 'pt', at: [2, 2 / Math.sqrt(21)], c: 'b' }, { k: 'seg', a: [0.5, 2 / Math.sqrt(21)], b: [2, 2 / Math.sqrt(21)], c: 'b', wd: 2, dash: true }] }] } },
      { say: '答案では、(5) で作った角 $\\varphi(x)$ を「$0\\le\\varphi<\\dfrac{\\pi}{2}$ で $\\sin\\varphi=\\cdots$ をみたす角」とはっきり定義してから微分するのが大事です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: "・(3) の $\\cos\\theta$ は三角形の辺の比で書く\n・(5) は $\\varphi(x)$ の定義・$\\varphi'(x)$ の計算・$\\varphi(0)=0,\\ \\varphi(1)=\\dfrac{\\pi}{3}$ を順に書く" }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。三平方の定理で「斜辺が整式になる三角形」を見つけると、むずかしそうな積分が角の差で求まりました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
