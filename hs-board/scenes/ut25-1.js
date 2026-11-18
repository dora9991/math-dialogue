/* 2025 東大 理系 第1問の類題（自作）：正六角形の3辺を同じ比で3段内分してできる曲線（ベジェ曲線）の座標・面積・長さ
   問題：A(0,0) B(1,√3) C(3,√3) D(4,0)（1辺 2 の正六角形の連続する4頂点）。AB, BC, CD を t:(1−t) に内分 → P, Q, R、
         PQ, QR → S, T、ST → U。U の描く曲線 L。
   答え（python3・sympy で検算ずみ）：
   (1) P(t, √3t)、Q(1+2t, √3)、R(3+t, √3(1−t))、S(2t+t², √3(2t−t²))、T(1+4t−t², √3(1−t²))
       U(3t+3t²−2t³, 3√3 t(1−t))。t=1/2 で (2, 3√3/4)
   (2) dx/dt=3(1+2u)（u=t−t²）>0、y=3√3u。S=9√3∫(u+2u²)dt=9√3(1/6+1/15)=21√3/10（≈3.637、六角形の半分 3√3 の 7/10）
   (3) (dx/dt)²+(dy/dt)²=9(1+2u)²+27(1−4u)=36(1−u)²、長さ=∫6(1−t+t²)dt=5（数値積分でも 5.0000）
   誤答：∫y dt=3√3/2・…、√ をそのまま足す 3(1+2u)+3√3(1−2t) など */
