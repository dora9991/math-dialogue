/* 数学Ⅰ 第4章 図形と計量 三角形への応用 ⑥：空間図形への応用
   例はすべて自作（測量 AB=40 m, ∠HAB=45°, ∠HBA=75°, ∠PBH=60° → BH=40√6/3, PH=40√2／
   四面体 ∠AOB=∠BOC=∠COA=90°, OA=OB=3, OC=6 → AB=3√2, BC=CA=3√5, cos∠ACB=4/5, △ABC=27/2, V=9, O から平面 ABC への距離 2）。
   値・誤答・垂線の足の座標は python3（sympy）で検算ずみ。見取図は斜めから見た図（奥行きを 0.6 倍・45° の向き）で、
   とり出した平面の三角形（△ABH・△PBH・△ABC）は、数値どおりの形でかいている。 */
(function () {
  const POINTS = [
    '空間の問題は、**平面の三角形をとり出して** 考える。とり出した三角形は、正しい形でかき直す',
    '測量：地面の上の三角形で **正弦定理**、地面に垂直な直角三角形で **tan**（見上げた角）を使う',
    '立体の高さ（点から平面への距離）は、**体積を2通りに表して** $V=\\dfrac13Sh$ から求める'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const pj = (x, y, z) => [x + 0.424 * y, z + 0.424 * y];   // 見取図：奥行き y を 0.6 倍・45° の向きに
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 24, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];

  // ---------- 測量 ----------
  // 地面の座標：A(0,0) B(40,0)、H は A から 45° の向きに AH=40sin75°/sin60°（H=(h,h)、h=31.547…）。PH=40√2
  const hh = 40 * Math.sin(rad(75)) / Math.sin(rad(60)) * Math.SQRT1_2, PHv = 40 * Math.SQRT2, BHv = 40 * Math.sqrt(6) / 3;
  const ps = (x, y, z) => [x - 0.5 * y, z + 0.45 * y];   // 測量の見取図は、奥行きを左上へ（H が A と B の間の奥に見える向き）
  const sA = ps(0, 0, 0), sB = ps(40, 0, 0), sH = ps(hh, hh, 0), sP = ps(hh, hh, PHv);
  const ground = [ps(-6, -6, 0), ps(52, -6, 0), ps(52, 40, 0), ps(-6, 40, 0)];
  const survey3D = (extra) => ({ t: 'fig', id: 'sv', col: 1, view: [-30, -8, 60, 76], w: 580, h: 541, items: [
    { k: 'poly', pts: ground, close: true, fill: 'g', alpha: 0.08, c: 'd' },
    { k: 'poly', pts: [sA, sB, sH], close: true, c: 'w' },
    { k: 'seg', a: sH, b: sP, c: 'y', wd: 4 }, { k: 'seg', a: sB, b: sP, c: 'd', dash: true },
    { k: 'right', o: sH, a: sB, b: sP, s: 14, c: 'y' },
    { k: 'angle', o: sA, a: sB, b: sH, rp: 46, c: 'b', label: '45°', lr: 24 },
    { k: 'angle', o: sB, a: sH, b: sA, rp: 30, c: 'b', label: '75°', lr: 34 },
    { k: 'angle', o: sB, a: sH, b: sP, rp: 56, c: 'p', label: '60°', lr: 22 },
    { k: 'label', at: [20, 0], text: '40 m', size: 24, dy: 24, plain: true },
    { k: 'pt', at: sA, name: 'A', dir: 'w', r: 4 }, { k: 'pt', at: sB, name: 'B', dir: 's', r: 4 },
    { k: 'pt', at: sH, name: 'H', dir: 'nw', r: 4 }, { k: 'pt', at: sP, name: 'P', dir: 'n', r: 5, c: 'y' }].concat(extra || []) });
  // とり出した三角形（同じ縮尺）：△ABH は A(0,0) B(40,0) H(hh,hh)、△PBH は B′(50,0) H′(50+BH,0) P′(50+BH, PH)
  const tA = [0, 0], tB = [40, 0], tH = [hh, hh], tG = G3(tA, tB, tH), uB = [50, 0], uH = [50 + BHv, 0], uP = [50 + BHv, PHv], uG = G3(uB, uH, uP);

  // ---------- 四面体 ----------
  // 直方体 0≦x≦6, 0≦y≦3, 0≦z≦3 の、手前・右・上の角を O(6,0,3) とする。A(6,0,0)（下へ3） B(6,3,3)（奥へ3） C(0,0,3)（左へ6）
  const V3 = { O: [6, 0, 3], A: [6, 0, 0], B: [6, 3, 3], C: [0, 0, 3] }, K3 = [16 / 3, 4 / 3, 5 / 3];   // K＝O から平面 ABC への垂線の足
  const P2 = v => pj(v[0], v[1], v[2]), qO = P2(V3.O), qA = P2(V3.A), qB = P2(V3.B), qC = P2(V3.C), qK = P2(K3);
  const box = () => {
    const v = (x, y, z) => pj(x, y, z), hid = [[[0, 3, 0], [6, 3, 0]], [[0, 3, 0], [0, 0, 0]], [[0, 3, 0], [0, 3, 3]]];
    const vis = [[[0, 0, 0], [6, 0, 0]], [[6, 0, 0], [6, 0, 3]], [[6, 0, 3], [0, 0, 3]], [[0, 0, 3], [0, 0, 0]], [[0, 0, 3], [0, 3, 3]], [[0, 3, 3], [6, 3, 3]], [[6, 3, 3], [6, 0, 3]], [[6, 0, 0], [6, 3, 0]], [[6, 3, 0], [6, 3, 3]]];
    return hid.map(([a, b]) => ({ k: 'seg', a: v(...a), b: v(...b), c: 'd', dash: true, wd: 2 }))
      .concat(vis.map(([a, b]) => ({ k: 'seg', a: v(...a), b: v(...b), c: 'd', wd: 2 })));
  };
  const tetra3D = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-0.9, -0.9, 8.3, 5.1], w: w || 590, h: Math.round((w || 590) * 6.0 / 9.2), items: box().concat([
    { k: 'poly', pts: [qA, qB, qC], close: true, fill: 'y', alpha: 0.22, c: 'y' },
    { k: 'seg', a: qO, b: qA, wd: 4 }, { k: 'seg', a: qO, b: qB, wd: 4 }, { k: 'seg', a: qO, b: qC, wd: 4 },
    { k: 'pt', at: qO, name: 'O', dir: 'e', off: 18, dy: 8, r: 4 }, { k: 'pt', at: qA, name: 'A', dir: 's', r: 4 }, { k: 'pt', at: qB, name: 'B', dir: 'ne', r: 4 }, { k: 'pt', at: qC, name: 'C', dir: 'w', r: 4 },
    { k: 'label', at: [qO[0], (qO[1] + qA[1]) / 2], text: '3', size: 22, dx: -16, c: 'b' }, { k: 'label', at: [(qO[0] + qB[0]) / 2, (qO[1] + qB[1]) / 2], text: '3', size: 22, dx: -14, dy: -12, c: 'b' },
    { k: 'label', at: [(qO[0] + qC[0]) / 2, qO[1]], text: '6', size: 22, dy: 18, c: 'b' }], extra || []) });
  // △ABC をとり出す：CA=CB=3√5、AB=3√2。A(−3/√2, 0) B(3/√2, 0) C(0, −√40.5)
  const cA = [-3 / Math.SQRT2, 0], cB = [3 / Math.SQRT2, 0], cC = [0, -Math.sqrt(40.5)], cG = G3(cA, cB, cC);

  HB.lesson({
    id: 'm1d-13', field: '数学Ⅰ　図形と計量', title: '空間図形への応用', level: '三角形への応用', time: '目安 9分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　山の頂上 P の真下の地点を H とする。地上の2地点 A, B で、AB $=40$ m、$\\angle\\mathrm{HAB}=45^\\circ$、$\\angle\\mathrm{HBA}=75^\\circ$、B から P を見上げた角 $\\angle\\mathrm{PBH}=60^\\circ$ のとき、高さ PH を求めよ。',
        '(2)　$\\angle\\mathrm{AOB}=\\angle\\mathrm{BOC}=\\angle\\mathrm{COA}=90^\\circ$、OA $=$ OB $=3$、OC $=6$ の四面体 OABC で、$\\triangle\\mathrm{ABC}$ の面積と、O から平面 ABC への距離を求めよ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: 'この章の最後です。正弦定理・余弦定理・面積の公式を、**空間の図形** に使います。測量と、直方体の角を切り取った四面体を考えます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '空間の中の長さ・面積・距離を、**平面の三角形をとり出して** 求められる' }] },

      // ---------- 測量 ----------
      { clear: true, cols: [0.42, 0.58], part: '測量', say: '例題(1)。山の頂上 P の真下の地点を H とします。H には行けませんが、地上の2地点 A, B での観測から、高さ PH を求めます。',
        add: [{ t: 'h', text: '例題(1)　山の高さ' },
          { t: 'p', size: 'sm', text: 'AB $=40$ m\n$\\angle\\mathrm{HAB}=45^\\circ,\\ \\ \\angle\\mathrm{HBA}=75^\\circ$\nB から P を見上げた角 $\\angle\\mathrm{PBH}=60^\\circ$\n高さ PH は？' },
          survey3D()] },
      { say: '使う三角形は2つ。地面の上の **△ABH** と、地面に垂直な直角三角形 **△PBH** です。見取図では形がゆがむので、とり出して正しい形でかき直します。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '① 地面の △ABH で BH … 正弦定理\n② 直角三角形 △PBH で PH … tan' }],
        draw: [{ fig: 'sv', items: [{ k: 'poly', pts: [sA, sB, sH], close: true, fill: 'b', alpha: 0.25, noStroke: true }, { k: 'poly', pts: [sB, sH, sP], close: true, fill: 'p', alpha: 0.18, noStroke: true }] }] },
      { clear: true, cols: [0.44, 0.56], part: '三角形をとり出す', say: '△ABH をとり出します。残りの角は $\\angle\\mathrm{AHB}=60^\\circ$。辺 AB と向かいの角がわかったので、**正弦定理** で BH を求めます。',
        add: [{ t: 'h', text: '① △ABH で BH' },
          { t: 'm', tex: '\\angle\\mathrm{AHB}=180^\\circ-(45^\\circ+75^\\circ)=60^\\circ' },
          { t: 'm', tex: '\\frac{\\mathrm{BH}}{\\sin45^\\circ}=\\frac{40}{\\sin60^\\circ}' },
          { t: 'fig', id: 'tr', col: 1, view: [-7, -9, 108, 63], w: 780, h: 488, items: [
            { k: 'poly', pts: [tA, tB, tH], close: true, fill: 'b', alpha: 0.12 },
            { k: 'angle', o: tA, a: tB, b: tH, rp: 40, c: 'b', label: '45°', lr: 24 }, { k: 'angle', o: tB, a: tH, b: tA, rp: 32, c: 'b', label: '75°', lr: 26 },
            { k: 'angle', o: tH, a: tA, b: tB, rp: 30, c: 'b', label: '60°', lr: 24 },
            sl(tA, tB, tG, '40'), sl(tB, tH, tG, 'BH', 'y', 26),
            { k: 'pt', at: tA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: tB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: tH, name: 'H', dir: 'n', r: 4 },
            { k: 'poly', pts: [uB, uH, uP], close: true, fill: 'p', alpha: 0.12 },
            { k: 'right', o: uH, a: uB, b: uP, s: 16 }, { k: 'angle', o: uB, a: uH, b: uP, rp: 40, c: 'p', label: '60°', lr: 24 },
            { k: 'label', at: [uP[0], uP[1] / 2], text: 'PH', c: 'p', size: 24, anchor: 'start', dx: 14 },
            { k: 'pt', at: uB, name: 'B', dir: 's', r: 4 }, { k: 'pt', at: uH, name: 'H', dir: 's', r: 4 }, { k: 'pt', at: uP, name: 'P', dir: 'n', r: 4 }] }] },
      { ask: { type: 'choice', q: 'BH の長さは？',
        opts: ['$20\\sqrt6$', '$\\dfrac{40\\sqrt6}{3}$', '$20\\sqrt2$', '$40\\sqrt3$'], ok: 1,
        why: { 0: 'sin が逆です。BH の向かいの角は A（$45^\\circ$）、40 の向かいの角は H（$60^\\circ$）。', 2: '$\\sin60^\\circ$ で割るところを、かけています。', 3: '向かい合う組を確かめましょう。BH は $\\angle\\mathrm{A}=45^\\circ$ と組です。' },
        good: 'BH $=\\dfrac{40\\sin45^\\circ}{\\sin60^\\circ}=\\dfrac{40\\sqrt2}{\\sqrt3}=\\dfrac{40\\sqrt6}{3}$（約 32.7 m）。',
        add: [{ t: 'm', tex: '\\mathrm{BH}=\\frac{40\\sin45^\\circ}{\\sin60^\\circ}=\\frac{40\\sqrt6}{3}' }] } },
      { say: '次に △PBH。P は H の真上なので $\\angle\\mathrm{PHB}=90^\\circ$。B で見上げた角が $60^\\circ$ なので、$\\tan60^\\circ=\\dfrac{\\mathrm{PH}}{\\mathrm{BH}}$ です。',
        add: [{ t: 'h', text: '② 直角三角形 △PBH で PH' }, { t: 'm', tex: '\\mathrm{PH}=\\mathrm{BH}\\tan60^\\circ' }] },
      { ask: { type: 'choice', q: '高さ PH は？',
        opts: ['$20\\sqrt2$', '$\\dfrac{40\\sqrt2}{3}$', '$40\\sqrt6$', '$40\\sqrt2$'], ok: 3,
        why: { 0: '$\\sin60^\\circ$ をかけています。直角をはさむ2辺の比は tan です。', 1: '$\\tan60^\\circ$ で割っています。PH は「高さ」なので $\\mathrm{BH}\\times\\tan60^\\circ$。', 2: '$\\dfrac{40\\sqrt6}{3}\\cdot\\sqrt3=\\dfrac{40\\sqrt{18}}{3}=40\\sqrt2$ と簡単にします。' },
        good: '$\\dfrac{40\\sqrt6}{3}\\cdot\\sqrt3=\\dfrac{40\\cdot3\\sqrt2}{3}=40\\sqrt2$。約 56.6 m です。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{PH}=\\frac{40\\sqrt6}{3}\\cdot\\sqrt3=40\\sqrt2\\ \\text{m}' }],
        draw: [{ fig: 'tr', items: [{ k: 'label', at: [uP[0], uP[1] / 2], text: '= 40√2', c: 'p', size: 24, anchor: 'start', dx: 54 }] }] } },

      // ---------- 四面体 ----------
      { clear: true, cols: [0.5, 0.5], part: '四面体', say: '例題(2)。O に集まる3辺がたがいに垂直で、OA $=$ OB $=3$、OC $=6$ の四面体 OABC。直方体の角を、平面 ABC で切り取った形です。',
        add: [{ t: 'h', text: '例題(2)　直方体の角を切り取った四面体' },
          { t: 'p', size: 'sm', text: '$\\angle\\mathrm{AOB}=\\angle\\mathrm{BOC}=\\angle\\mathrm{COA}=90^\\circ$\nOA $=$ OB $=3$、OC $=6$\n△ABC の面積と、O から平面 ABC への距離は？' },
          tetra3D('t1', [], 700)] },
      { say: '△ABC の3辺は、どれも O に直角がある三角形の斜辺です。三平方の定理で求めます。',
        add: [{ t: 'm', tex: '\\mathrm{AB}=\\sqrt{3^2+3^2}=3\\sqrt2', note: '△OAB' },
          { t: 'm', tex: '\\mathrm{BC}=\\mathrm{CA}=\\sqrt{3^2+6^2}=3\\sqrt5', note: '△OBC・△OCA' }] },
      { clear: true, cols: [0.6, 0.4], part: '△ABC をとり出す', say: '△ABC をとり出して、正しい形でかきます。CA $=$ CB の二等辺三角形。角 C の cos を余弦定理で求めます。',
        add: [{ t: 'h', text: '△ABC の面積' },
          { t: 'm', tex: '\\cos C=\\frac{(3\\sqrt5)^2+(3\\sqrt5)^2-(3\\sqrt2)^2}{2\\cdot3\\sqrt5\\cdot3\\sqrt5}', note: '余弦定理' },
          { t: 'fig', id: 'tc', col: 1, view: [-3.6, -7.3, 3.6, 0.9], w: 440, h: 501, items: [
            { k: 'poly', pts: [cA, cB, cC], close: true, fill: 'y', alpha: 0.15, c: 'y' },
            { k: 'angle', o: cC, a: cA, b: cB, rp: 50, c: 'p' },
            sl(cA, cB, cG, '3√2'), sl(cB, cC, cG, '3√5', 'w', 30), sl(cA, cC, cG, '3√5', 'w', 30),
            { k: 'pt', at: cA, name: 'A', dir: 'nw', r: 4 }, { k: 'pt', at: cB, name: 'B', dir: 'ne', r: 4 }, { k: 'pt', at: cC, name: 'C', dir: 's', r: 4 }] }] },
      { ask: { type: 'choice', q: '$\\cos C$ の値は？',
        opts: ['$\\dfrac35$', '$-\\dfrac45$', '$\\dfrac85$', '$\\dfrac45$'], ok: 3,
        why: { 0: 'それは $\\sin C$ の値です（このあと出します）。', 1: '分子は $45+45-18=72$ で正。cos も正です。', 2: '分母の 2 をかけ忘れています。cos が 1 をこえることはありません。' },
        good: '$\\cos C=\\dfrac{45+45-18}{90}=\\dfrac{72}{90}=\\dfrac45$。',
        add: [{ t: 'm', tex: '\\hphantom{\\cos C}=\\frac{72}{90}=\\frac45' }, { t: 'm', tex: '\\sin C=\\sqrt{1-\\frac{16}{25}}=\\frac35', note: '$\\sin C>0$' }] } },
      { ask: { type: 'choice', q: '△ABC の面積は？',
        opts: ['$18$', '$\\dfrac{27}{2}$', '$27$', '$\\dfrac{9\\sqrt5}{2}$'], ok: 1,
        why: { 0: '$\\cos C=\\dfrac45$ を使っています。面積の公式は sin です。', 2: '$\\dfrac12$ をかけ忘れています。', 3: '$\\dfrac12\\cdot3\\sqrt5\\cdot3\\sqrt5=\\dfrac{45}{2}$。$\\sqrt5\\cdot\\sqrt5=5$ です。' },
        good: '$\\dfrac12\\cdot3\\sqrt5\\cdot3\\sqrt5\\cdot\\dfrac35=\\dfrac12\\cdot45\\cdot\\dfrac35=\\dfrac{27}{2}$。',
        add: [{ t: 'ans', label: '答', tex: '\\triangle\\mathrm{ABC}=\\frac12\\cdot3\\sqrt5\\cdot3\\sqrt5\\cdot\\frac35=\\frac{27}{2}' }] } },

      // ---------- 距離 ----------
      { clear: true, cols: [0.58, 0.42], part: '点と平面の距離', say: 'O から平面 ABC への距離 $h$ は、直接は測りにくい長さです。そこで、四面体の **体積を2通りに表します**。まず △OAB を底面と見ると、高さは OC です。',
        add: [{ t: 'h', text: 'O から平面 ABC への距離 $h$' },
          { t: 'm', tex: 'V=\\frac13\\cdot\\triangle\\mathrm{OAB}\\cdot\\mathrm{OC}=\\frac13\\cdot\\frac92\\cdot6=9', note: '底面 △OAB\n高さ OC' },
          tetra3D('t2', [{ k: 'seg', a: qO, b: qK, c: 'p', wd: 3 }, { k: 'pt', at: qK, name: 'K', dir: 'w', r: 4, c: 'p', size: 22 }, { k: 'label', at: [(qO[0] + qK[0]) / 2, (qO[1] + qK[1]) / 2], text: 'h', c: 'p', size: 22, dx: 14 }])] },
      { ask: { type: 'think', q: '△ABC を底面と見ると、高さは $h$。$V=\\dfrac13\\cdot\\triangle\\mathrm{ABC}\\cdot h$ から、$h$ を求めよう。',
        hint: '$V=9$、$\\triangle\\mathrm{ABC}=\\dfrac{27}{2}$。$9=\\dfrac13\\cdot\\dfrac{27}{2}\\cdot h$ を解く。',
        ans: '$9=\\dfrac92h$ より　$h=2$',
        after: '図の K は、O から平面 ABC に下ろした垂線の足です。体積を2通りに表すのは、立体の高さを求める定番の方法です。',
        add: [{ t: 'm', tex: '9=\\frac13\\cdot\\frac{27}{2}\\cdot h=\\frac92h' }, { t: 'ans', label: '答', tex: 'h=2' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。これで「図形と計量」は終わりです。空間でも、平面の三角形をとり出せば、この章の道具がそのまま使えます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
