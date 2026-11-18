/* 数学C 第2章 平面上の曲線と複素数平面 複素数平面 ④：複素数と図形
   例はすべて自作。答え・誤答の値は python3（sympy）で検算ずみ。
   α=−1+4i, β=5+i を 2:1 に内分 → 3+2i（逆：1+3i、中点：2+5/2 i、3 でわり忘れ：9+6i）
   β=4+3i を α=1+2i のまわりに π/2 回転 → γ=α+i(β−α)=5i（iβ=−3+4i、α をたし忘れ −1+3i、−π/2 なら 2−i）
   α=1+i, β=3+2i, γ=2+4i：(γ−α)/(β−α)=(1+3i)/(2+i)=1+i → ∠BAC=π/4、AC=√2 AB
   γ=x+5i：(γ−α)/(β−α)={(2x+2)+(9−x)i}/5 → 垂直 x=−1、一直線上 x=9／A(1), B(3) の正三角形 → C=2±√3 i */
(function () {
  const POINTS = [
    '2点 A$(\\alpha)$, B$(\\beta)$ を結ぶ線分を $m:n$ に内分する点は $\\dfrac{n\\alpha+m\\beta}{m+n}$（位置ベクトルと同じ形）。三角形の重心は $\\dfrac{\\alpha+\\beta+\\gamma}{3}$',
    '点 $\\beta$ を点 $\\alpha$ のまわりに $\\theta$ 回転した点 $\\gamma$ は　$\\gamma-\\alpha=(\\cos\\theta+i\\sin\\theta)(\\beta-\\alpha)$（$\\alpha$ を原点に移して回し、もどす）',
    '$\\angle\\mathrm{BAC}$ は $\\arg\\dfrac{\\gamma-\\alpha}{\\beta-\\alpha}$。$\\dfrac{\\gamma-\\alpha}{\\beta-\\alpha}$ が **実数** ⇔ 3点が一直線上、**純虚数** ⇔ $\\mathrm{AB}\\perp\\mathrm{AC}$'
  ];
  const IM = n => Array.isArray(n) ? n : [n, (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'i'];
  const plane = (tx, ty, o) => Object.assign({ k: 'axes', tx, ty: ty.map(IM), xl: '実軸', yl: '虚軸', grid: true }, o || {});
  const A3 = [1, 1], B3 = [3, 2], C3 = [2, 4];

  HB.lesson({
    id: 'mc2-04', field: '数学C　平面上の曲線と複素数平面', title: '複素数と図形', level: '複素数平面', time: '目安 8分', noDec: true,
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　$\\alpha=-1+4i,\\ \\beta=5+i$ のとき、線分 AB を $2:1$ に内分する点', '(2)　点 $\\beta=4+3i$ を点 $\\alpha=1+2i$ のまわりに $\\dfrac{\\pi}{2}$ 回転した点',
        '(3)　$\\alpha=1+i,\\ \\beta=3+2i,\\ \\gamma=2+4i$ のとき、$\\angle\\mathrm{BAC}$ の大きさ', '(4)　$\\gamma=x+5i$ とするとき、AB⊥AC となる $x$、3点が一直線上となる $x$',
        '(5)　A$(1)$, B$(3)$ に対して、$\\triangle\\mathrm{ABC}$ が正三角形になる点 C'] },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: 'めあて', say: 'ここまでで、和と差はベクトルと同じ図、積は回転と拡大になることを学びました。この時間は、それを使って **図形** を複素数で調べます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '複素数で、**分点**・点のまわりの **回転**・**角の大きさ** を表せる\n3点が一直線上・垂直になる条件を使える' }] },

      // ---------- 分点 ----------
      { clear: true, part: '内分点', say: '点 A$(\\alpha)$、B$(\\beta)$ を結ぶ線分の内分点は、第1章の位置ベクトルの分点の公式と同じ形です。$\\alpha=-1+4i,\\ \\beta=5+i$ で考えます。',
        add: [{ t: 'h', text: '線分の内分点・外分点' },
          { t: 'tbl', size: 'sm', rows: [['$m:n$ に内分する点', '$\\dfrac{n\\alpha+m\\beta}{m+n}$'], ['$m:n$ に外分する点', '$\\dfrac{-n\\alpha+m\\beta}{m-n}$'], ['中点', '$\\dfrac{\\alpha+\\beta}{2}$']] },
          { t: 'fig', id: 's1', col: 1, view: [-2.0, -0.8, 6.0, 5.0], w: 620, h: 450, items: [plane([-1, 1, 2, 3, 4, 5], [1, 2, 3, 4]),
            { k: 'seg', a: [-1, 4], b: [5, 1], c: 'w' },
            { k: 'pt', at: [-1, 4], name: 'A(−1+4i)', dir: 'n', c: 'b' }, { k: 'pt', at: [5, 1], name: 'B(5+i)', dir: 'n', c: 'g' }] }] },
      { ask: { type: 'choice', q: '線分 AB を $2:1$ に内分する点 P が表す複素数は？',
        opts: ['$1+3i$', '$2+\\dfrac52i$', '$3+2i$', '$9+6i$'], ok: 2,
        why: { 0: '係数が逆です。$2:1$ なら $\\dfrac{1\\cdot\\alpha+2\\beta}{3}$ で、B に近い点になります。', 1: 'それは中点（$1:1$ に内分する点）です。', 3: '$m+n=3$ でわるのを忘れています。' },
        good: '$\\dfrac{\\alpha+2\\beta}{3}=\\dfrac{9+6i}{3}=3+2i$。図でも、AB を $2:1$ に分ける点です。',
        add: [{ t: 'm', tex: '\\frac{1\\cdot(-1+4i)+2(5+i)}{2+1}=\\frac{9+6i}{3}=\\ans{3+2i}' }],
        draw: [{ fig: 's1', items: [{ k: 'pt', at: [3, 2], name: 'P', dir: 'sw', c: 'y' },
          { k: 'label', at: [1, 3], text: '2', c: 'y', dx: 14, dy: 16 }, { k: 'label', at: [4, 1.5], text: '1', c: 'y', dx: 14, dy: 16 }] }] } },
      { say: '3点 A$(\\alpha)$、B$(\\beta)$、C$(\\gamma)$ を頂点とする三角形の重心も、位置ベクトルと同じく $\\dfrac{\\alpha+\\beta+\\gamma}{3}$ です。',
        add: [{ t: 'm', tex: '\\text{重心}\\quad \\frac{\\alpha+\\beta+\\gamma}{3}' }] },

      // ---------- 回転 ----------
      { clear: true, part: '点のまわりの回転', say: '点 $\\beta$ を、原点ではなく **点 $\\alpha$ のまわり** に回転します。$\\alpha$ が原点に来るように全体を平行移動し、回してから、もとにもどします。',
        add: [{ t: 'h', text: '点 $\\alpha$ のまわりの回転' },
          { t: 'p', size: 'sm', text: '① $\\alpha$ を原点に移す　→　$\\beta-\\alpha$\n② 原点のまわりに $\\theta$ 回転　→　$(\\cos\\theta+i\\sin\\theta)(\\beta-\\alpha)$\n③ $\\alpha$ だけもどす　→　$+\\alpha$' },
          { t: 'box', c: 'y', label: '回転', text: '$\\gamma-\\alpha=(\\cos\\theta+i\\sin\\theta)(\\beta-\\alpha)$' },
          { t: 'fig', id: 's2', col: 1, view: [-1.6, -0.7, 5.2, 5.8], w: 520, h: 497, items: [plane([1, 2, 3, 4], [1, 2, 3, 4, 5]),
            { k: 'seg', a: [1, 2], b: [4, 3], c: 'b' },
            { k: 'pt', at: [1, 2], name: 'α', dir: 'sw', c: 'w' }, { k: 'pt', at: [4, 3], name: 'β', dir: 'e', c: 'b' }] }] },
      { say: '$\\alpha=1+2i$ のまわりに、$\\beta=4+3i$ を $\\dfrac{\\pi}{2}$ 回転します。まず $\\beta-\\alpha=3+i$。これは $\\alpha$ から $\\beta$ への矢印を、原点から引き直したものです。',
        add: [{ t: 'm', tex: '\\beta-\\alpha=(4+3i)-(1+2i)=3+i' }],
        draw: [{ fig: 's2', items: [{ k: 'vec', a: [0, 0], b: [3, 1], c: 'p', dash: true }, { k: 'pt', at: [3, 1], name: 'β−α', dir: 'se', c: 'p' }] }] },
      { ask: { type: 'choice', q: '点 $\\beta=4+3i$ を点 $\\alpha=1+2i$ のまわりに $\\dfrac{\\pi}{2}$ 回転した点 $\\gamma$ は？',
        opts: ['$5i$', '$-1+3i$', '$-3+4i$', '$2-i$'], ok: 0,
        why: { 1: 'それは $i(\\beta-\\alpha)$。最後に $\\alpha$ をたして、もとの位置にもどします。', 2: 'それは $i\\beta$。原点のまわりに回転しています。', 3: 'それは $-i$ をかけた、$-\\dfrac{\\pi}{2}$ 回転の点です。' },
        good: '$\\gamma=\\alpha+i(\\beta-\\alpha)=(1+2i)+(-1+3i)=5i$。',
        add: [{ t: 'm', tex: '\\gamma=\\alpha+i(\\beta-\\alpha)=(1+2i)+(-1+3i)=\\ans{5i}' }],
        draw: [{ fig: 's2', items: [
          { k: 'vec', a: [0, 0], b: [-1, 3], c: 'g', dash: true }, { k: 'pt', at: [-1, 3], name: 'i(β−α)', dir: 'nw', c: 'g' },
          { k: 'seg', a: [1, 2], b: [0, 5], c: 'y' }, { k: 'right', o: [1, 2], a: [4, 3], b: [0, 5], s: 16 },
          { k: 'pt', at: [0, 5], name: 'γ=5i', dir: 'ne', c: 'y' }] }] } },

      // ---------- 角 ----------
      { clear: true, part: '角の大きさ', say: '3点 A$(\\alpha)$、B$(\\beta)$、C$(\\gamma)$ で、AB の向きは $\\beta-\\alpha$、AC の向きは $\\gamma-\\alpha$。商の偏角は「偏角の差」なので、$\\angle\\mathrm{BAC}$ が求まります。',
        add: [{ t: 'h', text: '角の大きさ' },
          { t: 'm', tex: '\\arg\\frac{\\gamma-\\alpha}{\\beta-\\alpha}', note: '半直線 AB から AC へ回る角\n（その大きさが $\\angle\\mathrm{BAC}$）' },
          { t: 'p', size: 'sm', text: '例：$\\alpha=1+i,\\ \\beta=3+2i,\\ \\gamma=2+4i$' },
          { t: 'fig', id: 's3', col: 1, view: [-0.6, -0.6, 4.2, 4.8], w: 450, h: 506, items: [plane([1, 2, 3], [1, 2, 3, 4]),
            { k: 'poly', pts: [A3, B3, C3], close: true, c: 'w', fill: 'y', alpha: 0.1 },
            { k: 'pt', at: A3, name: 'A(α)', dir: 'sw', c: 'w' }, { k: 'pt', at: B3, name: 'B(β)', dir: 'e', c: 'b' }, { k: 'pt', at: C3, name: 'C(γ)', dir: 'ne', c: 'p' }] }] },
      { ask: { type: 'choice', q: '$\\dfrac{\\gamma-\\alpha}{\\beta-\\alpha}=\\dfrac{1+3i}{2+i}$ を計算すると？',
        opts: ['$\\dfrac{-1+7i}{5}$', '$1+i$', '$\\dfrac{1-i}{2}$', '$\\dfrac{-1+5i}{5}$'], ok: 1,
        why: { 0: '分母と同じ $2+i$ をかけています。かけるのは共役な $2-i$ です。', 2: '分子と分母が逆。$\\gamma-\\alpha$ を $\\beta-\\alpha$ でわります。', 3: '$-3i^2$ を $-3$ にしています。$i^2=-1$ なので $+3$。' },
        good: '$\\dfrac{(1+3i)(2-i)}{(2+i)(2-i)}=\\dfrac{5+5i}{5}=1+i$。',
        add: [{ t: 'm', tex: '\\frac{\\gamma-\\alpha}{\\beta-\\alpha}=\\frac{(1+3i)(2-i)}{5}=1+i' }] } },
      { say: '$1+i=\\sqrt2\\left(\\cos\\dfrac{\\pi}{4}+i\\sin\\dfrac{\\pi}{4}\\right)$。偏角から $\\angle\\mathrm{BAC}=\\dfrac{\\pi}{4}$。絶対値から、AC は AB の $\\sqrt2$ 倍とわかります。',
        add: [{ t: 'm', tex: '1+i=\\sqrt2\\left(\\cos\\frac{\\pi}{4}+i\\sin\\frac{\\pi}{4}\\right)' },
          { t: 'ans', label: '答', tex: '\\angle\\mathrm{BAC}=\\frac{\\pi}{4},\\quad \\mathrm{AC}=\\sqrt2\\,\\mathrm{AB}' }],
        draw: [{ fig: 's3', items: [{ k: 'angle', o: A3, a: B3, b: C3, rp: 40, c: 'g', label: 'π/4', lr: 22, size: 21 }] }] },

      // ---------- 一直線上・垂直 ----------
      { clear: true, cols: [0.5, 0.5], part: '一直線上・垂直', say: '偏角が $0$ か $\\pi$ なら3点は一直線上、$\\pm\\dfrac{\\pi}{2}$ なら AB と AC は垂直です。つまり、商が **実数** か **純虚数** かで判断できます。',
        add: [{ t: 'h', text: '一直線上・垂直の条件' },
          { t: 'tbl', size: 'sm', rows: [['$\\dfrac{\\gamma-\\alpha}{\\beta-\\alpha}$ が', '3点 A, B, C は'], ['**実数**', '一直線上'], ['**純虚数**', 'AB ⊥ AC']] },
          { t: 'p', size: 'sm', text: '例：$\\alpha=1+i,\\ \\beta=3+2i,\\ \\gamma=x+5i$（$x$ は実数）' },
          { t: 'fig', id: 's4', col: 1, view: [-2.2, -0.7, 10.2, 6.2], w: 680, h: 378, items: [plane([-1, 1, 3, 5, 7, 9], [1, 3, 5]),
            { k: 'line', p1: A3, p2: B3, c: 'd', dash: true },
            { k: 'line', m: 0, n: 5, c: 'p', dash: true, label: 'γ は この直線の上', lat: [3.3, 5.45], size: 20 },
            { k: 'pt', at: A3, name: 'A', dir: 'nw', c: 'w' }, { k: 'pt', at: B3, name: 'B', dir: 'se', c: 'b' }] }] },
      { say: '分母の共役 $2-i$ をかけて、実部と虚部に分けます。$-4i^2=+4$ に注意です。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\frac{\\gamma-\\alpha}{\\beta-\\alpha}=\\frac{(x-1)+4i}{2+i}=\\frac{(2x+2)+(9-x)i}{5}' }] },
      { ask: { type: 'choice', q: 'AB ⊥ AC となる実数 $x$ は？',
        opts: ['$9$', '$1$', '$-1$ と $9$', '$-1$'], ok: 3,
        why: { 0: '$x=9$ は虚部が 0、つまり実数になるとき。それは一直線上の条件です。', 1: '展開で $-4i^2=+4$ を落としています。実部は $2x+2$。', 2: '$x=9$ のときは実数になり、垂直ではなく一直線上です。' },
        good: '純虚数 ⇔ 実部 $=0$、虚部 $\\ne0$。$2x+2=0$ より $x=-1$（虚部は $10\\ne0$）。',
        add: [{ t: 'm', size: 'sm', tex: '2x+2=0,\\ \\ 9-x\\ne0\\quad\\therefore\\ x=\\ans{-1}' }],
        draw: [{ fig: 's4', items: [{ k: 'seg', a: A3, b: [-1, 5], c: 'y' }, { k: 'right', o: A3, a: B3, b: [-1, 5], s: 14 },
          { k: 'pt', at: [-1, 5], name: 'C(−1+5i)', dir: 'ne', c: 'y' }] }] } },
      { say: '一方、3点が一直線上になるのは、虚部が 0 のとき。$9-x=0$ より $x=9$。点 $9+5i$ は直線 AB の上にあります。',
        add: [{ t: 'm', size: 'sm', tex: '9-x=0\\quad\\therefore\\ x=9', note: '一直線上' }],
        draw: [{ fig: 's4', items: [{ k: 'pt', at: [9, 5], name: '9+5i', dir: 'nw', c: 'g' }] }] },
      { ask: { type: 'think', q: 'A$(1)$、B$(3)$ とする。$\\triangle\\mathrm{ABC}$ が正三角形になるような点 C を表す複素数を求めよう。',
        hint: 'C は、B を A のまわりに $\\pm\\dfrac{\\pi}{3}$ 回転した点。$\\gamma=1+\\left\\{\\cos\\left(\\pm\\dfrac{\\pi}{3}\\right)+i\\sin\\left(\\pm\\dfrac{\\pi}{3}\\right)\\right\\}(3-1)$。',
        ans: '$\\gamma=1+\\left(\\dfrac12\\pm\\dfrac{\\sqrt3}{2}i\\right)\\cdot2=2\\pm\\sqrt3\\,i$',
        after: '回転の向きが2通りあるので、C も2つ。正三角形の条件は「$\\dfrac{\\gamma-\\alpha}{\\beta-\\alpha}=\\cos\\left(\\pm\\dfrac{\\pi}{3}\\right)+i\\sin\\left(\\pm\\dfrac{\\pi}{3}\\right)$」と書けます。',
        add: [{ t: 'm', size: 'sm', tex: '\\gamma=2\\pm\\sqrt3\\,i', note: '正三角形' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数平面はここまでです。次の時間からは、放物線・楕円・双曲線などの **2次曲線** を学びます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
