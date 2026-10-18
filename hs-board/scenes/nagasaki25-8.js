/* 長崎大型 数学（理系）：2025年度 長崎大学 前期 医学部医学科（型Ⅳ）第8問の類題（自作問題・元の問題ではない）
   小問集合：(1) 底のちがう2つの対数の和の最小値（3次式の最大）　(2) 特性方程式が重解の隣接3項間漸化式（誘導つき）
             (3) 選択 (A) 同次式をみたす2つの複素数と三角形の形　(B) 2次式の確率密度関数
   答え（python3・sympy で検算ずみ）：
     (1) f(x)=log_{1/2}{(x−1)(7−x)²}（1<x<7）、g'=3(x−3)(x−7)、g(3)=32 → x=3 で最小値 −5（最大値はない）
     (2) 特性方程式 4x²−4x+1=0（重解 1/2）。b_n=a_{n+1}−a_n/2=3/2ⁿ、c_n=2ⁿa_n=6n−4、a_n=(3n−2)/2^{n−1}
         a_{n+1}−a_n=(5−3n)/2ⁿ → 最大は a_2=2
     (A) u=β/α：u²−2u+2=0、u=1±i=√2{cos(±π/4)+i sin(±π/4)}、(β−α)/(0−α)=∓i → ∠OAB=90°、OA=AB の直角二等辺三角形
     (B) ∫₀³(3−x)(x+2)dx=27/2 → k=2/27。P(0≦X≦t)=(−2t³+3t²+36t)/81。
         条件 ⇔ P(0≦X≦t)=2/3 ⇔ (2t−3)(t²−18)=0 → 0<t<3 より t=3/2 */
