/* 九工大型 数学：2026年度 九州工業大学 前期 第3問の類題②（自作問題・元の問題ではない）
   問題：四面体 OABC、OA=OB=2、OC=3、∠AOB=60°、∠AOC=∠BOC=90°。O から平面 ABC に下ろした垂線の足 H。
   答え（python3・sympy で検算ずみ。座標 O(0,0,0) A(0,2,0) B(√3,1,0) C(0,0,3) でも確認）：
     (1) a·b=2、b·c=0、c·a=0
     (2) OH=s a+t b+u c（s+t+u=1）、OH·AB=0, OH·AC=0 → s=t、9u=4s+2t → s=t=3/8、u=1/4
     (3) D=(3b+2c)/5、BD:DC=2:3、OH=(3/8)a+(5/8)OD → AH:HD=5:3
     (4) |OH|²=OH·a=4s+2t=9/4（OH·b=OH·c=9/4 でも一致）→ |OH|=3/2
     (5) 四面体 OABC：底面 OAB=√3、OC⊥平面 OAB より V=(1/3)(√3)(3)=√3、
         V=(1/3)·△ABC·OH から △ABC=3V/OH=2√3（AB=2、AC=BC=√13、高さ 2√3 の直接計算とも一致）
     別の見方：s=t から H は AB の中点 M と C を結ぶ線分上、CH:HM=3:1（OH=(3/4)OM+(1/4)OC） */
