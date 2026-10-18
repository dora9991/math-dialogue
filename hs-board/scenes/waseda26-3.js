/* 早稲田型 数学（理工）：2026年度 早稲田大学 一般選抜 理工 第3問の類題（自作問題・元の問題ではない）
   問題：A(0,1,2), B(3,−2,2), P(t,0,0)。α＝平面 ABP、Q＝α と z 軸の交点。
   答え（python3・sympy で検算ずみ）：
     (1) OX=(1−s−u)OP+sOA+uOB=((1−s−u)t+3u, s−2u, 2s+2u)。y=0→s=2u、x=0→u=t/(3(t−1))（t=1 は解なし：α は x+y=1）
         → t≠1、Q(0, 0, 2t/(t−1))（法線 (6,6,3t−3) でも確認）
     (2) AB 上 (3λ, 1−3λ, 2)、PQ 上 ((1−μ)t, 0, 2μt/(t−1))。λ=1/3、R(1,0,2)、μ=1−1/t。0<μ<1 ⇔ t>1
     (3) μ=1/2 ⇔ t=2。P(2,0,0), Q(0,0,4)。AB=(3,−3,0), AP=(2,−1,−2)：|AB|²=18, |AP|²=9, AB·AP=9
         △ABP=½√(162−81)=9/2、四角形=2△ABP=9（½|AB×PQ|=½·18=9 でも一致。cosθ=−1/√10） */
