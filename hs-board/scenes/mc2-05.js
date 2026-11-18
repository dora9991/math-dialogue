/* 数学C 第2章 平面上の曲線と複素数平面 2次曲線 ①：放物線
   例はすべて自作（定義の図 y²=4x・P(9/4, 3) で PF=PH=13/4／y²=6x → 焦点 (3/2, 0)・準線 x=−3/2／
   y=x²/12 → x²=12y・焦点 (0, 3)・準線 y=−3／x²=12y 上の P(4, 4/3) → PF=13/3／焦点 (0,−2)・準線 y=2 → x²=−8y）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。 */
(function () {
  const POINTS = [
    '**放物線**：定点 F（**焦点**）と、F を通らない定直線 ℓ（**準線**）からの距離が等しい点の軌跡。PF $=$ PH（H は P から ℓ への垂線の足）',
    '$y^2=4px$：焦点 $(p,\\ 0)$、準線 $x=-p$、頂点は原点、軸は $x$ 軸。$x^2=4py$：焦点 $(0,\\ p)$、準線 $y=-p$、軸は $y$ 軸',
    '放物線上の点と焦点の距離は、**準線までの距離** でかんたんに求まる（$y^2=4px$ なら $x+p$）'
  ];
  // 定義の図：y²=4x（p=1）、F(1,0)、ℓ：x=−1、P(9/4, 3)、H(−1, 3)
  const P1 = [9 / 4, 3], H1 = [-1, 3], F1 = [1, 0];
  const base = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.2, -3.6, 4.0, 3.8], w: 430, h: 513, items: [
    { k: 'axes', tx: [], ty: [] },
    { k: 'param', x: 't*t/4', y: 't', a: -3.75, b: 3.75, c: 'y' },
    { k: 'line', x: -1, dash: true, c: 'b' }].concat(extra || []) });

  HB.lesson({
    id: 'mc2-05', field: '数学C　平面上の曲線と複素数平面', title: '放物線', level: '2次曲線', time: '目安 7分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　焦点 $(p,\\ 0)$、準線 $x=-p$ の放物線の方程式を、距離の条件から導け。',
        '(2)　放物線 $y^2=6x$ の焦点と準線を求めよ。',
        '(3)　放物線 $y=\\dfrac{1}{12}x^2$ の焦点と準線を求めよ。また、この放物線上の点 $\\mathrm{P}\\left(4,\\ \\dfrac43\\right)$ と焦点の距離を求めよ。',
        '(4)　焦点 $(0,\\ -2)$、準線 $y=2$ の放物線の方程式を求めよ。'] },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: 'めあて', say: '前の時間までは複素数平面でした。ここからは **2次曲線**。数学Ⅰで $y=ax^2$ のグラフとして学んだ放物線を、**距離** で定義しなおします。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '放物線を **焦点** と **準線** で定義し、方程式 $y^2=4px$ を導ける\n方程式から焦点・準線を読みとれる' }] },

      // ---------- 定義 ----------
      { clear: true, part: '放物線の定義', say: '平面上に、定点 F と、F を通らない直線 ℓ があります。F までの距離と ℓ までの距離が **等しい** 点 P の軌跡を **放物線** といいます。',
        add: [{ t: 'h', text: '放物線の定義' },
          { t: 'box', c: 'b', label: '定義', text: '定点 F と、F を通らない直線 ℓ から\n**等しい距離** にある点 P の軌跡\nF を **焦点**、ℓ を **準線** という' },
          { t: 'm', tex: '\\mathrm{PF}=\\mathrm{PH}', note: 'H は P から ℓ に\n下ろした垂線の足' },
          base('d1', [{ k: 'pt', at: F1, name: 'F', dir: 's', c: 'p' }, { k: 'label', at: [-1, -3.0], text: 'ℓ', c: 'b', size: 28, dx: -18 }])] },
      { say: 'たとえば図の放物線では、点 $\\mathrm{P}\\left(\\frac94,\\ 3\\right)$ について PF も PH も $\\dfrac{13}{4}$。放物線上のどの点でも、この2つの長さが等しくなっています。',
        add: [{ t: 'p', size: 'sm', text: '図：焦点 F$(1,\\ 0)$、準線 $x=-1$\n$\\mathrm{PF}=\\sqrt{\\left(\\frac54\\right)^2+3^2}=\\frac{13}{4}$、$\\mathrm{PH}=\\frac94+1=\\frac{13}{4}$' }],
        draw: [{ fig: 'd1', items: [
          { k: 'seg', a: P1, b: F1, c: 'p' }, { k: 'seg', a: P1, b: H1, c: 'g' }, { k: 'right', o: H1, a: P1, b: [-1, 0], s: 14, c: 'g' },
          { k: 'pt', at: P1, name: 'P', dir: 'ne', c: 'w' }, { k: 'pt', at: H1, name: 'H', dir: 'nw', c: 'g', r: 5 }] }] },

      // ---------- 方程式 ----------
      { clear: true, part: '放物線の方程式', say: '焦点を F$(p,\\ 0)$、準線を $x=-p$（$p\\neq0$）として、条件 PF $=$ PH を式にします。P$(x,\\ y)$ とおくと、PF は2点間の距離の公式で表せます。',
        add: [{ t: 'h', text: '方程式を導く' },
          { t: 'p', size: 'sm', text: '焦点 F$(p,\\ 0)$、準線 ℓ：$x=-p$、放物線上の点 P$(x,\\ y)$' },
          { t: 'm', tex: '\\mathrm{PF}=\\sqrt{(x-p)^2+y^2}' },
          base('d2', [{ k: 'pt', at: F1, name: 'F(p, 0)', dir: 's', c: 'p', size: 22 }, { k: 'label', at: [-1, -3.3], text: 'x=−p', c: 'b', size: 22, dx: -34 },
            { k: 'seg', a: P1, b: F1, c: 'p' }, { k: 'seg', a: P1, b: H1, c: 'g' }, { k: 'right', o: H1, a: P1, b: [-1, 0], s: 14, c: 'g' },
            { k: 'pt', at: P1, name: 'P(x, y)', dir: 'e', c: 'w', size: 22, dx: -8, dy: 26 }, { k: 'pt', at: H1, name: 'H', dir: 'nw', c: 'g', r: 5 }])] },
      { ask: { type: 'choice', q: 'P$(x,\\ y)$ から準線 $x=-p$ までの距離 PH は？',
        opts: ['$|x-p|$', '$\\sqrt{(x+p)^2+y^2}$', '$|x+p|$', '$|y|$'], ok: 2,
        why: { 0: '準線は $x=-p$。$x$ 座標の差は $x-(-p)=x+p$ です。', 1: 'H は $(-p,\\ y)$ で、P と $y$ 座標が同じ。距離は $x$ 座標の差だけです。', 3: '$|y|$ は $x$ 軸までの距離。準線は縦の直線です。' },
        good: 'H$(-p,\\ y)$ なので、PH は $x$ 座標の差の絶対値 $|x+p|$。',
        add: [{ t: 'm', tex: '\\mathrm{PH}=|x+p|' }] } },
      { say: '$\\sqrt{(x-p)^2+y^2}=|x+p|$ の両辺を2乗して展開すると、$x^2$ と $p^2$ は消えて、とてもかんたんな式が残ります。',
        add: [{ t: 'm', tex: '\\begin{aligned}(x-p)^2+y^2&=(x+p)^2\\\\ x^2-2px+p^2+y^2&=x^2+2px+p^2\\\\ y^2&=\\ans{4px}\\end{aligned}' }] },

      // ---------- 標準形と例題 ----------
      { clear: true, part: '例題　y²＝6x', say: '$y^2=4px$ を放物線の方程式の **標準形** といいます。$p>0$ なら右に開き、$p<0$ なら左に開きます。例題で、焦点と準線を読みとりましょう。',
        add: [{ t: 'box', c: 'y', label: '放物線 y²＝4px', text: '焦点 $(p,\\ 0)$、準線 $x=-p$\n頂点は原点 O、軸は $x$ 軸\n$p>0$ なら右に、$p<0$ なら左に開く' },
          { t: 'h', text: '例題　放物線 $y^2=6x$ の焦点と準線' },
          { t: 'fig', id: 'e1', col: 1, view: [-2.6, -3.5, 3.4, 3.5], w: 400, h: 467, items: [
            { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[2, '2'], [-2, '−2']] },
            { k: 'param', x: 't*t/6', y: 't', a: -3.9, b: 3.9, c: 'y', label: 'y²=6x', lat: [1.0, 3.15], la: 'start' }] }] },
      { ask: { type: 'choice', q: '放物線 $y^2=6x$ の **焦点** は？',
        opts: ['$(6,\\ 0)$', '$\\left(\\dfrac32,\\ 0\\right)$', '$(3,\\ 0)$', '$\\left(0,\\ \\dfrac32\\right)$'], ok: 1,
        why: { 0: '$6$ は $4p$ です。$p$ そのものではありません。', 2: '$4p=6$ なので、$6$ を2ではなく4で割ります。', 3: '$y^2=4px$ の形は、焦点が $x$ 軸上にあります。' },
        good: '$4p=6$ より $p=\\dfrac32$。焦点は $\\left(\\dfrac32,\\ 0\\right)$、準線は $x=-\\dfrac32$。',
        add: [{ t: 'm', tex: '4p=6\\quad\\text{より}\\quad p=\\frac32' },
          { t: 'ans', label: '答', text: '焦点 $\\left(\\dfrac32,\\ 0\\right)$、準線 $x=-\\dfrac32$' }],
        draw: [{ fig: 'e1', items: [{ k: 'line', x: -1.5, dash: true, c: 'b' }, { k: 'pt', at: [1.5, 0], name: 'F', dir: 's', c: 'p' },
          { k: 'label', at: [-1.5, -3.2], text: 'x=−3/2', c: 'b', size: 21, dx: 6, anchor: 'start' }] }] } },
      { say: '$x$ を $-x$ にかえた $y^2=-6x$ は、$y$ 軸について折り返した形で、左に開きます（$p=-\\frac32$）。焦点は $\\left(-\\frac32,\\ 0\\right)$ です。',
        draw: [{ fig: 'e1', items: [{ k: 'param', x: '-t*t/6', y: 't', a: -3.5, b: 3.5, c: 'g', dash: true, label: 'y²=−6x', lat: [-2.5, 3.15], la: 'start' }] }] },

      // ---------- x²=4py ----------
      { clear: true, part: '軸が y 軸の放物線', say: '$x$ と $y$ の役わりを入れかえると、軸が $y$ 軸の放物線 $x^2=4py$ になります。数学Ⅰの $y=ax^2$ は、$x^2=\\frac1ay$ と見ればこの形です。',
        add: [{ t: 'box', c: 'y', label: '放物線 x²＝4py', text: '焦点 $(0,\\ p)$、準線 $y=-p$\n頂点は原点 O、軸は $y$ 軸' },
          { t: 'm', tex: 'y=ax^2\\iff x^2=\\frac1a\\,y', note: '$4p=\\dfrac1a$' },
          { t: 'fig', id: 'e2', col: 1, view: [-6.4, -4.2, 6.4, 6.0], w: 600, h: 478, items: [
            { k: 'axes', tx: [[-4, '−4']], ty: [] },
            { k: 'fn', f: 'x*x/12', a: -6.4, b: 6.4, c: 'y', label: 'y=x²/12', lat: [3.6, 4.5], la: 'start' }] }] },
      { ask: { type: 'choice', q: '放物線 $y=\\dfrac{1}{12}x^2$ の **焦点** は？',
        opts: ['$(0,\\ 12)$', '$\\left(0,\\ \\dfrac{1}{48}\\right)$', '$(3,\\ 0)$', '$(0,\\ 3)$'], ok: 3,
        why: { 0: '$x^2=12y$ で、$12$ は $4p$。$p$ は $3$ です。', 1: '$a=\\dfrac{1}{12}$ をさらに4で割っています。$x^2=\\dfrac1ay$ に直してから $4p=12$。', 2: '$x^2=4py$ の形は、焦点が $y$ 軸上にあります。' },
        good: '$x^2=12y$ と直すと $4p=12$、$p=3$。焦点は $(0,\\ 3)$、準線は $y=-3$。',
        add: [{ t: 'm', tex: 'x^2=12y,\\quad 4p=12\\quad\\therefore\\ p=3', note: '焦点 $(0,\\ 3)$\n準線 $y=-3$' }],
        draw: [{ fig: 'e2', items: [{ k: 'line', m: 0, n: -3, dash: true, c: 'b', label: 'y=−3', lat: [-6.2, -2.6], la: 'start' }, { k: 'pt', at: [0, 3], name: 'F(0, 3)', dir: 'nw', c: 'p', size: 22 }] }] } },
      { ask: { type: 'choice', q: 'この放物線上の点 $\\mathrm{P}\\left(4,\\ \\dfrac43\\right)$ と焦点 F の距離 PF は？（定義を使おう）',
        opts: ['$\\dfrac{13}{3}$', '$\\dfrac53$', '$4$', '$\\dfrac43$'], ok: 0,
        why: { 1: '$3-\\frac43$ は、P と F の $y$ 座標の差だけ。PF は斜めの長さです。', 2: '$4$ は P の $x$ 座標。$y$ 軸までの距離です。', 3: '$\\frac43$ は $x$ 軸までの距離。準線は $y=-3$ です。' },
        good: '定義より PF $=$ PH。準線 $y=-3$ までの距離は $\\frac43+3=\\frac{13}{3}$。',
        add: [{ t: 'm', tex: '\\mathrm{PF}=\\mathrm{PH}=\\frac43+3=\\ans{\\frac{13}{3}}', note: '準線までの距離' }],
        draw: [{ fig: 'e2', items: [{ k: 'seg', a: [4, 4 / 3], b: [0, 3], c: 'p' }, { k: 'seg', a: [4, 4 / 3], b: [4, -3], c: 'g' },
          { k: 'pt', at: [4, 4 / 3], name: 'P', dir: 'se', c: 'w' }, { k: 'pt', at: [4, -3], name: 'H', dir: 'se', c: 'g', r: 5 }] }] } },
      { ask: { type: 'think', q: '焦点 $(0,\\ -2)$、準線 $y=2$ の放物線の方程式を、PF $=$ PH から求めよう。',
        hint: 'P$(x,\\ y)$ として $\\sqrt{x^2+(y+2)^2}=|y-2|$。両辺を2乗。',
        ans: '$x^2+(y+2)^2=(y-2)^2$ より $x^2=-8y$（$y=-\\dfrac18x^2$）',
        after: '$x^2=4py$ で $p=-2$ の形。焦点が下にあるので、下に開く（上に凸の）放物線です。',
        add: [{ t: 'm', tex: 'x^2+(y+2)^2=(y-2)^2\\quad\\therefore\\ x^2=-8y', note: '$p=-2$' }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、焦点が2つある曲線、**楕円** です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
