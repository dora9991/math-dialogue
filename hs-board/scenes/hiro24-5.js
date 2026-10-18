/* 2024 広島大 理系 第5問の類題（自作）：f(x)=log(1+√x) の凸性・不等式・積分と、接線の台形で log(7/4) を評価
   答え（python3・sympy で検算ずみ。L=log(7/4)≒0.5596）：
   (1) f'(x)=1/{2(√x+x)}、f''(x)=−(1/(2√x)+1)/{2(√x+x)²}<0
   (2) u=1+√x>1：1−1/u < log u < (u−1/u)/2。g=log u−1+1/u（g'=(u−1)/u²）、h=(u−1/u)/2−log u（h'=(u−1)²/(2u²)）
   (3) t=√x：I=∫₀^{3/4} 2t log(1+t)dt=[(t²−1)log(1+t)]−∫(t−1)dt=15/32−(7/16)L（≒0.2239）
   (4) f'(9/16)=8/21、ℓ：y=(8/21)(x−9/16)+L、y 切片 L−3/14（(2) より L>3/7 なので正）。S=(9/16)L−27/448（≒0.2545）
   (5) 上に凸 → I<S → L>15/32+27/448=237/448≒0.529>0.5。(2) で x=9/16：L<33/56≒0.589<0.6。小数第1位は 5
   考えてみよう：弦との比較 I>(9/32)L → L<15/23≒0.652（(2) の上からの評価のほうがよい） */
