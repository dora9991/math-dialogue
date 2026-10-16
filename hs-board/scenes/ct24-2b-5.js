/* 2024年度 共通テスト 数学Ⅱ・B 第5問の類題（自作）：空間で、直線上の動点と定点・2つの動点の距離の最小（会話文で方針）
   元の問題文・数値は使っていない。答え（python3 / sympy で検算ずみ）：
   ℓ：P=(s, s, 1)（A(0,0,1)、u=(1,1,0)）、m：Q=(2, t, t)（B(2,0,0)、v=(0,1,1)）、C(1,3,2)。ℓ と m はねじれの位置
   (1) |CP|²=2s²−8s+11（ア 2・イ 8・ウエ 11）、s=2（オ）で最小 √3（カ 3）、CP・u=2s−4（キ 2・ク 4）
   (2) ケ ②（PQ⊥u かつ PQ⊥v）、s=5/3（コ 5・サ 3）、t=4/3（シ 4・ス 3）、PQ=(1/3,−1/3,1/3)、最小 √3/3（セ 3・ソ 3）
   (3) s=t=k：|PQ|²=2k²−6k+5、k=3/2 で最小 √2/2（タ 2・チ 2）。ツ ①。k=3/2 の PQ=(1/2,0,1/2) は u・v と垂直でない */
