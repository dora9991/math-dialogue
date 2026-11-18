/* 共通テスト型 数学Ⅰ，A：2026年度 第3問（図形の性質・空間図形）と同じ分野・ねらいの自作問題（元の問題ではない）
   △ABC：AB=8、BC=7、CA=6。∠A の二等分線と BC の交点 D、外接円との交点 E。
   答え（python3・sympy で空間座標を置いて検算ずみ）：BD=4、DC=3／AD·DE=12（方べき）、AD·AE=48（△ABD∽△AEC）→ AD=6、DE=2、AE=8／
   △ABC=21√15/4（cosA=17/32）／仮定1（H=D）：PH²=AD·DE=12、PH=2√3、V₁=21√5/2／仮定2（PA=PE）：H は AE の中点、PH=4、V₂=7√15、V₂/V₁=2√3/3。
   見取図は、平面 β（直線 AE をふくむ鉛直な平面）を正面に置き、奥行きを右上 0.45 倍でかいた斜めから見た図。 */
(function () {
  const POINTS = [
    '角の二等分線は **辺の比**（BD : DC ＝ AB : AC）。外接円と組むと **方べき**（AD·DE ＝ BD·DC）と **相似**（AD·AE ＝ AB·AC）',
    '空間図形は、高さをふくむ **断面（ここでは平面 β）をぬき出して** 平面図形にする。∠APE ＝ 90° ⇔ P は AE を直径とする円の上',
    '直径に垂直な弦の半分 PH は　$\\mathrm{PH}^2=\\mathrm{AH}\\cdot\\mathrm{HE}$。底面が同じなら **体積の比 ＝ 高さの比**'
  ];
  // ---------- 平面の図（(1)(2)）：B(0,0) C(7,0) A(5.5, 3√15/2)、D(4,0)、E(3.5, −√15/2)、外接円 中心(3.5, 17/(2√15)) 半径 16/√15 ----------
  const r15 = Math.sqrt(15), A = [5.5, 1.5 * r15], B = [0, 0], C = [7, 0], D = [4, 0], E = [3.5, -r15 / 2], OC = [3.5, 17 / (2 * r15)], R = 16 / r15;
  const plane = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.3, -2.7, 8.5, 7.0], w: 470, h: 465, items: [
    { k: 'circle', o: OC, r: R, c: 'd' },
    { k: 'poly', pts: [A, B, C], close: true, c: 'w' },
    { k: 'seg', a: A, b: E, c: 'y' },
    { k: 'angle', o: A, a: B, b: D, rp: 46, c: 'g' }, { k: 'angle', o: A, a: D, b: C, rp: 54, c: 'g' },
    { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'w', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'e', r: 4 },
    { k: 'pt', at: D, name: 'D', dir: 'se', r: 4, c: 'y' }, { k: 'pt', at: E, name: 'E', dir: 's', r: 4, c: 'y' },
    { k: 'label', at: [2.75, 2.9], text: '8', c: 'b', size: 24, dx: -14, dy: -8 }, { k: 'label', at: [6.25, 2.9], text: '6', c: 'b', size: 24, dx: 14, dy: -6 }].concat(extra || []) });

  // ---------- 見取図（(3)）：底面の座標を A(0,0) D(6,0) E(8,0) に置きなおす。B(7.0, −3.87)、C(5.25, 2.90)（python3 で回転して計算）----------
  const pj = (x, y, z) => [x + 0.45 * y, 0.45 * y + z];
  const bB = [6.998, -3.873], bC = [5.248, 2.905];
  const sA = pj(0, 0, 0), sD = pj(6, 0, 0), sE = pj(8, 0, 0), sB = pj(bB[0], bB[1], 0), sC = pj(bC[0], bC[1], 0), sP = pj(6, 0, 2 * Math.sqrt(3));
  const semi = []; for (let i = 0; i <= 48; i++) { const t = Math.PI * i / 48; semi.push([4 + 4 * Math.cos(t), 4 * Math.sin(t)]); }
  const solid = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.9, -2.6, 9.3, 4.8], w: 600, h: 435, items: [
    { k: 'poly', pts: [[-0.4, 0], [8.6, 0], [8.6, 4.4], [-0.4, 4.4]], close: true, fill: 'b', alpha: 0.06, c: 'd', dash: true },
    { k: 'poly', pts: semi, c: 'b', dash: true },
    { k: 'poly', pts: [sA, sB, sC], close: false, c: 'w' }, { k: 'seg', a: sA, b: sC, c: 'w', dash: true },
    { k: 'seg', a: sA, b: sE, c: 'y', dash: true },
    { k: 'seg', a: sP, b: sA, c: 'w' }, { k: 'seg', a: sP, b: sB, c: 'w' }, { k: 'seg', a: sP, b: sC, c: 'w' },
    { k: 'seg', a: sP, b: sD, c: 'p', wd: 4 }, { k: 'right', o: sD, a: sA, b: sP, s: 12, c: 'p' },
    { k: 'pt', at: sA, name: 'A', dir: 'w', r: 4 }, { k: 'pt', at: sB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: sC, name: 'C', dir: 'ne', r: 4 },
    { k: 'pt', at: sD, name: 'D＝H', dir: 'se', r: 4, c: 'y', size: 22 }, { k: 'pt', at: sE, name: 'E', dir: 'e', r: 4, c: 'y' }, { k: 'pt', at: sP, name: 'P', dir: 'n', r: 5, c: 'p' },
    { k: 'label', at: [8.4, 4.1], text: '平面 β', c: 'b', size: 21, anchor: 'end', plain: true }].concat(extra || []) });
  // ---------- 断面図（平面 β）：A(0,0) D(6,0) E(8,0)、AE を直径とする半円 ----------
  const sec = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.9, -1.7, 8.9, 5.0], w: 600, h: 410, items: [
    { k: 'seg', a: [-0.6, 0], b: [8.6, 0], c: 'd' },
    { k: 'dim', a: [0, 0], b: [6, 0], dy: 52, label: '6', c: 'y' }, { k: 'dim', a: [6, 0], b: [8, 0], dy: 52, label: '2', c: 'y' },
    { k: 'poly', pts: semi, c: 'b' },
    { k: 'pt', at: [0, 0], name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: [8, 0], name: 'E', dir: 'se', r: 4, c: 'y' },
    { k: 'pt', at: [6, 0], name: 'D', dir: 's', r: 4, c: 'y' }, { k: 'pt', at: [4, 0], name: 'M', dir: 's', r: 4, c: 'g' }].concat(extra || []) });
  const P1 = [6, 2 * Math.sqrt(3)];
  const part = (label, text) => ({ t: 'box', c: 'b', size: 'sm', label, text });

  HB.lesson({
    id: 'ct26-1a-3', field: '共通テスト型　数学Ⅰ，A', title: '2026 共通テスト 数学Ⅰ，A 第3問の類題 ― 角の二等分線・方べきと四面体の体積',
    level: '2026年度 第3問の類題（自作）', time: '目安 15〜20分', noDec: true,
    problem: {
      label: '類題',
      lead: '$\\triangle\\mathrm{ABC}$ において $\\mathrm{AB}=8,\\ \\mathrm{BC}=7,\\ \\mathrm{CA}=6$ とする。$\\angle\\mathrm{BAC}$ の二等分線と辺 BC の交点を D、直線 AD と $\\triangle\\mathrm{ABC}$ の外接円の交点のうち A でないものを E とする。',
      parts: [
        '(1)　$\\mathrm{BD}=\\boxed{\\text{ア}},\\ \\mathrm{DC}=\\boxed{\\text{イ}}$ である。',
        '(2)　方べきの定理により $\\mathrm{AD}\\cdot\\mathrm{DE}=\\boxed{\\text{ウエ}}$ である。また、$\\triangle\\mathrm{ABD}\\backsim\\triangle\\mathrm{AEC}$ であるから $\\mathrm{AD}\\cdot\\mathrm{AE}=\\boxed{\\text{オカ}}$ である。よって $\\mathrm{AD}=\\boxed{\\text{キ}},\\ \\mathrm{DE}=\\boxed{\\text{ク}}$ である。',
        '(3)　直線 AE をふくみ平面 ABC に垂直な平面を $\\beta$ とする。$\\beta$ 上で平面 ABC の上側に $\\angle\\mathrm{APE}=90^\\circ$ となる点 P をとり、P から平面 ABC に下ろした垂線を PH とする（H は線分 AE 上にある）。四面体 PABC の体積について、次の2つの仮定のもとで考える。\n仮定1：H が D と一致する。このとき $\\mathrm{PH}=\\boxed{\\text{ケ}}\\sqrt{\\boxed{\\text{コ}}}$ であり、四面体 PABC の体積 $V_1$ は $V_1=\\dfrac{\\boxed{\\text{サシ}}\\sqrt{\\boxed{\\text{ス}}}}{\\boxed{\\text{セ}}}$ である。\n仮定2：$\\mathrm{PA}=\\mathrm{PE}$ である。このとき $\\mathrm{PH}=\\boxed{\\text{ソ}}$ であり、四面体 PABC の体積を $V_2$ とすると $\\dfrac{V_2}{V_1}=\\boxed{\\text{タ}}$ である。\nタの解答群　⓪ $\\frac{\\sqrt3}{2}$　① $\\frac{2\\sqrt3}{3}$　② $\\frac43$　③ $\\sqrt3$'
      ],
      src: '※ 2026年度 共通テスト 数学Ⅰ，A 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '図形の性質の大問です。前半は平面図形（角の二等分線・方べき・相似）、後半は四面体の体積。後半は **自分で断面図をかけるか** が勝負です。',
        add: [{ t: 'box', c: 'y', label: '類題の流れ', text: '(1)(2)　△ABC の中の長さ：BD・DC、AD・DE\n(3)　平面 β で切った断面をかいて、高さ PH を出す\n　　→ 2つの仮定で、四面体の体積がどう変わるか' },
          { t: 'box', c: 'g', size: 'sm', label: '共通テストのコツ', text: '参考図だけで考えず、**断面図をノートにかき直す**。前半の結果（AD・DE）が後半の高さに直結する。' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。角の二等分線は、向かい合う辺を、はさむ2辺の比に分けます。BD : DC ＝ AB : AC ＝ 8 : 6 ＝ 4 : 3。',
        add: [part('(1)', '$\\mathrm{BD}=\\boxed{\\text{ア}},\\ \\mathrm{DC}=\\boxed{\\text{イ}}$'),
          { t: 'm', tex: '\\mathrm{BD}:\\mathrm{DC}=\\mathrm{AB}:\\mathrm{AC}=4:3', note: '角の二等分線と比' }, plane('f1')] },
      { ask: { type: 'choice', q: 'BC ＝ 7 なので、BD（$\\boxed{\\text{ア}}$）は？',
        opts: ['$3$', '$\\dfrac72$', '$4$', '$\\dfrac83$'], ok: 2,
        why: { 0: '比が逆。AB（8）に近いほう、B の側が長くなります。', 1: 'それは BC の中点。二等分するのは角で、辺ではありません。', 3: '$7\\times\\frac{8}{21}$ のように、比の和を 8＋6＋7 にしています。和は 4＋3＝7。' },
        good: '$\\mathrm{BD}=7\\times\\dfrac{4}{7}=4$、$\\mathrm{DC}=3$。',
        add: [{ t: 'ans', label: 'ア・イ', text: '$\\mathrm{BD}=4,\\ \\mathrm{DC}=3$' }],
        draw: [{ fig: 'f1', items: [{ k: 'label', at: [2, 0], text: '4', c: 'y', size: 24, dy: 22 }, { k: 'label', at: [5.5, 0], text: '3', c: 'y', size: 24, dy: 22 }] }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。弦 AE と弦 BC が、円の内部の点 D で交わっています。**方べきの定理** が使えます。',
        add: [part('(2)', '$\\mathrm{AD}\\cdot\\mathrm{DE}=\\boxed{\\text{ウエ}}$、$\\mathrm{AD}\\cdot\\mathrm{AE}=\\boxed{\\text{オカ}}$\n$\\mathrm{AD}=\\boxed{\\text{キ}},\\ \\mathrm{DE}=\\boxed{\\text{ク}}$'),
          { t: 'box', c: 'b', size: 'sm', label: '方べきの定理', text: '2つの弦 AE、BC が点 D で交わるとき\n$\\mathrm{DA}\\cdot\\mathrm{DE}=\\mathrm{DB}\\cdot\\mathrm{DC}$' }, plane('f2')] },
      { ask: { type: 'choice', q: '$\\mathrm{AD}\\cdot\\mathrm{DE}$（$\\boxed{\\text{ウエ}}$）は？',
        opts: ['$12$', '$7$', '$16$', '$48$'], ok: 0,
        why: { 1: 'BD＋DC（＝BC）ではなく、積 BD·DC です。', 2: '$4^2$ にしています。DB と DC は別の長さです。', 3: '48 は AB·AC。これは次の相似で出てくる値です。' },
        good: '$\\mathrm{AD}\\cdot\\mathrm{DE}=\\mathrm{BD}\\cdot\\mathrm{DC}=4\\cdot3=12$。',
        add: [{ t: 'm', tex: '\\mathrm{AD}\\cdot\\mathrm{DE}=4\\cdot3=\\ans{12}' }] } },
      { say: '次に相似。$\\angle\\mathrm{BAD}=\\angle\\mathrm{EAC}$（二等分線）、$\\angle\\mathrm{ABD}=\\angle\\mathrm{AEC}$（弧 AC に対する円周角）。2組の角が等しいので $\\triangle\\mathrm{ABD}\\backsim\\triangle\\mathrm{AEC}$ です。',
        add: [{ t: 'm', tex: '\\mathrm{AB}:\\mathrm{AE}=\\mathrm{AD}:\\mathrm{AC}' }, { t: 'm', tex: '\\mathrm{AD}\\cdot\\mathrm{AE}=\\mathrm{AB}\\cdot\\mathrm{AC}=48', note: 'オカ $=48$' }],
        draw: [{ fig: 'f2', items: [{ k: 'seg', a: E, b: C, c: 'g', dash: true }, { k: 'angle', o: B, a: C, b: A, rp: 30, c: 'p' }, { k: 'angle', o: E, a: A, b: C, rp: 30, c: 'p' }] }] },
      { ask: { type: 'think', q: '$\\mathrm{AD}\\cdot\\mathrm{DE}=12$、$\\mathrm{AD}\\cdot\\mathrm{AE}=48$ から、AD（$\\boxed{\\text{キ}}$）と DE（$\\boxed{\\text{ク}}$）を求めよう。',
        hint: '$\\mathrm{AE}=\\mathrm{AD}+\\mathrm{DE}$ を使って、2つの式を引く。',
        ans: '$\\mathrm{AD}(\\mathrm{AD}+\\mathrm{DE})=48$ から $\\mathrm{AD}^2+12=48$、$\\mathrm{AD}^2=36$。$\\mathrm{AD}=6$、$\\mathrm{DE}=\\frac{12}{6}=2$',
        after: '$\\mathrm{AD}^2=\\mathrm{AB}\\cdot\\mathrm{AC}-\\mathrm{BD}\\cdot\\mathrm{DC}$ という形（角の二等分線の長さ）になっています。$\\mathrm{AE}=8$ も後で使います。',
        add: [{ t: 'ans', label: 'キ・ク', text: '$\\mathrm{AD}=6,\\ \\mathrm{DE}=2$　（$\\mathrm{AE}=8$）' }] } },

      // ---------- (3) 見取図 ----------
      { clear: true, cols: [0.5, 0.5], part: '(3)', say: '(3) は空間。平面 β は、直線 AE をふくんで底面に垂直な「たての壁」。P はこの壁の上にあり、P から下ろした垂線の足 H も AE 上にあります。',
        add: [part('(3)', '$\\beta$：直線 AE をふくみ、平面 ABC に垂直\nP は $\\beta$ 上、$\\angle\\mathrm{APE}=90^\\circ$、H は垂線の足\n仮定1：H＝D　仮定2：PA＝PE'),
          { t: 'p', size: 'sm', text: '体積 $=\\dfrac13\\times\\triangle\\mathrm{ABC}\\times\\mathrm{PH}$\n底面は同じ → **高さ PH** を求めればよい' }, solid('s1')] },
      { clear: true, say: '高さ PH は、平面 β で切った **断面図** で考えます。β の上には A, D, E が一直線に並び、P もこの平面上にあります。黒板にかき直しましょう。',
        add: [{ t: 'h', text: '(3)　断面図（平面 β）をかく' },
          { t: 'tbl', size: 'sm', rows: [['β の上にあるもの', ''], ['直線 AE', '$\\mathrm{AD}=6,\\ \\mathrm{DE}=2,\\ \\mathrm{AE}=8$'], ['点 P', '$\\angle\\mathrm{APE}=90^\\circ$'], ['高さ PH', 'P から AE への垂線']] },
          sec('c1')] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{APE}=90^\\circ$ のとき、点 P は β の上でどんな図形の上にある？',
        opts: ['A を中心とする半径 8 の円', 'D を中心とする円', '線分 AE の垂直二等分線', 'AE を直径とする円'], ok: 3,
        why: { 0: 'それは PA ＝ 8 の点の集まり。角の条件とは関係ありません。', 1: 'D からの距離は一定ではありません。', 2: 'それは PA ＝ PE となる点の集まり（仮定2）です。' },
        good: '円周角の定理の逆：$\\angle\\mathrm{APE}=90^\\circ$ ⇔ P は AE を直径とする円の上（中心は AE の中点 M、半径 4）。',
        draw: [{ fig: 'c1', items: [{ k: 'label', at: [4, 4], text: '半径 4', c: 'b', size: 21, dy: -22, plain: true }] }] } },

      // ---------- (3) 仮定1 ----------
      { clear: true, say: '仮定1：H が D と一致。P から AE に下ろした垂線 PD は、直径 AE に垂直な弦の半分です。方べきの定理（または相似）から $\\mathrm{PD}^2=\\mathrm{AD}\\cdot\\mathrm{DE}$。',
        add: [{ t: 'h', text: '(3)　仮定1：H ＝ D のとき' },
          { t: 'box', c: 'b', size: 'sm', label: '直径に垂直な弦', text: 'P の反対側の点を P′ とすると、方べきの定理で\n$\\mathrm{DP}\\cdot\\mathrm{DP}^{\\prime}=\\mathrm{DA}\\cdot\\mathrm{DE}$、$\\mathrm{DP}=\\mathrm{DP}^{\\prime}$' },
          sec('c2', [{ k: 'seg', a: [6, 0], b: P1, c: 'p', wd: 4 },
            { k: 'seg', a: [0, 0], b: P1, c: 'w' }, { k: 'seg', a: [8, 0], b: P1, c: 'w' }, { k: 'right', o: P1, a: [0, 0], b: [8, 0], s: 12, c: 'y' },
            { k: 'pt', at: P1, name: 'P', dir: 'n', r: 5, c: 'p' }])] },
      { ask: { type: 'choice', q: '仮定1のとき、高さ PH（$\\boxed{\\text{ケ}}\\sqrt{\\boxed{\\text{コ}}}$）は？',
        opts: ['$4$', '$2\\sqrt3$', '$2\\sqrt2$', '$4\\sqrt3$'], ok: 1,
        why: { 0: '4 は半径。P が真上（M の上）にあるのは仮定2のときです。', 2: '$\\mathrm{AD}+\\mathrm{DE}$ ではなく積です：$\\mathrm{PH}^2=6\\times2=12$。', 3: '$4\\sqrt3$ は $\\mathrm{PA}$（$\\mathrm{PA}^2=\\mathrm{AH}\\cdot\\mathrm{AE}=48$）。高さではありません。' },
        good: '$\\mathrm{PH}^2=\\mathrm{AD}\\cdot\\mathrm{DE}=12$ より $\\mathrm{PH}=2\\sqrt3$。(2) の結果がそのまま使えます。',
        add: [{ t: 'm', tex: '\\mathrm{PH}^2=6\\cdot2=12,\\quad \\mathrm{PH}=\\ans{2\\sqrt3}' }] } },
      { ask: { type: 'think', q: '底面 $\\triangle\\mathrm{ABC}$ の面積を求めよう。（$\\cos\\angle\\mathrm{BAC}$ から）',
        hint: '余弦定理で $\\cos A=\\dfrac{8^2+6^2-7^2}{2\\cdot8\\cdot6}$。',
        ans: '$\\cos A=\\dfrac{51}{96}=\\dfrac{17}{32}$、$\\sin A=\\dfrac{7\\sqrt{15}}{32}$。面積 $=\\dfrac12\\cdot8\\cdot6\\cdot\\dfrac{7\\sqrt{15}}{32}=\\dfrac{21\\sqrt{15}}{4}$',
        after: 'ヘロンの公式でも同じ値になります。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{ABC}=\\frac{21\\sqrt{15}}{4}' }] } },
      { say: '仮定1の体積です。$\\sqrt{15}\\times\\sqrt3=3\\sqrt5$ に注意して計算します。',
        add: [{ t: 'ans', label: 'サシ〜セ', tex: 'V_1=\\frac13\\cdot\\frac{21\\sqrt{15}}{4}\\cdot2\\sqrt3=\\frac{21\\sqrt5}{2}' }] },

      // ---------- (3) 仮定2 ----------
      { clear: true, say: '仮定2：PA ＝ PE。P は AE の垂直二等分線の上にあり、しかも AE を直径とする円の上。だから H は中点 M で、PH は半径の 4 です。',
        add: [{ t: 'h', text: '(3)　仮定2：PA ＝ PE のとき' },
          { t: 'm', tex: '\\mathrm{H}=\\mathrm{M},\\quad \\mathrm{PH}=\\frac{\\mathrm{AE}}{2}=4', note: 'ソ $=4$' },
          sec('c3', [{ k: 'seg', a: [4, 0], b: [4, 4], c: 'g', wd: 4 }, { k: 'seg', a: [0, 0], b: [4, 4], c: 'w' }, { k: 'seg', a: [8, 0], b: [4, 4], c: 'w' },
            { k: 'pt', at: [4, 4], name: 'P（仮定2）', dir: 'n', r: 5, c: 'g', size: 22 },
            { k: 'seg', a: [6, 0], b: P1, c: 'p', dash: true }, { k: 'pt', at: P1, name: '仮定1', dir: 'ne', r: 4, c: 'p', size: 20 }])] },
      { ask: { type: 'choice', q: '$\\dfrac{V_2}{V_1}$（$\\boxed{\\text{タ}}$）は？',
        opts: ['⓪ $\\dfrac{\\sqrt3}{2}$', '① $\\dfrac{2\\sqrt3}{3}$', '② $\\dfrac43$', '③ $\\sqrt3$'], ok: 1,
        why: { 0: '逆数です。仮定2のほうが高い（4 > 2√3）ので、比は 1 より大きくなります。', 2: '高さの比は $4:2\\sqrt3$。$\\mathrm{PH}^2$ の比ではなく、PH そのものの比です。', 3: '$\\frac{4}{2\\sqrt3}=\\frac{2}{\\sqrt3}$。分母を有理化すると $\\frac{2\\sqrt3}{3}$。' },
        good: '底面が同じなので、体積の比は高さの比。$\\dfrac{4}{2\\sqrt3}=\\dfrac{2\\sqrt3}{3}$。',
        add: [{ t: 'm', tex: '\\frac{V_2}{V_1}=\\frac{\\mathrm{PH}_2}{\\mathrm{PH}_1}=\\frac{4}{2\\sqrt3}=\\frac{2\\sqrt3}{3}' }, { t: 'ans', label: 'ソ・タ', text: '$\\mathrm{PH}=4$　タ ＝ ①　（$V_2=7\\sqrt{15}$）' }] } },
      { say: 'P が半円の上を動くとき、高さがいちばん大きいのは真ん中（仮定2）。だから四面体の体積も仮定2のときが最大です。体積の比は、$V$ を出さなくても高さの比だけで求められます。' },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間図形の問題は「どの平面で切るか」を決めると、平面図形の定理がそのまま使えます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、断面図を自分でかくところから解き直してみましょう。' }
    ]
  });
})();
