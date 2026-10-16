/* 数学C 第2章 平面上の曲線と複素数平面 2次曲線 ③：双曲線
   例はすべて自作（定義の図 x²/4−y²/5=1・焦点 (±3, 0)・P(4, √15) で PF=4, PF′=8／
   x²/4−y²/12=1 → 焦点 (±4, 0)・漸近線 y=±√3x／x²/5−y²/4=−1 → 焦点 (0, ±3)／焦点 (±4, 0) の直角双曲線 → x²−y²=8）。
   値・誤答・図の座標は python3（sympy）で検算ずみ。双曲線の図は x=±a cosh t, y=b sinh t の2本に分けてかく。 */
(function () {
  const POINTS = [
    '**双曲線**：2つの定点 F, F′（**焦点**）からの **距離の差が一定**（$2a$）の点の軌跡',
    '$\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1$：焦点 $(\\pm\\sqrt{a^2+b^2},\\ 0)$、頂点 $(\\pm a,\\ 0)$、**漸近線** $y=\\pm\\dfrac bax$（右辺を $0$ にした式）。右辺が $-1$ なら焦点は $y$ 軸上',
    '$a=b$ のとき、漸近線 $y=\\pm x$ が直交する **直角双曲線**（$x^2-y^2=a^2$）'
  ];
  const S5 = Math.sqrt(5), S15 = Math.sqrt(15), P1 = [4, S15];
  const hyp = (a, b, c, t, extra) => [{ k: 'param', x: a + '*cosh(t)', y: b + '*sinh(t)', a: -t, b: t, c: c || 'y' }, { k: 'param', x: '-' + a + '*cosh(t)', y: b + '*sinh(t)', a: -t, b: t, c: c || 'y' }].map(o => Object.assign(o, extra || {}));
  const fig1 = (id, extra) => ({ t: 'fig', id, col: 1, view: [-5.6, -4.4, 5.6, 4.4], w: 620, h: 487, items: [{ k: 'axes', tx: [], ty: [] }].concat(hyp(2, 'sqrt(5)', 'y', 1.5), extra || []) });
  const Fs = (x, d) => [{ k: 'pt', at: [x, 0], name: 'F', dir: d || 's', c: 'p' }, { k: 'pt', at: [-x, 0], name: 'F ′', dir: d || 's', c: 'p' }];

  HB.lesson({
    id: 'mc2-07', field: '数学C　平面上の曲線と複素数平面', title: '双曲線', level: '2次曲線', time: '目安 8分',
    problem: { label: '例題', lead: 'この時間の例題',
      parts: ['(1)　双曲線 $\\dfrac{x^2}{4}-\\dfrac{y^2}{12}=1$ の焦点と漸近線を求めよ。',
        '(2)　双曲線 $\\dfrac{x^2}{5}-\\dfrac{y^2}{4}=-1$ の焦点を求めよ。',
        '(3)　2点 $(4,\\ 0)$、$(-4,\\ 0)$ を焦点とする直角双曲線の方程式を求めよ。'] },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: 'めあて', say: '前の時間の楕円は、2つの焦点からの距離の **和** が一定の曲線でした。この時間は、距離の **差** が一定の曲線、**双曲線** です。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '双曲線を「2つの焦点からの距離の差」で定義し、方程式 $\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1$ を使える\n焦点と **漸近線** を求められる' }] },

      // ---------- 定義 ----------
      { clear: true, part: '双曲線の定義', say: '2つの定点 F, F′ からの **距離の差が一定**（$0$ でない）である点 P の軌跡を **双曲線** といい、F, F′ を **焦点** といいます。曲線は2つの部分に分かれます。',
        add: [{ t: 'h', text: '双曲線の定義' },
          { t: 'box', c: 'b', label: '定義', text: '2つの定点 F, F′ からの\n**距離の差が一定** である点 P の軌跡\nF, F′ を **焦点** という' },
          { t: 'm', tex: '|\\mathrm{PF}-\\mathrm{PF\'}|=(\\text{一定})' },
          fig1('d1', Fs(3))] },
      { say: '図の双曲線では、点 P について PF $=4$、PF′ $=8$ で、差は $4$。左の部分の点では PF′ の方が短くなりますが、差の大きさはやはり $4$ です。',
        draw: [{ fig: 'd1', items: [
          { k: 'seg', a: P1, b: [3, 0], c: 'g', label: '4', dx: 16, dy: 2 }, { k: 'seg', a: P1, b: [-3, 0], c: 'b', label: '8', dx: -8, dy: -20 },
          { k: 'pt', at: P1, name: 'P', dir: 'e', c: 'w' },
          { k: 'label', at: [0, -3.7], text: '|PF−PF′|=4', c: 'y', size: 24, plain: true }] }] },

      // ---------- 方程式 ----------
      { clear: true, cols: [0.6, 0.4], part: '双曲線の方程式', say: '焦点を F$(c,\\ 0)$、F′$(-c,\\ 0)$、差を $2a$ とします。三角形の2辺の差は残りの辺より小さいので $2a<2c$、つまり $c>a>0$ です。',
        add: [{ t: 'h', text: '方程式を導く' },
          { t: 'p', size: 'sm', text: 'F$(c,\\ 0)$、F′$(-c,\\ 0)$、$|\\mathrm{PF}-\\mathrm{PF\'}|=2a$　（$c>a>0$）' },
          { t: 'm', tex: '\\sqrt{(x-c)^2+y^2}-\\sqrt{(x+c)^2+y^2}=\\pm2a' },
          { t: 'fig', id: 'd2', col: 1, view: [-5.6, -4.4, 5.6, 4.4], w: 560, h: 440, items: [{ k: 'axes', tx: [], ty: [] }].concat(hyp(2, 'sqrt(5)', 'y', 1.5), [
            { k: 'seg', a: P1, b: [3, 0], c: 'g' }, { k: 'seg', a: P1, b: [-3, 0], c: 'b' },
            { k: 'pt', at: [3, 0], name: 'F(c, 0)', dir: 's', c: 'p', size: 21 }, { k: 'pt', at: [-3, 0], name: 'F ′(−c, 0)', dir: 's', c: 'p', size: 21 },
            { k: 'pt', at: P1, name: 'P(x, y)', dir: 'w', c: 'w', size: 22 }]) }] },
      { say: '楕円のときと同じように、根号を1つ移して2乗する、を2回くり返します。今度は $c^2-a^2$ が正の数になります。',
        add: [{ t: 'm', tex: 'cx-a^2=\\pm a\\sqrt{(x-c)^2+y^2}', note: '1回目の2乗' },
          { t: 'm', tex: '(c^2-a^2)x^2-a^2y^2=a^2(c^2-a^2)', note: '2回目の2乗' }] },
      { say: '$b=\\sqrt{c^2-a^2}$ とおいて両辺を $a^2b^2$ で割ると、楕円の式の $+$ が $-$ になった形が出てきます。',
        add: [{ t: 'm', tex: 'b^2x^2-a^2y^2=a^2b^2', note: '$b^2=c^2-a^2$' },
          { t: 'm', tex: '\\ans{\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1}', note: '双曲線の方程式の\n標準形' }] },
      { ask: { type: 'choice', q: '双曲線 $\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1$ の焦点の $x$ 座標 $c$（$c>0$）は？',
        opts: ['$\\sqrt{a^2-b^2}$', '$\\sqrt{a^2+b^2}$', '$a+b$', '$\\sqrt{b^2-a^2}$'], ok: 1,
        why: { 0: 'それは楕円の焦点。双曲線では $b^2=c^2-a^2$ とおきました。', 2: '$c^2=a^2+b^2$ です。平方根は、たし算ごとには分けられません。', 3: '$b^2=c^2-a^2$ を $c^2$ について解くと $c^2=a^2+b^2$。' },
        good: '$b^2=c^2-a^2$ より $c^2=a^2+b^2$。焦点は $(\\pm\\sqrt{a^2+b^2},\\ 0)$ です。',
        add: [{ t: 'm', tex: 'c=\\sqrt{a^2+b^2}', note: '楕円と符号がちがう' }] } },

      // ---------- 漸近線 ----------
      { clear: true, part: '頂点と漸近線', say: '双曲線と $x$ 軸の交点 $(\\pm a,\\ 0)$ を **頂点** といいます。原点から遠ざかると、曲線は2本の直線に限りなく近づきます。この直線を **漸近線** といいます。',
        add: [{ t: 'box', c: 'y', label: '双曲線', text: '$\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1$\n焦点 $(\\sqrt{a^2+b^2},\\ 0)$, $(-\\sqrt{a^2+b^2},\\ 0)$\n頂点 $(a,\\ 0)$, $(-a,\\ 0)$\n漸近線 $y=\\dfrac bax$, $y=-\\dfrac bax$' },
          fig1('g1', [
            { k: 'poly', pts: [[2, S5], [-2, S5], [-2, -S5], [2, -S5]], close: true, c: 'd', dash: true },
            { k: 'line', m: S5 / 2, n: 0, c: 'b', dash: true, label: 'y=(b/a)x', lat: [3.0, 4.1], la: 'end' }, { k: 'line', m: -S5 / 2, n: 0, c: 'b', dash: true },
            { k: 'pt', at: [2, 0], name: 'a', dir: 'se', r: 4, size: 24 }, { k: 'pt', at: [-2, 0], name: '−a', dir: 'sw', r: 4, size: 24 },
            { k: 'label', at: [0, S5], text: 'b', size: 24, dx: -16, dy: -14 }, { k: 'label', at: [0, -S5], text: '−b', size: 24, dx: -20, dy: 14 }])] },
      { say: '漸近線は、頂点を通る縦の線と $y=\\pm b$ でできる長方形の **対角線**。おぼえ方は「右辺の $1$ を $0$ にした式」です。',
        add: [{ t: 'm', tex: '\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=0\\iff y=\\pm\\frac bax', note: '$|x|$ が大きいと\n右辺の $1$ は小さい' }] },

      // ---------- 例題 ----------
      { clear: true, part: '例題　焦点と漸近線', say: '例題です。双曲線 $\\dfrac{x^2}{4}-\\dfrac{y^2}{12}=1$ の焦点と漸近線を求めます。$a^2=4$、$b^2=12$ です。',
        add: [{ t: 'h', text: '例題　$\\dfrac{x^2}{4}-\\dfrac{y^2}{12}=1$' },
          { t: 'fig', id: 'e1', col: 1, view: [-6.2, -4.8, 6.2, 4.8], w: 620, h: 480, items: [{ k: 'axes', tx: [], ty: [] }].concat(hyp(2, '2*sqrt(3)', 'y', 1.3), [{ k: 'pt', at: [2, 0], name: '2', dir: 'se', r: 4, size: 22 }, { k: 'pt', at: [-2, 0], name: '−2', dir: 'sw', r: 4, size: 22 }]) }] },
      { ask: { type: 'choice', q: '双曲線 $\\dfrac{x^2}{4}-\\dfrac{y^2}{12}=1$ の **焦点** は？',
        opts: ['$(\\pm4,\\ 0)$', '$(\\pm2\\sqrt2,\\ 0)$', '$(\\pm16,\\ 0)$', '$(0,\\ \\pm4)$'], ok: 0,
        why: { 1: '$\\sqrt{12-4}$ は楕円の計算。双曲線は $a^2+b^2$ です。', 2: '$4+12=16$ の平方根をとって $4$。', 3: '右辺が $+1$ で $x^2$ の項が正なので、焦点は $x$ 軸上です。' },
        good: '$\\sqrt{4+12}=4$ なので、焦点は $(4,\\ 0)$ と $(-4,\\ 0)$。',
        add: [{ t: 'm', tex: '\\sqrt{4+12}=4', note: '焦点 $(\\pm4,\\ 0)$' }],
        draw: [{ fig: 'e1', items: Fs(4, 'n') }] } },
      { ask: { type: 'choice', q: 'この双曲線の **漸近線** は？',
        opts: ['$y=\\pm3x$', '$y=\\pm\\dfrac{\\sqrt3}{3}x$', '$y=\\pm\\sqrt3\\,x$', '$y=\\pm2\\sqrt3\\,x$'], ok: 2,
        why: { 0: '$\\dfrac{b^2}{a^2}=3$ のままです。$\\dfrac ba$ は平方根をとって $\\sqrt3$。', 1: '傾きは $\\dfrac ab$ ではなく $\\dfrac ba$ です。', 3: '$b=2\\sqrt3$ を $a=2$ で割るのを忘れています。' },
        good: '$\\dfrac{x^2}{4}-\\dfrac{y^2}{12}=0$ より $y^2=3x^2$、$y=\\pm\\sqrt3\\,x$。',
        add: [{ t: 'm', tex: '\\frac{x^2}{4}-\\frac{y^2}{12}=0\\ \\text{より}\\ y=\\pm\\sqrt3\\,x' },
          { t: 'ans', label: '答', text: '焦点 $(4,\\ 0),\\ (-4,\\ 0)$\n漸近線 $y=\\sqrt3\\,x,\\ y=-\\sqrt3\\,x$' }],
        draw: [{ fig: 'e1', items: [{ k: 'line', m: Math.sqrt(3), n: 0, c: 'b', dash: true, label: 'y=√3x', lat: [2.0, 4.0], la: 'end' }, { k: 'line', m: -Math.sqrt(3), n: 0, c: 'b', dash: true, label: 'y=−√3x', lat: [-2.0, 4.0], la: 'start' }] }] } },

      // ---------- 焦点が y 軸上 ----------
      { clear: true, cols: [0.56, 0.44], part: '焦点が y 軸上の双曲線', say: '右辺が $-1$ の双曲線は、$y$ 軸と交わり、上下に開きます。焦点は $y$ 軸上、漸近線は右辺が $1$ のときと同じです。',
        add: [{ t: 'box', c: 'b', label: '右辺が −1 の双曲線', text: '$\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=-1$\n焦点 $(0,\\ \\pm\\sqrt{a^2+b^2})$、頂点 $(0,\\ \\pm b)$\n漸近線 $y=\\pm\\dfrac bax$（右辺が $1$ のときと同じ）' },
          { t: 'h', text: '$\\dfrac{x^2}{5}-\\dfrac{y^2}{4}=-1$ の焦点' },
          { t: 'fig', id: 'e2', col: 1, view: [-5.0, -4.4, 5.0, 4.4], w: 560, h: 493, items: [{ k: 'axes', tx: [], ty: [[2, '2'], [-2, '−2']] },
            { k: 'param', x: 'sqrt(5)*sinh(t)', y: '2*cosh(t)', a: -1.6, b: 1.6, c: 'y' }, { k: 'param', x: 'sqrt(5)*sinh(t)', y: '-2*cosh(t)', a: -1.6, b: 1.6, c: 'y' },
            { k: 'line', m: 2 / S5, n: 0, c: 'b', dash: true }, { k: 'line', m: -2 / S5, n: 0, c: 'b', dash: true }] }] },
      { ask: { type: 'choice', q: '双曲線 $\\dfrac{x^2}{5}-\\dfrac{y^2}{4}=-1$ の **焦点** は？',
        opts: ['$(\\pm3,\\ 0)$', '$(0,\\ \\pm1)$', '$(\\pm1,\\ 0)$', '$(0,\\ \\pm3)$'], ok: 3,
        why: { 0: '右辺が $-1$ なので、曲線は $y$ 軸と交わります。焦点も $y$ 軸上です。', 1: '双曲線の焦点は $\\sqrt{a^2+b^2}$。$5-4$ ではなく $5+4$ です。', 2: '$5+4$ の平方根で $3$。さらに、焦点は $y$ 軸上です。' },
        good: '$\\sqrt{5+4}=3$。右辺が $-1$ なので焦点は $y$ 軸上、$(0,\\ 3)$ と $(0,\\ -3)$。',
        add: [{ t: 'm', tex: '\\sqrt{5+4}=3', note: '焦点 $(0,\\ \\pm3)$' }],
        draw: [{ fig: 'e2', items: [{ k: 'pt', at: [0, 3], name: 'F', dir: 'e', c: 'p' }, { k: 'pt', at: [0, -3], name: 'F ′', dir: 'e', c: 'p' },
          { k: 'param', x: 'sqrt(5)*cosh(t)', y: '2*sinh(t)', a: -1.6, b: 1.6, c: 'd', dash: true }, { k: 'param', x: '-sqrt(5)*cosh(t)', y: '2*sinh(t)', a: -1.6, b: 1.6, c: 'd', dash: true }] }] } },

      // ---------- 直角双曲線 ----------
      { clear: true, part: '直角双曲線', say: '$a=b$ のとき、漸近線は $y=x$ と $y=-x$ で、**直角に交わります**。このような双曲線を **直角双曲線** といいます。中学の反比例のグラフも、じつは直角双曲線です。',
        add: [{ t: 'h', text: '直角双曲線' },
          { t: 'box', c: 'g', label: '直角双曲線', text: '$x^2-y^2=a^2$（$a=b$ の双曲線）\n漸近線 $y=\\pm x$ が **直交** する\n焦点 $(\\pm\\sqrt2\\,a,\\ 0)$' },
          { t: 'fig', id: 'r1', col: 1, view: [-4.6, -3.6, 4.6, 3.6], w: 580, h: 454, items: [{ k: 'axes', tx: [], ty: [] }].concat(hyp(2, '2', 'y', 1.4), [{ k: 'pt', at: [2, 0], name: '2', dir: 'se', r: 4, size: 22 }, { k: 'pt', at: [-2, 0], name: '−2', dir: 'sw', r: 4, size: 22 },
            { k: 'line', m: 1, n: 0, c: 'b', dash: true, label: 'y=x', lat: [2.9, 3.35], la: 'end' }, { k: 'line', m: -1, n: 0, c: 'b', dash: true, label: 'y=−x', lat: [-2.9, 3.35], la: 'start' },
            { k: 'right', o: [0, 0], a: [1, 1], b: [-1, 1], s: 18, c: 'g' }, { k: 'label', at: [2.9, -1.2], text: 'x²−y²=4', c: 'y', size: 22, anchor: 'start' }]) }] },
      { ask: { type: 'think', q: '2点 $(4,\\ 0)$、$(-4,\\ 0)$ を焦点とする直角双曲線の方程式は？',
        hint: '直角双曲線なので $a=b$。焦点から $a^2+b^2=4^2$。',
        ans: '$a^2+a^2=16$ より $a^2=8$。$\\dfrac{x^2}{8}-\\dfrac{y^2}{8}=1$、つまり $x^2-y^2=8$',
        after: '「直角双曲線」という条件が $a=b$ を教えてくれます。漸近線は $y=\\pm x$ です。',
        add: [{ t: 'm', tex: 'a^2+a^2=4^2\\quad\\therefore\\ a^2=8', note: '$a=b$' }, { t: 'ans', label: '答', tex: 'x^2-y^2=8' }] } },

      // ---------- くらべ ----------
      { clear: true, cols: [1], part: '楕円と双曲線', say: '楕円と双曲線をくらべておきましょう。式は $+$ と $-$ のちがいだけですが、焦点の計算と漸近線がちがいます。',
        add: [{ t: 'h', text: '楕円と双曲線のくらべ' },
          { t: 'tbl', rows: [['', '楕円', '双曲線'], ['定義', '2つの焦点からの距離の **和** が一定（$2a$）', '2つの焦点からの距離の **差** が一定（$2a$）'],
            ['標準形', '$\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$', '$\\dfrac{x^2}{a^2}-\\dfrac{y^2}{b^2}=1$'],
            ['焦点', '$(\\pm\\sqrt{a^2-b^2},\\ 0)$（$a>b$ のとき）', '$(\\pm\\sqrt{a^2+b^2},\\ 0)$'], ['漸近線', 'なし', '$y=\\pm\\dfrac bax$']] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、2次曲線と直線の共有点・接線と、2次曲線の平行移動です。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
