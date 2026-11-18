/* 2025 阪大 理系 第1問の類題（自作）：数学C 平面ベクトル ― 垂直の条件から内積を文字で表し、垂線の足の比を分数式で求め、線分上にある範囲を2次不等式で
   元の問題はうつしていない（「三角形で2つのベクトルが垂直という条件から内積を文字で表す」「点を比で表し、垂直の条件から比を文字の分数式で求める」
   「その点が決まった線分上にあるための文字の範囲を2次不等式で求める」というねらいと形式だけを合わせた自作問題。
   図形・条件・数値は自作：OA=1, OB=2、C は辺 AB を k:1 に内分、OB の中点 M で MC⊥OB、H は C から直線 OA への垂線の足）。
   答え（python3・sympy で検算ずみ）：
   (1) OC=(a+kb)/(k+1)、b·MC=0 ⇔ (a·b+4k)/(k+1)=2 ⇔ a·b=2−2k。三角形ができる ⇔ |a·b|<|a||b|=2 ⇔ 0<k<2
   (2) s=OC·OA/|OA|²=(1+k(2−2k))/(k+1)=(1+2k−2k²)/(k+1)
   (3) 0≦s≦1：s≧0 ⇔ 2k²−2k−1≦0 ⇔ (1−√3)/2≦k≦(1+√3)/2、s≦1 ⇔ 2k²−k≧0 ⇔ k≧1/2（k>0）→ 1/2≦k≦(1+√3)/2
       k=1/2 で CA⊥OA（H=A）、k=(1+√3)/2 で OC⊥OA（H=O）。例 k=1 で a·b=0、s=1/2。 */
