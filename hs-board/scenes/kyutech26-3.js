/* 九工大型 数学：2026年度 九州工業大学 前期 第3問の類題（自作問題・元の問題ではない）
   問題：四面体 OABC、OA⊥BC、OB⊥CA、OA=3。O から平面 ABC への垂線の足 H が HA+2HB+3HC=0 をみたす。
   答え（python3・sympy で検算ずみ。具体的な座標 A(−2,0,0) B(1,0,0) C(0,2,0) O(0,1,2) H(0,1,0) でも確認）：
     (1) OH = (a+2b+3c)/6
     (2) OH = (1/2)c + (1/2)(a+2b)/3 → Q=(a+2b)/3、AQ:QB = 2:1、CH:HQ = 1:1
     (3) a·(c−b)=0, b·(a−c)=0 → b·c = c·a = k
     (4) OH·AB = 0：2|b|² − k − 9 = 0 → |b|² = (k+9)/2、OH·AC = 0：3|c|² − 2k − 9 = 0 → |c|² = (2k+9)/3
     (5) |OH|² = OH·a = (9+5k)/6 = 4 → k = 3（|b|²=6, |c|²=5、グラム行列式 144>0 で四面体は存在）
         |AB|²=9, |AC|²=8, AB·AC=6 → △ABC=3、△HAB=3/2、V(OHAB)=(1/3)(3/2)(2)=1（V(OABC)=2）
     別の見方：OC⊥AB も成り立ち、H は △ABC の垂心（tan A : tan B : tan C = 1 : 2 : 3） */
