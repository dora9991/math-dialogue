/* 数学C ベクトル：三角形の中の交点の位置ベクトル（熊大レベル・自作問題）
   答え（python3 で検算ずみ）：(1) OP=4/9 a + 1/3 b　(2) AQ:QB=3:4、OP:PQ=7:2　(3) |OP|=2√7/3 */
(function () {
  // 図は (3) の条件（|a|=3, |b|=2, ∠AOB=60°）どおりの形：O(0,0) A(3,0) B(1,√3)
  const r3 = Math.sqrt(3), O = [0, 0], A = [3, 0], B = [1, r3], C = [2, 0], D = [0.6, 0.6 * r3];
  const P = [4 / 9 * 3 + 1 / 3 * 1, 1 / 3 * r3], Q = [4 / 7 * 3 + 3 / 7 * 1, 3 / 7 * r3];
  const VIEW = [-0.45, -0.5, 3.55, 2.1];
  const base = (ratio) => [
    { k: 'poly', pts: [O, A, B], close: true },
    { k: 'pt', at: O, name: 'O', dir: 'sw' }, { k: 'pt', at: A, name: 'A', dir: 'se' }, { k: 'pt', at: B, name: 'B', dir: 'n' }
  ].concat(ratio ? [
    { k: 'pt', at: C, name: 'C', dir: 's', c: 'b' }, { k: 'pt', at: D, name: 'D', dir: 'nw', c: 'b' },
    { k: 'label', at: [1, 0], text: '2', dy: 22, c: 'b', size: 22 }, { k: 'label', at: [2.5, 0], text: '1', dy: 22, c: 'b', size: 22 },
    { k: 'label', at: [0.15, 0.6], text: '3', c: 'b', size: 22 }, { k: 'label', at: [0.65, 1.47], text: '2', c: 'b', size: 22 }
  ] : []);
  const lines = [{ k: 'seg', a: A, b: D, c: 'y' }, { k: 'seg', a: B, b: C, c: 'g' }, { k: 'pt', at: P, name: 'P', dir: 's', off: 26, c: 'p' }];
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: Math.round((h || 390) * 4 / 2.6), h: h || 390, items });   // 縦横比は VIEW にそろえる
  const POINTS = [
    '交点は「2通りに表して係数を比べる」。答案には「$\\vec a,\\ \\vec b$ は1次独立」と書く',
    '直線 AB 上の点 ⇔ $x\\vec a+y\\vec b$ で $x+y=1$。$\\dfrac{n\\vec a+m\\vec b}{m+n}$ は AB を $m:n$ に内分する点',
    '大きさは2乗して内積で：$|4\\vec a+3\\vec b|^2=16|\\vec a|^2+24\\,\\vec a\\cdot\\vec b+9|\\vec b|^2$'
  ];

  HB.lesson({
    id: 'ku-vec-01', field: '数学C　ベクトル', title: '三角形の中の交点の位置ベクトル', level: '熊大レベル・標準', time: '目安 20分',
    problem: {
      lead: '$\\triangle\\mathrm{OAB}$ において、辺 OA を $2:1$ に内分する点を C、辺 OB を $3:2$ に内分する点を D とし、線分 AD と線分 BC の交点を P とする。また、$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b$ とする。',
      parts: [
        '(1)　$\\overrightarrow{\\mathrm{OP}}$ を $\\vec a,\\ \\vec b$ を用いて表せ。',
        '(2)　直線 OP と辺 AB の交点を Q とする。AQ : QB と OP : PQ を求めよ。',
        '(3)　$|\\vec a|=3,\\ |\\vec b|=2,\\ \\angle\\mathrm{AOB}=60^\\circ$ のとき、$|\\overrightarrow{\\mathrm{OP}}|$ を求めよ。'
      ],
      src: '※ 熊本大学の入試レベルを目安にした自作問題'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: 'ベクトルで「2本の線分の交点」を表す問題。熊大でもくり返し出ている、超定番の型です。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },
      { say: 'まず図をかきます。C は OA を $2:1$、D は OB を $3:2$ に内分。AD（黄）と BC（緑）の交点が P です。',
        add: [fig('v1', base(true).concat(lines))] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{OD}}$ を $\\vec b$ で表すと？',
        opts: ['$\\dfrac35\\vec b$', '$\\dfrac32\\vec b$', '$\\dfrac25\\vec b$', '$\\dfrac23\\vec b$'], ok: 0,
        why: { 1: '$3:2$ は比です。OB 全体を 5 とすると、OD はそのうちの 3。', 2: '逆です。OD : DB $=3:2$ なので、O から見て 3 の所。', 3: 'それは C（OA を $2:1$）の割合です。' },
        good: 'OB 全体を 5 とすると OD は 3。同じように $\\overrightarrow{\\mathrm{OC}}=\\dfrac23\\vec a$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OC}}=\\frac23\\vec a,\\qquad \\overrightarrow{\\mathrm{OD}}=\\frac35\\vec b' }] } },

      // ---------- (1) ----------
      { clear: true, cols: [0.58, 0.42], part: '(1)', say: '交点の位置ベクトルの基本方針です。P は AD 上にも BC 上にもあるので、**2通りに表して係数を比べます**。',
        add: [{ t: 'h', text: '(1)　OP を a, b で表す' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: 'P を「AD 上の点」と「BC 上の点」の2通りで表し、係数を比べる' },
          fig('v2', base(true).concat(lines), 320)] },
      { say: 'P は AD 上。AP : PD $=s:(1-s)$ とおくと、内分点の公式から $\\overrightarrow{\\mathrm{OP}}=(1-s)\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{OD}}$ です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=(1-s)\\vec a+\\frac35s\\,\\vec b', note: '…①　AD 上' }],
        hl: [], draw: [{ fig: 'v2', items: [{ k: 'label', at: [2.15, 0.42], text: 's', c: 'y', size: 22 }, { k: 'label', at: [1.1, 0.95], text: '1−s', c: 'y', size: 22 }] }] },
      { ask: { type: 'choice', q: 'P は BC 上。BP : PC $=t:(1-t)$ とおくと、$\\overrightarrow{\\mathrm{OP}}$ は？',
        opts: ['$\\dfrac23t\\,\\vec a+(1-t)\\vec b$', '$\\dfrac23(1-t)\\vec a+t\\,\\vec b$', '$t\\,\\vec a+\\dfrac23(1-t)\\vec b$', '$\\dfrac23t\\,\\vec a+t\\,\\vec b$'], ok: 0,
        why: { 1: 'BP : PC $=t:(1-t)$ なので、C の側に $t$ がかかります：$(1-t)\\overrightarrow{\\mathrm{OB}}+t\\overrightarrow{\\mathrm{OC}}$。', 2: '$\\overrightarrow{\\mathrm{OC}}=\\frac23\\vec a$。$\\frac23$ がかかるのは $\\vec a$ のほうです。', 3: '内分点の形 $(1-t)\\square+t\\square$ がくずれています。' },
        good: '$\\overrightarrow{\\mathrm{OP}}=(1-t)\\overrightarrow{\\mathrm{OB}}+t\\overrightarrow{\\mathrm{OC}}$ に $\\overrightarrow{\\mathrm{OC}}=\\frac23\\vec a$ を入れます。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac23t\\,\\vec a+(1-t)\\vec b', note: '…②　BC 上' }] } },
      { say: '$\\vec a$ と $\\vec b$ は、どちらも $\\vec 0$ でなく、平行でもない（**1次独立**）。だから ①、② の係数を比べてよいのです。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\begin{cases} 1-s=\\dfrac23t\\\\[6pt] \\dfrac35s=1-t\\end{cases}', note: '← ①②の係数を比べる。\n答案には「$\\vec a,\\ \\vec b$ は\n1次独立だから」と書く' }] },
      { ask: { type: 'think', q: 'この連立方程式を解いて、$s,\\ t$ を求めよう。',
        hint: '2つ目の式から $t=1-\\frac35s$。これを1つ目に代入する。',
        ans: '$s=\\dfrac59,\\quad t=\\dfrac23$',
        after: '$1-s=\\frac23\\left(1-\\frac35s\\right)$ より $\\frac13=\\frac35s$、よって $s=\\frac59$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: 's=\\frac59,\\qquad t=\\frac23' }] } },
      { say: '$s=\\frac59$ を①に入れます。$\\vec a$ の係数は $1-\\frac59=\\frac49$、$\\vec b$ の係数は $\\frac35\\cdot\\frac59=\\frac13$。(1) の答えです。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac49\\vec a+\\frac13\\vec b' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.58, 0.42], part: '(2)', say: 'Q は直線 OP 上にあるので、実数 $k$ を使って $\\overrightarrow{\\mathrm{OQ}}=k\\overrightarrow{\\mathrm{OP}}$ と表せます。',
        add: [{ t: 'h', text: '(2)　直線 OP と辺 AB の交点 Q' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OQ}}=k\\overrightarrow{\\mathrm{OP}}=\\frac49k\\,\\vec a+\\frac13k\\,\\vec b' },
          fig('v3', base(false).concat([{ k: 'seg', a: A, b: D, c: 'd' }, { k: 'seg', a: B, b: C, c: 'd' }, { k: 'seg', a: O, b: Q, c: 'p', dash: true }, { k: 'pt', at: P, name: 'P', dir: 's', off: 26, c: 'p' }, { k: 'pt', at: Q, name: 'Q', dir: 'ne', c: 'p' }]))] },
      { ask: { type: 'choice', q: 'Q は直線 AB 上にもある。このことから $k$ は？',
        opts: ['$\\dfrac97$', '$\\dfrac79$', '$\\dfrac94$', '$3$'], ok: 0,
        why: { 1: '逆数です。$\\frac49k+\\frac13k=\\frac79k=1$ を解くと $k=\\frac97$。', 2: '$\\vec a$ の係数だけを 1 にしています。条件は「係数の和 $=1$」。', 3: '$\\vec b$ の係数だけを 1 にしています。条件は「係数の和 $=1$」。' },
        good: '直線 AB 上の点は、$x\\vec a+y\\vec b$ と書いたとき $x+y=1$。',
        add: [{ t: 'm', tex: '\\frac49k+\\frac13k=1\\qquad\\therefore\\ k=\\frac97' }] } },
      { say: '$k=\\frac97$ を入れると $\\overrightarrow{\\mathrm{OQ}}=\\frac47\\vec a+\\frac37\\vec b$。分母をそろえると、AB を内分する点の形になります。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OQ}}=\\frac47\\vec a+\\frac37\\vec b=\\frac{4\\vec a+3\\vec b}{3+4}' }] },
      { ask: { type: 'choice', q: 'AQ : QB は？',
        opts: ['3 : 4', '4 : 3', '4 : 7', '3 : 7'], ok: 0,
        why: { 1: 'よくあるまちがい。$\\frac{n\\vec a+m\\vec b}{m+n}$ は AB を $m:n$ に内分します。係数は「反対側」の比です。', 2: '7 は全体です。AQ : QB は $3:4$。', 3: '7 は全体です。AQ : QB は $3:4$。' },
        good: '$\\vec a$ の係数が大きい（4）ほど、Q は A に近い。だから AQ : QB $=3:4$。',
        draw: [{ fig: 'v3', items: [{ k: 'label', at: [(A[0] + Q[0]) / 2, (A[1] + Q[1]) / 2], text: '3', dx: 18, dy: 6, c: 'y', size: 24 }, { k: 'label', at: [(B[0] + Q[0]) / 2, (B[1] + Q[1]) / 2], text: '4', dx: 18, dy: 6, c: 'y', size: 24 }] }] } },
      { say: 'また $\\overrightarrow{\\mathrm{OQ}}=\\frac97\\overrightarrow{\\mathrm{OP}}$ なので OP : OQ $=7:9$。つまり OP : PQ $=7:2$ です。',
        add: [{ t: 'ans', label: '(2) 答', text: 'AQ : QB $=3:4$，　OP : PQ $=7:2$' }] },
      { ask: { type: 'think', q: '別解：$\\triangle\\mathrm{OAD}$ と直線 BC に **メネラウスの定理** を使うと、AP : PD は？',
        hint: '$\\dfrac{\\mathrm{OC}}{\\mathrm{CA}}\\cdot\\dfrac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\dfrac{\\mathrm{DB}}{\\mathrm{BO}}=1$ に、OC : CA $=2:1$、DB : BO $=2:5$ を入れる。',
        ans: '$\\dfrac21\\cdot\\dfrac{\\mathrm{AP}}{\\mathrm{PD}}\\cdot\\dfrac25=1$ より　AP : PD $=5:4$',
        after: '(1) の $s=\\frac59$（AP : AD $=5:9$）と一致します。図形の定理で比を先に出す方法も有力です。' } },

      // ---------- (3) ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: 'ベクトルの大きさは、**2乗して内積で計算** するのが基本です。(1) の答えを $\\frac19$ でくくっておきます。',
        add: [{ t: 'h', text: '(3)　|OP| を求める' },
          { t: 'm', tex: '|\\overrightarrow{\\mathrm{OP}}|^2=\\left|\\frac{4\\vec a+3\\vec b}{9}\\right|^2=\\frac1{81}|4\\vec a+3\\vec b|^2' },
          fig('v4', base(false).concat([
            { k: 'arc', o: O, rp: 46, a1: 0, a2: 60, c: 'y', label: '60°', lr: 22 },
            { k: 'label', at: [1.5, 0], text: '3', dy: 22, c: 'y', size: 24 }, { k: 'label', at: [0.5, 0.866], text: '2', dx: -18, dy: -6, c: 'y', size: 24 },
            { k: 'vec', a: O, b: P, c: 'p' }, { k: 'pt', at: P, name: 'P', dir: 'e', c: 'p' }]))] },
      { ask: { type: 'choice', q: 'まず内積 $\\vec a\\cdot\\vec b$ は？（$|\\vec a|=3,\\ |\\vec b|=2,\\ \\angle\\mathrm{AOB}=60^\\circ$）',
        opts: ['$3$', '$6$', '$3\\sqrt3$', '$\\dfrac32$'], ok: 0,
        why: { 1: '$\\cos60^\\circ$ をかけ忘れています。', 2: '内積は $\\cos$ です。$\\sin60^\\circ$ を使っています。', 3: '$\\cos60^\\circ=\\frac12$ を2回かけています。' },
        good: '$\\vec a\\cdot\\vec b=|\\vec a||\\vec b|\\cos60^\\circ=3\\cdot2\\cdot\\dfrac12=3$。',
        add: [{ t: 'm', tex: '\\vec a\\cdot\\vec b=3\\cdot2\\cdot\\cos60^\\circ=3' }] } },
      { say: '展開します。真ん中の項は $2\\cdot4\\cdot3=24$ 倍の内積。$|\\vec a|^2=9,\\ |\\vec b|^2=4$ も入れて計算すると 252。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}|4\\vec a+3\\vec b|^2&=16|\\vec a|^2+24\\,\\vec a\\cdot\\vec b+9|\\vec b|^2\\\\ &=16\\cdot9+24\\cdot3+9\\cdot4=252\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{OP}}|$ は？',
        opts: ['$\\dfrac{2\\sqrt7}{3}$', '$\\dfrac{28}{9}$', '$\\dfrac{2\\sqrt7}{9}$', '$2\\sqrt7$'], ok: 0,
        why: { 1: 'それは $|\\overrightarrow{\\mathrm{OP}}|^2$。最後に $\\sqrt{\\phantom{a}}$ をとります。', 2: '$\\frac{6\\sqrt7}{9}$ の約分で、分母も 3 で割ります。', 3: '$\\frac1{81}$（$\\sqrt{\\ }$ をとると $\\frac19$）を忘れています。' },
        good: '$|\\overrightarrow{\\mathrm{OP}}|^2=\\dfrac{252}{81}=\\dfrac{28}{9}$ なので、$|\\overrightarrow{\\mathrm{OP}}|=\\dfrac{2\\sqrt7}{3}$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '|\\overrightarrow{\\mathrm{OP}}|=\\frac{\\sqrt{252}}{9}=\\frac{6\\sqrt7}{9}=\\frac{2\\sqrt7}{3}' }] } },
      { say: '図でも確かめ：$\\frac{2\\sqrt7}{3}\\approx1.76$。OA $=3$ の図で見ると、OP はその半分より少し長い。それらしい大きさです。' },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。交点の位置ベクトルは、この流れでほぼ必ず解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