(function () {
  const POINTS = [
    '「$\\overrightarrow{\\mathrm{MC}}\\perp\\overrightarrow{\\mathrm{OB}}$」は内積 $=0$。$\\overrightarrow{\\mathrm{OC}}$ を $\\vec a,\\ \\vec b$ で表して展開し、$\\vec a\\cdot\\vec b$ を文字で表す',
    '内積を文字で表したら、**三角形ができる条件** $-|\\vec a||\\vec b|<\\vec a\\cdot\\vec b<|\\vec a||\\vec b|$ で文字の範囲をおさえる',
    '垂線の足は $\\overrightarrow{\\mathrm{OH}}=s\\overrightarrow{\\mathrm{OA}}$ とおき、$\\overrightarrow{\\mathrm{CH}}\\cdot\\overrightarrow{\\mathrm{OA}}=0$ で $s$ を出す。線分上 ⇔ $0\\le s\\le1$ を、分母の符号を見てから2次不等式に'
  ];
  // 図：OA=1 を x 軸に、k の値ごとに B・C・M・H を計算
  const conf = kk => {
    const x = 2 - 2 * kk, c = x / 2, sn = Math.sqrt(1 - c * c), A = [1, 0], B = [2 * c, 2 * sn];
    const C = [(A[0] + kk * B[0]) / (kk + 1), (A[1] + kk * B[1]) / (kk + 1)], M = [B[0] / 2, B[1] / 2], H = [C[0], 0];
    return { A, B, C, M, H };
  };
  const tri = (id, kk, opt) => {
    const o = opt || {}, P = conf(kk), O = [0, 0];
    const items = [
      { k: 'poly', pts: [O, P.A, P.B], close: true, c: 'w' },
      { k: 'pt', at: O, name: 'O', dir: 'sw' }, { k: 'pt', at: P.A, name: 'A', dir: 'se' }, { k: 'pt', at: P.B, name: 'B', dir: 'n' },
      { k: 'seg', a: P.M, b: P.C, c: 'y', wd: 3 }, { k: 'right', o: P.M, a: P.C, b: P.B, c: 'y' },
      { k: 'pt', at: P.M, name: 'M', dir: 'w', c: 'y' }, { k: 'pt', at: P.C, name: 'C', dir: 'ne', c: 'p' },
      { k: 'label', at: [0.3, 0], text: '1', dy: 24, size: 22, c: 'd' }, { k: 'label', at: [P.B[0] / 4, P.B[1] / 4], text: '2', dx: -20, size: 22, c: 'd' }];
    if (o.H) items.push({ k: 'seg', a: P.C, b: P.H, c: 'g', dash: true, wd: 2 }, { k: 'right', o: P.H, a: P.C, b: P.A, c: 'g' }, { k: 'pt', at: P.H, name: 'H', dir: 's', c: 'g' });
    if (o.OC) items.push({ k: 'seg', a: [0, 0], b: P.C, c: 'p', wd: 2, dash: true });
    if (o.cap) items.push({ k: 'label', at: [-0.3, 2.15], text: o.cap, size: 20, anchor: 'start', c: 'd' });
    return { t: 'fig', id, col: 1, view: [-0.95, -0.4, 1.45, 2.3], w: o.w || 360, h: Math.round((o.w || 360) * 2.7 / 2.4), items: items.concat(o.extra || []) };
  };
  const sGraph = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.2, -1.2, 2.25, 1.45], w: 420, h: 400, items: [
    { k: 'axes', tx: [[0.5, '1/2'], [1, '1'], [2, '2']], ty: [[1, ''], [-1, '−1']], xl: 'k', yl: 's' }, { k: 'label', at: [1.5, 1], text: 's = 1', dy: -16, size: 18, c: 'd' },
    { k: 'line', m: 0, n: 1, c: 'd', dash: true, wd: 2 },
    { k: 'line', x: 2, c: 'd', dash: true, wd: 2 },
    { k: 'fn', f: '(1+2*x-2*x**2)/(x+1)', a: 0, b: 2, c: 'w', wd: 3 },
    { k: 'pt', at: [0, 1], open: true, c: 'w' }, { k: 'pt', at: [2, -1], open: true, c: 'w' }].concat(extra || []) });
  const K1 = (1 + Math.sqrt(3)) / 2;

  HB.lesson({
    id: 'osaka25-1', field: '阪大型　数学（理系）', title: '2025 阪大 理系 第1問の類題 ― 垂直の条件と垂線の足が辺上にある範囲', level: '2025年度 大阪大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$\\triangle\\mathrm{OAB}$ において $\\mathrm{OA}=1,\\ \\mathrm{OB}=2$ とし、$\\vec a=\\overrightarrow{\\mathrm{OA}},\\ \\vec b=\\overrightarrow{\\mathrm{OB}}$ とする。$k$ を正の実数とし、辺 AB を $k:1$ に内分する点を C、辺 OB の中点を M とする。$\\overrightarrow{\\mathrm{MC}}\\perp\\overrightarrow{\\mathrm{OB}}$ が成り立つとき、次の問いに答えよ。',
      parts: [
        '(1)　内積 $\\vec a\\cdot\\vec b$ を $k$ で表せ。また、$k$ のとりうる値の範囲を求めよ。',
        '(2)　点 C から直線 OA に垂線 CH を下ろす。$\\overrightarrow{\\mathrm{OH}}=s\\,\\vec a$ をみたす実数 $s$ を $k$ で表せ。',
        '(3)　点 H が線分 OA 上（両端をふくむ）にあるような $k$ の値の範囲を求めよ。'
      ],
      src: '※ 2025年度 大阪大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: '問題', cols: [1], say: '平面ベクトルの問題です。垂直の条件を内積で式にし、垂線の足の位置を文字で表して、その範囲を調べます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '右の図は $k=\\frac45$ の場合です。M は OB の中点で、MC（黄）が OB に垂直。つまり C は OB の垂直二等分線の上にあり、CO＝CB です。',
        add: [{ t: 'h', text: '読みかえ：条件を図で見る' },
          { t: 'p', size: 'sm', text: 'C は辺 AB を $k:1$ に内分\n$\\overrightarrow{\\mathrm{MC}}\\perp\\overrightarrow{\\mathrm{OB}}$ ⇔ C は OB の垂直二等分線上' },
          tri('t1', 0.8, { cap: '例：k = 4/5' })] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{OC}}$ を $\\vec a,\\ \\vec b$ で表すと？',
        opts: ['$\\dfrac{k\\vec a+\\vec b}{k+1}$', '$\\dfrac{\\vec a+k\\vec b}{k+1}$', '$\\dfrac{\\vec a+k\\vec b}{k}$', '$\\dfrac{\\vec a+\\vec b}{k+1}$'], ok: 1,
        why: { 0: 'AC : CB $=k:1$ なので、遠い B の側に $k$ がかかります。逆です。', 2: '分母は比の和 $k+1$ です。', 3: '内分点の公式では、それぞれに比の数がかかります。' },
        good: 'A と B を $k:1$ に内分するので $\\dfrac{1\\cdot\\vec a+k\\,\\vec b}{k+1}$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OC}}=\\frac{\\vec a+k\\vec b}{k+1},\\qquad \\overrightarrow{\\mathrm{OM}}=\\frac12\\vec b' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '$\\overrightarrow{\\mathrm{MC}}\\perp\\overrightarrow{\\mathrm{OB}}$ は $\\vec b\\cdot\\overrightarrow{\\mathrm{MC}}=0$。$\\overrightarrow{\\mathrm{MC}}=\\overrightarrow{\\mathrm{OC}}-\\frac12\\vec b$ なので、$\\vec b\\cdot\\overrightarrow{\\mathrm{OC}}=\\frac12|\\vec b|^2=2$ です。',
        add: [{ t: 'h', text: '(1)　垂直の条件を内積で' },
          { t: 'm', tex: '\\vec b\\cdot\\left(\\overrightarrow{\\mathrm{OC}}-\\tfrac12\\vec b\\right)=0\\iff\\vec b\\cdot\\overrightarrow{\\mathrm{OC}}=\\tfrac12|\\vec b|^2=2' },
          { t: 'm', tex: '\\frac{\\vec a\\cdot\\vec b+k|\\vec b|^2}{k+1}=2' },
          tri('t2', 0.8)] },
      { ask: { type: 'choice', q: '$|\\vec b|^2=4$ を入れて解くと、$\\vec a\\cdot\\vec b$ は？',
        opts: ['$2k-2$', '$2-4k$', '$2-2k$', '$1-k$'], ok: 2,
        why: { 0: '符号が逆です。$\\vec a\\cdot\\vec b=2(k+1)-4k$。', 1: '$2(k+1)$ の展開で、$2k$ を落としています。', 3: '$|\\vec b|^2=4$ です（$|\\vec b|=2$ ではなく2乗）。' },
        good: '$\\vec a\\cdot\\vec b+4k=2(k+1)$ より $\\vec a\\cdot\\vec b=2-2k$。',
        add: [{ t: 'm', tex: '\\vec a\\cdot\\vec b=2-2k' }] } },
      { ask: { type: 'choice', q: '$k$ のとりうる値の範囲を決めるのに使う条件は？',
        opts: ['$-|\\vec a||\\vec b|<\\vec a\\cdot\\vec b<|\\vec a||\\vec b|$', '$\\vec a\\cdot\\vec b>0$', '$\\vec a\\cdot\\vec b<|\\vec a|^2$', '$k<1$'], ok: 0,
        why: { 1: '$\\angle\\mathrm{AOB}$ が鈍角の三角形もあります。内積は負でもかまいません。', 2: 'この条件では三角形ができるかどうかは決まりません。', 3: '$k$ は正の実数なら何でもよいわけではありませんが、1 未満とは限りません。' },
        good: '三角形ができる ⇔ $0^\\circ<\\angle\\mathrm{AOB}<180^\\circ$ ⇔ $-1<\\cos\\angle\\mathrm{AOB}<1$。内積でいうと $|\\vec a\\cdot\\vec b|<|\\vec a||\\vec b|=2$。',
        add: [{ t: 'm', tex: '-2<2-2k<2\\iff0<k<2' },
          { t: 'ans', label: '(1) 答', tex: '\\vec a\\cdot\\vec b=2-2k,\\qquad 0<k<2' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: 'H は直線 OA 上なので $\\overrightarrow{\\mathrm{OH}}=s\\vec a$。条件は $\\overrightarrow{\\mathrm{CH}}\\perp\\vec a$、つまり $(s\\vec a-\\overrightarrow{\\mathrm{OC}})\\cdot\\vec a=0$ です。$|\\vec a|=1$ なので $s=\\overrightarrow{\\mathrm{OC}}\\cdot\\vec a$。',
        add: [{ t: 'h', text: '(2)　垂線の足 H の位置' },
          { t: 'm', tex: '(s\\vec a-\\overrightarrow{\\mathrm{OC}})\\cdot\\vec a=0\\iff s|\\vec a|^2=\\overrightarrow{\\mathrm{OC}}\\cdot\\vec a' },
          tri('t3', 0.8, { H: true })] },
      { ask: { type: 'choice', q: '$s=\\overrightarrow{\\mathrm{OC}}\\cdot\\vec a$ を $k$ で表すと？',
        opts: ['$\\dfrac{1+2k}{k+1}$', '$\\dfrac{1+2k-2k^2}{k}$', '$\\dfrac{2k^2-2k+1}{k+1}$', '$\\dfrac{1+2k-2k^2}{k+1}$'], ok: 3,
        why: { 0: '$k\\,\\vec a\\cdot\\vec b=k(2-2k)$ の $-2k^2$ を落としています。', 1: '分母は $\\overrightarrow{\\mathrm{OC}}$ の分母 $k+1$ のままです。', 2: '分子の符号がすべて逆です。$|\\vec a|^2=1$ は正。' },
        good: '$\\overrightarrow{\\mathrm{OC}}\\cdot\\vec a=\\dfrac{|\\vec a|^2+k\\,\\vec a\\cdot\\vec b}{k+1}=\\dfrac{1+k(2-2k)}{k+1}$。',
        add: [{ t: 'ans', label: '(2) 答', tex: 's=\\frac{1+2k-2k^2}{k+1}' }] } },
      { ask: { type: 'think', q: '$k=1$ のとき、$\\vec a\\cdot\\vec b$ と $s$ を求め、図形として確かめよう。',
        hint: '$\\vec a\\cdot\\vec b=0$ なら $\\angle\\mathrm{AOB}=90^\\circ$。C は AB の中点。',
        ans: '$\\vec a\\cdot\\vec b=0$、$s=\\dfrac{1+2-2}{2}=\\dfrac12$。直角三角形で C は AB の中点、H は OA の中点',
        after: '文字の式は、図がかんたんになる値で確かめましょう。' } },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: 'H が線分 OA 上 ⇔ $0\\le s\\le1$。分母 $k+1$ は正なので、両辺に $k+1$ をかけても不等号の向きは変わりません。まず $s\\ge0$ から。',
        add: [{ t: 'h', text: '(3)　0 ≦ s ≦ 1 を解く' },
          { t: 'm', tex: '0\\le\\frac{1+2k-2k^2}{k+1}\\le1\\quad(k+1>0)' }] },
      { ask: { type: 'choice', q: '$s\\ge0$ と同じ条件は？',
        opts: ['$2k^2-2k-1\\ge0$', '$2k^2-2k-1\\le0$', '$2k^2-2k+1\\le0$', '$k\\le1$'], ok: 1,
        why: { 0: '$1+2k-2k^2\\ge0$ の両辺に $-1$ をかけると、不等号の向きが変わります。', 2: '定数項の符号がちがいます。$-(1+2k-2k^2)=2k^2-2k-1$。', 3: '分子は2次式です。1次式にはなりません。' },
        good: '$1+2k-2k^2\\ge0$ ⇔ $2k^2-2k-1\\le0$。解の公式で $k=\\dfrac{1\\pm\\sqrt3}{2}$。',
        add: [{ t: 'm', tex: '2k^2-2k-1\\le0\\iff\\frac{1-\\sqrt3}{2}\\le k\\le\\frac{1+\\sqrt3}{2}' }] } },
      { ask: { type: 'choice', q: '次に $s\\le1$。$k>0$ のもとで同じ条件は？',
        opts: ['$k\\ge\\dfrac12$', '$k\\le\\dfrac12$', '$k\\ge1$', '$k\\le2$'], ok: 0,
        why: { 1: '$2k^2-k\\ge0$ ⇔ $k(2k-1)\\ge0$。$k>0$ なら $2k-1\\ge0$ で、向きが逆です。', 2: '$k(2k-1)\\ge0$ の解は $k\\ge\\frac12$。', 3: 'それは (1) の範囲（$k<2$）と混同しています。' },
        good: '$1+2k-2k^2\\le k+1$ ⇔ $2k^2-k\\ge0$ ⇔ $k(2k-1)\\ge0$。$k>0$ なので $k\\ge\\frac12$。',
        add: [{ t: 'm', tex: 'k(2k-1)\\ge0\\iff k\\ge\\frac12', note: '$k>0$ より' }] } },
      { say: '(1) の $0<k<2$ と合わせます。$\\frac{1+\\sqrt3}{2}\\approx1.37$ は 2 より小さいので、答えは次のとおり。右のグラフで $0\\le s\\le1$ となる所（緑）です。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\frac12\\le k\\le\\frac{1+\\sqrt3}{2}' },
          sGraph('s1', [{ k: 'seg', a: [0.5, 0], b: [K1, 0], c: 'g', wd: 6 }, { k: 'pt', at: [0.5, 0], c: 'g' }, { k: 'pt', at: [K1, 0], c: 'g' },
            { k: 'label', at: [K1, 0], text: '(1+√3)/2', dx: 8, dy: -18, size: 18, c: 'g', anchor: 'start' },
            { k: 'label', at: [0.98, 0.7], text: 's = (1+2k−2k²)/(k+1)', size: 16, anchor: 'start' }])] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.6, 0.4], part: '別の見方', say: '図形で見ると、H が線分 OA 上 ⇔ ∠COA と ∠CAO がどちらも 90° 以下。範囲の両はしは、それぞれが直角になるときです。',
        add: [{ t: 'h', text: '別の見方：両はしは「直角」のとき' },
          { t: 'tbl', size: 'sm', rows: [['$k$', 'H の位置', '直角になる角'], ['$\\frac12$', 'H＝A（$s=1$）', '∠CAO'], ['$\\frac{1+\\sqrt3}{2}$', 'H＝O（$s=0$）', '∠COA']] },
          { t: 'p', size: 'sm', text: '$s\\ge0$ ⇔ $\\overrightarrow{\\mathrm{OC}}\\cdot\\overrightarrow{\\mathrm{OA}}\\ge0$（∠COA ≦ 90°）\n$s\\le1$ ⇔ $\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AO}}\\ge0$（∠CAO ≦ 90°）' },
          tri('t4', K1, { H: true, OC: true, cap: 'k = (1+√3)/2' })] },
      { ask: { type: 'think', q: '$k=\\frac12$ のとき、$\\overrightarrow{\\mathrm{AC}}\\cdot\\vec a=0$（CA ⊥ OA）となることを確かめよう。',
        hint: '$k=\\frac12$ で $\\overrightarrow{\\mathrm{OC}}=\\frac{2\\vec a+\\vec b}{3}$、$\\vec a\\cdot\\vec b=1$。',
        ans: '$\\overrightarrow{\\mathrm{AC}}=\\frac{\\vec b-\\vec a}{3}$ より $\\overrightarrow{\\mathrm{AC}}\\cdot\\vec a=\\frac{\\vec a\\cdot\\vec b-|\\vec a|^2}{3}=\\frac{1-1}{3}=0$',
        after: '範囲の端の値を図形で確かめると、答えに自信がもてます。' } },
      { clear: true, cols: [1], part: '答案のポイント', say: '答案では、(1) で三角形ができる条件を書くこと、(3) で分母が正であることを断ってから分母をはらうこと。この2つが減点されやすい所です。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', size: 'sm', label: '(1)', text: '「三角形 OAB が存在するので $|\\vec a\\cdot\\vec b|<|\\vec a||\\vec b|$」→ $0<k<2$。$k$ の範囲は (3) で使う' },
          { t: 'box', c: 'b', size: 'sm', label: '(2)', text: '「H は直線 OA 上なので $\\overrightarrow{\\mathrm{OH}}=s\\vec a$」「$\\overrightarrow{\\mathrm{CH}}\\perp\\vec a$ より内積 0」' },
          { t: 'box', c: 'p', size: 'sm', label: '(3)', text: '「$k+1>0$ より」分母をはらう。2つの2次不等式の解と $0<k<2$ の共通部分を答える' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂直は内積 0、文字の範囲は三角形の存在から、位置の条件は比の不等式に。ベクトルの標準問題の基本の流れでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
