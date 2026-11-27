/* 2026 佐賀大 理系 第1問の類題②（自作）：座標空間の4点 → なす角と面積、垂線の足、垂線の長さと四面体の体積
   問題：A(1,0,2)、B(2,0,1)、C(1,2,0)、D(2,1,2)（類題①とは、角が 60°・法線が (1,1,1)・答えに √3 が出る点がちがう）
   答え（python3・sympy で検算ずみ）：
   (1) AB=(1,0,−1)、AC=(0,2,−2)、AB・AC=2、|AB|=√2、|AC|=2√2 → cos∠BAC=2/4=1/2、∠BAC=60°、S=½·√2·2√2·sin60°=√3
       （別式 S=½√(2·8−2²)=½√12=√3）
   (2) AD=(1,1,0)。内積：AB・AB=2、AB・AC=2、AC・AC=8、AD・AB=1、AD・AC=2
       DH・AB=0 → 2s+2t=1、DH・AC=0 → 2s+8t=2 → t=1/6、s=1/3、H(4/3, 1/3, 4/3)（s,t>0、s+t=1/2<1 で △ABC の内部）
   (3) DH=H−D=(−2/3,−2/3,−2/3)=−(2/3)(1,1,1)、DH=2√3/3、V=(1/3)·√3·(2√3/3)=2/3
       別の見方：n=(1,1,1) は AB・AC の両方に垂直。DH=|AD・n|/|n|=2/√3=2√3/3。V=|AB・(AC×AD)|/6=2/3 も一致
   図：平面 ABC の法線 (1,1,1) が画面の上向きになるように正射影した見取図（D の真下に H がくる）。 */
