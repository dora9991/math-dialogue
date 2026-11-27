/* 九工大型 2025 第4問の類題②（自作）：数学C 空間ベクトル（内積・垂線の足・三角形の面積）・数学Ⅰ 2次関数（最大と自然数の条件）
   元の問題はうつしていない（「2つの文字で座標が決まる空間の3点」「原点から2点を通る直線に下ろした垂線の足を内積0で求める」「ある頂点での角が直角以上の条件を内積の符号で」
   「三角形の面積を2つの文字で表す」「文字が自然数のとき、もう一方の文字がどの値でも面積が一定値未満となる最大の値を、2次式の最大と不等式で決める」
   というねらいと形式だけを合わせた自作問題）。
   類題①（B が OA に平行な直線上）とは別に、B(1, t, 1) は y 軸に平行な直線上を動く。X のとりうる範囲に上限があり、最大が実現するための k の条件が出る。
   O(0,0,0)、A(k,0,0)、B(1,t,1)、k>1、D=(k−1)²+t²+1。
   (1) OH=OA+s·AB、OH·AB=0 → s=k(k−1)/D → H(k(t²+1)/D, kt(k−1)/D, k(k−1)/D)（k=3, t=2 で (5/3, 4/3, 2/3)）
   (2) BO·BA=t²−k+2≦0 → −√(k−2) ≦ t ≦ √(k−2)、存在条件 k≧2（k=2 は t=0 で H=B）
   (3) AH=k(k−1)/√D、OH²=k²(t²+1)/D（OH²+AH²=k²）→ S=(1/2)OH·AH=k²(k−1)√(t²+1)/(2D)（k=3, t=0 で 9/5）
   (4) X=AH² とおくと S²=X(k²−X)/4≦k⁴/16。X=k²/2 ⇔ t²=k²−2k ≧ 0 ⇔ k≧2 → k≧2 で max S=k²/4。k²/4<7 ⇔ k²<28 → k=5（k=6 は 9）
       考えてみよう：k=3/2 のとき max S=9/20（k²/4=9/16 には届かない）
   別の見方：H は OA を直径とする球面上、OH=AH のとき最大。
   答え（python3・sympy で検算ずみ）：s・H・内積・OH²・AH²・S、k=1.5,2,3,4,5,6 で t を動かした S の最大の数値（k²/4 と一致、k=1.5 は 0.45）、誤答の値も。 */
