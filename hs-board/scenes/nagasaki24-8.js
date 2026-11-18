/* 2024 長崎大 理系 第8問の類題（自作）：長方形の中をまわる折れ線 ― tan で長さ、1周の漸化式、動かない点と極限
   元の問題はうつしていない（「辺と一定の角をなすように隣の辺に点を順にとって図形の中をまわる折れ線をつくり、正接で長さを表し、
   1周の1次の漸化式・一般項・1周で戻る点と近づく点（内分比）を求める」というねらい・形式だけを合わせ、
   図形は正方形でなく 2×1 の長方形にして、辺の長さのちがいと条件 tanθ<1/2 が効く自作問題にした）。
   答え（python3・sympy と、角度から直接作図する数値計算で検算ずみ）：A(0,0) B(2,0) C(2,1) D(0,1)、k=tanθ、x_n=BP_n
   (1) BQ1=kx1、CR1=k(1−kx1)
   (2) DS1=k(2−k+k²x1)、AS1=1−2k+k²−k³x1、AP2=k−2k²+k³−k⁴x1 → x_{n+1}=k⁴x_n+(2−k)(1+k²)
   (3) α=(2−k)/(1−k²)、x_n=α+(x1−α)k^{4(n−1)}
   (4) P2=P1 ⇔ x1=α（0<α<2 ⇔ k<1/2）。x_n→α、AP=k(1−2k)/(1−k²)、AP:PB=k(1−2k):(2−k)
       k=1/3 なら 1:15、図の k=0.4 なら 1:20。0<k<1/2, 0<x1<2 ならどの点も辺の上（数値で確認）
   別の見方：閉じた折れ線は中心について点対称。CR1=AP1 ⇔ k−k²x1=2−x1 ⇔ x1=α */
