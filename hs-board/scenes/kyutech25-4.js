/* 九工大型 2025 第4問の類題（自作）：数学C 空間ベクトル（内積・垂線の足・三角形の面積）・数学Ⅰ 2次関数（最大と自然数の条件）
   元の問題はうつしていない（「2つの文字で座標が決まる空間の3点」「原点から2点を通る直線に下ろした垂線の足を内積0で求める」「ある頂点での角が直角以上の条件を内積の符号で」
   「三角形の面積を2つの文字で表す」「文字が自然数のとき、もう一方の文字がどの値でも面積が一定値未満となる最大の値を、2次式の最大と無理数の近似で決める」
   というねらいと形式だけを合わせた自作問題。点の配置・角・面積をとる三角形（直角三角形 OAH）は自作）。
   O(0,0,0)、A(k,0,0)、B(t,1,1)、D=(t−k)²+2。
   (1) OH=OA+s·AB、OH·AB=0 → s=k(k−t)/D → H(2k/D, k(k−t)/D, k(k−t)/D)（k=2, t=0 で (2/3,2/3,2/3)）
   (2) BO·BA=t²−kt+2≦0 → (k−√(k²−8))/2 ≦ t ≦ (k+√(k²−8))/2、存在条件 k≧2√2（k>0）
   (3) AH²=k²(t−k)²/D、OH²=2k²/D（和は k²）→ S=(1/2)OH·AH=k²|t−k|/(√2·D)
   (4) X=AH² は 0≦X<k² のすべての値 → S²=X(k²−X)/4 ≦ k⁴/16（X=k²/2 ⇔ (t−k)²=2）→ max S=k²/4。k²/4<5 ⇔ k<2√5≈4.47 → k=4
   別の見方：H は OA を直径とする球面上、OH=AH のとき最大。三角形 OAB の面積は k/√2 で一定（B は OA に平行な直線上）。
   python3（sympy と数値の最大値探索）で検算ずみ（誤答の値も）。 */
