/* 2026 広島大 理系 第2問の類題（自作）：数学C 平面上の曲線 ― 焦点を通る直線が楕円から切りとる弦と、もう1つの焦点
   元の問題はうつしていない（「楕円と、定点を通る傾き m の直線の2交点 → 解と係数の関係 → 弦の長さ → もう1つの定点からの
   距離の和の条件（2点が焦点であることを使う）→ 三角形の面積」というねらいと形式だけを合わせ、楕円・点・数値を自作した）。
   楕円 E：x²/16+y²/12=1（a=4, b=2√3, c=2 → 焦点 (±2, 0)）、ℓ：y=m(x+2)（A(−2, 0) を通る）、B(2, 0)
   答え（python3・sympy で検算ずみ）：
   (1) (4m²+3)x²+16m²x+16m²−48=0 → x₁+x₂=−16m²/(4m²+3)、x₁x₂=(16m²−48)/(4m²+3)
   (2) (x₂−x₁)²=576(m²+1)/(4m²+3)² → PQ=√(1+m²)|x₂−x₁|=24(m²+1)/(4m²+3)（m=0 で 8、m→∞ で 6）
   (3) AP+BP=AQ+BQ=8、(x₁+2)(x₂+2)=−36/(4m²+3)<0 で A は P と Q の間 → BP+BQ=16−PQ=9 → PQ=7 → 4m²=3 → m=±√3/2
       別解：BP=4−x₁/2（焦半径）→ BP+BQ=8+8m²/(4m²+3)=9 → m²=3/4
   (4) m=√3/2：x=−1±√7、|x₁−x₂|=2√7、|y₁−y₂|=√21 → △BPQ=½·AB·|y₁−y₂|=2√21（B から ℓ までの距離 4√21/7 でも ½·7·4√21/7=2√21） */