(function () {
  const POINTS = [
    '垂線の足は「直線上の点を実数 $s$ で表す」→「垂直 ⇔ 内積 $=0$」で $s$ を決める',
    '角の大きさは内積の符号で：$\\angle\\mathrm{OBA}\\ge90^\\circ\\iff\\overrightarrow{\\mathrm{BO}}\\cdot\\overrightarrow{\\mathrm{BA}}\\le0$。そのような $t$ がある条件は $t^2\\le k-2$ から',
    '斜辺が一定の直角三角形は $S^2=\\frac14X(k^2-X)$ と **2 次式** にして最大。$X$ が **その値までとどくか**（$k\\ge2$）を必ず確かめる'
  ];
  // 見取図（x 軸を右、z 軸を上、y 軸を左上の奥へ）。図は k=3、t=2：A(3,0,0)、B(1,2,1)、H(5/3,4/3,2/3)
  const pj = (x, y, z) => [x - 0.4 * y, z + 0.45 * y];
  const O3 = pj(0, 0, 0), A3 = pj(3, 0, 0), B3 = pj(1, 2, 1), H3 = pj(5 / 3, 4 / 3, 2 / 3);
  const AB = (s) => [A3[0] + s * (B3[0] - A3[0]), A3[1] + s * (B3[1] - A3[1])];
  const space = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-2.2, -0.5, 4.0, 3.0], w: Math.round((h || 300) * 6.2 / 3.5), h: h || 300, items: [
    { k: 'vec', a: O3, b: pj(3.6, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 3.8, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 0, 2.5), c: 'd', wd: 2 },
    { k: 'label', at: pj(3.6, 0, 0), text: 'x', dx: 4, dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 3.8, 0), text: 'y', dx: -12, dy: 12, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 2.5), text: 'z', dx: 14, c: 'd', size: 22 },
    { k: 'label', at: O3, text: 'O', dx: -6, dy: 20, size: 22 },
    { k: 'seg', a: pj(1, -1, 1), b: pj(1, 3.8, 1), c: 'b', wd: 2.5, dash: true }, { k: 'label', at: pj(1, 3.8, 1), text: 'm', dx: 14, c: 'b', size: 22 },
    { k: 'seg', a: AB(-0.1), b: AB(1.15), c: 'w', wd: 2.5 },
    { k: 'seg', a: O3, b: H3, c: 'p', wd: 2.5 }, { k: 'right', o: H3, a: O3, b: A3, c: 'p', s: 12 },
    { k: 'pt', at: A3, name: 'A', dir: 's', c: 'y' }, { k: 'pt', at: B3, name: 'B', dir: 'n', c: 'b' }, { k: 'pt', at: H3, name: 'H', dir: 'e', c: 'p' }].concat(extra || []) });
  // 断面の図：OA を直径とする円と、直角三角形 OAH（OA＝k＝3 として）
  const thales = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-0.5, -0.6, 3.5, 2.0], w: Math.round((h || 300) * 4 / 2.6), h: h || 300, items: [
    { k: 'arc', o: [1.5, 0], r: 1.5, a1: 0, a2: 180, c: 'd', wd: 2, dash: true },
    { k: 'seg', a: [0, 0], b: [3, 0], c: 'y', wd: 3 }, { k: 'label', at: [1.5, 0], text: 'OA = k', dy: 22, c: 'y', size: 21, plain: true },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'w', c: 'w' }, { k: 'pt', at: [3, 0], name: 'A', dir: 'e', c: 'w' }].concat(extra || []) });
  const tri = (H, c, nm) => [{ k: 'poly', pts: [[0, 0], [3, 0], H], close: true, c, fill: c, alpha: 0.18, wd: 2.5 }, { k: 'right', o: H, a: [0, 0], b: [3, 0], c, s: 12 }, { k: 'pt', at: H, name: nm || 'H', dir: 'n', c }];

  HB.lesson({
    id: 'kyutech25-4b', field: '九工大型　数学', title: '2025 九工大 第4問の類題② ― 空間の垂線の足と直角三角形の面積の最大', level: '2025年度 九州工業大学 前期 第4問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$k$ を 1 より大きい実数、$t$ を実数とする。座標空間に 3 点 $\\mathrm{O}(0,\\ 0,\\ 0)$，$\\mathrm{A}(k,\\ 0,\\ 0)$，$\\mathrm{B}(1,\\ t,\\ 1)$ があり、O から直線 AB に下ろした垂線と直線 AB の交点を H とする。',
      parts: [
        '(1)　H の座標を $k,\\ t$ を用いて表せ。',
        '(2)　$\\angle\\mathrm{OBA}\\ge90^\\circ$ となるような $t$ が存在するための $k$ の条件を求めよ。また、そのときの $t$ の値の範囲を $k$ を用いて表せ。',
        '(3)　三角形 OAH の面積 $S$ を $k,\\ t$ を用いて表せ。',
        '(4)　$k$ を 2 以上の自然数とする。$t$ がどのような実数値をとっても $S<7$ となるような $k$ の最大値を求めよ。'
      ],
      src: '※ 2025年度 九州工業大学 前期 第4問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの基本（垂線の足・内積の符号・面積）と、2 次式の最大を組み合わせた問題です。計算は軽めなので、ていねいに進めましょう。まず問題文を読みます。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'B は $x,\\ z$ 座標が 1 で、$y$ 座標 $t$ だけが動く点。つまり $y$ 軸に平行な直線 $m$ の上を動きます。右の図は $k=3,\\ t=2$ の場合です。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　H は直線 AB 上 → 実数 $s$ で表し、OH ⊥ AB\n(2)　角が $90^\\circ$ 以上 ⇔ 内積 $\\le0$\n(3)　三角形 OAH は H が直角\n(4)　$S^2$ を 2 次式とみて最大' },
          space('s1')] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。H は直線 AB 上の点なので、$\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{AB}}$ と実数 $s$ で表せます。$\\overrightarrow{\\mathrm{AB}}=(1-k,\\ t,\\ 1)$ です。',
        add: [{ t: 'h', text: '(1)　垂線の足 H' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=(k+s(1-k),\\ st,\\ s)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0\\ \\ \\text{より}\\ \\ k(1-k)+s\\{(1-k)^2+t^2+1\\}=0' },
          { t: 'p', size: 'sm', text: '$D=(k-1)^2+t^2+1$ とおく（$D>0$）。' },
          space('s1a')] },
      { ask: { type: 'choice', q: '$s$ の値は？',
        opts: ['$\\dfrac{k(1-k)}{D}$', '$\\dfrac{k}{D}$', '$\\dfrac{k(k-1)}{D}$', '$\\dfrac{k-1}{D}$'], ok: 2,
        why: { 0: '$k(1-k)+sD=0$ を $s$ について解くと、移項で符号が変わります。', 1: '$\\overrightarrow{\\mathrm{OA}}\\cdot\\overrightarrow{\\mathrm{AB}}=k(1-k)$ の $(1-k)$ を落としています。', 3: '$\\overrightarrow{\\mathrm{OA}}=(k,\\ 0,\\ 0)$ の $k$ をかけ忘れています。' },
        good: '$sD=-k(1-k)=k(k-1)$ より $s=\\dfrac{k(k-1)}{D}$。',
        add: [{ t: 'm', col: 1, tex: 's=\\frac{k(k-1)}{D}' }] } },
      { say: '$s$ を $\\overrightarrow{\\mathrm{OH}}$ に代入します。$x$ 成分は $k-\\dfrac{k(k-1)^2}{D}=\\dfrac{k(t^2+1)}{D}$ とまとまります。$k=3,\\ t=2$ なら $D=9$ で $\\mathrm{H}\\left(\\frac53,\\frac43,\\frac23\\right)$ です。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{H}\\left(\\frac{k(t^2+1)}{D},\\ \\frac{kt(k-1)}{D},\\ \\frac{k(k-1)}{D}\\right)' },
          { t: 'p', size: 'sm', text: 'ただし $D=(k-1)^2+t^2+1$' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\angle\\mathrm{OBA}\\ge90^\\circ$ は、$\\overrightarrow{\\mathrm{BO}}$ と $\\overrightarrow{\\mathrm{BA}}$ の内積が 0 以下ということです。',
        add: [{ t: 'h', text: '(2)　∠OBA ≧ 90° となる t' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{BO}}=(-1,\\ -t,\\ -1),\\quad\\overrightarrow{\\mathrm{BA}}=(k-1,\\ -t,\\ -1)' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{BO}}\\cdot\\overrightarrow{\\mathrm{BA}}=-(k-1)+t^2+1=t^2-k+2' },
          { t: 'm', size: 'sm', tex: 't^2-k+2\\le0\\ \\Longleftrightarrow\\ t^2\\le k-2' }] },
      { ask: { type: 'choice', q: '$t^2\\le k-2$ をみたす実数 $t$ が存在する $k$ の条件は？',
        opts: ['$k\\ge1$', '$k\\ge2$', '$k>2$', '$k\\ge4$'], ok: 1,
        why: { 0: 'それは問題の仮定（$k>1$）に近い条件です。$k-2$ が負だと $t^2\\le k-2$ になる $t$ がありません。', 2: '$k=2$ のとき $t^2\\le0$ で $t=0$ がとれます。等号をふくめます。', 3: '$t=\\pm1$ がとれる条件と混ざっています。$t^2\\le k-2$ は $k-2\\ge0$ でよいです。' },
        good: '右辺 $k-2$ が 0 以上なら、$t^2\\le k-2$ をみたす $t$ があります。$k=2$ のときは $t=0$ だけ。',
        add: [{ t: 'm', col: 1, tex: 'k\\ge2' }] } },
      { say: 'そのときの $t$ の範囲は $-\\sqrt{k-2}\\le t\\le\\sqrt{k-2}$。$k=3$ なら $|t|\\le1$ で、図の B が $t=2$ の位置にあるときは鈍角にはなりません。',
        add: [{ t: 'ans', label: '(2) 答', text: '$k\\ge2$\n$-\\sqrt{k-2}\\le t\\le\\sqrt{k-2}$' }] },
      { ask: { type: 'think', q: '$k=2$ のとき、$\\angle\\mathrm{OBA}\\ge90^\\circ$ となる $t$ を求め、そのときの H がどこか調べよう。',
        hint: '$t^2\\le0$ より $t=0$。B と A, O の位置関係を見る。',
        ans: '$t=0$。B$(1,\\ 0,\\ 1)$ で、$\\overrightarrow{\\mathrm{BO}}\\cdot\\overrightarrow{\\mathrm{BA}}=0$ なので $\\angle\\mathrm{OBA}=90^\\circ$。OB ⊥ AB だから、垂線の足 H は B 自身（(1) の式でも $\\mathrm{H}(1,\\ 0,\\ 1)$）。',
        after: '$\\angle\\mathrm{OBA}$ が鈍角なら、H は線分 AB の外（B の先）にきます。ここは (4) の「どこまでとどくか」にも関わります。' } },

      // ---------- (3) ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) です。三角形 OAH は H が直角で、斜辺 OA $=k$。$\\mathrm{AH}=|s|\\,|\\overrightarrow{\\mathrm{AB}}|$ で、$|\\overrightarrow{\\mathrm{AB}}|=\\sqrt D$ です。',
        add: [{ t: 'h', text: '(3)　三角形 OAH の面積' },
          { t: 'm', size: 'sm', tex: '\\mathrm{AH}=|s|\\sqrt D=\\frac{k(k-1)}{D}\\cdot\\sqrt D' },
          { t: 'p', size: 'sm', text: '$k>1$ なので $s>0$。' },
          thales('th0', tri([2.4, 1.2], 'p'), 260)] },
      { ask: { type: 'choice', q: 'AH の長さは？',
        opts: ['$\\dfrac{k(k-1)}{D}$', '$k(k-1)\\sqrt D$', '$\\dfrac{k}{\\sqrt D}$', '$\\dfrac{k(k-1)}{\\sqrt D}$'], ok: 3,
        why: { 0: '$\\sqrt D$ をかけ忘れています（$s\\cdot|\\overrightarrow{\\mathrm{AB}}|$）。', 1: '$s=\\frac{k(k-1)}{D}$ に $\\sqrt D$ をかけると、$D$ が 1 つ約分されます。', 2: '$s$ の分子の $(k-1)$ を落としています。' },
        good: '$\\dfrac{k(k-1)}{D}\\cdot\\sqrt D=\\dfrac{k(k-1)}{\\sqrt D}$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: '\\mathrm{AH}=\\frac{k(k-1)}{\\sqrt D}' }] } },
      { say: '三平方の定理で $\\mathrm{OH}^2=k^2-\\mathrm{AH}^2$。$D-(k-1)^2=t^2+1$ を使うと、$\\mathrm{OH}^2=\\dfrac{k^2(t^2+1)}{D}$ ときれいにまとまります。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{OH}^2=k^2-\\frac{k^2(k-1)^2}{D}=\\frac{k^2\\{D-(k-1)^2\\}}{D}=\\frac{k^2(t^2+1)}{D}' },
          { t: 'm', size: 'sm', tex: 'S=\\frac12\\,\\mathrm{OH}\\cdot\\mathrm{AH}=\\frac12\\cdot\\frac{k\\sqrt{t^2+1}}{\\sqrt D}\\cdot\\frac{k(k-1)}{\\sqrt D}' },
          { t: 'ans', label: '(3) 答', tex: 'S=\\frac{k^2(k-1)\\sqrt{t^2+1}}{2\\{(k-1)^2+t^2+1\\}}' },
          { t: 'box', col: 1, c: 'g', size: 'sm', label: '検算', text: '$k=3,\\ t=0$：$D=5$\n$S=\\dfrac{9\\cdot2\\cdot1}{2\\cdot5}=\\dfrac95$\n（$\\mathrm{H}\\left(\\frac35,0,\\frac65\\right)$ から直接も $\\frac95$）' }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.56, 0.44], part: '(4)', say: '(4) です。(3) の式は $t$ の入り組んだ式なので、$X=\\mathrm{AH}^2$ とおきます。$\\mathrm{OH}^2=k^2-X$ なので、$S^2=\\dfrac14X(k^2-X)$ という 2 次式になります。',
        add: [{ t: 'h', text: '(4)　S の最大' },
          { t: 'm', size: 'sm', tex: 'X=\\mathrm{AH}^2=\\frac{k^2(k-1)^2}{D}' },
          { t: 'm', size: 'sm', tex: 'S^2=\\frac14\\,\\mathrm{OH}^2\\,\\mathrm{AH}^2=\\frac14X(k^2-X)' },
          thales('th1', tri([2.4, 1.2], 'p'), 260)] },
      { ask: { type: 'choice', q: '$X$ が $\\dfrac{k^2}{2}$ のとき、$S^2$ は？',
        opts: ['$\\dfrac{k^4}{16}$', '$\\dfrac{k^4}{8}$', '$\\dfrac{k^4}{4}$', '$\\dfrac{k^2}{16}$'], ok: 0,
        why: { 1: '$\\frac14\\cdot\\frac{k^2}{2}\\cdot\\frac{k^2}{2}=\\frac{k^4}{16}$。$\\frac14$ をかけ忘れ、$\\frac{k^4}{4}$ から半分にしただけです。', 2: '$X(k^2-X)=\\frac{k^4}{4}$ に、さらに $\\frac14$ をかけます。', 3: '2 乗する量が $k^2$ なので、積は $k^4$ の形です。' },
        good: '$X(k^2-X)$ は $X=\\dfrac{k^2}{2}$ で最大 $\\dfrac{k^4}{4}$。$S^2\\le\\dfrac{k^4}{16}$ で、$S\\le\\dfrac{k^2}{4}$。',
        add: [{ t: 'm', col: 1, size: 'sm', tex: 'S\\le\\frac{k^2}{4}' }] } },
      { say: 'ただし、$X=\\frac{k^2}{2}$ に **とどくか** を確かめる必要があります。$X=\\frac{k^2(k-1)^2}{D}=\\frac{k^2}{2}$ は $D=2(k-1)^2$、つまり $t^2=k^2-2k$ です。',
        add: [{ t: 'm', size: 'sm', tex: 't^2+1=(k-1)^2\\ \\Longleftrightarrow\\ t^2=k^2-2k=k(k-2)' },
          { t: 'p', size: 'sm', text: '$k\\ge2$ なら右辺は 0 以上なので、この $t$ が存在する。\n（$k<2$ だと存在せず、最大は $\\frac{k^2}{4}$ にとどかない。）' }] },
      { clear: true, cols: [0.56, 0.44], part: '(4)', say: 'ここまでをまとめます。$k\\ge2$ なら $X=\\frac{k^2}{2}$ にとどくので、$S$ の最大は $\\frac{k^2}{4}$。H が OA を直径とする円（球）の「てっぺん」にくる形です。',
        add: [{ t: 'h', text: '(4)　つづき：最大値と k の決定' },
          { t: 'm', size: 'sm', tex: 'k\\ge2\\ \\text{のとき}\\ \\ S\\le\\frac{k^2}{4}\\ \\ (\\text{等号は}\\ t^2=k^2-2k)' },
          thales('th2', tri([1.5, 1.5], 'y', 'H'), 240)] },
      { ask: { type: 'choice', q: '$k$ が 2 以上の自然数のとき、$t$ を動かしたときの $S$ の最大値は？',
        opts: ['$\\dfrac{k^2}{2}$', '$\\dfrac{k^2}{4}$', '$\\dfrac{k}{4}$', '$\\dfrac{k^4}{16}$'], ok: 1,
        why: { 0: '$S=\\frac12\\mathrm{OH}\\cdot\\mathrm{AH}\\le\\frac12\\cdot\\frac{k}{\\sqrt2}\\cdot\\frac{k}{\\sqrt2}=\\frac{k^2}{4}$。$\\frac12$ をかけ忘れています。', 2: '$k^2$ の 2 乗を落としています。', 3: 'それは $S^2$ の最大です。$S$ はその正の平方根。' },
        good: '最大値は $\\dfrac{k^2}{4}$（そのとき $\\mathrm{OH}=\\mathrm{AH}=\\dfrac{k}{\\sqrt2}$、直角二等辺三角形）。',
        add: [{ t: 'ans', label: '最大値', text: '$S_{\\max}=\\dfrac{k^2}{4}$\n$(t^2=k^2-2k)$' }] } },
      { ask: { type: 'choice', q: '「どんな $t$ でも $S<7$」をみたす自然数 $k$ の最大値は？',
        opts: ['$k=4$', '$k=5$', '$k=6$', '$k=7$'], ok: 1,
        why: { 0: '$k=5$ でも最大 $\\frac{25}{4}=6.25<7$ で、みたします。', 2: '$k=6$ だと最大が $\\frac{36}{4}=9$ で、7 以上になる $t$ があります。', 3: '$k=7$ は $\\frac{49}{4}$ で大きすぎます。' },
        good: '最大値 $\\dfrac{k^2}{4}<7$ ⇔ $k^2<28$。$5^2=25<28<36=6^2$ なので $k=5$。',
        add: [{ t: 'ans', label: '(4) 答', text: '$k=5$\n（$k=5$ のとき $S\\le\\frac{25}{4}<7$、$k=6$ のとき $S$ は 9 まで）' }] } },
      { ask: { type: 'think', q: '$k=\\dfrac32$（$k<2$）のとき、$S$ の最大値は $\\dfrac{k^2}{4}=\\dfrac9{16}$ になるだろうか。',
        hint: '$X=\\frac{k^2(k-1)^2}{D}$ は $D$ が小さいほど大きい。$D$ の最小は $t=0$ のとき。',
        ans: 'ならない。$t=0$ のとき $D=\\left(\\frac12\\right)^2+1=\\frac54$ が最小で、そのとき $S=\\dfrac{\\frac94\\cdot\\frac12\\cdot1}{2\\cdot\\frac54}=\\dfrac9{20}<\\dfrac9{16}$。',
        after: '$t^2=k^2-2k$ が負になってしまい、$X=\\frac{k^2}{2}$ に届きません。だから (4) では $k\\ge2$ と決めてあります。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '答案では、「内積が 0」と「$s$ を決めた」ことを式で示すのが第一歩。(4) は、最大値に **届くかどうか** を書くことが大切です。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)', text: '「H は直線 AB 上なので $\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{AB}}$。$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AB}}$ より内積 0」と書く' },
          { t: 'box', c: 'y', size: 'sm', label: '(2)(3)', text: '(2) は「$\\angle\\mathrm{OBA}\\ge90^\\circ\\iff\\overrightarrow{\\mathrm{BO}}\\cdot\\overrightarrow{\\mathrm{BA}}\\le0$」。(3) は「$\\angle\\mathrm{OHA}=90^\\circ$ なので $S=\\frac12\\mathrm{OH}\\cdot\\mathrm{AH}$」' },
          { t: 'box', c: 'p', size: 'sm', label: '(4)', text: '$S^2$ を $X$ の 2 次式にして最大。「$X=\\frac{k^2}{2}$ となる $t$ が存在する（$t^2=k^2-2k\\ge0$）」を必ず書き、最後は $k^2<28$ から自然数 $k=5$' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂線の足・内積の符号・2 次式の最大は、空間ベクトルの問題でくり返し出る基本の型です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
