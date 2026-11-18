/* 2024年度 共通テスト 数学Ⅱ・B 第1問〔1〕の類題（自作）：対数の条件が表す図形と領域を、図の選択肢から選ぶ（センター型）
   元の問題文・数値・図は使っていない。答え（python3 で検算ずみ）：
   ア ①（y=2x の x>0 の部分）　イ ②（xy=8 の x>0 の部分）　ウ 2　エ 4　オ ⓪（y>x）　カ ③　キ 9
   y=x と xy=8 の交点は (2√2, 2√2)。格子点は x=1 で y=2〜8 の 7 個、x=2 で y=3, 4 の 2 個 */
(function () {
  const POINTS = [
    '対数はまず **真数条件**（$x>0,\\ y>0$）を書いてから外す。$\\log_a M+\\log_a N=\\log_a MN$、$1=\\log_2 2$ のように底をそろえる',
    '底が 1 より小さい対数は **減少関数**。$\\log_{\\frac12}y<\\log_{\\frac12}x\\iff y>x$（不等号の向きが逆になる）',
    '図の選択肢は「真数条件をみたさない部分があるもの」「境界の式がちがうもの」から先に消す。境界をふくむかどうかも見る'
  ];
  const NUM = ['⓪', '①', '②', '③'];
  // ---- 4つの小さな図（2×2）。小図 i の中の座標 p（範囲 L0〜L1 の正方形）を、図全体の座標に直す ----
  const PO = i => [(i % 2) * 11, i < 2 ? 11.6 : 0];
  const mk = (L0, L1) => {
    const sc = 10 / (L1 - L0), T = (i, p) => [PO(i)[0] + (p[0] - L0) * sc, PO(i)[1] + (p[1] - L0) * sc];
    const lo = L0 + 0.1 / sc, hi = L1 - 0.1 / sc;
    const curve = (i, g, a, b, o) => { const pts = []; for (let k = 0; k <= 90; k++) { const x = a + (b - a) * k / 90, y = g(x); if (y >= lo && y <= hi) pts.push(T(i, [x, y])); } return Object.assign({ k: 'poly', pts, c: 'y', wd: 3 }, o || {}); };
    const frame = (i, ticks) => {
      const e = L1 - 0.25 / sc, s = L0 + 0.3 / sc, out = [
        { k: 'poly', pts: [T(i, [L0, L0]), T(i, [L1, L0]), T(i, [L1, L1]), T(i, [L0, L1])], close: true, c: 'rgba(244,243,234,.22)', wd: 1.5 },
        { k: 'vec', a: T(i, [s, 0]), b: T(i, [e, 0]), c: 'd', wd: 2 }, { k: 'vec', a: T(i, [0, s]), b: T(i, [0, e]), c: 'd', wd: 2 },
        { k: 'label', at: T(i, [e, 0]), text: 'x', dx: -6, dy: 15, size: 17, c: 'd' }, { k: 'label', at: T(i, [0, e]), text: 'y', dx: 13, dy: 6, size: 17, c: 'd' },
        { k: 'label', at: T(i, [0, 0]), text: 'O', dx: -11, dy: 12, size: 15, c: 'd' },
        { k: 'label', at: T(i, [(L0 + L1) / 2, L1]), text: NUM[i], dy: -15, size: 25, c: 'w' }];
      (ticks || []).forEach(([ax, v]) => {
        const p = ax === 'x' ? [v, 0] : [0, v];
        out.push({ k: 'label', at: T(i, p), text: String(v), dx: ax === 'x' ? 0 : -11, dy: ax === 'x' ? 13 : 0, size: 14, c: 'd' });
      });
      return out;
    };
    return { T, curve, frame };
  };
  const tick = (T, i, ax, v) => { const p = ax === 'x' ? [v, 0] : [0, v], q = T(i, p); return { k: 'seg', a: [q[0] - (ax === 'y' ? 0.18 : 0), q[1] - (ax === 'x' ? 0.18 : 0)], b: [q[0] + (ax === 'y' ? 0.18 : 0), q[1] + (ax === 'x' ? 0.18 : 0)], c: 'd', wd: 2 }; };
  const panelFig = (id, items) => ({ t: 'fig', id, col: 1, view: [-0.3, -0.3, 21.3, 22.5], w: 523, h: 552, items });
  const mark = (i, c) => ({ k: 'poly', pts: [[PO(i)[0] - 0.25, PO(i)[1] - 0.25], [PO(i)[0] + 10.25, PO(i)[1] - 0.25], [PO(i)[0] + 10.25, PO(i)[1] + 10.2], [PO(i)[0] - 0.25, PO(i)[1] + 10.2]], close: true, c: c || 'p', wd: 4 });

  // 図 A：(1) の選択肢（範囲 −1.5〜8.5）
  const A = mk(-1.5, 8.5);
  const figA = () => {
    const it = [];
    [0, 1, 2, 3].forEach(i => { it.push(...A.frame(i, [['x', 2], ['y', 2], ['y', 4]])); it.push(tick(A.T, i, 'x', 2), tick(A.T, i, 'y', 2), tick(A.T, i, 'y', 4)); });
    it.push(A.curve(0, x => 2 * x, -0.7, 4.2));
    it.push(A.curve(1, x => 2 * x, 0, 4.2), { k: 'pt', at: A.T(1, [0, 0]), open: true, c: 'y', r: 5 });
    it.push(A.curve(2, x => x + 2, 0, 6.4), { k: 'pt', at: A.T(2, [0, 2]), open: true, c: 'y', r: 5 });
    it.push(A.curve(3, x => x / 2, 0, 8.3), { k: 'pt', at: A.T(3, [0, 0]), open: true, c: 'y', r: 5 });
    return panelFig('pA', it);
  };
  // 図 B：(2) の選択肢（範囲 −5.5〜9.5。x<0 の側も見えるように）
  const B = mk(-5.5, 9.5);
  const figB = () => {
    const it = [];
    [0, 1, 2, 3].forEach(i => { it.push(...B.frame(i, [['x', 2], ['x', 4], ['y', 2], ['y', 4]])); it.push(tick(B.T, i, 'x', 2), tick(B.T, i, 'x', 4), tick(B.T, i, 'y', 2), tick(B.T, i, 'y', 4)); });
    it.push(B.curve(0, x => 8 - x, 0, 8), { k: 'pt', at: B.T(0, [0, 8]), open: true, c: 'y', r: 5 }, { k: 'pt', at: B.T(0, [8, 0]), open: true, c: 'y', r: 5 });
    it.push(B.curve(1, x => 8 / x, 0.85, 9.4), B.curve(1, x => 8 / x, -5.4, -1.46));
    it.push(B.curve(2, x => 8 / x, 0.85, 9.4));
    it.push(B.curve(3, x => 3 / x, 0.32, 9.4));
    return panelFig('pB', it);
  };
  // 図 C：(4) の選択肢（範囲 −1.5〜8.5）。境界：xy=8 は実線（ふくむ）、y=x・x+y=8 は点線（ふくまない／ふくむ）
  const C = mk(-1.5, 8.5), r2 = 2 * Math.SQRT2, TOP = 8.4;
  const hyp = (i, a, b) => { const p = []; for (let k = 0; k <= 40; k++) { const x = a + (b - a) * k / 40; p.push(C.T(i, [x, 8 / x])); } return p; };
  const figC = () => {
    const it = [];
    [0, 1, 2, 3].forEach(i => it.push(...C.frame(i)));
    // ⓪ y<x かつ xy≦8
    it.push({ k: 'poly', pts: [C.T(0, [0, 0]), C.T(0, [r2, r2])].concat(hyp(0, r2, TOP), [C.T(0, [TOP, 0])]), close: true, fill: 'b', alpha: 0.35, noStroke: true });
    // ① y>x かつ xy≧8
    it.push({ k: 'poly', pts: [C.T(1, [r2, r2]), C.T(1, [TOP, TOP]), C.T(1, [8 / TOP, TOP])].concat(hyp(1, 8 / TOP, r2)), close: true, fill: 'b', alpha: 0.35, noStroke: true });
    // ② y>x かつ x+y≦8
    it.push({ k: 'poly', pts: [C.T(2, [0, 0]), C.T(2, [4, 4]), C.T(2, [0, 8])], close: true, fill: 'b', alpha: 0.35, noStroke: true });
    // ③ y>x かつ xy≦8（正解）
    it.push({ k: 'poly', pts: [C.T(3, [0, 0]), C.T(3, [0, TOP]), C.T(3, [8 / TOP, TOP])].concat(hyp(3, 8 / TOP, r2)), close: true, fill: 'b', alpha: 0.35, noStroke: true });
    [0, 1, 3].forEach(i => it.push(C.curve(i, x => 8 / x, 8 / TOP, TOP), C.curve(i, x => x, 0, TOP, { dash: true, c: 'w' })));
    it.push(C.curve(2, x => 8 - x, 0, 8), C.curve(2, x => x, 0, TOP, { dash: true, c: 'w' }));
    return panelFig('pC', it);
  };

  HB.lesson({
    id: 'ct24-2b-1-1', field: '共通テスト型　数学Ⅱ・B', title: '2024 共通テスト 数学Ⅱ・B 第1問〔1〕の類題 ― 対数の条件が表す図形と領域', level: '2024年度 第1問〔1〕の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '$x>0,\\ y>0$ とする。対数をふくむ条件をみたす点 $(x,\\ y)$ 全体が、座標平面上でどのような図形になるかを調べる。',
      parts: [
        '(1)　$\\log_2 y=\\log_2 x+1$ をみたす点 $(x,\\ y)$ 全体は $\\boxed{\\text{ア}}$ である。',
        '(2)　$\\log_2 x+\\log_2 y=3$ をみたす点 $(x,\\ y)$ 全体は $\\boxed{\\text{イ}}$ である。また、(1) と (2) の図形の共有点の座標は $(\\boxed{\\text{ウ}},\\ \\boxed{\\text{エ}})$ である。',
        '(3)　不等式 $\\log_{\\frac12}y<\\log_{\\frac12}x$ は $\\boxed{\\text{オ}}$ と同値である。',
        '(4)　連立不等式 $\\log_2 x+\\log_2 y\\leqq3,\\ \\ \\log_{\\frac12}y<\\log_{\\frac12}x$ の表す領域は $\\boxed{\\text{カ}}$ の色のついた部分である。この領域にある点のうち、$x$ 座標と $y$ 座標がともに整数である点は $\\boxed{\\text{キ}}$ 個ある。',
        'ア・イ・カ の解答群：黒板の図 ⓪〜③（実線の境界はふくみ、点線の境界・白い点はふくまない）\nオ の解答群：⓪ $y>x$　① $y<x$　② $y>\\dfrac1x$　③ $y<\\dfrac1x$'
      ],
      src: '※ 2024年度 共通テスト 数学Ⅱ・B 第1問〔1〕と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS, pointsTitle: 'この問題のポイント',
    cols: [0.5, 0.5],
    steps: [
      { cols: [1], part: '問題', say: '2024年度 共通テスト 数学Ⅱ・B 第1問〔1〕の類題です。対数の条件が表す図形を、図の選択肢から選ぶ問題。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },
      { clear: true, cols: [1], part: '解く前に', say: 'この大問は、対数の基本を2つ使うだけで速く解けます。**真数条件** と、**底が 1 より大きいか小さいか** です。ここで時間をかけずに、確実に。',
        add: [{ t: 'h', text: '解く前に：対数の2つの基本' },
          { t: 'box', c: 'b', label: '真数条件', text: '$\\log_a M$ の $M$（真数）は正。この問題では、はじめから $x>0,\\ y>0$ → **図は第1象限だけ** になるはず' },
          { t: 'box', c: 'y', label: '底と大小', text: '$a>1$ のとき　$\\log_a M<\\log_a N\\iff M<N$\n$0<a<1$ のとき　$\\log_a M<\\log_a N\\iff M>N$（向きが逆）' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。右辺の 1 を $\\log_2 2$ と書きかえると、右辺が1つの対数にまとまります。右は ア の解答群の図です。',
        add: [{ t: 'h', text: '(1)　log₂ y = log₂ x + 1' },
          { t: 'm', tex: '\\log_2 y=\\log_2 x+\\hy{\\log_2 2}=\\log_2 2x', note: '$1=\\log_2 2$' }, figA()] },
      { ask: { type: 'choice', q: 'この式から、$x$ と $y$ の関係は？',
        opts: ['$y=2x$', '$y=x+2$', '$y=x^2$', '$y=x+1$'], ok: 0,
        why: { 1: '$\\log_2 x+\\log_2 2$ は $\\log_2(x+2)$ ではなく $\\log_2 2x$。対数のたし算は、真数のかけ算です。', 2: '$\\log_2 x^2=2\\log_2 x$ です。ここは「$+1$」なので、2 倍ではありません。', 3: '1 を $\\log_2 2$ に直さず、真数に 1 を足しています。' },
        good: '$\\log_2 y=\\log_2 2x$。底がそろえば、真数どうしが等しくなります。',
        add: [{ t: 'm', tex: 'y=2x\\qquad(x>0)', note: '真数条件 $x>0$ を\nつけたまま' }] } },
      { ask: { type: 'choice', q: '$\\boxed{\\text{ア}}$ にあてはまる図は？',
        opts: ['⓪', '①', '②', '③'], ok: 1,
        why: { 0: '直線全体ではありません。真数条件 $x>0$ があるので、原点から左の部分はふくみません。', 2: '$y=x+2$ の図です。$\\log_2 x+1$ を $\\log_2(x+2)$ とした誤り。', 3: '$y=\\frac12x$ の図です。$\\log_2 y=\\log_2 x-1$ のときの形。' },
        good: '$y=2x$ の $x>0$ の部分。原点は白い点（ふくまない）です。',
        add: [{ t: 'ans', label: '(1) 答', text: 'ア　①' }],
        draw: [{ fig: 'pA', items: [mark(1)] }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。左辺の「対数の和」は「積の対数」にまとめます。$\\log_2 x+\\log_2 y=\\log_2 xy$。右は イ の解答群です。',
        add: [{ t: 'h', text: '(2)　log₂ x + log₂ y = 3' },
          { t: 'm', tex: '\\log_2 x+\\log_2 y=\\log_2 xy=3' }, figB()] },
      { ask: { type: 'choice', q: '$\\log_2 xy=3$ と同じ条件は？（$x>0,\\ y>0$）',
        opts: ['$x+y=8$', '$xy=3$', '$xy=9$', '$xy=8$'], ok: 3,
        why: { 0: '「和の対数」と「積の対数」の取りちがえ。$\\log_2 x+\\log_2 y$ は $\\log_2(x+y)$ ではありません。', 1: '$\\log_2 xy=3$ は $xy=2^3$。$2^3$ に直し忘れています。', 2: '$3^2$ ではなく $2^3$ です（底が 2、指数が 3）。' },
        good: '$\\log_2 xy=3\\iff xy=2^3=8$。',
        add: [{ t: 'm', tex: 'xy=8\\qquad(x>0,\\ y>0)', note: '$y=\\dfrac8x$ の\n$x>0$ の部分' }] } },
      { ask: { type: 'choice', q: '$\\boxed{\\text{イ}}$ にあてはまる図は？',
        opts: ['⓪', '①', '②', '③'], ok: 2,
        why: { 0: '$x+y=8$ の線分です。和の対数と積の対数を取りちがえた図。', 1: '左下の曲線（$x<0,\\ y<0$）は、真数条件をみたしません。', 3: '点 $(1,\\,3)$ を通る $xy=3$ の曲線。$2^3$ に直し忘れた図です。' },
        good: '$xy=8$ の $x>0$ の部分。目もりを見ると、点 $(2,\\,4)$ や $(4,\\,2)$ を通っています。',
        add: [{ t: 'ans', label: '(2) 答', text: 'イ　②' }],
        draw: [{ fig: 'pB', items: [mark(2)] }] } },
      { ask: { type: 'think', q: '(1) の $y=2x$ と (2) の $xy=8$ の共有点 $(\\boxed{\\text{ウ}},\\ \\boxed{\\text{エ}})$ を求めよう。',
        hint: '$y=2x$ を $xy=8$ に代入する。$x>0$ に注意。',
        ans: '$2x^2=8$ より $x^2=4$。$x>0$ だから $x=2$、$y=4$。　ウ $=2$、エ $=4$',
        after: '$x=-2$ も $x^2=4$ の解ですが、真数条件 $x>0$ で捨てます。最初の「わな」はここです。',
        add: [{ t: 'm', tex: '2x^2=8\\ \\Rightarrow\\ x=2\\ \\ (x>0),\\ \\ y=4' }],
        draw: [{ fig: 'pB', items: [{ k: 'pt', at: B.T(2, [2, 4]), c: 'p', r: 5 }] }] } },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) は底が $\\frac12$（1 より小さい）の対数です。$y=\\log_{\\frac12}x$ のグラフは右下がり。「真数が大きいほど、値は小さい」のです。',
        add: [{ t: 'h', text: '(3)　底が 1 より小さい対数' },
          { t: 'm', tex: '\\log_{\\frac12}y<\\log_{\\frac12}x' },
          { t: 'fig', id: 'lg', col: 1, view: [-0.6, -3.2, 6.6, 3.2], w: 560, h: 498, items: [
            { k: 'axes', tx: [1, 2, 4], ty: [-2, -1, 1, 2] },
            { k: 'fn', f: 'log(x)/log(2)', a: 0.1, b: 6.5, c: 'b', label: 'y=log₂x', lat: [3.7, 2.55] },
            { k: 'fn', f: 'log(x)/log(0.5)', a: 0.1, b: 6.5, c: 'y', label: 'y=log½x', lat: [3.7, -2.6] },
            { k: 'pt', at: [1, 0], c: 'w', r: 5 }] }] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{オ}}$ にあてはまるものは？',
        opts: ['⓪　$y>x$', '①　$y<x$', '②　$y>\\dfrac1x$', '③　$y<\\dfrac1x$'], ok: 0,
        why: { 1: '底が 1 より小さいとき、真数を比べると不等号の向きは逆。そのまま外すのは誤りです。', 2: '比べているのは $y$ と $x$ そのもの。逆数 $\\frac1x$ は出てきません。', 3: '比べているのは $y$ と $x$ そのもの。逆数 $\\frac1x$ は出てきません。' },
        good: '$y=\\log_{\\frac12}x$ は減少関数なので、$\\log_{\\frac12}y<\\log_{\\frac12}x\\iff y>x$。',
        add: [{ t: 'ans', label: '(3) 答', text: 'オ　⓪（$y>x$）' }] } },
      { say: '別の見方もできます。$\\log_{\\frac12}y=-\\log_2 y$ なので、両辺に $-1$ をかけると不等号が逆になって $\\log_2 y>\\log_2 x$。結論は同じです。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}-\\log_2 y&<-\\log_2 x\\\\ \\log_2 y&>\\log_2 x\\quad\\therefore\\ y>x\\end{aligned}', note: '底の変換\n$\\log_{\\frac12}M=\\dfrac{\\log_2 M}{\\log_2\\frac12}=-\\log_2 M$' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) は (2) と (3) を合わせます。$xy\\leqq8$ かつ $y>x$（$x>0,\\ y>0$）。境界のうち $xy=8$ はふくみ、$y=x$ はふくみません。',
        add: [{ t: 'h', text: '(4)　連立不等式の表す領域' },
          { t: 'm', tex: '\\log_2 xy\\leqq3\\iff xy\\leqq8' },
          { t: 'm', tex: '\\log_{\\frac12}y<\\log_{\\frac12}x\\iff y>x' }, figC()] },
      { say: '境界の交点も出しておきます。$y=x$ を $xy=8$ に入れると $x^2=8$、$x>0$ より $x=2\\sqrt2$。交点は $(2\\sqrt2,\\ 2\\sqrt2)$ です。',
        add: [{ t: 'm', tex: 'x^2=8\\ \\Rightarrow\\ (2\\sqrt2,\\ 2\\sqrt2)', note: '$y=x$ と $xy=8$ の\n交点' },
          { t: 'box', c: 'g', size: 'sm', label: 'コツ', text: '$xy\\leqq8$ は、曲線 $xy=8$ の **原点の側**。$(1,\\,1)$ を入れて $1\\leqq8$ で確かめられる' }] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{カ}}$ にあてはまる図は？',
        opts: ['⓪', '①', '②', '③'], ok: 3,
        why: { 0: '$y<x$ の側（直線 $y=x$ の下）です。(3) の不等号の向きが逆。', 1: '$xy\\geqq8$ の側（曲線の外側）です。$xy\\leqq8$ は原点の側。', 2: '境界が直線 $x+y=8$ です。(2) と同じ「和と積」の取りちがえ。' },
        good: '$y=x$ より上で、曲線 $xy=8$ より原点の側。$y$ 軸の上はふくみません。',
        add: [{ t: 'ans', label: '(4) 答', text: 'カ　③' }],
        draw: [{ fig: 'pC', items: [mark(3)] }] } },

      // ---------- (4) キ ----------
      { clear: true, cols: [0.54, 0.46], say: '最後の キ です。領域を大きくかきました。$x$ 座標、$y$ 座標がともに整数の点（格子点）を、$x=1,\\ 2,\\ \\cdots$ と縦に数えます。',
        add: [{ t: 'h', text: '(4)　つづき：格子点を数える' },
          { t: 'p', size: 'sm', text: '$x$ を決めると、$y$ は　$x<y\\leqq\\dfrac8x$' },
          { t: 'fig', id: 'lat', col: 1, view: [-0.8, -0.9, 5.6, 9.4], w: 330, h: 530, items: [
            { k: 'axes', tx: [1, 2, 3, 4, 5], ty: [2, 4, 6, 8] },
            { k: 'area', f: 'min(8/x,9.3)', g: 'x', a: 0.001, b: r2, c: 'b', alpha: 0.3 },
            { k: 'fn', f: '8/x', a: 0.86, b: 5.5, label: 'xy=8', lat: [3.4, 3.4] },
            { k: 'line', m: 1, n: 0, a: 0, b: 5.5, c: 'w', dash: true, label: 'y=x', lat: [4.6, 5.3] }] }] },
      { ask: { type: 'think', q: '$\\boxed{\\text{キ}}$：領域にある格子点は何個？',
        hint: '$x=1$ のとき $1<y\\leqq8$、$x=2$ のとき $2<y\\leqq4$。$x=3$ のときは？',
        ans: '$x=1$：$y=2,\\ \\cdots,\\ 8$ の 7 個。$x=2$：$y=3,\\ 4$ の 2 個。$x\\geqq3$：なし（$x>\\frac8x$ となる）。合計 9 個',
        after: '$(1,\\,8)$ と $(2,\\,4)$ は境界 $xy=8$ の上なので数えます。$y=x$ の上の点は数えません。',
        add: [{ t: 'm', tex: '7+2=\\ans{9}\\ \\text{個}' }],
        draw: [{ fig: 'lat', items: [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [1, 7], [1, 8], [2, 3], [2, 4]].map(p => ({ k: 'pt', at: p, c: 'p', r: 6 })) }] } },
      { say: '答えをまとめます。図の選択問題は、式を正しく直せば一瞬。ここで時間を節約して、後半の大問に回しましょう。',
        add: [{ t: 'tbl', rows: [['ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ'], ['①', '②', '2', '4', '⓪', '③', '9']] }] },

      // ---------- コツ ----------
      { clear: true, cols: [1], part: '共通テストのコツ', say: '共通テストのコツです。図の選択肢は、全部を細かく見比べず、「消せる理由」があるものから順に消していきます。',
        add: [{ t: 'h', text: '図を選ぶ問題の進め方' },
          { t: 'box', c: 'b', label: '1. 真数条件で消す', text: '$x<0$ や $y<0$ の部分がある図は、その時点で ×（(1) の ⓪、(2) の ①）' },
          { t: 'box', c: 'y', label: '2. 境界の式で消す', text: '目もり（2 や 4）を通るかを見る。$x+y=8$ と $xy=8$、$xy=3$ と $xy=8$ は、ここで区別できる' },
          { t: 'box', c: 'p', label: '3. どちら側かを1点で確かめる', text: '$(1,\\,2)$ のような点を不等式に入れて、色のついた側かを確認する（境界をふくむかどうかも）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。対数の条件は「真数条件 → 底をそろえて外す → 底と 1 の大小で向きを決める」の順で、図形の式に直します。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
