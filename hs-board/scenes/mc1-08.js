/* 数学C 第1章 ベクトル 空間のベクトル ⑧：空間ベクトルの内積
   例はすべて自作（一辺 2 の立方体で OP=(2,2,0)・OQ=(0,2,2) → 60°／(1,1,0),(−1,0,1) → 120°／(3,−1,2)⊥(x,4,−1) → x=2／
   (1,1,0),(0,1,2) の両方に垂直 → (2,−2,1) の実数倍、大きさ 6 は ±(4,−4,2)／A(1,2,0),B(2,3,2),C(0,4,1) → 面積 3√3/2・∠BAC=60°／
   a=(1,2,3),b=(1,0,−1) で |a+tb| の最小 → t=1 で 2√3）。python3（sympy）で検算ずみ。
   見取図は x 軸を左下（奥行き 0.45・0.38 倍）・y 軸を右・z 軸を上。直角の印も空間の正方形を見取図に写してかく。 */
(function () {
  const POINTS = [
    '空間でも $\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta=a_1b_1+a_2b_2+a_3b_3$。なす角は $\\cos\\theta=\\dfrac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}$',
    '垂直 ⇔ 内積 $=0$。2つのベクトルの **両方に垂直** なベクトルは、内積 $=0$ の式を2つ立てて求める（大きさを決めるときは $\\pm$）',
    '三角形の面積は平面と同じ $\\dfrac12\\sqrt{|\\overrightarrow{\\mathrm{AB}}|^2|\\overrightarrow{\\mathrm{AC}}|^2-(\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}})^2}$'
  ];
  const ar = (a, b, c, wd, dash) => ({ k: 'vec', a, b, c, wd: wd || 3.5, dash });
  const vl = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, vec: true, size: size || 28, dx: dx || 0, dy: dy || 0 });
  const lb = (at, text, c, dx, dy, size) => ({ k: 'label', at, text, c, size: size || 24, dx: dx || 0, dy: dy || 0 });
  const pj = (x, y, z) => [y - 0.45 * x, z - 0.38 * x];   // 見取図：x 軸は左下へ
  const P = v => pj(v[0], v[1], v[2]);
  const nz = v => { const L = Math.hypot(v[0], v[1], v[2]); return v.map(t => t / L); };
  const rt3 = (o, u, v, s, c) => { const U = nz(u), W = nz(v), q = (a, b) => P([o[0] + s * (a * U[0] + b * W[0]), o[1] + s * (a * U[1] + b * W[1]), o[2] + s * (a * U[2] + b * W[2])]);
    return { k: 'poly', pts: [q(1, 0), q(1, 1), q(0, 1)], c: c || 'p', wd: 2 }; };   // 空間の直角の印
  const axes3 = (X, Y, Z) => [ar(pj(0, 0, 0), pj(X, 0, 0), 'd', 2), ar(pj(0, 0, 0), pj(0, Y, 0), 'd', 2), ar(pj(0, 0, 0), pj(0, 0, Z), 'd', 2),
    lb(pj(X, 0, 0), 'x', 'd', -14, 8, 22), lb(pj(0, Y, 0), 'y', 'd', 0, 18, 22), lb(pj(0, 0, Z), 'z', 'd', 14, 0, 22)];

  // 一辺 2 の立方体（O は奥の見えない頂点）
  const cubeFig = () => {
    const V = (x, y, z) => pj(x, y, z), hid = [[[0, 0, 0], [2, 0, 0]], [[0, 0, 0], [0, 2, 0]], [[0, 0, 0], [0, 0, 2]]];
    const vis = [[[2, 0, 0], [2, 2, 0]], [[2, 0, 0], [2, 0, 2]], [[0, 2, 0], [2, 2, 0]], [[0, 2, 0], [0, 2, 2]], [[0, 0, 2], [2, 0, 2]], [[0, 0, 2], [0, 2, 2]],
      [[2, 2, 0], [2, 2, 2]], [[2, 0, 2], [2, 2, 2]], [[0, 2, 2], [2, 2, 2]]];
    return { t: 'fig', id: 'cu', col: 1, view: [-1.5, -1.3, 2.9, 2.8], w: 556, h: 518, items: hid.map(([a, b]) => ({ k: 'seg', a: V(...a), b: V(...b), c: 'd', dash: true, wd: 2 }))
      .concat(vis.map(([a, b]) => ({ k: 'seg', a: V(...a), b: V(...b), c: 'd', wd: 2 })), [
        { k: 'poly', pts: [V(0, 0, 0), V(2, 2, 0), V(0, 2, 2)], close: true, fill: 'y', alpha: 0.18, noStroke: true },
        ar(V(0, 0, 0), V(2, 2, 0), 'y', 4), ar(V(0, 0, 0), V(0, 2, 2), 'b', 4), { k: 'seg', a: V(2, 2, 0), b: V(0, 2, 2), c: 'p', dash: true, wd: 2.5 },
        { k: 'pt', at: V(0, 0, 0), name: 'O', dir: 'w', r: 4 }, { k: 'pt', at: V(2, 2, 0), name: 'P', dir: 's', r: 5, c: 'y' }, { k: 'pt', at: V(0, 2, 2), name: 'Q', dir: 'ne', r: 5, c: 'b' },
        lb(V(2, 0, 0), '2', 'd', -14, 8, 20), lb(V(0, 2, 0), '2', 'd', 14, 14, 20), lb(V(0, 0, 2), '2', 'd', -14, 0, 20),
        ar(V(2, 0, 0), V(2.9, 0, 0), 'd', 2), ar(V(0, 2, 0), V(0, 2.8, 0), 'd', 2), ar(V(0, 0, 2), V(0, 0, 2.7), 'd', 2),
        lb(V(2.9, 0, 0), 'x', 'd', 14, 8, 22), lb(V(0, 2.8, 0), 'y', 'd', 0, 18, 22), lb(V(0, 0, 2.7), 'z', 'd', 14, 0, 22)]) };
  };
  // 両方に垂直：a=(1,1,0)、b=(0,1,2)、p=(2,−2,1)
  const va = [1, 1, 0], vb = [0, 1, 2], vp = [2, -2, 1], o3 = [0, 0, 0];
  const perpFig = () => ({ t: 'fig', id: 'pp', col: 1, view: [-3.4, -1.2, 2.9, 2.6], w: 700, h: 422, items: axes3(2.4, 2.7, 2.4).concat([
    { k: 'poly', pts: [P(o3), P(va), P([1, 2, 2]), P(vb)], close: true, fill: 'g', alpha: 0.15, c: 'g', wd: 1.5, dash: true },
    ar(P(o3), P(va), 'y', 4), vl(P(va), 'a', 'y', 4, 22), ar(P(o3), P(vb), 'b', 4), vl(P(vb), 'b', 'b', -20, -4),
    lb(pj(0, 0, 0), 'O', 'w', 4, 22, 22)]) });
  // 三角形の面積：A(1,2,0) B(2,3,2) C(0,4,1)
  const TA = [1, 2, 0], TB = [2, 3, 2], TC = [0, 4, 1];
  const triFig = () => ({ t: 'fig', id: 'tr', col: 1, view: [-1.8, -1.5, 5.6, 3.2], w: 620, h: 394, items: axes3(3, 5.2, 2.8).concat([
    { k: 'seg', a: P(TB), b: pj(2, 3, 0), c: 'd', dash: true, wd: 1.5 }, { k: 'seg', a: P(TC), b: pj(0, 4, 0), c: 'd', dash: true, wd: 1.5 },
    { k: 'poly', pts: [P(TA), P(TB), P(TC)], close: true, fill: 'y', alpha: 0.2, c: 'y', wd: 3 },
    { k: 'pt', at: P(TA), name: 'A(1, 2, 0)', dir: 's', r: 5, size: 22 }, { k: 'pt', at: P(TB), name: 'B(2, 3, 2)', dir: 'n', r: 5, size: 22 }, { k: 'pt', at: P(TC), name: 'C(0, 4, 1)', dir: 'e', r: 5, size: 22 }]) });

  HB.lesson({
    id: 'mc1-08', field: '数学C　ベクトル', title: '空間ベクトルの内積', level: '空間のベクトル', time: '目安 8分',
    noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\vec{a}=(1,\\ 1,\\ 0),\\ \\vec{b}=(-1,\\ 0,\\ 1)$ のなす角を求めよ。', '(2)　$(3,\\ -1,\\ 2)$ と $(x,\\ 4,\\ -1)$ が垂直になる $x$ を求めよ。',
        '(3)　$(1,\\ 1,\\ 0)$ と $(0,\\ 1,\\ 2)$ の両方に垂直で、大きさが 6 のベクトルを求めよ。', '(4)　A$(1,\\ 2,\\ 0)$、B$(2,\\ 3,\\ 2)$、C$(0,\\ 4,\\ 1)$ のとき、△ABC の面積を求めよ。',
        '(5)　$\\vec{a}=(1,\\ 2,\\ 3),\\ \\vec{b}=(1,\\ 0,\\ -1)$ のとき、$|\\vec{a}+t\\vec{b}|$ の最小値を求めよ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: 'めあて', say: '前の時間は、空間のベクトルの成分でした。この時間は **内積** です。平面の内積と同じ定義で、成分が1つふえるだけ。なす角・垂直・面積に使います。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '空間のベクトルの **内積** を成分で計算し、なす角・垂直を調べられる\n2つのベクトルの **両方に垂直** なベクトルや、三角形の面積を求められる' }] },

      // ---------- 内積 ----------
      { clear: true, part: '空間ベクトルの内積', say: '空間でも内積は $\\vec{a}\\cdot\\vec{b}=|\\vec{a}||\\vec{b}|\\cos\\theta$。成分では $a_1b_1+a_2b_2+a_3b_3$ です。$\\vec{a}\\cdot\\vec{a}=|\\vec{a}|^2$ などの性質も同じです。',
        add: [{ t: 'h', text: '空間ベクトルの内積' },
          { t: 'box', c: 'y', label: '内積', tex: '\\begin{aligned}\\vec{a}\\cdot\\vec{b}&=|\\vec{a}||\\vec{b}|\\cos\\theta\\\\ &=a_1b_1+a_2b_2+a_3b_3\\end{aligned}' },
          { t: 'm', size: 'sm', tex: '\\cos\\theta=\\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}||\\vec{b}|}' },
          cubeFig()] },
      { say: '一辺 2 の立方体で $\\overrightarrow{\\mathrm{OP}}=(2,\\ 2,\\ 0)$、$\\overrightarrow{\\mathrm{OQ}}=(0,\\ 2,\\ 2)$。内積は $0+4+0=4$、大きさはどちらも $2\\sqrt2$。$\\cos\\theta=\\frac{4}{8}=\\frac12$ で $60^\\circ$。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\angle\\mathrm{POQ}=\\frac{4}{2\\sqrt2\\cdot2\\sqrt2}=\\frac12,\\quad \\angle\\mathrm{POQ}=60^\\circ' },
          { t: 'p', size: 'sm', text: '3つの面の対角線 OP, OQ, PQ はどれも $2\\sqrt2$。\n△OPQ は正三角形なので、図形からも $60^\\circ$' }] },
      { ask: { type: 'choice', q: '$\\vec{a}=(1,\\ 1,\\ 0),\\ \\vec{b}=(-1,\\ 0,\\ 1)$ のなす角 $\\theta$ は？',
        opts: ['$60^\\circ$', '$90^\\circ$', '$120^\\circ$', '$135^\\circ$'], ok: 2,
        why: { 0: '$\\vec{a}\\cdot\\vec{b}=-1$ は負なので、鈍角です。', 1: '内積は $-1+0+0=-1$ で、0 ではありません。', 3: '$\\cos\\theta=\\frac{-1}{\\sqrt2\\cdot\\sqrt2}=-\\frac12$。$-\\frac{1}{\\sqrt2}$ ではありません。' },
        good: '$\\cos\\theta=\\frac{-1}{\\sqrt2\\sqrt2}=-\\frac12$ なので $120^\\circ$。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\theta=\\frac{-1+0+0}{\\sqrt2\\cdot\\sqrt2}=-\\frac12,\\quad \\theta=120^\\circ' }] } },

      // ---------- 垂直 ----------
      { clear: true, cols: [1], part: '垂直条件', say: '垂直の条件も平面と同じです。$\\vec{a}\\perp\\vec{b}\\iff\\vec{a}\\cdot\\vec{b}=0$。成分では $a_1b_1+a_2b_2+a_3b_3=0$ です。',
        add: [{ t: 'h', text: '垂直条件' },
          { t: 'box', c: 'p', label: '垂直条件', tex: '\\vec{a}\\perp\\vec{b}\\iff \\vec{a}\\cdot\\vec{b}=0\\iff a_1b_1+a_2b_2+a_3b_3=0' },
          { t: 'p', size: 'sm', text: '（$\\vec{a}\\neq\\vec{0},\\ \\vec{b}\\neq\\vec{0}$ のとき）' }] },
      { ask: { type: 'choice', q: '$\\vec{a}=(3,\\ -1,\\ 2)$ と $\\vec{b}=(x,\\ 4,\\ -1)$ が垂直になる $x$ は？',
        opts: ['$-\\dfrac23$', '$2$', '$\\dfrac23$', '$-2$'], ok: 1,
        why: { 0: '$(-1)\\cdot4=-4$ です。$+4$ にしています。', 2: '$2\\cdot(-1)=-2$ です。$+2$ にしています。', 3: '$3x-6=0$ から $x=2$。移項の符号に注意。' },
        good: '$3x+(-1)\\cdot4+2\\cdot(-1)=3x-6=0$ より $x=2$。',
        add: [{ t: 'm', tex: '\\vec{a}\\cdot\\vec{b}=3x-4-2=0\\quad\\therefore\\ x=2' }] } },

      // ---------- 両方に垂直なベクトル ----------
      { clear: true, part: '両方に垂直なベクトル', say: '$\\vec{a}=(1,\\ 1,\\ 0),\\ \\vec{b}=(0,\\ 1,\\ 2)$ の **両方に垂直** なベクトル $\\vec{p}=(x,\\ y,\\ z)$ を求めます。内積 $=0$ の式が2つできます。',
        add: [{ t: 'h', text: '両方に垂直なベクトル' },
          { t: 'm', tex: '\\begin{cases}\\vec{p}\\cdot\\vec{a}=x+y=0\\\\ \\vec{p}\\cdot\\vec{b}=y+2z=0\\end{cases}' },
          { t: 'p', size: 'sm', text: '$\\vec{a},\\ \\vec{b}$ がつくる平面（緑）に垂直な向き' },
          perpFig()] },
      { say: '$y=-x$、$z=-\\frac{y}{2}=\\frac{x}{2}$ なので $\\vec{p}=\\left(x,\\ -x,\\ \\frac{x}{2}\\right)$。$x=2$ とすると $(2,\\ -2,\\ 1)$ で、大きさは $\\sqrt{4+4+1}=3$ です。',
        add: [{ t: 'm', tex: '\\vec{p}=\\left(x,\\ -x,\\ \\frac{x}{2}\\right)=\\frac{x}{2}(2,\\ -2,\\ 1)' },
          { t: 'm', size: 'sm', tex: '|(2,\\ -2,\\ 1)|=\\sqrt{4+4+1}=3' }],
        draw: [{ fig: 'pp', items: [ar(P(o3), P(vp), 'p', 4), vl(P(vp), 'p', 'p', 4, -24), rt3(o3, vp, va, 0.35, 'p'), rt3(o3, vp, vb, 0.35, 'p')] }] },
      { ask: { type: 'choice', q: '$\\vec{a},\\ \\vec{b}$ の両方に垂直で、大きさが 6 のベクトルは？',
        opts: ['$(4,\\ -4,\\ 2)$', '$\\pm(2,\\ -2,\\ 1)$', '$\\pm(4,\\ 4,\\ 2)$', '$\\pm(4,\\ -4,\\ 2)$'], ok: 3,
        why: { 0: '反対向きの $(-4,\\ 4,\\ -2)$ も、両方に垂直で大きさ 6 です。', 1: 'それは大きさ 3。2倍して 6 にします。', 2: '$y=-x$ なので、$x$ と $y$ は符号が反対です。' },
        good: '$(2,\\ -2,\\ 1)$ の大きさは 3 なので、2倍して $\\pm(4,\\ -4,\\ 2)$。',
        add: [{ t: 'ans', size: 'sm', label: '答', tex: '\\pm(4,\\ -4,\\ 2)' }] } },

      // ---------- 三角形の面積 ----------
      { clear: true, part: '三角形の面積', say: '3点 A$(1,\\ 2,\\ 0)$、B$(2,\\ 3,\\ 2)$、C$(0,\\ 4,\\ 1)$ でできる △ABC の面積。平面のときと同じ公式が使えます。',
        add: [{ t: 'h', text: '空間の三角形の面積' },
          { t: 'box', c: 'y', label: '面積', tex: 'S=\\frac12\\sqrt{|\\overrightarrow{\\mathrm{AB}}|^2|\\overrightarrow{\\mathrm{AC}}|^2-(\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}})^2}' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(1,\\ 1,\\ 2),\\quad \\overrightarrow{\\mathrm{AC}}=(-1,\\ 2,\\ 1)' },
          triFig()] },
      { say: '$|\\overrightarrow{\\mathrm{AB}}|^2=6$、$|\\overrightarrow{\\mathrm{AC}}|^2=6$、$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=-1+2+2=3$。これを公式に入れます。',
        add: [{ t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|^2=6,\\quad |\\overrightarrow{\\mathrm{AC}}|^2=6,\\quad \\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=3' }] },
      { ask: { type: 'choice', q: '△ABC の面積は？',
        opts: ['$\\dfrac{3\\sqrt3}{2}$', '$3\\sqrt3$', '$\\dfrac{\\sqrt{33}}{2}$', '$\\dfrac{3\\sqrt5}{2}$'], ok: 0,
        why: { 1: '$\\frac12$ をかけ忘れています。', 2: '$(\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}})^2=9$ です。2乗を忘れています。', 3: '根号の中は「ひく」です。$36+9$ ではなく $36-9$。' },
        good: '$\\frac12\\sqrt{6\\cdot6-3^2}=\\frac12\\sqrt{27}=\\frac{3\\sqrt3}{2}$。',
        add: [{ t: 'ans', size: 'sm', label: '答', tex: 'S=\\frac12\\sqrt{36-9}=\\frac{3\\sqrt3}{2}' },
          { t: 'p', size: 'sm', text: '確かめ：$\\cos\\angle\\mathrm{BAC}=\\frac36=\\frac12$ より $60^\\circ$\n$\\frac12\\cdot\\sqrt6\\cdot\\sqrt6\\cdot\\sin60^\\circ=\\frac{3\\sqrt3}{2}$ と一致' }] } },

      // ---------- 大きさの最小 ----------
      { clear: true, cols: [1], part: '大きさの最小', say: '最後に、数学Ⅰの2次関数と組み合わせます。$\\vec{a}=(1,\\ 2,\\ 3),\\ \\vec{b}=(1,\\ 0,\\ -1)$ で、$t$ を動かしたときの $|\\vec{a}+t\\vec{b}|$ の最小値を考えます。',
        add: [{ t: 'h', text: '大きさの最小' },
          { t: 'm', tex: '\\vec{a}+t\\vec{b}=(1+t,\\ 2,\\ 3-t)' },
          { t: 'p', size: 'sm', text: '大きさは2乗して考える：$|\\vec{a}+t\\vec{b}|^2$ は $t$ の2次式' }] },
      { ask: { type: 'think', q: '$t$ が実数全体を動くとき、$|\\vec{a}+t\\vec{b}|$ の最小値と、そのときの $t$ を求めよう。',
        hint: '$(1+t)^2+2^2+(3-t)^2$ を展開して、平方完成する。',
        ans: '$|\\vec{a}+t\\vec{b}|^2=2t^2-4t+14=2(t-1)^2+12$。$t=1$ のとき最小値 $\\sqrt{12}=2\\sqrt3$',
        after: 'このとき $\\vec{a}+\\vec{b}=(2,\\ 2,\\ 2)$ と $\\vec{b}$ の内積は $2+0-2=0$。最小になるのは $\\vec{b}$ と垂直なときです。',
        add: [{ t: 'm', tex: '|\\vec{a}+t\\vec{b}|^2=(1+t)^2+4+(3-t)^2=2(t-1)^2+12' },
          { t: 'ans', size: 'sm', label: '答', text: '$t=1$ のとき　最小値 $2\\sqrt3$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、空間の **位置ベクトル** と図形。4点が同じ平面上にある条件や、直線と平面の交点を考えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
