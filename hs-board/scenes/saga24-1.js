/* 2024 佐賀大 理系 第1問の類題（自作）：2本の線分が垂直という条件から内積を出し、垂線の足・垂心までの長さを求める
   答え（python3 で検算ずみ。座標 O(0,0) A(2,2) B(3,0) でも確認）：
   (1) a・b=6（∠AOB=45°）　(2) OH=3/5 a+2/5 b、|OH|=6√5/5　(3) OK=1/2 a+1/3 b、|OK|=√5 */
(function () {
  const O = [0, 0], A = [2, 2], B = [3, 0], M = [1, 1], N = [1, 0], X = [1.4, 0.8], H = [2.4, 1.2], D = [2, 0], K = [2, 1];
  const VIEW = [-0.55, -0.8, 3.55, 2.4];
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: Math.round((h || 360) * 4.1 / 3.2), h: h || 360, items });   // 縦横比は VIEW にそろえる
  const tri = [
    { k: 'poly', pts: [O, A, B], close: true },
    { k: 'pt', at: O, name: 'O', dir: 'sw' }, { k: 'pt', at: A, name: 'A', dir: 'n' }, { k: 'pt', at: B, name: 'B', dir: 'se' }
  ];
  const lens = [
    { k: 'label', at: [0.5, 0.5], text: '2√2', dx: -34, dy: -10, c: 'b', size: 22 },
    { k: 'dim', a: O, b: B, dy: 40, label: '3', c: 'b' }
  ];
  const cev = [
    { k: 'seg', a: A, b: N, c: 'y' }, { k: 'seg', a: B, b: M, c: 'g' },
    { k: 'right', o: X, a: A, b: B, c: 'w' },
    { k: 'pt', at: M, name: 'M', dir: 'nw', c: 'g' }, { k: 'pt', at: N, name: 'N', dir: 's', c: 'y' }
  ];
  const OH = [{ k: 'seg', a: O, b: H, c: 'p' }, { k: 'right', o: H, a: B, b: O, c: 'p' }, { k: 'pt', at: H, name: 'H', dir: 'ne', c: 'p' }];
  const POINTS = [
    '垂直は **内積 $=0$**。$\\overrightarrow{\\mathrm{AN}},\\ \\overrightarrow{\\mathrm{BM}}$ を $\\vec a,\\ \\vec b$ で表して展開し、$\\vec a\\cdot\\vec b$ の1次方程式にする',
    '辺の上の点は $(1-t)\\vec a+t\\vec b$、直線 OH 上の点は $s\\,\\overrightarrow{\\mathrm{OH}}$ とおき、垂直の条件で $t,\\ s$ を決める',
    '長さは **2乗して内積**。面積 $\\dfrac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$ や座標でも検算できる'
  ];

  HB.lesson({
    id: 'saga24-1', field: '佐賀大型　数学（理系）', title: '2024 佐賀大 理系 第1問の類題 ― 垂直な2本の線分と、垂線の交点までの長さ', level: '2024年度 佐賀大学 理系 第1問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '$\\triangle\\mathrm{OAB}$ において $\\mathrm{OA}=2\\sqrt2,\\ \\mathrm{OB}=3$ である。辺 OA の中点を M、辺 OB を $1:2$ に内分する点を N とすると、$\\mathrm{AN}\\perp\\mathrm{BM}$ であった。$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b$ とする。',
      parts: [
        '(1)　内積 $\\vec a\\cdot\\vec b$ を求めよ。',
        '(2)　O から辺 AB に垂線 OH を下ろす。$\\overrightarrow{\\mathrm{OH}}$ を $\\vec a,\\ \\vec b$ を用いて表し、$|\\overrightarrow{\\mathrm{OH}}|$ を求めよ。',
        '(3)　A から辺 OB に下ろした垂線と線分 OH の交点を K とする。$\\overrightarrow{\\mathrm{OK}}$ を $\\vec a,\\ \\vec b$ を用いて表し、$|\\overrightarrow{\\mathrm{OK}}|$ を求めよ。'
      ],
      src: '※ 2024年度 佐賀大学 前期 理工学部 数学 第1問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '平面ベクトルの基本がつまった問題です。「垂直」から内積を出し、垂線の足と、2本の垂線の交点を求めます。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '図をかきます。わかっているのは2辺の長さと「AN ⊥ BM」。足りないのは $\\vec a\\cdot\\vec b$ です。垂直の条件は、内積が 0 という式に直せます。',
        add: [{ t: 'h', text: '読みかえ' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '垂直 ⇔ 内積 $=0$\n長さ ⇔ 2乗して内積で計算\n→ まず $\\vec a\\cdot\\vec b$ を出せば、あとは全部計算できる' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2=8,\\qquad |\\vec b|^2=9' },
          fig('g1', tri.concat(lens, cev))] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。M は OA の中点なので $\\overrightarrow{\\mathrm{OM}}=\\frac12\\vec a$、N は OB を $1:2$ に内分するので $\\overrightarrow{\\mathrm{ON}}=\\frac13\\vec b$ です。',
        add: [{ t: 'h', text: '(1)　内積 a・b' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OM}}=\\frac12\\vec a,\\qquad \\overrightarrow{\\mathrm{ON}}=\\frac13\\vec b' },
          fig('g2', tri.concat(cev), 320)] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AN}}$ を $\\vec a,\\ \\vec b$ で表すと？',
        opts: ['$\\dfrac23\\vec b-\\vec a$', '$\\dfrac13\\vec b-\\vec a$', '$\\dfrac13\\vec b+\\vec a$', '$\\dfrac12\\vec b-\\vec a$'], ok: 1,
        why: { 0: 'ON : NB $=1:2$ なので、ON は OB の $\\frac13$ です。', 2: '$\\overrightarrow{\\mathrm{AN}}=\\overrightarrow{\\mathrm{ON}}-\\overrightarrow{\\mathrm{OA}}$（終点 − 始点）。$\\vec a$ は引きます。', 3: '$1:2$ は「半分」ではありません。全体を 3 とみて 1 の所です。' },
        good: '終点 − 始点で $\\overrightarrow{\\mathrm{AN}}=\\frac13\\vec b-\\vec a$。同じように $\\overrightarrow{\\mathrm{BM}}=\\frac12\\vec a-\\vec b$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AN}}=\\frac13\\vec b-\\vec a,\\qquad \\overrightarrow{\\mathrm{BM}}=\\frac12\\vec a-\\vec b' }] } },
      { say: 'AN ⊥ BM なので、内積が 0。展開すると $\\vec a\\cdot\\vec b$ の項が2つ出ます。$(-\\vec a)\\cdot(-\\vec b)=+\\vec a\\cdot\\vec b$ に注意。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{AN}}\\cdot\\overrightarrow{\\mathrm{BM}}&=\\frac16\\vec a\\cdot\\vec b-\\frac13|\\vec b|^2-\\frac12|\\vec a|^2+\\hy{\\vec a\\cdot\\vec b}\\\\ &=\\frac76\\,\\vec a\\cdot\\vec b-3-4=0\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\vec a\\cdot\\vec b$ はいくつ？',
        opts: ['$42$', '$-\\dfrac{42}{5}$', '$6$', '$7$'], ok: 2,
        why: { 0: '$(-\\vec a)\\cdot(-\\vec b)=+\\vec a\\cdot\\vec b$ を落としています。$|\\vec a||\\vec b|=6\\sqrt2$ より大きい内積はありえません。', 1: '$(-\\vec a)\\cdot(-\\vec b)$ の符号を − にしています。', 3: '$\\frac76\\,\\vec a\\cdot\\vec b=7$ の両辺を $\\frac76$ で割り忘れています。' },
        good: '$\\frac76\\,\\vec a\\cdot\\vec b=7$ より $6$。$\\cos\\angle\\mathrm{AOB}=\\dfrac{6}{2\\sqrt2\\cdot3}=\\dfrac{1}{\\sqrt2}$ で、$\\angle\\mathrm{AOB}=45^\\circ$ です。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\vec a\\cdot\\vec b=6' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。H は辺 AB 上の点なので、AH : HB $=t:(1-t)$ とおくと $\\overrightarrow{\\mathrm{OH}}=(1-t)\\vec a+t\\vec b$。条件は OH ⊥ AB です。',
        add: [{ t: 'h', text: '(2)　垂線の足 H' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OH}}=(1-t)\\vec a+t\\,\\vec b', note: 'H は辺 AB 上' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\quad \\overrightarrow{\\mathrm{AB}}=\\vec b-\\vec a', note: 'OH ⊥ AB' },
          fig('g3', tri.concat(OH, [
            { k: 'label', at: [2.2, 1.6], text: 't', dx: 16, dy: -2, c: 'y', size: 22 },
            { k: 'label', at: [2.7, 0.6], text: '1−t', dx: 18, dy: -4, c: 'y', size: 22, anchor: 'start' }]), 330)] },
      { say: '展開して、$|\\vec a|^2=8,\\ |\\vec b|^2=9,\\ \\vec a\\cdot\\vec b=6$ を入れます。$t$ の1次方程式になります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&(1-t)(\\vec a\\cdot\\vec b-|\\vec a|^2)+t(|\\vec b|^2-\\vec a\\cdot\\vec b)\\\\ &=(1-t)(6-8)+t(9-6)=5t-2\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$t$ の値は？',
        opts: ['$\\dfrac25$', '$\\dfrac12$', '$\\dfrac{2}{11}$', '$-2$'], ok: 0,
        why: { 1: 'H が AB の中点になるのは $|\\vec a|=|\\vec b|$（二等辺三角形）のとき。ここでは $2\\sqrt2\\neq3$ です。', 2: '$t\\vec b\\cdot(-\\vec a)=-6t$ の項を落としています。', 3: '$6-8=-2$ の符号を逆にしています。$t<0$ だと H は辺 AB 上にありません。' },
        good: '$5t-2=0$ より $t=\\frac25$。$0<t<1$ なので、H はたしかに辺 AB 上にあります。',
        add: [{ t: 'm', tex: 't=\\frac25\\qquad \\overrightarrow{\\mathrm{OH}}=\\frac35\\vec a+\\frac25\\vec b' }] } },
      { clear: true, say: '次に長さ。2乗して内積で計算します。$\\frac15$ を前に出しておくと楽です。$|3\\vec a+2\\vec b|^2=9\\cdot8+12\\cdot6+4\\cdot9=180$。',
        add: [{ t: 'h', text: '(2)　つづき：OH の長さ' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac15(3\\vec a+2\\vec b)' },
          fig('g3b', tri.concat(OH, [{ k: 'label', at: [1.2, 0.6], text: '？', dx: -10, dy: -20, c: 'p', size: 22 }]), 330),
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OH}}|^2=\\frac1{25}|3\\vec a+2\\vec b|^2=\\frac{1}{25}(72+72+36)=\\frac{36}{5}' }] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{OH}}|$ は？',
        opts: ['$\\dfrac{36}{5}$', '$\\dfrac{6}{5}$', '$\\dfrac{6\\sqrt5}{25}$', '$\\dfrac{6\\sqrt5}{5}$'], ok: 3,
        why: { 0: 'それは $|\\overrightarrow{\\mathrm{OH}}|^2$。最後に $\\sqrt{\\ }$ をとります。', 1: '$\\sqrt{\\frac{36}{5}}=\\frac{6}{\\sqrt5}$。分母の 5 にも $\\sqrt{\\ }$ がかかります。', 2: '$\\frac1{25}$ は $\\sqrt{\\ }$ の外に出すと $\\frac15$ です。' },
        good: '$\\sqrt{\\dfrac{36}{5}}=\\dfrac{6}{\\sqrt5}=\\dfrac{6\\sqrt5}{5}$。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac35\\vec a+\\frac25\\vec b,\\quad |\\overrightarrow{\\mathrm{OH}}|=\\frac{6\\sqrt5}{5}' }] } },
      { ask: { type: 'think', q: '別の方法で検算：$\\triangle\\mathrm{OAB}$ の面積 $S$ と AB の長さから、OH を求めよう。',
        hint: '$S=\\frac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$、$|\\overrightarrow{\\mathrm{AB}}|^2=|\\vec b-\\vec a|^2$。OH は AB を底辺とみたときの高さ。',
        ans: '$S=\\frac12\\sqrt{72-36}=3$、$\\mathrm{AB}=\\sqrt{9-12+8}=\\sqrt5$ より　$\\mathrm{OH}=\\dfrac{2S}{\\mathrm{AB}}=\\dfrac{6}{\\sqrt5}=\\dfrac{6\\sqrt5}{5}$',
        after: '同じ値になりました。長さだけなら面積からも出せます。答案はベクトルで書き、検算に面積を使うと安心です。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。A から OB に下ろした垂線（黄）と OH（桃）の交点が K。K は直線 OH 上にあるので、$\\overrightarrow{\\mathrm{OK}}=s\\,\\overrightarrow{\\mathrm{OH}}$ とおけます。',
        add: [{ t: 'h', text: '(3)　2本の垂線の交点 K' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OK}}=s\\,\\overrightarrow{\\mathrm{OH}}=\\frac{s}{5}(3\\vec a+2\\vec b)', note: 'K は直線 OH 上' },
          fig('g4', tri.concat(OH, [
            { k: 'seg', a: A, b: D, c: 'y' }, { k: 'right', o: D, a: B, b: A, c: 'y' }, { k: 'pt', at: D, name: 'D', dir: 's', c: 'y' },
            { k: 'pt', at: K, name: 'K', dir: 'w', c: 'g' }]), 330)] },
      { ask: { type: 'choice', q: 'K が「A から OB に下ろした垂線」の上にある条件は？',
        opts: ['$\\overrightarrow{\\mathrm{OK}}\\cdot\\vec b=0$', '$\\overrightarrow{\\mathrm{AK}}\\cdot\\vec b=0$', '$\\overrightarrow{\\mathrm{AK}}\\cdot\\vec a=0$', '$\\overrightarrow{\\mathrm{OK}}\\cdot(\\vec b-\\vec a)=0$'], ok: 1,
        why: { 0: 'それは OK ⊥ OB。K から O へのベクトルではなく、A から K へのベクトルが OB に垂直です。', 2: '垂線は OB に下ろしたもの。AK ⊥ OA ではなく AK ⊥ OB です。', 3: 'それは OK ⊥ AB。K が直線 OH 上にあることは、$s$ とおいた時点で使っています。' },
        good: 'AK ⊥ OB なので $\\overrightarrow{\\mathrm{AK}}\\cdot\\vec b=0$。$\\overrightarrow{\\mathrm{AK}}=\\overrightarrow{\\mathrm{OK}}-\\vec a$ です。',
        add: [{ t: 'm', tex: '(s\\,\\overrightarrow{\\mathrm{OH}}-\\vec a)\\cdot\\vec b=0' }] } },
      { say: '$\\overrightarrow{\\mathrm{OH}}\\cdot\\vec b=\\frac35\\cdot6+\\frac25\\cdot9=\\frac{36}{5}$ なので、$\\frac{36}{5}s-6=0$、$s=\\frac56$。$0<s<1$ なので K は線分 OH 上にあります。',
        add: [{ t: 'm', size: 'sm', tex: '\\frac{36}{5}s-6=0\\qquad\\therefore\\ s=\\frac56' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OK}}=\\frac56\\,\\overrightarrow{\\mathrm{OH}}=\\frac12\\vec a+\\frac13\\vec b' }] },
      { say: '長さは $|\\overrightarrow{\\mathrm{OK}}|=\\frac56|\\overrightarrow{\\mathrm{OH}}|$ で、(2) の答えが使えます。$\\frac56\\cdot\\frac{6\\sqrt5}{5}=\\sqrt5$。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\overrightarrow{\\mathrm{OK}}=\\frac12\\vec a+\\frac13\\vec b,\\quad |\\overrightarrow{\\mathrm{OK}}|=\\sqrt5' }] },
      { ask: { type: 'think', q: '確かめ：B と K を結ぶ直線は OA に垂直か？ $\\overrightarrow{\\mathrm{BK}}\\cdot\\vec a$ を計算しよう。',
        hint: '$\\overrightarrow{\\mathrm{BK}}=\\overrightarrow{\\mathrm{OK}}-\\vec b=\\frac12\\vec a-\\frac23\\vec b$。',
        ans: '$\\overrightarrow{\\mathrm{BK}}\\cdot\\vec a=\\frac12\\cdot8-\\frac23\\cdot6=4-4=0$。垂直です。',
        after: '三角形の3本の垂線は1点で交わります（この点を垂心といいます）。K は △OAB の垂心です。' } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '$\\angle\\mathrm{AOB}=45^\\circ$ とわかったので、座標でも検算できます。B を $x$ 軸上の $(3,\\,0)$ におくと、A の座標は？',
        add: [{ t: 'h', text: '座標で検算する' },
          { t: 'p', size: 'sm', text: 'O(0, 0)、B(3, 0)、$\\angle\\mathrm{AOB}=45^\\circ$、OA $=2\\sqrt2$' },
          { t: 'fig', id: 'g5', col: 1, view: VIEW, w: 420, h: 328, items: [{ k: 'axes', tx: [1, 2, 3], ty: [1, 2] }].concat(tri, OH, [{ k: 'seg', a: A, b: D, c: 'y', dash: true }, { k: 'pt', at: K, name: 'K', dir: 'w', c: 'g' }]) }] },
      { ask: { type: 'choice', q: 'A の座標は？',
        opts: ['$(\\sqrt2,\\,\\sqrt2)$', '$(2\\sqrt2,\\,2)$', '$(1,\\,1)$', '$(2,\\,2)$'], ok: 3,
        why: { 0: '原点からの距離が 2 になります。OA $=2\\sqrt2$ なので $(2,\\,2)$。', 1: '$45^\\circ$ の方向なら、$x$ 座標と $y$ 座標は等しくなります。', 2: 'それは M（OA の中点）の座標です。' },
        good: '$(2\\sqrt2\\cos45^\\circ,\\ 2\\sqrt2\\sin45^\\circ)=(2,\\,2)$。$\\vec a\\cdot\\vec b=2\\cdot3+2\\cdot0=6$ も合います。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{H}\\left(\\frac{12}{5},\\,\\frac65\\right),\\quad \\mathrm{K}(2,\\,1)', note: '(2)(3) の答えに\n座標を入れた' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OK}}|=\\sqrt{2^2+1^2}=\\sqrt5' }] } },
      { say: '答案では「H は辺 AB 上にあるから $(1-t)\\vec a+t\\vec b$ とおける」「K は直線 OH 上にあるから $s\\,\\overrightarrow{\\mathrm{OH}}$ とおける」と、おく理由を一言書きます。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '答案のコツ', text: '・垂直 →「内積 $=0$ より」と書いて式へ\n・点をおくときは「〜上にあるから」と理由を書く\n・$t,\\ s$ が $0$ と $1$ の間か（辺・線分の上か）を確かめる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂直・長さ・交点の3つを、内積とおき方で処理する。ベクトルの基本問題の型です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
