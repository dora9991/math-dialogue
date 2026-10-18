/* 長崎大型 数学（理系）：2025年度 長崎大学 前期 医学部医学科（型Ⅳ）第11問の類題（自作問題・元の問題ではない）
   問題：中心 O・半径 1・中心角 90° のおうぎ形 OAB（A(1,0), B(0,1)）。A から AO と角 θ の向きに打ち出した小球が、
         弧で「O を結ぶ直線に対して入射角＝反射角」ではね返り、はじめて半径 OB（B をふくむ）に達したら止まる
   答え（python3 で反射を数値シミュレーションして検算ずみ）：
     △OP_{k}P_{k+1} はすべて合同な二等辺三角形（底角 θ）、中心角 φ=π−2θ ずつ進む
     (1) 1回で B：2φ=π/2 → θ=3π/8　／ 2回で B：3φ=π/2 → θ=5π/12
     (2) π/4<θ≦3π/8。△OP₁S で ∠P₁OS=2θ−π/2、∠OP₁S=θ、∠OSP₁=3π/2−3θ → OS = sinθ/sin(3π/2−3θ) = −sinθ/cos3θ
         （θ=π/3 で OS=√3/2。シミュレーションと一致）
     (3) nφ<π/2≦(n+1)φ ⇔ π/2 − π/(4n) < θ ≦ π/2 − π/(4(n+1))（n=1〜8 で各 50 点を確認）
     (4) 弦の長さ 2sin(φ/2)。2n sin(φ/2) < L ≦ 2(n+1) sin(φ/2)、π/(4(n+1)) ≦ φ/2 < π/(4n)
         → 2n sin(π/(4(n+1))) < L < 2(n+1) sin(π/(4n))、両はしとも π/2 に収束（sin x/x→1）
     参考：cos(φ/2) ≦ OS ≦ 1 → S は B に近づく */
