/* 2026 東大 理系 第5問の類題（自作）：単位円上の点をずらして3乗した点の軌跡 → 偏角で考える → 定数 α の範囲の面積
   問題：|z|=1 を1周する z に対し w=(z+α)³ がえがく図形 K。
   (1) α=a（a>1 の実数）。θ=arg(z+a)（−π/2<θ<π/2）について sin θ の範囲、K が虚軸の正の部分と共有点をもつ a の範囲
   (2) K が実軸の正の部分・虚軸の正の部分の両方と共有点をもつ α 全体の図形の面積
   答え（python3 で検算ずみ）：
   (1) u=z+a は中心 a・半径 1 の円。O からの接線の角 δ は sin δ=1/a、θ は −δ〜δ を連続に動く → −1/a≦sin θ≦1/a。
       虚軸の正の部分 ⇔ 3θ≡π/2（2π を法として）、θ∈(−π/2,π/2) では θ=π/6 だけ → δ≧π/6 ⇔ 1/a≧1/2 ⇔ 1<a≦2
   (2) 実軸の正 ⇔ arg u ∈{0, 2π/3, 4π/3}（A）、虚軸の正 ⇔ arg u ∈{π/6, 5π/6, 3π/2}（B）。
       |α|≦1 ならいつも OK。|α|=ρ>1、arg α=φ では arg u は [φ−δ, φ+δ]（sin δ=1/ρ）。A と B を1つずつふくむ条件。
       2π/3 回転で変わらないので −π/6≦φ≦π/2 を調べる：必要な δ は
         −π/6〜π/12：π/6−φ ／ π/12〜π/3：φ ／ π/3〜5π/12：2π/3−φ ／ 5π/12〜π/2：φ−π/6
       境界 ρ sin δ=1 は O から距離 1 の直線（半直線に平行）。頂点 (1,−1/√3)、(2+√3,1)、(1/√3,1)、((√3−1)/2,(√3+1)/2)、(0,2/√3)
       1/3 の面積 = 2(1+√3/3)+2(1/2−√3/6) = 3+√3/3 → 全体 9+√3（≈10.732）
       （くつひもの公式・極座標の積分・モンテカルロ（10.69±0.05）・4000 点の判定（食いちがい 0）で確認）
   誤答：1/3 だけ 3+√3/3、単位円を二重に足す 9+√3+π、1/2 を忘れる 18+2√3 */
