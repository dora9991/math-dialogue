/* 2025 阪大 理系 第3問の類題（自作）：数学C 空間ベクトル・2次曲線、数学Ⅲ 微分法 ― なす角が一定の点の軌跡（楕円）と、その上の点の量の最大・最小
   元の問題はうつしていない（「空間の定点と座標平面上を動く点で、2つのベクトルのなす角が一定という条件（内積）から軌跡が楕円になる」
   「軌跡上の点を角の媒介変数で表し、ある量の最大値・最小値を微分で求める」というねらいと形式だけを合わせた自作問題。
   定点は A(0,0,1)・B(1,0,0)、条件は ∠PAB=30°、調べる量は y/x（直線 OP の傾き）にした）。
   答え（python3・sympy と数値で検算ずみ）：
   (1) AP·AB=x+1、|AB|=√2。x+1=√2·√(x²+y²+1)·(√3/2) ⇔ x+1>0 かつ 2(x+1)²=3(x²+y²+1) ⇔ x+1>0 かつ (x−2)²/3+y²=1。
       楕円上では 2−√3≦x≦2+√3 なので x+1>0 は自動的に成り立つ → 軌跡は楕円 (x−2)²/3+y²=1 全体。
       x 軸上の頂点 2∓√3＝tan15°, tan75°（∠OAB=45° から ±30°）。
   (2) x=2+√3cosθ, y=sinθ。g=sinθ/(2+√3cosθ)、g'=(2cosθ+√3)/(2+√3cosθ)²。θ=5π/6 で最大 1（P(1/2, 1/2)）、θ=7π/6 で最小 −1（P(1/2, −1/2)）。
       別解：y=mx を代入 (1+3m²)x²−4x+1=0、D/4=3−3m²≧0 ⇔ |m|≦1。数値でも max 0.99999…・min −0.99999…。 */
