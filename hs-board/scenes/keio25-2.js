/* 2025 慶應 理工 第2問の類題（自作）：分数関数のグラフの接線と、平面ベクトル（証明＋空欄）
   C：y=(x+1)/x（x>0）、E(0, 1)（漸近線の交点）
   元の問題はうつしていない（分野・ねらい・形式だけを合わせた自作問題）。答えは python3（sympy）で検算ずみ。
   接線（接点の x 座標 t>0）：y=−x/t²+2/t+1
   (1) A(−1, 1/2) を通る ⟺ t²+4t+2=0。t>0 では左辺>0 → 接線なし（解 t=−2±√2 はどちらも負＝x<0 の枝の接線 2 本）
   (2) B(8, 0)：t²+2t−8=0 → t=2（t=−4 は不適）。ア −x/4+2、イ P(2, 3/2)。
       Q(s, 1+1/s)：EQ·PB=(s, 1/s)·(6, −3/2)=6s−3/(2s)=0 → s=1/2 → ウ Q(1/2, 3)
   (3) M=(2P+Q)/3=(3/2, 2)、D=(3M+2R)/5=((9/2+2r)/5, (8+2/r)/5)。積=(40+16r+9/r)/25 ≧ 64/25（r=3/4）。エ 3/4、オ 64/25
       誤答：比を逆（(2M+3R)/5）→ r=√21/7 */
