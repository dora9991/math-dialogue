/* 2026 佐賀大 理系 第4問の類題②（自作）：w＝1/z による、直線の像（円）・原点を通る直線の像（原点を除く直線全体）・像どうしの交点でのなす角
   （類題①は w＝−(i/2)z²。ここは変換を 1/z に変え、ℓ：Re z=2 → 円、m → 直線、と図形も変えている）
   答え（python3・sympy で検算ずみ）：
   (1) z=2+ti → w=(2−ti)/(4+t²)、u=2/(4+t²)、v=−t/(4+t²)。u²+v²=1/(4+t²)=u/2 → C：(u−1/4)²+v²=(1/4)²（原点 O を除く）
       逆に O 以外の C 上の点 w では Re(1/w)=u/(u²+v²)=2 なので、1/w∈ℓ。よって C（O を除く）全体
   (2) z=sβ（β≠0、s は 0 でない実数）→ w=(1/β)(1/s)。1/s は 0 以外の実数全体を動く → γ=1/β として、w は直線 {kγ | k≠0 の実数} 全体（O を除く）
   (3) β=1+2i → γ=(1−2i)/5 → H：v=−2u（u≠0）。u²+v²=u/2 に代入して 5u²=u/2 → u=1/10（u=0 は O）→ P=1/10−(1/5)i
       C の中心 K(1/4,0)、KP=(−3/20,−1/5)（傾き 4/3）→ 接線の傾き −3/4、H の傾き −2。tanθ=|(−2+3/4)/(1+(−2)(−3/4))|=(5/4)/(5/2)=1/2
   別の見方：ℓ（鉛直）と m（傾き 2）の交点 2+4i の像が P。f'(z)=−1/z²≠0 なので角が保たれ、ℓ と m のなす角の tan=1/2 と一致（m を y=x にすると 1） */
