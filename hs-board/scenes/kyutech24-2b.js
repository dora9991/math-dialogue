/* 2024 九工大 第2問の類題②（自作）：直線に接する楕円 ― 接点・条件から楕円を決める・媒介変数表示で面積
   元の問題はうつしていない（「接する条件から楕円の半径を文字で表す」「接点の座標」「図形の条件で文字の値を決める」
   「接点に対応する媒介変数の角」「楕円の弧と接線で囲まれた部分の面積を媒介変数で積分」というねらいと形式だけを合わせた自作問題）。
   類題①とは、接線が x+2y=8（傾き −1/2）、条件が「T が線分 AB の中点」、囲む図形が「弧 RT・線分 TA・線分 AR」である点でちがう。
   問題：E: x²/a²+y²/b²=1 が ℓ: x+2y=8 に接する。接点 T、ℓ と x 軸の交点 A(8,0)、y 軸の交点 B(0,4)、R(a,0)
   答え（python3・sympy で検算ずみ）：
   (1) 連立 (b²+a²/4)x²−4a²x+a²(16−b²)=0、D/4=a²b²(a²+4b²−64)/4 → b=√(64−a²)/2、0<a<8
   (2) T(a²/8, (64−a²)/16)（接線の公式 x₀/a²=1/8, y₀/b²=1/4 とも一致）
   (3) AB の中点 (4,2)。a²/8=4 → a=4√2、b=2√2、T(4,2)
   (4) cosθ=1/√2, sinθ=1/√2 → θ=π/4
   (5) 三角形 ∫₄⁸(4−x/2)dx=4、弧の下 ab∫₀^{π/4}sin²θdθ=16(π/8−1/4)=2π−4。S=4−(2π−4)=8−2π≒1.7168（数値積分とも一致）
   別解：三角形 OAT=8、楕円の扇形 ORT=½abθ=2π → S=8−2π */
