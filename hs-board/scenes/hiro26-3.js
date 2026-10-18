/* 2026 広島大 理系 第3問の類題（自作）：数学C 空間ベクトル ― 辺の長さだけで決まる四面体の、垂線の足と切り分けた体積
   元の問題はうつしていない（「辺の長さから内積と面積 → 垂線の足を2つのベクトルの1次結合で → 垂線の長さ →
   2頂点と垂線の足を通る平面で切った小さい方の体積（切り口が向かいの辺と交わる点を係数から出す）」というねらいと形式だけを合わせ、
   等面四面体ではなく、OB=AB・OC=AC の対称な面をもつ四面体と数値を自作した）。
   四面体 OABC：OA=6、OB=AB=5、OC=AC=7、BC=2√10（図の座標 O(0,0,0) A(6,0,0) B(3,−4,0) C(3,−2,6) で全辺を確認）
   答え（python3・sympy で検算ずみ）：
   (1) a·b=(36+25−25)/2=18、a·c=(36+49−49)/2=18、b·c=(25+49−40)/2=17、S=½√(36·25−18²)=12
   (2) CH·a=0 → 36s+18t=18、CH·b=0 → 18s+25t=17 → s=1/4、t=1/2（s,t>0、s+t<1 で H は △OAB の内部）
   (3) |CH|²=|c|²−s(a·c)−t(b·c)=49−9/2−17/2=36 → CH=6、四面体の体積 V=⅓·12·6=24
   (4) 直線 AH：a+λ(OH−a)=(1−¾λ)a+(λ/2)b、a の係数 0 → λ=4/3 → OK=⅔b、OK:KB=2:1 → 2つの部分は 16 と 8、小さい方 8
   別の見方：OA の中点 M で OH=(OM+OB)/2 → H は BM の中点。CM=√(49−9)=2√10=CB の二等辺三角形 CMB で、BM=4、CH=√(40−4)=6 */