(function () {
  const r3 = Math.sqrt(3), r7 = Math.sqrt(7), M = r3 / 2;
  const P = [-1 + r7, M * (1 + r7)], Q = [-1 - r7, M * (1 - r7)], A = [-2, 0], B = [2, 0];
  const VIEW = [-5.3, -4.3, 5.3, 4.3];
  const base = () => [
    { k: 'axes', tx: [], ty: [] }, { k: 'label', at: [0, 2 * r3], text: '2√3', dx: -26, dy: -14, size: 19, c: 'd' },
    { k: 'param', x: '4*cos(t)', y: '2*sqrt(3)*sin(t)', a: 0, b: 2 * Math.PI, c: 'y', label: 'E', lat: [3.2, 2.85] },
    { k: 'pt', at: A, name: 'A', dir: 'nw', c: 'b' }, { k: 'pt', at: B, name: 'B', dir: 'se', c: 'g' }
  ];
  const lineL = { k: 'line', m: M, n: 2 * M, a: -5.1, b: 3.0, c: 'b', label: 'ℓ', lat: [2.75, 4.0] };
  const PQ = [{ k: 'pt', at: P, name: 'P', dir: 'nw', c: 'p' }, { k: 'pt', at: Q, name: 'Q', dir: 'nw', c: 'p' }];
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: Math.round((h || 420) * 10.6 / 8.6), h: h || 420, items: base().concat(items || []) });   // 縦横比は VIEW にそろえる
  const POINTS = [
    '楕円と直線は **連立して $x$ の2次方程式** → 解と係数の関係で $x_1+x_2,\\ x_1x_2$。弦の長さは $\\sqrt{1+m^2}\\,|x_2-x_1|$',
    '$\\dfrac{x^2}{a^2}+\\dfrac{y^2}{b^2}=1$ で $(\\pm c,\\ 0)$ の点が出てきたら **焦点** を疑う。焦点からの距離の和は $2a$',
    '焦点を通る弦 PQ では $\\mathrm{BP}+\\mathrm{BQ}=4a-\\mathrm{PQ}$。焦半径 $\\mathrm{BP}=a-\\dfrac{c}{a}x$ を使っても同じ式になる'
  ];

  HB.lesson({
    id: 'hiro26-2', field: '広島大型　数学（理系）', title: '2026 広島大 理系 第2問の類題 ― 焦点を通る直線が楕円から切りとる弦', level: '2026年度 広島大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標平面上に、楕円 $E:\\ \\dfrac{x^2}{16}+\\dfrac{y^2}{12}=1$ と、2点 $\\mathrm{A}(-2,\\ 0)$、$\\mathrm{B}(2,\\ 0)$ がある。A を通り傾きが $m$ の直線を $\\ell$ とし、$\\ell$ と $E$ の2つの交点を $\\mathrm{P}(x_1,\\ y_1)$、$\\mathrm{Q}(x_2,\\ y_2)$ とする。',
      parts: [
        '(1)　$x_1+x_2$ と $x_1x_2$ を $m$ を用いて表せ。',
        '(2)　線分 PQ の長さを $m$ を用いて表せ。',
        '(3)　$\\mathrm{BP}+\\mathrm{BQ}=9$ となるとき、線分 PQ の長さと $m$ の値を求めよ。',
        '(4)　(3) のとき、$\\triangle\\mathrm{BPQ}$ の面積を求めよ。'
      ],
      src: '※ 2026年度 広島大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '楕円と、点 A を通る直線の2つの交点の問題です。(1)(2) は計算、(3) は図形の見方がカギ。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: 'まず楕円の形をつかみます。$a^2=16,\\ b^2=12$ なので、横に長い楕円。右の図は $m=\\frac{\\sqrt3}{2}$ のときの様子です。',
        add: [{ t: 'h', text: '読みかえ：楕円の形と 2点 A, B' },
          { t: 'm', tex: 'E:\\ \\frac{x^2}{4^2}+\\frac{y^2}{(2\\sqrt3)^2}=1' },
          fig('f0', [lineL].concat(PQ))] },
      { ask: { type: 'choice', q: '楕円 $E$ の焦点の座標は？',
        opts: ['$(0,\\ \\pm2)$', '$(\\pm2,\\ 0)$', '$(\\pm4,\\ 0)$', '$(\\pm2\\sqrt7,\\ 0)$'], ok: 1,
        why: { 0: '横に長い楕円（$a>b$）なので、焦点は $x$ 軸上にあります。', 2: 'それは長軸の両はし（頂点）です。', 3: '$\\sqrt{16+12}$ は双曲線の公式。楕円は $c=\\sqrt{a^2-b^2}$ です。' },
        good: '$c=\\sqrt{16-12}=2$ で、焦点は $(\\pm2,\\ 0)$。**A と B は、ちょうど $E$ の2つの焦点** です。',
        add: [{ t: 'm', tex: 'c=\\sqrt{16-12}=2\\quad\\to\\quad \\text{焦点 }(\\pm2,\\ 0)=\\mathrm{A},\\ \\mathrm{B}' }] } },
      { say: '方針です。(1)(2) は連立して解と係数の関係。(3) は「A, B が焦点」を使うと、長い計算をしなくてすみます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　$\\ell$ と $E$ を連立 → $x$ の2次方程式 → 解と係数の関係\n(2)　弦の長さ $=\\sqrt{1+m^2}\\,|x_2-x_1|$\n(3)　焦点の性質「距離の和 $=2a=8$」を使う' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$E$ の式を 48 倍して $3x^2+4y^2=48$。ここに $y=m(x+2)$ を代入して、$x$ について整理します。',
        add: [{ t: 'h', text: '(1)　x₁ + x₂ と x₁x₂' },
          { t: 'm', size: 'sm', tex: '3x^2+4m^2(x+2)^2=48' },
          { t: 'm', size: 'sm', tex: '(4m^2+3)x^2+16m^2x+16m^2-48=0', note: '…(＊)' },
          fig('f1', [lineL].concat(PQ), 360)] },
      { ask: { type: 'choice', q: '(＊) の2つの解が $x_1,\\ x_2$。$x_1+x_2$ は？',
        opts: ['$\\dfrac{16m^2}{4m^2+3}$', '$-\\dfrac{16m^2}{3}$', '$\\dfrac{16m^2-48}{4m^2+3}$', '$-\\dfrac{16m^2}{4m^2+3}$'], ok: 3,
        why: { 0: '解の和は $-\\frac{b}{a}$。マイナスが落ちています。', 1: '$x^2$ の係数は 3 ではなく $4m^2+3$ です。', 2: 'それは積 $x_1x_2=\\frac{c}{a}$ です。' },
        good: '和は $-\\dfrac{b}{a}=-\\dfrac{16m^2}{4m^2+3}$、積は $\\dfrac{c}{a}=\\dfrac{16m^2-48}{4m^2+3}$。',
        add: [{ t: 'ans', label: '(1) 答', tex: 'x_1+x_2=-\\frac{16m^2}{4m^2+3},\\quad x_1x_2=\\frac{16m^2-48}{4m^2+3}' }] } },
      { say: '答案では、交点が2つあることも一言。(＊) の判別式は $\\frac{D}{4}=144(m^2+1)>0$。A は楕円の内部なので、どんな $m$ でも2点で交わります。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{D}{4}=(8m^2)^2-(4m^2+3)(16m^2-48)=144(m^2+1)>0' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。P, Q は $\\ell$ 上なので $y_2-y_1=m(x_2-x_1)$。だから弦の長さは $x$ 座標の差だけで書けます。',
        add: [{ t: 'h', text: '(2)　弦 PQ の長さ' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PQ}=\\sqrt{(x_2-x_1)^2+m^2(x_2-x_1)^2}=\\sqrt{1+m^2}\\,|x_2-x_1|' },
          { t: 'm', size: 'sm', tex: '(x_2-x_1)^2=(x_1+x_2)^2-4x_1x_2' },
          fig('f2', [lineL].concat(PQ, [{ k: 'seg', a: P, b: Q, c: 'p', wd: 5 }]), 420)] },
      { ask: { type: 'choice', q: '$(x_2-x_1)^2=(x_1+x_2)^2-4x_1x_2$ を計算すると？',
        opts: ['$\\dfrac{576(m^2+1)}{(4m^2+3)^2}$', '$\\dfrac{144(m^2+1)}{(4m^2+3)^2}$', '$\\dfrac{576(m^2+1)}{4m^2+3}$', '$\\dfrac{24\\sqrt{m^2+1}}{4m^2+3}$'], ok: 0,
        why: { 1: '$\\frac{D}{4}$ のまま使っています。$(x_2-x_1)^2=\\frac{D}{a^2}=\\frac{4\\cdot D/4}{a^2}$ です。', 2: '通分した分母は $(4m^2+3)^2$。2乗が落ちています。', 3: 'それは $|x_2-x_1|$（平方根をとったあと）です。' },
        good: '分子は $256m^4-4(16m^2-48)(4m^2+3)=576(m^2+1)$。$m^4$ の項が消えるのがポイントです。',
        add: [{ t: 'm', size: 'sm', tex: '|x_2-x_1|=\\frac{24\\sqrt{m^2+1}}{4m^2+3}' }] } },
      { say: '$\\sqrt{1+m^2}$ をかけると、根号が消えてきれいな形になります。(2) の答えです。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\mathrm{PQ}=\\sqrt{1+m^2}\\cdot\\frac{24\\sqrt{m^2+1}}{4m^2+3}=\\frac{24(m^2+1)}{4m^2+3}' }] },
      { ask: { type: 'think', q: '検算：$m=0$ のとき PQ はいくつ？　図で見ると、それは何の長さ？',
        hint: '$m=0$ なら $\\ell$ は $x$ 軸そのもの。',
        ans: '$\\mathrm{PQ}=\\dfrac{24}{3}=8$。$x$ 軸と楕円の交点 $(\\pm4,\\ 0)$ の間、つまり **長軸の長さ** $2a=8$ と一致する',
        after: '$m$ を大きくすると $\\frac{24(m^2+1)}{4m^2+3}\\to6$。これは A を通る縦の弦（$x=-2$）の長さで、答えが 6 より大きく 8 以下になることもわかります。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。BP, BQ をそのまま計算すると大変。ここで「A, B は焦点」を使います。楕円上の点は、2つの焦点からの距離の和が $2a=8$。',
        add: [{ t: 'h', text: '(3)　焦点の性質を使う' },
          { t: 'm', tex: '\\mathrm{AP}+\\mathrm{BP}=8,\\qquad \\mathrm{AQ}+\\mathrm{BQ}=8' },
          fig('f3', [lineL].concat(PQ, [{ k: 'seg', a: B, b: P, c: 'g', wd: 3 }, { k: 'seg', a: B, b: Q, c: 'g', wd: 3 }]), 420)] },
      { ask: { type: 'choice', q: 'A は線分 PQ 上にある。$\\mathrm{BP}+\\mathrm{BQ}$ を PQ で表すと？',
        opts: ['$8-\\mathrm{PQ}$', '$\\mathrm{PQ}-8$', '$16+\\mathrm{PQ}$', '$16-\\mathrm{PQ}$'], ok: 3,
        why: { 0: '和の式は2本あります。足すと右辺は $8+8=16$。', 1: '符号が逆です。PQ が大きいほど BP+BQ は小さくなります。', 2: 'AP と AQ は左辺から引きます。$\\mathrm{AP}+\\mathrm{AQ}=\\mathrm{PQ}$ です。' },
        good: '2式を足して $(\\mathrm{AP}+\\mathrm{AQ})+(\\mathrm{BP}+\\mathrm{BQ})=16$。A が P と Q の間なので $\\mathrm{AP}+\\mathrm{AQ}=\\mathrm{PQ}$。',
        add: [{ t: 'm', tex: '\\mathrm{BP}+\\mathrm{BQ}=16-\\mathrm{PQ}' }] } },
      { say: '「A が P と Q の間」も答案に書きます。(1) の結果から $(x_1+2)(x_2+2)<0$ なので、$x_1,\\ x_2$ は $-2$ をはさみます。',
        add: [{ t: 'm', size: 'sm', tex: '(x_1+2)(x_2+2)=x_1x_2+2(x_1+x_2)+4=\\frac{-36}{4m^2+3}<0' }] },
      { clear: true, say: '$\\mathrm{BP}+\\mathrm{BQ}=9$ なので $\\mathrm{PQ}=16-9=7$。(2) の式と等しいとおいて、$m$ を求めます。',
        add: [{ t: 'h', text: '(3)　つづき：PQ = 7 から m を求める' },
          { t: 'm', tex: '\\mathrm{PQ}=16-9=7' },
          { t: 'm', tex: '\\frac{24(m^2+1)}{4m^2+3}=7' },
          fig('f3b', [lineL].concat(PQ, [{ k: 'seg', a: P, b: Q, c: 'p', wd: 5 }]), 420)] },
      { ask: { type: 'choice', q: '$m$ の値は？',
        opts: ['$m=\\dfrac{\\sqrt3}{2}$ だけ', '$m=\\pm\\dfrac34$', '$m=\\pm\\dfrac{\\sqrt3}{2}$', '$m=\\pm\\sqrt3$'], ok: 2,
        why: { 0: '$m^2=\\frac34$ の解は2つ。$x$ 軸について対称な直線も条件をみたします。', 1: 'それは $m^2$ の値。平方根をとります。', 3: '$24m^2+24=28m^2+21$ から $4m^2=3$。4 で割り忘れています。' },
        good: '$24m^2+24=28m^2+21$ より $4m^2=3$、$m=\\pm\\dfrac{\\sqrt3}{2}$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\mathrm{PQ}=7,\\qquad m=\\pm\\frac{\\sqrt3}{2}' }] } },
      { ask: { type: 'think', q: '別解：楕円上の点 $(x,\\ y)$ と B の距離は $4-\\dfrac{x}{2}$（焦半径）。これを使って、$\\mathrm{BP}+\\mathrm{BQ}=9$ から $m^2$ を出してみよう。',
        hint: '$\\mathrm{BP}+\\mathrm{BQ}=8-\\dfrac{x_1+x_2}{2}$ に (1) の和を入れる。',
        ans: '$8+\\dfrac{8m^2}{4m^2+3}=9$ より $8m^2=4m^2+3$、$m^2=\\dfrac34$　で同じ答え',
        after: '焦半径は $\\sqrt{(x-2)^2+y^2}$ に $y^2=12-\\frac34x^2$ を入れると $\\sqrt{\\left(4-\\frac x2\\right)^2}=4-\\frac x2$ と出ます（$x\\le4$）。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。$m=\\frac{\\sqrt3}{2}$ で考えます（$-\\frac{\\sqrt3}{2}$ は $x$ 軸について対称なので面積は同じ）。$\\triangle\\mathrm{BPQ}$ は $x$ 軸で2つに分かれます。',
        add: [{ t: 'h', text: '(4)　△BPQ の面積' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{BPQ}=\\triangle\\mathrm{ABP}+\\triangle\\mathrm{ABQ}=\\frac12\\cdot\\mathrm{AB}\\cdot|y_1-y_2|' },
          fig('f4', [lineL].concat(PQ, [{ k: 'poly', pts: [B, P, Q], close: true, fill: 'g', alpha: 0.22, c: 'g', wd: 3 }]), 420)] },
      { say: '$m^2=\\frac34$ を (2) の途中の式に入れると、$|x_1-x_2|=\\frac{24\\sqrt{7/4}}{6}=2\\sqrt7$。$y$ 座標の差は、その $|m|$ 倍です。',
        add: [{ t: 'm', size: 'sm', tex: '|x_1-x_2|=2\\sqrt7,\\qquad |y_1-y_2|=\\frac{\\sqrt3}{2}\\cdot2\\sqrt7=\\sqrt{21}' }] },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{BPQ}$ の面積は？（$\\mathrm{AB}=4$）',
        opts: ['$4\\sqrt{21}$', '$2\\sqrt{21}$', '$14$', '$\\sqrt{21}$'], ok: 1,
        why: { 0: '三角形なので $\\frac12$ をかけます。', 2: '$\\frac12\\cdot7\\cdot4$ は、PQ を底辺・AB を高さとしています。AB は高さではありません。', 3: '底辺 AB は $2-(-2)=4$。2 ではありません。' },
        good: '$\\dfrac12\\cdot4\\cdot\\sqrt{21}=2\\sqrt{21}$ です。',
        add: [{ t: 'ans', label: '(4) 答', tex: '\\triangle\\mathrm{BPQ}=\\frac12\\cdot4\\cdot\\sqrt{21}=2\\sqrt{21}' }] } },
      { say: '検算：底辺を PQ$=7$ とすると、高さは B から $\\ell$ までの距離 $\\frac{|4m|}{\\sqrt{m^2+1}}=\\frac{4\\sqrt{21}}{7}$。$\\frac12\\cdot7\\cdot\\frac{4\\sqrt{21}}{7}=2\\sqrt{21}$ で一致します。',
        add: [{ t: 'm', size: 'sm', tex: 'd=\\frac{|m\\cdot2-0+2m|}{\\sqrt{m^2+1}}=\\frac{2\\sqrt3}{\\sqrt7/2}=\\frac{4\\sqrt{21}}{7}', note: 'B と $\\ell$ の距離' }] },

      // ---------- ポイント ----------
      { clear: true, part: 'ポイント', say: '答案のポイントです。焦点の性質を使うときは「A, B は焦点」と「A は P と Q の間」の2つを、根拠つきで書きます。',
        add: [{ t: 'h', text: '答案で書くこと' },
          { t: 'box', c: 'y', size: 'sm', label: '答案', text: '・$c=\\sqrt{16-12}=2$ より A, B は $E$ の焦点 → $\\mathrm{AP}+\\mathrm{BP}=2a=8$\n・$(x_1+2)(x_2+2)<0$（または A が $E$ の内部）→ A は P と Q の間\n・よって $\\mathrm{BP}+\\mathrm{BQ}=16-\\mathrm{PQ}$\n・$m$ は $\\pm$ の両方を答える' },
          { t: 'box', c: 'g', size: 'sm', label: '時間配分', text: '(1)(2) の計算は $m^4$ が消えるかで確かめる。(3) を BP・BQ の根号のまま計算すると止まりやすい → 図形の性質に切りかえる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。2次曲線の問題は、計算の道具（解と係数）と、図形の性質（焦点）を使い分けると速く確実に解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
