/* 慶應型 数学（理工）：2026年度 慶應義塾大学 理工学部 第2問の類題（自作問題・元の問題ではない）
   問題：AB=b, AC=c, AP=p。|b|=2, |c|=3, |p|=√3, b·c=2, b·p=2, c·p=3。空欄＋(2) だけ記述。
   答え（python3 で検算ずみ。座標 A(0,0,0) B(2,0,0) C(1,2√2,0) P(1,1/√2,√6/2) でも確認）：
     (1) cos∠BAC=1/3、BC=3
     (2) AD=(1−s)b+sc、PD·BC=(1−s)(2−4)+s(9−2)−(3−2)=9s−3=0 → s=1/3（0≦s≦1 を満たす）→ BD:DC=1:2
     (3) PB²=|b−p|²=3、BD=1 → PD=√2（PC²−DC²=6−4=2 でも同じ）
     (4) 4x+2y=2, 2x+9y=3 → x=3/8, y=1/4。PH²=|p|²−(2x+3y)=3−3/2=3/2 → PH=√6/2
     (5) c·p=k：x=(9−k)/16, y=(k−1)/8、PH²=−(k−5)(k+3)/8=0 → k=−3, 5（k=5 のとき AP=b/4+c/2、k=−3 のとき AP=3b/4−c/2。どちらも |p|²=3） */