(function () {
  const L = Math.log(7 / 4), X0 = 9 / 16, M = 8 / 21, B = L - 3 / 14;
  const graph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.1, -0.1, 0.84, 0.74], w: 520, h: 465, items: [
    { k: 'axes', tx: [[X0, '9/16']], ty: [[L, 'L']], xl: 'x', yl: 'y' },
    { k: 'fn', f: 'log(1+sqrt(x))', a: 0, b: 0.8, c: 'w', label: 'y=f(x)', lat: [0.66, 0.43], la: 'start' },
    { k: 'pt', at: [X0, L], c: 'y', name: 'P', dir: 'nw', size: 22 }].concat(extra || []) });
  const TAN = { k: 'line', m: M, n: B, a: 0, b: 0.8, c: 'b', wd: 2.5, label: 'ℓ', lat: [0.78, M * 0.78 + B + 0.04] };
  const TRAP = { k: 'poly', pts: [[0, 0], [X0, 0], [X0, L], [0, B]], close: true, c: 'b', wd: 1.5, fill: 'b', alpha: 0.18 };
  const UNDER = { k: 'area', f: 'log(1+sqrt(x))', g: '0', a: 0, b: X0, c: 'y', alpha: 0.35 };
  const POINTS = [
    '「上に凸」は $f\'\'(x)<0$ を示す。上に凸なら、曲線は **接線より下・弦より上**。面積の大小比較の根拠になる',
    '不等式は $u=1+\\sqrt{x}$ とおくと、$\\log u$ の標準的な評価に。差の関数を微分して、$u=1$ で 0・増加 を言う',
    '$\\displaystyle\\int 2t\\log(1+t)\\,dt$ は、$2t$ の原始関数を **$t^2-1$** にとると約分できる。$I<S$ で下から、(2) で上からはさむ'
  ];

  HB.lesson({
    id: 'hiro24-5', field: '広島大型　数学（理系）', title: '2024 広島大 理系 第5問の類題 ― 上に凸な関数と接線の台形で対数を評価', level: '2024年度 広島大学 理系 第5問の類題（自作）', time: '目安 20〜25分', noDec: true,
    problem: {
      label: '類題',
      lead: '$x\\ge0$ で定義された関数 $f(x)=\\log(1+\\sqrt{x})$ を考える。ただし、対数は自然対数とする。',
      parts: [
        '(1)　$x>0$ において、曲線 $y=f(x)$ は上に凸であることを示せ。',
        '(2)　$x>0$ のとき、不等式 $\\dfrac{\\sqrt{x}}{1+\\sqrt{x}}<f(x)<\\dfrac{x+2\\sqrt{x}}{2(1+\\sqrt{x})}$ が成り立つことを示せ。',
        '(3)　定積分 $I=\\displaystyle\\int_0^{\\frac{9}{16}}f(x)\\,dx$ を求めよ。',
        '(4)　曲線 $y=f(x)$ 上の点 $\\mathrm{P}\\left(\\frac{9}{16},\\ f\\left(\\frac{9}{16}\\right)\\right)$ における接線を $\\ell$ とする。$\\ell$、直線 $x=\\frac{9}{16}$、$x$ 軸、$y$ 軸で囲まれた四角形の面積 $S$ を求めよ。',
        '(5)　(1)〜(4) を利用して、$\\log\\dfrac{7}{4}$ の小数第1位の数字を求めよ。'
      ],
      src: '※ 2024年度 広島大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '微分・積分の総合問題です。凸性 → 不等式 → 積分 → 面積の比較 と進み、最後に対数の値を小数第1位まで決めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '$\\frac{9}{16}$ のとき $\\sqrt{x}=\\frac34$ なので、$f\\left(\\frac{9}{16}\\right)=\\log\\frac74$。これを $L$ とおきます。右の黄色（$I$）と青の台形（$S$）を比べるのが、この問題の山場です。',
        add: [{ t: 'h', text: '方針：L = log(7/4) を2方向からはさむ' },
          { t: 'm', tex: 'L=f\\left(\\tfrac{9}{16}\\right)=\\log\\left(1+\\tfrac34\\right)=\\log\\frac74' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1) $f\'\'(x)<0$　(2) $u=1+\\sqrt{x}$ とおいて差の関数\n(3) $t=\\sqrt{x}$ と置換して部分積分\n(4) 接線の $y$ 切片 → 台形の面積\n(5) 上に凸 → $I<S$ で **下から**、(2) で **上から**' },
          graph('g0', [TRAP, UNDER, TAN])] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。合成関数の微分で $f\'(x)$ を求めます。$\\log(1+\\sqrt{x})$ の「中身」は $1+\\sqrt{x}$ です。',
        add: [{ t: 'h', text: '(1)　上に凸であること' }] },
      { ask: { type: 'choice', q: "$f'(x)$ は？",
        opts: ['$\\dfrac{1}{1+\\sqrt{x}}$', '$\\dfrac{1}{2\\sqrt{x}}$', '$\\dfrac{1}{2(\\sqrt{x}+x)}$', '$\\dfrac{\\sqrt{x}}{2(1+\\sqrt{x})}$'], ok: 2,
        why: { 0: '中身 $1+\\sqrt{x}$ の微分 $\\frac{1}{2\\sqrt{x}}$ をかけ忘れています。', 1: 'それは $\\sqrt{x}$ の微分だけ。$\\log$ の微分 $\\frac{1}{1+\\sqrt{x}}$ もかけます。', 3: '$\\frac{1}{2\\sqrt{x}}$ の $\\sqrt{x}$ は分母です。' },
        good: '$\\frac{1}{1+\\sqrt{x}}\\cdot\\frac{1}{2\\sqrt{x}}=\\frac{1}{2(\\sqrt{x}+x)}$。分母を展開しておくと次の微分が楽です。',
        add: [{ t: 'm', tex: "f'(x)=\\frac{1}{1+\\sqrt{x}}\\cdot\\frac{1}{2\\sqrt{x}}=\\frac{1}{2(\\sqrt{x}+x)}" }] } },
      { say: '$f\'(x)=\\frac12(\\sqrt{x}+x)^{-1}$ をもう一度微分します。$x>0$ で分子の $\\frac{1}{2\\sqrt{x}}+1$ は正なので、$f\'\'(x)<0$ です。',
        add: [{ t: 'm', tex: "f''(x)=-\\frac{\\frac{1}{2\\sqrt{x}}+1}{2(\\sqrt{x}+x)^2}<0" },
          { t: 'ans', label: '(1)', text: "$x>0$ で $f''(x)<0$ なので、曲線 $y=f(x)$ は上に凸である。" }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\sqrt{x}$ がたくさん出てくるので、$u=1+\\sqrt{x}$（$u>1$）とおきます。両はしの式を $u$ で書きなおすと、すっきりします。',
        add: [{ t: 'h', text: '(2)　u = 1 + √x とおく' },
          { t: 'm', size: 'sm', tex: '\\frac{\\sqrt{x}}{1+\\sqrt{x}}=\\frac{u-1}{u}=1-\\frac1u' },
          { t: 'm', size: 'sm', tex: '\\frac{x+2\\sqrt{x}}{2(1+\\sqrt{x})}=\\frac{(1+\\sqrt{x})^2-1}{2(1+\\sqrt{x})}=\\frac12\\left(u-\\frac1u\\right)' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '示すこと（u > 1）', tex: '1-\\frac1u<\\log u<\\frac12\\left(u-\\frac1u\\right)' }] },
      { say: '左側：$g(u)=\\log u-1+\\frac1u$ とおくと $g\'(u)=\\frac1u-\\frac{1}{u^2}=\\frac{u-1}{u^2}>0$。$g(1)=0$ で増加なので、$u>1$ で $g(u)>0$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: "\\begin{aligned}&g(u)=\\log u-1+\\frac1u\\\\ &g'(u)=\\frac{u-1}{u^2}>0,\\quad g(1)=0\\end{aligned}" }] },
      { ask: { type: 'choice', q: '右側：$h(u)=\\dfrac12\\left(u-\\dfrac1u\\right)-\\log u$ の導関数 $h\'(u)$ は？',
        opts: ['$\\dfrac{(u-1)^2}{2u^2}$', '$\\dfrac{u^2+1}{2u^2}$', '$\\dfrac{(u+1)^2}{2u^2}$', '$\\dfrac{u-1}{2u^2}$'], ok: 0,
        why: { 1: '$-\\log u$ の微分 $-\\frac1u$ を入れ忘れています。', 2: '$-\\frac1u$ の符号に注意。$\\frac12+\\frac{1}{2u^2}-\\frac1u$ です。', 3: '通分すると分子は $u^2-2u+1$。2乗の形になります。' },
        good: '$\\frac12+\\frac{1}{2u^2}-\\frac1u=\\frac{u^2-2u+1}{2u^2}=\\frac{(u-1)^2}{2u^2}>0$（$u>1$）。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: "h'(u)=\\frac{(u-1)^2}{2u^2}>0,\\quad h(1)=0" },
          { t: 'ans', col: 1, label: '(2)', text: '$u>1$ で $g(u)>0$、$h(u)>0$。$u=1+\\sqrt{x}$ にもどして、示す不等式を得る。' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$t=\\sqrt{x}$ と置換します。$x=t^2$、$dx=2t\\,dt$、$x:0\\to\\frac{9}{16}$ のとき $t:0\\to\\frac34$。',
        add: [{ t: 'h', text: '(3)　定積分 I' },
          { t: 'm', tex: 'I=\\int_0^{\\frac34}2t\\log(1+t)\\,dt' },
          graph('g3', [UNDER, { k: 'label', at: [0.33, 0.12], text: 'I', size: 26, c: 'y' }])] },
      { ask: { type: 'choice', q: '部分積分で、$2t$ の原始関数として何をとると、あとの計算がいちばん楽？',
        opts: ['$t^2$', '$t^2-1$', '$t^2+1$', '$2t^2$'], ok: 1,
        why: { 0: 'できますが、$\\frac{t^2}{1+t}$ の割り算が必要になります。', 2: '$\\frac{t^2+1}{1+t}$ は約分できません。', 3: '$2t^2$ を微分すると $4t$。$2t$ の原始関数ではありません。' },
        good: '$t^2-1=(t-1)(t+1)$ なので、$\\log(1+t)$ の微分 $\\frac{1}{1+t}$ と **約分** できます。',
        add: [{ t: 'm', size: 'sm', tex: 'I=\\Big[(t^2-1)\\log(1+t)\\Big]_0^{\\frac34}-\\int_0^{\\frac34}\\frac{t^2-1}{1+t}\\,dt' }] } },
      { say: '$\\frac{t^2-1}{1+t}=t-1$。また $t=\\frac34$ で $t^2-1=-\\frac{7}{16}$、$\\log\\frac74=L$。$t=0$ では $\\log1=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: '=-\\frac{7}{16}L-\\Big[\\frac{t^2}{2}-t\\Big]_0^{\\frac34}=-\\frac{7}{16}L-\\left(\\frac{9}{32}-\\frac34\\right)' },
          { t: 'ans', label: '(3) 答', tex: 'I=\\frac{15}{32}-\\frac{7}{16}\\log\\frac74' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: "(4) です。$f'\\left(\\frac{9}{16}\\right)=\\frac{1}{2\\left(\\frac34+\\frac{9}{16}\\right)}=\\frac{8}{21}$。接線 $\\ell$ は $y=\\frac{8}{21}\\left(x-\\frac{9}{16}\\right)+L$ です。",
        add: [{ t: 'h', text: '(4)　接線 ℓ と台形の面積 S' },
          { t: 'm', tex: '\\ell:\\ y=\\frac{8}{21}\\left(x-\\frac{9}{16}\\right)+L' },
          graph('g4', [TRAP, TAN])] },
      { ask: { type: 'choice', q: '$\\ell$ の $y$ 切片（$x=0$ のときの $y$）は？',
        opts: ['$L+\\dfrac{3}{14}$', '$\\dfrac{3}{14}$', '$L-\\dfrac{3}{7}$', '$L-\\dfrac{3}{14}$'], ok: 3,
        why: { 0: '$x=0$ では $x-\\frac{9}{16}=-\\frac{9}{16}$。引き算になります。', 1: '$L$ を足し忘れています。', 2: '傾きを $\\frac{16}{21}$ にしています。$f\'$ の分母の 2 を忘れずに。' },
        good: '$\\frac{8}{21}\\cdot\\frac{9}{16}=\\frac{3}{14}$ なので、$y$ 切片は $L-\\frac{3}{14}$。',
        add: [{ t: 'm', tex: 'y\\ \\text{切片}：L-\\frac{3}{14}' }] } },
      { say: '$y$ 切片は正？ (2) の左側を $x=\\frac{9}{16}$ で使うと $L>\\frac{3/4}{7/4}=\\frac37>\\frac{3}{14}$。だから本当に台形です。面積は（上底＋下底）×高さ÷2。',
        add: [{ t: 'm', size: 'sm', tex: 'L>\\frac37>\\frac{3}{14}', note: '(2) の左側より\ny 切片は正' },
          { t: 'm', size: 'sm', tex: 'S=\\frac12\\left\\{L+\\left(L-\\frac{3}{14}\\right)\\right\\}\\cdot\\frac{9}{16}' },
          { t: 'ans', label: '(4) 答', tex: 'S=\\frac{9}{16}\\log\\frac74-\\frac{27}{448}' }] },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。(1) より曲線は上に凸なので、$0\\le x\\le\\frac{9}{16}$ で曲線は接線 $\\ell$ より下にあります。黄色の部分（$I$）と青の台形（$S$）を比べます。',
        add: [{ t: 'h', text: '(5)　L を下からと上からはさむ' },
          graph('g5', [TRAP, UNDER, TAN])] },
      { ask: { type: 'choice', q: '$I$ と $S$ の関係と、そこからわかることは？',
        opts: ['$I>S$ で、$L<\\frac{237}{448}$', '$I<S$ で、$L<\\frac{237}{448}$', '$I<S$ で、$L>\\frac{237}{448}$', '$I>S$ で、$L>\\frac{237}{448}$'], ok: 2,
        why: { 0: '上に凸なので、曲線は接線より **下**。$I$ のほうが小さいです。', 1: '$-\\frac{7}{16}L$ を右辺に移すと、$L$ の係数は $\\frac{9}{16}+\\frac{7}{16}=1$。不等号の向きを確かめましょう。', 3: '上に凸なので、曲線は接線より下。$I<S$ です。' },
        good: '$\\frac{15}{32}-\\frac{7}{16}L<\\frac{9}{16}L-\\frac{27}{448}$ より $L>\\frac{15}{32}+\\frac{27}{448}=\\frac{237}{448}$。',
        add: [{ t: 'm', size: 'sm', tex: 'L>\\frac{237}{448}=0.529\\cdots>0.5', note: '下からの評価' }] } },
      { ask: { type: 'choice', q: '上からの評価（$L<0.6$）に使えるのは？',
        opts: ['(2) の右側の不等式を $x=\\frac{9}{16}$ で', '(2) の左側の不等式を $x=\\frac{9}{16}$ で', '$I<S$ をもう一度', '$x=0$ での接線と比べる'], ok: 0,
        why: { 1: '左側は $L>\\frac37$ で、下からの評価です。', 2: '$I<S$ から出るのは、下からの評価だけです。', 3: '$f\'(x)$ は $x\\to+0$ で限りなく大きくなり、$x=0$ で接線が引けません。' },
        good: '$L<\\frac{\\frac{9}{16}+\\frac32}{2\\cdot\\frac74}=\\frac{33}{56}=0.589\\cdots<0.6$。',
        add: [{ t: 'm', size: 'sm', tex: 'L<\\frac{33}{56}=0.589\\cdots<0.6', note: '上からの評価' },
          { t: 'ans', label: '(5) 答', text: '$0.5<\\log\\frac74<0.6$ より、小数第1位の数字は $5$' }] } },
      { ask: { type: 'think', q: '上に凸なので、曲線は弦 OP より上にある。$I$ と △OP（原点・$(\\frac{9}{16},0)$・P）の面積を比べて上からの評価を作り、(2) の評価とくらべよう。',
        hint: '△の面積は $\\frac12\\cdot\\frac{9}{16}\\cdot L=\\frac{9}{32}L$。$I>\\frac{9}{32}L$ を $L$ について解く。',
        ans: '$\\frac{15}{32}-\\frac{7}{16}L>\\frac{9}{32}L$ → $L<\\frac{15}{23}=0.652\\cdots$。0.6 より大きいので使えない。(2) の $\\frac{33}{56}$ のほうがよい',
        after: '評価の道具は1つではありません。どの不等式が「ねらいの桁」に届くか、数値で確かめて選びます（本当は $L=0.5596\\cdots$）。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。凸性は面積の比較の根拠、不等式は値の評価の道具。小問がすべて (5) の材料になっていました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
