/* 2024 阪大 理系 第3問の類題（自作）：平面に下ろした垂線の足がただ1つあることの証明（誘導なし）
   問題：一直線上にない3点 A,B,C と、平面 ABC 上にない点 D。平面 ABC 上の点 H で DH⊥平面 ABC となるものがただ1つ存在すること、
         平面 ABC 上の H 以外の点 X について DX>DH を示せ。
   答案の骨組み（python3・sympy で連立方程式の解と具体例を検算ずみ）：
   b=AB、c=AC、d=AD、AH=sb+tc。DH⊥b、DH⊥c ⇔ s|b|²+t(b・c)=b・d、s(b・c)+t|c|²=c・d
   Δ=|b|²|c|²−(b・c)²=|b|²|c|²sin²∠BAC>0 → s=(|c|²(b・d)−(b・c)(c・d))/Δ、t=(|b|²(c・d)−(b・c)(b・d))/Δ がただ1組
   DX²=DH²+HX²（DH・HX=0）>DH²
   具体例：A(0,0,0)、B(1,0,1)、C(0,1,1)、D(1,2,4) → 2s+t=5、s+2t=6、s=4/3、t=7/3、H(4/3,7/3,11/3)、DH=√3/3
   （平面 −x−y+z=0 との距離 |−1−2+4|/√3 と一致） */
