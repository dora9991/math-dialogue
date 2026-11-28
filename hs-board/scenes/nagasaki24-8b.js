/* 2024 長崎大 理系 第8問の類題②（自作）：正三角形の中をまわる折れ線 ― 正弦定理で長さ、1周の漸化式、動かない点と極限
   元の問題はうつしていない（類題①とも別の問題。「辺と一定の角をなすように隣の辺に点を順にとって図形の中をまわる折れ線をつくり、
   長さを角の三角比で表し、1周の1次の漸化式・一般項・1周で戻る点と近づく点（内分比）を求める」というねらい・形式だけを合わせ、
   図形は正三角形、長さは直角三角形の tan でなく一般の三角形の正弦定理で出す自作問題にした。①と違い、1周の係数が負（−k³）で
   折れ線の点が左右に行ったり来たりしながら近づく）。
   答え（python3・sympy と、角度から直接作図する数値計算で検算ずみ）：B(0,0) C(1,0) A(1/2,√3/2)、k=sinθ/sin(120°−θ)（0<k<1）、x_n=BP_n
   (1) BQ1=kx1、CR1=k(1−kx1)（三角形 BP1Q1 で B=60°, P1=θ, Q1=120°−θ。正弦定理）
   (2) AR1=1−k+k²x1、AP2=k−k²+k³x1 → x_{n+1}=−k³x_n+1−k+k²
   (3) α=(1−k+k²)/(1+k³)=1/(1+k)、x_n=α+(x1−α)(−k³)^{n−1}
   (4) x2−x1=(1+k³)(α−x1)、P2=P1 ⇔ x1=1/(1+k)。0<k<1 で x_n→α、AP=k/(1+k)、AP:PB=k:1
       θ=45° なら k=√3−1（数値でも漸化式どおり）、θ=30° なら k=1/2 で AP:PB=1:2。x_n は 0<x_n<1 のまま（どの点も辺の上）
   別の見方：1周で閉じる折れ線は 120° 回転で自分自身にうつる。BP1=CQ1 ⇔ x1=1−kx1 ⇔ x1=1/(1+k) */
