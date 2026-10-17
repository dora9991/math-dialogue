/* 2024 佐賀大 理系 第4問の類題（自作）：中心が単位円上を動く円と、決まった円。交点はいつも2つで、原点と一直線上
   C₁：|z−α|=√3（|α|=1）、C₂：|z−(1+i)|=2
   答え（python3 で検算ずみ。α をいろいろ変えて数値でも確認）：
   (1) α=i のとき共有点 (1±√3)i。中心間の距離 d は √2−1≦d≦√2+1、2−√3<√2−1、√2+1<2+√3 なので常に2点で交わる
   (2) 2式 zz̄−ᾱz−αz̄=2、zz̄−(1−i)z−(1+i)z̄=2 を引く → (ᾱ−1+i)z+(α−1−i)z̄=0
   (3) β=α−(1+i)≠0、z/β は純虚数 → z=k·iβ（k 実数）で一直線上。k₁k₂=−2/|β|² より z₁z̄₂=−2、|z₁||z₂|=2 */
(function () {
  const R3 = Math.sqrt(3);
  const cfig = (id, al, extra, view, w) => {
    const h = Math.round(w * (view[3] - view[1]) / (view[2] - view[0]));   // 縦横比は view にそろえる（円がゆがまない）
    return { t: 'fig', id, col: 1, view, w, h, items: [
      { k: 'axes', tx: [], ty: [], xl: '実軸', yl: '虚軸' },
      { k: 'circle', o: [0, 0], r: 1, c: 'd', dash: true },
      { k: 'circle', o: [1, 1], r: 2, c: 'b', wd: 3 },
      { k: 'circle', o: al, r: R3, c: 'y', wd: 3 },
      { k: 'pt', at: [1, 1], name: '1+i', dir: 'e', c: 'b', size: 21 },
      { k: 'pt', at: al, name: 'α', dir: 'sw', c: 'y', size: 22 }
    ].concat(extra || []) };
  };
  // (1) α=i の図
  const V1 = [-2.4, -1.5, 3.5, 3.6];
  const F1 = (id, extra) => cfig(id, [0, 1], [
    { k: 'label', at: [-1.75, 2.75], text: 'C₁', c: 'y', size: 24 }, { k: 'label', at: [2.75, 2.95], text: 'C₂', c: 'b', size: 24 }
  ].concat(extra || []), V1, 440);
  const P1 = [{ k: 'pt', at: [0, 1 + R3], name: '(1+√3)i', dir: 'nw', c: 'p', size: 21 }, { k: 'pt', at: [0, 1 - R3], name: '(1−√3)i', dir: 'sw', c: 'p', size: 21 }];
  // (3) α=−0.6−0.8i の図（一般の場合の例）
  const V3 = [-2.9, -2.9, 3.5, 3.5];
  const Z1 = [-0.9967, 0.886], Z2 = [1.1209, -0.9963];
  const F3 = (id, extra) => cfig(id, [-0.6, -0.8], [
    { k: 'label', at: [-2.2, -2.3], text: 'C₁', c: 'y', size: 24 }, { k: 'label', at: [2.75, 2.95], text: 'C₂', c: 'b', size: 24 },
    { k: 'line', p1: [0, 0], p2: [1.8, -1.6], c: 'p', dash: true },
    { k: 'pt', at: Z1, name: 'z₁', dir: 'w', dy: -12, off: 24, c: 'p', size: 24 }, { k: 'pt', at: Z2, name: 'z₂', dir: 'ne', dx: 6, off: 26, c: 'p', size: 24 }
  ].concat(extra || []), V3, 420);
  const POINTS = [
    '2円がちょうど2点で交わる ⇔ $|r_1-r_2|<d<r_1+r_2$。中心間の距離 $d$ は **三角不等式** で上下からはさむ',
    '$|z-\\alpha|^2=(z-\\alpha)(\\overline{z}-\\overline{\\alpha})$ と展開。2つの円の式を **辺々引く** と $z\\overline{z}$ が消える',
    '$w+\\overline{w}=0$ ⇔ $w$ は純虚数または 0。$z=k\\,i\\beta$（$k$ は実数）とおけば一直線上、$k$ の2次方程式の解と係数の関係で積が出る'
  ];

  HB.lesson({
    id: 'saga24-4', field: '佐賀大型　数学（理系）', title: '2024 佐賀大 理系 第4問の類題 ― 動く円と決まった円の交点', level: '2024年度 佐賀大学 理系 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '複素数平面上で、$|\\alpha|=1$ をみたす複素数 $\\alpha$ に対して、2つの円\n　$C_1:\\ |z-\\alpha|=\\sqrt3$，　$C_2:\\ |z-(1+i)|=2$\nを考える。',
      parts: [
        '(1)　$\\alpha=i$ のとき、$C_1$ と $C_2$ を図示し、共有点を表す複素数を求めよ。また、$|\\alpha|=1$ をみたすどのような $\\alpha$ に対しても、$C_1$ と $C_2$ はちょうど2つの共有点をもつことを示せ。',
        '(2)　$C_1$ と $C_2$ の共有点を表す複素数 $z$ は、$(\\overline{\\alpha}-1+i)z+(\\alpha-1-i)\\overline{z}=0$ をみたすことを示せ。',
        '(3)　$C_1$ と $C_2$ の2つの共有点を表す複素数を $z_1,\\ z_2$ とする。原点 O と $z_1,\\ z_2$ の表す3点は一直線上にあることを示せ。また、$|z_1||z_2|$ と $z_1\\overline{z_2}$ の値を求めよ。'
      ],
      src: '※ 2024年度 佐賀大学 前期 理工学部 数学 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面の円の問題です。$C_1$ の中心 $\\alpha$ は単位円の上を動き、$C_2$ は決まった円。交点がどう動くかを、式で示していきます。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- (1) 図示 ----------
      { clear: true, part: '(1)', say: '(1) です。$\\alpha=i$ のとき、$C_1$ は中心 $i$・半径 $\\sqrt3$、$C_2$ は中心 $1+i$・半径 2 の円（右の図）。$z=x+yi$ とおいて、共有点を求めます。',
        add: [{ t: 'h', text: '(1)　α = i のとき' },
          { t: 'm', size: 'sm', tex: 'C_1:\\ x^2+(y-1)^2=3' },
          { t: 'm', size: 'sm', tex: 'C_2:\\ (x-1)^2+(y-1)^2=4' },
          F1('f1')] },
      { ask: { type: 'choice', q: '$\\alpha=i$ のとき、$C_1$ と $C_2$ の共有点を表す複素数は？',
        opts: ['$1\\pm\\sqrt3\\,i$', '$\\pm\\sqrt3\\,i$', '$(1\\pm\\sqrt3)\\,i$', '$i,\\ 1+i$'], ok: 2,
        why: { 0: '実部と虚部が逆です。2式を引くと $x=0$（実部が 0）になります。', 1: '$(y-1)^2=3$ から $y=1\\pm\\sqrt3$。1 を足し忘れています。', 3: 'それは2つの円の中心です。' },
        good: '2式を引くと $2x-1=-1$ で $x=0$。$(y-1)^2=3$ より $y=1\\pm\\sqrt3$。2点とも虚軸の上です。',
        add: [{ t: 'ans', label: '(1) 前半', text: '共有点は　$(1+\\sqrt3)i,\\ \\ (1-\\sqrt3)i$（右の図）' }],
        draw: [{ fig: 'f1', items: P1 }] } },
      { say: '2つの共有点と原点 O が、虚軸という1本の直線に並びました。しかも $(\\sqrt3+1)(\\sqrt3-1)=2$。これが (3) で示すことの予告です。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '気づき', text: '2つの共有点と O が一直線上（虚軸）\n原点からの距離の積は $(\\sqrt3+1)(\\sqrt3-1)=2$' }] },

      // ---------- (1) 証明 ----------
      { clear: true, part: '(1) 証明', say: '後半は「どんな $\\alpha$ でもちょうど2点で交わる」ことの証明。2円の位置関係は、中心間の距離 $d$ と半径で決まります。',
        add: [{ t: 'h', text: '(1)　いつも2点で交わることの証明' },
          { t: 'm', tex: 'd=|\\alpha-(1+i)|', note: '中心 α と 1+i の距離' },
          cfig('f2', [-0.6, -0.8], [{ k: 'seg', a: [-0.6, -0.8], b: [1, 1], c: 'g', wd: 3, label: 'd', dx: 16, dy: 4 }], V3, 400)] },
      { ask: { type: 'choice', q: '半径 $\\sqrt3$ と 2 の円がちょうど2点で交わる条件は？',
        opts: ['$2-\\sqrt3<d<2+\\sqrt3$', '$d<2+\\sqrt3$', '$\\sqrt3<d<2$', '$d>2-\\sqrt3$'], ok: 0,
        why: { 1: 'これだけでは、小さい円が大きい円の中に入って交わらない場合がのぞけません。', 2: '半径どうしの間ではなく、半径の差と和の間です。', 3: 'これだけでは、2円が離れすぎて交わらない場合がのぞけません。' },
        good: '「半径の差 $<d<$ 半径の和」。2つの不等式を両方示します。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '示すこと', text: '$2-\\sqrt3<d<2+\\sqrt3$' }] } },
      { say: '$d$ は三角不等式ではさめます。$|\\alpha|=1$、$|1+i|=\\sqrt2$ なので、$\\sqrt2-1\\le d\\le\\sqrt2+1$。$\\alpha$ がどこにあってもこの範囲です。',
        add: [{ t: 'm', size: 'sm', tex: '\\big||1+i|-|\\alpha|\\big|\\le|\\alpha-(1+i)|\\le|\\alpha|+|1+i|' },
          { t: 'm', tex: '\\sqrt2-1\\le d\\le\\sqrt2+1' }] },
      { ask: { type: 'choice', q: '$\\sqrt2-1$ と $2-\\sqrt3$ の大小は？',
        opts: ['$\\sqrt2-1<2-\\sqrt3$', '$\\sqrt2-1=2-\\sqrt3$', '$\\sqrt2-1>2-\\sqrt3$'], ok: 2,
        why: { 0: '$\\sqrt2-1\\fallingdotseq0.414$、$2-\\sqrt3\\fallingdotseq0.268$ です。', 1: '$\\sqrt2+\\sqrt3=3$ にはなりません。' },
        good: '$(\\sqrt2+\\sqrt3)^2=5+2\\sqrt6>5+4=9$ より $\\sqrt2+\\sqrt3>3$、つまり $\\sqrt2-1>2-\\sqrt3$。',
        add: [{ t: 'm', size: 'sm', tex: '(\\sqrt2+\\sqrt3)^2=5+2\\sqrt6>9\\ \\Rightarrow\\ \\sqrt2-1>2-\\sqrt3' }] } },
      { say: '上側は $\\sqrt2+1<2+\\sqrt3$ が明らか。まとめると、どんな $\\alpha$ でも $2-\\sqrt3<d<2+\\sqrt3$ が成り立ち、ちょうど2つの共有点をもちます。',
        add: [{ t: 'ans', label: '(1) 後半', tex: '2-\\sqrt3<\\sqrt2-1\\le d\\le\\sqrt2+1<2+\\sqrt3' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。共有点 $z$ は2つの円の式を両方みたします。絶対値の2乗は「自分 × 共役」で展開します。',
        add: [{ t: 'h', text: '(2)　共有点がみたす式' },
          { t: 'm', size: 'sm', tex: '|z-\\alpha|^2=(z-\\alpha)(\\overline{z}-\\overline{\\alpha})=z\\overline{z}-\\overline{\\alpha}z-\\alpha\\overline{z}+\\alpha\\overline{\\alpha}' }] },
      { ask: { type: 'choice', q: '$C_1$ の式 $|z-\\alpha|^2=3$ を、$|\\alpha|=1$ を使って整理すると？',
        opts: ['$z\\overline{z}-\\alpha z-\\overline{\\alpha}\\,\\overline{z}=2$', '$z\\overline{z}-\\overline{\\alpha}z-\\alpha\\overline{z}=2$', '$z\\overline{z}-\\overline{\\alpha}z-\\alpha\\overline{z}=4$', '$z\\overline{z}-\\overline{\\alpha}z-\\alpha\\overline{z}=\\sqrt3-1$'], ok: 1,
        why: { 0: '$z$ にかかるのは $\\overline{\\alpha}$ です。共役の位置が逆です。', 2: '$\\alpha\\overline{\\alpha}=1$ を右辺に移すと $3-1=2$。足しています。', 3: '$|z-\\alpha|=\\sqrt3$ を2乗すると 3。2乗し忘れています。' },
        good: '$\\alpha\\overline{\\alpha}=|\\alpha|^2=1$ を移項して、右辺は $3-1=2$。',
        add: [{ t: 'm', tex: 'z\\overline{z}-\\overline{\\alpha}z-\\alpha\\overline{z}=2', note: '…①' }] } },
      { say: '$C_2$ も同じように展開します。$\\overline{1+i}=1-i$、$|1+i|^2=2$ なので、右辺は $4-2=2$。①と右辺が同じ 2 になりました。',
        add: [{ t: 'm', tex: 'z\\overline{z}-(1-i)z-(1+i)\\overline{z}=2', note: '…②' }] },
      { say: '②−① で $z\\overline{z}$ と右辺の 2 が消えます。共有点 $z$ は①②を両方みたすので、この式もみたします。',
        add: [{ t: 'm', size: 'sm', tex: '\\{\\overline{\\alpha}-(1-i)\\}z+\\{\\alpha-(1+i)\\}\\overline{z}=0', note: '② − ①' },
          { t: 'ans', label: '(2)', tex: '(\\overline{\\alpha}-1+i)z+(\\alpha-1-i)\\overline{z}=0' }] },

      // ---------- (3) 一直線上 ----------
      { clear: true, cols: [0.56, 0.44], part: '(3)', say: '(3) です。$\\beta=\\alpha-(1+i)$ とおくと、(2) の式は $\\overline{\\beta}z+\\beta\\overline{z}=0$。$|\\alpha|=1\\neq\\sqrt2=|1+i|$ なので $\\beta\\neq0$ です。',
        add: [{ t: 'h', text: '(3)　O, z₁, z₂ が一直線上' },
          { t: 'm', tex: '\\overline{\\beta}z+\\beta\\overline{z}=0\\qquad(\\beta\\neq0)' },
          { t: 'm', size: 'sm', tex: '\\frac{z}{\\beta}+\\frac{\\overline{z}}{\\overline{\\beta}}=0', note: '両辺を $\\beta\\overline{\\beta}=|\\beta|^2$\nでわった' },
          F3('f3')] },
      { ask: { type: 'choice', q: '$w=\\dfrac{z}{\\beta}$ とおくと $w+\\overline{w}=0$。$w$ はどんな数？',
        opts: ['実数', '絶対値が 1 の数', '0 だけ', '純虚数または 0'], ok: 3,
        why: { 0: '$w+\\overline{w}$ は実部の2倍。実部が 0 になります。', 1: '絶対値の条件なら $w\\overline{w}=1$ です。ここは和が 0。', 2: '$w=i$ なども $w+\\overline{w}=0$ をみたします。' },
        good: '実部が 0 なので $w=ki$（$k$ は実数）。よって $z=k\\,i\\beta$ と表せます。',
        add: [{ t: 'm', tex: 'z=k\\,i\\beta\\quad(k\\text{ は実数})' }] } },
      { say: '$z_1,\\ z_2$ はどちらも $k\\,i\\beta$ の形。つまり原点を通り、$i\\beta$ の向きの直線（右の図の点線）の上にあります。だから O, $z_1$, $z_2$ は一直線上です。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '一直線上', text: '$z_1=k_1i\\beta,\\ z_2=k_2i\\beta$（$k_1,\\ k_2$ は実数）\n→ 原点を通る1本の直線の上' }] },

      // ---------- (3) 値 ----------
      { clear: true, cols: [0.6, 0.4], say: '値を求めます。$z=k\\,i\\beta$ を②に入れます。$(1-i)z+(1+i)\\overline{z}$ は「数＋その共役」なので実数。これを $ck$（$c$ は実数）と書くと…',
        add: [{ t: 'h', text: '(3)　つづき：$|z_1||z_2|$ と $z_1\\overline{z_2}$ の値' },
          { t: 'm', size: 'sm', tex: 'z\\overline{z}=k^2|\\beta|^2,\\quad (1-i)z+(1+i)\\overline{z}=ck' },
          { t: 'm', tex: '|\\beta|^2k^2-ck-2=0', note: '$k$ の2次方程式\n解 $k_1,\\ k_2$ が $z_1,\\ z_2$' },
          F3('f4')] },
      { ask: { type: 'choice', q: '$z_1\\overline{z_2}=k_1i\\beta\\cdot\\overline{k_2i\\beta}=k_1k_2|\\beta|^2$。値は？',
        opts: ['$2$', '$-\\dfrac{2}{|\\beta|^2}$', '$-2$', '$-2i$'], ok: 2,
        why: { 0: '解と係数の関係で $k_1k_2=-\\frac{2}{|\\beta|^2}$。マイナスがつきます。', 1: 'それは $k_1k_2$。$|\\beta|^2$ をかけます。', 3: '$k_1,\\ k_2,\\ |\\beta|^2$ はどれも実数。答えも実数です。' },
        good: '$k_1k_2|\\beta|^2=-\\dfrac{2}{|\\beta|^2}\\cdot|\\beta|^2=-2$。$\\alpha$ によりません。',
        add: [{ t: 'm', tex: 'z_1\\overline{z_2}=-2,\\qquad |z_1||z_2|=|z_1\\overline{z_2}|=2' }] } },
      { say: '$k_1k_2<0$ なので、$z_1$ と $z_2$ は原点をはさんで反対側にあります。(3) の答えです。',
        add: [{ t: 'ans', label: '(3) 答', text: 'O, $z_1$, $z_2$ は一直線上\n$|z_1||z_2|=2$，　$z_1\\overline{z_2}=-2$' }] },
      { ask: { type: 'think', q: '確かめ：(1) の $\\alpha=i$ のとき、$z_1=(1+\\sqrt3)i,\\ z_2=(1-\\sqrt3)i$。$z_1\\overline{z_2}$ を計算しよう。',
        hint: '$\\overline{z_2}=-(1-\\sqrt3)i$。$i\\cdot(-i)=1$。',
        ans: '$z_1\\overline{z_2}=(1+\\sqrt3)i\\cdot\\{-(1-\\sqrt3)i\\}=(1+\\sqrt3)(1-\\sqrt3)=-2$',
        after: '一般の場合の答えと一致しました。具体例での検算は、記述式でもとても有効です。' } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '(2) で右辺が両方 2 になったのが、この問題の核心です。O は両方の円の内側にあり、O を通る弦について方べきの定理が使えます。',
        add: [{ t: 'h', text: '方べきの定理で見る' },
          { t: 'box', c: 'b', size: 'sm', label: '方べきの定理', text: '円の内部の点 O を通る弦 PQ について\nOP · OQ ＝（半径）$^2$ −（中心と O の距離）$^2$' },
          { t: 'tbl', size: 'sm', cls: 'rowh', rows: [['円', '（半径）²', '（中心と O の距離）²', '差'], ['$C_1$', '3', '$|\\alpha|^2=1$', '2'], ['$C_2$', '4', '$|1+i|^2=2$', '2']] },
          F3('f5')] },
      { say: 'O は弦 $z_1z_2$ の上にあるので、$C_1$ で方べきの定理を使うと $|z_1||z_2|=3-1=2$。$C_2$ で使っても $4-2=2$。図形の定理と複素数の計算が、同じ答えを出しています。' },
      { say: '答案では、展開のしかた、わる前の $\\beta\\neq0$ の確認、「純虚数または 0」の言いかえを、きちんと書きます。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '答案のコツ', text: '・$|z-\\alpha|^2=(z-\\alpha)(\\overline{z}-\\overline{\\alpha})$ と書いて展開\n・$|\\beta|^2$ でわる前に「$\\beta\\neq0$」を示す\n・$w+\\overline{w}=0$ ⇔ $w$ は純虚数または 0' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。2円の位置関係は距離と半径、共有点の式は辺々引く、一直線上は「比が実数・純虚数」で。複素数平面の円の基本がそろった問題です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