(function () {
  const pj = (x, y, z) => [y - 0.5 * x, z - 0.35 * x];
  const P3 = { A: [1.2, 0.4, 0], B: [1.6, 2.4, 0], C: [-0.2, 1.6, 0], H: [0.6, 1.3, 0], D: [0.6, 1.3, 2.2], X: [1.6, 3.0, 0] };
  const J = k => pj(...P3[k]);
  const plane = [[2.3, -0.4, 0], [2.3, 3.4, 0], [-1.0, 3.4, 0], [-1.0, -0.4, 0]].map(p => pj(...p));
  const sp = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-1.75, -1.05, 4.0, 2.45], w: w || 620, h: Math.round((w || 620) * 3.5 / 5.75), items: [
    { k: 'poly', pts: plane, close: true, c: 'd', wd: 2, fill: 'w', alpha: 0.06 },
    { k: 'label', at: plane[0], text: '平面 ABC', c: 'd', size: 18, dx: 70, dy: -10 },
    { k: 'pt', at: J('A'), name: 'A', dir: 'w', size: 22 }, { k: 'pt', at: J('B'), name: 'B', dir: 's', size: 22 }, { k: 'pt', at: J('C'), name: 'C', dir: 'ne', size: 22 },
    { k: 'pt', at: J('D'), name: 'D', dir: 'n', c: 'y', size: 22 }
  ].concat(extra || []) });
  const BC = [{ k: 'vec', a: J('A'), b: J('B'), c: 'b', wd: 3 }, { k: 'vec', a: J('A'), b: J('C'), c: 'g', wd: 3 },
    { k: 'label', at: [(J('A')[0] + J('B')[0]) / 2, (J('A')[1] + J('B')[1]) / 2], text: 'b', c: 'b', size: 22, dy: 20 },
    { k: 'label', at: [(J('A')[0] + J('C')[0]) / 2, (J('A')[1] + J('C')[1]) / 2], text: 'c', c: 'g', size: 22, dx: -6, dy: -14 }];
  const DH = [{ k: 'seg', a: J('D'), b: J('H'), c: 'p', wd: 3 }, { k: 'pt', at: J('H'), name: 'H', dir: 'se', c: 'p', size: 22 },
    { k: 'right', o: J('H'), a: J('D'), b: J('A'), s: 18, c: 'p' }];
  const POINTS = [
    '「直線 ⊥ 平面」は、平面上の **平行でない2つのベクトル** の両方と垂直、で示す。平面上の点は $\\overrightarrow{\\mathrm{AH}}=s\\vec b+t\\vec c$',
    '垂直の条件2つは $s,\\ t$ の連立1次方程式。係数の式 $|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2$ が **0 でない** ことを言えば「ただ1組」',
    '$|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2=|\\vec b|^2|\\vec c|^2\\sin^2\\theta=(2\\triangle\\mathrm{ABC})^2$。「一直線上にない」がここで効く'
  ];

  HB.lesson({
    id: 'osaka24-3', field: '阪大型　数学（理系）', title: '2024 阪大 理系 第3問の類題 ― 平面に下ろした垂線の足がただ1つあることの証明', level: '2024年度 大阪大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '空間に、一直線上にない3点 A，B，C と、平面 ABC 上にない点 D がある。平面 ABC 上の点 H で、直線 DH が平面 ABC と垂直になるものが、ただ1つ存在することを示せ。さらに、平面 ABC 上の H と異なる任意の点 X に対して、$\\mathrm{DX}>\\mathrm{DH}$ が成り立つことを示せ。',
      parts: [],
      src: '※ 2024年度 大阪大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '誘導のない証明問題です。「垂線の足」は図ではあたり前に見えますが、それが **ある** こと、**1つしかない** ことを、ベクトルで示します。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず図で状況をつかみます。D から平面 ABC にまっすぐ下ろした点が H。示すことは「H がある」「H は1つだけ」「DX > DH」の3つです。',
        add: [{ t: 'h', text: '読みかえ：示すことは3つ' },
          { t: 'p', size: 'sm', text: '① 条件をみたす H が **ある**（存在）\n② そのような H は **1つだけ**（一意）\n③ H 以外の X では　$\\mathrm{DX}>\\mathrm{DH}$' },
          sp('s1', DH)] },
      { ask: { type: 'choice', q: '「直線 DH が平面 ABC と垂直」を、ベクトルの式にするには？',
        opts: ['AB と垂直、だけで十分', 'AB，AC の両方と垂直', 'DA，DB の両方と垂直', 'DH が最短であること'], ok: 1,
        why: { 0: '1本だけと垂直な直線は、平面にななめに立つこともあります。', 2: 'DA，DB は平面 ABC の上のベクトルではありません。平面の上の2本と垂直かどうかを調べます。', 3: '最短であることは③で示すこと。順番が逆です。' },
        good: '平面上の **平行でない2つのベクトル** の両方と垂直なら、平面と垂直です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\quad \\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0' }] } },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: 'A を始点にして、$\\vec b=\\overrightarrow{\\mathrm{AB}}$、$\\vec c=\\overrightarrow{\\mathrm{AC}}$、$\\vec d=\\overrightarrow{\\mathrm{AD}}$ とおきます。A，B，C は一直線上にないので、$\\vec b$ と $\\vec c$ は $\\vec 0$ でなく、平行でもありません。',
        add: [{ t: 'h', text: '方針：A を始点に、文字は s, t の2つ' },
          { t: 'm', tex: '\\vec b=\\overrightarrow{\\mathrm{AB}},\\quad \\vec c=\\overrightarrow{\\mathrm{AC}},\\quad \\vec d=\\overrightarrow{\\mathrm{AD}}' },
          sp('s2', BC.concat(DH))] },
      { ask: { type: 'choice', q: '平面 ABC 上の点 H を表す式として正しいのは？',
        opts: ['$\\overrightarrow{\\mathrm{AH}}=k(\\vec b+\\vec c)$（$k$ は実数）', '$\\overrightarrow{\\mathrm{AH}}=s\\vec b+t\\vec c$（$s+t=1$）', '$\\overrightarrow{\\mathrm{AH}}=s\\vec b+t\\vec c$（$s\\ge0,\\ t\\ge0$）', '$\\overrightarrow{\\mathrm{AH}}=s\\vec b+t\\vec c$（$s,\\ t$ は実数）'], ok: 3,
        why: { 0: 'それは A を通る1本の直線の上の点だけです。', 1: '$s+t=1$ なら、H は直線 BC の上にしぼられます。', 2: 'それは平面の一部（角の内部）だけ。H が三角形の外にあることもあります。' },
        good: '$\\vec b,\\ \\vec c$ が平行でないので、平面上のどの点も $s\\vec b+t\\vec c$ の形でただ1通りに表せます。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AH}}=s\\vec b+t\\vec c\\quad(s,\\ t\\ \\text{は実数})' },
          { t: 'box', c: 'g', size: 'sm', label: '方針', text: '垂直の条件2つを $s,\\ t$ の連立方程式にする\n→ 解がただ1組あることを示せば、H がただ1つある' }] } },

      // ---------- 答案（前半） ----------
      { clear: true, part: '答案（前半）', say: '$\\overrightarrow{\\mathrm{DH}}=\\overrightarrow{\\mathrm{AH}}-\\overrightarrow{\\mathrm{AD}}=s\\vec b+t\\vec c-\\vec d$。これと $\\vec b$、$\\vec c$ の内積を 0 とおいて、整理します。',
        add: [{ t: 'h', text: '答案（前半）：H がただ1つあること' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}=s\\vec b+t\\vec c-\\vec d' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\vec b=0\\iff s|\\vec b|^2+t\\,(\\vec b\\cdot\\vec c)=\\vec b\\cdot\\vec d', note: '…(ア)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\vec c=0\\iff s\\,(\\vec b\\cdot\\vec c)+t|\\vec c|^2=\\vec c\\cdot\\vec d', note: '…(イ)' }] },
      { ask: { type: 'choice', q: '(ア)$\\times|\\vec c|^2-$(イ)$\\times(\\vec b\\cdot\\vec c)$ で $t$ を消すと、$s$ の係数は？',
        opts: ['$|\\vec b|^2|\\vec c|^2+(\\vec b\\cdot\\vec c)^2$', '$|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2$', '$|\\vec b|^2-|\\vec c|^2$', '$|\\vec b||\\vec c|-\\vec b\\cdot\\vec c$'], ok: 1,
        why: { 0: '引き算なので、$(\\vec b\\cdot\\vec c)^2$ はマイナスです。', 2: '(ア) に $|\\vec c|^2$ をかけるので、$s$ の係数は $|\\vec b|^2|\\vec c|^2$ になります。', 3: '2乗が消えています。かけたのは $|\\vec c|^2$ と $\\vec b\\cdot\\vec c$ です。' },
        good: '$t$ の項は $(\\vec b\\cdot\\vec c)|\\vec c|^2-|\\vec c|^2(\\vec b\\cdot\\vec c)=0$ で消え、$s$ の係数に $\\Delta$ が出ます。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\Delta=|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2' },
          { t: 'm', col: 1, size: 'sm', tex: '\\Delta\\,s=|\\vec c|^2(\\vec b\\cdot\\vec d)-(\\vec b\\cdot\\vec c)(\\vec c\\cdot\\vec d)' },
          { t: 'm', col: 1, size: 'sm', tex: '\\Delta\\,t=|\\vec b|^2(\\vec c\\cdot\\vec d)-(\\vec b\\cdot\\vec c)(\\vec b\\cdot\\vec d)' }] } },
      { ask: { type: 'choice', q: '$\\Delta\\neq0$ を言うための根拠として、正しいのは？',
        opts: ['D が平面 ABC 上にない', '$|\\vec b|=|\\vec c|$', '$\\vec b,\\ \\vec c$ が平行でない', '$\\vec b\\cdot\\vec c=0$'], ok: 2,
        why: { 0: '$\\Delta$ には $\\vec d$ が入っていません。D の位置とは関係ありません。', 1: '$|\\vec b|=|\\vec c|$ とは限りません。', 3: '$\\vec b\\perp\\vec c$ とは限りません。' },
        good: '$\\theta=\\angle\\mathrm{BAC}$ とすると $\\Delta=|\\vec b|^2|\\vec c|^2(1-\\cos^2\\theta)$ です。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\Delta=|\\vec b|^2|\\vec c|^2\\sin^2\\theta>0', note: '$0<\\theta<\\pi$\n（一直線上にない）' }] } },
      { say: '$\\Delta\\neq0$ なので、$s,\\ t$ はただ1組に決まり、逆にその $s,\\ t$ は (ア)(イ) をみたします（代入すれば確かめられます）。だから H はただ1つ。',
        add: [{ t: 'ans', label: '前半', text: '$\\Delta>0$ より、(ア)(イ) をみたす $(s,\\ t)$ はただ1組。\nよって、直線 DH が平面 ABC に垂直な\nH はただ1つ存在する。（D は平面上に\nないので $\\mathrm{H}\\neq\\mathrm{D}$）' }] },

      // ---------- 答案（後半） ----------
      { clear: true, part: '答案（後半）', say: '後半です。X を平面 ABC 上の、H と異なる点とします。$\\overrightarrow{\\mathrm{HX}}$ も平面上のベクトルなので、$\\vec b$ と $\\vec c$ で表せます。',
        add: [{ t: 'h', text: '答案（後半）：DX > DH' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AX}}=x\\vec b+y\\vec c\\ \\ \\text{とおくと}\\ \\ \\overrightarrow{\\mathrm{HX}}=(x-s)\\vec b+(y-t)\\vec c' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{HX}}=(x-s)\\,\\overrightarrow{\\mathrm{DH}}\\cdot\\vec b+(y-t)\\,\\overrightarrow{\\mathrm{DH}}\\cdot\\vec c=0' },
          sp('s3', DH.concat([{ k: 'seg', a: J('D'), b: J('X'), c: 'y', wd: 3, dash: true }, { k: 'seg', a: J('H'), b: J('X'), c: 'b', wd: 3 }, { k: 'pt', at: J('X'), name: 'X', dir: 'e', c: 'b', size: 22 }]))] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{DX}}=\\overrightarrow{\\mathrm{DH}}+\\overrightarrow{\\mathrm{HX}}$ と $\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{HX}}=0$ から言えるのは？',
        opts: ['$\\mathrm{DX}=\\mathrm{DH}+\\mathrm{HX}$', '$\\mathrm{DX}^2=\\mathrm{DH}^2-\\mathrm{HX}^2$', '$\\mathrm{DX}^2=\\mathrm{HX}^2-\\mathrm{DH}^2$', '$\\mathrm{DX}^2=\\mathrm{DH}^2+\\mathrm{HX}^2$'], ok: 3,
        why: { 0: '長さはそのまま足せません。等号になるのは同じ向きのときだけです。', 1: '$|\\vec p+\\vec q|^2=|\\vec p|^2+2\\vec p\\cdot\\vec q+|\\vec q|^2$。足し算です。', 2: '$|\\vec p+\\vec q|^2=|\\vec p|^2+2\\vec p\\cdot\\vec q+|\\vec q|^2$。足し算です。' },
        good: '内積の項 $2\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{HX}}$ が 0 なので、三平方の定理の形になります。',
        add: [{ t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{DX}}|^2=|\\overrightarrow{\\mathrm{DH}}|^2+2\\,\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{HX}}+|\\overrightarrow{\\mathrm{HX}}|^2=\\mathrm{DH}^2+\\mathrm{HX}^2' }] } },
      { say: 'X は H と異なるので $\\mathrm{HX}>0$。よって $\\mathrm{DX}^2>\\mathrm{DH}^2$、長さは正なので $\\mathrm{DX}>\\mathrm{DH}$。つまり DH は、D と平面上の点の距離の最小値です。',
        add: [{ t: 'ans', label: '後半', text: '$\\mathrm{X}\\neq\\mathrm{H}$ より $\\mathrm{HX}>0$ なので\n$\\mathrm{DX}^2=\\mathrm{DH}^2+\\mathrm{HX}^2>\\mathrm{DH}^2$　　よって　$\\mathrm{DX}>\\mathrm{DH}$' }] },

      // ---------- 具体例 ----------
      { clear: true, cols: [1], part: '具体例', say: '証明の手順が実際に動くか、具体例で確かめます。連立方程式 (ア)(イ) を作って解いてみましょう。',
        add: [{ t: 'h', text: '具体例で確かめる' },
          { t: 'p', size: 'sm', text: 'A$(0,\\,0,\\,0)$，B$(1,\\,0,\\,1)$，C$(0,\\,1,\\,1)$，D$(1,\\,2,\\,4)$ のとき\n$\\vec b=(1,\\,0,\\,1)$，$\\vec c=(0,\\,1,\\,1)$，$\\vec d=(1,\\,2,\\,4)$' },
          { t: 'm', size: 'sm', tex: '|\\vec b|^2=2,\\quad |\\vec c|^2=2,\\quad \\vec b\\cdot\\vec c=1,\\quad \\vec b\\cdot\\vec d=5,\\quad \\vec c\\cdot\\vec d=6', note: '$\\Delta=4-1=3$' }] },
      { ask: { type: 'think', q: '(ア)(イ) を解いて、H の座標と DH の長さを求めよう。',
        hint: '(ア)：$2s+t=5$、(イ)：$s+2t=6$。H は $s\\vec b+t\\vec c$。',
        ans: '$s=\\dfrac43,\\ t=\\dfrac73$、$\\mathrm{H}\\left(\\dfrac43,\\ \\dfrac73,\\ \\dfrac{11}{3}\\right)$、$\\overrightarrow{\\mathrm{DH}}=\\left(\\dfrac13,\\ \\dfrac13,\\ -\\dfrac13\\right)$、$\\mathrm{DH}=\\dfrac{\\sqrt3}{3}$',
        after: '$\\overrightarrow{\\mathrm{DH}}\\cdot\\vec b=\\frac13-\\frac13=0$、$\\overrightarrow{\\mathrm{DH}}\\cdot\\vec c=\\frac13-\\frac13=0$ で、たしかに垂直です。',
        add: [{ t: 'm', size: 'sm', tex: '2s+t=5,\\ \\ s+2t=6\\ \\Rightarrow\\ s=\\frac43,\\ t=\\frac73,\\quad \\mathrm{H}\\left(\\frac43,\\ \\frac73,\\ \\frac{11}{3}\\right),\\quad \\mathrm{DH}=\\frac{\\sqrt3}{3}' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '$\\Delta$ は、じつは三角形の面積とつながっています。$\\triangle\\mathrm{ABC}=\\frac12\\sqrt{|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2}$ なので、$\\Delta$ は「面積の2倍」の2乗です。',
        add: [{ t: 'h', text: '別の見方：Δ と三角形の面積' },
          { t: 'm', tex: '\\Delta=|\\vec b|^2|\\vec c|^2-(\\vec b\\cdot\\vec c)^2=(2\\triangle\\mathrm{ABC})^2' },
          { t: 'p', size: 'sm', text: '「A，B，C が一直線上にない」⇔「三角形がつぶれていない」⇔ $\\Delta>0$。\n問題文の条件が、ちょうど連立方程式の解がただ1組になる条件になっています。' }] },
      { ask: { type: 'think', q: '同じ方法で、平面 ABC 上にあって A，B，C から等距離にある点 O（外心）が、ただ1つあることを示そう。',
        hint: '$\\overrightarrow{\\mathrm{AO}}=s\\vec b+t\\vec c$ とおく。$\\mathrm{OA}=\\mathrm{OB}$ は $|\\overrightarrow{\\mathrm{AO}}-\\vec b|^2=|\\overrightarrow{\\mathrm{AO}}|^2$、つまり $\\overrightarrow{\\mathrm{AO}}\\cdot\\vec b=\\frac12|\\vec b|^2$。',
        ans: '$s|\\vec b|^2+t(\\vec b\\cdot\\vec c)=\\frac12|\\vec b|^2$、$s(\\vec b\\cdot\\vec c)+t|\\vec c|^2=\\frac12|\\vec c|^2$。左辺は (ア)(イ) と同じ形で、係数の式は $\\Delta>0$。よって $(s,\\ t)$ はただ1組。',
        after: '右辺がちがうだけで、左辺の係数は同じ。「ただ1つ存在」は、いつも $\\Delta\\neq0$ が決め手です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「ただ1つ存在」の証明は、文字2つの連立1次方程式にして、係数の式が 0 でないことを言う。この型は空間図形でくり返し出てきます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、誘導なしで答案を書けるか、ノートで試しましょう。' }
    ]
  });
})();
