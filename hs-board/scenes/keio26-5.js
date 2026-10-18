/* 慶應型 数学（理工）：2026年度 慶應義塾大学 理工学部 第5問の類題（自作問題・元の問題ではない）
   問題：(1) ド・モアブル (2) cos⁴ の1次式 (3) 曲線 C:(x²+y²)⁷=(x³−3xy²)⁴ の極方程式と面積。全部空欄。
   答え（python3 で検算ずみ）：
     (1) cos3θ=cos³θ−3cosθsin²θ。0≦θ≦π で z³ が純虚数 ⇔ cos3θ=0 ⇔ θ=π/6, π/2, 5π/6
     (2) cos⁴α=(3+4cos2α+cos4α)/8（α=0 で 1）。∫₀^{π/2}cos⁴α dα=3π/16
     (3) x³−3xy²=r³cos3θ（z³ の実部）→ r¹⁴=r¹²cos⁴3θ → r=cos²3θ（r に (r cosθ, r sinθ) を入れると方程式を満たすことも sympy で確認）
         θ=0 で (1,0)、θ=π/6 ではじめて r=0。S=(1/2)∫₀^{π/6}cos⁴3θ dθ=(1/2)(1/3)(3π/16)=π/32（座標で面積を数値計算しても 0.0981748）
     考えてみよう：C 全体で囲まれた面積 (1/2)∫₀^{2π}cos⁴3θ dθ=3π/8 */