(function () {
  // ---- 見取図（正射影）：画面の右＝R、画面の上＝U（B の側から 28° 見下ろす） ----
  const R = [0.97815, 0.20791, 0], U = [-0.09761, 0.45921, 0.88295];
  const pj = p => [p[0] * R[0] + p[1] * R[1] + p[2] * R[2], p[0] * U[0] + p[1] * U[1] + p[2] * U[2]];
  const O = pj([0, 0, 0]), A = pj([6, 0, 0]), B = pj([3, -4, 0]), C = pj([3, -2, 6]), H = pj([3, -2, 0]), K = pj([2, -8 / 3, 0]), Mm = pj([3, 0, 0]);
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const tetra = o => {
    o = o || {};
    const it = [
      { k: 'seg', a: O, b: A, c: 'w', wd: 2.5, dash: true },   // うしろの辺（見えない）
      { k: 'seg', a: O, b: B, c: 'w', wd: 3 }, { k: 'seg', a: A, b: B, c: 'w', wd: 3 },
      { k: 'seg', a: O, b: C, c: 'w', wd: 3 }, { k: 'seg', a: A, b: C, c: 'w', wd: 3 }, { k: 'seg', a: B, b: C, c: 'w', wd: 3 },
      { k: 'pt', at: O, name: 'O', dir: 'w', r: 5 }, { k: 'pt', at: A, name: 'A', dir: 'e', r: 5 },
      { k: 'pt', at: B, name: 'B', dir: 's', r: 5 }, { k: 'pt', at: C, name: 'C', dir: 'n', r: 5, c: 'b' }
    ];
    if (o.len) it.push(
      { k: 'label', at: mid(O, A), text: '6', dx: 26, dy: -12, c: 'y', size: 22 }, { k: 'label', at: mid(O, B), text: '5', dx: -16, dy: 12, c: 'y', size: 22 },
      { k: 'label', at: mid(A, B), text: '5', dx: 16, dy: 14, c: 'y', size: 22 }, { k: 'label', at: mid(O, C), text: '7', dx: -18, c: 'y', size: 22 },
      { k: 'label', at: mid(A, C), text: '7', dx: 18, c: 'y', size: 22 }, { k: 'label', at: mid(B, C), text: '2√10', dx: 34, dy: -30, c: 'y', size: 21 });
    if (o.base) it.push({ k: 'poly', pts: [O, A, B], close: true, fill: 'g', alpha: 0.16, c: 'g', wd: 0.1 });
    if (o.h) it.push({ k: 'seg', a: C, b: H, c: 'p', wd: 3, dash: true }, { k: 'pt', at: H, name: 'H', dir: 'e', r: 5, c: 'p' });
    if (o.cut) it.push({ k: 'poly', pts: [A, C, K], close: true, fill: 'y', alpha: 0.26, c: 'y', wd: 2.5 },
      { k: 'seg', a: A, b: K, c: 'y', wd: 2.5, dash: true }, { k: 'pt', at: K, name: 'K', dir: 'w', r: 5, c: 'y' });
    if (o.m) it.push({ k: 'pt', at: Mm, name: 'M', dir: 'n', r: 5, c: 'g' }, { k: 'seg', a: Mm, b: B, c: 'g', wd: 2.5, dash: true }, { k: 'seg', a: Mm, b: C, c: 'g', wd: 2.5, dash: true });
    return it;
  };
  const VIEW = [-0.7, -2.75, 6.6, 4.75];
  const fig = (id, o, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: Math.round((h || 430) * 7.3 / 7.5), h: h || 430, items: tetra(o) });   // 縦横比は VIEW にそろえる
  const DOT = [['', '$\\vec a$', '$\\vec b$', '$\\vec c$'], ['$\\vec a$', '$36$', '$18$', '$18$'], ['$\\vec b$', '$18$', '$25$', '$17$'], ['$\\vec c$', '$18$', '$17$', '$49$']];
  const POINTS = [
    '辺の長さ → 内積：$|\\vec b-\\vec a|^2=|\\vec a|^2-2\\vec a\\cdot\\vec b+|\\vec b|^2$ から $\\vec a\\cdot\\vec b$。内積の表を作っておく',
    '垂線の足 H：$\\overrightarrow{\\mathrm{OH}}=s\\vec a+t\\vec b$ とおき、$\\overrightarrow{\\mathrm{CH}}\\cdot\\vec a=0,\\ \\overrightarrow{\\mathrm{CH}}\\cdot\\vec b=0$ の連立方程式',
    '切り口が辺と交わる点は「直線 AH 上の点の **係数** で、$\\vec a$ の係数が 0」。体積の比は、高さが共通なら底面積の比'
  ];

  HB.lesson({
    id: 'hiro26-3', field: '広島大型　数学（理系）', title: '2026 広島大 理系 第3問の類題 ― 辺の長さで決まる四面体の垂線の足と、切り分けた体積', level: '2026年度 広島大学 理系 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '四面体 OABC において、$\\mathrm{OA}=6$、$\\mathrm{OB}=\\mathrm{AB}=5$、$\\mathrm{OC}=\\mathrm{AC}=7$、$\\mathrm{BC}=2\\sqrt{10}$ とする。また、$\\vec a=\\overrightarrow{\\mathrm{OA}}$、$\\vec b=\\overrightarrow{\\mathrm{OB}}$、$\\vec c=\\overrightarrow{\\mathrm{OC}}$ とする。',
      parts: [
        '(1)　内積 $\\vec a\\cdot\\vec b$、$\\vec a\\cdot\\vec c$、$\\vec b\\cdot\\vec c$ を求めよ。また、$\\triangle\\mathrm{OAB}$ の面積 $S$ を求めよ。',
        '(2)　頂点 C から平面 OAB に垂線 CH を下ろす。$\\overrightarrow{\\mathrm{OH}}=s\\vec a+t\\vec b$ をみたす実数 $s,\\ t$ の値を求めよ。',
        '(3)　線分 CH の長さを求めよ。',
        '(4)　3点 A, C, H を通る平面で四面体 OABC を2つの部分に分けるとき、小さい方の部分の体積を求めよ。'
      ],
      src: '※ 2026年度 広島大学 前期 理系 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '辺の長さだけが与えられた四面体です。座標はないので、すべてベクトルの内積で計算します。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえと方針 ----------
      { clear: true, part: '方針', say: '右は見取図です（OA はうしろの辺なので点線）。底面を △OAB、高さを CH と見ると、(1)〜(3) は「底面積 → 垂線の足 → 高さ」の順です。',
        add: [{ t: 'h', text: '読みかえと方針' },
          { t: 'box', c: 'b', size: 'sm', label: '流れ', text: '(1)　辺の長さ → 内積の表、底面 △OAB の面積\n(2)　H は平面 OAB 上：$\\overrightarrow{\\mathrm{OH}}=s\\vec a+t\\vec b$\n　　 CH ⊥ 平面：$\\overrightarrow{\\mathrm{CH}}\\cdot\\vec a=\\overrightarrow{\\mathrm{CH}}\\cdot\\vec b=0$\n(3)　CH の長さ　(4)　切り口と体積の比' },
          fig('f0', { len: true, h: true })] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。辺 AB は $\\vec b-\\vec a$ の大きさ。2乗して展開すると、内積 $\\vec a\\cdot\\vec b$ が出てきます。',
        add: [{ t: 'h', text: '(1)　辺の長さから内積' },
          { t: 'm', tex: '|\\vec b-\\vec a|^2=|\\vec a|^2-2\\,\\vec a\\cdot\\vec b+|\\vec b|^2' },
          { t: 'm', tex: '5^2=6^2-2\\,\\vec a\\cdot\\vec b+5^2' },
          fig('f1', { len: true, base: true }, 400)] },
      { ask: { type: 'choice', q: '$\\vec a\\cdot\\vec b$ の値は？',
        opts: ['$18$', '$43$', '$36$', '$30$'], ok: 0,
        why: { 1: '$-2\\vec a\\cdot\\vec b$ の符号を $+$ にしています。', 2: '$2\\vec a\\cdot\\vec b=36$ です。2 で割ります。', 3: '$|\\vec a||\\vec b|=30$ は、$\\vec a,\\ \\vec b$ が同じ向きのときだけ。$\\cos$ をかけ忘れています。' },
        good: '$2\\,\\vec a\\cdot\\vec b=36+25-25=36$ より $\\vec a\\cdot\\vec b=18$。',
        add: [{ t: 'm', tex: '\\vec a\\cdot\\vec b=\\frac{36+25-25}{2}=18' }] } },
      { clear: true, say: '同じように、AC と BC から残りの内積を出し、表にまとめます。この表が (2)(3) の計算の道具になります。',
        add: [{ t: 'h', text: '(1)　つづき：内積の表と面積' },
          { t: 'm', size: 'sm', tex: '\\vec a\\cdot\\vec c=\\frac{36+49-49}{2}=18,\\qquad \\vec b\\cdot\\vec c=\\frac{25+49-40}{2}=17' },
          { t: 'tbl', col: 1, rows: DOT }] },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{OAB}$ の面積 $S=\\dfrac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$ は？',
        opts: ['$15$', '$24$', '$12$', '$\\dfrac{21\\sqrt2}{2}$'], ok: 2,
        why: { 0: '$\\frac12\\cdot6\\cdot5$ は ∠AOB が直角のときの面積です。', 1: '根号の値 24 のまま。$\\frac12$ をかけます。', 3: '$(\\vec a\\cdot\\vec b)^2=324$ を、2乗せずに 18 で計算しています。' },
        good: '$\\dfrac12\\sqrt{36\\cdot25-18^2}=\\dfrac12\\sqrt{576}=12$。OB=AB の二等辺三角形で、高さ 4 と見ても $\\frac12\\cdot6\\cdot4=12$。',
        add: [{ t: 'ans', label: '(1) 答', text: '$\\vec a\\cdot\\vec b=18,\\ \\ \\vec a\\cdot\\vec c=18,\\ \\ \\vec b\\cdot\\vec c=17$\n$S=\\dfrac12\\sqrt{900-324}=12$' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。H は平面 OAB 上なので $\\overrightarrow{\\mathrm{OH}}=s\\vec a+t\\vec b$。CH が平面に垂直 ⇔ 平面上の平行でない2つのベクトル $\\vec a,\\ \\vec b$ の両方に垂直。',
        add: [{ t: 'h', text: '(2)　垂線の足 H' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{CH}}=s\\vec a+t\\vec b-\\vec c' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{CH}}\\cdot\\vec a=0,\\qquad \\overrightarrow{\\mathrm{CH}}\\cdot\\vec b=0' },
          fig('f2', { h: true, base: true }, 310),
          { t: 'tbl', col: 1, size: 'sm', rows: DOT }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{CH}}\\cdot\\vec a=0$ を $s,\\ t$ の式にすると？',
        opts: ['$36s+18t=0$', '$36s+25t=18$', '$18s+36t=18$', '$36s+18t=18$'], ok: 3,
        why: { 0: '$-\\vec c\\cdot\\vec a=-18$ を落としています。', 1: '$t$ の係数は $\\vec b\\cdot\\vec a=18$。$|\\vec b|^2$ ではありません。', 2: '$s$ の係数は $|\\vec a|^2=36$、$t$ の係数は $\\vec a\\cdot\\vec b=18$。逆です。' },
        good: '$s|\\vec a|^2+t\\,\\vec a\\cdot\\vec b-\\vec a\\cdot\\vec c=36s+18t-18=0$。両辺を 18 で割ると $2s+t=1$。',
        add: [{ t: 'm', tex: '\\begin{cases} 36s+18t=18\\\\ 18s+25t=17\\end{cases}', note: '2行目は $\\overrightarrow{\\mathrm{CH}}\\cdot\\vec b=0$' }] } },
      { ask: { type: 'think', q: 'この連立方程式を解いて、$s,\\ t$ を求めよう。',
        hint: '1つ目の式は $2s+t=1$。$t=1-2s$ を2つ目に代入する。',
        ans: '$s=\\dfrac14,\\quad t=\\dfrac12$',
        after: '$-32s=-8$ より $s=\\frac14$。$s,\\ t>0,\\ s+t=\\frac34<1$ なので H は △OAB の内部。',
        add: [{ t: 'ans', label: '(2) 答', tex: 's=\\frac14,\\qquad t=\\frac12' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$|\\overrightarrow{\\mathrm{CH}}|^2$ を展開してもよいですが、(2) の垂直の式を使うと短くなります。',
        add: [{ t: 'h', text: '(3)　垂線 CH の長さ' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{CH}}|^2=\\overrightarrow{\\mathrm{CH}}\\cdot(s\\vec a+t\\vec b-\\vec c)=-\\overrightarrow{\\mathrm{CH}}\\cdot\\vec c', note: '$\\overrightarrow{\\mathrm{CH}}\\cdot\\vec a=\\overrightarrow{\\mathrm{CH}}\\cdot\\vec b=0$' },
          { t: 'm', size: 'sm', tex: '=|\\vec c|^2-s\\,\\vec a\\cdot\\vec c-t\\,\\vec b\\cdot\\vec c' },
          fig('f3', { h: true, base: true }, 400)] },
      { ask: { type: 'choice', q: '$|\\vec c|^2=49$、$\\vec a\\cdot\\vec c=18$、$\\vec b\\cdot\\vec c=17$、$s=\\frac14$、$t=\\frac12$。CH の長さは？',
        opts: ['$6$', '$\\sqrt{14}$', '$36$', '$2\\sqrt{10}$'], ok: 0,
        why: { 1: '$s,\\ t$ をかけ忘れて $49-18-17$ としています。', 2: 'それは $\\mathrm{CH}^2$。最後に平方根をとります。', 3: 'それは辺 BC の長さ。CH は C から平面までの最短の長さです。' },
        good: '$49-\\dfrac{18}{4}-\\dfrac{17}{2}=49-13=36$ なので $\\mathrm{CH}=6$。',
        add: [{ t: 'm', tex: '\\mathrm{CH}^2=49-\\frac92-\\frac{17}{2}=36' }] } },
      { say: '(3) の答えです。ついでに四面体全体の体積も出しておきます。底面積 12、高さ 6 で $V=\\frac13\\cdot12\\cdot6=24$。(4) で使います。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\mathrm{CH}=6' },
          { t: 'm', tex: 'V_{\\mathrm{OABC}}=\\frac13\\cdot12\\cdot6=24', note: '四面体全体' }] },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。平面 ACH は直線 AH をふくみます。直線 AH は底面の中で辺 OB と交わり、その点を K とすると、切り口は △ACK です。',
        add: [{ t: 'h', text: '(4)　切り口と辺 OB の交点 K' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OK}}=\\vec a+\\lambda(\\overrightarrow{\\mathrm{OH}}-\\vec a)=\\Big(1-\\frac34\\lambda\\Big)\\vec a+\\frac{\\lambda}{2}\\vec b', note: 'K は直線 AH 上' },
          fig('f4', { h: true, cut: true }, 400)] },
      { ask: { type: 'choice', q: 'K は辺 OB 上にもある（$\\vec a$ の係数が 0）。OK : KB は？',
        opts: ['$1:2$', '$2:1$', '$1:1$', '$3:1$'], ok: 1,
        why: { 0: '$\\overrightarrow{\\mathrm{OK}}=\\frac23\\vec b$ なので、O から 3 分の 2 の所。逆です。', 2: '$\\lambda=\\frac43$ から $\\frac{\\lambda}{2}=\\frac23$。中点ではありません。', 3: '$\\frac34$ は $\\lambda$ の係数で、比とは関係ありません。' },
        good: '$1-\\frac34\\lambda=0$ より $\\lambda=\\frac43$、$\\overrightarrow{\\mathrm{OK}}=\\frac23\\vec b$。OK : KB $=2:1$ です。',
        add: [{ t: 'm', tex: '\\lambda=\\frac43,\\qquad \\overrightarrow{\\mathrm{OK}}=\\frac23\\vec b' }] } },
      { clear: true, say: '2つの部分は、四面体 C-OAK と C-KAB。どちらも頂点が C、底面が平面 OAB 上なので、**高さ CH が共通**。体積の比は底面積の比です。',
        add: [{ t: 'h', text: '(4)　つづき：体積の比' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{OAK}:\\triangle\\mathrm{KAB}=\\mathrm{OK}:\\mathrm{KB}=2:1', note: 'A からの高さが共通' },
          fig('f5', { h: true, cut: true }, 400)] },
      { ask: { type: 'choice', q: '小さい方の部分（四面体 C-KAB）の体積は？（四面体全体は 24）',
        opts: ['$16$', '$12$', '$8$', '$\\dfrac83$'], ok: 2,
        why: { 0: 'それは大きい方（C-OAK）の体積です。', 1: 'K は OB の中点ではありません。2 : 1 に分けます。', 3: '$24\\times\\frac13=8$ に、さらに $\\frac13$ をかけています。錐の $\\frac13$ は V にもう入っています。' },
        good: '$24\\times\\dfrac{1}{2+1}=8$。大きい方は 16 です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '24\\times\\frac13=8' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '別の見方です。OC=AC、OB=AB なので、四面体は「OA の中点 M と B, C を通る平面」について対称。H はこの平面の上にあるはずです。',
        add: [{ t: 'h', text: '別の見方：対称な面' },
          { t: 'p', size: 'sm', text: 'OA の中点を M とすると　$\\overrightarrow{\\mathrm{OM}}=\\dfrac12\\vec a$' },
          fig('f6', { m: true, h: true }, 400)] },
      { ask: { type: 'think', q: '$\\overrightarrow{\\mathrm{OH}}=\\dfrac14\\vec a+\\dfrac12\\vec b$ を $\\overrightarrow{\\mathrm{OM}},\\ \\overrightarrow{\\mathrm{OB}}$ で表すと、H はどんな点？',
        hint: '$\\dfrac14\\vec a=\\dfrac12\\overrightarrow{\\mathrm{OM}}$。',
        ans: '$\\overrightarrow{\\mathrm{OH}}=\\dfrac{\\overrightarrow{\\mathrm{OM}}+\\overrightarrow{\\mathrm{OB}}}{2}$ なので、**H は線分 BM の中点**',
        after: '実は $\\mathrm{CM}=\\sqrt{7^2-3^2}=2\\sqrt{10}=\\mathrm{CB}$。二等辺三角形 CMB の頂点 C から底辺 BM（長さ 4）に下ろした垂線の足だから中点、と図形でも説明できます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{CH}=\\sqrt{\\mathrm{CB}^2-\\mathrm{BH}^2}=\\sqrt{40-4}=6', note: 'BM=4，BH=2' }] } },
      { say: '答案のポイントです。内積の表を作れば、(2)(3) はその表の数を入れるだけ。H が三角形の内部にあることも一言そえると、(4) の図が正しいと言えます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案で書くこと', text: '・「$\\vec a,\\ \\vec b$ は平行でないので、CH ⊥ 平面 OAB ⇔ $\\overrightarrow{\\mathrm{CH}}\\cdot\\vec a=\\overrightarrow{\\mathrm{CH}}\\cdot\\vec b=0$」\n・$s,\\ t>0,\\ s+t<1$ → H は △OAB の内部\n・K は直線 AH 上（$\\overrightarrow{\\mathrm{OK}}=(1-\\lambda)\\vec a+\\lambda\\overrightarrow{\\mathrm{OH}}$）かつ OB 上（$\\vec a$ の係数 0）' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。座標がなくても、辺の長さ → 内積の表 があれば、空間の四面体はほとんど計算できます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