(function () {
  const POINTS = [
    '直線上の点は　$\\overrightarrow{\\mathrm{OP}}=\\overrightarrow{\\mathrm{OA}}+s\\vec u$。距離は $|\\overrightarrow{\\mathrm{CP}}|^2$ を $s$ の2次式にして平方完成、または $\\overrightarrow{\\mathrm{CP}}\\perp\\vec u$ で求める',
    '2つの直線上の動点 P、Q の距離が最小 ⇔ $\\overrightarrow{\\mathrm{PQ}}\\perp\\vec u$ かつ $\\overrightarrow{\\mathrm{PQ}}\\perp\\vec v$（共通垂線）。内積 = 0 の連立方程式',
    '動き方に条件（$s=t$ など）がつくと、選べる場合が **一部** になる → 最小値は条件なしのとき以上。そのとき PQ は両方に垂直とは限らない'
  ];
  const pj = (x, y, z) => [y - 0.65 * x, z - 0.5 * x];   // 見取図：x 軸は左下へ（PQ が ℓ・m と重ならない向き）
  const L = s => pj(s, s, 1), M = t => pj(2, t, t);
  const C = pj(1, 3, 2), Pa = pj(2, 2, 1), P2 = L(5 / 3), Q2 = M(4 / 3);
  const base = () => [
    { k: 'vec', a: pj(0, 0, 0), b: pj(3.4, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, 0, 0), b: pj(0, 4.0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, 0, 0), b: pj(0, 0, 2.8), c: 'd', wd: 2 },
    { k: 'label', at: pj(3.4, 0, 0), text: 'x', dx: -14, dy: 10, c: 'd', size: 22 }, { k: 'label', at: pj(0, 4.0, 0), text: 'y', dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 2.8), text: 'z', dx: 14, c: 'd', size: 22 },
    { k: 'label', at: pj(0, 0, 0), text: 'O', dx: -10, dy: 16, c: 'd', size: 20 }];
  const ell = { k: 'seg', a: L(-0.7), b: L(3.4), c: 'y', wd: 3 }, ellLab = { k: 'label', at: L(3.4), text: 'ℓ', dx: 14, dy: 8, c: 'y', size: 26 };
  const emm = { k: 'seg', a: M(-0.5), b: M(2.9), c: 'g', wd: 3 }, emmLab = { k: 'label', at: M(2.9), text: 'm', dx: 14, c: 'g', size: 26 };
  const fig = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.5, -1.9, 4.3, 3.0], w: 600, h: 432, items: base().concat(items) });

  HB.lesson({
    id: 'ct24-2b-5', field: '共通テスト型　数学Ⅱ・B', title: '2024 共通テスト 数学Ⅱ・B 第5問の類題 ― 空間の直線と距離の最小', level: '2024年度 第5問の類題（自作）', time: '目安 15〜20分',
    noDec: true,
    problem: {
      label: '類題',
      lead: '座標空間に点 A$(0,\\ 0,\\ 1)$、B$(2,\\ 0,\\ 0)$、C$(1,\\ 3,\\ 2)$ がある。$\\vec u=(1,\\ 1,\\ 0)$、$\\vec v=(0,\\ 1,\\ 1)$ とし、A を通り $\\vec u$ に平行な直線を ℓ、B を通り $\\vec v$ に平行な直線を m とする。ℓ 上の点 P、m 上の点 Q を、実数 $s,\\ t$ を用いて $\\overrightarrow{\\mathrm{OP}}=\\overrightarrow{\\mathrm{OA}}+s\\vec u$、$\\overrightarrow{\\mathrm{OQ}}=\\overrightarrow{\\mathrm{OB}}+t\\vec v$ と表す。',
      parts: [
        '(1)　$|\\overrightarrow{\\mathrm{CP}}|^2=\\boxed{\\text{ア}}\\,s^2-\\boxed{\\text{イ}}\\,s+\\boxed{\\text{ウエ}}$ であり、CP は $s=\\boxed{\\text{オ}}$ のとき最小値 $\\sqrt{\\boxed{\\text{カ}}}$ をとる。\nみなみ「平方完成で求めたけど、図で考えると、CP が ℓ に垂直なときに最小になりそう。」\nけんた「それなら $\\overrightarrow{\\mathrm{CP}}\\cdot\\vec u=0$ を解けばいいね。」　実際 $\\overrightarrow{\\mathrm{CP}}\\cdot\\vec u=\\boxed{\\text{キ}}\\,s-\\boxed{\\text{ク}}$ で、同じ $s$ が得られる。',
        '(2)　P、Q がそれぞれ ℓ、m 上を自由に動くときの、PQ の最小値を考える。\nけんた「(1) と同じように考えると、PQ が最小になるのは $\\boxed{\\text{ケ}}$ ときだね。」（ケ：⓪ $\\overrightarrow{\\mathrm{PQ}}\\perp\\vec u$ となる　① $\\overrightarrow{\\mathrm{PQ}}\\parallel\\vec u$ となる　② $\\overrightarrow{\\mathrm{PQ}}\\perp\\vec u$ かつ $\\overrightarrow{\\mathrm{PQ}}\\perp\\vec v$ となる　③ $s=t$ となる）\nこのとき $s=\\dfrac{\\boxed{\\text{コ}}}{\\boxed{\\text{サ}}}$、$t=\\dfrac{\\boxed{\\text{シ}}}{\\boxed{\\text{ス}}}$ で、PQ の最小値は $\\dfrac{\\sqrt{\\boxed{\\text{セ}}}}{\\boxed{\\text{ソ}}}$ である。',
        '(3)　P、Q が、時刻 $k$ に $s=k,\\ t=k$ の位置にあるように同時に動く。このときの PQ の最小値は $\\dfrac{\\sqrt{\\boxed{\\text{タ}}}}{\\boxed{\\text{チ}}}$ である。(2)・(3) についての記述で正しいものは $\\boxed{\\text{ツ}}$ である。\n（ツ：⓪ (3) の最小値は (2) の最小値より小さくなることがある　① (3) の最小値は (2) の最小値以上である　② (3) で最小になるとき、$\\overrightarrow{\\mathrm{PQ}}$ は $\\vec u$、$\\vec v$ の両方に垂直である　③ (3) の最小値は (2) の最小値といつも等しい）'
      ],
      src: '※ 2024年度 共通テスト 数学Ⅱ・B 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS, pointsTitle: 'この問題のポイント',
    cols: [0.54, 0.46],
    steps: [
      { cols: [1], part: '問題', say: '2024年度 共通テスト 数学Ⅱ・B 第5問の類題です。空間で、直線上を動く点と定点、2つの動点の距離が最小になる状態を調べます。会話文が方針のヒント。',
        add: [{ t: 'prob', style: 'font-size:21px;line-height:1.45' }] },
      { clear: true, cols: [1], part: '解く前に', say: '使うのは、直線のベクトル表示・内積・大きさの3つ。会話文は「次に何をすればよいか」を教えてくれるので、読み飛ばさずに方針として使います。',
        add: [{ t: 'h', text: '解く前に：空間ベクトルの3つの道具' },
          { t: 'box', c: 'b', label: '直線上の点', text: 'A を通り $\\vec u$ に平行な直線上の点は　$\\overrightarrow{\\mathrm{OP}}=\\overrightarrow{\\mathrm{OA}}+s\\vec u$　→ ここでは P$(s,\\ s,\\ 1)$、Q$(2,\\ t,\\ t)$' },
          { t: 'box', c: 'y', label: '垂直と内積', text: '$\\vec a\\perp\\vec b\\iff\\vec a\\cdot\\vec b=0$（$\\vec a,\\ \\vec b$ は $\\vec 0$ でない）' },
          { t: 'box', c: 'g', label: '長さは2乗で', text: '$|\\overrightarrow{\\mathrm{PQ}}|^2=(x\\text{ 成分})^2+(y\\text{ 成分})^2+(z\\text{ 成分})^2$。最小は2乗のままで考え、最後に $\\sqrt{\\ }$' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。P$(s,\\ s,\\ 1)$ なので、$\\overrightarrow{\\mathrm{CP}}=(s-1,\\ s-3,\\ -1)$。右の見取図で、C から直線 ℓ までのいちばん短い距離を探します。',
        add: [{ t: 'h', text: '(1)　定点 C と ℓ 上の点 P' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{CP}}=(s-1,\\ s-3,\\ -1)' },
          fig('f1', [ell, ellLab, { k: 'pt', at: pj(0, 0, 1), name: 'A', dir: 'w', c: 'y', size: 24 }, { k: 'pt', at: C, name: 'C', dir: 'ne', c: 'b', size: 24 }])] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{CP}}|^2$ を $s$ で表すと？',
        opts: ['$2s^2-8s+10$', '$2s^2-8s+11$', '$s^2-4s+11$', '$2s^2-4s+11$'], ok: 1,
        why: { 0: '$z$ 成分 $(-1)^2=1$ を忘れています。空間では3つの成分を全部たします。', 2: '$(s-1)^2$ と $(s-3)^2$ の $s^2$ を合わせると $2s^2$ です。', 3: '$s$ の係数は $-2s-6s=-8s$ です。' },
        good: '$(s-1)^2+(s-3)^2+1=2s^2-8s+11$（ア 2、イ 8、ウエ 11）。',
        add: [{ t: 'm', tex: '|\\overrightarrow{\\mathrm{CP}}|^2=2s^2-8s+11' }] } },
      { say: '平方完成すると $2(s-2)^2+3$。$s=2$ のとき最小で、最小値は $\\sqrt3$（オ 2、カ 3）。このとき P$(2,\\ 2,\\ 1)$ です。',
        add: [{ t: 'm', tex: '=2(s-2)^2+3\\ \\geqq\\ 3', note: '$s=2$ で等号\nP$(2,\\ 2,\\ 1)$' }],
        draw: [{ fig: 'f1', items: [{ k: 'seg', a: C, b: Pa, c: 'p', dash: true }, { k: 'pt', at: Pa, name: 'P', dir: 'sw', c: 'p', size: 24 }, { k: 'label', at: [(C[0] + Pa[0]) / 2, (C[1] + Pa[1]) / 2], text: '√3', dx: 22, dy: -4, c: 'p', size: 22 }] }] },
      { say: 'けんたさんの方針でも確かめます。$\\overrightarrow{\\mathrm{CP}}\\cdot\\vec u=(s-1)\\cdot1+(s-3)\\cdot1+(-1)\\cdot0=2s-4$。これが 0 になるのも $s=2$ です（キ 2、ク 4）。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{CP}}\\cdot\\vec u=2s-4=0\\ \\Rightarrow\\ s=2' },
          { t: 'ans', label: '(1) 答', text: 'ア 2　イ 8　ウエ 11　オ 2　カ 3　キ 2　ク 4' }],
        draw: [{ fig: 'f1', items: [{ k: 'right', o: Pa, a: C, b: L(3), s: 14, c: 'p' }] }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は P と Q の両方が動きます。ℓ と m は平行でも交わってもいない（ねじれの位置）。$\\overrightarrow{\\mathrm{PQ}}=(2-s,\\ t-s,\\ t-1)$ です。',
        add: [{ t: 'h', text: '(2)　2つの動点 P、Q' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PQ}}=(2-s,\\ t-s,\\ t-1)' },
          fig('f2', [ell, ellLab, emm, emmLab, { k: 'pt', at: pj(0, 0, 1), name: 'A', dir: 'w', c: 'y', size: 24 }, { k: 'pt', at: pj(2, 0, 0), name: 'B', dir: 'e', c: 'g', size: 24 }])] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{ケ}}$：PQ が最小になるのは、どんなとき？',
        opts: ['⓪ PQ ⊥ $\\vec u$', '① PQ ∥ $\\vec u$', '② PQ ⊥ $\\vec u$ かつ PQ ⊥ $\\vec v$', '③ $s=t$'], ok: 2,
        why: { 0: 'Q を止めて P だけ動かすと PQ ⊥ $\\vec u$。でも P を止めて Q を動かすことも考えると、PQ ⊥ $\\vec v$ も必要です。', 1: '平行な向きに動いても、距離は縮みません。', 3: '$s$ と $t$ は別々に動けます。$s=t$ は (3) の話。' },
        good: 'どちらの点を止めても、もう一方は (1) と同じ「垂線の足」の位置。だから両方に垂直（共通垂線）。' } },
      { say: '2つの条件を内積で書くと、$s,\\ t$ の連立1次方程式になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{cases}\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec u=(2-s)+(t-s)=0\\\\ \\overrightarrow{\\mathrm{PQ}}\\cdot\\vec v=(t-s)+(t-1)=0\\end{cases}' },
          { t: 'm', size: 'sm', tex: '\\iff\\ \\begin{cases}2s-t=2\\\\ s-2t=-1\\end{cases}' }] },
      { ask: { type: 'choice', q: 'この連立方程式の解は？',
        opts: ['$s=\\frac43,\\ t=\\frac53$', '$s=1,\\ t=1$', '$s=2,\\ t=\\frac32$', '$s=\\frac53,\\ t=\\frac43$'], ok: 3,
        why: { 0: '$s$ と $t$ が逆です。$2s-t=2$ に入れると $\\frac83-\\frac53=1\\neq2$。', 1: '$2\\cdot1-1=1\\neq2$。最初の式をみたしません。', 2: '$2\\cdot2-\\frac32=\\frac52\\neq2$。最初の式をみたしません。' },
        good: '1つ目から $t=2s-2$。2つ目に入れて $s-4s+4=-1$、$s=\\frac53$、$t=\\frac43$。',
        add: [{ t: 'm', tex: 's=\\frac53,\\qquad t=\\frac43', note: 'コ 5　サ 3\nシ 4　ス 3' }],
        draw: [{ fig: 'f2', items: [{ k: 'seg', a: P2, b: Q2, c: 'p', wd: 4 }, { k: 'pt', at: P2, name: 'P', dir: 'se', c: 'p', size: 24 }, { k: 'pt', at: Q2, name: 'Q', dir: 'nw', c: 'p', size: 24 }] }] } },
      { clear: true, say: 'このとき $\\overrightarrow{\\mathrm{PQ}}=\\left(\\frac13,\\ -\\frac13,\\ \\frac13\\right)$。$\\vec u,\\ \\vec v$ との内積が 0 になることも確かめられます。長さは $\\sqrt{\\frac13}=\\frac{\\sqrt3}{3}$。',
        add: [{ t: 'h', text: '(2)　つづき：最小値' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PQ}}=\\Big(\\frac13,\\ -\\frac13,\\ \\frac13\\Big)', note: '$\\cdot\\vec u=0,\\ \\cdot\\vec v=0$' },
          { t: 'm', tex: '|\\overrightarrow{\\mathrm{PQ}}|=\\sqrt{\\frac19+\\frac19+\\frac19}=\\frac{\\sqrt3}{3}' },
          { t: 'box', col: 1, c: 'b', size: 'sm', label: 'みなみさんの方法なら', text: '$|\\overrightarrow{\\mathrm{PQ}}|^2$\n$=2s^2-2(t+2)s+2t^2-2t+5$\n① $t$ を止めて、$s$ の2次式として平方完成\n② 残った $t$ の2次式を平方完成' }] },
      { ask: { type: 'think', q: '右の「みなみさんの方法」で、$|\\overrightarrow{\\mathrm{PQ}}|^2$ の最小値が $\\frac13$ になることを確かめよう。',
        hint: '$s$ の2次式とみると、最小になるのは $s=\\frac{t+2}{2}$。そのときの値を $t$ の式にする。',
        ans: '$s=\\frac{t+2}{2}$ のとき $\\frac{3t^2-8t+6}{2}=\\frac32\\Big(t-\\frac43\\Big)^2+\\frac13$。$t=\\frac43$、$s=\\frac53$ で最小値 $\\frac13$',
        after: '同じ答え。内積の方法は計算が短く、平方完成の方法は「なぜ最小か」がはっきりします。',
        add: [{ t: 'ans', label: '(2) 答', text: 'ケ ②　コ 5　サ 3　シ 4　ス 3　セ 3　ソ 3' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) は「同時に動く」場合。$s=t=k$ なので、P$(k,\\ k,\\ 1)$、Q$(2,\\ k,\\ k)$。$\\overrightarrow{\\mathrm{PQ}}=(2-k,\\ 0,\\ k-1)$ です。',
        add: [{ t: 'h', text: '(3)　同時に動く P、Q' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PQ}}=(2-k,\\ 0,\\ k-1)' },
          { t: 'm', tex: '|\\overrightarrow{\\mathrm{PQ}}|^2=2k^2-6k+5' },
          { t: 'fig', id: 'g3', col: 1, view: [-0.5, -0.4, 3.5, 3.3], w: 560, h: 480, items: [
            { k: 'axes', tx: [1, [1.5, '3/2'], 2, 3], ty: [1, 2, 3], xl: 'k', yl: '' },
            { k: 'fn', f: '2*x*x-6*x+5', a: 0.35, b: 2.65, c: 'y', label: '|PQ|²', lat: [2.55, 2.9], la: 'end' }] }] },
      { ask: { type: 'choice', q: '(3) の PQ の最小値は？（タ・チ）',
        opts: ['$\\frac{\\sqrt2}{2}$', '$\\frac{\\sqrt3}{3}$', '$\\frac12$', '$\\sqrt2$'], ok: 0,
        why: { 1: 'それは (2) の最小値。(3) は $s=t$ という条件つきです。', 2: '$\\frac12$ は $|\\overrightarrow{\\mathrm{PQ}}|^2$ の最小値。最後に $\\sqrt{\\ }$ をとります。', 3: '$2\\left(k-\\frac32\\right)^2+\\frac12$ の最小値は $\\frac12$。$\\sqrt{\\frac12}=\\frac{\\sqrt2}{2}$。' },
        good: '$2\\left(k-\\frac32\\right)^2+\\frac12$ より、$k=\\frac32$ で最小値 $\\sqrt{\\frac12}=\\frac{\\sqrt2}{2}$。',
        add: [{ t: 'm', tex: '\\min PQ=\\frac{\\sqrt2}{2}\\approx0.707', note: '(2) は $\\frac{\\sqrt3}{3}\\approx0.577$' }],
        draw: [{ fig: 'g3', items: [{ k: 'pt', at: [1.5, 0.5], c: 'p' }, { k: 'label', at: [1.5, 0.5], text: '← 最小 1/2', dx: 40, dy: 6, anchor: 'start', size: 20, c: 'p' },
          { k: 'line', m: 0, n: 1 / 3, c: 'b', dash: true, a: -0.4, b: 3.4, label: '(2) の最小 1/3', lat: [2.2, 0.15] }] }] } },
      { say: '最後の設問は、計算より **考え方** を問います。(3) で選べる $(s,\\ t)$ は「$s=t$」のものだけ。(2) では、どんな $(s,\\ t)$ でも選べました。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '選べる範囲のちがい', text: '(2)：すべての $(s,\\ t)$ の中で最小\n(3)：$s=t$ の $(s,\\ t)$ だけの中で最小（(2) の一部）' }] },
      { ask: { type: 'choice', q: '$\\boxed{\\text{ツ}}$：正しい記述は？',
        opts: ['⓪ (3) の最小は (2) より小さいことも', '① (3) の最小は (2) の最小以上', '② (3) の最小でも PQ は両方に垂直', '③ (3) と (2) の最小はいつも等しい'], ok: 1,
        why: { 0: '(3) は (2) の一部の場合。一部の中の最小が、全体の最小より小さくなることはありません。', 2: '$k=\\frac32$ で $\\overrightarrow{\\mathrm{PQ}}=\\left(\\frac12,\\ 0,\\ \\frac12\\right)$、$\\cdot\\vec u=\\frac12\\neq0$。垂直ではありません。', 3: 'この問題でも $\\frac{\\sqrt2}{2}\\neq\\frac{\\sqrt3}{3}$ です。' },
        good: '一部の中での最小 ≧ 全体での最小。だから (3) の最小値は (2) の最小値以上です。',
        add: [{ t: 'ans', label: '(3) 答', text: 'タ 2　チ 2　ツ ①' }] } },
      { ask: { type: 'think', q: '(3) の最小値が (2) と **等しくなる** のは、どんな場合だろう？',
        hint: '(2) で最小を与える $s,\\ t$ が、(3) でも選べるのはどんなとき？',
        ans: '(2) で最小になる $s,\\ t$ がたまたま等しい（$s=t$）とき。この問題は $s=\\frac53,\\ t=\\frac43$ なので等しくならない',
        after: '「条件をつけると最小値は大きくなるか、変わらない」。最適化の問題全体で使える見方です。' } },

      // ---------- 答え・コツ ----------
      { clear: true, cols: [1], part: '答え', say: '答えをまとめます。',
        add: [{ t: 'h', text: '答えのまとめ' },
          { t: 'tbl', rows: [['ア', 'イ', 'ウエ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ', 'サ'], ['2', '8', '11', '2', '3', '2', '4', '②', '5', '3']] },
          { t: 'tbl', rows: [['シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ'], ['4', '3', '3', '3', '2', '2', '①']] }] },
      { clear: true, cols: [1], part: '共通テストのコツ', say: '会話文つきの大問は、会話が「次の一手」を教えてくれます。会話の方針を式にするだけで、計算がぐっと短くなります。',
        add: [{ t: 'h', text: '会話文つきベクトルの進め方' },
          { t: 'box', c: 'b', label: '1. 会話を式に直す', text: '「CP が ℓ に垂直」→ $\\overrightarrow{\\mathrm{CP}}\\cdot\\vec u=0$。言葉を内積の式に直すのが第一歩' },
          { t: 'box', c: 'y', label: '2. 求めた点で検算', text: '$\\overrightarrow{\\mathrm{PQ}}\\cdot\\vec u=0,\\ \\overrightarrow{\\mathrm{PQ}}\\cdot\\vec v=0$ を代入して確かめる。数値ミスの発見に1分使う価値あり' },
          { t: 'box', c: 'p', label: '3. 最後の考察問題は「範囲」で考える', text: '条件つきの最小は、条件なしの最小以上。選べる範囲が広いほど、最小値は小さく（または同じに）なる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。距離の最小は「2乗して平方完成」か「垂直を内積で」。2つの動点なら両方に垂直。条件がつけば最小値は大きくなりうる、です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
