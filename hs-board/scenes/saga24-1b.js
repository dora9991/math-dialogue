/* 2024 佐賀大 理系 第1問の類題②（自作）：2本の線分が垂直という条件から内積を出し、2直線の交点・垂線の足までの長さを求める
   △OAB：OA=2√5, OB=√10。P は OA を 2:1 に内分、Q は AB の中点。OQ ⊥ BP。
   答え（python3・sympy で検算ずみ。座標 O(0,0) A(4,2) B(3,−1) でも確認）：
   (1) a・b=10（∠AOB=45°）　(2) OR=2/5(a+b)、|OR|=2√2（R=(14/5, 2/5)）
   (3) OH=4/5 a−1/5 b、AH=√2（H=(13/5, 9/5)。AH//OQ、AH=−1/5(a+b)） */
(function () {
  const O = [0, 0], A = [4, 2], B = [3, -1], P = [8 / 3, 4 / 3], Q = [3.5, 0.5], R = [2.8, 0.4], H = [2.6, 1.8];
  const VIEW = [-0.6, -1.7, 4.9, 2.9];
  const fig = (id, items, h) => ({ t: 'fig', id, col: 1, view: VIEW, w: Math.round((h || 330) * 5.5 / 4.6), h: h || 330, items });   // 縦横比は VIEW にそろえる
  const tri = [
    { k: 'poly', pts: [O, A, B], close: true },
    { k: 'pt', at: O, name: 'O', dir: 'w' }, { k: 'pt', at: A, name: 'A', dir: 'n' }, { k: 'pt', at: B, name: 'B', dir: 's' }
  ];
  const lens = [
    { k: 'label', at: [1.2, 0.6], text: '2√5', dx: -30, dy: -14, c: 'b', size: 21 },
    { k: 'label', at: [1.5, -0.5], text: '√10', dx: -30, dy: 16, c: 'b', size: 21 }
  ];
  const PQ = [
    { k: 'seg', a: O, b: Q, c: 'g' }, { k: 'seg', a: B, b: P, c: 'y' },
    { k: 'pt', at: P, name: 'P', dir: 'w', c: 'y' }, { k: 'pt', at: Q, name: 'Q', dir: 'e', c: 'g' }
  ];
  const ratio = [
    { k: 'label', at: [1.33, 0.67], text: '2', dx: -8, dy: -16, c: 'y', size: 20 },
    { k: 'label', at: [3.33, 1.67], text: '1', dx: 14, dy: 14, c: 'y', size: 20 }
  ];
  const RR = [{ k: 'right', o: R, a: Q, b: B, c: 'w' }, { k: 'pt', at: R, name: 'R', dir: 'sw', c: 'p' }];
  const HH = [{ k: 'seg', a: P, b: H, c: 'y', dash: true }, { k: 'seg', a: A, b: H, c: 'p' }, { k: 'right', o: H, a: A, b: B, c: 'p' }, { k: 'pt', at: H, name: 'H', dir: 'nw', c: 'p' }];
  const POINTS = [
    '垂直は **内積 $=0$**。位置ベクトルで表した2本のベクトルを展開し、$|\\vec a|^2,\\ |\\vec b|^2$ を代入して $\\vec a\\cdot\\vec b$ の1次方程式にする',
    '2直線の交点は、**同じ点を2通りに表して** $\\vec a,\\ \\vec b$ の係数を比べる（$\\vec a,\\ \\vec b$ は平行でないので、係数が等しくなる）',
    '同じ直線に垂直な2本は **平行**。$\\overrightarrow{\\mathrm{AH}}=k\\,\\overrightarrow{\\mathrm{OQ}}$ とおけば、垂線の足も内積なしで求まる。長さは2乗して内積'
  ];

  HB.lesson({
    id: 'saga24-1b', field: '佐賀大型　数学（理系）', title: '2024 佐賀大 理系 第1問の類題② ― 垂直な2直線の交点と、垂線の足までの長さ', level: '2024年度 佐賀大学 理系 第1問の類題②（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題②',
      lead: '$\\triangle\\mathrm{OAB}$ において $\\mathrm{OA}=2\\sqrt5,\\ \\mathrm{OB}=\\sqrt{10}$ である。辺 OA を $2:1$ に内分する点を P、辺 AB の中点を Q とすると、$\\mathrm{OQ}\\perp\\mathrm{BP}$ であった。$\\overrightarrow{\\mathrm{OA}}=\\vec a,\\ \\overrightarrow{\\mathrm{OB}}=\\vec b$ とする。',
      parts: [
        '(1)　内積 $\\vec a\\cdot\\vec b$ を求めよ。',
        '(2)　直線 OQ と直線 BP の交点を R とする。$\\overrightarrow{\\mathrm{OR}}$ を $\\vec a,\\ \\vec b$ を用いて表し、$|\\overrightarrow{\\mathrm{OR}}|$ を求めよ。',
        '(3)　A から直線 BP に下ろした垂線の足を H とする。$\\overrightarrow{\\mathrm{OH}}$ を $\\vec a,\\ \\vec b$ を用いて表し、線分 AH の長さを求めよ。'
      ],
      src: '※ 2024年度 佐賀大学 前期 理工学部 数学 第1問と同じ分野・ねらいの自作問題（類題②。元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '平面ベクトルの基本がつまった問題です。「垂直」から内積を出し、2本の直線の交点と、垂線の足までの長さを求めます。まず問題文を読みましょう。（Q キーで、いつでも見られます）',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '図をかきます。わかっているのは2辺の長さと「OQ ⊥ BP」。足りないのは $\\vec a\\cdot\\vec b$ です。垂直の条件は、内積が 0 という式に直せます。',
        add: [{ t: 'h', text: '読みかえ' },
          { t: 'box', c: 'b', size: 'sm', label: '方針', text: '垂直 ⇔ 内積 $=0$\n長さ ⇔ 2乗して内積で計算\n→ まず $\\vec a\\cdot\\vec b$ を出せば、あとは計算できる' },
          { t: 'm', size: 'sm', tex: '|\\vec a|^2=20,\\qquad |\\vec b|^2=10' },
          fig('g1', tri.concat(lens, PQ, ratio))] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。P は OA を $2:1$ に内分するので $\\overrightarrow{\\mathrm{OP}}=\\frac23\\vec a$、Q は AB の中点なので $\\overrightarrow{\\mathrm{OQ}}=\\frac12(\\vec a+\\vec b)$ です。',
        add: [{ t: 'h', text: '(1)　内積 a・b' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OP}}=\\frac23\\vec a,\\qquad \\overrightarrow{\\mathrm{OQ}}=\\frac12(\\vec a+\\vec b)' },
          fig('g2', tri.concat(PQ, ratio), 320)] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{BP}}$ を $\\vec a,\\ \\vec b$ で表すと？',
        opts: ['$\\vec b-\\dfrac23\\vec a$', '$\\dfrac13\\vec a-\\vec b$', '$\\dfrac23\\vec a-\\vec b$', '$\\dfrac23\\vec a+\\vec b$'], ok: 2,
        why: { 0: '終点 − 始点です。$\\overrightarrow{\\mathrm{BP}}=\\overrightarrow{\\mathrm{OP}}-\\overrightarrow{\\mathrm{OB}}$ で、これは $\\overrightarrow{\\mathrm{PB}}$ の向きです。', 1: 'OP : PA $=2:1$ なので OP は OA の $\\frac23$。$\\frac13$ は PA のほうです。', 3: '$\\overrightarrow{\\mathrm{OB}}$ は引きます。$\\vec b$ をたすと B から遠ざかります。' },
        good: '終点 − 始点で $\\overrightarrow{\\mathrm{BP}}=\\overrightarrow{\\mathrm{OP}}-\\vec b=\\frac23\\vec a-\\vec b$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{BP}}=\\frac23\\vec a-\\vec b' }] } },
      { say: 'OQ ⊥ BP なので、内積が 0。展開すると $\\vec a\\cdot\\vec b$ の項が2つ出ます。$|\\vec a|^2=20,\\ |\\vec b|^2=10$ を入れて整理します。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{aligned}\\overrightarrow{\\mathrm{OQ}}\\cdot\\overrightarrow{\\mathrm{BP}}&=\\frac12\\left(\\frac23|\\vec a|^2-\\hy{\\vec a\\cdot\\vec b}+\\frac23\\hy{\\vec a\\cdot\\vec b}-|\\vec b|^2\\right)\\\\ &=\\frac12\\left(\\frac{40}{3}-\\frac13\\vec a\\cdot\\vec b-10\\right)=0\\end{aligned}' }] },
      { ask: { type: 'choice', q: '$\\vec a\\cdot\\vec b$ はいくつ？',
        opts: ['$-10$', '$\\dfrac{10}{3}$', '$30$', '$10$'], ok: 3,
        why: { 0: '$-\\vec a\\cdot\\vec b+\\frac23\\vec a\\cdot\\vec b=-\\frac13\\vec a\\cdot\\vec b$ を移項するとき、符号が逆になっています。', 1: '$\\frac13\\vec a\\cdot\\vec b=\\frac{10}{3}$ の右辺です。左辺の $\\frac13$ をはずす（3 倍する）のを忘れています。', 2: '$\\frac13\\vec a\\cdot\\vec b=\\frac{10}{3}$ の両辺を 3 倍したあと、もう一度 3 倍しています。' },
        good: '$\\frac13\\vec a\\cdot\\vec b=\\frac{10}{3}$ より $10$。$\\cos\\angle\\mathrm{AOB}=\\dfrac{10}{2\\sqrt5\\cdot\\sqrt{10}}=\\dfrac{1}{\\sqrt2}$ で、$\\angle\\mathrm{AOB}=45^\\circ$ です。',
        add: [{ t: 'ans', label: '(1) 答', tex: '\\vec a\\cdot\\vec b=10' }] } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。R は直線 OQ 上にあるので $\\overrightarrow{\\mathrm{OR}}=s(\\vec a+\\vec b)$、直線 BP 上にもあるので $\\overrightarrow{\\mathrm{OR}}=(1-u)\\vec b+u\\,\\overrightarrow{\\mathrm{OP}}$ とおけます。',
        add: [{ t: 'h', text: '(2)　2直線の交点 R' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OR}}=s(\\vec a+\\vec b)', note: 'R は直線 OQ 上' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OR}}=(1-u)\\vec b+\\frac{2u}{3}\\vec a', note: 'R は直線 BP 上' },
          fig('g3', tri.concat(PQ, RR), 330)] },
      { say: '同じ $\\overrightarrow{\\mathrm{OR}}$ を2通りに表しました。$\\vec a,\\ \\vec b$ は平行でないので、$\\vec a$ の係数どうし、$\\vec b$ の係数どうしが等しくなります。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{cases} s=\\dfrac{2u}{3}\\\\[4pt] s=1-u \\end{cases}', note: '係数を比べる' }] },
      { ask: { type: 'choice', q: '$u$ の値は？',
        opts: ['$\\dfrac35$', '$\\dfrac25$', '$\\dfrac53$', '$\\dfrac12$'], ok: 0,
        why: { 1: '$\\frac25$ は $s$ のほうです。$\\frac{2u}{3}=1-u$ を解くと $u=\\frac35$ になります。', 2: '$\\frac{2u}{3}=1-u$ を $\\frac{5u}{3}=1$ と整理して、逆数にしています。$u=\\frac35$。', 3: 'R が BP の中点とは限りません。方程式 $\\frac{2u}{3}=1-u$ を解きます。' },
        good: '$\\frac{2u}{3}=1-u$ より $\\frac{5u}{3}=1$、$u=\\frac35$。$0<u<1$ なので、R は線分 BP 上です。そして $s=\\frac25$。',
        add: [{ t: 'm', tex: 'u=\\frac35,\\quad s=\\frac25\\qquad \\overrightarrow{\\mathrm{OR}}=\\frac25(\\vec a+\\vec b)' }] } },
      { clear: true, say: '長さは2乗して内積で。$|\\vec a+\\vec b|^2=|\\vec a|^2+2\\vec a\\cdot\\vec b+|\\vec b|^2=20+20+10=50$ です。',
        add: [{ t: 'h', text: '(2)　つづき：OR の長さ' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{OR}}=\\frac25(\\vec a+\\vec b)' },
          { t: 'm', size: 'sm', tex: '|\\vec a+\\vec b|^2=20+2\\cdot10+10=50' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OR}}|^2=\\frac{4}{25}\\cdot50=8' },
          fig('g3b', tri.concat(PQ, RR), 300)] },
      { ask: { type: 'choice', q: '$|\\overrightarrow{\\mathrm{OR}}|$ は？',
        opts: ['$8$', '$2\\sqrt2$', '$\\dfrac{2\\sqrt2}{5}$', '$5\\sqrt2$'], ok: 1,
        why: { 0: 'それは $|\\overrightarrow{\\mathrm{OR}}|^2$。最後に $\\sqrt{\\ }$ をとります。', 2: '$\\frac{4}{25}$ をそのまま外に出していません。$\\sqrt{8}=2\\sqrt2$ です。', 3: '$\\sqrt{50}=5\\sqrt2$ は $|\\vec a+\\vec b|$。$\\frac25$ 倍するのを忘れています。' },
        good: '$|\\overrightarrow{\\mathrm{OR}}|=\\sqrt8=2\\sqrt2$。',
        add: [{ t: 'ans', label: '(2) 答', tex: '\\overrightarrow{\\mathrm{OR}}=\\frac25(\\vec a+\\vec b),\\quad |\\overrightarrow{\\mathrm{OR}}|=2\\sqrt2' }] } },
      { ask: { type: 'think', q: '別の方法で検算：OQ ⊥ BP なので、R は B から直線 OQ に下ろした垂線の足。$\\overrightarrow{\\mathrm{OR}}=\\dfrac{\\vec b\\cdot(\\vec a+\\vec b)}{|\\vec a+\\vec b|^2}(\\vec a+\\vec b)$ を計算しよう。',
        hint: '$\\vec b\\cdot(\\vec a+\\vec b)=\\vec a\\cdot\\vec b+|\\vec b|^2$。$|\\vec a+\\vec b|^2$ は $50$。',
        ans: '$\\vec b\\cdot(\\vec a+\\vec b)=10+10=20$ より　$\\overrightarrow{\\mathrm{OR}}=\\dfrac{20}{50}(\\vec a+\\vec b)=\\dfrac25(\\vec a+\\vec b)$',
        after: '同じ結果になりました。垂直とわかっているときは、「垂線の足 ＝ 正射影」でも出せます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。A から BP に下ろした垂線 AH（桃）と、OQ（緑）は、どちらも BP に垂直です。同じ直線に垂直な2本は、平行です。',
        add: [{ t: 'h', text: '(3)　垂線の足 H' },
          { t: 'box', c: 'g', size: 'sm', label: '見ぬく', text: 'AH ⊥ BP かつ OQ ⊥ BP\n→ AH // OQ' },
          fig('g4', tri.concat(PQ, HH), 330)] },
      { ask: { type: 'choice', q: 'AH // OQ から、$\\overrightarrow{\\mathrm{AH}}$ はどう書ける？',
        opts: ['$\\overrightarrow{\\mathrm{AH}}=k\\,\\overrightarrow{\\mathrm{BP}}$', '$\\overrightarrow{\\mathrm{AH}}\\cdot\\overrightarrow{\\mathrm{OQ}}=0$', '$\\overrightarrow{\\mathrm{AH}}=k(\\vec a+\\vec b)$', '$\\overrightarrow{\\mathrm{AH}}=k\\,\\vec a$'], ok: 2,
        why: { 0: 'AH は BP に垂直です。平行なのは OQ のほうです。', 1: 'AH と OQ は垂直ではなく平行です。', 3: 'AH は OA の向きではありません。OQ の向きは $\\vec a+\\vec b$ です。' },
        good: 'OQ の向きは $\\vec a+\\vec b$。$\\overrightarrow{\\mathrm{AH}}=k(\\vec a+\\vec b)$（$k$ は実数）とおけます。$\\overrightarrow{\\mathrm{OH}}=\\vec a+k(\\vec a+\\vec b)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=\\vec a+k(\\vec a+\\vec b)=(1+k)\\vec a+k\\,\\vec b' }] } },
      { say: 'H は直線 BP 上にもあるので、$\\overrightarrow{\\mathrm{OH}}=(1-u)\\vec b+\\frac{2u}{3}\\vec a$ とも書けます。(2) と同じ、係数を比べる方法です。',
        add: [{ t: 'm', size: 'sm', tex: '\\begin{cases} 1+k=\\dfrac{2u}{3}\\\\[4pt] k=1-u \\end{cases}', note: '係数を比べる' }] },
      { ask: { type: 'choice', q: '$k$ の値は？',
        opts: ['$\\dfrac15$', '$\\dfrac65$', '$-\\dfrac65$', '$-\\dfrac15$'], ok: 3,
        why: { 0: '符号がちがいます。$1+k=\\frac{2u}{3}$ に $k=1-u$ を入れると $u=\\frac65$、$k=1-\\frac65=-\\frac15$。', 1: '$\\frac65$ は $u$ のほうです。$k=1-u$ なので、$k=1-\\frac65$。', 2: '$k=1-u$ に $u=\\frac65$ を入れると $-\\frac15$。$-\\frac65$ ではありません。' },
        good: '$2-u=\\frac{2u}{3}$ より $u=\\frac65$、$k=1-\\frac65=-\\frac15$。$u>1$ なので、H は線分 BP の P のむこう側（延長上）です。',
        add: [{ t: 'm', tex: 'k=-\\frac15,\\qquad \\overrightarrow{\\mathrm{OH}}=\\frac45\\vec a-\\frac15\\vec b' }] } },
      { say: '長さは $|\\overrightarrow{\\mathrm{AH}}|=\\left|-\\frac15(\\vec a+\\vec b)\\right|=\\frac15\\sqrt{50}=\\sqrt2$。(2) で求めた $|\\vec a+\\vec b|^2=50$ がそのまま使えます。',
        add: [{ t: 'ans', label: '(3) 答', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac45\\vec a-\\frac15\\vec b,\\quad \\mathrm{AH}=\\sqrt2' }] },
      { ask: { type: 'think', q: '確かめ：$\\overrightarrow{\\mathrm{BH}}$ を計算して、H がたしかに直線 BP 上にあることを確かめよう。',
        hint: '$\\overrightarrow{\\mathrm{BH}}=\\overrightarrow{\\mathrm{OH}}-\\vec b=\\frac45\\vec a-\\frac65\\vec b$。$\\overrightarrow{\\mathrm{BP}}=\\frac23\\vec a-\\vec b$ の何倍？',
        ans: '$\\overrightarrow{\\mathrm{BH}}=\\frac45\\vec a-\\frac65\\vec b=\\dfrac65\\left(\\dfrac23\\vec a-\\vec b\\right)=\\dfrac65\\overrightarrow{\\mathrm{BP}}$',
        after: '$\\overrightarrow{\\mathrm{BH}}$ は $\\overrightarrow{\\mathrm{BP}}$ の $\\frac65$ 倍。H は直線 BP 上で、P をこえた所にあります。' } },

      // ---------- 座標で検算 ----------
      { clear: true, part: '別の見方', say: '$\\angle\\mathrm{AOB}=45^\\circ$ で、辺の長さが $2\\sqrt5,\\ \\sqrt{10}$ なので、座標をおいて検算できます。たとえば A$(4,\\,2)$、B$(3,\\,-1)$ はどうでしょう。',
        add: [{ t: 'h', text: '座標で検算する' },
          { t: 'p', size: 'sm', text: 'O(0, 0)、A(4, 2)、B(3, −1)\n$|\\vec a|^2=16+4=20,\\ \\ |\\vec b|^2=9+1=10$\n$\\vec a\\cdot\\vec b=12-2=10$' },
          { t: 'fig', id: 'g5', col: 1, view: VIEW, w: 394, h: 330, items: [{ k: 'axes', tx: [1, 2, 3, 4], ty: [[-1, '−1'], 1, 2] }].concat(tri, PQ, RR, HH) }] },
      { ask: { type: 'choice', q: 'H の座標は？（$\\overrightarrow{\\mathrm{OH}}=\\frac45\\vec a-\\frac15\\vec b$）',
        opts: ['$\\left(\\dfrac{13}{5},\\,\\dfrac95\\right)$', '$\\left(\\dfrac{19}{5},\\,\\dfrac{11}{5}\\right)$', '$\\left(\\dfrac{14}{5},\\,\\dfrac25\\right)$', '$(2,\\,1)$'], ok: 0,
        why: { 1: '$\\frac45\\vec a+\\frac15\\vec b$ にしています。$\\vec b$ は引きます。', 2: 'それは R の座標です。H は P をこえた所です。', 3: 'それは OA の中点です。' },
        good: '$\\frac45(4,2)-\\frac15(3,-1)=\\left(\\frac{13}{5},\\frac95\\right)$。AH $=\\sqrt{\\left(\\frac75\\right)^2+\\left(\\frac15\\right)^2}=\\sqrt2$、R $\\left(\\frac{14}{5},\\frac25\\right)$ で OR $=2\\sqrt2$ も合います。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{R}\\left(\\frac{14}{5},\\,\\frac25\\right),\\quad \\mathrm{H}\\left(\\frac{13}{5},\\,\\frac95\\right)', note: '(2)(3) の答えに\n座標を入れた' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OR}}|=2\\sqrt2,\\quad \\mathrm{AH}=\\sqrt2' }] } },
      { say: '答案では「R は直線 OQ 上にあるから $s(\\vec a+\\vec b)$ とおける」と、おく理由を一言書きます。係数を比べるときは「$\\vec a,\\ \\vec b$ は平行でないから」も忘れずに。',
        add: [{ t: 'box', c: 'g', size: 'sm', label: '答案のコツ', text: '・垂直 →「内積 $=0$ より」と書いて式へ\n・点をおくときは「〜上にあるから」と理由を書く\n・係数を比べる前に「$\\vec a,\\ \\vec b$ は平行でない」と書く' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂直・交点・長さの3つを、内積とおき方で処理する。ベクトルの基本問題の型です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