(function () {
  // ---- 見取図：E1＝画面の右、E2＝画面の上（平面 ABC を上から 30° 見下ろす向き） ----
  const E1 = [0.4082, 0.4082, -0.8165], E2 = [0.1464, 0.8536, 0.5];
  const pj = p => [p[0] * E1[0] + p[1] * E1[1] + p[2] * E1[2], p[0] * E2[0] + p[1] * E2[1] + p[2] * E2[2]];
  const A3 = [1, 0, 2], B3 = [2, 0, 1], C3 = [1, 2, 0], D3 = [2, 1, 2], H3 = [4 / 3, 1 / 3, 4 / 3];
  const A = pj(A3), B = pj(B3), C = pj(C3), D = pj(D3), H = pj(H3);
  const tetra = (opt) => {
    const o = opt || {};
    const items = [
      { k: 'poly', pts: [A, B, C], close: true, fill: 'g', alpha: 0.16, c: 'g', wd: 3 },
      { k: 'seg', a: D, b: A, c: 'w', wd: 2.5 }, { k: 'seg', a: D, b: B, c: 'w', wd: 2.5 }, { k: 'seg', a: D, b: C, c: 'w', wd: 2.5 },
      { k: 'pt', at: A, name: 'A', dir: 'w', r: 5 }, { k: 'pt', at: B, name: 'B', dir: 's', r: 5 }, { k: 'pt', at: C, name: 'C', dir: 'e', r: 5 },
      { k: 'pt', at: D, name: 'D', dir: 'n', r: 5, c: 'b' }
    ];
    if (o.ab) items.push({ k: 'vec', a: A, b: B, c: 'y', wd: 3.5 }, { k: 'vec', a: A, b: C, c: 'b', wd: 3.5 }, { k: 'angle', o: A, a: B, b: C, rp: 30, c: 'y' });
    if (o.h) items.push({ k: 'seg', a: D, b: H, c: 'p', wd: 3, dash: true }, { k: 'pt', at: H, name: 'H', dir: 'w', r: 5, c: 'p' });
    return items;
  };
  const fig = (id, opt, h) => ({ t: 'fig', id, col: 1, view: [-2, 0.4, 2, 2.8], w: Math.round((h || 330) * 4 / 2.4), h: h || 330, items: tetra(opt) });   // 縦横比は view にそろえる
  const POINTS = [
    '内積から $\\cos\\theta=\\dfrac{\\vec p\\cdot\\vec q}{|\\vec p||\\vec q|}$ を出し、面積は $S=\\dfrac12|\\vec p||\\vec q|\\sin\\theta$（$\\dfrac12\\sqrt{|\\vec p|^2|\\vec q|^2-(\\vec p\\cdot\\vec q)^2}$ でも同じ）',
    '垂線の足 H は「$\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$（平面上）」と「$\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AC}}$」の2つで決まる',
    '体積は $V=\\dfrac13S\\cdot\\mathrm{DH}$。答えに $\\sqrt3$ が出ても、$S$ と DH の $\\sqrt3$ が打ち消し合って有理数になることがある'
  ];

  HB.lesson({
    id: 'saga26-1b', field: '佐賀大型　数学（理系）', title: '2026 佐賀大 理系 第1問の類題② ― 60°の三角形と垂線の足・四面体の体積', level: '2026年度 佐賀大学 理系 第1問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '座標空間に 4 点 $\\mathrm{A}(1,\\ 0,\\ 2)$、$\\mathrm{B}(2,\\ 0,\\ 1)$、$\\mathrm{C}(1,\\ 2,\\ 0)$、$\\mathrm{D}(2,\\ 1,\\ 2)$ がある。',
      parts: [
        '(1)　$\\angle\\mathrm{BAC}$ の大きさを求めよ。また、$\\triangle\\mathrm{ABC}$ の面積 $S$ を求めよ。',
        '(2)　点 D から平面 ABC に垂線を下ろし、平面 ABC との交点を H とする。$\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ をみたす実数 $s,\\ t$ の値を求めよ。また、点 H の座標を求めよ。',
        '(3)　線分 DH の長さと、四面体 ABCD の体積 $V$ を求めよ。'
      ],
      src: '※ 2026年度 佐賀大学 前期 理工学部 数学 第1問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '座標空間の4点から、角・面積・垂線の足・体積を順に求める問題です。今回は答えに $\\sqrt3$ が出てきます。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '右は4点の見取図です。底面を △ABC と見ると、D から下ろした垂線 DH が高さ。(1)(2)(3) は「底面積 → 高さ → 体積」の順です。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'b', size: 'sm', label: '流れ', text: '(1)　底面 △ABC の面積 $S$\n(2)　垂線の足 H（高さの足）\n(3)　高さ DH と 体積 $V=\\dfrac13S\\cdot\\mathrm{DH}$' },
          fig('f0', { h: true })] },
      { ask: { type: 'choice', q: '点 H が「D から平面 ABC に下ろした垂線の足」であるための条件は？（H は平面 ABC 上の点）',
        opts: ['$\\mathrm{DH}\\perp\\mathrm{BC}$ だけ', '$\\mathrm{AH}=\\mathrm{DH}$', '$\\mathrm{DH}\\perp\\mathrm{AB}$ かつ $\\mathrm{DH}\\perp\\mathrm{AC}$', '$\\mathrm{DH}\\parallel\\mathrm{AB}$'], ok: 2,
        why: { 0: '1本の直線に垂直なだけでは、平面に垂直とはいえません。平行でない2本に垂直であることが必要です。', 1: '長さが等しいことは、垂直とは関係ありません。', 3: '平行だと、DH は平面 ABC の中にふくまれてしまいます。垂直とは正反対です。' },
        good: '平面上の平行でない2つのベクトル $\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{AC}}$ の両方に垂直なら、DH は平面 ABC に垂直です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\qquad \\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0', note: '(2) で使う2つの式' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。まず A を始点とするベクトルを成分で出します。終点の座標から始点の座標を引きます。',
        add: [{ t: 'h', text: '(1)　∠BAC と △ABC の面積' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}=(1,\\ 0,\\ -1),\\qquad \\overrightarrow{\\mathrm{AC}}=(0,\\ 2,\\ -2)' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|=\\sqrt{1+0+1}=\\sqrt2,\\qquad |\\overrightarrow{\\mathrm{AC}}|=\\sqrt{0+4+4}=2\\sqrt2' },
          fig('f1', { ab: true }, 330)] },
      { ask: { type: 'choice', q: '内積 $\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$ の値は？',
        opts: ['$-2$', '$0$', '$4$', '$2$'], ok: 3,
        why: { 0: '$z$ 成分は $(-1)\\cdot(-2)=+2$。マイナスどうしの積は正です。', 1: '$z$ 成分どうしの積 $(-1)\\cdot(-2)=2$ を足し忘れています。', 2: '$z$ 成分の 2 を2回数えています。成分ごとの積は $0,\\ 0,\\ 2$ の3つです。' },
        good: '$1\\cdot0+0\\cdot2+(-1)\\cdot(-2)=0+0+2=2$。成分ごとの積の和です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=0+0+2=2' }] } },
      { ask: { type: 'choice', q: '$\\cos\\angle\\mathrm{BAC}=\\dfrac{2}{\\sqrt2\\cdot2\\sqrt2}$ から、$\\angle\\mathrm{BAC}$ は？',
        opts: ['$30^\\circ$', '$45^\\circ$', '$60^\\circ$', '$120^\\circ$'], ok: 2,
        why: { 0: '$\\cos30^\\circ=\\frac{\\sqrt3}{2}$。ここでは分母が $\\sqrt2\\cdot2\\sqrt2=4$ なので $\\frac12$ です。', 1: '$\\cos45^\\circ=\\frac{1}{\\sqrt2}$。値がちがいます。', 3: '$\\cos$ が正なので鋭角です。$120^\\circ$ は $\\cos=-\\frac12$。' },
        good: '$\\dfrac{2}{4}=\\dfrac12$ なので $\\angle\\mathrm{BAC}=60^\\circ$ です。',
        add: [{ t: 'm', tex: '\\cos\\angle\\mathrm{BAC}=\\frac{2}{\\sqrt2\\cdot2\\sqrt2}=\\frac12\\qquad \\therefore\\ \\angle\\mathrm{BAC}=60^\\circ' }] } },
      { say: '面積は $\\frac12\\times$（2辺）$\\times\\sin$。$\\sin60^\\circ=\\frac{\\sqrt3}{2}$ で $S=\\sqrt3$。内積だけで出す公式でも、同じ $\\sqrt3$ になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}S&=\\frac12\\cdot\\sqrt2\\cdot2\\sqrt2\\cdot\\sin60^\\circ=\\sqrt3\\\\ &=\\frac12\\sqrt{2\\cdot8-2^2}=\\frac12\\sqrt{12}=\\sqrt3\\end{aligned}' },
          { t: 'ans', label: '(1) 答', tex: '\\angle\\mathrm{BAC}=60^\\circ,\\qquad S=\\sqrt3' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。H は平面 ABC 上なので $\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$。$\\overrightarrow{\\mathrm{DH}}=\\overrightarrow{\\mathrm{AH}}-\\overrightarrow{\\mathrm{AD}}$ と、A を始点にそろえます。',
        add: [{ t: 'h', text: '(2)　垂線の足 H' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AD}}=(1,\\ 1,\\ 0)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}-\\overrightarrow{\\mathrm{AD}}' },
          fig('f2', { h: true }, 330)] },
      { say: '成分を全部書くより、**内積のまま計算** すると楽です。必要な内積を先に表にしておきます。',
        add: [{ t: 'tbl', size: 'sm', rows: [['', '$\\overrightarrow{\\mathrm{AB}}$', '$\\overrightarrow{\\mathrm{AC}}$'], ['$\\overrightarrow{\\mathrm{AB}}$', '$2$', '$2$'], ['$\\overrightarrow{\\mathrm{AC}}$', '$2$', '$8$'], ['$\\overrightarrow{\\mathrm{AD}}$', '$1$', '$2$']] }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ を $s,\\ t$ の式にすると？',
        opts: ['$2s+2t=0$', '$2s+8t=2$', '$s+t=1$', '$2s+2t=1$'], ok: 3,
        why: { 0: '右辺は $\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AB}}=1$ です。移項するのを忘れています。', 1: 'それは $\\overrightarrow{\\mathrm{AC}}$ との内積の式です。', 2: '$s+t=1$ は H が辺 BC 上にあるときの条件で、垂直の条件ではありません。' },
        good: '$s|\\overrightarrow{\\mathrm{AB}}|^2+t\\,\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}-\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AB}}=2s+2t-1=0$ です。',
        add: [{ t: 'm', tex: '\\begin{cases} 2s+2t=1 & (\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AB}})\\\\ 2s+8t=2 & (\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AC}})\\end{cases}' }] } },
      { clear: true, cols: [0.6, 0.4], say: '連立方程式を解いて $s,\\ t$ を出し、H の座標を求めます。',
        add: [{ t: 'h', text: '(2)　つづき：s, t と H の座標' },
          { t: 'm', tex: '\\begin{cases} 2s+2t=1\\\\ 2s+8t=2\\end{cases}' },
          fig('f2b', { h: true }, 270)] },
      { ask: { type: 'think', q: 'この連立方程式を解いて、$s,\\ t$ を求めよう。',
        hint: '2つの式を引くと $s$ が消える。',
        ans: '$s=\\dfrac13,\\quad t=\\dfrac16$',
        after: '下の式から上の式を引くと $6t=1$ より $t=\\dfrac16$。上の式に代入して $2s=1-\\dfrac13=\\dfrac23$、$s=\\dfrac13$。',
        add: [{ t: 'm', tex: 's=\\frac13,\\qquad t=\\frac16' }] } },
      { say: '$\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+\\frac13\\overrightarrow{\\mathrm{AB}}+\\frac16\\overrightarrow{\\mathrm{AC}}$ を計算します。$s,\\ t>0$、$s+t<1$ なので、H は △ABC の内部にあります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{OH}}&=(1,\\ 0,\\ 2)+\\tfrac13(1,\\ 0,\\ -1)+\\tfrac16(0,\\ 2,\\ -2)\\\\ &=\\left(\\tfrac43,\\ \\tfrac13,\\ \\tfrac43\\right)\\end{aligned}' },
          { t: 'ans', label: '(2) 答', text: '$s=\\dfrac13,\\quad t=\\dfrac16$\n$\\mathrm{H}\\left(\\dfrac43,\\ \\dfrac13,\\ \\dfrac43\\right)$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$\\overrightarrow{\\mathrm{DH}}$ を成分で出すと、$(1,\\ 1,\\ 1)$ の $-\\frac23$ 倍になっています。',
        add: [{ t: 'h', text: '(3)　DH の長さと体積' },
          { t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{DH}}&=\\overrightarrow{\\mathrm{OH}}-\\overrightarrow{\\mathrm{OD}}=\\left(-\\tfrac23,\\ -\\tfrac23,\\ -\\tfrac23\\right)\\\\ &=-\\frac23(1,\\ 1,\\ 1)\\end{aligned}' },
          fig('f3', { h: true }, 330)] },
      { ask: { type: 'choice', q: '線分 DH の長さは？',
        opts: ['$\\dfrac{2\\sqrt3}{3}$', '$\\dfrac23$', '$2\\sqrt3$', '$\\dfrac43$'], ok: 0,
        why: { 1: '$(1,\\ 1,\\ 1)$ の大きさ $\\sqrt3$ をかけ忘れています。', 2: '$\\frac23$ ではなく $2$ をかけています。$\\frac23$ 倍です。', 3: 'それは $\\mathrm{DH}^2=\\frac49\\cdot3=\\frac43$。最後に平方根をとります。' },
        good: '$\\mathrm{DH}=\\dfrac23\\sqrt{1+1+1}=\\dfrac{2\\sqrt3}{3}$。',
        add: [{ t: 'm', tex: '\\mathrm{DH}=\\frac23\\sqrt{1^2+1^2+1^2}=\\frac{2\\sqrt3}{3}' }] } },
      { ask: { type: 'choice', q: '四面体 ABCD の体積 $V$ は？（底面 △ABC、高さ DH）',
        opts: ['$2$', '$\\dfrac23$', '$\\dfrac{2\\sqrt3}{3}$', '$\\dfrac13$'], ok: 1,
        why: { 0: '$S\\cdot\\mathrm{DH}=\\sqrt3\\cdot\\frac{2\\sqrt3}{3}=2$ のまま。錐の体積は $\\frac13$ をかけます。', 2: 'それは DH の値です。$S$ と $\\frac13$ をかけていません。', 3: '$\\frac12$ もかけています。$S$ はもう三角形の面積なので、$\\frac13$ だけです。' },
        good: '$V=\\dfrac13\\cdot S\\cdot\\mathrm{DH}=\\dfrac13\\cdot\\sqrt3\\cdot\\dfrac{2\\sqrt3}{3}=\\dfrac23$。$\\sqrt3$ どうしが打ち消し合います。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\mathrm{DH}=\\frac{2\\sqrt3}{3},\\qquad V=\\frac23' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '(3) で $\\overrightarrow{\\mathrm{DH}}$ が $(1,\\ 1,\\ 1)$ に平行だったのは偶然ではありません。$\\vec n=(1,\\ 1,\\ 1)$ は、$\\overrightarrow{\\mathrm{AB}}$ にも $\\overrightarrow{\\mathrm{AC}}$ にも垂直です。',
        add: [{ t: 'h', text: '別の見方：法線ベクトル' },
          { t: 'm', size: 'sm', tex: '\\vec n\\cdot\\overrightarrow{\\mathrm{AB}}=1+0-1=0,\\qquad \\vec n\\cdot\\overrightarrow{\\mathrm{AC}}=0+2-2=0' },
          { t: 'p', size: 'sm', text: '$\\vec n$ は平面 ABC に垂直（**法線ベクトル**）。\nDH はこの向きの線分です。' },
          fig('f4', { h: true }, 280)],
        draw: [{ fig: 'f4', items: [{ k: 'label', at: [(D[0] + H[0]) / 2, (D[1] + H[1]) / 2], text: 'n の向き', c: 'p', size: 20, dx: 12, anchor: 'start', plain: true }] }] },
      { ask: { type: 'think', q: '$\\overrightarrow{\\mathrm{AD}}$ の、$\\vec n$ の向きの成分の長さ $\\dfrac{|\\overrightarrow{\\mathrm{AD}}\\cdot\\vec n|}{|\\vec n|}$ を計算して、DH と一致することを確かめよう。',
        hint: '$\\overrightarrow{\\mathrm{AD}}=(1,\\ 1,\\ 0)$、$|\\vec n|=\\sqrt3$。',
        ans: '$\\dfrac{|1+1+0|}{\\sqrt3}=\\dfrac{2}{\\sqrt3}=\\dfrac{2\\sqrt3}{3}$　で、DH と一致する',
        after: 'H を求めなくても高さだけなら出せます。答案では (2) の誘導どおりに書き、この方法は検算に使うと安全です。',
        add: [{ t: 'm', tex: '\\mathrm{DH}=\\frac{|\\overrightarrow{\\mathrm{AD}}\\cdot\\vec n|}{|\\vec n|}=\\frac{2}{\\sqrt3}=\\frac{2\\sqrt3}{3}' }] } },
      { say: '答案では、「DH は平面上の平行でない2つのベクトルに垂直」と、垂直の条件を2つ書くことが大切です。計算は内積の表を作るとミスが減ります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案で書くこと', text: '・H は平面 ABC 上 → $\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$\n・DH ⊥ 平面 ABC → $\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ かつ $\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0$\n・体積は $\\dfrac13\\times$底面積$\\times$高さ' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の4点の問題は「角と面積 → 垂線の足 → 体積」がひとつながりの定番の流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