(function () {
  const ax = (o) => Object.assign({ k: 'axes', tx: [], ty: [], xl: '実軸', yl: '虚軸' }, o || {});
  // z 平面
  const zfig = (id, extra, w) => ({ t: 'fig', id, col: 1, view: [-1, -1.3, 4.6, 5.2], w: w || 360, h: Math.round((w || 360) * 6.5 / 5.6), items: [
    ax({ tx: [[2, '2']], ty: [] }),
    { k: 'line', x: 2, c: 'y', wd: 3, label: 'ℓ', lat: [2.2, -0.9] }
  ].concat(extra || []) });
  // w 平面（円の中心 1/4、半径 1/4）
  const CIR = { k: 'circle', o: [0.25, 0], r: 0.25, c: 'y', wd: 3.5 };
  const OPEN = { k: 'pt', at: [0, 0], open: true, c: 'y', r: 5 };
  const wfig = (id, extra, w, view) => ({ t: 'fig', id, col: 1, view: view || [-0.15, -0.32, 0.65, 0.32], w: w || 500, h: Math.round((w || 500) * 0.8), items: [
    ax({ tx: [[0.25, '1/4'], [0.5, '1/2']], ty: [[0.25, '1/4'], [-0.25, '−1/4']] })
  ].concat(extra || []) });
  const Hline = { k: 'line', m: -2, n: 0, c: 'b', wd: 3.5 };
  const P = [0.1, -0.2];
  const POINTS = [
    '$\\dfrac1z=\\dfrac{\\overline z}{|z|^2}$。直線上の点は媒介変数で $z=2+ti$ とおき、$u,\\ v$ を $t$ で表して消去する。逆に $z=\\dfrac1w$ を調べると「全体」も示せる',
    '$z=s\\beta$ なら $w=\\dfrac1\\beta\\cdot\\dfrac1s$。$\\dfrac1s$ は 0 以外の実数全体を動くので、像は「O を除く直線全体」（O は通らない）',
    '交点は、除かれる点 O をまちがえて答えにしない。なす角は「接線 ⟂ 半径」で接線の傾きを出し、$\\tan\\theta=\\left|\\dfrac{m_2-m_1}{1+m_1m_2}\\right|$'
  ];

  HB.lesson({
    id: 'saga26-4b', field: '佐賀大型　数学（理系）', title: '2026 佐賀大 理系 第4問の類題② ― w＝1/z で直線は何にうつるか', level: '2026年度 佐賀大学 理系 第4問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '複素数平面上で、0 でない複素数 $z$ を点 $w=\\dfrac1z$ にうつす変換を考える。$w=u+vi$（$u,\\ v$ は実数）とする。',
      parts: [
        '(1)　点 $z$ が、実部が $2$ である複素数全体の表す直線 $\\ell$ 上を動くとき、点 $w$ が描く図形 $C$ を図示せよ。',
        '(2)　点 $z$ が原点 O を通る直線 $m$ 上を（O を除いて）動くとき、点 $w$ は O を除く1本の直線全体を描くことを示せ。',
        '(3)　$z=x+yi$（$x,\\ y$ は実数）とする。点 $z$ が直線 $y=2x$ 上を（O を除いて）動くときに点 $w$ が描く図形を $H$ とする。$C$ と $H$ の交点 P を求めよ。また、P における $C$ の接線と $H$ のなす角を $\\theta\\left(0<\\theta<\\dfrac{\\pi}{2}\\right)$ とするとき、$\\tan\\theta$ の値を求めよ。'
      ],
      src: '※ 2026年度 佐賀大学 前期 理工学部 数学 第4問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面の変換で、直線が何にうつるかを調べる問題です。図示・証明・計算がそろっています。まず問題文を読みましょう。（Q キーでいつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '今回の変換は $w=\\dfrac1z$（逆数）です。$u,\\ v$ を求めるには、まず $\\dfrac1z$ を $a+bi$ の形に直す必要があります。',
        add: [{ t: 'h', text: '読みかえ：変換のしくみ' },
          { t: 'm', size: 'sm', tex: 'z=a+bi\\ \\ (a,\\ b\\ \\text{は実数})\\quad\\Longrightarrow\\quad w=\\frac{1}{a+bi}' }] },
      { ask: { type: 'choice', q: '$\\dfrac1z$ を実部と虚部に分けるには、どうすればよい？',
        opts: ['分母と分子に $z$ をかける', '分母と分子に $\\overline{z}$ をかける', '分母と分子に $i$ をかける', '$z$ の実部と虚部を、それぞれ逆数にする'], ok: 1,
        why: { 0: '$z\\cdot z=z^2$ は実数になりません。分母を実数にしたいのです。', 2: '$i$ をかけても分母は実数になりません。', 3: '$\\dfrac{1}{a+bi}$ は $\\dfrac1a+\\dfrac1bi$ ではありません。' },
        good: '$z\\overline{z}=|z|^2$ は実数なので、$\\dfrac1z=\\dfrac{\\overline{z}}{|z|^2}$ と分母を実数にできます。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '(1)　$z=2+ti$ とおき、$u,\\ v$ を $t$ で表して $t$ を消す\n(2)　$z=s\\beta$（$s$ は実数）とおく\n(3)　交点 → 接線の傾き → $\\tan$ の公式' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。$\\ell$ 上の点は $z=2+ti$（$t$ は実数）と表せます。分母・分子に $\\overline{z}=2-ti$ をかけます。',
        add: [{ t: 'h', text: '(1)　直線 ℓ の像 C' },
          { t: 'm', tex: 'w=\\frac{1}{2+ti}=\\frac{2-ti}{(2+ti)(2-ti)}=\\frac{2-ti}{4+t^2}' },
          zfig('z1', [{ k: 'pt', at: [2, 1.5], c: 'y', r: 5, name: '2+ti', dir: 'e', size: 21 }])] },
      { ask: { type: 'choice', q: '$w=\\dfrac{2-ti}{4+t^2}$ の実部 $u$ と虚部 $v$ は？',
        opts: ['$u=\\dfrac{2}{4+t^2},\\ v=\\dfrac{t}{4+t^2}$', '$u=\\dfrac{2}{4-t^2},\\ v=-\\dfrac{t}{4-t^2}$', '$u=\\dfrac{2}{4+t^2},\\ v=-\\dfrac{t}{4+t^2}$', '$u=\\dfrac12,\\ v=-\\dfrac1t$'], ok: 2,
        why: { 0: '分子 $2-ti$ の虚部は $-t$。符号が落ちています。', 1: '分母は $(2+ti)(2-ti)=4+t^2$ です。', 3: '実部と虚部を別々に逆数にしています。' },
        good: '虚部は $i$ の係数なので $-\\dfrac{t}{4+t^2}$ です。',
        add: [{ t: 'm', tex: 'u=\\frac{2}{4+t^2},\\qquad v=-\\frac{t}{4+t^2}' }] } },
      { clear: true, cols: [0.5, 0.5], say: '$t$ を消去します。$u^2+v^2=\\dfrac{4+t^2}{(4+t^2)^2}=\\dfrac{1}{4+t^2}$、これは $\\dfrac u2$ に等しいので、$u^2+v^2=\\dfrac u2$ です。',
        add: [{ t: 'h', text: '(1)　つづき：t を消去する' },
          { t: 'm', size: 'sm', tex: 'u^2+v^2=\\frac{1}{4+t^2}=\\frac u2' },
          { t: 'm', size: 'sm', tex: '\\Big(u-\\frac14\\Big)^2+v^2=\\Big(\\frac14\\Big)^2' },
          { t: 'p', size: 'sm', text: '中心 $\\dfrac14$、半径 $\\dfrac14$ の円。ただし $u=\\dfrac{2}{4+t^2}>0$ なので原点 O は通らない。' },
          wfig('w1', [CIR, OPEN, { k: 'pt', at: [0.25, 0], c: 'y', r: 4 }, { k: 'label', at: [0.5, 0.2], text: 'C', c: 'y', size: 26 }], 520)] },
      { clear: true, cols: [0.5, 0.5], say: '逆に、O 以外の円上の点 $w$ について $z=\\frac1w$ の実部は $\\frac{u}{u^2+v^2}=\\frac{u}{u/2}=2$。だから円（O を除く）の全体に届きます。',
        add: [{ t: 'h', text: '(1)　つづき：全体であることの確認' },
          { t: 'box', c: 'y', size: 'sm', label: '確認', text: '$w\\ne0$ が円上にあるとき、\n$z=\\dfrac1w=\\dfrac{\\overline w}{|w|^2}$ の実部は $\\dfrac{u}{u^2+v^2}=2$\nなので、$z\\in\\ell$。' },
          { t: 'ans', label: '(1) 答', text: '円 $\\left(u-\\dfrac14\\right)^2+v^2=\\dfrac1{16}$\nから原点を除いた図形' },
          wfig('w1b', [CIR, OPEN, { k: 'label', at: [0.5, 0.2], text: 'C', c: 'y', size: 26 }], 520)] },
      { ask: { type: 'think', q: '$\\ell$ 上の点 $z=2+2i$ の像 $w$ を求めて、$C$ の上にあることを確かめよう。',
        hint: '$w=\\dfrac{1}{2+2i}=\\dfrac{2-2i}{8}$。',
        ans: '$w=\\dfrac14-\\dfrac14i$。$\\left(\\dfrac14-\\dfrac14\\right)^2+\\left(-\\dfrac14\\right)^2=\\dfrac1{16}$ なので $C$ 上にある',
        after: '(1) の式で $t=2$ とした点 $\\left(\\dfrac14,\\ -\\dfrac14\\right)$ と同じです。1点で確かめると、計算ミスに気づけます。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。原点を通る直線 $m$ は、0 でない複素数 $\\beta$ を1つ決めると、$z=s\\beta$（$s$ は 0 でない実数）と表せます。',
        add: [{ t: 'h', text: '(2)　原点を通る直線の像' },
          { t: 'm', tex: 'z=s\\beta\\ \\Longrightarrow\\ w=\\frac1\\beta\\cdot\\frac1s=\\gamma\\cdot\\frac1s', note: '$\\gamma=\\dfrac1\\beta\\ne0$' },
          { t: 'fig', id: 'z2', col: 1, view: [-3.2, -1.7, 3.2, 1.7], w: 420, h: 223, items: [
            ax(), { k: 'line', m: 0.5, n: 0, c: 'g', wd: 3, label: 'm', lat: [2.75, 1.55] },
            { k: 'pt', at: [2, 1], c: 'g', r: 5, name: 'sβ', dir: 'nw', size: 21 }, { k: 'pt', at: [-2, -1], c: 'g', r: 5, name: '−sβ', dir: 'se', size: 21 }] },
          { t: 'p', col: 1, size: 'sm', text: '$s\\beta$ と $-s\\beta$ は、$\\gamma$ をはさんで反対側の点にうつる' }] },
      { ask: { type: 'choice', q: '$s$ が 0 以外の実数全体を動くとき、$w=\\gamma\\cdot\\dfrac1s$ が描く図形は？',
        opts: ['O を端点とする半直線', 'O を除く直線全体', 'O をふくむ直線全体', '円'], ok: 1,
        why: { 0: '$s<0$ のときは $\\frac1s$ が負になり、$\\gamma$ と反対側にも届きます。', 2: '$\\frac1s=0$ となる $s$ はありません。だから O は通りません。', 3: '$\\gamma$ の実数倍だけが動くので、直線です。' },
        good: '$\\dfrac1s$ は 0 以外の実数全体を動くので、$w=k\\gamma$（$k\\ne0$ の実数）。O を除く直線全体です。' } },
      { say: '答案です。(i) $w=\\gamma\\cdot\\frac1s$ は直線 $L$ 上で、$w\\ne0$。(ii) $L$ 上の点 $k\\gamma$（$k\\ne0$）には $s=\\frac1k$ で届く。よって O を除く $L$ 全体です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '答案', text: '$L=\\{k\\gamma\\mid k\\ \\text{は}\\ 0\\ \\text{でない実数}\\}$（O を通る直線から O を除いたもの）とおく。\n(i)　$\\dfrac1s$ は実数で 0 でないから、$w=\\gamma\\cdot\\dfrac1s$ は $L$ 上にある。\n(ii)　$L$ 上の点 $k\\gamma$ は、$s=\\dfrac1k$ のとき $w=k\\gamma$ となる。\n(i)(ii) より、$w$ は O を除く直線 $L$ の全体を描く。' }] },

      // ---------- (3) ----------
      { clear: true, cols: [0.5, 0.5], part: '(3)', say: '(3) です。直線 $y=2x$ 上の点は $z=s(1+2i)$。(2) の $\\beta=1+2i$ の場合なので、$\\gamma=\\dfrac1\\beta$ を計算すれば $H$ の向きがわかります。',
        add: [{ t: 'h', text: '(3)　直線 H と交点 P' },
          { t: 'm', tex: '\\gamma=\\frac{1}{1+2i}=\\frac{1-2i}{(1+2i)(1-2i)}' }] },
      { ask: { type: 'choice', q: '$\\gamma=\\dfrac{1}{1+2i}$ の値は？',
        opts: ['$\\dfrac{1+2i}{5}$', '$1-2i$', '$\\dfrac{1-2i}{5}$', '$\\dfrac{-1+2i}{3}$'], ok: 2,
        why: { 0: '分子は共役 $\\overline{\\beta}=1-2i$ です。$\\beta$ のままでは分母が実数になりません。', 1: '分母 $|\\beta|^2=5$ で割るのを忘れています。', 3: '分母は $1^2+2^2=5$ です。3 にはなりません。' },
        good: '$\\gamma=\\dfrac{1-2i}{1+4}=\\dfrac{1-2i}{5}$。向きは $(1,\\ -2)$ なので、$H$ は直線 $v=-2u$（O を除く）。',
        add: [{ t: 'm', tex: '\\gamma=\\frac{1-2i}{5}\\qquad H:\\ v=-2u\\ \\ (u\\ne0)' },
          wfig('w2', [CIR, OPEN, Hline, { k: 'label', at: [-0.07, 0.2], text: 'H', c: 'b', size: 26 }, { k: 'label', at: [0.52, 0.2], text: 'C', c: 'y', size: 26 }], 500)] } },
      { say: '$C$ と $H$ の交点を求めます。$v=-2u$ を $u^2+v^2=\\dfrac u2$ に代入して整理すると、$u$ の2次方程式になります。',
        add: [{ t: 'm', tex: 'u^2+4u^2=\\frac u2\\iff u\\Big(5u-\\frac12\\Big)=0' },
          { t: 'm', tex: 'u=0\\ \\text{または}\\ u=\\frac1{10}' }] },
      { ask: { type: 'choice', q: '交点 P の $u$ 座標として、正しいのは？',
        opts: ['$u=0$ だけ', '$u=\\dfrac1{10}$ と $u=0$ の両方', '$u=\\dfrac1{10}$ だけ', '交点はない'], ok: 2,
        why: { 0: '$u=0$ は O です。$C$ にも $H$ にも O はふくまれません。', 1: 'O は $C$ からも $H$ からも除かれています。交点にはなりません。', 3: '$u=\\frac1{10}$ は交点です。O 以外の解が残ります。' },
        good: 'O は除かれるので $u=\\dfrac1{10}$、$v=-2u=-\\dfrac15$。P $=\\dfrac1{10}-\\dfrac15i$ です。',
        add: [{ t: 'm', tex: '\\mathrm{P}=\\frac1{10}-\\frac15i' }],
        draw: [{ fig: 'w2', items: [{ k: 'pt', at: P, c: 'p', r: 6, name: 'P', dir: 'sw', size: 26 }] }] } },

      { clear: true, cols: [0.54, 0.46], say: '接線は「円の半径に垂直」です。円の中心を K$\\left(\\frac14,\\ 0\\right)$ とすると、KP の傾きは $\\frac43$。だから接線の傾きは $-\\frac34$、$H$ の傾きは $-2$ です。',
        add: [{ t: 'h', text: '(3)　つづき：なす角' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{KP}}=\\Big(-\\frac{3}{20},\\ -\\frac15\\Big)\\ \\Longrightarrow\\ \\text{傾き}\\ \\frac43' },
          { t: 'm', size: 'sm', tex: '\\text{接線の傾き}\\quad m_1=-\\frac34,\\qquad H\\ \\text{の傾き}\\quad m_2=-2' },
          { t: 'box', c: 'b', size: 'sm', label: 'なす角', text: '傾き $m_1,\\ m_2$ の2直線のなす鋭角 $\\theta$ は\n$\\tan\\theta=\\left|\\dfrac{m_2-m_1}{1+m_1m_2}\\right|$' },
          wfig('w3', [CIR, OPEN, { k: 'pt', at: [0.25, 0], c: 'y', r: 4, name: 'K', dir: 'n', size: 22 },
            { k: 'seg', a: [0.25, 0], b: P, c: 'g', wd: 2, dash: true },
            { k: 'line', m: -0.75, n: -0.125, c: 'g', wd: 2.5 }, Hline,
            { k: 'angle', o: P, a: [0.18, -0.26], b: [0.1447, -0.2894], rp: 34, c: 'p', label: 'θ', lr: 14 },
            { k: 'pt', at: P, c: 'p', r: 6, name: 'P', dir: 'w', size: 24 }], 460, [-0.15, -0.36, 0.65, 0.28])] },
      { ask: { type: 'choice', q: '$\\tan\\theta$ の値は？',
        opts: ['$\\dfrac12$', '$2$', '$\\dfrac{11}{2}$', '$\\dfrac52$'], ok: 0,
        why: { 1: '分母と分子が逆です。$\\tan\\theta=\\left|\\frac{m_2-m_1}{1+m_1m_2}\\right|$。', 2: '接線の傾きを $+\\frac34$ としています。半径に垂直なら符号は逆で $-\\frac34$ です。', 3: '分母は $1+m_1m_2$（$1-m_1m_2$ ではありません）です。' },
        good: '$\\left|\\dfrac{-2+\\frac34}{1+(-2)\\left(-\\frac34\\right)}\\right|=\\dfrac{\\frac54}{\\frac52}=\\dfrac12$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\mathrm{P}=\\frac1{10}-\\frac15i,\\qquad \\tan\\theta=\\frac12' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.56, 0.44], part: '別の見方', say: '$\\ell$ と $m$ の交点 $2+4i$ をうつすと、ちょうど P になります。そして $\\ell$（鉛直）と $m$（傾き 2）のなす角の $\\tan$ も $\\frac12$。偶然ではありません。',
        add: [{ t: 'h', text: '別の見方：角は保たれる' },
          { t: 'm', size: 'sm', tex: '\\frac{1}{2+4i}=\\frac{2-4i}{20}=\\frac1{10}-\\frac15i=\\mathrm{P}' },
          { t: 'p', size: 'sm', text: 'もとの2直線のなす角：$\\ell$ は鉛直、$m$ の傾きは 2 なので $\\tan=\\dfrac12$\n像の曲線のなす角　：$\\tan\\theta=\\dfrac12$' },
          { t: 'box', c: 'g', size: 'sm', label: '発展', text: 'この変換は、$z\\ne0$ の点で、交わる2曲線の **角の大きさを変えない**（等角写像）。答案には使わず、検算に使う。' },
          zfig('z3', [{ k: 'line', m: 2, n: 0, c: 'b', wd: 3, label: 'm：y=2x', lat: [2.3, 4.6], la: 'start' },
            { k: 'angle', o: [2, 4], a: [2, 5], b: [2.5, 5], rp: 34, c: 'p', label: 'θ', lr: 14 },
            { k: 'pt', at: [2, 4], c: 'p', r: 6, name: '2+4i', dir: 'e', size: 21 }], 340)] },
      { ask: { type: 'think', q: '(3) の直線 $y=2x$ を $y=x$ に変えると、$\\tan\\theta$ はいくつになる？　別の見方で予想してから、計算で確かめよう。',
        hint: '予想：$\\ell$（鉛直）と $y=x$ のなす角は $\\frac{\\pi}{4}$。計算：$\\beta=1+i$ で $\\gamma$ を求める。',
        ans: '$\\tan\\theta=1$。$\\gamma=\\dfrac{1}{1+i}=\\dfrac{1-i}{2}$ で、$H$ は $v=-u$。交点は $u=\\dfrac14$（$2u^2=\\dfrac u2$）で、K と同じ $u$ 座標なので接線は水平（傾き 0）。傾き $-1$ の $H$ との $\\tan\\theta=1$',
        after: 'もとの交点 $2+2i$ の像も $\\dfrac{1}{2+2i}=\\dfrac14-\\dfrac14i$ で、ぴったり合います。' } },
      { clear: true, cols: [1], part: '答案のポイント', say: '答案では、(1) は「円の全体（O を除く）」、(2) は2つの向きの包含、(3) は除かれる点 O を解から外す、の3点を書き落とさないようにしましょう。',
        add: [{ t: 'h', text: '答案で書くこと' }, { t: 'box', c: 'y', label: '答案で書くこと', text: '(1)　$u^2+v^2=\\dfrac u2$ ＋ O は通らない ＋ 円のどの点にも届く\n(2)　像は直線上 ＋ 直線のどの点にも届く（$s=\\dfrac1k$）\n(3)　$u=0$（O）を除く。$\\theta$ は鋭角' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。複素数平面の変換は「媒介変数でおく → 実部・虚部で表す → 消去」が基本。図示と証明の書き方も大切です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
