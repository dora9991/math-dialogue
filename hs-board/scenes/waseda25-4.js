/* 2025 早稲田 理工 第4問の類題（自作）：どの2つも外接する4つの球面の接点 K, L, M, N（S0S1, S0S2, S1S3, S2S3）が同一平面上にあること、四面体の体積
   問題：S0（中心 O・半径 r）、S1, S2, S3（中心 A, B, C・半径 α, β, γ）。a=OA, b=OB, c=OC（ベクトル）。
   答え（python3・sympy で検算ずみ）：
   (1) OK=r/(r+α) a、OL=r/(r+β) b、OM=(γa+αc)/(α+γ)、ON=(γb+βc)/(β+γ)（接点は中心どうしを半径の比に内分）
   (2) a=(r+α)/r k、b=(r+β)/r l、c=(α+γ)/α m − γ(r+α)/(αr) k を ON に代入：
       ON=x k+y l+z m、x=−βγ(r+α)/(αr(β+γ))、y=γ(r+β)/(r(β+γ))、z=β(α+γ)/(α(β+γ))、x+y+z=1（分子 αr(β+γ)）
       → KN=y KL+z KM。M は平面 OAB 上にないので K, L, M は一直線上にない → N は平面 KLM 上
       （行列式でも 0。ランダムな半径 200 組で、4点が同一円周上にもあることを数値で確認）
   (3) r=1, α=1, β=γ=2：OA=2, OB=OC=3, AB=AC=3, BC=4。A(2,0,0)、B(1,2√2,0)、C(1,0,2√2)、V=8/3
       K(1,0,0) L(1/3,2√2/3,0) M(5/3,0,2√2/3) N(1,√2,√2)、ON=−2OK+3/2OL+3/2OM */
