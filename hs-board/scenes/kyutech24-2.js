/* 2024 九工大 第2問の類題（自作）：直線に接する楕円 ― 接点・条件から楕円を決める・媒介変数表示で面積
   元の問題はうつしていない（「接する条件から楕円の半径を文字で表す」「接点の座標」「図形の条件で文字の値を決める」
   「接点に対応する媒介変数の角」「楕円の弧と接線で囲まれた部分の面積を媒介変数で積分」というねらいと形式だけを合わせた自作問題）。
   問題：E: x²/a²+y²/b²=1 が ℓ: √3x+y=4 に接する。接点 T、R(a,0) での接線 x=a と ℓ の交点 P、ℓ と y 軸の交点 A(0,4)
   答え（python3・sympy で検算ずみ）：
   (1) 連立 (3a²+b²)x²−8√3a²x+a²(16−b²)=0、D/4=a²b²(3a²+b²−16) → b=√(16−3a²)、0<a<4/√3（=4√3/3）
   (2) T(√3a²/4, (16−3a²)/4)（接線の公式 x₀/a²=√3/4, y₀/b²=1/4 とも一致）
   (3) PA の中点 (a/2, 4−√3a/2)。x 座標 √3a²/4=a/2 → a=2/√3=2√3/3、b=2√3、T(√3/3, 3)、P(2√3/3, 2)
   (4) cosθ=1/2, sinθ=√3/2 → θ=π/3
   (5) 台形 ∫(4−√3x)dx（√3/3→2√3/3）=5√3/6、弧の下 ab∫₀^{π/3}sin²θdθ=4(π/6−√3/8)=2π/3−√3/2
       S=5√3/6−2π/3+√3/2=(4√3−2π)/3≒0.2150（数値積分とも一致）
   別解：四角形 ORPT=4√3/3、楕円の扇形 ORT=½abθ=2π/3 */
