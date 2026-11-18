/* 2025 慶應 理工 第4問の類題（自作）：定積分と不等式・和の評価（空欄＋証明）
   元の問題はうつしていない（分野・ねらい・形式だけを合わせた自作問題）。答えは python3（sympy・mpmath の数値積分）で検算ずみ。
   (1) ∫₁^R x^(−4/3) dx = 3 − 3R^(−1/3) → ア 3
   (2) k≧2：k^(−4/3) < ∫_{k−1}^k x^(−4/3) dx → Σ_{k=1}^n k^(−4/3) < 1 + 3(1 − n^(−1/3)) < 4（無限和 ζ(4/3)≒3.6009）
   (3) ∫₀^π (π−x) sin kx dx = π/k（部分積分。x=π で π−x=0 なので境界の項が 1 つ消える）→ イ π/k
   (4) ∫₀^π |cos kx| dx = 2（周期 π/k の山が k 個、1 個ぶん 2/k）→ ウ 2
   (5) b_k = (1/k)∫₀^π f'(x) cos kx dx（f(0)=f(π)=0 で境界の項が消える）→ |b_k| ≦ (1/(2k))·2 = 1/k → |b_k|^(4/3) ≦ k^(−4/3) → (2)
   考えてみよう：f(x)=(sin x)/2 は条件を満たし b₁=π/4（≒0.785 ≦ 1）、k≧2 で b_k=0。Σ1/k² < 2 も同じ方法 */
