/* 早稲田型 数学（理工）：2024年度 早稲田大学 理工3学部 第3問の類題（自作問題・元の問題ではない）
   問題：四面体 ABCD、面 BCD・ACD・ABD・ABC の重心 G1〜G4。
     (1) AG1, BG2, CG3, DG4 は 1 点 G で交わり、G はどれも 3:1 に内分（証明）
     (2) AB=CD, AC=BD, AD=BC ⇒ GA=GB=GC=GD（証明）
     (3) AB=CD=2, AC=AD=BC=BD=x（x>√2）：外接球の半径 R と体積 V
     (4) V/R³ の最大値（x>√2）
   答え（python3・sympy と座標で検算ずみ）：
     (1) G = (a+b+c+d)/4　(2) G 始点で a+b+c+d=0 → |a|²+|b|²=|c|²+|d|² などの3式 → 4つとも等しい
     (3) AN=BN=√(x²−1)、MN=√(x²−2)、R=GA=√(x²+2)/2、V=(1/3)·△ABN·CD=(2/3)√(x²−2)
     (4) V/R³=(16/3)√(x²−2)/(x²+2)^{3/2}。u=x² で g(u)=(u−2)/(u+2)³、g'(u)=2(4−u)/(u+2)⁴
         → u=4（x=2・正四面体）で最大 8√3/27。u→2, u→∞ でともに 0 に近づくので、最大値は本当に存在する
     別の見方：直方体 p×q×r（p²=x²−2, q=r=√2）の面の対角線 → V=pqr/3、R=√(p²+q²+r²)/2 */