(function () {
  const r3 = Math.sqrt(3), A0 = 2 / r3, B0 = 2 * r3;
  const VIEW = [-0.45, -0.5, 2.65, 4.5];
  const situ = (id, a, extra) => {
    const b = Math.sqrt(16 - 3 * a * a), T = [r3 * a * a / 4, (16 - 3 * a * a) / 4];
    return { t: 'fig', id, col: 1, view: VIEW, w: 288, h: 465, items: [
      { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[1, '1'], [2, '2'], [3, '3'], [4, '4']] },
      { k: 'param', x: a + '*cos(t)', y: b + '*sin(t)', c: 'y', id: 'E' },
      { k: 'line', m: -r3, n: 4, c: 'b', label: 'ℓ', lat: [2.05, 0.75] },
      { k: 'line', x: a, dash: true, c: 'd' },
      { k: 'pt', at: T, c: 'p', name: 'T', dir: 'ne' },
      { k: 'pt', at: [a, 4 - r3 * a], c: 'g', name: 'P', dir: 'e' },
      { k: 'pt', at: [a, 0], c: 'w', name: 'R', dir: 'se' },
      { k: 'pt', at: [0, 4], c: 'b', name: 'A', dir: 'ne' }
    ].concat(extra || []) };
  };
  const ARC = []; for (let i = 0; i <= 40; i++) { const th = Math.PI / 3 * i / 40; ARC.push([A0 * Math.cos(th), B0 * Math.sin(th)]); }
  const REGION = { k: 'poly', pts: ARC.concat([[A0, 2]]), close: true, fill: 'p', alpha: 0.45, noStroke: true };
  const zoom = id => ({ t: 'fig', id, col: 1, view: [0.12, -0.4, 1.78, 3.6], w: 470, h: 470, items: [
    { k: 'axes', at: [0.12, 0], tx: [[r3 / 3, '√3/3'], [2 * r3 / 3, '2√3/3']], ty: [[1, '1'], [2, '2'], [3, '3']], yaxis: false },
    { k: 'line', x: r3 / 3, dash: true, c: 'd' },
    REGION,
    { k: 'param', x: A0 + '*cos(t)', y: B0 + '*sin(t)', c: 'y', a: 0, b: 1.75 },
    { k: 'line', m: -r3, n: 4, c: 'b', label: 'ℓ', lat: [1.5, 1.05] },
    { k: 'seg', a: [A0, 0], b: [A0, 2], c: 'w', wd: 2.5 },
    { k: 'pt', at: [r3 / 3, 3], c: 'p', name: 'T', dir: 'ne' },
    { k: 'pt', at: [A0, 2], c: 'g', name: 'P', dir: 'e' },
    { k: 'pt', at: [A0, 0], c: 'w', name: 'R', dir: 'ne' },
    { k: 'label', at: [1.5, 2.55], text: 'S', c: 'p', size: 28 },
    { k: 'seg', a: [1.45, 2.45], b: [1.08, 2.15], c: 'p', arrow: true },
    { k: 'label', at: [1.76, 3.45], text: '拡大図（たてを縮めてある）', size: 17, c: 'd', anchor: 'end', plain: true }] });
  const POINTS = [
    '直線と楕円が接する ⇔ 連立した2次方程式が **重解**（$D=0$）。$y=mx+n$ と $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$ なら　$n^2=a^2m^2+b^2$',
    '接点は「重解 $x=-\\frac{B}{2A}$」か、接線の公式 $\\dfrac{x_0x}{a^2}+\\dfrac{y_0y}{b^2}=1$ と直線の係数を比べて出す',
    '弧の下の面積は $x=a\\cos\\theta,\\ y=b\\sin\\theta$ で置換。$\\theta$ の範囲は **端の点** から決め、$dx=-a\\sin\\theta\\,d\\theta$ の符号に注意'
  ];

  HB.lesson({
    id: 'kyutech24-2', field: '九工大型　数学', title: '2024 九工大 第2問の類題 ― 直線に接する楕円と、弧と接線で囲まれた部分の面積', level: '2024年度 九州工業大学 前期 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$a,\\ b$ を正の数とする。楕円 $E:\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$ が直線 $\\ell:\\sqrt3\\,x+y=4$ に接しているとし、その接点を T とする。また、E の頂点 $\\mathrm{R}(a,\\,0)$ における E の接線と $\\ell$ の交点を P、$\\ell$ と $y$ 軸の交点を A とする。',
      parts: [
        '(1)　$b$ を $a$ を用いて表せ。また、$a$ のとりうる値の範囲を求めよ。',
        '(2)　接点 T の座標を $a$ を用いて表せ。',
        '(3)　T が線分 PA の中点となるような $a$ の値を求めよ。',
        '(4)　(3) のとき、E 上の点を $(a\\cos\\theta,\\ b\\sin\\theta)\\ (0\\le\\theta<2\\pi)$ と表す。T に対応する $\\theta$ の値を求めよ。',
        '(5)　(3) のとき、R から T までの E の弧（第1象限の部分）と、線分 TP、線分 PR で囲まれた部分の面積 $S$ を求めよ。'
      ],
      src: '※ 2024年度 九州工業大学 前期 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.62, 0.38],
    steps: [
      { part: '問題', say: '直線に接する楕円の問題です。接する条件から楕円を決め、最後に媒介変数表示を使って面積を求めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '図は $a=1.6$ のときのようすです。$a$ を変えると楕円の形が変わり、T・P も動きます。どの小問で何を使うかを先に整理します。',
        add: [{ t: 'h', text: '方針：図をかいて、使う道具を決める' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', '使うもの'],
            ['(1)', '連立した2次方程式の判別式 $D=0$'],
            ['(2)', '重解 $x=-\\frac{B}{2A}$（接線の公式でも）'],
            ['(3)', '中点の座標を比べる'],
            ['(4)', '$\\cos\\theta=\\frac xa,\\ \\sin\\theta=\\frac yb$'],
            ['(5)', '台形 − 弧の下（媒介変数で積分）']] },
          situ('f0', 1.6)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\ell$ を $y=4-\\sqrt3x$ として E の式に代入し、分母をはらうために $a^2b^2$ をかけます。$x$ の2次方程式になります。',
        add: [{ t: 'h', text: '(1)　接する条件 ⇔ 重解' },
          { t: 'm', size: 'sm', tex: 'b^2x^2+a^2(4-\\sqrt3x)^2=a^2b^2' },
          { t: 'm', size: 'sm', tex: '(3a^2+b^2)x^2-8\\sqrt3a^2x+a^2(16-b^2)=0', note: '…①' },
          { t: 'p', size: 'sm', text: 'E と $\\ell$ が接する ⇔ ① が重解をもつ ⇔ $D=0$' },
          situ('f1', 1.6)] },
      { ask: { type: 'choice', q: '$\\dfrac D4=48a^4-(3a^2+b^2)\\,a^2(16-b^2)=a^2b^2(\\cdots)$ と整理すると、接する条件は？',
        opts: ['$a^2+3b^2=16$', '$3a^2+b^2=16$', '$3a^2+b^2=4$', '$\\sqrt3\\,a+b=4$'], ok: 1,
        why: { 0: '$x$ の係数 $\\sqrt3$ が2乗されて、$a^2$ のほうにつきます。', 2: '右辺は $\\ell$ の定数 4 の2乗で、$16$ です。', 3: '2乗した量どうしの関係になります。$a,\\ b$ の1次式ではありません。' },
        good: '$\\frac D4=a^2b^2(3a^2+b^2-16)$。$a,\\ b>0$ なので、$3a^2+b^2=16$ が条件です。',
        add: [{ t: 'm', tex: '\\frac D4=a^2b^2(3a^2+b^2-16)=0\\ \\Longrightarrow\\ 3a^2+b^2=16' }] } },
      { say: '$b>0$ より $b=\\sqrt{16-3a^2}$。根号の中が正になるので $a^2<\\frac{16}{3}$、つまり $0<a<\\frac{4\\sqrt3}{3}$ です。',
        add: [{ t: 'ans', label: '(1) 答', text: '$b=\\sqrt{16-3a^2}$、　$0<a<\\dfrac{4\\sqrt3}{3}$' },
          { t: 'box', c: 'b', size: 'sm', label: '別の方法', text: '$y=mx+n$ が楕円に接する ⇔ $n^2=a^2m^2+b^2$\n$m=-\\sqrt3,\\ n=4$ を入れると　$16=3a^2+b^2$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。接点の $x$ 座標は、① の重解です。2次方程式 $Ax^2+Bx+C=0$ の重解は $x=-\\frac{B}{2A}$。$3a^2+b^2=16$ も使います。',
        add: [{ t: 'h', text: '(2)　接点 T の座標' },
          { t: 'm', size: 'sm', tex: '(3a^2+b^2)x^2-8\\sqrt3a^2x+\\cdots=0', note: '①（$3a^2+b^2=16$）' },
          situ('f2', 1.6)] },
      { ask: { type: 'choice', q: 'T の $x$ 座標は？',
        opts: ['$\\dfrac{\\sqrt3\\,a^2}{2}$', '$\\dfrac{\\sqrt3\\,a}{4}$', '$\\dfrac{\\sqrt3\\,a^2}{4}$', '$\\dfrac{4\\sqrt3\\,a^2}{3}$'], ok: 2,
        why: { 0: '重解は $-\\frac{B}{2A}$。2 で割るのを忘れています。', 1: '$B=-8\\sqrt3a^2$ なので、$a$ は2乗のまま残ります。', 3: '$A=3a^2+b^2=16$ です。$3a^2$ だけで割っています。' },
        good: '$x=\\dfrac{8\\sqrt3a^2}{2\\cdot16}=\\dfrac{\\sqrt3a^2}{4}$。',
        add: [{ t: 'm', tex: 'x=\\frac{8\\sqrt3a^2}{2(3a^2+b^2)}=\\frac{\\sqrt3a^2}{4}' }] } },
      { say: '$y$ 座標は $\\ell$ の式から $4-\\sqrt3\\cdot\\frac{\\sqrt3a^2}{4}=\\frac{16-3a^2}{4}$。接線の公式と係数を比べても、同じ点が出ます。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\mathrm{T}\\left(\\frac{\\sqrt3a^2}{4},\\ \\frac{16-3a^2}{4}\\right)' },
          { t: 'box', c: 'b', size: 'sm', label: '検算', text: 'T での接線 $\\dfrac{x_0x}{a^2}+\\dfrac{y_0y}{b^2}=1$ と $\\dfrac{\\sqrt3}{4}x+\\dfrac14y=1$ を比べて\n$x_0=\\dfrac{\\sqrt3a^2}{4},\\ y_0=\\dfrac{b^2}{4}=\\dfrac{16-3a^2}{4}$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。P は直線 $x=a$ と $\\ell$ の交点、A は $\\ell$ と $y$ 軸の交点。PA の中点を M とします。',
        add: [{ t: 'h', text: '(3)　T が PA の中点になる条件' },
          { t: 'm', size: 'sm', tex: '\\mathrm{P}(a,\\ 4-\\sqrt3a),\\quad \\mathrm{A}(0,\\ 4)' },
          { t: 'm', size: 'sm', tex: '\\mathrm{M}\\left(\\frac a2,\\ 4-\\frac{\\sqrt3}{2}a\\right)', note: 'PA の中点' },
          situ('f3', 1.6, [{ k: 'pt', at: [0.8, 4 - r3 * 0.8], c: 'o', name: 'M', dir: 'w' }])] },
      { ask: { type: 'choice', q: 'T・P・A はすべて $\\ell$ 上にあります。「T＝M」を確かめるには？',
        opts: ['$x$ 座標と $y$ 座標の両方を、別々に解く', '$x$ 座標が等しいことだけでよい', 'TP と TA の傾きが等しいことを示す', 'T が線分 PA 上にあることを示す'], ok: 1,
        why: { 0: '$\\ell$ は $y$ 軸に平行でないので、$\\ell$ 上の点は $x$ 座標だけで1つに決まります。', 2: 'それは3点が一直線上にあることで、はじめから分かっています。', 3: '線分 PA 上にあるだけでは、中点とは限りません。' },
        good: '同じ直線 $\\ell$ 上の2点は、$x$ 座標が等しければ一致します。',
        add: [{ t: 'm', tex: '\\frac{\\sqrt3a^2}{4}=\\frac a2', note: 'T と M の $x$ 座標' }] } },
      { ask: { type: 'choice', q: 'この方程式を解いて、条件に合う $a$ は？',
        opts: ['$a=\\dfrac{\\sqrt3}{2}$', '$a=2\\sqrt3$', '$a=0,\\ \\dfrac{2\\sqrt3}{3}$', '$a=\\dfrac{2\\sqrt3}{3}$'], ok: 3,
        why: { 0: '$\\sqrt3a=2$ より $a=\\frac{2}{\\sqrt3}$。逆数にしてしまっています。', 1: '$a=2\\sqrt3$ は (1) の範囲 $a<\\frac{4\\sqrt3}{3}$ の外です。', 2: '$a>0$ なので、$a=0$ は入りません（$a$ で割ってよい）。' },
        good: '$a>0$ で両辺を $a$ で割ると $\\sqrt3a=2$。(1) の範囲の中にもあります。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'a=\\frac{2\\sqrt3}{3}' }] } },
      { say: 'このとき $b=\\sqrt{16-4}=2\\sqrt3$。T は $\\left(\\frac{\\sqrt3}{3},\\,3\\right)$、P は $\\left(\\frac{2\\sqrt3}{3},\\,2\\right)$ です。縦に長い楕円になります（次の図）。',
        add: [{ t: 'm', size: 'sm', tex: 'b=2\\sqrt3,\\quad \\mathrm{T}\\left(\\tfrac{\\sqrt3}{3},\\ 3\\right),\\quad \\mathrm{P}\\left(\\tfrac{2\\sqrt3}{3},\\ 2\\right)' }],
},

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。T $=(a\\cos\\theta,\\ b\\sin\\theta)$ とおくと、$\\cos\\theta=\\frac{x}{a}$、$\\sin\\theta=\\frac{y}{b}$ です。',
        add: [{ t: 'h', text: '(4)　T に対応する θ' },
          { t: 'm', tex: '\\cos\\theta=\\frac{\\sqrt3/3}{2\\sqrt3/3},\\qquad \\sin\\theta=\\frac{3}{2\\sqrt3}' },
          situ('f4', A0)] },
      { ask: { type: 'choice', q: 'T に対応する $\\theta$ は？',
        opts: ['$\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{6}$', '$\\dfrac{2\\pi}{3}$', '直線 OT と $x$ 軸のなす角'], ok: 0,
        why: { 1: '$\\cos\\theta=\\frac12$ です。$\\cos\\frac\\pi6=\\frac{\\sqrt3}{2}$ ではありません。', 2: 'T は第1象限なので $\\cos\\theta>0$。$\\frac{2\\pi}{3}$ は第2象限です。', 3: '楕円では、$\\theta$ は OT の角とはちがいます（OT の傾きは $3\\sqrt3$）。' },
        good: '$\\cos\\theta=\\frac12,\\ \\sin\\theta=\\frac{\\sqrt3}{2}$ なので $\\theta=\\frac\\pi3$。図の ∠ROT（約 79°）とはちがいます。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\theta=\\frac{\\pi}{3}' }] } },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。色の部分は、上が線分 TP、下が弧 RT。$x$ は $\\frac{\\sqrt3}{3}$ から $\\frac{2\\sqrt3}{3}$ まで。「$\\ell$ の下の台形」から「弧の下」を引きます。',
        add: [{ t: 'h', text: '(5)　面積 = 台形 − 弧の下' },
          { t: 'm', size: 'sm', tex: 'S=\\int_{\\frac{\\sqrt3}{3}}^{\\frac{2\\sqrt3}{3}}(4-\\sqrt3x)\\,dx-\\int_{\\frac{\\sqrt3}{3}}^{\\frac{2\\sqrt3}{3}}y\\,dx', note: '$y$ は E の上半分' },
          { t: 'm', size: 'sm', tex: '\\int_{\\frac{\\sqrt3}{3}}^{\\frac{2\\sqrt3}{3}}(4-\\sqrt3x)\\,dx=\\frac12(3+2)\\cdot\\frac{\\sqrt3}{3}=\\frac{5\\sqrt3}{6}', note: '台形' },
          zoom('f5')] },
      { ask: { type: 'choice', q: '弧の下の積分を $x=a\\cos\\theta,\\ y=b\\sin\\theta$ で置きかえると？',
        opts: ['$\\displaystyle\\int_{\\frac\\pi3}^{0}ab\\sin^2\\theta\\,d\\theta$', '$\\displaystyle\\int_0^{\\frac\\pi3}ab\\sin\\theta\\cos\\theta\\,d\\theta$', '$\\displaystyle\\int_0^{\\frac\\pi3}ab\\sin^2\\theta\\,d\\theta$', '$\\displaystyle\\int_0^{\\frac\\pi3}b\\sin\\theta\\,d\\theta$'], ok: 2,
        why: { 0: '$dx=-a\\sin\\theta\\,d\\theta$ のマイナスを忘れています。これでは負の値になります。', 1: '$dx$ は $x=a\\cos\\theta$ の微分で $-a\\sin\\theta\\,d\\theta$。$\\cos\\theta$ は出ません。', 3: '$dx$ を $d\\theta$ に置きかえていません。' },
        good: '$x:\\frac{\\sqrt3}{3}\\to\\frac{2\\sqrt3}{3}$ は $\\theta:\\frac\\pi3\\to0$。マイナスで上下を入れかえます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int y\\,dx=\\int_{\\frac\\pi3}^{0}b\\sin\\theta\\,(-a\\sin\\theta)\\,d\\theta=ab\\int_0^{\\frac\\pi3}\\sin^2\\theta\\,d\\theta' }] } },
      { clear: true, say: '$ab=\\frac{2\\sqrt3}{3}\\cdot2\\sqrt3=4$。$\\sin^2\\theta=\\frac{1-\\cos2\\theta}{2}$ で次数を下げて積分します。',
        add: [{ t: 'h', text: '(5)　つづき：積分の計算' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}4\\int_0^{\\frac\\pi3}\\frac{1-\\cos2\\theta}{2}\\,d\\theta&=4\\Big[\\,\\frac\\theta2-\\frac{\\sin2\\theta}{4}\\,\\Big]_0^{\\frac\\pi3}\\\\ &=4\\left(\\frac\\pi6-\\frac{\\sqrt3}{8}\\right)=\\frac{2\\pi}{3}-\\frac{\\sqrt3}{2}\\end{aligned}' },
          zoom('f6')] },
      { say: '台形から引いて、$S=\\frac{5\\sqrt3}{6}-\\frac{2\\pi}{3}+\\frac{\\sqrt3}{2}=\\frac{4\\sqrt3-2\\pi}{3}$。およそ $0.215$ で、正の値なので図とも合います。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\frac{5\\sqrt3}{6}-\\left(\\frac{2\\pi}{3}-\\frac{\\sqrt3}{2}\\right)' },
          { t: 'ans', label: '(5) 答', tex: 'S=\\frac{4\\sqrt3-2\\pi}{3}' }] },
      { ask: { type: 'think', q: '別の見方：楕円の「扇形」ORT の面積は $\\frac12ab\\theta$ です。これを使い、四角形 ORPT から引いて $S$ を求めよう。',
        hint: 'T から $x$ 軸に垂線 TH を下ろし、三角形 OHT と台形 HRPT に分ける。',
        ans: '四角形 ORPT $=\\frac{4\\sqrt3}{3}$、扇形 $=\\frac12\\cdot4\\cdot\\frac\\pi3=\\frac{2\\pi}{3}$ → $S=\\frac{4\\sqrt3-2\\pi}{3}$',
        after: '楕円は円を縦に $\\frac ba$ 倍したもの。面積も $\\frac ba$ 倍なので、扇形は $\\frac ba\\cdot\\frac12a^2\\theta=\\frac12ab\\theta$ です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「接する ⇔ 重解」と「媒介変数で面積」は、楕円の問題でくり返し使う2つの道具です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
