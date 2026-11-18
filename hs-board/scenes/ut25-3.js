/* 2025 東大 理系 第3問の類題（自作）：三角形の頂点を辺の上にもつ長方形の面積を角で表し、最大値を求める（辺の長さで場合分け）
   問題：a≧1。OA=1, OB=a, ∠AOB=π/3。長方形 OPQR で A が辺 PQ 上、B が辺 QR 上。∠AOP=θ。
   答え（python3・sympy＋図形を回して全探索した数値で検算ずみ）：
   (1) OP=cosθ、OR=a sin(θ+π/3)、S=a cosθ sin(θ+π/3)
       条件：0≦sinθ≦OR（いつも成立）、0≦a cos(θ+π/3)≦cosθ ⇔ θ≦π/6 かつ (a−2)cosθ≦√3a sinθ
       1≦a≦2 なら 0≦θ≦π/6、a>2 なら α≦θ≦π/6（tanα=(a−2)/(√3a)、0<α<π/6）
   (2) S=(a/2)sin(2θ+π/3)+√3a/4。θ=π/12 が範囲内 ⇔ a≦2+√3（tan(π/12)=2−√3）
       1≦a≦2+√3：最大値 (2+√3)a/4（θ=π/12）
       a>2+√3：θ=α で最大（このとき B＝Q、AB⊥OP）。OP=√3a/(2AB)、OR=a(2a−1)/(2AB)、AB²=a²−a+1
              最大値 √3a²(2a−1)/{4(a²−a+1)}。a=4 で 28√3/13≈3.7306（全探索 3.73057）。a=2+√3 で両方 (7+4√3)/4 */