(function () {
  const K = 0.4, A = [0, 0], B = [2, 0], C = [2, 1], D = [0, 1];
  const lap = x => { const bq = K * x, cr = K * (1 - bq), ds = K * (2 - cr), at = K * (1 - ds);
    return { P: [2 - x, 0], Q: [2, bq], R: [2 - cr, 1], S: [0, 1 - ds], T: [at, 0], next: 2 - at }; };
  const L1 = lap(1), L2 = lap(L1.next), AL = (2 - K) / (1 - K * K), LA = lap(AL);
  const path = (L, c, wd, dash) => ({ k: 'poly', pts: [L.P, L.Q, L.R, L.S, L.T], c, wd, dash });
  const rect = (items) => [
    { k: 'poly', pts: [A, B, C, D], close: true, c: 'w', wd: 3 },
    { k: 'pt', at: A, name: 'A', dir: 'w', c: 'w', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'se', c: 'w', r: 4 },
    { k: 'pt', at: C, name: 'C', dir: 'ne', c: 'w', r: 4 }, { k: 'pt', at: D, name: 'D', dir: 'nw', c: 'w', r: 4 },
    { k: 'label', at: [0.55, 0], text: '2', dy: 30, c: 'd', size: 20 }, { k: 'label', at: [2, 0.82], text: '1', dx: 26, c: 'd', size: 20 }
  ].concat(items || []);
  const fig = (id, items, w) => ({ t: 'fig', id, col: 1, view: [-0.32, -0.3, 2.32, 1.32], w: w || 600, h: Math.round((w || 600) * 1.62 / 2.64), items: rect(items) });
  const NAMES = (L, sub) => [
    { k: 'pt', at: L.P, name: 'P' + sub, dir: 's', c: 'y' }, { k: 'pt', at: L.Q, name: 'Q' + sub, dir: 'e', c: 'y' },
    { k: 'pt', at: L.R, name: 'R' + sub, dir: 'n', c: 'y' }, { k: 'pt', at: L.S, name: 'S' + sub, dir: 'w', c: 'y' }];
  const LAP1 = [path(L1, 'y', 4), ...NAMES(L1, '₁'), { k: 'pt', at: L1.T, name: 'P₂', dir: 's', c: 'p' }];
  const ANG1 = [
    { k: 'angle', o: L1.P, a: B, b: L1.Q, rp: 58, label: 'θ', c: 'g' }, { k: 'right', o: B, a: L1.P, b: L1.Q, s: 13 },
    { k: 'angle', o: L1.Q, a: C, b: L1.R, rp: 40, label: 'θ', c: 'g' }, { k: 'right', o: C, a: L1.Q, b: L1.R, s: 13 }];
  const POINTS = [
    '1辺ごとに「次のかどまでの残りの長さ × $\\tan\\theta$」。4辺ぶんを表にして順に書くと、1周の漸化式 $x_{n+1}=k^4x_n+(2-k)(1+k^2)$ になる',
    '$x_{n+1}=px_n+q$ は $\\alpha=p\\alpha+q$ の α を引いて等比数列に。$0<p<1$ なら $x_n\\to\\alpha$',
    '「1周でもとに戻る点」＝漸化式の動かない点 α。辺の上にあること（$0<\\alpha<2$）を条件 $k<\\frac12$ で確かめる'
  ];

  HB.lesson({
    id: 'nagasaki24-8', field: '長崎大型　数学（理系）', title: '2024 長崎大 理系 第8問の類題 ― 長方形の中をまわる折れ線と漸化式の極限', level: '2024年度 長崎大学 理系 第8問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '長方形 ABCD は $\\mathrm{AB}=2$，$\\mathrm{BC}=1$ である。$\\theta$ は $0<\\tan\\theta<\\dfrac12$ をみたす鋭角とし，$k=\\tan\\theta$ とおく。辺 AB 上に点 $\\mathrm{P_1}$（A，B とは異なる）をとり，$\\angle\\mathrm{BP_1Q_1}=\\theta$ となる点 $\\mathrm{Q_1}$ を辺 BC 上に，$\\angle\\mathrm{CQ_1R_1}=\\theta$ となる点 $\\mathrm{R_1}$ を辺 CD 上に，$\\angle\\mathrm{DR_1S_1}=\\theta$ となる点 $\\mathrm{S_1}$ を辺 DA 上に，$\\angle\\mathrm{AS_1P_2}=\\theta$ となる点 $\\mathrm{P_2}$ を辺 AB 上にとる。同じようにして $\\mathrm{P_2}$ から $\\mathrm{Q_2},\\ \\mathrm{R_2},\\ \\mathrm{S_2},\\ \\mathrm{P_3}$ をとり，これをくり返す。$x_n=\\mathrm{BP}_n$ とする。',
      parts: [
        '(1)　$\\mathrm{BQ_1}$ と $\\mathrm{CR_1}$ を $k,\\ x_1$ で表せ。',
        '(2)　$x_{n+1}$ を $x_n$ と $k$ で表せ。',
        '(3)　$x_n$ を $n,\\ k,\\ x_1$ で表せ。',
        '(4)　$\\mathrm{P_2}=\\mathrm{P_1}$ となるような $x_1$ の値を求めよ。また，$\\mathrm{P_2}\\neq\\mathrm{P_1}$ のとき，$n\\to\\infty$ で点 $\\mathrm{P}_n$ は辺 AB 上のある点 P に限りなく近づく。P は辺 AB をどのような比に内分するか。'
      ],
      src: '※ 2024年度 長崎大学 前期 理系（医学部医学科）第8問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.44, 0.56],
    steps: [
      { part: '問題', cols: [1], say: '長方形の中を、辺と同じ角度で曲がりながらまわる折れ線の問題です。三角比・漸化式・極限が1つの問題につながっています。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.55' }] },

      // ---------- 図で見る ----------
      { clear: true, part: '図で見る', say: '図にしてみます（$k=0.4$、$x_1=1$ の例）。P₁ から角 θ で進み、となりの辺に当たるたびに同じ角で曲がる。1周すると P₂ は A の近くに来ます。',
        add: [{ t: 'h', text: '図で見る（k = 0.4、x₁ = 1）' },
          { t: 'p', size: 'sm', text: '黄：1周目　P₁ → Q₁ → R₁ → S₁ → P₂' },
          fig('f1', LAP1)] },
      { say: '2周目（うすい線）は、1周目とほとんど同じ所をまわっています。点 $\\mathrm{P}_n$ はある点に近づきそう。これを式で確かめるのが、この問題の流れです。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '流れ', text: '(1) 1辺ぶん：残りの長さ × tanθ\n(2) 4辺ぶんで、1周の漸化式\n(3) 一般項\n(4) 動かない点と、近づく点' }],
        draw: [{ fig: 'f1', items: [path(L2, 'd', 2, true)] }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。三角形 P₁BQ₁ は、B が直角の直角三角形。P₁ の角が θ なので、正接 $\\tan\\theta=\\dfrac{\\text{向かいの辺}}{\\text{となりの辺}}$ が使えます。',
        add: [{ t: 'h', text: '(1)　BQ₁ と CR₁' },
          { t: 'm', tex: '\\mathrm{BP_1}=x_1' },
          fig('f2', [{ k: 'poly', pts: [L1.P, L1.Q, L1.R], c: 'y', wd: 4 }].concat(NAMES(L1, '₁').slice(0, 3), ANG1))] },
      { ask: { type: 'choice', q: '$\\mathrm{BQ_1}$ は？（$k=\\tan\\theta$）',
        opts: ['$\\dfrac{x_1}{k}$', '$k(2-x_1)$', '$kx_1$', '$x_1\\sin\\theta$'], ok: 2,
        why: { 0: '$\\tan\\theta=\\dfrac{\\mathrm{BQ_1}}{\\mathrm{BP_1}}$ なので、わり算でなくかけ算です。', 1: '$2-x_1$ は $\\mathrm{AP_1}$。直角三角形の辺は $\\mathrm{BP_1}=x_1$ です。', 3: '$\\sin\\theta$ は斜辺 $\\mathrm{P_1Q_1}$ との比。となりの辺 BP₁ との比は tan です。' },
        good: '$\\tan\\theta=\\dfrac{\\mathrm{BQ_1}}{\\mathrm{BP_1}}$ より $\\mathrm{BQ_1}=kx_1$。',
        add: [{ t: 'm', tex: '\\mathrm{BQ_1}=kx_1' }] } },
      { say: 'Q₁ でも同じこと。三角形 Q₁CR₁ は C が直角で、Q₁ の角が θ。となりの辺は残りの長さ $\\mathrm{CQ_1}=1-kx_1$ です。',
        add: [{ t: 'm', tex: '\\mathrm{CR_1}=k\\cdot\\mathrm{CQ_1}=k(1-kx_1)' },
          { t: 'ans', label: '(1) 答', text: '$\\mathrm{BQ_1}=kx_1$\n$\\mathrm{CR_1}=k(1-kx_1)$' }] },
      { ask: { type: 'choice', q: '条件 $k<\\dfrac12$ は、図の上で何を表している？',
        opts: ['θ が ∠CAB より小さい', 'θ が $\\dfrac{\\pi}{4}$ より小さい', 'θ が ∠ACB より小さい', 'P₁ が AB の中点より B に近い'], ok: 0,
        why: { 1: '$k<1$ は正方形のときの条件。よこ 2、たて 1 では足りません。', 2: '$\\tan\\angle\\mathrm{ACB}=2$。条件は $\\tan\\angle\\mathrm{CAB}=\\frac12$ の方です。', 3: '$k$ は角の条件で、P₁ の位置とは関係ありません。' },
        good: '$\\tan\\angle\\mathrm{CAB}=\\dfrac{\\mathrm{BC}}{\\mathrm{AB}}=\\dfrac12$。θ がこれより小さいと、AB のどこから出ても辺 BC に当たります。',
        draw: [{ fig: 'f2', items: [
          { k: 'seg', a: A, b: C, c: 'b', wd: 2, dash: true },
          { k: 'seg', a: A, b: [2, 2 * K], c: 'p', wd: 2, dash: true },
          { k: 'label', at: [1.25, 0.72], text: '対角線 AC', c: 'b', size: 19 }] }] } },
      { say: '同じ理由で、どの辺から出ても、となりの辺に当たります（$\\mathrm{DS_1}<2k<1$ など）。だから問題の点は、いつも辺の上にとれます。' },

      // ---------- (2) ----------
      { clear: true, cols: [1], part: '(2)', say: '(2) です。同じ操作を4回。「次のかどまでの残りの長さ」に $k$ をかけると、次の長さ。CD の長さは 2、DA は 1 に注意します。',
        add: [{ t: 'h', text: '(2)　1周の漸化式' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['いる辺', '次のかどまでの残り', '次の長さ（× k）'],
            ['AB', '$\\mathrm{BP_1}=x_1$', '$\\mathrm{BQ_1}=kx_1$'],
            ['BC', '$\\mathrm{CQ_1}=1-kx_1$', '$\\mathrm{CR_1}=k-k^2x_1$'],
            ['CD', '$\\mathrm{DR_1}=2-k+k^2x_1$', '$\\mathrm{DS_1}=\\ ?$'],
            ['DA', '$\\mathrm{AS_1}=1-\\mathrm{DS_1}$', '$\\mathrm{AP_2}=k\\cdot\\mathrm{AS_1}$']] }] },
      { ask: { type: 'choice', q: '$\\mathrm{DS_1}$ は？',
        opts: ['$2-k+k^2x_1$', '$k(1-k+k^2x_1)$', '$k(2-k-k^2x_1)$', '$k(2-k+k^2x_1)$'], ok: 3,
        why: { 0: 'それは $\\mathrm{DR_1}$ のまま。$k$ をかけて次の長さにします。', 1: 'CD の長さは 2。$\\mathrm{DR_1}=2-\\mathrm{CR_1}$ です。', 2: '$-\\mathrm{CR_1}=-(k-k^2x_1)=-k+k^2x_1$。符号に注意。' },
        good: '$\\mathrm{DS_1}=k\\cdot\\mathrm{DR_1}=k(2-k+k^2x_1)=2k-k^2+k^3x_1$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{DS_1}=2k-k^2+k^3x_1,\\qquad \\mathrm{AS_1}=1-\\mathrm{DS_1}=1-2k+k^2-k^3x_1' }] } },
      { say: '$\\mathrm{AP_2}=k\\cdot\\mathrm{AS_1}$、最後に $x_2=\\mathrm{BP_2}=2-\\mathrm{AP_2}$。定数の部分 $2-k+2k^2-k^3$ は $(2-k)(1+k^2)$ と因数分解できます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{AP_2}=k-2k^2+k^3-k^4x_1' },
          { t: 'm', size: 'sm', tex: 'x_2=2-\\mathrm{AP_2}=k^4x_1+2-k+2k^2-k^3=k^4x_1+(2-k)(1+k^2)' }] },
      { say: '2周目からも、まったく同じ操作のくり返し。だから、どの $n$ でも同じ式が成り立ちます。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'x_{n+1}=k^4x_n+(2-k)(1+k^2)' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) です。$x_{n+1}=px_n+q$ の形。$\\alpha=k^4\\alpha+(2-k)(1+k^2)$ をみたす α を引くと、等比数列になります。',
        add: [{ t: 'h', text: '(3)　一般項' },
          { t: 'm', tex: '\\alpha=k^4\\alpha+(2-k)(1+k^2)' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '型', text: '$x_{n+1}=px_n+q$\n→ $x_{n+1}-\\alpha=p(x_n-\\alpha)$\n（ただし $\\alpha=p\\alpha+q$）' }] },
      { ask: { type: 'choice', q: 'α はどれ？',
        opts: ['$(2-k)(1+k^2)$', '$\\dfrac{2-k}{1-k^2}$', '$\\dfrac{2-k}{1+k^2}$', '$\\dfrac{(2-k)(1+k^2)}{1+k^4}$'], ok: 1,
        why: { 0: '$(1-k^4)\\alpha=(2-k)(1+k^2)$。$1-k^4$ で割り忘れています。', 2: '$1-k^4=(1-k^2)(1+k^2)$。約分して残るのは $1-k^2$ です。', 3: '移項すると $(1-k^4)\\alpha$。符号に注意。' },
        good: '$\\alpha=\\dfrac{(2-k)(1+k^2)}{(1-k^2)(1+k^2)}=\\dfrac{2-k}{1-k^2}$。',
        add: [{ t: 'm', tex: '\\alpha=\\frac{2-k}{1-k^2}' }] } },
      { say: '2つの式を引くと $x_{n+1}-\\alpha=k^4(x_n-\\alpha)$。公比 $k^4$ の等比数列です。',
        add: [{ t: 'm', tex: 'x_{n+1}-\\alpha=k^4(x_n-\\alpha)' },
          { t: 'ans', label: '(3) 答', tex: 'x_n=\\frac{2-k}{1-k^2}+\\Big(x_1-\\frac{2-k}{1-k^2}\\Big)k^{4(n-1)}' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$\\mathrm{P_2}=\\mathrm{P_1}$ は $x_2=x_1$ のこと。(3) で $n=2$ とすると $x_2-x_1=(1-k^4)(\\alpha-x_1)$。$x_1=\\alpha$ のときだけ 0 です。',
        add: [{ t: 'h', text: '(4)　もとに戻る点と、近づく点' },
          { t: 'm', size: 'sm', tex: 'x_2-x_1=(1-k^4)(\\alpha-x_1)' },
          { t: 'p', size: 'sm', text: '$1-k^4\\neq0$ なので\n$x_2=x_1\\iff x_1=\\alpha=\\dfrac{2-k}{1-k^2}$' },
          fig('f4', [path(LA, 'g', 4), { k: 'pt', at: LA.P, name: 'P', dir: 's', c: 'g' }], 540)] },
      { say: 'α が本当に辺 AB の上（$0<\\alpha<2$）にあるかも確かめます。ここで条件 $k<\\frac12$ が効きます。このとき折れ線は、1周で閉じた四角形（緑）になります。',
        add: [{ t: 'm', size: 'sm', tex: '2-\\alpha=\\frac{2(1-k^2)-(2-k)}{1-k^2}=\\frac{k(1-2k)}{1-k^2}>0' }] },
      { ask: { type: 'choice', q: '$x_1\\neq\\alpha$ のとき、$n\\to\\infty$ で $x_n$ はどうなる？',
        opts: ['$2$ に近づく', '$0$ に近づく', '大きくなり続ける', 'α に近づく'], ok: 3,
        why: { 0: '2 は点 A の位置。$\\mathrm{P}_n$ は A に行き着くわけではありません。', 1: '0 に近づくのは $k^{4(n-1)}$ の方。$x_n$ ではありません。', 2: '$0<k^4<1$ なので、α とのずれは小さくなっていきます。' },
        good: '$0<k<\\frac12$ より $0<k^4<1$。$k^{4(n-1)}\\to0$ なので $x_n\\to\\alpha$。' } },
      { say: '近づく点 P は $\\mathrm{PB}=\\alpha$、$\\mathrm{AP}=2-\\alpha=\\frac{k(1-2k)}{1-k^2}$。比をとると、分母の $1-k^2$ が消えます。',
        add: [{ t: 'ans', label: '(4) 答', text: '$x_1=\\dfrac{2-k}{1-k^2}$ のとき $\\mathrm{P_2}=\\mathrm{P_1}$\nP は AB を $k(1-2k):(2-k)$ に内分' }] },
      { ask: { type: 'think', q: '$\\tan\\theta=\\dfrac13$ のとき、P は辺 AB をどんな比に内分する？',
        hint: '$\\mathrm{AP}:\\mathrm{PB}=k(1-2k):(2-k)$ に $k=\\frac13$ を入れる。',
        ans: '$\\dfrac13\\cdot\\dfrac13:\\dfrac53=1:15$',
        after: '図の $k=0.4$ では $0.08:1.6=1:20$。P は A のすぐ近く。だから1周目の P₂ が、もう A の近くに来ていたのです。' } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '緑の閉じた折れ線は、長方形の中心について **点対称**。だから「半周で、P₁ と中心について対称な点に来る」なら、残りの半周も同じ形で閉じます。',
        add: [{ t: 'h', text: '別の見方：点対称を使う' },
          { t: 'p', size: 'sm', text: '中心のまわりに 180° 回すと\nAB → CD、BC → DA にうつり\n折れ線の作り方も同じ' },
          fig('f5', [path(LA, 'g', 4), { k: 'pt', at: [1, 0.5], name: '中心', dir: 'n', c: 'b', size: 20 },
            { k: 'pt', at: LA.P, name: 'P₁', dir: 's', c: 'g' }, { k: 'pt', at: LA.R, name: 'R₁', dir: 'n', c: 'g' },
            { k: 'seg', a: LA.P, b: LA.R, c: 'b', wd: 2, dash: true }], 540)] },
      { ask: { type: 'think', q: '$\\mathrm{CR_1}=\\mathrm{AP_1}$（R₁ が P₁ と中心について対称な点）とおいて $x_1$ を求め、α と一致することを確かめよう。',
        hint: '$\\mathrm{CR_1}=k(1-kx_1)$、$\\mathrm{AP_1}=2-x_1$。',
        ans: '$k-k^2x_1=2-x_1$ より $(1-k^2)x_1=2-k$、$x_1=\\dfrac{2-k}{1-k^2}$（$=\\alpha$）',
        after: '半周ぶんの計算だけで「動かない点」が出ます。図形の対称性は、計算の検算にも近道にもなります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。図形の操作をくり返す問題は「1回ぶんを式にする → 漸化式 → 動かない点」の流れで考えます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
