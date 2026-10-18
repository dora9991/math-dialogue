/* 早稲田型 数学（理工）：2024年度 早稲田大学 理工3学部 第1問の類題（自作問題・元の問題ではない）
   問題：円 C：中心 A(−1,1)、半径 √2（O と B(0,2) を通る）。C 上の点 T（x>0, y>1）での接線 ℓ が x 軸・y 軸の正の部分と P・Q で交わる。
         △OPQ のうち C の外部の 2 つの部分：S1（C・ℓ・x 軸）、S2（C・ℓ・y 軸）。S1+S2 が最小のときの S1−S2。
   答え（python3・sympy で検算ずみ。面積は短冊 20 万本の数値積分でも一致）：
     T = A + √2(cosθ, sinθ)（0<θ<π/4）、ℓ：x cosθ + y sinθ = d、d = √2 + sinθ − cosθ
     S1+S2 = △OPQ − (π/2 − 1)（弓形 OB は中心角 π/2）
     △OPQ = d²/(2 sinθ cosθ) = (u+√2)²/(1−u²)（u = sinθ − cosθ、−1<u<0）、f'(u) = 2(u+√2)(√2u+1)/(1−u²)²
     最小は u = −1/√2（θ = π/12）で △OPQ = 1、S1+S2 の最小値 2 − π/2
     このとき T((√3−1)/2, (√3+1)/2)、P(√3−1, 0)、Q(0, √3+1)（T は PQ の中点）。∠OAT = π/3、∠TAB = π/6
     S1 = 1/2 − (π/3 − √3/2) = (1+√3)/2 − π/3 ≒ 0.3188、S2 = (1 − √3/2) − (π/6 − 1/2) = (3−√3)/2 − π/6 ≒ 0.1104
     S1 − S2 = √3 − 1 − π/6 ≒ 0.2085 */