(function () {
  const r3 = Math.sqrt(3), D = Math.PI / 180;
  // 三角形を固定（OA を横）し、長方形を回す。th＝∠AOP（OP は OA の下側）
  const rect = (a, th, o) => {
    o = o || {};
    const W = Math.cos(th), H = a * Math.sin(th + Math.PI / 3);
    const P = [W * Math.cos(-th), W * Math.sin(-th)], R = [H * Math.cos(Math.PI / 2 - th), H * Math.sin(Math.PI / 2 - th)], Q = [P[0] + R[0], P[1] + R[1]];
    const A = [1, 0], B = [a / 2, a * r3 / 2], O = [0, 0];
    return [
      { k: 'poly', pts: [O, P, Q, R], close: true, c: 'b', fill: 'b', alpha: 0.12 },
      { k: 'poly', pts: [O, A, B], close: true, c: 'y' },
      { k: 'right', o: P, a: O, b: Q, s: 14 },
      { k: 'angle', o: O, a: P, b: A, rp: o.trp || 95, label: 'θ', c: 'p', lr: 14 },
      { k: 'angle', o: O, a: A, b: B, rp: o.rp || 34, label: o.noPi ? '' : 'π/3', c: 'y', lr: 14, size: 19 },
      { k: 'pt', at: O, name: 'O', dir: 'w', c: 'w' }, { k: 'pt', at: P, name: 'P', dir: 's', c: 'b' }, { k: 'pt', at: Q, name: o.bq ? '' : 'Q', dir: 'e', c: 'b' }, { k: 'pt', at: R, name: 'R', dir: 'w', c: 'b' },
      { k: 'pt', at: A, name: 'A', dir: 'e', c: 'y' }, { k: 'pt', at: B, name: 'B', dir: o.bq ? 'nw' : 'n', c: 'y' }
    ];
  };
  const fig2 = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.45, -0.55, 1.95, 2.25], w: 430, h: 502, items: rect(2, 15 * D).concat(extra || []) });
  const al4 = Math.atan(2 / (4 * r3));
  const fig4 = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.5, -0.55, 2.9, 4.05], w: 362, h: 490, items: rect(4, al4, { bq: true, rp: 30, noPi: true, trp: 110 }).concat(extra || []) });
  const POINTS = [
    '長方形の2辺は、**OA・OB の正射影**：$\\mathrm{OP}=\\mathrm{OA}\\cos\\theta$，$\\mathrm{OR}=\\mathrm{OB}\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$。「点が辺の上にある」条件で $\\theta$ の範囲が決まる',
    '積 → 和の公式で $S=\\frac{a}{2}\\sin\\left(2\\theta+\\frac{\\pi}{3}\\right)+\\frac{\\sqrt3a}{4}$。山の頂上 $\\theta=\\frac{\\pi}{12}$ が **範囲に入るかどうか** で場合分け（$a\\le2+\\sqrt3$）',
    '範囲のはしで最大のときは、図形の状態（B＝Q）を読むと計算が楽。答えは境目 $a=2+\\sqrt3$ でつながるか検算する'
  ];

  HB.lesson({
    id: 'ut25-3', field: '東大型　数学（理系）', title: '2025 東大 理系 第3問の類題 ― 三角形の頂点を辺にのせた長方形の面積', level: '2025年度 東京大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$a\\ge1$ とする。$\\mathrm{OA}=1$，$\\mathrm{OB}=a$，$\\angle\\mathrm{AOB}=\\dfrac{\\pi}{3}$ である三角形 OAB がある。長方形 OPQR で、点 A が辺 PQ 上に、点 B が辺 QR 上にあるもの（辺は両端をふくむ）を考え、$\\angle\\mathrm{AOP}=\\theta$ とする。',
      parts: [
        '(1)　長方形 OPQR の面積 $S$ を $a,\\ \\theta$ で表せ。また、$\\theta$ のとりうる値の範囲を求めよ。',
        '(2)　$S$ の最大値を $a$ で表せ。'
      ],
      src: '※ 2025年度 東京大学 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.62, 0.38],
    steps: [
      { part: '問題', say: '三角形 OAB に、長方形 OPQR をかぶせる問題です。長方形の向き θ を変えると面積が変わります。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },
      { clear: true, part: '読みかえ', say: '図は $a=2,\\ \\theta=\\frac{\\pi}{12}$ のとき。三角形（黄）を固定して、O を中心に長方形（青）を回して考えます。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: 'A は辺 PQ の上、B は辺 QR の上\n→ 長方形の向き $\\theta$ を決めると、長方形が1つ決まる' },
          { t: 'p', size: 'sm', text: '調べること\n・面積 $S$ を $\\theta$ の式に\n・そもそも長方形がかける $\\theta$ の範囲（ここで場合分け）' },
          fig2('r1')] },
      { ask: { type: 'choice', q: '辺 OP の長さを θ で表すときに注目するのは？',
        opts: ['△OAB の面積', 'A から直線 OP に下ろした垂線の足が P', '余弦定理で求めた AB の長さ', 'O から AB に下ろした垂線'], ok: 1,
        why: { 0: '△OAB の面積は θ によらず一定です。', 2: 'AB の長さも θ によらず一定です。', 3: '一般の θ では、AB と長方形の辺は関係ありません。' },
        good: 'PQ⊥OP なので、P は A から OP への垂線の足。$\\mathrm{OP}=\\mathrm{OA}\\cos\\theta$（正射影）。' } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '同じように、R は B から OR への垂線の足。OR と OB のなす角は $\\frac{\\pi}{2}-\\left(\\theta+\\frac{\\pi}{3}\\right)$ なので、$\\mathrm{OR}=a\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$。',
        add: [{ t: 'h', text: '(1)　面積 S と θ の範囲' },
          { t: 'm', size: 'sm', tex: '\\mathrm{OP}=\\cos\\theta,\\qquad \\mathrm{OR}=a\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)' },
          { t: 'm', size: 'sm', tex: 'S=a\\cos\\theta\\,\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)' },
          fig2('r2')] },
      { say: '次に範囲。「A が辺 PQ 上」は、A の OR 方向の成分が 0 以上 OR 以下。「B が辺 QR 上」は、B の OP 方向の成分が 0 以上 OP 以下です。',
        add: [{ t: 'm', size: 'sm', tex: '\\text{A：}\\ 0\\le\\sin\\theta\\le a\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)', note: '…ア' },
          { t: 'm', size: 'sm', tex: '\\text{B：}\\ 0\\le a\\cos\\left(\\theta+\\frac{\\pi}{3}\\right)\\le\\cos\\theta', note: '…イ' }] },
      { ask: { type: 'choice', q: 'ア・イの左側（$\\sin\\theta\\ge0$ と $\\cos\\left(\\theta+\\frac{\\pi}{3}\\right)\\ge0$）から、まず θ はどの範囲に入る？',
        opts: ['$0\\le\\theta\\le\\dfrac{\\pi}{3}$', '$0\\le\\theta\\le\\dfrac{\\pi}{2}$', '$\\dfrac{\\pi}{6}\\le\\theta\\le\\dfrac{\\pi}{3}$', '$0\\le\\theta\\le\\dfrac{\\pi}{6}$'], ok: 3,
        why: { 0: '$\\theta+\\frac{\\pi}{3}\\le\\frac{\\pi}{2}$ から $\\theta\\le\\frac{\\pi}{6}$ です。', 1: '$\\cos\\left(\\theta+\\frac{\\pi}{3}\\right)\\ge0$ を使っていません。', 2: '$\\sin\\theta\\ge0$ なので $\\theta=0$ から入ります。' },
        good: '$\\theta\\ge0$ と $\\theta+\\frac{\\pi}{3}\\le\\frac{\\pi}{2}$ で $0\\le\\theta\\le\\frac{\\pi}{6}$。',
        add: [{ t: 'm', size: 'sm', tex: '0\\le\\theta\\le\\frac{\\pi}{6}', note: 'このとき ア の右側は\n$\\sin\\theta\\le\\frac12<\\frac{\\sqrt3}{2}\\le a\\sin\\left(\\theta+\\frac{\\pi}{3}\\right)$\nで、いつも成り立つ' }] } },
      { clear: true, say: '残るのはイの右側。加法定理で展開すると $(a-2)\\cos\\theta\\le\\sqrt3a\\sin\\theta$。$\\cos\\theta>0$ で割ります。',
        add: [{ t: 'h', text: '(1)　つづき：イの右側' },
          { t: 'm', size: 'sm', tex: 'a\\left(\\frac12\\cos\\theta-\\frac{\\sqrt3}{2}\\sin\\theta\\right)\\le\\cos\\theta' },
          { t: 'm', size: 'sm', tex: '\\Longleftrightarrow\\ (a-2)\\cos\\theta\\le\\sqrt3a\\sin\\theta\\ \\Longleftrightarrow\\ \\tan\\theta\\ge\\frac{a-2}{\\sqrt3a}' }] },
      { ask: { type: 'choice', q: 'この条件で、場合分けが必要になる $a$ の境目は？',
        opts: ['$a=1$', '$a=2$', '$a=\\sqrt3$', '場合分けは要らない'], ok: 1,
        why: { 0: '$a\\ge1$ は前提です。右辺の符号が変わる所を見ます。', 2: '右辺 $\\frac{a-2}{\\sqrt3a}$ の符号は $a-2$ で決まります。', 3: '$a>2$ だと右辺が正になり、$\\theta$ が小さい所が除かれます。' },
        good: '$a\\le2$ なら右辺 $\\le0$ でいつも成立。$a>2$ なら $\\theta$ に下限がつきます。',
        add: [{ t: 'p', size: 'sm', text: '$a\\le2$：右辺 $\\le0$ → いつも成り立つ\n$a>2$：$\\tan\\alpha=\\dfrac{a-2}{\\sqrt3a}$ となる $\\alpha$ で $\\theta\\ge\\alpha$' }] } },
      { say: '$\\frac{a-2}{\\sqrt3a}<\\frac1{\\sqrt3}=\\tan\\frac{\\pi}{6}$ なので $0<\\alpha<\\frac{\\pi}{6}$。範囲は空になりません。(1) の答えです。',
        add: [{ t: 'ans', label: '(1) 答', text: '$S=a\\cos\\theta\\,\\sin\\left(\\theta+\\dfrac{\\pi}{3}\\right)$\n$1\\le a\\le2$ のとき　$0\\le\\theta\\le\\dfrac{\\pi}{6}$\n$a>2$ のとき　$\\alpha\\le\\theta\\le\\dfrac{\\pi}{6}$　（$\\tan\\alpha=\\dfrac{a-2}{\\sqrt3a}$，$0<\\alpha<\\dfrac{\\pi}{6}$）' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。積 → 和の公式で、$\\theta$ が1か所にまとまった形にします。',
        add: [{ t: 'h', text: '(2)　S の最大値' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}S&=\\frac{a}{2}\\left\\{\\sin\\left(2\\theta+\\frac{\\pi}{3}\\right)+\\sin\\frac{\\pi}{3}\\right\\}\\\\ &=\\frac{a}{2}\\sin\\left(2\\theta+\\frac{\\pi}{3}\\right)+\\frac{\\sqrt3a}{4}\\end{aligned}' }] },
      { ask: { type: 'choice', q: '範囲を気にしなければ、$S$ が最大になる $\\theta$ は？',
        opts: ['$\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{12}$', '$\\dfrac{\\pi}{3}$'], ok: 2,
        why: { 0: '$\\theta=\\frac{\\pi}{6}$ だと $2\\theta+\\frac{\\pi}{3}=\\frac{2\\pi}{3}$ で、頂上をこえています。', 1: '$2\\theta+\\frac{\\pi}{3}=\\frac{\\pi}{2}$ を解くと $\\theta=\\frac{\\pi}{12}$ です。', 3: '範囲 $\\theta\\le\\frac{\\pi}{6}$ の外です。' },
        good: '$2\\theta+\\frac{\\pi}{3}=\\frac{\\pi}{2}$ より $\\theta=\\frac{\\pi}{12}$。この値が範囲に入るかどうかが勝負です。',
        add: [{ t: 'p', size: 'sm', text: '$\\theta=\\dfrac{\\pi}{12}$ が範囲に入る ⇔ $a\\le2$　または　$\\alpha\\le\\dfrac{\\pi}{12}$' }] } },
      { ask: { type: 'choice', q: '$\\alpha\\le\\frac{\\pi}{12}$、つまり $\\frac{a-2}{\\sqrt3a}\\le\\tan\\frac{\\pi}{12}=2-\\sqrt3$ となる $a$ の範囲は？',
        opts: ['$a\\le\\sqrt3+1$', '$a\\le2+\\sqrt3$', '$a\\le8+4\\sqrt3$', '$a\\le2-\\sqrt3$'], ok: 1,
        why: { 0: '分母の $\\sqrt3$ を落とすと $(\\sqrt3-1)a\\le2$ になってしまいます。', 2: '有理化で $(4-2\\sqrt3)(4+2\\sqrt3)=4$ で割り忘れています。', 3: '$\\frac{1}{2-\\sqrt3}=2+\\sqrt3$ です（$a\\ge1$ にも反します）。' },
        good: '$a-2\\le(2\\sqrt3-3)a$ より $(4-2\\sqrt3)a\\le2$、$a\\le\\dfrac{1}{2-\\sqrt3}=2+\\sqrt3$。',
        add: [{ t: 'm', size: 'sm', tex: 'a-2\\le(2\\sqrt3-3)a\\ \\Longleftrightarrow\\ a\\le2+\\sqrt3' }] } },
      { say: 'よって $1\\le a\\le2+\\sqrt3$ のときは、$\\theta=\\frac{\\pi}{12}$ で最大。最大値は $\\frac{a}{2}+\\frac{\\sqrt3a}{4}=\\frac{(2+\\sqrt3)a}{4}$ です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '1 ≦ a ≦ 2＋√3', text: '$\\theta=\\dfrac{\\pi}{12}$ で最大値　$\\dfrac{(2+\\sqrt3)a}{4}$' }] },

      // ---------- (2) a > 2+√3 ----------
      { clear: true, say: '$a>2+\\sqrt3$ のときは $\\alpha>\\frac{\\pi}{12}$。$2\\theta+\\frac{\\pi}{3}$ は $\\frac{\\pi}{2}$ より大きい所だけを動くので、$S$ は減少。$\\theta=\\alpha$ で最大です。図は $a=4$ のとき。',
        add: [{ t: 'h', text: '(2)　a > 2＋√3 のとき' },
          { t: 'm', size: 'sm', tex: '\\frac{\\pi}{2}<2\\alpha+\\frac{\\pi}{3}\\le2\\theta+\\frac{\\pi}{3}\\le\\frac{2\\pi}{3}', note: '$\\sin$ は減少' },
          fig4('r4')] },
      { ask: { type: 'choice', q: '$\\theta=\\alpha$（イの右側が等号）のとき、点 B はどこにある？',
        opts: ['頂点 R と一致', '辺 QR の中点', '頂点 Q と一致', '辺 PQ の中点'], ok: 2,
        why: { 0: 'B が R に重なるのは $\\theta=\\frac{\\pi}{6}$（イの左側が等号）のときです。', 1: 'イの右側の等号は「B の OP 方向の成分＝OP」。B は QR の右はしです。', 3: 'B はいつも辺 QR の上にあります。' },
        good: 'B の OP 方向の成分が OP と等しい → B は QR の右はし、つまり **B＝Q**。',
        draw: [{ fig: 'r4', items: [{ k: 'label', at: [2, 2 * r3], text: '＝Q', c: 'b', size: 26, dx: 12, dy: -4, anchor: 'start' }] }] } },
      { say: 'B＝Q なら A，B はどちらも辺 PQ 上。つまり AB⊥OP で、OP は O から直線 AB までの距離です。AB は余弦定理で出します。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{AB}^2=1+a^2-2a\\cos\\frac{\\pi}{3}=a^2-a+1' },
          { t: 'm', size: 'sm', tex: '\\mathrm{OP}=\\frac{2\\triangle\\mathrm{OAB}}{\\mathrm{AB}}=\\frac{a\\sin\\frac{\\pi}{3}}{\\mathrm{AB}}=\\frac{\\sqrt3a}{2\\,\\mathrm{AB}}' }] },
      { say: 'OR は直角三角形 OPB（B＝Q）で三平方。$4\\mathrm{AB}^2-3=(2a-1)^2$ となって、根号が外れます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{OR}=\\mathrm{PB}=\\sqrt{a^2-\\mathrm{OP}^2}=\\frac{a\\sqrt{4\\mathrm{AB}^2-3}}{2\\,\\mathrm{AB}}=\\frac{a(2a-1)}{2\\,\\mathrm{AB}}' },
          { t: 'ans', label: '(2) 答', text: '$1\\le a\\le2+\\sqrt3$ のとき　$\\dfrac{(2+\\sqrt3)a}{4}$\n$a>2+\\sqrt3$ のとき　$\\dfrac{\\sqrt3a^2(2a-1)}{4(a^2-a+1)}$' }] },
      { ask: { type: 'think', q: '検算：$a=4$ のとき最大値はいくつ？ また、もし範囲を無視して $\\frac{(2+\\sqrt3)a}{4}$ を使うと、いくつになってしまう？',
        hint: '$a^2-a+1=13$、$2a-1=7$。',
        ans: '$\\dfrac{\\sqrt3\\cdot16\\cdot7}{4\\cdot13}=\\dfrac{28\\sqrt3}{13}\\fallingdotseq3.731$。範囲を無視すると $2+\\sqrt3\\fallingdotseq3.732$（実際には作れない長方形）',
        after: '差はわずかですが、$\\theta=\\frac{\\pi}{12}$ の長方形は B が辺 QR の外に出てしまいます。範囲の確認が本質です。' } },
      { say: '境目の検算：$a=2+\\sqrt3$ を下の式に入れると $a^2-a+1=3(2+\\sqrt3)$、$2a-1=\\sqrt3(2+\\sqrt3)$ で、上の式と同じ $\\frac{(2+\\sqrt3)^2}{4}$ になります。',
        add: [{ t: 'p', col: 1, size: 'xs', text: '境目 $a=2+\\sqrt3$ で\n2つの答えがつながる\n→ 計算ミスがない目安' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「式にする → 範囲を調べる → 頂上が範囲に入るかで場合分け」は、三角関数の最大・最小の基本形です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