(function () {
  const A0 = 4 * Math.SQRT2, B0 = 2 * Math.SQRT2;
  const VIEW = [-0.6, -0.6, 8.9, 4.7];
  const situ = (id, a, extra) => {
    const b = Math.sqrt(16 - a * a / 4), T = [a * a / 8, b * b / 4];
    return { t: 'fig', id, col: 1, view: VIEW, w: 460, h: 456 * 5.3 / 9.5, items: [
      { k: 'axes', tx: [[2, '2'], [4, '4'], [6, '6']], ty: [[2, '2'], [4, '4']] },
      { k: 'param', x: a + '*cos(t)', y: b + '*sin(t)', a: 0, b: Math.PI / 2, c: 'y', id: 'E' },
      { k: 'line', m: -0.5, n: 4, c: 'b', a: -0.5, b: 8.8, label: 'ℓ', lat: [6.6, 0.95] },
      { k: 'pt', at: T, c: 'p', name: 'T', dir: 'ne' },
      { k: 'pt', at: [a, 0], c: 'w', name: 'R', dir: 'sw' },
      { k: 'pt', at: [8, 0], c: 'g', name: 'A', dir: 'ne' },
      { k: 'pt', at: [0, 4], c: 'b', name: 'B', dir: 'ne' }
    ].concat(extra || []) };
  };
  const ARC = []; for (let i = 0; i <= 40; i++) { const th = Math.PI / 4 * (1 - i / 40); ARC.push([A0 * Math.cos(th), B0 * Math.sin(th)]); }
  const REGION = { k: 'poly', pts: ARC.concat([[8, 0]]), close: true, fill: 'p', alpha: 0.45, noStroke: true };
  const zoom = id => ({ t: 'fig', id, col: 1, view: [3.3, -0.5, 8.7, 2.9], w: 470, h: 470 * 3.4 / 5.4, items: [
    { k: 'axes', at: [3.3, 0], tx: [[4, '4'], [A0, '4√2'], [8, '8']], ty: [[1, '1'], [2, '2']], yaxis: false },
    { k: 'line', x: 4, dash: true, c: 'd' },
    REGION,
    { k: 'param', x: A0 + '*cos(t)', y: B0 + '*sin(t)', c: 'y', a: 0, b: 1.2 },
    { k: 'line', m: -0.5, n: 4, c: 'b', a: 3.3, b: 8.7, label: 'ℓ', lat: [7.3, 0.55] },
    { k: 'pt', at: [4, 2], c: 'p', name: 'T', dir: 'ne' },
    { k: 'pt', at: [A0, 0], c: 'w', name: 'R', dir: 'sw' },
    { k: 'pt', at: [8, 0], c: 'g', name: 'A', dir: 'ne' },
    { k: 'label', at: [6.2, 1.0], text: 'S', c: 'p', size: 28, anchor: 'middle' },
    { k: 'label', at: [8.6, 2.65], text: '拡大図（たてを縮めてある）', size: 17, c: 'd', anchor: 'end', plain: true }] });
  const POINTS = [
    '直線と楕円が接する ⇔ 連立した2次方程式が **重解**（$D=0$）。$y=mx+n$ と $\\frac{x^2}{a^2}+\\frac{y^2}{b^2}=1$ なら　$n^2=a^2m^2+b^2$',
    '接点は「重解 $x=-\\frac{B}{2A}$」か、接線の公式 $\\dfrac{x_0x}{a^2}+\\dfrac{y_0y}{b^2}=1$ と直線の係数を比べて出す',
    '弧の下の面積は $x=a\\cos\\theta,\\ y=b\\sin\\theta$ で置換。$\\theta$ の範囲は **端の点** から決め、$dx=-a\\sin\\theta\\,d\\theta$ の符号に注意'
  ];

  HB.lesson({
    id: 'kyutech24-2b', field: '九工大型　数学', title: '2024 九工大 第2問の類題② ― 直線に接する楕円と、弧・接線・x 軸で囲まれた部分の面積', level: '2024年度 九州工業大学 前期 第2問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$a,\\ b$ を正の数とする。楕円 $E:\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$ が直線 $\\ell:\\ x+2y=8$ に接しているとし、その接点を T とする。また、$\\ell$ と $x$ 軸の交点を A、$\\ell$ と $y$ 軸の交点を B、E と $x$ 軸の正の部分の交点を $\\mathrm{R}(a,\\,0)$ とする。',
      parts: [
        '(1)　$b$ を $a$ を用いて表せ。また、$a$ のとりうる値の範囲を求めよ。',
        '(2)　接点 T の座標を $a$ を用いて表せ。',
        '(3)　T が線分 AB の中点となるような $a$ の値を求めよ。',
        '(4)　(3) のとき、E 上の点を $(a\\cos\\theta,\\ b\\sin\\theta)\\ (0\\le\\theta<2\\pi)$ と表す。T に対応する $\\theta$ の値を求めよ。',
        '(5)　(3) のとき、R から T までの E の弧（第1象限の部分）と、線分 TA、線分 AR で囲まれた部分の面積 $S$ を求めよ。'
      ],
      src: '※ 2024年度 九州工業大学 前期 第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.62, 0.38],
    steps: [
      { part: '問題', say: '直線に接する楕円の問題です。接する条件から楕円を決め、最後に媒介変数表示を使って面積を求めます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '図は $a=5$ のときのようすです。$a$ を変えると楕円の形が変わり、T・R も動きます。どの小問で何を使うかを先に整理します。',
        add: [{ t: 'h', text: '方針：図をかいて、使う道具を決める' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['小問', '使うもの'],
            ['(1)', '連立した2次方程式の判別式 $D=0$'],
            ['(2)', '重解 $x=-\\frac{B}{2A}$（接線の公式でも）'],
            ['(3)', '線分 AB の中点の座標'],
            ['(4)', '$\\cos\\theta=\\frac xa,\\ \\sin\\theta=\\frac yb$'],
            ['(5)', '三角形 − 弧の下（媒介変数で積分）']] },
          situ('f0', 5)] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\ell$ を $y=4-\\frac x2$ として E の式に代入し、分母をはらうために $a^2b^2$ をかけます。$x$ の2次方程式になります。',
        add: [{ t: 'h', text: '(1)　接する条件 ⇔ 重解' },
          { t: 'm', size: 'sm', tex: 'b^2x^2+a^2\\left(4-\\frac x2\\right)^2=a^2b^2' },
          { t: 'm', size: 'sm', tex: '\\left(b^2+\\frac{a^2}{4}\\right)x^2-4a^2x+a^2(16-b^2)=0', note: '…①' },
          { t: 'p', size: 'sm', text: 'E と $\\ell$ が接する ⇔ ① が重解をもつ ⇔ $D=0$' },
          situ('f1', 5)] },
      { ask: { type: 'choice', q: '$\\dfrac D4=4a^4-\\left(b^2+\\dfrac{a^2}{4}\\right)a^2(16-b^2)$ を整理すると、接する条件は？',
        opts: ['$a^2+4b^2=16$', '$4a^2+b^2=64$', '$a^2+4b^2=64$', '$a+2b=8$'], ok: 2,
        why: { 0: '右辺は $\\ell$ の定数 8 の2乗のほうで、$64$ になります（$16$ は $y$ 切片 4 の2乗）。', 1: '$x$ の係数の 1 は $a^2$ のほうにつきます。$a^2$ と $b^2$ が逆です。', 3: '2乗した量どうしの関係になります。$a,\\ b$ の1次式ではありません。' },
        good: '$\\frac D4=\\frac{a^2b^2}{4}(a^2+4b^2-64)$。$a,\\ b>0$ なので、$a^2+4b^2=64$ が条件です。',
        add: [{ t: 'm', tex: '\\frac D4=\\frac{a^2b^2}{4}(a^2+4b^2-64)=0\\ \\Longrightarrow\\ a^2+4b^2=64' }] } },
      { say: '$b>0$ より $b=\\frac{\\sqrt{64-a^2}}{2}$。根号の中が正になるので $a^2<64$、つまり $0<a<8$ です。',
        add: [{ t: 'ans', label: '(1) 答', text: '$b=\\dfrac{\\sqrt{64-a^2}}{2}$、　$0<a<8$' },
          { t: 'box', c: 'b', size: 'sm', label: '別の方法', text: '$y=mx+n$ が楕円に接する ⇔ $n^2=a^2m^2+b^2$\n$m=-\\frac12,\\ n=4$ を入れると　$16=\\frac{a^2}{4}+b^2$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。接点の $x$ 座標は、① の重解です。2次方程式 $Ax^2+Bx+C=0$ の重解は $x=-\\frac{B}{2A}$。$b^2+\\frac{a^2}{4}=16$ も使います。',
        add: [{ t: 'h', text: '(2)　接点 T の座標' },
          { t: 'm', size: 'sm', tex: '\\left(b^2+\\frac{a^2}{4}\\right)x^2-4a^2x+\\cdots=0', note: '① （$b^2+\\frac{a^2}{4}=16$）' },
          situ('f2', 5)] },
      { ask: { type: 'choice', q: 'T の $x$ 座標は？',
        opts: ['$\\dfrac{a^2}{4}$', '$\\dfrac{a}{8}$', '$\\dfrac{a^2}{8}$', '$2a^2$'], ok: 2,
        why: { 0: '重解は $-\\frac{B}{2A}$。$2A$ の $2$ をかけ忘れています。', 1: '$B=-4a^2$ なので、$a$ は2乗のまま残ります。', 3: '分母を忘れています。$-\\frac{B}{2A}$ は $B$ を $2A=32$ で割ります。' },
        good: '$x=\\dfrac{4a^2}{2\\cdot16}=\\dfrac{a^2}{8}$。',
        add: [{ t: 'm', tex: 'x=\\frac{4a^2}{2\\left(b^2+\\frac{a^2}{4}\\right)}=\\frac{4a^2}{32}=\\frac{a^2}{8}' }] } },
      { say: '$y$ 座標は $\\ell$ の式から $4-\\frac12\\cdot\\frac{a^2}{8}=\\frac{64-a^2}{16}$。接線の公式と係数を比べても、同じ点が出ます。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\mathrm{T}\\left(\\frac{a^2}{8},\\ \\frac{64-a^2}{16}\\right)' },
          { t: 'box', c: 'b', size: 'sm', label: '検算', text: 'T での接線 $\\dfrac{x_0x}{a^2}+\\dfrac{y_0y}{b^2}=1$ と $\\dfrac18x+\\dfrac14y=1$ を比べて\n$x_0=\\dfrac{a^2}{8},\\ y_0=\\dfrac{b^2}{4}=\\dfrac{64-a^2}{16}$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。A は $\\ell$ と $x$ 軸の交点、B は $y$ 軸の交点。線分 AB の中点を M とします。',
        add: [{ t: 'h', text: '(3)　T が AB の中点になる条件' },
          { t: 'm', size: 'sm', tex: '\\mathrm{A}(8,\\ 0),\\quad \\mathrm{B}(0,\\ 4)' },
          { t: 'm', size: 'sm', tex: '\\mathrm{M}\\left(4,\\ 2\\right)', note: 'AB の中点' },
          situ('f3', 5, [{ k: 'pt', at: [4, 2], c: 'o', name: 'M', dir: 'sw' }])] },
      { ask: { type: 'choice', q: 'T・A・B はすべて $\\ell$ 上にあります。「T＝M」を確かめるには？',
        opts: ['$x$ 座標と $y$ 座標の両方を、別々に解く', 'TA と TB の傾きが等しいことを示す', '$x$ 座標が等しいことだけでよい', 'T が線分 AB 上にあることを示す'], ok: 2,
        why: { 0: '$\\ell$ は $y$ 軸に平行でないので、$\\ell$ 上の点は $x$ 座標だけで1つに決まります。', 1: 'それは3点が一直線上にあることで、はじめから分かっています。', 3: '線分 AB 上にあるだけでは、中点とは限りません。' },
        good: '同じ直線 $\\ell$ 上の2点は、$x$ 座標が等しければ一致します。',
        add: [{ t: 'm', tex: '\\frac{a^2}{8}=4', note: 'T と M の $x$ 座標' }] } },
      { ask: { type: 'choice', q: 'この方程式を解いて、条件に合う $a$ は？',
        opts: ['$a=2\\sqrt2$', '$a=32$', '$a=\\pm4\\sqrt2$', '$a=4\\sqrt2$'], ok: 3,
        why: { 0: '$a^2=8$ のときの値です。$a^2=32$ から $a$ を出します。', 1: '$a^2=32$ の平方根をとっていません（$a=32$ は範囲 $a<8$ の外）。', 2: '$a>0$ なので、負の値は入りません。' },
        good: '$a^2=32$、$a>0$ より $a=4\\sqrt2\\ (\\fallingdotseq5.66)$。(1) の範囲 $0<a<8$ の中にもあります。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'a=4\\sqrt2' }] } },
      { say: 'このとき $b=\\frac{\\sqrt{64-32}}{2}=2\\sqrt2$。T の $y$ 座標は $\\frac{64-32}{16}=2$ で、T は M $(4,\\,2)$ と一致します。横に長い楕円になります。',
        add: [{ t: 'm', size: 'sm', tex: 'b=2\\sqrt2,\\quad \\mathrm{T}\\left(4,\\ 2\\right),\\quad \\mathrm{R}\\left(4\\sqrt2,\\ 0\\right)' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。T $=(a\\cos\\theta,\\ b\\sin\\theta)$ とおくと、$\\cos\\theta=\\frac{x}{a}$、$\\sin\\theta=\\frac{y}{b}$ です。',
        add: [{ t: 'h', text: '(4)　T に対応する θ' },
          { t: 'm', tex: '\\cos\\theta=\\frac{4}{4\\sqrt2},\\qquad \\sin\\theta=\\frac{2}{2\\sqrt2}' },
          situ('f4', A0)] },
      { ask: { type: 'choice', q: 'T に対応する $\\theta$ は？',
        opts: ['$\\dfrac{\\pi}{3}$', '$\\dfrac{\\pi}{6}$', '直線 OT と $x$ 軸のなす角', '$\\dfrac{\\pi}{4}$'], ok: 3,
        why: { 0: '$\\cos\\theta=\\frac{1}{\\sqrt2}$ です。$\\cos\\frac\\pi3=\\frac12$ ではありません。', 1: '$\\sin\\theta=\\frac{1}{\\sqrt2}$ です。$\\sin\\frac\\pi6=\\frac12$ ではありません。', 2: '楕円では、$\\theta$ は OT の角とはちがいます（OT の傾きは $\\frac12$）。' },
        good: '$\\cos\\theta=\\sin\\theta=\\frac{1}{\\sqrt2}$ なので $\\theta=\\frac\\pi4$。OT と $x$ 軸のなす角（$\\tan=\\frac12$）とは別物です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\theta=\\frac{\\pi}{4}' }] } },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) です。色の部分は、上が線分 TA、下が弧 RT と線分 RA。$x$ は $4$ から $8$ まで。「$\\ell$ の下の三角形」から「弧の下」を引きます。',
        add: [{ t: 'h', text: '(5)　面積 = 三角形 − 弧の下' },
          { t: 'm', size: 'sm', tex: 'S=\\int_{4}^{8}\\left(4-\\frac x2\\right)dx-\\int_{4}^{4\\sqrt2}y\\,dx', note: '$y$ は E の上半分' },
          { t: 'm', size: 'sm', tex: '\\int_{4}^{8}\\left(4-\\frac x2\\right)dx=\\frac12\\cdot4\\cdot2=4', note: '三角形' },
          zoom('f5')] },
      { ask: { type: 'choice', q: '弧の下の積分を $x=a\\cos\\theta,\\ y=b\\sin\\theta$ で置きかえると？',
        opts: ['$\\displaystyle\\int_{0}^{\\frac\\pi4}ab\\sin^2\\theta\\,d\\theta$', '$\\displaystyle\\int_0^{\\frac\\pi4}ab\\sin\\theta\\cos\\theta\\,d\\theta$', '$\\displaystyle\\int_{\\frac\\pi4}^{0}ab\\sin^2\\theta\\,d\\theta$', '$\\displaystyle\\int_0^{\\frac\\pi4}b\\sin\\theta\\,d\\theta$'], ok: 0,
        why: { 1: '$dx$ は $x=a\\cos\\theta$ の微分で $-a\\sin\\theta\\,d\\theta$。$\\cos\\theta$ は出ません。', 2: '$dx=-a\\sin\\theta\\,d\\theta$ のマイナスを忘れています。これでは負の値になります。', 3: '$dx$ を $d\\theta$ に置きかえていません。' },
        good: '$x:4\\to4\\sqrt2$ は $\\theta:\\frac\\pi4\\to0$。マイナスで上下を入れかえます。',
        add: [{ t: 'm', size: 'sm', tex: '\\int y\\,dx=\\int_{\\frac\\pi4}^{0}b\\sin\\theta\\,(-a\\sin\\theta)\\,d\\theta=ab\\int_0^{\\frac\\pi4}\\sin^2\\theta\\,d\\theta' }] } },
      { clear: true, say: '$ab=4\\sqrt2\\cdot2\\sqrt2=16$。$\\sin^2\\theta=\\frac{1-\\cos2\\theta}{2}$ で次数を下げて積分します。',
        add: [{ t: 'h', text: '(5)　つづき：積分の計算' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}16\\int_0^{\\frac\\pi4}\\frac{1-\\cos2\\theta}{2}\\,d\\theta&=16\\Big[\\,\\frac\\theta2-\\frac{\\sin2\\theta}{4}\\,\\Big]_0^{\\frac\\pi4}\\\\ &=16\\left(\\frac\\pi8-\\frac14\\right)=2\\pi-4\\end{aligned}' },
          zoom('f6')] },
      { say: '三角形から引いて、$S=4-(2\\pi-4)=8-2\\pi$。およそ $1.72$ で、正の値なので図とも合います（三角形の面積 $4$ より小さい）。',
        add: [{ t: 'm', size: 'sm', tex: 'S=4-(2\\pi-4)' },
          { t: 'ans', label: '(5) 答', tex: 'S=8-2\\pi' }] },
      { ask: { type: 'think', q: '別の見方：楕円の「扇形」ORT の面積は $\\frac12ab\\theta$ です。これを使い、三角形 OAT から引いて $S$ を求めよう。',
        hint: '三角形 OAT は、底辺 OA $=8$、高さ（T の $y$ 座標）$2$。',
        ans: '三角形 OAT $=\\frac12\\cdot8\\cdot2=8$、扇形 $=\\frac12\\cdot16\\cdot\\frac\\pi4=2\\pi$ → $S=8-2\\pi$',
        after: '楕円は円を縦に $\\frac ba$ 倍したもの。面積も $\\frac ba$ 倍なので、扇形は $\\frac ba\\cdot\\frac12a^2\\theta=\\frac12ab\\theta$ です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「接する ⇔ 重解」と「媒介変数で面積」は、楕円の問題でくり返し使う2つの道具です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
