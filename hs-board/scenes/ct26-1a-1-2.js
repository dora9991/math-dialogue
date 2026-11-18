/* 共通テスト型 数学Ⅰ，A：2026年度 第1問〔2〕（図形と計量）と同じ分野・ねらいの自作問題（元の問題ではない）
   答え（python3・sympy で検算ずみ）：ア＝⓪ ½(ab+cd)sinθ／イ＝② (a²+b²−c²−d²)/(2(ab+cd))／
   a=4,b=5,c=7,d=10 で cosθ＝−3/5、S＝36（AC²＝65 を両側から確認）／ク＝① cosφ＝(t²−r²)/(t²+r²)（sin²+cos²＝1 も確認）／
   半径 3・cosA＝−5/13・cosB＝4/5 → 接線の長さ A:2、B:9、AB＝11、C:11（面積 3(11+z)＝½·11·(2+z)·12/13）、BC＝20、CA＝13
   （ヘロンで面積 66・内接円の半径 3・cosA、cosB も一致）。図は数値どおりの形。 */
(function () {
  const POINTS = [
    '円に内接する四角形は **対角線で2つに分け**、向かい合う角が $\\theta$ と $180^\\circ-\\theta$。$\\sin$ は同じ、$\\cos$ は符号が逆',
    '前の小問の一般式は、文字を **読みかえて** 使う（丸投げ型）。接線の作る四角形 EPFO は、対角が $90^\\circ$ ずつで円に内接する',
    '最後の未知数は **面積を2通りに**：内接円なら $S=r\\times(\\text{周の長さの半分})$ と $S=\\dfrac12bc\\sin A$'
  ];
  // ---------- (1) の図：AB=4, BC=5, CD=7, DA=10, ∠B=θ（cosθ=−3/5）。外接円の半径 R=√65/1.6 ----------
  const R = Math.sqrt(65) / 1.6, deg = Math.PI / 180;
  const arc = L => 2 * Math.asin(L / (2 * R));
  const onC = t => [R * Math.cos(t), R * Math.sin(t)];
  let th = 270 * deg - arc(10) / 2;   // DA を下の水平な弦にする
  const QA = onC(th); th -= arc(4); const QB = onC(th); th -= arc(5); const QC = onC(th); th -= arc(7); const QD = onC(th);
  const out = (P, Q, text, c, px) => { const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], L = Math.hypot(M[0], M[1]) || 1;
    return { k: 'label', at: M, text, c: c || 'b', size: 26, dx: M[0] / L * (px || 22), dy: -M[1] / L * (px || 22) }; };
  const quad = (id, extra) => ({ t: 'fig', id, col: 1, view: [-6.4, -6.0, 6.4, 6.0], w: 520, h: 488, items: [
    { k: 'circle', o: [0, 0], r: R, c: 'd' },
    { k: 'poly', pts: [QA, QB, QC, QD], close: true, c: 'w' },
    { k: 'seg', a: QA, b: QC, c: 'y', dash: true },
    { k: 'angle', o: QB, a: QA, b: QC, rp: 34, c: 'p', label: 'θ', lr: 22 },
    out(QA, QB, 'a'), out(QB, QC, 'b'), out(QC, QD, 'c'), out(QD, QA, 'd'),
    { k: 'pt', at: QA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: QB, name: 'B', dir: 'w', r: 4 },
    { k: 'pt', at: QC, name: 'C', dir: 'n', r: 4 }, { k: 'pt', at: QD, name: 'D', dir: 'se', r: 4 }].concat(extra || []) });

  // ---------- (2) の図：半径 r の円と外の点 P からの2本の接線 ----------
  const r2 = 1.6, PP = [5, 0], ca = r2 / 5, sa = Math.sqrt(1 - ca * ca), E = [r2 * ca, r2 * sa], Fp = [r2 * ca, -r2 * sa];
  const kite = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.1, -2.3, 5.9, 2.3], w: 600, h: 345, items: [
    { k: 'circle', o: [0, 0], r: r2, c: 'd' },
    { k: 'poly', pts: [E, PP, Fp, [0, 0]], close: true, fill: 'b', alpha: 0.12, c: 'w' },
    { k: 'seg', a: [0, 0], b: PP, c: 'd', dash: true },
    { k: 'right', o: E, a: [0, 0], b: PP, s: 14, c: 'y' }, { k: 'right', o: Fp, a: [0, 0], b: PP, s: 14, c: 'y' },
    { k: 'angle', o: PP, a: E, b: Fp, rp: 50, c: 'p', label: 'φ', lr: 24 },
    { k: 'label', at: [(E[0] + PP[0]) / 2, (E[1] + PP[1]) / 2], text: 't', c: 'b', size: 26, dx: 10, dy: -20 },
    { k: 'label', at: [E[0] / 2, E[1] / 2], text: 'r', c: 'b', size: 26, dx: -18, dy: -4 },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'w', r: 4 }, { k: 'pt', at: E, name: 'E', dir: 'n', r: 4 },
    { k: 'pt', at: Fp, name: 'F', dir: 's', r: 4 }, { k: 'pt', at: PP, name: 'P', dir: 'e', r: 4 }].concat(extra || []) });

  // ---------- (3) の図：B(0,0) C(20,0) A(8.8,6.6)、内接円 中心 (9,3) 半径 3 ----------
  const TA = [8.8, 6.6], TB = [0, 0], TC = [20, 0], I = [9, 3];
  const tBC = [9, 0], tAB = [7.2, 5.4], tCA = [8.8 + 2 * 11.2 / 13, 6.6 - 2 * 6.6 / 13];
  const tri = (id, extra) => ({ t: 'fig', id, col: 1, view: [-1.5, -2.2, 21.5, 8.4], w: 660, h: 304, items: [
    { k: 'poly', pts: [TA, TB, TC], close: true, c: 'w' },
    { k: 'circle', o: I, r: 3, c: 'b' },
    { k: 'pt', at: I, name: 'O', dir: 'e', r: 4, c: 'b' },
    { k: 'dot', at: tBC }, { k: 'dot', at: tAB }, { k: 'dot', at: tCA },
    { k: 'pt', at: TA, name: 'A', dir: 'n', r: 4 }, { k: 'pt', at: TB, name: 'B', dir: 'sw', r: 4 }, { k: 'pt', at: TC, name: 'C', dir: 'se', r: 4 }].concat(extra || []) });
  const part = (label, text) => ({ t: 'box', c: 'b', size: 'sm', label, text });

  HB.lesson({
    id: 'ct26-1a-1-2', field: '共通テスト型　数学Ⅰ，A', title: '2026 共通テスト 数学Ⅰ，A 第1問〔2〕の類題 ― 円に内接する四角形と3本の接線',
    level: '2026年度 第1問〔2〕の類題（自作）', time: '目安 15〜20分', noDec: true,
    problem: {
      label: '類題',
      lead: '円に内接する四角形の面積の表し方を考え、その結果を、円の接線でできる図形に使う。',
      parts: [
        '(1)　円に内接する四角形 ABCD において、$\\mathrm{AB}=a,\\ \\mathrm{BC}=b,\\ \\mathrm{CD}=c,\\ \\mathrm{DA}=d,\\ \\angle\\mathrm{ABC}=\\theta$ とし、四角形 ABCD の面積を $S$ とする。対角線 AC で2つの三角形に分けて考えると、$S=\\boxed{\\text{ア}}$、$\\cos\\theta=\\boxed{\\text{イ}}$ である。\nアの解答群　⓪ $\\frac12(ab+cd)\\sin\\theta$　① $\\frac12(ad+bc)\\sin\\theta$　② $\\frac12(ab+cd)\\cos\\theta$　③ $\\frac12(ab-cd)\\sin\\theta$\nイの解答群　⓪ $\\frac{a^2+b^2+c^2+d^2}{2(ab+cd)}$　① $\\frac{c^2+d^2-a^2-b^2}{2(ab+cd)}$　② $\\frac{a^2+b^2-c^2-d^2}{2(ab+cd)}$　③ $\\frac{a^2+b^2-c^2-d^2}{2(ab-cd)}$\n特に $a=4,\\ b=5,\\ c=7,\\ d=10$ のとき、$\\cos\\theta=\\dfrac{\\boxed{\\text{ウエ}}}{\\boxed{\\text{オ}}}$、$S=\\boxed{\\text{カキ}}$ である。',
        '(2)　半径 $r$ の円 O の外部の点 P から円 O に2本の接線を引き、接点を E, F とする。$\\mathrm{PE}=t,\\ \\angle\\mathrm{EPF}=\\varphi$ とする。四角形 EPFO は円に内接するので、(1) を用いると $\\cos\\varphi=\\boxed{\\text{ク}}$ である。また、四角形 EPFO の面積は $rt$ に等しいから、$\\sin\\varphi=\\dfrac{2rt}{t^2+r^2}$ となる。\nクの解答群　⓪ $\\frac{r^2-t^2}{t^2+r^2}$　① $\\frac{t^2-r^2}{t^2+r^2}$　② $\\frac{t^2-r^2}{2rt}$　③ $\\frac{t-r}{t+r}$',
        '(3)　半径 3 の円 O に3本の接線を引いたところ、それらで囲まれた三角形 ABC ができ、円 O は △ABC の内接円になった。$\\cos\\angle\\mathrm{BAC}=-\\dfrac{5}{13},\\ \\cos\\angle\\mathrm{ABC}=\\dfrac45$ であるとき、A から円 O に引いた接線の長さは $\\boxed{\\text{ケ}}$、B から引いた接線の長さは $\\boxed{\\text{コ}}$ であり、$\\mathrm{AB}=\\boxed{\\text{サシ}}$ である。さらに、$\\mathrm{BC}=\\boxed{\\text{スセ}}$、$\\mathrm{CA}=\\boxed{\\text{ソタ}}$ である。'
      ],
      src: '※ 2026年度 共通テスト 数学Ⅰ，A 第1問〔2〕と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '図形と計量の大問です。(1) で作った一般の式を、(2)(3) で読みかえて使う「丸投げ型」。問題文は Q キーで見られます。',
        add: [{ t: 'box', c: 'y', label: '類題の流れ', text: '(1)　円に内接する四角形の **面積** と $\\cos\\theta$ を $a,b,c,d$ で表す\n(2)　接線でできる四角形に (1) を **読みかえて** 使う\n(3)　3本の接線でできる三角形の **辺の長さ** を求める' },
          { t: 'box', c: 'g', size: 'sm', label: '共通テストのコツ', text: '(1)(2) は手早く確実に。(3) の後半は難しいので、時間を残して取りかかる。' }] },

      // ---------- (1) 面積 ----------
      { clear: true, part: '(1)', say: '(1) です。対角線 AC で、△ABC と △ACD に分けます。円に内接する四角形では、向かい合う角の和が $180^\\circ$ なので、$\\angle\\mathrm{D}=180^\\circ-\\theta$。',
        add: [part('(1)', '円に内接する四角形 ABCD　$\\angle\\mathrm{ABC}=\\theta$\n面積 $S=\\boxed{\\text{ア}}$、$\\cos\\theta=\\boxed{\\text{イ}}$'),
          { t: 'm', tex: '\\angle\\mathrm{ADC}=180^\\circ-\\theta', note: '対角の和は $180^\\circ$' },
          { t: 'm', tex: '\\sin(180^\\circ-\\theta)=\\sin\\theta' },
          quad('q1', [{ k: 'angle', o: QD, a: QC, b: QA, rp: 40, c: 'g', label: '180°−θ', lr: 52 }])] },
      { ask: { type: 'choice', q: '四角形 ABCD の面積 $S$（$\\boxed{\\text{ア}}$）は？',
        opts: ['$\\frac12(ab+cd)\\sin\\theta$', '$\\frac12(ad+bc)\\sin\\theta$', '$\\frac12(ab+cd)\\cos\\theta$', '$\\frac12(ab-cd)\\sin\\theta$'], ok: 0,
        why: { 1: '$\\theta$ をはさむ2辺は $a$ と $b$。$\\angle\\mathrm{D}$ をはさむのは $c$ と $d$ です。', 2: '三角形の面積は $\\frac12\\times(2辺)\\times\\sin$。$\\cos$ ではありません。', 3: '$\\sin(180^\\circ-\\theta)=+\\sin\\theta$。引き算にはなりません（$\\cos$ と混同）。' },
        good: '$\\frac12ab\\sin\\theta+\\frac12cd\\sin(180^\\circ-\\theta)=\\frac12(ab+cd)\\sin\\theta$。',
        add: [{ t: 'm', size: 'sm', tex: 'S=\\tfrac12ab\\sin\\theta+\\tfrac12cd\\sin\\theta=\\tfrac12(ab+cd)\\sin\\theta' }, { t: 'ans', label: 'ア', text: '⓪' }] } },

      // ---------- (1) cos ----------
      { clear: true, say: '次は $\\cos\\theta$。共通の辺 AC を、△ABC と △ACD の両方で **余弦定理** で表して、等しいとおきます。',
        add: [{ t: 'h', text: '(1)　AC² を2通りに' },
          { t: 'm', tex: '\\mathrm{AC}^2=a^2+b^2-2ab\\cos\\theta', note: '△ABC' },
          { t: 'm', tex: '\\mathrm{AC}^2=c^2+d^2\\hy{+}2cd\\cos\\theta', note: '△ACD\n$\\cos(180^\\circ-\\theta)=-\\cos\\theta$' },
          quad('q2')] },
      { ask: { type: 'choice', q: '2つの式から $\\cos\\theta$（$\\boxed{\\text{イ}}$）を求めると？',
        opts: ['$\\frac{a^2+b^2+c^2+d^2}{2(ab+cd)}$', '$\\frac{c^2+d^2-a^2-b^2}{2(ab+cd)}$', '$\\frac{a^2+b^2-c^2-d^2}{2(ab+cd)}$', '$\\frac{a^2+b^2-c^2-d^2}{2(ab-cd)}$'], ok: 2,
        why: { 0: '移項すると $c^2,\\ d^2$ は引き算になります。', 1: '分子の符号が逆。$a^2+b^2-c^2-d^2=2(ab+cd)\\cos\\theta$ です。', 3: '$\\cos(180^\\circ-\\theta)=-\\cos\\theta$ の符号を落とすと、分母が $ab-cd$ になってしまいます。' },
        good: '$a^2+b^2-c^2-d^2=2(ab+cd)\\cos\\theta$ を割ります。',
        add: [{ t: 'm', tex: '\\cos\\theta=\\frac{a^2+b^2-c^2-d^2}{2(ab+cd)}' }, { t: 'ans', label: 'イ', text: '②' }] } },
      { ask: { type: 'think', q: '$a=4,\\ b=5,\\ c=7,\\ d=10$ のとき、$\\cos\\theta=\\dfrac{\\boxed{\\text{ウエ}}}{\\boxed{\\text{オ}}}$ を求めよう。',
        hint: '分子 $16+25-49-100$、分母 $2(20+70)$。',
        ans: '$\\cos\\theta=\\dfrac{-108}{180}=-\\dfrac35$　（ウエ $=-3$、オ $=5$）',
        after: '$\\cos\\theta<0$ なので、$\\theta$ は鈍角。図の B の角も鈍角です。',
        add: [{ t: 'm', tex: '\\cos\\theta=\\frac{16+25-49-100}{2(20+70)}=-\\frac35' }] } },
      { ask: { type: 'choice', q: 'このときの面積 $S$（$\\boxed{\\text{カキ}}$）は？',
        opts: ['$30$', '$72$', '$27$', '$36$'], ok: 3,
        why: { 0: '$\\frac12(ad+bc)\\sin\\theta$ で計算しています。$\\theta$ をはさむのは $a,\\ b$。', 1: '三角形の面積の $\\frac12$ をかけ忘れています。', 2: '$\\sin\\theta=\\frac35$ としています。$\\cos\\theta=-\\frac35$ なら $\\sin\\theta=\\frac45$。' },
        good: '$\\sin\\theta=\\sqrt{1-\\frac{9}{25}}=\\frac45$。$S=\\frac12\\cdot90\\cdot\\frac45=36$。',
        add: [{ t: 'm', tex: '\\sin\\theta=\\tfrac45,\\quad S=\\tfrac12(20+70)\\cdot\\tfrac45=\\ans{36}' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\angle\\mathrm{PEO}=\\angle\\mathrm{PFO}=90^\\circ$（接線は半径に垂直）。向かい合う角の和が $180^\\circ$ なので、四角形 EPFO は円に内接します。',
        add: [part('(2)', '半径 $r$、$\\mathrm{PE}=t$、$\\angle\\mathrm{EPF}=\\varphi$\n$\\cos\\varphi=\\boxed{\\text{ク}}$'),
          { t: 'm', tex: '\\angle\\mathrm{PEO}+\\angle\\mathrm{PFO}=180^\\circ', note: '→ 円に内接' },
          kite('k1')] },
      { say: '(1) の四角形 ABCD を、四角形 EPFO に **読みかえ** ます。$\\theta$ の頂点 B が P。だから $a=\\mathrm{EP}=t,\\ b=\\mathrm{PF}=t,\\ c=\\mathrm{FO}=r,\\ d=\\mathrm{OE}=r$ です。',
        add: [{ t: 'tbl', size: 'sm', rows: [['(1)', 'A', 'B', 'C', 'D', '$a$', '$b$', '$c$', '$d$', '$\\theta$'], ['(2)', 'E', 'P', 'F', 'O', '$t$', '$t$', '$r$', '$r$', '$\\varphi$']] }] },
      { ask: { type: 'choice', q: '(1) の イ の式に入れると、$\\cos\\varphi$（$\\boxed{\\text{ク}}$）は？',
        opts: ['$\\frac{r^2-t^2}{t^2+r^2}$', '$\\frac{t^2-r^2}{t^2+r^2}$', '$\\frac{t^2-r^2}{2rt}$', '$\\frac{t-r}{t+r}$'], ok: 1,
        why: { 0: '分子は $a^2+b^2-c^2-d^2=t^2+t^2-r^2-r^2$。$t$ が先です。', 2: '分母は $2(ab+cd)=2(t^2+r^2)$。$2rt$ にはなりません。', 3: '2乗が消えています。分子・分母の 2 だけを約分します。' },
        good: '$\\dfrac{2t^2-2r^2}{2(t^2+r^2)}=\\dfrac{t^2-r^2}{t^2+r^2}$。',
        add: [{ t: 'm', tex: '\\cos\\varphi=\\frac{2t^2-2r^2}{2(t^2+r^2)}=\\frac{t^2-r^2}{t^2+r^2}' }, { t: 'ans', label: 'ク', text: '①' }] } },
      { say: '面積でも同じことができます。EPFO は △OPE 2つ分なので面積 $rt$。(1) の ア では $\\frac12(t^2+r^2)\\sin\\varphi$。等しいとおくと $\\sin\\varphi$ が出ます。',
        add: [{ t: 'm', size: 'sm', tex: 'rt=\\tfrac12(t^2+r^2)\\sin\\varphi\\ \\ \\therefore\\ \\sin\\varphi=\\frac{2rt}{t^2+r^2}' },
          { t: 'box', col: 1, c: 'g', size: 'sm', label: '見どころ', text: '$t>r$ なら $\\cos\\varphi>0$（鋭角）\n$t<r$ なら $\\cos\\varphi<0$（鈍角）\n$t=r$ なら $\\varphi=90^\\circ$' }] },

      // ---------- (3) 接線の長さ ----------
      { clear: true, cols: [0.5, 0.5], part: '(3)', say: '(3) です。内接円の場合、各頂点のまわりに (2) と同じ四角形ができます。頂点からの接線の長さを $x,\\ y,\\ z$ とおくと、辺はその和で表せます。',
        add: [part('(3)', '半径 3 の内接円　$\\cos A=-\\frac5{13},\\ \\cos B=\\frac45$\n接線の長さ A：$\\boxed{\\text{ケ}}$　B：$\\boxed{\\text{コ}}$\n$\\mathrm{AB}=\\boxed{\\text{サシ}}$、$\\mathrm{BC}=\\boxed{\\text{スセ}}$、$\\mathrm{CA}=\\boxed{\\text{ソタ}}$'),
          { t: 'm', tex: '\\mathrm{AB}=x+y,\\ \\ \\mathrm{BC}=y+z,\\ \\ \\mathrm{CA}=z+x' },
          tri('t1', [
            { k: 'label', at: [(TA[0] + tAB[0]) / 2, (TA[1] + tAB[1]) / 2], text: 'x', c: 'y', size: 24, dx: -16, dy: -6 },
            { k: 'label', at: [(TA[0] + tCA[0]) / 2, (TA[1] + tCA[1]) / 2], text: 'x', c: 'y', size: 24, dx: 10, dy: -16 },
            { k: 'label', at: [3.6, 2.7], text: 'y', c: 'g', size: 24, dx: -16, dy: -8 }, { k: 'label', at: [4.5, 0], text: 'y', c: 'g', size: 24, dy: 22 },
            { k: 'label', at: [14.5, 0], text: 'z', c: 'p', size: 24, dy: 22 }, { k: 'label', at: [15.3, 2.8], text: 'z', c: 'p', size: 24, dx: 12, dy: -14 }])] },
      { ask: { type: 'choice', q: '(2) の式で、A からの接線の長さ $x$（$\\boxed{\\text{ケ}}$）は？　$\\dfrac{x^2-9}{x^2+9}=-\\dfrac{5}{13}$',
        opts: ['$4$', '$\\dfrac92$', '$2$', '$3$'], ok: 2,
        why: { 0: '4 は $x^2$ の値。$x$ はその正の平方根です。', 1: '(2) の式の分子を $r^2-t^2$ と逆にすると $\\frac92$ になります。', 3: '3 は半径。$x=r$ だと $\\cos A=0$（直角）です。' },
        good: '$13x^2-117=-5x^2-45$ より $18x^2=72$、$x^2=4$、$x=2$。$x<r$ なので A は鈍角、合っています。',
        add: [{ t: 'm', tex: '13(x^2-9)=-5(x^2+9)\\ \\Rightarrow\\ x^2=4,\\ x=2' }, { t: 'ans', label: 'ケ', tex: '2' }] } },
      { ask: { type: 'think', q: 'B からの接線の長さ $y$（$\\boxed{\\text{コ}}$）と、$\\mathrm{AB}$（$\\boxed{\\text{サシ}}$）を求めよう。',
        hint: '$\\dfrac{y^2-9}{y^2+9}=\\dfrac45$ を解く。',
        ans: '$5y^2-45=4y^2+36$ より $y^2=81$、$y=9$。$\\mathrm{AB}=2+9=11$',
        after: '$y=9>3$ なので B は鋭角。$\\cos B=\\frac45>0$ と合っています。',
        add: [{ t: 'm', tex: 'y=9,\\qquad \\mathrm{AB}=x+y=\\ans{11}' }] } },

      // ---------- (3) 後半 ----------
      { clear: true, cols: [0.56, 0.44], say: 'ここからが難所。C の角の情報がないので、$z$ は (2) の式からは出ません。もう1つの関係として、**△ABC の面積を2通りに** 表します。',
        add: [{ t: 'h', text: '(3) 後半　残りの z を求める' },
          { t: 'box', c: 'p', size: 'sm', label: '方針', text: '未知数が1つ残ったら、**面積を2通りに** 表して方程式を作る' },
          tri('t2', [{ k: 'label', at: [4.4, 3.3], text: '11', c: 'y', size: 24, dx: -20, dy: -10 }, { k: 'label', at: [14.5, 3.3], text: '2+z', c: 'p', size: 24, dx: 18, dy: -12 }, { k: 'label', at: [10, 0], text: '9+z', c: 'p', size: 24, dy: 24 }])] },
      { say: '1つ目：内接円の半径を使う式。$S=r\\times(\\text{周の長さの半分})$。周の長さは $11+(9+z)+(2+z)=22+2z$ です。',
        add: [{ t: 'm', tex: 'S=3\\times\\frac{22+2z}{2}=3(11+z)', note: '内接円と面積' }] },
      { say: '2つ目：$S=\\frac12\\mathrm{AB}\\cdot\\mathrm{AC}\\sin A$。$\\cos A=-\\frac5{13}$ から $\\sin A=\\frac{12}{13}$ です。',
        add: [{ t: 'm', tex: 'S=\\frac12\\cdot11\\cdot(2+z)\\cdot\\frac{12}{13}=\\frac{66(2+z)}{13}' }] },
      { ask: { type: 'choice', q: '2つの $S$ を等しいとおいて $z$ を求めると、$\\mathrm{BC}$（$\\boxed{\\text{スセ}}$）は？',
        opts: ['$20$', '$13$', '$22$', '$18$'], ok: 0,
        why: { 1: '13 は CA（$z+x$）です。BC は $y+z$。', 2: '$z=11$ を2倍しています。BC は $y+z=9+11$。', 3: '$z=y=9$ と決めつけています。C の接線の長さは方程式で求めます。' },
        good: '$39(11+z)=66(2+z)$ より $27z=297$、$z=11$。$\\mathrm{BC}=9+11=20$。',
        add: [{ t: 'm', tex: '39(11+z)=66(2+z)\\ \\Rightarrow\\ z=11' },
          { t: 'ans', label: 'スセ・ソタ', tex: '\\mathrm{BC}=9+11=20,\\quad \\mathrm{CA}=11+2=13' }] } },
      { say: '検算：余弦定理で $\\cos A=\\frac{11^2+13^2-20^2}{2\\cdot11\\cdot13}=-\\frac{5}{13}$。条件と一致します。面積も $3(11+11)=66$ です。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\frac{121+169-400}{286}=-\\frac{5}{13}\\ \\checkmark' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。(1) の一般式を (2)(3) で読みかえる流れと、最後の「面積を2通りに」が、この大問の柱です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、(3) の後半までノートで解き直してみましょう。' }
    ]
  });
})();
