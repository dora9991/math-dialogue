/* 京大型 数学（理系）：2026年度 京都大学 前期 理系 第4問の類題（自作問題・元の問題ではない）
   問題：1辺の長さ1の正三角形をふくむ正方形の、1辺の長さの最小値を求めよ（理由も）。
   答え：cos15° = (√6+√2)/4（≒0.9659）。python3 で検算ずみ（正三角形の向きを 60 万通り回して、外接する軸に平行な正方形の最小が α=15° で cos15°）。
   論証：正方形を [0,s]×[0,s] とし、正三角形の辺の向き（180°を法として）を α, α+60°, α+120°（0°≦α<60°）とすると
         x 方向の影の長さ Lx = max(cos α, cos(60°−α))、y 方向の影の長さ Ly = sin(α+60°) = cos(α−30°)。
         s ≧ max(Lx, Ly) ≧ cos15°（α≦15° か α≧45° なら Lx、15°≦α≦45° なら Ly）。等号は O(0,0), P(cos15°, sin15°), Q(sin15°, cos15°) で成立。 */
(function () {
  const d = Math.PI / 180, c15 = Math.cos(15 * d), s15 = Math.sin(15 * d);
  // 2つの置き方（左：1辺を底辺に／右：15°かたむける）
  const two = (id) => ({ t: 'fig', id, col: 1, view: [-0.12, -0.3, 2.62, 1.18], w: 740, h: 400, items: [
    { k: 'poly', pts: [[0, 0], [1, 0], [1, 1], [0, 1]], close: true, c: 'd', wd: 2.5 },
    { k: 'poly', pts: [[0, 0], [1, 0], [0.5, Math.sqrt(3) / 2]], close: true, c: 'y', fill: 'y', alpha: 0.18 },
    { k: 'label', at: [0.5, -0.17], text: '1 辺 1', size: 21, plain: true },
    { k: 'poly', pts: [[1.5, 0], [1.5 + c15, 0], [1.5 + c15, c15], [1.5, c15]], close: true, c: 'd', wd: 2.5 },
    { k: 'poly', pts: [[1.5, 0], [1.5 + c15, s15], [1.5 + s15, c15]], close: true, c: 'p', fill: 'p', alpha: 0.18 },
    { k: 'label', at: [1.5 + c15 / 2, -0.17], text: '1 辺 0.966…', size: 21, plain: true }] });
  // 影（正射影）の図：α=20° の正三角形と、それをかこむ軸に平行な長方形
  const a20 = 20 * d, P0 = [0, 0], Q0 = [Math.cos(a20), Math.sin(a20)], R0 = [Math.cos(a20 + 60 * d), Math.sin(a20 + 60 * d)];
  const shadow = (id) => ({ t: 'fig', id, col: 1, view: [-0.3, -0.38, 1.25, 1.17], w: 420, h: 420, items: [
    { k: 'poly', pts: [[0, 0], [Q0[0], 0], [Q0[0], R0[1]], [0, R0[1]]], close: true, c: 'd', dash: true, wd: 2 },
    { k: 'poly', pts: [P0, Q0, R0], close: true, c: 'y', fill: 'y', alpha: 0.18, wd: 3 },
    { k: 'dim', a: [0, 0], b: [Q0[0], 0], dy: 30, label: 'Lx', c: 'b' },
    { k: 'dim', a: [0, 0], b: [0, R0[1]], off: 34, label: 'Ly', c: 'p' },
    { k: 'angle', o: P0, a: [1, 0], b: Q0, rp: 64, label: 'α', lr: 16 }] });
  // Lx, Ly のグラフ（横軸 α、度）
  const graph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-9, 0.83, 70, 1.018], w: 600, h: 380, items: [
    { k: 'axes', at: [0, 0.845], tx: [[15, '15°'], [30, '30°'], [45, '45°'], [60, '60°']], ty: [[0.866, '√3/2'], [1, '1']], xl: 'α', yl: '' },
    { k: 'fn', f: 'max(cos(x*PI/180), cos((60-x)*PI/180))', a: 0, b: 60, c: 'b', label: 'Lx', lat: [3, 1.008] },
    { k: 'fn', f: 'sin((x+60)*PI/180)', a: 0, b: 60, c: 'p', label: 'Ly', lat: [26, 1.008] }].concat(extra || []) });
  // 等号が成り立つ置き方
  const best = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.22, -0.2, 1.18, 1.16], w: 430, h: 418, items: [
    { k: 'poly', pts: [[0, 0], [c15, 0], [c15, c15], [0, c15]], close: true, c: 'd', wd: 2.5 },
    { k: 'poly', pts: [[0, 0], [c15, s15], [s15, c15]], close: true, c: 'p', fill: 'p', alpha: 0.18, wd: 3 },
    { k: 'angle', o: [0, 0], a: [1, 0], b: [c15, s15], rp: 110, label: '15°', lr: 22, size: 20 },
    { k: 'angle', o: [0, 0], a: [s15, c15], b: [0, 1], rp: 110, label: '15°', lr: 22, size: 20 },
    { k: 'angle', o: [0, 0], a: [c15, s15], b: [s15, c15], rp: 56, label: '60°', lr: 18, size: 20 },
    { k: 'label', at: [0, 0], text: 'O', dx: -16, dy: 16, size: 24 }, { k: 'label', at: [c15, s15], text: 'P', dx: 20, size: 24 }, { k: 'label', at: [s15, c15], text: 'Q', dy: -20, size: 24 }].concat(extra || []) });
  const POINTS = [
    '正方形に入る ⇒ 2辺の方向への **影（正射影）の長さ** がどちらも 1辺以下。図形の影は、いちばん長い辺の影で決まる',
    '辺の向き $\\alpha,\\ \\alpha+60^\\circ,\\ \\alpha+120^\\circ$ で $0^\\circ\\le\\alpha<60^\\circ$ とすると　$L_x=\\max\\{\\cos\\alpha,\\ \\cos(60^\\circ-\\alpha)\\},\\ L_y=\\cos(\\alpha-30^\\circ)$',
    '「どちらかは $\\cos15^\\circ$ 以上」を場合分けで示し、等号の置き方を具体的に作る。$\\cos15^\\circ=\\dfrac{\\sqrt6+\\sqrt2}4$'
  ];

  HB.lesson({
    id: 'kyo26-4', field: '京大型　数学（理系）', title: '2026 京大 理系 第4問の類題 ― 正三角形をすっぽりふくむ正方形の最小', level: '2026年度 京都大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '平面上で、1 辺の長さが 1 の正三角形を、その内部または周上にふくむような正方形を考える。このような正方形の 1 辺の長さの最小値を求めよ。また、それが最小値であることを示せ。',
      src: '※ 2026年度 京都大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [1],
    steps: [
      { part: '問題', say: '図形を「すっぽりふくむ」最小の大きさを、三角関数で論証する問題です。小問の誘導はありません。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 実験 ----------
      { clear: true, cols: [0.45, 0.55], part: '実験', say: 'まず、正三角形の1辺を正方形の底辺にのせてみます（左）。高さは $\\frac{\\sqrt3}2$ ですが、横はばが 1 あります。',
        add: [{ t: 'h', text: 'まず置いてみる' }, two('f1')] },
      { ask: { type: 'choice', q: '左の置き方で、正方形の1辺は少なくともいくつ必要？',
        opts: ['$\\dfrac{\\sqrt3}2$', '$1$', '$\\dfrac{1+\\sqrt3}2$', '$\\sqrt2$'], ok: 1,
        why: { 0: '高さは $\\frac{\\sqrt3}2$ でも、横はばが 1 あるので、1辺 1 は必要です。', 2: '高さと底辺を足す必要はありません。', 3: '正方形の対角線に1辺をのせる置き方を考えても、そんなに大きくはいりません。' },
        good: '横はば 1 で決まります。でも右のように少し **かたむける** と、0.966… まで小さくなります。',
        add: [{ t: 'p', size: 'sm', text: '左：1辺 1 が必要\n右：15° かたむけると 1辺 0.966… で入る\n→ どこまで小さくできるか？\n　 それが最小であることをどう示すか？' }] } },

      // ---------- 方針 ----------
      { clear: true, cols: [0.56, 0.44], part: '方針', say: '正方形を $0\\le x\\le s,\\ 0\\le y\\le s$ とおきます。正三角形がこの中にあれば、頂点の $x$ 座標どうしの差も、$y$ 座標どうしの差も $s$ 以下です。',
        add: [{ t: 'h', text: '影（正射影）の長さで考える' },
          { t: 'p', size: 'sm', text: '正方形：$0\\le x\\le s,\\ 0\\le y\\le s$\n$L_x$：正三角形の $x$ 軸への影の長さ\n$L_y$：正三角形の $y$ 軸への影の長さ' },
          shadow('sh')] },
      { ask: { type: 'choice', q: '正三角形が正方形の中にあるとき、必ず言えることとして、証明の出発点にふさわしいのは？',
        opts: ['正三角形の面積 $\\le s^2$', '$L_x\\le s$ かつ $L_y\\le s$', '正三角形の外接円が正方形に入る', '正三角形の重心が正方形の中心にある'], ok: 1,
        why: { 0: '正しいですが弱すぎます。面積からは $s\\ge0.66\\cdots$ しか出ません。', 2: '外接円が入らなくても、正三角形は入りえます。必ずは言えません。', 3: '重心が中心になくても入ります。必ずは言えません。' },
        good: 'したがって $s\\ge\\max\\{L_x,\\ L_y\\}$。あとはこの右辺がいつも $\\cos15^\\circ$ 以上であることを示します。',
        add: [{ t: 'm', tex: 's\\ge\\max\\{L_x,\\ L_y\\}' }] } },
      { say: '長さ 1 の線分の向きが $x$ 軸と角 $\\varphi$ をなすとき、影の長さは $x$ 方向 $|\\cos\\varphi|$、$y$ 方向 $|\\sin\\varphi|$。三角形の影は、3辺の影のいちばん長いものです。',
        add: [{ t: 'm', size: 'sm', tex: 'L_x=\\max_{\\text{3辺}}|\\cos\\varphi|,\\qquad L_y=\\max_{\\text{3辺}}|\\sin\\varphi|' },
          { t: 'p', size: 'xs', text: '（影のはしは頂点の影。両はしの頂点を結ぶ辺の影が全体の影）' }] },

      // ---------- Lx, Ly を α で ----------
      { clear: true, cols: [0.56, 0.44], part: '答案', say: '正三角形の3辺の向きは $60^\\circ$ ずつずれています。向きは $180^\\circ$ ちがっても同じなので、3つのうち1つだけが $0^\\circ$ 以上 $60^\\circ$ 未満に入ります。それを $\\alpha$ とします。',
        add: [{ t: 'h', text: '辺の向き $\\alpha$ で $L_x,\\ L_y$ を表す' },
          { t: 'm', size: 'sm', tex: '\\text{3辺の向き}:\\ \\alpha,\\ \\alpha+60^\\circ,\\ \\alpha+120^\\circ\\quad(0^\\circ\\le\\alpha<60^\\circ)' },
          shadow('sh2')] },
      { ask: { type: 'choice', q: '$0^\\circ\\le\\alpha<60^\\circ$ のとき、$|\\cos(\\alpha+120^\\circ)|$ と等しいのは？',
        opts: ['$-\\cos(60^\\circ-\\alpha)$', '$\\cos(\\alpha+60^\\circ)$', '$\\sin(60^\\circ-\\alpha)$', '$\\cos(60^\\circ-\\alpha)$'], ok: 3,
        why: { 0: '絶対値なので、答えは 0 以上。$-\\cos(60^\\circ-\\alpha)$ は負です。', 1: '$\\alpha+120^\\circ$ と $\\alpha+60^\\circ$ は別の角。$\\cos(180^\\circ-\\theta)=-\\cos\\theta$ を使います。', 2: '$\\sin$ ではなく $\\cos$ のまま。$\\cos(180^\\circ-\\theta)=-\\cos\\theta$ です。' },
        good: '$\\alpha+120^\\circ$ は $120^\\circ$ 以上 $180^\\circ$ 未満なので $\\cos<0$。$|\\cos(\\alpha+120^\\circ)|=-\\cos(\\alpha+120^\\circ)=\\cos(60^\\circ-\\alpha)$。',
        add: [{ t: 'm', size: 'sm', tex: 'L_x=\\max\\{\\cos\\alpha,\\ \\cos(60^\\circ-\\alpha)\\}', note: '$|\\cos(\\alpha+60^\\circ)|\\le\\frac12$ は小さい' }] } },
      { ask: { type: 'think', q: '同じように $L_y$ を求めよう。（$\\sin\\alpha,\\ \\sin(\\alpha+60^\\circ),\\ |\\sin(\\alpha+120^\\circ)|$ の最大）',
        hint: '$\\alpha+60^\\circ$ は $60^\\circ$ 以上 $120^\\circ$ 未満。ほかの2つは $\\frac{\\sqrt3}2$ 以下。',
        ans: '$L_y=\\sin(\\alpha+60^\\circ)=\\cos(\\alpha-30^\\circ)$',
        after: '$\\sin(\\alpha+60^\\circ)\\ge\\frac{\\sqrt3}2$、$\\sin\\alpha\\le\\frac{\\sqrt3}2$、$\\sin(\\alpha+120^\\circ)=\\sin(60^\\circ-\\alpha)\\le\\frac{\\sqrt3}2$ だからです。',
        add: [{ t: 'm', size: 'sm', tex: 'L_y=\\sin(\\alpha+60^\\circ)=\\cos(\\alpha-30^\\circ)' }] } },

      // ---------- 最小値 ----------
      { clear: true, cols: [0.5, 0.5], part: '最小値', say: '$L_x$（青）と $L_y$（桃）のグラフです。$\\cos$ は $0^\\circ$ から $90^\\circ$ で減少するので、角が $0^\\circ$ に近いほど大きい値になります。',
        add: [{ t: 'h', text: '$\\max\\{L_x,\\ L_y\\}$ の最小' },
          { t: 'm', size: 'sm', tex: 'L_x=\\cos\\big(\\min\\{\\alpha,\\ 60^\\circ-\\alpha\\}\\big)' },
          { t: 'm', size: 'sm', tex: 'L_y=\\cos|\\alpha-30^\\circ|' },
          graph('g1')] },
      { ask: { type: 'choice', q: '$\\max\\{L_x,\\ L_y\\}$ がいちばん小さくなる $\\alpha$ は？',
        opts: ['$0^\\circ$', '$30^\\circ$', '$15^\\circ$ と $45^\\circ$', '$20^\\circ$'], ok: 2,
        why: { 0: '$\\alpha=0^\\circ$ は1辺が横向きの置き方。$L_x=1$ でいちばん大きい。', 1: '$\\alpha=30^\\circ$ だと1辺が縦向きになり、$L_y=1$。', 3: '$\\alpha=20^\\circ$ では $L_x=\\cos20^\\circ>\\cos15^\\circ$。' },
        good: '$L_x$ と $L_y$ が等しくなる所。そのとき $\\max\\{L_x,\\ L_y\\}=\\cos15^\\circ$。',
        draw: [{ fig: 'g1', items: [{ k: 'line', m: 0, n: c15, c: 'y', dash: true }, { k: 'pt', at: [15, c15], c: 'y' }, { k: 'pt', at: [45, c15], c: 'y' }, { k: 'label', at: [30, c15], text: 'cos 15°', dy: 22, c: 'y', size: 21, plain: true }] }] } },
      { say: '答案では、グラフでなく場合分けで書きます。$\\alpha\\le15^\\circ$ か $\\alpha\\ge45^\\circ$ なら $L_x$ が、$15^\\circ\\le\\alpha\\le45^\\circ$ なら $L_y$ が、$\\cos15^\\circ$ 以上です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$\\alpha$ の範囲', '使う影', '理由'], ['$0^\\circ\\le\\alpha\\le15^\\circ$', '$L_x\\ge\\cos\\alpha$', '$\\alpha\\le15^\\circ$'], ['$15^\\circ\\le\\alpha\\le45^\\circ$', '$L_y=\\cos|\\alpha-30^\\circ|$', '$|\\alpha-30^\\circ|\\le15^\\circ$'], ['$45^\\circ\\le\\alpha<60^\\circ$', '$L_x\\ge\\cos(60^\\circ-\\alpha)$', '$60^\\circ-\\alpha\\le15^\\circ$']] },
          { t: 'm', tex: '\\therefore\\ s\\ge\\max\\{L_x,\\ L_y\\}\\ge\\cos15^\\circ' }] },

      // ---------- 等号 ----------
      { clear: true, cols: [0.55, 0.45], part: '等号', say: '最後に、1辺 $\\cos15^\\circ$ の正方形に本当に入ることを示します。正方形の1つの角 O に頂点をおき、OP・OQ を辺から $15^\\circ$ ずつかたむけます。',
        add: [{ t: 'h', text: '1辺 $\\cos15^\\circ$ で入る置き方' },
          { t: 'm', size: 'sm', tex: '\\mathrm O(0,\\ 0),\\ \\mathrm P(\\cos15^\\circ,\\ \\sin15^\\circ),\\ \\mathrm Q(\\sin15^\\circ,\\ \\cos15^\\circ)' },
          { t: 'p', size: 'sm', text: '$\\mathrm{OP}=\\mathrm{OQ}=1$、$\\angle\\mathrm{POQ}=90^\\circ-15^\\circ\\times2=60^\\circ$\n→ △OPQ は1辺 1 の正三角形' },
          best('b1')] },
      { ask: { type: 'choice', q: '3点 O, P, Q がすべて正方形 $0\\le x\\le\\cos15^\\circ,\\ 0\\le y\\le\\cos15^\\circ$ に入る理由は？',
        opts: ['$\\sin15^\\circ<\\cos15^\\circ$ だから', '$\\cos15^\\circ<1$ だから', '$\\angle\\mathrm{POQ}=60^\\circ$ だから', '$\\sin15^\\circ>0$ だから'], ok: 0,
        why: { 1: '$\\cos15^\\circ<1$ は「正方形が小さい」ことで、入る理由にはなりません。', 2: '$60^\\circ$ は正三角形である理由。正方形に入る理由ではありません。', 3: '0 以上は言えますが、$\\cos15^\\circ$ 以下であることが必要です。' },
        good: '座標は $0,\\ \\sin15^\\circ,\\ \\cos15^\\circ$ だけ。$0<\\sin15^\\circ<\\cos15^\\circ$ なので、全部 $0$ 以上 $\\cos15^\\circ$ 以下です。' } },
      { ask: { type: 'think', q: '$\\cos15^\\circ$ の値を求めよう。',
        hint: '$15^\\circ=45^\\circ-30^\\circ$ と加法定理。',
        ans: '$\\cos15^\\circ=\\cos45^\\circ\\cos30^\\circ+\\sin45^\\circ\\sin30^\\circ=\\dfrac{\\sqrt6+\\sqrt2}4$',
        after: '$\\frac{\\sqrt6+\\sqrt2}4\\fallingdotseq0.966$。底辺にのせる置き方（1辺 1）より、約 3.4% 小さくなります。',
        add: [{ t: 'ans', label: '答', tex: '\\frac{\\sqrt6+\\sqrt2}4\\ \\ (=\\cos15^\\circ)' }] } },
      { say: '「最小値を求めよ」の論証は、**どんな置き方でも $\\cos15^\\circ$ 以上** と、**$\\cos15^\\circ$ で入る置き方がある** の2つがそろって完成です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・正方形を座標でおき、影の長さで「必要な条件」を作る\n・$\\alpha$ を $0^\\circ\\le\\alpha<60^\\circ$ にとれる理由を書く\n・最小値を **実現する置き方** を具体的に示す' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「ふくむ」を「影の長さ」の不等式に言いかえたところが、この問題の出発点でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
