/* 数学C 第1章 ベクトル 平面上のベクトル ③：ベクトルの内積
   例はすべて自作（|a|=4,|b|=3,120° → −6／1辺 3 の正三角形 AB·AC=9/2、AB·BC=−9/2／(2,−1)·(3,4)=2／
   (3,1),(1,2) → 45°／(2,−1),(−3,−1) → 135°／(3,−2)⊥(4,k) → k=6／|a|=3,|b|=2,a·b=−2 → |2a−b|=4√3／
   |a|=2,|b|=1,|a−b|=√7 → a·b=−1、120°）。python3（sympy）で検算ずみ。図は数値どおりの形。 */
(function () {
  const POINTS = [
    '内積 $\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta$（$\\theta$ は **始点をそろえて** はかる）$=a_1b_1+a_2b_2$。内積はベクトルではなく **数**',
    'なす角は $\\cos\\theta=\\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$ から。**垂直 ⇔ $\\vec{a}\\cdot\\vec{b}=0$**（$a_1b_1+a_2b_2=0$）',
    '$\\vec{a}\\cdot\\vec{a}=|\\vec{a}|^2$。大きさは2乗して展開する：$|\\vec{a}+\\vec{b}|^2=|\\vec{a}|^2+2\\,\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2$'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const ax = (tx, ty) => ({ k: 'axes', grid: true, tx: tx.map(v => [v, String(v)]), ty: ty.map(v => [v, String(v)]) });
  const r3 = Math.sqrt(3), TA = [0, 0], TB = [3, 0], TC = [1.5, 1.5 * r3];

  HB.lesson({
    id: 'mc1-03', field: '数学C　ベクトル', title: 'ベクトルの内積', level: '平面上のベクトル', time: '目安 8分',
    noDec: true,   // 分数は cos の値・内積の値。小数をそえない
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　1辺が 3 の正三角形 ABC で、$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$、$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{BC}}$ を求めよ。',
        '(2)　$\\vec{a}=(2,\\ -1),\\ \\vec{b}=(-3,\\ -1)$ のなす角 $\\theta$ を求めよ。', '(3)　$(3,\\ -2)$ と $(4,\\ k)$ が垂直になる $k$ を求めよ。',
        '(4)　$|\\vec{a}|=3,\\ |\\vec{b}|=2,\\ \\vec{a}\\cdot\\vec{b}=-2$ のとき、$|2\\vec{a}-\\vec{b}|$ を求めよ。', '(5)　$|\\vec{a}|=2,\\ |\\vec{b}|=1,\\ |\\vec{a}-\\vec{b}|=\\sqrt7$ のとき、$\\vec{a},\\ \\vec{b}$ のなす角を求めよ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: 'めあて', say: '前の時間は成分を学びました。この時間は、2つのベクトルから1つの **数** をつくる **内積** です。角度や垂直を、計算で調べられるようになります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '内積 $\\vec{a}\\cdot\\vec{b}$ を、**定義** と **成分** の両方で計算できる\n内積で **なす角** と **垂直** を調べ、$|\\vec{a}+\\vec{b}|^2$ を展開できる' }] },

      // ---------- なす角と内積 ----------
      { clear: true, part: 'なす角と内積', say: '$\\vec{0}$ でない $\\vec{a},\\ \\vec{b}$ の **始点をそろえて** できる角 $\\theta$ を、$\\vec{a}$ と $\\vec{b}$ の **なす角** といいます。$0^\\circ\\le\\theta\\le180^\\circ$ です。',
        add: [{ t: 'h', text: 'なす角と内積' },
          { t: 'p', size: 'sm', text: 'なす角 $\\theta$：**始点をそろえて** はかる\n$0^\\circ\\le\\theta\\le180^\\circ$' },
          { t: 'fig', id: 'th', col: 1, view: [-0.6, -0.6, 4.0, 3.2], w: 560, h: 463, items: [
            ar([0, 0], [3.4, 0.9], 'y', 4), vl([1.9, 0.5], 'a', 'y', 10, 24), ar([0, 0], [1.0, 2.6], 'b', 4), vl([0.5, 1.3], 'b', 'b', -24, 0),
            { k: 'angle', o: [0, 0], a: [3.4, 0.9], b: [1.0, 2.6], rp: 56, c: 'p', label: 'θ', lr: 22 },
            { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', r: 4, size: 24 }] }] },
      { say: '$|\\vec{a}||\\vec{b}|\\cos\\theta$ を $\\vec{a}$ と $\\vec{b}$ の **内積** といい、$\\vec{a}\\cdot\\vec{b}$ と書きます。内積はベクトルではなく、**ただの数**（実数）です。',
        add: [{ t: 'box', c: 'y', label: '内積', tex: '\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta' },
          { t: 'p', size: 'sm', text: '$\\theta$ が鋭角 → 正、直角 → 0、鈍角 → 負\n（$\\vec{a}$ か $\\vec{b}$ が $\\vec{0}$ のときは $\\vec{a}\\cdot\\vec{b}=0$ と決める）' }] },
      { ask: { type: 'choice', q: '$|\\vec{a}|=4,\\ |\\vec{b}|=3$、なす角が $120^\\circ$ のとき、$\\vec{a}\\cdot\\vec{b}$ は？',
        opts: ['$6$', '$-6\\sqrt3$', '$12$', '$-6$'], ok: 3,
        why: { 0: '$\\cos120^\\circ=-\\frac12$。符号はマイナスです。', 1: '$\\cos120^\\circ$ は $-\\frac{\\sqrt3}{2}$ ではなく $-\\frac12$ です。', 2: '$\\cos120^\\circ$ をかけ忘れています。' },
        good: '$4\\cdot3\\cdot\\cos120^\\circ=12\\cdot\\left(-\\frac12\\right)=-6$。鈍角なので負になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec{a}\\cdot\\vec{b}=4\\cdot3\\cdot\\cos120^\\circ=-6' }] } },

      // ---------- 始点をそろえる ----------
      { clear: true, part: '始点をそろえる', say: '1辺が 3 の正三角形 ABC。$\\overrightarrow{\\mathrm{AB}}$ と $\\overrightarrow{\\mathrm{AC}}$ は始点が A でそろっているので、なす角は $60^\\circ$。内積は $\\frac92$ です。',
        add: [{ t: 'h', text: '始点をそろえて角をはかる' },
          { t: 'p', size: 'sm', text: '1辺が 3 の正三角形 ABC' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=3\\cdot3\\cdot\\cos60^\\circ=\\frac92' },
          { t: 'fig', id: 'eq', col: 1, view: [-0.6, -0.7, 5.2, 3.2], w: 620, h: 417, items: [
            ar(TA, TB, 'y', 4), ar(TA, TC, 'b', 4), ar(TB, TC, 'p', 4),
            { k: 'angle', o: TA, a: TB, b: TC, rp: 40, c: 'w', label: '60°', lr: 24 },
            { k: 'pt', at: TA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: TB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: TC, name: 'C', dir: 'n', r: 4 },
            { k: 'label', at: [1.5, 0], text: '3', c: 'y', size: 24, dy: 22 }, { k: 'label', at: [0.75, 1.3], text: '3', c: 'b', size: 24, dx: -20, dy: -6 }] }] },
      { ask: { type: 'choice', q: '同じ正三角形で、$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{BC}}$ は？',
        opts: ['$\\dfrac92$', '$-\\dfrac92$', '$\\dfrac{9\\sqrt3}{2}$', '$9$'], ok: 1,
        why: { 0: '角 B の $60^\\circ$ を使っています。始点をそろえると、なす角は $120^\\circ$ です。', 2: '内積は $\\sin$ ではなく $\\cos$ を使います。', 3: '$\\cos$ をかけ忘れています。' },
        good: '$\\overrightarrow{\\mathrm{AB}}$ を B まで平行移動すると、なす角は $180^\\circ-60^\\circ=120^\\circ$。$9\\cos120^\\circ=-\\frac92$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{BC}}=3\\cdot3\\cdot\\cos120^\\circ=-\\frac92' }],
        draw: [{ fig: 'eq', items: [ar(TB, [4.5, 0], 'y', 3, true), { k: 'angle', o: TB, a: [4.5, 0], b: TC, rp: 34, c: 'p', label: '120°', lr: 30 }] }] } },

      // ---------- 成分と内積 ----------
      { clear: true, part: '成分と内積', say: '成分で表すと、内積は **$a_1b_1+a_2b_2$**。$x$ 成分どうし、$y$ 成分どうしをかけて足すだけです。$\\cos$ を使わずに計算できます。',
        add: [{ t: 'h', text: '成分と内積' },
          { t: 'box', c: 'y', label: '成分', tex: '\\vec{a}\\cdot\\vec{b}=a_1b_1+a_2b_2' },
          { t: 'p', size: 'sm', text: '$\\vec{a}=(a_1,\\ a_2),\\ \\vec{b}=(b_1,\\ b_2)$' },
          { t: 'm', tex: '(2,\\ -1)\\cdot(3,\\ 4)=6-4=2' },
          { t: 'p', col: 1, size: 'sm', text: '導き方：△OAB で **余弦定理**\n$\\mathrm{AB}^2=\\mathrm{OA}^2+\\mathrm{OB}^2-2\\,\\mathrm{OA}\\cdot\\mathrm{OB}\\cos\\theta$' },
          { t: 'm', col: 1, size: 'sm', tex: '|\\vec{b}-\\vec{a}|^2=|\\vec{a}|^2+|\\vec{b}|^2-2\\,\\vec{a}\\cdot\\vec{b}' },
          { t: 'p', col: 1, size: 'sm', text: '左辺を成分で展開すると $(b_1-a_1)^2+(b_2-a_2)^2$。\n両辺を比べると $\\vec{a}\\cdot\\vec{b}=a_1b_1+a_2b_2$' }] },

      // ---------- なす角 ----------
      { clear: true, part: 'なす角を求める', say: '定義の式を変形すると $\\cos\\theta=\\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$。成分から $\\cos\\theta$ を出せば、なす角がわかります。',
        add: [{ t: 'h', text: 'なす角を求める' },
          { t: 'box', c: 'b', label: 'なす角', tex: '\\cos\\theta=\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}' },
          { t: 'p', size: 'sm', text: '例　$\\vec{a}=(3,\\ 1),\\ \\vec{b}=(1,\\ 2)$' },
          { t: 'm', size: 'sm', tex: '\\cos\\theta=\\frac{3+2}{\\sqrt{10}\\sqrt5}=\\frac{5}{5\\sqrt2}=\\frac{1}{\\sqrt2}' },
          { t: 'm', size: 'sm', tex: '\\theta=45^\\circ' },
          { t: 'fig', id: 'ag', col: 1, view: [-0.6, -0.6, 3.8, 2.6], w: 600, h: 436, items: [
            ax([1, 2, 3], [1, 2]),
            ar([0, 0], [3, 1], 'y', 4), vl([1.5, 0.5], 'a', 'y', 10, 24), ar([0, 0], [1, 2], 'b', 4), vl([0.5, 1], 'b', 'b', -24, -4),
            { k: 'angle', o: [0, 0], a: [3, 1], b: [1, 2], rp: 64, c: 'p', label: '45°', lr: 24 }] }] },
      { ask: { type: 'choice', q: '$\\vec{a}=(2,\\ -1),\\ \\vec{b}=(-3,\\ -1)$ のなす角 $\\theta$ は？',
        opts: ['$135^\\circ$', '$45^\\circ$', '$120^\\circ$', '$150^\\circ$'], ok: 0,
        why: { 1: '$\\vec{a}\\cdot\\vec{b}=-6+1=-5$ は負。$\\cos\\theta=-\\frac{1}{\\sqrt2}$ なので鈍角です。', 2: '$\\cos120^\\circ=-\\frac12$。ここでは $\\cos\\theta=-\\frac{1}{\\sqrt2}$ です。', 3: '$\\cos150^\\circ=-\\frac{\\sqrt3}{2}$。ここでは $-\\frac{1}{\\sqrt2}$ です。' },
        good: '$\\vec{a}\\cdot\\vec{b}=-5$、$|\\vec{a}|=\\sqrt5$、$|\\vec{b}|=\\sqrt{10}$ で $\\cos\\theta=-\\frac{1}{\\sqrt2}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\theta=\\frac{-6+1}{\\sqrt5\\sqrt{10}}=-\\frac{1}{\\sqrt2},\\quad \\theta=135^\\circ' }] } },

      // ---------- 垂直条件 ----------
      { clear: true, cols: [0.6, 0.4], part: '垂直条件', say: '$\\theta=90^\\circ$ のとき $\\cos\\theta=0$ なので、内積は 0。逆も成り立ちます。**$\\vec{a}\\perp\\vec{b}\\iff\\vec{a}\\cdot\\vec{b}=0$** です。',
        add: [{ t: 'h', text: '垂直条件' },
          { t: 'box', c: 'p', label: '垂直条件', tex: '\\vec{a}\\perp\\vec{b}\\iff \\vec{a}\\cdot\\vec{b}=0' },
          { t: 'p', size: 'sm', text: '成分では　$a_1b_1+a_2b_2=0$\n（$\\vec{a}\\neq\\vec{0},\\ \\vec{b}\\neq\\vec{0}$ のとき）' },
          { t: 'p', size: 'sm', text: '平行の条件 $a_1b_2-a_2b_1=0$ と取りちがえない。\n垂直は「同じ成分どうしの積の和」' },
          { t: 'fig', id: 'pp', col: 1, view: [-1.2, -2.6, 4.6, 6.6], w: 328, h: 520, items: [
            ax([1, 2, 3, 4], [-2, -1, 1, 2, 3, 4, 5, 6]),
            ar([0, 0], [3, -2], 'y', 4), { k: 'pt', at: [3, -2], name: '(3, −2)', dir: 's', r: 4, c: 'y', size: 22, off: 26 }] }] },
      { ask: { type: 'choice', q: '$\\vec{a}=(3,\\ -2)$ と $\\vec{b}=(4,\\ k)$ が垂直になる $k$ は？',
        opts: ['$-6$', '$6$', '$-\\dfrac83$', '$\\dfrac83$'], ok: 1,
        why: { 0: '$12-2k=0$ を解くと $k=6$。移項の符号に注意。', 2: 'それは平行の条件 $3k-(-2)\\cdot4=0$ で求めた値です。', 3: '垂直の条件は「同じ成分どうしの積の和 $=0$」で、$12-2k=0$ です。' },
        good: '$\\vec{a}\\cdot\\vec{b}=3\\cdot4+(-2)\\cdot k=12-2k=0$ より $k=6$。',
        add: [{ t: 'm', tex: '\\vec{a}\\cdot\\vec{b}=12-2k=0\\quad\\therefore\\ k=6' }],
        draw: [{ fig: 'pp', items: [ar([0, 0], [4, 6], 'b', 4), { k: 'pt', at: [4, 6], name: '(4, 6)', dir: 'w', r: 4, c: 'b', size: 22 }, { k: 'right', o: [0, 0], a: [3, -2], b: [4, 6], s: 16, c: 'p' }] }] } },

      // ---------- 内積の性質 ----------
      { clear: true, part: '内積の性質', say: '内積には文字式のような計算の法則があります。特に **$\\vec{a}\\cdot\\vec{a}=|\\vec{a}|^2$** が大切。ベクトルの大きさを、内積で計算できるのです。',
        add: [{ t: 'h', text: '内積の性質' },
          { t: 'box', c: 'y', label: '大切', tex: '\\vec{a}\\cdot\\vec{a}=|\\vec{a}|^2' },
          { t: 'm', size: 'sm', tex: '\\vec{a}\\cdot\\vec{b}=\\vec{b}\\cdot\\vec{a}' },
          { t: 'm', size: 'sm', tex: '(\\vec{a}+\\vec{b})\\cdot\\vec{c}=\\vec{a}\\cdot\\vec{c}+\\vec{b}\\cdot\\vec{c}' },
          { t: 'm', size: 'sm', tex: '(k\\vec{a})\\cdot\\vec{b}=k(\\vec{a}\\cdot\\vec{b})' }] },
      { say: 'これを使うと、$|\\vec{a}+\\vec{b}|^2$ は $(a+b)^2$ と同じ形に展開できます。真ん中の項は $2\\,\\vec{a}\\cdot\\vec{b}$ です。',
        add: [{ t: 'm', col: 1, tex: '\\begin{aligned}|\\vec{a}+\\vec{b}|^2&=(\\vec{a}+\\vec{b})\\cdot(\\vec{a}+\\vec{b})\\\\ &=|\\vec{a}|^2+2\\,\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2\\end{aligned}' },
          { t: 'p', col: 1, size: 'sm', text: '$|\\vec{a}-\\vec{b}|^2=|\\vec{a}|^2-2\\,\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2$ も同じ' }] },
      { ask: { type: 'choice', q: '$|\\vec{a}|=3,\\ |\\vec{b}|=2,\\ \\vec{a}\\cdot\\vec{b}=-2$ のとき、$|2\\vec{a}-\\vec{b}|$ は？',
        opts: ['$2\\sqrt{10}$', '$\\sqrt{30}$', '$4\\sqrt2$', '$4\\sqrt3$'], ok: 3,
        why: { 0: '真ん中の項 $-4\\,\\vec{a}\\cdot\\vec{b}$ を忘れています。', 1: '$|2\\vec{a}|^2=4|\\vec{a}|^2$。2 も2乗します。', 2: '$-4\\,\\vec{a}\\cdot\\vec{b}=-4\\cdot(-2)=+8$。符号に注意。' },
        good: '$4|\\vec{a}|^2-4\\,\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2=36+8+4=48$。$\\sqrt{48}=4\\sqrt3$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{aligned}|2\\vec{a}-\\vec{b}|^2&=4|\\vec{a}|^2-4\\,\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2\\\\ &=36+8+4=48\\end{aligned}' },
          { t: 'ans', col: 1, size: 'sm', label: '答', tex: '|2\\vec{a}-\\vec{b}|=4\\sqrt3' }] } },
      { ask: { type: 'think', q: '$|\\vec{a}|=2,\\ |\\vec{b}|=1,\\ |\\vec{a}-\\vec{b}|=\\sqrt7$ のとき、$\\vec{a}\\cdot\\vec{b}$ と、なす角 $\\theta$ を求めよう。',
        hint: '$|\\vec{a}-\\vec{b}|^2=|\\vec{a}|^2-2\\,\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2$ に代入する。',
        ans: '$7=4-2\\,\\vec{a}\\cdot\\vec{b}+1$ より $\\vec{a}\\cdot\\vec{b}=-1$。$\\cos\\theta=\\dfrac{-1}{2\\cdot1}=-\\dfrac12$ で $\\theta=120^\\circ$',
        after: '大きさの条件は、2乗して内積の式に直す。これから何度も使う流れです。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、点の位置をベクトルで表す **位置ベクトル** です。線分を分ける点や重心を、ベクトルで表します。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