(function () {
  const r2 = Math.SQRT2, PH_ = 70 * Math.PI / 180, TH = 35 * Math.PI / 180;
  const pj = (x, y, z) => [x * Math.sin(PH_) - y * Math.cos(PH_), -Math.sin(TH) * (x * Math.cos(PH_) + y * Math.sin(PH_)) + z * Math.cos(TH)];   // 見取図（平面 α を斜め上から見た正射影）
  const A = pj(0, 0, 0), B = pj(2, 0, 0), C = pj(1, 2 * r2, 0), P = pj(1, 1 / r2, Math.sqrt(6) / 2), H = pj(1, 1 / r2, 0), D = pj(5 / 3, 2 * r2 / 3, 0);
  const P5 = pj(1, r2, 0), Pm = pj(1, -r2, 0);
  const VIEW = [-0.5, -2.0, 2.35, 0.8];
  const fig = (id, items, w, view) => { const v = view || VIEW, W = w || 460; return { t: 'fig', id, col: 1, view: v, w: W, h: Math.round(W * (v[3] - v[1]) / (v[2] - v[0])), items }; };
  const BASE = [
    { k: 'poly', pts: [A, B, C], close: true, c: 'w', wd: 2.5, fill: 'b', alpha: 0.12 },
    { k: 'label', at: [0.25, -1.0], text: 'α', c: 'b', size: 24 },
    { k: 'pt', at: A, name: 'A', dir: 'w', c: 'w', size: 24 }, { k: 'pt', at: B, name: 'B', dir: 'e', c: 'w', size: 24 }, { k: 'pt', at: C, name: 'C', dir: 's', c: 'w', size: 24 }];
  const TETRA = BASE.concat([
    { k: 'seg', a: P, b: A, c: 'y', wd: 2.5 }, { k: 'seg', a: P, b: B, c: 'w', wd: 2 }, { k: 'seg', a: P, b: C, c: 'w', wd: 2 },
    { k: 'pt', at: P, name: 'P', dir: 'n', c: 'y', size: 24 }]);
  const POINTS = [
    '長さと内積が全部わかっていれば、どの角・長さ・垂直条件も **内積の計算だけ** で出せる（$|\\vec x|^2$ は展開して内積で）',
    '線分上の点は $(1-s)\\vec b+s\\vec c$。記述では「$0\\le s\\le1$ を満たす」まで書き、比 $s:(1-s)$ で答える',
    '垂線の足 H は「$\\overrightarrow{\\mathrm{PH}}$ が平面の2本のベクトルに垂直」で連立方程式。$\\mathrm{PH}=0$ ⇔ P は平面上'
  ];

  HB.lesson({
    id: 'keio26-2', field: '慶應型　数学（理工）', title: '2026 慶應 理工 第2問の類題 ― 内積だけで決まる四面体と垂線の足', level: '2026年度 慶應義塾大学 理工学部 第2問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '空間内に 4 点 A，B，C，P があり、$\\vec b=\\overrightarrow{\\mathrm{AB}},\\ \\vec c=\\overrightarrow{\\mathrm{AC}},\\ \\vec p=\\overrightarrow{\\mathrm{AP}}$ とおくと\n　$|\\vec b|=2,\\ \\ |\\vec c|=3,\\ \\ |\\vec p|=\\sqrt3,\\ \\ \\vec b\\cdot\\vec c=2,\\ \\ \\vec b\\cdot\\vec p=2,\\ \\ \\vec c\\cdot\\vec p=3$\nである。3 点 A，B，C を通る平面を $\\alpha$ とする。次の空欄にあてはまる数を答えよ。また、(2) は答えだけでなく求める過程も書け。',
      parts: [
        '(1)　$\\cos\\angle\\mathrm{BAC}=\\boxed{\\text{ア}}$，BC $=\\boxed{\\text{イ}}$ である。',
        '(2)　辺 BC 上に点 D を、直線 PD と直線 BC が垂直になるようにとる。BD : DC を求めよ。（求める過程も書くこと）',
        '(3)　PD $=\\boxed{\\text{ウ}}$ である。',
        '(4)　P から平面 $\\alpha$ に垂線 PH を下ろす。$\\overrightarrow{\\mathrm{AH}}=x\\vec b+y\\vec c$ と表すと、$x=\\boxed{\\text{エ}},\\ y=\\boxed{\\text{オ}}$ であり、PH $=\\boxed{\\text{カ}}$ である。',
        '(5)　はじめの条件のうち $\\vec c\\cdot\\vec p=3$ だけを $\\vec c\\cdot\\vec p=k$（$k$ は実数）にかえる。このとき点 P が平面 $\\alpha$ 上にあるのは、$k=\\boxed{\\text{キ}},\\ \\boxed{\\text{ク}}$ のときである（ただし $\\boxed{\\text{キ}}<\\boxed{\\text{ク}}$）。'
      ],
      src: '※ 2026年度 慶應義塾大学 理工学部 一般選抜 第2問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.56, 0.44],
    steps: [
      { part: '問題', say: '空間ベクトルの問題です。図形は与えられず、長さと内積だけが与えられています。(2) だけは求める過程も書く記述式。まず問題文を読みましょう（Q キーでいつでも見られます）。',
        add: [{ t: 'prob', style: 'font-size:21px;line-height:1.55' }] },

      // ---------- 読みかえ・(1) ----------
      { clear: true, part: '(1)', say: '始点を A にそろえた3本のベクトルの、長さと内積が全部わかっています。だから、角も長さも垂直も **内積の計算だけ** で求まります。見取図をかいておきましょう。',
        add: [{ t: 'h', text: '与えられた量の整理' },
          { t: 'tbl', size: 'sm', rows: [['', '$\\vec b$', '$\\vec c$', '$\\vec p$'], ['$\\vec b$', '$4$', '$2$', '$2$'], ['$\\vec c$', '$2$', '$9$', '$3$'], ['$\\vec p$', '$2$', '$3$', '$3$']] },
          { t: 'p', size: 'sm', text: '表の数は、その2本の内積（対角線は大きさの2乗）' },
          fig('g1', TETRA)] },
      { ask: { type: 'choice', q: '$\\cos\\angle\\mathrm{BAC}$（空欄ア）は？',
        opts: ['$\\dfrac23$', '$\\dfrac13$', '$\\dfrac16$', '$\\dfrac12$'], ok: 1,
        why: { 0: '分母は $|\\vec b||\\vec c|=2\\cdot3=6$ です。$\\frac{2}{3}$ は $|\\vec c|$ だけで割っています。', 2: '内積は $2$ です。$\\frac16$ は分子を 1 にしています。', 3: '角が $60^\\circ$ になるとは限りません。$\\frac{2}{6}$ を約分すると $\\frac13$。' },
        good: '$\\cos\\angle\\mathrm{BAC}=\\dfrac{\\vec b\\cdot\\vec c}{|\\vec b||\\vec c|}=\\dfrac{2}{2\\cdot3}=\\dfrac13$。',
        add: [{ t: 'ans', label: 'ア', tex: '\\cos\\angle\\mathrm{BAC}=\\frac{2}{2\\cdot3}=\\frac13' }] } },
      { say: 'BC は $|\\vec c-\\vec b|$。2乗して展開すると $9-2\\cdot2+4=9$。BC $=3$ です。三角形 ABC は AC $=$ BC の二等辺三角形でした。',
        add: [{ t: 'm', tex: '|\\vec c-\\vec b|^2=|\\vec c|^2-2\\,\\vec b\\cdot\\vec c+|\\vec b|^2=9' }, { t: 'ans', label: 'イ', tex: '\\mathrm{BC}=3' }] },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) は記述です。D は辺 BC 上なので、$\\overrightarrow{\\mathrm{AD}}=(1-s)\\vec b+s\\vec c\\ (0\\le s\\le1)$ とおけます。このとき BD : DC $=s:(1-s)$。',
        add: [{ t: 'h', text: '(2)　PD ⊥ BC となる D（記述）' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{AD}}=(1-s)\\vec b+s\\vec c\\quad(0\\le s\\le1)' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PD}}=(1-s)\\vec b+s\\vec c-\\vec p,\\qquad\\overrightarrow{\\mathrm{BC}}=\\vec c-\\vec b' },
          fig('g2', TETRA.concat([{ k: 'seg', a: P, b: D, c: 'p', wd: 3 }, { k: 'pt', at: D, name: 'D', dir: 'se', c: 'p', size: 24 }]))] },
      { ask: { type: 'choice', q: '$\\overrightarrow{\\mathrm{PD}}\\cdot\\overrightarrow{\\mathrm{BC}}=0$ を $s$ の式にすると？',
        opts: ['$9s-2=0$', '$9s-1=0$', '$7s-3=0$', '$9s-3=0$'], ok: 3,
        why: { 0: '$-\\vec p\\cdot(\\vec c-\\vec b)=-(3-2)=-1$ の項を落としています。', 1: '$-\\vec p\\cdot(\\vec c-\\vec b)$ の符号が逆です。$-(3-2)=-1$。', 2: '$(1-s)(\\vec b\\cdot\\vec c-|\\vec b|^2)=-2+2s$ の $2s$ を落としています。' },
        good: '$(1-s)(2-4)+s(9-2)-(3-2)=9s-3$。項ごとに内積の表から数を拾うと速く確実です。',
        add: [{ t: 'm', size: 'sm', tex: '(1-s)(\\vec b\\cdot\\vec c-|\\vec b|^2)+s(|\\vec c|^2-\\vec b\\cdot\\vec c)-\\vec p\\cdot(\\vec c-\\vec b)=9s-3' }] } },
      { say: '$9s-3=0$ より $s=\\frac13$。これは $0\\le s\\le1$ を満たすので、D はたしかに辺 BC 上にあります。BD : DC $=\\frac13:\\frac23=1:2$。',
        add: [{ t: 'ans', label: '(2) 答', tex: 's=\\frac13\\ \\ \\text{より}\\ \\ \\mathrm{BD}:\\mathrm{DC}=1:2' }] },

      // ---------- (2) 答案 ----------
      { clear: true, cols: [1], part: '(2) 答案', say: '記述の答案はこう書きます。「おき方」「垂直の条件を内積で」「計算」「範囲の確認」「答え」の順。途中の内積の数値も書いておくと、採点者に伝わります。',
        add: [{ t: 'h', text: '(2)　答案の例' },
          { t: 'box', c: 'w', size: 'sm', label: '答案', text: 'D は辺 BC 上の点なので、$\\overrightarrow{\\mathrm{AD}}=(1-s)\\vec b+s\\vec c\\ (0\\le s\\le1)$ とおける。このとき BD : DC $=s:(1-s)$。\n$\\overrightarrow{\\mathrm{PD}}=(1-s)\\vec b+s\\vec c-\\vec p$，$\\overrightarrow{\\mathrm{BC}}=\\vec c-\\vec b$ であり、PD ⊥ BC より $\\overrightarrow{\\mathrm{PD}}\\cdot\\overrightarrow{\\mathrm{BC}}=0$。\n$(1-s)(\\vec b\\cdot\\vec c-|\\vec b|^2)+s(|\\vec c|^2-\\vec b\\cdot\\vec c)-(\\vec c\\cdot\\vec p-\\vec b\\cdot\\vec p)=0$\n$(1-s)(2-4)+s(9-2)-(3-2)=0$　より　$9s-3=0$，$s=\\dfrac13$\nこれは $0\\le s\\le1$ を満たす。よって　BD : DC $=1:2$' }] },
      { ask: { type: 'choice', q: 'この答案で、省くと減点されやすいのはどれ？',
        opts: ['$0\\le s\\le1$ の確認', '$\\vec b,\\ \\vec c$ の1次独立', '内積を $\\cos$ で書く', 'PD の長さ'], ok: 0,
        why: { 1: '係数を比べていないので、ここでは1次独立は使いません。', 2: '内積の値がそのまま使えます。$\\cos$ は不要です。', 3: 'それは (3) で聞かれていること。(2) には不要です。' },
        good: '「辺 BC 上に」とあるので、$0\\le s\\le1$ を確かめてはじめて、D が辺の上にあると言えます。' } },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) は空欄なので速さ優先。$\\overrightarrow{\\mathrm{PD}}$ を展開してもよいですが、**直角三角形 PBD で三平方** が速い。PB と BD がすぐわかります。',
        add: [{ t: 'h', text: '(3)　PD の長さ' },
          { t: 'm', tex: '\\mathrm{PB}^2=|\\vec b-\\vec p|^2=4-2\\cdot2+3=3' },
          { t: 'm', tex: '\\mathrm{BD}=\\frac13\\,\\mathrm{BC}=1' },
          fig('g3', TETRA.concat([{ k: 'seg', a: P, b: D, c: 'p', wd: 3 }, { k: 'pt', at: D, name: 'D', dir: 'se', c: 'p', size: 24 },
            { k: 'poly', pts: [P, B, D], close: true, c: 'p', wd: 2, fill: 'p', alpha: 0.2 }, { k: 'right', o: D, a: P, b: B, s: 14 }]))] },
      { ask: { type: 'choice', q: 'PD（空欄ウ）は？',
        opts: ['$2$', '$\\sqrt3$', '$\\sqrt2$', '$\\sqrt6$'], ok: 2,
        why: { 0: '$\\mathrm{PD}^2=3-1=2$ です。2乗のまま答えています。', 1: 'それは PB。斜辺です。PD は PB より短くなります。', 3: 'それは PC の長さ（$|\\vec c-\\vec p|^2=9-6+3=6$）。' },
        good: '$\\mathrm{PD}^2=\\mathrm{PB}^2-\\mathrm{BD}^2=3-1=2$。',
        add: [{ t: 'ans', label: 'ウ', tex: '\\mathrm{PD}=\\sqrt{3-1}=\\sqrt2' }] } },
      { ask: { type: 'think', q: '検算：直角三角形 PCD の側からも PD を求めて、同じになるか確かめよう。',
        hint: '$\\mathrm{PC}^2=|\\vec c-\\vec p|^2$、DC $=\\frac23\\,\\mathrm{BC}$。',
        ans: '$\\mathrm{PC}^2=9-2\\cdot3+3=6$、DC $=2$ なので $\\mathrm{PD}^2=6-4=2$。同じ $\\sqrt2$',
        after: '空欄は答えしか見られません。別の道で1回確かめる習慣が、取りこぼしを防ぎます。' } },

      // ---------- (4) ----------
      { clear: true, part: '(4)', say: 'H は平面 α 上なので $\\overrightarrow{\\mathrm{AH}}=x\\vec b+y\\vec c$。PH が α に垂直 ⇔ $\\overrightarrow{\\mathrm{PH}}$ が $\\vec b$ にも $\\vec c$ にも垂直、です。',
        add: [{ t: 'h', text: '(4)　垂線の足 H' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PH}}=x\\vec b+y\\vec c-\\vec p' },
          { t: 'm', tex: '\\overrightarrow{\\mathrm{PH}}\\cdot\\vec b=0,\\quad\\overrightarrow{\\mathrm{PH}}\\cdot\\vec c=0' },
          fig('g4', TETRA.concat([{ k: 'seg', a: P, b: H, c: 'g', wd: 3, dash: true }, { k: 'pt', at: H, name: 'H', dir: 'sw', c: 'g', size: 24 }]))] },
      { say: '内積の表から数を拾うと、連立方程式は $4x+2y=2,\\ 2x+9y=3$。解くと $x=\\frac38,\\ y=\\frac14$ です。',
        add: [{ t: 'm', tex: '\\begin{cases}4x+2y=2\\\\ 2x+9y=3\\end{cases}' },
          { t: 'ans', label: 'エ・オ', tex: 'x=\\frac38,\\quad y=\\frac14' }] },
      { ask: { type: 'choice', q: 'PH（空欄カ）は？　ヒント：$\\overrightarrow{\\mathrm{PH}}\\perp\\overrightarrow{\\mathrm{AH}}$ なので $\\mathrm{PH}^2=|\\vec p|^2-\\vec p\\cdot\\overrightarrow{\\mathrm{AH}}$',
        opts: ['$\\dfrac32$', '$\\sqrt2$', '$\\dfrac{\\sqrt6}{4}$', '$\\dfrac{\\sqrt6}{2}$'], ok: 3,
        why: { 0: 'それは $\\mathrm{PH}^2$ です。最後に $\\sqrt{\\phantom{a}}$ をとります。', 1: 'それは PD。平面への垂線 PH は、BC への垂線 PD より短いはずです。', 2: '$\\sqrt{\\frac32}=\\frac{\\sqrt3}{\\sqrt2}=\\frac{\\sqrt6}{2}$。分母の有理化で 2 を 4 にしています。' },
        good: '$\\vec p\\cdot\\overrightarrow{\\mathrm{AH}}=\\frac38\\cdot2+\\frac14\\cdot3=\\frac32$ なので $\\mathrm{PH}^2=3-\\frac32=\\frac32$。PH $\\le$ PD にもなっています。',
        add: [{ t: 'ans', label: 'カ', tex: '\\mathrm{PH}=\\sqrt{3-\\tfrac32}=\\frac{\\sqrt6}{2}' }] } },

      // ---------- (5) ----------
      { clear: true, part: '(5)', say: '(5) では $\\vec c\\cdot\\vec p=k$ にかえます。(4) と同じ連立方程式を $k$ のまま解き、PH を $k$ で表します。P が α 上 ⇔ $\\mathrm{PH}=0$ です。',
        add: [{ t: 'h', text: '(5)　P が平面 α 上にある k' },
          { t: 'm', tex: '\\begin{cases}4x+2y=2\\\\ 2x+9y=k\\end{cases}\\Longrightarrow\\ x=\\frac{9-k}{16},\\ \\ y=\\frac{k-1}{8}' },
          { t: 'm', size: 'sm', tex: '\\mathrm{PH}^2=|\\vec p|^2-(2x+ky)=3-\\frac{k^2-2k+9}{8}' }] },
      { ask: { type: 'choice', q: '$\\mathrm{PH}^2=0$ となる $k$（空欄キ・ク）は？',
        opts: ['$k=-5,\\ 3$', '$k=-3,\\ 5$', '$k=1,\\ 9$', '$k=-3$ だけ'], ok: 1,
        why: { 0: '$k^2-2k-15=(k-5)(k+3)$ です。因数分解の符号が逆。', 2: 'それは $x=0$ や $y=0$ になる $k$。PH とは関係ありません。', 3: '2次方程式なので、解は2つあります。$k=5$ も解です。' },
        good: '$\\mathrm{PH}^2=-\\dfrac{(k-5)(k+3)}{8}=0$ より $k=-3,\\ 5$。',
        add: [{ t: 'ans', label: 'キ・ク', tex: '\\mathrm{PH}^2=-\\frac{(k-5)(k+3)}{8}=0\\ \\Longrightarrow\\ k=-3,\\ 5' }] } },
      { say: '$\\mathrm{PH}^2\\ge0$ なので、そもそも $-3\\le k\\le5$ でないと点 P は存在しません。両はしの $k$ で P が平面に「たおれこむ」のです。',
        add: [{ t: 'm', tex: '\\mathrm{PH}^2\\ge0\\iff-3\\le k\\le5', note: '$k=3$ は (1)〜(4) の場合' },
          fig('g5', BASE.concat([{ k: 'pt', at: P5, name: 'k = 5', dir: 'e', c: 'p', size: 20 }, { k: 'pt', at: Pm, name: 'k = −3', dir: 'e', c: 'p', size: 20 },
            { k: 'seg', a: A, b: P5, c: 'p', wd: 2, dash: true }, { k: 'seg', a: A, b: Pm, c: 'p', wd: 2, dash: true }]), 460)] },
      { ask: { type: 'think', q: '$k=5$ のとき、$\\vec p$ を $\\vec b,\\ \\vec c$ で表し、本当に $|\\vec p|^2=3$ になるか確かめよう。',
        hint: '$x=\\frac{9-k}{16},\\ y=\\frac{k-1}{8}$ に $k=5$。PH $=0$ なので $\\vec p=x\\vec b+y\\vec c$。',
        ans: '$\\vec p=\\frac14\\vec b+\\frac12\\vec c$。$|\\vec p|^2=\\frac1{16}\\cdot4+2\\cdot\\frac18\\cdot2+\\frac14\\cdot9=\\frac14+\\frac12+\\frac94=3$　たしかに 3',
        after: '$\\vec b\\cdot\\vec p=1+1=2$、$\\vec c\\cdot\\vec p=\\frac12+\\frac92=5$ も条件どおり。こう確かめると安心です。' } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。どの小問も「内積の表から数を拾う」だけで進みました。記述の (2) は、範囲の確認まで書くのが大事です。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、(2) の答案を自分で書いてみましょう。' }
    ]
  });
})();
