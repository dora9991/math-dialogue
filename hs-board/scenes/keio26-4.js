/* 慶應型 数学（理工）：2026年度 慶應義塾大学 理工学部 第4問の類題（自作問題・元の問題ではない）
   問題：2β=(1−ki)α+(1+ki)γ（k>0）。(1) 空欄＋証明、(2)〜(4) 空欄。
   答え（python3 で検算ずみ）：
     (1) 2β=(α+γ)+ki(γ−α) → β−μ=(k/2)i(γ−α)：純虚数倍なので BM⊥AC
     (2) k=√3/3、z_{n+1}=((1−ki)z_n+(1+ki)·3)/2 ⇔ z_{n+1}−3=((1−ki)/2)(z_n−3)、(1−ki)/2=(1/√3)(cos(−π/6)+i sin(−π/6))
         z_1=−3/2+(3√3/2)i、S_0=9·(3√3/2)/2=27√3/4
     (3) |z_n−3|=9·(1/√3)ⁿ、S_n=(1/2)|z_n−3||z_{n+1}−3|sin(π/6)=(27√3/4)(1/3)ⁿ
     (4) arg(z_n−3)=π−nπ/6 → はじめて実数は z_6=3+1/3=10/3。3 は線分 z_6z_0 上なので
         多角形 z_0…z_6 の面積=S_0+…+S_5=(27√3/4)(1−3⁻⁶)/(2/3)=91√3/9（座標の面積公式でも一致）
     考えてみよう：z_n→3、面積の和→81√3/8 */
