/* 2024 慶應 理工 第4問の類題（自作）：底面が正方形の、かたむいた平行六面体（全部空欄）
   元の問題はうつしていない（分野・ねらい・形式だけを合わせた自作問題）。答えは python3（sympy・座標 a=(2,0,0), c=(0,2,0), d=(−1,2,2) でも）で検算ずみ。
   |a|=|c|=2, |d|=3, a·c=0, a·d=−2, c·d=4（体積 8・高さ 2）
   (1) AC·AD=(c−a)·(d−a)=10、|AC|²=8、|AD|²=17 → ア 面積 ½√(136−100)=3
       OH=xa+yc+zd、x+y+z=1、OH·a=OH·c=OH·d → イウエ (5/9, 2/9, 2/9)（誤答 (5/9, 2/3, −2/9) は a·d の符号ミス）
       |OH|²=OH·a=16/9 → OH=4/3、オ 四面体 OACD=⅓·3·4/3=4/3（＝平行六面体 8 の 1/6）
   (2) P=(1−s)a+c、M=a+c/2、N=c+d/2。PM=sa−c/2、PN=−(1−s)a+d/2
       カ PM·PN=4s²−5s−1。|PM|²=4s²+1、|PN|²=4(1−s)²+2(1−s)+9/4。面積²=(80s²−80s+29)/16=(80(s−½)²+9)/16
       → キ s=1/2、ク 3/4（誤答 5/8 は内積の最小の所、9/16 は面積の2乗）
   (3) M+β(N−M)+γ(P−M)=(1−β−sγ)a+(1/2+β/2+γ/2)c+(β/2)d=d+ka → β=2, γ=−3, k=3s−1 → ケ 1/3 ≦ s ≦ コ 2/3
       s=1/2 のとき切り口は AB, BC, CG, GD, DE, EA の中点を通る六角形 */