(function () {
  const S3 = Math.sqrt(3), K = S3 - 1;
  const A = [0.5, S3 / 2], B = [0, 0], C = [1, 0];
  const lap = x => { const q = K * x, cr = K * (1 - q), ar = 1 - cr, ap = K * ar, x2 = 1 - ap;
    return { P: [x / 2, x * S3 / 2], Q: [q, 0], R: [1 - cr / 2, cr * S3 / 2], T: [x2 / 2, x2 * S3 / 2], next: x2 }; };
  const L1 = lap(0.5), L2 = lap(L1.next), AL = 1 / (1 + K), LA = lap(AL);
  const path = (L, c, wd, dash) => ({ k: 'poly', pts: [L.P, L.Q, L.R, L.T], c, wd, dash });
  const tri = (items) => [
    { k: 'poly', pts: [A, B, C], close: true, c: 'w', wd: 3 },
    { k: 'pt', at: A, name: 'A', dir: 'n', c: 'w', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', c: 'w', r: 4 },
    { k: 'pt', at: C, name: 'C', dir: 'se', c: 'w', r: 4 }
  ].concat(items || []);
  const fig = (id, items, w) => ({ t: 'fig', id, col: 1, view: [-0.2, -0.17, 1.2, 1.0], w: w || 560, h: Math.round((w || 560) * 1.17 / 1.4), items: tri(items) });
  const NAMES = (L, sub, n3) => [
    { k: 'pt', at: L.P, name: 'P' + sub, dir: 'w', c: 'y' }, { k: 'pt', at: L.Q, name: 'Q' + sub, dir: 's', c: 'y' },
    { k: 'pt', at: L.R, name: 'R' + sub, dir: 'e', c: 'y' }].concat(n3 ? [{ k: 'pt', at: L.T, name: 'P₂', dir: 'w', c: 'p' }] : []);
  const LAP1 = [path(L1, 'y', 4), ...NAMES(L1, '₁', true)];
  const POINTS = [
    '角が決まった三角形は、正弦定理で「次の辺の長さ ＝ $k$ × 残りの長さ」。3辺ぶん順に書くと、1周の漸化式 $x_{n+1}=-k^3x_n+1-k+k^2$ になる',
    '$x_{n+1}=px_n+q$ は $\\alpha=p\\alpha+q$ の α を引いて等比数列に。公比が負でも $|p|<1$ なら $x_n\\to\\alpha$',
    '「1周でもとに戻る点」＝漸化式の動かない点 α。$1+k^3=(1+k)(1-k+k^2)$ で約分すると $\\alpha=\\dfrac{1}{1+k}$、比は $k:1$'
  ];

  HB.lesson({
    id: 'nagasaki24-8b', field: '長崎大型　数学（理系）', title: '2024 長崎大 理系 第8問の類題② ― 正三角形の中をまわる折れ線と漸化式の極限', level: '2024年度 長崎大学 理系 第8問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$\\mathrm{AB}=\\mathrm{BC}=\\mathrm{CA}=1$ の正三角形 ABC がある。$\\theta$ は $0^\\circ<\\theta<60^\\circ$ をみたす角とし，$k=\\dfrac{\\sin\\theta}{\\sin(120^\\circ-\\theta)}$ とおく。辺 AB 上に点 $\\mathrm{P_1}$（A，B とは異なる）をとり，$\\angle\\mathrm{BP_1Q_1}=\\theta$ となる点 $\\mathrm{Q_1}$ を辺 BC 上に，$\\angle\\mathrm{CQ_1R_1}=\\theta$ となる点 $\\mathrm{R_1}$ を辺 CA 上に，$\\angle\\mathrm{AR_1P_2}=\\theta$ となる点 $\\mathrm{P_2}$ を辺 AB 上にとる。同じようにして $\\mathrm{P_2}$ から $\\mathrm{Q_2},\\ \\mathrm{R_2},\\ \\mathrm{P_3}$ をとり，これをくり返す。$x_n=\\mathrm{BP}_n$ とする。',
      parts: [
        '(1)　$\\mathrm{BQ_1}$ と $\\mathrm{CR_1}$ を $k,\\ x_1$ で表せ。',
        '(2)　$x_{n+1}$ を $x_n$ と $k$ で表せ。',
        '(3)　$x_n$ を $n,\\ k,\\ x_1$ で表せ。',
        '(4)　$\\mathrm{P_2}=\\mathrm{P_1}$ となるような $x_1$ の値を求めよ。また，$\\mathrm{P_2}\\neq\\mathrm{P_1}$ のとき，$n\\to\\infty$ で点 $\\mathrm{P}_n$ は辺 AB 上のある点 P に限りなく近づく。P は辺 AB をどのような比に内分するか。'
      ],
      src: '※ 2024年度 長崎大学 前期 理系（医学部医学科）第8問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.46, 0.54],
    steps: [
      { part: '問題', cols: [1], say: '正三角形の中を、辺と同じ角度で曲がりながらまわる折れ線の問題です。三角比・漸化式・極限が1つの問題につながっています。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:23px;line-height:1.55' }] },

      // ---------- 図で見る ----------
      { clear: true, part: '図で見る', say: '図にしてみます（$\\theta=45^\\circ$、$x_1=0.5$ の例）。P₁ から角 θ で進み、となりの辺に当たるたびに同じ角で曲がる。3回曲がると P₂ に来ます。',
        add: [{ t: 'h', text: '図で見る（θ = 45°、x₁ = 0.5）' },
          { t: 'p', size: 'sm', text: '黄：1周目　P₁ → Q₁ → R₁ → P₂' },
          fig('f1', LAP1)] },
      { say: '2周目（うすい線）は、1周目と少しずれた所をまわります。$\\mathrm{P}_n$ は左右に行ったり来たりしながら、ある点に近づきそう。これを式で確かめるのが、この問題の流れです。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '流れ', text: '(1) 1辺ぶん：正弦定理で $k$ 倍\n(2) 3辺ぶんで、1周の漸化式\n(3) 一般項\n(4) 動かない点と、近づく点' }],
        draw: [{ fig: 'f1', items: [path(L2, 'd', 2, true)] }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。三角形 $\\mathrm{BP_1Q_1}$ の角は、B が $60^\\circ$、P₁ が θ。三角形の内角の和から Q₁ は $120^\\circ-\\theta$。正弦定理が使えます。',
        add: [{ t: 'h', text: '(1)　BQ₁ と CR₁' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BP_1}=x_1,\\quad \\angle\\mathrm{B}=60^\\circ,\\ \\angle\\mathrm{P_1}=\\theta,\\ \\angle\\mathrm{Q_1}=120^\\circ-\\theta' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '正弦定理', text: '$\\dfrac{\\mathrm{BQ_1}}{\\sin\\angle\\mathrm{P_1}}=\\dfrac{\\mathrm{BP_1}}{\\sin\\angle\\mathrm{Q_1}}$' },
          fig('f2', [{ k: 'poly', pts: [L1.P, L1.Q, L1.R], c: 'y', wd: 4 }].concat(NAMES(L1, '₁'), [
            { k: 'angle', o: B, a: C, b: L1.P, rp: 34, c: 'g' }, { k: 'label', at: B, text: '60°', dx: 50, dy: -13, c: 'g', size: 19 },
            { k: 'angle', o: L1.P, a: B, b: L1.Q, rp: 48, label: 'θ', c: 'g' },
            { k: 'angle', o: L1.Q, a: L1.P, b: B, rp: 34, c: 'g' }, { k: 'label', at: L1.Q, text: '120°−θ', dx: -52, dy: -41, c: 'g', size: 16 }]), 440)] },   // 角の字は、重ならないよう 位置を 決めて かく
      { ask: { type: 'choice', q: '$\\mathrm{BQ_1}$ は？（$k=\\dfrac{\\sin\\theta}{\\sin(120^\\circ-\\theta)}$）',
        opts: ['$x_1\\tan\\theta$', '$\\dfrac{x_1}{k}$', '$kx_1$', '$x_1\\sin\\theta$'], ok: 2,
        why: { 0: '直角三角形ではないので tan は使えません。正弦定理で比べます。', 1: '$\\mathrm{BQ_1}$ は θ の向かい、$\\mathrm{BP_1}$ は $120^\\circ-\\theta$ の向かい。比は $\\sin\\theta:\\sin(120^\\circ-\\theta)=k:1$ です。', 3: '正弦定理は「辺 ÷ 向かいの角の sin」の比べ合い。$x_1\\sin\\theta$ だけでは足りません。' },
        good: '$\\mathrm{BQ_1}=\\dfrac{\\sin\\theta}{\\sin(120^\\circ-\\theta)}\\mathrm{BP_1}=kx_1$。',
        add: [{ t: 'm', tex: '\\mathrm{BQ_1}=kx_1' }] } },
      { say: 'Q₁ でも同じこと。三角形 $\\mathrm{CQ_1R_1}$ は C が $60^\\circ$、Q₁ が θ で、形が同じ。向かい合う角の組も同じなので、$\\mathrm{CR_1}=k\\cdot\\mathrm{CQ_1}$、$\\mathrm{CQ_1}=1-kx_1$ です。',
        add: [{ t: 'm', tex: '\\mathrm{CR_1}=k\\cdot\\mathrm{CQ_1}=k(1-kx_1)' },
          { t: 'ans', label: '(1) 答', text: '$\\mathrm{BQ_1}=kx_1$\n$\\mathrm{CR_1}=k(1-kx_1)$' }] },
      { ask: { type: 'choice', q: '$0^\\circ<\\theta<60^\\circ$ のとき、$k$ と 1 の大小は？',
        opts: ['$k<1$', '$k=1$', '$k>1$', 'θ によって変わる'], ok: 0,
        why: { 1: '$k=1$ になるのは $\\theta=120^\\circ-\\theta$、つまり $\\theta=60^\\circ$ のときです。', 2: '$\\theta<60^\\circ$ なら $120^\\circ-\\theta>\\theta$。$\\mathrm{BQ_1}$ は小さい角の向かいなので短くなります。', 3: '$0^\\circ<\\theta<60^\\circ$ ならいつも同じ大小です。' },
        good: '$120^\\circ-\\theta>\\theta$ で、大きい角の向かいの辺ほど長いので $\\mathrm{BP_1}>\\mathrm{BQ_1}$、つまり $0<k<1$。どの点もいつも辺の上にとれます。' } },

      // ---------- (2) ----------
      { clear: true, cols: [1], part: '(2)', say: '(2) です。同じ操作を3回。「次のかどまでの残りの長さ」に $k$ をかけると、次の長さ。1辺の長さはどれも 1 に注意します。',
        add: [{ t: 'h', text: '(2)　1周の漸化式' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['いる辺', '次のかどまでの残り', '次の長さ（× k）'],
            ['AB', '$\\mathrm{BP_1}=x_1$', '$\\mathrm{BQ_1}=kx_1$'],
            ['BC', '$\\mathrm{CQ_1}=1-kx_1$', '$\\mathrm{CR_1}=k-k^2x_1$'],
            ['CA', '$\\mathrm{AR_1}=1-\\mathrm{CR_1}$', '$\\mathrm{AP_2}=\\ ?$']] }] },
      { ask: { type: 'choice', q: '$\\mathrm{AP_2}$ は？',
        opts: ['$1-k+k^2x_1$', '$k-k^2-k^3x_1$', '$k(1-k^2x_1)$', '$k-k^2+k^3x_1$'], ok: 3,
        why: { 0: 'それは $\\mathrm{AR_1}$ のまま。$k$ をかけて次の長さにします。', 1: '$\\mathrm{AR_1}=1-(k-k^2x_1)=1-k+k^2x_1$。$k^2x_1$ の符号は＋です。', 2: '$\\mathrm{AR_1}$ の $-k$ が抜けています。' },
        good: '$\\mathrm{AR_1}=1-k+k^2x_1$ に $k$ をかけて $\\mathrm{AP_2}=k-k^2+k^3x_1$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{AR_1}=1-k+k^2x_1,\\qquad \\mathrm{AP_2}=k-k^2+k^3x_1' }] } },
      { say: '最後に $x_2=\\mathrm{BP_2}=1-\\mathrm{AP_2}$。$x_1$ の係数が $-k^3$ と **負** になるのが、この問題の特徴です。2周目からも同じ操作のくり返しなので、どの $n$ でも同じ式です。',
        add: [{ t: 'm', size: 'sm', tex: 'x_2=1-\\mathrm{AP_2}=-k^3x_1+1-k+k^2' },
          { t: 'ans', label: '(2) 答', tex: 'x_{n+1}=-k^3x_n+1-k+k^2' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) です。$x_{n+1}=px_n+q$ の形。$\\alpha=-k^3\\alpha+1-k+k^2$ をみたす α を引くと、等比数列になります。',
        add: [{ t: 'h', text: '(3)　一般項' },
          { t: 'm', tex: '\\alpha=-k^3\\alpha+1-k+k^2' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '型', text: '$x_{n+1}=px_n+q$\n→ $x_{n+1}-\\alpha=p(x_n-\\alpha)$\n（ただし $\\alpha=p\\alpha+q$）' }] },
      { ask: { type: 'choice', q: 'α はどれ？',
        opts: ['$1-k+k^2$', '$\\dfrac{1}{1+k}$', '$\\dfrac{1-k+k^2}{1-k^3}$', '$\\dfrac{1}{1-k}$'], ok: 1,
        why: { 0: '$(1+k^3)\\alpha=1-k+k^2$。$1+k^3$ で割り忘れています。', 2: '移項すると $(1+k^3)\\alpha$。$-k^3\\alpha$ を移項するので符号は＋です。', 3: '$1+k^3=(1+k)(1-k+k^2)$。約分して残るのは $1+k$ です。' },
        good: '$\\alpha=\\dfrac{1-k+k^2}{1+k^3}=\\dfrac{1-k+k^2}{(1+k)(1-k+k^2)}=\\dfrac{1}{1+k}$。',
        add: [{ t: 'm', tex: '\\alpha=\\frac{1}{1+k}' }] } },
      { say: '2つの式を引くと $x_{n+1}-\\alpha=-k^3(x_n-\\alpha)$。公比 $-k^3$ の等比数列です。',
        add: [{ t: 'm', tex: 'x_{n+1}-\\alpha=-k^3(x_n-\\alpha)' },
          { t: 'ans', label: '(3) 答', tex: 'x_n=\\frac{1}{1+k}+\\Big(x_1-\\frac{1}{1+k}\\Big)(-k^3)^{n-1}' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$\\mathrm{P_2}=\\mathrm{P_1}$ は $x_2=x_1$ のこと。(3) で $n=2$ とすると $x_2-x_1=(1+k^3)(\\alpha-x_1)$。$x_1=\\alpha$ のときだけ 0 です。',
        add: [{ t: 'h', text: '(4)　もとに戻る点と、近づく点' },
          { t: 'm', size: 'sm', tex: 'x_2-x_1=(1+k^3)(\\alpha-x_1)' },
          { t: 'p', size: 'sm', text: '$1+k^3\\neq0$ なので\n$x_2=x_1\\iff x_1=\\alpha=\\dfrac{1}{1+k}$' },
          { t: 'p', size: 'sm', text: '図（緑）：このとき折れ線は、1周で閉じた正三角形になる' },
          fig('f4', [path(LA, 'g', 4), { k: 'pt', at: LA.P, name: 'P', dir: 'w', c: 'g' }], 480)] },
      { ask: { type: 'choice', q: '$x_1\\neq\\alpha$ のとき、$n\\to\\infty$ で $x_n$ はどうなる？',
        opts: ['$0$ に近づく', '$1$ に近づく', '正負をくり返して発散する', 'α に近づく'], ok: 3,
        why: { 0: '0 に近づくのは $(-k^3)^{n-1}$ の方。$x_n$ ではありません。', 1: '1 は点 A の位置。$\\mathrm{P}_n$ は A に行き着くわけではありません。', 2: '$|-k^3|<1$ なので、α とのずれは符号を変えながら小さくなっていきます。' },
        good: '$0<k<1$ より $|-k^3|<1$。$(-k^3)^{n-1}\\to0$ なので $x_n\\to\\alpha$（α の左右を行ったり来たり）。' } },
      { say: '近づく点 P は $\\mathrm{PB}=\\alpha=\\frac{1}{1+k}$、$\\mathrm{AP}=1-\\alpha=\\frac{k}{1+k}$。比をとると、分母の $1+k$ が消えます。',
        add: [{ t: 'ans', label: '(4) 答', text: '$x_1=\\dfrac{1}{1+k}$ のとき $\\mathrm{P_2}=\\mathrm{P_1}$\nP は AB を $\\mathrm{AP}:\\mathrm{PB}=k:1$ に内分' }] },
      { ask: { type: 'think', q: '$\\theta=30^\\circ$ のとき、P は辺 AB をどんな比に内分する？',
        hint: '$k=\\dfrac{\\sin30^\\circ}{\\sin90^\\circ}$ を求めて、$\\mathrm{AP}:\\mathrm{PB}=k:1$ に入れる。',
        ans: '$k=\\dfrac12$ なので $\\mathrm{AP}:\\mathrm{PB}=\\dfrac12:1=1:2$',
        after: 'このとき $\\angle\\mathrm{P_1Q_1B}=90^\\circ$。折れ線は各辺に垂直な線の組になり、正三角形の1辺を $1:2$ に分けます。図の $\\theta=45^\\circ$ では $k=\\sqrt3-1$。' } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '緑の閉じた折れ線は、正三角形の中心のまわりの $120^\\circ$ 回転で自分自身にうつります。だから「$\\mathrm{BP_1}=\\mathrm{CQ_1}$」と置くだけで、動かない点が出ます。',
        add: [{ t: 'h', text: '別の見方：回転対称を使う' },
          { t: 'p', size: 'sm', text: '120° 回すと\nAB → BC → CA にうつり\n折れ線の作り方も同じ' },
          { t: 'm', size: 'sm', tex: '\\mathrm{BP_1}=\\mathrm{CQ_1}\\iff x_1=1-kx_1' },
          fig('f5', [path(LA, 'g', 4), { k: 'pt', at: [0.5, S3 / 6], name: '中心', dir: 'n', c: 'b', size: 20 },
            { k: 'pt', at: LA.P, name: 'P₁', dir: 'w', c: 'g' }, { k: 'pt', at: LA.Q, name: 'Q₁', dir: 's', c: 'g' }, { k: 'pt', at: LA.R, name: 'R₁', dir: 'e', c: 'g' }], 480)] },
      { ask: { type: 'think', q: '$x_1=1-kx_1$ を解いて、α と一致することを確かめよう。',
        hint: '$x_1$ について整理して、$(1+k)x_1=1$。',
        ans: '$(1+k)x_1=1$ より $x_1=\\dfrac{1}{1+k}$（$=\\alpha$）',
        after: '1辺ぶんの計算だけで「動かない点」が出ます。図形の対称性は、計算の検算にも近道にもなります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。図形の操作をくり返す問題は「1回ぶんを式にする → 漸化式 → 動かない点」の流れで考えます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
