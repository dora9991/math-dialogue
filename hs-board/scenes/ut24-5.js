/* 東大型 数学（理系）：2024年度 東京大学 前期 理系 第5問の類題（自作問題・元の問題ではない）
   問題：A(0,0,1)、B(2,2,1)、C(2,0,−1) の三角形 ABC を x 軸のまわりに 1 回転させてできる立体の体積
   答え（python3 で検算ずみ：各 x で線分上 2 万点の距離の最大・最小をとって数値積分 → 13.08997 = 25π/6）：
     x=s の切り口は U(s,s,1)–V(s,0,1−s)。点 (s, λs, 1−s+λs) の軸からの距離² f(λ)=2s²λ²+2s(1−s)λ+(1−s)²
     R² = f(1) = s²+1。軸 λ=(s−1)/(2s)：0≤s≤1 で r²=(1−s)²、1≤s≤2 で r²=(1−s)²/2
     断面積 π(R²−r²) = 2πs（0≤s≤1）、π(s+1)²/2（1≤s≤2）→ 体積 π(1 + 19/6) = 25π/6
     （AC は軸上の点 (1,0,0) を通るので、s=1 で内側の半径 0） */
(function () {
  const pj = (x, y, z) => [x + 0.45 * y, z + 0.32 * y];
  const A = pj(0, 0, 1), B = pj(2, 2, 1), C = pj(2, 0, -1), Mx = pj(1, 0, 0);
  const s0 = 1.5, U = pj(s0, s0, 1), V = pj(s0, 0, 1 - s0), R0 = Math.sqrt(s0 * s0 + 1), r0 = (s0 - 1) / Math.SQRT2;
  const ring = (rr, c) => ({ k: 'param', x: `${s0}+0.45*${rr}*cos(t)`, y: `${rr}*sin(t)+0.32*${rr}*cos(t)`, a: 0, b: 2 * Math.PI, c, dash: true });
  const space = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.6, -2.0, 3.9, 2.3], w: 470, h: 449, items: [
    { k: 'vec', a: pj(-0.5, 0, 0), b: pj(3.6, 0, 0), c: 'd', wd: 2 }, { k: 'vec', a: [0, 0], b: pj(0, 1.8, 0), c: 'd', wd: 2 }, { k: 'vec', a: [0, -0.3], b: pj(0, 0, 2.0), c: 'd', wd: 2 },
    { k: 'label', at: pj(3.6, 0, 0), text: 'x', dy: 18, c: 'd', size: 22 }, { k: 'label', at: pj(0, 1.8, 0), text: 'y', dx: 14, c: 'd', size: 22 }, { k: 'label', at: pj(0, 0, 2.0), text: 'z', dx: 14, c: 'd', size: 22 },
    { k: 'poly', pts: [A, B, C], close: true, c: 'w', fill: 'y', alpha: 0.18, wd: 2.5 },
    { k: 'pt', at: A, name: 'A', dir: 'nw', size: 23 }, { k: 'pt', at: B, name: 'B', dir: 'ne', size: 23 }, { k: 'pt', at: C, name: 'C', dir: 'se', size: 23 },
    { k: 'pt', at: Mx, c: 'g', r: 5, name: '(1, 0, 0)', dir: 'sw', dx: -12, size: 19 }].concat(extra || []) });
  const cutItems = [{ k: 'seg', a: U, b: V, c: 'p', wd: 4 }, { k: 'pt', at: U, name: 'U', dir: 'e', c: 'p', size: 22 }, { k: 'pt', at: V, name: 'V', dir: 'w', c: 'p', size: 22 },
    ring(R0, 'b'), ring(r0, 'b'), { k: 'label', at: [2.25, -1.75], text: 'x = s の平面', anchor: 'start', c: 'b', size: 19 }];
  // 軸の方向から見た図（yz 平面）
  const yz = (id, extra) => ({ t: 'fig', id, col: 1, view: [-0.95, -1.2, 2.2, 1.5], w: 460, h: 394, items: [
    { k: 'axes', tx: [[1, '1']], ty: [[1, '1']], xl: 'y', yl: 'z', o: false },
    { k: 'pt', at: [0, 0], c: 'w', r: 6, name: '軸', dir: 'sw', size: 19 }].concat(extra || []) });
  const caseA = [{ k: 'seg', a: [-0.6, -0.1], b: [0, 0.5], c: 'y', dash: true, wd: 2 }, { k: 'seg', a: [0, 0.5], b: [0.5, 1], c: 'y', wd: 4 },
    { k: 'seg', a: [0, 0], b: [-0.25, 0.25], c: 'd', dash: true, wd: 2 }, { k: 'pt', at: [-0.25, 0.25], c: 'd', r: 4 },
    { k: 'pt', at: [0.5, 1], c: 'y', r: 5 }, { k: 'pt', at: [0, 0.5], c: 'y', r: 6, name: 'V', dir: 'e', size: 21 },
    { k: 'label', at: [0.5, 1], text: 's = 1/2', dx: 10, dy: -18, anchor: 'start', c: 'y', size: 19 }];
  const caseB = [{ k: 'seg', a: [0, -0.5], b: [1.5, 1], c: 'b', wd: 4 }, { k: 'pt', at: [1.5, 1], c: 'b', r: 5 }, { k: 'pt', at: [0, -0.5], c: 'b', r: 5 },
    { k: 'seg', a: [0, 0], b: [0.25, -0.25], c: 'b', wd: 2.5 }, { k: 'right', o: [0.25, -0.25], a: [0, 0], b: [1.5, 1], c: 'b', s: 12 },
    { k: 'pt', at: [0.25, -0.25], c: 'b', r: 5, name: 'H', dir: 'se', size: 21 },
    { k: 'label', at: [1.5, 1], text: 's = 3/2', dx: 10, dy: 18, anchor: 'start', c: 'b', size: 19 }];
  // 断面積のグラフ S(s)/π
  const SG = { t: 'fig', id: 'sg', col: 1, view: [-0.25, -0.6, 2.45, 5.0], w: 420, h: 420, items: [
    { k: 'area', f: '2*x', a: 0, b: 1, c: 'y', alpha: 0.25 }, { k: 'area', f: '(x+1)**2/2', a: 1, b: 2, c: 'b', alpha: 0.25 },
    { k: 'axes', tx: [1, 2], ty: [[2, '2'], [4.5, '9/2']], xl: 's', yl: 'S/π' },
    { k: 'fn', f: '2*x', a: 0, b: 1, c: 'y' }, { k: 'fn', f: '(x+1)**2/2', a: 1, b: 2, c: 'b' },
    { k: 'label', at: [0.55, 2.0], text: '2s', c: 'y', size: 22 }, { k: 'label', at: [1.15, 3.9], text: '(s+1)²/2', c: 'b', size: 21 }] };

  const POINTS = [
    '回転体の体積は **「切ってから回す」**。平面 $x=s$ での三角形の切り口（線分）を回すと円環で、面積は $\\pi(R^2-r^2)$',
    '$R$・$r$ は、線分上の点の「軸からの距離」の最大・最小。線分上の点を $\\lambda$ で表すと、距離の2乗は $\\lambda$ の 2 次関数',
    '最小は **軸 $\\lambda=\\frac{s-1}{2s}$ が区間に入るかどうか** で場合分け。図では「垂線の足が線分の上にあるか、はみ出すか」'
  ];

  HB.lesson({
    id: 'ut24-5', field: '東大型　数学（理系）', title: '2024 東大 理系 第5問の類題 ― 空間の三角形を x 軸のまわりに回した立体の体積', level: '2024年度 東京大学 理系 第5問の類題（自作）', time: '目安 20〜25分',
    problem: {
      label: '類題',
      lead: '座標空間に 3 点 $\\mathrm{A}(0,\\,0,\\,1)$，$\\mathrm{B}(2,\\,2,\\,1)$，$\\mathrm{C}(2,\\,0,\\,-1)$ をとる。三角形 ABC（周と内部）を $x$ 軸のまわりに 1 回転させてできる立体の体積を求めよ。',
      src: '※ 2024年度 東京大学 前期 理系 第5問と同じ分野・ねらいの自作問題（元の問題ではありません）'
    },
    points: POINTS,
    cols: [0.52, 0.48],
    steps: [
      { part: '問題', say: '空間の図形を回転させた立体の体積です。小問の誘導はありません。立体の形を想像するのはむずかしいので、計算で攻める方針を立てます。まず問題文を読みましょう。',
        add: [{ t: 'prob' }] },

      // ---------- 読みかえ ----------
      { clear: true, part: '読みかえ', say: '三角形は $x$ 軸に平行ではない、ななめの面にあります。回してできる立体の形を、直接思いうかべるのは大変です。',
        add: [{ t: 'h', text: '問題の読みかえ' },
          { t: 'p', size: 'sm', text: 'A は $x=0$、B・C は $x=2$ の所にある\n→ 立体は $0\\le x\\le2$ の部分' }, space('s1')] },
      { ask: { type: 'choice', q: '立体を平面 $x=s$（$0<s<2$）で切った切り口は、ふつうどんな形？',
        opts: ['円（円板）', '長方形', '円環（ドーナツ形）', '三角形'], ok: 2,
        why: { 0: '円板になるのは、切り口の線分が軸を通るときだけ。ふつうは真ん中に穴があきます。', 1: '回転体の、軸に垂直な切り口は、いつも円がもとになります。', 3: '三角形の切り口（線分）を回したものです。' },
        good: '三角形の切り口は **線分**。線分を軸のまわりに回すと、円環（外の円から内の円を除いた形）になります。',
        draw: [{ fig: 's1', items: cutItems }] } },
      { say: '方針です。「回してから切る」も「切ってから回す」も同じ。切り口の線分を回すと円環で、外側の半径 $R$ と内側の半径 $r$ がわかれば、面積は $\\pi(R^2-r^2)$。',
        add: [{ t: 'box', c: 'b', size: 'sm', label: '方針', text: '① $x=s$ での三角形の切り口（線分 UV）を求める\n② 線分上の点の「軸からの距離」の最大 $R$・最小 $r$\n③ 体積 $=\\displaystyle\\int_0^2\\pi(R^2-r^2)\\,ds$' }] },

      // ---------- 切り口 ----------
      { clear: true, part: '切り口', say: '①です。辺 AB 上で $x$ 座標が $s$ の点 U と、辺 AC 上で $x$ 座標が $s$ の点 V を求めます。A は $x=0$、B・C は $x=2$ なので、どちらも $\\frac{s}{2}$ の割合の点です。',
        add: [{ t: 'h', text: '① x = s での切り口' },
          { t: 'm', size: 'sm', tex: '\\overrightarrow{\\mathrm{OU}}=\\overrightarrow{\\mathrm{OA}}+\\frac s2\\overrightarrow{\\mathrm{AB}},\\quad \\overrightarrow{\\mathrm{AB}}=(2,\\ 2,\\ 0)' },
          space('s2', cutItems)] },
      { ask: { type: 'choice', q: '辺 AB 上で $x$ 座標が $s$ の点 U は？',
        opts: ['$(s,\\ s,\\ 1)$', '$(s,\\ s,\\ 1-s)$', '$(s,\\ 2s,\\ 1)$', '$\\left(s,\\ \\frac s2,\\ 1\\right)$'], ok: 0,
        why: { 2: '$\\overrightarrow{\\mathrm{AB}}$ の $\\frac s2$ 倍なので、$y$ は $2\\cdot\\frac s2=s$ です。', 1: 'AB 上では $z$ はずっと 1（A も B も $z=1$）です。', 3: '$\\frac s2$ をかけるのは $\\overrightarrow{\\mathrm{AB}}=(2,\\,2,\\,0)$ の成分。$y$ は $s$ です。' },
        good: '$(0,\\,0,\\,1)+\\frac s2(2,\\,2,\\,0)=(s,\\,s,\\,1)$。同じように V は $(0,\\,0,\\,1)+\\frac s2(2,\\,0,\\,-2)=(s,\\,0,\\,1-s)$。',
        add: [{ t: 'm', tex: '\\mathrm{U}(s,\\ s,\\ 1),\\qquad \\mathrm{V}(s,\\ 0,\\ 1-s)' }] } },
      { say: '線分 UV 上の点を、V から U へ $\\lambda$（$0\\le\\lambda\\le1$）の割合で進んだ点として表します。軸（$x$ 軸）からの距離の2乗は $y^2+z^2$ です。',
        add: [{ t: 'm', size: 'sm', tex: '\\mathrm{P}_\\lambda=(s,\\ \\lambda s,\\ 1-s+\\lambda s)\\quad(0\\le\\lambda\\le1)' },
          { t: 'm', size: 'sm', tex: 'f(\\lambda)=(\\lambda s)^2+(1-s+\\lambda s)^2' },
          { t: 'm', size: 'sm', tex: '=2s^2\\lambda^2+2s(1-s)\\lambda+(1-s)^2', note: '← 軸からの距離²' }] },

      // ---------- R と r ----------
      { clear: true, part: '半径 R と r', say: '②です。$f(\\lambda)$ は下に凸の 2 次関数なので、最大は区間の端。$f(0)=(1-s)^2$ と $f(1)$ を比べます。',
        add: [{ t: 'h', text: '② 外側の半径 R・内側の半径 r' },
          { t: 'm', size: 'sm', tex: 'f(\\lambda)=2s^2\\lambda^2+2s(1-s)\\lambda+(1-s)^2' }] },
      { ask: { type: 'choice', q: '外側の半径の 2 乗 $R^2=f(1)$ は？（$f(1)\\ge f(0)$ も成り立つ）',
        opts: ['$(1-s)^2$', '$s^2+(1-s)^2$', '$1$', '$s^2+1$'], ok: 3,
        why: { 0: 'それは $f(0)$、つまり V の距離² です。', 1: 'U は $(y,\\,z)=(s,\\,1)$ です。$z$ は $1-s$ ではありません。', 2: '$y$ 成分 $s$ を忘れています。' },
        good: 'U$(s,\\,s,\\,1)$ の距離² で $s^2+1$。$s^2+1-(1-s)^2=2s\\ge0$ なので、こちらが最大です。',
        add: [{ t: 'm', tex: 'R^2=s^2+1' }] } },
      { say: '最小は、2 次関数の **軸の位置** で決まります。$f(\\lambda)$ の軸は $\\lambda=\\dfrac{s-1}{2s}$。これが区間 $0\\le\\lambda\\le1$ に入るかどうかで、場合分けが必要です。',
        add: [{ t: 'm', tex: '\\text{軸}\\quad \\lambda=-\\frac{2s(1-s)}{2\\cdot2s^2}=\\frac{s-1}{2s}' }] },
      { ask: { type: 'choice', q: '軸 $\\lambda=\\dfrac{s-1}{2s}$ が $0\\le\\lambda\\le1$ に入るのは？（$0<s\\le2$）',
        opts: ['$0<s\\le1$', 'すべての $s$', '$1\\le s\\le2$', '$s=1$ だけ'], ok: 2,
        why: { 0: '$0<s<1$ では $s-1<0$ なので、軸は負（区間の左の外）です。', 1: '$s<1$ では軸が負になり、区間からはみ出します。', 3: '$s>1$ でも、$\\frac{s-1}{2s}<\\frac12$ で区間の中です。' },
        good: '$s\\ge1$ なら $0\\le\\frac{s-1}{2s}<\\frac12$。$s<1$ なら軸は負で、最小は $\\lambda=0$（点 V）。',
        add: [{ t: 'tbl', col: 1, size: 'sm', rows: [['', '最小になる所', '$r^2$'], ['$0\\le s\\le1$', '$\\lambda=0$（V）', '$(1-s)^2$'], ['$1\\le s\\le2$', '軸（H）', '？']] }] } },
      { ask: { type: 'choice', q: '$1\\le s\\le2$ のとき、$r^2=f\\left(\\frac{s-1}{2s}\\right)$ は？',
        opts: ['$(s-1)^2$', '$\\dfrac{(s-1)^2}{2}$', '$\\dfrac{(s-1)^2}{4}$', '$0$'], ok: 1,
        why: { 0: 'それは $f(0)$。軸での値はもっと小さくなります。', 2: '平方完成で引く量は $\\frac{\\{2s(1-s)\\}^2}{4\\cdot2s^2}=\\frac{(1-s)^2}{2}$ です。', 3: '0 になるのは $s=1$（線分が軸を通る）ときだけです。' },
        good: '$f=(1-s)^2-\\dfrac{(1-s)^2}{2}=\\dfrac{(s-1)^2}{2}$。図では、軸から直線 UV への垂線の長さ $\\frac{|s-1|}{\\sqrt2}$ の2乗です。',
        add: [{ t: 'gap', col: 1, h: 20 }, { t: 'm', col: 1, tex: 'r^2=\\begin{cases}(1-s)^2 & (0\\le s\\le1)\\\\[4pt] \\dfrac{(s-1)^2}{2} & (1\\le s\\le2)\\end{cases}' }] } },
      { clear: true, part: '図で見る', say: '図で見ると、$s=\\frac12$（黄）では垂線の足が線分の外にはみ出し、いちばん近いのは端の V。$s=\\frac32$（青）では足 H が線分の上にあります。$s=1$ では線分が軸を通ります。',
        add: [{ t: 'h', text: '軸の方向から見た切り口（yz 平面）' },
          { t: 'p', size: 'sm', text: '[[y:s = 1/2]]：垂線の足が線分の外 → 最も近いのは端 V\n[[b:s = 3/2]]：垂線の足 H が線分の上 → $r=\\mathrm{OH}$' },
          yz('y1', caseA.concat(caseB)),
          { t: 'box', c: 'g', size: 'sm', label: '図の意味', text: '$s=1$ のとき U$(1,\\,1)$、V$(0,\\,0)$\n→ 線分が軸を通り、$r=0$\n（辺 AC が点 $(1,\\,0,\\,0)$ を通る）' }] },

      // ---------- 体積 ----------
      { clear: true, part: '体積', say: '③です。断面積 $S(s)=\\pi(R^2-r^2)$ を、2つの区間で計算します。',
        add: [{ t: 'h', text: '③ 体積' }, SG] },
      { ask: { type: 'think', q: '$R^2-r^2$ を、$0\\le s\\le1$ と $1\\le s\\le2$ のそれぞれで計算しよう。',
        hint: '$R^2=s^2+1$。$1\\le s\\le2$ のほうは、通分すると完全平方になる。',
        ans: '$0\\le s\\le1$：$s^2+1-(1-s)^2=2s$\n$1\\le s\\le2$：$s^2+1-\\dfrac{(s-1)^2}{2}=\\dfrac{(s+1)^2}{2}$',
        after: '$s=1$ でどちらも 2。断面積はつながっています（グラフも切れ目なし）。',
        add: [{ t: 'm', size: 'sm', tex: 'S(s)=\\begin{cases}2\\pi s & (0\\le s\\le1)\\\\[4pt] \\dfrac{\\pi(s+1)^2}{2} & (1\\le s\\le2)\\end{cases}' }] } },
      { say: '積分します。前半は $\\int_0^1 2s\\,ds=1$。後半は $\\frac16\\big[(s+1)^3\\big]_1^2=\\frac{27-8}{6}=\\frac{19}{6}$。',
        add: [{ t: 'm', size: 'sm', tex: 'V=\\pi\\int_0^1 2s\\,ds+\\frac{\\pi}{2}\\int_1^2(s+1)^2\\,ds=\\pi+\\frac{19}{6}\\pi' }] },
      { ask: { type: 'choice', q: '体積 $V$ は？',
        opts: ['$4\\pi$', '$\\dfrac{25}{6}\\pi$', '$\\dfrac{14}{3}\\pi$', '$\\dfrac{19}{6}\\pi$'], ok: 1,
        why: { 0: '$1\\le s\\le2$ でも $r$ を端 V の距離 $|1-s|$ にしています。垂線の足 H のほうが近いのです。', 2: '内側の穴（$r$）を引いていません。円板として計算しています。', 3: '前半 $0\\le s\\le1$ の分 $\\pi$ が抜けています。' },
        good: '$\\pi+\\frac{19}{6}\\pi=\\frac{25}{6}\\pi$。',
        add: [{ t: 'ans', label: '答', tex: 'V=\\frac{25}{6}\\pi' }] } },
      { say: 'まちがいの $4\\pi$ は、場合分けをしなかったときに出る値です。最小を「端の点」だけで考えると、$1\\le s\\le2$ で穴を大きく見積もってしまいます。',
        add: [{ t: 'box', c: 'y', size: 'sm', label: '採点のポイント', text: '・切り口の線分の端点（U・V）を正しく\n・最大は端、最小は軸の位置で場合分け（理由を書く）\n・断面積を区間ごとに書いて積分' }] },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。回転体は、形を想像するより「切り口の線分 → 距離の最大・最小 → 積分」の流れで、確実に計算できます。',
        add: [{ t: 'h', text: 'この問題のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。最後に、問題文だけを見て（Q キー）、答案を自分でノートに書いてみましょう。' }
    ]
  });
})();