(function () {
  const POINTS = [
    '対数は **真数条件** を先に書き、底をそろえて1つの対数にまとめる。底が $\\frac12$（1より小さい）なら、真数が最大のとき対数は **最小**',
    '特性方程式が重解 $p$ の漸化式は、$a_{n+1}-pa_n$（公比 $p$ の等比数列）→ $\\dfrac{a_n}{p^n}$（等差数列）の順にほどく',
    '同次式は $\\alpha^2$ で割って比 $\\dfrac{\\beta}{\\alpha}$ の方程式に。確率密度関数は「全体の面積 $=1$」と「残りの確率 $=1-$ 左の部分」'
  ];
  // (1) g(x)=(x−1)(7−x)² のグラフ
  const G = '(x-1)*(7-x)**2';
  const gfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.5, -5, 7.8, 38], w: 520, h: 330, items: [
    { k: 'axes', tx: [[1, '1'], [3, '3'], [7, '7']], ty: [[32, '32']], xl: 'x', yl: 'y' },
    { k: 'fn', f: G, a: 1, b: 7, c: 'w', wd: 3 },
    { k: 'pt', at: [1, 0], open: true, c: 'w' }, { k: 'pt', at: [7, 0], open: true, c: 'w' },
    { k: 'label', at: [5.5, 27], text: 'y = g(x)', c: 'w', size: 22 }].concat(extra || []) });
  // (A) 複素数平面：α=1.5+0.5i、β=(1+i)α=1+2i、もう1つ (1−i)α=2−i
  const A = [1.5, 0.5], B = [1, 2], B2 = [2, -1];
  const cfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.7, -1.6, 2.9, 2.5], w: 430, h: 490, items: [
    { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[1, 'i'], [2, '2i']], xl: '実軸', yl: '虚軸' },
    { k: 'poly', pts: [[0, 0], A, B], close: true, c: 'y', wd: 3, fill: 'y', alpha: 0.12 },
    { k: 'pt', at: A, name: 'A(α)', dir: 'e', c: 'y', size: 22 }, { k: 'pt', at: B, name: 'B(β)', dir: 'n', c: 'y', size: 22 }].concat(extra || []) });
  // (B) 確率密度関数 f(x)=(2/27)(3−x)(x+2)
  const PDF = '2/27*(3-x)*(x+2)';
  const pfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.45, -0.09, 3.55, 0.62], w: 560, h: 380, items: [
    { k: 'axes', tx: [[1.5, 't'], [3, '3']], ty: [[4 / 9, '4/9']], xl: 'x', yl: 'y' }].concat(extra || [], [
    { k: 'fn', f: PDF, a: 0, b: 3, c: 'w', wd: 3 },
    { k: 'seg', a: [0, 0], b: [0, 4 / 9], c: 'w', wd: 3 },
    { k: 'label', at: [2.55, 0.42], text: 'y = f(x)', c: 'w', size: 22 }]) });

  HB.lesson({
    id: 'nagasaki25-8', field: '長崎大型　数学（理系）', title: '2025 長崎大 理系 第8問の類題 ― 底のちがう対数・重解の漸化式・選択（複素数／確率密度）', level: '2025年度 長崎大学 理系 第8問の類題（自作）', time: '目安 20〜25分', noDec: true,
    problem: {
      label: '類題',
      lead: '次の (1)〜(3) に答えよ。ただし (3) は (A)，(B) のどちらか一方を選んで答えよ。',
      parts: [
        '(1)　関数 $f(x)=\\log_{\\frac12}(x-1)+4\\log_{\\frac14}(7-x)$ の最小値と、そのときの $x$ の値を求めよ。',
        '(2)　数列 $\\{a_n\\}$ は $a_1=1,\\ a_2=2,\\ 4a_{n+2}=4a_{n+1}-a_n\\ (n=1,2,3,\\cdots)$ を満たす。\n(i)　$b_n=a_{n+1}-\\dfrac12a_n$ とおく。$b_n$ を $n$ の式で表せ。\n(ii)　$c_n=2^na_n$ とおく。$c_n$ を $n$ の式で表せ。\n(iii)　一般項 $a_n$ を求めよ。',
        '(3)(A)　0 でない複素数 $\\alpha,\\ \\beta$ が $2\\alpha^2-2\\alpha\\beta+\\beta^2=0$ を満たす。\n(i)　$\\dfrac{\\beta}{\\alpha}$ を極形式で表せ。ただし偏角 $\\theta$ は $-\\pi<\\theta\\le\\pi$ とする。\n(ii)　複素数平面上の 3 点 O$(0)$，A$(\\alpha)$，B$(\\beta)$ を頂点とする三角形 OAB はどのような三角形か。',
        '(3)(B)　確率変数 $X$ の確率密度関数が $f(x)=k(3-x)(x+2)\\ \\ (0\\le x\\le3)$ である（$k$ は定数）。\n(i)　$k$ の値を求めよ。\n(ii)　$0<t<3$ のとき、$P(0\\le X\\le t)$ を $t$ の式で表せ。\n(iii)　$P(0\\le X\\le t)=2P(t\\le X\\le3)$ となる $t$ の値を求めよ。'
      ],
      src: '※ 2025年度 長崎大学 前期 理系（医学部医学科）第8問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '小問集合です。対数、漸化式、そして (3) は複素数平面か確率密度関数のどちらかを選びます。1問 5〜7 分で、確実に点にしたい問題です。問題文は Q キーで。',
        add: [{ t: 'h', text: '類題（第8問）　小問集合' },
          { t: 'box', c: 'y', label: '内容', text: '(1)　底のちがう2つの対数の和の **最小値**\n(2)　重解型の隣接3項間の漸化式（誘導つき）\n(3)　(A) 複素数平面 または (B) 確率密度関数' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: 'どれも典型。**条件の書きもらし**（真数条件・$t$ の範囲）で落とさないことが大事' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1)。対数の問題は、まず **真数条件**。$x-1>0$ かつ $7-x>0$ から、$1<x<7$ です。',
        add: [{ t: 'h', text: '(1)　対数の和の最小値' },
          { t: 'box', c: 'b', size: 'sm', label: '問題', text: '$f(x)=\\log_{\\frac12}(x-1)+4\\log_{\\frac14}(7-x)$' },
          { t: 'm', tex: '1<x<7', note: '真数条件' }] },
      { ask: { type: 'choice', q: '底を $\\frac12$ にそろえると、$4\\log_{\\frac14}(7-x)$ は？',
        opts: ['$8\\log_{\\frac12}(7-x)$', '$\\log_{\\frac12}(7-x)$', '$2\\log_{\\frac12}(7-x)$', '$-2\\log_{\\frac12}(7-x)$'], ok: 2,
        why: { 0: '$\\log_{\\frac12}\\frac14=2$ で **割る** のです。かけると 8 になってしまいます。', 1: '係数は $4\\times\\frac12=2$。1 にはなりません。', 3: '$\\log_{\\frac12}\\frac14=2$ は正。$\\left(\\frac12\\right)^2=\\frac14$ です。' },
        good: '底の変換公式で $\\log_{\\frac14}(7-x)=\\dfrac{\\log_{\\frac12}(7-x)}{\\log_{\\frac12}\\frac14}=\\dfrac12\\log_{\\frac12}(7-x)$。',
        add: [{ t: 'm', size: 'sm', tex: 'f(x)=\\log_{\\frac12}(x-1)+2\\log_{\\frac12}(7-x)=\\log_{\\frac12}\\hy{(x-1)(7-x)^2}' }] } },
      { say: '真数を $g(x)=(x-1)(7-x)^2$ とおきます。底 $\\frac12$ は 1 より小さいので、$\\log_{\\frac12}$ は減少関数。**$g(x)$ が最大のとき $f(x)$ は最小** です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '向きに注意', text: '底 $\\frac12<1$ → $g(x)$ が大きいほど $f(x)$ は小さい\n$f$ の最小 ⇔ $g$ の最大' }] },
      { say: '$g(x)$ を微分します。$7-x$ でくくると $g\'(x)=3(x-3)(x-7)$。$1<x<7$ では、$x=3$ で増加から減少に変わります。',
        add: [{ t: 'm', size: 'sm', tex: "g'(x)=(7-x)^2-2(x-1)(7-x)=3(x-3)(x-7)" },
          { t: 'tbl', col: 1, size: 'sm', rows: [['$x$', '$(1)$', '$\\cdots$', '$3$', '$\\cdots$', '$(7)$'], ["$g'(x)$", '', '$+$', '$0$', '$-$', ''], ['$g(x)$', '$(0)$', '$\\nearrow$', '$32$', '$\\searrow$', '$(0)$']] },
          gfig('g1', [{ k: 'pt', at: [3, 32], c: 'y' }, { k: 'seg', a: [3, 0], b: [3, 32], c: 'y', dash: true, wd: 2 }])] },
      { say: '$g(x)$ の最大値は $g(3)=2\\cdot16=32$。$f$ の最小値は $\\log_{\\frac12}32=-5$ です。なお $x\\to1,\\ 7$ で $g\\to0$、$f\\to\\infty$ なので、最大値はありません。',
        add: [{ t: 'ans', label: '(1) 答', text: '$x=3$ のとき 最小値 $-5$' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '(2)。$a_{n+2},\\ a_{n+1},\\ a_n$ の3項の漸化式です。特性方程式 $4x^2-4x+1=0$ は $(2x-1)^2=0$ で、**重解** $\\frac12$。誘導の $\\frac12$ はここから来ています。',
        add: [{ t: 'h', text: '(2)　重解型の隣接3項間の漸化式' },
          { t: 'box', c: 'b', size: 'sm', label: '問題', text: '$a_1=1,\\ a_2=2,\\ 4a_{n+2}=4a_{n+1}-a_n$' },
          { t: 'm', size: 'sm', tex: '4x^2-4x+1=0\\iff x=\\frac12\\ (\\text{重解})' },
          { t: 'box', c: 'y', size: 'sm', col: 1, label: '誘導の意味', text: '$b_n=a_{n+1}-\\frac12a_n$\n→ 公比 $\\frac12$ の等比数列\n\n$c_n=2^na_n=\\dfrac{a_n}{(1/2)^n}$\n→ 等差数列' }] },
      { say: '漸化式を $a_{n+2}=a_{n+1}-\\frac14a_n$ と書いて、$b_{n+1}$ を計算します。$\\frac12$ でくくると $b_n$ が出てきます。',
        add: [{ t: 'm', size: 'sm', tex: 'b_{n+1}=a_{n+2}-\\frac12a_{n+1}=\\frac12a_{n+1}-\\frac14a_n=\\frac12b_n' }] },
      { ask: { type: 'choice', q: '$b_n$ を $n$ の式で表すと？',
        opts: ['$\\dfrac{3}{2^n}$', '$\\dfrac{3}{2^{n-1}}$', '$\\dfrac{3}{2}\\cdot2^{n-1}$', '$\\dfrac{1}{2^n}$'], ok: 0,
        why: { 1: '初項は $b_1=\\frac32$。$\\frac32\\left(\\frac12\\right)^{n-1}=\\frac{3}{2^n}$ です。', 2: '公比は $\\frac12$。2 倍ずつではありません。', 3: '$b_1=a_2-\\frac12a_1=2-\\frac12=\\frac32$ です。' },
        good: '初項 $b_1=2-\\frac12=\\frac32$、公比 $\\frac12$ の等比数列です。',
        add: [{ t: 'm', size: 'sm', tex: 'b_n=\\frac32\\Big(\\frac12\\Big)^{n-1}=\\frac{3}{2^n}' }] } },
      { say: '次は $c_n=2^na_n$。差をとると、$2^{n+1}$ でくくれて $b_n$ が現れます。$2^{n+1}\\cdot\\frac{3}{2^n}=6$ で、**$n$ によらない一定の数**。',
        add: [{ t: 'm', size: 'sm', tex: 'c_{n+1}-c_n=2^{n+1}\\Big(a_{n+1}-\\frac12a_n\\Big)=2^{n+1}b_n=6' }] },
      { ask: { type: 'choice', q: '$c_n$ を $n$ の式で表すと？',
        opts: ['$6n-5$', '$6n+2$', '$2\\cdot6^{n-1}$', '$6n-4$'], ok: 3,
        why: { 0: '初項は $c_1=2^1a_1=2$。$a_1=1$ をそのまま初項にしています。', 1: '$2+6n$ ではなく $2+6(n-1)$。項数の数え方がずれています。', 2: '差が一定（6）なので等差数列。比が一定ではありません。' },
        good: '初項 $c_1=2a_1=2$、公差 6 の等差数列：$c_n=2+6(n-1)=6n-4$。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'c_n=6n-4,\\quad a_n=\\frac{c_n}{2^n}=\\frac{3n-2}{2^{n-1}}' }] } },
      { ask: { type: 'think', q: '検算もかねて：$a_n$ が最大になるのは $n$ がいくつのときか。$a_{n+1}-a_n$ の符号を調べよう。',
        hint: '$a_{n+1}=\\dfrac{3n+1}{2^n}$。分母を $2^n$ にそろえて引く。',
        ans: '$a_{n+1}-a_n=\\dfrac{(3n+1)-2(3n-2)}{2^n}=\\dfrac{5-3n}{2^n}$。$n=1$ で正、$n\\ge2$ で負なので、最大は $a_2=2$',
        after: '$a_3=\\frac74$ は漸化式 $4a_3=4a_2-a_1=7$ からも出ます。一般項は小さい $n$ で必ず確かめましょう。' } },

      // ---------- (3)(A) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)(A)', say: '(3)(A)。$2\\alpha^2-2\\alpha\\beta+\\beta^2$ は、どの項も2次の **同次式**。$\\alpha^2$ で割ると、比 $u=\\frac{\\beta}{\\alpha}$ だけの方程式になります。',
        add: [{ t: 'h', text: '(3)(A)　同次式と三角形の形' },
          { t: 'box', c: 'b', size: 'sm', label: '問題', text: '$2\\alpha^2-2\\alpha\\beta+\\beta^2=0\\quad(\\alpha,\\ \\beta\\neq0)$' },
          { t: 'm', size: 'sm', tex: 'u^2-2u+2=0\\quad\\Big(u=\\frac{\\beta}{\\alpha}\\Big)', note: '両辺を $\\alpha^2$ で割る' },
          { t: 'm', size: 'sm', tex: 'u=1\\pm i' }] },
      { say: '$|1\\pm i|=\\sqrt2$、偏角は $\\pm\\frac{\\pi}{4}$。つまり $\\beta$ は、$\\alpha$ を **$\\sqrt2$ 倍して $\\frac{\\pi}{4}$ だけ回転**（または $-\\frac{\\pi}{4}$）した点です。',
        add: [{ t: 'ans', label: '(i) 答', tex: '\\frac{\\beta}{\\alpha}=\\sqrt2\\Big\\{\\cos\\Big(\\pm\\frac{\\pi}{4}\\Big)+i\\sin\\Big(\\pm\\frac{\\pi}{4}\\Big)\\Big\\}' },
          cfig('a1', [{ k: 'poly', pts: [[0, 0], A, B2], close: true, c: 'b', wd: 2, dash: true }, { k: 'pt', at: B2, name: 'β = (1−i)α の場合', dir: 'se', c: 'b', size: 19 },
            { k: 'angle', o: [0, 0], a: A, b: B, rp: 40, label: 'π/4', c: 'y', lr: 26 }])] },
      { ask: { type: 'choice', q: '三角形 OAB はどんな三角形？',
        opts: ['正三角形', '$\\angle\\mathrm{AOB}=90^\\circ$ の直角二等辺三角形', 'OA $=$ OB の二等辺三角形', '$\\angle\\mathrm{OAB}=90^\\circ$ の直角二等辺三角形'], ok: 3,
        why: { 0: '正三角形になるのは、比が $\\cos(\\pm\\frac{\\pi}{3})+i\\sin(\\pm\\frac{\\pi}{3})$ のときです。', 1: '$\\angle\\mathrm{AOB}=\\frac{\\pi}{4}$ です。直角になるのは A の所。', 2: 'OB $=\\sqrt2$ OA なので、OA と OB は等しくありません。' },
        good: '$\\dfrac{\\beta-\\alpha}{0-\\alpha}=1-u=\\mp i$。A のまわりで AO を $\\pm90^\\circ$ 回すと AB、長さも同じです。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\beta-\\alpha}{0-\\alpha}=1-u=\\mp i', note: 'AB ⊥ AO、AB = AO' },
          { t: 'ans', label: '(ii) 答', text: '$\\angle\\mathrm{OAB}=90^\\circ$ の直角二等辺三角形' }],
        draw: [{ fig: 'a1', items: [{ k: 'right', o: A, a: [0, 0], b: B, s: 18, c: 'p' }] }] } },

      // ---------- (3)(B) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)(B)', say: '(3)(B)。確率密度関数は、グラフと $x$ 軸の間の **面積が確率**。まず、全体の面積が 1 になるように $k$ を決めます。',
        add: [{ t: 'h', text: '(3)(B)　確率密度関数' },
          { t: 'box', c: 'b', size: 'sm', label: '問題', text: '$f(x)=k(3-x)(x+2)\\ \\ (0\\le x\\le3)$' },
          { t: 'm', size: 'sm', tex: '\\int_0^3(3-x)(x+2)\\,dx=\\int_0^3(-x^2+x+6)\\,dx=\\frac{27}{2}' },
          pfig('p1', [{ k: 'area', f: PDF, a: 0, b: 3, c: 'y', alpha: 0.2 }])] },
      { ask: { type: 'choice', q: '$k$ の値は？',
        opts: ['$\\dfrac{27}{2}$', '$\\dfrac{2}{27}$', '$\\dfrac{1}{27}$', '$\\dfrac{1}{18}$'], ok: 1,
        why: { 0: 'それは $k$ をかける前の面積です。$k\\cdot\\frac{27}{2}=1$ を解きます。', 2: '$\\frac{27}{2}$ の分母の 2 を落としています。', 3: '$x$ の原始関数は $\\frac{x^2}{2}$。2 で割り忘れると面積が 18 になります。' },
        good: '$k\\cdot\\dfrac{27}{2}=1$ より $k=\\dfrac{2}{27}$。',
        add: [{ t: 'm', size: 'sm', tex: 'P(0\\le X\\le t)=\\frac{2}{27}\\Big[-\\frac{x^3}{3}+\\frac{x^2}{2}+6x\\Big]_0^t=\\frac{-2t^3+3t^2+36t}{81}' }] } },
      { ask: { type: 'choice', q: '条件 $P(0\\le X\\le t)=2P(t\\le X\\le3)$ を言いかえると？',
        opts: ['$P(0\\le X\\le t)=\\dfrac12$', '$P(0\\le X\\le t)=\\dfrac13$', '$P(0\\le X\\le t)=2$', '$P(0\\le X\\le t)=\\dfrac23$'], ok: 3,
        why: { 0: '2 倍なので、全体 1 を $2:1$ に分けます。半分ずつではありません。', 1: '逆です。$P(t\\le X\\le3)$ のほうが $\\frac13$。', 2: '確率は 1 をこえません。$P(t\\le X\\le3)=1-P(0\\le X\\le t)$ を使います。' },
        good: '$p=P(0\\le X\\le t)$ とおくと $p=2(1-p)$、よって $p=\\dfrac23$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{-2t^3+3t^2+36t}{81}=\\frac23\\iff 2t^3-3t^2-36t+54=0' }],
        draw: [{ fig: 'p1', items: [{ k: 'area', f: PDF, a: 0, b: 1.5, c: 'p', alpha: 0.35 }, { k: 'seg', a: [1.5, 0], b: [1.5, 2 / 27 * 1.5 * 3.5], c: 'p', wd: 2 },
          { k: 'label', at: [0.72, 0.2], text: '2/3', c: 'p', size: 26 }, { k: 'label', at: [2.05, 0.13], text: '1/3', c: 'y', size: 26 }] }] } },
      { ask: { type: 'think', q: '3次方程式 $2t^3-3t^2-36t+54=0$ を解き、$0<t<3$ の解を選ぼう。',
        hint: '定数項 54 と最高次の係数 2 から、$t=\\dfrac32$ を代入してみる（因数定理）。',
        ans: '$(2t-3)(t^2-18)=0$ より $t=\\dfrac32,\\ \\pm3\\sqrt2$。$3\\sqrt2>3$ なので $t=\\dfrac32$',
        after: '$\\pm3\\sqrt2$ は $0<t<3$ の外。範囲を確かめて捨てるところまで書くのが答案です。',
        add: [{ t: 'ans', label: '(B) 答', text: '(i) $k=\\dfrac{2}{27}$　(iii) $t=\\dfrac32$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。小問集合は「典型の手順」と「条件の書きもらしがないこと」で差がつきます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、(3) は (A)(B) の両方をノートで解いてみましょう。' }
    ]
  });
})();