(function () {
  const POINTS = [
    '「点を通る接線」は、**接点を $t$ とおいて** 点を代入した $t$ の方程式にする。接線の本数＝**定義域に入る** 解の個数',
    '「存在しない」の証明は、$t$ の方程式が **条件（$t>0$）を満たす解をもたない** ことを示す。実数解がないとは限らない',
    '内分点は $\\dfrac{n\\vec a+m\\vec b}{m+n}$（比の逆の重み）。積 $=Ar+\\dfrac{B}{r}+$ 定数 の最小は **相加・相乗平均**、等号の $r$ を必ず書く'
  ];
  const C = { k: 'fn', f: '1+1/x', a: 0.165, b: 9.1, c: 'y', label: 'C', lat: [8.6, 1.55] };
  const asy = [{ k: 'line', m: 0, n: 1, c: 'd', dash: true }];
  const big = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.2, -1.2, 9.2, 6.4], w: 570, h: 380, items: [
    { k: 'axes', tx: [2, 4, 6, 8], ty: [1, 3, 5] }].concat(asy, [C, { k: 'pt', at: [0, 1], name: 'E', dir: 'nw', c: 'w' }], extra || []) });
  const mid = (id, extra) => ({ t: 'fig', id, col: 1, view: [-4.2, -2.3, 4.2, 4.6], w: 520, h: 427, items: [
    { k: 'axes', tx: [-2, 2], ty: [1, 3] }, { k: 'line', m: 0, n: 1, c: 'd', dash: true },
    { k: 'fn', f: '1+1/x', a: 0.28, b: 4.2, c: 'y', label: 'C', lat: [3.9, 1.65] },
    { k: 'pt', at: [0, 1], name: 'E', dir: 'ne', c: 'w' }, { k: 'pt', at: [-1, 0.5], name: 'A', dir: 'nw', c: 'p' }].concat(extra || []) });
  const small = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.4, -0.3, 4.2, 4.3], w: 400, h: 400, items: [
    { k: 'axes', tx: [1, 2, 3], ty: [1, 2, 3, 4] },
    { k: 'line', m: 0, n: 1, c: 'd', dash: true },
    { k: 'fn', f: '1+1/x', a: 0.31, b: 4.1, c: 'y', label: 'C', lat: [3.9, 1.5] },
    { k: 'pt', at: [2, 1.5], name: 'P', dir: 'se', c: 'b' }, { k: 'pt', at: [0.5, 3], name: 'Q', dir: 'w', c: 'g' }].concat(extra || []) });

  HB.lesson({
    id: 'keio25-2', field: '慶應型　数学（理工）', title: '2025 慶應 理工 第2問の類題 ― 分数関数の接線と、内積で決まる点', level: '2025年度 慶應義塾大学 理工学部 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '曲線 $C:y=\\dfrac{x+1}{x}\\ (x>0)$ と点 $\\mathrm{E}(0,\\,1)$ がある。(1) は証明を書き、(2)，(3) は空欄に適切な数または式を入れよ。',
      parts: [
        '(1)　点 $\\mathrm{A}\\left(-1,\\,\\dfrac12\\right)$ を通る $C$ の接線は存在しないことを証明せよ。',
        '(2)　点 $\\mathrm{B}(8,\\,0)$ を通る $C$ の接線はただ1本あり、その方程式は $y=\\boxed{\\text{ア}}$、接点 P の座標は $\\boxed{\\text{イ}}$ である。また、$C$ 上の点 Q で $\\overrightarrow{\\mathrm{EQ}}\\cdot\\overrightarrow{\\mathrm{PB}}=0$ を満たすものの座標は $\\boxed{\\text{ウ}}$ である。',
        '(3)　線分 PQ を $1:2$ に内分する点を M とする。点 R が $C$ 上を動くとき、線分 MR を $2:3$ に内分する点を D とする。D の $x$ 座標と $y$ 座標の積が最小となるのは、R の $x$ 座標が $\\boxed{\\text{エ}}$ のときで、その最小値は $\\boxed{\\text{オ}}$ である。'
      ],
      src: '※ 2025年度 慶應義塾大学 理工学部 一般選抜 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { clear: true, cols: [1], part: '問題', say: '分数関数のグラフの接線と、ベクトルの問題です。(1) だけが証明（記述）で、(2)(3) は空欄。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.44, 0.56], part: '読みかえ', say: '$y=\\dfrac{x+1}{x}=1+\\dfrac1x$。漸近線は $x=0$ と $y=1$ で、E はその交点（双曲線の中心）です。C はその右上の枝だけ。',
        add: [{ t: 'h', text: '曲線 C の形' },
          { t: 'm', tex: 'y=\\frac{x+1}{x}=1+\\frac1x\\quad(x>0)' },
          { t: 'p', size: 'sm', text: '漸近線　$x=0$，$y=1$\nE$(0,\\,1)$ は漸近線の交点' },
          big('g1')] },
      { ask: { type: 'choice', q: "C 上の点 $\\left(t,\\ 1+\\dfrac1t\\right)$（$t>0$）における接線の方程式は？（$y'=-\\dfrac1{x^2}$）",
        opts: ['$y=-\\dfrac{x}{t^2}+\\dfrac2t+1$', '$y=-\\dfrac{x}{t^2}+\\dfrac1t+1$', '$y=\\dfrac{x}{t^2}+1$', '$y=-\\dfrac{x}{t}+\\dfrac2t+1$'], ok: 0,
        why: { 1: '$-\\dfrac1{t^2}(x-t)$ を展開すると $+\\dfrac1t$ が出ます。$\\dfrac1t$ と合わせて $\\dfrac2t$。', 2: '傾きの符号が逆で、定数項も足りません。', 3: '傾きは $-\\dfrac1{t^2}$。2乗を忘れています。' },
        good: '$y-\\left(1+\\dfrac1t\\right)=-\\dfrac1{t^2}(x-t)$ を整理しました。(1)(2) の両方でこの式を使います。',
        add: [{ t: 'm', tex: 'y=-\\frac{1}{t^2}x+\\frac2t+1', note: '接点の $x$ 座標 $t>0$' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。A を通る接線がある ⟺ A を代入した $t$ の方程式が **$t>0$ の解** をもつ。$t^2$ をかけて整理します。',
        add: [{ t: 'h', text: '(1)　A を通る接線がないことの証明' },
          { t: 'm', tex: '\\frac12=\\frac{1}{t^2}+\\frac2t+1', note: 'A$\\left(-1,\\,\\frac12\\right)$ を代入' },
          { t: 'm', tex: '\\iff t^2+4t+2=0', note: '両辺に $-2t^2$' },
          mid('g2')] },
      { ask: { type: 'choice', q: '証明の中で、次に示すべきことは？',
        opts: ['判別式が負', '$t>0$ の解がない', '$t=-2\\pm\\sqrt2$ が接点', '判別式が正'], ok: 1,
        why: { 0: '判別式は $16-8=8>0$。実数解は **ある** ので示せません。', 2: '$-2\\pm\\sqrt2$ は負。C の上の点ではありません。', 3: '判別式が正でも、解が $t>0$ でなければ接線はありません。' },
        good: '実数解はあっても負。**$t>0$ の解がない** ことを示します。' } },
      { say: '答案です。$t>0$ なら左辺は正の数の和なので 0 になりません。解を求めなくても、1行で示せます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案', text: 'C 上の点 $\\left(t,\\,1+\\frac1t\\right)\\ (t>0)$ における接線 $y=-\\frac{1}{t^2}x+\\frac2t+1$ が A を通るとすると\n$t^2+4t+2=0$　…(＊)\nところが $t>0$ のとき $t^2+4t+2>0$ なので、(＊) を満たす $t>0$ はない。\nよって、A を通る C の接線は存在しない。（証明終）' }] },
      { ask: { type: 'think', q: '$x<0$ の部分もふくめた双曲線 $y=1+\\dfrac1x$ なら、A を通る接線は何本ある？',
        hint: '$t\\neq0$ なら負の $t$ も接点になれる。$t^2+4t+2=0$ の解は？',
        ans: '$t=-2\\pm\\sqrt2$（どちらも負で $t\\neq0$）なので、**2本**。どちらも $x<0$ の枝に接する',
        after: '問題文の「$x>0$」があるから、答えが「なし」になります。定義域は、条件として必ず使います。',
        draw: [{ fig: 'g2', items: [{ k: 'fn', f: '1+1/x', a: -4.2, b: -0.32, c: 'y', dash: true, label: 'x<0 の枝', lat: [-4.1, 1.5], la: 'start' },
          { k: 'line', m: -2.9142, n: -2.4142, a: -1.5, b: -0.05, c: 'p', wd: 2 },
          { k: 'line', m: -0.0858, n: 0.4142, a: -4.2, b: 1.5, c: 'p', wd: 2 },
          { k: 'pt', at: [-0.5858, -0.7071], c: 'p', r: 5 }, { k: 'pt', at: [-3.4142, 0.7071], c: 'p', r: 5 }] }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。B$(8,\\,0)$ を代入すると $0=-\\dfrac{8}{t^2}+\\dfrac2t+1$。$t^2$ をかけると、きれいに因数分解できます。',
        add: [{ t: 'h', text: '(2)　B を通る接線と、点 Q' },
          { t: 'm', tex: 't^2+2t-8=0\\iff(t+4)(t-2)=0', note: 'B(8, 0) を代入' },
          big('g3', [{ k: 'pt', at: [8, 0], name: 'B', dir: 'n', c: 'p' }])] },
      { ask: { type: 'choice', q: '接点の $t$ と、接線の本数は？',
        opts: ['$t=-4,\\ 2$ の2本', '$t=2$ の1本', '$t=4$ の1本', '$t=-2$ の1本'], ok: 1,
        why: { 0: '$t=-4$ は $t>0$ を満たしません。C の上の点ではないので数えません。', 2: '$(t+4)(t-2)=0$ の解の符号をとりちがえています。', 3: '$(t+4)(t-2)=0$ の解は $-4$ と $2$。$-2$ は出てきません。' },
        good: '$t>0$ より $t=2$ の1本。問題文の「ただ1本」とも合います。',
        add: [{ t: 'm', tex: 't=2:\\quad y=\\ans{-\\frac14x+2},\\quad \\mathrm{P}\\ans{\\left(2,\\ \\frac32\\right)}' }],
        draw: [{ fig: 'g3', items: [{ k: 'line', m: -0.25, n: 2, a: -2.2, b: 9.2, c: 'b', wd: 2 }, { k: 'pt', at: [2, 1.5], name: 'P', dir: 'ne', c: 'b' }] }] } },
      { say: '次は Q。$\\overrightarrow{\\mathrm{PB}}=\\left(6,\\,-\\dfrac32\\right)$ は $(4,\\,-1)$ と同じ向き。Q$\\left(s,\\,1+\\dfrac1s\\right)$ とすると $\\overrightarrow{\\mathrm{EQ}}=\\left(s,\\,\\dfrac1s\\right)$ です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{EQ}}\\cdot\\overrightarrow{\\mathrm{PB}}=6s-\\frac{3}{2s}=0' }] },
      { ask: { type: 'choice', q: 'Q の座標（ウ）は？',
        opts: ['$\\left(2,\\ \\dfrac32\\right)$', '$\\left(-\\dfrac12,\\ -1\\right)$', '$\\left(\\dfrac14,\\ 5\\right)$', '$\\left(\\dfrac12,\\ 3\\right)$'], ok: 3,
        why: { 0: 'それは P。$\\overrightarrow{\\mathrm{EP}}\\cdot\\overrightarrow{\\mathrm{PB}}=12-\\frac34\\neq0$ なので条件を満たしません。', 1: '$s=-\\frac12$ は $s>0$ を満たさず、C の上の点ではありません。', 2: '$4s^2=1$ から $s=\\frac14$ としています。$s^2=\\frac14$ なので $s=\\frac12$。' },
        good: '$4s^2=1$、$s>0$ より $s=\\dfrac12$。$y$ 座標は $1+2=3$。',
        add: [{ t: 'm', tex: '\\mathrm{Q}\\ans{\\left(\\frac12,\\ 3\\right)}' }],
        draw: [{ fig: 'g3', items: [{ k: 'pt', at: [0.5, 3], name: 'Q', dir: 'ne', c: 'g' }, { k: 'seg', a: [0, 1], b: [0.5, 3], c: 'g', wd: 2 }] }] } },
      { say: '検算の見方：E から見ると P は $\\left(2,\\,\\frac12\\right)$、Q は $\\left(\\frac12,\\,2\\right)$ だけずれた所。成分を入れかえた、直線 $y=x+1$ について対称な点です。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: '速い検算', text: '$\\overrightarrow{\\mathrm{EP}}=\\left(2,\\,\\frac12\\right)$，$\\overrightarrow{\\mathrm{EQ}}=\\left(\\frac12,\\,2\\right)$\n接線の向き $(4,\\,-1)$ と $\\left(\\frac12,\\,2\\right)$ の内積は $2-2=0$' },
          { t: 'ans', label: '(2) 答', text: 'ア $-\\dfrac14x+2$　　イ $\\left(2,\\,\\dfrac32\\right)$　　ウ $\\left(\\dfrac12,\\,3\\right)$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。M は PQ を $1:2$ に内分する点。内分点は **比と逆の重み** をかけて足します。',
        add: [{ t: 'h', text: '(3)　内分点の座標の積の最小' },
          { t: 'm', tex: '\\mathrm{M}=\\frac{2\\mathrm{P}+\\mathrm{Q}}{3}=\\left(\\frac32,\\ 2\\right)' },
          { t: 'p', size: 'sm', text: 'R$\\left(r,\\ 1+\\dfrac1r\\right)$ とおく（$r>0$）' },
          small('g4', [{ k: 'pt', at: [1.5, 2], name: 'M', dir: 'ne', c: 'w' }])] },
      { ask: { type: 'choice', q: '線分 MR を $2:3$ に内分する点 D の座標は？',
        opts: ['$\\left(\\dfrac{3+3r}{5},\\ \\dfrac{7r+3}{5r}\\right)$', '$\\left(\\dfrac{3+4r}{10},\\ \\dfrac{4r+2}{5r}\\right)$', '$\\left(\\dfrac{9+4r}{10},\\ \\dfrac{2r+2}{5r}\\right)$', '$\\left(\\dfrac{9+4r}{10},\\ \\dfrac{8r+2}{5r}\\right)$'], ok: 3,
        why: { 0: '重みが逆です。$2:3$ に内分する点は $\\frac{3\\mathrm{M}+2\\mathrm{R}}{5}$（M の方に近い）。', 1: 'M の座標に、重み 3 をかけ忘れています。', 2: '$y$ 座標で、M の $y$ 座標 2 に 3 をかけた 6 が抜けています。' },
        good: '$\\mathrm{D}=\\dfrac{3\\mathrm{M}+2\\mathrm{R}}{5}$。$x=\\dfrac{9/2+2r}{5}$、$y=\\dfrac{6+2+2/r}{5}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{D}\\left(\\frac{9+4r}{10},\\ \\frac{8r+2}{5r}\\right)' }],
        draw: [{ fig: 'g4', items: [{ k: 'pt', at: [0.75, 2.3333], name: 'R', dir: 'nw', c: 'y' }, { k: 'seg', a: [1.5, 2], b: [0.75, 2.3333], c: 'w', wd: 2 },
          { k: 'pt', at: [1.2, 2.1333], name: 'D', dir: 's', c: 'p' }] }] } },
      { say: '積を展開すると「$r$ の式 ＋ $\\dfrac1r$ の式 ＋ 定数」。$r>0$ なので、相加平均と相乗平均の関係が使えます。',
        add: [{ t: 'm', size: 'sm', tex: 'xy=\\frac{(9+4r)(8r+2)}{50r}=\\frac{1}{25}\\left(16r+\\frac9r+40\\right)' },
          { t: 'm', size: 'sm', tex: '16r+\\frac9r\\ge2\\sqrt{16r\\cdot\\frac9r}=24' }] },
      { ask: { type: 'choice', q: '等号が成り立つ $r$（エ）は？',
        opts: ['$r=\\dfrac43$', '$r=\\dfrac9{16}$', '$r=\\dfrac34$', '$r=1$'], ok: 2,
        why: { 0: '$16r=\\frac9r$ から $r^2=\\frac{9}{16}$。分母と分子が逆です。', 1: 'それは $r^2$ の値。$r>0$ なので平方根をとります。', 3: '$r=1$ では $16\\neq9$。等号は成り立ちません。' },
        good: '$16r=\\dfrac9r\\iff r^2=\\dfrac9{16}$、$r>0$ より $r=\\dfrac34$。このとき $xy=\\dfrac{40+24}{25}=\\dfrac{64}{25}$。',
        add: [{ t: 'ans', col: 1, label: '(3) 答', text: 'エ $\\dfrac34$　　オ $\\dfrac{64}{25}$' }] } },
      { clear: true, say: '別の見方：D は C を M を中心に $\\frac25$ 倍した曲線の上を動きます。積が一定の曲線 $xy=k$ が、その曲線に **接する** ときが最小です。',
        add: [{ t: 'h', text: '(3)　別の見方と確かめ' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{MD}}=\\frac25\\,\\overrightarrow{\\mathrm{MR}}', note: 'M を中心に $\\frac25$ 倍' },
          { t: 'p', size: 'sm', text: 'D の動く曲線（緑）と　$xy=\\dfrac{64}{25}$（桃）が、\n点 $\\left(\\dfrac65,\\ \\dfrac{32}{15}\\right)$ で接する' },
          small('g5', [{ k: 'pt', at: [1.5, 2], name: 'M', dir: 'ne', c: 'w' },
            { k: 'param', x: '(4.5+2*t)/5', y: '(8+2/t)/5', a: 0.17, b: 9, c: 'g', label: 'D の軌跡', lat: [3.1, 1.95] },
            { k: 'fn', f: '2.56/x', a: 0.62, b: 4.1, c: 'p', dash: true, label: 'xy=64/25', lat: [3.3, 0.55] },
            { k: 'pt', at: [1.2, 2.1333], c: 'p' }])] },
      { ask: { type: 'think', q: '相加・相乗平均を使わずに、$g(r)=16r+\\dfrac9r\\ (r>0)$ の最小を微分で確かめよう。',
        hint: "$g'(r)=16-\\dfrac{9}{r^2}$ の符号を調べる。",
        ans: "$g'(r)=\\dfrac{16r^2-9}{r^2}$。$0<r<\\frac34$ で負、$r>\\frac34$ で正なので、$r=\\frac34$ で最小値 $g\\left(\\frac34\\right)=12+12=24$",
        after: '空欄なので結果だけでよいですが、「等号が成り立つ $r$ が範囲 $r>0$ に入るか」は必ず確かめます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。接線の問題は「接点を文字でおく」、最小の問題は「等号の条件まで」がセットです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、(1) の証明をノートに自分で書いてみましょう。' }
    ]
  });
})();
