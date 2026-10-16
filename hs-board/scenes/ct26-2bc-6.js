/* 2026 共通テスト 数学Ⅱ，B，C 第6問の類題（自作）：台形の頂点を使った平面ベクトル。等式を満たす点の位置と、点のとりうる範囲（内積なし）
   図は a=(2,0), c=(−1,2) の等脚台形：O(0,0) A(2,0) B(3,2) C(−1,2)、M(1,0)
   答え（python3 で検算ずみ）：(1) ア=①（2a+c）　(2) イ=①（重心）、ウ=①（2）、エ=②（k）、オ=⓪（k:2）、カ=①、k=1/2
   (3) ケ=③（0≦t≦1, 0≦s≦1+t）、コ=⓪（t≧0, s≧2t, s−t≦1） */
(function () {
  const O = [0, 0], A = [2, 0], B = [3, 2], C = [-1, 2], M = [1, 0], G = [5 / 3, 2 / 3], P = [1.4, 0.4];
  const base = () => [
    { k: 'poly', pts: [O, A, B, C], close: true },
    { k: 'vec', a: O, b: A, c: 'y', wd: 4 }, { k: 'vec', a: O, b: C, c: 'b', wd: 4 },
    { k: 'label', at: [0.45, 0], dy: 28, text: 'a', vec: true, c: 'y', size: 26 }, { k: 'label', at: [-0.65, 1.0], text: 'c', vec: true, c: 'b', size: 26 },
    { k: 'pt', at: O, name: 'O', dir: 'sw' }, { k: 'pt', at: A, name: 'A', dir: 'se' }, { k: 'pt', at: B, name: 'B', dir: 'ne' }, { k: 'pt', at: C, name: 'C', dir: 'nw' }];
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-1.6, -0.7, 3.8, 2.6], w: Math.round((h || 370) * 5.4 / 3.3), h: h || 370, items: base().concat(items || []) });
  const POINTS = [
    '$\\overrightarrow{\\mathrm{PX}}=\\overrightarrow{\\mathrm{OX}}-\\overrightarrow{\\mathrm{OP}}$ と始点を O にそろえて、$\\overrightarrow{\\mathrm{OP}}$ について解く',
    '係数の和が 1 の形 $\\dfrac{n\\overrightarrow{\\mathrm{OM}}+m\\overrightarrow{\\mathrm{OB}}}{m+n}$ なら、P は MB を $m:n$ に内分。$k$ を動かすと内分点が動く',
    '$s\\vec a+t\\vec c$ の範囲は、図形の各辺を「$s,\\ t$ の式」で表して、どちら側かを考える'
  ];

  HB.lesson({
    id: 'ct26-2bc-6', field: '共通テスト型　数学Ⅱ，B，C', title: '2026 共通テスト 数学Ⅱ，B，C 第6問の類題 ― 台形とベクトル、点の位置と動く範囲',
    level: '2026年度 第6問の類題（自作）', time: '目安 15〜20分',
    problem: {
      label: '類題',
      lead: '平面上に、$\\mathrm{OA}\\parallel\\mathrm{CB}$、$\\mathrm{CB}=2\\mathrm{OA}$ である台形 OABC がある。$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OC}}=\\vec c$ とし、辺 OA の中点を M とする。',
      parts: [
        '(1)　$\\overrightarrow{\\mathrm{OB}}=\\boxed{\\text{ア}}$ である。\n　$\\boxed{\\text{ア}}$ の解答群　⓪ $\\vec a+\\vec c$　① $2\\vec a+\\vec c$　② $\\vec a+2\\vec c$　③ $2\\vec a-\\vec c$',
        '(2)　$k$ を 0 以上の実数とし、点 P が $\\overrightarrow{\\mathrm{PO}}+\\overrightarrow{\\mathrm{PA}}+k\\overrightarrow{\\mathrm{PB}}=\\vec0$ …① を満たすとする。\n　(i) $k=1$ のとき、P は $\\boxed{\\text{イ}}$ である。\n　$\\boxed{\\text{イ}}$ の解答群　⓪ 線分 MB の中点　① $\\triangle\\mathrm{OAB}$ の重心　② 線分 OB の中点　③ 対角線 OB と AC の交点\n　(ii) ① を変形すると $\\overrightarrow{\\mathrm{OP}}=\\dfrac{\\boxed{\\text{ウ}}}{k+2}\\overrightarrow{\\mathrm{OM}}+\\dfrac{\\boxed{\\text{エ}}}{k+2}\\overrightarrow{\\mathrm{OB}}$ となるので、P は線分 MB を $\\boxed{\\text{オ}}$ に内分する点である。\n　$\\boxed{\\text{ウ}},\\ \\boxed{\\text{エ}}$ の解答群　⓪ $1$　① $2$　② $k$　③ $2k$\n　$\\boxed{\\text{オ}}$ の解答群　⓪ $k:2$　① $2:k$　② $k:1$　③ $1:k$\n　(iii) $k$ が 0 以上のすべての実数値をとって変化するとき、P のとりうる範囲は $\\boxed{\\text{カ}}$ である。\n　$\\boxed{\\text{カ}}$ の解答群　⓪ 線分 MB（両端をふくむ）　① 線分 MB から点 B を除いたもの　② 線分 MB から点 M を除いたもの　③ 直線 MB 全体\n　(iv) P が対角線 AC 上にあるのは、$k=\\dfrac{\\boxed{\\text{キ}}}{\\boxed{\\text{ク}}}$ のときである。',
        '(3)　点 Q を、実数 $s,\\ t$ を用いて $\\overrightarrow{\\mathrm{OQ}}=s\\vec a+t\\vec c$ で定める。Q が台形 OABC の周および内部にあるための条件は $\\boxed{\\text{ケ}}$ であり、Q が $\\triangle\\mathrm{OAB}$ の周および内部にあるための条件は $\\boxed{\\text{コ}}$ である。\n　$\\boxed{\\text{ケ}}$ の解答群　⓪ $0\\le s\\le2,\\ 0\\le t\\le1$　① $0\\le s\\le1,\\ 0\\le t\\le1$　② $s\\ge0,\\ t\\ge0,\\ s+t\\le2$　③ $0\\le t\\le1,\\ 0\\le s\\le1+t$\n　$\\boxed{\\text{コ}}$ の解答群　⓪ $t\\ge0,\\ s\\ge2t,\\ s-t\\le1$　① $s\\ge0,\\ t\\ge0,\\ s+t\\le1$　② $t\\ge0,\\ s\\ge t,\\ s+t\\le2$　③ $0\\le t\\le1,\\ s\\le2t$'
      ],
      src: '※ 2026年度 共通テスト 数学Ⅱ，B，C 第6問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: 'テーマは「台形の中のベクトル」。等式を満たす点がどこにあるか、そしてその点がどこまで動けるかを考えます。内積は使いません。',
        add: [{ t: 'h', text: '類題（第6問）　平面ベクトル' },
          { t: 'box', c: 'y', size: 'sm', label: '設定', text: '台形 OABC：$\\mathrm{OA}\\parallel\\mathrm{CB}$、$\\mathrm{CB}=2\\mathrm{OA}$\n$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OC}}=\\vec c$、M は OA の中点' },
          fig('f0', [{ k: 'pt', at: M, name: 'M', dir: 's', c: 'g' }])] },
      { say: '共通テストのコツ。この大問は全部が選択肢。**図に書きこみながら** 選択肢を消すのが速いです。まず $\\overrightarrow{\\mathrm{OB}}$ は、O から C を通って B へ行けば $\\vec c+2\\vec a$（ア は ①）。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OB}}=\\overrightarrow{\\mathrm{OC}}+\\overrightarrow{\\mathrm{CB}}=2\\vec a+\\vec c', note: '(1) ア は ①' },
          { t: 'box', c: 'b', size: 'xs', label: 'コツ', text: '$\\overrightarrow{\\mathrm{CB}}=2\\vec a$（向きも同じ）。図にかいた矢印をたどって式を作る' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。①は始点がばらばら。始点を O にそろえます。$\\overrightarrow{\\mathrm{PO}}=-\\overrightarrow{\\mathrm{OP}}$、$\\overrightarrow{\\mathrm{PA}}=\\vec a-\\overrightarrow{\\mathrm{OP}}$、$\\overrightarrow{\\mathrm{PB}}=\\overrightarrow{\\mathrm{OB}}-\\overrightarrow{\\mathrm{OP}}$ です。',
        add: [{ t: 'h', text: '(2)　等式を満たす点 P' },
          { t: 'm', size: 'sm', tex: '-\\overrightarrow{\\mathrm{OP}}+(\\vec a-\\overrightarrow{\\mathrm{OP}})+k(\\overrightarrow{\\mathrm{OB}}-\\overrightarrow{\\mathrm{OP}})=\\vec0' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{\\vec a+k\\overrightarrow{\\mathrm{OB}}}{k+2}', note: '$\\overrightarrow{\\mathrm{OP}}$ が\n$1+1+k$ 個' },
          fig('f1', [{ k: 'pt', at: M, name: 'M', dir: 's', c: 'g' }])] },
      { ask: { type: 'choice', q: '$k=1$ のとき、P（イ）は？',
        opts: ['⓪ 線分 MB の中点', '① △OAB の重心', '② 線分 OB の中点', '③ 対角線 OB と AC の交点'], ok: 1,
        why: { 0: '重心は MB を $1:2$ に内分する点。中点ではありません。', 2: 'OB の中点は $\\frac12\\overrightarrow{\\mathrm{OB}}$。$\\vec a$ の分が足りません。', 3: '対角線の交点は $\\frac13\\overrightarrow{\\mathrm{OB}}$。重心は $\\frac13(\\vec a+\\overrightarrow{\\mathrm{OB}})$ です。' },
        good: '$\\overrightarrow{\\mathrm{OP}}=\\dfrac{\\vec0+\\vec a+\\overrightarrow{\\mathrm{OB}}}{3}$ は、O・A・B の重心です。',
        draw: [{ fig: 'f1', items: [{ k: 'seg', a: O, b: B, c: 'd', dash: true }, { k: 'seg', a: M, b: B, c: 'g', dash: true }, { k: 'pt', at: G, name: 'G', dir: 'nw', c: 'p' }] }] } },
      { say: '$\\vec a=2\\overrightarrow{\\mathrm{OM}}$ と書きかえると、係数の和が 1 の形になります。だから P は直線 MB 上。ウ は 2、エ は $k$ です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{\\hy{2}}{k+2}\\overrightarrow{\\mathrm{OM}}+\\frac{\\hb{k}}{k+2}\\overrightarrow{\\mathrm{OB}}', note: '係数の和 $=1$' }] },
      { ask: { type: 'choice', q: 'P は線分 MB をどんな比に内分する（オ）？',
        opts: ['⓪ $k:2$', '① $2:k$', '② $k:1$', '③ $1:k$'], ok: 0,
        why: { 1: '逆です。$\\frac{n\\overrightarrow{\\mathrm{OM}}+m\\overrightarrow{\\mathrm{OB}}}{m+n}$ は MB を $m:n$ に内分。B の係数が M からの長さの側。', 2: '$\\vec a=2\\overrightarrow{\\mathrm{OM}}$ の 2 を忘れています。', 3: '比の向きも 2 も、ちがっています。' },
        good: 'MP : PB $=k:2$。$k=1$ なら $1:2$ で、たしかに重心（MB は中線）です。',
        add: [{ t: 'm', tex: '\\mathrm{MP}:\\mathrm{PB}=k:2' }] } },
      { ask: { type: 'choice', q: '$k\\ge0$ で $k$ を動かすと、P のとりうる範囲（カ）は？',
        opts: ['⓪ 線分 MB（両端をふくむ）', '① 線分 MB から B を除いたもの', '② 線分 MB から M を除いたもの', '③ 直線 MB 全体'], ok: 1,
        why: { 0: 'B になるのは PB $=0$ のとき。$k:2$ で PB の側は 2 のままなので、B には届きません。', 2: '$k=0$ のとき MP:PB $=0:2$ で P は M。M はふくみます。', 3: '$k\\ge0$ なので内分点だけ。線分の外には出ません。' },
        good: '$k=0$ で M。$k$ を大きくすると B に近づきますが、B にはなりません。',
        draw: [{ fig: 'f1', items: [{ k: 'seg', a: M, b: B, c: 'y', wd: 6 }, { k: 'pt', at: M, c: 'y' }, { k: 'pt', at: B, c: 'y', open: true }] }] } },
      { clear: true, part: '(2)', say: '(iv) です。P が対角線 AC 上にある条件。$\\vec a,\\ \\vec c$ で書いたとき、直線 AC 上の点は「係数の和が 1」です。',
        add: [{ t: 'h', text: '(2)(iv)　P が AC 上にあるとき' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac{1+2k}{k+2}\\vec a+\\frac{k}{k+2}\\vec c', note: '$\\overrightarrow{\\mathrm{OB}}=2\\vec a+\\vec c$ を代入' },
          { t: 'm', tex: '\\frac{1+2k}{k+2}+\\frac{k}{k+2}=1' },
          fig('f2', [{ k: 'seg', a: A, b: C, c: 'b', dash: true }, { k: 'seg', a: M, b: B, c: 'y', wd: 5 }, { k: 'pt', at: M, name: 'M', dir: 's', c: 'g' }])] },
      { ask: { type: 'choice', q: 'P が AC 上にある $k$（キ・ク）は？',
        opts: ['$k=2$', '$k=\\frac13$', '$k=\\frac12$', '$k=1$'], ok: 2,
        why: { 0: '$1+3k=k+2$ から $2k=1$。逆数になっています。', 1: '分母をはらうと $1+2k+k=k+2$。$2k=1$ です。', 3: '$k=1$ は重心 G。G は AC 上にはありません。' },
        good: '$1+3k=k+2$ より $k=\\frac12$。このとき MP:PB $=\\frac12:2=1:4$。',
        add: [{ t: 'm', tex: '1+3k=k+2\\quad\\therefore\\ k=\\frac12' }],
        draw: [{ fig: 'f2', items: [{ k: 'pt', at: P, name: 'P', dir: 'n', c: 'p' }] }] } },
      { ask: { type: 'think', q: '$k=\\dfrac12$ のとき、P は対角線 AC をどんな比に内分する？',
        hint: '$k=\\frac12$ を入れると $\\overrightarrow{\\mathrm{OP}}=\\frac45\\vec a+\\frac15\\vec c$。',
        ans: 'AP : PC $=1:4$（$\\vec c$ の係数 $\\frac15$ が A からの割合）。',
        after: '1つの点を「MB 上」と「AC 上」の2通りで見ると、交点の比がわかります。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。$s\\vec a+t\\vec c$ は、$\\vec a,\\ \\vec c$ の方向にななめの方眼をはったときの「座標」$(s,\\,t)$ のようなもの。各辺を $s,\\ t$ の式で表します。',
        add: [{ t: 'h', text: '(3)　点 Q の範囲' },
          { t: 'tbl', size: 'sm', rows: [['点', 'O', 'A', 'B', 'C'], ['$(s,\\,t)$', '$(0,\\,0)$', '$(1,\\,0)$', '$(2,\\,1)$', '$(0,\\,1)$']] },
          { t: 'p', size: 'sm', text: '辺 AB：$(1,\\,0)$ から $(2,\\,1)$ へ → $s=1+t$' },
          fig('f3', [
            { k: 'seg', a: [2, 0], b: [1, 2], c: 'd', dash: true }, { k: 'label', at: [1.05, 2], dy: -20, text: 's=1', size: 20, c: 'd' },
            { k: 'label', at: [2.75, 1.0], text: 's=1+t', size: 20, c: 'g', anchor: 'start' }])] },
      { ask: { type: 'choice', q: 'Q が台形 OABC の周および内部にある条件（ケ）は？',
        opts: ['⓪ $0\\le s\\le2,\\ 0\\le t\\le1$', '① $0\\le s\\le1,\\ 0\\le t\\le1$', '② $s,\\,t\\ge0,\\ s+t\\le2$', '③ $0\\le t\\le1,\\ 0\\le s\\le1+t$'], ok: 3,
        why: { 0: '$(s,\\,t)=(2,\\,0)$ の点は、OA を2倍にのばした所で、台形の外です。', 1: 'それは平行四辺形の部分だけ。B の近くの三角形がたりません。', 2: '$(2,\\,0)$ がふくまれてしまいます。右の辺 AB は $s=1+t$。' },
        good: '高さ $t$（$0\\le t\\le1$）の所で、左はしは OC 上の $s=0$、右はしは AB 上の $s=1+t$。',
        draw: [{ fig: 'f3', items: [{ k: 'poly', pts: [O, A, B, C], close: true, fill: 'y', alpha: 0.3, noStroke: true }] }] } },
      { say: '△OAB も同じように。辺 OA は $t=0$、辺 OB は $(0,0)$ と $(2,1)$ を通るので $s=2t$、辺 AB は $s=1+t$。それぞれ、三角形がどちら側にあるかを考えます。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{OA}:\\ t=0,\\quad \\mathrm{OB}:\\ s=2t,\\quad \\mathrm{AB}:\\ s=t+1' }] },
      { ask: { type: 'choice', q: 'Q が △OAB の周および内部にある条件（コ）は？',
        opts: ['⓪ $t\\ge0,\\ s\\ge2t,\\ s-t\\le1$', '① $s,\\,t\\ge0,\\ s+t\\le1$', '② $t\\ge0,\\ s\\ge t,\\ s+t\\le2$', '③ $0\\le t\\le1,\\ s\\le2t$'], ok: 0,
        why: { 1: 'それは △OAC（直線 AC の O 側）の条件です。', 2: '辺 OB は $s=2t$。$s=t$ や $s+t=2$ は別の直線です。', 3: '$s\\le2t$ は OB の C 側。△OAB は A 側の $s\\ge2t$ です。' },
        good: 'A$(1,\\,0)$ で確かめると、$t=0\\ge0$、$s=1\\ge0$、$s-t=1\\le1$。すべて満たします。',
        draw: [{ fig: 'f3', items: [{ k: 'poly', pts: [O, A, B], close: true, fill: 'p', alpha: 0.45, c: 'p' }] }] } },
      { ask: { type: 'think', q: '(2) の P（$k\\ge0$）は、いつも △OAB の内部にあることを、(3) の条件で確かめよう。',
        hint: '(iv) の式から $s=\\dfrac{1+2k}{k+2},\\ t=\\dfrac{k}{k+2}$。$s-2t$ と $s-t$ を計算。',
        ans: '$s-2t=\\dfrac{1}{k+2}>0$、$s-t=\\dfrac{k+1}{k+2}<1$、$t\\ge0$。よって P は △OAB の周および内部にある。',
        after: '線分 MB は △OAB の中線（から B をのぞいた部分）なので、図とも合っています。' } },

      // ---------- コツ ----------
      { clear: true, cols: [1], part: 'コツ', say: '時間のかけ方の目安です。始点をそろえる式変形は 1 回で済ませ、あとは図と選択肢を見くらべて進めます。',
        add: [{ t: 'h', text: '共通テストでの進め方' },
          { t: 'tbl', size: 'sm', rows: [['小問', '目安', 'ここで時間を使わないコツ'], ['(1)', '1分', '矢印をたどる：$\\overrightarrow{\\mathrm{OC}}+\\overrightarrow{\\mathrm{CB}}$'], ['(2)', '8分', '始点を O にそろえて $\\overrightarrow{\\mathrm{OP}}$ を出す。係数の和 1 で直線上'], ['(3)', '6分', '各辺を $s,\\ t$ の式に。頂点を代入して選択肢を消す']] },
          { t: 'box', c: 'p', size: 'sm', label: 'コツ', text: '範囲の選択肢は、頂点（O・A・B・C）や「外の点」を代入すると、すぐに消せる' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。始点をそろえる・係数の和を見る・辺を式で表す。この3つで、平面ベクトルの位置と範囲の問題が解けます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。問題文（Q キー）だけを見て、ノートでもう一度、時間をはかって解いてみましょう。' }
    ]
  });
})();
