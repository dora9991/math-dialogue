/* 九大型 数学（理系）：2026年度 九州大学 前期 理系 第2問の類題（自作問題・元の問題ではない）
   問題：z が 1+i と 2+2i を結ぶ線分上を動くとき、w = z − 2/z の描く図形 C。C と、原点と C の両端を結ぶ線分で囲まれた部分を虚軸のまわりに回転
   答え（python3 で検算ずみ）：
     z=t(1+i)（1≦t≦2）、2/z=(1−i)/t、w=(t−1/t)+(t+1/t)i → y²−x²=4、x は 0→3/2 に増加（t=(x+√(x²+4))/2）
     (1) 双曲線 y²−x²=4 の 0≦x≦3/2, y>0 の部分（端点 2i, 3/2+5/2 i）
     (2) 円すい π∫_0^{5/2}(3y/5)²dy = 15π/8、くりぬく部分 π∫_2^{5/2}(y²−4)dy = 13π/24 → V = 4π/3
         筒で検算：2π∫_0^{3/2} x(√(x²+4) − 5x/3)dx = 2π(61/24 − 15/8) = 4π/3 */
(function () {
  const HY = 'sqrt(x**2+4)';
  const arc = []; for (let i = 0; i <= 60; i++) { const x = 1.5 * i / 60; arc.push([x, Math.sqrt(x * x + 4)]); }
  const D = [[0, 0], [0, 2]].concat(arc);                       // 囲まれた部分（O → 2i → 弧 → Q → O）
  const Dm = D.map(p => [-p[0], p[1]]);                         // 虚軸について折り返した形
  const cplane = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.1, -0.55, 3.1, 3.35], w: 560, h: 420, items: [
    { k: 'axes', tx: [[1, '1'], [2, '2']], ty: [[1, 'i']], xl: '実軸', yl: '虚軸' },
    { k: 'line', m: 1, n: 0, c: 'd', wd: 2, dash: true }, { k: 'line', m: -1, n: 0, c: 'd', wd: 2, dash: true },
    { k: 'label', at: [3.05, 2.6], text: 'y = x', c: 'd', size: 19, anchor: 'end' },
    { k: 'fn', f: HY, a: -2.1, b: 3.1, c: 'w', wd: 2 }].concat(items || []) });
  const ARC = [{ k: 'fn', f: HY, a: 0, b: 1.5, c: 'y', wd: 6 }, { k: 'pt', at: [0, 2], name: '2i', dir: 'nw', c: 'y', size: 22 }, { k: 'pt', at: [1.5, 2.5], name: '3/2 + 5/2 i', dir: 'e', c: 'y', size: 21 }];
  const ZSEG = [{ k: 'seg', a: [1, 1], b: [2, 2], c: 'b', wd: 5 }, { k: 'pt', at: [1, 1], name: '1+i', dir: 'se', c: 'b', size: 20 }, { k: 'pt', at: [2, 2], name: '2+2i', dir: 'se', c: 'b', size: 20 }];
  // 回転体のようす
  const rot = (id, items) => ({ t: 'fig', id, col: 1, view: [-2.1, -0.45, 2.5, 3.05], w: 540, h: 411, items: [
    { k: 'axes', tx: [], ty: [[2, '2']], xl: '', yl: '虚軸' },
    { k: 'poly', pts: Dm, close: true, c: 'd', wd: 1.5, dash: true },
    { k: 'poly', pts: D, close: true, fill: 'y', alpha: 0.3, c: 'y', wd: 3 },
    { k: 'param', x: '1.5*cos(t)', y: '2.5+0.2*sin(t)', a: 0, b: 2 * Math.PI, c: 'b', wd: 2 },
    { k: 'pt', at: [1.5, 2.5], name: 'Q', dir: 'e', c: 'y', size: 22 },
    { k: 'label', at: [0.62, 1.15], text: 'D', c: 'y', size: 26 }].concat(items || []) });
  const POINTS = [
    '直線の一部を動く $z$ は、$z=t(1+i)$ のように1つの文字で表す。$w$ の実部と虚部を $t$ で表し、$t$ を消去する（ここでは2乗の差で消える）',
    '図示は「曲線のどの部分全体か」まで答える。$x=t-\\frac1t$ が増加関数なので、端の値の間をすべて1回ずつとる',
    '回転体は、軸に垂直に切った断面が **円か輪（ドーナツ形）か** を高さごとに確かめる。ここでは「円すい − くりぬく部分」'
  ];

  HB.lesson({
    id: 'kyushu26-2', field: '九大型　数学（理系）', title: '2026 九大 理系 第2問の類題 ― 双曲線の弧を虚軸のまわりに回した立体', level: '2026年度 九州大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '複素数平面上で、点 $z$ が 2 点 $1+i$，$2+2i$ を結ぶ線分上を動くとき、$w=z-\\dfrac{2}{z}$ で表される点 $w$ が描く図形を $C$ とする。',
      parts: [
        '(1)　$C$ は双曲線の一部であることを示し、$C$ を図示せよ。',
        '(2)　$C$ と、原点 O と $C$ の両端を結ぶ 2 つの線分とで囲まれた部分を $D$ とする。$D$ を虚軸のまわりに 1 回転させてできる立体の体積 $V$ を求めよ。'
      ],
      src: '※ 2026年度 九州大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '複素数平面と回転体の体積の問題です。$z$ と $\\frac2z$ を組み合わせた点がどう動くかを調べます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- (1) w を t で ----------
      { clear: true, cols: [0.52, 0.48], part: '(1)', say: '$z$ は原点を通る直線 $y=x$ の一部（青）を動きます。だから $z=t(1+i)\\ (1\\le t\\le2)$ と、1 つの実数 $t$ で表せます。',
        add: [{ t: 'h', text: '(1)　w を t で表す' },
          { t: 'm', tex: 'z=t(1+i)\\quad(1\\le t\\le2)', note: '$t$ は実数' },
          cplane('c1', ZSEG)] },
      { ask: { type: 'choice', q: '$\\dfrac{2}{z}$ を $t$ で表すと？',
        opts: ['$\\dfrac{1+i}{t}$', '$\\dfrac{1-i}{2t}$', '$\\dfrac{1-i}{t}$', '$\\dfrac{2(1-i)}{t}$'], ok: 2,
        why: { 0: '分母の $1+i$ を実数にするには、共役な $1-i$ を分母・分子にかけます。符号が逆です。', 1: 'それは $\\frac1z$。2 倍を忘れています。', 3: '分母の $(1+i)(1-i)=2$ で割るのを忘れています。' },
        good: '$\\dfrac{2}{t(1+i)}=\\dfrac{2(1-i)}{t(1+i)(1-i)}=\\dfrac{1-i}{t}$。',
        add: [{ t: 'm', size: 'sm', tex: 'w=t(1+i)-\\frac{1-i}{t}=\\Big(t-\\frac1t\\Big)+\\Big(t+\\frac1t\\Big)i' }] } },
      { say: '$w$ の実部を $x$、虚部を $y$ とおくと、$x=t-\\frac1t,\\ y=t+\\frac1t$。媒介変数表示なので、$t$ を消去して $x,\\ y$ の関係を出します。',
        add: [{ t: 'm', tex: 'x=t-\\frac1t,\\qquad y=t+\\frac1t' }] },
      { ask: { type: 'choice', q: '$t$ を消去すると、$x,\\ y$ の関係は？',
        opts: ['$x^2+y^2=4$', '$y^2-x^2=4$', '$y^2-x^2=2$', '$xy=1$'], ok: 1,
        why: { 0: '2 乗の和では $2t^2+\\frac2{t^2}$ が残ります。差をとると消えます。', 2: '$\\left(t\\pm\\frac1t\\right)^2=t^2\\pm2+\\frac1{t^2}$。差は $2-(-2)=4$ です。', 3: '$xy=t^2-\\frac1{t^2}$ で、$t$ が残ります。' },
        good: '$y^2-x^2=\\left(t+\\frac1t\\right)^2-\\left(t-\\frac1t\\right)^2=4$。$(y+x)(y-x)=2t\\cdot\\frac2t$ と見ても同じです。',
        add: [{ t: 'm', tex: 'y^2-x^2=4', note: '双曲線（漸近線 $y=\\pm x$）' }],
        draw: [{ fig: 'c1', items: [{ k: 'fn', f: HY, a: -2.1, b: 3.1, c: 'y', wd: 2.5 }] }] } },

      // ---------- (1) 動く範囲 ----------
      { clear: true, cols: [0.56, 0.44], part: '(1) 範囲', say: '$w$ が動く範囲も調べます。$x=t-\\frac1t$ は $t$ の増加関数で、$t=1$ で 0、$t=2$ で $\\frac32$。また $y=t+\\frac1t>0$ です。',
        add: [{ t: 'h', text: '(1)　w が動く範囲' },
          { t: 'm', tex: '\\frac{dx}{dt}=1+\\frac1{t^2}>0', note: '$x$ は 0 から $\\frac32$ まで増加' },
          { t: 'tbl', col: 1, size: 'sm', rows: [['$t$', '$1$', '$\\cdots$', '$2$'], ['$x$', '$0$', '$\\nearrow$', '$\\frac32$'], ['$y$', '$2$', '', '$\\frac52$']] }] },
      { ask: { type: 'choice', q: '$C$ は、双曲線 $y^2-x^2=4$ のどの部分？（どれも $y>0$ の側）',
        opts: ['$y>0$ の部分全体', '$2\\le y\\le\\dfrac52$ の部分', '$-\\dfrac32\\le x\\le\\dfrac32$ の部分', '$0\\le x\\le\\dfrac32$ の部分'], ok: 3,
        why: { 0: '$1\\le t\\le2$ なので、$x$ は 0 から $\\frac32$ までしか動きません。', 1: 'それだと $x<0$ の側の点もふくみます。$t\\ge1$ なので $x\\ge0$。', 2: '$x=t-\\frac1t$ は $t\\ge1$ で 0 以上。左半分は通りません。' },
        good: '$x$ は $0\\le x\\le\\frac32$ のすべての値を1回ずつとり、そのたびに $y=\\sqrt{x^2+4}$ が決まります。' } },
      { ask: { type: 'think', q: '逆の確かめ：双曲線上の点 $(x,\\ \\sqrt{x^2+4})$（$0\\le x\\le\\frac32$）になる $t$ を求め、$1\\le t\\le2$ であることを確かめよう。',
        hint: '$t-\\frac1t=x$ の両辺に $t$ をかけると $t$ の 2 次方程式。$t>0$ の解をとる。',
        ans: '$t^2-xt-1=0$ より $t=\\dfrac{x+\\sqrt{x^2+4}}{2}$。$x=0$ で $1$、$x=\\frac32$ で $2$、その間は増加なので $1\\le t\\le2$',
        after: '「$w$ は弧の上にある」だけでなく「弧の点をすべて通る」まで示すと、図示の答案として完全です。' } },
      { clear: true, cols: [0.44, 0.56], part: '(1) 図示', say: '$C$ は双曲線 $y^2-x^2=4$ の $0\\le x\\le\\frac32$ の部分（黄）。端は $2i$ と $\\frac32+\\frac52i$。青い線分 $z$ が、黄色の弧 $w$ にうつります。',
        add: [{ t: 'h', text: '(1)　C の図示' },
          { t: 'ans', label: '(1) 答', text: '双曲線 $y^2-x^2=4$ の\n$0\\le x\\le\\dfrac32$，$y>0$ の部分\n（両端は $2i$，$\\dfrac32+\\dfrac52i$）' },
          cplane('c2', ZSEG.concat(ARC))] },

      // ---------- (2) ----------
      { clear: true, cols: [0.5, 0.5], part: '(2)', say: 'Q $=\\frac32+\\frac52i$ とします。D は、O と $2i$ を結ぶ線分（虚軸の上）、弧 C、線分 QO で囲まれた部分（黄）。点線は D を虚軸で折り返した形です。',
        add: [{ t: 'h', text: '(2)　D を虚軸のまわりに回す' },
          { t: 'm', size: 'sm', tex: '\\text{線分 OQ}:\\ y=\\frac53x\\iff x=\\frac35y' },
          { t: 'm', size: 'sm', tex: '\\text{弧 C}:\\ x=\\sqrt{y^2-4}\\quad(2\\le y\\le\\tfrac52)' },
          rot('r1')] },
      { ask: { type: 'choice', q: '$2<y<\\dfrac52$ の高さで、立体を虚軸に垂直に切った断面は？（外・内は半径）',
        opts: ['半径 $\\frac35y$ の円', '半径 $\\sqrt{y^2-4}$ の円', '外 $\\frac35y$・内 $\\sqrt{y^2-4}$ の輪', '外 $\\sqrt{y^2-4}$・内 $\\frac35y$ の輪'], ok: 2,
        why: { 0: 'その高さでは、D は虚軸から離れています（弧より右だけ）。真ん中に穴があきます。', 1: 'D は弧と線分 OQ の「間」。弧より左（虚軸の側）は D にふくまれません。', 3: '外と内が逆です。$2<y<\\frac52$ では $\\sqrt{y^2-4}<\\frac35y$。' },
        good: '弧と線分 OQ の間を回すので、穴のあいた輪（ドーナツ形）。$0\\le y\\le2$ では半径 $\\frac35y$ の円です。',
        draw: [{ fig: 'r1', items: [
          { k: 'param', x: '1.35*cos(t)', y: '2.25+0.18*sin(t)', a: 0, b: 2 * Math.PI, c: 'p', wd: 2.5 },
          { k: 'param', x: '1.0308*cos(t)', y: '2.25+0.14*sin(t)', a: 0, b: 2 * Math.PI, c: 'p', wd: 2, dash: true },
          { k: 'seg', a: [1.0308, 2.25], b: [1.35, 2.25], c: 'p', wd: 6 }] }] } },
      { say: 'だから体積は「線分 OQ を回した円すい」から「弧の内側（虚軸の側）を回した部分」を引けば求まります。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\pi\\int_0^{\\frac52}\\Big(\\frac35y\\Big)^2dy-\\pi\\int_2^{\\frac52}(y^2-4)\\,dy' }] },
      { ask: { type: 'choice', q: '1 つ目の項（円すいの体積）は？',
        opts: ['$\\dfrac{15}{8}\\pi$', '$\\dfrac{45}{8}\\pi$', '$\\dfrac32\\pi$', '$\\dfrac{15}{4}\\pi$'], ok: 0,
        why: { 1: '円すいの体積の $\\frac13$ を忘れています。', 2: '高さを 2（弧の下の端）にしています。頂点は O、高さは $\\frac52$。', 3: '$\\left(\\frac52\\right)^3=\\frac{125}{8}$ を $\\frac{125}{4}$ にしています。' },
        good: '底面の半径 $\\frac32$、高さ $\\frac52$ の円すい：$\\frac13\\pi\\left(\\frac32\\right)^2\\cdot\\frac52=\\frac{15}8\\pi$。積分しても同じです。',
        add: [{ t: 'm', size: 'sm', tex: '\\pi\\int_0^{\\frac52}\\frac{9}{25}y^2\\,dy=\\frac{15}{8}\\pi' }] } },
      { ask: { type: 'think', q: '2 つ目の項 $\\displaystyle\\pi\\int_2^{\\frac52}(y^2-4)\\,dy$ を計算しよう。',
        hint: '$\\left[\\dfrac{y^3}{3}-4y\\right]_2^{\\frac52}$。分母を 24 にそろえる。',
        ans: '$\\left(\\dfrac{125}{24}-10\\right)-\\left(\\dfrac83-8\\right)=-\\dfrac{115}{24}+\\dfrac{128}{24}=\\dfrac{13}{24}$　なので　$\\dfrac{13}{24}\\pi$',
        add: [{ t: 'm', size: 'sm', tex: '\\pi\\int_2^{\\frac52}(y^2-4)\\,dy=\\frac{13}{24}\\pi' }] } },
      { say: '差をとって答えです。分母を 24 にそろえると、$45-13=32$ で、きれいに約分できます。',
        add: [{ t: 'ans', label: '(2) 答', tex: 'V=\\frac{15}{8}\\pi-\\frac{13}{24}\\pi=\\frac{32}{24}\\pi=\\frac43\\pi' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.54, 0.46], part: '別の見方', say: '検算に、$x$ を固定して D を縦に切り、その線分を回した「筒」を足し合わせる見方もあります（バウムクーヘン型）。',
        add: [{ t: 'h', text: '別の見方：筒を足し合わせる' },
          rot('r2', [{ k: 'seg', a: [0.8, 4 / 3], b: [0.8, Math.sqrt(4.64)], c: 'p', wd: 6 }, { k: 'label', at: [0.8, 0], text: 'x', c: 'p', size: 22, dy: 22 }, { k: 'seg', a: [0.8, 0], b: [0.8, 4 / 3], c: 'p', wd: 1.5, dash: true }])] },
      { ask: { type: 'choice', q: '$x$ を固定したとき、D の縦の長さ（筒の高さ）は？（$0\\le x\\le\\frac32$）',
        opts: ['$\\sqrt{x^2+4}$', '$\\sqrt{x^2+4}-\\dfrac53x$', '$\\dfrac53x-\\sqrt{x^2+4}$', '$\\sqrt{x^2+4}-2$'], ok: 1,
        why: { 0: 'D の下の端は実軸ではなく、線分 OQ（$y=\\frac53x$）です。', 2: '上と下が逆です。弧のほうが上にあります。', 3: '下の端は $y=2$ ではなく、線分 OQ の $y=\\frac53x$ です。' },
        good: '上は弧 $y=\\sqrt{x^2+4}$、下は線分 $y=\\frac53x$。半径 $x$ の筒の側面積 $2\\pi x\\times$（高さ）を積分します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}V&=2\\pi\\int_0^{\\frac32}x\\Big(\\sqrt{x^2+4}-\\frac53x\\Big)dx\\\\ &=2\\pi\\Big(\\frac{61}{24}-\\frac{15}{8}\\Big)=\\frac43\\pi\\end{aligned}' }] } },
      { say: '同じ $\\frac43\\pi$ になりました。ただし筒の公式は教科書の外なので、答案は本解の形（断面積の積分）で書き、こちらは検算に使うのが安全です。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・C が弧の「全体」であること（$x$ の増加と逆の対応）\n・断面が円か輪かを、$y$ の範囲で分けて書く\n・体積の式の $\\pi$ と 2 乗を忘れない' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。「1文字で表して消去」「どの部分全体か」「断面は円か輪か」の3つが、この問題の分かれ目でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