(function () {
  const pj = (x, y, z) => [x + 0.3 * y, z + 0.25 * y];   // 見取図（x 右・y 奥・z 上）
  const V = { O: [0, 0, 0], A: [2, 0, 0], B: [2, 2, 0], C: [0, 2, 0], D: [-1, 2, 2], E: [1, 2, 2], F: [1, 4, 2], G: [-1, 4, 2] };
  const P2 = {}; Object.keys(V).forEach(k => { P2[k] = pj(...V[k]); });
  const mid = (u, v) => pj((V[u][0] + V[v][0]) / 2, (V[u][1] + V[v][1]) / 2, (V[u][2] + V[v][2]) / 2);
  const DIR = { O: 'sw', A: 'se', B: 'e', C: 'nw', D: 'w', E: 'se', F: 'ne', G: 'nw' };
  const HID = ['OC', 'BC', 'CG'];
  const EDGES = ['OA', 'AB', 'BC', 'OC', 'DE', 'EF', 'FG', 'DG', 'OD', 'AE', 'BF', 'CG'];
  const BOX = EDGES.map(e => ({ k: 'seg', a: P2[e[0]], b: P2[e[1]], c: 'w', wd: 2.2, dash: HID.includes(e) }))
    .concat(Object.keys(P2).map(k => ({ k: 'pt', at: P2[k], name: k, dir: DIR[k], c: 'w', size: 22, r: 4 })));
  const fig = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.8, -0.45, 3.05, 3.35], w: 430, h: 424, items: BOX.concat(extra || []) });
  const H = pj(8 / 9, 8 / 9, 4 / 9);
  const TRI = [{ k: 'poly', pts: [P2.A, P2.C, P2.D], close: true, c: 'y', wd: 2.5, fill: 'y', alpha: 0.2 }];
  const Mp = mid('A', 'B'), Np = mid('C', 'G'), Pp = pj(1, 2, 0);
  const PMN = [{ k: 'poly', pts: [Pp, Mp, Np], close: true, c: 'p', wd: 2.5, fill: 'p', alpha: 0.2 },
    { k: 'pt', at: Mp, name: 'M', dir: 'se', c: 'p', size: 22 }, { k: 'pt', at: Np, name: 'N', dir: 'w', c: 'p', size: 22 }, { k: 'pt', at: Pp, name: 'P', dir: 'n', c: 'p', size: 22 }];
  const HEX = [{ k: 'poly', pts: [Mp, Pp, Np, mid('G', 'D'), mid('D', 'E'), mid('E', 'A')], close: true, c: 'g', wd: 2.5, fill: 'g', alpha: 0.2 },
    { k: 'pt', at: Mp, name: 'M', dir: 'se', c: 'p', size: 22 }, { k: 'pt', at: Np, name: 'N', dir: 'w', c: 'p', size: 22 }, { k: 'pt', at: Pp, name: 'P', dir: 'n', c: 'p', size: 22 },
    { k: 'pt', at: mid('D', 'E'), name: 'Q', dir: 'n', c: 'g', size: 22 }];
  const POINTS = [
    '長さと内積が全部わかっていれば、面積は $\\frac12\\sqrt{|\\vec u|^2|\\vec v|^2-(\\vec u\\cdot\\vec v)^2}$、体積は「底面積 × 高さ ÷ 3」で、**内積の計算だけ** で出る',
    '平面への垂線の足 H：平面上にある（係数の和 $=1$）＋ 平面の2本のベクトルに垂直。$\\overrightarrow{\\mathrm{OH}}\\cdot\\vec a=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec c=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec d$ と見ると速い',
    '平面と辺の共有点は、平面上の点と辺上の点を同じ $\\vec a,\\ \\vec c,\\ \\vec d$ で表し、**1次独立だから係数を比べる**。辺上の条件 $0\\le k\\le1$ から範囲を出す'
  ];

  HB.lesson({
    id: 'keio24-4', field: '慶應型　数学（理工）', title: '2024 慶應 理工 第4問の類題 ― かたむいた平行六面体の垂線の足・動く三角形・切り口', level: '2024年度 慶應義塾大学 理工学部 第4問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '平行六面体 OABC−DEFG において、$\\vec a=\\overrightarrow{\\mathrm{OA}},\\ \\vec c=\\overrightarrow{\\mathrm{OC}},\\ \\vec d=\\overrightarrow{\\mathrm{OD}}$ とおくと、$\\overrightarrow{\\mathrm{OB}}=\\vec a+\\vec c$，$\\overrightarrow{\\mathrm{OE}}=\\vec a+\\vec d$，$\\overrightarrow{\\mathrm{OF}}=\\vec a+\\vec c+\\vec d$，$\\overrightarrow{\\mathrm{OG}}=\\vec c+\\vec d$ である。さらに\n　$|\\vec a|=|\\vec c|=2,\\ \\ |\\vec d|=3,\\ \\ \\vec a\\cdot\\vec c=0,\\ \\ \\vec a\\cdot\\vec d=-2,\\ \\ \\vec c\\cdot\\vec d=4$\nとする。次の空欄にあてはまる数または式を答えよ。',
      parts: [
        '(1)　三角形 ACD の面積は $\\boxed{\\text{ア}}$ である。O から 3 点 A，C，D を通る平面に垂線 OH を下ろすと　$\\overrightarrow{\\mathrm{OH}}=\\boxed{\\text{イ}}\\,\\vec a+\\boxed{\\text{ウ}}\\,\\vec c+\\boxed{\\text{エ}}\\,\\vec d$　であり、四面体 OACD の体積は $\\boxed{\\text{オ}}$ である。',
        '(2)　辺 AB の中点を M，辺 CG の中点を N とし、$0\\le s\\le1$ に対して辺 BC 上の点 P を $\\overrightarrow{\\mathrm{BP}}=s\\,\\overrightarrow{\\mathrm{BC}}$ で定める。$\\overrightarrow{\\mathrm{PM}}\\cdot\\overrightarrow{\\mathrm{PN}}=\\boxed{\\text{カ}}$（$s$ の式）であり、三角形 PMN の面積は $s=\\boxed{\\text{キ}}$ のとき最小値 $\\boxed{\\text{ク}}$ をとる。',
        '(3)　3 点 P，M，N を通る平面が辺 DE と共有点をもつような $s$ の値の範囲は　$\\boxed{\\text{ケ}}\\le s\\le\\boxed{\\text{コ}}$　である。'
      ],
      src: '※ 2024年度 慶應義塾大学 理工学部 一般選抜 第4問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.57, 0.43],
    steps: [
      { clear: true, cols: [1], part: '問題', say: '空間ベクトルの問題です。図はなく、長さと内積だけが与えられています。全部が空欄なので、計算を速く確実に。まず問題文を読みましょう（Q キー）。',
        add: [{ t: 'prob', style: 'font-size:22px;line-height:1.55' }] },
      { clear: true, part: '整理', say: '内積を表にします。$\\vec a\\cdot\\vec c=0$、$|\\vec a|=|\\vec c|$ なので、底面 OABC は **1辺 2 の正方形**。側面の辺 $\\vec d$ がかたむいた立体です。',
        add: [{ t: 'h', text: '与えられた量の整理' },
          { t: 'tbl', size: 'sm', rows: [['', '$\\vec a$', '$\\vec c$', '$\\vec d$'], ['$\\vec a$', '$4$', '$0$', '$-2$'], ['$\\vec c$', '$0$', '$4$', '$4$'], ['$\\vec d$', '$-2$', '$4$', '$9$']] },
          { t: 'p', size: 'sm', text: '表の数は、その2本の内積（対角線は大きさの2乗）' },
          fig('g1')] },

      // ---------- (1) 面積 ----------
      { clear: true, part: '(1)', say: '(1) の三角形 ACD は、A を始点にした $\\overrightarrow{\\mathrm{AC}}=\\vec c-\\vec a$、$\\overrightarrow{\\mathrm{AD}}=\\vec d-\\vec a$ で考えます。面積の公式には、2本の大きさと内積が要ります。',
        add: [{ t: 'h', text: '(1)　三角形 ACD の面積' },
          { t: 'box', c: 'b', size: 'sm', label: '三角形の面積', text: '$\\dfrac12\\sqrt{|\\vec u|^2|\\vec v|^2-(\\vec u\\cdot\\vec v)^2}$' },
          { t: 'm', size: 'sm', tex: '|\\vec c-\\vec a|^2=4-0+4=8,\\quad|\\vec d-\\vec a|^2=9+4+4=17' },
          fig('g2', TRI)] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AD}}=(\\vec c-\\vec a)\\cdot(\\vec d-\\vec a)$ の値は？',
        opts: ['$6$', '$2$', '$10$', '$4$'], ok: 2,
        why: { 0: '$-\\vec a\\cdot\\vec d=-(-2)=+2$ です。符号を逆にしています。', 1: '$(-\\vec a)\\cdot(-\\vec a)=+|\\vec a|^2=+4$ です。', 3: '$\\vec c\\cdot\\vec d$ だけです。展開すると4つの項が出ます。' },
        good: '$\\vec c\\cdot\\vec d-\\vec c\\cdot\\vec a-\\vec a\\cdot\\vec d+|\\vec a|^2=4-0+2+4=10$。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AC}}\\cdot\\overrightarrow{\\mathrm{AD}}=4-0+2+4=10' }] } },
      { say: '公式に入れると $\\frac12\\sqrt{8\\cdot17-10^2}=\\frac12\\sqrt{36}=3$（ア）。ルートの中が平方数になると、検算にもなります。',
        add: [{ t: 'ans', label: 'ア', tex: '\\triangle\\mathrm{ACD}=\\frac12\\sqrt{8\\cdot17-10^2}=3' }] },

      // ---------- (1) 垂線の足 ----------
      { clear: true, say: 'H は平面 ACD 上なので、$\\overrightarrow{\\mathrm{OH}}=x\\vec a+y\\vec c+z\\vec d$ と書けば **$x+y+z=1$**。さらに $\\overrightarrow{\\mathrm{OH}}$ は $\\overrightarrow{\\mathrm{AC}}$ にも $\\overrightarrow{\\mathrm{AD}}$ にも垂直です。',
        add: [{ t: 'h', text: '(1)　つづき：垂線の足 H' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=x\\vec a+y\\vec c+z\\vec d,\\quad x+y+z=1' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}\\cdot(\\vec c-\\vec a)=0,\\quad\\overrightarrow{\\mathrm{OH}}\\cdot(\\vec d-\\vec a)=0' },
          { t: 'box', c: 'g', size: 'sm', label: '見かたのコツ', text: '2つの垂直の式は\n$\\overrightarrow{\\mathrm{OH}}\\cdot\\vec a=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec c=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec d\\ (=k)$ と同じ' },
          fig('g3', TRI.concat([{ k: 'seg', a: P2.O, b: H, c: 'g', wd: 3 }, { k: 'pt', at: H, name: 'H', dir: 'e', c: 'g', size: 22 }]))] },
      { say: '内積の表から拾うと、$\\overrightarrow{\\mathrm{OH}}\\cdot\\vec a=4x-2z$、$\\overrightarrow{\\mathrm{OH}}\\cdot\\vec c=4y+4z$、$\\overrightarrow{\\mathrm{OH}}\\cdot\\vec d=-2x+4y+9z$。これらが等しい、と $x+y+z=1$ を連立します。',
        add: [{ t: 'm', size: 'sm', tex: '4x-2z=4y+4z=-2x+4y+9z' },
          { t: 'm', size: 'sm', tex: '\\Longrightarrow\\ \\ y=z,\\quad x=\\tfrac52z' }] },
      { ask: { type: 'choice', q: '係数の比 $x:y:z$ は？（このあと $x+y+z=1$ で、イ・ウ・エが決まる）',
        opts: ['$1:1:1$', '$5:6:-2$', '$2:5:2$', '$5:2:2$'], ok: 3,
        why: { 0: 'それは三角形 ACD の重心。垂線の足は重心とは限りません。', 1: '$\\vec a\\cdot\\vec d=-2$ を $+2$ で計算するとこうなります。符号に注意。', 2: '$x=\\frac52z$ なのは $\\vec a$ の係数です。$\\vec c$ と取りちがえています。' },
        good: '$\\frac52z+z+z=1$ より $z=\\frac29$。$y=\\frac29,\\ x=\\frac59$。どれも正なので、H は三角形 ACD の内部にあります。',
        add: [{ t: 'ans', label: 'イ・ウ・エ', tex: '\\overrightarrow{\\mathrm{OH}}=\\frac59\\vec a+\\frac29\\vec c+\\frac29\\vec d' }] } },
      { clear: true, say: '$|\\overrightarrow{\\mathrm{OH}}|^2=\\overrightarrow{\\mathrm{OH}}\\cdot(x\\vec a+y\\vec c+z\\vec d)=(x+y+z)k=k$。$k=4x-2z=\\frac{16}9$ なので OH $=\\frac43$。体積は $\\frac13\\cdot3\\cdot\\frac43=\\frac43$（オ）。',
        add: [{ t: 'h', text: '(1)　つづき：OH の長さと四面体の体積' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}=\\tfrac59\\vec a+\\tfrac29\\vec c+\\tfrac29\\vec d' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OH}}\\cdot\\vec a=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec c=\\overrightarrow{\\mathrm{OH}}\\cdot\\vec d=k' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{OH}}|^2=k=4\\cdot\\tfrac59-2\\cdot\\tfrac29=\\tfrac{16}9,\\quad\\mathrm{OH}=\\tfrac43' },
          fig('g3b', TRI.concat([{ k: 'seg', a: P2.O, b: H, c: 'g', wd: 3 }, { k: 'pt', at: H, name: 'H', dir: 'e', c: 'g', size: 22 }])),
          { t: 'ans', label: 'オ', tex: 'V=\\frac13\\cdot3\\cdot\\frac43=\\frac43' }] },
      { ask: { type: 'think', q: '検算：平行六面体の体積は四面体 OACD の 6 倍。底面の正方形と高さから、平行六面体の体積を出して確かめよう。',
        hint: '$\\vec d$ の、底面に平行な部分は $\\dfrac{\\vec a\\cdot\\vec d}{|\\vec a|^2}\\vec a+\\dfrac{\\vec c\\cdot\\vec d}{|\\vec c|^2}\\vec c$（$\\vec a\\perp\\vec c$ だから）。',
        ans: '平行な部分は $-\\frac12\\vec a+\\vec c$ で大きさの2乗は $1+4=5$。高さ $=\\sqrt{9-5}=2$。体積 $=4\\times2=8=6\\times\\frac43$　たしかに合う',
        after: '空欄の答えは、別の道（ここでは底面 × 高さ）で1回確かめると安心です。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。P は辺 BC 上で $\\overrightarrow{\\mathrm{OP}}=\\vec a+\\vec c-s\\vec a$。M・N は中点。P を始点にした2本のベクトルを作ります。',
        add: [{ t: 'h', text: '(2)　動く点 P と三角形 PMN' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OP}}=(1-s)\\vec a+\\vec c,\\ \\ \\overrightarrow{\\mathrm{OM}}=\\vec a+\\tfrac12\\vec c,\\ \\ \\overrightarrow{\\mathrm{ON}}=\\vec c+\\tfrac12\\vec d' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{PM}}=s\\vec a-\\tfrac12\\vec c,\\quad\\overrightarrow{\\mathrm{PN}}=-(1-s)\\vec a+\\tfrac12\\vec d' },
          fig('g4', PMN)] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{PM}}\\cdot\\overrightarrow{\\mathrm{PN}}$（カ）は？',
        opts: ['$4s^2-3s-1$', '$4s^2-5s-1$', '$4s^2-5s-4$', '$4s^2-4s-1$'], ok: 1,
        why: { 0: '$\\frac s2\\vec a\\cdot\\vec d=\\frac s2\\cdot(-2)=-s$ の符号を逆にしています。', 2: '$-\\frac14\\vec c\\cdot\\vec d=-1$ の $\\frac14$ を落としています。', 3: '$\\frac s2\\vec a\\cdot\\vec d$ の項を落としています。' },
        good: '$-s(1-s)\\cdot4+\\frac s2(-2)+\\frac{1-s}{2}\\cdot0-\\frac14\\cdot4=4s^2-5s-1$。$\\vec a\\cdot\\vec c=0$ の項は消えます。',
        add: [{ t: 'ans', label: 'カ', tex: '\\overrightarrow{\\mathrm{PM}}\\cdot\\overrightarrow{\\mathrm{PN}}=4s^2-5s-1' }] } },
      { clear: true, cols: [1], say: '面積には大きさも要ります。$|\\overrightarrow{\\mathrm{PM}}|^2=4s^2+1$、$|\\overrightarrow{\\mathrm{PN}}|^2=4(1-s)^2+2(1-s)+\\frac94$。面積の2乗の4倍をまとめると、$s$ の2次式になります。',
        add: [{ t: 'h', text: '(2)　つづき：面積の最小' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{PM}}|^2=4s^2+1,\\quad|\\overrightarrow{\\mathrm{PN}}|^2=4s^2-10s+\\tfrac{33}4' },
          { t: 'm', size: 'sm', tex: '(\\triangle\\mathrm{PMN})^2=\\tfrac14\\{(4s^2+1)(4s^2-10s+\\tfrac{33}4)-(4s^2-5s-1)^2\\}' },
          { t: 'm', size: 'sm', tex: '=\\frac{80s^2-80s+29}{16}=\\frac{80\\left(s-\\frac12\\right)^2+9}{16}', note: '4次の項は\n打ち消し合う' }] },
      { ask: { type: 'choice', q: '面積が最小になる $s$（キ）と、最小値（ク）は？',
        opts: ['$s=\\frac12$，$\\frac9{16}$', '$s=\\frac58$，$\\frac34$', '$s=\\frac12$，$\\frac34$', '$s=0$，$\\frac{\\sqrt{29}}4$'], ok: 2,
        why: { 0: '$\\frac9{16}$ は面積の **2乗** です。$\\sqrt{\\frac9{16}}=\\frac34$。', 1: '$s=\\frac58$ は内積 $4s^2-5s-1$ が最小になる所。面積の最小とは別です。', 3: '$s=0$（P＝B）は端で、面積はむしろ最大（$\\frac{\\sqrt{29}}4$）です。' },
        good: '平方完成より $s=\\frac12$ で面積の2乗は $\\frac9{16}$、面積は $\\frac34$。P が辺 BC の中点のときです。',
        add: [{ t: 'ans', label: 'キ・ク', text: '$s=\\dfrac12$ のとき　最小値 $\\dfrac34$' }] } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。平面 PMN 上の点は $\\overrightarrow{\\mathrm{OM}}+\\beta\\overrightarrow{\\mathrm{MN}}+\\gamma\\overrightarrow{\\mathrm{MP}}$、辺 DE 上の点は $\\vec d+k\\vec a\\ (0\\le k\\le1)$ と書けます。',
        add: [{ t: 'h', text: '(3)　平面 PMN と辺 DE' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{MN}}=-\\vec a+\\tfrac12\\vec c+\\tfrac12\\vec d,\\quad\\overrightarrow{\\mathrm{MP}}=-s\\vec a+\\tfrac12\\vec c' },
          { t: 'm', size: 'sm', tex: '\\vec a+\\tfrac12\\vec c+\\beta\\overrightarrow{\\mathrm{MN}}+\\gamma\\overrightarrow{\\mathrm{MP}}' },
          { t: 'm', size: 'sm', tex: '=(1-\\beta-s\\gamma)\\vec a+\\tfrac{1+\\beta+\\gamma}{2}\\vec c+\\tfrac{\\beta}{2}\\vec d' },
          fig('g5', PMN)] },
      { ask: { type: 'choice', q: 'これが $\\vec d+k\\vec a$ と等しいとき、係数を比べてよい理由は？',
        opts: ['$\\vec a\\perp\\vec c$ だから', '$\\vec a,\\ \\vec c,\\ \\vec d$ が1次独立だから', '$|\\vec d|=3$ だから', 'P が辺 BC 上にあるから'], ok: 1,
        why: { 0: '垂直は関係ありません。かたむいた3本でも、同じ平面になければ係数を比べられます。', 2: '大きさは関係ありません。', 3: 'それは P の表し方の条件で、係数を比べる理由ではありません。' },
        good: '$\\vec a,\\ \\vec c,\\ \\vec d$ は同じ平面上にない（体積が 8 で 0 でない）ので1次独立。表し方はただ1通りです。' } },
      { say: '$\\vec d$ の係数から $\\beta=2$、$\\vec c$ の係数が 0 から $\\gamma=-3$。$\\vec a$ の係数から $k=1-2+3s=3s-1$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\tfrac{\\beta}{2}=1,\\quad\\tfrac{1+\\beta+\\gamma}{2}=0,\\quad1-\\beta-s\\gamma=k' },
          { t: 'm', tex: '\\beta=2,\\quad\\gamma=-3,\\quad k=3s-1' }] },
      { ask: { type: 'choice', q: '共有点が辺 DE 上にある（$0\\le k\\le1$）ような $s$ の範囲（ケ・コ）は？',
        opts: ['$0\\le s\\le\\frac13$', '$\\frac13\\le s\\le1$', '$0\\le s\\le\\frac23$', '$\\frac13\\le s\\le\\frac23$'], ok: 3,
        why: { 0: '$k=1-3s$ と符号を逆にしています。', 1: '$k\\ge0$ だけで、$k\\le1$ を使い忘れています。', 2: '$k\\le1$ だけで、$k\\ge0$ を使い忘れています。' },
        good: '$0\\le3s-1\\le1$ より $\\frac13\\le s\\le\\frac23$（$0\\le s\\le1$ も満たす）。$s=\\frac13$ で D、$s=\\frac23$ で E を通ります。',
        add: [{ t: 'ans', label: 'ケ・コ', tex: '\\frac13\\le s\\le\\frac23' }] } },
      { clear: true, say: '$s=\\frac12$（面積が最小のとき）は $k=\\frac12$ で、平面は DE の中点 Q を通ります。このときの切り口は、6本の辺の中点を通る六角形です。',
        add: [{ t: 'h', text: '(3)　つづき：s = 1/2 のときの切り口' },
          { t: 'p', size: 'sm', text: '同じ計算で、辺 GD・辺 EA とも\nそれぞれの中点で交わる' },
          { t: 'tbl', size: 'sm', rows: [['辺', '共有点（$s=\\frac12$）'], ['AB，BC，CG', 'M，P，N（中点）'], ['DE', 'Q（中点）'], ['GD，EA', '中点']] },
          { t: 'box', c: 'g', size: 'sm', label: '確かめ', text: '六角形の向かい合う辺は平行（例：MP と、GD の中点と Q を結ぶ辺）。\n平行な2つの面（底面と上面）との交わりだから。' },
          fig('g6', HEX)] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。座標がなくても、内積の表と1次独立だけで、長さ・面積・体積・切り口まで全部わかりました。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、もう一度ノートに自分で解いてみましょう。' }
    ]
  });
})();
