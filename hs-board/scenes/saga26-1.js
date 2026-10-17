/* 2026 佐賀大 理系 第1問の類題（自作）：座標空間の4点 → なす角と面積、垂線の足、垂線の長さと四面体の体積
   問題：A(2,0,1)、B(0,−1,3)、C(2,2,−1)、D(2,2,2)
   答え（python3・sympy で検算ずみ）：
   (1) AB=(−2,−1,2)、AC=(0,2,−2)、AB・AC=−6、|AB|=3、|AC|=2√2 → cos∠BAC=−1/√2、∠BAC=135°、S=3
   (2) AD=(0,2,1)。DH・AB=0 → 9s−6t=0、DH・AC=0 → −6s+8t=2 → s=1/3、t=1/2、H(4/3, 2/3, 2/3)（s,t>0、s+t<1 で △ABC の内部）
   (3) DH=(−2/3,−4/3,−4/3)=−(2/3)(1,2,2)、DH=2、V=(1/3)·3·2=2
   別の見方：n=(1,2,2) は AB・AC の両方に垂直。DH=|AD・n|/|n|=6/3=2
   図：平面 ABC の法線 (1,2,2) が画面の上向きになるように正射影した見取図（D の真下に H がくる）。 */
(function () {
  // ---- 見取図：E1＝画面の右、E2＝画面の上（平面 ABC を上から 28° 見下ろす向き） ----
  const E1 = [0.9107, -0.0447, -0.4107], E2 = [0.1798, 0.9379, 0.2966];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const A3 = [2, 0, 1], B3 = [0, -1, 3], C3 = [2, 2, -1], D3 = [2, 2, 2], H3 = [4 / 3, 2 / 3, 2 / 3];
  const A = pj(A3), B = pj(B3), C = pj(C3), D = pj(D3), H = pj(H3);
  const tetra = (opt) => {
    const o = opt || {};
    const items = [
      { k: 'poly', pts: [A, B, C], close: true, fill: 'g', alpha: 0.16, c: 'g', wd: 3 },
      { k: 'seg', a: D, b: A, c: 'w', wd: 2.5 }, { k: 'seg', a: D, b: B, c: 'w', wd: 2.5 }, { k: 'seg', a: D, b: C, c: 'w', wd: 2.5 },
      { k: 'pt', at: A, name: 'A', dir: 's', r: 5 }, { k: 'pt', at: B, name: 'B', dir: 'w', r: 5 }, { k: 'pt', at: C, name: 'C', dir: 'e', r: 5 },
      { k: 'pt', at: D, name: 'D', dir: 'n', r: 5, c: 'b' }
    ];
    if (o.ab) items.push({ k: 'vec', a: A, b: B, c: 'y', wd: 3.5 }, { k: 'vec', a: A, b: C, c: 'b', wd: 3.5 }, { k: 'angle', o: A, a: B, b: C, rp: 30, c: 'y' });
    if (o.h) items.push({ k: 'seg', a: D, b: H, c: 'p', wd: 3, dash: true }, { k: 'pt', at: H, name: 'H', dir: 'sw', r: 5, c: 'p' });
    return items;
  };
  const fig = (id, opt, h) => ({ t: 'fig', id, col: 1, view: [-1.7, -0.5, 2.7, 3.3], w: Math.round((h || 400) * 4.4 / 3.8), h: h || 400, items: tetra(opt) });   // 縦横比は view にそろえる
  const POINTS = [
    'なす角は $\\cos\\theta=\\dfrac{\\vec p\\cdot\\vec q}{|\\vec p||\\vec q|}$、面積は $S=\\dfrac12\\sqrt{|\\vec p|^2|\\vec q|^2-(\\vec p\\cdot\\vec q)^2}$ でも出せる',
    '垂線の足 H は「$\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$（平面上）」と「$\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AC}}$」の2つで決まる',
    '体積は $V=\\dfrac13S\\cdot\\mathrm{DH}$。法線ベクトル $\\vec n$ を使うと $\\mathrm{DH}=\\dfrac{|\\overrightarrow{\\mathrm{AD}}\\cdot\\vec n|}{|\\vec n|}$ で検算できる'
  ];

  HB.lesson({
    id: 'saga26-1', field: '佐賀大型　数学（理系）', title: '2026 佐賀大 理系 第1問の類題 ― 垂線の足と四面体の体積', level: '2026年度 佐賀大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 4 点 $\\mathrm{A}(2,\\ 0,\\ 1)$、$\\mathrm{B}(0,\\ -1,\\ 3)$、$\\mathrm{C}(2,\\ 2,\\ -1)$、$\\mathrm{D}(2,\\ 2,\\ 2)$ がある。',
      parts: [
        '(1)　$\\angle\\mathrm{BAC}$ の大きさを求めよ。また、$\\triangle\\mathrm{ABC}$ の面積 $S$ を求めよ。',
        '(2)　点 D から平面 ABC に垂線を下ろし、平面 ABC との交点を H とする。$\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ をみたす実数 $s,\\ t$ の値を求めよ。また、点 H の座標を求めよ。',
        '(3)　線分 DH の長さと、四面体 ABCD の体積 $V$ を求めよ。'
      ],
      src: '※ 2026年度 佐賀大学 前期 理工学部 数学 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '座標空間の4点から、角・面積・垂線の足・体積を順に求める問題です。誘導どおりに進めれば解けます。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '右は4点の見取図です。底面を △ABC と見ると、D から下ろした垂線 DH が高さ。(1)(2)(3) は「底面積 → 高さ → 体積」の順になっています。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'b', size: 'sm', label: '流れ', text: '(1)　底面 △ABC の面積 $S$\n(2)　垂線の足 H（高さの足）\n(3)　高さ DH と 体積 $V=\\dfrac13S\\cdot\\mathrm{DH}$' },
          fig('f0', { h: true })] },
      { ask: { type: 'choice', q: '垂線の足 H を決める条件として、正しいのは？（H は平面 ABC 上の点）',
        opts: ['$\\mathrm{DH}\\perp\\mathrm{AB}$ だけ', '$\\mathrm{DH}\\perp\\mathrm{AB}$ かつ $\\mathrm{DH}\\perp\\mathrm{AC}$', '$\\mathrm{AH}\\perp\\mathrm{DH}$ だけ', '$\\mathrm{AH}=\\mathrm{AD}$'], ok: 1,
        why: { 0: '1本の直線に垂直なだけでは、平面に垂直とはいえません。平行でない2本に垂直であることが必要です。', 2: 'AH は平面上の1本の線分にすぎません。平面全体に垂直であることを言う必要があります。', 3: '長さの条件は、垂直とは関係ありません。' },
        good: '平面上の平行でない2つのベクトル $\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{AC}}$ の両方に垂直なら、DH は平面 ABC に垂直です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\qquad \\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0', note: '(2) で使う2つの式' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。まず A を始点とするベクトルを成分で出します。終点の座標から始点の座標を引きます。',
        add: [{ t: 'h', text: '(1)　∠BAC と △ABC の面積' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}=(-2,\\ -1,\\ 2),\\qquad \\overrightarrow{\\mathrm{AC}}=(0,\\ 2,\\ -2)' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|=\\sqrt{4+1+4}=3,\\qquad |\\overrightarrow{\\mathrm{AC}}|=\\sqrt{0+4+4}=2\\sqrt2' },
          fig('f1', { ab: true }, 380)] },
      { ask: { type: 'choice', q: '内積 $\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$ の値は？',
        opts: ['$6$', '$-2$', '$-4$', '$-6$'], ok: 3,
        why: { 0: '$(-1)\\cdot2$ と $2\\cdot(-2)$ はどちらも負です。符号に注意。', 1: '$z$ 成分どうしの積 $2\\cdot(-2)=-4$ を足し忘れています。', 2: '$y$ 成分どうしの積 $(-1)\\cdot2=-2$ を足し忘れています。' },
        good: '$(-2)\\cdot0+(-1)\\cdot2+2\\cdot(-2)=0-2-4=-6$。成分ごとの積の和です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=0-2-4=-6' }] } },
      { ask: { type: 'choice', q: '$\\cos\\angle\\mathrm{BAC}=\\dfrac{-6}{3\\cdot2\\sqrt2}$ から、$\\angle\\mathrm{BAC}$ は？',
        opts: ['$135^\\circ$', '$45^\\circ$', '$120^\\circ$', '$150^\\circ$'], ok: 0,
        why: { 1: '$\\cos$ が負なので鈍角です。$45^\\circ$ は $\\cos=\\frac{1}{\\sqrt2}$ のとき。', 2: '$\\cos120^\\circ=-\\frac12$。ここでは $-\\frac{1}{\\sqrt2}$ です。', 3: '$\\cos150^\\circ=-\\frac{\\sqrt3}{2}$。値がちがいます。' },
        good: '$\\dfrac{-6}{6\\sqrt2}=-\\dfrac{1}{\\sqrt2}$ なので $\\angle\\mathrm{BAC}=135^\\circ$ です。',
        add: [{ t: 'm', tex: '\\cos\\angle\\mathrm{BAC}=\\frac{-6}{3\\cdot2\\sqrt2}=-\\frac{1}{\\sqrt2}\\qquad \\therefore\\ \\angle\\mathrm{BAC}=135^\\circ' }] } },
      { say: '面積は $\\frac12\\times$（2辺）$\\times\\sin$。$\\sin135^\\circ=\\frac{1}{\\sqrt2}$ で $S=3$。内積だけで出す公式でも、同じ 3 になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S&=\\frac12\\cdot3\\cdot2\\sqrt2\\cdot\\sin135^\\circ=3\\\\ &=\\frac12\\sqrt{9\\cdot8-(-6)^2}=\\frac12\\sqrt{36}=3\\end{aligned}' },
          { t: 'ans', label: '(1) 答', tex: '\\angle\\mathrm{BAC}=135^\\circ,\\qquad S=3' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。H は平面 ABC 上なので $\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$。$\\overrightarrow{\\mathrm{DH}}=\\overrightarrow{\\mathrm{AH}}-\\overrightarrow{\\mathrm{AD}}$ と、A を始点にそろえます。',
        add: [{ t: 'h', text: '(2)　垂線の足 H' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AD}}=(0,\\ 2,\\ 1)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}-\\overrightarrow{\\mathrm{AD}}' },
          fig('f2', { h: true }, 380)] },
      { say: '成分を全部書くより、**内積のまま計算** すると楽です。必要な内積を先に表にしておきます。',
        add: [{ t: 'tbl', size: 'sm', rows: [['', '$\\overrightarrow{\\mathrm{AB}}$', '$\\overrightarrow{\\mathrm{AC}}$'], ['$\\overrightarrow{\\mathrm{AB}}$', '$9$', '$-6$'], ['$\\overrightarrow{\\mathrm{AC}}$', '$-6$', '$8$'], ['$\\overrightarrow{\\mathrm{AD}}$', '$0$', '$2$']] }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ を $s,\\ t$ の式にすると？',
        opts: ['$9s-6t=2$', '$9s+6t=0$', '$-6s+8t=0$', '$9s-6t=0$'], ok: 3,
        why: { 0: '右辺は $\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ です。2 は $\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AC}}$ の値。', 1: '$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=-6$ の符号が落ちています。', 2: 'それは $\\overrightarrow{\\mathrm{AC}}$ との内積の左辺です。' },
        good: '$s|\\overrightarrow{\\mathrm{AB}}|^2+t\\,\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}-\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AB}}=9s-6t-0=0$ です。',
        add: [{ t: 'm', tex: '\\begin{cases} 9s-6t=0 & (\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AB}})\\\\ -6s+8t=2 & (\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AC}})\\end{cases}' }] } },
      { clear: true, cols: [0.6, 0.4], say: '連立方程式を解いて $s,\\ t$ を出し、H の座標を求めます。',
        add: [{ t: 'h', text: '(2)　つづき：s, t と H の座標' },
          { t: 'm', tex: '\\begin{cases} 9s-6t=0\\\\ -6s+8t=2\\end{cases}' },
          fig('f2b', { h: true }, 340)] },
      { ask: { type: 'think', q: 'この連立方程式を解いて、$s,\\ t$ を求めよう。',
        hint: '1つ目の式から $t=\\dfrac32s$。2つ目の式に代入する。',
        ans: '$s=\\dfrac13,\\quad t=\\dfrac12$',
        after: '$-6s+8\\cdot\\dfrac32s=6s=2$ より $s=\\dfrac13$、$t=\\dfrac32\\cdot\\dfrac13=\\dfrac12$。',
        add: [{ t: 'm', tex: 's=\\frac13,\\qquad t=\\frac12' }] } },
      { say: '$\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+\\frac13\\overrightarrow{\\mathrm{AB}}+\\frac12\\overrightarrow{\\mathrm{AC}}$ を計算します。$s,\\ t>0$、$s+t<1$ なので、H は △ABC の内部にあります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{OH}}&=(2,\\ 0,\\ 1)+\\tfrac13(-2,\\ -1,\\ 2)+\\tfrac12(0,\\ 2,\\ -2)\\\\ &=\\left(\\tfrac43,\\ \\tfrac23,\\ \\tfrac23\\right)\\end{aligned}' },
          { t: 'ans', label: '(2) 答', text: '$s=\\dfrac13,\\quad t=\\dfrac12$\n$\\mathrm{H}\\left(\\dfrac43,\\ \\dfrac23,\\ \\dfrac23\\right)$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$\\overrightarrow{\\mathrm{DH}}$ を成分で出すと、$(1,\\ 2,\\ 2)$ の $-\\frac23$ 倍になっています。',
        add: [{ t: 'h', text: '(3)　DH の長さと体積' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{DH}}&=\\overrightarrow{\\mathrm{OH}}-\\overrightarrow{\\mathrm{OD}}=\\left(-\\tfrac23,\\ -\\tfrac43,\\ -\\tfrac43\\right)\\\\ &=-\\frac23(1,\\ 2,\\ 2)\\end{aligned}' },
          fig('f3', { h: true }, 380)] },
      { ask: { type: 'choice', q: '線分 DH の長さは？',
        opts: ['$\\dfrac23$', '$2$', '$4$', '$\\sqrt5$'], ok: 1,
        why: { 0: '$(1,\\ 2,\\ 2)$ の大きさ $3$ をかけ忘れています。', 2: 'それは $\\mathrm{DH}^2=\\frac{4+16+16}{9}=4$。最後に平方根をとります。', 3: 'それは $|\\overrightarrow{\\mathrm{AD}}|$。DH は D から平面までの最短の長さです。' },
        good: '$\\mathrm{DH}=\\dfrac23\\sqrt{1+4+4}=\\dfrac23\\cdot3=2$。',
        add: [{ t: 'm', tex: '\\mathrm{DH}=\\frac23\\sqrt{1^2+2^2+2^2}=2' }] } },
      { ask: { type: 'choice', q: '四面体 ABCD の体積 $V$ は？（底面 △ABC、高さ DH）',
        opts: ['$6$', '$3$', '$2$', '$1$'], ok: 2,
        why: { 0: '$S\\cdot\\mathrm{DH}=6$ のまま。錐の体積は $\\frac13$ をかけます。', 1: '$\\frac12$ をかけています。三角形の面積の公式と混ざっています。', 3: '$\\frac16$ は「平行四辺形の面積 × 高さ」に使う係数。$S$ はもう三角形の面積です。' },
        good: '$V=\\dfrac13\\cdot S\\cdot\\mathrm{DH}=\\dfrac13\\cdot3\\cdot2=2$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\mathrm{DH}=2,\\qquad V=\\frac13\\cdot3\\cdot2=2' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '(3) で $\\overrightarrow{\\mathrm{DH}}$ が $(1,\\ 2,\\ 2)$ に平行だったのは偶然ではありません。$\\vec n=(1,\\ 2,\\ 2)$ は、$\\overrightarrow{\\mathrm{AB}}$ にも $\\overrightarrow{\\mathrm{AC}}$ にも垂直です。',
        add: [{ t: 'h', text: '別の見方：法線ベクトル' },
          { t: 'm', size: 'sm', tex: '\\vec n\\cdot\\overrightarrow{\\mathrm{AB}}=-2-2+4=0,\\qquad \\vec n\\cdot\\overrightarrow{\\mathrm{AC}}=0+4-4=0' },
          { t: 'p', size: 'sm', text: '$\\vec n$ は平面 ABC に垂直（**法線ベクトル**）。\nDH はこの向きの線分です。' },
          fig('f4', { h: true }, 360)],
        draw: [{ fig: 'f4', items: [{ k: 'label', at: [(D[0] + H[0]) / 2, (D[1] + H[1]) / 2], text: 'n の向き', c: 'p', size: 20, dx: -12, anchor: 'end', plain: true }] }] },
      { ask: { type: 'think', q: '$\\overrightarrow{\\mathrm{AD}}$ の、$\\vec n$ の向きの成分の長さ $\\dfrac{|\\overrightarrow{\\mathrm{AD}}\\cdot\\vec n|}{|\\vec n|}$ を計算して、DH と一致することを確かめよう。',
        hint: '$\\overrightarrow{\\mathrm{AD}}=(0,\\ 2,\\ 1)$、$|\\vec n|=3$。',
        ans: '$\\dfrac{|0+4+2|}{3}=\\dfrac63=2$　で、DH $=2$ と一致する',
        after: 'H を求めなくても高さだけなら出せます。答案では (2) の誘導どおりに書き、この方法は検算に使うと安全です。',
        add: [{ t: 'm', tex: '\\mathrm{DH}=\\frac{|\\overrightarrow{\\mathrm{AD}}\\cdot\\vec n|}{|\\vec n|}=\\frac{6}{3}=2' }] } },
      { say: '答案では、「DH は平面上の平行でない2つのベクトルに垂直」と、垂直の条件を2つ書くことが大切です。計算は内積の表を作るとミスが減ります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案で書くこと', text: '・H は平面 ABC 上 → $\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$\n・DH ⊥ 平面 ABC → $\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ かつ $\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0$\n・体積は $\\dfrac13\\times$底面積$\\times$高さ' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の4点の問題は「角と面積 → 垂線の足 → 体積」がひとつながりの定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