(function () {
  const POINTS = [
    'なす角の条件は内積で：$\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=|\\overrightarrow{\\mathrm{AP}}||\\overrightarrow{\\mathrm{AB}}|\\cos30^\\circ$。**2乗する前に「左辺 $>0$」** を条件として残し、同値に変形する',
    '頂点 A・軸 AB の円錐を平面で切ると楕円。式は平方完成で標準形 $\\dfrac{(x-2)^2}{3}+y^2=1$ にし、残した条件（$x+1>0$）が自動的にみたされるかを確かめる',
    '楕円上の点は $x=2+\\sqrt3\\cos\\theta,\\ y=\\sin\\theta$ と角で表し、量を $\\theta$ で微分して増減表。$\\dfrac yx$ の最大・最小は、直線 OP が楕円に接するとき'
  ];
  const r3 = Math.sqrt(3);
  // ---- 見取図（正射影：x 軸は左下、y 軸は右、z 軸は上） ----
  const nrm = v => { const L = Math.hypot(...v); return v.map(c => c / L); };
  const V = nrm([1, 0.5, 0.6]), E1 = nrm([-V[1], V[0], 0]), E2 = [V[1] * E1[2] - V[2] * E1[1], V[2] * E1[0] - V[0] * E1[2], V[0] * E1[1] - V[1] * E1[0]];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const f4 = v => v.toFixed(4);
  const A3 = [0, 0, 1], B3 = [1, 0, 0], V1 = [2 - r3, 0, 0], V2 = [2 + r3, 0, 0], W1 = [2, 1, 0], W2 = [2, -1, 0];
  const ell3 = { k: 'param', x: `(2+${f4(r3)}*cos(t))*${f4(E1[0])}+sin(t)*${f4(E1[1])}`, y: `(2+${f4(r3)}*cos(t))*${f4(E2[0])}+sin(t)*${f4(E2[1])}`, a: 0, b: 2 * Math.PI, c: 'p', wd: 3 };
  const cone = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.45, -2.05, 1.75, 1.55], w: 480, h: Math.round(480 * 3.6 / 4.2), items: [
    { k: 'vec', a: pj([0, 0, 0]), b: pj([4.5, 0, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 1.7, 0]), c: 'd', wd: 2 }, { k: 'vec', a: pj([0, 0, 0]), b: pj([0, 0, 1.6]), c: 'd', wd: 2 },
    { k: 'label', at: pj([4.5, 0, 0]), text: 'x', dx: -16, dy: 8, c: 'd' }, { k: 'label', at: pj([0, 1.7, 0]), text: 'y', dy: 20, c: 'd' }, { k: 'label', at: pj([0, 0, 1.6]), text: 'z', dx: 16, c: 'd' },
    { k: 'label', at: [0, 0], text: 'O', dx: -18, dy: -10, c: 'd', size: 22 },
    ell3,
    { k: 'seg', a: pj(A3), b: pj(V1), c: 'y', wd: 2 }, { k: 'seg', a: pj(A3), b: pj(V2), c: 'y', wd: 2 },
    { k: 'seg', a: pj(A3), b: pj(W1), c: 'y', wd: 2, dash: true }, { k: 'seg', a: pj(A3), b: pj(W2), c: 'y', wd: 2, dash: true },
    { k: 'seg', a: pj(A3), b: pj(B3), c: 'g', wd: 3 },
    { k: 'pt', at: pj(A3), name: 'A', dir: 'ne', c: 'w' }, { k: 'pt', at: pj(B3), name: 'B', dir: 'sw', c: 'g' }
  ].concat(extra || []) });
  // ---- xy 平面の図 ----
  const plane = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-0.6, -1.55, 4.3, 1.55], w: w || 460, h: Math.round((w || 460) * 3.1 / 4.9), items: [
    { k: 'axes', tx: [[1, '1'], [2, '2'], [3, '3']], ty: [[1, '1'], [-1, '−1']] },
    { k: 'param', x: `2+${f4(r3)}*cos(t)`, y: 'sin(t)', a: 0, b: 2 * Math.PI, c: 'p', wd: 3 },
    { k: 'pt', at: [2, 0], c: 'w', r: 4 }, { k: 'label', at: [2, 0], text: '(2, 0)', dy: -16, size: 18, c: 'w' }
  ].concat(extra || []) });
  const tang = [
    { k: 'line', m: 1, n: 0, a: -0.4, b: 1.5, c: 'y', wd: 2 }, { k: 'line', m: -1, n: 0, a: -0.4, b: 1.5, c: 'g', wd: 2 },
    { k: 'pt', at: [0.5, 0.5], name: '(½, ½)', dir: 'e', c: 'y', size: 19 }, { k: 'pt', at: [0.5, -0.5], name: '(½, −½)', dir: 'e', c: 'g', size: 19 }];

  HB.lesson({
    id: 'osaka25-3', noDec: true, field: '阪大型　数学（理系）', title: '2025 阪大 理系 第3問の類題 ― なす角が一定の点がえがく楕円と傾きの最大・最小', level: '2025年度 大阪大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 点 A$(0,\\ 0,\\ 1)$、B$(1,\\ 0,\\ 0)$ がある。点 P$(x,\\ y,\\ 0)$ は $xy$ 平面上を、$\\angle\\mathrm{PAB}=30^\\circ$ をみたしながら動く。',
      parts: [
        '(1)　点 P の軌跡を、$xy$ 平面上の曲線として求めよ。',
        '(2)　点 P が (1) の軌跡上を動くとき、$\\dfrac{y}{x}$ の最大値と最小値、およびそのときの点 P の座標を求めよ。'
      ],
      src: '※ 2025年度 大阪大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', cols: [1], say: '空間ベクトルと2次曲線、微分の融合問題です。(1) で軌跡を求め、(2) でその上の最大・最小を調べます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '∠PAB が 30° の点 P は、A を頂点、AB を軸とする円錐の上にあります。その円錐を $xy$ 平面で切った切り口が、P の軌跡です。',
        add: [{ t: 'h', text: '読みかえ：円錐を平面で切る' },
          { t: 'p', size: 'sm', text: '∠PAB＝30° をみたす点 P 全体\n＝ 頂点 A、軸 AB（緑）、半頂角 30° の円錐' },
          { t: 'p', size: 'sm', text: '→ $xy$ 平面との交わり（桃）が軌跡' },
          cone('c1')] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AP}}=(x,\\ y,\\ -1)$、$\\overrightarrow{\\mathrm{AB}}=(1,\\ 0,\\ -1)$。内積 $\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}$ は？',
        opts: ['$x-1$', '$x+1$', '$1-x$', '$x+y+1$'], ok: 1,
        why: { 0: '$z$ 成分どうしは $(-1)\\cdot(-1)=+1$ です。', 2: '$x$ 成分は $x\\cdot1=x$。符号が逆です。', 3: '$y$ 成分は $y\\cdot0=0$ で、消えます。' },
        good: '$x\\cdot1+y\\cdot0+(-1)\\cdot(-1)=x+1$。また $|\\overrightarrow{\\mathrm{AB}}|=\\sqrt2$、$|\\overrightarrow{\\mathrm{AP}}|=\\sqrt{x^2+y^2+1}$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=x+1' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: 'なす角が 30° という条件を、内積で書きます。右辺はルートの積なので、2乗して整理したい。でも、その前に注意があります。',
        add: [{ t: 'h', text: '(1)　条件を式にする' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AP}}\\cdot\\overrightarrow{\\mathrm{AB}}=|\\overrightarrow{\\mathrm{AP}}||\\overrightarrow{\\mathrm{AB}}|\\cos30^\\circ' },
          { t: 'm', tex: 'x+1=\\sqrt{x^2+y^2+1}\\cdot\\sqrt2\\cdot\\frac{\\sqrt3}{2}', note: '…①' }] },
      { ask: { type: 'choice', q: '① を2乗して同値に変形するには、どんな条件を残す必要がある？',
        opts: ['$x>0$', '$y>0$', '$x+1>0$', '条件はいらない'], ok: 2,
        why: { 0: '右辺が正なので、左辺 $x+1$ が正であることが必要です。$x>0$ は強すぎます。', 1: '$y$ の符号は関係ありません。軌跡は $x$ 軸について対称です。', 3: '2乗だけだと、$x+1<0$（なす角 150°）の点がまぎれこむおそれがあります。' },
        good: '① の右辺は正。だから ① ⇔「$x+1>0$ かつ 2乗した式」。2乗だけでは、なす角 150° の点が入るおそれがあります。',
        add: [{ t: 'm', tex: 'x+1>0\\ \\text{かつ}\\ (x+1)^2=\\frac32(x^2+y^2+1)', note: '① と同値 …②' }] } },
      { say: '② の2乗した式を整理します。両辺を 2 倍して展開すると $2x^2+4x+2=3x^2+3y^2+3$。移項すると $x^2-4x+3y^2+1=0$ です。',
        add: [{ t: 'm', tex: 'x^2-4x+3y^2+1=0\\iff(x-2)^2+3y^2=3' }] },
      { ask: { type: 'choice', q: '$(x-2)^2+3y^2=3$ を標準形にすると？',
        opts: ['$(x-2)^2+\\dfrac{y^2}{3}=1$', '$\\dfrac{(x+2)^2}{3}+y^2=1$', '$\\dfrac{(x-2)^2}{3}+\\dfrac{y^2}{3}=1$', '$\\dfrac{(x-2)^2}{3}+y^2=1$'], ok: 3,
        why: { 0: '両辺を 3 で割ります。割られるのは $(x-2)^2$ のほうです。', 1: '中心は $(2,\\ 0)$。符号が逆です。', 2: '$3y^2\\div3=y^2$ です。' },
        good: '両辺を 3 で割って $\\frac{(x-2)^2}{3}+y^2=1$。中心 $(2,\\ 0)$、$x$ 方向の半径 $\\sqrt3$、$y$ 方向の半径 1 の楕円です。',
        add: [{ t: 'm', tex: '\\frac{(x-2)^2}{3}+y^2=1' }] } },
      { clear: true, part: '(1) 答え', say: '残しておいた条件 $x+1>0$ を確かめます。この楕円上では $2-\\sqrt3\\le x\\le2+\\sqrt3$ なので、いつも $x>0$、つまり $x+1>0$。楕円全体が軌跡です。',
        add: [{ t: 'h', text: '(1)　条件 x＋1＞0 を確かめる' },
          { t: 'm', tex: '2-\\sqrt3\\le x\\le2+\\sqrt3\\ \\Longrightarrow\\ x+1>0' },
          { t: 'ans', label: '(1) 答', tex: '\\text{楕円}\\ \\ \\frac{(x-2)^2}{3}+y^2=1' },
          plane('e1')] },
      { ask: { type: 'think', q: '$x$ 軸上の2つの頂点 $(2\\pm\\sqrt3,\\ 0)$ を、角度だけで確かめよう。（ヒント：∠OAB は何度？）',
        hint: 'OA＝OB＝1 で ∠AOB＝90° なので ∠OAB＝45°。P が $x$ 軸上なら ∠OAP は 45° ± 30°。',
        ans: '∠OAP＝15° のとき OP＝$\\tan15^\\circ=2-\\sqrt3$、∠OAP＝75° のとき OP＝$\\tan75^\\circ=2+\\sqrt3$',
        after: 'OA＝1 なので OP＝tan∠OAP。式と図形の両方から同じ点が出ました。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '$\\dfrac yx$ は直線 OP の傾きです。楕円上の点を角 $\\theta$ で表して、$\\theta$ の関数として微分します。分母 $2+\\sqrt3\\cos\\theta$ はいつも正です。',
        add: [{ t: 'h', text: '(2)　角 θ で表して微分する' },
          { t: 'm', tex: 'x=2+\\sqrt3\\cos\\theta,\\quad y=\\sin\\theta\\quad(0\\le\\theta<2\\pi)' },
          { t: 'm', tex: 'g(\\theta)=\\frac{y}{x}=\\frac{\\sin\\theta}{2+\\sqrt3\\cos\\theta}' },
          plane('e2', [{ k: 'seg', a: [0, 0], b: [2 + r3 * Math.cos(2.2), Math.sin(2.2)], c: 'y', wd: 2 }, { k: 'pt', at: [2 + r3 * Math.cos(2.2), Math.sin(2.2)], name: 'P', dir: 'n', c: 'y' }])] },
      { ask: { type: 'choice', q: "$g'(\\theta)=\\dfrac{(\\ \\ \\ )}{(2+\\sqrt3\\cos\\theta)^2}$。分子は？",
        opts: ['$2\\cos\\theta+\\sqrt3$', '$2\\cos\\theta-\\sqrt3$', '$2\\sin\\theta+\\sqrt3$', '$2\\cos\\theta+\\sqrt3\\cos2\\theta$'], ok: 0,
        why: { 1: '$(\\cos\\theta)\'=-\\sin\\theta$ なので、引く項は $\\sin\\theta\\cdot(-\\sqrt3\\sin\\theta)$。符号に注意。', 2: '分子の最初の項は $(\\sin\\theta)\'\\cdot(2+\\sqrt3\\cos\\theta)$ で、$\\cos\\theta$ が出ます。', 3: '$\\sqrt3\\cos^2\\theta+\\sqrt3\\sin^2\\theta=\\sqrt3$ とまとめられます。' },
        good: '$\\cos\\theta(2+\\sqrt3\\cos\\theta)-\\sin\\theta\\cdot(-\\sqrt3\\sin\\theta)=2\\cos\\theta+\\sqrt3(\\cos^2\\theta+\\sin^2\\theta)$。',
        add: [{ t: 'm', tex: "g'(\\theta)=\\frac{2\\cos\\theta+\\sqrt3}{(2+\\sqrt3\\cos\\theta)^2}" }] } },
      { clear: true, cols: [0.54, 0.46], part: '(2) 増減', say: '分母は正なので、符号は $2\\cos\\theta+\\sqrt3$ で決まります。$\\cos\\theta=-\\dfrac{\\sqrt3}{2}$ となる $\\theta=\\dfrac56\\pi,\\ \\dfrac76\\pi$ で符号が変わります。',
        add: [{ t: 'h', text: '(2)　増減表' },
          { t: 'tbl', size: 'sm', rows: [['$\\theta$', '$0$', '$\\cdots$', '$\\frac56\\pi$', '$\\cdots$', '$\\frac76\\pi$', '$\\cdots$', '$2\\pi$'], ["$g'$", '', '$+$', '$0$', '$-$', '$0$', '$+$', ''], ['$g$', '$0$', '↗', '最大', '↘', '最小', '↗', '$(0)$']] }] },
      { ask: { type: 'choice', q: '$g\\left(\\dfrac56\\pi\\right)$ の値は？',
        opts: ['$\\dfrac12$', '$\\dfrac{\\sqrt3}{3}$', '$1$', '$-1$'], ok: 2,
        why: { 0: 'それは分子 $\\sin\\frac56\\pi$ だけの値です。分母は $2-\\frac32=\\frac12$。', 1: '分母を $2+\\frac32$ にしています。$\\cos\\frac56\\pi=-\\frac{\\sqrt3}{2}$ です。', 3: 'それは $\\theta=\\frac76\\pi$（$\\sin$ が負）のときの値です。' },
        good: '$x=2+\\sqrt3\\cdot\\left(-\\frac{\\sqrt3}{2}\\right)=\\frac12,\\ y=\\frac12$ なので $g=1$。$\\theta=\\frac76\\pi$ では $y=-\\frac12$ で $g=-1$。',
        add: [{ t: 'm', tex: 'g\\left(\\tfrac56\\pi\\right)=\\frac{1/2}{1/2}=1,\\qquad g\\left(\\tfrac76\\pi\\right)=-1' }] } },
      { say: 'まとめると、最大値 1、最小値 −1。図で見ると、直線 OP が楕円に接するときです。∠POB の最大は 45° ということもわかります。',
        add: [{ t: 'ans', label: '(2) 答', text: '最大値 $1$（P$\\left(\\frac12,\\ \\frac12,\\ 0\\right)$）\n最小値 $-1$（P$\\left(\\frac12,\\ -\\frac12,\\ 0\\right)$）' },
          plane('e3', tang, 440)] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.54, 0.46], part: '別の見方', say: '傾きの最大・最小は「接線」でも求められます。直線 $y=mx$ が楕円と共有点をもつ $m$ の範囲を、判別式で調べます。',
        add: [{ t: 'h', text: '別の見方：判別式で範囲を求める' },
          { t: 'm', tex: 'y=mx\\ \\text{を代入：}\\ (x-2)^2+3m^2x^2=3' },
          { t: 'm', tex: '(1+3m^2)x^2-4x+1=0' },
          plane('e4', tang, 400)] },
      { ask: { type: 'think', q: 'この2次方程式が実数解をもつ条件から、$m$ の範囲を求めよう。',
        hint: '$\\frac D4=(-2)^2-(1+3m^2)\\cdot1\\ge0$。',
        ans: '$3-3m^2\\ge0$ より $-1\\le m\\le1$。最大 1、最小 −1 で一致',
        after: '傾きだけなら判別式が速い。でも「点の量」の最大・最小では、角 θ で表して微分する方法がいつでも使えます。',
        add: [{ t: 'm', tex: '\\frac D4=3-3m^2\\ge0\\iff-1\\le m\\le1' }] } },
      { clear: true, cols: [1], part: '答案のポイント', say: '答案では、2乗する前の条件 $x+1>0$ を書き、最後に確かめること。(2) は $\\theta$ の範囲と増減表を書いて、最大・最小をとる点まで答えます。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', size: 'sm', label: '(1)', text: '① ⇔「$x+1>0$ かつ $2(x+1)^2=3(x^2+y^2+1)$」と同値変形 → 楕円上では $x\\ge2-\\sqrt3>0$ なので条件は自動的にみたされる' },
          { t: 'box', c: 'b', size: 'sm', label: '(2)', text: '$x=2+\\sqrt3\\cos\\theta,\\ y=\\sin\\theta\\ (0\\le\\theta<2\\pi)$、$x>0$ に注意して $g(\\theta)=\\frac{\\sin\\theta}{2+\\sqrt3\\cos\\theta}$。$g\'$ の符号 → 増減表 → 最大・最小とそのときの P' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の角の条件を内積で式にし、平面の楕円に直して、角の媒介変数で最大・最小。阪大らしい分野の融合でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
