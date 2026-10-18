/* 2024 広島大 理系 第2問の類題（自作）：平面に下ろした垂線の足と、平面に関して対称な点
   問題：A(1,1,0)、B(−1,2,0)、C(3,3,3)、D(2,4,−1)。平面 α＝平面 ABC
   答え（python3・sympy で検算ずみ）：
   AB=(−2,1,0)、AC=(2,2,3)、AD=(1,3,−1)。|AB|²=5、|AC|²=17
   (1) AB・AC=−2、AB・AD=1、AC・AD=5
   (2) AH=sAB+tAC、DH・AB=0：5s−2t−1=0、DH・AC=0：−2s+17t−5=0 → s=t=1/3、H(1,2,1)（△ABC の重心）。DH=(−1,−2,2)、DH=3
   (3) E=D+kDH、AE²=11 → k=0, 2。E≠D より k=2、E(0,0,3)（α に関して D と対称）
   (4) DE⊥α、C,H∈α → CH⊥DE。DE=6、CH=3 → △CDE=9。（CD=(−1,1,−4)、CE=(−3,−3,0)、CD・CE=0、|CD|=|CE|=3√2 でも 9）
   考えてみよう：四面体 ABCD の体積＝(1/3)·△ABC·DH＝(1/3)·(9/2)·3＝9/2（△ABC＝(1/2)√(5·17−4)＝9/2） */
