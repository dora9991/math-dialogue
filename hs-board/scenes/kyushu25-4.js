/* 九大型（理系）2025 第4問の類題（自作）：数学Ⅰ 図形と計量・数学A 図形の性質 ― 直径を対角線にもつ円に内接する四角形
   元の問題はうつしていない（「円に内接する四角形で、直径・等しい辺の条件から角を求め、余弦定理で辺の長さを出し、円周角と角の二等分線の性質で比を求めて小さい三角形の面積を出す」というねらいと形式だけを合わせた自作問題。元は直径が1辺、こちらは直径が対角線）。
   AC が直径、AB=3、BC=4、AD=CD、E＝AC∩BD。
   (1) AC=5、∠ABD=∠ACD=45°（AD=CD=5√2/2、△ACD は直角二等辺三角形）
   (2) △ABD で余弦定理：25/2 = 9 + x² − 3√2x → 2x² − 6√2x − 7 = 0 → x = 7√2/2（もう1つは −√2/2）
       （△BCD で使うと x² − 4√2x + 7/2 = 0 で x = 7√2/2, √2/2 と正の解が2つ出る）
   (3) BE は ∠ABC の二等分線 → AE:EC = 3:4（AE=15/7, EC=20/7）、△ABE = 6·3/7 = 18/7
   考えてみよう：BE = 12√2/7、ED = 25√2/14、AE·EC = BE·ED = 300/49。
   座標（円の中心が原点、半径 5/2）：A(−2.5,0) C(2.5,0) B(−0.7,−2.4) D(0,2.5) E(−5/14,0) で、python3 で長さ・角・面積を検算ずみ。 */
