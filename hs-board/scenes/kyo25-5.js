/* 京大型（理系）2025 第5問の類題（自作）：数学C 空間座標・2次曲線 ― 動く2点を通る直線と xy 平面の交点の軌跡
   元の問題はうつしていない（「空間の2点を通る直線と xy 平面の交点」「パラメータの変化で描く2次曲線」「図示」というねらいと形式だけを合わせた自作問題）。
   ℓ1：(0,0,1) を通り x 軸に平行、ℓ2：(0,0,2) を通り y 軸に平行。A(a,0,1)、B(0,b,2)、OA=OB ⇔ a²−b²=3。
   直線 AB：(a−ka, kb, 1+k)、z=0 で k=−1 → P(2a, −b, 0)（P=2A−B、A は PB の中点）
   軌跡：x²/12 − y²/3 = 1（双曲線全体。逆も成り立つ）。頂点 (±2√3, 0)、漸近線 y=±x/2。例：a=2, b=1 で P(4, −1)。
   考えてみよう：ℓ2 を (0,0,−1) を通る直線にすると P=(a/2, b/2)、a²=b² → 2直線 y=±x。python3 の数値計算で検算ずみ。 */
(function () {
  const POINTS = [
    '直線 AB 上の点は $\\overrightarrow{\\mathrm{OA}}+k\\overrightarrow{\\mathrm{AB}}$。$xy$ 平面との交点は「$z$ 座標 $=0$」で $k$ を決める（A, B の高さがちがうので、交点はいつもある）',
    '交点を $(X,\\ Y)$ とおき、条件 $a^2-b^2=3$ に代入してパラメータ $a,\\ b$ を消去する',
    '軌跡は **逆の確認** まで：双曲線上のどの点にも、条件を満たす A, B があることを言う。図示は頂点と漸近線を入れる'
  ];
  // 見取図：x 軸は左下へ
  const pj = (x, y, z) => [y - 0.55 * x, z - 0.4 * x];
  const a0 = 2, b0 = -1;   // 図の例：OA=OB=√5、P(4, 1)
  const LAB = k => pj(a0 - k * a0, k * b0, 1 + k);   // 直線 AB 上の点
  const A3 = pj(a0, 0, 1), B3 = pj(0, b0, 2), P3 = pj(2 * a0, -b0, 0), O3 = pj(0, 0, 0);
  const space = (extra) => ({ t: 'fig', id: 'sp', col: 1, view: [-4.8, -2.2, 3.7, 3.1], w: 680, h: 424, items: [
    { k: 'poly', pts: [pj(-1.5, -2, 0), pj(4.6, -2, 0), pj(4.6, 2.6, 0), pj(-1.5, 2.6, 0)], close: true, fill: 'w', alpha: 0.07, c: 'rgba(244,243,234,.25)', wd: 1.5 },
    { k: 'vec', a: pj(-1.2, 0, 0), b: pj(5.0, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, -2.0, 0), b: pj(0, 3.0, 0), c: 'd', wd: 2 }, { k: 'vec', a: O3, b: pj(0, 0, 2.9), c: 'd', wd: 2 },
    { k: 'label', at: pj(5.0, 0, 0), text: 'x', dx: -14, dy: 10, c: 'd', size: 22 }, { k: 'label', at: pj(0, 3.0, 0), text: 'y', dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 2.9), text: 'z', dx: 14, c: 'd', size: 22 },
    { k: 'label', at: O3, text: 'O', dx: 14, dy: 14, c: 'd', size: 20 },
    { k: 'seg', a: pj(-1.4, 0, 1), b: pj(5.0, 0, 1), c: 'b', wd: 2.5 }, { k: 'label', at: pj(5.0, 0, 1), text: 'ℓ₁', dx: -16, dy: 4, c: 'b', size: 24 },
    { k: 'seg', a: pj(0, -2.0, 2), b: pj(0, 3.0, 2), c: 'g', wd: 2.5 }, { k: 'label', at: pj(0, 3.0, 2), text: 'ℓ₂', dx: 18, c: 'g', size: 24 },
    { k: 'seg', a: pj(0, 0, 1), b: pj(0, 0, 2), c: 'd', dash: true, wd: 1.5 }].concat(extra || []) });
  const ABP = [
    { k: 'seg', a: A3, b: pj(a0, 0, 0), c: 'b', dash: true, wd: 1.5 }, { k: 'seg', a: B3, b: pj(0, b0, 0), c: 'g', dash: true, wd: 1.5 },
    { k: 'dot', at: pj(a0, 0, 0), c: 'b' }, { k: 'dot', at: pj(0, b0, 0), c: 'g' },
    { k: 'seg', a: LAB(1.5), b: LAB(-1.35), c: 'p', wd: 2.5 },
    { k: 'pt', at: A3, name: 'A', dir: 'e', c: 'b' }, { k: 'pt', at: B3, name: 'B', dir: 'ne', c: 'g' }, { k: 'pt', at: P3, name: 'P', dir: 'e', c: 'p' }];
  const R3 = Math.sqrt(3);
  const hyp = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-9, -4.6, 9, 4.6], w: w || 760, h: Math.round((w || 760) * 9.2 / 18), items: [
    { k: 'axes', tx: [[-2 * R3, '−2√3'], [2 * R3, '2√3']], ty: [[R3, '√3'], [-R3, '−√3']] },
    { k: 'line', m: 0.5, n: 0, c: 'd', dash: true, label: 'y = x/2', lat: [6.0, 3.95] }, { k: 'line', m: -0.5, n: 0, c: 'd', dash: true, label: 'y = −x/2', lat: [6.0, -3.95] },
    { k: 'param', x: '2*sqrt(3)*cosh(t)', y: 'sqrt(3)*sinh(t)', a: -1.45, b: 1.45, c: 'y' },
    { k: 'param', x: '-2*sqrt(3)*cosh(t)', y: 'sqrt(3)*sinh(t)', a: -1.45, b: 1.45, c: 'y' },
    { k: 'pt', at: [2 * R3, 0], c: 'y', r: 5 }, { k: 'pt', at: [-2 * R3, 0], c: 'y', r: 5 }].concat(extra || []) });

  HB.lesson({
    id: 'kyo25-5', field: '京大型　数学（理系）', title: '2025 京大 理系 第5問の類題 ― 空間の直線と xy 平面の交点の軌跡', level: '2025年度 京都大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$xyz$ 空間において、点 $(0,\\,0,\\,1)$ を通り $x$ 軸に平行な直線を $\\ell_1$、点 $(0,\\,0,\\,2)$ を通り $y$ 軸に平行な直線を $\\ell_2$ とする。点 A は $\\ell_1$ 上を、点 B は $\\ell_2$ 上を、原点 O に対して $\\mathrm{OA}=\\mathrm{OB}$ を満たしながら動く。直線 AB と $xy$ 平面の交点を P とするとき、P が描く図形を求め、図示せよ。',
      parts: [],
      src: '※ 2025年度 京都大学 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.5, 0.5],
    steps: [
      { part: '問題', say: '空間の直線と平面の交点が描く図形（軌跡）の問題です。2点が動くので、まず「何をパラメータにするか」を決めます。問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 設定 ----------
      { clear: true, part: '設定を式に', say: '$\\ell_1$ 上の点は $y$ 座標 0、$z$ 座標 1 なので A$(a,\\ 0,\\ 1)$。$\\ell_2$ 上の点は B$(0,\\ b,\\ 2)$ と表せます。$a,\\ b$ をパラメータにします。',
        add: [{ t: 'h', text: 'A, B を文字で表す' },
          { t: 'm', tex: '\\mathrm{A}(a,\\ 0,\\ 1),\\qquad \\mathrm{B}(0,\\ b,\\ 2)' },
          space(ABP)] },
      { ask: { type: 'choice', q: '条件 $\\mathrm{OA}=\\mathrm{OB}$ を $a,\\ b$ の式で表すと？',
        opts: ['$a=b$', '$a^2-b^2=3$', '$a^2+1=b^2+2$', '$a^2+b^2=5$'], ok: 1,
        why: { 0: 'O からの距離は $\\sqrt{a^2+1}$ と $\\sqrt{b^2+4}$。$z$ 座標の分もふくめます。', 2: 'B の $z$ 座標は 2 なので、2乗して 4 です。', 3: 'それは図の例（$a=2,\\ b=-1$）にたまたま合うだけで、条件ではありません。' },
        good: '$\\mathrm{OA}^2=a^2+1,\\ \\mathrm{OB}^2=b^2+4$ より $a^2-b^2=3$。',
        add: [{ t: 'm', tex: 'a^2+1=b^2+4\\iff a^2-b^2=3', note: '…①' }] } },
      { say: '直線 AB 上の点は、実数 $k$ を使って $\\overrightarrow{\\mathrm{OA}}+k\\overrightarrow{\\mathrm{AB}}$。$\\overrightarrow{\\mathrm{AB}}=(-a,\\ b,\\ 1)$ なので、成分は $(a-ka,\\ kb,\\ 1+k)$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OA}}+k\\overrightarrow{\\mathrm{AB}}=(a-ka,\\ kb,\\ 1+k)' }] },
      { ask: { type: 'choice', q: '$xy$ 平面との交点では $z=0$。$k$ の値は？',
        opts: ['$k=1$', '$k=\\dfrac12$', '$k=-\\dfrac12$', '$k=-1$'], ok: 3,
        why: { 0: '$k=1$ は点 B（$z=2$）です。', 1: '$1+k=0$ を解くと $k=-1$ です。', 2: '$z$ 座標は $1+k$。$1+2k$ ではありません。' },
        good: '$1+k=0$ より $k=-1$。代入すると P$(2a,\\ -b,\\ 0)$。',
        add: [{ t: 'm', tex: '\\mathrm{P}(2a,\\ -b,\\ 0)' }] } },
      { say: 'A の高さは 1、B の高さは 2 でいつもちがうので、直線 AB は $xy$ 平面と平行にならず、P はいつもただ1つ決まります。$\\overrightarrow{\\mathrm{OP}}=2\\overrightarrow{\\mathrm{OA}}-\\overrightarrow{\\mathrm{OB}}$、つまり A は PB の中点です。',
        add: [{ t: 'p', size: 'sm', text: 'A, B の高さ 1, 2 はつねに異なる\n→ 直線 AB は $xy$ 平面と必ず1点で交わる\n（A は線分 PB の中点）' }] },

      // ---------- 軌跡 ----------
      { clear: true, cols: [0.56, 0.44], part: '軌跡を求める', say: 'P$(X,\\ Y,\\ 0)$ とおくと、$X=2a,\\ Y=-b$。これを $a,\\ b$ について解いて、条件 ① に代入し、パラメータを消去します。',
        add: [{ t: 'h', text: 'a, b を消去する' },
          { t: 'm', tex: 'X=2a,\\ \\ Y=-b\\iff a=\\frac X2,\\ \\ b=-Y' }] },
      { ask: { type: 'choice', q: '① $a^2-b^2=3$ に代入して整理すると？',
        opts: ['$\\dfrac{X^2}{12}-\\dfrac{Y^2}{3}=1$', '$\\dfrac{X^2}{4}+Y^2=3$', '$X^2-Y^2=3$', '$\\dfrac{X^2}{3}-\\dfrac{Y^2}{12}=1$'], ok: 0,
        why: { 1: '$b^2=Y^2$ の前の符号は、マイナスのままです。', 2: '$a=\\frac X2$ なので $a^2=\\frac{X^2}{4}$ です。', 3: '分母が逆です。$\\frac{X^2}{4}-Y^2=3$ の両辺を 3 でわります。' },
        good: '$\\frac{X^2}{4}-Y^2=3$。両辺を 3 でわって $\\frac{X^2}{12}-\\frac{Y^2}{3}=1$。',
        add: [{ t: 'm', tex: '\\frac{X^2}{4}-Y^2=3\\iff\\frac{X^2}{12}-\\frac{Y^2}{3}=1' }] } },
      { ask: { type: 'choice', q: '答案で、このあと必ず確かめることは？',
        opts: ['双曲線の焦点の座標', 'P が $xy$ 平面上にあること', '双曲線上のどの点も、実際に P になること', '$a,\\ b$ が正であること'], ok: 2,
        why: { 0: '焦点は図形の性質で、軌跡の論証には必要ありません。', 1: '$z=0$ となるように $k$ を決めたので、もう成り立っています。', 3: '$a,\\ b$ は負でもかまいません（直線上のどこでも動ける）。' },
        good: '「P はこの双曲線上にある」だけでは不十分。双曲線上の点がすべて現れるか（逆）を確かめます。' } },
      { say: '逆に、双曲線上の点 $(X,\\ Y)$ に対して $a=\\frac X2,\\ b=-Y$ とおくと $a^2-b^2=\\frac{X^2}{4}-Y^2=3$。① を満たす A, B が決まり、その P が $(X,\\ Y,\\ 0)$ です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '逆の確認', text: '双曲線上の点 $(X,\\ Y)$ に対し\n$a=\\dfrac X2,\\ b=-Y$ とすれば ① を満たし、\nP$=(X,\\ Y,\\ 0)$ となる → 双曲線 **全体** が軌跡' }] },
      { say: 'よって、P が描く図形は、$xy$ 平面上の双曲線 $\\frac{x^2}{12}-\\frac{y^2}{3}=1$ の全体です。',
        add: [{ t: 'ans', label: '答', text: '$xy$ 平面上の双曲線\n$\\dfrac{x^2}{12}-\\dfrac{y^2}{3}=1$（全体）' }] },
      { say: '検算：① より $a^2=b^2+3\\ge3$ なので $|a|\\ge\\sqrt3$、つまり $|X|=2|a|\\ge2\\sqrt3$。双曲線の頂点 $(\\pm2\\sqrt3,\\ 0)$ とぴったり合います。',
        add: [{ t: 'm', size: 'sm', tex: 'a^2=b^2+3\\ge3\\ \\Rightarrow\\ |X|=2|a|\\ge2\\sqrt3', note: '頂点と一致' }] },

      // ---------- 図示 ----------
      { clear: true, cols: [1], part: '図示', say: '図示します。$a^2=12,\\ b^2=3$ の双曲線で、頂点は $(\\pm2\\sqrt3,\\ 0)$。図示では、頂点と漸近線を必ず書き入れます。',
        add: [{ t: 'h', text: '図示：x²/12 − y²/3 = 1' }, hyp('h1')] },
      { ask: { type: 'choice', q: 'この双曲線の漸近線は？',
        opts: ['$y=\\pm2x$', '$y=\\pm\\dfrac12x$', '$y=\\pm\\dfrac14x$', '$y=\\pm\\dfrac{\\sqrt3}{2}x$'], ok: 1,
        why: { 0: '$\\frac{x^2}{a^2}-\\frac{y^2}{b^2}=1$ の漸近線は $y=\\pm\\frac bax$。逆数になっています。', 2: '$\\frac{3}{12}$ の平方根をとり忘れています。', 3: '$a=2\\sqrt3,\\ b=\\sqrt3$ なので $\\frac ba=\\frac12$ です。' },
        good: '$a=2\\sqrt3,\\ b=\\sqrt3$ なので、漸近線は $y=\\pm\\frac{b}{a}x=\\pm\\frac12x$。' } },
      { say: '最初の図の例（$a=2,\\ b=-1$）では P$(4,\\ 1)$。$\\frac{16}{12}-\\frac13=1$ で、たしかに双曲線の上にあります。$|a|$ が大きくなるほど、P は漸近線に近づきます。',
        draw: [{ fig: 'h1', items: [{ k: 'pt', at: [4, 1], name: 'P(4, 1)', dir: 'se', c: 'p', size: 22 }] }] },
      { say: '右の枝は $a>0$（A が $\\ell_1$ の $x>0$ の側）、左の枝は $a<0$ のときに描かれます。$b$ の符号で、上半分か下半分かが決まります（$Y=-b$）。',
        draw: [{ fig: 'h1', items: [{ k: 'label', at: [6.6, -1.2], text: 'a > 0', c: 'b', size: 22, plain: true }, { k: 'label', at: [-6.6, -1.2], text: 'a < 0', c: 'b', size: 22, plain: true }] }] },
      { ask: { type: 'think', q: 'もし $\\ell_2$ が点 $(0,\\,0,\\,-1)$ を通り $y$ 軸に平行な直線だったら（B が $xy$ 平面の下）、P の描く図形は？',
        hint: 'A$(a,\\ 0,\\ 1)$、B$(0,\\ b,\\ -1)$。高さが 1 と −1 なので、P は AB の中点。OA＝OB から $a^2=b^2$。',
        ans: 'P$\\left(\\frac a2,\\ \\frac b2,\\ 0\\right)$、$a^2=b^2$ より $x^2=y^2$。$xy$ 平面上の **2直線** $y=x,\\ y=-x$（全体）',
        after: '高さの組み合わせによっては、2次曲線が2直線になる（退化する）こともあります。設定を変えて調べると理解が深まります。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。軌跡は「パラメータで表す → 消去する → 逆を確認 → 図示」の4段階。最後の2つを書けているかで差がつきます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
