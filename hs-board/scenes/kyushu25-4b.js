/* 九大型（理系）2025 第4問の類題②（自作）：数学Ⅰ 図形と計量・数学A 図形の性質 ― 直径を1辺にもつ円に内接する四角形
   元の問題はうつしていない（「円に内接する四角形で、直径・等しい辺の条件から角を求め、余弦定理で辺の長さを出し、円周角と角の二等分線の性質で比を求めて小さい三角形の面積を出す」というねらいと形式だけを合わせた自作問題。類題①は直径が対角線、こちらは直径が1辺で、等しい辺は AB=BC）。
   AD が直径、AD=5、AB=BC=3、E＝AC∩BD。
   (1) ∠ABD=90° → BD=4、cos∠ADB=4/5。AB=BC → 弧 AB＝弧 BC → ∠ADB=∠BDC=θ
   (2) ∠BCA=∠BAC=θ（弧 AB の円周角＝∠ADB）。△ABC に余弦定理：9 = x²+9−2·x·3·(4/5) → x²−(24/5)x=0 → x=24/5（x=0 は不適）。∠ACD=90° → CD=√(25−576/25)=7/5
   (3) DE は ∠ADC の二等分線 → AE:EC=DA:DC=25:7（AE=15/4, EC=21/20）。△ABC=½·(24/5)·(9/5)=108/25、△ABE=108/25·25/32=27/8
   考えてみよう：AC＝2·AB cosθ=24/5。△ABE=½·AB·AE·sinθ=½·3·(15/4)·(3/5)=27/8。（方べきの定理 AE·EC=BE·ED=63/16、BE=9/4 の検算も可）
   座標（円の中心が原点、半径 5/2）：A(−2.5,0) D(2.5,0) B(−0.7,2.4) C(527/250,168/125) E(1.1,1.05)。python3（sympy）で長さ・面積・比を検算ずみ。 */