(function () {
  const PI = Math.PI, r3 = Math.sqrt(3), pol = (r, p) => [r * Math.cos(p), r * Math.sin(p)];
  const A_ANG = [0, 2 * PI / 3, 4 * PI / 3], B_ANG = [PI / 6, 5 * PI / 6, 3 * PI / 2];
  const ray = (p, H, c, wd) => { const L = H * 0.97 / Math.max(Math.abs(Math.cos(p)), Math.abs(Math.sin(p))); return { k: 'seg', a: [0, 0], b: pol(L, p), c, wd: wd || 3 }; };
  const rays = (H, wd) => A_ANG.map(p => ray(p, H, 'y', wd)).concat(B_ANG.map(p => ray(p, H, 'p', wd)));
  const cplx = (H, extra, s) => ({ t: 'fig', id: extra.id, col: 1, view: [-H, -H, H, H], w: s || 470, h: s || 470,
    items: [{ k: 'axes', xl: '実軸', yl: '虚軸', tx: [], ty: [] }].concat(extra.items) });
  // (2) の図形の頂点（1/3 ぶんを 2π/3 ずつ回す）
  const BASE = [[2 / r3, -PI / 6], [Math.sqrt(6) + Math.SQRT2, PI / 12], [2 / r3, PI / 3], [Math.SQRT2, 5 * PI / 12]];
  const VERT = [0, 1, 2].map(k => BASE.map(([r, p]) => pol(r, p + 2 * PI * k / 3))).flat();
  const third = [[0, 0]].concat(BASE.map(([r, p]) => pol(r, p)), [pol(2 / r3, PI / 2)]);
  // (1) の図（a = 1.8）
  const a1 = 1.8, d1 = Math.asin(1 / a1), T1 = pol(Math.cos(d1) * a1, d1), T2 = pol(Math.cos(d1) * a1, -d1);
  const POINTS = [
    '$w=u^3$ は **偏角が3倍**。「$w$ が正の実数」「$w$ が正の虚数」は、$u$ の偏角が決まった値になることに言いかえる',
    '原点をふくまない半径 1 の円の上を $u$ が動くとき、$\\arg u$ は中心の偏角 $\\varphi$ から $\\pm\\delta$（$\\sin\\delta=\\dfrac{1}{|\\alpha|}$）の範囲。接線と直角三角形で読む',
    '偏角の条件 $|\\alpha|\\sin(\\text{ずれ})\\le1$ は「半直線から距離 1 以内」。境界は O から距離 1 の直線なので、面積は **高さ 1 の三角形** に分けて求められる'
  ];

  HB.lesson({
    id: 'ut26-5', field: '東大型　数学（理系）', title: '2026 東大 理系 第5問の類題 ― ずらして3乗した点の軌跡と、偏角の範囲', level: '2026年度 東京大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '$\\alpha$ を複素数の定数とする。複素数平面上で、点 $z$ が単位円 $|z|=1$ 上を1周するとき、$w=(z+\\alpha)^3$ で表される点 $w$ がえがく図形を $K$ とする。',
      parts: [
        '(1)　$\\alpha=a$（$a$ は $a>1$ をみたす実数）とする。$z+a$ の偏角を $\\theta\\ \\left(-\\dfrac{\\pi}{2}<\\theta<\\dfrac{\\pi}{2}\\right)$ とするとき、$\\sin\\theta$ のとりうる値の範囲を求めよ。また、$K$ が虚軸の正の部分と共有点をもつような $a$ の値の範囲を求めよ。',
        '(2)　$K$ が実軸の正の部分と虚軸の正の部分の両方と共有点をもつような点 $\\alpha$ 全体が表す図形の面積を求めよ。'
      ],
      src: '※ 2026年度 東京大学 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '複素数平面の軌跡の問題です。$w$ の式をそのまま追うと大変。**偏角** に注目して言いかえるのがカギです。まず問題文を読みましょう。（問題文は Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$u=z+\\alpha$ とおくと、$u$ は中心 $\\alpha$、半径 1 の円の上を動き、$w=u^3$。3乗すると、絶対値は3乗、**偏角は3倍** になります。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'm', tex: 'u=z+\\alpha\\ \\ (|u-\\alpha|=1),\\qquad w=u^3' },
          { t: 'm', tex: '|w|=|u|^3,\\qquad \\arg w=3\\arg u' },
          { t: 'p', size: 'sm', text: '$w$ が実軸の正の部分 ⇔ $u\\neq0$ かつ $3\\arg u=2k\\pi$\n→ $\\arg u=0,\\ \\dfrac{2\\pi}{3},\\ \\dfrac{4\\pi}{3}$　（[[y:黄の半直線]]）' },
          cplx(2.6, { id: 'r1', items: rays(2.6) })] },
      { ask: { type: 'choice', q: '$w=u^3$ が **虚軸の正の部分** にあるための、$u$ の偏角の条件は？（$0\\le\\arg u<2\\pi$）',
        opts: ['$\\arg u=\\dfrac{\\pi}{6}$ だけ', '$\\arg u=\\dfrac{\\pi}{2}$', '$\\arg u=\\dfrac{\\pi}{6},\\ \\dfrac{5\\pi}{6},\\ \\dfrac{3\\pi}{2}$', '$\\arg u=\\dfrac{\\pi}{6},\\ \\dfrac{\\pi}{2},\\ \\dfrac{5\\pi}{6}$'], ok: 2,
        why: { 0: '$3\\arg u=\\frac{\\pi}{2}+2k\\pi$。$k=1,\\ 2$ の分も忘れずに。', 1: '$u$ の偏角が $\\frac{\\pi}{2}$ だと、$w$ の偏角は $\\frac{3\\pi}{2}$（虚軸の負の部分）です。', 3: '$\\frac{\\pi}{2}\\times3=\\frac{3\\pi}{2}$ は負の部分。$2\\pi$ ずつではなく $\\frac{2\\pi}{3}$ ずつずらします。' },
        good: '$3\\arg u=\\frac{\\pi}{2}+2k\\pi$ より $\\arg u=\\frac{\\pi}{6}+\\frac{2k\\pi}{3}$。桃色の3本の半直線です。',
        add: [{ t: 'p', size: 'sm', text: '$w$ が虚軸の正の部分 ⇔ $\\arg u=\\dfrac{\\pi}{6},\\ \\dfrac{5\\pi}{6},\\ \\dfrac{3\\pi}{2}$（{{桃の半直線}}）' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\alpha=a>1$ のとき、$u$ の円は中心 $a$、半径 1 で、原点をふくみません。原点から円に2本の接線を引くと、$\\theta$ はその間を動きます。',
        add: [{ t: 'h', text: '(1)　θ の範囲' },
          { t: 'p', size: 'sm', text: '接線と円の接点で直角。\n直角三角形の斜辺は $a$（O と中心）、向かいの辺は半径 1' },
          { t: 'fig', id: 'c1', col: 1, view: [-0.45, -1.55, 3.15, 1.55], w: 480, h: 413, items: [
            { k: 'axes', xl: '実軸', yl: '虚軸', tx: [[a1, 'a']], ty: [] },
            { k: 'circle', o: [a1, 0], r: 1, c: 'w', wd: 3 },
            { k: 'seg', a: [0, 0], b: pol(3.05, d1), c: 'b', wd: 2.5 }, { k: 'seg', a: [0, 0], b: pol(3.05, -d1), c: 'b', wd: 2.5 },
            { k: 'seg', a: [a1, 0], b: T1, c: 'g', wd: 2.5 }, { k: 'right', o: T1, a: [0, 0], b: [a1, 0], c: 'g' },
            { k: 'label', at: [(a1 + T1[0]) / 2, T1[1] / 2], text: '1', c: 'g', dx: 14, dy: -4, size: 22 },
            { k: 'angle', o: [0, 0], a: [1, 0], b: T1, rp: 62, label: 'δ', c: 'y' },
            { k: 'pt', at: [a1, 0], c: 'w', r: 4 }] }] },
      { ask: { type: 'choice', q: '$\\sin\\theta$ のとりうる値の範囲は？',
        opts: ['$|\\sin\\theta|\\le\\frac1a$', '$|\\sin\\theta|\\le\\frac{1}{a-1}$', '$0\\le\\sin\\theta\\le\\frac1a$', '$|\\sin\\theta|\\le\\frac{\\sqrt{a^2-1}}{a}$'], ok: 0,
        why: { 1: '$a-1$ は O から円までの最短距離。直角三角形の斜辺は、中心までの $a$ です。', 2: '$\\theta$ は負の側（下の接線）まで動きます。', 3: 'それは $\\cos\\delta$ です。向かいの辺は 1 です。' },
        good: '$\\sin\\delta=\\frac1a$。$\\theta$ は $-\\delta$ から $\\delta$ まで連続に動き、そこで $\\sin$ は増加します。',
        add: [{ t: 'm', tex: '\\sin\\delta=\\frac1a,\\qquad -\\delta\\le\\theta\\le\\delta' },
          { t: 'ans', label: '(1) 答 前半', tex: '-\\frac1a\\le\\sin\\theta\\le\\frac1a' }] } },

      { clear: true, cols: [0.54, 0.46], say: '後半。$K$ が虚軸の正の部分と出会う ⇔ $3\\theta=\\dfrac{\\pi}{2}+2k\\pi$ となる $\\theta$ がある。$-\\dfrac{\\pi}{2}<\\theta<\\dfrac{\\pi}{2}$ では $\\theta=\\dfrac{\\pi}{6}$ だけなので、$\\delta\\ge\\dfrac{\\pi}{6}$ が条件です。',
        add: [{ t: 'h', text: '(1)　つづき：虚軸の正の部分' },
          { t: 'm', tex: '3\\theta=\\frac{\\pi}{2}+2k\\pi,\\ \\ -\\frac{\\pi}{2}<\\theta<\\frac{\\pi}{2}\\ \\Longrightarrow\\ \\theta=\\frac{\\pi}{6}' },
          { t: 'm', tex: '\\frac{\\pi}{6}\\le\\delta\\iff\\frac12\\le\\sin\\delta=\\frac1a' },
          { t: 'fig', id: 'c2', col: 1, view: [-0.45, -1.55, 3.15, 1.55], w: 480, h: 413, items: [
            { k: 'axes', xl: '実軸', yl: '虚軸', tx: [[a1, 'a']], ty: [] },
            { k: 'circle', o: [a1, 0], r: 1, c: 'w', wd: 3 },
            { k: 'seg', a: [0, 0], b: pol(3.05, d1), c: 'b', wd: 2 }, { k: 'seg', a: [0, 0], b: pol(3.05, -d1), c: 'b', wd: 2 },
            { k: 'seg', a: [0, 0], b: pol(3.05, PI / 6), c: 'p', wd: 3.5 }, { k: 'label', at: pol(2.95, PI / 6), text: 'π/6', c: 'p', dy: -22, size: 22 },
            { k: 'pt', at: [a1, 0], c: 'w', r: 4 }] }] },
      { ask: { type: 'choice', q: '$K$ が虚軸の正の部分と共有点をもつ $a$ の範囲は？',
        opts: ['$1<a<2$', '$a\\ge2$', '$1<a\\le\\dfrac{2}{\\sqrt3}$', '$1<a\\le2$'], ok: 3,
        why: { 0: '$a=2$ では、半直線 $\\theta=\\frac{\\pi}{6}$ が円にちょうど接します。接点で共有点をもつので、ふくみます。', 1: '不等号が逆。$a$ が大きいほど円が遠くなり、$\\theta$ の範囲はせまくなります。', 2: 'それは $\\delta\\ge\\frac{\\pi}{3}$ の条件。必要なのは $\\frac{\\pi}{6}$ までです。' },
        good: '$\\dfrac1a\\ge\\dfrac12\\iff a\\le2$。$a>1$ と合わせて $1<a\\le2$。',
        add: [{ t: 'ans', label: '(1) 答 後半', tex: '1<a\\le2' }] } },

      // ---------- (2) 場合分け ----------
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '(2) です。$\\alpha$ の位置で場合分けします。$|\\alpha|<1$ なら円は原点を内側にふくみ、$u$ はすべての偏角をとるので、条件はいつもみたされます。',
        add: [{ t: 'h', text: '(2)　α の場合分け' },
          { t: 'p', size: 'sm', text: '・$|\\alpha|<1$：$u$ はすべての偏角をとる → OK\n・$|\\alpha|=1$：円は O を通る。$u\\neq0$ の偏角は、はば $\\pi$ の区間。\n　黄も桃も $\\frac{2\\pi}{3}$ おきなので、どちらもふくむ → OK' }] },
      { ask: { type: 'choice', q: '$|\\alpha|=\\rho>1,\\ \\arg\\alpha=\\varphi$ のとき、$\\arg u$ の範囲は？',
        opts: ['$-\\delta\\le\\arg u\\le\\delta$', '$\\varphi-\\delta\\le\\arg u\\le\\varphi+\\delta$（$\\sin\\delta=\\frac1\\rho$）', '$\\varphi\\le\\arg u\\le\\varphi+\\delta$', '$\\varphi-\\delta\\le\\arg u\\le\\varphi+\\delta$（$\\cos\\delta=\\frac1\\rho$）'], ok: 1,
        why: { 0: 'それは中心が正の実軸上（$\\varphi=0$）のとき。中心の向き $\\varphi$ のまわりに広がります。', 2: '中心の向きから両側に $\\delta$ ずつ広がります。', 3: '(1) と同じ直角三角形で、$\\sin\\delta=\\frac{1}{\\rho}$ です。' },
        good: '(1) の図を、原点のまわりに $\\varphi$ だけ回したもの。$\\delta$ は $\\rho$ が大きいほど小さくなります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '条件', text: '区間 $[\\varphi-\\delta,\\ \\varphi+\\delta]$ が、[[y:黄の角]]（$0,\\frac{2\\pi}{3},\\frac{4\\pi}{3}$）と\n{{桃の角}}（$\\frac{\\pi}{6},\\frac{5\\pi}{6},\\frac{3\\pi}{2}$）を1つずつふくむ' }] } },

      // ---------- (2) 必要な δ ----------
      { clear: true, cols: [0.54, 0.46], say: '黄と桃の角の配置は、$\\dfrac{2\\pi}{3}$ 回すと元と重なります。だから $-\\dfrac{\\pi}{6}\\le\\varphi\\le\\dfrac{\\pi}{2}$ だけ調べて、3倍すればよいのです。まず $\\varphi=\\dfrac{\\pi}{12}$ を考えます。',
        add: [{ t: 'h', text: '(2)　つづき：必要な δ' },
          { t: 'p', size: 'sm', text: '$\\varphi=\\dfrac{\\pi}{12}$（黄 $0$ と 桃 $\\dfrac{\\pi}{6}$ のまん中）のとき' },
          cplx(4.2, { id: 'r2', items: rays(4.2, 2.5).concat([{ k: 'circle', o: pol(Math.sqrt(6) + Math.SQRT2, PI / 12), r: 1, c: 'w', wd: 3 }, { k: 'pt', at: pol(Math.sqrt(6) + Math.SQRT2, PI / 12), c: 'w', r: 5, name: 'α', dir: 'n', size: 24 },
            { k: 'seg', a: [0, 0], b: pol(Math.sqrt(6) + Math.SQRT2, PI / 12), c: 'w', wd: 1.5, dash: true }]) }, 480)] },
      { ask: { type: 'choice', q: '$\\varphi=\\dfrac{\\pi}{12}$ のとき、条件をみたすのに必要な $\\delta$ の大きさは？',
        opts: ['$\\delta\\ge\\dfrac{\\pi}{12}$', '$\\delta\\ge\\dfrac{\\pi}{6}$', '$\\delta\\ge\\dfrac{\\pi}{24}$', '$\\delta\\ge\\dfrac{\\pi}{4}$'], ok: 0,
        why: { 1: '$\\varphi$ から見て、$0$ も $\\frac{\\pi}{6}$ も $\\frac{\\pi}{12}$ はなれているだけです。', 2: '区間は $\\varphi$ の両側に $\\delta$ ずつ。$\\frac{\\pi}{12}$ はなれた角まで届く必要があります。', 3: 'それは桃 $\\frac{\\pi}{6}$ と 黄 $\\frac{2\\pi}{3}$ の組を使うとき。もっと近い組があります。' },
        good: '$\\delta\\ge\\dfrac{\\pi}{12}$、つまり $\\rho\\le\\dfrac{1}{\\sin\\frac{\\pi}{12}}=\\sqrt6+\\sqrt2\\approx3.86$。図の円は、ちょうど2本の半直線に接しています。' } },
      { say: '同じように、$\\varphi$ ごとに「いちばん近い黄と桃の組」に届く $\\delta$ を求めると、表のようになります。$\\rho\\sin\\delta=1$ が境界です。',
        add: [{ t: 'tbl', size: 'sm', cls: 'rowh', rows: [['$\\varphi$ の範囲', '届く組', '必要な $\\delta$'],
          ['$-\\frac{\\pi}{6}\\sim\\frac{\\pi}{12}$', '$0,\\ \\frac{\\pi}{6}$', '$\\frac{\\pi}{6}-\\varphi$'], ['$\\frac{\\pi}{12}\\sim\\frac{\\pi}{3}$', '$0,\\ \\frac{\\pi}{6}$', '$\\varphi$'],
          ['$\\frac{\\pi}{3}\\sim\\frac{5\\pi}{12}$', '$\\frac{\\pi}{6},\\ \\frac{2\\pi}{3}$', '$\\frac{2\\pi}{3}-\\varphi$'], ['$\\frac{5\\pi}{12}\\sim\\frac{\\pi}{2}$', '$\\frac{\\pi}{6},\\ \\frac{2\\pi}{3}$', '$\\varphi-\\frac{\\pi}{6}$']] }] },

      // ---------- (2) 図形と面積 ----------
      { clear: true, cols: [0.5, 0.5], say: 'たとえば $\\frac{\\pi}{12}\\le\\varphi\\le\\frac{\\pi}{3}$ の境界は $\\rho\\sin\\varphi=1$、つまり直線 $y=1$。どの境界も「半直線に平行で、O から距離 1 の直線」です。図形は右の 12 角形になります。',
        add: [{ t: 'h', text: '(2)　つづき：α の図形' },
          { t: 'm', size: 'sm', tex: '\\rho\\sin(\\text{ずれ})=1', note: '← 半直線との距離が 1' },
          { t: 'p', size: 'sm', text: '1/3 の部分の頂点（$\\varphi$ の小さい順）\n$\\left(1,\\ -\\frac{1}{\\sqrt3}\\right),\\ (2+\\sqrt3,\\ 1),\\ \\left(\\frac{1}{\\sqrt3},\\ 1\\right)$,\n$\\left(\\frac{\\sqrt3-1}{2},\\ \\frac{\\sqrt3+1}{2}\\right),\\ \\left(0,\\ \\frac{2}{\\sqrt3}\\right)$' },
          cplx(4.2, { id: 'r3', items: rays(4.2, 2).concat([{ k: 'poly', pts: VERT, close: true, c: 'g', fill: 'g', alpha: 0.3, wd: 3 },
            { k: 'poly', pts: third, close: true, c: 'w', wd: 1.5, dash: true }, { k: 'circle', o: [0, 0], r: 1, c: 'd', dash: true, wd: 2 }]) }, 470)] },
      { ask: { type: 'think', q: '点線で囲んだ 1/3 の部分の面積を、O を頂点とする三角形に分けて求めよう。',
        hint: '境界の辺はどれも O から距離 1 の直線の上。三角形の面積＝（辺の長さ）×1÷2。$y=1$ 上の辺の長さは $2+\\sqrt3-\\frac{1}{\\sqrt3}$。',
        ans: '辺の長さは $2+\\frac{2}{\\sqrt3}$ が2本、$1-\\frac{1}{\\sqrt3}$ が2本。面積は $\\frac12\\left\\{2\\left(2+\\frac{2}{\\sqrt3}\\right)+2\\left(1-\\frac{1}{\\sqrt3}\\right)\\right\\}=3+\\frac{\\sqrt3}{3}$',
        after: '単位円（$|\\alpha|\\le1$）はこの図形の内側に入っているので、別に足す必要はありません。' } },
      { ask: { type: 'choice', q: '求める図形の面積は？',
        opts: ['$3+\\dfrac{\\sqrt3}{3}$', '$9+\\sqrt3$', '$9+\\sqrt3+\\pi$', '$18+2\\sqrt3$'], ok: 1,
        why: { 0: 'それは 1/3 の部分だけ。3倍します。', 2: '単位円はすでに図形の内側。$\\pi$ を二重に足しています。', 3: '三角形の面積の $\\frac12$ を忘れています（それは周の長さ）。' },
        good: '$3\\left(3+\\dfrac{\\sqrt3}{3}\\right)=9+\\sqrt3\\approx10.73$。',
        add: [{ t: 'ans', label: '(2) 答', tex: '9+\\sqrt3' }] } },
      { say: '別の見方：境界はすべて O から距離 1 の直線なので、面積 ＝ 周の長さ × 1 ÷ 2。周は $18+2\\sqrt3$ で、面積は $9+\\sqrt3$。(1) で見た $a\\le2$ は、図形が正の実軸と交わる点 $\\alpha=2$ に表れています。',
        draw: [{ fig: 'r3', items: [{ k: 'pt', at: [2, 0], c: 'y', name: '2', dir: 'se', size: 22 }] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数の累乗は「偏角を何倍」。偏角の範囲は、接線と直角三角形で。東大の複素数平面の定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
