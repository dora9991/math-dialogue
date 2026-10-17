/* 九大型（理系）2025 第1問の類題（自作）：数学C 空間ベクトル ― 直線上を動く点から、2つのベクトルに垂直な向きに進んで xy 平面に当たる点と、原点からの距離の最小値
   元の問題はうつしていない（「直線上の点から2つのベクトルの両方に垂直な向きに進み、座標平面との交点を求める」「その交点と原点の距離の最小値が一定以下になる文字の条件を、平方完成で求める」というねらいと形式だけを合わせた自作問題）。
   u=(1,0,1)、v=(0,1,−2)、ℓ：A(0,2,a)＋t(1,1,1)。
   (1) n=(−1,2,1)（n=(p,q,r) とおくと p=−r, q=2r なので、垂直な向きは1つに決まる）
   (2) Q＝P＋s n、z＝0 より s=−(a+t)、Q(a+2t, 2−2a−t, 0)
   (3) OQ²＝5t²+(8a−4)t+5a²−8a+4＝5(t−(2−4a)/5)²+(3a−4)²/5 → 最小値 |3a−4|/√5 ≦ √5 ⇔ −1/3 ≦ a ≦ 3
   別の見方：Q は xy 平面の直線 x+2y=4−3a 上を動く。最小値＝原点からこの直線までの距離。a=3 のとき Q(−1,−2,0)（t=−2）。
   python3（sympy）で検算ずみ（誤答の値も）。 */
