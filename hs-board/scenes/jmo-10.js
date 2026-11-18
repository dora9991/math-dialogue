/* 数学オリンピック（JMO予選レベル・自作問題）⑩：面積比とメネラウスの定理 ― 3本の線がかこむ三角形
   問題：面積 1 の △ABC の辺 BC, CA, AB 上に BD:DC＝CE:EA＝AF:FB＝1:3 となる点 D, E, F。AD, BE, CF がかこむ三角形の面積。
   名前：P＝AD∩BE、Q＝BE∩CF、R＝CF∩AD（文字を A→B→C→A、D→E→F→D とずらすと P→Q→R→P）。
   答え 4/13（python3・sympy で座標から検算ずみ：verify10.py）
     △ADC と直線 BE（メネラウス）：AP/PD・DB/BC・CE/EA＝1、DB/BC＝1/4、CE/EA＝1/3 → AP:PD＝12:1
     △ABD と直線 CF：AF/FB・BC/CD・DR/RA＝1 → AR:RD＝4:9。AD の上は A, R, P, D の順で AR:RP:PD＝4:8:1
     △ABP＝12/13×1/4＝3/13。△BCQ＝△CAR＝3/13（同じ計算。△CAR＝4/13×3/4 でも確認）。1−3×3/13＝4/13
   誤答：AP:PD で 9:1（DB:DC と取りちがえ）・4:3（CE/EA を逆）・1:12。△ABP で 4/13（△ABD を 1/3）・12/13・1/4。
         答えで 1/7（比 1:2 の答え）・1/4（外側を △ABD と思う）・9/13（外側の合計）
   ウォームアップ：BD:DC＝1:2、AP:PD＝3:1 → △ABP＝3/4×1/3＝1/4（誤答 1/12・3/4・1/2）
   考えてみよう：比 1:2 → AP:PD＝6:1、△ABP＝2/7、1−6/7＝1/7。一般に 1:n → (n−1)²/(n²+n+1)（n＝1 で 0、重心）
   図の点は、その比どおりの位置にかいている（面積比は三角形の形によらない）。 */