(function () {
  const PI = Math.PI, O = [0, 0], A = [1, 0], B = [0, 1];
  const U = a => [Math.cos(a), Math.sin(a)];
  const path = th => {   // A, P1, …, Pn, S
    const ph = PI - 2 * th, pts = [A]; let k = 1;
    while (k * ph < PI / 2 - 1e-9) { pts.push(U(k * ph)); k++; }
    const n = k - 1; pts.push([0, Math.cos(ph / 2) / Math.sin((2 * n + 1) * ph / 2)]); return pts;
  };
  const route = (th, c, wd) => { const p = path(th); return [{ k: 'poly', pts: p, c: c || 'y', wd: wd || 3 }].concat(p.slice(1, -1).map(q => ({ k: 'dot', at: q, c: c || 'y' }))); };
  const qfig = (id, items, w) => ({ t: 'fig', id, col: 1, view: [-0.24, -0.2, 1.26, 1.3], w: w || 470, h: w || 470, items: [
    { k: 'arc', o: O, r: 1, a1: 0, a2: 90, c: 'w', wd: 3 }, { k: 'seg', a: O, b: A, c: 'w', wd: 3 }, { k: 'seg', a: O, b: B, c: 'b', wd: 4 },
    { k: 'pt', at: O, name: 'O', dir: 'sw', c: 'w', size: 22 }, { k: 'pt', at: A, name: 'A', dir: 'se', c: 'w', size: 22 }, { k: 'pt', at: B, name: 'B', dir: 'nw', c: 'b', size: 22 }].concat(items || []) });
  const T3 = PI / 3, P1 = U(PI / 3), S3 = [0, Math.sqrt(3) / 2];
  const POINTS = [
    '円の中の反射は「半径となす角が等しい」。弦と半径 2 本でできる三角形はすべて合同な二等辺三角形で、中心角 $\\phi=\\pi-2\\theta$ ずつ進む',
    'ちょうど $n$ 回 ⇔ $n\\phi<\\dfrac{\\pi}{2}\\le(n+1)\\phi$。端（B にちょうど着く場合）を入れるかどうかを、図で1つずつ確かめる',
    '道のりは「弦 $n$ 本 ＋ 最後の一部」で上下からはさむ。$\\displaystyle\\lim_{x\\to0}\\frac{\\sin x}{x}=1$ で両はしの極限をそろえて、はさみうち'
  ];

  HB.lesson({
    id: 'nagasaki25-11', field: '長崎大型　数学（理系）', title: '2025 長崎大 理系 第11問の類題 ― 四分円の中ではね返る球と、道のりの極限', level: '2025年度 長崎大学 理系 第11問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上に O$(0,\\ 0)$，A$(1,\\ 0)$，B$(0,\\ 1)$ をとり、中心 O・半径 1・中心角 $\\dfrac{\\pi}{2}$ のおうぎ形 OAB を考える。点 A から、線分 AO となす角が $\\theta\\ \\left(0<\\theta<\\dfrac{\\pi}{2}\\right)$ の向きに、おうぎ形の内部へ小球を打ち出す。小球は弧 AB に当たると、当たった点と O を結ぶ直線に対して、入る道すじと出る道すじのなす角が等しくなるようにはね返る。小球は、はじめて半径 OB 上の点（B もふくむ）に達したところで止まる。小球の大きさは考えない。',
      parts: [
        '(1)　ちょうど 1 回はね返って B で止まるときの $\\theta$ と、ちょうど 2 回はね返って B で止まるときの $\\theta$ を求めよ。また、それぞれの道すじを図示せよ。',
        '(2)　ちょうど 1 回はね返って止まるような $\\theta$ の範囲を求めよ。また、そのとき止まる点を S として、OS を $\\theta$ を用いて表せ。',
        '(3)　$n$ を正の整数とする。ちょうど $n$ 回はね返って止まるような $\\theta$ の範囲を求めよ。',
        '(4)　ちょうど $n$ 回はね返って止まるとき、A から止まるまでに小球が進む道のりを $L$ とする。$2n\\sin\\dfrac{\\pi}{4(n+1)}<L<2(n+1)\\sin\\dfrac{\\pi}{4n}$ を示し、$n\\to\\infty$ のとき、$L$ は $\\theta$ のとり方によらず $\\dfrac{\\pi}{2}$ に近づくことを示せ。'
      ],
      src: '※ 2025年度 長崎大学 前期 理系（医学部医学科）第11問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '四分円の中ではね返る球の問題です。図形（円周角・二等辺三角形）、三角関数、極限がまとめて問われます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, cols: [0.54, 0.46], part: '読みかえ', say: '図は $\\theta=\\frac{\\pi}{3}$ の例。A から打ち出した球は弧の点 P₁ ではね返り、OB 上の点 S で止まります。まず、はね返りの決まりを図形のことばに直します。',
        add: [{ t: 'h', text: 'はね返りの決まりを読みかえる' },
          { t: 'box', c: 'b', size: 'sm', label: '決まり', text: '弧の上の点 P で、直線 OP（半径）に対して\n入る道すじと出る道すじのなす角が等しい' },
          qfig('q1', [{ k: 'seg', a: O, b: P1, c: 'd', wd: 2, dash: true }].concat(route(T3, 'y', 3.5), [
            { k: 'pt', at: P1, name: 'P₁', dir: 'ne', c: 'y', size: 22 }, { k: 'pt', at: S3, name: 'S', dir: 'w', c: 'p', size: 22 },
            { k: 'angle', o: A, a: O, b: P1, rp: 46, label: 'θ', c: 'y', lr: 16 }]))] },
      { ask: { type: 'choice', q: '△OAP₁ で、中心角 $\\angle\\mathrm{AOP_1}$ は？',
        opts: ['$2\\theta$', '$\\pi-\\theta$', '$\\pi-2\\theta$', '$\\dfrac{\\pi}{2}-\\theta$'], ok: 2,
        why: { 0: 'OA $=$ OP₁ の二等辺三角形で、底角が $\\theta$。頂角は $\\pi$ から底角 2 つを引きます。', 1: '底角は A と P₁ の 2 つとも $\\theta$。$2\\theta$ を引きます。', 3: 'それは頂角の半分です。' },
        good: 'OA $=$ OP₁（半径）なので △OAP₁ は二等辺三角形。$\\angle\\mathrm{OP_1A}=\\theta$ で、頂角は $\\pi-2\\theta$。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{AOP_1}=\\pi-2\\theta=\\phi', note: '$\\phi$ とおく' }],
        draw: [{ fig: 'q1', items: [{ k: 'angle', o: P1, a: A, b: O, rp: 40, label: 'θ', c: 'y', lr: 14 }, { k: 'angle', o: O, a: A, b: P1, rp: 34, label: 'φ', c: 'g', lr: 14 }] }] } },
      { say: 'P₁ では、入る道すじが半径 OP₁ と角 $\\theta$。決まりから、出る道すじも OP₁ と角 $\\theta$。次の三角形も底角 $\\theta$ の二等辺三角形で、**中心角 $\\phi$ ずつ同じように進みます**。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'カギ', text: 'はね返る点 P₁，P₂，… は、A から\n中心角 $\\phi,\\ 2\\phi,\\ 3\\phi,\\ \\cdots$ の弧の上の点\n（$\\phi=\\pi-2\\theta$、弦の三角形はすべて合同）' }],
        draw: [{ fig: 'q1', items: [{ k: 'angle', o: P1, a: O, b: S3, rp: 40, label: 'θ', c: 'p', lr: 14 }] }] },

      // ---------- (1) ----------
      { clear: true, cols: [0.54, 0.46], part: '(1)', say: '(1)。B は A から中心角 $\\frac{\\pi}{2}$ の点。1 回はね返って B に着くのは、2 本目の弦の先がちょうど B のとき、つまり $2\\phi=\\frac{\\pi}{2}$ です。',
        add: [{ t: 'h', text: '(1)　ちょうど B に着く θ' },
          { t: 'm', size: 'sm', tex: '1\\ \\text{回}:\\ 2\\phi=\\frac{\\pi}{2},\\qquad 2\\ \\text{回}:\\ 3\\phi=\\frac{\\pi}{2}' },
          qfig('q2', [])] },
      { ask: { type: 'choice', q: 'ちょうど 1 回はね返って B で止まる $\\theta$ は？',
        opts: ['$\\dfrac{\\pi}{4}$', '$\\dfrac{3\\pi}{8}$', '$\\dfrac{\\pi}{3}$', '$\\dfrac{5\\pi}{12}$'], ok: 1,
        why: { 0: '$\\theta=\\frac{\\pi}{4}$ だと $\\phi=\\frac{\\pi}{2}$ で、はね返らずに直接 B に着きます。', 2: '$\\theta=\\frac{\\pi}{3}$ は $\\phi=\\frac{\\pi}{3}$。はね返ったあと OB の途中で止まります。', 3: 'それは 2 回はね返って B に着くとき（$3\\phi=\\frac{\\pi}{2}$）です。' },
        good: '$\\phi=\\frac{\\pi}{4}$ なので $\\theta=\\dfrac{\\pi-\\phi}{2}=\\dfrac{3\\pi}{8}$。',
        draw: [{ fig: 'q2', items: route(3 * PI / 8, 'y', 3.5).concat([{ k: 'label', at: U(PI / 4), text: 'P₁', c: 'y', size: 20, dx: 16, dy: -10 }]) }] } },
      { say: '2 回なら $\\phi=\\frac{\\pi}{6}$、$\\theta=\\frac{5\\pi}{12}$（青）。$\\theta$ が $\\frac{\\pi}{2}$ に近いほど、弧にそって細かくはね返ります。',
        add: [{ t: 'ans', label: '(1) 答', text: '1 回：$\\theta=\\dfrac{3\\pi}{8}$（黄）　2 回：$\\theta=\\dfrac{5\\pi}{12}$（青）' }],
        draw: [{ fig: 'q2', items: route(5 * PI / 12, 'b', 3) }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.56, 0.44], part: '(2)', say: '(2)。1 回だけはね返るのは、P₁ が B より手前（$\\phi<\\frac{\\pi}{2}$）で、次の弦の先が B かその先（$2\\phi\\ge\\frac{\\pi}{2}$）のときです。',
        add: [{ t: 'h', text: '(2)　1 回で止まる範囲と OS' },
          { t: 'm', size: 'sm', tex: '\\phi<\\frac{\\pi}{2}\\le2\\phi\\iff\\frac{\\pi}{4}\\le\\phi<\\frac{\\pi}{2}' },
          qfig('q3', [{ k: 'poly', pts: [O, P1, S3], close: true, fill: 'p', alpha: 0.2, c: 'p', wd: 2 }].concat(route(T3, 'y', 3.5), [
            { k: 'pt', at: P1, name: 'P₁', dir: 'ne', c: 'y', size: 22 }, { k: 'pt', at: S3, name: 'S', dir: 'w', c: 'p', size: 22 }]))] },
      { ask: { type: 'choice', q: '$\\theta$ の範囲は？（$\\theta=\\dfrac{\\pi-\\phi}{2}$）',
        opts: ['$\\dfrac{\\pi}{4}<\\theta\\le\\dfrac{3\\pi}{8}$', '$\\dfrac{\\pi}{4}\\le\\theta\\le\\dfrac{3\\pi}{8}$', '$\\dfrac{\\pi}{4}<\\theta<\\dfrac{3\\pi}{8}$', '$\\dfrac{3\\pi}{8}<\\theta\\le\\dfrac{5\\pi}{12}$'], ok: 0,
        why: { 1: '$\\theta=\\frac{\\pi}{4}$ では $\\phi=\\frac{\\pi}{2}$ で、はね返らずに B に着きます（0 回）。', 2: '$\\theta=\\frac{3\\pi}{8}$ は 1 回はね返って B で止まります。B も OB 上なのでふくめます。', 3: 'それは 2 回はね返る範囲です。' },
        good: '$\\phi$ が大きいほど $\\theta$ は小さい。不等号の向きと、端を入れるかどうかに注意します。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\pi}{4}<\\theta\\le\\frac{3\\pi}{8}' }] } },
      { say: '△OP₁S の角を調べます。$\\angle\\mathrm{P_1OS}=\\frac{\\pi}{2}-\\phi=2\\theta-\\frac{\\pi}{2}$、$\\angle\\mathrm{OP_1S}=\\theta$（はね返りの決まり）。残りの角は $\\frac{3\\pi}{2}-3\\theta$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\angle\\mathrm{P_1OS}=2\\theta-\\frac{\\pi}{2},\\ \\ \\angle\\mathrm{OP_1S}=\\theta,\\ \\ \\angle\\mathrm{OSP_1}=\\frac{3\\pi}{2}-3\\theta' }] },
      { ask: { type: 'think', q: '△OP₁S に正弦定理を使って、OS を $\\theta$ で表そう。$\\theta=\\dfrac{\\pi}{3}$ のときの値も確かめよう。',
        hint: '$\\dfrac{\\mathrm{OS}}{\\sin\\angle\\mathrm{OP_1S}}=\\dfrac{\\mathrm{OP_1}}{\\sin\\angle\\mathrm{OSP_1}}$、OP₁ $=1$。',
        ans: 'OS $=\\dfrac{\\sin\\theta}{\\sin\\left(\\frac{3\\pi}{2}-3\\theta\\right)}=-\\dfrac{\\sin\\theta}{\\cos3\\theta}$。$\\theta=\\frac{\\pi}{3}$ なら $\\dfrac{\\sqrt3/2}{1}=\\dfrac{\\sqrt3}{2}$',
        after: '$\\theta=\\frac{\\pi}{3}$ では $\\angle\\mathrm{OSP_1}=\\frac{\\pi}{2}$、P₁S は水平です（図）。$\\theta=\\frac{3\\pi}{8}$ では OS $=1$（B）になり、(1) とつながります。',
        add: [{ t: 'ans', label: '(2) 答', text: '$\\dfrac{\\pi}{4}<\\theta\\le\\dfrac{3\\pi}{8}$，　OS $=-\\dfrac{\\sin\\theta}{\\cos3\\theta}$' }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3)。はね返る点は中心角 $\\phi,\\ 2\\phi,\\ \\cdots$ の所。ちょうど $n$ 回なのは、$n$ 番目の点 Pₙ が B より手前で、次の弦の先が B かその先のときです。図は $n=3$ の例。',
        add: [{ t: 'h', text: '(3)　ちょうど n 回で止まる範囲' },
          { t: 'm', tex: 'n\\phi<\\frac{\\pi}{2}\\le(n+1)\\phi' },
          { t: 'm', size: 'sm', tex: '\\iff\\frac{\\pi}{2(n+1)}\\le\\phi<\\frac{\\pi}{2n}' },
          qfig('q4', route(0.425 * PI, 'y', 3).concat([0.15, 0.3, 0.45].map(a => ({ k: 'seg', a: O, b: U(a * PI), c: 'd', wd: 1.5, dash: true })),
            [{ k: 'label', at: [0.33, 0.06], text: 'φ', c: 'g', size: 20 }, { k: 'label', at: [0.27, 0.2], text: 'φ', c: 'g', size: 20 }, { k: 'label', at: [0.16, 0.3], text: 'φ', c: 'g', size: 20 }]), 440)] },
      { ask: { type: 'choice', q: '$\\theta=\\frac{\\pi}{2}-\\frac{\\phi}{2}$ より　$\\frac{\\pi}{2}-\\frac{\\pi}{4n}\\ \\square\\ \\theta\\ \\square\\ \\frac{\\pi}{2}-\\frac{\\pi}{4(n+1)}$。□ に入る不等号は（左から順に）？',
        opts: ['$\\le$，$<$', '$\\le$，$\\le$', '$<$，$<$', '$<$，$\\le$'], ok: 3,
        why: { 0: '$\\phi$ の等号の位置をそのまま写しています。$\\phi$ が大きいほど $\\theta$ は小さいので、入れかわります。', 1: '左の端 $\\theta=\\frac{\\pi}{2}-\\frac{\\pi}{4n}$ では、$n-1$ 回で B に着いて止まります。ふくめません。', 2: '右の端は、$n$ 回はね返ってちょうど B で止まる場合。B も OB 上なのでふくめます。' },
        good: '左の端（$n-1$ 回で B）は入れず、右の端（$n$ 回で B）は入れる。図で端の場合を思いうかべると確実です。' } },
      { say: '$n=1$ を入れると $\\frac{\\pi}{4}<\\theta\\le\\frac{3\\pi}{8}$ で、(2) と一致します。一般の式は、必ず小さい $n$ で確かめましょう。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\frac{\\pi}{2}-\\frac{\\pi}{4n}<\\theta\\le\\frac{\\pi}{2}-\\frac{\\pi}{4(n+1)}' }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.56, 0.44], part: '(4)', say: '(4)。道のり $L$ は「A→P₁→…→Pₙ の弦 $n$ 本」と「Pₙ から S までの最後の一部（ピンク）」の和です。最後の一部は、0 より長く、弦 1 本以下です。',
        add: [{ t: 'h', text: '(4)　道のり L の極限' },
          { t: 'm', size: 'sm', tex: 'L=(\\text{弦}\\ n\\ \\text{本})+\\mathrm{P}_n\\mathrm{S}', note: '$0<\\mathrm{P}_n\\mathrm{S}\\le$ 弦 1 本' },
          qfig('q5', (function () { const p = path(0.425 * PI); return [{ k: 'poly', pts: p.slice(0, -1), c: 'y', wd: 3.5 }, { k: 'seg', a: p[p.length - 2], b: p[p.length - 1], c: 'p', wd: 4.5 },
            { k: 'pt', at: p[p.length - 1], name: 'S', dir: 'sw', c: 'p', size: 22 }, { k: 'label', at: p[p.length - 2], text: 'P₃', c: 'y', size: 20, dx: 16, dy: -12 }]; })())] },
      { ask: { type: 'choice', q: '半径 1、中心角 $\\phi$ の弦 1 本の長さは？',
        opts: ['$\\sin\\phi$', '$2\\sin\\phi$', '$2\\sin\\dfrac{\\phi}{2}$', '$\\phi$'], ok: 2,
        why: { 0: '二等辺三角形を頂角の二等分線で分けると、弦の半分は $\\sin\\frac{\\phi}{2}$ です。', 1: '使うのは中心角の半分 $\\frac{\\phi}{2}$ です。', 3: '$\\phi$ は弧の長さ。弦は弧より短くなります。' },
        good: '頂角の二等分線で 2 つの直角三角形に分けて、$2\\sin\\dfrac{\\phi}{2}$（$=2\\cos\\theta$）。',
        add: [{ t: 'm', size: 'sm', tex: '2n\\sin\\frac{\\phi}{2}<L\\le2(n+1)\\sin\\frac{\\phi}{2}' }] } },
      { say: '(3) から $\\frac{\\pi}{4(n+1)}\\le\\frac{\\phi}{2}<\\frac{\\pi}{4n}$。この範囲で $\\sin$ は増加なので、$\\phi$ を範囲の端でおきかえると、$\\theta$ によらない不等式になります。',
        add: [{ t: 'm', size: 'sm', tex: '2n\\sin\\frac{\\pi}{4(n+1)}<L<2(n+1)\\sin\\frac{\\pi}{4n}', note: '示すべき式' }] },
      { ask: { type: 'think', q: '$n\\to\\infty$ のとき、左はし $2n\\sin\\dfrac{\\pi}{4(n+1)}$ の極限を求めよう。',
        hint: '$x_n=\\dfrac{\\pi}{4(n+1)}$ とおくと $x_n\\to0$。$\\dfrac{\\sin x_n}{x_n}\\cdot 2n\\,x_n$ の形に。',
        ans: '$\\dfrac{\\sin x_n}{x_n}\\cdot\\dfrac{2n\\pi}{4(n+1)}\\to1\\cdot\\dfrac{\\pi}{2}=\\dfrac{\\pi}{2}$',
        after: '右はしも $\\dfrac{\\sin y_n}{y_n}\\cdot\\dfrac{2(n+1)\\pi}{4n}\\to\\dfrac{\\pi}{2}$（$y_n=\\frac{\\pi}{4n}$）。両はしが同じ値に近づきます。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{n\\to\\infty}2n\\sin\\frac{\\pi}{4(n+1)}=\\lim_{n\\to\\infty}2(n+1)\\sin\\frac{\\pi}{4n}=\\frac{\\pi}{2}' }] } },
      { say: 'はさみうちの原理で、$L$ は $\\theta$ のとり方によらず $\\frac{\\pi}{2}$ に近づきます。$\\frac{\\pi}{2}$ は四分円の **弧の長さ**。細かくはね返るほど、道すじは弧にそっていきます。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\lim_{n\\to\\infty}L=\\frac{\\pi}{2}', note: 'はさみうちの原理' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '$n=8$ の例です。はね返りが多いと、道すじは弧とほとんど重なり、止まる点 S は B のすぐそばになります。',
        add: [{ t: 'h', text: '別の見方：n が大きいと' },
          { t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・二等辺三角形が合同になる理由（はね返りの決まり）を書く\n・範囲の端（B にちょうど着く場合）の入れ方を説明する\n・はさみうちは「$\\theta$ によらない」上下の式で' },
          qfig('q6', route(0.47 * PI, 'y', 2.5).concat([{ k: 'pt', at: path(0.47 * PI).slice(-1)[0], name: 'S', dir: 'sw', c: 'p', size: 22 }]))] },
      { ask: { type: 'choice', q: '$n\\to\\infty$ のとき、止まる点 S はどこに近づく？',
        opts: ['B', 'O', 'OB の中点', '$\\theta$ によって変わり、決まらない'], ok: 0,
        why: { 1: 'S は最後の弦の上。O からの距離は、O と弦の距離 $\\cos\\frac{\\phi}{2}$ 以上です。', 2: 'OS $\\ge\\cos\\frac{\\phi}{2}$ で、これは 1 に近づきます。', 3: '$\\cos\\frac{\\phi}{2}\\le$ OS $\\le1$ で、上下が $\\theta$ によらず 1 に近づきます。' },
        good: 'O と最後の弦の距離は $\\cos\\frac{\\phi}{2}$。$\\cos\\frac{\\phi}{2}\\le$ OS $\\le1$、$\\phi\\to0$ で OS $\\to1$（B）。',
        add: [{ t: 'm', size: 'sm', tex: '\\cos\\frac{\\phi}{2}\\le\\mathrm{OS}\\le1\\ \\Rightarrow\\ \\mathrm{OS}\\to1' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。はね返りを「合同な二等辺三角形の連なり」と見ることで、角の条件・範囲・極限が一本の流れになりました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、(4) の証明を自分でノートに書いてみましょう。' }
    ]
  });
})();