(function () {
  const k = Math.sqrt(3) / 3, Z = [[-6, 0]];
  for (let n = 0; n < 6; n++) { const [x, y] = Z[n], ax = x - 3, ay = y; Z.push([3 + (ax + k * ay) / 2, (ay - k * ax) / 2]); }   // z_{n+1}−3 = (1−ki)/2·(z_n−3)
  const D3 = [3, 0];
  const cp = (id, items, view, w) => { const v = view || [-6.7, -0.75, 4.3, 3.3], W = w || 640; return { t: 'fig', id, col: 1, view: v, w: W, h: Math.round(W * (v[3] - v[1]) / (v[2] - v[0])), items: [
    { k: 'axes', tx: [[-6, '−6'], [3, '3']], ty: [], xl: '実軸', yl: '虚軸' }].concat(items || []) }; };
  const ZP = (n, dir, sz) => ({ k: 'pt', at: Z[n], name: 'z' + '₀₁₂₃₄₅₆'[n], dir: dir || 'n', c: 'y', size: sz || 22 });
  const TRI = n => ({ k: 'poly', pts: [Z[n], Z[n + 1], D3], close: true, c: 'b', wd: 1.5, fill: 'b', alpha: n % 2 ? 0.35 : 0.2 });
  // (1) の図：A(−1.5, 0)、C(2.5, 1)、k=1.2 のとき B=M+0.6i(γ−α)
  const A1 = [-1.5, 0], C1 = [2.5, 1], M1 = [0.5, 0.5], B1 = [0.5 - 0.6 * 1, 0.5 + 0.6 * 4];
  const POINTS = [
    '関係式は **$i$ をふくむ部分とそれ以外に分ける**：$2\\beta=(\\alpha+\\gamma)+ki(\\gamma-\\alpha)$。$\\frac{\\beta-\\mu}{\\gamma-\\alpha}$ が純虚数（0 でない）⇔ 垂直',
    '$z_{n+1}=pz_n+q$ 型は、動かない点 $c$ を見つけて $z_{n+1}-c=p(z_n-c)$。$p$ を極形式にすれば「$c$ を中心とする回転と拡大・縮小」',
    '回転角 $\\theta$・倍率 $r$ なら、三角形の面積は毎回 $r^2$ 倍（等比数列）。実軸にもどるのは回転角の和が $\\pi$ の倍数になるとき'
  ];

  HB.lesson({
    id: 'keio26-4', field: '慶應型　数学（理工）', title: '2026 慶應 理工 第4問の類題 ― 二等辺三角形をつくる関係式と、回りながら縮む点列', level: '2026年度 慶應義塾大学 理工学部 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '複素数平面上の異なる 3 点 A$(\\alpha)$，B$(\\beta)$，C$(\\gamma)$ と正の実数 $k$ が\n　$2\\beta=(1-ki)\\alpha+(1+ki)\\gamma$　……（＊）\nを満たしている。次の空欄にあてはまる数または式を答えよ。また、(1) の後半は証明を書け。',
      parts: [
        '(1)　線分 AC の中点を M$(\\mu)$ とすると、$\\beta-\\mu=\\boxed{\\text{ア}}\\,(\\gamma-\\alpha)$ と表せる。これを用いて、直線 BM と直線 AC が垂直に交わることを証明せよ。',
        '(2)　以下、$k=\\dfrac{\\sqrt3}{3}$ とする。$z_0=-6$ とし、$n=0,\\ 1,\\ 2,\\ \\ldots$ に対して、（＊）で $\\alpha=z_n,\\ \\gamma=3$ とおいたときの $\\beta$ を $z_{n+1}$ とする。$z_1=\\boxed{\\text{イ}}$ であり、3 点 $z_0,\\ z_1,\\ 3$ を頂点とする三角形の面積は $\\boxed{\\text{ウ}}$ である。',
        '(3)　3 点 $z_n,\\ z_{n+1},\\ 3$ を頂点とする三角形の面積を $S_n$ とすると、$S_n=\\boxed{\\text{エ}}$ である。',
        '(4)　$z_1,\\ z_2,\\ z_3,\\ \\ldots$ のうち、はじめて実数になるのは $z_{\\boxed{\\text{オ}}}=\\boxed{\\text{カ}}$ である。点 $z_0,\\ z_1,\\ \\ldots,\\ z_{\\boxed{\\text{オ}}}$ を順に線分で結び、最後に $z_{\\boxed{\\text{オ}}}$ と $z_0$ を結んでできる多角形の面積は $\\boxed{\\text{キ}}$ である。'
      ],
      src: '※ 2026年度 慶應義塾大学 理工学部 一般選抜 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面の問題です。1つの関係式が「二等辺三角形」を表していることを見ぬき、それを次々に使ってできる点列を調べます。まず問題文を読みましょう。',
        add: [{ t: 'prob', style: 'font-size:20px;line-height:1.5' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '（＊）を、$i$ をふくむ部分とふくまない部分に分けます。すると右辺に $\\alpha+\\gamma$（中点の2倍）と $\\gamma-\\alpha$（AC の向き）があらわれます。',
        add: [{ t: 'h', text: '(1)　中点 M と、B の位置' },
          { t: 'm', tex: '2\\beta=(\\alpha+\\gamma)+ki(\\gamma-\\alpha)', note: '$i$ をふくむ部分と\nそれ以外に分けた' },
          { t: 'm', tex: '\\mu=\\frac{\\alpha+\\gamma}{2}' },
          { t: 'fig', id: 'h1', col: 1, view: [-2.2, -0.7, 3.2, 3.5], w: 500, h: 389, items: [
            { k: 'seg', a: A1, b: C1, c: 'w', wd: 3 }, { k: 'seg', a: A1, b: B1, c: 'w', wd: 2 }, { k: 'seg', a: C1, b: B1, c: 'w', wd: 2 },
            { k: 'pt', at: A1, name: 'A(α)', dir: 'sw', c: 'w', size: 22 }, { k: 'pt', at: C1, name: 'C(γ)', dir: 'se', c: 'w', size: 22 }, { k: 'pt', at: B1, name: 'B(β)', dir: 'n', c: 'y', size: 22 },
            { k: 'pt', at: M1, name: 'M(μ)', dir: 'se', c: 'g', size: 22 }] }] },
      { ask: { type: 'choice', q: '$\\beta-\\mu$ は $(\\gamma-\\alpha)$ の何倍？（空欄ア）',
        opts: ['$ki$', '$\\dfrac k2i$', '$-\\dfrac k2i$', '$\\dfrac{1+ki}{2}$'], ok: 1,
        why: { 0: '両辺を 2 で割るのを忘れています。$\\beta=\\mu+\\frac k2i(\\gamma-\\alpha)$。', 2: '右辺の $i$ をふくむ部分は $ki\\gamma-ki\\alpha=ki(\\gamma-\\alpha)$。符号は ＋ です。', 3: 'それは $\\frac{\\beta-\\alpha}{\\gamma-\\alpha}$（A から見た B）。M から見ると実部の $\\frac12$ が消えます。' },
        good: '両辺を 2 で割って $\\mu$ を移すと $\\beta-\\mu=\\dfrac k2i(\\gamma-\\alpha)$。実数部分がないのがポイントです。',
        add: [{ t: 'ans', label: 'ア', tex: '\\beta-\\mu=\\frac{k}{2}\\,i\\,(\\gamma-\\alpha)' }],
        draw: [{ fig: 'h1', items: [{ k: 'seg', a: M1, b: B1, c: 'g', wd: 3, dash: true }, { k: 'right', o: M1, a: B1, b: C1, s: 16 }]}] } },

      // ---------- (1) 証明 ----------
      { clear: true, cols: [1], part: '(1) 証明', say: '証明の答案です。「純虚数（0 でない）倍 ⇔ 垂直」を使うので、**0 でないこと** をきちんと書きます。B と M が同じ点だと、直線 BM が決まらないからです。',
        add: [{ t: 'h', text: '(1)　証明の答案の例' },
          { t: 'box', c: 'w', size: 'sm', label: '証明', text: '（＊）より $2\\beta=(\\alpha+\\gamma)+ki(\\gamma-\\alpha)$。$\\mu=\\dfrac{\\alpha+\\gamma}{2}$ だから　$\\beta-\\mu=\\dfrac k2i(\\gamma-\\alpha)$　……①\nA，C は異なる点なので $\\gamma-\\alpha\\neq0$。また $k>0$ なので、① より $\\beta-\\mu\\neq0$、つまり B と M は異なる点である。\nよって $\\dfrac{\\beta-\\mu}{\\gamma-\\alpha}=\\dfrac k2i$ は 0 でない純虚数であるから、$\\mathrm{MB}\\perp\\mathrm{AC}$。\nM は直線 AC 上の点なので、直線 BM と直線 AC は点 M で垂直に交わる。　（証明終）' }] },
      { ask: { type: 'choice', q: '答案で「$\\beta-\\mu\\neq0$」を確かめたのは、何のため？',
        opts: ['$\\gamma-\\alpha$ で割るため', 'B と M が異なり、直線 BM が決まるため', '$k$ が正であることを示すため', 'M が AC の中点であることを示すため'], ok: 1,
        why: { 0: '割るために必要なのは $\\gamma-\\alpha\\neq0$ のほう。それは「A，C は異なる」から言えます。', 2: '$k>0$ は問題の条件で、示すものではありません。', 3: 'M は中点として定めた点です。示す必要はありません。' },
        good: '比が 0 だと、純虚数とも言えず、直線 BM も決まりません。0 でない純虚数であることが「垂直」の条件です。' } },
      { ask: { type: 'think', q: '(1) から、BA $=$ BC（三角形 ABC は B を頂点とする二等辺三角形）であることを、複素数で確かめよう。',
        hint: '$\\beta-\\alpha$ と $\\beta-\\gamma$ をそれぞれ $(\\gamma-\\alpha)$ の何倍かで表し、絶対値をくらべる。',
        ans: '$\\beta-\\alpha=\\dfrac{1+ki}{2}(\\gamma-\\alpha)$、$\\beta-\\gamma=\\dfrac{-1+ki}{2}(\\gamma-\\alpha)$。どちらも絶対値は $\\dfrac{\\sqrt{1+k^2}}{2}|\\gamma-\\alpha|$ で等しい',
        after: 'M が中点で BM ⊥ AC なので、図形としても当然です（BM は AC の垂直二等分線）。' } },

      // ---------- (2) ----------
      { clear: true, cols: [0.44, 0.56], part: '(2)', say: '（＊）で $\\alpha=z_n,\\ \\gamma=3$ とすると、$z_{n+1}$ は「$z_n$ と 3 を底辺とする二等辺三角形の頂点」。式を 3 を中心に見る形に直します。',
        add: [{ t: 'h', text: '(2)　点列を「3 を中心に」見る' },
          { t: 'm', size: 'sm', tex: '2z_{n+1}=(1-ki)z_n+(1+ki)\\cdot3' },
          { t: 'm', tex: 'z_{n+1}-3=\\frac{1-ki}{2}(z_n-3)', note: '両辺から 3 を引いて整理' },
          cp('c1', [ZP(0, 'n'), { k: 'pt', at: D3, c: 'p', r: 5 }])] },
      { ask: { type: 'choice', q: '$k=\\frac{\\sqrt3}{3}$ のとき、$\\dfrac{1-ki}{2}$ の絶対値と偏角は？',
        opts: ['絶対値 $\\frac1{\\sqrt3}$、偏角 $\\frac{\\pi}{6}$', '絶対値 $\\frac{2}{\\sqrt3}$、偏角 $-\\frac{\\pi}{6}$', '絶対値 $\\frac1{\\sqrt3}$、偏角 $-\\frac{\\pi}{6}$', '絶対値 $\\frac1{\\sqrt3}$、偏角 $-\\frac{\\pi}{3}$'], ok: 2,
        why: { 0: '虚部は $-\\frac{\\sqrt3}{6}<0$。偏角はマイナスです。', 1: '$|1-ki|=\\frac{2}{\\sqrt3}$ を、さらに 2 で割るのを忘れています。', 3: '$\\tan\\theta=-\\frac{\\sqrt3/6}{1/2}=-\\frac1{\\sqrt3}$ なので $-\\frac{\\pi}{6}$ です。' },
        good: '$\\dfrac{1-ki}{2}=\\dfrac12-\\dfrac{\\sqrt3}{6}i$。絶対値 $\\frac1{\\sqrt3}$、偏角 $-\\frac{\\pi}{6}$。**3 を中心に $-30^\\circ$ 回転して $\\frac1{\\sqrt3}$ 倍** です。' } },
      { say: 'だから $z_1-3=\\frac1{\\sqrt3}$ 倍・$-30^\\circ$ 回転した $(-9)$。計算すると $z_1=-\\frac32+\\frac{3\\sqrt3}{2}i$。三角形は底辺 9、高さ $\\frac{3\\sqrt3}{2}$ です。',
        add: [{ t: 'm', size: 'sm', tex: 'z_1=3+\\Big(\\frac12-\\frac{\\sqrt3}{6}i\\Big)(-9)' },
          { t: 'ans', label: 'イ', tex: 'z_1=-\\frac32+\\frac{3\\sqrt3}{2}\\,i' },
          { t: 'ans', label: 'ウ', tex: '\\frac12\\cdot9\\cdot\\frac{3\\sqrt3}{2}=\\frac{27\\sqrt3}{4}' }],
        draw: [{ fig: 'c1', items: [TRI(0), ZP(1, 'n'), { k: 'angle', o: D3, a: Z[0], b: Z[1], rp: 46, label: '30°', c: 'p' }] }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.44, 0.56], part: '(3)', say: '1 回ごとに、3 からの距離は $\\frac1{\\sqrt3}$ 倍、向きは $30^\\circ$ ずつ回ります。三角形 $z_n z_{n+1}\\,3$ は、3 の所の角がいつも $30^\\circ$ です。',
        add: [{ t: 'h', text: '(3)　面積 Sₙ' },
          { t: 'm', tex: '|z_n-3|=9\\Big(\\frac1{\\sqrt3}\\Big)^n' },
          { t: 'm', size: 'sm', tex: 'S_n=\\frac12|z_n-3||z_{n+1}-3|\\sin\\frac{\\pi}{6}' },
          cp('c2', [TRI(0), TRI(1), TRI(2), TRI(3), TRI(4), TRI(5), ZP(0, 'n'), ZP(1), ZP(2), ZP(3, 'ne', 20), { k: 'pt', at: D3, c: 'p', r: 5 }])] },
      { ask: { type: 'choice', q: '$\\dfrac{S_{n+1}}{S_n}$ は？',
        opts: ['$\\dfrac1{\\sqrt3}$', '$\\dfrac19$', '$\\dfrac12$', '$\\dfrac13$'], ok: 3,
        why: { 0: 'それは長さの比。面積は2つの辺の積なので $\\left(\\frac1{\\sqrt3}\\right)^2$ です。', 1: '$\\left(\\frac1{\\sqrt3}\\right)^2=\\frac13$。$\\frac13$ を2乗しすぎています。', 2: '角の $\\sin\\frac{\\pi}{6}=\\frac12$ は毎回同じなので、比には出てきません。' },
        good: '相似比 $\\frac1{\\sqrt3}$ の相似な三角形なので、面積比は $\\frac13$。$S_n$ は公比 $\\frac13$ の等比数列です。',
        add: [{ t: 'ans', label: 'エ', tex: 'S_n=\\frac{27\\sqrt3}{4}\\Big(\\frac13\\Big)^n' }] } },

      // ---------- (4) ----------
      { clear: true, cols: [0.44, 0.56], part: '(4)', say: '$z_0-3=-9$ の偏角は $\\pi$。1 回で $-\\frac{\\pi}{6}$ ずつ回るので、$z_n-3$ の偏角は $\\pi-\\frac{n\\pi}{6}$。実数になるのは、これが $\\pi$ の整数倍のとき。',
        add: [{ t: 'h', text: '(4)　実軸にもどる点と多角形' },
          { t: 'm', tex: '\\arg(z_n-3)=\\pi-\\frac{n\\pi}{6}' },
          cp('c3', [{ k: 'poly', pts: Z, close: true, c: 'y', wd: 2.5, fill: 'y', alpha: 0.18 }, ZP(0, 'n'), ZP(1), ZP(2), ZP(3, 'ne', 20), { k: 'pt', at: D3, c: 'p', r: 5 }])] },
      { ask: { type: 'choice', q: 'はじめて実数になる $n$（空欄オ）は？',
        opts: ['$n=3$', '$n=6$', '$n=12$', '$n=4$'], ok: 1,
        why: { 0: '$n=3$ では偏角 $\\frac{\\pi}{2}$。3 の真上（虚部が正）です。', 2: '1 周（$2\\pi$）しなくても、半周（$\\pi$）回れば実軸の反対側にのります。', 3: '偏角 $\\pi-\\frac{4\\pi}{6}=\\frac{\\pi}{3}$。まだ実軸の上です。' },
        good: '$\\pi-\\frac{n\\pi}{6}=0$ となる $n=6$ がはじめて。$z_6-3=-9\\cdot\\frac1{27}\\cdot(-1)=\\frac13$ です。',
        add: [{ t: 'ans', label: 'オ・カ', tex: 'z_6=3+\\frac13=\\frac{10}{3}' }],
        draw: [{ fig: 'c3', items: [{ k: 'pt', at: Z[6], name: 'z₆', dir: 'se', off: 28, c: 'y', size: 20 }] }] } },
      { say: '3 は $z_6$ と $z_0$ を結ぶ線分の上にあります。だから多角形は、3 を共通の頂点とする6つの三角形 $S_0$〜$S_5$ に分かれます。',
        add: [{ t: 'm', tex: 'S_0+S_1+\\cdots+S_5=\\frac{27\\sqrt3}{4}\\cdot\\frac{1-\\left(\\frac13\\right)^6}{1-\\frac13}' }] },
      { ask: { type: 'choice', q: '多角形の面積（空欄キ）は？',
        opts: ['$\\dfrac{91\\sqrt3}{9}$', '$\\dfrac{81\\sqrt3}{8}$', '$\\dfrac{81\\sqrt3}{2}$', '$\\dfrac{91\\sqrt3}{27}$'], ok: 0,
        why: { 1: 'それは無限に足したときの値。三角形は 6 個だけです。', 2: '6 個とも $S_0$ と同じ面積として足しています。', 3: '$\\frac{1}{1-\\frac13}=\\frac32$ をかけるところで、分母を 3 倍しています。' },
        good: '$\\frac{27\\sqrt3}{4}\\cdot\\frac32\\cdot\\frac{728}{729}=\\frac{91\\sqrt3}{9}$。$\\frac{728}{729}$ と $\\frac{81}{8}$ の約分がポイントです。',
        add: [{ t: 'ans', label: 'キ', tex: '\\frac{27\\sqrt3}{4}\\cdot\\frac32\\cdot\\frac{728}{729}=\\frac{91\\sqrt3}{9}' }] } },
      { ask: { type: 'think', q: 'もし点列をずっと続けたら、$z_n$ はどこに近づく？　$S_0+S_1+S_2+\\cdots$（無限に足す）は？',
        hint: '$|z_n-3|=9\\left(\\frac1{\\sqrt3}\\right)^n$。面積は公比 $\\frac13$ の無限等比級数。',
        ans: '$|z_n-3|\\to0$ なので $z_n\\to3$。和は $\\dfrac{27\\sqrt3/4}{1-\\frac13}=\\dfrac{81\\sqrt3}{8}$',
        after: '6 個の和 $\\frac{91\\sqrt3}{9}\\approx17.51$ は、すでに無限の和 $\\frac{81\\sqrt3}{8}\\approx17.54$ にとても近い。検算にも使えます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。関係式を分けて読む・動かない点を中心に見る・面積は相似比の2乗。この3つで全部の小問がつながりました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、(1) の証明を自分で書いてみましょう。' }
    ]
  });
})();