(function () {
  const PI = Math.PI;
  const POINTS = [
    '和 $\\displaystyle\\sum k^{-p}$ は **長方形と曲線の下の面積** でくらべる。減少関数なら $k^{-p}<\\displaystyle\\int_{k-1}^{k}x^{-p}\\,dx$（$k\\ge2$）。$k=1$ の項は別に足す',
    '部分積分では **境界の項** $\\Big[\\ \\cdots\\ \\Big]_0^{\\pi}$ を必ず確かめる。$f(0)=f(\\pi)=0$ のような条件は、境界の項を消すためにある',
    '$|\\int g|\\le\\int|g|$ と $|f\'|\\le\\frac12$ で上からおさえ、$\\int_0^{\\pi}|\\cos kx|\\,dx=2$ を使う。$\\frac1k$ のままでは和が発散するので、$\\frac43$ 乗して (2) へ'
  ];
  const pw = k => Math.pow(k, -4 / 3);
  const sumfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.45, -0.18, 6.5, 1.42], w: 600, h: 300, items: [
    { k: 'axes', tx: [1, 2, 3, 4, 5, 6], ty: [1] },
    { k: 'poly', pts: [[0, 0], [1, 0], [1, 1], [0, 1]], close: true, fill: 'p', alpha: 0.35, c: 'p' },
    { k: 'bars', bins: [[1, 2, pw(2)], [2, 3, pw(3)], [3, 4, pw(4)], [4, 5, pw(5)], [5, 6, pw(6)]], fill: 'b', alpha: 0.4 },
    { k: 'fn', f: 'x**(-4/3)', a: 0.82, b: 6.4, c: 'y', label: 'y=x^(−4/3)', lat: [1.25, 1.2], la: 'start' }].concat(extra || []) });
  const cosfig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.3, -0.3, 3.5, 1.35], w: 560, h: 243, items: [
    { k: 'axes', tx: [[PI / 3, 'π/3'], [2 * PI / 3, '2π/3'], [PI, 'π']], ty: [1] },
    { k: 'area', f: 'abs(cos(3*x))', a: 0, b: PI, c: 'g', alpha: 0.3 },
    { k: 'fn', f: 'abs(cos(3*x))', a: 0, b: PI, c: 'g', label: 'y=|cos 3x|', lat: [2.15, 1.22] }].concat(extra || []) });

  HB.lesson({
    id: 'keio25-4', field: '慶應型　数学（理工）', title: '2025 慶應 理工 第4問の類題 ― 和を積分でおさえる・係数の積分の評価', level: '2025年度 慶應義塾大学 理工学部 第4問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '(1)，(3)，(4) は空欄に適切な数または式を入れ、(2)，(5) は証明せよ。ただし、$k$ は自然数とし、定積分の大小関係と、絶対値についての不等式は、証明なしに用いてよい。',
      parts: [
        '(1)　$\\displaystyle\\lim_{R\\to\\infty}\\int_1^R x^{-\\frac43}\\,dx=\\boxed{\\text{ア}}$ である。',
        '(2)　すべての自然数 $n$ について、$\\displaystyle\\sum_{k=1}^{n}k^{-\\frac43}<4$ が成り立つことを証明せよ。',
        '(3)　$\\displaystyle\\int_0^{\\pi}(\\pi-x)\\sin kx\\,dx=\\boxed{\\text{イ}}$ である。',
        '(4)　$\\displaystyle\\int_0^{\\pi}|\\cos kx|\\,dx=\\boxed{\\text{ウ}}$ である。',
        "(5)　関数 $f(x)$ は $0\\le x\\le\\pi$ で微分可能で $f'(x)$ は連続であり、$f(0)=f(\\pi)=0$ と、$0\\le x\\le\\pi$ で $|f'(x)|\\le\\dfrac12$ を満たすとする。$b_k=\\displaystyle\\int_0^{\\pi}f(x)\\sin kx\\,dx$ とおくとき、すべての自然数 $n$ について $\\displaystyle\\sum_{k=1}^{n}|b_k|^{\\frac43}<4$ が成り立つことを証明せよ。"
      ],
      src: '※ 2025年度 慶應義塾大学 理工学部 一般選抜 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { clear: true, cols: [1], part: '問題', say: '積分で和をおさえる問題です。(1)〜(4) は (5) のための部品。最後に全部がつながります。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.5' }] },
      { clear: true, cols: [1], part: '見通し', say: 'ゴールの (5) を先に見ます。$|b_k|\\le\\frac1k$ が言えれば、$\\frac43$ 乗して (2) が使えます。(3)(4) は、そのための部分積分と絶対値の積分の練習です。',
        add: [{ t: 'h', text: '小問のつながり' },
          { t: 'tbl', size: 'sm', rows: [['小問', '形式', '役割'], ['(1)', '空欄', '$x^{-\\frac43}$ の積分 → (2) で使う'], ['(2)', '証明', '和 $<4$ → (5) の最後で使う'], ['(3)', '空欄', '部分積分と境界の項 → (5) の前半'], ['(4)', '空欄', '$|\\cos kx|$ の積分 → (5) の後半'], ['(5)', '証明', '$|b_k|\\le\\frac1k$ を示して (2) へ']] }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$x^{-\\frac43}$ は「$x^r$ の積分」の公式で積分できます。指数は $-\\frac43+1=-\\frac13$。',
        add: [{ t: 'h', text: '(1)　負の分数乗の積分' },
          sumfig('s1')] },
      { ask: { type: 'choice', q: '$x^{-\\frac43}$ の原始関数は？',
        opts: ['$-\\dfrac37x^{-\\frac73}$', '$3x^{-\\frac13}$', '$-3x^{-\\frac13}$', '$-\\dfrac13x^{-\\frac13}$'], ok: 2,
        why: { 0: 'それは指数を 1 へらしています（微分の向き）。積分は指数を 1 ふやします。', 1: '$-\\frac13$ で割るので符号が負になります。', 3: '$-\\frac13$ で **割る** ところを、かけています。' },
        good: '$\\dfrac{x^{-\\frac13}}{-\\frac13}=-3x^{-\\frac13}$。',
        add: [{ t: 'm', tex: '\\int_1^R x^{-\\frac43}\\,dx=\\Big[-3x^{-\\frac13}\\Big]_1^R=3-\\frac{3}{\\sqrt[3]{R}}' }] } },
      { say: '$R\\to\\infty$ で $\\dfrac{3}{\\sqrt[3]R}\\to0$ なので、極限は 3（ア）。右の図で、$x\\ge1$ の曲線の下の面積は、どこまで行っても 3 をこえません。',
        add: [{ t: 'm', tex: '\\lim_{R\\to\\infty}\\left(3-\\frac{3}{\\sqrt[3]{R}}\\right)=\\ans{3}' },
          { t: 'ans', label: '(1) 答', text: 'ア $3$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は証明です。和は「幅 1 の長方形の面積の合計」と見て、曲線の下の面積とくらべます。',
        add: [{ t: 'h', text: '(2)　和を積分で上からおさえる' },
          { t: 'p', size: 'sm', text: '$k^{-\\frac43}$ ＝ 幅 1・高さ $k^{-\\frac43}$ の長方形の面積' },
          sumfig('s2')] },
      { ask: { type: 'choice', q: '和を **上から** おさえるには、高さ $k^{-\\frac43}$ の長方形をどこに置く？（$k\\ge2$）',
        opts: ['区間 $[k,\\ k+1]$', '区間 $[k-1,\\ k]$', '区間 $[k-1,\\ k+1]$', 'どこでも同じ'], ok: 1,
        why: { 0: '$[k,\\,k+1]$ では長方形が曲線より **上** にはみ出します。これは和を下からおさえる置き方です。', 2: '幅が 2 になり、面積が $k^{-\\frac43}$ になりません。', 3: '置き方で、曲線の上か下かが変わります。' },
        good: '$x^{-\\frac43}$ は減少するので、$[k-1,\\,k]$ では $x^{-\\frac43}\\ge k^{-\\frac43}$。長方形は曲線の **下** におさまります。',
        add: [{ t: 'm', tex: 'k^{-\\frac43}<\\int_{k-1}^{k}x^{-\\frac43}\\,dx\\quad(k\\ge2)' }] } },
      { say: '$k=1$ のときは区間 $[0,\\,1]$ になり、$x=0$ の近くで積分が無限大になってしまいます。だから、$k=1$ の項 $1$ は **別に足します**（図の桃色）。',
        add: [{ t: 'm', size: 'sm', tex: '\\sum_{k=1}^{n}k^{-\\frac43}<1+\\int_1^n x^{-\\frac43}\\,dx=1+3-\\frac{3}{\\sqrt[3]n}<4' }] },
      { clear: true, cols: [1], say: '答案です。「減少するから」「$k\\ge2$ で」「等号がつかない理由」をきちんと書きます。$n=1$ も忘れずに。',
        add: [{ t: 'h', text: '(2)　答案' },
          { t: 'box', c: 'y', size: 'sm', label: '答案', text: '$x>0$ で $x^{-\\frac43}$ は減少するから、$k\\ge2$ のとき、$k-1\\le x\\le k$ で $x^{-\\frac43}\\ge k^{-\\frac43}$（等号は $x=k$ のときだけ）。\nよって　$\\displaystyle k^{-\\frac43}<\\int_{k-1}^{k}x^{-\\frac43}\\,dx$　…①\n$n=1$ のとき、左辺は $1<4$。$n\\ge2$ のとき、① を $k=2,\\,3,\\,\\cdots,\\,n$ で足して\n$\\displaystyle\\sum_{k=1}^{n}k^{-\\frac43}<1+\\int_1^n x^{-\\frac43}\\,dx=4-\\frac{3}{\\sqrt[3]n}<4$　（証明終）' }] },
      { ask: { type: 'think', q: '同じ方法で、$\\displaystyle\\sum_{k=1}^{n}\\frac1{k^2}<2$ を示すときの式を書こう。',
        hint: '$k\\ge2$ で $\\dfrac1{k^2}<\\displaystyle\\int_{k-1}^{k}\\frac{dx}{x^2}$、$k=1$ の項は 1。',
        ans: '$\\displaystyle\\sum_{k=1}^{n}\\frac1{k^2}<1+\\int_1^n\\frac{dx}{x^2}=1+\\left(1-\\frac1n\\right)=2-\\frac1n<2$',
        after: '指数が 1 より大きいと積分が有限になり、和も有界。$\\sum\\frac1k$（指数 1）は $\\log n$ のようにふえ続けます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。1次式 × sin は部分積分。1次式 $\\pi-x$ を微分する側、$\\sin kx$ を積分する側にします。',
        add: [{ t: 'h', text: '(3)　1次式と sin の積の積分' },
          { t: 'm', size: 'sm', tex: '\\int_0^{\\pi}(\\pi-x)\\sin kx\\,dx=\\Big[-\\frac{(\\pi-x)\\cos kx}{k}\\Big]_0^{\\pi}-\\int_0^{\\pi}\\frac{\\cos kx}{k}\\,dx' },
          { t: 'p', size: 'sm', text: '（$(\\pi-x)\'=-1$ と $-\\frac{\\cos kx}{k}$ の積は $+\\frac{\\cos kx}{k}$。それを引く）' }] },
      { ask: { type: 'choice', q: 'この積分の値（イ）は？',
        opts: ['$-\\dfrac{\\pi}{k}$', '$0$', '$\\dfrac{(-1)^{k+1}\\pi}{k}$', '$\\dfrac{\\pi}{k}$'], ok: 3,
        why: { 0: '下端 $x=0$ を引くときの符号のミスです。$0-\\left(-\\frac{\\pi}{k}\\right)=+\\frac{\\pi}{k}$。', 1: '境界の項を落としています。残りの $\\int\\cos kx$ は 0 ですが、境界の項は残ります。', 2: 'それは $\\int_0^{\\pi}x\\sin kx\\,dx$ の値。$\\pi-x$ なら $x=\\pi$ の項が消えます。' },
        good: '$x=\\pi$ では $\\pi-x=0$ で消え、$x=0$ の $-\\frac{\\pi}{k}$ を引いて $\\frac{\\pi}{k}$。$\\int_0^{\\pi}\\cos kx\\,dx=0$。',
        add: [{ t: 'm', tex: '=\\Big(0-\\big(-\\tfrac{\\pi}{k}\\big)\\Big)-0=\\ans{\\frac{\\pi}{k}}' }] } },
      { say: '大事な観察：$x=\\pi$ の境界の項が消えたのは、$\\pi-x$ が $x=\\pi$ で 0 だから。(5) では $f(0)=f(\\pi)=0$ が、両はしの項を消します。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '(5) への伏線', text: '境界の項 $\\Big[\\ g(x)\\cos kx\\ \\Big]_0^{\\pi}$ は\n$g(0)=g(\\pi)=0$ なら、まるごと 0' },
          { t: 'ans', label: '(3) 答', text: 'イ $\\dfrac{\\pi}{k}$' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$|\\cos kx|$ は周期 $\\frac{\\pi}{k}$ で同じ形の山がくり返します。図は $k=3$。$[0,\\,\\pi]$ に山がちょうど $k$ 個です。',
        add: [{ t: 'h', text: '(4)　絶対値つき cos の積分' },
          { t: 'm', size: 'sm', tex: '\\int_0^{\\frac{\\pi}{k}}|\\cos kx|\\,dx=2\\int_0^{\\frac{\\pi}{2k}}\\cos kx\\,dx=\\frac2k', note: '山 1 個ぶん' },
          cosfig('c1')] },
      { ask: { type: 'choice', q: '$\\displaystyle\\int_0^{\\pi}|\\cos kx|\\,dx$（ウ）は？',
        opts: ['$2$', '$0$', '$\\dfrac2k$', '$2k$'], ok: 0,
        why: { 1: '絶対値をはずして $\\int\\cos kx\\,dx=0$ としています。$|\\cos kx|\\ge0$ なので正の値。', 2: '山 1 個ぶんだけです。山は $k$ 個あります。', 3: '山 1 個の面積を 2 としています。横の幅が $\\frac{\\pi}{k}$ にちぢむので、1 個は $\\frac2k$。' },
        good: '$\\frac2k\\times k=2$。$k$ によらず 2 です。',
        add: [{ t: 'ans', label: '(4) 答', text: 'ウ $2$（$k$ によらない）' }] } },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。$f$ の式はわかりませんが、$f\'$ の大きさはわかっています。だから、部分積分で $f\'$ が出てくる形にします。',
        add: [{ t: 'h', text: '(5)　係数 b_k を上からおさえる' },
          { t: 'p', size: 'sm', text: "わかっていること：$f(0)=f(\\pi)=0$，$|f'(x)|\\le\\dfrac12$" }] },
      { ask: { type: 'choice', q: '$b_k=\\displaystyle\\int_0^{\\pi}f(x)\\sin kx\\,dx$ の部分積分で、微分する側にするのは？',
        opts: ['$\\sin kx$（$f$ を積分する）', '$f(x)$（$\\sin kx$ を積分する）', 'どちらでもよい', '部分積分は使えない'], ok: 1,
        why: { 0: '$f$ の原始関数については何もわかりません。$f\'$ の条件が使えなくなります。', 2: '条件 $|f\'|\\le\\frac12$ を使うには、$f\'$ が出る向きでないといけません。', 3: '$f\'$ は連続なので、部分積分が使えます。' },
        good: '$f$ を微分すれば $f\'$ が出て、条件が使えます。(3) と同じ形です。',
        add: [{ t: 'm', size: 'sm', tex: "b_k=\\Big[-\\frac{f(x)\\cos kx}{k}\\Big]_0^{\\pi}+\\frac1k\\int_0^{\\pi}f'(x)\\cos kx\\,dx" }] } },
      { say: '境界の項は $f(0)=f(\\pi)=0$ で消えます。残りを絶対値で上からおさえ、(4) を使います。',
        add: [{ t: 'm', size: 'sm', tex: "|b_k|\\le\\frac1k\\int_0^{\\pi}|f'(x)|\\,|\\cos kx|\\,dx\\le\\frac1{2k}\\int_0^{\\pi}|\\cos kx|\\,dx=\\frac1k" }] },
      { ask: { type: 'choice', q: '$|b_k|\\le\\dfrac1k$ から、ゴールへはどう進む？',
        opts: ['そのまま足して $\\sum\\frac1k$ とくらべる', '両辺を $\\frac43$ 乗して (2) を使う', '$b_k=0$ を示す', '$|b_k|\\to0$ を示す'], ok: 1,
        why: { 0: '$\\sum\\frac1k$ は限りなく大きくなるので、4 未満とは言えません。', 2: '$b_k$ は一般に 0 ではありません。', 3: '$|b_k|\\to0$ だけでは、和が 4 未満かはわかりません。' },
        good: '両辺は 0 以上なので $\\frac43$ 乗しても大小は同じ。$|b_k|^{\\frac43}\\le k^{-\\frac43}$ を足して (2) へ。',
        add: [{ t: 'm', size: 'sm', tex: '\\sum_{k=1}^{n}|b_k|^{\\frac43}\\le\\sum_{k=1}^{n}k^{-\\frac43}<4' }] } },
      { clear: true, cols: [1], say: '(5) の答案です。部分積分 → 境界の項が消える理由 → 絶対値の評価 → $\\frac43$ 乗 → (2)、の順に、根拠をそえて書きます。',
        add: [{ t: 'h', text: '(5)　答案' },
          { t: 'box', c: 'y', size: 'sm', label: '答案', text: "$f'(x)$ は連続だから部分積分ができて、$f(0)=f(\\pi)=0$ より\n$\\displaystyle b_k=\\Big[-\\frac{f(x)\\cos kx}{k}\\Big]_0^{\\pi}+\\frac1k\\int_0^{\\pi}f'(x)\\cos kx\\,dx=\\frac1k\\int_0^{\\pi}f'(x)\\cos kx\\,dx$\nよって、$|f'(x)|\\le\\dfrac12$ と (4) より\n$\\displaystyle|b_k|\\le\\frac1k\\int_0^{\\pi}|f'(x)||\\cos kx|\\,dx\\le\\frac1{2k}\\int_0^{\\pi}|\\cos kx|\\,dx=\\frac1k$\n$|b_k|\\ge0$ だから $|b_k|^{\\frac43}\\le k^{-\\frac43}$。これを $k=1,\\,\\cdots,\\,n$ で足し、(2) より\n$\\displaystyle\\sum_{k=1}^{n}|b_k|^{\\frac43}\\le\\sum_{k=1}^{n}k^{-\\frac43}<4$　（証明終）" }] },
      { ask: { type: 'think', q: '$f(x)=\\dfrac12\\sin x$ は (5) の条件を満たす。$b_1$ を求めて、$|b_1|\\le1$ を確かめよう。',
        hint: '$\\displaystyle b_1=\\frac12\\int_0^{\\pi}\\sin^2x\\,dx$、$\\sin^2x=\\dfrac{1-\\cos2x}{2}$。',
        ans: '$b_1=\\dfrac12\\cdot\\dfrac{\\pi}{2}=\\dfrac{\\pi}{4}\\approx0.785\\le1$（$k\\ge2$ では $b_k=0$）',
        after: '評価 $|b_k|\\le\\frac1k$ は、どんな $f$ にも使える「安全な上限」です。具体的な $f$ では、もっと小さくなることもあります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。前の小問がそのまま次の部品になる、慶應らしい誘導でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、(2) と (5) の証明をノートに自分で書いてみましょう。' }
    ]
  });
})();