(function () {
  const r3 = Math.sqrt(3), A = [0, 0], B = [1, r3], C = [3, r3], D = [4, 0], E = [3, -r3], F = [1, -r3];
  const lerp = (X, Y, t) => [X[0] + t * (Y[0] - X[0]), X[1] + t * (Y[1] - X[1])];
  const t0 = 0.4, P = lerp(A, B, t0), Q = lerp(B, C, t0), R = lerp(C, D, t0), S = lerp(P, Q, t0), T = lerp(Q, R, t0), U = lerp(S, T, t0);
  const Lx = '3*t+3*t**2-2*t**3', Ly = '3*sqrt(3)*t*(1-t)';
  const curve = (o) => Object.assign({ k: 'param', x: Lx, y: Ly, a: 0, b: 1, c: 'p', wd: 4 }, o || {});
  const half = [{ k: 'poly', pts: [A, B, C, D], c: 'w' }, { k: 'seg', a: A, b: D, c: 'd', dash: true },
    { k: 'pt', at: A, name: 'A', dir: 'sw' }, { k: 'pt', at: B, name: 'B', dir: 'n' }, { k: 'pt', at: C, name: 'C', dir: 'n' }, { k: 'pt', at: D, name: 'D', dir: 'se' }];
  const steps3 = [
    { k: 'seg', a: P, b: Q, c: 'b', wd: 2 }, { k: 'seg', a: Q, b: R, c: 'b', wd: 2 }, { k: 'seg', a: S, b: T, c: 'g', wd: 2 },
    { k: 'pt', at: P, name: 'P', dir: 'w', c: 'b', size: 22 }, { k: 'pt', at: Q, name: 'Q', dir: 'n', c: 'b', size: 22 }, { k: 'pt', at: R, name: 'R', dir: 'e', c: 'b', size: 22 },
    { k: 'pt', at: S, name: 'S', dir: 'nw', c: 'g', size: 22 }, { k: 'pt', at: T, name: 'T', dir: 'ne', c: 'g', size: 22 }, { k: 'pt', at: U, name: 'U', dir: 's', c: 'p', size: 24 }];
  const VIEW = [-0.45, -0.45, 4.45, 2.15];
  const fig = (id, items, w) => ({ t: 'fig', id, col: 1, view: VIEW, w: w || 600, h: Math.round((w || 600) * 2.6 / 4.9), items });
  const POINTS = [
    '内分点は $(1-t)\\mathrm{X}+t\\mathrm{Y}$。**1段ずつ** 座標を出して、最後に $t=0,\\ \\frac12,\\ 1$ を入れて検算する',
    '媒介変数の曲線の面積は $\\displaystyle\\int y\\,dx=\\int_0^1 y\\,\\frac{dx}{dt}\\,dt$。$x$ が増加することを確かめてから使う',
    '曲線の長さは $\\displaystyle\\int\\sqrt{\\Big(\\frac{dx}{dt}\\Big)^2+\\Big(\\frac{dy}{dt}\\Big)^2}\\,dt$。$u=t-t^2$ でまとめると **完全平方** になり、根号が外れる'
  ];

  HB.lesson({
    id: 'ut25-1', field: '東大型　数学（理系）', title: '2025 東大 理系 第1問の類題 ― 正六角形から生まれる曲線の面積と長さ', level: '2025年度 東京大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上の4点 $\\mathrm{A}(0,\\,0)$，$\\mathrm{B}(1,\\,\\sqrt3)$，$\\mathrm{C}(3,\\,\\sqrt3)$，$\\mathrm{D}(4,\\,0)$ は、1辺の長さが 2 の正六角形の連続する4つの頂点である。$0\\le t\\le1$ を満たす実数 $t$ に対し、線分 AB，BC，CD を $t:(1-t)$ に内分する点をそれぞれ P，Q，R、線分 PQ，QR を $t:(1-t)$ に内分する点をそれぞれ S，T、線分 ST を $t:(1-t)$ に内分する点を U とする（$t=0$ のときは線分の始めの点、$t=1$ のときは終わりの点とする）。$t$ が 0 から 1 まで動くとき、U が描く曲線を $L$ とする。',
      parts: [
        '(1)　U の座標を $t$ を用いて表せ。',
        '(2)　曲線 $L$ と線分 AD で囲まれた部分の面積を求めよ。',
        '(3)　曲線 $L$ の長さを求めよ。'
      ],
      src: '※ 2025年度 東京大学 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '辺を同じ比で内分する操作を3段くり返して、点 U の描く曲線を調べる問題です。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },
      { clear: true, part: '読みかえ', say: '図は $t=0.4$ のときです。青の P，Q，R から緑の S，T、さらに桃の U ができます。$t$ を動かすと U は桃の曲線 $L$ をかきます。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: '1段目：辺 AB，BC，CD の上に P，Q，R\n2段目：PQ，QR の上に S，T\n3段目：ST の上に U' },
          { t: 'p', size: 'sm', text: '$t=0$ で U＝A、$t=1$ で U＝D。\n$L$ は A から D までの曲線（$L$ と AD で囲まれた部分が (2)）' },
          fig('f0', [{ k: 'poly', pts: [D, E, F, A], c: 'd', dash: true }].concat(half, [curve({ label: 'L', lat: [2, 0.8], la: 'middle' })], steps3), 600)] },
      { ask: { type: 'choice', q: '(1) で U の座標を出すのに、いちばん確実な方針は？',
        opts: ['内分点の公式で、P，Q，R → S，T → U と1段ずつ', '直線 PQ と直線 QR の方程式を立てて交点を求める', '$t=0,\\ \\frac12,\\ 1$ の3点を求めて、2次関数でつなぐ', '∠UAD を θ とおいて三角関数で表す'], ok: 0,
        why: { 1: 'S，T は交点ではなく内分点。連立はいりません。', 2: '答えは $t$ の3次式。3点では決まりません。', 3: '角と $t$ は簡単な関係になく、複雑になります。' },
        good: '定義どおり、内分点の公式を3回使います。' } },

      // ---------- (1) ----------
      { clear: true, cols: [0.6, 0.4], part: '(1)', say: '線分 XY を $t:(1-t)$ に内分する点は $(1-t)\\mathrm{X}+t\\mathrm{Y}$。まず1段目の P，Q，R です。',
        add: [{ t: 'h', text: '(1)　U の座標' },
          { t: 'box', c: 'b', size: 'sm', label: '内分点', text: 'XY を $t:(1-t)$ に内分 → $(1-t)\\mathrm{X}+t\\mathrm{Y}$' },
          { t: 'm', size: 'sm', tex: '\\mathrm{P}(t,\\ \\sqrt3\\,t),\\quad \\mathrm{Q}(1+2t,\\ \\sqrt3),\\quad \\mathrm{R}(3+t,\\ \\sqrt3(1-t))' },
          fig('f1', half.concat(steps3), 520)] },
      { ask: { type: 'choice', q: '2段目の点 S（PQ を $t:(1-t)$ に内分）の座標は？',
        opts: ['$(1+3t,\\ \\sqrt3(1+t))$', '$(t^2+2t,\\ \\sqrt3\\,t^2)$', '$(t^2+2t,\\ \\sqrt3(2t-t^2))$', '$(2t-t^2,\\ \\sqrt3(t^2+2t))$'], ok: 2,
        why: { 0: 'P と Q を足しただけです。$(1-t)\\mathrm{P}+t\\mathrm{Q}$ と重みをつけます。', 1: '$y$ は $(1-t)\\sqrt3\\,t+t\\cdot\\sqrt3=\\sqrt3(2t-t^2)$ です。', 3: '$x$ と $y$ の式が入れかわっています。$x=(1-t)t+t(1+2t)$。' },
        good: '$x=(1-t)t+t(1+2t)=t^2+2t$、$y=(1-t)\\sqrt3\\,t+\\sqrt3\\,t=\\sqrt3(2t-t^2)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{S}(t^2+2t,\\ \\sqrt3(2t-t^2))' }] } },
      { say: '同じように T を出します。そして U は ST を $t:(1-t)$ に内分する点。$x$ も $y$ も、$t$ の3次以下の式になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{T}(-t^2+4t+1,\\ \\sqrt3(1-t^2))' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}x&=(1-t)(t^2+2t)+t(-t^2+4t+1)=-2t^3+3t^2+3t\\\\ y&=\\sqrt3\\{(1-t)(2t-t^2)+t(1-t^2)\\}=3\\sqrt3\\,t(1-t)\\end{aligned}' }] },
      { say: '検算：$t=0$ で (0, 0)＝A、$t=1$ で (4, 0)＝D、$t=\\frac12$ で $\\left(2,\\ \\frac{3\\sqrt3}{4}\\right)$。図の対称の軸 $x=2$ の上に来ます。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{U}\\left(-2t^3+3t^2+3t,\\ \\ 3\\sqrt3\\,t(1-t)\\right)' }],
        draw: [{ fig: 'f1', items: [curve({ label: 'L', lat: [2, 0.8], la: 'middle' }), { k: 'pt', at: [2, 3 * r3 / 4], c: 'y', r: 5 }] }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.58, 0.42], part: '(2)', say: '(2) は $L$ と AD（$x$ 軸）で囲まれた部分の面積。$L$ は $x$ 軸より上にあるので、$\\int_0^4 y\\,dx$ を $t$ の積分に直します。',
        add: [{ t: 'h', text: '(2)　L と AD で囲まれた面積' },
          { t: 'p', size: 'sm', text: '$0<t<1$ で $y=3\\sqrt3\\,t(1-t)>0$' },
          fig('f2', half.concat([{ k: 'poly', pts: Array.from({ length: 61 }, (_, i) => { const t = i / 60; return [3 * t + 3 * t * t - 2 * t ** 3, 3 * r3 * t * (1 - t)]; }), close: true, fill: 'y', alpha: 0.3, noStroke: true }, curve({ label: 'L', lat: [2, 0.8], la: 'middle' })]), 520)] },
      { ask: { type: 'choice', q: '面積 $S$ を $t$ の積分で表すと？',
        opts: ['$\\displaystyle\\int_0^4 y\\,dt$', '$\\displaystyle\\int_0^1 y\\,dt$', '$\\displaystyle\\int_0^1 x\\,\\frac{dy}{dt}\\,dt$', '$\\displaystyle\\int_0^1 y\\,\\frac{dx}{dt}\\,dt$'], ok: 3,
        why: { 0: '$t$ の範囲は 0〜1 です。4 は $x$ の範囲です。', 1: '$dx$ を $dt$ に変えるとき、$\\frac{dx}{dt}$ がかかります（置換積分）。', 2: 'それは $\\int x\\,dy$。縦に切った帯の面積は $y\\,dx$ です。' },
        good: '置換積分で $dx=\\frac{dx}{dt}dt$。$x$ が 0→4 のとき $t$ は 0→1 です。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\int_0^4 y\\,dx=\\int_0^1 y\\,\\frac{dx}{dt}\\,dt' }] } },
      { say: 'ただし、$x$ が $t$ について増加（1対1）であることを確かめておきます。$u=t-t^2$ とおくと式がすっきりします。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{dx}{dt}=-6t^2+6t+3=3(1+2u)>0', note: '$u=t-t^2$\n$0\\le u\\le\\frac14$' },
          { t: 'm', size: 'sm', tex: 'y=3\\sqrt3\\,t(1-t)=3\\sqrt3\\,u' }] },
      { say: 'よって $S=9\\sqrt3\\int_0^1(u+2u^2)\\,dt$。$u=t(1-t)$ の積分は $\\frac16$、$u^2=t^2(1-t)^2$ の積分は $\\frac1{30}$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\int_0^1 3\\sqrt3\\,u\\cdot3(1+2u)\\,dt=9\\sqrt3\\int_0^1(u+2u^2)\\,dt' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '使う積分', text: '$\\displaystyle\\int_0^1 t(1-t)\\,dt=\\frac16$\n$\\displaystyle\\int_0^1 t^2(1-t)^2\\,dt=\\frac1{30}$' }] },
      { ask: { type: 'choice', q: '面積 $S$ はいくつ？',
        opts: ['$\\dfrac{3\\sqrt3}{2}$', '$\\dfrac{21\\sqrt3}{10}$', '$\\dfrac{9\\sqrt3}{5}$', '$3\\sqrt3$'], ok: 1,
        why: { 0: '$9\\sqrt3\\cdot\\frac16$ だけで、$2u^2$ の項を落としています。', 2: '$2u^2$ の 2 を落として $\\frac16+\\frac1{30}=\\frac15$ としています。', 3: 'それは台形 ABCD（六角形の半分）の面積。曲線はその内側です。' },
        good: '$9\\sqrt3\\left(\\frac16+\\frac1{15}\\right)=9\\sqrt3\\cdot\\frac{7}{30}=\\frac{21\\sqrt3}{10}$。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'S=\\frac{21\\sqrt3}{10}' }] } },
      { say: '確かめ：台形 ABCD の面積は $3\\sqrt3$。$S$ はその $\\frac{7}{10}$ で、図の黄色の広さと合っています。',
        add: [{ t: 'p', col: 1, size: 'sm', text: '台形 ABCD $=3\\sqrt3\\fallingdotseq5.20$\n$S\\fallingdotseq3.64$（$\\frac{7}{10}$ 倍）' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: '(3) は曲線の長さ。公式に入れる $\\frac{dx}{dt}$ と $\\frac{dy}{dt}$ を、(2) の $u=t-t^2$ を使って書いておきます。',
        add: [{ t: 'h', text: '(3)　L の長さ' },
          { t: 'box', c: 'b', size: 'sm', label: '曲線の長さ', text: '$\\displaystyle\\int_0^1\\sqrt{\\Big(\\frac{dx}{dt}\\Big)^2+\\Big(\\frac{dy}{dt}\\Big)^2}\\,dt$' },
          { t: 'm', size: 'sm', tex: '\\frac{dx}{dt}=3(1+2u),\\qquad \\frac{dy}{dt}=3\\sqrt3(1-2t)' },
          fig('f3', half.concat([curve({ label: 'L', lat: [2, 0.8], la: 'middle' })]), 480)] },
      { ask: { type: 'choice', q: '根号の中 $9(1+2u)^2+27(1-2t)^2$ を簡単にするための、いちばんのカギは？',
        opts: ['$t=\\sin\\theta$ とおいて置換する', '$\\sqrt{a^2+b^2}=a+b$ と根号を外す', '$t$ の4次式に展開して、そのまま積分する', '$(1-2t)^2=1-4u$ と、$u$ だけの式に直す'], ok: 3,
        why: { 0: '$\\sqrt{1-t^2}$ の形ではないので、効果がありません。', 1: '$\\sqrt{a^2+b^2}=a+b$ は成り立ちません（$\\sqrt{3^2+4^2}=5\\ne7$）。', 2: '$\\sqrt{4\\text{次式}}$ のままでは積分できません。まず完全平方を探します。' },
        good: '$(1-2t)^2=1-4t+4t^2=1-4u$。根号の中が $u$ の2次式になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&9(1+2u)^2+27(1-4u)\\\\ &=36u^2-72u+36=36(1-u)^2\\end{aligned}' }] } },
      { say: '$0\\le u\\le\\frac14$ なので $1-u>0$。根号がきれいに外れて、$6(1-u)=6(1-t+t^2)$ を積分するだけになります。',
        add: [{ t: 'm', size: 'sm', tex: '\\sqrt{36(1-u)^2}=6(1-u)=6(1-t+t^2)', note: '$1-u>0$ を\n必ず書く' }] },
      { ask: { type: 'choice', q: '曲線 $L$ の長さは？',
        opts: ['$6$', '$4$', '$5$', '$\\dfrac{9}{2}$'], ok: 2,
        why: { 0: 'それは折れ線 A→B→C→D の長さです。曲線はそれより短くなります。', 1: 'それは線分 AD の長さ。曲線は AD より長いはずです。', 3: 'それは $t=\\frac12$ での速さ。長さは速さを 0 から 1 まで積分します。' },
        good: '$6\\left(1-\\frac12+\\frac13\\right)=6\\cdot\\frac56=5$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\int_0^1 6(1-t+t^2)\\,dt=5' }] } },
      { ask: { type: 'think', q: '曲線 $L$ の上で、U が動く「速さ」$6(1-t+t^2)$ がいちばん小さいのは $t$ がいくつのとき？　そのときの U の位置は？',
        hint: '$1-t+t^2=\\left(t-\\frac12\\right)^2+\\frac34$。',
        ans: '$t=\\dfrac12$ のとき（速さ $\\dfrac92$）。U は $\\left(2,\\ \\dfrac{3\\sqrt3}{4}\\right)$（$L$ のいちばん高い点）',
        after: '両はし（$t=0,\\ 1$）の速さは 6 で、これは AB，CD の長さ 2 の 3 倍。3次のベジェ曲線の性質です。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.58, 0.42], part: '別の見方', say: '(1) の式は、A，B，C，D に $(1-t)^3,\\ 3(1-t)^2t,\\ 3(1-t)t^2,\\ t^3$ の重みをつけた平均の形です。',
        add: [{ t: 'h', text: '別の見方：重みつき平均' },
          { t: 'm', size: 'sm', tex: '\\mathrm{U}=(1-t)^3\\mathrm{A}+3(1-t)^2t\\,\\mathrm{B}+3(1-t)t^2\\,\\mathrm{C}+t^3\\mathrm{D}' },
          { t: 'p', size: 'xs', text: '（$\\{(1-t)+t\\}^3$ を展開した各項。2段なら2乗、3段なら3乗）' },
          fig('f4', half.concat([curve()]), 480)] },
      { say: '速度ベクトルは $\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{BC}},\\ \\overrightarrow{\\mathrm{CD}}$ の重みつきの和。3辺が同じ長さで 120° ずつ曲がる正六角形だから、根号が外れました。',
        add: [{ t: 'm', size: 'sm', tex: '\\Big(\\frac{dx}{dt},\\ \\frac{dy}{dt}\\Big)=3\\left\\{(1-t)^2\\overrightarrow{\\mathrm{AB}}+2t(1-t)\\overrightarrow{\\mathrm{BC}}+t^2\\overrightarrow{\\mathrm{CD}}\\right\\}' },
          { t: 'box', c: 'g', size: 'sm', label: '東大のねらい', text: '「根号の中が完全平方になる」ように作られている。\n式をまとめる文字（ここでは $u=t-t^2$）を探すのが勝負' }] },
      { ask: { type: 'think', q: '検算：$t=\\dfrac12$ のとき、速度 $\\Big(\\dfrac{dx}{dt},\\ \\dfrac{dy}{dt}\\Big)$ を (1) の答えを微分して求め、その大きさが $\\dfrac92$ になることを確かめよう。',
        hint: '$\\frac{dx}{dt}=-6t^2+6t+3$、$\\frac{dy}{dt}=3\\sqrt3(1-2t)$ に $t=\\frac12$。',
        ans: '$\\left(\\dfrac92,\\ 0\\right)$。大きさは $\\dfrac92$ で、$6\\left(1-\\frac12+\\frac14\\right)=\\dfrac92$ と一致',
        after: '$t=\\frac12$ では $\\overrightarrow{\\mathrm{BC}}$ と同じ向き（真横）に進んでいます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。座標 → 面積 → 長さの流れは、媒介変数の曲線の問題の基本形です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