(function () {
  const s2 = Math.SQRT2;
  // ---- 見取図（正射影：球は同じ半径の円に見える） ----
  const nrm = v => { const L = Math.hypot(...v); return v.map(c => c / L); };
  const V = nrm([1, 0.4, 0.5]), E1 = nrm([-V[1], V[0], 0]), E2 = [V[1] * E1[2] - V[2] * E1[1], V[2] * E1[0] - V[0] * E1[2], V[0] * E1[1] - V[1] * E1[0]];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const O3 = [0, 0, 0], A3 = [2, 0, 0], B3 = [1, 2 * s2, 0], C3 = [1, 0, 2 * s2];
  const K3 = [1, 0, 0], L3 = [1 / 3, 2 * s2 / 3, 0], M3 = [5 / 3, 0, 2 * s2 / 3], N3 = [1, s2, s2];
  const [O, A, B, C, K, L, M, N] = [O3, A3, B3, C3, K3, L3, M3, N3].map(pj);
  const tetra = [
    { k: 'seg', a: O, b: A, c: 'w', wd: 2, dash: true }, { k: 'seg', a: O, b: B, c: 'w', wd: 2, dash: true }, { k: 'seg', a: O, b: C, c: 'w', wd: 2, dash: true },
    { k: 'seg', a: A, b: B, c: 'w', wd: 2.5 }, { k: 'seg', a: B, b: C, c: 'w', wd: 2.5 }, { k: 'seg', a: C, b: A, c: 'w', wd: 2.5 },
    { k: 'pt', at: O, name: 'O', dir: 'ne', c: 'w', r: 5, size: 24 }, { k: 'pt', at: A, name: 'A', dir: 'sw', c: 'w', r: 5 }, { k: 'pt', at: B, name: 'B', dir: 'se', c: 'w', r: 5 }, { k: 'pt', at: C, name: 'C', dir: 'n', c: 'w', r: 5 }];
  const tps = (which) => [['K', K, 'sw', 'y'], ['L', L, 's', 'y'], ['M', M, 'w', 'p'], ['N', N, 'e', 'p']].filter(q => which.includes(q[0])).map(q => ({ k: 'pt', at: q[1], name: q[0], dir: q[2], c: q[3] }));
  const quad = { k: 'poly', pts: [K, L, N, M], close: true, fill: 'y', alpha: 0.28, c: 'y', wd: 2 };
  const fig = (id, items, h) => { h = h || 420; return { t: 'fig', id, col: 1, view: [-1.35, -1.35, 2.85, 2.75], w: Math.round(h * 4.2 / 4.1), h, items: tetra.concat(items || []) }; };
  const figS = (id) => ({ t: 'fig', id, col: 1, view: [-1.6, -2.1, 5.1, 2.1], w: 560, h: 351, items: [
    { k: 'circle', o: [0, 0], r: 1.2, c: 'b', wd: 2.5 }, { k: 'circle', o: [3, 0], r: 1.8, c: 'g', wd: 2.5 },
    { k: 'seg', a: [0, 0], b: [3, 0], c: 'w', wd: 2 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'sw', c: 'w', r: 5 }, { k: 'pt', at: [3, 0], name: 'A', dir: 'se', c: 'w', r: 5 }, { k: 'pt', at: [1.2, 0], name: 'K', dir: 's', off: 26, c: 'y' },
    { k: 'dim', a: [0, 0], b: [1.2, 0], dy: -26, label: 'r', c: 'b' }, { k: 'dim', a: [1.2, 0], b: [3, 0], dy: -26, label: 'α', c: 'g' },
    { k: 'label', at: [-0.95, 1.2], text: 'S₀', c: 'b', size: 24 }, { k: 'label', at: [4.55, 1.55], text: 'S₁', c: 'g', size: 24 }] });
  const POINTS = [
    '外接する2球の接点は、中心どうしを結ぶ線分を **半径の比に内分** する点。$m:n$ に内分 → $\\dfrac{n\\vec p+m\\vec q}{m+n}$（係数は反対側の比）',
    '4点が同一平面上 ⇔ $\\vec n=x\\vec k+y\\vec l+z\\vec m$ で **$x+y+z=1$**（$\\overrightarrow{\\mathrm{KN}}=y\\overrightarrow{\\mathrm{KL}}+z\\overrightarrow{\\mathrm{KM}}$）。基準のベクトルを K, L, M 側に取りかえて計算する',
    '6辺の長さがわかる四面体は、**1つの頂点を原点・1辺を $x$ 軸・1面を $xy$ 平面** において座標を決め、底面積 × 高さ ÷ 3'
  ];

  HB.lesson({
    id: 'waseda25-4', field: '早稲田型　数学（理工）', title: '2025 早稲田 理工 第4問の類題 ― 互いに接する4つの球と、接点がのる平面', level: '2025年度 早稲田大学 理工 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に、どの2つも外接する4つの球面 $S_0,\\ S_1,\\ S_2,\\ S_3$ がある。$S_0$ の中心は原点 O で半径は $r$、$S_1,\\ S_2,\\ S_3$ の中心はそれぞれ A, B, C で半径はそれぞれ $\\alpha,\\ \\beta,\\ \\gamma$ である。$S_0$ と $S_1$、$S_0$ と $S_2$、$S_1$ と $S_3$、$S_2$ と $S_3$ の接点をそれぞれ K, L, M, N とし、$\\vec a=\\overrightarrow{\\mathrm{OA}},\\ \\vec b=\\overrightarrow{\\mathrm{OB}},\\ \\vec c=\\overrightarrow{\\mathrm{OC}}$ とする。ただし、4点 O, A, B, C は同一平面上にない。',
      parts: [
        '(1)　$\\overrightarrow{\\mathrm{OK}},\\ \\overrightarrow{\\mathrm{OL}},\\ \\overrightarrow{\\mathrm{OM}},\\ \\overrightarrow{\\mathrm{ON}}$ を、$\\vec a,\\ \\vec b,\\ \\vec c$ と $r,\\ \\alpha,\\ \\beta,\\ \\gamma$ を用いて表せ。',
        '(2)　4点 K, L, M, N は同一平面上にあることを示せ。',
        '(3)　$r=1,\\ \\alpha=1,\\ \\beta=\\gamma=2$ のとき、四面体 OABC の体積を求めよ。'
      ],
      src: '※ 2025年度 早稲田大学 一般選抜 理工 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: '問題', say: '空間の球が4つ、どの2つも接している問題です。接点をベクトルで表し、「同一平面上」の条件を使います。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },
      { clear: true, cols: [0.56, 0.44], part: '読みかえ', say: '2つの球面が外接するとき、中心どうしの距離は半径の和です。どの2つも外接するので、四面体 OABC の6辺が半径で決まります。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'tbl', size: 'sm', rows: [['辺', 'OA', 'OB', 'OC', 'AB', 'BC', 'CA'], ['長さ', '$r+\\alpha$', '$r+\\beta$', '$r+\\gamma$', '$\\alpha+\\beta$', '$\\beta+\\gamma$', '$\\gamma+\\alpha$']] },
          { t: 'p', size: 'sm', text: '接点は「輪」のように　$S_0$ → $S_1$ → $S_3$ → $S_2$ → $S_0$\n（K → M → N → L）とつながっている' },
          { t: 'p', size: 'sm', text: '右の図は、2つの球を中心を通る平面で切った断面' },
          figS('f0')] },
      { ask: { type: 'choice', q: '2つの球面が外接するとき、接点はどこにある？',
        opts: ['中心どうしを結ぶ線分の中点', '中心どうしを結ぶ線分を、半径の比に内分する点', '中心どうしを結ぶ線分を、半径の比に外分する点', '中心どうしを結ぶ線分を、半径の逆比に内分する点'], ok: 1,
        why: { 0: '半径がちがえば、中点ではありません。', 2: '外接する2球の接点は、2つの中心の間にあります。', 3: '中心から接点までの長さがその球の半径。比は「自分の半径 : 相手の半径」です。' },
        good: '接点は2つの中心を結ぶ線分の上で、それぞれの中心から半径の長さの所。だから半径の比に内分します。',
        add: [{ t: 'p', size: 'sm', text: '例：K は OA 上で　OK : KA $=r:\\alpha$' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: 'K は線分 OA を $r:\\alpha$ に、L は線分 OB を $r:\\beta$ に内分する点です。始点が O なので、そのまま書けます。',
        add: [{ t: 'h', text: '(1)　接点の位置ベクトル' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OK}}=\\frac{r}{r+\\alpha}\\vec a,\\qquad \\overrightarrow{\\mathrm{OL}}=\\frac{r}{r+\\beta}\\vec b' },
          fig('f1', tps(['K', 'L', 'M', 'N']))] },
      { ask: { type: 'choice', q: 'M（$S_1$ と $S_3$ の接点）は AC を $\\alpha:\\gamma$ に内分する点。$\\overrightarrow{\\mathrm{OM}}$ は？',
        opts: ['$\\dfrac{\\alpha\\vec a+\\gamma\\vec c}{\\alpha+\\gamma}$', '$\\dfrac{\\vec a+\\vec c}{2}$', '$\\dfrac{\\gamma\\vec a-\\alpha\\vec c}{\\gamma-\\alpha}$', '$\\dfrac{\\gamma\\vec a+\\alpha\\vec c}{\\alpha+\\gamma}$'], ok: 3,
        why: { 0: 'よくあるまちがい。$m:n$ に内分する点は $\\frac{n\\vec p+m\\vec q}{m+n}$ で、係数は「反対側」の比です。', 1: '中点になるのは $\\alpha=\\gamma$ のときだけです。', 2: 'それは外分点の形です。' },
        good: 'AM : MC $=\\alpha:\\gamma$ なので、$\\vec a$ には $\\gamma$、$\\vec c$ には $\\alpha$ がかかります。' } },
      { say: 'N も同じで、BC を $\\beta:\\gamma$ に内分する点です。(1) の答えをまとめます。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\begin{aligned}&\\overrightarrow{\\mathrm{OK}}=\\dfrac{r}{r+\\alpha}\\vec a,\\quad \\overrightarrow{\\mathrm{OL}}=\\dfrac{r}{r+\\beta}\\vec b\\\\[4pt] &\\overrightarrow{\\mathrm{OM}}=\\dfrac{\\gamma\\vec a+\\alpha\\vec c}{\\alpha+\\gamma},\\quad \\overrightarrow{\\mathrm{ON}}=\\dfrac{\\gamma\\vec b+\\beta\\vec c}{\\beta+\\gamma}\\end{aligned}' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '$\\vec k=\\overrightarrow{\\mathrm{OK}}$ のように書きます。$\\vec n$ を $\\vec k,\\ \\vec l,\\ \\vec m$ で表して、係数の和が 1 になることを示すのが方針です。',
        add: [{ t: 'h', text: '(2)　4点が同一平面上にあること' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '$\\vec n=x\\vec k+y\\vec l+z\\vec m$ と表して $x+y+z=1$ を示す\n（$\\vec k=\\overrightarrow{\\mathrm{OK}}$，$\\vec l=\\overrightarrow{\\mathrm{OL}}$，$\\vec m=\\overrightarrow{\\mathrm{OM}}$，$\\vec n=\\overrightarrow{\\mathrm{ON}}$）' },
          fig('f2', [quad].concat(tps(['K', 'L', 'M', 'N'])), 400)] },
      { ask: { type: 'choice', q: '$x+y+z=1$ なら N が平面 KLM 上にある、と言えるのはなぜ？',
        opts: ['$\\overrightarrow{\\mathrm{KN}}=y\\overrightarrow{\\mathrm{KL}}+z\\overrightarrow{\\mathrm{KM}}$ と書きかえられるから', 'O が平面 KLM 上にあるから', '$x,\\ y,\\ z$ がすべて正になるから', 'K, L, M, N が同じ球面上にあるから'], ok: 0,
        why: { 1: 'O は平面 KLM 上にはありません。', 2: '正である必要はありません（実際 $x<0$ になります）。', 3: '同じ球面上の4点が、同一平面上にあるとは限りません。' },
        good: '$x=1-y-z$ を入れると $\\vec n-\\vec k=y(\\vec l-\\vec k)+z(\\vec m-\\vec k)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec n-\\vec k=y(\\vec l-\\vec k)+z(\\vec m-\\vec k)' }] } },
      { clear: true, cols: [1], say: '「基準のベクトル」を $\\vec a,\\ \\vec b,\\ \\vec c$ から $\\vec k,\\ \\vec l,\\ \\vec m$ に取りかえます。まず $\\vec a,\\ \\vec b$ は (1) の式を逆に解くだけです。',
        add: [{ t: 'h', text: '(2)　つづき：k, l, m で表す' },
          { t: 'm', tex: '\\vec a=\\frac{r+\\alpha}{r}\\vec k,\\qquad \\vec b=\\frac{r+\\beta}{r}\\vec l' }] },
      { ask: { type: 'choice', q: '$(\\alpha+\\gamma)\\vec m=\\gamma\\vec a+\\alpha\\vec c$ から $\\vec c$ を $\\vec k,\\ \\vec m$ で表す。$\\vec k$ の係数は？',
        opts: ['$-\\dfrac{\\gamma}{\\alpha}$', '$-\\dfrac{\\alpha(r+\\alpha)}{\\gamma r}$', '$-\\dfrac{\\gamma(r+\\alpha)}{\\alpha r}$', '$-\\gamma$'], ok: 2,
        why: { 0: '$\\vec a=\\frac{r+\\alpha}{r}\\vec k$ を入れ忘れています。', 1: '$\\vec c$ の係数は $\\alpha$ です。$\\alpha$ で割ります。', 3: '$\\alpha$ で割るのを忘れ、$\\vec a$ も $\\vec k$ に直していません。' },
        good: '$\\vec c=\\frac{(\\alpha+\\gamma)\\vec m-\\gamma\\vec a}{\\alpha}$ に、$\\vec a=\\frac{r+\\alpha}{r}\\vec k$ を入れます。',
        add: [{ t: 'm', tex: '\\vec c=\\frac{\\alpha+\\gamma}{\\alpha}\\vec m-\\frac{\\gamma(r+\\alpha)}{\\alpha r}\\vec k' }] } },
      { say: 'これらを $\\vec n=\\frac{\\gamma\\vec b+\\beta\\vec c}{\\beta+\\gamma}$ に入れて整理すると、$\\vec k,\\ \\vec l,\\ \\vec m$ の係数は次のようになります。',
        add: [{ t: 'm', tex: '\\vec n=\\hy{-\\frac{\\beta\\gamma(r+\\alpha)}{\\alpha r(\\beta+\\gamma)}}\\vec k+\\hb{\\frac{\\gamma(r+\\beta)}{r(\\beta+\\gamma)}}\\vec l+\\hg{\\frac{\\beta(\\alpha+\\gamma)}{\\alpha(\\beta+\\gamma)}}\\vec m' },
          { t: 'p', size: 'sm', text: '[[y:$x$]]，[[b:$y$]]，[[g:$z$]] の順。$x$ は負になる' }] },
      { ask: { type: 'think', q: '$x+y+z=1$ を確かめよう。（分母を $\\alpha r(\\beta+\\gamma)$ にそろえる）',
        hint: '分子は $-\\beta\\gamma(r+\\alpha)+\\alpha\\gamma(r+\\beta)+\\beta r(\\alpha+\\gamma)$。展開して打ち消し合う項をさがす。',
        ans: '分子 $=-\\beta\\gamma r-\\alpha\\beta\\gamma+\\alpha\\gamma r+\\alpha\\beta\\gamma+\\alpha\\beta r+\\beta\\gamma r=\\alpha r(\\beta+\\gamma)$。よって和は 1',
        after: '$\\alpha\\beta\\gamma$ と $\\beta\\gamma r$ が消えて、分母とぴったり同じになります。',
        add: [{ t: 'm', tex: 'x+y+z=\\frac{\\alpha r(\\beta+\\gamma)}{\\alpha r(\\beta+\\gamma)}=1' }] } },
      { say: 'よって $\\overrightarrow{\\mathrm{KN}}=y\\overrightarrow{\\mathrm{KL}}+z\\overrightarrow{\\mathrm{KM}}$。M は平面 OAB 上にない（$\\vec c$ をふくむ）ので K, L, M は一直線上になく、N は平面 KLM 上にあります。',
        add: [{ t: 'ans', label: '(2) 結論', text: '$\\overrightarrow{\\mathrm{KN}}=y\\overrightarrow{\\mathrm{KL}}+z\\overrightarrow{\\mathrm{KM}}$ より、4点 K, L, M, N は同一平面上にある' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '$r=1,\\ \\alpha=1,\\ \\beta=\\gamma=2$ のとき、6辺は右の表のとおり。O を原点、A を $x$ 軸上、B を $xy$ 平面上において、座標を決めます。',
        add: [{ t: 'h', text: '(3)　四面体 OABC の体積' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['OA', 'OB', 'OC', 'AB', 'AC', 'BC'], ['2', '3', '3', '3', '3', '4']] },
          { t: 'm', tex: '\\mathrm{A}(2,\\ 0,\\ 0),\\quad \\mathrm{B}(x,\\ y,\\ 0)\\ \\ (y>0)' },
          fig('f3', [{ k: 'label', at: [(O[0] + A[0]) / 2, (O[1] + A[1]) / 2], text: '2', dx: 14, dy: 14, c: 'b', size: 22 }, { k: 'label', at: [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], text: '4', dx: 14, dy: -6, c: 'b', size: 22 }], 360)] },
      { ask: { type: 'choice', q: 'OB $=3$、AB $=3$ から、B の座標は？',
        opts: ['$(1,\\ \\sqrt5,\\ 0)$', '$(1,\\ 2\\sqrt2,\\ 0)$', '$(2,\\ \\sqrt5,\\ 0)$', '$\\left(\\frac32,\\ \\frac{3\\sqrt3}{2},\\ 0\\right)$'], ok: 1,
        why: { 0: '$x=1$ のとき $y^2=9-1=8$。$\\sqrt5$ は計算ミスです。', 2: '$x^2+y^2=9$ と $(x-2)^2+y^2=9$ を引くと $x=1$ です。', 3: 'それは1辺 3 の正三角形の頂点。OA は 2 です。' },
        good: '2式を引くと $4x-4=0$ で $x=1$。$y^2=8$、$y>0$ より $y=2\\sqrt2$。',
        add: [{ t: 'm', tex: '\\mathrm{B}(1,\\ 2\\sqrt2,\\ 0)' }] } },
      { say: 'C$(p,\\ q,\\ s)$（$s>0$）は、OC $=$ AC $=3$ から $p=1$。BC $=4$ から $q=0$、そして $s=2\\sqrt2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&p^2+q^2+s^2=9,\\ \\ (p-2)^2+q^2+s^2=9\\ \\Rightarrow\\ p=1\\\\ &(q-2\\sqrt2)^2+s^2=16,\\ \\ q^2+s^2=8\\ \\Rightarrow\\ q=0,\\ s=2\\sqrt2\\end{aligned}' },
          { t: 'm', tex: '\\mathrm{C}(1,\\ 0,\\ 2\\sqrt2)' }] },
      { ask: { type: 'choice', q: '四面体 OABC の体積は？（底面 △OAB、高さは C の $z$ 座標）',
        opts: ['$\\dfrac{16}{3}$', '$\\dfrac{8\\sqrt2}{3}$', '$8$', '$\\dfrac{8}{3}$'], ok: 3,
        why: { 0: '底面積を $\\frac12$ せずに $4\\sqrt2$ としています。', 1: '高さを 2 としています。高さは C の $z$ 座標 $2\\sqrt2$ です。', 2: '錐体なので $\\frac13$ をかけます。' },
        good: '△OAB $=\\frac12\\cdot2\\cdot2\\sqrt2=2\\sqrt2$。$\\frac13\\cdot2\\sqrt2\\cdot2\\sqrt2=\\frac83$。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'V=\\frac13\\cdot2\\sqrt2\\cdot2\\sqrt2=\\frac83' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '(3) の座標で (2) を確かめます。K は OA の中点、L は OB を $1:2$、M は AC を $1:2$、N は BC の中点に分ける点です。',
        add: [{ t: 'h', text: '別の見方：座標で確かめる' },
          { t: 'm', size: 'sm', tex: '\\mathrm{K}(1,0,0),\\ \\mathrm{L}\\big(\\tfrac13,\\tfrac{2\\sqrt2}{3},0\\big),\\ \\mathrm{M}\\big(\\tfrac53,0,\\tfrac{2\\sqrt2}{3}\\big),\\ \\mathrm{N}(1,\\sqrt2,\\sqrt2)' },
          fig('f4', [quad].concat(tps(['K', 'L', 'M', 'N'])), 400)] },
      { ask: { type: 'think', q: '$\\overrightarrow{\\mathrm{KN}}=\\dfrac32\\overrightarrow{\\mathrm{KL}}+\\dfrac32\\overrightarrow{\\mathrm{KM}}$ を成分で確かめよう。(2) の $x,\\ y,\\ z$ にも値を入れてみよう。',
        hint: '$\\overrightarrow{\\mathrm{KL}}=\\left(-\\frac23,\\ \\frac{2\\sqrt2}{3},\\ 0\\right)$、$\\overrightarrow{\\mathrm{KM}}=\\left(\\frac23,\\ 0,\\ \\frac{2\\sqrt2}{3}\\right)$。',
        ans: '$\\frac32(\\overrightarrow{\\mathrm{KL}}+\\overrightarrow{\\mathrm{KM}})=(0,\\ \\sqrt2,\\ \\sqrt2)=\\overrightarrow{\\mathrm{KN}}$。(2) の式でも $x=-2,\\ y=z=\\frac32$（和は 1）',
        after: '実は4点 K, L, M, N は同じ円の上にもあります（ここでは証明しません）。' } },
      { say: '早稲田のねらいは「空間図形の認識」と「同一平面上にあるための条件」の理解。接点を内分点で表し、基準のベクトルを取りかえるのが山場でした。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: 'この問題の山場', text: '・接点 ＝ 中心どうしを半径の比に内分する点\n・$\\vec a,\\ \\vec b,\\ \\vec c$ を $\\vec k,\\ \\vec l,\\ \\vec m$ で表し直し、係数の和を計算' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間ベクトルの「内分点」「同一平面上」「座標で体積」は、どれも入試の定番の道具です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