(function () {
  const POINTS = [
    '2つのベクトルの両方に垂直なベクトルは、$\\vec n=(p,\\ q,\\ r)$ とおいて **内積 $=0$ の2式** から。比が決まるので、向きは1つ',
    '直線上の点は実数 $s$ で $\\overrightarrow{\\mathrm{OP}}+s\\vec n$。「$xy$ 平面上 ⇔ $z$ 座標 $=0$」で $s$ が決まる',
    '距離の最小は **2乗して $t$ の2次式** → 平方完成。$t$ がすべての実数を動くことを書き、$\\sqrt{\\ }$ をとるときは絶対値'
  ];
  // 見取図（x 軸を左下へ）。図は a=0、t=3/2 の場合：A(0, 2, 0)、P(3/2, 7/2, 3/2)、Q(3, 1/2, 0)
  const pj = (x, y, z) => [y - 0.45 * x, z - 0.38 * x];
  const P3 = pj(1.5, 3.5, 1.5), Q3 = pj(3, 0.5, 0), N3 = pj(1.15, 4.2, 1.85), O3 = pj(0, 0, 0), A3 = pj(0, 2, 0);
  const VIEW3 = [-2.3, -1.6, 4.9, 2.0];
  const space = (id, extra, h) => ({ t: 'fig', id, col: 1, view: VIEW3, w: Math.round((h || 300) * 7.2 / 3.6), h: h || 300, items: [
    { k: 'poly', pts: [pj(-0.3, -0.5, 0), pj(3.4, -0.5, 0), pj(3.4, 4.2, 0), pj(-0.3, 4.2, 0)], close: true, fill: 'b', alpha: 0.12, c: 'd', wd: 1.5 },
    { k: 'label', at: pj(3.0, 3.7, 0), text: 'xy 平面', c: 'b', size: 19, dy: -4 },
    { k: 'vec', a: O3, b: pj(3.9, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 4.7, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 0, 1.9), c: 'd', wd: 2 },
    { k: 'label', at: pj(3.9, 0, 0), text: 'x', dx: -12, dy: 8, c: 'd', size: 22 }, { k: 'label', at: pj(0, 4.7, 0), text: 'y', dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 1.9), text: 'z', dx: 14, c: 'd', size: 22 },
    { k: 'label', at: O3, text: 'O', dx: -16, dy: -8, size: 22 },
    { k: 'seg', a: pj(-0.9, 1.1, -0.9), b: A3, c: 'b', wd: 2, dash: true }, { k: 'seg', a: A3, b: pj(2.1, 4.1, 2.1), c: 'b', wd: 3 },
    { k: 'label', at: pj(2.1, 4.1, 2.1), text: 'ℓ', dx: -6, dy: -16, c: 'b', size: 26 },
    { k: 'pt', at: A3, name: 'A', dir: 'se', off: 16, c: 'b', r: 5, size: 22 },
    { k: 'seg', a: Q3, b: P3, c: 'p', wd: 3 }, { k: 'label', at: [0.3, -0.78], text: 'm', c: 'p', size: 24 },
    { k: 'vec', a: P3, b: N3, c: 'y', wd: 3 }, { k: 'label', at: N3, text: 'n', dx: 16, dy: 4, c: 'y', size: 24, vec: true },
    { k: 'pt', at: P3, name: 'P', dir: 'se', c: 'w' }, { k: 'pt', at: Q3, name: 'Q', dir: 's', c: 'p' }].concat(extra || []) });
  // xy 平面の図（別の見方）
  const VIEW2 = [-3.6, -3.1, 3.6, 3.1];
  const plane = (id, extra) => ({ t: 'fig', id, col: 1, view: VIEW2, w: 430, h: 370, items: [
    { k: 'axes', tx: [], ty: [] },
    { k: 'line', m: -0.5, n: 0.5, c: 'y', wd: 3 }, { k: 'label', at: [3.0, -0.45], text: 'a = 1', c: 'y', size: 20 },
    { k: 'seg', a: [0, 0], b: [0.2, 0.4], c: 'y', dash: true, wd: 2 }, { k: 'right', o: [0.2, 0.4], a: [0, 0], b: [1.2, -0.1], s: 10, c: 'y' },
    { k: 'label', at: [0, 0], text: 'O', dx: -14, dy: 18, size: 22 }].concat(extra || []) });

  HB.lesson({
    id: 'kyushu25-1', field: '九大型　数学（理系）', title: '2025 九大 理系 第1問の類題 ― 2つのベクトルに垂直な直線と距離の最小値', level: '2025年度 九州大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に、2つのベクトル $\\vec u=(1,\\ 0,\\ 1)$，$\\vec v=(0,\\ 1,\\ -2)$ と、点 $\\mathrm{A}(0,\\ 2,\\ a)$ を通り $\\vec d=(1,\\ 1,\\ 1)$ に平行な直線 $\\ell$ がある。ただし、$a$ は実数の定数とする。$\\ell$ 上の点 P を通り、$\\vec u$ と $\\vec v$ の両方に垂直な直線を $m$ とし、$m$ と $xy$ 平面の交点を Q とする。',
      parts: [
        '(1)　$\\vec u$ と $\\vec v$ の両方に垂直で、$z$ 成分が 1 であるベクトル $\\vec n$ を求めよ。',
        '(2)　$\\overrightarrow{\\mathrm{OP}}=\\overrightarrow{\\mathrm{OA}}+t\\vec d$（$t$ は実数）とするとき、点 Q の座標を $a,\\ t$ を用いて表せ。',
        '(3)　点 P が $\\ell$ 上を動くとき、線分 OQ の長さの最小値が $\\sqrt5$ 以下となるような $a$ の値の範囲を求めよ。'
      ],
      src: '※ 2025年度 九州大学 前期 理系 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの基本を組み合わせた問題です。垂直なベクトル、直線と平面の交点、2次関数の最小値。1つずつ確実に進めましょう。まず問題文を読みます。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'P から $\\vec n$ に平行な直線 $m$ にそって進み、床（$xy$ 平面）に当たった点が Q。P が $\\ell$ 上を動くと、Q も床の上を動きます。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　垂直 ⇔ 内積が 0\n(2)　$m$ 上の点を実数 $s$ で表し、$z$ 座標 $=0$\n(3)　OQ$^2$ は $t$ の2次式 → 平方完成で最小値' },
          { t: 'p', size: 'sm', text: '右の図は $a=0,\\ t=\\dfrac32$ の場合' },
          space('s1')] },
      { ask: { type: 'choice', q: '(1) で、$\\vec u$ と $\\vec v$ の両方に垂直な $\\vec n$ を求めるのに使う条件は？',
        opts: ['$\\vec n=k\\vec u+l\\vec v$ とおく', '$|\\vec n|=1$ と $\\vec n\\cdot\\vec u=0$', '$\\vec n\\cdot\\vec u=0$ かつ $\\vec n\\cdot\\vec v=0$', '$\\vec n\\cdot(\\vec u+\\vec v)=0$ だけ'], ok: 2,
        why: { 0: 'それは $\\vec u,\\ \\vec v$ と同じ平面の中のベクトル。垂直にはなりません。', 1: '大きさの条件はいらず、$\\vec v$ に垂直という条件が入っていません。', 3: '条件が1つでは足りず、向きが1つに決まりません。' },
        good: '「垂直 ⇔ 内積が 0」。$\\vec u$ とも $\\vec v$ とも内積をとって 0 にします。' } },

      // ---------- (1) ----------
      { clear: true, cols: [0.56, 0.44], part: '(1)', say: '$z$ 成分が 1 なので $\\vec n=(p,\\ q,\\ 1)$ とおきます。$\\vec u,\\ \\vec v$ との内積を計算すると、$p+1=0$、$q-2=0$ です。',
        add: [{ t: 'h', text: '(1)　u と v の両方に垂直な n' },
          { t: 'm', tex: '\\vec n=(p,\\ q,\\ 1)\\ \\text{とおく}' },
          { t: 'm', tex: '\\vec n\\cdot\\vec u=p\\cdot1+q\\cdot0+1\\cdot1=p+1=0' },
          { t: 'm', tex: '\\vec n\\cdot\\vec v=p\\cdot0+q\\cdot1+1\\cdot(-2)=q-2=0' },
          { t: 'ans', label: '(1) 答', tex: '\\vec n=(-1,\\ 2,\\ 1)' }] },
      { say: '検算もしておきます。また、$z$ 成分を決めずに $(p,\\ q,\\ r)$ とおくと $\\vec n=r(-1,\\ 2,\\ 1)$。垂直な **向きは1つ** なので、直線 $m$ もただ1つに決まります。',
        add: [{ t: 'box', col: 1, c: 'g', size: 'sm', label: '検算', text: '$\\vec n\\cdot\\vec u=-1+0+1=0$\n$\\vec n\\cdot\\vec v=0+2-2=0$' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '向きは1つ', text: '$(p,\\ q,\\ r)$ とおくと\n$p+r=0,\\ q-2r=0$\n→ $\\vec n=r(-1,\\ 2,\\ 1)$' }] },

      // ---------- (2) ----------
      { clear: true, cols: [0.54, 0.46], part: '(2)', say: 'P の座標は $(t,\\ 2+t,\\ a+t)$。直線 $m$ 上の点は、実数 $s$ を使って $\\overrightarrow{\\mathrm{OP}}+s\\vec n$ と表せます。',
        add: [{ t: 'h', text: '(2)　Q の座標' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=(0,\\ 2,\\ a)+t(1,\\ 1,\\ 1)=(t,\\ 2+t,\\ a+t)', size: 'sm' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OQ}}=\\overrightarrow{\\mathrm{OP}}+s\\vec n', note: '$m$ 上の点' },
          { t: 'm', tex: '=(t-s,\\ 2+t+2s,\\ a+t+s)' },
          space('s2', [], 270)] },
      { ask: { type: 'choice', q: 'Q は $xy$ 平面上にある。$s$ の値は？',
        opts: ['$s=a+t$', '$s=-(a+t)$', '$s=-a$', '$s=0$'], ok: 1,
        why: { 0: '符号が逆です。$z$ 座標は $a+t+s=0$。', 2: '$t$ を落としています。P の $z$ 座標は $a+t$ です。', 3: '$s=0$ は P そのもの。P が $xy$ 平面上にあるとは限りません。' },
        good: '$xy$ 平面上 ⇔ $z$ 座標が 0。$a+t+s=0$ より $s=-(a+t)$。',
        add: [{ t: 'm', tex: 'a+t+s=0\\qquad\\therefore\\ s=-(a+t)' }] } },
      { ask: { type: 'choice', q: 'これを代入すると、Q の座標は？',
        opts: ['$(a+2t,\\ 2-a,\\ 0)$', '$(t,\\ 2+t,\\ 0)$', '$(-a,\\ 2+2a+3t,\\ 0)$', '$(a+2t,\\ 2-2a-t,\\ 0)$'], ok: 3,
        why: { 0: '$\\vec n$ の $y$ 成分 2 を、$s$ にかけ忘れています。', 1: 'それは P から真下（$z$ 軸の向き）に下ろした点。$m$ の向きは $\\vec n$ です。', 2: '$s=a+t$（符号が逆）で計算しています。' },
        good: '$x=t+(a+t)=a+2t$、$y=2+t-2(a+t)=2-2a-t$。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\mathrm{Q}(a+2t,\\ 2-2a-t,\\ 0)' }] } },
      { ask: { type: 'think', q: '検算：$a=1,\\ t=0$ のとき、P と Q の座標を求め、$\\overrightarrow{\\mathrm{PQ}}$ が $\\vec n$ に平行であることを確かめよう。',
        hint: 'P は $(t,\\ 2+t,\\ a+t)$、Q は (2) の答えに代入する。',
        ans: 'P$(0,\\ 2,\\ 1)$、Q$(1,\\ 0,\\ 0)$。$\\overrightarrow{\\mathrm{PQ}}=(1,\\ -2,\\ -1)=-\\vec n$',
        after: '$-\\vec n$ も $\\vec n$ に平行です。小さな値で確かめると、符号のミスに気づけます。' } },

      // ---------- (3) ----------
      { clear: true, cols: [0.6, 0.4], part: '(3)', say: '(3) です。OQ $\\ge0$ なので、OQ が最小になるのは OQ$^2$ が最小になるとき。OQ$^2$ を展開すると、$t$ の2次式になります。',
        add: [{ t: 'h', text: '(3)　OQ の最小値' },
          { t: 'm', tex: '\\mathrm{OQ}^2=(a+2t)^2+(2-2a-t)^2' },
          { t: 'm', tex: '=5t^2+(8a-4)t+5a^2-8a+4', note: '$t$ の2次式' }] },
      { say: '平方完成します。P は直線 $\\ell$ の上を **全体** にわたって動くので、$t$ はすべての実数。$t=\\dfrac{2-4a}{5}$ のとき最小です。',
        add: [{ t: 'm', tex: '=5\\left(t-\\frac{2-4a}{5}\\right)^2+\\frac{(3a-4)^2}{5}' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: '定数の部分', text: '$5a^2-8a+4-\\dfrac{(4a-2)^2}{5}$\n$=\\dfrac{9a^2-24a+16}{5}=\\dfrac{(3a-4)^2}{5}$' }] },
      { ask: { type: 'choice', q: 'OQ の最小値は？',
        opts: ['$\\dfrac{(3a-4)^2}{5}$', '$\\dfrac{|3a-4|}{\\sqrt5}$', '$\\dfrac{3a-4}{\\sqrt5}$', '$\\dfrac{|3a-4|}{5}$'], ok: 1,
        why: { 0: 'それは OQ$^2$ の最小値です。最後に $\\sqrt{\\ }$ をとります。', 2: '$a<\\frac43$ だと負になってしまいます。$\\sqrt{x^2}=|x|$ です。', 3: '$\\sqrt5$ で割るところを、5 で割っています。' },
        good: '$\\sqrt{\\dfrac{(3a-4)^2}{5}}=\\dfrac{|3a-4|}{\\sqrt5}$。絶対値を忘れずに。',
        add: [{ t: 'm', tex: '\\text{最小値}\\ \\ \\frac{|3a-4|}{\\sqrt5}', note: '$t=\\frac{2-4a}{5}$ のとき' }] } },
      { ask: { type: 'choice', q: '最小値が $\\sqrt5$ 以下となる $a$ の値の範囲は？',
        opts: ['$-\\dfrac13\\le a\\le3$', '$a\\le-\\dfrac13,\\ 3\\le a$', '$1\\le a\\le\\dfrac53$', '$-3\\le a\\le\\dfrac13$'], ok: 0,
        why: { 1: '「以下」なので、$-5\\le3a-4\\le5$ の内側です。', 2: '両辺に $\\sqrt5$ をかけると $|3a-4|\\le5$。$\\sqrt5$ で割ってしまっています。', 3: '$-5\\le3a-4\\le5$ の各辺に 4 を足すところを、引いています。' },
        good: '$\\dfrac{|3a-4|}{\\sqrt5}\\le\\sqrt5\\iff|3a-4|\\le5\\iff-1\\le3a\\le9$。',
        add: [{ t: 'm', col: 1, tex: '\\frac{|3a-4|}{\\sqrt5}\\le\\sqrt5' }, { t: 'm', col: 1, tex: '|3a-4|\\le5' },
          { t: 'ans', col: 1, label: '(3) 答', tex: '-\\frac13\\le a\\le3' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.54, 0.46], part: '別の見方', say: 'Q の座標から $t$ を消してみます。$x+2y$ を計算すると $t$ が消えて $4-3a$。Q は $xy$ 平面の **直線の上** を動いていたのです。',
        add: [{ t: 'h', text: '別の見方：Q が動く直線' },
          { t: 'm', tex: 'x+2y=(a+2t)+2(2-2a-t)=4-3a', size: 'sm' },
          { t: 'p', size: 'sm', text: 'Q は $xy$ 平面上の直線 $x+2y=4-3a$ を動く\n（直線 $\\ell$ を $\\vec n$ の向きに床へうつした「影」）' },
          plane('xy')] },
      { say: 'OQ の最小値は、原点からこの直線までの距離。点と直線の距離の公式（数学Ⅱ）で $\\dfrac{|4-3a|}{\\sqrt5}$。(3) の結果と一致します。',
        add: [{ t: 'm', tex: 'd=\\frac{|4-3a|}{\\sqrt{1^2+2^2}}=\\frac{|3a-4|}{\\sqrt5}', size: 'sm' },
          { t: 'box', c: 'g', size: 'sm', label: '図で見ると', text: '最小値 $\\le\\sqrt5$\n⇔ 直線が半径 $\\sqrt5$ の円と共有点をもつ\n両はしの $a=-\\frac13,\\ 3$ で、直線は円に接する' }],
        draw: [{ fig: 'xy', items: [{ k: 'circle', o: [0, 0], r: Math.sqrt(5), c: 'g', dash: true, wd: 2 },
          { k: 'line', m: -0.5, n: 2.5, c: 'b', wd: 2.5 }, { k: 'line', m: -0.5, n: -2.5, c: 'b', wd: 2.5 },
          { k: 'label', at: [1.75, 2.35], text: 'a = −1/3', c: 'b', size: 20 }, { k: 'label', at: [-2.9, -0.62], text: 'a = 3', c: 'b', size: 20 },
          { k: 'pt', at: [1, 2], c: 'b', r: 5 }] }] },
      { ask: { type: 'choice', q: '$a=3$ のとき、OQ を最小にする点 Q は？',
        opts: ['$(1,\\ 2,\\ 0)$', '$(-5,\\ 0,\\ 0)$', '$(-1,\\ -2,\\ 0)$', '$\\left(0,\\ -\\frac52,\\ 0\\right)$'], ok: 2,
        why: { 0: 'それは $a=-\\frac13$ のとき（直線 $x+2y=5$ と円の接点）です。', 1: '直線 $x+2y=-5$ の上ですが、O からの距離は 5。最小ではありません。', 3: '直線の上ですが、O からの距離は $\\frac52$ で、$\\sqrt5$ より大きい。' },
        good: '$t=\\frac{2-12}{5}=-2$ を (2) に入れて Q$(-1,\\ -2,\\ 0)$。OQ $=\\sqrt5$ で、円にちょうど接します。',
        draw: [{ fig: 'xy', items: [{ k: 'pt', at: [-1, -2], name: '(−1, −2)', dir: 'sw', c: 'p', size: 20 }, { k: 'seg', a: [0, 0], b: [-1, -2], c: 'p', wd: 2.5 }] }] } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案', say: '答案で点がつくのは、「なぜそうなるか」の一言です。とくに (3) の $t$ の範囲と、$\\sqrt{\\ }$ をとるときの絶対値は、書きもらしやすい所です。',
        add: [{ t: 'h', text: '答案の書き方のポイント' },
          { t: 'box', c: 'b', size: 'sm', label: '(1)', text: '「$\\vec n\\perp\\vec u,\\ \\vec n\\perp\\vec v$ より $\\vec n\\cdot\\vec u=0,\\ \\vec n\\cdot\\vec v=0$」と、内積 0 の理由を書く' },
          { t: 'box', c: 'y', size: 'sm', label: '(2)', text: '「Q は $m$ 上にあるから $\\overrightarrow{\\mathrm{OQ}}=\\overrightarrow{\\mathrm{OP}}+s\\vec n$（$s$ は実数）」「$xy$ 平面上なので $z$ 座標は 0」' },
          { t: 'box', c: 'p', size: 'sm', label: '(3)', text: '「OQ $\\ge0$ だから OQ$^2$ の最小を考える」「$t$ はすべての実数をとる」「最小値は $\\frac{|3a-4|}{\\sqrt5}$（絶対値）」' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。空間の問題も、内積・直線の式・2次関数という基本の組み合わせで解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