(function () {
  const RX = 'cos(3*t)**2*cos(t)', RY = 'cos(3*t)**2*sin(t)';
  const arc = []; for (let i = 0; i <= 60; i++) { const t = Math.PI / 6 * i / 60, r = Math.cos(3 * t) ** 2; arc.push([r * Math.cos(t), r * Math.sin(t)]); }
  const REG = { k: 'poly', pts: arc.concat([[0, 0]]), close: true, c: 'p', wd: 3, fill: 'p', alpha: 0.35 };
  const whole = (id, items) => ({ t: 'fig', id, col: 1, view: [-1.25, -1.15, 1.25, 1.15], w: 440, h: 405, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1, '1']] },
    { k: 'param', x: RX, y: RY, a: 0, b: 2 * Math.PI, n: 720, c: 'y', wd: 3 }, { k: 'label', at: [0.78, 0.95], text: 'C', c: 'y', size: 26 }].concat(items || []) });
  const SECT = []; for (let j = 0; j < 6; j++) { const t1 = j * Math.PI / 36, t2 = (j + 1) * Math.PI / 36, r = Math.cos(3 * (t1 + t2) / 2) ** 2, pts = [[0, 0]]; for (let q = 0; q <= 6; q++) { const t = t1 + (t2 - t1) * q / 6; pts.push([r * Math.cos(t), r * Math.sin(t)]); } SECT.push({ k: 'poly', pts, close: true, c: 'b', wd: 1.5, fill: 'b', alpha: j % 2 ? 0.35 : 0.2 }); }
  const POINTS = [
    'ド・モアブル $(\\cos\\theta+i\\sin\\theta)^3=\\cos3\\theta+i\\sin3\\theta$ を展開して実部・虚部をくらべる。$x^3-3xy^2$ は $(x+yi)^3$ の実部 $=r^3\\cos3\\theta$',
    '$\\cos^4\\alpha$ は半角の公式を2回：$\\cos^4\\alpha=\\dfrac{3+4\\cos2\\alpha+\\cos4\\alpha}{8}$。$\\alpha=0$ で 1 になるか検算',
    '極方程式 $r=f(\\theta)$ の曲線と原点を結ぶ部分の面積は、細い扇形の和で $S=\\dfrac12\\displaystyle\\int_\\alpha^\\beta r^2\\,d\\theta$。$\\theta$ の範囲は「$r=0$ になる角」で決める'
  ];

  HB.lesson({
    id: 'keio26-5', field: '慶應型　数学（理工）', title: '2026 慶應 理工 第5問の類題 ― ド・モアブルと花びらの曲線の面積', level: '2026年度 慶應義塾大学 理工学部 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '次の空欄にあてはまる数または式を答えよ。',
      parts: [
        '(1)　$\\theta$ を実数とし、$z=\\cos\\theta+i\\sin\\theta$ とする。ド・モアブルの定理を用いて $z^3$ を 2 通りに表し、実部をくらべると $\\cos3\\theta=\\cos^3\\theta-\\boxed{\\text{ア}}\\cos\\theta\\sin^2\\theta$ である。また、$0\\le\\theta\\le\\pi$ の範囲で $z^3$ が純虚数となる $\\theta$ は、小さい順に $\\theta=\\boxed{\\text{イ}},\\ \\boxed{\\text{ウ}},\\ \\boxed{\\text{エ}}$ である。',
        '(2)　すべての実数 $\\alpha$ について、$\\cos^4\\alpha=\\dfrac{\\boxed{\\text{オ}}+\\boxed{\\text{カ}}\\cos2\\alpha+\\cos4\\alpha}{8}$ が成り立つ。',
        '(3)　座標平面上の曲線 $C:\\ (x^2+y^2)^7=(x^3-3xy^2)^4$ を考える。$C$ 上の原点以外の点を極座標 $(r,\\ \\theta)\\ (r>0)$ で表すと、$C$ の極方程式は $r=\\cos^{\\boxed{\\text{キ}}}\\big(\\boxed{\\text{ク}}\\,\\theta\\big)$ となる。点 $(1,\\ 0)$ から出発し、$\\theta$ を 0 から増やしながら $C$ をたどると、$\\theta=\\boxed{\\text{ケ}}$ ではじめて原点に達する。このとき通った弧と $x$ 軸とで囲まれた部分の面積は $\\boxed{\\text{コ}}$ である。'
      ],
      src: '※ 2026年度 慶應義塾大学 理工学部 一般選抜 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数・三角関数・極方程式・積分がつながった問題です。(1)(2) で作った道具を (3) で使う流れ。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob', style: 'font-size:21px;line-height:1.55' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: 'ド・モアブルの定理で $z^3=\\cos3\\theta+i\\sin3\\theta$。一方、$(\\cos\\theta+i\\sin\\theta)^3$ を展開します。$i^2=-1,\\ i^3=-i$ に注意。',
        add: [{ t: 'h', text: '(1)　ド・モアブルの定理' },
          { t: 'm', tex: 'z^3=\\cos3\\theta+i\\sin3\\theta', note: 'ド・モアブル' },
          { t: 'm', size: 'sm', tex: 'z^3=\\cos^3\\theta+3i\\cos^2\\theta\\sin\\theta+3i^2\\cos\\theta\\sin^2\\theta+i^3\\sin^3\\theta', note: '展開' }] },
      { ask: { type: 'choice', q: '実部をくらべると $\\cos3\\theta=\\cos^3\\theta-\\boxed{\\text{ア}}\\cos\\theta\\sin^2\\theta$。アは？',
        opts: ['$1$', '$6$', '$3$', '$2$'], ok: 2,
        why: { 0: '展開の係数 ${}_3\\mathrm{C}_2=3$ を忘れています。', 1: '$3i^2=-3$ です。2 倍する理由はありません。', 3: '$(a+b)^3$ の係数は $1,\\ 3,\\ 3,\\ 1$。2 は出てきません。' },
        good: '実部は $\\cos^3\\theta-3\\cos\\theta\\sin^2\\theta$、虚部は $3\\cos^2\\theta\\sin\\theta-\\sin^3\\theta$。',
        add: [{ t: 'ans', label: 'ア', tex: '\\cos3\\theta=\\cos^3\\theta-3\\cos\\theta\\sin^2\\theta' }] } },
      { say: 'これを $r$ 倍した形が (3) で効きます。点 $(x,\\ y)=(r\\cos\\theta,\\ r\\sin\\theta)$ なら、$x^3-3xy^2$ は $(x+yi)^3$ の実部で、$r^3\\cos3\\theta$ です。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '(3) への準備', text: '$x+yi=r(\\cos\\theta+i\\sin\\theta)$ のとき\n$x^3-3xy^2=r^3(\\cos^3\\theta-3\\cos\\theta\\sin^2\\theta)=r^3\\cos3\\theta$' }] },
      { ask: { type: 'choice', q: '$0\\le\\theta\\le\\pi$ で $z^3$ が純虚数となる $\\theta$（イ・ウ・エ）は？',
        opts: ['$\\frac{\\pi}{3},\\ \\frac{2\\pi}{3},\\ \\pi$', '$\\frac{\\pi}{6},\\ \\frac{\\pi}{3},\\ \\frac{\\pi}{2}$', '$\\frac{\\pi}{2}$ だけ', '$\\frac{\\pi}{6},\\ \\frac{\\pi}{2},\\ \\frac{5\\pi}{6}$'], ok: 3,
        why: { 0: 'それは $\\sin3\\theta=0$（$z^3$ が実数）になる角です。', 1: '$3\\theta=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2},\\ \\frac{5\\pi}{2}$ を 3 で割ります。$\\frac{\\pi}{3}$ では $\\cos\\pi=-1$。', 2: '$z$ が純虚数になるのは $\\frac{\\pi}{2}$ だけですが、$z^3$ は $3\\theta$ で考えます。' },
        good: '純虚数 ⇔ 実部 $\\cos3\\theta=0$（虚部は $\\pm1$）。$0\\le3\\theta\\le3\\pi$ で $3\\theta=\\frac{\\pi}{2},\\ \\frac{3\\pi}{2},\\ \\frac{5\\pi}{2}$。',
        add: [{ t: 'ans', label: 'イ・ウ・エ', tex: '\\theta=\\frac{\\pi}{6},\\ \\ \\frac{\\pi}{2},\\ \\ \\frac{5\\pi}{6}' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '$\\cos^4\\alpha=(\\cos^2\\alpha)^2$ と見て、半角の公式 $\\cos^2\\alpha=\\frac{1+\\cos2\\alpha}{2}$ を使います。2乗すると $\\cos^22\\alpha$ が出るので、もう1回使います。',
        add: [{ t: 'h', text: '(2)　cos⁴α を 1 次式に' },
          { t: 'm', tex: '\\cos^4\\alpha=\\Big(\\frac{1+\\cos2\\alpha}{2}\\Big)^2=\\frac{1+2\\cos2\\alpha+\\cos^22\\alpha}{4}' },
          { t: 'm', tex: '\\cos^22\\alpha=\\frac{1+\\cos4\\alpha}{2}', note: 'もう1回、半角の公式' }] },
      { ask: { type: 'choice', q: '整理すると $\\cos^4\\alpha=\\dfrac{\\boxed{\\text{オ}}+\\boxed{\\text{カ}}\\cos2\\alpha+\\cos4\\alpha}{8}$。（オ, カ）は？',
        opts: ['$(1,\\ 2)$', '$(3,\\ 4)$', '$(2,\\ 4)$', '$(3,\\ 2)$'], ok: 1,
        why: { 0: '分母を 8 にそろえるとき、分子も 2 倍します。また $\\cos^22\\alpha$ からの $\\frac12$ も定数に入ります。', 2: '定数は $2+1=3$。$\\cos^22\\alpha=\\frac{1+\\cos4\\alpha}{2}$ の $\\frac12$ を足し忘れています。', 3: '$2\\cos2\\alpha$ を 2 倍して $4\\cos2\\alpha$ です。' },
        good: '$\\frac{1}{4}\\Big(1+2\\cos2\\alpha+\\frac{1+\\cos4\\alpha}{2}\\Big)=\\frac{3+4\\cos2\\alpha+\\cos4\\alpha}{8}$。$\\alpha=0$ で $\\frac{3+4+1}{8}=1$ と検算。',
        add: [{ t: 'ans', label: 'オ・カ', tex: '\\cos^4\\alpha=\\frac{3+4\\cos2\\alpha+\\cos4\\alpha}{8}' }] } },
      { ask: { type: 'think', q: '(2) を使って $\\displaystyle\\int_0^{\\frac{\\pi}{2}}\\cos^4\\alpha\\,d\\alpha$ を求めよう。(3) でこの値を使います。',
        hint: '$\\cos2\\alpha,\\ \\cos4\\alpha$ を積分すると $\\frac{\\sin2\\alpha}{2},\\ \\frac{\\sin4\\alpha}{4}$。$\\alpha=\\frac{\\pi}{2}$ でどちらも 0。',
        ans: '$\\dfrac18\\Big[3\\alpha+2\\sin2\\alpha+\\dfrac{\\sin4\\alpha}{4}\\Big]_0^{\\frac{\\pi}{2}}=\\dfrac18\\cdot\\dfrac{3\\pi}{2}=\\dfrac{3\\pi}{16}$',
        after: '$\\sin$ の項が消えて、定数項 $\\frac38$ だけが残る。これが 1 次式に直すうれしさです。',
        add: [{ t: 'm', tex: '\\int_0^{\\frac{\\pi}{2}}\\cos^4\\alpha\\,d\\alpha=\\frac{3\\pi}{16}' }] } },

      // ---------- (3) 極方程式 ----------
      { clear: true, part: '(3)', say: '$x=r\\cos\\theta,\\ y=r\\sin\\theta$ を入れます。左辺は $(r^2)^7=r^{14}$。右辺は (1) の準備から $(r^3\\cos3\\theta)^4=r^{12}\\cos^43\\theta$。',
        add: [{ t: 'h', text: '(3)　C の極方程式' },
          { t: 'm', tex: 'r^{14}=r^{12}\\cos^43\\theta\\ \\Longrightarrow\\ r^2=\\cos^43\\theta', note: '$r>0$ で割った' }] },
      { ask: { type: 'choice', q: '$r>0$ のとき、$C$ の極方程式（キ・ク）は？',
        opts: ['$r=\\cos3\\theta$', '$r=\\cos^43\\theta$', '$r^2=\\cos3\\theta$', '$r=\\cos^23\\theta$'], ok: 3,
        why: { 0: '$r^2=(\\cos^23\\theta)^2$ の平方根は $\\cos^23\\theta$（0 以上）。$\\cos3\\theta$ は負にもなります。', 1: '左辺は $r^2$ です。平方根をとります。', 2: '指数の計算ちがい。$r^{14}\\div r^{12}=r^2$、右辺は $\\cos^43\\theta$ のまま。' },
        good: '$r>0$ と $\\cos^23\\theta\\ge0$ から、$r^2=(\\cos^23\\theta)^2$ ⇔ $r=\\cos^23\\theta$。',
        add: [{ t: 'ans', label: 'キ・ク', tex: 'r=\\cos^2 3\\theta' }] } },
      { say: '$r=\\cos^23\\theta$ は $0\\le r\\le1$。$r$ が 0 になるのは $\\cos3\\theta=0$、つまり (1) で求めた角の方向です。その間に花びらが 6 枚できます。',
        add: [{ t: 'tbl', size: 'sm', rows: [['$\\theta$', '$0$', '$\\frac{\\pi}{6}$', '$\\frac{\\pi}{3}$', '$\\frac{\\pi}{2}$'], ['$r$', '$1$', '$0$', '$1$', '$0$']] },
          whole('w1', [{ k: 'line', m: Math.tan(Math.PI / 6), n: 0, c: 'd', wd: 1.5, dash: true }, { k: 'pt', at: [1, 0], c: 'p', name: '(1, 0)', dir: 'n', off: 26, size: 20 }])] },
      { ask: { type: 'choice', q: '$\\theta$ を 0 から増やすと、はじめて原点に達するのは（ケ）？',
        opts: ['$\\theta=\\dfrac{\\pi}{3}$', '$\\theta=\\dfrac{\\pi}{6}$', '$\\theta=\\dfrac{\\pi}{2}$', '$\\theta=\\dfrac{\\pi}{12}$'], ok: 1,
        why: { 0: '$\\theta=\\frac{\\pi}{3}$ では $r=\\cos^2\\pi=1$。となりの花びらの先です。', 2: 'その前に $\\theta=\\frac{\\pi}{6}$ で原点を通ります。', 3: '$r=\\cos^2\\frac{\\pi}{4}=\\frac12$。まだ原点ではありません。' },
        good: '$\\cos3\\theta=0$ となる最小の正の $\\theta$ は $\\frac{\\pi}{6}$。(1) の結果がそのまま使えました。',
        add: [{ t: 'ans', label: 'ケ', tex: '\\theta=\\frac{\\pi}{6}' }],
        draw: [{ fig: 'w1', items: [REG] }] } },

      // ---------- (3) 面積 ----------
      { clear: true, cols: [0.5, 0.5], part: '(3) 面積', say: '原点から見た角が $\\Delta\\theta$ の細い部分は、半径 $r$ の扇形とほぼ同じで、面積は $\\frac12r^2\\Delta\\theta$。これを足し合わせて積分にします。',
        add: [{ t: 'h', text: '(3)　極座標で面積を求める' },
          { t: 'box', c: 'y', size: 'sm', label: '扇形の和', text: '$S=\\dfrac12\\displaystyle\\int_{\\alpha}^{\\beta}r^2\\,d\\theta$\n（教科書の発展。入試では、扇形の和として使ってよい）' },
          { t: 'fig', id: 's1', col: 1, view: [-0.08, -0.1, 1.12, 0.36], w: 600, h: 230, items: [
            { k: 'axes', tx: [[1, '1']], ty: [], xl: 'x', yl: '' }].concat(SECT, [REG, { k: 'line', m: Math.tan(Math.PI / 6), n: 0, c: 'd', wd: 1.5, dash: true }]) }] },
      { say: '今は $r^2=\\cos^43\\theta$、$\\theta$ は 0 から $\\frac{\\pi}{6}$ まで。$3\\theta=\\alpha$ とおくと、$\\alpha$ は 0 から $\\frac{\\pi}{2}$、$d\\theta=\\frac13d\\alpha$ です。',
        add: [{ t: 'm', tex: '\\begin{aligned}S&=\\frac12\\int_0^{\\frac{\\pi}{6}}\\cos^43\\theta\\,d\\theta\\\\ &=\\frac12\\cdot\\frac13\\int_0^{\\frac{\\pi}{2}}\\cos^4\\alpha\\,d\\alpha\\end{aligned}' }] },
      { ask: { type: 'choice', q: '面積 $S$（空欄コ）は？',
        opts: ['$\\dfrac{\\pi}{16}$', '$\\dfrac{\\pi}{32}$', '$\\dfrac{\\pi}{4}$', '$\\dfrac{\\pi}{64}$'], ok: 1,
        why: { 0: '扇形の面積の $\\frac12$ を忘れています。', 2: '(2) の分母 8 を忘れています（$\\int_0^{\\pi/2}\\cos^4\\alpha\\,d\\alpha=\\frac{3\\pi}{16}$）。', 3: '$\\frac12$ を 2 回かけています。' },
        good: '$\\frac12\\cdot\\frac13\\cdot\\frac{3\\pi}{16}=\\frac{\\pi}{32}$。半径 1・中心角 $\\frac{\\pi}{6}$ の扇形 $\\frac{\\pi}{12}$ より小さく、つじつまも合います。',
        add: [{ t: 'ans', label: 'コ', tex: 'S=\\frac16\\cdot\\frac{3\\pi}{16}=\\frac{\\pi}{32}' }] } },
      { ask: { type: 'think', q: '$C$ 全体（6 枚の花びら）で囲まれた部分の面積を求めよう。',
        hint: '求めた部分は花びら 1 枚の半分。または $\\frac12\\displaystyle\\int_0^{2\\pi}\\cos^43\\theta\\,d\\theta$。',
        ans: '半分の花びらが 12 個で $12\\cdot\\dfrac{\\pi}{32}=\\dfrac{3\\pi}{8}$',
        after: '(2) の定数項 $\\frac38$ に $\\frac12\\cdot2\\pi$ をかけても $\\frac{3\\pi}{8}$。1 周の積分では $\\cos$ の項がすべて消えます。' } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '空欄のコツ', say: '極座標の面積公式を使わないと、$x=\\cos^23\\theta\\cos\\theta,\\ y=\\cos^23\\theta\\sin\\theta$ として $\\int y\\,dx$ を計算することになり、とても大変です。',
        add: [{ t: 'h', text: '速く・正確に埋めるコツ' },
          { t: 'tbl', cls: 'rowh', size: 'sm', rows: [['小問', '道具', '検算'], ['(1)', 'ド・モアブル＋展開（係数 1, 3, 3, 1）', '$\\theta=0$ で $\\cos0=1$'], ['(2)', '半角の公式を2回', '$\\alpha=0$ で 1、$\\alpha=\\frac{\\pi}{2}$ で 0'], ['(3) 極方程式', '$x^3-3xy^2=r^3\\cos3\\theta$', '点 $(1,\\ 0)$ が $\\theta=0$ で出る'], ['(3) 面積', '$\\frac12\\int r^2d\\theta$ と (2)', '扇形 $\\frac{\\pi}{12}$ より小さい']] }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。(1) で作った式と角、(2) で作った1次式が、(3) で全部使われました。誘導の意味を読むのが、空欄を速く埋めるいちばんのコツです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、空欄を自分でうめてみましょう。' }
    ]
  });
})();