(function () {
  // イメージ図（長さは正確ではない）：平面 α を平行四辺形で、H は △ABC の重心
  const PA = [1.6, 0.5], PB = [6.4, 0.7], PC = [5.8, 2.5], PH = [4.6, 3.7 / 3], PD = [4.6, 5.0], PE = [4.6, -2.3];
  const img = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.6, -3.1, 9.6, 5.7], w: 560, h: 483, items: [
    { k: 'poly', pts: [[0, 0], [7, 0], [9, 3], [2, 3]], close: true, c: 'd', wd: 2, fill: 'd', alpha: 0.12 },
    { k: 'label', at: [8.3, 2.55], text: 'α', size: 26, c: 'd' },
    { k: 'poly', pts: [PA, PB, PC], close: true, c: 'w', wd: 2.5 },
    { k: 'pt', at: PA, name: 'A', dir: 'w', c: 'w' }, { k: 'pt', at: PB, name: 'B', dir: 'e', c: 'w' }, { k: 'pt', at: PC, name: 'C', dir: 'ne', c: 'w' }
  ].concat(extra || []) });
  const perp = [
    { k: 'seg', a: PD, b: PH, c: 'b', wd: 3 },
    { k: 'right', o: PH, a: PD, b: PA, s: 14 },
    { k: 'pt', at: PD, name: 'D', dir: 'n', c: 'b' }, { k: 'pt', at: PH, name: 'H', dir: 'sw', c: 'y' }];
  const below = [
    { k: 'seg', a: PH, b: [4.6, 0], c: 'p', wd: 3, dash: true }, { k: 'seg', a: [4.6, 0], b: PE, c: 'p', wd: 3 },
    { k: 'pt', at: PE, name: 'E', dir: 'e', c: 'p' }];
  const POINTS = [
    '垂線の足 H は「**H が平面上**：$\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$」と「**DH が平面内の2本に垂直**」の2つで決める。内積を先に出しておくと連立方程式がすぐ立つ',
    '垂線上で $\\mathrm{AE}=\\mathrm{AD}$ ⇔ $\\mathrm{HE}=\\mathrm{HD}$（三平方の定理）。E は H が中点になる点＝**平面に関する対称点**',
    '平面に垂直な線分 DE と、平面上の点 C：**CH が高さ**。成分の公式でも検算できる'
  ];

  HB.lesson({
    id: 'hiro24-2', field: '広島大型　数学（理系）', title: '2024 広島大 理系 第2問の類題 ― 垂線の足と平面に関する対称点', level: '2024年度 広島大学 理系 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 4 点 $\\mathrm{A}(1,\\ 1,\\ 0)$、$\\mathrm{B}(-1,\\ 2,\\ 0)$、$\\mathrm{C}(3,\\ 3,\\ 3)$、$\\mathrm{D}(2,\\ 4,\\ -1)$ がある。3 点 A，B，C を通る平面を $\\alpha$ とする。',
      parts: [
        '(1)　内積 $\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$、$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AD}}$、$\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AD}}$ をそれぞれ求めよ。',
        '(2)　点 D から平面 $\\alpha$ に垂線を下ろし、$\\alpha$ との交点を H とする。H の座標を求めよ。',
        '(3)　直線 DH 上の点 E で、$\\mathrm{AE}=\\mathrm{AD}$ かつ $\\mathrm{E}\\neq\\mathrm{D}$ をみたすものの座標を求めよ。',
        '(4)　$\\triangle\\mathrm{CDE}$ の面積を求めよ。'
      ],
      src: '※ 2024年度 広島大学 前期 理系 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { cols: [1], part: '問題', say: '空間ベクトルの問題です。平面に下ろした垂線の足、平面に関して対称な点、三角形の面積と、空間図形の基本がつまっています。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 方針 ----------
      { clear: true, part: '方針', say: '右はイメージ図です（長さは正確ではありません）。D から平面 α に垂線 DH を下ろし、その先に E があります。何を手がかりに H を決めるかが方針です。',
        add: [{ t: 'h', text: '方針：H を決める2つの条件' },
          { t: 'box', c: 'b', size: 'sm', label: '垂線の足 H の条件', text: '① H は平面 α 上 → $\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$\n② $\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AB}}$、$\\overrightarrow{\\mathrm{DH}}\\perp\\overrightarrow{\\mathrm{AC}}$（内積が 0）' },
          { t: 'p', size: 'sm', text: '② の計算には、$\\overrightarrow{\\mathrm{AB}},\\ \\overrightarrow{\\mathrm{AC}},\\ \\overrightarrow{\\mathrm{AD}}$ どうしの内積が必要\n→ それを用意するのが (1)' },
          img('m0', perp.concat(below))] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '(1) です。まず A を始点とする3つのベクトルを成分で書きます。「終点 − 始点」です。',
        add: [{ t: 'h', text: '(1)　内積を求める' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}=(-2,\\ 1,\\ 0),\\quad \\overrightarrow{\\mathrm{AC}}=(2,\\ 2,\\ 3),\\quad \\overrightarrow{\\mathrm{AD}}=(1,\\ 3,\\ -1)' }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}$ の値は？',
        opts: ['$(-4,\\ 2,\\ 0)$', '$2$', '$6$', '$-2$'], ok: 3,
        why: { 0: '内積は **数**。成分ごとの積を、最後に足します。', 1: '$(-2)\\cdot2=-4$。符号に注意すると $-4+2+0$ です。', 2: '$-4$ の符号を落としています。' },
        good: '$(-2)\\cdot2+1\\cdot2+0\\cdot3=-2$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=-4+2+0=-2' }] } },
      { say: '同じように計算します。(2) で使うので、大きさの2乗 $|\\overrightarrow{\\mathrm{AB}}|^2=5$、$|\\overrightarrow{\\mathrm{AC}}|^2=17$ も出しておきます。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AD}}=-2+3+0=1' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AD}}=2+6-3=5' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|^2=5,\\qquad |\\overrightarrow{\\mathrm{AC}}|^2=17', note: '(2) で使う' },
          { t: 'ans', label: '(1) 答', tex: '\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}}=-2,\\quad \\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AD}}=1,\\quad \\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AD}}=5' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。H は α 上なので $\\overrightarrow{\\mathrm{AH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}$ と書けます。すると $\\overrightarrow{\\mathrm{DH}}=\\overrightarrow{\\mathrm{AH}}-\\overrightarrow{\\mathrm{AD}}$。',
        add: [{ t: 'h', text: '(2)　垂線の足 H' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}=s\\overrightarrow{\\mathrm{AB}}+t\\overrightarrow{\\mathrm{AC}}-\\overrightarrow{\\mathrm{AD}}' },
          img('m1', perp)] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0$ を、(1) の値を使って $s,\\ t$ で表すと？',
        opts: ['$5s-2t+1=0$', '$5s-2t-1=0$', '$5s+17t-1=0$', '$-2s+17t-5=0$'], ok: 1,
        why: { 0: '$-\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AB}}=-1$。符号がちがいます。', 2: '$t$ の係数は $\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AB}}=-2$。$|\\overrightarrow{\\mathrm{AC}}|^2$ ではありません。', 3: 'それは $\\overrightarrow{\\mathrm{AC}}$ との内積の式です。' },
        good: '$s|\\overrightarrow{\\mathrm{AB}}|^2+t\\,\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AB}}-\\overrightarrow{\\mathrm{AD}}\\cdot\\overrightarrow{\\mathrm{AB}}=5s-2t-1$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AB}}=0：\\ 5s-2t-1=0' }] } },
      { say: '$\\overrightarrow{\\mathrm{AC}}$ との内積も同じです。2つの式を連立すると、$s=t=\\frac13$ が出ます。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{DH}}\\cdot\\overrightarrow{\\mathrm{AC}}=0：\\ -2s+17t-5=0' },
          { t: 'm', tex: '\\therefore\\ s=\\frac13,\\quad t=\\frac13', note: '1つ目から s=(1+2t)/5\n→ 81t=27' }] },
      { ask: { type: 'choice', q: 'H の座標は？',
        opts: ['$(0,\\ 1,\\ 1)$', '$(1,\\ 4,\\ 3)$', '$(1,\\ 2,\\ 1)$', '$(2,\\ 3,\\ 1)$'], ok: 2,
        why: { 0: 'それは $\\overrightarrow{\\mathrm{AH}}$ の成分。A の座標を足します。', 1: '$\\frac13$ をかけ忘れています。', 3: '$\\overrightarrow{\\mathrm{AB}}+\\overrightarrow{\\mathrm{AC}}=(0,\\ 3,\\ 3)$。$x$ 成分は 0 です。' },
        good: '$\\overrightarrow{\\mathrm{OH}}=\\overrightarrow{\\mathrm{OA}}+\\frac13(0,\\ 3,\\ 3)=(1,\\ 2,\\ 1)$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=(1,\\ 1,\\ 0)+\\tfrac13\\{(-2,\\ 1,\\ 0)+(2,\\ 2,\\ 3)\\}=(1,\\ 2,\\ 1)' }] } },
      { say: '**検算**：$\\overrightarrow{\\mathrm{DH}}=(-1,\\ -2,\\ 2)$ は $\\overrightarrow{\\mathrm{AB}}$ とも $\\overrightarrow{\\mathrm{AC}}$ とも内積 0。$s=t=\\frac13$ なので、H は △ABC の重心です。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{DH}}=(-1,\\ -2,\\ 2),\\quad \\mathrm{DH}=3', note: '内積：2−2+0=0、−2−4+6=0' },
          { t: 'ans', label: '(2) 答', text: '$\\mathrm{H}(1,\\ 2,\\ 1)$　（△ABC の重心）' }] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。E は直線 DH 上。$\\mathrm{AH}\\perp\\mathrm{DH}$ なので、三角形 AHD・AHE は H で直角です。三平方の定理で考えます。',
        add: [{ t: 'h', text: '(3)　AE = AD となる点 E' },
          { t: 'm', size: 'sm', tex: '\\mathrm{AE}^2=\\mathrm{AH}^2+\\mathrm{HE}^2,\\qquad \\mathrm{AD}^2=\\mathrm{AH}^2+\\mathrm{HD}^2' },
          img('m2', perp.concat(below, [{ k: 'seg', a: PA, b: PE, c: 'g', wd: 2, dash: true }, { k: 'seg', a: PA, b: PD, c: 'g', wd: 2, dash: true }, { k: 'seg', a: PA, b: PH, c: 'y', wd: 3 }]))] },
      { ask: { type: 'choice', q: '$\\mathrm{AE}=\\mathrm{AD}$、$\\mathrm{E}\\neq\\mathrm{D}$ をみたす直線 DH 上の点 E は？',
        opts: ['H が線分 DE の中点になる点', '線分 DH の中点', 'H そのもの', 'A が線分 DE の中点になる点'], ok: 0,
        why: { 1: 'DH の中点では $\\mathrm{HE}=\\frac32$ で、$\\mathrm{HD}=3$ と等しくありません。', 2: '$\\mathrm{AH}^2=2$、$\\mathrm{AD}^2=11$ なので、$\\mathrm{AH}\\neq\\mathrm{AD}$ です。', 3: 'A は直線 DH 上にありません。E は直線 DH 上の点です。' },
        good: '$\\mathrm{AE}=\\mathrm{AD}$ ⇔ $\\mathrm{HE}=\\mathrm{HD}$。E は **平面 α に関して D と対称な点** です。',
        add: [{ t: 'm', tex: '\\mathrm{HE}=\\mathrm{HD}=3', note: 'H が DE の中点' }] } },
      { say: '$\\overrightarrow{\\mathrm{OE}}=\\overrightarrow{\\mathrm{OD}}+2\\overrightarrow{\\mathrm{DH}}$ で求めます。検算：$\\mathrm{AE}^2=1+1+9=11=\\mathrm{AD}^2$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{OE}}=(2,\\ 4,\\ -1)+2(-1,\\ -2,\\ 2)=(0,\\ 0,\\ 3)' },
          { t: 'ans', label: '(3) 答', text: '$\\mathrm{E}(0,\\ 0,\\ 3)$' }] },
      { ask: { type: 'think', q: '図にたよらず、E を計算だけで求めよう。直線 DH 上の点を $\\overrightarrow{\\mathrm{OD}}+k\\overrightarrow{\\mathrm{DH}}$ とおいて、$\\mathrm{AE}^2=11$ から $k$ を出す。',
        hint: '$\\overrightarrow{\\mathrm{AE}}=\\overrightarrow{\\mathrm{AD}}+k\\overrightarrow{\\mathrm{DH}}=(1-k,\\ 3-2k,\\ -1+2k)$。',
        ans: '$(1-k)^2+(3-2k)^2+(-1+2k)^2=11$ → $9k^2-18k=0$ → $k=0,\\ 2$。E ≠ D より $k=2$、E$(0,\\ 0,\\ 3)$',
        after: '$k=0$ が D 自身。もう1つの解 $k=2$ は「D から H までの2倍進んだ点」です。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: '(4) です。DE は平面 α に垂直で、C と H は α 上の点。だから $\\mathrm{CH}\\perp\\mathrm{DE}$ です。',
        add: [{ t: 'h', text: '(4)　△CDE の面積' },
          { t: 'p', size: 'sm', text: 'DE ⊥ α、C と H は α 上\n→ DE は α 上のすべての直線と垂直' },
          img('m3', perp.concat(below, [{ k: 'poly', pts: [PC, PD, PE], close: true, c: 'g', wd: 2.5, fill: 'g', alpha: 0.18 }, { k: 'seg', a: PC, b: PH, c: 'y', wd: 3 }]))] },
      { ask: { type: 'choice', q: '△CDE で、DE を底辺とみたときの **高さ** は？',
        opts: ['CD', 'CH', 'AH', 'DH'], ok: 1,
        why: { 0: 'CD は DE と垂直ではありません（斜めの辺）。', 2: 'AH は A から DE までの距離。△CDE の高さは C から測ります。', 3: 'DH は底辺 DE の一部です。' },
        good: 'C から直線 DE に下ろした垂線の足が H。高さは $\\mathrm{CH}$ です。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{HC}}=(2,\\ 1,\\ 2),\\quad \\mathrm{CH}=3' }] } },
      { say: '$\\mathrm{DE}=2\\mathrm{DH}=6$、高さ $\\mathrm{CH}=3$。面積は $\\frac12\\cdot6\\cdot3=9$ です。',
        add: [{ t: 'm', tex: '\\triangle\\mathrm{CDE}=\\frac12\\cdot\\mathrm{DE}\\cdot\\mathrm{CH}=\\frac12\\cdot6\\cdot3=9' },
          { t: 'ans', label: '(4) 答', tex: '\\triangle\\mathrm{CDE}=9' }] },

      // ---------- 別の見方 ----------
      { clear: true, cols: [1], part: '別の見方', say: '成分の公式でも確かめます。C を始点にすると、$\\overrightarrow{\\mathrm{CD}}\\cdot\\overrightarrow{\\mathrm{CE}}$ が意外な値になります。',
        add: [{ t: 'h', text: '別の見方：面積の公式で検算' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{CD}}=(-1,\\ 1,\\ -4),\\qquad \\overrightarrow{\\mathrm{CE}}=(-3,\\ -3,\\ 0)' },
          { t: 'm', size: 'sm', tex: 'S=\\frac12\\sqrt{|\\overrightarrow{\\mathrm{CD}}|^2|\\overrightarrow{\\mathrm{CE}}|^2-(\\overrightarrow{\\mathrm{CD}}\\cdot\\overrightarrow{\\mathrm{CE}})^2}' }] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{CD}}\\cdot\\overrightarrow{\\mathrm{CE}}$ の値は？',
        opts: ['$6$', '$-6$', '$18$', '$0$'], ok: 3,
        why: { 0: '$(-1)(-3)+1\\cdot(-3)+(-4)\\cdot0=3-3+0$ です。', 1: '$(-1)(-3)=+3$。符号に注意。', 2: 'それは $|\\overrightarrow{\\mathrm{CD}}|^2$ の値です。' },
        good: '内積が 0 なので $\\angle\\mathrm{DCE}=90^\\circ$。$|\\overrightarrow{\\mathrm{CD}}|^2=|\\overrightarrow{\\mathrm{CE}}|^2=18$ で、$S=\\frac12\\cdot18=9$。',
        add: [{ t: 'm', tex: '\\overrightarrow{\\mathrm{CD}}\\cdot\\overrightarrow{\\mathrm{CE}}=0,\\quad S=\\frac12\\sqrt{18\\cdot18-0}=9' },
          { t: 'box', c: 'g', size: 'sm', label: 'なぜ直角？', text: '$\\mathrm{HC}=\\mathrm{HD}=\\mathrm{HE}=3$。C は DE を直径とする円の上にあるので、$\\angle\\mathrm{DCE}=90^\\circ$（直径に対する円周角）。' }] } },
      { ask: { type: 'think', q: '四面体 ABCD の体積を求めよう。',
        hint: '底面 △ABC の面積は、(1) の値から $\\frac12\\sqrt{|\\overrightarrow{\\mathrm{AB}}|^2|\\overrightarrow{\\mathrm{AC}}|^2-(\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AC}})^2}$。高さは DH。',
        ans: '△ABC $=\\frac12\\sqrt{5\\cdot17-4}=\\frac92$、体積 $=\\frac13\\cdot\\frac92\\cdot3=\\frac92$',
        after: '垂線の足を求めておくと、高さ DH がすぐわかり、体積まで一気に出せます。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。垂線の足・対称点・面積は、空間ベクトルでいちばんよく出る流れです。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で答案を書いてみましょう。' }
    ]
  });
})();
