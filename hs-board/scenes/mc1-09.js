/* 数学C 第1章 ベクトル 空間のベクトル ⑨：空間の位置ベクトルと図形
   例はすべて自作（A(2,−1,3),B(−4,5,0) の 2:1 内分点 (−2,3,1)／OP=OA/3+OB/4+kOC が平面 ABC 上 → k=5/12／
   四面体 OABC で OP=a/4+b/3+c/6、直線 OP と平面 ABC の交点 Q → OQ=(4/3)OP=a/3+4b/9+2c/9、OP:PQ=3:1／
   A(2,0,0),B(0,4,0),C(0,0,4) の平面と直線 OD（D(1,1,2)）の交点 (4/5,4/5,8/5)）。python3（sympy）で検算ずみ。
   四面体の図は、頂点を平面にかいた見取図（P・Q は同じ係数の1次結合で位置を決めたので、平行投影の見取図として正しい）。
   座標の図は x 軸を左下（奥行き 0.45・0.38 倍）・y 軸を右・z 軸を上。 */
(function () {
  const POINTS = [
    '空間でも $\\overrightarrow{\\mathrm{AB}}=\\vec{b}-\\vec{a}$、内分点・外分点・重心の公式は平面と同じ（座標なら $x,\\ y,\\ z$ ごとに）',
    '点 P が平面 ABC 上 ⇔ $\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ ⇔ $\\overrightarrow{\\mathrm{OP}}=\\alpha\\overrightarrow{\\mathrm{OA}}+\\beta\\overrightarrow{\\mathrm{OB}}+\\gamma\\overrightarrow{\\mathrm{OC}}$ で **$\\alpha+\\beta+\\gamma=1$**',
    '直線と平面の交点は「直線上 → $k$ 倍」「平面上 → 係数の和 $=1$」の2つの条件から求める'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  const comb = (pts, w) => [pts.reduce((s, p, i) => s + w[i] * p[0], 0), pts.reduce((s, p, i) => s + w[i] * p[1], 0)];
  // 同じ平面上の図（平面を平行四辺形でかく）
  const FA = [1.0, 0.5], FB = [3.2, 0.6], FC = [2.0, 1.9], FS = [1 + 0.9 * 2.2, 0.5 + 0.9 * 0.1], FP = [FS[0] + 0.5, FS[1] + 0.7];
  const planeFig = () => ({ t: 'fig', id: 'pl', col: 1, view: [-0.3, -0.5, 5.6, 2.9], w: 640, h: 369, items: [
    { k: 'poly', pts: [[0, 0], [4.4, 0], [5.4, 2.4], [1.0, 2.4]], close: true, fill: 'g', alpha: 0.12, c: 'g', wd: 2 },
    ar(FA, FB, 'y', 3.5), ar(FA, FC, 'b', 3.5), ar(FA, FP, 'p', 3.5),
    { k: 'seg', a: FB, b: FS, c: 'y', dash: true, wd: 2 }, { k: 'seg', a: FS, b: FP, c: 'b', dash: true, wd: 2 },
    { k: 'pt', at: FA, name: 'A', dir: 'w', r: 4 }, { k: 'pt', at: FB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: FC, name: 'C', dir: 'n', r: 4 }, { k: 'pt', at: FP, name: 'P', dir: 'ne', r: 5, c: 'p' },
    lb([4.9, 2.2], '平面 ABC', 'g', -40, 0, 20)] });
  // 四面体 OABC（見取図）：P＝a/4+b/3+c/6、Q＝(4/3)P
  const T = { O: [0, 0], A: [2.4, -0.8], B: [4, 0.6], C: [1.4, 3.2] };
  const TP = comb([T.A, T.B, T.C], [1 / 4, 1 / 3, 1 / 6]), TQ = comb([T.A, T.B, T.C], [1 / 3, 4 / 9, 2 / 9]);
  const tetraFig = () => ({ t: 'fig', id: 'te', col: 1, view: [-0.5, -1.3, 4.6, 3.6], w: 500, h: 480, items: [
    { k: 'poly', pts: [T.A, T.B, T.C], close: true, fill: 'y', alpha: 0.16, noStroke: true },
    { k: 'seg', a: T.O, b: T.B, c: 'w', dash: true, wd: 2 },
    { k: 'seg', a: T.O, b: T.A, wd: 2.5 }, { k: 'seg', a: T.O, b: T.C, wd: 2.5 }, { k: 'seg', a: T.A, b: T.B, wd: 2.5 }, { k: 'seg', a: T.A, b: T.C, wd: 2.5 }, { k: 'seg', a: T.B, b: T.C, wd: 2.5 },
    { k: 'pt', at: T.O, name: 'O', dir: 'w', r: 4 }, { k: 'pt', at: T.A, name: 'A', dir: 's', r: 4 }, { k: 'pt', at: T.B, name: 'B', dir: 'e', r: 4 }, { k: 'pt', at: T.C, name: 'C', dir: 'n', r: 4 },
    { k: 'seg', a: T.O, b: TP, c: 'p', wd: 2.5 }, { k: 'pt', at: TP, name: 'P', dir: 'n', r: 5, c: 'p', off: 20 },
    lb([4.0, 2.4], '平面 ABC', 'y', -10, 0, 20)] });
  // 座標の図：A(2,0,0) B(0,4,0) C(0,0,4)、D(1,1,2)、Q(4/5,4/5,8/5)
  const pj = (x, y, z) => [y - 0.45 * x, z - 0.38 * x];
  const cA = pj(2, 0, 0), cB = pj(0, 4, 0), cC = pj(0, 0, 4), cD = pj(1, 1, 2), cQ = pj(0.8, 0.8, 1.6), cO = pj(0, 0, 0);
  const coordFig = () => ({ t: 'fig', id: 'cd', col: 1, view: [-1.7, -1.4, 5.3, 4.9], w: 533, h: 480, items: [
    ar(cO, pj(3, 0, 0), 'd', 2), ar(cO, pj(0, 5.0, 0), 'd', 2), ar(cO, pj(0, 0, 4.7), 'd', 2),
    lb(pj(3, 0, 0), 'x', 'd', -14, 8, 22), lb(pj(0, 5.0, 0), 'y', 'd', 0, 18, 22), lb(pj(0, 0, 4.7), 'z', 'd', 14, 0, 22), lb(cO, 'O', 'w', -16, -8, 22),
    { k: 'poly', pts: [cA, cB, cC], close: true, fill: 'y', alpha: 0.18, c: 'y', wd: 2.5 },
    { k: 'pt', at: cA, name: 'A(2, 0, 0)', dir: 'w', r: 4, size: 20 }, { k: 'pt', at: cB, name: 'B(0, 4, 0)', dir: 's', r: 4, size: 20 }, { k: 'pt', at: cC, name: 'C(0, 0, 4)', dir: 'e', r: 4, size: 20 },
    { k: 'seg', a: cO, b: cQ, c: 'p', dash: true, wd: 2.5 }, { k: 'seg', a: cQ, b: cD, c: 'p', wd: 2.5 }, { k: 'seg', a: cD, b: pj(1.25, 1.25, 2.5), c: 'p', wd: 2.5 },
    { k: 'pt', at: cD, name: 'D(1, 1, 2)', dir: 'e', r: 4, c: 'p', size: 20 }] });

  HB.lesson({
    id: 'mc1-09', field: '数学C　ベクトル', title: '空間の位置ベクトルと図形', level: '空間のベクトル', time: '目安 8分',
    noDec: true,   // 分数はベクトルの係数ばかりなので、小数をそえない
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　A$(2,\\ -1,\\ 3)$、B$(-4,\\ 5,\\ 0)$ を結ぶ線分を $2:1$ に内分する点の座標を求めよ。',
        '(2)　四面体 OABC で、$\\overrightarrow{\\mathrm{OP}}=\\dfrac13\\overrightarrow{\\mathrm{OA}}+\\dfrac14\\overrightarrow{\\mathrm{OB}}+k\\overrightarrow{\\mathrm{OC}}$ の点 P が平面 ABC 上にあるとき、$k$ を求めよ。',
        '(3)　四面体 OABC で $\\overrightarrow{\\mathrm{OP}}=\\dfrac14\\overrightarrow{\\mathrm{OA}}+\\dfrac13\\overrightarrow{\\mathrm{OB}}+\\dfrac16\\overrightarrow{\\mathrm{OC}}$ とする。直線 OP と平面 ABC の交点を Q とするとき、$\\overrightarrow{\\mathrm{OQ}}$ と OP : PQ を求めよ。',
        '(4)　A$(2,\\ 0,\\ 0)$、B$(0,\\ 4,\\ 0)$、C$(0,\\ 0,\\ 4)$ の平面 ABC と、O と D$(1,\\ 1,\\ 2)$ を通る直線の交点の座標を求めよ。'] },
    points: POINTS,
    cols: [0.55, 0.45],
    steps: [
      { cols: [1], part: 'めあて', say: '前の時間までで、空間のベクトルの成分と内積を学びました。この時間は空間の位置ベクトル。平面の考え方に、「**同じ平面上**」という空間ならではの条件が加わります。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '空間でも **内分点・重心** を位置ベクトルで表せる\n**同じ平面上** にある条件を使い、**直線と平面の交点** を求められる' }] },

      // ---------- 空間の位置ベクトル ----------
      { clear: true, cols: [1], part: '空間の位置ベクトル', say: '空間でも点 O を基準に P$(\\vec{p})$ と表します。内分点・外分点・重心の公式は、平面とまったく同じ。座標で計算するときは、$x,\\ y,\\ z$ の3つについて同じ計算をします。',
        add: [{ t: 'h', text: '空間の位置ベクトル（平面と同じ公式）' },
          { t: 'tbl', cls: 'rowh', rows: [['', '位置ベクトル'], ['$\\overrightarrow{\\mathrm{AB}}$', '$\\vec{b}-\\vec{a}$'], ['$m:n$ に内分する点', '$\\dfrac{n\\vec{a}+m\\vec{b}}{m+n}$'], ['$m:n$ に外分する点', '$\\dfrac{-n\\vec{a}+m\\vec{b}}{m-n}$'], ['△ABC の重心', '$\\dfrac{\\vec{a}+\\vec{b}+\\vec{c}}{3}$']] }] },
      { ask: { type: 'choice', q: 'A$(2,\\ -1,\\ 3)$、B$(-4,\\ 5,\\ 0)$ を結ぶ線分を $2:1$ に内分する点の座標は？',
        opts: ['$(0,\\ 1,\\ 2)$', '$\\left(-1,\\ 2,\\ \\frac32\\right)$', '$(-2,\\ 3,\\ 1)$', '$(-10,\\ 11,\\ -3)$'], ok: 2,
        why: { 0: '係数が逆です。A の座標にかけるのは 1、B の座標にかけるのは 2。', 1: 'それは中点です。', 3: 'それは $2:1$ に外分する点です。' },
        good: '$\\left(\\frac{2+2\\cdot(-4)}{3},\\ \\frac{-1+2\\cdot5}{3},\\ \\frac{3+2\\cdot0}{3}\\right)=(-2,\\ 3,\\ 1)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\left(\\frac{1\\cdot2+2\\cdot(-4)}{3},\\ \\frac{1\\cdot(-1)+2\\cdot5}{3},\\ \\frac{1\\cdot3+2\\cdot0}{3}\\right)=(-2,\\ 3,\\ 1)' }] } },

      // ---------- 同じ平面上 ----------
      { clear: true, part: '同じ平面上にある条件', say: '一直線上にない3点 A, B, C があるとき、点 P が **平面 ABC 上** にあるのは、$\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ と表せるとき。平面の「ベクトルの分解」と同じ考え方です。',
        add: [{ t: 'h', text: '4点が同じ平面上にある条件' },
          { t: 'box', c: 'y', label: '平面 ABC 上', tex: '\\overrightarrow{\\mathrm{AP}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}' },
          { t: 'p', size: 'sm', text: '（$s,\\ t$ は実数）　A から B の向きに $s$、C の向きに $t$ 進んだ所' },
          planeFig()] },
      { say: '位置ベクトルで書くと $\\vec{p}-\\vec{a}=s(\\vec{b}-\\vec{a})+t(\\vec{c}-\\vec{a})$、つまり $\\vec{p}=(1-s-t)\\vec{a}+s\\vec{b}+t\\vec{c}$。**係数の和が 1** です（O は平面 ABC の外の点）。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec{p}=(1-s-t)\\vec{a}+s\\vec{b}+t\\vec{c}' },
          { t: 'box', c: 'p', label: '係数の和', text: '$\\overrightarrow{\\mathrm{OP}}=\\alpha\\overrightarrow{\\mathrm{OA}}+\\beta\\overrightarrow{\\mathrm{OB}}+\\gamma\\overrightarrow{\\mathrm{OC}}$ で\n$\\alpha+\\beta+\\gamma=1$' }] },
      { ask: { type: 'choice', q: '四面体 OABC で $\\overrightarrow{\\mathrm{OP}}=\\dfrac13\\overrightarrow{\\mathrm{OA}}+\\dfrac14\\overrightarrow{\\mathrm{OB}}+k\\overrightarrow{\\mathrm{OC}}$ の点 P が平面 ABC 上にあるとき、$k$ は？',
        opts: ['$\\dfrac{7}{12}$', '$\\dfrac57$', '$\\dfrac{5}{12}$', '$1$'], ok: 2,
        why: { 0: '$\\frac13+\\frac14=\\frac7{12}$ をそのまま答えています。和が 1 になるのは $k=1-\\frac7{12}$。', 1: '$\\frac13+\\frac14$ を $\\frac27$ と計算しています。分母をそろえて $\\frac7{12}$。', 3: '係数の和を 1 にします。$k$ だけを 1 にするのではありません。' },
        good: '$\\frac13+\\frac14+k=1$ より $k=\\frac5{12}$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac13+\\frac14+k=1\\quad\\therefore\\ k=\\frac{5}{12}' }] } },

      // ---------- 直線と平面の交点 ----------
      { clear: true, part: '直線と平面の交点', say: '四面体 OABC の内部に、$\\overrightarrow{\\mathrm{OP}}=\\frac14\\vec{a}+\\frac13\\vec{b}+\\frac16\\vec{c}$ となる点 P をとります。直線 OP と平面 ABC の交点 Q を求めます。',
        add: [{ t: 'h', text: '直線と平面の交点' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac14\\vec{a}+\\frac13\\vec{b}+\\frac16\\vec{c}' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: 'Q は直線 OP 上 → $\\overrightarrow{\\mathrm{OQ}}=k\\overrightarrow{\\mathrm{OP}}$\nQ は平面 ABC 上 → 係数の和 $=1$' },
          tetraFig()] },
      { say: 'Q は直線 OP 上なので、$\\overrightarrow{\\mathrm{OQ}}=k\\overrightarrow{\\mathrm{OP}}=\\frac{k}{4}\\vec{a}+\\frac{k}{3}\\vec{b}+\\frac{k}{6}\\vec{c}$。Q は平面 ABC 上にもあるので、この係数の和が 1 です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OQ}}=\\frac{k}{4}\\vec{a}+\\frac{k}{3}\\vec{b}+\\frac{k}{6}\\vec{c}' }] },
      { ask: { type: 'choice', q: '$k$ の値は？',
        opts: ['$\\dfrac34$', '$\\dfrac43$', '$\\dfrac{12}{7}$', '$\\dfrac{13}{3}$'], ok: 1,
        why: { 0: '逆数です。$\\frac34k=1$ を解くと $k=\\frac43$。', 2: '$\\frac{k}{6}$ の項を落としています。', 3: '分数の和を「分子どうし・分母どうし」で計算しています。' },
        good: '$\\left(\\frac14+\\frac13+\\frac16\\right)k=\\frac34k=1$ より $k=\\frac43$。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{k}{4}+\\frac{k}{3}+\\frac{k}{6}=\\frac34k=1\\quad\\therefore\\ k=\\frac43' }] } },
      { say: '$k=\\frac43$ なので $\\overrightarrow{\\mathrm{OQ}}=\\frac13\\vec{a}+\\frac49\\vec{b}+\\frac29\\vec{c}$。係数の和は $\\frac39+\\frac49+\\frac29=1$ で、たしかに平面 ABC 上です。',
        add: [{ t: 'ans', size: 'sm', label: '答', tex: '\\overrightarrow{\\mathrm{OQ}}=\\frac13\\vec{a}+\\frac49\\vec{b}+\\frac29\\vec{c}' }],
        draw: [{ fig: 'te', items: [{ k: 'seg', a: TP, b: TQ, c: 'p', wd: 2.5, dash: true }, { k: 'pt', at: TQ, name: 'Q', dir: 'se', r: 6, c: 'g' }] }] },
      { ask: { type: 'choice', q: 'OP : PQ は？',
        opts: ['$3:1$', '$4:3$', '$3:4$', '$1:3$'], ok: 0,
        why: { 1: 'それは OQ : OP です。', 2: 'それは OP : OQ です。PQ は OQ から OP を引いた長さ。', 3: '逆です。OP を 3 とすると OQ が 4、PQ は 1。' },
        good: '$\\overrightarrow{\\mathrm{OQ}}=\\frac43\\overrightarrow{\\mathrm{OP}}$ なので OP : OQ $=3:4$、OP : PQ $=3:1$。',
        draw: [{ fig: 'te', items: [lb(comb([T.O, TP], [0.5, 0.5]), '3', 'p', -4, -20, 24), lb(comb([TP, TQ], [0.5, 0.5]), '1', 'p', 0, -20, 24)] }] } },

      // ---------- 座標で ----------
      { clear: true, part: '座標で求める', say: '座標でも同じ方法です。A$(2,\\ 0,\\ 0)$、B$(0,\\ 4,\\ 0)$、C$(0,\\ 0,\\ 4)$ の平面 ABC と、原点 O と D$(1,\\ 1,\\ 2)$ を通る直線の交点 Q を考えます。',
        add: [{ t: 'h', text: '座標で交点を求める' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OQ}}=k\\overrightarrow{\\mathrm{OD}}=(k,\\ k,\\ 2k)', note: '直線 OD 上' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{OQ}}&=(1-s-t)\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{OB}}+t\\overrightarrow{\\mathrm{OC}}\\\\ &=(2(1-s-t),\\ 4s,\\ 4t)\\end{aligned}', note: '平面 ABC 上' },
          coordFig()] },
      { ask: { type: 'think', q: '直線 OD と平面 ABC の交点 Q の座標を求めよう。',
        hint: '2つの表し方の成分を等しいとおく：$4s=k,\\ 4t=2k,\\ 2(1-s-t)=k$。',
        ans: '$s=\\frac{k}{4},\\ t=\\frac{k}{2}$ を代入して $2-\\frac32k=k$、$k=\\dfrac45$　　Q$\\left(\\dfrac45,\\ \\dfrac45,\\ \\dfrac85\\right)$',
        after: '次の時間は「平面の方程式」。平面 ABC を式で表すと、この交点がもっと楽に求められます。',
        add: [{ t: 'ans', size: 'sm', label: '答', tex: '\\mathrm{Q}\\left(\\frac45,\\ \\frac45,\\ \\frac85\\right)' }],
        draw: [{ fig: 'cd', items: [{ k: 'pt', at: cQ, name: 'Q', dir: 'nw', r: 6, c: 'g' }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、この章の最後。**球面・平面・直線の方程式** を、ベクトルの考え方で求めます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
