/* 数学Ⅲ 第2章 微分法 導関数の応用 ⑤：いろいろな関数のグラフ
   例・数値はすべて自作。導関数・極値・変曲点・漸近線・誤答・図の座標は python3（sympy）で検算ずみ。
   y=x+4/x：奇関数（原点対称）、y′=(x+2)(x−2)/x²、y″=8/x³、極大 (−2,−4)・極小 (2,4)、漸近線 x=0, y=x（変曲点なし）
   y=(x+1)e⁻ˣ：y′=−xe⁻ˣ、y″=(x−1)e⁻ˣ、極大 (0,1)、変曲点 (1, 2/e)、x→∞ で y→0（漸近線 y=0）、x→−∞ で y→−∞、x 切片 −1
   y=(x²−2x+3)/(x−1)=x−1+2/(x−1)：漸近線 x=1, y=x−1。極大 x=1−√2 で −2√2、極小 x=1+√2 で 2√2（点 (1,0) に関して対称）
   増減・凹凸の表は、曲がった矢印を図（SVG）でかいている（m3b-09 と同じ zTable）。 */
(function () {
  const POINTS = [
    'グラフは **定義域・対称性・増減と極値（$y\'$）・凹凸と変曲点（$y\'\'$）・漸近線・座標軸との交点** を調べてかく',
    '漸近線：$x\\to p$ で $y\\to\\pm\\infty$ なら **$x=p$**。$x\\to\\pm\\infty$ で $y-(ax+b)\\to0$ なら **$y=ax+b$**（斜めの漸近線）',
    '分数関数は **わり算** で「整式 ＋ 分数」の形にすると、斜めの漸近線が見える。$e^{-x}$ をふくむ関数は $x\\to\\infty$ で $0$ に近づくことが多い'
  ];
  const LINE = 'rgba(244,243,234,.55)';
  function curvedArrow(cx, cy, kind, c) {   // u＝下に凸、n＝上に凸、+＝増加、−＝減少
    const hw = 22, hh = 13, x0 = cx - hw, x1 = cx + hw, s = v => v * v, cup = kind[0] === 'u', inc = kind[1] === '+';
    let F;
    if (inc && cup) F = x => cy - hh + 2 * hh * s((x - x0) / (2 * hw));
    else if (inc) F = x => cy + hh - 2 * hh * s((x1 - x) / (2 * hw));
    else if (cup) F = x => cy - hh + 2 * hh * s((x1 - x) / (2 * hw));
    else F = x => cy + hh - 2 * hh * s((x - x0) / (2 * hw));
    const steepEnd = (inc && cup) || (!inc && !cup), d = steepEnd ? 1.5 : 9;
    return [{ k: 'fn', f: F, a: x0, b: x1, c: c || 'w' }, { k: 'vec', a: [x1 - d, F(x1 - d)], b: [x1, F(x1)], c: c || 'w' }];
  }
  function zTable(id, rows, o) {   // 増減・凹凸の表。最後の行の 'u+' 'n+' 'u-' 'n-' は曲がった矢印。\n で2行
    o = o || {};
    const w0 = o.w0 || 104, cw = o.cw || 84, rh = rows.map((r, i) => (i === rows.length - 1 ? (o.lastH || 78) : 48));
    const W = w0 + cw * (rows[0].length - 1), H = rh.reduce((a, b) => a + b, 0), items = [];
    const hl = (y) => items.push({ k: 'seg', a: [0, y], b: [W, y], c: LINE, wd: 2 });
    hl(H); hl(0);
    items.push({ k: 'seg', a: [0, 0], b: [0, H], c: LINE, wd: 2 }, { k: 'seg', a: [W, 0], b: [W, H], c: LINE, wd: 2 }, { k: 'seg', a: [w0, 0], b: [w0, H], c: LINE, wd: 2 });
    let top = H;
    rows.forEach((r, i) => {
      const cy = top - rh[i] / 2;
      if (i > 0) hl(top);
      r.forEach((cell, j) => {
        if (cell === '' || cell == null) return;
        const cx = j === 0 ? w0 / 2 : w0 + cw * (j - 0.5);
        if (/^[un][+-]$/.test(cell)) items.push(...curvedArrow(cx, cy, cell));
        else items.push({ k: 'label', at: [cx, cy], text: cell, size: 22, c: (i === 0 || j === 0) ? 'y' : 'w' });
      });
      top -= rh[i];
    });
    return { t: 'fig', id, view: [0, 0, W, H], w: W, h: H, items, col: o.col || 0 };
  }

  HB.lesson({
    id: 'm3b-10', field: '数学Ⅲ　微分法', title: 'いろいろな関数のグラフ', level: '導関数の応用', time: '目安 8分',
    problem: { label: '例題', lead: '次の関数のグラフの概形をかけ。',
      parts: ['(1)　$y=x+\\dfrac4x$', '(2)　$y=(x+1)e^{-x}$', '(3)　$y=\\dfrac{x^2-2x+3}{x-1}$（漸近線と極値も求めよ）'] },
    points: POINTS,
    cols: [0.6, 0.4],
    steps: [
      { part: 'めあて', say: 'これまでに、増減・極値・凹凸・変曲点の調べ方を学びました。この時間は、それらに **漸近線** を合わせて、数学Ⅲのいろいろな関数のグラフをかきます。',
        add: [{ t: 'box', c: 'y', label: 'めあて', text: '**漸近線** の見つけ方を説明できる\n増減・凹凸・漸近線を調べて、**グラフの概形** をかける' }] },

      // ---------- かき方 ----------
      { clear: true, cols: [0.58, 0.42], part: 'グラフのかき方', say: 'グラフをかくときに調べることは、この6つです。全部をいつも使うわけではありませんが、順に確かめるともれがありません。',
        add: [{ t: 'h', text: 'グラフのかき方' },
          { t: 'box', c: 'y', size: 'sm', label: '調べること', text: "① 定義域（分母 $\\neq0$、真数 $>0$、ルートの中 $\\ge0$）\n② 対称性（$f(-x)=f(x)$ なら $y$ 軸対称、$f(-x)=-f(x)$ なら原点対称）\n③ 増減と極値（$y'$）\n④ 凹凸と変曲点（$y''$）\n⑤ 漸近線\n⑥ 座標軸との交点" }] },
      { say: '⑤の **漸近線** は、グラフが限りなく近づく直線です。縦の漸近線は「分母が 0 になる所」、横や斜めの漸近線は「$x\\to\\pm\\infty$ のときの様子」で調べます。',
        add: [{ t: 'box', c: 'b', size: 'sm', col: 1, label: '漸近線', text: "縦：$\\displaystyle\\lim_{x\\to p}f(x)=\\pm\\infty$ → 直線 $x=p$\n横・斜め：$\\displaystyle\\lim_{x\\to\\pm\\infty}\\{f(x)-(ax+b)\\}=0$\n　→ 直線 $y=ax+b$\n（$a\\neq0$ なら **斜めの漸近線**）" }] },

      // ---------- 例1 y=x+4/x ----------
      { clear: true, part: '例1', say: '例1は $y=x+\\dfrac4x$。定義域は $x\\neq0$。$f(-x)$ を計算して、対称性を調べます。',
        add: [{ t: 'h', text: '例1　$y=x+\\dfrac4x$' },
          { t: 'm', size: 'sm', tex: 'x\\neq0,\\qquad f(-x)=-x-\\frac4x=-f(x)', note: '定義域と対称性' },
          { t: 'fig', id: 'g1', col: 1, view: [-6.5, -9, 6.5, 9], w: 560, h: 520, items: [
            { k: 'axes', tx: [-2, 2], ty: [-4, 4] }] }] },
      { ask: { type: 'choice', q: '$f(-x)=-f(x)$ となる関数のグラフの対称性は？',
        opts: ['$y$ 軸に関して対称', '原点に関して対称', '$x$ 軸に関して対称', '対称性はない'], ok: 1,
        why: { 0: '$y$ 軸対称は $f(-x)=f(x)$（偶関数）のときです。', 2: '関数のグラフが $x$ 軸対称になるのは $y=0$ だけです。', 3: '$f(-x)=-f(x)$（奇関数）なので、原点対称です。' },
        good: '奇関数なので **原点対称**。$x>0$ の部分をかけば、$x<0$ の部分は原点に関して対称にうつせばよいのです。' } },
      { say: "$y'$ と $y''$ を求めて、増減と凹凸の表をつくります。$x=0$ は定義域に入らないので、その列はあけておきます。",
        add: [{ t: 'm', size: 'sm', tex: "y'=1-\\frac{4}{x^2}=\\frac{(x+2)(x-2)}{x^2},\\qquad y''=\\frac{8}{x^3}" },
          zTable('zt1', [['x', '…', '−2', '…', '(0)', '…', '2', '…'], ['y′', '+', '0', '−', '', '−', '0', '+'], ['y″', '−', '−', '−', '', '+', '+', '+'], ['y', 'n+', '極大\n−4', 'n-', '', 'u-', '極小\n4', 'u+']])] },
      { ask: { type: 'choice', q: '$x\\to\\infty$ のとき、$y=x+\\dfrac4x$ のグラフが限りなく近づく直線は？',
        opts: ['$y=0$', '$x=0$', '$y=4$', '$y=x$'], ok: 3,
        why: { 0: '0 に近づくのは $\\dfrac4x$ の部分。$y$ 自体は大きくなっていきます。', 1: '$x=0$ は、$x\\to0$ のときに近づく縦の漸近線です。', 2: '$y$ は一定の値には近づきません。' },
        good: '$y-x=\\dfrac4x\\to0$ なので、直線 $y=x$ に限りなく近づきます。これが **斜めの漸近線** です。',
        add: [{ t: 'm', size: 'sm', tex: '\\lim_{x\\to\\pm\\infty}(y-x)=\\lim_{x\\to\\pm\\infty}\\frac4x=0', note: '漸近線 $y=x$' }] } },
      { say: '$x\\to+0$ で $y\\to\\infty$、$x\\to-0$ で $y\\to-\\infty$ なので、$y$ 軸（$x=0$）も漸近線です。$x=0$ で切れているので、変曲点はありません。',
        draw: [{ fig: 'g1', items: [
          { k: 'line', m: 1, n: 0, dash: true, c: 'b', label: 'y=x', lat: [4.6, 6.6], la: 'end' },
          { k: 'fn', f: 'x+4/x', a: -6.5, b: -0.2, c: 'w' }, { k: 'fn', f: 'x+4/x', a: 0.2, b: 6.5, c: 'w', label: 'y=x+4/x', lat: [1.0, 8.3] },
          { k: 'pt', at: [2, 4], name: '極小', dir: 'se', c: 'p', size: 21 }, { k: 'pt', at: [-2, -4], name: '極大', dir: 'nw', c: 'y', size: 21 }] }] },

      // ---------- 例2 y=(x+1)e^(−x) ----------
      { clear: true, part: '例2', say: '例2は $y=(x+1)e^{-x}$。定義域はすべての実数です。まず、積の微分法で $y\'$ を求めます。',
        add: [{ t: 'h', text: '例2　$y=(x+1)e^{-x}$' },
          { t: 'fig', id: 'g2', col: 1, view: [-1.9, -1.7, 5.6, 1.5], w: 560, h: 420, items: [
            { k: 'axes', tx: [-1, 1, 2, 3, 4], ty: [1] }] }] },
      { ask: { type: 'choice', q: '$y=(x+1)e^{-x}$ のとき、$y\'$ は？',
        opts: ['$-xe^{-x}$', '$e^{-x}$', '$(x+2)e^{-x}$', '$-(x+1)e^{-x}$'], ok: 0,
        why: { 1: '積の微分。$(x+1)\\cdot(e^{-x})\'$ の項も足します。', 2: '$(e^{-x})\'=-e^{-x}$。マイナスを忘れています。', 3: '$(x+1)\'\\cdot e^{-x}=e^{-x}$ の項が抜けています。' },
        good: "$y'=1\\cdot e^{-x}+(x+1)\\cdot(-e^{-x})=-xe^{-x}$。",
        add: [{ t: 'm', size: 'sm', tex: "y'=e^{-x}-(x+1)e^{-x}=-xe^{-x},\\qquad y''=(x-1)e^{-x}" }] } },
      { say: "$e^{-x}>0$ なので、$y'$ の符号は $-x$、$y''$ の符号は $x-1$ で決まります。$x=0$ で極大、$x=1$ で変曲点です。",
        add: [zTable('zt2', [['x', '…', '0', '…', '1', '…'], ['y′', '+', '0', '−', '−', '−'], ['y″', '−', '−', '−', '0', '+'], ['y', 'n+', '極大\n1', 'n-', '変曲点\n2/e', 'u-']])] },
      { ask: { type: 'choice', q: '$\\displaystyle\\lim_{x\\to\\infty}(x+1)e^{-x}$ の値は？',
        opts: ['$\\infty$', '$1$', '$0$', '存在しない'], ok: 2,
        why: { 0: '$x+1$ も大きくなりますが、分母の $e^x$ のほうがずっと速く大きくなります。', 1: '$e^{-x}\\to0$ なので、1 には近づきません。', 3: '$\\dfrac{x+1}{e^x}$ は $0$ に近づきます。' },
        good: '$(x+1)e^{-x}=\\dfrac{x+1}{e^x}\\to0$。$x\\to\\infty$ では $x$ 軸（$y=0$）が漸近線です。$x\\to-\\infty$ では $y\\to-\\infty$。',
        draw: [{ fig: 'g2', items: [
          { k: 'fn', f: '(x+1)*exp(-x)', a: -1.65, b: 5.6, label: 'y=(x+1)e⁻ˣ', lat: [2.6, 1.0] },
          { k: 'pt', at: [0, 1], name: '極大', dir: 'nw', c: 'y', size: 21 }, { k: 'pt', at: [1, 2 / Math.E], name: '変曲点', dir: 'ne', c: 'p', size: 21 },
          { k: 'pt', at: [-1, 0], c: 'b' }] }] } },

      // ---------- 例3 斜めの漸近線（わり算） ----------
      { clear: true, part: '例3　斜めの漸近線', say: '例3は $y=\\dfrac{x^2-2x+3}{x-1}$。分子を分母でわって「整式 ＋ 分数」の形にすると、斜めの漸近線が見えてきます。',
        add: [{ t: 'h', text: '例3　$y=\\dfrac{x^2-2x+3}{x-1}$' },
          { t: 'm', tex: 'x^2-2x+3=(x-1)^2+2', note: '$x-1$ でわると\n商 $x-1$、余り $2$' },
          { t: 'm', tex: 'y=x-1+\\frac{2}{x-1}' },
          { t: 'fig', id: 'g3', col: 1, view: [-4, -7.5, 6, 7.5], w: 540, h: 460, items: [
            { k: 'axes', tx: [1], ty: [] }] }] },
      { ask: { type: 'choice', q: '$y=x-1+\\dfrac{2}{x-1}$ のグラフの漸近線は？',
        opts: ['$x=1$ だけ', '$x=1$ と $y=x$', '$x=1$ と $y=x-1$', '$x=-1$ と $y=x+1$'], ok: 2,
        why: { 0: '$x\\to\\pm\\infty$ で $\\dfrac{2}{x-1}\\to0$ なので、斜めの漸近線もあります。', 1: '$y-x=-1+\\dfrac{2}{x-1}\\to-1$ で、0 になりません。', 3: '分母が 0 になるのは $x=1$。符号に注意。' },
        good: '$y-(x-1)=\\dfrac{2}{x-1}\\to0$ で斜めの漸近線 $y=x-1$。分母 $\\to0$ で $x=1$ も漸近線です。',
        draw: [{ fig: 'g3', items: [{ k: 'line', x: 1, dash: true, c: 'b' }, { k: 'line', m: 1, n: -1, dash: true, c: 'b', label: 'y=x−1', lat: [5.9, 2.5], la: 'end' }] }] } },
      { ask: { type: 'think', q: '$y=x-1+\\dfrac{2}{x-1}$ の極値を求めよう。',
        hint: "$y'=1-\\dfrac{2}{(x-1)^2}=0$ から $(x-1)^2=2$。",
        ans: '$x=1-\\sqrt2$ で極大値 $-2\\sqrt2$、$x=1+\\sqrt2$ で極小値 $2\\sqrt2$',
        after: '例1 と同じ形で、グラフは漸近線の交点 $(1,\\ 0)$ に関して対称です。極大値のほうが小さいのも例1 と同じです。',
        add: [{ t: 'm', size: 'sm', tex: "y'=\\frac{(x-1)^2-2}{(x-1)^2}=0\\ \\to\\ x=1\\pm\\sqrt2" },
          { t: 'ans', label: '答', size: 'sm', text: '$x=1-\\sqrt2$ で極大値 $-2\\sqrt2$\n$x=1+\\sqrt2$ で極小値 $2\\sqrt2$' }],
        draw: [{ fig: 'g3', items: [
          { k: 'fn', f: '(x**2-2*x+3)/(x-1)', a: -4, b: 0.8, c: 'w' }, { k: 'fn', f: '(x**2-2*x+3)/(x-1)', a: 1.2, b: 6, c: 'w' },
          { k: 'pt', at: [1 - Math.SQRT2, -2 * Math.SQRT2], name: '極大', dir: 's', c: 'y', size: 21 }, { k: 'pt', at: [1 + Math.SQRT2, 2 * Math.SQRT2], name: '極小', dir: 's', c: 'p', size: 21 }] }] } },

      // ---------- まとめ ----------
      { clear: true, cols: [1], part: 'まとめ', lab: 'まとめ', say: 'まとめです。次の時間は、グラフを使って、**最大・最小** や **方程式・不等式** の問題を解きます。',
        add: [{ t: 'h', text: 'この時間のポイント' }].concat(POINTS.map((s, i) => ({ t: 'box', c: ['y', 'p', 'b'][i], label: '①②③'[i], text: s }))) },
      { end: true, say: 'おつかれさまでした。例題（Q キー）を見ながら、ノートで自分でもう一度やってみましょう。' }
    ]
  });
})();