(function () {
  const S3 = Math.sqrt(3);
  // 見取図：X が手前（左下）、Y が右、Z が上
  const V3 = { O: [0, 0, 0], A: [0, 2, 0], B: [S3, 1, 0], C: [0, 0, 3] };
  V3.H = [3 * S3 / 8, 9 / 8, 3 / 4]; V3.D = [3 * S3 / 5, 3 / 5, 6 / 5];
  const pj = v => [v[1] - 0.6 * v[0], 0.8 * v[2] - 0.4 * v[0]];
  const P = {}; Object.keys(V3).forEach(k => { P[k] = pj(V3[k]); });
  const tet = (id, o, size) => {
    o = o || {};
    const W = size || 350, view = [-0.5, -1.0, 2.6, 2.8];
    const it = [
      { k: 'poly', pts: [P.A, P.B, P.C], close: false, fill: 'g', alpha: 0.12, noStroke: true },
      { k: 'seg', a: P.O, b: P.A, c: 'w', wd: 3 }, { k: 'seg', a: P.O, b: P.B, c: 'w', wd: 3 }, { k: 'seg', a: P.O, b: P.C, c: 'w', wd: 3 },
      { k: 'seg', a: P.A, b: P.B, c: 'w', wd: 3 }, { k: 'seg', a: P.B, b: P.C, c: 'w', wd: 3 }, { k: 'seg', a: P.A, b: P.C, c: 'w', wd: 3 }
    ];
    if (o.D) it.push({ k: 'seg', a: P.A, b: P.D, c: 'y', wd: 2.5, dash: true }, { k: 'pt', at: P.D, name: 'D', dir: 'e', c: 'y', size: 22 });
    if (o.H) it.push({ k: 'seg', a: P.O, b: P.H, c: 'p', wd: 3, dash: true }, { k: 'pt', at: P.H, name: 'H', dir: 'e', c: 'p', size: 22 });
    it.push({ k: 'pt', at: P.O, name: 'O', dir: 'nw', size: 22 }, { k: 'pt', at: P.A, name: 'A', dir: 'e', size: 22 },
      { k: 'pt', at: P.B, name: 'B', dir: 'sw', size: 22 }, { k: 'pt', at: P.C, name: 'C', dir: 'n', size: 22 });
    return { t: 'fig', id, col: 1, view, w: W, h: Math.round(W * (view[3] - view[1]) / (view[2] - view[0])), items: it.concat(o.extra || []) };
  };
  // 面 ABC を平面にして見た図（M：AB の中点が原点、AB が横軸）
  const Q = { A: [-1, 0], B: [1, 0], C: [0, 2 * S3], M: [0, 0], H: [0, S3 / 2], D: [3 / 5, 4 * S3 / 5] };
  const plane = (id, o, size) => {
    o = o || {};
    const W = size || 340, view = [-1.6, -0.55, 1.6, 3.8];
    const it = [
      { k: 'poly', pts: [Q.A, Q.B, Q.C], close: true, c: 'w', wd: 3, fill: 'g', alpha: 0.1 },
      { k: 'pt', at: Q.A, name: 'A', dir: 'w', size: 22 }, { k: 'pt', at: Q.B, name: 'B', dir: 'e', size: 22 }, { k: 'pt', at: Q.C, name: 'C', dir: 'n', size: 22 }];
    if (o.D) it.push({ k: 'seg', a: Q.A, b: Q.D, c: 'y', wd: 2.5, dash: true }, { k: 'pt', at: Q.D, name: 'D', dir: 'ne', c: 'y', size: 22 });
    if (o.M) it.push({ k: 'seg', a: Q.C, b: Q.M, c: 'b', wd: 2.5, dash: true }, { k: 'pt', at: Q.M, name: 'M', dir: 's', c: 'b', size: 22 },
      { k: 'right', o: Q.M, a: Q.B, b: Q.C, s: 14 });
    it.push({ k: 'pt', at: Q.H, name: 'H', dir: 'e', c: 'p', size: 22 });
    return { t: 'fig', id, col: 1, view, w: W, h: Math.round(W * (view[3] - view[1]) / (view[2] - view[0])), items: it.concat(o.extra || []) };
  };
  const POINTS = [
    '角と長さが与えられたら、まず内積を全部出す（$\\vec a\\cdot\\vec b=|\\vec a||\\vec b|\\cos\\theta$）。直角なら内積は 0',
    '垂線の足 H は「平面上（係数の和 1）」と「$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{AC}}$（内積 0）」の 3 本の式で係数が決まる。交点の比は、係数を「2 つずつ組にして内分の形」に直して読む',
    '$\\mathrm{OH}\\perp\\mathrm{HA}$ から $|\\overrightarrow{\\mathrm{OH}}|^2=\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{OA}}$。体積は 2 通り（$\\dfrac13\\times$底面積$\\times$高さ）で表して、求めたい面積を出す'
  ];

  HB.lesson({
    id: 'kyutech26-3b', field: '九工大型　数学', title: '2026 九工大 第3問の類題② ― 辺の長さと角が決まった四面体と垂線の足', level: '2026年度 九州工業大学 前期 第3問の類題②（自作）', time: '目安 20〜25分',
    noDec: true,
    problem: {
      label: '類題②',
      lead: '四面体 OABC において、$\\mathrm{OA}=\\mathrm{OB}=2$，$\\mathrm{OC}=3$，$\\angle\\mathrm{AOB}=60^\\circ$，$\\angle\\mathrm{AOC}=\\angle\\mathrm{BOC}=90^\\circ$ とする。O から平面 ABC に下ろした垂線と平面 ABC の交点を H とする。$\\vec a=\\overrightarrow{\\mathrm{OA}}$，$\\vec b=\\overrightarrow{\\mathrm{OB}}$，$\\vec c=\\overrightarrow{\\mathrm{OC}}$ とする。',
      parts: [
        '(1)　内積 $\\vec a\\cdot\\vec b$，$\\vec b\\cdot\\vec c$，$\\vec c\\cdot\\vec a$ を求めよ。',
        '(2)　$\\overrightarrow{\\mathrm{OH}}=s\\vec a+t\\vec b+u\\vec c$ とおくとき、実数 $s,\\ t,\\ u$ を求めよ。',
        '(3)　直線 AH と辺 BC の交点を D とする。BD : DC と AH : HD を求めよ。',
        '(4)　$|\\overrightarrow{\\mathrm{OH}}|$ を求めよ。',
        '(5)　四面体 OABC の体積と、△ABC の面積を求めよ。'
      ],
      src: '※ 2026年度 九州工業大学 前期 第3問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの問題です。辺の長さと角が決まった四面体で、頂点 O から底面に下ろした垂線の足 H をベクトルで調べます。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '長さと角を、ベクトルの内積に読みかえます。「垂直」は内積 0。H が平面 ABC 上にあることは、係数の和が 1 であることを表します。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'box', c: 'y', size: 'sm', label: '長さと角', text: '$|\\vec a|=|\\vec b|=2$，$|\\vec c|=3$\n$\\angle\\mathrm{AOB}=60^\\circ$，$\\angle\\mathrm{AOC}=\\angle\\mathrm{BOC}=90^\\circ$' },
          { t: 'box', c: 'p', size: 'sm', label: '垂線の足 H', text: 'H は平面 ABC 上の点で、OH は平面 ABC に垂直' },
          { t: 'p', size: 'sm', text: '(1) は準備、(2)〜(4) は H の位置と長さ、(5) は体積と面積' },
          tet('f0', { H: true })] },
      { ask: { type: 'choice', q: '「OH が平面 ABC に垂直」を、ベクトルの式で言いかえると？',
        opts: ['$\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}$', '$\\overrightarrow{\\mathrm{OH}}\\parallel\\overrightarrow{\\mathrm{BC}}$', '$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AB}}$ かつ $\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{AC}}$', '$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{OA}}$'], ok: 2,
        why: { 0: 'H は A とは限りません。A なら OA が平面 ABC に垂直になってしまいます。', 1: '平行ではなく、垂直です。', 3: 'OA は平面 ABC 上のベクトルではありません。平面上の 2 本は AB と AC です。' },
        good: '平面上の平行でない 2 本（AB と AC）に垂直なら、平面全体に垂直です。内積が 0 になる式が 2 本できます。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0,\\qquad\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0' }] } },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。内積は $\\vec a\\cdot\\vec b=|\\vec a||\\vec b|\\cos\\theta$。角が $90^\\circ$ なら $\\cos90^\\circ=0$ で、内積は 0 です。',
        add: [{ t: 'h', text: '(1)　内積を出す' },
          { t: 'm', tex: '\\vec a\\cdot\\vec b=|\\vec a||\\vec b|\\cos60^\\circ' },
          tet('f1')] },
      { ask: { type: 'choice', q: '$\\vec a\\cdot\\vec b$ は？',
        opts: ['$4$', '$2\\sqrt3$', '$1$', '$2$'], ok: 3,
        why: { 0: '$\\cos60^\\circ=\\dfrac12$ をかけるのを忘れています。', 1: '$\\sin60^\\circ=\\dfrac{\\sqrt3}{2}$ を使っています。内積は $\\cos$ です。', 2: '$\\cos60^\\circ=\\dfrac12$ を 2 回かけています。かけるのは 1 回だけ。' },
        good: '$2\\times2\\times\\dfrac12=2$。$\\angle\\mathrm{AOC}=\\angle\\mathrm{BOC}=90^\\circ$ なので、残りの 2 つは 0 です。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\vec a\\cdot\\vec b=2,\\qquad\\vec b\\cdot\\vec c=0,\\qquad\\vec c\\cdot\\vec a=0' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。$\\vec h=\\overrightarrow{\\mathrm{OH}}=s\\vec a+t\\vec b+u\\vec c$ とおくと、H が平面 ABC 上なので $s+t+u=1$。さらに $\\vec h$ との内積を、$s,t,u$ で書き下します。',
        add: [{ t: 'h', text: '(2)　OH = s a + t b + u c' },
          { t: 'box', c: 'b', size: 'sm', label: '内積の表（(1) から）', text: '$|\\vec a|^2=4,\\ |\\vec b|^2=4,\\ |\\vec c|^2=9$\n$\\vec a\\cdot\\vec b=2,\\ \\vec b\\cdot\\vec c=\\vec c\\cdot\\vec a=0$' },
          { t: 'm', size: 'sm', tex: '\\vec h\\cdot\\vec a=4s+2t,\\quad\\vec h\\cdot\\vec b=2s+4t,\\quad\\vec h\\cdot\\vec c=9u' },
          { t: 'm', size: 'sm', tex: 's+t+u=1' }] },
      { ask: { type: 'choice', q: '$\\vec h\\cdot(\\vec b-\\vec a)=0$、つまり $\\vec h\\cdot\\vec b=\\vec h\\cdot\\vec a$ から言えることは？',
        opts: ['$s=t$', '$s=2t$', '$t=2s$', '$s+t=0$'], ok: 0,
        why: { 1: '$2s+4t=4s+2t$ を整理すると $2t=2s$。係数を取りちがえています。', 2: '$2s+4t=4s+2t$ を整理すると $2t=2s$。係数を取りちがえています。', 3: '差が 0 なので、移項すると $t-s=0$。和が 0 ではありません。' },
        good: '$2s+4t=4s+2t$ から $2t=2s$。OA と OB が同じ長さなので、$s=t$ は自然な結果です。',
        add: [] } },
      { say: 'もう 1 本、$\\vec h\\cdot(\\vec c-\\vec a)=0$ から $9u=4s+2t$。$s=t$ を入れると $9u=6s$、つまり $u=\\dfrac23s$。これを $s+t+u=1$ に入れます。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}s&=t\\ \\text{なので}\\\\ 9u&=4s+2t=6s\\ \\Rightarrow\\ u=\\frac23s\\\\ s+s+\\frac23s&=\\frac83s=1\\ \\Rightarrow\\ s=\\frac38\\end{aligned}' },
          { t: 'ans', label: '(2) 答', tex: 's=t=\\frac38,\\qquad u=\\frac14' }] },
      { ask: { type: 'think', q: '$\\vec h\\cdot\\vec a$ と $\\vec h\\cdot\\vec c$ に $s,\\ t,\\ u$ の値を入れて、答えが合っているか確かめよう。',
        hint: '$\\vec h\\cdot\\vec a=4s+2t$、$\\vec h\\cdot\\vec c=9u$。垂線なら 3 つの内積は等しいはず。',
        ans: '$\\vec h\\cdot\\vec a=\\dfrac32+\\dfrac34=\\dfrac94$、$\\vec h\\cdot\\vec c=9\\cdot\\dfrac14=\\dfrac94$。$\\vec h\\cdot\\vec b$ も $\\dfrac94$',
        after: '3 つの内積がすべて $\\dfrac94$。この値は (4) で $|\\overrightarrow{\\mathrm{OH}}|^2$ になります。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。D は直線 AH 上で、同時に辺 BC 上の点。$\\vec b$ と $\\vec c$ の項を 1 つにまとめて、「A と BC 上の点の内分」の形に直します。',
        add: [{ t: 'h', text: '(3)　直線 AH と辺 BC の交点 D' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac38\\vec a+\\frac58\\cdot\\frac{3\\vec b+2\\vec c}{5}' },
          { t: 'p', size: 'sm', text: '$\\dfrac{3\\vec b+2\\vec c}{5}$ は係数の和が 1 なので、直線 BC 上の点 $=$ D' },
          tet('f3', { H: true, D: true })] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{OD}}=\\dfrac{3\\vec b+2\\vec c}{5}$ のとき、BD : DC は？',
        opts: ['$3:2$', '$2:3$', '$1:1$', '$5:3$'], ok: 1,
        why: { 0: 'よくあるまちがい。$\\dfrac{m\\vec b+n\\vec c}{m+n}$ は BC を $n:m$ に内分します。係数は「反対側」の比です。', 2: '係数が $3$ と $2$ で等しくないので、中点ではありません。', 3: '$5$ は全体、$3$ は $\\vec a$ の係数 $\\frac38$ の分子です。BC の比には関係しません。' },
        good: '$\\vec b$ の係数が大きい（3）ほど、D は B に近い。だから BD : DC $=2:3$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac38\\overrightarrow{\\mathrm{OA}}+\\frac58\\overrightarrow{\\mathrm{OD}}', note: 'H は AD を\n$5:3$ に内分' }] } },
      { say: '$\\overrightarrow{\\mathrm{OH}}=\\dfrac38\\overrightarrow{\\mathrm{OA}}+\\dfrac58\\overrightarrow{\\mathrm{OD}}$ は、H が AD を（D の係数）：（A の係数）$=5:3$ に内分する点、という意味です。',
        add: [{ t: 'ans', label: '(3) 答', text: 'BD : DC $=2:3$，　AH : HD $=5:3$' }] },

      // ---------- (4) ----------
      { clear: true, cols: [0.6, 0.4], part: '(4)', say: '(4) です。$\\overrightarrow{\\mathrm{OH}}\\perp\\overrightarrow{\\mathrm{HA}}$ なので、直角三角形 OHA を使います。$|\\overrightarrow{\\mathrm{OH}}|^2$ を内積で表せないか考えます。',
        add: [{ t: 'h', text: '(4)　|OH| を求める' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}\\cdot\\overrightarrow{\\mathrm{HA}}=\\vec h\\cdot(\\vec a-\\vec h)=0' },
          { t: 'm', size: 'sm', tex: '|\\vec h|^2=\\vec h\\cdot\\vec a', note: '$\\vec h\\cdot\\vec a$ は\n(2) で計算ずみ' },
          tet('f4', { H: true, extra: [{ k: 'seg', a: P.H, b: P.A, c: 'g', wd: 2.5, dash: true }] })] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{OH}}|^2=\\vec h\\cdot\\vec a=4s+2t$ に $s=t=\\dfrac38$ を入れると？',
        opts: ['$\\dfrac92$', '$\\dfrac32$', '$\\dfrac34$', '$\\dfrac94$'], ok: 3,
        why: { 0: '$4s+2t=6\\cdot\\dfrac38$。$\\dfrac98\\cdot4$ にはなりません。', 1: '$4s=\\dfrac32$ だけです。$2t=\\dfrac34$ も加えます。', 2: '$2t=\\dfrac34$ だけです。$4s=\\dfrac32$ も加えます。' },
        good: '$4\\cdot\\dfrac38+2\\cdot\\dfrac38=\\dfrac32+\\dfrac34=\\dfrac94$。(2) の確かめで出た共通の値です。',
        add: [{ t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OH}}|^2=\\frac94' }] } },
      { say: '長さは正なので、$|\\overrightarrow{\\mathrm{OH}}|=\\dfrac32$ です。$\\mathrm{OA}=2$ より短く、直角三角形 OHA で斜辺 OA が最長、という大小関係とも合っています。',
        add: [{ t: 'ans', label: '(4) 答', tex: '|\\overrightarrow{\\mathrm{OH}}|=\\frac32' }] },

      // ---------- (5) ----------
      { clear: true, cols: [0.6, 0.4], part: '(5)', say: '(5) です。(1) の $\\vec c\\cdot\\vec a=\\vec c\\cdot\\vec b=0$ から、OC は平面 OAB に垂直。だから、△OAB を底面、OC を高さと見て、体積が出ます。',
        add: [{ t: 'h', text: '(5)　体積 V と面積 △ABC' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{OAB}=\\frac12\\cdot2\\cdot2\\sin60^\\circ=\\sqrt3' },
          { t: 'm', size: 'sm', tex: 'V=\\frac13\\cdot\\triangle\\mathrm{OAB}\\cdot\\mathrm{OC}=\\frac13\\cdot\\sqrt3\\cdot3=\\sqrt3' },
          tet('f5', { extra: [{ k: 'seg', a: P.O, b: P.C, c: 'y', wd: 4 }] })] },
      { say: '同じ体積を、△ABC を底面・OH を高さと見ても表せます。$V=\\dfrac13\\cdot\\triangle\\mathrm{ABC}\\cdot\\mathrm{OH}$ の式から、面積を求めましょう。',
        add: [{ t: 'm', size: 'sm', tex: '\\sqrt3=\\frac13\\cdot\\triangle\\mathrm{ABC}\\cdot\\frac32=\\frac12\\triangle\\mathrm{ABC}' }] },
      { ask: { type: 'choice', q: '△ABC の面積は？',
        opts: ['$\\sqrt3$', '$4\\sqrt3$', '$2\\sqrt3$', '$3\\sqrt3$'], ok: 2,
        why: { 0: '$\\sqrt3=\\dfrac12\\triangle\\mathrm{ABC}$ の $\\dfrac12$ を戻していません。両辺を 2 倍します。', 1: '$\\dfrac13\\cdot\\dfrac32=\\dfrac12$。2 倍にしかなりません。', 3: '$\\dfrac13\\cdot\\dfrac32=\\dfrac12$ なので、両辺を 2 倍します。3 倍ではありません。' },
        good: '$\\triangle\\mathrm{ABC}=3V\\div\\mathrm{OH}=3\\sqrt3\\div\\dfrac32=2\\sqrt3$。面積を直接計算しなくても、体積から逆算できました。',
        add: [{ t: 'ans', label: '(5) 答', text: '$V=\\sqrt3$，　$\\triangle\\mathrm{ABC}=2\\sqrt3$' }] } },

      // ---------- 別の見方 ----------
      { clear: true, cols: [0.55, 0.45], part: '別の見方', say: '面 ABC を真上から見てみます。$\\mathrm{AB}=2$、$\\mathrm{CA}=\\mathrm{CB}=\\sqrt{13}$ の二等辺三角形です。AB の中点を M とすると、CM は高さです。',
        add: [{ t: 'h', text: '別の見方：面 ABC を平面で見る' },
          { t: 'p', size: 'sm', text: '$\\mathrm{AC}^2=|\\vec c-\\vec a|^2=9+4=13$\n$\\mathrm{CM}^2=13-1=12$ より $\\mathrm{CM}=2\\sqrt3$' },
          { t: 'm', size: 'sm', tex: '\\triangle\\mathrm{ABC}=\\frac12\\cdot2\\cdot2\\sqrt3=2\\sqrt3', note: '(5) と一致' },
          plane('b1', { M: true })] },
      { ask: { type: 'think', q: '(2) の $s=t$ から、H は中線 CM 上にあることを説明し、CH : HM を求めよう。',
        hint: '$\\overrightarrow{\\mathrm{OM}}=\\dfrac{\\vec a+\\vec b}{2}$。$\\overrightarrow{\\mathrm{OH}}$ を $\\overrightarrow{\\mathrm{OM}}$ と $\\vec c$ で書く。',
        ans: '$\\overrightarrow{\\mathrm{OH}}=\\dfrac38(\\vec a+\\vec b)+\\dfrac14\\vec c=\\dfrac34\\overrightarrow{\\mathrm{OM}}+\\dfrac14\\overrightarrow{\\mathrm{OC}}$。係数の和が 1 なので H は CM 上で、CH : HM $=3:1$',
        after: '図の H は、たしかに CM を C 側から $3:1$ に分ける点です。$s=t$ は、OA=OB で二等辺三角形 CAB が左右対称だから、とも説明できます。',
        draw: [{ fig: 'b1', items: [{ k: 'label', at: [0, 1.7], text: '3 : 1', dx: 26, c: 'p', size: 20, plain: true, anchor: 'start' }] }] } },
      { say: '答案では、「垂直 → 内積 0」を条件ごとに 1 行ずつ書き、内積の表を先に作っておくと、計算の見通しがよくなります。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(2) は「$s+t+u=1$」と「内積 0 の 2 本」の 3 本の式を書く\n・(3) は係数の和が 1 であることを言ってから比を読む\n・(5) は OC が平面 OAB に垂直な理由（$\\vec c\\cdot\\vec a=\\vec c\\cdot\\vec b=0$）を書く' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。内積の表を作り、垂線の足は 3 本の式で係数を決める。体積は 2 通りに表すと、面積が逆算できました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
