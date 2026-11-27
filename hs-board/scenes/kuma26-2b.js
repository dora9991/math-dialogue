/* 熊大型 数学（理系）：2026年度 熊本大学 前期 理系 第2問の類題②（自作問題・元の問題ではない）
   元の問題のねらいと形式だけを合わせた自作問題。空間で2点からの距離の比が一定の点の集まり（球面）、中心と半径、原点との距離の最小値、k の決定。
   問題：A(−1,0,4), B(0,2,2)。AP:BP=k:1（k>0, k≠1）の点 P 全体＝球面 S_k。O は原点。
   答え（python3・sympy で検算ずみ：方程式、40 万点のサンプルで最小値、k を 60 万通りで解の個数）：
     (1) S_2：(x−1/3)²+(y−8/3)²+(z−4/3)²=4、中心 (1/3,8/3,4/3)、半径 2
     (2) OC=3 > r=2 なので 最小値 1（点 (1/9,8/9,4/9)）
     (3) t=1/(k²−1) とおくと 中心 (t,2+2t,2−2t)、r²=9t(t+1)、OC²−r²=8−9t。
         O が内側 ⇔ 1<k<√34/4。OC=r±1 → 7−9t=±2r → 45t²−162t+49=0 → t=1/3（外側, k=2）, 49/15（内側, k=8/7）
         0<k<1（t<−1）に解はない。答 k=8/7, 2
   図は 平面 OAB での切り口（O を原点、OB 方向を横、BA 方向を縦にとる。OB⊥AB、OB=2√2、AB=3）。O(0,0) B(2√2,0) A(2√2,3)、
   S_k の中心は直線 AB 上 (2√2, −3t)、半径 3√(t(t+1))。最小値のグラフは |8k²−17|/(√(8(k²−1)²+9)+3k)。 */
