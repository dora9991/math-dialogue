/* 数学C 第1章 ベクトル 平面上のベクトル ⑤：ベクトルと図形
   例はすべて自作（△OAB で C＝OA の中点、D＝OB を 2:1 に内分、AD と BC の交点 P → s=3/4, t=1/2、OP=a/4+b/2、AP:PD=3:1／
   |a|=3,|b|=4,a·b=6 → 面積 3√3／O, A(4,−1), B(2,3) → 7／二等辺三角形 OA=OB で OM⊥AB／中線定理）。
   ※ 数学C 入試レベル ku-vec-01（OA を 2:1、OB を 3:2）とは別の数値。python3（sympy）で検算ずみ。図は数値どおりの形（三角形の形は自由に決めた）。 */
(function () {
  const POINTS = [
    '交点は「**2通りに表して係数を比べる**」。$\\vec{a},\\ \\vec{b}$ が1次独立（$\\vec{0}$ でなく平行でない）だから比べてよい',
    '三角形の面積　$S=\\dfrac12\\sqrt{|\\vec{a}|^2|\\vec{b}|^2-(\\vec{a}\\cdot\\vec{b})^2}=\\dfrac12|a_1b_2-a_2b_1|$',
    '垂直は「内積 $=0$」、長さの等式は「2乗して内積で展開」。図形の性質が計算で証明できる'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  // 交点の図：O(0,0) A(4,0) B(1,3)、C(2,0) D(2/3,2)、P(3/2,3/2)
  const O = [0, 0], A = [4, 0], B = [1, 3], C = [2, 0], D = [2 / 3, 2], P = [1.5, 1.5];
  const crossFig = (h) => ({ t: 'fig', id: 'cr', col: 1, view: [-0.5, -0.7, 4.6, 3.5], w: Math.round((h || 461) * 5.1 / 4.2), h: h || 461, items: [
    { k: 'poly', pts: [O, A, B], close: true, c: 'w', wd: 2.5 },
    { k: 'seg', a: A, b: D, c: 'y', wd: 3 }, { k: 'seg', a: B, b: C, c: 'g', wd: 3 },
    { k: 'pt', at: O, name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: A, name: 'A', dir: 'se', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'n', r: 4 },
    { k: 'pt', at: C, name: 'C', dir: 's', r: 4, c: 'b' }, { k: 'pt', at: D, name: 'D', dir: 'w', r: 4, c: 'b' },
    lb([1, 0], '1', 'b', 0, 22), lb([3, 0], '1', 'b', 0, 22), lb([1 / 3, 1], '2', 'b', -18, -4), lb([5 / 6, 2.5], '1', 'b', -18, -4),
    { k: 'pt', at: P, name: 'P', dir: 'e', r: 6, c: 'p', off: 20 }] });

  HB.lesson({
    id: 'mc1-05', field: '数学C　ベクトル', title: 'ベクトルと図形', level: '平面上のベクトル', time: '目安 9分',
    noDec: true,   // 分数はベクトルの係数ばかりなので、小数をそえない
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△OAB で、辺 OA の中点を C、辺 OB を $2:1$ に内分する点を D とし、線分 AD と BC の交点を P とする。$\\overrightarrow{\\mathrm{OA}}=\\vec{a},\\ \\overrightarrow{\\mathrm{OB}}=\\vec{b}$ として、$\\overrightarrow{\\mathrm{OP}}$ を $\\vec{a},\\ \\vec{b}$ で表せ。また AP : PD を求めよ。',
        '(2)　O$(0,\\ 0)$、A$(4,\\ -1)$、B$(2,\\ 3)$ のとき、△OAB の面積を求めよ。',
        '(3)　OA $=$ OB の二等辺三角形 OAB で、辺 AB の中点を M とする。OM ⊥ AB であることを、ベクトルを用いて証明せよ。',
        '(4)　△OAB で辺 AB の中点を M とするとき、$\\mathrm{OA}^2+\\mathrm{OB}^2=2(\\mathrm{OM}^2+\\mathrm{AM}^2)$ をベクトルを用いて証明せよ。'] },
    points: POINTS,
    cols: [0.55, 0.45],
    steps: [
      { cols: [1], part: 'めあて', say: '前の時間の位置ベクトルを使って、図形の問題を解きます。**交点・面積・証明** の3つです。どれも入試によく出る形です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '位置ベクトルで **2直線の交点** を表せる\n**三角形の面積** をベクトルで求め、**図形の性質** を内積で証明できる' }] },

      // ---------- 交点 ----------
      { clear: true, part: '2直線の交点', say: '△OAB で、辺 OA の中点を C、辺 OB を $2:1$ に内分する点を D とします。線分 AD と BC の交点 P を、$\\vec{a},\\ \\vec{b}$ で表します。',
        add: [{ t: 'h', text: '2直線の交点' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OC}}=\\frac12\\vec{a},\\qquad \\overrightarrow{\\mathrm{OD}}=\\frac23\\vec{b}' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: 'P を「AD 上の点」と「BC 上の点」の\n2通りで表し、係数を比べる' },
          crossFig(330)] },
      { say: 'P は AD 上。AP : PD $=s:(1-s)$ とおくと、内分点の公式から $\\overrightarrow{\\mathrm{OP}}=(1-s)\\vec{a}+s\\overrightarrow{\\mathrm{OD}}$ です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=(1-s)\\vec{a}+\\frac23s\\,\\vec{b}', note: '…①\nAD 上' }] },
      { ask: { type: 'choice', q: 'P は BC 上。BP : PC $=t:(1-t)$ とおくと、$\\overrightarrow{\\mathrm{OP}}$ は？',
        opts: ['$(1-t)\\vec{a}+\\dfrac12t\\,\\vec{b}$', '$\\dfrac12t\\,\\vec{a}+(1-t)\\vec{b}$', '$t\\,\\vec{a}+\\dfrac12(1-t)\\vec{b}$', '$\\dfrac12(1-t)\\vec{a}+t\\,\\vec{b}$'], ok: 1,
        why: { 0: '$\\vec{a}$ と $\\vec{b}$ の役割が逆です。B の側に $1-t$、C の側に $t$ がかかります。', 2: '$\\overrightarrow{\\mathrm{OC}}=\\frac12\\vec{a}$。$\\frac12$ がかかるのは $\\vec{a}$ のほうです。', 3: 'BP : PC $=t:(1-t)$ なので、C の側に $t$ がかかります。' },
        good: '$\\overrightarrow{\\mathrm{OP}}=(1-t)\\overrightarrow{\\mathrm{OB}}+t\\overrightarrow{\\mathrm{OC}}$ に $\\overrightarrow{\\mathrm{OC}}=\\frac12\\vec{a}$ を入れます。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac12t\\,\\vec{a}+(1-t)\\vec{b}', note: '…②\nBC 上' }] } },
      { say: '$\\vec{a},\\ \\vec{b}$ は $\\vec{0}$ でなく平行でもない（**1次独立**）ので、①と②の係数を比べてよいのです。答案にもこのことを書きます。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{cases}1-s=\\dfrac12t\\\\[6pt] \\dfrac23s=1-t\\end{cases}', note: '$\\vec{a},\\ \\vec{b}$ は1次独立\nだから係数を比べる' }] },
      { ask: { type: 'think', q: 'この連立方程式を解いて、$\\overrightarrow{\\mathrm{OP}}$ を求めよう。',
        hint: '2つ目の式から $t=1-\\frac23s$。これを1つ目に代入する。',
        ans: '$1-s=\\frac12-\\frac13s$ より $s=\\dfrac34$、$t=\\dfrac12$　　$\\overrightarrow{\\mathrm{OP}}=\\dfrac14\\vec{a}+\\dfrac12\\vec{b}$',
        after: '$t=\\frac12$ なので、P は BC の中点でもあります。',
        add: [{ t: 'ans', col: 1, size: 'sm', label: '答', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac14\\vec{a}+\\frac12\\vec{b}' }] } },
      { ask: { type: 'choice', q: 'AP : PD は？',
        opts: ['$3:1$', '$1:3$', '$3:4$', '$2:1$'], ok: 0,
        why: { 1: '逆です。$s$ は A の側から測った割合で、AP : PD $=s:(1-s)$。', 2: '$s=\\frac34$ は AP : AD の割合です。AP : PD は $\\frac34:\\frac14$。', 3: 'D が OB を分ける比 $2:1$ とは別の比です。' },
        good: '$s=\\frac34$ なので AP : PD $=\\frac34:\\frac14=3:1$。',
        draw: [{ fig: 'cr', items: [lb([2.75, 0.75], '3', 'y', 14, 16, 26), lb([13 / 12, 1.75], '1', 'y', 6, -22, 26)] }] } },

      // ---------- 面積 ----------
      { clear: true, cols: [0.6, 0.4], part: '三角形の面積', say: '△OAB の面積は $\\frac12|\\vec{a}||\\vec{b}|\\sin\\theta$。$\\sin\\theta=\\sqrt{1-\\cos^2\\theta}$ に $\\cos\\theta=\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$ を入れて、内積の式に直します。',
        add: [{ t: 'h', text: '三角形の面積' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}S&=\\frac12|\\vec{a}||\\vec{b}|\\sin\\theta=\\frac12|\\vec{a}||\\vec{b}|\\sqrt{1-\\cos^2\\theta}\\\\ &=\\frac12\\sqrt{|\\vec{a}|^2|\\vec{b}|^2-(\\vec{a}\\cdot\\vec{b})^2}\\end{aligned}' },
          { t: 'p', size: 'sm', text: '例　$|\\vec{a}|=3,\\ |\\vec{b}|=4,\\ \\vec{a}\\cdot\\vec{b}=6$ なら' },
          { t: 'm', size: 'sm', tex: 'S=\\frac12\\sqrt{9\\cdot16-6^2}=\\frac12\\sqrt{108}=3\\sqrt3' },
          { t: 'fig', id: 'ar', col: 1, view: [-0.4, -0.6, 4.4, 3.2], w: 520, h: 412, items: [
            { k: 'poly', pts: [[0, 0], [3.8, 0.4], [1.2, 2.6]], close: true, fill: 'y', alpha: 0.12, c: 'd', wd: 2 },
            ar([0, 0], [3.8, 0.4], 'y', 3.5), vl([1.9, 0.2], 'a', 'y', 6, 24), ar([0, 0], [1.2, 2.6], 'b', 3.5), vl([0.6, 1.3], 'b', 'b', -24, 0),
            { k: 'angle', o: [0, 0], a: [3.8, 0.4], b: [1.2, 2.6], rp: 44, c: 'p', label: 'θ', lr: 20 },
            { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', r: 4 }, { k: 'pt', at: [3.8, 0.4], name: 'A', dir: 'e', r: 4 }, { k: 'pt', at: [1.2, 2.6], name: 'B', dir: 'n', r: 4 }] }] },
      { clear: true, part: '成分で面積', say: '成分で $\\vec{a}=(a_1,\\ a_2),\\ \\vec{b}=(b_1,\\ b_2)$ と表すと、根号の中は $(a_1b_2-a_2b_1)^2$ になります。だから $S=\\frac12|a_1b_2-a_2b_1|$。',
        add: [{ t: 'h', text: '成分で面積を求める' },
          { t: 'box', c: 'y', label: '面積', tex: 'S=\\frac12|a_1b_2-a_2b_1|' },
          { t: 'p', size: 'sm', text: '$|\\vec{a}|^2|\\vec{b}|^2-(\\vec{a}\\cdot\\vec{b})^2$\n$=(a_1^2+a_2^2)(b_1^2+b_2^2)-(a_1b_1+a_2b_2)^2$\n$=(a_1b_2-a_2b_1)^2$' },
          { t: 'fig', id: 'ac', col: 1, view: [-0.8, -1.8, 4.8, 3.8], w: 520, h: 520, items: [
            { k: 'axes', grid: true, tx: [1, 2, 3, 4].map(v => [v, String(v)]), ty: [-1, 1, 2, 3].map(v => [v, String(v)]) },
            { k: 'poly', pts: [[0, 0], [4, -1], [2, 3]], close: true, fill: 'y', alpha: 0.18, c: 'y', wd: 3 },
            { k: 'pt', at: [4, -1], name: 'A(4, −1)', dir: 's', r: 5, size: 24 }, { k: 'pt', at: [2, 3], name: 'B(2, 3)', dir: 'e', r: 5, size: 24 }] }] },
      { ask: { type: 'choice', q: 'O$(0,\\ 0)$、A$(4,\\ -1)$、B$(2,\\ 3)$ のとき、△OAB の面積は？',
        opts: ['$5$', '$7$', '$14$', '$\\dfrac52$'], ok: 1,
        why: { 0: '$a_2b_1=(-1)\\cdot2=-2$ なので、$12-(-2)=14$。符号に注意。', 2: '$\\frac12$ をかけ忘れています。', 3: '内積 $\\vec{a}\\cdot\\vec{b}=8-3=5$ を使っています。使うのは $a_1b_2-a_2b_1$。' },
        good: '$\\frac12|4\\cdot3-(-1)\\cdot2|=\\frac12\\cdot14=7$。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\frac12|4\\cdot3-(-1)\\cdot2|=\\frac12\\cdot14=7' }] } },

      // ---------- 証明（垂直） ----------
      { clear: true, cols: [0.6, 0.4], part: '図形の証明', say: '内積を使うと、図形の性質を計算で証明できます。OA $=$ OB の二等辺三角形 OAB で、底辺 AB の中点を M とすると、OM ⊥ AB であることを示します。',
        add: [{ t: 'h', text: '図形の証明（垂直）' },
          { t: 'p', size: 'sm', text: '△OAB で OA $=$ OB、M は AB の中点。\n$\\overrightarrow{\\mathrm{OA}}=\\vec{a},\\ \\overrightarrow{\\mathrm{OB}}=\\vec{b}$ とする' },
          { t: 'm', size: 'sm', tex: '|\\vec{a}|=|\\vec{b}|,\\quad \\overrightarrow{\\mathrm{OM}}=\\frac{\\vec{a}+\\vec{b}}{2},\\quad \\overrightarrow{\\mathrm{AB}}=\\vec{b}-\\vec{a}' },
          { t: 'fig', id: 'iso', col: 1, view: [-0.2, -0.2, 4.2, 4.0], w: 440, h: 420, items: [
            { k: 'poly', pts: [[2, 3.4], [0.4, 0.4], [3.6, 0.4]], close: true, c: 'w', wd: 2.5 },
            { k: 'seg', a: [2, 3.4], b: [2, 0.4], c: 'p', wd: 3 },
            { k: 'pt', at: [2, 3.4], name: 'O', dir: 'n', r: 4 }, { k: 'pt', at: [0.4, 0.4], name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: [3.6, 0.4], name: 'B', dir: 'se', r: 4 },
            { k: 'pt', at: [2, 0.4], name: 'M', dir: 's', r: 4, c: 'p' }] }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{OM}}\\cdot\\overrightarrow{\\mathrm{AB}}$ を計算すると？',
        opts: ['$\\dfrac12(|\\vec{a}|^2+|\\vec{b}|^2)$', '$\\vec{a}\\cdot\\vec{b}$', '$\\dfrac12(|\\vec{b}|-|\\vec{a}|)^2$', '$\\dfrac12(|\\vec{b}|^2-|\\vec{a}|^2)$'], ok: 3,
        why: { 0: '$(\\vec{a}+\\vec{b})\\cdot(\\vec{b}-\\vec{a})$ は和と差の積。$|\\vec{a}|^2$ の前はマイナスです。', 1: '$\\vec{a}\\cdot\\vec{b}$ と $-\\vec{b}\\cdot\\vec{a}$ は打ち消し合って残りません。', 2: '和と差の積は、2乗の差 $|\\vec{b}|^2-|\\vec{a}|^2$ になります。' },
        good: '$\\frac12(\\vec{a}+\\vec{b})\\cdot(\\vec{b}-\\vec{a})=\\frac12(|\\vec{b}|^2-|\\vec{a}|^2)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{OM}}\\cdot\\overrightarrow{\\mathrm{AB}}&=\\frac12(\\vec{a}+\\vec{b})\\cdot(\\vec{b}-\\vec{a})\\\\ &=\\frac12(|\\vec{b}|^2-|\\vec{a}|^2)=0\\end{aligned}' }] } },
      { say: '$|\\vec{a}|=|\\vec{b}|$ なので内積は 0。$\\overrightarrow{\\mathrm{OM}}\\neq\\vec{0}$、$\\overrightarrow{\\mathrm{AB}}\\neq\\vec{0}$ だから OM ⊥ AB。図をかかなくても、計算で垂直が示せました。',
        add: [{ t: 'ans', size: 'sm', label: '結論', text: '$\\overrightarrow{\\mathrm{OM}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ より　OM ⊥ AB' }],
        draw: [{ fig: 'iso', items: [{ k: 'right', o: [2, 0.4], a: [3.6, 0.4], b: [2, 3.4], s: 16, c: 'p' }] }] },

      // ---------- 証明（等式） ----------
      { clear: true, cols: [0.6, 0.4], part: '等式の証明', say: '次は長さの等式。△OAB で AB の中点を M とすると、$\\mathrm{OA}^2+\\mathrm{OB}^2=2(\\mathrm{OM}^2+\\mathrm{AM}^2)$ が成り立ちます（**中線定理**）。これをベクトルで示します。',
        add: [{ t: 'h', text: '図形の証明（等式）' },
          { t: 'm', size: 'sm', tex: '\\mathrm{OA}^2+\\mathrm{OB}^2=2(\\mathrm{OM}^2+\\mathrm{AM}^2)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OM}}=\\frac{\\vec{a}+\\vec{b}}{2},\\qquad \\overrightarrow{\\mathrm{AM}}=\\frac{\\vec{b}-\\vec{a}}{2}' },
          { t: 'fig', id: 'med', col: 1, view: [-0.3, -0.5, 4.3, 3.4], w: 470, h: 398, items: [
            { k: 'poly', pts: [[0.6, 2.8], [0, 0], [4, 0.4]], close: true, c: 'w', wd: 2.5 },
            { k: 'seg', a: [0.6, 2.8], b: [2, 0.2], c: 'p', wd: 3 },
            { k: 'pt', at: [0.6, 2.8], name: 'O', dir: 'n', r: 4 }, { k: 'pt', at: [0, 0], name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: [4, 0.4], name: 'B', dir: 'se', r: 4 },
            { k: 'pt', at: [2, 0.2], name: 'M', dir: 's', r: 4, c: 'p' }] }] },
      { ask: { type: 'think', q: '$|\\vec{a}|^2+|\\vec{b}|^2=2(|\\overrightarrow{\\mathrm{OM}}|^2+|\\overrightarrow{\\mathrm{AM}}|^2)$ を示そう。',
        hint: '右辺の $|\\vec{a}+\\vec{b}|^2$ と $|\\vec{b}-\\vec{a}|^2$ を、内積で展開する。',
        ans: '右辺 $=2\\left(\\dfrac{|\\vec{a}+\\vec{b}|^2}{4}+\\dfrac{|\\vec{b}-\\vec{a}|^2}{4}\\right)=\\dfrac{2|\\vec{a}|^2+2|\\vec{b}|^2}{2}=|\\vec{a}|^2+|\\vec{b}|^2=$ 左辺',
        after: '$+2\\,\\vec{a}\\cdot\\vec{b}$ と $-2\\,\\vec{a}\\cdot\\vec{b}$ が打ち消し合うのがポイントです。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&2\\left(\\frac{|\\vec{a}+\\vec{b}|^2}{4}+\\frac{|\\vec{b}-\\vec{a}|^2}{4}\\right)\\\\ &=\\frac{(|\\vec{a}|^2+2\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2)+(|\\vec{a}|^2-2\\vec{a}\\cdot\\vec{b}+|\\vec{b}|^2)}{2}\\\\ &=|\\vec{a}|^2+|\\vec{b}|^2\\end{aligned}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、直線や円をベクトルの式で表す **ベクトル方程式** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