(function () {
  const POINTS = [
    '垂線の足は「直線上の点を実数 $s$ で表す」→「垂直 ⇔ 内積 $=0$」で $s$ を決める',
    '角の大きさは内積の符号で：$\\angle\\mathrm{OBA}\\ge90^\\circ\\iff\\overrightarrow{\\mathrm{BO}}\\cdot\\overrightarrow{\\mathrm{BA}}\\le0$。そのような $t$ がある条件は判別式',
    '斜辺が一定の直角三角形は $S^2=\\frac14X(k^2-X)$ と **2 次式** にして最大。$X$ のとりうる値の範囲を必ず確かめる'
  ];
  // 見取図（x 軸を右、z 軸を上、y 軸を左上の奥へ。右手系）。図は k=2、t=0：A(2,0,0)、B(0,1,1)、H(2/3,2/3,2/3)
  const pj = (x, y, z) => [x - 0.5 * y, z + 0.3 * y];
  const O3 = pj(0, 0, 0), A3 = pj(2, 0, 0), B3 = pj(0, 1, 1), H3 = pj(2 / 3, 2 / 3, 2 / 3);
  const AB = (s) => [A3[0] + s * (B3[0] - A3[0]), A3[1] + s * (B3[1] - A3[1])];
  const space = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-2.0, -0.45, 3.3, 1.95], w: Math.round((h || 270) * 5.3 / 2.4), h: h || 270, items: [
    { k: 'vec', a: O3, b: pj(2.9, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 1.6, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 0, 1.75), c: 'd', wd: 2 },
    { k: 'label', at: pj(2.9, 0, 0), text: 'x', dx: 4, dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 1.6, 0), text: 'y', dx: -12, dy: 12, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 1.75), text: 'z', dx: 14, c: 'd', size: 22 },
    { k: 'label', at: O3, text: 'O', dx: -6, dy: 20, size: 22 },
    { k: 'seg', a: pj(-1.2, 1, 1), b: pj(2.9, 1, 1), c: 'b', wd: 2.5, dash: true }, { k: 'label', at: pj(2.9, 1, 1), text: 'm', dx: 14, c: 'b', size: 22 },
    { k: 'seg', a: AB(-0.2), b: AB(1.25), c: 'w', wd: 2.5 },
    { k: 'seg', a: O3, b: H3, c: 'p', wd: 2.5 }, { k: 'right', o: H3, a: O3, b: B3, c: 'p', s: 12 },
    { k: 'pt', at: A3, name: 'A', dir: 's', c: 'y' }, { k: 'pt', at: B3, name: 'B', dir: 'n', c: 'b' }, { k: 'pt', at: H3, name: 'H', dir: 'e', c: 'p' }].concat(extra || []) });
  // 断面の図：OA を直径とする円と、直角三角形 OAH（OA＝4 として）
  const thales = (id, extra, h) => ({ t: 'fig', id, col: 1, view: [-0.5, -0.6, 4.5, 2.5], w: Math.round((h || 300) * 5 / 3.1), h: h || 300, items: [
    { k: 'arc', o: [2, 0], r: 2, a1: 0, a2: 180, c: 'd', wd: 2, dash: true },
    { k: 'seg', a: [0, 0], b: [4, 0], c: 'y', wd: 3 }, { k: 'label', at: [2, 0], text: 'OA = k', dy: 22, c: 'y', size: 21, plain: true },
    { k: 'pt', at: [0, 0], name: 'O', dir: 'w', c: 'w' }, { k: 'pt', at: [4, 0], name: 'A', dir: 'e', c: 'w' }].concat(extra || []) });
  const tri = (H, c, nm) => [{ k: 'poly', pts: [[0, 0], [4, 0], H], close: true, c, fill: c, alpha: 0.18, wd: 2.5 }, { k: 'right', o: H, a: [0, 0], b: [4, 0], c, s: 12 }, { k: 'pt', at: H, name: nm || 'H', dir: 'n', c }];

  HB.lesson({
    id: 'kyutech25-4', field: '九工大型　数学', title: '2025 九工大 第4問の類題 ― 空間の垂線の足と直角三角形の面積の最大', level: '2025年度 九州工業大学 前期 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$k$ を正の定数、$t$ を実数とする。座標空間に 3 点 $\\mathrm{O}(0,\\ 0,\\ 0)$，$\\mathrm{A}(k,\\ 0,\\ 0)$，$\\mathrm{B}(t,\\ 1,\\ 1)$ があり、O から直線 AB に下ろした垂線と直線 AB の交点を H とする。',
      parts: [
        '(1)　H の座標を $k,\\ t$ を用いて表せ。',
        '(2)　$\\angle\\mathrm{OBA}\\ge90^\\circ$ となるような $t$ が存在するための $k$ の条件を求めよ。また、そのときの $t$ の値の範囲を $k$ を用いて表せ。',
        '(3)　$t\\neq k$ のとき、三角形 OAH の面積 $S$ を $k,\\ t$ を用いて表せ。',
        '(4)　$k$ を自然数とする。$t$ がどのような実数値をとっても $S<5$ となるような $k$ の最大値を求めよ。ただし、$t=k$ のときは $S=0$ とする。'
      ],
      src: '※ 2025年度 九州工業大学 前期 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの基本（垂線の足・内積の符号・面積）と、2 次関数の最大を組み合わせた問題です。計算は軽めなので、ていねいに進めましょう。まず問題文を読みます。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'B は $y,\\ z$ 座標が 1 で、$x$ 座標 $t$ だけが動く点。つまり $x$ 軸（OA）に平行な直線 $m$ の上を動きます。右の図は $k=2,\\ t=0$ の場合です。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　H は直線 AB 上 → 実数 $s$ で表し、OH ⊥ AB\n(2)　角が $90^\\circ$ 以上 ⇔ 内積 $\\le0$\n(3)　三角形 OAH は H が直角\n(4)　$S^2$ を 2 次式とみて最大' },
          space('s1')] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。H は直線 AB 上の点なので、実数 $s$ を使って $\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{AB}}$ と表せます。成分で書きます。',
        add: [{ t: 'h', text: '(1)　垂線の足 H の座標' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}=(t-k,\\ 1,\\ 1)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{AB}}=(k+s(t-k),\\ s,\\ s)' },
          space('s2', [], 240)] },
      { ask: { type: 'choice', q: '$s$ を決める条件は？',
        opts: ['$\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{OA}}=0$', '$|\\overrightarrow{\\mathrm{OH}}|=|\\overrightarrow{\\mathrm{OA}}|$', '$\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$', '$\\overrightarrow{\\mathrm{AH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$'], ok: 2,
        why: { 0: '垂直なのは OH と直線 AB です。', 1: '垂線の足は「O からの距離が OA と等しい点」ではありません。', 3: 'AH は AB と同じ直線上にあるので、内積はふつう 0 になりません。' },
        good: 'OH ⊥ AB ⇔ $\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$。これで $s$ が 1 つに決まります。' } },
      { say: '内積を計算して $s$ について解きます。$(t-k)^2+2>0$ なので割ってかまいません。この式を、以下 $D=(t-k)^2+2$ と書きます。',
        add: [{ t: 'm', size: 'sm', tex: '\\{k+s(t-k)\\}(t-k)+s+s=0' },
          { t: 'm', size: 'sm', tex: 'k(t-k)+s\\{(t-k)^2+2\\}=0' },
          { t: 'm', tex: 's=\\frac{k(k-t)}{D}\\qquad\\bigl(D=(t-k)^2+2\\bigr)' }] },
      { say: '$x$ 座標は $k+s(t-k)=k-\\dfrac{k(t-k)^2}{D}=\\dfrac{2k}{D}$ ときれいになります。$y,\\ z$ 座標は $s$ そのものです。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\mathrm{H}\\left(\\frac{2k}{D},\\ \\frac{k(k-t)}{D},\\ \\frac{k(k-t)}{D}\\right)' },
          { t: 'p', size: 'sm', text: 'ただし $D=(t-k)^2+2$' }] },
      { ask: { type: 'think', q: '検算：$k=2,\\ t=0$ のとき H を求め、$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AB}}$ を確かめよう。',
        hint: '$D=(0-2)^2+2=6$。$\\overrightarrow{\\mathrm{AB}}=(-2,\\ 1,\\ 1)$。',
        ans: 'H$\\left(\\frac23,\\ \\frac23,\\ \\frac23\\right)$。$\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=-\\frac43+\\frac23+\\frac23=0$。',
        after: '右の図がこの場合です。文字の式は、小さな値を入れて確かめるとミスに気づけます。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。角が $90^\\circ$ 以上かどうかは、内積の符号でわかります。$\\angle\\mathrm{OBA}$ は B から O と A に向かうベクトルのなす角です。',
        add: [{ t: 'h', text: '(2)　∠OBA ≧ 90° となる条件' },
          { t: 'box', c: 'y', size: 'sm', label: '角と内積の符号', text: '$\\theta<90^\\circ$ ⇔ 内積 $>0$　　$\\theta=90^\\circ$ ⇔ 内積 $=0$\n$\\theta>90^\\circ$ ⇔ 内積 $<0$' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{BO}}=(-t,\\ -1,\\ -1),\\quad \\overrightarrow{\\mathrm{BA}}=(k-t,\\ -1,\\ -1)' },
          { t: 'p', size: 'sm', text: 'B の $y$ 座標は 1 なので B ≠ O、B ≠ A（角は必ず決まる）' }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{BO}}\\cdot\\overrightarrow{\\mathrm{BA}}$ は？',
        opts: ['$t^2-kt+2$', '$t^2-kt-2$', '$-t^2+kt+2$', '$t^2+kt+2$'], ok: 0,
        why: { 1: '$(-1)\\cdot(-1)=+1$ が 2 つで $+2$ です。', 2: '$(-t)(k-t)=-kt+t^2$。符号が逆です。', 3: '$(-t)(k-t)=-kt+t^2$。$kt$ の符号が逆です。' },
        good: '$(-t)(k-t)+1+1=t^2-kt+2$。これが 0 以下になる条件を調べます。',
        add: [{ t: 'm', tex: '\\angle\\mathrm{OBA}\\ge90^\\circ\\iff t^2-kt+2\\le0' }] } },
      { ask: { type: 'choice', q: '$t^2-kt+2\\le0$ をみたす $t$ が存在する $k$ の条件は？（$k>0$）',
        opts: ['$k>2\\sqrt2$', '$k\\ge2\\sqrt2$', '$k\\ge8$', '$0<k\\le2\\sqrt2$'], ok: 1,
        why: { 0: '$k=2\\sqrt2$ でも $t=\\sqrt2$ で等号が成り立ち、ちょうど $90^\\circ$。含みます。', 2: '判別式の条件は $k^2-8\\ge0$。$k^2\\ge8$ です。', 3: '不等号の向きが逆です。解があるのは判別式 $\\ge0$ のとき。' },
        good: '判別式 $k^2-8\\ge0$ と $k>0$ から $k\\ge2\\sqrt2$。$t$ の範囲は 2 つの解の間です。',
        add: [{ t: 'ans', label: '(2) 答', text: '$k\\ge2\\sqrt2$\n$\\dfrac{k-\\sqrt{k^2-8}}{2}\\le t\\le\\dfrac{k+\\sqrt{k^2-8}}{2}$' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。OH ⊥ AB なので、三角形 OAH は **H が直角**。斜辺は OA $=k$ です。AH は $|s|\\cdot|\\overrightarrow{\\mathrm{AB}}|$ で求まります。',
        add: [{ t: 'h', text: '(3)　三角形 OAH の面積' },
          { t: 'm', tex: '|\\overrightarrow{\\mathrm{AB}}|=\\sqrt{(t-k)^2+2}=\\sqrt D' },
          { t: 'm', tex: '\\mathrm{AH}=|s|\\sqrt D=\\frac{k|t-k|}{\\sqrt D},\\qquad \\mathrm{AH}^2=\\frac{k^2(t-k)^2}{D}' },
          thales('c3', tri([1, Math.sqrt(3)], 'p'), 260)] },
      { ask: { type: 'choice', q: '$\\mathrm{OH}^2$ は？（$D=(t-k)^2+2$）',
        opts: ['$\\dfrac{2k}{D}$', '$\\dfrac{k^2(t-k)^2}{D}$', '$k^2+\\dfrac{k^2(t-k)^2}{D}$', '$\\dfrac{2k^2}{D}$'], ok: 3,
        why: { 0: 'それは H の $x$ 座標です。', 1: 'それは $\\mathrm{AH}^2$ です。', 2: '三平方の定理は $\\mathrm{OA}^2=\\mathrm{OH}^2+\\mathrm{AH}^2$。引き算です。' },
        good: '$\\mathrm{OH}^2=k^2-\\dfrac{k^2(t-k)^2}{D}=\\dfrac{k^2\\{D-(t-k)^2\\}}{D}=\\dfrac{2k^2}{D}$。',
        add: [{ t: 'm', tex: '\\mathrm{OH}^2=k^2-\\mathrm{AH}^2=\\frac{2k^2}{D}' }] } },
      { say: '面積は「直角をはさむ 2 辺」の積の半分。$\\mathrm{OH}=\\dfrac{\\sqrt2\\,k}{\\sqrt D}$ と AH をかけて 2 で割ります。',
        add: [{ t: 'ans', col: 1, label: '(3) 答', tex: 'S=\\frac{k^2|t-k|}{\\sqrt2\\,\\{(t-k)^2+2\\}}' },
          { t: 'p', col: 1, size: 'sm', text: '$S=\\dfrac12\\cdot\\dfrac{\\sqrt2\\,k}{\\sqrt D}\\cdot\\dfrac{k|t-k|}{\\sqrt D}$' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$S^2=\\frac14\\mathrm{AH}^2\\cdot\\mathrm{OH}^2$ で、$\\mathrm{AH}^2+\\mathrm{OH}^2=k^2$（一定）。$X=\\mathrm{AH}^2$ とおくと、$S^2$ は $X$ の 2 次式になります。',
        add: [{ t: 'h', text: '(4)　S の最大値と k の最大値' },
          { t: 'm', tex: 'S^2=\\frac14\\,\\mathrm{AH}^2\\cdot\\mathrm{OH}^2=\\frac14X(k^2-X)', note: '$X=\\mathrm{AH}^2$' },
          thales('c4', tri([1, Math.sqrt(3)], 'p'), 260)] },
      { ask: { type: 'choice', q: '$t$ がすべての実数を動くとき、$X$ のとりうる値の範囲は？',
        opts: ['$0\\le X<k^2$', '$0\\le X\\le k^2$', '$0<X<k^2$', '$X\\ge0$'], ok: 0,
        why: { 1: '$X=k^2$ には $\\frac{(t-k)^2}{(t-k)^2+2}=1$ が必要ですが、これは成り立ちません。', 2: '$t=k$ のとき $X=0$ です（このとき $S=0$）。', 3: '$X=k^2\\cdot\\frac{(t-k)^2}{(t-k)^2+2}$ の分数は 1 より小さい。' },
        good: '$u=(t-k)^2$ は 0 以上のすべての値をとり、$\\frac{u}{u+2}$ は 0 以上 1 未満のすべての値をとります。',
        add: [{ t: 'm', tex: 'X=k^2\\cdot\\frac{(t-k)^2}{(t-k)^2+2}\\qquad(0\\le X<k^2)' }] } },
      { say: '平方完成すると、$X=\\frac{k^2}{2}$ のとき最大。これは範囲に入っている（$(t-k)^2=2$ のとき）ので、$S$ の最大値は $\\frac{k^2}{4}$ です。',
        add: [{ t: 'm', tex: 'S^2=-\\frac14\\left(X-\\frac{k^2}{2}\\right)^2+\\frac{k^4}{16}\\le\\frac{k^4}{16}' },
          { t: 'm', tex: 'S\\le\\frac{k^2}{4}', note: '等号は $t=k\\pm\\sqrt2$' }] },
      { ask: { type: 'choice', q: '$t$ がどんな値でも $S<5$ となる自然数 $k$ の最大値は？',
        opts: ['$5$', '$2$', '$4$', '$3$'], ok: 2,
        why: { 0: '$\\frac{5^2}{4}=6.25$。$S\\ge5$ となる $t$ があります。', 1: '$\\sqrt5\\approx2.24$ で止めています。条件は $k<2\\sqrt5$。', 3: '$\\frac{4^2}{4}=4<5$ なので、$k=4$ も条件をみたします。' },
        good: '最大値 $\\frac{k^2}{4}$ は実際にとるので、条件は $\\frac{k^2}{4}<5$、つまり $k<2\\sqrt5=4.47\\cdots$。',
        add: [{ t: 'm', col: 1, tex: '\\frac{k^2}{4}<5\\iff k<2\\sqrt5' }, { t: 'p', col: 1, size: 'sm', text: '$\\sqrt5=2.236\\cdots$ より $2\\sqrt5=4.47\\cdots$' },
          { t: 'ans', col: 1, label: '(4) 答', text: '$k$ の最大値は $4$' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '図で見ると、∠OHA $=90^\\circ$ なので H は OA を直径とする球面の上（断面では円周上）。斜辺が一定の直角三角形の面積は、高さが最大の **直角二等辺三角形** のとき最大です。',
        add: [{ t: 'h', text: '別の見方：斜辺が一定の直角三角形' },
          { t: 'm', tex: 'S\\le\\frac12\\cdot\\mathrm{OA}\\cdot\\frac{\\mathrm{OA}}{2}=\\frac{k^2}{4}' },
          { t: 'p', size: 'sm', text: '高さ（H から OA までの距離）は、半径 $\\frac{k}{2}$ 以下' },
          thales('c5', tri([1, Math.sqrt(3)], 'b', 'H').concat(tri([2, 2], 'y', 'H′'), [{ k: 'seg', a: [2, 0], b: [2, 2], c: 'y', wd: 2, dash: true }, { k: 'label', at: [2, 0.6], text: 'k/2', dx: -28, c: 'y', size: 20 }]), 280)] },
      { ask: { type: 'think', q: '$S$ が最大になる $t$ を求め、そのとき $\\mathrm{OH}=\\mathrm{AH}$ となることを確かめよう。',
        hint: '$X=\\frac{k^2}{2}$ となる $(t-k)^2$ を求める。',
        ans: '$(t-k)^2=2$ より $t=k\\pm\\sqrt2$。このとき $D=4$ で $\\mathrm{AH}^2=\\frac{2k^2}{4}=\\frac{k^2}{2}$、$\\mathrm{OH}^2=\\frac{2k^2}{4}=\\frac{k^2}{2}$。',
        after: 'ちなみに三角形 OAB の面積は、B が OA に平行な直線上を動くので $t$ によらず一定（$\\frac{k}{\\sqrt2}$）です。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '答案では、文字の範囲と「等号が成り立つこと」を書きます。とくに (4) は、最大値を実際にとる $t$ を示して初めて、条件が $\\frac{k^2}{4}<5$ と言えます。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)', text: '「H は直線 AB 上にあるから $\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+s\\overrightarrow{\\mathrm{AB}}$（$s$ は実数）」「OH ⊥ AB より内積は 0」' },
          { t: 'box', c: 'y', size: 'sm', label: '(2)', text: '「B ≠ O、B ≠ A なので角が定まる」。$t$ が存在する条件は「判別式 $\\ge0$」と書き、等号の場合もふくめる' },
          { t: 'box', c: 'p', size: 'sm', label: '(4)', text: '$X$ のとりうる範囲（$0\\le X<k^2$）を示し、「$X=\\frac{k^2}{2}$ は範囲内、$t=k\\pm\\sqrt2$ で最大」と書く' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂線の足は内積 0、角は内積の符号、面積の最大は 2 次式。空間ベクトルの基本の組み合わせでした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