(function () {
  const R2 = Math.SQRT2, PI = Math.PI, A = [-1, 1], B = [0, 2], O = [0, 0], TH = 0.35, TM = PI / 12;
  const onC = ph => [-1 + R2 * Math.cos(ph), 1 + R2 * Math.sin(ph)];
  const arc = (p1, p2, n) => { const a = []; n = n || 48; for (let i = 0; i <= n; i++) a.push(onC(p1 + (p2 - p1) * i / n)); return a; };
  const conf = th => { const d = R2 + Math.sin(th) - Math.cos(th); return { T: onC(th), P: [d / Math.cos(th), 0], Q: [0, d / Math.sin(th)] }; };
  const ext = (U, W, s) => [U[0] + (U[0] - W[0]) * s, U[1] + (U[1] - W[1]) * s];
  const VIEW = [-2.5, -0.55, 1.3, 3.05];   // 3.8 × 3.6
  // o.S：S1・S2 をぬる　o.F：弓形（円の x≧0 の部分）をぬる　o.th：角θの印　o.lab：S1・S2 の文字
  const fig = (id, th, o, h) => {
    o = o || {}; const c = conf(th), H = h || 450, items = [{ k: 'axes', tx: [], ty: [], xl: 'x', yl: 'y' }];
    if (o.F) items.push({ k: 'poly', pts: [O, B].concat(arc(PI / 4, -PI / 4)), close: true, fill: 'g', alpha: 0.4, noStroke: true });
    if (o.S !== false) items.push(
      { k: 'poly', pts: [O, c.P, c.T].concat(arc(th, -PI / 4)), close: true, fill: 'y', alpha: 0.42, noStroke: true },
      { k: 'poly', pts: [c.Q, B].concat(arc(PI / 4, th)), close: true, fill: 'b', alpha: 0.5, noStroke: true });
    items.push({ k: 'circle', o: A, r: R2, c: 'w', wd: 2.5 },
      { k: 'seg', a: ext(c.Q, c.P, 0.1), b: ext(c.P, c.Q, 0.09), c: 'p', wd: 3 },
      { k: 'label', at: [c.P[0] + 0.3 * (c.T[0] - c.P[0]), 0.3 * c.T[1]], text: 'ℓ', c: 'p', dx: 20, size: 26 },
      { k: 'pt', at: A, name: 'A', dir: 's', r: 4, c: 'd' }, { k: 'pt', at: B, name: 'B', dir: 'w', r: 5 },
      { k: 'pt', at: c.T, name: 'T', dir: 'ne', c: 'p', r: 5 },
      { k: 'pt', at: c.P, name: 'P', dir: 'se', r: 5 }, { k: 'pt', at: c.Q, name: 'Q', dir: 'w', r: 5 },
      { k: 'label', at: [-1.95, 2.55], text: 'C', size: 26 });
    if (o.lab !== false) items.push({ k: 'label', at: [c.P[0] * 0.62, 0.24], text: 'S₁', c: 'y', size: 24 },
      { k: 'label', at: [0.5, c.Q[1] - 0.12], text: 'S₂', c: 'b', size: 24 }, { k: 'seg', a: [0.38, c.Q[1] - 0.17], b: [0.07, (B[1] + c.Q[1]) / 2 - 0.08], c: 'b', wd: 1.5 });
    if (o.th) items.push({ k: 'seg', a: A, b: [0.8, 1], c: 'd', wd: 2, dash: true }, { k: 'seg', a: A, b: c.T, c: 'g', wd: 2.5 },
      { k: 'angle', o: A, a: [0.5, 1], b: c.T, rp: 58, label: 'θ', lr: 16, c: 'g' });
    if (o.extra) items.push.apply(items, o.extra);
    return { t: 'fig', id, col: 1, view: VIEW, w: Math.round(H * 3.8 / 3.6), h: H, items };
  };
  const cm = conf(TM);
  const ANG = [{ k: 'seg', a: A, b: O, c: 'g', wd: 2 }, { k: 'seg', a: A, b: cm.T, c: 'g', wd: 2 }, { k: 'seg', a: A, b: B, c: 'g', wd: 2 },
    { k: 'seg', a: O, b: cm.T, c: 'y', wd: 2, dash: true }, { k: 'seg', a: B, b: cm.T, c: 'b', wd: 2, dash: true },
    { k: 'angle', o: A, a: O, b: cm.T, rp: 46, label: 'π/3', lr: 20, c: 'g', size: 20 }, { k: 'angle', o: A, a: cm.T, b: B, rp: 84, label: 'π/6', lr: 16, c: 'g', size: 20 }];
  const POINTS = [
    '面積の和は「三角形 OPQ − 動かない部分」。動かない部分（弓形 $\\frac{\\pi}{2}-1$）を引くだけなので、**三角形の面積の最小** に読みかえられる',
    '接線は中心から見た角 $\\theta$ で $x\\cos\\theta+y\\sin\\theta=d$。$u=\\sin\\theta-\\cos\\theta$ とおくと $2\\sin\\theta\\cos\\theta=1-u^2$ で、1 文字の分数関数になる',
    '最小のとき T は PQ の中点。中心角 $\\frac{\\pi}{3}$、$\\frac{\\pi}{6}$ の弓形を使って、$S_1,\\ S_2$ を「三角形 − 弓形」で出す'
  ];

  HB.lesson({
    id: 'waseda24-1', field: '早稲田型　数学（理工）', title: '2024 早稲田 理工 第1問の類題 ― 原点を通る円の接線と、2つの部分の面積', level: '2024年度 早稲田大学 理工 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上に、点 $\\mathrm{A}(-1,\\ 1)$ を中心とし、原点 O と点 $\\mathrm{B}(0,\\ 2)$ を通る円 $C:\\ x^2+y^2+2x-2y=0$ がある。$C$ 上の点 T を、$x$ 座標が正で $y$ 座標が 1 より大きい範囲にとり、T における $C$ の接線を $\\ell$ とする。$\\ell$ は $x$ 軸の正の部分と点 P で、$y$ 軸の正の部分と点 Q で交わる。三角形 OPQ の内部のうち、円 $C$ の外部にある部分は 2 つに分かれる。$C$、$\\ell$、$x$ 軸で囲まれた部分の面積を $S_1$、$C$、$\\ell$、$y$ 軸で囲まれた部分の面積を $S_2$ とする。\nT を動かすとき、$S_1+S_2$ が最小となるような T について、$S_1-S_2$ の値を求めよ。',
      src: '※ 2024年度 早稲田大学 一般選抜 理工3学部 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.52, 0.48],
    steps: [
      { part: '問題', say: '円の接線と、2 つの部分の面積の問題です。小問の誘導がない「丸投げ型」なので、方針から自分で立てます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '円 $C$ は中心 A$(-1,\\ 1)$、半径 $\\sqrt2$ で、O と B を通ります。右の図の黄が $S_1$、青が $S_2$。T が動くと、2 つとも形が変わります。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'm', tex: 'C:\\ (x+1)^2+(y-1)^2=2', note: '中心 A$(-1,\\ 1)$\n半径 $\\sqrt2$' },
          { t: 'p', size: 'sm', text: 'T は弧 OB の上で、$y>1$ の部分を動く。\n$S_1,\\ S_2$ は別々に計算するとたいへん。まず **和** を考える。' },
          fig('f1', TH)] },
      { ask: { type: 'choice', q: '$S_1+S_2$ を三角形 OPQ の面積（$\\triangle\\mathrm{OPQ}$）で表すと？',
        opts: ['$\\triangle\\mathrm{OPQ}-\\dfrac{\\pi}{2}$', '$\\triangle\\mathrm{OPQ}-\\left(\\dfrac{\\pi}{2}-1\\right)$', '$\\triangle\\mathrm{OPQ}-\\dfrac{\\pi}{4}$', '$\\triangle\\mathrm{OPQ}-(\\pi-1)$'], ok: 1,
        why: { 0: '$\\frac{\\pi}{2}$ は扇形 AOB の面積。三角形の中にあるのは、そこから $\\triangle\\mathrm{AOB}$ を引いた弓形です。', 2: '半径を 1 として計算しています。半径は $\\sqrt2$ です。', 3: '三角形の中にあるのは、円の $x\\ge0$ の部分（弓形）だけ。半円ではありません。' },
        good: '$\\angle\\mathrm{OAB}=\\frac{\\pi}{2}$ なので、緑の弓形＝扇形 $\\frac{\\pi}{2}$ − $\\triangle\\mathrm{AOB}$ $1$。三角形からこれを引いた残りが $S_1+S_2$。',
        add: [{ t: 'm', tex: 'S_1+S_2=\\triangle\\mathrm{OPQ}-\\Big(\\frac{\\pi}{2}-1\\Big)' }],
        draw: [{ fig: 'f1', items: [{ k: 'poly', pts: [O, B].concat(arc(PI / 4, -PI / 4)), close: true, fill: 'g', alpha: 0.45, noStroke: true }, { k: 'seg', a: A, b: O, c: 'g', wd: 2, dash: true }, { k: 'seg', a: A, b: B, c: 'g', wd: 2, dash: true }] }] } },
      { say: 'かっこの中は T によらない一定の値です。だから $S_1+S_2$ の最小は、**三角形 OPQ の面積の最小** と同じこと。方針が立ちました。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '① 接線 $\\ell$ を 1 つの文字で表す\n② $\\triangle\\mathrm{OPQ}$ の面積を最小にする\n③ そのときの $S_1,\\ S_2$ を図形で求めて、差をとる' }] },

      // ---------- ① 接線 ----------
      { clear: true, part: '① 接線', say: 'T を、中心 A から見た角 $\\theta$ で表します。$\\overrightarrow{\\mathrm{AT}}=\\sqrt2(\\cos\\theta,\\ \\sin\\theta)$ です。',
        add: [{ t: 'h', text: '① 接線 ℓ を θ で表す' },
          { t: 'm', tex: '\\mathrm{T}(-1+\\sqrt2\\cos\\theta,\\ 1+\\sqrt2\\sin\\theta)' },
          fig('f2', TH, { th: true, lab: false })] },
      { ask: { type: 'choice', q: 'T が「$x>0$ かつ $y>1$」の部分にあるような $\\theta$ の範囲は？',
        opts: ['$-\\dfrac{\\pi}{4}<\\theta<\\dfrac{\\pi}{4}$', '$0<\\theta<\\dfrac{\\pi}{2}$', '$0<\\theta<\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{4}<\\theta<\\dfrac{\\pi}{2}$'], ok: 2,
        why: { 0: '$x>0$ だけの条件です。$\\theta\\le0$ だと $y\\le1$ で、$\\ell$ は $y$ 軸の正の部分と交わりません。', 1: '$\\theta\\ge\\frac{\\pi}{4}$ だと T の $x$ 座標が 0 以下です（B が $\\theta=\\frac{\\pi}{4}$）。', 3: 'そこは T の $x$ 座標が負の部分です。' },
        good: 'O が $\\theta=-\\frac{\\pi}{4}$、B が $\\theta=\\frac{\\pi}{4}$ の点。$x>0$ で $-\\frac{\\pi}{4}<\\theta<\\frac{\\pi}{4}$、$y>1$ で $\\theta>0$。',
        add: [{ t: 'm', tex: '0<\\theta<\\frac{\\pi}{4}' }] } },
      { say: '$\\ell$ は T を通り $\\overrightarrow{\\mathrm{AT}}$ に垂直。$(\\cos\\theta)(x+1)+(\\sin\\theta)(y-1)=\\sqrt2$ を整理し、右辺を $d$ とおきます。',
        add: [{ t: 'm', tex: '\\ell:\\ x\\cos\\theta+y\\sin\\theta=d', note: '$d=\\sqrt2+\\sin\\theta-\\cos\\theta$\n$(>0)$' },
          { t: 'm', tex: '\\mathrm{P}\\Big(\\frac{d}{\\cos\\theta},\\ 0\\Big),\\qquad \\mathrm{Q}\\Big(0,\\ \\frac{d}{\\sin\\theta}\\Big)' }] },

      // ---------- ② 面積の最小 ----------
      { clear: true, cols: [0.6, 0.4], part: '② 最小', say: '三角形 OPQ の面積を $S$ とします。$S=\\frac12\\cdot\\mathrm{OP}\\cdot\\mathrm{OQ}$ に代入すると、分母に $2\\sin\\theta\\cos\\theta$ が出てきます。',
        add: [{ t: 'h', text: '② △OPQ の面積 S の最小' },
          { t: 'm', tex: 'S=\\frac12\\cdot\\frac{d}{\\cos\\theta}\\cdot\\frac{d}{\\sin\\theta}=\\frac{(\\sqrt2+\\sin\\theta-\\cos\\theta)^2}{2\\sin\\theta\\cos\\theta}' }] },
      { ask: { type: 'choice', q: '$u=\\sin\\theta-\\cos\\theta$ とおくと、$2\\sin\\theta\\cos\\theta$ は？',
        opts: ['$u^2-1$', '$1+u^2$', '$1-u^2$', '$2u$'], ok: 2,
        why: { 0: '符号が逆です。$u^2=1-2\\sin\\theta\\cos\\theta$ を移項します。', 1: '$u^2=\\sin^2\\theta-2\\sin\\theta\\cos\\theta+\\cos^2\\theta$。真ん中の項はマイナスです。', 3: '$u$ を 2 乗して $\\sin^2\\theta+\\cos^2\\theta=1$ を使います。' },
        good: '$u^2=1-2\\sin\\theta\\cos\\theta$ なので $2\\sin\\theta\\cos\\theta=1-u^2$。分子も分母も $u$ だけの式になります。',
        add: [{ t: 'm', tex: 'S=f(u)=\\frac{(u+\\sqrt2)^2}{1-u^2}' }] } },
      { say: '$u$ の範囲も必ず確かめます。$u=\\sqrt2\\sin\\Big(\\theta-\\frac{\\pi}{4}\\Big)$ で、$-\\frac{\\pi}{4}<\\theta-\\frac{\\pi}{4}<0$ だから $-1<u<0$ です。',
        add: [{ t: 'm', tex: 'u=\\sqrt2\\sin\\Big(\\theta-\\frac{\\pi}{4}\\Big),\\qquad -1<u<0', note: 'θ と u は\n1 対 1' }] },
      { ask: { type: 'think', q: '$f(u)=\\dfrac{(u+\\sqrt2)^2}{1-u^2}$ を微分して、分子を因数分解しよう。',
        hint: '商の微分。分子は $2(u+\\sqrt2)(1-u^2)+2u(u+\\sqrt2)^2$。共通な $2(u+\\sqrt2)$ でくくる。',
        ans: "$f'(u)=\\dfrac{2(u+\\sqrt2)(\\sqrt2\\,u+1)}{(1-u^2)^2}$",
        after: 'くくった残りは $(1-u^2)+u(u+\\sqrt2)=1+\\sqrt2\\,u$。$u+\\sqrt2>0$ なので、符号は $\\sqrt2\\,u+1$ だけで決まります。',
        add: [{ t: 'm', tex: "f'(u)=\\frac{2(u+\\sqrt2)(\\sqrt2\\,u+1)}{(1-u^2)^2}" }] } },
      { ask: { type: 'choice', q: '$S$ が最小となる $u$ と、そのときの $\\theta$ は？',
        opts: ['$u=-\\frac{1}{\\sqrt2},\\ \\theta=\\frac{\\pi}{12}$', '$u=-\\frac12,\\ \\theta=\\frac{\\pi}{6}$', '$u=-\\frac{1}{\\sqrt2},\\ \\theta=\\frac{\\pi}{6}$', '$u=-\\sqrt2,\\ \\theta=0$'], ok: 0,
        why: { 1: '$\\sqrt2\\,u+1=0$ を解くと $u=-\\frac{1}{\\sqrt2}$ です。', 2: '$\\sin\\left(\\theta-\\frac{\\pi}{4}\\right)=-\\frac12$ より $\\theta-\\frac{\\pi}{4}=-\\frac{\\pi}{6}$。$\\theta=\\frac{\\pi}{12}$ です。', 3: '$u=-\\sqrt2$ は $u+\\sqrt2=0$ の解ですが、$-1<u<0$ の外です。' },
        good: '$u=-\\frac{1}{\\sqrt2}$ の前後で減少から増加へ。最小値は $f\\left(-\\frac{1}{\\sqrt2}\\right)=\\frac{1/2}{1/2}=1$。',
        add: [{ t: 'tbl', col: 1, rows: [['$u$', '$-1$', '$\\cdots$', '$-\\frac{1}{\\sqrt2}$', '$\\cdots$', '$0$'], ["$f'(u)$", '', '$-$', '$0$', '$+$', ''], ['$f(u)$', '', '↘', '$1$', '↗', '']] },
          { t: 'm', col: 1, size: 'sm', tex: 'S_{\\min}=1' }, { t: 'p', col: 1, size: 'sm', text: '$S_1+S_2$ の最小値は\n$1-\\left(\\frac{\\pi}{2}-1\\right)=2-\\frac{\\pi}{2}$' }] } },

      // ---------- ③ 最小のとき ----------
      { clear: true, part: '③ 最小のとき', say: '$\\theta=\\frac{\\pi}{12}$ のとき、$d=\\frac{\\sqrt2}{2}$。T・P・Q の座標を出すと、**T がちょうど PQ の中点** になっています。',
        add: [{ t: 'h', text: '③ 最小のときの図' },
          { t: 'm', size: 'sm', tex: '\\mathrm{T}\\Big(\\frac{\\sqrt3-1}{2},\\ \\frac{\\sqrt3+1}{2}\\Big)', note: 'PQ の中点' },
          { t: 'm', size: 'sm', tex: '\\mathrm{P}(\\sqrt3-1,\\ 0),\\qquad \\mathrm{Q}(0,\\ \\sqrt3+1)' },
          fig('f3', TM, {})] },
      { ask: { type: 'choice', q: '中心角 $\\angle\\mathrm{OAT}$ の大きさは？',
        opts: ['$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{6}$', '$\\dfrac{\\pi}{2}$'], ok: 1,
        why: { 0: '$\\frac{\\pi}{4}$ は、O の向き $-\\frac{\\pi}{4}$ から横の線までの角だけ。T の向き $\\frac{\\pi}{12}$ の分も足します。', 2: 'それは $\\angle\\mathrm{TAB}=\\frac{\\pi}{4}-\\frac{\\pi}{12}$ のほうです。', 3: '$\\frac{\\pi}{2}$ は $\\angle\\mathrm{OAB}$（O から B まで）。T はその途中にあります。' },
        good: 'AO の向きは $-\\frac{\\pi}{4}$、AT の向きは $\\frac{\\pi}{12}$。差は $\\frac{\\pi}{3}$ で、$\\triangle\\mathrm{AOT}$ は 1 辺 $\\sqrt2$ の正三角形。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{OAT}=\\frac{\\pi}{3},\\qquad \\angle\\mathrm{TAB}=\\frac{\\pi}{4}-\\frac{\\pi}{12}=\\frac{\\pi}{6}' }],
        draw: [{ fig: 'f3', items: ANG }] } },
      { clear: true, part: '③ S₁, S₂', say: '$S_1$ は $\\triangle\\mathrm{OPT}$ から、弦 OT と弧 OT の間の弓形（黄の点線と弧の間）を引いたもの。弓形は「扇形 $\\frac{\\pi}{3}$ − 正三角形 $\\frac{\\sqrt3}{2}$」です。',
        add: [{ t: 'h', text: '③ S₁ と S₂ を求める' },
          { t: 'm', size: 'sm', tex: '\\angle\\mathrm{OAT}=\\frac{\\pi}{3},\\qquad \\angle\\mathrm{TAB}=\\frac{\\pi}{6}' },
          fig('f5', TM, { extra: ANG }), { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{OPT}=\\frac12(\\sqrt3-1)\\cdot\\frac{\\sqrt3+1}{2}=\\frac12' },
          { t: 'm', size: 'sm', tex: 'S_1=\\frac12-\\Big(\\frac{\\pi}{3}-\\frac{\\sqrt3}{2}\\Big)=\\frac{1+\\sqrt3}{2}-\\frac{\\pi}{3}' }] },
      { ask: { type: 'think', q: '同じように、$S_2$ を $\\triangle\\mathrm{QBT}$ と弓形（弦 BT）から求めよう。',
        hint: '底辺 QB $=\\sqrt3-1$、高さは T の $x$ 座標。弓形 BT は中心角 $\\frac{\\pi}{6}$（扇形 − $\\triangle\\mathrm{ABT}$）。',
        ans: '$S_2=\\Big(1-\\dfrac{\\sqrt3}{2}\\Big)-\\Big(\\dfrac{\\pi}{6}-\\dfrac12\\Big)=\\dfrac{3-\\sqrt3}{2}-\\dfrac{\\pi}{6}$',
        after: '$\\triangle\\mathrm{QBT}=\\frac12(\\sqrt3-1)\\cdot\\frac{\\sqrt3-1}{2}=1-\\frac{\\sqrt3}{2}$、弓形 $=\\frac{\\pi}{6}-\\frac12\\cdot2\\sin\\frac{\\pi}{6}=\\frac{\\pi}{6}-\\frac12$。',
        add: [{ t: 'm', size: 'sm', tex: 'S_2=\\frac{3-\\sqrt3}{2}-\\frac{\\pi}{6}' }] } },
      { ask: { type: 'choice', q: '$S_1-S_2$ の値は？',
        opts: ['$2-\\dfrac{\\pi}{2}$', '$\\sqrt3-1+\\dfrac{\\pi}{6}$', '$\\sqrt3-1-\\dfrac{\\pi}{2}$', '$\\sqrt3-1-\\dfrac{\\pi}{6}$'], ok: 3,
        why: { 0: 'それは $S_1+S_2$ の最小値です。', 1: '$-\\frac{\\pi}{3}-\\left(-\\frac{\\pi}{6}\\right)=-\\frac{\\pi}{6}$。かっこをはずすときの符号に注意。', 2: '$\\frac{\\pi}{3}$ と $\\frac{\\pi}{6}$ を足しています。$S_2$ の $-\\frac{\\pi}{6}$ を引くので $+\\frac{\\pi}{6}$ になります。' },
        good: '$\\frac{1+\\sqrt3}{2}-\\frac{3-\\sqrt3}{2}=\\sqrt3-1$、$-\\frac{\\pi}{3}+\\frac{\\pi}{6}=-\\frac{\\pi}{6}$。約 $0.21>0$ で、$S_1$ のほうが大きい。',
        add: [{ t: 'ans', label: '答', tex: 'S_1-S_2=\\sqrt3-1-\\frac{\\pi}{6}' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '検算です。T が PQ の中点なので、$\\triangle\\mathrm{OPT}$ と $\\triangle\\mathrm{OQT}$ は面積が等しい（どちらも $\\frac12$）。これを使うと差がすぐ出ます。',
        add: [{ t: 'h', text: '別の見方：T が PQ の中点であることを使う' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}S_1&=\\triangle\\mathrm{OPT}-(\\text{弓形 OT})\\\\ S_2&=\\triangle\\mathrm{OQT}-\\triangle\\mathrm{OBT}-(\\text{弓形 BT})\\end{aligned}' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}S_1-S_2&=\\triangle\\mathrm{OBT}+(\\text{弓形 BT})-(\\text{弓形 OT})\\\\ &=\\frac{\\sqrt3-1}{2}+\\Big(\\frac{\\pi}{6}-\\frac12\\Big)-\\Big(\\frac{\\pi}{3}-\\frac{\\sqrt3}{2}\\Big)\\end{aligned}', note: '同じ答え' },
          fig('f4', TM, { lab: false }, 400)],
        draw: [{ fig: 'f4', items: [{ k: 'seg', a: O, b: cm.T, c: 'w', wd: 2 }, { k: 'poly', pts: [O, B, cm.T], close: true, fill: 'g', alpha: 0.35, c: 'g', wd: 2 }] }] },
      { say: '切片 $p,\\ q$ で $\\frac{x}{p}+\\frac{y}{q}=1$ とおき、「A からの距離 $=\\sqrt2$」で解く方法もあります。ただ 2 文字の条件式が重いので、角 $\\theta$ で 1 文字にするほうが楽です。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: 'もう1つの立て方', text: '$\\ell:\\ qx+py-pq=0$、接する条件 $\\dfrac{|-q+p-pq|}{\\sqrt{p^2+q^2}}=\\sqrt2$\n→ $pq$ の最小を、この条件のもとで考える（文字が 2 つ）' }] },
      { clear: true, cols: [1], part: '答案', say: '答案で見られる所です。和を「三角形 − 一定」と言いかえる理由、文字の範囲、最小の確認（増減表）を、言葉で書きましょう。',
        add: [{ t: 'h', text: '答案で書くこと' }, { t: 'box', c: 'y', label: '採点のポイント', text: '・$S_1+S_2=\\triangle\\mathrm{OPQ}-\\left(\\frac{\\pi}{2}-1\\right)$ と、弓形が一定であることを書く\n・$\\theta$ の範囲 $0<\\theta<\\frac{\\pi}{4}$ と、$u$ の範囲 $-1<u<0$\n・増減表で最小を確かめ、そのときの $\\theta=\\frac{\\pi}{12}$ を答案に明記' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。丸投げ型でも、「和を三角形に言いかえる」「1 文字で表す」「最小のときの図を正確に見る」の 3 段で進めれば解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