(function () {
  // 見取図の座標（X：手前、Y：右、Z：上）。底面 ABC は Z=0
  const V3 = { A: [0, -2, 0], B: [0, 1, 0], C: [2, 0, 0], Q: [0, 0, 0], H: [1, 0, 0], O: [1, 0, 2] };
  const pj = v => [v[1] - 0.55 * v[0], v[2] - 0.5 * v[0]];
  const P = {}; Object.keys(V3).forEach(k => { P[k] = pj(V3[k]); });
  const tet = (id, o, size) => {
    o = o || {};
    const W = size || 520, view = [-2.4, -1.4, 1.55, 1.85];
    const it = [
      { k: 'poly', pts: [P.A, P.C, P.B], close: false, fill: 'g', alpha: 0.1, noStroke: true },
      { k: 'seg', a: P.A, b: P.B, c: 'w', wd: 2, dash: true },
      { k: 'seg', a: P.A, b: P.C, c: 'w', wd: 3 }, { k: 'seg', a: P.C, b: P.B, c: 'w', wd: 3 },
      { k: 'seg', a: P.O, b: P.A, c: 'w', wd: 3 }, { k: 'seg', a: P.O, b: P.B, c: 'w', wd: 3 }, { k: 'seg', a: P.O, b: P.C, c: 'w', wd: 3 }
    ];
    if (o.H) it.push({ k: 'seg', a: P.O, b: P.H, c: 'p', wd: 3, dash: true }, { k: 'pt', at: P.H, name: 'H', dir: 'e', c: 'p', size: 22 });
    if (o.Q) it.push({ k: 'seg', a: P.C, b: P.Q, c: 'y', wd: 2.5, dash: true }, { k: 'pt', at: P.Q, name: 'Q', dir: 'ne', c: 'y', size: 22 });
    it.push({ k: 'pt', at: P.O, name: 'O', dir: 'n', size: 22 }, { k: 'pt', at: P.A, name: 'A', dir: 'w', size: 22 },
      { k: 'pt', at: P.B, name: 'B', dir: 'e', size: 22 }, { k: 'pt', at: P.C, name: 'C', dir: 'sw', size: 22 });
    return { t: 'fig', id, col: 1, view, w: W, h: Math.round(W * (view[3] - view[1]) / (view[2] - view[0])), items: it.concat(o.extra || []) };
  };
  // 底面 ABC を真上から見た図（平面の座標：Q が原点、AB が横軸）
  const base = (id, extra) => ({ t: 'fig', id, col: 1, view: [-2.6, -0.65, 1.7, 2.55], w: 470, h: 350, items: [
    { k: 'poly', pts: [[-2, 0], [1, 0], [0, 2]], close: true, c: 'w', wd: 3, fill: 'g', alpha: 0.1 },
    { k: 'seg', a: [0, 2], b: [0, 0], c: 'y', wd: 2.5, dash: true }, { k: 'right', o: [0, 0], a: [1, 0], b: [0, 2], s: 14 },
    { k: 'pt', at: [-2, 0], name: 'A', dir: 'w', size: 22 }, { k: 'pt', at: [1, 0], name: 'B', dir: 'e', size: 22 }, { k: 'pt', at: [0, 2], name: 'C', dir: 'n', size: 22 },
    { k: 'pt', at: [0, 0], name: 'Q', dir: 's', c: 'y', size: 22 }, { k: 'pt', at: [0, 1], name: 'H', dir: 'e', c: 'p', size: 22 },
    { k: 'label', at: [-1, 0], text: '2', dy: 22, c: 'y', size: 22 }, { k: 'label', at: [0.5, 0], text: '1', dy: 22, c: 'y', size: 22 }].concat(extra || []) });
  const POINTS = [
    '重みつきの式 $\\overrightarrow{\\mathrm{HA}}+2\\overrightarrow{\\mathrm{HB}}+3\\overrightarrow{\\mathrm{HC}}=\\vec0$ は、始点を O にそろえて $\\overrightarrow{\\mathrm{OH}}$ について解く。交点の比は「2つずつ組にして内分の形」に直して読む',
    '垂直は内積 0。「平面に垂直」は、平面上の 2 本（$\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{AC}}$）との内積がどちらも 0',
    '$\\mathrm{OH}\\perp\\mathrm{HA}$ から $|\\overrightarrow{\\mathrm{OH}}|^2=\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{OA}}$。未知の内積を 1 つの文字 $k$ にまとめ、長さの条件で $k$ を決める'
  ];

  HB.lesson({
    id: 'kyutech26-3', field: '九工大型　数学', title: '2026 九工大 第3問の類題 ― 向かい合う辺が垂直な四面体と垂線の足', level: '2026年度 九州工業大学 前期 第3問の類題（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '四面体 OABC において、$\\mathrm{OA}\\perp\\mathrm{BC}$，$\\mathrm{OB}\\perp\\mathrm{CA}$，$\\mathrm{OA}=3$ とする。O から平面 ABC に下ろした垂線と平面 ABC の交点を H とすると、H は $\\overrightarrow{\\mathrm{HA}}+2\\overrightarrow{\\mathrm{HB}}+3\\overrightarrow{\\mathrm{HC}}=\\vec0$ をみたす。$\\vec a=\\overrightarrow{\\mathrm{OA}}$，$\\vec b=\\overrightarrow{\\mathrm{OB}}$，$\\vec c=\\overrightarrow{\\mathrm{OC}}$ とする。',
      parts: [
        '(1)　$\\overrightarrow{\\mathrm{OH}}$ を $\\vec a,\\ \\vec b,\\ \\vec c$ を用いて表せ。',
        '(2)　直線 CH と辺 AB の交点を Q とする。AQ : QB と CH : HQ を求めよ。',
        '(3)　$\\vec a\\cdot\\vec b=k$ とおく。$\\vec b\\cdot\\vec c$，$\\vec c\\cdot\\vec a$ を $k$ で表せ。',
        '(4)　$|\\vec b|^2$，$|\\vec c|^2$ を $k$ で表せ。',
        '(5)　$|\\overrightarrow{\\mathrm{OH}}|=2$ のとき、$k$ の値と、四面体 OHAB の体積を求めよ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの問題です。四面体の頂点から底面に下ろした垂線の足 H を、ベクトルで調べます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '条件を、ベクトルの式に読みかえておきます。「垂直」はすべて内積 0、「H は平面 ABC 上」は H の式の係数の和が 1、が基本です。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'box', c: 'y', size: 'sm', label: '垂直の条件', text: '$\\mathrm{OA}\\perp\\mathrm{BC}$ ⇔ $\\vec a\\cdot(\\vec c-\\vec b)=0$\n$\\mathrm{OB}\\perp\\mathrm{CA}$ ⇔ $\\vec b\\cdot(\\vec a-\\vec c)=0$' },
          { t: 'box', c: 'p', size: 'sm', label: '垂線の足 H', text: '$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AB}}$ かつ $\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AC}}$' },
          { t: 'p', size: 'sm', text: '(1)(2) は H の「位置」、(3)〜(5) は「長さと内積」の問題' },
          tet('f0', { H: true })] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。始点を O にそろえます。$\\overrightarrow{\\mathrm{OH}}=\\vec h$ とおくと、$\\overrightarrow{\\mathrm{HA}}=\\vec a-\\vec h$ のように書けます。',
        add: [{ t: 'h', text: '(1)　OH を a, b, c で表す' },
          { t: 'm', tex: '(\\vec a-\\vec h)+2(\\vec b-\\vec h)+3(\\vec c-\\vec h)=\\vec0' },
          tet('f1', { H: true })] },
      { ask: { type: 'choice', q: '$\\vec h=\\overrightarrow{\\mathrm{OH}}$ について解くと？',
        opts: ['$\\dfrac{3\\vec a+2\\vec b+\\vec c}{6}$', '$\\dfrac{\\vec a+2\\vec b+3\\vec c}{6}$', '$\\dfrac{\\vec a+2\\vec b+3\\vec c}{3}$', '$\\vec a+2\\vec b+3\\vec c$'], ok: 1,
        why: { 0: '係数が逆です。HA の係数 1 は $\\vec a$ に、HC の係数 3 は $\\vec c$ にかかります。', 2: '$\\vec h$ は $1+2+3=6$ 個分あります。3 ではなく 6 で割ります。', 3: '$6\\vec h$ を移項したあと、6 で割るのを忘れています。' },
        good: '$\\vec a+2\\vec b+3\\vec c-6\\vec h=\\vec0$。係数の和 $\\frac16+\\frac26+\\frac36=1$ なので、H はたしかに平面 ABC 上です。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac{\\vec a+2\\vec b+3\\vec c}{6}' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。Q は直線 CH と AB の交点。そこで、$\\vec a$ と $\\vec b$ の項を 1 つにまとめ、「C と AB 上の点の内分」の形に直します。',
        add: [{ t: 'h', text: '(2)　直線 CH と辺 AB の交点 Q' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac36\\vec c+\\frac36\\cdot\\frac{\\vec a+2\\vec b}{3}=\\frac12\\vec c+\\frac12\\cdot\\frac{\\vec a+2\\vec b}{3}' },
          { t: 'p', size: 'sm', text: '$\\dfrac{\\vec a+2\\vec b}{3}$ は係数の和が 1 なので、直線 AB 上の点' },
          tet('f2', { H: true, Q: true })] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{OQ}}=\\dfrac{\\vec a+2\\vec b}{3}$ のとき、AQ : QB は？',
        opts: ['1 : 2', '2 : 1', '1 : 3', '2 : 3'], ok: 1,
        why: { 0: 'よくあるまちがい。$\\dfrac{n\\vec a+m\\vec b}{m+n}$ は AB を $m:n$ に内分します。係数は「反対側」の比です。', 2: '分母の 3 は全体です。比は係数どうしで見ます。', 3: '分母の 3 は全体です。比は係数どうしで見ます。' },
        good: '$\\vec b$ の係数が大きい（2）ほど、Q は B に近い。だから AQ : QB $=2:1$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac{\\overrightarrow{\\mathrm{OC}}+\\overrightarrow{\\mathrm{OQ}}}{2}', note: 'H は CQ の中点' }] } },
      { say: 'H は線分 CQ の中点なので、CH : HQ $=1:1$ です。図でも、黄色の点線 CQ のまん中に H があります。',
        add: [{ t: 'ans', label: '(2) 答', text: 'AQ : QB $=2:1$，　CH : HQ $=1:1$' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。2 つの「辺が垂直」という条件を内積で書きます。ねじれの位置にある辺どうしでも、垂直なら方向ベクトルの内積は 0 です。',
        add: [{ t: 'h', text: '(3)　内積をそろえる' },
          { t: 'box', c: 'b', size: 'sm', label: '条件', text: '$\\mathrm{OA}\\perp\\mathrm{BC}$，$\\mathrm{OB}\\perp\\mathrm{CA}$' },
          tet('f3', { extra: [{ k: 'seg', a: P.O, b: P.A, c: 'y', wd: 4 }, { k: 'seg', a: P.C, b: P.B, c: 'y', wd: 4 }] })] },
      { ask: { type: 'choice', q: '$\\mathrm{OA}\\perp\\mathrm{BC}$ を内積の式にすると？',
        opts: ['$\\vec a\\cdot\\vec b=\\vec a\\cdot\\vec c=0$', '$\\vec b\\cdot\\vec c=0$', '$\\vec a\\cdot(\\vec c-\\vec b)=0$', '$(\\vec b-\\vec a)\\cdot(\\vec c-\\vec a)=0$'], ok: 2,
        why: { 0: '$\\vec a$ が $\\vec b$ や $\\vec c$ と垂直とは言っていません。', 1: 'それは $\\mathrm{OB}\\perp\\mathrm{OC}$ の式です。', 3: 'それは $\\mathrm{AB}\\perp\\mathrm{AC}$ の式です。' },
        good: '$\\overrightarrow{\\mathrm{BC}}=\\vec c-\\vec b$ なので $\\vec a\\cdot(\\vec c-\\vec b)=0$、つまり $\\vec a\\cdot\\vec c=\\vec a\\cdot\\vec b$。',
        add: [{ t: 'm', size: 'sm', tex: '\\vec a\\cdot(\\vec c-\\vec b)=0\\ \\Rightarrow\\ \\vec c\\cdot\\vec a=\\vec a\\cdot\\vec b=k' },
          { t: 'm', size: 'sm', tex: '\\vec b\\cdot(\\vec a-\\vec c)=0\\ \\Rightarrow\\ \\vec b\\cdot\\vec c=\\vec a\\cdot\\vec b=k' }],
        draw: [{ fig: 'f3', items: [{ k: 'seg', a: P.O, b: P.B, c: 'b', wd: 4 }, { k: 'seg', a: P.C, b: P.A, c: 'b', wd: 4 }] }] } },
      { say: '3 つの内積が、すべて同じ $k$ になりました。未知の内積が 1 文字にまとまったので、あとの計算がぐっと楽になります。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\vec b\\cdot\\vec c=k,\\qquad \\vec c\\cdot\\vec a=k' }] },
      { ask: { type: 'think', q: '3 組目の向かい合う辺 OC と AB も垂直であることを示そう。',
        hint: '$\\vec c\\cdot(\\vec b-\\vec a)$ を (3) の結果で計算する。',
        ans: '$\\vec c\\cdot(\\vec b-\\vec a)=\\vec b\\cdot\\vec c-\\vec c\\cdot\\vec a=k-k=0$ より　$\\mathrm{OC}\\perp\\mathrm{AB}$',
        after: '向かい合う辺の 2 組が垂直なら、残りの 1 組も自動的に垂直。このような四面体では、H は △ABC の垂心になります（最後に確かめます）。' } },

      // ---------- (4) ----------
      { clear: true, cols: [0.6, 0.4], part: '(4)', say: '(4) です。H は垂線の足なので $\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AB}}$。(1) の式と (3) の内積を使って展開します。$|\\vec a|^2=9$ です。',
        add: [{ t: 'h', text: '(4)　垂直の条件で長さを k で表す' },
          { t: 'm', size: 'sm', tex: '6\\,\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=(\\vec a+2\\vec b+3\\vec c)\\cdot(\\vec b-\\vec a)=0' },
          { t: 'box', c: 'b', size: 'sm', label: '使う値', text: '$|\\vec a|^2=9$，$\\vec a\\cdot\\vec b=\\vec b\\cdot\\vec c=\\vec c\\cdot\\vec a=k$' }] },
      { ask: { type: 'choice', q: '$(\\vec a+2\\vec b+3\\vec c)\\cdot(\\vec b-\\vec a)$ を $|\\vec b|^2$ と $k$ で表すと？',
        opts: ['$2|\\vec b|^2+k-9$', '$2|\\vec b|^2-9$', '$2|\\vec b|^2-3k-9$', '$2|\\vec b|^2-k-9$'], ok: 3,
        why: { 0: '$2\\vec b\\cdot(-\\vec a)=-2k$ を落としています。全部で 6 つの項があります。', 1: '内積 $\\vec a\\cdot\\vec b$ などは 0 ではなく $k$ です。', 2: '$3\\vec c\\cdot\\vec b$ と $-3\\vec c\\cdot\\vec a$ は打ち消し合います。' },
        good: '$k-9+2|\\vec b|^2-2k+3k-3k=2|\\vec b|^2-k-9$。これが 0 なので $|\\vec b|^2=\\dfrac{k+9}{2}$。',
        add: [{ t: 'm', size: 'sm', tex: '2|\\vec b|^2-k-9=0\\quad\\therefore\\ |\\vec b|^2=\\frac{k+9}{2}' }] } },
      { say: '同じように $\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AC}}$ から、$(\\vec a+2\\vec b+3\\vec c)\\cdot(\\vec c-\\vec a)=3|\\vec c|^2-2k-9=0$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'k-9+2k-2k+3|\\vec c|^2-3k=3|\\vec c|^2-2k-9=0' },
          { t: 'ans', label: '(4) 答', tex: '|\\vec b|^2=\\frac{k+9}{2},\\qquad |\\vec c|^2=\\frac{2k+9}{3}' }] },

      // ---------- (5) k ----------
      { clear: true, part: '(5)', say: '(5) です。$|\\overrightarrow{\\mathrm{OH}}|^2$ をそのまま展開してもよいのですが、もっと速い方法があります。直角三角形 OHA に注目します。',
        add: [{ t: 'h', text: '(5)　|OH| = 2 から k を決める' },
          tet('f5', { H: true, extra: [{ k: 'seg', a: P.H, b: P.A, c: 'g', wd: 2.5, dash: true }, { k: 'right', o: P.H, a: P.O, b: P.A, s: 14, c: 'g' }] })] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{OH}}|^2=\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{OA}}$ が成り立つ理由は？',
        opts: ['$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{HA}}$ だから', '$\\mathrm{OH}=\\mathrm{OA}$ だから', '$\\overrightarrow{\\mathrm{OH}}\\parallel\\overrightarrow{\\mathrm{OA}}$ だから', 'H が △ABC の重心だから'], ok: 0,
        why: { 1: '$\\mathrm{OA}=3,\\ \\mathrm{OH}=2$ で、長さは等しくありません。', 2: '平行なら H は直線 OA 上。H は平面 ABC 上の別の点です。', 3: 'H は重心ではありません（重みが 1 : 2 : 3 で、等しくない）。' },
        good: '$\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{HA}}=\\overrightarrow{\\mathrm{OH}}\\cdot(\\overrightarrow{\\mathrm{OA}}-\\overrightarrow{\\mathrm{OH}})=0$ を移項した形です。',
        add: [{ t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OH}}|^2=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec a=\\frac{|\\vec a|^2+2\\vec a\\cdot\\vec b+3\\vec a\\cdot\\vec c}{6}=\\frac{9+5k}{6}' }] } },
      { say: '$|\\overrightarrow{\\mathrm{OH}}|^2=4$ なので $9+5k=24$、$k=3$。このとき (4) から $|\\vec b|^2=6$、$|\\vec c|^2=5$ と、すべての長さと内積が決まりました。',
        add: [{ t: 'm', tex: '\\frac{9+5k}{6}=4\\quad\\therefore\\ k=3' },
          { t: 'p', size: 'sm', text: '$|\\vec a|^2=9$，$|\\vec b|^2=6$，$|\\vec c|^2=5$，内積はすべて $3$' }] },

      // ---------- (5) 体積 ----------
      { clear: true, cols: [0.6, 0.4], part: '(5) 体積', say: '四面体 OHAB は、底面を △HAB、高さを OH $=2$ と見ます。(2) で H は CQ の中点だったので、△HAB は △CAB の半分です。',
        add: [{ t: 'h', text: '(5)　四面体 OHAB の体積' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|^2=|\\vec b-\\vec a|^2=6-6+9=9' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AC}}|^2=|\\vec c-\\vec a|^2=5-6+9=8' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=k-k-k+9=6' }] },
      { ask: { type: 'choice', q: '△ABC の面積は？',
        opts: ['$6$', '$3\\sqrt2$', '$3\\sqrt3$', '$3$'], ok: 3,
        why: { 0: '$\\dfrac12$ を忘れています。', 1: '$\\dfrac12|\\overrightarrow{\\mathrm{AB}}||\\overrightarrow{\\mathrm{AC}}|$ は直角三角形のときだけ。内積の分を引きます。', 2: '根号の中は「引く」です：$9\\cdot8-6^2$。' },
        good: '$\\dfrac12\\sqrt{|\\overrightarrow{\\mathrm{AB}}|^2|\\overrightarrow{\\mathrm{AC}}|^2-(\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}})^2}=\\dfrac12\\sqrt{72-36}=3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABC}=\\frac12\\sqrt{9\\cdot8-6^2}=3,\\quad \\triangle\\mathrm{HAB}=\\frac12\\cdot3=\\frac32' }] } },
      { say: '体積は $\\dfrac13\\times$（底面積）$\\times$（高さ）。四面体 OABC の体積 $\\dfrac13\\cdot3\\cdot2=2$ のちょうど半分です。',
        add: [{ t: 'ans', label: '(5) 答', text: '$k=3$，　四面体 OHAB の体積 $=\\dfrac13\\cdot\\dfrac32\\cdot2=1$' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.55, 0.45], part: '別の見方', say: '底面を真上から見てみます。$\\mathrm{OC}\\perp\\mathrm{AB}$ と $\\mathrm{OH}\\perp\\mathrm{AB}$ から、平面 OCH は AB に垂直。だから CQ は △ABC の高さの線で、H は垂心です。',
        add: [{ t: 'h', text: '別の見方：底面 ABC を真上から' },
          { t: 'p', size: 'sm', text: 'AB $=3$，AQ $=2$，QB $=1$\nCQ$^2=\\mathrm{AC}^2-\\mathrm{AQ}^2=8-4=4$ より CQ $=2$' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABC}=\\frac12\\cdot3\\cdot2=3', note: '内積の計算と一致' },
          base('b1')] },
      { say: '答案では、「垂直 → 内積 0」を条件ごとに 1 行ずつ書き、$k$ の 1 文字で表す流れを見せると、採点者に伝わりやすくなります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(2) は「係数の和が 1」で直線 AB 上と言ってから比を読む\n・(4) は $\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$，$\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0$ の 2 本\n・(5) は底面積と高さ（OH ⊥ 平面）をはっきり書く' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。位置は「係数の読みかえ」、長さは「内積を 1 文字に」が、空間ベクトルの典型の方針でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
