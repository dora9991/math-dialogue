/* 数学Ⅰ 第4章 図形と計量 三角形への応用 ②：余弦定理
   例はすべて自作（例題1 b=3√2, c=7, A=45° → a=5／例題2 a=13, b=8, c=15 → A=60°／3辺 7, 8, 13 の最大の角 120°／b=5, c=16, A=120° → a=19）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。図の三角形は、その数値どおりの形でかいている。 */
(function () {
  const POINTS = [
    '**余弦定理**：$a^2=b^2+c^2-2bc\\cos A$。**2辺とその間の角** から、残りの辺が求められる',
    '3辺がわかるときは $\\cos A=\\dfrac{b^2+c^2-a^2}{2bc}$ で角を求める。cos は $0^\\circ\\sim180^\\circ$ で角が1つに決まる',
    '$A=90^\\circ$ なら三平方の定理。$A$ が鈍角なら $\\cos A<0$ で、$-2bc\\cos A$ は **プラス** になる'
  ];
  const rad = d => d * Math.PI / 180, on = (o, r, d) => [o[0] + r * Math.cos(rad(d)), o[1] + r * Math.sin(rad(d))];
  const sl = (P, Q, G, text, c, px, size) => {   // 辺 PQ の外側（G と反対側）に字
    const M = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2]; let nx = -(Q[1] - P[1]), ny = Q[0] - P[0]; const L = Math.hypot(nx, ny); nx /= L; ny /= L;
    if ((M[0] - G[0]) * nx + (M[1] - G[1]) * ny < 0) { nx = -nx; ny = -ny; }
    return { k: 'label', at: M, text, c: c || 'w', size: size || 26, dx: nx * (px || 24), dy: -ny * (px || 24) };
  };
  const G3 = (P, Q, S) => [(P[0] + Q[0] + S[0]) / 3, (P[1] + Q[1] + S[1]) / 3];
  const names = (A, B, C, dA, dB, dC) => [{ k: 'pt', at: A, name: 'A', dir: dA || 'sw', r: 4 }, { k: 'pt', at: B, name: 'B', dir: dB || 'se', r: 4 }, { k: 'pt', at: C, name: 'C', dir: dC || 'n', r: 4 }];

  // 導入とまとめの三角形：A(0,0) B(6,0) C=4.4(cos52°, sin52°)
  const iA = [0, 0], iB = [6, 0], iC = on(iA, 4.4, 52), iG = G3(iA, iB, iC);
  // 証明：A を原点、B(6,0)、C=4.4(cos58°, sin58°)
  const pA = [0, 0], pB = [6, 0], pC = on(pA, 4.4, 58), pH = [pC[0], 0], pG = G3(pA, pB, pC);
  // 例題1：A(0,0) B(7,0) C=3√2(cos45°, sin45°)=(3,3)
  const eA = [0, 0], eB = [7, 0], eC = [3, 3], eG = G3(eA, eB, eC);
  // 例題2：A(0,0) B(15,0) C=8(cos60°, sin60°)
  const fA = [0, 0], fB = [15, 0], fC = on(fA, 8, 60), fG = G3(fA, fB, fC);
  // 3辺 7, 8, 13：V(0,0) W(8,0) U=7(cos120°, sin120°)
  const V = [0, 0], W = [8, 0], U = on(V, 7, 120), uG = G3(V, W, U);

  HB.lesson({
    id: 'm1d-09', field: '数学Ⅰ　図形と計量', title: '余弦定理', level: '三角形への応用', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　△ABC で $b=3\\sqrt2,\\ c=7,\\ A=45^\\circ$ のとき、$a$ を求めよ。',
        '(2)　△ABC で $a=13,\\ b=8,\\ c=15$ のとき、$A$ を求めよ。',
        '(3)　3辺の長さが $7,\\ 8,\\ 13$ の三角形の、いちばん大きい角を求めよ。',
        '(4)　△ABC で $b=5,\\ c=16,\\ A=120^\\circ$ のとき、$a$ を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間の正弦定理は、**向かい合う辺と角の組** が必要でした。この時間は、**2辺とその間の角** から残りの辺を求める **余弦定理** を学びます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**余弦定理** のしくみを知り、2辺とその間の角から辺を、3辺から角を求められる' }] },

      // ---------- 導入 ----------
      { clear: true, part: 'なぜ新しい定理？', say: '2辺とその間の角が決まると、三角形は1つに決まります（中学の合同条件）。でも、向かい合う辺と角の組がないので、正弦定理は使えません。',
        add: [{ t: 'h', text: '2辺とその間の角 → 残りの辺は？' },
          { t: 'p', text: '[[y:$b,\\ c$ と、その間の角 $A$]] がわかっている\n→ 三角形は1つに決まる（合同条件）' },
          { t: 'p', text: '向かい合う「辺と角の組」がない\n→ 正弦定理は使えない' },
          { t: 'fig', id: 'f0', col: 1, view: [-0.8, -1.0, 6.8, 4.4], w: 600, h: 426, items: [
            { k: 'poly', pts: [iA, iB, iC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'seg', a: iA, b: iB, c: 'y', wd: 4 }, { k: 'seg', a: iA, b: iC, c: 'y', wd: 4 }, { k: 'seg', a: iB, b: iC, c: 'p', dash: true },
            { k: 'angle', o: iA, a: iB, b: iC, rp: 40, c: 'y', label: 'A', lr: 18 },
            sl(iA, iB, iG, 'c', 'y'), sl(iA, iC, iG, 'b', 'y'), sl(iB, iC, iG, 'a = ?', 'p', 34)].concat(names(iA, iB, iC)) }] },

      // ---------- しくみ ----------
      { clear: true, cols: [0.57, 0.43], part: '余弦定理のしくみ', say: 'A を原点、AB を $x$ 軸の正の向きにおきます。B の座標は $(c,\\ 0)$。C の座標は、三角比の定義から決まります。',
        add: [{ t: 'h', text: '座標で $a^2$ を計算する' },
          { t: 'm', tex: '\\mathrm{B}(c,\\ 0)', note: 'AB $=c$' },
          { t: 'fig', id: 'f2', col: 1, view: [-1.2, -1.2, 7.4, 5.0], w: 600, h: 433, items: [
            { k: 'axes', o: false },
            { k: 'poly', pts: [pA, pB, pC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: pA, a: pB, b: pC, rp: 38, c: 'y', label: 'A', lr: 16 },
            sl(pA, pC, pG, 'b', 'w'), sl(pB, pC, pG, 'a', 'p'),
            { k: 'pt', at: pA, name: 'A', dir: 'sw', r: 4 }, { k: 'pt', at: pB, name: 'B(c, 0)', dir: 's', off: 30, r: 4 }, { k: 'pt', at: pC, name: 'C', dir: 'n', r: 4 }] }] },
      { ask: { type: 'choice', q: 'AC $=b$、$\\angle\\mathrm{A}=A$ のとき、C の座標は？',
        opts: ['$(b\\sin A,\\ b\\cos A)$', '$(c\\cos A,\\ c\\sin A)$', '$(b\\cos A,\\ b\\sin A)$', '$(\\cos A,\\ \\sin A)$'], ok: 2,
        why: { 0: '$x$ 座標が cos、$y$ 座標が sin です。逆になっています。', 1: 'AC の長さは $b$ です。$c$ は AB の長さ。', 3: '半径 1 なら $(\\cos A,\\ \\sin A)$。AC $=b$ なので $b$ 倍します。' },
        good: '半径 $b$ の円の上の点なので $(b\\cos A,\\ b\\sin A)$。A が鈍角でも同じです。',
        add: [{ t: 'm', tex: '\\mathrm{C}(b\\cos A,\\ b\\sin A)', note: '三角比の定義' }],
        draw: [{ fig: 'f2', items: [{ k: 'seg', a: pC, b: pH, c: 'b', dash: true }, { k: 'right', o: pH, a: pB, b: pC, s: 14, c: 'b' }] }] } },
      { say: 'BC $=a$ の2乗を、2点間の距離の公式で計算します。展開すると、$\\cos^2A$ と $\\sin^2A$ がそろいます。',
        add: [{ t: 'm', tex: 'a^2=(b\\cos A-c)^2+(b\\sin A)^2' },
          { t: 'm', tex: '\\hphantom{a^2}=b^2\\cos^2A-2bc\\cos A+c^2+b^2\\sin^2A' }] },
      { ask: { type: 'choice', q: 'この式を整理すると？',
        opts: ['$b^2+c^2+2bc\\cos A$', '$b^2+c^2-2bc\\cos A$', '$b^2+c^2-2bc$', '$b^2-c^2-2bc\\cos A$'], ok: 1,
        why: { 0: '$(b\\cos A-c)^2$ の真ん中の項は $-2bc\\cos A$。マイナスです。', 2: '$\\cos A$ は消えません。まとまるのは $b^2\\sin^2A+b^2\\cos^2A$ の部分です。', 3: '$(b\\cos A-c)^2$ を展開した $c^2$ はプラスです。' },
        good: '$b^2(\\sin^2A+\\cos^2A)=b^2$ なので、$a^2=b^2+c^2-2bc\\cos A$。',
        add: [{ t: 'm', tex: '\\hphantom{a^2}=b^2(\\sin^2A+\\cos^2A)+c^2-2bc\\cos A' }, { t: 'm', tex: '\\hphantom{a^2}=\\hy{b^2+c^2-2bc\\cos A}', note: '$\\sin^2A+\\cos^2A=1$' }] } },

      // ---------- 余弦定理 ----------
      { clear: true, cols: [0.58, 0.42], part: '余弦定理', say: 'これが **余弦定理** です。B や C を原点においても、同じ形の式ができます。角を求めるときは、$\\cos A$ について解いた形を使います。',
        add: [{ t: 'h', text: '余弦定理' },
          { t: 'box', c: 'y', label: '余弦定理', tex: '\\begin{aligned} a^2&=b^2+c^2-2bc\\cos A\\\\ b^2&=c^2+a^2-2ca\\cos B\\\\ c^2&=a^2+b^2-2ab\\cos C\\end{aligned}' },
          { t: 'box', c: 'b', label: '角を求める形', tex: '\\cos A=\\frac{b^2+c^2-a^2}{2bc}' },
          { t: 'fig', id: 'f1', col: 1, view: [-0.8, -1.0, 6.8, 4.4], w: 560, h: 398, items: [
            { k: 'poly', pts: [iA, iB, iC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: iA, a: iB, b: iC, rp: 40, c: 'y', label: 'A', lr: 18 },
            sl(iA, iB, iG, 'c'), sl(iA, iC, iG, 'b'), sl(iB, iC, iG, 'a', 'y')].concat(names(iA, iB, iC)) }] },
      { say: '$A=90^\\circ$ なら $\\cos90^\\circ=0$ で、$a^2=b^2+c^2$。**三平方の定理** です。余弦定理は、三平方の定理を直角でない三角形に広げたものです。',
        add: [{ t: 'm', tex: 'A=90^\\circ\\ \\text{なら}\\ \\ a^2=b^2+c^2', note: '三平方の定理' },
          { t: 'p', size: 'sm', col: 1, text: '$-2bc\\cos A$ は、三平方の定理からの **ずれ**' }] },

      // ---------- 例題1 ----------
      { clear: true, part: '例題1　辺を求める', say: '例題1。$b=3\\sqrt2,\\ c=7,\\ A=45^\\circ$ のとき、$a$ を求めます。2辺とその間の角なので、余弦定理を使います。',
        add: [{ t: 'h', text: '例題1　辺を求める' },
          { t: 'p', text: '△ABC で $b=3\\sqrt2,\\ c=7,\\ A=45^\\circ$ のとき、$a$ を求めよ。' },
          { t: 'm', tex: 'a^2=(3\\sqrt2)^2+7^2-2\\cdot3\\sqrt2\\cdot7\\cdot\\cos45^\\circ' },
          { t: 'fig', id: 'f3', col: 1, view: [-0.9, -1.0, 7.9, 3.9], w: 620, h: 345, items: [
            { k: 'poly', pts: [eA, eB, eC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: eA, a: eB, b: eC, rp: 46, c: 'y', label: '45°', lr: 24 },
            sl(eA, eB, eG, '7', 'y'), sl(eA, eC, eG, '3√2', 'y', 30), sl(eB, eC, eG, 'a', 'p')].concat(names(eA, eB, eC)) }] },
      { ask: { type: 'choice', q: '$a$ の値は？',
        opts: ['$\\sqrt{67}$', '$\\sqrt{109}$', '$\\sqrt{46}$', '$5$'], ok: 3,
        why: { 0: '$-2bc\\cos A$ の項を忘れています。それでは三平方の定理（$A=90^\\circ$）です。', 1: '$-2bc\\cos A$ の符号がプラスになっています。', 2: '2 のかけ忘れ。$2\\cdot3\\sqrt2\\cdot7\\cdot\\dfrac{\\sqrt2}{2}=42$ です。' },
        good: '$18+49-42=25$ なので $a=5$。$a>0$ なので正の方だけです。',
        add: [{ t: 'm', tex: '\\hphantom{a^2}=18+49-42=25' }, { t: 'ans', label: '答', tex: 'a=5' }],
        draw: [{ fig: 'f3', items: [Object.assign(sl(eB, eC, eG, '= 5', 'p'), { anchor: 'start', dx: 32, dy: -6 })] }] } },

      // ---------- 例題2 ----------
      { clear: true, part: '例題2　角を求める', say: '例題2。3辺 $a=13,\\ b=8,\\ c=15$ のとき、角 A を求めます。3辺がわかっているので、$\\cos A$ について解いた形を使います。',
        add: [{ t: 'h', text: '例題2　角を求める' },
          { t: 'p', text: '△ABC で $a=13,\\ b=8,\\ c=15$ のとき、$A$ を求めよ。' },
          { t: 'm', tex: '\\cos A=\\frac{8^2+15^2-13^2}{2\\cdot8\\cdot15}' },
          { t: 'fig', id: 'f4', col: 1, view: [-1.4, -1.6, 16.4, 8.4], w: 620, h: 348, items: [
            { k: 'poly', pts: [fA, fB, fC], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: fA, a: fB, b: fC, rp: 40, c: 'p' },
            sl(fA, fB, fG, '15'), sl(fA, fC, fG, '8'), sl(fB, fC, fG, '13', 'y')].concat(names(fA, fB, fC)) }] },
      { ask: { type: 'choice', q: '$\\cos A$ の値は？',
        opts: ['$\\dfrac12$', '$-\\dfrac12$', '$1$', '$\\dfrac{1}{26}$'], ok: 0,
        why: { 1: '分子は $b^2+c^2-a^2$。向かいの辺 $a^2$ を **ひく** 形です。', 2: '分母の 2 を忘れています。$2bc=240$ です。', 3: 'それは $\\dfrac{a^2+b^2-c^2}{2ab}$、つまり $\\cos C$ です。A の向かいの $a$ を引きます。' },
        good: '$\\cos A=\\dfrac{64+225-169}{240}=\\dfrac{120}{240}=\\dfrac12$ なので $A=60^\\circ$。',
        add: [{ t: 'm', tex: '\\hphantom{\\cos A}=\\frac{120}{240}=\\frac12' }, { t: 'ans', label: '答', tex: 'A=60^\\circ' }],
        draw: [{ fig: 'f4', items: [{ k: 'angle', o: fA, a: fB, b: fC, rp: 40, c: 'p', label: '60°', lr: 22 }] }] } },

      // ---------- 鈍角 ----------
      { clear: true, part: '鈍角になるとき', say: '3辺 $7,\\ 8,\\ 13$ の三角形で、いちばん大きい角を求めます。いちばん大きい角は、**いちばん長い辺の向かい** にあります。',
        add: [{ t: 'h', text: 'cos が負になるとき' },
          { t: 'p', text: '3辺の長さが $7,\\ 8,\\ 13$ の三角形で、いちばん大きい角は？' },
          { t: 'fig', id: 'f5', col: 1, view: [-4.6, -1.3, 9.2, 7.2], w: 560, h: 345, items: [
            { k: 'poly', pts: [V, W, U], close: true, fill: 'w', alpha: 0.05 },
            { k: 'angle', o: V, a: W, b: U, rp: 30, c: 'p' },
            sl(V, W, uG, '8'), sl(V, U, uG, '7'), sl(W, U, uG, '13', 'y')] }] },
      { ask: { type: 'choice', q: '3辺が $7,\\ 8,\\ 13$ の三角形の、いちばん大きい角は？',
        opts: ['$60^\\circ$', '$150^\\circ$', '$120^\\circ$', '$30^\\circ$'], ok: 2,
        why: { 0: '分子は $7^2+8^2-13^2=-56$。負なので cos も負、鈍角です。', 1: '$\\cos150^\\circ=-\\dfrac{\\sqrt3}{2}$。cos が $-\\dfrac12$ になるのは $120^\\circ$。', 3: 'いちばん長い辺 13 の向かいの角を求めます。小さい角ではありません。' },
        good: '$\\cos\\theta=\\dfrac{49+64-169}{2\\cdot7\\cdot8}=-\\dfrac12$ なので $120^\\circ$。cos が負なら鈍角です。',
        add: [{ t: 'm', tex: '\\cos\\theta=\\frac{7^2+8^2-13^2}{2\\cdot7\\cdot8}=\\frac{-56}{112}=-\\frac12' }, { t: 'ans', label: '答', tex: '120^\\circ' }],
        draw: [{ fig: 'f5', items: [{ k: 'angle', o: V, a: W, b: U, rp: 30, c: 'p', label: '120°', lr: 26 }] }] } },
      { ask: { type: 'think', q: '△ABC で $b=5,\\ c=16,\\ A=120^\\circ$ のとき、$a$ を求めよう。',
        hint: '$\\cos120^\\circ=-\\dfrac12$。$-2bc\\cos A$ は **プラス** になる。',
        ans: '$a^2=25+256-2\\cdot5\\cdot16\\cdot\\left(-\\dfrac12\\right)=361$ より　$a=19$',
        after: '$A$ が鈍角だと $a^2>b^2+c^2$。鈍角の向かいの辺は、三平方の定理より長くなります。',
        add: [{ t: 'm', size: 'sm', tex: 'a^2=25+256+80=361,\\qquad a=\\ans{19}' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、正弦定理と余弦定理の **使い分け** と、三角形が鋭角か鈍角かの判定です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