(function () {
  // ---- (1)(2) の図：ふつうの四面体（平面に写した点。重心は写しても重心） ----
  const av = (...P) => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length];
  const gA = [0.3, 2.7], gB = [-1.6, 0.2], gC = [1.0, -0.45], gD = [2.1, 0.9];
  const G1 = av(gB, gC, gD), G2 = av(gA, gC, gD), G3 = av(gA, gB, gD), G4 = av(gA, gB, gC), GG = av(gA, gB, gC, gD);
  const gen = (id, o, h) => {
    o = o || {}; const H = h || 400, items = [
      { k: 'poly', pts: [gB, gC, gD], close: true, fill: 'b', alpha: 0.12, noStroke: true },
      { k: 'seg', a: gA, b: gB, c: 'w', wd: 2.5 }, { k: 'seg', a: gA, b: gC, c: 'w', wd: 2.5 }, { k: 'seg', a: gA, b: gD, c: 'w', wd: 2.5 },
      { k: 'seg', a: gB, b: gC, c: 'w', wd: 2.5 }, { k: 'seg', a: gC, b: gD, c: 'w', wd: 2.5 }, { k: 'seg', a: gB, b: gD, c: 'w', wd: 2, dash: true },
      { k: 'seg', a: gA, b: G1, c: 'y', wd: 3 },
      { k: 'pt', at: gA, name: 'A', dir: 'n', r: 5 }, { k: 'pt', at: gB, name: 'B', dir: 'w', r: 5 }, { k: 'pt', at: gC, name: 'C', dir: 's', r: 5 }, { k: 'pt', at: gD, name: 'D', dir: 'e', r: 5 },
      { k: 'pt', at: G1, name: 'G₁', dir: 's', c: 'y', r: 5 }];
    if (o.all) items.push({ k: 'seg', a: gB, b: G2, c: 'g', wd: 2 }, { k: 'seg', a: gC, b: G3, c: 'g', wd: 2 }, { k: 'seg', a: gD, b: G4, c: 'g', wd: 2 },
      { k: 'dot', at: G2, c: 'g' }, { k: 'dot', at: G3, c: 'g' }, { k: 'dot', at: G4, c: 'g' });
    if (o.g) items.push({ k: 'pt', at: GG, name: 'G', dir: 'e', off: 26, c: 'p', r: 6 },
      { k: 'label', at: av(gA, GG), text: '3', c: 'y', dx: -16, size: 22 }, { k: 'label', at: av(GG, G1), text: '1', c: 'y', dx: -16, size: 22 });
    return { t: 'fig', id, col: 1, view: [-2.1, -0.85, 2.6, 3.05], w: Math.round(H * 4.7 / 3.9), h: H, items };
  };
  // ---- (3) の図：AB=CD=2、ほかは x（x=2.5 の形）を斜めから見た見取図 ----
  const nz = v => { const L = Math.hypot(v[0], v[1], v[2]); return v.map(t => t / L); };
  const dot3 = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
  const E1 = nz([0.18, -1, -0.32]), U0 = [1, 0.12, -0.3], E2 = nz(U0.map((t, i) => t - dot3(U0, E1) * E1[i]));
  const pj = p => [dot3(p, E1), dot3(p, E2)];
  const X = 2.5, hp = Math.sqrt(X * X - 2) / 2, hq = Math.SQRT2 / 2;
  const V3 = { A: [hp, hq, hq], B: [hp, -hq, -hq], C: [-hp, hq, -hq], D: [-hp, -hq, hq] };
  const A = pj(V3.A), B = pj(V3.B), C = pj(V3.C), D = pj(V3.D), M = av(A, B), N = av(C, D);
  const tet = (o) => {
    o = o || {}; const items = [
      { k: 'seg', a: A, b: B, c: 'y', wd: 3.5 }, { k: 'seg', a: C, b: D, c: 'y', wd: 3.5 },
      { k: 'seg', a: A, b: C, c: 'w', wd: 2.5 }, { k: 'seg', a: A, b: D, c: 'w', wd: 2.5 }, { k: 'seg', a: B, b: D, c: 'w', wd: 2.5 }, { k: 'seg', a: B, b: C, c: 'w', wd: 2, dash: true },
      { k: 'pt', at: A, name: 'A', dir: 'nw', r: 5 }, { k: 'pt', at: B, name: 'B', dir: 'ne', r: 5 }, { k: 'pt', at: C, name: 'C', dir: 'w', r: 5 }, { k: 'pt', at: D, name: 'D', dir: 's', r: 5 },
      { k: 'label', at: [0.62, A[1]], text: '2', c: 'y', dy: -20, size: 23 }, { k: 'label', at: [-0.52, -0.98], text: '2', c: 'y', size: 23 },
      { k: 'label', at: av(A, C), text: 'x', dx: -20, size: 24 }, { k: 'label', at: av(B, D), text: 'x', dx: 20, size: 24 }];
    if (o.mn) items.push({ k: 'seg', a: M, b: N, c: 'p', wd: 2.5, dash: true }, { k: 'pt', at: M, name: 'M', dir: 'n', c: 'p', r: 5 }, { k: 'pt', at: N, name: 'N', dir: 'ne', c: 'p', r: 5 },
      { k: 'pt', at: [0, 0], name: 'G', dir: 'e', off: 28, c: 'p', r: 5 });
    if (o.abn) items.push({ k: 'poly', pts: [A, B, N], close: true, fill: 'g', alpha: 0.25, c: 'g', wd: 2 });
    if (o.box) {
      const cs = []; [-1, 1].forEach(i => [-1, 1].forEach(j => [-1, 1].forEach(k => cs.push([i, j, k]))));
      cs.forEach(p => cs.forEach(q => { const df = p.filter((t, z) => t !== q[z]).length; if (df === 1 && p < q) items.unshift({ k: 'seg', a: pj([p[0] * hp, p[1] * hq, p[2] * hq]), b: pj([q[0] * hp, q[1] * hq, q[2] * hq]), c: 'b', wd: 1.5 }); }));
      items.push({ k: 'label', at: pj([0, hq, hq]), text: 'p', c: 'b', dx: -18, size: 24 }, { k: 'label', at: pj([hp, 0, -hq]), text: 'q', c: 'b', dy: -16, size: 24 }, { k: 'label', at: pj([hp, hq, 0]), text: 'r', c: 'b', dy: -16, size: 24 });
    }
    return items;
  };
  const fig3 = (id, o, h) => { const H = h || 470; return { t: 'fig', id, col: 1, view: [-1.45, -1.6, 1.6, 1.45], w: Math.round(H * 3.05 / 3.05), h: H, items: tet(o) }; };
  const POINTS = [
    '重心の問題は位置ベクトルで。3:1 に内分する点は $\\dfrac{\\vec a+\\vec b+\\vec c+\\vec d}{4}$ で、4 つの文字について **対称** だから 4 本とも通る',
    '始点を G にとると $\\vec a+\\vec b+\\vec c+\\vec d=\\vec 0$。$|\\vec a+\\vec b|^2=|\\vec c+\\vec d|^2$ と $|\\vec a-\\vec b|^2=|\\vec c-\\vec d|^2$ をたして内積を消す',
    '最大値は「増減表で山が1つ」「両はしで 0 に近づく」まで見て、**本当に存在する** ことを確かめる。ここでは正四面体のとき'
  ];

  HB.lesson({
    id: 'waseda24-3', field: '早稲田型　数学（理工）', title: '2024 早稲田 理工 第3問の類題 ― 四面体の重心と、向かい合う辺が等しい四面体', level: '2024年度 早稲田大学 理工 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '四面体 ABCD において、面 BCD，ACD，ABD，ABC の重心をそれぞれ $\\mathrm{G}_1,\\ \\mathrm{G}_2,\\ \\mathrm{G}_3,\\ \\mathrm{G}_4$ とする。',
      parts: [
        '(1)　4 本の線分 $\\mathrm{AG}_1,\\ \\mathrm{BG}_2,\\ \\mathrm{CG}_3,\\ \\mathrm{DG}_4$ は 1 点で交わり、その点はどの線分も $3:1$ に内分することを示せ。以下、この点を G とする。',
        '(2)　向かい合う 3 組の辺の長さがそれぞれ等しい、すなわち $\\mathrm{AB}=\\mathrm{CD},\\ \\mathrm{AC}=\\mathrm{BD},\\ \\mathrm{AD}=\\mathrm{BC}$ であるとき、$\\mathrm{GA}=\\mathrm{GB}=\\mathrm{GC}=\\mathrm{GD}$ であることを示せ。',
        '(3)　$\\mathrm{AB}=\\mathrm{CD}=2,\\ \\mathrm{AC}=\\mathrm{AD}=\\mathrm{BC}=\\mathrm{BD}=x$ とする（このような四面体があるのは $x>\\sqrt2$ のときである）。4 点 A，B，C，D を通る球の半径 $R$ と、四面体 ABCD の体積 $V$ を、それぞれ $x$ で表せ。',
        '(4)　(3) で $x$ が $x>\\sqrt2$ の範囲を動くとき、$\\dfrac{V}{R^3}$ の最大値と、そのときの $x$ の値を求めよ。'
      ],
      src: '※ 2024年度 早稲田大学 一般選抜 理工3学部 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.55, 0.45],
    steps: [
      { cols: [1], part: '問題', say: '四面体の重心と、向かい合う辺が等しい四面体の問題です。(1)(2) は証明、(3)(4) は計算。(4) では最大値が本当にあるかまで確かめます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '4 つの頂点を同じように扱える **位置ベクトル** が主役です。右は (1) の図。黄の線分が $\\mathrm{AG}_1$（$\\mathrm{G}_1$ は底面 BCD の重心）です。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　3:1 に内分する点を位置ベクトルで表す\n(2)　G を始点にして $\\vec a+\\vec b+\\vec c+\\vec d=\\vec 0$ を使う\n(3)　AB, CD の中点 M, N を結ぶ線分を使う\n(4)　増減表で、最大値が本当にあることまで確かめる' },
          gen('f0')] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: 'A, B, C, D の位置ベクトルを $\\vec a,\\ \\vec b,\\ \\vec c,\\ \\vec d$ とします。$\\mathrm{G}_1$ は △BCD の重心なので、3 つの位置ベクトルの平均です。',
        add: [{ t: 'h', text: '(1)　4 本の線分は 1 点で交わる' },
          { t: 'm', tex: '\\vec g_1=\\frac{\\vec b+\\vec c+\\vec d}{3}', note: '$\\mathrm{G}_1$ の位置ベクトル' },
          gen('f1')] },
      { ask: { type: 'choice', q: '線分 $\\mathrm{AG}_1$ を $3:1$ に内分する点の位置ベクトルは？',
        opts: ['$\\dfrac{9\\vec a+\\vec b+\\vec c+\\vec d}{12}$', '$\\dfrac{\\vec a+\\vec b+\\vec c+\\vec d}{3}$', '$\\dfrac{\\vec a+\\vec b+\\vec c+\\vec d}{4}$', '$\\dfrac{\\vec a+3(\\vec b+\\vec c+\\vec d)}{4}$'], ok: 2,
        why: { 0: '比が逆です。$3:1$ に内分する点は $\\frac{1\\cdot\\vec a+3\\,\\vec g_1}{4}$。$\\vec g_1$ の側に 3 がかかります。', 1: '内分点の公式の分母は $3+1=4$ です。', 3: '$\\vec g_1=\\frac{\\vec b+\\vec c+\\vec d}{3}$。3 で割るのを忘れています。' },
        good: '$\\dfrac{\\vec a+3\\vec g_1}{4}=\\dfrac{\\vec a+(\\vec b+\\vec c+\\vec d)}{4}$。4 つの位置ベクトルの平均になります。',
        add: [{ t: 'm', tex: '\\frac{\\vec a+3\\vec g_1}{4}=\\frac{\\vec a+\\vec b+\\vec c+\\vec d}{4}' }],
        draw: [{ fig: 'f1', items: [{ k: 'pt', at: GG, name: 'G', dir: 'e', off: 26, c: 'p', r: 6 }, { k: 'label', at: av(gA, GG), text: '3', c: 'y', dx: -16, size: 22 }, { k: 'label', at: av(GG, G1), text: '1', c: 'y', dx: -16, size: 22 }] }] } },
      { say: 'この式は $\\vec a,\\ \\vec b,\\ \\vec c,\\ \\vec d$ について対称。$\\mathrm{BG}_2,\\ \\mathrm{CG}_3,\\ \\mathrm{DG}_4$ を $3:1$ に内分する点も同じ式になるので、4 本はこの 1 点を通ります。',
        add: [{ t: 'ans', label: '(1) 答', text: '4 本の線分はどれも、位置ベクトル $\\dfrac{\\vec a+\\vec b+\\vec c+\\vec d}{4}$ の点を通り、その点で $3:1$ に内分される。（証明終）' }],
        draw: [{ fig: 'f1', items: [{ k: 'seg', a: gB, b: G2, c: 'g', wd: 2 }, { k: 'seg', a: gC, b: G3, c: 'g', wd: 2 }, { k: 'seg', a: gD, b: G4, c: 'g', wd: 2 }, { k: 'dot', at: G2, c: 'g' }, { k: 'dot', at: G3, c: 'g' }, { k: 'dot', at: G4, c: 'g' }] }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.62, 0.38], part: '(2)', say: '(2) では始点を G にとり直します。G 始点の位置ベクトルを $\\vec a,\\ \\vec b,\\ \\vec c,\\ \\vec d$ とすると、(1) から和が $\\vec 0$。示すことは「4 つの大きさが等しい」です。',
        add: [{ t: 'h', text: '(2)　G から 4 頂点までの距離が等しい' },
          { t: 'm', tex: '\\vec a+\\vec b+\\vec c+\\vec d=\\vec 0', note: 'G 始点' },
          { t: 'box', c: 'b', size: 'sm', label: '示すこと', text: '$|\\vec a|=|\\vec b|=|\\vec c|=|\\vec d|$' }] },
      { say: '$\\vec a+\\vec b=-(\\vec c+\\vec d)$ なので、大きさの 2 乗が等しい（i）。一方、AB = CD は $|\\vec a-\\vec b|^2=|\\vec c-\\vec d|^2$（ii）です。',
        add: [{ t: 'm', size: 'sm', tex: '|\\vec a|^2+|\\vec b|^2+2\\vec a\\cdot\\vec b=|\\vec c|^2+|\\vec d|^2+2\\vec c\\cdot\\vec d', note: '(i)' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2+|\\vec b|^2-2\\vec a\\cdot\\vec b=|\\vec c|^2+|\\vec d|^2-2\\vec c\\cdot\\vec d', note: '(ii)　AB = CD' }] },
      { ask: { type: 'choice', q: '(i) と (ii) を **たす** と、どんな式が得られる？',
        opts: ['$\\vec a\\cdot\\vec b=\\vec c\\cdot\\vec d$', '$|\\vec a|=|\\vec c|$', '$|\\vec a|^2-|\\vec b|^2=|\\vec c|^2-|\\vec d|^2$', '$|\\vec a|^2+|\\vec b|^2=|\\vec c|^2+|\\vec d|^2$'], ok: 3,
        why: { 0: 'それは (i) から (ii) を引いたときの式です。', 1: '式 1 つだけでは、1 つ 1 つの大きさまでは決まりません。', 2: '$|\\vec b|^2$ の符号がちがいます。たすと $2|\\vec a|^2+2|\\vec b|^2=2|\\vec c|^2+2|\\vec d|^2$。' },
        good: '内積の項が消えて、大きさの 2 乗だけの式になります。これを ① とします。',
        add: [{ t: 'm', tex: '|\\vec a|^2+|\\vec b|^2=|\\vec c|^2+|\\vec d|^2', note: '①' }] } },
      { clear: true, cols: [0.6, 0.4], part: '(2)', say: '残りの 2 組（AC = BD、AD = BC）でも同じ計算ができて、②③ が出ます。3 つの式を組み合わせます。',
        add: [{ t: 'h', text: '(2)　3 組の式を組み合わせる' },
          { t: 'm', tex: '|\\vec a|^2+|\\vec b|^2=|\\vec c|^2+|\\vec d|^2', note: '①　AB = CD' },
          { t: 'm', tex: '|\\vec a|^2+|\\vec c|^2=|\\vec b|^2+|\\vec d|^2', note: '②　AC = BD' },
          { t: 'm', tex: '|\\vec a|^2+|\\vec d|^2=|\\vec b|^2+|\\vec c|^2', note: '③　AD = BC' }] },
      { say: '①+② から $|\\vec a|=|\\vec d|$、①−② から $|\\vec b|=|\\vec c|$。これらを ③ に入れると $2|\\vec a|^2=2|\\vec b|^2$ で、$|\\vec a|=|\\vec b|$。',
        add: [{ t: 'm', size: 'sm', tex: '|\\vec a|=|\\vec d|,\\quad |\\vec b|=|\\vec c|,\\quad |\\vec a|=|\\vec b|' },
          { t: 'ans', label: '(2) 答', text: '$|\\vec a|=|\\vec b|=|\\vec c|=|\\vec d|$ より\nGA = GB = GC = GD（証明終）' }] },
      { ask: { type: 'think', q: '(2) の四面体では、4 つの面の重心 $\\mathrm{G}_1\\sim\\mathrm{G}_4$ も、G を中心とする 1 つの球面上にあることを示そう。',
        hint: 'G 始点で $\\vec g_1=\\frac{\\vec b+\\vec c+\\vec d}{3}$。和が $\\vec 0$ なので $\\vec b+\\vec c+\\vec d=-\\vec a$。',
        ans: '$\\vec g_1=-\\dfrac13\\vec a$ なので $|\\vec g_1|=\\dfrac13|\\vec a|$。ほかも同じで、4 点は半径 $\\dfrac13\\mathrm{GA}$ の球面上にある。',
        after: '$\\mathrm{G}_1$ は、A を G に関して反対側へ $\\frac13$ に縮めた点。4 つの重心の四面体は、もとの四面体を $-\\frac13$ 倍した形です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: 'AB = CD = 2、ほかの 4 辺が $x$。AB の中点を M、CD の中点を N とします。G は MN の中点です（$\\frac{\\vec m+\\vec n}{2}=\\frac{\\vec a+\\vec b+\\vec c+\\vec d}{4}$）。',
        add: [{ t: 'h', text: '(3)　半径 R と体積 V' },
          { t: 'p', size: 'sm', text: '△ACD と △BCD は、どちらも $x,\\ x,\\ 2$ の二等辺三角形。' },
          fig3('t1', { mn: true })] },
      { ask: { type: 'choice', q: 'AN の長さは？',
        opts: ['$\\sqrt{x^2-1}$', '$\\sqrt{x^2-2}$', '$\\sqrt{x^2+1}$', '$x-1$'], ok: 0,
        why: { 1: 'それはこのあと出てくる MN の長さです。', 2: '三平方の定理では引き算です：$x^2-1^2$。', 3: '長さは辺の差ではありません。直角三角形 ACN で三平方の定理を使います。' },
        good: 'N は二等辺三角形 ACD の底辺の中点なので AN ⊥ CD。$\\mathrm{AN}=\\sqrt{x^2-1}$。同じように $\\mathrm{BN}=\\sqrt{x^2-1}$。',
        add: [{ t: 'm', tex: '\\mathrm{AN}=\\mathrm{BN}=\\sqrt{x^2-1}' }] } },
      { say: '△ABN は AN = BN の二等辺三角形なので MN ⊥ AB。$\\mathrm{MN}=\\sqrt{\\mathrm{AN}^2-\\mathrm{AM}^2}=\\sqrt{x^2-2}$。ここから $x>\\sqrt2$ が必要なこともわかります。',
        add: [{ t: 'm', tex: '\\mathrm{MN}=\\sqrt{(x^2-1)-1}=\\sqrt{x^2-2}' }] },
      { say: 'G は MN の中点で、GM ⊥ AB。直角三角形 GMA で三平方の定理を使えば、半径 $R=\\mathrm{GA}$ が出ます。',
        add: [{ t: 'm', tex: 'R^2=\\mathrm{GM}^2+\\mathrm{MA}^2=\\frac{x^2-2}{4}+1=\\frac{x^2+2}{4}' }] },
      { ask: { type: 'choice', q: 'CD ⊥ AN、CD ⊥ BN なので、CD は平面 ABN に垂直。体積 $V$ は？',
        opts: ['$2\\sqrt{x^2-2}$', '$\\frac13\\sqrt{x^2-2}$', '$\\frac23\\sqrt{x^2-2}$', '$\\frac43\\sqrt{x^2-2}$'], ok: 2,
        why: { 0: '錐体の体積なので $\\frac13$ をかけます。', 1: '$\\triangle\\mathrm{ABN}=\\sqrt{x^2-2}$ に、高さの和 CD $=2$ をかけ忘れています。', 3: '$\\triangle\\mathrm{ABN}=\\frac12\\cdot2\\cdot\\sqrt{x^2-2}$。$\\frac12$ を忘れています。' },
        good: '平面 ABN で 2 つに切ると、どちらも底面 △ABN、高さ 1（CN, DN）。合わせて $\\frac13\\cdot\\sqrt{x^2-2}\\cdot2$。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'R=\\frac{\\sqrt{x^2+2}}{2},\\qquad V=\\frac23\\sqrt{x^2-2}' }],
        draw: [{ fig: 't1', items: [{ k: 'poly', pts: [A, B, N], close: true, fill: 'g', alpha: 0.25, c: 'g', wd: 2 }] }] } },

      // ---------- (4) ----------
      { clear: true, cols: [0.6, 0.4], part: '(4)', say: '$\\frac{V}{R^3}$ を $x$ で表します。正の量なので 2 乗して、$u=x^2\\ (u>2)$ とおくと、分数関数 $g(u)$ の最大の問題になります。',
        add: [{ t: 'h', text: '(4)　V/R³ の最大値' },
          { t: 'm', tex: 'R^3=\\frac{(x^2+2)\\sqrt{x^2+2}}{8}' },
          { t: 'm', tex: '\\frac{V}{R^3}=\\frac{16}{3}\\cdot\\frac{\\sqrt{x^2-2}}{(x^2+2)\\sqrt{x^2+2}}' },
          { t: 'm', tex: '\\Big(\\frac{V}{R^3}\\Big)^2=\\frac{256}{9}\\,g(u),\\qquad g(u)=\\frac{u-2}{(u+2)^3}' }] },
      { ask: { type: 'choice', q: "$g'(u)=0$ となる $u$ は？",
        opts: ['$u=2$', '$u=4$', '$u=8$', '$u=6$'], ok: 1,
        why: { 0: '$u=2$ は範囲 $u>2$ の外です（$g(2)=0$）。', 2: "分子は $(u+2)-3(u-2)=8-2u$。$8-2u=0$ を解きます。", 3: '分子の計算をもう一度：$(u+2)-3(u-2)=-2u+8$。' },
        good: "$g'(u)=\\dfrac{(u+2)^3-3(u-2)(u+2)^2}{(u+2)^6}=\\dfrac{2(4-u)}{(u+2)^4}$。",
        add: [{ t: 'm', tex: "g'(u)=\\frac{2(4-u)}{(u+2)^4}" }] } },
      { say: '増減表です。$2<u<4$ で増加、$u>4$ で減少。しかも $u\\to2$ でも $u\\to\\infty$ でも $g(u)\\to0$。山が 1 つだけなので、$u=4$ で最大です。',
        add: [{ t: 'tbl', col: 1, rows: [['$u$', '$(2)$', '$\\cdots$', '$4$', '$\\cdots$'], ["$g'(u)$", '', '$+$', '$0$', '$-$'], ['$g(u)$', '$(0)$', '↗', '$\\frac{1}{108}$', '↘']] },
          { t: 'p', col: 1, size: 'sm', text: '$u\\to\\infty$ でも $g(u)\\to0$' }] },
      { ask: { type: 'choice', q: '「最大値が存在する」と言い切るための理由として、いちばん正しいのは？',
        opts: ["$g'(u)=0$ の $u$ があるから", '$u\\to\\infty$ で $g\\to0$ だから', '$g(u)>0$ だから', '範囲全体で $u=4$ を境に増加→減少'], ok: 3,
        why: { 0: "$g'=0$ の点は、極小や、最大でない極大のこともあります。", 1: 'ずっと減少する関数なら、最大値はありません。', 2: '正の関数でも、最大値がないことはあります。' },
        good: '範囲全体で山が 1 つ。だから $u=4$ の値が最大値です。答案にこの理由を書きます。' } },
      { say: '$u=4$、つまり $x=2$。6 本の辺がすべて 2 の **正四面体** のときです。最大値は $\\frac{16}{3}\\sqrt{\\frac{1}{108}}=\\frac{16}{3}\\cdot\\frac{1}{6\\sqrt3}=\\frac{8\\sqrt3}{27}$。',
        add: [{ t: 'ans', label: '(4) 答', tex: 'x=2\\ \\text{のとき 最大値}\\ \\frac{8\\sqrt3}{27}' }] },
      { ask: { type: 'think', q: '外接球の体積に対する、四面体の体積の割合 $\\dfrac{V}{\\frac43\\pi R^3}$ の最大値は？',
        hint: '(4) の答えに $\\dfrac{3}{4\\pi}$ をかける。',
        ans: '$\\dfrac{3}{4\\pi}\\cdot\\dfrac{8\\sqrt3}{27}=\\dfrac{2\\sqrt3}{9\\pi}\\ (\\approx0.12)$',
        after: '正四面体でも、外接球の約 12% しかしめません。' } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '向かい合う辺が等しい四面体は、直方体の面の対角線 6 本でつくれます。辺が $p,\\ q,\\ r$ の直方体なら、AB = CD $=\\sqrt{q^2+r^2}$ などとなります。',
        add: [{ t: 'h', text: '別の見方：直方体に入れる' },
          { t: 'm', size: 'sm', tex: 'q^2+r^2=4,\\quad r^2+p^2=x^2,\\quad p^2+q^2=x^2' },
          { t: 'm', size: 'sm', tex: 'q=r=\\sqrt2,\\qquad p=\\sqrt{x^2-2}' },
          fig3('t2', { box: true })] },
      { say: '体積は、直方体から 4 すみの三角錐を引いて $pqr-4\\cdot\\frac{pqr}{6}=\\frac{pqr}{3}$。外接球は直方体の外接球と同じで、半径は対角線の半分。(3) と同じ答えです。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\frac{pqr}{3}=\\frac23\\sqrt{x^2-2}' },
          { t: 'm', size: 'sm', tex: 'R=\\frac12\\sqrt{p^2+q^2+r^2}=\\frac{\\sqrt{x^2+2}}{2}' }] },

      // ---------- 答案 ----------
      { clear: true, cols: [1], part: '答案', say: '証明と最大値の問題では、根拠を言葉で書くことが大切です。とくに (4) の「最大値が存在する理由」は答案に必ず書きましょう。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', label: '採点のポイント', text: '・(1) 3:1 の内分点が $\\vec a,\\ \\vec b,\\ \\vec c,\\ \\vec d$ について対称な式になることを示す\n・(2) 始点を G にとり、$\\vec a+\\vec b=-(\\vec c+\\vec d)$ の大きさと AB = CD の式をたす。3 組とも同じ計算\n・(3) 二等辺三角形の中点で垂直を言い、三平方の定理。CD ⊥ 平面 ABN の理由を書く\n・(4) 範囲 $u>2$ 全体の増減表で最大を確かめ、そのときの $x$ を答える' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。位置ベクトルの対称性で証明し、中点を結ぶ線分で長さを出し、最大値は存在まで確かめる流れでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