(function () {
  const POINTS = [
    '直径に対する円周角は $90^\\circ$。等しい弦（弧）に対する円周角は等しい → $\\angle\\mathrm{ABD}=\\angle\\mathrm{DBC}=45^\\circ$',
    '余弦定理は「角の向かいの辺」を左辺に。分かっている角をふくむ三角形を選ぶと、負の解が出て1つに決まりやすい',
    '角の二等分線の性質 AE : EC ＝ BA : BC。高さが共通な三角形の面積の比は、底辺の比'
  ];
  const A = [-2.5, 0], C = [2.5, 0], B = [-0.7, -2.4], D = [0, 2.5], E = [-5 / 14, 0];
  const t = 0.11;
  const base = [
    { k: 'circle', o: [0, 0], r: 2.5, c: 'd', wd: 2 },
    { k: 'poly', pts: [A, B, C, D], close: true, c: 'w', wd: 3 },
    { k: 'seg', a: A, b: C, c: 'w', wd: 2 },
    { k: 'right', o: B, a: A, b: C, s: 14, c: 'd' }, { k: 'right', o: D, a: A, b: C, s: 14, c: 'd' },
    { k: 'seg', a: [-1.25 - t, 1.25 + t], b: [-1.25 + t, 1.25 - t], c: 'y', wd: 2.5 }, { k: 'seg', a: [1.25 - t, 1.25 - t], b: [1.25 + t, 1.25 + t], c: 'y', wd: 2.5 },
    { k: 'label', at: [-1.95, -1.45], text: '3', c: 'b', size: 24 }, { k: 'label', at: [1.15, -1.55], text: '4', c: 'b', size: 24 },
    { k: 'pt', at: A, name: 'A', dir: 'w' }, { k: 'pt', at: B, name: 'B', dir: 's' }, { k: 'pt', at: C, name: 'C', dir: 'e' }, { k: 'pt', at: D, name: 'D', dir: 'n' }];
  const BD = [{ k: 'seg', a: B, b: D, c: 'y', wd: 3 }];
  const ang = [{ k: 'angle', o: B, a: A, b: D, rp: 40, label: '45°', lr: 26, c: 'p', size: 19 }, { k: 'angle', o: B, a: D, b: C, rp: 52, label: '45°', lr: 22, c: 'p', size: 19 }];
  const Ept = [{ k: 'pt', at: E, name: 'E', dir: 'nw', c: 'p', off: 20 }];
  const fig = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-3.3, -3.0, 3.3, 3.1], w: Math.round((h || 370) * 6.6 / 6.1), h: h || 370, items: base.concat(extra || []) });

  HB.lesson({
    id: 'kyushu25-4', field: '九大型　数学（理系）', title: '2025 九大 理系 第4問の類題 ― 直径を対角線にもつ内接四角形', level: '2025年度 九州大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '線分 AC を直径とする円に、四角形 ABCD が内接している。AB $=3$，BC $=4$，AD $=$ CD とする。また、対角線 AC と BD の交点を E とする。',
      parts: [
        '(1)　線分 AC の長さと、$\\angle\\mathrm{ABD}$ の大きさを求めよ。',
        '(2)　線分 BD の長さを求めよ。',
        '(3)　AE : EC を求めよ。また、$\\triangle\\mathrm{ABE}$ の面積を求めよ。'
      ],
      src: '※ 2025年度 九州大学 前期 理系 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.54, 0.46],
    steps: [
      { part: '問題', say: '円に内接する四角形の問題です。円周角・余弦定理・角の二等分線という基本の道具を、どの順に使うかを考えます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 図と条件 ----------
      { clear: true, part: '(1)', say: 'まず図。AC は直径なので、直径に対する円周角 $\\angle\\mathrm{ABC}$ と $\\angle\\mathrm{ADC}$ は $90^\\circ$。AD $=$ CD は、黄色の印で表しました。',
        add: [{ t: 'h', text: '(1)　図をかいて条件を読む' },
          { t: 'box', c: 'b', size: 'sm', label: '条件の読みかえ', text: 'AC が直径 → $\\angle\\mathrm{ABC}=\\angle\\mathrm{ADC}=90^\\circ$\nAD $=$ CD → 弧 AD $=$ 弧 CD' },
          fig('c1')] },
      { ask: { type: 'choice', q: 'AC の長さは？',
        opts: ['7', '5', '$\\sqrt7$', '$\\dfrac{12}{5}$'], ok: 1,
        why: { 0: '辺の長さを足しています。$\\angle\\mathrm{ABC}=90^\\circ$ なので三平方の定理です。', 2: '$4^2-3^2$ と引いています。AC は斜辺です。', 3: 'それは B から AC に下ろした垂線の長さ $\\frac{3\\cdot4}{5}$ です。' },
        good: '$\\angle\\mathrm{ABC}=90^\\circ$（AC が直径）なので、AC $=\\sqrt{3^2+4^2}=5$。',
        add: [{ t: 'm', tex: '\\mathrm{AC}=\\sqrt{3^2+4^2}=5' }] } },
      { say: '$\\triangle\\mathrm{ACD}$ は $\\angle\\mathrm{ADC}=90^\\circ$、AD $=$ CD の直角二等辺三角形。だから AD $=$ CD $=\\frac{5}{\\sqrt2}=\\frac{5\\sqrt2}{2}$、$\\angle\\mathrm{ACD}=45^\\circ$ です。',
        add: [{ t: 'm', tex: '\\mathrm{AD}=\\mathrm{CD}=\\frac{5\\sqrt2}{2},\\quad \\angle\\mathrm{ACD}=45^\\circ' }],
        draw: [{ fig: 'c1', items: [{ k: 'poly', pts: [A, C, D], close: true, fill: 'y', alpha: 0.14, noStroke: true }] }] },
      { ask: { type: 'choice', q: '$\\angle\\mathrm{ABD}$ と等しい角は？（円周角の定理）',
        opts: ['$\\angle\\mathrm{ADB}$', '$\\angle\\mathrm{BAC}$', '$\\angle\\mathrm{ACD}$', '$\\angle\\mathrm{BCA}$'], ok: 2,
        why: { 0: '$\\angle\\mathrm{ADB}$ は弧 AB に対する円周角です。', 1: '$\\angle\\mathrm{BAC}$ は弧 BC に対する円周角です。', 3: '$\\angle\\mathrm{BCA}$ は弧 AB に対する円周角（$\\angle\\mathrm{ADB}$ と等しい）です。' },
        good: '$\\angle\\mathrm{ABD}$ と $\\angle\\mathrm{ACD}$ は、どちらも弧 AD に対する円周角。だから $45^\\circ$。',
        add: [{ t: 'ans', label: '(1) 答', text: 'AC $=5$，　$\\angle\\mathrm{ABD}=45^\\circ$' }],
        draw: [{ fig: 'c1', items: BD.concat([ang[0]]) }] } },
      { say: '同じように、$\\angle\\mathrm{DBC}$ は弧 DC に対する円周角で $45^\\circ$。つまり BD は $90^\\circ$ の $\\angle\\mathrm{ABC}$ を **二等分** しています。(3) で使います。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: 'あとで使う', text: '$\\angle\\mathrm{ABD}=\\angle\\mathrm{DBC}=45^\\circ$\n→ BD は $\\angle\\mathrm{ABC}$ の二等分線' }],
        draw: [{ fig: 'c1', items: [ang[1]] }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は $\\triangle\\mathrm{ABD}$ に注目。AB $=3$、AD $=\\frac{5\\sqrt2}{2}$、$\\angle\\mathrm{ABD}=45^\\circ$ が分かっています。BD $=x$ とおいて余弦定理を使います。',
        add: [{ t: 'h', text: '(2)　BD の長さ' },
          { t: 'box', c: 'b', size: 'sm', label: '△ABD', text: 'AB $=3$，AD $=\\frac{5\\sqrt2}{2}$，$\\angle\\mathrm{ABD}=45^\\circ$，BD $=x$（求める）' },
          fig('c2', [{ k: 'poly', pts: [A, B, D], close: true, fill: 'b', alpha: 0.16, noStroke: true }].concat(BD, [ang[0]]), 340)] },
      { ask: { type: 'choice', q: '余弦定理で、$\\cos45^\\circ$ と組になる（左辺にくる）辺は？',
        opts: ['AB', 'BD', 'AC', 'AD'], ok: 3,
        why: { 0: 'AB は $\\angle\\mathrm{ABD}$ をはさむ辺です。', 1: 'BD も $\\angle\\mathrm{ABD}$ をはさむ辺で、求めたい $x$ です。', 2: 'AC は $\\triangle\\mathrm{ABD}$ の辺ではありません。' },
        good: '$\\angle\\mathrm{ABD}$ の向かいの辺は AD。AD$^2=$ AB$^2+$ BD$^2-2\\cdot$ AB $\\cdot$ BD $\\cos45^\\circ$。',
        add: [{ t: 'm', tex: '\\left(\\frac{5\\sqrt2}{2}\\right)^2=3^2+x^2-2\\cdot3\\cdot x\\cos45^\\circ' },
          { t: 'm', tex: '\\frac{25}{2}=9+x^2-3\\sqrt2\\,x' }] } },
      { say: '両辺を 2 倍して整理すると、$x$ の2次方程式 $2x^2-6\\sqrt2\\,x-7=0$ になります。解の公式で解きます。',
        add: [{ t: 'm', tex: '2x^2-6\\sqrt2\\,x-7=0' }] },
      { ask: { type: 'choice', q: 'この方程式の解のうち、BD の長さは？',
        opts: ['$\\dfrac{7\\sqrt2}{2}$', '$-\\dfrac{\\sqrt2}{2}$', '$\\dfrac{\\sqrt2}{2}$', '$7\\sqrt2$'], ok: 0,
        why: { 1: '長さは正です。負の解は捨てます。', 2: '符号のミス。$\\frac{6\\sqrt2-8\\sqrt2}{4}$ は負になります。', 3: '解の公式の分母 $2\\cdot2=4$ を、2 にしています。' },
        good: '$x=\\dfrac{6\\sqrt2\\pm\\sqrt{72+56}}{4}=\\dfrac{6\\sqrt2\\pm8\\sqrt2}{4}$。$x>0$ より $\\dfrac{7\\sqrt2}{2}$。',
        add: [{ t: 'ans', col: 1, label: '(2) 答', tex: '\\mathrm{BD}=\\frac{7\\sqrt2}{2}' }] } },
      { ask: { type: 'think', q: '$\\triangle\\mathrm{BCD}$（BC $=4$、CD $=\\frac{5\\sqrt2}{2}$、$\\angle\\mathrm{DBC}=45^\\circ$）で余弦定理を使うと、どうなる？',
        hint: 'CD$^2=$ BC$^2+x^2-2\\cdot4\\cdot x\\cos45^\\circ$ を整理する。',
        ans: '$x^2-4\\sqrt2\\,x+\\dfrac72=0$ より $x=\\dfrac{7\\sqrt2}{2},\\ \\dfrac{\\sqrt2}{2}$（どちらも正）',
        after: '正の解が2つ出て、どちらが BD か別に判断が必要です。△ABD なら負の解が出て、すぐに1つに決まりました。三角形の選び方で手間が変わります。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3)。(1) で見たように BD は $\\angle\\mathrm{ABC}$ の二等分線。$\\triangle\\mathrm{ABC}$ で、**角の二等分線の性質** が使えます。',
        add: [{ t: 'h', text: '(3)　AE : EC と △ABE の面積' },
          { t: 'box', c: 'b', size: 'sm', label: '角の二等分線の性質', text: '$\\triangle\\mathrm{ABC}$ で BE が $\\angle\\mathrm{B}$ の二等分線\n→ AE : EC $=$ BA : BC' },
          fig('c3', BD.concat(ang, Ept))] },
      { ask: { type: 'choice', q: 'AE : EC は？',
        opts: ['1 : 1', '4 : 3', '9 : 16', '3 : 4'], ok: 3,
        why: { 0: 'D は弧 AC の真ん中ですが、E が AC の真ん中になるわけではありません。', 1: '逆です。A の側は BA $=3$、C の側は BC $=4$。', 2: '2乗はしません。AE : EC $=$ BA : BC です。' },
        good: 'AE : EC $=$ BA : BC $=3:4$。だから AE $=5\\cdot\\frac37=\\frac{15}{7}$、EC $=\\frac{20}{7}$。',
        add: [{ t: 'm', tex: '\\mathrm{AE}:\\mathrm{EC}=3:4,\\quad \\mathrm{AE}=\\frac{15}{7}' }] } },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{ABE}$ の面積は？（$\\triangle\\mathrm{ABC}=\\frac12\\cdot3\\cdot4=6$）',
        opts: ['$\\dfrac{18}{7}$', '$\\dfrac{24}{7}$', '$3$', '$\\dfrac{15}{7}$'], ok: 0,
        why: { 1: 'それは $\\triangle\\mathrm{CBE}$ の面積（$\\frac47$ の側）です。', 2: '$\\triangle\\mathrm{ABC}$ の半分にしています。比は $3:4$ です。', 3: 'それは AE の長さです。' },
        good: '$\\triangle\\mathrm{ABE}$ と $\\triangle\\mathrm{ABC}$ は高さが共通。底辺の比 AE : AC $=3:7$ より $6\\times\\frac37=\\frac{18}{7}$。',
        add: [{ t: 'ans', label: '(3) 答', text: 'AE : EC $=3:4$，　$\\triangle\\mathrm{ABE}=\\dfrac{18}{7}$' }],
        draw: [{ fig: 'c3', items: [{ k: 'poly', pts: [A, B, E], close: true, fill: 'p', alpha: 0.22, noStroke: true }] }] } },
      { ask: { type: 'think', q: '$\\triangle\\mathrm{ABE}$ の面積を $\\frac12\\cdot\\mathrm{AB}\\cdot\\mathrm{BE}\\sin45^\\circ$ とも表して、BE の長さを求めよう。',
        hint: '$\\dfrac12\\cdot3\\cdot\\mathrm{BE}\\cdot\\dfrac{\\sqrt2}{2}=\\dfrac{18}{7}$ を解く。',
        ans: 'BE $=\\dfrac{12\\sqrt2}{7}$',
        after: 'ED $=\\frac{7\\sqrt2}{2}-\\frac{12\\sqrt2}{7}=\\frac{25\\sqrt2}{14}$。AE$\\cdot$EC と BE$\\cdot$ED はどちらも $\\frac{300}{49}$（方べきの定理）で、検算になります。' } },

      // ---------- 答案 ----------
      { clear: true, cols: [1], part: '答案', say: '図形の答案は、使った定理を一言ずつ書くことで点になります。とくに「なぜ 45° か」「なぜ二等分線か」の根拠を落とさないように。',
        add: [{ t: 'h', text: '答案に書く根拠' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)', text: '「AC は直径だから $\\angle\\mathrm{ABC}=90^\\circ$」「$\\angle\\mathrm{ABD}$ と $\\angle\\mathrm{ACD}$ は弧 AD に対する円周角だから等しい」' },
          { t: 'box', c: 'y', size: 'sm', label: '(2)', text: '「$\\triangle\\mathrm{ABD}$ に余弦定理を用いて」「BD $>0$ より」' },
          { t: 'box', c: 'p', size: 'sm', label: '(3)', text: '「AD $=$ CD より弧 AD $=$ 弧 CD なので $\\angle\\mathrm{ABD}=\\angle\\mathrm{DBC}$。BE は $\\angle\\mathrm{ABC}$ の二等分線だから AE : EC $=$ BA : BC」' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。円の性質で角を出し、余弦定理で長さ、角の二等分線で比。基本の道具を順番に使う問題でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