(function () {
  const W = 2 * Math.SQRT2;
  const O = [0, 0], B = [W, 0], A = [W, 3];
  const C2 = [W, -1], R2 = 2, C87 = [W, -9.8], R87 = 11.2;
  const base = [
    { k: 'seg', a: [W, -3.6], b: [W, 3.7], c: 'd', dash: true, wd: 2 },
    { k: 'seg', a: O, b: B, c: 'w', wd: 2.5 },
    { k: 'right', o: B, a: O, b: A, s: 14 },
    { k: 'pt', at: O, name: 'O', dir: 'w', c: 'w' }, { k: 'pt', at: A, name: 'A', dir: 'e', c: 'w' }, { k: 'pt', at: B, name: 'B', dir: 'ne', c: 'w' }];
  const sec = (id, items, h) => ({ t: 'fig', id, col: 1, view: [-1.5, -3.8, 7.5, 3.8], w: Math.round((h || 420) * 9 / 7.6), h: h || 420,
    items: base.concat([{ k: 'circle', o: C2, r: R2, c: 'y', label: 'S₂', lat: [6.3, 1.4] }], items || []) });
  const POINTS = [
    '比の条件は2乗して $\\mathrm{AP}^2=k^2\\mathrm{BP}^2$。平方完成で中心と半径。検算は「AB の内分点・外分点の中点が中心」',
    '点と球面の距離の最小値は、O が外なら $\\mathrm{OC}-r$、内なら $r-\\mathrm{OC}$。**内か外かを先に調べる**',
    '$t=\\dfrac1{k^2-1}$ とおき、$\\mathrm{OC}^2-r^2$ を使う。$k>1$ と $0<k<1$、内と外の場合分けをもらさない'
  ];

  HB.lesson({
    id: 'kuma26-2b', field: '熊大型　数学（理系）', title: '2026 熊大 理系 第2問の類題② ― 2点からの距離の比が一定の球面と、原点からの最短距離', level: '2026年度 熊本大学 理系 第2問の類題②（自作）', time: '目安 20〜25分',
    pointsTitle: 'この問題のポイント',
    problem: {
      label: '類題②',
      lead: '座標空間に 2 点 $\\mathrm{A}(-1,\\,0,\\,4)$，$\\mathrm{B}(0,\\,2,\\,2)$ がある。正の数 $k\\ (k\\neq1)$ に対して、$\\mathrm{AP}:\\mathrm{BP}=k:1$ をみたす点 P 全体は球面になる。これを $S_k$ とし、O を原点とする。',
      parts: [
        '(1)　$S_2$ の方程式を求め、その中心の座標と半径を答えよ。',
        '(2)　点 P が $S_2$ 上を動くとき、OP の最小値を求めよ。',
        '(3)　$S_k$ 上の点と O との距離の最小値が 1 となるような $k$ の値を、すべて求めよ。'
      ],
      src: '※ 2026年度 熊本大学 前期 理系 第2問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.58, 0.42],
    steps: [
      { part: '問題', say: '空間のベクトル・球面の問題です。「2点からの距離の比が一定」の点の集まりを考えます。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '$\\mathrm{AP}:\\mathrm{BP}=k:1$ は $\\mathrm{AP}=k\\,\\mathrm{BP}$ のこと。長さは 0 以上なので、2乗した式と同じ条件です。',
        add: [{ t: 'h', text: '条件を式にする' },
          { t: 'm', tex: '\\mathrm{AP}:\\mathrm{BP}=k:1\\iff \\mathrm{AP}=k\\,\\mathrm{BP}\\iff \\mathrm{AP}^2=k^2\\,\\mathrm{BP}^2' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '① 2乗して $x,\\ y,\\ z$ の式に　② 平方完成で中心と半径\n③ 点と球面の距離は「中心までの距離」と半径で考える' },
          { t: 'p', size: 'sm', text: 'このような球面を **アポロニウスの球** といいます（平面ならアポロニウスの円）。' }] },
      { ask: { type: 'choice', q: '$\\mathrm{AP}:\\mathrm{BP}=3:2$ を式で表すと？',
        opts: ['$2\\,\\mathrm{AP}^2=3\\,\\mathrm{BP}^2$', '$4\\,\\mathrm{AP}^2=9\\,\\mathrm{BP}^2$', '$9\\,\\mathrm{AP}^2=4\\,\\mathrm{BP}^2$', '$\\mathrm{AP}^2=\\dfrac32\\,\\mathrm{BP}^2$'], ok: 1,
        why: { 0: '$2\\mathrm{AP}=3\\mathrm{BP}$ を2乗すると、2 も 3 も2乗されます。', 2: 'A と B が逆です。AP のほうが大きいので、AP の係数が小さくなります。', 3: '$\\mathrm{AP}=\\frac32\\mathrm{BP}$ を2乗すると $\\mathrm{AP}^2=\\frac94\\mathrm{BP}^2$。$\\frac32$ も2乗します。' },
        good: '$2\\,\\mathrm{AP}=3\\,\\mathrm{BP}$ を2乗して $4\\,\\mathrm{AP}^2=9\\,\\mathrm{BP}^2$。' } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。P$(x,\\,y,\\,z)$ とおいて、$\\mathrm{AP}^2=4\\,\\mathrm{BP}^2$ を座標で書きます。',
        add: [{ t: 'h', text: '(1)　S₂ の方程式' },
          { t: 'm', size: 'sm', tex: '(x+1)^2+y^2+(z-4)^2=4\\{x^2+(y-2)^2+(z-2)^2\\}' }] },
      { say: '右辺から左辺をひいて整理し、3 で割ります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}&3x^2-2x+3y^2-16y+3z^2-8z+15=0\\\\ &x^2-\\frac23x+y^2-\\frac{16}3y+z^2-\\frac83z+5=0\\end{aligned}' }] },
      { ask: { type: 'choice', q: '平方完成すると、$S_2$ の中心と半径は？',
        opts: ['中心 $\\left(\\frac13,\\,\\frac83,\\,\\frac43\\right)$，半径 $2$', '中心 $\\left(-\\frac13,\\,-\\frac83,\\,-\\frac43\\right)$，半径 $2$', '中心 $\\left(\\frac13,\\,\\frac83,\\,\\frac43\\right)$，半径 $4$', '中心 $\\left(\\frac23,\\,\\frac{16}3,\\,\\frac83\\right)$，半径 $2$'], ok: 0,
        why: { 1: '$\\left(x-\\frac13\\right)^2$ の中心は $x=\\frac13$。符号が逆です。', 2: '$4$ は半径の2乗。$\\sqrt{\\phantom{a}}$ をとります。', 3: '平方完成では、$x$ の係数 $-\\frac23$ などの半分を使います。' },
        good: '$\\frac19+\\frac{64}9+\\frac{16}9-5=4$ なので、半径は $2$。',
        add: [{ t: 'm', tex: '\\Big(x-\\frac13\\Big)^2+\\Big(y-\\frac83\\Big)^2+\\Big(z-\\frac43\\Big)^2=4' },
          { t: 'ans', label: '(1) 答', text: '$\\left(x-\\frac13\\right)^2+\\left(y-\\frac83\\right)^2+\\left(z-\\frac43\\right)^2=4$\n中心 $\\left(\\frac13,\\,\\frac83,\\,\\frac43\\right)$，半径 $2$' }] } },
      { say: '検算のコツ。AB を $2:1$ に内分する点 D と外分する点 E は、どちらも $S_2$ 上。その中点が中心です。右は、O, A, B を通る平面で切った図。',
        add: [{ t: 'p', col: 1, size: 'xs', text: 'O, A, B を通る平面での切り口（OB ⊥ AB，OB $=2\\sqrt2$，AB $=3$）' },
          sec('s1', [{ k: 'pt', at: [W, 1], name: 'D', dir: 'w', c: 'g' }, { k: 'pt', at: [W, -3], name: 'E', dir: 'w', c: 'g' }, { k: 'pt', at: C2, name: '中心', dir: 'e', c: 'y', size: 22 }], 400),
          { t: 'p', size: 'sm', text: 'D：$\\left(-\\frac13,\\,\\frac43,\\,\\frac83\\right)$，E：$(1,\\,4,\\,0)$\n中点 $\\left(\\frac13,\\,\\frac83,\\,\\frac43\\right)$　✓　中心と一致' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '球面上の点と O の距離は、O と中心 C を結ぶ直線の上で最小になります。O が球の外か内かで、式が変わります。',
        add: [{ t: 'h', text: '(2)　OP の最小値' },
          { t: 'box', c: 'b', size: 'sm', label: '点と球面の距離', text: '中心 C、半径 $r$ の球面と点 O について、最小値は\nO が外側なら $\\mathrm{OC}-r$、内側なら $r-\\mathrm{OC}$' },
          sec('s2', [{ k: 'seg', a: O, b: C2, c: 'p', dash: true, wd: 2.5 }, { k: 'pt', at: C2, name: 'C', dir: 'e', c: 'y' }])] },
      { ask: { type: 'choice', q: '$\\mathrm{C}\\left(\\frac13,\\,\\frac83,\\,\\frac43\\right)$，$r=2$。OP の最小値は？',
        opts: ['$5$', '$3$', '$\\sqrt{17}-2$', '$1$'], ok: 3,
        why: { 0: '$\\mathrm{OC}+r$ は最大値です（C の向こう側の点）。', 1: '$3$ は中心 C までの距離。球面上の点は、半径の分だけ近くにあります。', 2: '$\\sqrt{17}$ は OA。使うのは中心 C までの距離です。' },
        good: '$\\mathrm{OC}=\\sqrt{\\frac19+\\frac{64}9+\\frac{16}9}=3>2$ なので O は外側。最小値は $3-2=1$。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{OC}=\\sqrt{\\Big(\\frac13\\Big)^2+\\Big(\\frac83\\Big)^2+\\Big(\\frac43\\Big)^2}=3', note: '$r=2$ より大きい\n→ O は外側' }],
        draw: [{ fig: 's2', items: [{ k: 'pt', at: [W / 3, -1 / 3], name: 'Q', dir: 'se', c: 'p' }] }] } },
      { say: '最小になる点 Q は、線分 OC 上で O から 1 の所。$\\overrightarrow{\\mathrm{OQ}}=\\frac13\\overrightarrow{\\mathrm{OC}}$ です。(2) の答えは 1。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OQ}}=\\frac{1}{3}\\overrightarrow{\\mathrm{OC}}=\\Big(\\frac19,\\,\\frac89,\\,\\frac49\\Big)' },
          { t: 'ans', label: '(2) 答', text: 'OP の最小値は $\\mathrm{OC}-r=3-2=1$' }] },

      // ---------- (3) 準備 ----------
      { clear: true, cols: [1], part: '(3) 準備', say: '(3) です。$k$ のままで同じ計算をします。$\\mathrm{AP}^2=k^2\\mathrm{BP}^2$ を整理すると、(1) と同じかたまりが出ます。',
        add: [{ t: 'h', text: '(3)　一般の k で中心と半径' },
          { t: 'm', size: 'sm', tex: '(k^2-1)(x^2+y^2+z^2)-2x-4k^2y-(4k^2-8)z+8k^2-17=0' }] },
      { say: '$k^2-1$ で割ります。$t=\\dfrac1{k^2-1}$ とおくと $k^2t=1+t$ となり、式がすっきりします。$k$ と $t$ の対応にも注意。',
        add: [{ t: 'm', size: 'sm', tex: 'x^2+y^2+z^2-2tx-4(1+t)y-4(1-t)z+8-9t=0\\qquad\\Big(t=\\frac1{k^2-1}\\Big)' },
          { t: 'box', c: 'y', size: 'sm', label: 'k と t', text: '$k>1\\iff t>0$　　$0<k<1\\iff t<-1$　（$k=2$ なら $t=\\frac13$）' }] },
      { ask: { type: 'choice', q: '平方完成すると中心は $\\mathrm{C}(t,\\,2+2t,\\,2-2t)$。半径の2乗 $r^2$ は？',
        opts: ['$9t^2-9t$', '$9t^2+9t+8$', '$9t$', '$9t^2+9t$'], ok: 3,
        why: { 0: '$8-9t$ を右辺に移すと $-8+9t$。$+9t$ です。', 1: '$\\mathrm{C}$ の成分の2乗の和は $8+9t^2$。右辺の $-8$ と打ち消しあいます。', 2: '平方完成で出る $t^2$ の項 $9t^2$ を足し忘れています。' },
        good: '$r^2=(8+9t^2)-(8-9t)=9t(t+1)$。$t=\\frac13$ で $4$ となり、(1) と合います。',
        add: [{ t: 'm', tex: '\\mathrm{C}(t,\\,2+2t,\\,2-2t),\\qquad r^2=9t^2+9t=9t(t+1)' }] } },
      { say: '中心までの距離は $\\mathrm{OC}^2=8+9t^2$。差をとると $t^2$ が消えて、$\\mathrm{OC}^2-r^2=8-9t$。この符号で、O が内か外かがわかります。',
        add: [{ t: 'm', tex: '\\mathrm{OC}^2=8+9t^2,\\qquad \\mathrm{OC}^2-r^2=8-9t' }] },

      // ---------- (3) 内か外か ----------
      { clear: true, cols: [0.55, 0.45], part: '(3) 内か外か', say: '右は $k=2$（黄）と $k=\\frac87$（桃）の切り口。$k=2$ では O は外、$k=\\frac87$ では O は球の中に入っています。',
        add: [{ t: 'h', text: '(3)　O は球の内？ 外？' },
          { t: 'm', tex: '\\text{O が内側}\\iff \\mathrm{OC}<r\\iff 8-9t<0' },
          { t: 'fig', id: 's3', col: 1, view: [-9, -22, 14.5, 5.5], w: 400, h: 468, items: [
            { k: 'seg', a: [W, -21.8], b: [W, 5.4], c: 'd', dash: true, wd: 2 }, { k: 'seg', a: O, b: B, c: 'w', wd: 2.5 },
            { k: 'line', m: 0, n: 1.5, c: 'g', dash: true, label: 'k = 1（平面）', lat: [14.3, 2.6], la: 'end', size: 20 },
            { k: 'circle', o: C2, r: R2, c: 'y', label: 'k = 2', lat: [7.6, -1.2] },
            { k: 'circle', o: C87, r: R87, c: 'p', label: 'k = 8/7', lat: [4.4, -12], la: 'start' },
            { k: 'pt', at: O, name: 'O', dir: 'w', c: 'w' }, { k: 'pt', at: A, name: 'A', dir: 'e', c: 'w', size: 22 }, { k: 'pt', at: B, name: 'B', dir: 'ne', c: 'w', size: 22 }] }] },
      { ask: { type: 'choice', q: 'O が $S_k$ の内側にあるのは、$k$ がどんなとき？',
        opts: ['$1<k<\\dfrac{\\sqrt{34}}4$', '$0<k<1$', '$k>1$ のときいつも', '$k>\\dfrac{\\sqrt{34}}4$'], ok: 0,
        why: { 1: '$t<-1$ なので $8-9t>0$。O はいつも外側です。', 2: '$k=2$（$t=\\frac13$）では $8-9t>0$ で、O は外側でした。', 3: 'それは $8-9t>0$、つまり外側になる範囲です。' },
        good: '$t>\\frac89\\iff 0<k^2-1<\\frac98\\iff 1<k<\\frac{\\sqrt{34}}4$。',
        add: [{ t: 'box', c: 'p', size: 'sm', label: '内か外か', text: '$0<k<1$：外　　$1<k<\\frac{\\sqrt{34}}4$：**内**\n$k>\\frac{\\sqrt{34}}4$：外　（$k=\\frac{\\sqrt{34}}4$ で O は球面上）' }] } },

      // ---------- (3) 方程式 ----------
      { clear: true, cols: [1], part: '(3) 方程式', say: '最小値が 1 になる条件は、外側なら $\\mathrm{OC}-r=1$、内側なら $r-\\mathrm{OC}=1$。まとめて $\\mathrm{OC}=r\\pm1$ です。',
        add: [{ t: 'h', text: '(3)　最小値 ＝ 1 の条件' },
          { t: 'm', tex: '\\text{(i) 外側：}\\ \\mathrm{OC}=r+1\\qquad \\text{(ii) 内側：}\\ \\mathrm{OC}=r-1' }] },
      { say: '2乗して $\\mathrm{OC}^2-r^2=8-9t$ を使うと $7-9t=\\pm2r$。もう一度2乗すると、$t$ だけの2次方程式になります。',
        add: [{ t: 'm', tex: '\\begin{aligned}\\mathrm{OC}^2=r^2\\pm2r+1\\ &\\Longrightarrow\\ 7-9t=\\pm2r\\quad(\\text{(i) は }+,\\ \\text{(ii) は }-)\\\\ &\\Longrightarrow\\ (7-9t)^2=4r^2=36t(t+1)\\\\ &\\Longrightarrow\\ 45t^2-162t+49=0\\quad\\therefore\\ (3t-1)(15t-49)=0\\end{aligned}' }] },
      { say: '$t=\\frac13$ のとき $7-9t=4>0$ なので (i) 外側の場合。$k^2-1=3$ より $k=2$。(2) と同じです。',
        add: [{ t: 'm', tex: 't=\\frac13:\\ 7-9t>0\\ \\to\\ \\text{(i) 外側},\\quad k^2=4,\\ k=2' }] },
      { ask: { type: 'choice', q: '$t=\\frac{49}{15}$ では $7-9t<0$ なので (ii) 内側の場合。このときの $k$ は？',
        opts: ['$\\dfrac{\\sqrt{34}}4$', '$\\dfrac87$', '$\\dfrac78$', '$\\dfrac8{\\sqrt{15}}$'], ok: 1,
        why: { 0: 'それは O が球面上にくる境目の値です。$k^2-1=\\frac1t$ から求めます。', 2: '逆数です。$k^2=\\frac{64}{49}$ から $k=\\frac87$。', 3: '$k^2-1=t$ と取りちがえています（$k^2=\\frac{64}{15}$）。$t$ は $k^2-1$ の逆数です。' },
        good: '$k^2-1=\\frac{15}{49}$ より $k=\\frac87$。$r=\\frac{56}5\\ge1$ で、$1<\\frac87<\\frac{\\sqrt{34}}4$（内側）も合います。',
        add: [{ t: 'm', tex: 't=\\frac{49}{15}:\\ 7-9t<0\\ \\to\\ \\text{(ii) 内側},\\quad k^2=\\frac{64}{49},\\ k=\\frac87' }] } },
      { say: '2つの解はどちらも $t>0$。$t<-1$（$0<k<1$）の解はないので、$k<1$ では最小値は 1 になりません。',
        add: [{ t: 'ans', label: '(3) 答', tex: 'k=\\frac87,\\ 2' }] },

      // ---------- 図で確かめ ----------
      { clear: true, cols: [0.44, 0.56], part: '図で確かめ', say: '横軸を $k$、縦軸を「O と $S_k$ の距離の最小値」にしたグラフです。高さ 1 の線と、ちょうど2回交わっています。',
        add: [{ t: 'h', text: '最小値のグラフ' },
          { t: 'p', size: 'sm', text: '$k\\to0$：$\\mathrm{OA}=\\sqrt{17}$ に近づく\n$k=1$ の所：$\\frac32$\n$k=\\frac{\\sqrt{34}}4$：0（O が球面上）\n$k\\to\\infty$：$\\mathrm{OB}=2\\sqrt2$ に近づく' },
          { t: 'fig', id: 'g1', col: 1, view: [-0.35, -0.7, 4.4, 5.0], w: 640, h: 483, items: [
            { k: 'axes', tx: [1, 2, 3, 4], ty: [[1, '1'], [1.5, '3/2'], [2 * Math.SQRT2, '2√2']], xl: 'k', yl: '' },
            { k: 'seg', a: [1, 0], b: [Math.sqrt(34) / 4, 0], c: 'g', wd: 7 },
            { k: 'label', at: [1.25, 0], text: 'O が内側', dy: 26, c: 'g', size: 19, plain: true },
            { k: 'line', m: 0, n: 1, c: 'b', dash: true, a: -0.3, b: 4.4 },
            { k: 'fn', f: 'abs(8*x*x-17)/(sqrt(8*(x*x-1)**2+9)+3*x)', a: 0, b: 4.35, c: 'y' },
            { k: 'pt', at: [8 / 7, 1], name: 'k = 8/7', dir: 'sw', c: 'p', size: 22 }, { k: 'pt', at: [2, 1], name: 'k = 2', dir: 'se', c: 'p', size: 22 },
            { k: 'pt', at: [1, 1.5], c: 'w', r: 5 }] }] },
      { ask: { type: 'think', q: '$k$ を 1 に近づけると、$S_k$ は何に近づく？ O との距離は？',
        hint: '$k=1$ なら $\\mathrm{AP}=\\mathrm{BP}$。',
        ans: 'AB の垂直二等分面 $-2x-4y+4z=9$。O との距離は $\\dfrac{9}{\\sqrt{4+16+16}}=\\dfrac32$（グラフの $k=1$ の高さ）',
        after: '$0<k<1$ では最小値は $\\frac32$ より大きいので、1 にはなれません。答えの $k<1$ がないことも、図で納得できます。' } },

      // ---------- 答案のポイント ----------
      { clear: true, cols: [1], part: '答案のポイント', say: '記述式の答案で、点を落としやすい所をまとめます。',
        add: [{ t: 'h', text: '答案で気をつけること' },
          { t: 'box', c: 'y', label: '内側の場合', text: '「最小値＝$\\mathrm{OC}-r$」と決めつけない。O が球の内側なら $r-\\mathrm{OC}$。(3) の $k=\\frac87$ はこちら' },
          { t: 'box', c: 'b', label: '2乗の条件', text: '$7-9t=\\pm2r$ を2乗する前に、左辺の符号で (i)・(ii) のどちらに当たるかを確かめる' },
          { t: 'box', c: 'g', label: 'k の範囲', text: '$k>1$ と $0<k<1$ で $k^2-1$ の符号が変わる。$t$ の範囲（$t>0$ / $t<-1$）にふれておく' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。球面と点の距離は「中心までの距離 ± 半径」。内か外かの場合分けが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