(function () {
  // 見取図（x 軸は左下、y 軸は右、z 軸は上）
  const pj = (x, y, z) => [y - 0.42 * x, z - 0.36 * x];
  const A = pj(0, 1, 2), B = pj(3, -2, 2), P2 = pj(2, 0, 0), Q4 = pj(0, 0, 4), R = pj(1, 0, 2);
  const space = (id, extra) => ({ t: 'fig', id, col: 1, view: [-3.9, -1.75, 2.3, 4.85], w: 470, h: 500, items: [
    { k: 'vec', a: pj(-0.3, 0, 0), b: pj(3.9, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, -2.6, 0), b: pj(0, 2.0, 0), c: 'd', wd: 2 }, { k: 'vec', a: pj(0, 0, -0.4), b: pj(0, 0, 4.6), c: 'd', wd: 2 },
    { k: 'label', at: pj(3.9, 0, 0), text: 'x', dx: -14, dy: 6, c: 'd', size: 22 }, { k: 'label', at: pj(0, 2.0, 0), text: 'y', dy: 22, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 4.6), text: 'z', dx: 16, c: 'd', size: 22 },
    { k: 'label', at: [0, 0], text: 'O', dx: 14, dy: 18, c: 'd', size: 20 },
    { k: 'seg', a: A, b: pj(0, 1, 0), c: 'd', wd: 1.5, dash: true }, { k: 'seg', a: B, b: pj(3, -2, 0), c: 'd', wd: 1.5, dash: true },
    { k: 'dot', at: pj(0, 1, 0), c: 'd' }, { k: 'dot', at: pj(3, -2, 0), c: 'd' }].concat(extra || []) });
  const quad = [{ k: 'poly', pts: [A, P2, B, Q4], close: true, c: 'w', fill: 'y', alpha: 0.16, wd: 2.5 }];
  const ptsAB = [{ k: 'pt', at: A, name: 'A', dir: 'e', size: 23 }, { k: 'pt', at: B, name: 'B', dir: 'w', size: 23 }];
  const ptP = { k: 'pt', at: P2, name: 'P', dir: 'sw', c: 'y', size: 23 };
  const ptQ = { k: 'pt', at: Q4, name: 'Q', dir: 'e', c: 'p', size: 23 };
  const diag = [{ k: 'seg', a: A, b: B, c: 'b', wd: 2.5, dash: true }, { k: 'seg', a: P2, b: Q4, c: 'g', wd: 2.5, dash: true },
    { k: 'pt', at: R, name: 'R', dir: 'nw', c: 'w', size: 22 }];
  // xz 平面の図（y = 0 の平面）
  const xz = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.9, -2.5, 3.3, 4.7], w: 300, h: 514, items: [
    { k: 'axes', tx: [[1, '1']], ty: [], xl: 'x', yl: 'z' },
    { k: 'pt', at: [1, 2], name: 'R(1, 0, 2)', dir: 'e', c: 'w', size: 19 }].concat(extra || []) });
  const POINTS = [
    '平面 ABP 上の点は　$(1-s-u)\\overrightarrow{\\mathrm{OP}}+s\\overrightarrow{\\mathrm{OA}}+u\\overrightarrow{\\mathrm{OB}}$（係数の和が 1）。$z$ 軸上なら $x=y=0$ から $s,\\ u$ を決める',
    '「対角線が交わる」は、2本の線分上の点を $\\lambda,\\ \\mu$（$0<\\lambda,\\ \\mu<1$）で表して一致させる。成分を1つずつ比べる',
    '交点が一方の対角線の **中点** なら、2つの三角形は面積が等しい。$S=\\frac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$'
  ];

  HB.lesson({
    id: 'waseda26-3', field: '早稲田型　数学（理工）', title: '2026 早稲田 理工 第3問の類題 ― x 軸上を動く点が決める平面と、四角形の面積', level: '2026年度 早稲田大学 理工 第3問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 2 点 $\\mathrm{A}(0,\\,1,\\,2)$，$\\mathrm{B}(3,\\,-2,\\,2)$ と、$x$ 軸上の点 $\\mathrm{P}(t,\\,0,\\,0)$ をとる（$t$ は実数）。3 点 A，B，P の定める平面を $\\alpha$ とする。',
      parts: [
        '(1)　$\\alpha$ が $z$ 軸と交わるための $t$ の条件を求めよ。また、そのときの交点 Q の座標を $t$ を用いて表せ。',
        '(2)　(1) のとき、4 点 A，P，B，Q をこの順に結んでできる四角形 APBQ において、対角線 AB と PQ が交わるような $t$ の値の範囲を求めよ。',
        '(3)　(2) のとき、対角線 AB と PQ の交点を R とする。R が線分 PQ の中点となるような $t$ の値を求めよ。また、そのときの四角形 APBQ の面積を求めよ。'
      ],
      src: '※ 2026年度 早稲田大学 一般選抜 理工 第3問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: '問題', say: '空間ベクトルの典型テーマを3つつないだ問題です。どれも基本の道具で解けるので、完答をめざしましょう。まず問題文を読みます（Q キーでいつでも見られます）。',
        add: [{ t: 'prob' }] },

      // ---------- (1) ----------
      { clear: true, part: '(1)', say: '図は $t=2$ のようすです。A と B は $z=2$ の高さにあるので、直線 AB は $x$ 軸と交わりません。だから 3 点 A，B，P はいつも平面を1つ決めます。',
        add: [{ t: 'h', text: '(1)　平面 α と z 軸の交点' },
          { t: 'p', size: 'sm', text: '$\\vec a=\\overrightarrow{\\mathrm{OA}},\\ \\vec b=\\overrightarrow{\\mathrm{OB}},\\ \\vec p=\\overrightarrow{\\mathrm{OP}}$ とする' },
          space('s1', quad.concat(ptsAB, [ptP, ptQ]))] },
      { ask: { type: 'choice', q: '平面 $\\alpha$ 上の点 X について、$\\overrightarrow{\\mathrm{OX}}$ を表す式は？（$s,\\ u$ は実数）',
        opts: ['$(1-s-u)\\vec p+s\\vec a+u\\vec b$', '$s\\vec a+u\\vec b$', '$\\vec p+s\\vec a+u\\vec b$', '$(1-s)\\vec a+s\\vec b+u\\vec p$'], ok: 0,
        why: { 1: 'それは原点 O・A・B を通る平面です。P を通りません。', 2: '係数の和が 1 になっていません。正しくは $\\vec p+s\\overrightarrow{\\mathrm{PA}}+u\\overrightarrow{\\mathrm{PB}}$ です。', 3: '係数の和が $1+u$ で、1 になりません。' },
        good: '$\\vec p+s(\\vec a-\\vec p)+u(\\vec b-\\vec p)$ を整理した形。**係数の和が 1** が平面上の点の目じるしです。',
        add: [{ t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OX}}=(1-s-u)\\vec p+s\\vec a+u\\vec b' },
          { t: 'm', size: 'sm', tex: '=\\big((1-s-u)t+3u,\\ \\ s-2u,\\ \\ 2s+2u\\big)' }] } },
      { say: 'X が $z$ 軸上にある条件は、$x$ 成分と $y$ 成分が 0。まず $y$ 成分から $s=2u$。これを $x$ 成分に入れます。',
        add: [{ t: 'm', tex: 's-2u=0\\quad\\therefore\\ s=2u' },
          { t: 'm', tex: '(1-3u)t+3u=0' }] },
      { ask: { type: 'choice', q: '$(1-3u)t+3u=0$ を $u$ について解くと？',
        opts: ['$u=\\dfrac t3$', '$u=\\dfrac{t}{3(1-t)}$', '$u=\\dfrac{t}{3(t-1)}$', '$u=\\dfrac{1}{3(t-1)}$'], ok: 2,
        why: { 0: '$3u$ の項を忘れています。$t-3ut+3u=0$ です。', 1: '符号に注意。$3u(t-1)=t$ です。', 3: '分子は $t$ です。$3u(t-1)=t$ から。' },
        good: '$t-3ut+3u=0$ より $3u(t-1)=t$。**$t=1$ のときは $0=1$ となり、解がありません。**',
        add: [{ t: 'm', tex: '3u(t-1)=t', note: '$t=1$ なら $0=1$ で解なし' }] } },
      { say: '$t\\ne1$ のとき $u=\\dfrac{t}{3(t-1)}$。$z$ 成分は $2s+2u=6u=\\dfrac{2t}{t-1}$ です。',
        add: [{ t: 'ans', label: '(1) 答', text: '条件は $t\\ne1$\n$\\mathrm{Q}\\left(0,\\ 0,\\ \\dfrac{2t}{t-1}\\right)$' }] },
      { ask: { type: 'think', q: '$t=1$ のとき、3 点 A，B，P(1, 0, 0) はどれも $x+y=1$ をみたす。このとき $\\alpha$ が $z$ 軸と交わらない理由を説明しよう。',
        hint: '$x+y=1$ は $z$ がどんな値でもなりたつ。$z$ 軸上の点は $x=y=0$。',
        ans: '$\\alpha$ は平面 $x+y=1$（$z$ 軸に平行な平面）。$z$ 軸上の点は $x+y=0$ なので、$\\alpha$ 上にない',
        after: '計算で「解なし」が出たら、図形として何がおきているかを確かめると安心です。' } },

      // ---------- (2) ----------
      { clear: true, part: '(2)', say: '(2) です。対角線 AB 上の点と PQ 上の点を、それぞれ割合 $\\lambda,\\ \\mu$ で表して、一致する条件を調べます。',
        add: [{ t: 'h', text: '(2)　対角線 AB と PQ が交わる条件' },
          { t: 'm', size: 'sm', tex: '\\vec a+\\lambda\\overrightarrow{\\mathrm{AB}}=(3\\lambda,\\ 1-3\\lambda,\\ 2)' },
          { t: 'm', size: 'sm', tex: '\\vec p+\\mu\\overrightarrow{\\mathrm{PQ}}=\\left((1-\\mu)t,\\ 0,\\ \\frac{2\\mu t}{t-1}\\right)' },
          { t: 'p', size: 'sm', text: '交わる ⇔ $0<\\lambda<1,\\ 0<\\mu<1$ で一致' },
          space('s2', quad.concat(diag, ptsAB, [ptP, ptQ]))] },
      { ask: { type: 'choice', q: '$y$ 成分を比べると、$\\lambda$ はいくつ？',
        opts: ['$\\dfrac23$', '$\\dfrac13$', '$\\dfrac12$', '$3$'], ok: 1,
        why: { 0: '$1-3\\lambda=0$ から $\\lambda=\\frac13$ です。', 2: 'R は AB の中点ではありません。$1-3\\lambda=0$ を解きます。', 3: '$3\\lambda=1$ です。逆数にしています。' },
        good: '$1-3\\lambda=0$ より $\\lambda=\\frac13$。交わるなら、交点は **いつも R(1, 0, 2)**（AB を 1：2 に分ける点）です。',
        add: [{ t: 'm', tex: '\\lambda=\\frac13,\\quad \\mathrm{R}(1,\\ 0,\\ 2)' }] } },
      { say: '$x$ 成分から $(1-\\mu)t=1$、つまり $\\mu=1-\\dfrac1t$。このとき $z$ 成分も $\\mu\\cdot\\dfrac{2t}{t-1}=2$ となり、自動的に一致します。',
        add: [{ t: 'm', tex: '\\mu=1-\\frac1t=\\frac{t-1}{t}', note: '$z$：$\\frac{t-1}{t}\\cdot\\frac{2t}{t-1}=2$ ✓' }] },
      { ask: { type: 'choice', q: '$0<1-\\dfrac1t<1$ となる $t$ の範囲は？',
        opts: ['$t>0$', '$t<0$ または $t>1$', '$0<t<1$', '$t>1$'], ok: 3,
        why: { 0: '$0<t<1$ だと $\\frac1t>1$ で、$\\mu<0$ になります。', 1: '$t<0$ だと $\\frac1t<0$ で、$\\mu>1$（Q の先）になります。', 2: 'そのとき $\\mu<0$。R は P の手前の外側です。' },
        good: '$0<\\frac1t<1$ と同じなので $t>1$。$\\lambda=\\frac13$ はいつも $0<\\lambda<1$ をみたします。',
        add: [{ t: 'ans', label: '(2) 答', tex: 't>1' }] } },

      // ---------- (2) 図で見る ----------
      { clear: true, cols: [0.62, 0.38], part: '(2) 図で見る', say: 'P，Q，R はどれも $y=0$、つまり $xz$ 平面の上にあります。Q は、直線 PR が $z$ 軸と交わる点です。平面の図で見ると、結果がよくわかります。',
        add: [{ t: 'h', text: '(2)　xz 平面で見る' },
          { t: 'p', size: 'sm', text: '[[y:$t=2$]]：P$(2,\\ 0,\\ 0)$、Q$(0,\\ 0,\\ 4)$\n→ R は線分 PQ の上（交わる）\n[[b:$t=\\frac12$]]：P$(\\frac12,\\ 0,\\ 0)$、Q$(0,\\ 0,\\ -2)$\n→ R は線分 PQ の外（交わらない）' },
          { t: 'box', c: 'g', size: 'sm', label: '読みかえ', text: '「対角線が交わる」\n⇔「R が P と Q の間にある」\n⇔ P が R の真下（$x=1$）より右\n⇔ $t>1$' },
          xz('z1', [
            { k: 'seg', a: [2, 0], b: [0, 4], c: 'y', wd: 3.5 }, { k: 'pt', at: [2, 0], c: 'y', name: 'P', dir: 'n', size: 21 }, { k: 'pt', at: [0, 4], c: 'y', name: 'Q', dir: 'e', size: 21 },
            { k: 'line', p1: [0.5, 0], p2: [1, 2], c: 'b', dash: true, wd: 2 },
            { k: 'seg', a: [0.5, 0], b: [0, -2], c: 'b', wd: 3.5 }, { k: 'pt', at: [0.5, 0], c: 'b', name: 'P', dir: 'nw', size: 21 }, { k: 'pt', at: [0, -2], c: 'b', name: 'Q', dir: 'e', size: 21 },
            { k: 'line', x: 1, c: 'w', dash: true, wd: 1.5 }])] },

      // ---------- (3) ----------
      { clear: true, part: '(3)', say: '(3) です。R が線分 PQ の中点 ⇔ $\\mu=\\frac12$。$1-\\dfrac1t=\\dfrac12$ から $t=2$。このとき P(2, 0, 0)、Q(0, 0, 4) で、たしかに中点は R(1, 0, 2) です。',
        add: [{ t: 'h', text: '(3)　R が PQ の中点のとき' },
          { t: 'm', tex: '1-\\frac1t=\\frac12\\iff t=2', note: 'P(2, 0, 0)、Q(0, 0, 4)' },
          space('s3', quad.concat(diag, ptsAB, [ptP, ptQ]))] },
      { say: 'R が PQ の中点なので、P と Q から直線 AB までの距離は等しく、$\\triangle\\mathrm{ABP}=\\triangle\\mathrm{ABQ}$。四角形の面積は $\\triangle\\mathrm{ABP}$ の 2 倍です。',
        add: [{ t: 'm', tex: '\\square\\mathrm{APBQ}=\\triangle\\mathrm{ABP}+\\triangle\\mathrm{ABQ}=2\\triangle\\mathrm{ABP}' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(3,\\,-3,\\,0),\\quad \\overrightarrow{\\mathrm{AP}}=(2,\\,-1,\\,-2)' },
          { t: 'm', size: 'sm', tex: '|\\overrightarrow{\\mathrm{AB}}|^2=18,\\quad |\\overrightarrow{\\mathrm{AP}}|^2=9,\\quad \\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{AP}}=9' }] },
      { ask: { type: 'choice', q: '$\\triangle\\mathrm{ABP}=\\dfrac12\\sqrt{18\\cdot9-9^2}$。四角形 APBQ の面積は？',
        opts: ['$\\dfrac92$', '$9\\sqrt2$', '$9$', '$18$'], ok: 2,
        why: { 0: 'それは $\\triangle\\mathrm{ABP}$ だけ。四角形はその 2 倍です。', 1: '$\\sqrt{162}$ のまま計算しています。内積の 2 乗 81 を引きます。', 3: '$\\triangle\\mathrm{ABP}=\\frac92$ の 2 倍で 9。4 倍にしています。' },
        good: '$\\sqrt{162-81}=\\sqrt{81}=9$ より $\\triangle\\mathrm{ABP}=\\frac92$。四角形は $2\\times\\frac92=9$。',
        add: [{ t: 'ans', label: '(3) 答', text: '$t=2$　　四角形 APBQ の面積は $9$' }] } },

      // ---------- 別の見方 ----------
      { clear: true, part: '別の見方', say: '対角線を使う方法でも確かめます。四角形の面積は「対角線の長さの積 × なす角の sin ÷ 2」。$|\\overrightarrow{\\mathrm{AB}}|=3\\sqrt2$、$|\\overrightarrow{\\mathrm{PQ}}|=2\\sqrt5$ です。',
        add: [{ t: 'h', text: '別の見方：対角線となす角' },
          { t: 'm', tex: 'S=\\frac12\\,\\mathrm{AB}\\cdot\\mathrm{PQ}\\,\\sin\\theta' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{AB}}=(3,\\,-3,\\,0),\\quad \\overrightarrow{\\mathrm{PQ}}=(-2,\\,0,\\,4)' }] },
      { ask: { type: 'think', q: '$\\overrightarrow{\\mathrm{AB}}\\cdot\\overrightarrow{\\mathrm{PQ}}$ から $\\cos\\theta$ と $\\sin\\theta$ を求め、面積が 9 になることを確かめよう。',
        hint: '内積は $3\\cdot(-2)+(-3)\\cdot0+0\\cdot4$。$\\sin\\theta=\\sqrt{1-\\cos^2\\theta}$。',
        ans: '内積 $-6$、$\\cos\\theta=\\dfrac{-6}{3\\sqrt2\\cdot2\\sqrt5}=-\\dfrac1{\\sqrt{10}}$、$\\sin\\theta=\\dfrac3{\\sqrt{10}}$\n$S=\\dfrac12\\cdot3\\sqrt2\\cdot2\\sqrt5\\cdot\\dfrac3{\\sqrt{10}}=9$',
        after: 'この公式は、対角線が交わる（凸の）四角形ならいつも使えます。中点でなくても OK です。',
        add: [{ t: 'm', tex: 'S=\\frac12\\cdot3\\sqrt2\\cdot2\\sqrt5\\cdot\\frac{3}{\\sqrt{10}}=9' }] } },
      { say: '答案では、どの公式を使ったか、なぜ2倍になるのか（中点だから高さが等しい）を一言ずつ書きます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・(1) $t=1$ のとき解がないことを書く\n・(2) $0<\\lambda<1$ と $0<\\mu<1$ の両方を確認\n・(3) 「R が中点 → 高さが等しい → 2 倍」の理由を書く\n・面積の公式 $\\frac12\\sqrt{|\\vec a|^2|\\vec b|^2-(\\vec a\\cdot\\vec b)^2}$' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。平面上の点の表し方、線分の交わり、三角形の面積。どれも空間ベクトルの基本の道具でした。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