(function () {
  const POINTS = [
    '**高さが同じ** 三角形の面積比＝底辺の比。2回使うと　△ABP $=\\dfrac{\\mathrm{AP}}{\\mathrm{AD}}\\times\\dfrac{\\mathrm{BD}}{\\mathrm{BC}}\\times$△ABC　のように、**線分の比 → 面積比** に直せる',
    '線分の途中の比（AP : PD など）は **メネラウスの定理**。「どの三角形」と「横切る直線」を選び、頂点 → 交点 → 頂点 … と一周する',
    'まん中は **全体から外側を引く**。文字をずらしても条件が変わらなければ、外側の3つは **対称性** で同じ面積。1つ計算すれば3つわかる'
  ];
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];
  const sl = (P, Q, G, text, c, px, size) => {   // 線分 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const fill = (pts, c, a, id) => ({ k: 'poly', pts, close: true, fill: c, alpha: a || 0.3, noStroke: true, id });

  // ---------- 本題の図：A(3.2, 7.4) B(0,0) C(10,0)。比 1:k の点と、3本の線の交点 ----------
  const A = [3.2, 7.4], B = [0, 0], C = [10, 0], G = G3(A, B, C);
  const setup = k => {   // BD:DC＝CE:EA＝AF:FB＝1:k。AP:PD＝k(k+1):1 なので AP/AD＝k(k+1)/(k²+k+1)
    const r = 1 / (k + 1), u = k * (k + 1) / (k * k + k + 1), D = lerp(B, C, r), E = lerp(C, A, r), F = lerp(A, B, r);
    return { k, D, E, F, P: lerp(A, D, u), Q: lerp(B, E, u), R: lerp(C, F, u) };
  };
  const S3 = setup(3), S2 = setup(2);
  const { D, E, F, P, Q, R } = S3;
  // o.fills：先にぬる所、o.ratio：辺の比の数字、o.pqr：P, Q, R を出す（true か ['P'] のような配列）、o.lw：3本の線の太さ
  const tri = (S, o) => {
    o = o || {};
    const n = String(S.k), show = nm => o.pqr === true || (Array.isArray(o.pqr) && o.pqr.includes(nm));
    return (o.fills || []).concat([
      { k: 'poly', pts: [A, B, C], close: true, fill: 'w', alpha: 0.04 },
      { k: 'seg', id: 'ad', a: A, b: S.D, c: 'w', wd: o.lw || 2.5 }, { k: 'seg', id: 'be', a: B, b: S.E, c: 'w', wd: o.lw || 2.5 }, { k: 'seg', id: 'cf', a: C, b: S.F, c: 'w', wd: o.lw || 2.5 },
      { k: 'pt', at: A, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: B, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: C, name: 'C', dir: 'se', r: 4 },
      { k: 'pt', at: S.D, name: 'D', dir: 's', r: 4, c: 'y' }, { k: 'pt', at: S.E, name: 'E', dir: 'ne', r: 4, c: 'y' }, { k: 'pt', at: S.F, name: 'F', dir: 'nw', r: 4, c: 'y' }
    ], o.ratio ? [sl(B, S.D, G, '1', 'b', 22, 24), sl(S.D, C, G, n, 'b', 22, 24), sl(C, S.E, G, '1', 'b', 22, 24), sl(S.E, A, G, n, 'b', 22, 24), sl(A, S.F, G, '1', 'b', 22, 24), sl(S.F, B, G, n, 'b', 22, 24)] : [],
    show('P') ? [{ k: 'pt', at: S.P, name: 'P', dir: 'nw', off: 18, r: 5, c: 'p' }] : [],
    show('Q') ? [{ k: 'pt', at: S.Q, name: 'Q', dir: 'sw', off: 18, r: 5, c: 'p' }] : [],
    show('R') ? [{ k: 'pt', at: S.R, name: 'R', dir: 'ne', off: 18, r: 5, c: 'p' }] : [],
    o.extra || []);
  };
  const VM = [-1.0, -1.0, 11.0, 8.3], fm = (id, items, w) => ({ t: 'fig', id, col: 1, view: VM, w: w || 600, h: Math.round((w || 600) * 9.3 / 12), items });
  const inner = (S, a) => fill([S.P, S.Q, S.R], 'p', a || 0.42, 'in');
  const outer = [fill([A, B, P], 'y', 0.3, 'oA'), fill([B, C, Q], 'b', 0.3, 'oB'), fill([C, A, R], 'g', 0.3, 'oC')];

  // ---------- ウォームアップの図：A(5.2, 5.6) B(0,0) C(9,0)、BD:DC＝1:2、AP:PD＝3:1 ----------
  const wA = [5.2, 5.6], wB = [0, 0], wC = [9, 0], wD = [3, 0], wH = [5.2, 0], wP = lerp(wA, wD, 3 / 4), wG = G3(wA, wB, wC);
  const warm = () => [
    fill([wA, wB, wD], 'y', 0.26, 'wy'), fill([wA, wD, wC], 'b', 0.26, 'wb'),
    { k: 'poly', pts: [wA, wB, wC], close: true },
    { k: 'seg', a: wA, b: wD, c: 'w', wd: 2.5 },
    { k: 'seg', a: wA, b: wH, c: 'd', wd: 2, dash: true }, { k: 'right', o: wH, a: wA, b: wC, s: 14 },
    { k: 'label', at: [5.2, 2.2], text: '高さ\n共通', size: 20, c: 'd', dx: 34, plain: true },
    { k: 'pt', at: wA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: wB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: wC, name: 'C', dir: 'se', r: 4 },
    { k: 'pt', at: wD, name: 'D', dir: 's', r: 4, c: 'y' },
    { k: 'dim', a: wB, b: wD, dy: 56, label: '1', c: 'y' }, { k: 'dim', a: wD, b: wC, dy: 56, label: '2', c: 'b' }];
  const VW = [-0.9, -1.6, 9.9, 6.6];

  // ---------- AD の上の点のならび（13 目もり） ----------
  const ticks = []; for (let i = 1; i < 13; i++) ticks.push({ k: 'seg', a: [i, -0.16], b: [i, 0.16], c: 'd', wd: 2 });
  const strip = { t: 'fig', id: 'st', view: [-0.8, -1.7, 13.8, 1.3], w: 620, h: 127, items: [{ k: 'seg', a: [0, 0], b: [13, 0], wd: 4 }].concat(ticks, [
    { k: 'pt', at: [0, 0], name: 'A', dir: 'n', r: 5 }, { k: 'pt', at: [13, 0], name: 'D', dir: 'n', r: 5, c: 'y' }]) };

  // ---------- 比 1:1（中線）の小さい図 ----------
  const S1 = setup(1);

  HB.lesson({
    id: 'jmo-10', field: 'オリンピック型　幾何', title: 'オリンピックの考え方⑩　面積比とメネラウスの定理 ― 3本の線がかこむ三角形', level: 'JMO予選レベル（自作問題）', time: '目安 12〜18分',
    noDec: true,
    problem: { label: '問題',
      lead: '面積が $1$ の三角形 ABC の辺 BC, CA, AB 上に、それぞれ点 D, E, F を BD : DC $=$ CE : EA $=$ AF : FB $=1:3$ となるようにとる。線分 AD, BE, CF で囲まれる三角形の面積を求めよ。',
      parts: [],
      src: '※ 日本数学オリンピック（JMO）予選と同じ「答えだけを書く」形式の自作問題です' },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '幾何の問題です。三角形の中に3本の線を引くと、まん中に小さな三角形（桃色）ができます。その面積を求めます。（問題文は Q キーで、いつでも見られます）',
        add: [{ t: 'prob' },
          fm('f0', tri(S3, { ratio: true, fills: [inner(S3)], extra: [{ k: 'label', at: G3(P, Q, R), text: '?', c: 'p', size: 34 }] }))] },
      { say: 'この回の考え方は「線分の比を面積比に直す」こと。比はメネラウスの定理で出し、まん中は全体から外側を引きます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: 'めあて', text: '**線分の比 → 面積比** に直して面積を求める\n線分の比は **メネラウスの定理** で出す\nまん中は **全体から外側を引く**\n同じ形の部分は **対称性** で1回の計算ですませる' }] },

      // ---------- ウォームアップ ----------
      { clear: true, cols: [0.48, 0.52], part: 'ウォームアップ', say: 'ウォームアップです。BD : DC $=1:2$ のとき、△ABD と △ADC は頂点 A からの高さが同じ。だから面積の比は、底辺の比 $1:2$ です。',
        add: [{ t: 'h', text: 'ウォームアップ　面積比の基本' },
          { t: 'box', c: 'b', size: 'sm', label: '高さが同じ', text: '高さが同じ三角形の面積比 $=$ 底辺の比' },
          { t: 'm', tex: '\\triangle\\mathrm{ABD}:\\triangle\\mathrm{ADC}=\\mathrm{BD}:\\mathrm{DC}=1:2' },
          { t: 'm', tex: '\\triangle\\mathrm{ABC}=1\\ \\text{なら}\\quad\\triangle\\mathrm{ABD}=\\frac13' },
          { t: 'fig', id: 'fw', col: 1, view: VW, w: 600, h: Math.round(600 * 8.2 / 10.8), items: warm() }] },
      { dim: ['wy', 'wb'],
        draw: [{ fig: 'fw', items: [fill([wA, wB, wP], 'p', 0.42), { k: 'seg', a: wB, b: wP, c: 'p', wd: 3 },
          { k: 'pt', at: wP, name: 'P', dir: 'e', r: 5, c: 'p' }, sl(wA, wP, wG, '3', 'p', 20, 24), sl(wP, wD, wB, '1', 'p', 18, 24)] }],
        ask: { type: 'choice', q: '△ABC の面積を $1$ とする。AD 上に AP : PD $=3:1$ の点 P をとる。△ABP（桃色）の面積は？',
          opts: ['$\\dfrac1{12}$', '$\\dfrac34$', '$\\dfrac14$', '$\\dfrac12$'], ok: 2,
          why: { 0: 'それは △PBD。△ABP は AP の側なので、△ABD の $\\frac34$ です。', 1: '$\\frac34$ は △ABP と △ABD の比。△ABD $=\\frac13$ をかけます。', 3: '$\\frac34\\times\\frac23$ としています。△ABP は △ABD（$\\frac13$）の一部です。' },
          good: '△ABP と △PBD は B からの高さが同じ。△ABP $=\\frac34\\times\\frac13=\\frac14$。',
          add: [{ t: 'm', tex: '\\triangle\\mathrm{ABP}=\\frac34\\times\\frac13=\\ans{\\frac14}', note: 'AP : AD $=3:4$' }] } },
      { say: '「高さが同じ」を2回使いました。△ABC → △ABD → △ABP と、比をかけながら面積をしぼっていきます。本題でもこの形を使います。',
        add: [{ t: 'box', c: 'g', label: '線分の比 → 面積比', tex: '\\triangle\\mathrm{ABP}=\\frac{\\mathrm{AP}}{\\mathrm{AD}}\\times\\frac{\\mathrm{BD}}{\\mathrm{BC}}\\times\\triangle\\mathrm{ABC}' }] },

      // ---------- 本題：方針 ----------
      { clear: true, part: '方針', say: '本題です。交点に名前をつけます。AD と BE の交点を P、BE と CF の交点を Q、CF と AD の交点を R。求めるのは △PQR です。',
        add: [{ t: 'h', text: '本題　3本の線がかこむ三角形' },
          { t: 'p', text: 'BD : DC $=$ CE : EA $=$ AF : FB $=1:3$' },
          { t: 'p', size: 'sm', text: '交点　{{P}}：AD と BE　　{{Q}}：BE と CF　　{{R}}：CF と AD' },
          fm('fm', tri(S3, { ratio: true, pqr: true, fills: [inner(S3, 0.36)] }))] },
      { say: '△PQR を直接はかるのはむずかしい。そこで外側の3つの三角形 △ABP, △BCQ, △CAR を全体から引きます。この3つは重ならず、△PQR とあわせて全体をうめます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '方針', tex: '\\triangle\\mathrm{PQR}=1-(\\triangle\\mathrm{ABP}+\\triangle\\mathrm{BCQ}+\\triangle\\mathrm{CAR})' }],
        draw: [{ fig: 'fm', items: outer.concat([{ k: 'label', at: [1.72, 1.75], text: '△ABP', c: 'y', size: 19 }]) }] },
      { say: '△ABP は、ウォームアップと同じ形です。△ABD $=\\frac14$ なので、あとは AD の上の比 AP : PD がわかれば求められます。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{ABP}=\\frac{\\mathrm{AP}}{\\mathrm{AD}}\\times\\triangle\\mathrm{ABD},\\quad\\triangle\\mathrm{ABD}=\\frac14', note: 'BD : BC $=1:4$' },
          { t: 'p', text: '→ [[y:AP : PD]] がわかればよい' }],
        hl: ['ad'] },

      // ---------- メネラウス ----------
      { clear: true, part: 'メネラウスの定理', say: 'AP : PD のような「線分の途中の比」は、メネラウスの定理で出します。1本の直線が三角形を横切るとき、ぐるっと一周して比をかけると 1 です。',
        add: [{ t: 'h', text: 'AP : PD をメネラウスの定理で' },
          { t: 'box', c: 'y', size: 'sm', label: 'メネラウス', text: '直線が三角形の3辺（または延長）と交わるとき\n頂点 → 交点 → 頂点 → … と **一周** して、比の積が $1$' },
          fm('fn', tri(S3, { ratio: true, pqr: ['P'] }))],
        dim: ['cf'] },
      { dim: ['cf'],
        ask: { type: 'choice', q: 'AP : PD を出すには、どの三角形と直線にメネラウスの定理を使う？',
          opts: ['△ABC と直線 BE', '△ADC と直線 BE', '△ABD と直線 CF', '△ABD と直線 BE'], ok: 1,
          why: { 0: '直線 BE は頂点 B を通るので、△ABC を横切る直線になりません。', 2: 'それで出るのは CF との交点 R の比（AR : RD）。P の比ではありません。', 3: '直線 BE は △ABD の頂点 B を通ります。横切る直線になりません。' },
          good: '直線 B-P-E は、△ADC の辺 AD と P、辺 CA と E、辺 DC の延長と B で交わります。',
          draw: [{ fig: 'fn', items: [fill([A, D, C], 'b', 0.24), { k: 'seg', a: B, b: E, c: 'g', wd: 5 }, { k: 'seg', a: B, b: D, c: 'g', wd: 5, dash: true },
            { k: 'label', at: [6.3, 2.4], text: '△ADC', c: 'b', size: 22 }] }] } },
      { dim: ['cf'], say: 'A →(P)→ D →(B)→ C →(E)→ A と一周します。B は辺 DC の延長上の点で、DB : BC $=1:4$。CE : EA $=1:3$ です。',
        add: [{ t: 'm', tex: '\\frac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\frac{\\mathrm{DB}}{\\mathrm{BC}}\\cdot\\frac{\\mathrm{CE}}{\\mathrm{EA}}=1', note: '△ADC と直線 BE' },
          { t: 'm', tex: '\\frac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\frac14\\cdot\\frac13=1' }],
        draw: [{ fig: 'fn', items: [{ k: 'dim', a: B, b: C, dy: 62, label: 'BC = 4', c: 'g' }] }] },
      { dim: ['cf'],
        ask: { type: 'choice', q: 'AP : PD は？',
          opts: ['$9:1$', '$4:3$', '$1:12$', '$12:1$'], ok: 3,
          why: { 0: 'DB : BC を DB : DC $=1:3$ としています。一周は D → B → C で、BC は $4$ です。', 1: '$\\frac{\\mathrm{CE}}{\\mathrm{EA}}$ を逆に $\\frac31$ と入れています。C → E → A の順で $\\frac13$。', 2: '$\\frac{\\mathrm{AP}}{\\mathrm{PD}}=12$ です。分子と分母を逆にしています。' },
          good: '$\\frac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\frac1{12}=1$ より AP : PD $=12:1$。P は D のすぐ近くです。',
          add: [{ t: 'm', tex: '\\mathrm{AP}:\\mathrm{PD}=\\ans{12:1}' }],
          draw: [{ fig: 'fn', items: [sl(A, P, C, '12', 'p', 22, 26), sl(P, D, B, '1', 'p', 16, 24)] }] } },

      // ---------- 外側の三角形 ----------
      { clear: true, part: '外側の三角形', say: 'いよいよ面積です。△ABD $=\\frac14$ で、AP : AD $=12:13$。ウォームアップと同じように計算します。',
        add: [{ t: 'h', text: '外側の三角形の面積' },
          { t: 'm', tex: '\\triangle\\mathrm{ABD}=\\frac14,\\qquad \\mathrm{AP}:\\mathrm{AD}=12:13' },
          fm('fo', tri(S3, { pqr: true, fills: [fill([A, B, P], 'y', 0.34, 'oA')] }))],
        ask: { type: 'choice', q: '△ABP（黄色）の面積は？',
          opts: ['$\\dfrac{3}{13}$', '$\\dfrac{4}{13}$', '$\\dfrac{12}{13}$', '$\\dfrac14$'], ok: 0,
          why: { 1: '△ABD を $\\frac13$ としています。BD : BC $=1:4$ なので $\\frac14$ です。', 2: '△ABD $=\\frac14$ をかけ忘れています。$\\frac{12}{13}$ は AP : AD です。', 3: 'それは △ABD。P は D の手前にあるので、少し小さくなります。' },
          good: '△ABP $=\\frac{12}{13}\\times\\frac14=\\frac{3}{13}$。高さが同じ三角形を2回使いました。',
          add: [{ t: 'm', tex: '\\triangle\\mathrm{ABP}=\\frac{12}{13}\\times\\frac14=\\ans{\\frac{3}{13}}' }] } },
      { say: 'のこりの2つは？ 文字を A→B→C→A、D→E→F→D と1つずつずらしても、条件「BD : DC $=$ CE : EA $=$ AF : FB $=1:3$」は変わりません。',
        add: [{ t: 'tbl', size: 'sm', rows: [['もと', 'A', 'B', 'C', 'D', 'E', 'F', 'P', '△ABP'], ['ずらす', 'B', 'C', 'A', 'E', 'F', 'D', 'Q', '△BCQ']] },
          { t: 'p', size: 'sm', text: 'BD : DC → CE : EA → AF : FB → BD : DC（同じ条件）' }] },
      { say: '△ABP は △BCQ に、△BCQ は △CAR にうつり、計算はまったく同じ。形はちがっても、面積はどれも $\\frac{3}{13}$ です。1回の計算で3つわかりました。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{BCQ}=\\triangle\\mathrm{CAR}=\\frac{3}{13}', note: '同じ計算\n（対称性）' }],
        draw: [{ fig: 'fo', items: [fill([B, C, Q], 'b', 0.3), fill([C, A, R], 'g', 0.3)] }] },

      // ---------- 答え ----------
      { clear: true, part: '答え', say: '全体から外側の3つを引きます。',
        add: [{ t: 'h', text: 'まん中の三角形' },
          { t: 'box', c: 'y', size: 'sm', label: '方針', tex: '\\triangle\\mathrm{PQR}=1-(\\triangle\\mathrm{ABP}+\\triangle\\mathrm{BCQ}+\\triangle\\mathrm{CAR})' },
          { t: 'm', tex: '\\triangle\\mathrm{ABP}=\\triangle\\mathrm{BCQ}=\\triangle\\mathrm{CAR}=\\frac{3}{13}' },
          fm('fa', tri(S3, { pqr: true, fills: outer.concat([inner(S3, 0.45)]) }))],
        ask: { type: 'choice', q: '△PQR の面積は？',
          opts: ['$\\dfrac17$', '$\\dfrac14$', '$\\dfrac{4}{13}$', '$\\dfrac{9}{13}$'], ok: 2,
          why: { 0: '$\\frac17$ は比が $1:2$ のときの答え（あとで確かめます）。比が $1:3$ では変わります。', 1: '外側を △ABD $=\\frac14$ として $1-\\frac34$ としています。外側は △ABP です。', 3: '$\\frac{9}{13}$ は外側3つの合計。1 から引くのを忘れています。' },
          good: '$1-3\\times\\frac{3}{13}=\\frac{4}{13}$。外側の3つを引いた残りです。',
          add: [{ t: 'ans', label: '答', tex: '\\triangle\\mathrm{PQR}=1-3\\times\\frac{3}{13}=\\frac{4}{13}' }] } },

      // ---------- 図で確かめる ----------
      { clear: true, part: '図で確かめる', say: '図で確かめます。AD は BE と P で、CF と R で交わります。A から見て、R と P はどちらが先にあり、どんな比でならぶでしょう。',
        add: [{ t: 'h', text: 'AD の上の点のならび' },
          { t: 'p', size: 'sm', text: 'AD を $13$ 目もりに分ける（AP : PD $=12:1$）' },
          strip,
          fm('fc', tri(S3, { pqr: ['P', 'R'], extra: [{ k: 'seg', a: A, b: D, c: 'y', wd: 4.5 }] }))],
        dim: ['be', 'cf'] },
      { dim: ['be', 'cf'],
        ask: { type: 'think', q: 'AD の上の比 AR : RP : PD を求めよう。',
          hint: '△ABD と直線 CF で AR : RD を出す（A →(F)→ B →(C)→ D →(R)→ A）。BC : CD $=4:3$。',
          ans: '$\\frac13\\cdot\\frac43\\cdot\\frac{\\mathrm{DR}}{\\mathrm{RA}}=1$ より AR : RD $=4:9$。AR $=4$、AP $=12$ 目もりで　AR : RP : PD $=4:8:1$',
          after: 'R は A の近く、P は D のすぐ手前。△CAR $=\\frac{4}{13}\\times\\frac34=\\frac{3}{13}$ と、直接計算しても対称性の答えと合います。',
          add: [{ t: 'm', size: 'sm', tex: '\\frac{\\mathrm{AF}}{\\mathrm{FB}}\\cdot\\frac{\\mathrm{BC}}{\\mathrm{CD}}\\cdot\\frac{\\mathrm{DR}}{\\mathrm{RA}}=\\frac13\\cdot\\frac43\\cdot\\frac{\\mathrm{DR}}{\\mathrm{RA}}=1', note: '△ABD と\n直線 CF' },
            { t: 'm', size: 'sm', tex: '\\mathrm{AR}:\\mathrm{RP}:\\mathrm{PD}=\\ans{4:8:1}' },
            { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{CAR}=\\frac{4}{13}\\times\\triangle\\mathrm{ADC}=\\frac{4}{13}\\times\\frac34=\\frac{3}{13}', note: '検算' }],
          draw: [{ fig: 'st', items: [{ k: 'pt', at: [4, 0], name: 'R', dir: 'n', r: 6, c: 'p' }, { k: 'pt', at: [12, 0], name: 'P', dir: 'n', r: 6, c: 'p' },
            { k: 'dim', a: [0, 0], b: [4, 0], dy: 30, label: '4', c: 'p' }, { k: 'dim', a: [4, 0], b: [12, 0], dy: 30, label: '8', c: 'p' }, { k: 'dim', a: [12, 0], b: [13, 0], dy: 30, label: '1', c: 'p' }] },
            { fig: 'fc', items: [fill([C, A, R], 'g', 0.3)] }] } },

      // ---------- 考えてみよう ----------
      { clear: true, part: '考えてみよう', say: '比を $1:2$ にかえるとどうなるでしょう。同じ方法で求めてみましょう。',
        add: [{ t: 'h', text: '比を 1 : 2 にすると？' },
          { t: 'p', text: 'BD : DC $=$ CE : EA $=$ AF : FB $=1:2$ のとき\nAD, BE, CF で囲まれる三角形の面積は？' },
          fm('f2', tri(S2, { ratio: true, pqr: true, fills: [inner(S2)] }))] },
      { ask: { type: 'think', q: '比が $1:2$ のとき、3本の線がかこむ三角形の面積を求めよう。',
        hint: '△ADC と直線 BE で AP : PD。DB : BC $=1:3$、CE : EA $=1:2$。△ABD $=\\frac13$。',
        ans: 'AP : PD $=6:1$、△ABP $=\\frac67\\times\\frac13=\\frac27$。面積は　$1-3\\times\\frac27=\\frac17$',
        after: '$\\frac17$ は有名な答えです。比が変わると答えも変わるので、覚えた数ではなく方法を使いましょう。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\frac13\\cdot\\frac12=1\\qquad \\mathrm{AP}:\\mathrm{PD}=6:1' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABP}=\\frac67\\times\\frac13=\\frac27\\qquad 1-3\\times\\frac27=\\ans{\\frac17}' }] } },

      // ---------- ふりかえり ----------
      { clear: true, part: 'ふりかえり', say: '比を $1:n$ にしても同じ計算です。まん中の面積は $\\frac{(n-1)^2}{n^2+n+1}$。$n=1$ は3本の中線で、重心の1点で交わるので $0$。答えの検算にもなります。',
        add: [{ t: 'h', text: '比を 1 : n にすると' },
          { t: 'm', size: 'sm', tex: '\\frac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\frac1{n+1}\\cdot\\frac1n=1\\ \\Rightarrow\\ \\mathrm{AP}:\\mathrm{PD}=n(n+1):1' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABP}=\\frac{n(n+1)}{n^2+n+1}\\times\\frac1{n+1}=\\frac{n}{n^2+n+1}' },
          { t: 'm', tex: '\\triangle\\mathrm{PQR}=1-\\frac{3n}{n^2+n+1}=\\frac{(n-1)^2}{n^2+n+1}' },
          { t: 'p', size: 'sm', text: '$n=1$ のとき AD, BE, CF は **中線**。重心 G の1点で交わるので、面積は $0$（右の図）。答えの検算に使える' },
          { t: 'tbl', col: 1, rows: [['$n$', '$1$', '$2$', '$3$', '$4$'], ['面積', '$0$', '$\\frac17$', '$\\frac4{13}$', '$\\frac37$']] },
          { t: 'fig', id: 'f1', col: 1, view: VM, w: 420, h: Math.round(420 * 9.3 / 12), items: tri(S1, { ratio: true, extra: [{ k: 'pt', at: G, name: 'G', dir: 'n', off: 20, dx: 12, r: 6, c: 'p', size: 24 }] }) }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。線分の比を面積比に直し、メネラウスの定理で比を出し、全体から外側を引く。対称性で計算は3分の1になりました。',
        add: [{ t: 'h', text: 'この回のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