(function () {
  const POINTS = [
    '直径に対する円周角は $90^\\circ$。等しい弦（弧）に対する円周角は等しい → $\\angle\\mathrm{ADB}=\\angle\\mathrm{BDC}$。同じ弧に対する円周角も等しい → $\\angle\\mathrm{ACB}=\\angle\\mathrm{ADB}$',
    '余弦定理は「角の向かいの辺」を左辺に。長さ $x$ の2次方程式は、解が 0 や負になるものを **長さ（正）** で捨てる',
    '角の二等分線の性質 AE : EC ＝ DA : DC。高さが共通な三角形の面積の比は、底辺の比'
  ];
  const A = [-2.5, 0], D = [2.5, 0], B = [-0.7, 2.4], C = [527 / 250, 168 / 125], E = [1.1, 1.05];
  const tick = (P, Q) => { const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], dx = Q[0] - P[0], dy = Q[1] - P[1], L = Math.hypot(dx, dy), px = -dy / L * 0.11, py = dx / L * 0.11;
    return { k: 'seg', a: [m[0] - px, m[1] - py], b: [m[0] + px, m[1] + py], c: 'y', wd: 2.5 }; };
  const base = [
    { k: 'circle', o: [0, 0], r: 2.5, c: 'd', wd: 2 },
    { k: 'poly', pts: [A, B, C, D], close: true, c: 'w', wd: 3 },
    { k: 'right', o: B, a: A, b: D, s: 14, c: 'd' }, { k: 'right', o: C, a: A, b: D, s: 14, c: 'd' },
    tick(A, B), tick(B, C),
    { k: 'label', at: [-1.28, 0.95], text: '3', c: 'b', size: 24 }, { k: 'label', at: [0.55, 2.2], text: '3', c: 'b', size: 24 },
    { k: 'dim', a: A, b: D, dy: 30, label: '5' },
    { k: 'pt', at: A, name: 'A', dir: 'w' }, { k: 'pt', at: B, name: 'B', dir: 'nw' }, { k: 'pt', at: C, name: 'C', dir: 'ne' }, { k: 'pt', at: D, name: 'D', dir: 'e' }];
  const BD = [{ k: 'seg', a: B, b: D, c: 'y', wd: 3 }];
  const AC = [{ k: 'seg', a: A, b: C, c: 'b', wd: 3 }];
  const angD = [{ k: 'angle', o: D, a: A, b: B, rp: 70, label: 'θ', lr: 52, c: 'p', size: 20 }, { k: 'angle', o: D, a: B, b: C, rp: 48, label: 'θ', lr: 36, c: 'p', size: 20 }];
  const angC = [{ k: 'angle', o: C, a: B, b: A, rp: 36, label: 'θ', lr: 26, c: 'p', size: 20 }, { k: 'angle', o: A, a: B, b: C, rp: 44, label: 'θ', lr: 30, c: 'p', size: 20 }];
  const Ept = [{ k: 'pt', at: E, name: 'E', dir: 'n', c: 'p', off: 20 }];
  const fig = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-3.3, -2.0, 3.3, 3.2], w: Math.round((h || 340) * 6.6 / 5.2), h: h || 340, items: base.concat(extra || []) });

  HB.lesson({
    id: 'kyushu25-4b', field: '九大型　数学（理系）', title: '2025 九大 理系 第4問の類題② ― 直径を1辺にもつ内接四角形', level: '2025年度 九州大学 理系 第4問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '線分 AD を直径とする円に、四角形 ABCD が内接している。AD $=5$，AB $=$ BC $=3$ とする。また、対角線 AC と BD の交点を E とする。',
      parts: [
        '(1)　線分 BD の長さと、$\\cos\\angle\\mathrm{ADB}$ の値を求めよ。',
        '(2)　線分 AC の長さと、線分 CD の長さを求めよ。',
        '(3)　AE : EC を求めよ。また、$\\triangle\\mathrm{ABE}$ の面積を求めよ。'
      ],
      src: '※ 2025年度 九州大学 前期 理系 第4問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '円に内接する四角形の問題です。円周角・余弦定理・角の二等分線という基本の道具を、どの順に使うかを考えます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 図と条件 ----------
      { clear: true, part: '(1)', say: 'まず図。AD は直径なので、直径に対する円周角 $\\angle\\mathrm{ABD}$ と $\\angle\\mathrm{ACD}$ は $90^\\circ$。AB $=$ BC は、黄色の印で表しました。',
        add: [{ t: 'h', text: '(1)　図をかいて条件を読む' },
          { t: 'box', c: 'b', size: 'sm', label: '条件の読みかえ', text: 'AD が直径 → $\\angle\\mathrm{ABD}=\\angle\\mathrm{ACD}=90^\\circ$\nAB $=$ BC → 弧 AB $=$ 弧 BC' },
          fig('c1')] },
      { ask: { type: 'choice', q: 'BD の長さは？',
        opts: ['$\\sqrt{34}$', '2', '$\\dfrac{12}{5}$', '4'], ok: 3,
        why: { 0: '辺の長さの2乗を足しています。AD が斜辺なので $\\mathrm{BD}^2=5^2-3^2$。', 1: '$5-3$ と引いています。三平方の定理です。', 2: 'それは B から AD に下ろした垂線の長さ $\\frac{3\\cdot4}{5}$ です。' },
        good: '$\\angle\\mathrm{ABD}=90^\\circ$（AD が直径）なので、BD $=\\sqrt{5^2-3^2}=4$。',
        add: [{ t: 'm', tex: '\\mathrm{BD}=\\sqrt{5^2-3^2}=4' }] } },
      { say: '直角三角形 ABD で、$\\cos\\angle\\mathrm{ADB}=\\dfrac{\\mathrm{BD}}{\\mathrm{AD}}=\\dfrac45$。この角を $\\theta$ とおきます。$\\sin\\theta=\\dfrac35$ です。',
        add: [{ t: 'm', tex: '\\cos\\theta=\\frac{\\mathrm{BD}}{\\mathrm{AD}}=\\frac45,\\quad\\sin\\theta=\\frac35' },
          { t: 'ans', label: '(1) 答', text: 'BD $=4$，　$\\cos\\angle\\mathrm{ADB}=\\dfrac45$' }],
        draw: [{ fig: 'c1', items: BD.concat([angD[0]]) }] },
      { ask: { type: 'choice', q: 'AB $=$ BC より、D から見た円周角で等しいものは？',
        opts: ['$\\angle\\mathrm{ABD}$ と $\\angle\\mathrm{BDC}$', '$\\angle\\mathrm{ADB}$ と $\\angle\\mathrm{BDC}$', '$\\angle\\mathrm{DAB}$ と $\\angle\\mathrm{DCB}$', '$\\angle\\mathrm{ADB}$ と $\\angle\\mathrm{ABD}$'], ok: 1,
        why: { 0: '$\\angle\\mathrm{ABD}=90^\\circ$ は直径に対する円周角で、弧 AB・BC とは関係ありません。', 2: '$\\angle\\mathrm{DAB}$ と $\\angle\\mathrm{DCB}$ は向かい合う角で、和が $180^\\circ$ です。', 3: '$\\angle\\mathrm{ABD}$ は $90^\\circ$。$\\angle\\mathrm{ADB}$ は $90^\\circ$ より小さい角です。' },
        good: '等しい弦に対する円周角は等しい。弧 AB $=$ 弧 BC なので $\\angle\\mathrm{ADB}=\\angle\\mathrm{BDC}=\\theta$。DB は $\\angle\\mathrm{ADC}$ を二等分します。',
        draw: [{ fig: 'c1', items: [angD[1]] }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は $\\triangle\\mathrm{ABC}$ に注目。$\\angle\\mathrm{ACB}$ は弧 AB に対する円周角で、$\\angle\\mathrm{ADB}=\\theta$ と等しい。AC $=x$ とおいて余弦定理を使います。',
        add: [{ t: 'h', text: '(2)　AC の長さ' },
          { t: 'box', c: 'b', size: 'sm', label: '△ABC', text: 'AB $=$ BC $=3$，$\\angle\\mathrm{ACB}=\\theta$（$\\cos\\theta=\\frac45$），AC $=x$（求める）' },
          fig('c2', [{ k: 'poly', pts: [A, B, C], close: true, fill: 'b', alpha: 0.16, noStroke: true }].concat(AC, [angC[0]]), 320)] },
      { ask: { type: 'choice', q: '余弦定理で、$\\cos\\theta$ と組になる（左辺にくる）辺は？',
        opts: ['AB', 'BC', 'AC', 'BD'], ok: 0,
        why: { 1: 'BC は $\\angle\\mathrm{ACB}$ をはさむ辺です。', 2: 'AC も $\\angle\\mathrm{ACB}$ をはさむ辺で、求めたい $x$ です。', 3: 'BD は $\\triangle\\mathrm{ABC}$ の辺ではありません。' },
        good: '$\\angle\\mathrm{ACB}$ の向かいの辺は AB。AB$^2=$ AC$^2+$ BC$^2-2\\cdot$ AC $\\cdot$ BC $\\cos\\theta$。',
        add: [{ t: 'm', tex: '3^2=x^2+3^2-2\\cdot x\\cdot3\\cdot\\frac45' },
          { t: 'm', tex: 'x^2-\\frac{24}{5}x=0\\quad\\therefore\\ x\\left(x-\\frac{24}{5}\\right)=0' }] } },
      { ask: { type: 'choice', q: 'AC の長さは？',
        opts: ['0', '$\\dfrac{12}{5}$', '$\\dfrac{24}{5}$', '6'], ok: 2,
        why: { 0: '$x=0$ も解ですが、AC は線分の長さで正です。捨てます。', 1: 'それは AC の半分 $3\\cos\\theta$ です。', 3: 'AB $+$ BC $=6$。AC は $\\triangle\\mathrm{ABC}$ の1辺で、$6$ より小さくなります。' },
        good: '$x>0$ より $x=\\dfrac{24}{5}$。$x=0$ は長さにならないので捨てます。',
        add: [{ t: 'ans', col: 1, label: 'AC', tex: '\\mathrm{AC}=\\frac{24}{5}' }] } },
      { ask: { type: 'think', q: '別の求め方：B から AC に垂線 BH を下ろす。AB $=$ BC なので H は AC の中点。$\\mathrm{AH}=\\mathrm{AB}\\cos\\theta$ から AC を求めよう。',
        hint: '$\\angle\\mathrm{BAC}=\\angle\\mathrm{BCA}=\\theta$。AC $=2\\,\\mathrm{AH}$。',
        ans: 'AH $=3\\cdot\\dfrac45=\\dfrac{12}{5}$、AC $=2\\cdot\\dfrac{12}{5}=\\dfrac{24}{5}$',
        after: '余弦定理でも二等辺三角形の垂線でも、同じ $\\frac{24}{5}$。(3) では BH $=3\\sin\\theta=\\frac95$ も使います。' } },
      { clear: true, say: '次に CD。$\\angle\\mathrm{ACD}=90^\\circ$（AD が直径）なので、直角三角形 ACD で三平方の定理です。AC $=\\frac{24}{5}$ は求めました。',
        add: [{ t: 'h', text: '(2)　つづき：CD の長さ' },
          { t: 'm', tex: '\\mathrm{CD}=\\sqrt{\\mathrm{AD}^2-\\mathrm{AC}^2}', size: 'sm' },
          { t: 'm', tex: '=\\sqrt{25-\\frac{576}{25}}=\\sqrt{\\frac{49}{25}}', size: 'sm' },
          fig('c2b', [{ k: 'poly', pts: [A, C, D], close: true, fill: 'y', alpha: 0.14, noStroke: true }].concat(AC), 320)] },
      { ask: { type: 'choice', q: 'CD の長さは？',
        opts: ['$\\dfrac{49}{25}$', '$\\dfrac{\\sqrt{1201}}{5}$', '$\\dfrac75$', '$\\dfrac15$'], ok: 2,
        why: { 0: '$\\sqrt{\\ }$ をとり忘れています。$\\sqrt{\\frac{49}{25}}=\\frac75$。', 1: '2乗の和にしています。AD が斜辺なので $\\mathrm{AD}^2-\\mathrm{AC}^2$ です。', 3: '$5-\\frac{24}{5}$ と長さの差にしています。三平方の定理は2乗で考えます。' },
        good: '$\\sqrt{\\dfrac{49}{25}}=\\dfrac75$。',
        add: [{ t: 'ans', label: '(2) 答', text: 'AC $=\\dfrac{24}{5}$，　CD $=\\dfrac75$' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3)。DB は $\\angle\\mathrm{ADC}$ の二等分線。$\\triangle\\mathrm{ACD}$ で、**角の二等分線の性質** が使えます。',
        add: [{ t: 'h', text: '(3)　AE : EC と △ABE の面積' },
          { t: 'box', c: 'b', size: 'sm', label: '角の二等分線の性質', text: '$\\triangle\\mathrm{ACD}$ で DE が $\\angle\\mathrm{D}$ の二等分線\n→ AE : EC $=$ DA : DC' },
          fig('c3', BD.concat(AC, angD, Ept))] },
      { ask: { type: 'choice', q: 'AE : EC は？',
        opts: ['1 : 1', '25 : 7', '7 : 25', '5 : 3'], ok: 1,
        why: { 0: 'B は弧 AC の真ん中ですが、E が AC の真ん中になるわけではありません。', 2: '逆です。A の側は DA $=5$、C の側は DC $=\\frac75$。', 3: 'DA : AB にしています。二等分線の性質は DA : DC です。' },
        good: 'AE : EC $=$ DA : DC $=5:\\frac75=25:7$。だから AE $=\\frac{24}{5}\\cdot\\frac{25}{32}=\\frac{15}{4}$、EC $=\\frac{21}{20}$。',
        add: [{ t: 'm', tex: '\\mathrm{AE}:\\mathrm{EC}=5:\\frac75=25:7' }] } },
      { say: '$\\triangle\\mathrm{ABC}$ の面積から先に出します。底辺 AC $=\\frac{24}{5}$、高さ BH $=3\\sin\\theta=\\frac95$ なので $\\triangle\\mathrm{ABC}=\\frac12\\cdot\\frac{24}{5}\\cdot\\frac95=\\frac{108}{25}$。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{ABC}=\\frac12\\cdot\\frac{24}{5}\\cdot\\frac95=\\frac{108}{25}', size: 'sm' }] },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{ABE}$ の面積は？（AE : AC $=25:32$）',
        opts: ['$\\dfrac{108}{25}$', '$\\dfrac{54}{25}$', '$\\dfrac{189}{200}$', '$\\dfrac{27}{8}$'], ok: 3,
        why: { 0: 'それは $\\triangle\\mathrm{ABC}$ の面積です。E は AC の途中の点です。', 1: '$\\triangle\\mathrm{ABC}$ の半分にしています。比は $25:32$ です。', 2: 'それは $\\triangle\\mathrm{CBE}$ の面積（$\\frac{7}{32}$ の側）です。' },
        good: '$\\triangle\\mathrm{ABE}$ と $\\triangle\\mathrm{ABC}$ は高さが共通。底辺の比 AE : AC $=25:32$ より $\\frac{108}{25}\\times\\frac{25}{32}=\\frac{27}{8}$。',
        add: [{ t: 'ans', label: '(3) 答', text: 'AE : EC $=25:7$，　$\\triangle\\mathrm{ABE}=\\dfrac{27}{8}$' }],
        draw: [{ fig: 'c3', items: [{ k: 'poly', pts: [A, B, E], close: true, fill: 'p', alpha: 0.22, noStroke: true }] }] } },
      { ask: { type: 'think', q: '$\\triangle\\mathrm{ABE}$ の面積を $\\frac12\\cdot\\mathrm{AB}\\cdot\\mathrm{AE}\\sin\\theta$ とも表して、$\\frac{27}{8}$ になることを確かめよう。',
        hint: '$\\angle\\mathrm{BAE}=\\angle\\mathrm{BAC}=\\theta$、AE $=\\dfrac{15}{4}$、$\\sin\\theta=\\dfrac35$。',
        ans: '$\\dfrac12\\cdot3\\cdot\\dfrac{15}{4}\\cdot\\dfrac35=\\dfrac{27}{8}$',
        after: '一致しました。面積を2通りで出すと検算になります。なお BE $=\\frac94$、ED $=\\frac74$ で、AE$\\cdot$EC と BE$\\cdot$ED はどちらも $\\frac{63}{16}$（方べきの定理）です。' } },

      // ---------- 答案 ----------
      { clear: true, cols: [1], part: '答案', say: '図形の答案は、使った定理を一言ずつ書くことで点になります。とくに「なぜ $\\theta$ が等しいか」「なぜ二等分線か」の根拠を落とさないように。',
        add: [{ t: 'h', text: '答案に書く根拠' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)', text: '「AD は直径だから $\\angle\\mathrm{ABD}=90^\\circ$」「三平方の定理より BD $=4$、$\\cos\\angle\\mathrm{ADB}=\\frac45$」' },
          { t: 'box', c: 'y', size: 'sm', label: '(2)', text: '「$\\angle\\mathrm{ACB}$ と $\\angle\\mathrm{ADB}$ は弧 AB に対する円周角だから等しい」「$\\triangle\\mathrm{ABC}$ に余弦定理」「AC $>0$ より」「$\\angle\\mathrm{ACD}=90^\\circ$ より三平方の定理」' },
          { t: 'box', c: 'p', size: 'sm', label: '(3)', text: '「AB $=$ BC より弧 AB $=$ 弧 BC なので $\\angle\\mathrm{ADB}=\\angle\\mathrm{BDC}$。DE は $\\angle\\mathrm{ADC}$ の二等分線だから AE : EC $=$ DA : DC」' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。円の性質で角を出し、余弦定理で長さ、角の二等分線で比。基本の道具を順番に使う問題でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
